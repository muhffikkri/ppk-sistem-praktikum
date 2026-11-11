import { useRef, useState } from 'react';
import type { StudentLeaveViewModel } from '../../domain/types';
import { classifyLeaveReason } from '../../services/ai/leaveClassifier';
import {
  leaveFailure,
  LeaveError,
  validateReason,
} from '../../services/firestore/leaveService';
import { useLeaveDependencies } from './LeaveProvider';
import { useLeaveRequests } from './useLeaveRequests';

export function useStudentLeaveViewModel(): StudentLeaveViewModel {
  const { user, service } = useLeaveDependencies();
  const { setError, ...state } = useLeaveRequests('student');
  const busy = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  return {
    ...state,
    submitting,
    getLeaveForSession: (id) =>
      state.leaveRequests.find(
        (item) => item.sessionId === id && item.status !== 'rejected',
      ) ?? state.leaveRequests.find((item) => item.sessionId === id),
    previewAiClassification: (reason) =>
      classifyLeaveReason(validateReason(reason)),
    async submitLeaveRequest({ session, reason }) {
      if (busy.current)
        return leaveFailure(
          new LeaveError(
            'duplicate_leave_request',
            'Pengajuan sedang dikirim.',
          ),
        );
      busy.current = true;
      setSubmitting(true);
      setError(null);
      try {
        return {
          ok: true,
          data: await service.submit(user, session.id, reason),
        };
      } catch (cause) {
        const result = leaveFailure(cause);
        setError(result.message);
        return result;
      } finally {
        busy.current = false;
        setSubmitting(false);
      }
    },
  };
}
