/**
 * ApiEnvironmentChrome child insets 핸드오프 단위 테스트
 *
 * @author MindGarden
 * @since 2026-11-10
 */
import type { EdgeInsets } from 'react-native-safe-area-context';
import { resolveApiEnvironmentChromeInsets } from '@/components/app-chrome/apiEnvironmentChromeInsets';

const SAMPLE_INSETS: EdgeInsets = {
  top: 59,
  right: 0,
  bottom: 34,
  left: 0,
};

describe('resolveApiEnvironmentChromeInsets', () => {
  test('banner on → top 0, 나머지 insets 유지', () => {
    expect(resolveApiEnvironmentChromeInsets(true, SAMPLE_INSETS)).toEqual({
      top: 0,
      right: 0,
      bottom: 34,
      left: 0,
    });
  });

  test('banner off → insets 그대로(동일 참조)', () => {
    const result = resolveApiEnvironmentChromeInsets(false, SAMPLE_INSETS);
    expect(result).toBe(SAMPLE_INSETS);
    expect(result.top).toBe(59);
  });

  test('banner on with zero top → 여전히 top 0', () => {
    const flat: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
    expect(resolveApiEnvironmentChromeInsets(true, flat)).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });
});
