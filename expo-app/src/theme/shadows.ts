/**
 * MindGarden 그림자 토큰 (플랫폼별)
 * iOS: shadowColor/Offset/Opacity/Radius
 * Android: elevation
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Platform, type ViewStyle } from 'react-native';

type Shadow = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const SHADOW_COLOR = '#000';

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } satisfies Shadow,

  sm: Platform.select<Shadow>({
    ios: {
      shadowColor: SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
  })!,

  md: Platform.select<Shadow>({
    ios: {
      shadowColor: SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
  })!,

  lg: Platform.select<Shadow>({
    ios: {
      shadowColor: SHADOW_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: { elevation: 6 },
  })!,

  xl: Platform.select<Shadow>({
    ios: {
      shadowColor: SHADOW_COLOR,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: { elevation: 12 },
  })!,
} as const;
