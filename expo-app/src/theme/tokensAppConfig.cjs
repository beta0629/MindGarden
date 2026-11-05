/**
 * Expo `app.config.ts` 전용 — Node가 TS를 로드하지 않으므로 CJS로 동일 값을 제공한다.
 * 색상 변경 시 `tokens.ts`의 내담자 `bgMain`·상담사 `primary`와 반드시 맞출 것.
 *
 * @see ./tokens.ts — 앱 런타임 SSOT
 */
'use strict';

module.exports = {
  /** tokens.ts CLIENT_COLORS.bgMain (stage cream) 과 동기화 */
  clientBgMain: '#FAF7F2',
  consultantPrimary: '#0E5F5A',
};
