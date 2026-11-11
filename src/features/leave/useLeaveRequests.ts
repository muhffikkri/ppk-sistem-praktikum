import { useEffect, useState } from 'react';
import type { LeaveRequest, UserRole } from '../../domain/types';
import {
  leaveFailure,
  requireRole,
} from '../../services/firestore/leaveService';
import { useLeaveDependencies } from './LeaveProvider';

export function useLeaveRequests(role: UserRole) {
  const { user, service } = useLeaveDependencies();
  const [leaveRequests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const fail = (cause: unknown) => {
      if (active) {
        setError(leaveFailure(cause).message);
        setLoading(false);
      }
    };
    let stop: (() => void) | undefined;
    try {
      requireRole(user, role);
      const subscribe =
        role === 'student'
          ? service.subscribeStudent
          : service.subscribeAssistant;
      stop = subscribe(
        user,
        (items) => {
          if (active) {
            setRequests(items);
            setLoading(false);
            setError(null);
          }
        },
        fail,
      );
    } catch (cause) {
      fail(cause);
    }
    return () => {
      active = false;
      stop?.();
    };
  }, [role, service, user, revision]);
  return {
    leaveRequests,
    loading,
    error,
    setError,
    retry: () => {
      setLoading(true);
      setError(null);
      setRevision((value) => value + 1);
    },
  };
}
