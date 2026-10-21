import { useState } from 'react';

import type { AttendanceRecord, Session, SessionActionFailure } from '../../domain/types';
import { useAssistantSessionsViewModel } from '../../state';
import { formatClock } from './formatters';

export type AssistantFeedback =
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

type LastAction =
  | { type: 'opened' }
  | { type: 'closed' }
  | { type: 'failed'; reason: SessionActionFailure };

export type AssistantSessionDetailViewModel = {
  session: Session | undefined;
  attendees: AttendanceRecord[];
  canOpen: boolean;
  canClose: boolean;
  statusHint: string;
  feedback: AssistantFeedback | null;
  openSession: () => void;
  closeSession: () => void;
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

function toFeedback(action: LastAction | null, session: Session | undefined): AssistantFeedback | null {
  if (!action) return null;

  if (action.type === 'opened') {
    const time = session?.openedAt ? ` pukul ${formatClock(session.openedAt)}` : '';
    return { kind: 'success', message: `Sesi dibuka${time}.` };
  }

  if (action.type === 'closed') {
    const time = session?.closedAt ? ` pukul ${formatClock(session.closedAt)}` : '';
    return { kind: 'success', message: `Sesi ditutup${time}.` };
  }

  return { kind: 'error', message: failureMessages[action.reason] };
}

/**
 * ViewModel layar detail sesi asisten.
 * Membungkus `useAssistantSessionsViewModel` (kontrak bersama) dan menambahkan
 * state presentasi: aksi yang tersedia, petunjuk status, serta feedback aksi.
 */
export function useAssistantSessionDetail(sessionId: string): AssistantSessionDetailViewModel {
  const viewModel = useAssistantSessionsViewModel();
  const [lastAction, setLastAction] = useState<LastAction | null>(null);

  const session = viewModel.getSessionById(sessionId);
  const attendees = viewModel.getAttendanceForSession(sessionId);

  const openSession = () => {
    const result = viewModel.openSession(sessionId);
    setLastAction(result.ok ? { type: 'opened' } : { type: 'failed', reason: result.reason });
  };

  const closeSession = () => {
    const result = viewModel.closeSession(sessionId);
    setLastAction(result.ok ? { type: 'closed' } : { type: 'failed', reason: result.reason });
  };

  return {
    session,
    attendees,
    canOpen: session?.status === 'scheduled',
    canClose: session?.status === 'open',
    statusHint: statusHintFor(session),
    feedback: toFeedback(lastAction, session),
    openSession,
    closeSession,
    dismissFeedback: () => setLastAction(null),
  };
}
