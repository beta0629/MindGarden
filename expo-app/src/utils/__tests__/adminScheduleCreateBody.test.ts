import {
  buildDefaultScheduleTitle,
  buildScheduleCreateRequestBody,
  computeEndTimeFromDuration,
  formatMinutesToTime,
  parseTimeToMinutes,
  resolveDurationMinutes,
} from '../adminScheduleCreateBody';
import { FALLBACK_DURATION_OPTIONS } from '../adminCommonCodeNormalize';

describe('adminScheduleCreateBody', () => {
  it('computes end time from start and duration minutes', () => {
    expect(computeEndTimeFromDuration('14:00', 50)).toBe('14:50');
    expect(computeEndTimeFromDuration('23:30', 60)).toBe('00:30');
  });

  it('parses and formats time parts', () => {
    expect(parseTimeToMinutes('09:05')).toBe(9 * 60 + 5);
    expect(formatMinutesToTime(9 * 60 + 5)).toBe('09:05');
  });

  it('builds ScheduleCreateRequest body aligned with web ScheduleModal', () => {
    const body = buildScheduleCreateRequestBody(
      {
        consultantId: 1,
        clientId: 2,
        dateYmd: '2026-05-18',
        startTime: '10:00',
        endTime: '10:50',
        title: '김상담 - 이내담',
        description: '메모',
        consultationType: 'INDIVIDUAL',
        tentativeBeforeDeposit: true,
      },
      { includeTentative: true },
    );
    expect(body).toMatchObject({
      consultantId: 1,
      clientId: 2,
      date: '2026-05-18',
      startTime: '10:00',
      endTime: '10:50',
      scheduleType: 'CONSULTATION',
      consultationType: 'INDIVIDUAL',
      tentativeBeforeDeposit: true,
    });
    expect(body.title).toBe('김상담 - 이내담');
  });

  it('omits tentative flag when not requested', () => {
    const body = buildScheduleCreateRequestBody({
      consultantId: 1,
      clientId: 2,
      dateYmd: '2026-05-18',
      startTime: '10:00',
      endTime: '11:00',
      tentativeBeforeDeposit: true,
    });
    expect(body.tentativeBeforeDeposit).toBeUndefined();
  });

  it('resolves duration minutes from code options', () => {
    expect(resolveDurationMinutes('50_MIN', FALLBACK_DURATION_OPTIONS)).toBe(50);
    expect(resolveDurationMinutes('UNKNOWN', FALLBACK_DURATION_OPTIONS)).toBe(60);
  });

  it('builds default title from names', () => {
    expect(buildDefaultScheduleTitle('김상담', '박내담')).toBe('김상담 - 박내담');
  });
});
