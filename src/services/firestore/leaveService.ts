import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import { canSubmitLeave } from '../../domain/leaveRules';
import type {
  ActionFailureReason,
  LeaveRequest,
  Session,
  UserProfile,
} from '../../domain/types';
import { classifyLeaveReason } from '../../../ai/leaveClassifier';
import { chunkIds } from './batching';

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
    /**
     * Leave requests for the assistant's managed sessions only; never
     * download all students' requests. Session ids come from the caller
     * (AssistantSessionsContext already listens to them), and requests are
     * fetched with one listener per chunk of up to 30 sessions.
     */
    subscribeAssistant(
      user: UserProfile,
      sessionIds: readonly string[],
      onData: (items: LeaveRequest[]) => void,
      onError: (error: unknown) => void,
    ) {
      requireRole(user, 'assistant');
      const chunks = chunkIds(sessionIds);
      if (chunks.length === 0) {
        onData([]);
        return () => {};
      }
      const items = new Map<number, LeaveRequest[]>();
      const emit = () => {
        // Wait until every chunk has reported once.
        if (items.size !== chunks.length) return;
        onData(
          [...items.values()]
            .flat()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        );
      };
      const stops = chunks.map((chunk, index) =>
        onSnapshot(
          query(leaves, where('sessionId', 'in', chunk)),
          (result) => {
            items.set(
              index,
              result.docs.map(
                (item) => ({ ...item.data(), id: item.id }) as LeaveRequest,
              ),
            );
            emit();
          },
          onError,
        ),
      );
      return () => stops.forEach((stop) => stop());
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
      if (!canSubmitLeave(session)) {
        throw new LeaveError(
          'invalid_status',
          'Izin hanya bisa diajukan untuk sesi yang belum selesai.',
        );
      }
      if (!session.classId || !session.participantIds?.includes(user.uid))
        throw new LeaveError(
          'forbidden',
          'Anda tidak terdaftar pada sesi ini.',
        );
      // ID deterministik: satu izin per praktikan per sesi, diverifikasi rules.
      const ref = doc(leaves, `${sessionId}_${user.uid}`);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        const status = existing.data().status;
        if (status === 'pending' || status === 'approved')
          throw new LeaveError(
            'duplicate_leave_request',
            'Sudah ada izin menunggu atau diterima untuk sesi ini.',
          );
        if (status !== 'rejected')
          throw new LeaveError(
            'invalid_status',
            'Pengajuan izin tidak dapat dilanjutkan.',
          );
      }
      const aiPrediction = await classifyLeaveReason(reason);
      const request: LeaveRequest = {
        id: ref.id,
        sessionId,
        classId: session.classId,
        courseName: session.courseName,
        groupName: session.groupName,
        sessionStartsAt: session.startsAt,
        studentId: user.uid,
        studentName: user.displayName,
        ...(user.nim ? { studentNim: user.nim } : {}),
        reason,
        aiPrediction,
        status: 'pending',
        decisionNote: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date().toISOString(),
      };
      if (existing.exists()) {
        // Izin ditolak boleh diajukan ulang: update status, bukan dokumen baru.
        await updateDoc(ref, {
          reason,
          aiPrediction,
          status: 'pending',
          decisionNote: null,
          reviewedBy: null,
          reviewedAt: null,
          createdAt: request.createdAt,
          ...(user.nim ? { studentNim: user.nim } : {}),
        });
      } else {
        await setDoc(ref, request);
      }
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
