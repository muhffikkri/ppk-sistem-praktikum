import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type {
  ActionFailureReason,
  AsyncActionResult,
  AuthContextValue,
  AuthStatus,
  UserProfile,
  UserRole,
} from '../domain/types';
import { auth, db, isFirebaseConfigured } from '../services/firebase';

const AuthContext = createContext<AuthContextValue | null>(null);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapFirebaseAuthError(err: unknown): {
  reason: ActionFailureReason;
  message: string;
} {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return {
        reason: 'validation_error',
        message: 'Format email tidak valid.',
      };
    case 'auth/user-disabled':
      return {
        reason: 'forbidden',
        message: 'Akun ini telah dinonaktifkan.',
      };
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return {
        reason: 'unauthenticated',
        message: 'Email atau password salah.',
      };
    case 'auth/email-already-in-use':
      return {
        reason: 'validation_error',
        message: 'Email sudah terdaftar. Silakan masuk dengan akun tersebut.',
      };
    case 'auth/weak-password':
      return {
        reason: 'validation_error',
        message: 'Password terlalu lemah (minimal 6 karakter).',
      };
    case 'auth/too-many-requests':
      return {
        reason: 'forbidden',
        message: 'Terlalu banyak percobaan. Coba beberapa saat lagi.',
      };
    case 'auth/network-request-failed':
    case 'unavailable':
      return {
        reason: 'network_error',
        message: 'Koneksi internet bermasalah. Periksa jaringan Anda.',
      };
    case 'permission-denied':
      return {
        reason: 'forbidden',
        message: 'Akses ke data profil ditolak oleh aturan keamanan.',
      };
    default:
      return {
        reason: 'unknown_error',
        message: 'Terjadi kesalahan pada layanan autentikasi. Coba lagi.',
      };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const registeringRef = useRef(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setAuthStatus('unauthenticated');
        return;
      }

      setAuthStatus('loading');
      const userRef = doc(db, 'users', firebaseUser.uid);

      unsubscribeProfile = onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<UserProfile>;
            const role: UserRole =
              data.role === 'assistant' ? 'assistant' : 'student';
            setUser({
              uid: firebaseUser.uid,
              displayName:
                data.displayName ||
                firebaseUser.displayName ||
                firebaseUser.email ||
                'Pengguna',
              email: data.email || firebaseUser.email || '',
              role,
              createdAt:
                typeof data.createdAt === 'string'
                  ? data.createdAt
                  : new Date().toISOString(),
            });
            setError(null);
            setAuthStatus('authenticated');
            return;
          }

          // Saat proses registrasi sedang berjalan, tunggu setDoc selesai menulis users/{uid}.
          if (registeringRef.current) {
            return;
          }

          // Jika profil tidak ada di Firestore (mis. gagal penulisan sebelumnya), paksa unauthenticated.
          setUser(null);
          setError(
            'Profil akun tidak ditemukan di database. Silakan masuk ulang atau daftar kembali.',
          );
          setAuthStatus('unauthenticated');
        },
        (snapshotError) => {
          const mapped = mapFirebaseAuthError(snapshotError);
          setError(mapped.message);
          setUser(null);
          setAuthStatus('unauthenticated');
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AsyncActionResult> => {
      setError(null);

      if (!isFirebaseConfigured) {
        const message =
          'Konfigurasi Firebase belum diisi pada file .env. Hubungi PM/admin.';
        setError(message);
        return { ok: false, reason: 'unknown_error', message };
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        const message = 'Masukkan alamat email yang valid.';
        setError(message);
        return { ok: false, reason: 'validation_error', message };
      }
      if (!password) {
        const message = 'Password wajib diisi.';
        setError(message);
        return { ok: false, reason: 'validation_error', message };
      }

      try {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        return { ok: true };
      } catch (err) {
        const mapped = mapFirebaseAuthError(err);
        setError(mapped.message);
        return { ok: false, reason: mapped.reason, message: mapped.message };
      }
    },
    [],
  );

  const register = useCallback(
    async (input: {
      displayName: string;
      email: string;
      password: string;
      role: UserRole;
    }): Promise<AsyncActionResult> => {
      setError(null);

      if (!isFirebaseConfigured) {
        const message =
          'Konfigurasi Firebase belum diisi pada file .env. Hubungi PM/admin.';
        setError(message);
        return { ok: false, reason: 'unknown_error', message };
      }

      const trimmedName = input.displayName.trim();
      const normalizedEmail = input.email.trim().toLowerCase();

      if (trimmedName.length < 2) {
        const message = 'Nama lengkap minimal 2 karakter.';
        setError(message);
        return { ok: false, reason: 'validation_error', message };
      }
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        const message = 'Masukkan alamat email yang valid.';
        setError(message);
        return { ok: false, reason: 'validation_error', message };
      }
      if (input.password.length < 6) {
        const message = 'Password minimal 6 karakter.';
        setError(message);
        return { ok: false, reason: 'validation_error', message };
      }
      if (input.role !== 'student' && input.role !== 'assistant') {
        const message = 'Peran akun tidak valid.';
        setError(message);
        return { ok: false, reason: 'validation_error', message };
      }

      registeringRef.current = true;
      try {
        const credential = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          input.password,
        );

        await updateProfile(credential.user, { displayName: trimmedName });

        const profile: UserProfile = {
          uid: credential.user.uid,
          displayName: trimmedName,
          email: normalizedEmail,
          role: input.role,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', credential.user.uid), profile);
        setUser(profile);
        setAuthStatus('authenticated');
        return { ok: true };
      } catch (err) {
        const mapped = mapFirebaseAuthError(err);
        setError(mapped.message);
        return { ok: false, reason: mapped.reason, message: mapped.message };
      } finally {
        registeringRef.current = false;
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<AsyncActionResult> => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setAuthStatus('unauthenticated');
      return { ok: true };
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      setError(mapped.message);
      return { ok: false, reason: mapped.reason, message: mapped.message };
    }
  }, []);

  const updateDisplayName = useCallback(
    async (displayName: string): Promise<AsyncActionResult> => {
      setError(null);
      if (!user) {
        const message = 'Anda harus masuk terlebih dahulu.';
        setError(message);
        return { ok: false, reason: 'unauthenticated', message };
      }

      const trimmed = displayName.trim();
      if (trimmed.length < 2) {
        const message = 'Nama lengkap minimal 2 karakter.';
        setError(message);
        return { ok: false, reason: 'validation_error', message };
      }

      try {
        await updateDoc(doc(db, 'users', user.uid), { displayName: trimmed });
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: trimmed });
        }
        return { ok: true };
      } catch (err) {
        const mapped = mapFirebaseAuthError(err);
        setError(mapped.message);
        return { ok: false, reason: mapped.reason, message: mapped.message };
      }
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      authStatus,
      user,
      error,
      login,
      register,
      logout,
      updateDisplayName,
      clearError,
    }),
    [
      authStatus,
      user,
      error,
      login,
      register,
      logout,
      updateDisplayName,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

