/**
 * Jest stub for @fullcalendar/luxon3 — guardrail/findRelatedTests 환경에 패키지가 없을 때
 * 스위트 로드·실 FullCalendar 마운트용. @fullcalendar/core 의 createPlugin 으로
 * deps 등 플러그인 훅 형태를 맞춘다 (빈 { id } 는 addDefs 에서 defs is not iterable).
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
const { createPlugin } = require('@fullcalendar/core');

module.exports = {
  __esModule: true,
  default: createPlugin({
    name: '@fullcalendar/luxon3'
  })
};
