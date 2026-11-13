import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import type {
  ActionFailureReason,
  LeaveRequest,
  Session,
  UserProfile,
} from '../../domain/types';
import { classifyLeaveReason } from '../ai/leaveClassifier';

export class LeaveError extends Error {
  constructor(
    public reason: ActionFailureReason,
    message: string,
  ) {
    super(message);
  }
}
export function requireRole(
  user: UserProfile | null,
  role: UserProfile['role'],
): asserts user is UserProfile {
  if (!user)
    throw new LeaveError('unauthenticated', 'Silakan login terlebih dahulu.');
  if (user.role !== role)
    throw new LeaveError(
      'forbidden',
      'Akun ini tidak memiliki akses untuk tindakan tersebut.',
    );
}
export function validateReason(reason: string) {
  if (reason.trim().length < 5)
    throw new LeaveError('validation_error', 'Alasan izin minimal 5 karakter.');
  return reason.trim();
}
export function leaveFailure(error: unknown): {
  ok: false;
  reason: ActionFailureReason;
  message: string;
} {
  if (error instanceof LeaveError)
    return { ok: false, reason: error.reason, message: error.message };
  const code = (error as { code?: string } | null)?.code;
  if (code === 'permission-denied')
    return {
      ok: false,
      reason: 'forbidden',
      message: 'Akses ditolak. Periksa akun dan keanggotaan sesi Anda.',
    };
  return {
    ok: false,
    reason: 'network_error',
    message: 'Data izin gagal diproses. Periksa koneksi lalu coba lagi.',
  };
}

export function createLeaveService(db: Firestore) {
  const leaves = collection(db, 'leave_requests');
  return {
    subscribeStudentSessions(
      user: UserProfile,
      onData: (items: Session[]) => void,
      onError: (error: unknown) => void,
    ) {
      requireRole(user, 'student');
      return onSnapshot(
        query(
          collection(db, 'sessions'),
          where('participantIds', 'array-contains', user.uid),
          orderBy('startsAt', 'asc'),
        ),
        (snapshot) =>
          onData(
            snapshot.docs.map(
              (item) => ({ ...item.data(), id: item.id }) as Session,
            ),
          ),
        onError,
      );
    },
    subscribeStudent(
      user: UserProfile,
      onData: (items: LeaveRequest[]) => void,
      onError: (error: unknown) => void,
    ) {
      requireRole(user, 'student');
      return onSnapshot(
        query(
          leaves,
          where('studentId', '==', user.uid),
          orderBy('createdAt', 'desc'),
        ),
        (snapshot) =>
          onData(
            snapshot.docs.map(
              (item) => ({ ...item.data(), id: item.id }) as LeaveRequest,
            ),
          ),
        onError,
      );
    },
    subscribeAssistant(
      user: UserProfile,
      onData: (items: LeaveRequest[]) => void,
      onError: (error: unknown) => void,
    ) {
      requireRole(user, 'assistant');
      // Subscribe only to managed sessions; never download all students' requests.
      const subscriptions = new Map<string, () => void>();
      const items = new Map<string, LeaveRequest[]>();
      const emit = () =>
        onData(
          [...items.values()]
            .flat()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        );
      const stop = onSnapshot(
        query(
          collection(db, 'sessions'),
          where('assistantIds', 'array-contains', user.uid),
        ),
        (snapshot) => {
          const ids = new Set(snapshot.docs.map((item) => item.id));
          subscriptions.forEach((unsubscribe, id) => {
            if (!ids.has(id)) {
              unsubscribe();
              subscriptions.delete(id);
              items.delete(id);
            }
          });
          snapshot.docs.forEach((session) => {
            if (subscriptions.has(session.id)) return;
            subscriptions.set(
              session.id,
              onSnapshot(
                query(
                  leaves,
                  where('sessionId', '==', session.id),
                  orderBy('createdAt', 'desc'),
                ),
                (result) => {
                  items.set(
                    session.id,
                    result.docs.map(
                      (item) =>
                        ({ ...item.data(), id: item.id }) as LeaveRequest,
                    ),
                  );
                  if (items.size === subscriptions.size) emit();
                },
                onError,
              ),
            );
          });
          if (items.size === subscriptions.size) emit();
        },
        onError,
      );
      return () => {
        stop();
        subscriptions.forEach((unsubscribe) => unsubscribe());
      };
    },
    async getSession(sessionId: string): Promise<Session> {
      const snapshot = await getDoc(doc(db, 'sessions', sessionId));
      if (!snapshot.exists())
        throw new LeaveError('session_not_found', 'Sesi tidak ditemukan.');
      return { ...snapshot.data(), id: snapshot.id } as Session;
    },
    async submit(
      user: UserProfile | null,
      sessionId: string,
      input: string,
    ): Promise<LeaveRequest> {
      requireRole(user, 'student');
      const reason = validateReason(input);
      const session = await this.getSession(sessionId);
      if (!session.classId || !session.participantIds?.includes(user.uid))
        throw new LeaveError(
          'forbidden',
          'Anda tidak terdaftar pada sesi ini.',
        );
      const checkDuplicate = async () => {
        const existing = await getDocs(
          query(leaves, where('studentId', '==', user.uid)),
        );
        if (
          existing.docs.some(
            (item) =>
              item.data().sessionId === sessionId &&
              ['pending', 'approved'].includes(item.data().status),
          )
        )
          throw new LeaveError(
            'duplicate_leave_request',
            'Sudah ada izin menunggu atau diterima untuk sesi ini.',
          );
      };
      await checkDuplicate();
      const aiPrediction = await classifyLeaveReason(reason);
      await checkDuplicate();
      // Auto ID follows the shared contract. Cross-device uniqueness needs a server contract from Dev 2/PM.
      const ref = doc(leaves);
      const request: LeaveRequest = {
        id: ref.id,
        sessionId,
        classId: session.classId,
        courseName: session.courseName,
        groupName: session.groupName,
        sessionStartsAt: session.startsAt,
        studentId: user.uid,
        studentName: user.displayName,
        reason,
        aiPrediction,
        status: 'pending',
        decisionNote: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date().toISOString(),
      };
      await setDoc(ref, request);
      return request;
    },
    async review(
      user: UserProfile | null,
      id: string,
      status: 'approved' | 'rejected',
      decisionNote?: string,
    ) {
      requireRole(user, 'assistant');
      await runTransaction(db, async (transaction) => {
        const ref = doc(leaves, id);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists())
          throw new LeaveError('leave_not_found', 'Pengajuan tidak ditemukan.');
        const leave = snapshot.data() as LeaveRequest;
        const session = await transaction.get(
          doc(db, 'sessions', leave.sessionId),
        );
        if (
          !session.exists() ||
          !session.data().assistantIds?.includes(user.uid)
        )
          throw new LeaveError(
            'forbidden',
            'Anda bukan asisten pengelola sesi ini.',
          );
        if (leave.status !== 'pending')
          throw new LeaveError(
            'invalid_status',
            'Pengajuan ini sudah diperiksa.',
          );
        transaction.update(ref, {
          status,
          decisionNote: decisionNote?.trim() || null,
          reviewedBy: user.uid,
          reviewedAt: new Date().toISOString(),
        });
      });
    },
  };
}
export type LeaveService = ReturnType<typeof createLeaveService>;
