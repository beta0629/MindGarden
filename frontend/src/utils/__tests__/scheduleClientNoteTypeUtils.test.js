/**
 * scheduleClientNoteTypeUtils — noteType SSOT 유틸 테스트
 */

import {
  buildScheduleClientNoteTypeLabelMap,
  formatScheduleClientNoteMeta,
  isScheduleClientNotePromiseOverdue,
  resolveScheduleClientNoteTypeLabel
} from '../scheduleClientNoteTypeUtils';
import {
  SCHEDULE_CLIENT_NOTE_TYPE_FALLBACK_LABELS,
  SCHEDULE_CLIENT_NOTE_TYPE_UNKNOWN_LABEL
} from '../../constants/clientScheduleNoteConstants';

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

  test('resolveScheduleClientNoteTypeLabel never exposes the raw code for unknown values', () => {
    const map = buildScheduleClientNoteTypeLabelMap(sampleCodes);
    expect(resolveScheduleClientNoteTypeLabel('PAYMENT_PROMISE', map)).toBe('입금·비용 약속');
    expect(resolveScheduleClientNoteTypeLabel('UNKNOWN', map)).toBe(SCHEDULE_CLIENT_NOTE_TYPE_UNKNOWN_LABEL);
    expect(resolveScheduleClientNoteTypeLabel('UNKNOWN', map)).not.toBe('UNKNOWN');
    expect(resolveScheduleClientNoteTypeLabel('', map)).toBe('');
  });

  test('resolveScheduleClientNoteTypeLabel uses constant fallback when common codes are empty', () => {
    expect(resolveScheduleClientNoteTypeLabel('PAYMENT_PROMISE', {}))
      .toBe(SCHEDULE_CLIENT_NOTE_TYPE_FALLBACK_LABELS.PAYMENT_PROMISE);
    expect(resolveScheduleClientNoteTypeLabel('RISK', undefined))
      .toBe(SCHEDULE_CLIENT_NOTE_TYPE_FALLBACK_LABELS.RISK);
  });

  test('common code label wins over the constant fallback', () => {
    const map = buildScheduleClientNoteTypeLabelMap([
      { codeValue: 'PAYMENT_PROMISE', koreanName: '결제 약속' }
    ]);
    expect(resolveScheduleClientNoteTypeLabel('PAYMENT_PROMISE', map)).toBe('결제 약속');
  });

  test('formatScheduleClientNoteMeta adds schedule date only when requested', () => {
    const getLabel = (code) => resolveScheduleClientNoteTypeLabel(code, {});
    const note = { noteType: 'OTHER', scheduleDate: '2026-09-01' };
    expect(formatScheduleClientNoteMeta(note, getLabel)).toBe('기타');
    expect(formatScheduleClientNoteMeta(note, getLabel, { includeScheduleDate: true }))
      .toBe('기타 · 일정 2026-09-01');
  });

  test('isScheduleClientNotePromiseOverdue compares against local date', () => {
    const now = new Date(2026, 9, 3);
    expect(isScheduleClientNotePromiseOverdue({ promiseDate: '2026-10-02' }, now)).toBe(true);
    expect(isScheduleClientNotePromiseOverdue({ promiseDate: '2026-10-03' }, now)).toBe(false);
    expect(isScheduleClientNotePromiseOverdue({ promiseDate: '2026-10-02', resolvedAt: 'x' }, now)).toBe(false);
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
