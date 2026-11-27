/**
 * SCT 운영 UI 카피 — 개발/테스트 전용 문구 금지
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import { SCT_UI } from '../sctOnline';

/**
 * Flatten string values from nested SCT copy exports for banned-phrase scans.
 * @param {unknown} value
 * @returns {string[]}
 */
function collectCopyStrings(value) {
  if (typeof value === 'string') {
    return [value];
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.values(value).flatMap(collectCopyStrings);
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectCopyStrings);
  }
  return [];
}

describe('sctOnline SCT_UI — no developer/test-only copy', () => {
  test('PUBLIC_LINK_HINT is operator-facing and bans .dev / 테스트하세요', () => {
    expect(SCT_UI.PUBLIC_LINK_HINT).not.toMatch(/\.dev/i);
    expect(SCT_UI.PUBLIC_LINK_HINT).not.toMatch(/테스트하세요/);
    expect(SCT_UI.PUBLIC_LINK_HINT).toMatch(/내담자/);
  });

  test('SCT_UI user-facing strings ban .dev and 테스트하세요', () => {
    const blob = collectCopyStrings(SCT_UI).join(' ');
    expect(blob).not.toMatch(/\.dev/i);
    expect(blob).not.toMatch(/테스트하세요/);
  });
});
