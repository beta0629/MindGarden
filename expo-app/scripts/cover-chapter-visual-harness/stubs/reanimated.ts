/**
 * 하네스 전용 `react-native-reanimated` 대체 — `SkeletonLoader`(로딩 상태 전용)가 import 만 해석되면 된다.
 * 하네스 픽스처는 로딩 상태를 그리지 않는다. 정적 값으로 같은 API 모양만 제공한다.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import { Easing, View } from 'react-native';

export { Easing };

export function useSharedValue<T>(initial: T): { value: T } {
  return { value: initial };
}

export function useAnimatedStyle<T>(factory: () => T): T {
  return factory();
}

export function withTiming<T>(toValue: T): T {
  return toValue;
}

export function withRepeat<T>(animation: T): T {
  return animation;
}

const Animated = { View };

export default Animated;
