import {
  buildAdminHomeSummaryLine,
  formatAdminScheduleParticipantLabel,
  formatAdminScheduleTimeRange,
  formatAdminTodayScheduleSectionTitle,
  sliceTodaySchedulePreview,
} from '../adminHomeKpi';
import type { Schedule } from '@/api/hooks/useSchedules';

function makeSchedule(id: number): Schedule {
  return {
    id,
    consultantId: 1,
    clientId: 2,
    clientName: '김내담',
    consultantName: '이상담',
    date: '2026-05-22',
    startTime: '10:00',
    endTime: '11:00',
    status: 'CONFIRMED',
    consultationType: 'INDIVIDUAL',
  };
}

describe('sliceTodaySchedulePreview', () => {
  it('returns at most 3 schedules by default', () => {
    const schedules = [1, 2, 3, 4, 5].map(makeSchedule);
    expect(sliceTodaySchedulePreview(schedules)).toHaveLength(3);
    expect(sliceTodaySchedulePreview(schedules).map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it('handles null or empty input', () => {
    expect(sliceTodaySchedulePreview(null)).toEqual([]);
    expect(sliceTodaySchedulePreview(undefined)).toEqual([]);
  });
});

describe('formatAdminScheduleParticipantLabel', () => {
  it('joins client and consultant with middle dot', () => {
    expect(formatAdminScheduleParticipantLabel('김내담', '이상담')).toBe('김내담 · 이상담');
  });

  it('falls back to default labels when names are missing', () => {
    expect(formatAdminScheduleParticipantLabel('', null)).toBe('내담자 · 상담사');
  });
});

describe('buildAdminHomeSummaryLine', () => {
  it('builds today schedule and pending ops summary', () => {
    expect(buildAdminHomeSummaryLine(5, 2)).toBe('오늘 5건의 일정, 2건의 처리 대기');
  });

  it('allows zero pending count for P0', () => {
    expect(buildAdminHomeSummaryLine(0, 0)).toBe('오늘 0건의 일정, 0건의 처리 대기');
  });
});

describe('formatAdminTodayScheduleSectionTitle', () => {
  it('includes total count with unit', () => {
    expect(formatAdminTodayScheduleSectionTitle(3)).toBe('오늘 일정 (3건)');
  });
});

describe('formatAdminScheduleTimeRange', () => {
  it('formats start and end times', () => {
    expect(formatAdminScheduleTimeRange('09:30', '10:30')).toBe('09:30 - 10:30');
  });
});
