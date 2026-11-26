import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../firebase';

/**
 * Role asisten hanya diberikan lewat undangan yang ditulis admin.
 * Dokumen undangan memakai email lowercase sebagai ID.
 */
export async function hasAssistantInvite(
  email?: string | null,
): Promise<boolean> {
  const normalized = (email ?? auth.currentUser?.email ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return false;

  const invite = await getDoc(doc(db, 'assistant_invites', normalized));
  return invite.exists();
}
