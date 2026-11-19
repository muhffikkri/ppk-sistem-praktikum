import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../firebase';

const storageKey = 'practicum.push.installation';
const registrationKey = (uid: string) => `${storageKey}.${uid}`;
let installation: Promise<string> | undefined;
let pending: Promise<unknown> = Promise.resolve();
let suspendedUid: string | undefined;

function installationId() {
  installation ??= (async () => {
    const saved = await AsyncStorage.getItem(storageKey);
    if (saved) return saved;
    const id = doc(collection(db, 'push_installations')).id;
    await AsyncStorage.setItem(storageKey, id);
    return id;
  })().catch((error: unknown) => {
    installation = undefined;
    throw error;
  });
  return installation;
}

function serialize(action: () => Promise<void>) {
  const result = pending.then(action);
  pending = result.catch(() => undefined);
  return result;
}

function tokenRef(uid: string, id: string) {
  return doc(db, 'users', uid, 'push_tokens', id);
}

async function withWriteDeadline(write: Promise<void>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      write,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Push token sync timed out')),
          8000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function resumePushRegistration(uid: string) {
  if (suspendedUid === uid) suspendedUid = undefined;
}

export function saveNotificationToken(uid: string, token: string) {
  return serialize(async () => {
    if (auth.currentUser?.uid !== uid || suspendedUid === uid) return;
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
    const id = await installationId();
    const key = registrationKey(uid);
    const wasRegistered = await AsyncStorage.getItem(key);
    if (auth.currentUser?.uid !== uid || suspendedUid === uid) return;
    await AsyncStorage.setItem(key, id);
    if (auth.currentUser?.uid !== uid || suspendedUid === uid) return;
    try {
      await withWriteDeadline(
        setDoc(tokenRef(uid, id), {
          token,
          platform: Platform.OS,
          updatedAt: serverTimestamp(),
        }),
      );
    } catch (error) {
      if (
        !wasRegistered &&
        error instanceof Error &&
        'code' in error &&
        error.code === 'permission-denied'
      ) {
        await AsyncStorage.removeItem(key);
      }
      throw error;
    }
  });
}

export function removeNotificationToken(uid: string) {
  return serialize(async () => {
    if (
      (Platform.OS !== 'android' && Platform.OS !== 'ios') ||
      auth.currentUser?.uid !== uid
    )
      return;
    const id = await AsyncStorage.getItem(registrationKey(uid));
    if (!id) return;
    await withWriteDeadline(deleteDoc(tokenRef(uid, id)));
    await AsyncStorage.removeItem(registrationKey(uid));
  });
}

export async function disablePushBeforeLogout(uid: string) {
  suspendedUid = uid;
  try {
    await removeNotificationToken(uid);
  } catch (error) {
    resumePushRegistration(uid);
    throw error;
  }
}
