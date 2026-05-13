/**
 * Expo `app.config.ts` 전용 — Node가 TS를 로드하지 않으므로 CJS로 동일 값을 제공한다.
 * 색상 변경 시 `tokens.ts`의 내담자 `bgMain`·상담사 `primary`와 반드시 맞출 것.
 *
 * @see ./tokens.ts — 앱 런타임 SSOT
 */
'use strict';

module.exports = {
  clientBgMain: '#FAF9F7',
  consultantPrimary: '#3D5246',
};
