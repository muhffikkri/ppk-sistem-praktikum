import { useMemo, useState } from 'react';

import {
  buildSessionRosterRecap,
  type SessionRecapResult,
} from '../../domain/sessionRecapRules';
import type {
  AttendanceRecord,
  Session,
  SessionActionFailure,
} from '../../domain/types';
import { useAssistantSessionsViewModel } from '../../state';
import { useAssistantLeaveViewModel } from '../leave';
import { formatClock } from './formatters';

export type AssistantFeedback =
  { kind: 'success'; message: string } | { kind: 'error'; message: string };

type LastAction =
  | { type: 'opened' }
  | { type: 'closed' }
  | { type: 'failed'; reason: SessionActionFailure };

export type AssistantSessionDetailViewModel = {
  session: Session | undefined;
  attendees: AttendanceRecord[];
  recap: SessionRecapResult;
  canOpen: boolean;
  canClose: boolean;
  statusHint: string;
  feedback: AssistantFeedback | null;
  openSession: () => Promise<void>;
  closeSession: () => Promise<void>;
  dismissFeedback: () => void;
};

const failureMessages: Record<SessionActionFailure, string> = {
  session_not_found: 'Sesi tidak ditemukan pada data demo.',
  invalid_status: 'Aksi tidak sesuai dengan status sesi saat ini.',
  already_checked_in: 'Aksi tidak tersedia untuk sesi ini.',
};

function statusHintFor(session: Session | undefined): string {
  switch (session?.status) {
    case 'scheduled':
      return 'Sesi belum dibuka. Buka sesi agar praktikan dapat melakukan presensi.';
    case 'open':
      return 'Sesi sedang terbuka. Tutup sesi bila praktikum telah selesai.';
    case 'closed':
      return 'Sesi sudah ditutup dan tidak dapat dibuka kembali. Rekap tetap dapat dilihat.';
    default:
      return '';
  }
}

function toFeedback(
  action: LastAction | null,
  session: Session | undefined,
): AssistantFeedback | null {
  if (!action) return null;

  if (action.type === 'opened') {
    const time = session?.openedAt
      ? ` pukul ${formatClock(session.openedAt)}`
      : '';
    return { kind: 'success', message: `Sesi dibuka${time}.` };
  }

  if (action.type === 'closed') {
    const time = session?.closedAt
      ? ` pukul ${formatClock(session.closedAt)}`
      : '';
    return { kind: 'success', message: `Sesi ditutup${time}.` };
  }

  return { kind: 'error', message: failureMessages[action.reason] };
}

/**
 * Satu sumber rekap sesi untuk detail sesi maupun daftar kehadiran asisten:
 * filter izin per sesi dan pembangunan rekap dilakukan di sini saja.
 */
export function useSessionRosterRecap(sessionId: string) {
  const { getSessionById, getAttendanceForSession } =
    useAssistantSessionsViewModel();
  const { leaveRequests } = useAssistantLeaveViewModel();

  const session = getSessionById(sessionId);
  const attendees = getAttendanceForSession(sessionId);

  const recap = useMemo(
    () =>
      buildSessionRosterRecap({
        participantIds: session?.participantIds ?? [],
        attendees,
        leaves: leaveRequests.filter((l) => l.sessionId === sessionId),
      }),
    [session?.participantIds, attendees, leaveRequests, sessionId],
  );

  return { session, attendees, recap };
}

/**
 * ViewModel layar detail sesi asisten.
 * Membungkus `useAssistantSessionsViewModel` (kontrak bersama) dan menambahkan
 * state presentasi: aksi yang tersedia, petunjuk status, serta feedback aksi.
 */
export function useAssistantSessionDetail(
  sessionId: string,
): AssistantSessionDetailViewModel {
  const viewModel = useAssistantSessionsViewModel();
  const { session, attendees, recap } = useSessionRosterRecap(sessionId);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);

  const openSession = async () => {
    const result = await viewModel.openSession(sessionId);
    setLastAction(
      result.ok
        ? { type: 'opened' }
        : { type: 'failed', reason: 'invalid_status' },
    );
  };

  const closeSession = async () => {
    const result = await viewModel.closeSession(sessionId);
    setLastAction(
      result.ok
        ? { type: 'closed' }
        : { type: 'failed', reason: 'invalid_status' },
    );
  };

  return {
    session,
    attendees,
    recap,
    canOpen: session?.status === 'scheduled',
    canClose: session?.status === 'open',
    statusHint: statusHintFor(session),
    feedback: toFeedback(lastAction, session),
    openSession,
    closeSession,
    dismissFeedback: () => setLastAction(null),
  };
}
