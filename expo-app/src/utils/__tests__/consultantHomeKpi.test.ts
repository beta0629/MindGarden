import {
  buildConsultantTodaySummary,
  resolveTodayCount,
  selectConsultantHomeKpiItems,
} from '../consultantHomeKpi';
import { CONSULTANT_HOME_COPY } from '@/constants/consultantHomeCopy';

describe('resolveTodayCount', () => {
  it('prefers todayCount when provided', () => {
    expect(resolveTodayCount(3, 5)).toBe(3);
  });

  it('falls back to scheduleLength when todayCount is nullish', () => {
    expect(resolveTodayCount(undefined, 4)).toBe(4);
    expect(resolveTodayCount(null, 2)).toBe(2);
  });
});

describe('buildConsultantTodaySummary', () => {
  it('returns zero copy when count is 0', () => {
    expect(buildConsultantTodaySummary(0)).toBe(CONSULTANT_HOME_COPY.TODAY_SUMMARY_ZERO);
  });

  it('returns count-based summary for positive values', () => {
    expect(buildConsultantTodaySummary(3)).toBe('오늘 3건의 상담이 예정되어 있습니다.');
  });
});

describe('selectConsultantHomeKpiItems', () => {
  it('returns P0~P1 KPI items with normalized values', () => {
    const items = selectConsultantHomeKpiItems({
      todayCount: 2,
      unreadMessageCount: 5,
      newClientsCount: 1,
    });
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      id: 'today_sessions',
      label: CONSULTANT_HOME_COPY.KPI_TODAY_SESSIONS,
      value: 2,
      unit: CONSULTANT_HOME_COPY.UNIT_SESSION,
    });
    expect(items[1]).toMatchObject({
      id: 'unread_messages',
      label: CONSULTANT_HOME_COPY.KPI_UNREAD_MESSAGES,
      value: 5,
      unit: CONSULTANT_HOME_COPY.UNIT_MESSAGE,
    });
    expect(items[2]).toMatchObject({
      id: 'new_clients',
      label: CONSULTANT_HOME_COPY.KPI_NEW_CLIENTS,
      value: 1,
      unit: CONSULTANT_HOME_COPY.UNIT_CLIENT,
    });
  });

  it('clamps invalid unread counts to zero', () => {
    const items = selectConsultantHomeKpiItems({
      scheduleLength: 1,
      unreadMessageCount: Number.NaN,
    });
    expect(items[1]?.value).toBe(0);
    expect(items[2]?.value).toBe(0);
  });
});
