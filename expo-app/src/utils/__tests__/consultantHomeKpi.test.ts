import {
  buildConsultantTodaySummary,
  resolveConsultantPendingCount,
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

  it('uses scheduleLength fallback for today_sessions when todayCount is nullish', () => {
    const items = selectConsultantHomeKpiItems({
      todayCount: undefined,
      scheduleLength: 6,
      unreadMessageCount: 0,
      newClientsCount: 0,
    });
    expect(items[0]?.value).toBe(6);
  });

  it('maps homeStats newClients into KPI strip', () => {
    const items = selectConsultantHomeKpiItems({
      todayCount: 2,
      unreadMessageCount: 1,
      newClientsCount: 3,
    });
    expect(items[2]?.value).toBe(3);
  });
});

describe('resolveConsultantPendingCount', () => {
  it('prefers incomplete API count when positive', () => {
    expect(resolveConsultantPendingCount(5, 2, 1)).toBe(5);
  });

  it('falls back to pending records length when incomplete is zero', () => {
    expect(resolveConsultantPendingCount(0, 3, 9)).toBe(3);
  });

  it('falls back to dashboard pending count when others are empty', () => {
    expect(resolveConsultantPendingCount(0, undefined, 4)).toBe(4);
    expect(resolveConsultantPendingCount(0, null, 2)).toBe(2);
  });
});
