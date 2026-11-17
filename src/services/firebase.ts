/// <reference types="node" />
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';

type AuthPersistenceFactory = (
  storage: typeof AsyncStorage,
) => firebaseAuth.Persistence;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

function createAuthInstance(app: FirebaseApp): firebaseAuth.Auth {
  if (Platform.OS === 'web') {
    return firebaseAuth.getAuth(app);
  }

  const getReactNativePersistence = (
    firebaseAuth as unknown as {
      getReactNativePersistence?: AuthPersistenceFactory;
    }
  ).getReactNativePersistence;

  if (!getReactNativePersistence) {
    return firebaseAuth.getAuth(app);
  }

  try {
    return firebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return firebaseAuth.getAuth(app);
  }
}

export const auth: firebaseAuth.Auth = createAuthInstance(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
