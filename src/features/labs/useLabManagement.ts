import { useCallback, useEffect, useState } from 'react';

import { isAssistantRole } from '../../domain/asprakScope';
import type { Lab, LabInput } from '../../domain/geoTypes';
import type { AsyncActionResult } from '../../domain/types';
import {
  createLab,
  deleteLab,
  subscribeLabs,
  updateLab,
} from '../../services/firestore/labService';
import { useAuth } from '../../state';

export type LabManagementViewModel = {
  labs: Lab[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  deletingId: string | null;
  canManage: boolean;
  getLabById: (labId: string) => Lab | undefined;
  /** Buat lab baru bila `labId` null, selain itu perbarui. */
  saveLab: (
    labId: string | null,
    input: LabInput,
  ) => Promise<AsyncActionResult>;
  removeLab: (labId: string) => Promise<AsyncActionResult>;
  retry: () => void;
};

export function useLabManagement(): LabManagementViewModel {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const canManage = isAssistantRole(user?.role);

  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeLabs(
      (next) => {
        setLabs(next);
        setError(null);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [uid, attempt]);

  const getLabById = useCallback(
    (labId: string) => labs.find((lab) => lab.id === labId),
    [labs],
  );

  const saveLab = useCallback(
    async (
      labId: string | null,
      input: LabInput,
    ): Promise<AsyncActionResult> => {
      if (!user || !canManage) {
        return {
          ok: false,
          reason: 'forbidden',
          message: 'Hanya asisten yang dapat mengelola lab.',
        };
      }
      setSaving(true);
      try {
        const result = labId
          ? await updateLab(labId, input)
          : await createLab(user.uid, input);
        return result.ok ? { ok: true } : result;
      } finally {
        setSaving(false);
      }
    },
    [user, canManage],
  );

  const removeLab = useCallback(
    async (labId: string): Promise<AsyncActionResult> => {
      if (!canManage) {
        return {
          ok: false,
          reason: 'forbidden',
          message: 'Hanya asisten yang dapat mengelola lab.',
        };
      }
      setDeletingId(labId);
      try {
        return await deleteLab(labId);
      } finally {
        setDeletingId(null);
      }
    },
    [canManage],
  );

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return {
    labs,
    loading,
    error,
    saving,
    deletingId,
    canManage,
    getLabById,
    saveLab,
    removeLab,
    retry,
  };
}
