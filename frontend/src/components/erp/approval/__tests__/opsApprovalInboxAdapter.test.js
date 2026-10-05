import StandardizedApi from '../../../../utils/standardizedApi';
import { SALARY_API_ENDPOINTS } from '../../../../constants/salaryConstants';
import {
  OAC_ITEM_TYPE,
  buildSalaryPendingPeriod,
  loadOpsApprovalInbox
} from '../opsApprovalInboxAdapter';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() }
}));

const PURCHASE_ROW = { id: 11, status: 'PENDING', createdAt: '2026-10-01T10:00:00' };
const SALARY_ROW = { id: 21, status: 'CALCULATED', createdAt: '2026-10-02T10:00:00' };

const routeGet = (handlers) => {
  StandardizedApi.get.mockImplementation((url, params) => {
    const key = Object.keys(handlers).find((k) => url.includes(k));
    if (!key) {
      return Promise.resolve([]);
    }
    return handlers[key](params);
  });
};

describe('buildSalaryPendingPeriod (KST)', () => {
  test('KST 1월 이른 새벽 — UTC 전년 12월이 아니라 KST 1월 기준 3개월', () => {
    expect(buildSalaryPendingPeriod(new Date('2026-12-31T16:00:00Z'))).toEqual({
      startDate: '2026-11-01',
      endDate: '2027-01-31'
    });
  });

  test('윤년 2월 말일', () => {
    expect(buildSalaryPendingPeriod(new Date('2028-02-10T03:00:00Z')).endDate).toBe('2028-02-29');
  });
});

describe('loadOpsApprovalInbox (admin)', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
  });

  test('급여 계산 목록은 startDate·endDate 를 넘겨 호출한다 (400 방지)', async() => {
    routeGet({
      [SALARY_API_ENDPOINTS.CALCULATIONS]: () => Promise.resolve([SALARY_ROW])
    });
    const result = await loadOpsApprovalInbox({ mode: 'admin' });
    const salaryCall = StandardizedApi.get.mock.calls.find(([url]) => url === SALARY_API_ENDPOINTS.CALCULATIONS);
    expect(salaryCall[1]).toEqual(expect.objectContaining({
      startDate: expect.stringMatching(/^\d{4}-\d{2}-01$/),
      endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    }));
    expect(result.failedSections).toEqual([]);
    expect(result.items.some((item) => item.type === OAC_ITEM_TYPE.SALARY)).toBe(true);
  });

  test('급여 400 이어도 다른 섹션은 표시하고 실패 섹션만 보고한다', async() => {
    routeGet({
      'pending-admin': () => Promise.resolve([PURCHASE_ROW]),
      [SALARY_API_ENDPOINTS.CALCULATIONS]: () => Promise.reject(Object.assign(new Error('400'), { status: 400 }))
    });
    const result = await loadOpsApprovalInbox({ mode: 'admin' });
    expect(result.failedSections).toEqual([OAC_ITEM_TYPE.SALARY]);
    expect(result.items.map((item) => item.type)).toContain(OAC_ITEM_TYPE.PURCHASE);
  });

  test('모든 섹션 실패면 화면 전체 실패로 던진다', async() => {
    StandardizedApi.get.mockRejectedValue(new Error('down'));
    await expect(loadOpsApprovalInbox({ mode: 'admin' })).rejects.toThrow('down');
  });
});
