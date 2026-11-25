import type { GestureResponderEvent } from 'react-native';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/** Pressable whose style can carry Reanimated animated styles. */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Strong ease-out: feedback lands immediately, then settles.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const PRESS_IN = { duration: 100, easing: EASE_OUT };
const PRESS_OUT = { duration: 150, easing: EASE_OUT };
// 3% is the ceiling for something touched this often.
const PRESSED_SCALE = 0.97;

type Handler = ((event: GestureResponderEvent) => void) | null | undefined;

/**
 * Press feedback driven by a shared value. The handlers only set the value,
 * so the press never re-renders the component, and the animation itself runs
 * on the UI thread. `progress` (0 → 1) can drive extra animated styles, such
 * as a pressed background color.
 */
export function usePressFeedback({
  onPressIn,
  onPressOut,
  scale = true,
}: {
  onPressIn?: Handler;
  onPressOut?: Handler;
  /** Set false for controls that only change color when pressed. */
  scale?: boolean;
} = {}) {
  const progress = useSharedValue(0);
  // Reduced motion keeps the color change but drops the scale.
  const reducedMotion = useReducedMotion();
  const animateScale = scale && !reducedMotion;

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: animateScale
          ? interpolate(progress.get(), [0, 1], [1, PRESSED_SCALE])
          : 1,
      },
    ],
  }));

  return {
    progress,
    scaleStyle,
    handlers: {
      onPressIn: (event: GestureResponderEvent) => {
        progress.set(withTiming(1, PRESS_IN));
        onPressIn?.(event);
      },
      onPressOut: (event: GestureResponderEvent) => {
        progress.set(withTiming(0, PRESS_OUT));
        onPressOut?.(event);
      },
    },
  };
}
