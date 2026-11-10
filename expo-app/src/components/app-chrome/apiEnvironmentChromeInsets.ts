/**
 * API 환경 띠가 레이아웃 플로우에서 top inset 을 소비할 때,
 * 하위 SafeAreaView 가 Dynamic Island 패딩을 한 번 더 더하지 않도록 child insets 를 결정한다.
 *
 * @author MindGarden
 * @since 2026-11-10
 */
import type { EdgeInsets } from 'react-native-safe-area-context';

/**
 * 배너 표시 여부에 따라 Stack/화면이 받을 safe-area insets 를 반환한다.
 *
 * @param showBanner `shouldShowApiEnvironmentBanner()` 결과
 * @param insets 루트 `SafeAreaProvider` 가 공급한 실제 insets
 * @returns 배너 ON → `top: 0` (배너가 top 소비). 배너 OFF → insets 그대로
 */
export function resolveApiEnvironmentChromeInsets(
  showBanner: boolean,
  insets: EdgeInsets,
): EdgeInsets {
  if (!showBanner) {
    return insets;
  }
  return { ...insets, top: 0 };
}
