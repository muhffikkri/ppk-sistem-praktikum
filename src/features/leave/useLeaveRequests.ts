import { useMemo } from 'react';
import type { UserRole } from '../../domain/types';
import {
  leaveFailure,
  requireRole,
} from '../../services/firestore/leaveService';
import { useLeaveDependencies, useLeaveRequestsState } from './LeaveProvider';

/**
 * Leave requests for the signed-in account, read from the subscription that
 * LeaveProvider shares across screens. A role mismatch surfaces as an error,
 * as before.
 */
export function useLeaveRequests(role: UserRole) {
  const { user } = useLeaveDependencies();
  const state = useLeaveRequestsState();

  const roleError = useMemo(() => {
    try {
      requireRole(user, role);
      return null;
    } catch (cause) {
      return leaveFailure(cause).message;
    }
  }, [user, role]);

  return useMemo(
    () =>
      roleError
        ? { ...state, leaveRequests: [], loading: false, error: roleError }
        : state,
    [roleError, state],
  );
}
