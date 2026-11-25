import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';

// Covers platforms or flows where `transitionEnd` never fires (for example a
// screen that is the first route, with no push animation).
const FALLBACK_MS = 450;

/**
 * False until the screen's push transition has finished. Use it to defer
 * mounting heavy native views (map, camera) so they do not compete with the
 * transition for the first frames.
 */
export function useTransitionReady(): boolean {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setReady(true), FALLBACK_MS);
    const unsubscribe = navigation.addListener('transitionEnd', (event) => {
      if (!event.data.closing) setReady(true);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigation, ready]);

  return ready;
}
