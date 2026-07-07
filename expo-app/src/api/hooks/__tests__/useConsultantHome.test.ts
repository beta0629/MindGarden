/**
 * `useConsultantHome` query key·엔드포인트 컨트랙트 단위 테스트 (ROLE-04)
 */
import { CONSULTANT_HOME_QUERY_KEYS } from '../consultantHomeQueryKeys';
import { SCHEDULE_API } from '../../endpoints';

describe('CONSULTANT_HOME_QUERY_KEYS contract', () => {
  it('exposes a root key for bulk invalidation', () => {
    expect(CONSULTANT_HOME_QUERY_KEYS.all).toEqual(['consultantHome']);
  });

  it('builds stats key under the root', () => {
    expect(CONSULTANT_HOME_QUERY_KEYS.stats()).toEqual(['consultantHome', 'stats']);
  });

  it('builds consultant-scoped keys with consultantId', () => {
    expect(CONSULTANT_HOME_QUERY_KEYS.incompleteRecords(42)).toEqual([
      'consultantHome',
      'incompleteRecords',
      42,
    ]);
    expect(CONSULTANT_HOME_QUERY_KEYS.highPriorityClients('c-7')).toEqual([
      'consultantHome',
      'highPriorityClients',
      'c-7',
    ]);
    expect(CONSULTANT_HOME_QUERY_KEYS.upcomingPreparation(99)).toEqual([
      'consultantHome',
      'upcomingPreparation',
      99,
    ]);
  });
});

describe('SCHEDULE_API consultant home endpoints', () => {
  it('points to Phase1 consultant dashboard paths', () => {
    expect(SCHEDULE_API.TODAY_STATISTICS).toBe('/api/v1/schedules/today/statistics');
    expect(SCHEDULE_API.consultantIncompleteRecords(10)).toBe(
      '/api/v1/schedules/consultants/10/incomplete-records',
    );
    expect(SCHEDULE_API.consultantHighPriorityClients(10)).toBe(
      '/api/v1/schedules/consultants/10/high-priority-clients',
    );
    expect(SCHEDULE_API.consultantUpcomingPreparation(10)).toBe(
      '/api/v1/schedules/consultants/10/upcoming-preparation',
    );
  });
});
