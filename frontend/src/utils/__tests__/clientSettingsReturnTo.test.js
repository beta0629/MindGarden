/**
 * clientSettingsReturnTo — 설정 인증 후 원래 화면 복귀 (내부 경로만)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import {
  buildSettingsPathWithReturnTo,
  readReturnToFromSearch,
  sanitizeClientReturnTo
} from '../clientSettingsReturnTo';

describe('clientSettingsReturnTo', () => {
  test('내담자 내부 경로만 허용', () => {
    expect(sanitizeClientReturnTo('/client/shop/checkout?mode=buyNow')).toBe('/client/shop/checkout?mode=buyNow');
    expect(sanitizeClientReturnTo('//evil.example')).toBe('');
    expect(sanitizeClientReturnTo('https://evil.example')).toBe('');
    expect(sanitizeClientReturnTo('/admin/x')).toBe('');
  });

  test('설정 경로에 returnTo 를 붙이고 다시 읽는다', () => {
    const path = buildSettingsPathWithReturnTo('/client/shop/checkout?mode=buyNow');
    expect(path.startsWith('/client/settings?returnTo=')).toBe(true);
    expect(readReturnToFromSearch(path.slice(path.indexOf('?')))).toBe('/client/shop/checkout?mode=buyNow');
    expect(buildSettingsPathWithReturnTo('//x')).toBe('/client/settings');
  });
});
