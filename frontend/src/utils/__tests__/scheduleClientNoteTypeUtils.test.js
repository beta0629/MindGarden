/**
 * scheduleClientNoteTypeUtils — noteType SSOT 유틸 테스트
 */

import {
  buildScheduleClientNoteTypeLabelMap,
  formatScheduleClientNoteMeta,
  resolveScheduleClientNoteTypeLabel
} from '../scheduleClientNoteTypeUtils';

describe('scheduleClientNoteTypeUtils', () => {
  const sampleCodes = [
    { codeValue: 'PAYMENT_PROMISE', koreanName: '입금·비용 약속', codeLabel: 'Payment promise' },
    { codeValue: 'OTHER', koreanName: '기타', codeLabel: 'Other' }
  ];

  test('buildScheduleClientNoteTypeLabelMap prefers koreanName', () => {
    const map = buildScheduleClientNoteTypeLabelMap(sampleCodes);
    expect(map.PAYMENT_PROMISE).toBe('입금·비용 약속');
    expect(map.OTHER).toBe('기타');
  });

  test('resolveScheduleClientNoteTypeLabel falls back to codeValue', () => {
    const map = buildScheduleClientNoteTypeLabelMap(sampleCodes);
    expect(resolveScheduleClientNoteTypeLabel('PAYMENT_PROMISE', map)).toBe('입금·비용 약속');
    expect(resolveScheduleClientNoteTypeLabel('UNKNOWN', map)).toBe('UNKNOWN');
    expect(resolveScheduleClientNoteTypeLabel('', map)).toBe('');
  });

  test('formatScheduleClientNoteMeta joins type label and promise date', () => {
    const map = buildScheduleClientNoteTypeLabelMap(sampleCodes);
    const getLabel = (code) => resolveScheduleClientNoteTypeLabel(code, map);
    expect(formatScheduleClientNoteMeta(
      { noteType: 'PAYMENT_PROMISE', promiseDate: '2026-09-02' },
      getLabel
    )).toBe('입금·비용 약속 · 약속일 2026-09-02');
  });
});
