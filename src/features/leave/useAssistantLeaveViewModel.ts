import { useRef, useState } from 'react';
import type {
  AssistantLeaveViewModel,
  AsyncActionResult,
} from '../../domain/types';
import {
  leaveFailure,
  LeaveError,
} from '../../services/firestore/leaveService';
import { useLeaveDependencies } from './LeaveProvider';
import { useLeaveRequests } from './useLeaveRequests';

export function useAssistantLeaveViewModel(): AssistantLeaveViewModel {
  const { user, service } = useLeaveDependencies();
  const { setError, ...state } = useLeaveRequests('assistant');
  const busy = useRef(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  async function review(
    id: string,
    status: 'approved' | 'rejected',
    note?: string,
  ): Promise<AsyncActionResult> {
    if (busy.current)
      return leaveFailure(
        new LeaveError('invalid_status', 'Keputusan sedang disimpan.'),
      );
    busy.current = true;
    setReviewingId(id);
    setError(null);
    try {
      await service.review(user, id, status, note);
      return { ok: true };
    } catch (cause) {
      const result = leaveFailure(cause);
      setError(result.message);
      return result;
    } finally {
      busy.current = false;
      setReviewingId(null);
    }
  }
  return {
    ...state,
    reviewingId,
    approveLeave: (id, note) => review(id, 'approved', note),
    rejectLeave: (id, note) => review(id, 'rejected', note),
  };
}
