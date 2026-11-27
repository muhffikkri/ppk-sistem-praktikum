import { httpsCallable } from 'firebase/functions';

import type { AsyncActionResult } from '../../domain/types';
import { functions } from '../firebase';
import { callableFailureReason } from './callableFailure';

type AssignmentRequest =
  | { action: 'participant' | 'assistant'; identifier: string; labId: string }
  | { action: 'move'; identifier: string; labId: string; fromLabId: string };

type AssignmentResult = { uid: string; labId: string };

export async function changeLabAssignment(
  request: AssignmentRequest,
): Promise<AsyncActionResult<AssignmentResult>> {
  try {
    const assign = httpsCallable<AssignmentRequest, AssignmentResult>(
      functions,
      'changeLabAssignment',
    );
    const result = await assign(request);
    return { ok: true, data: result.data };
  } catch (error) {
    return {
      ok: false,
      reason: callableFailureReason(error) ?? 'assignment_failed',
      message: error instanceof Error ? error.message : 'Penempatan gagal.',
    };
  }
}
