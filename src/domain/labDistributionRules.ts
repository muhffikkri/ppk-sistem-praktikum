import { canManageLabMaster, isAssistantRole } from './asprakScope';
import type { PracticalClass, Session, UserRole } from './types';

export type LabDistributionGuardResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'unauthenticated' | 'forbidden' | 'invalid_input' | 'same_lab';
      message: string;
    };

export function canDistributeLab(
  role: UserRole | string | null | undefined,
): boolean {
  return canManageLabMaster(role);
}

export function validateLabAssignmentInput(params: {
  actorUid?: string | null;
  actorRole?: UserRole | string | null;
  email?: string;
  targetLabId?: string;
}): LabDistributionGuardResult {
  if (!params.actorUid?.trim()) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Silakan login ulang.',
    };
  }
  if (!canDistributeLab(params.actorRole)) {
    return {
      ok: false,
      reason: 'forbidden',
      message:
        'Akses ditolak. Hanya Aslab (lab_assistant) yang dapat mengelola distribusi lab.',
    };
  }
  const normalizedEmail = (params.email ?? '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return {
      ok: false,
      reason: 'invalid_input',
      message: 'Email tidak valid.',
    };
  }
  if (!params.targetLabId?.trim()) {
    return {
      ok: false,
      reason: 'invalid_input',
      message: 'Laboratorium tujuan wajib dipilih.',
    };
  }
  return { ok: true };
}

export function validateMoveParticipantInput(params: {
  actorUid?: string | null;
  actorRole?: UserRole | string | null;
  participantUid?: string;
  fromLabId?: string;
  toLabId?: string;
}): LabDistributionGuardResult {
  if (!params.actorUid?.trim()) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Silakan login ulang.',
    };
  }
  if (!canDistributeLab(params.actorRole)) {
    return {
      ok: false,
      reason: 'forbidden',
      message:
        'Akses ditolak. Hanya Aslab (lab_assistant) yang dapat memindahkan peserta antar lab.',
    };
  }
  if (
    !params.participantUid?.trim() ||
    !params.fromLabId?.trim() ||
    !params.toLabId?.trim()
  ) {
    return {
      ok: false,
      reason: 'invalid_input',
      message: 'Data peserta, lab asal, dan lab tujuan wajib lengkap.',
    };
  }
  if (params.fromLabId.trim() === params.toLabId.trim()) {
    return {
      ok: false,
      reason: 'same_lab',
      message: 'Peserta sudah berada di laboratorium tujuan.',
    };
  }
  return { ok: true };
}

/**
 * Menentukan apakah sesi dapat dikelola asisten berdasarkan penugasan langsung
 * (`assistantIds`), penugasan lab (`assignedLabIds`), atau kelas terkait.
 */
export function isSessionAssignedToAssistant(params: {
  session: Session;
  assistantUid: string;
  role?: UserRole | string | null;
  assignedLabIds?: string[];
  classes?: PracticalClass[];
}): boolean {
  const uid = params.assistantUid.trim();
  if (!uid || !isAssistantRole(params.role)) return false;

  if (
    Array.isArray(params.session.assistantIds) &&
    params.session.assistantIds.includes(uid)
  ) {
    return true;
  }

  const labIds = new Set(
    (params.assignedLabIds ?? []).map((id) => id.trim()).filter(Boolean),
  );
  if (params.session.labId && labIds.has(params.session.labId.trim())) {
    return true;
  }

  const assignedClassIds = new Set(
    (params.classes ?? [])
      .filter((cls) => {
        const byAssistant =
          Array.isArray(cls.assistantIds) && cls.assistantIds.includes(uid);
        const byLab = Boolean(cls.labId && labIds.has(cls.labId.trim()));
        return byAssistant || byLab;
      })
      .map((cls) => cls.id),
  );

  if (params.session.classId && assignedClassIds.has(params.session.classId)) {
    return true;
  }

  return false;
}
