import { Platform, type PressableAndroidRippleConfig } from 'react-native';

import { ripple } from '../../theme/tokens';

/** Bounded ripple for filled controls; pair with `androidClip`. */
export const rippleOnLight: PressableAndroidRippleConfig = {
  color: ripple.onLight,
};
export const rippleOnDark: PressableAndroidRippleConfig = {
  color: ripple.onDark,
};

/**
 * Android ripples are clipped by `overflow: 'hidden'`, which keeps them inside
 * rounded corners. iOS ignores ripples, and clipping there would hide the
 * card shadow, so this only applies on Android.
 */
export const androidClip = Platform.select({
  android: { overflow: 'hidden' as const },
  default: {},
});
