/**
 * `AccessibilityInfo.isReduceMotionEnabled` 의 초기값 + 변경 리스너를 단일 hook 으로 통합.
 *
 * 로그인 / 테넌트 선택 / 향후 모션 헤비 화면에서 공통 사용. iOS Settings → Accessibility →
 * Motion → "Reduce Motion" 토글을 따라 즉시 false ↔ true 로 갱신된다.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §6 / §10.3.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        /* 일부 OS 에서 미지원 — 기본값 false 유지 */
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        setReduceMotion(enabled);
      },
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
