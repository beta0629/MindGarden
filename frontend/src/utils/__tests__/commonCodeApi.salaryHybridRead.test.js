/**
 * getCommonCodes — 급여 4그룹은 /tenant 가 아니라 /groups/{g} (테넌트 우선+코어 폴백)
 */
import { getCommonCodes } from '../commonCodeApi';
import StandardizedApi from '../standardizedApi';

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

const SALARY_HYBRID_READ_GROUPS = [
  'SALARY_TYPE',
  'SALARY_OPTION_TYPE',
  'CONSULTANT_GRADE',
  'SALARY_PAY_DAY'
];

describe('commonCodeApi getCommonCodes salary hybrid path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue([
      { codeValue: 'FREELANCE', codeLabel: '프리랜서' }
    ]);
  });

  test.each(SALARY_HYBRID_READ_GROUPS)(
    '%s → /api/v1/common-codes/groups/%s (tenant-only 아님)',
    async(group) => {
      const codes = await getCommonCodes(group);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      const url = StandardizedApi.get.mock.calls[0][0];
      expect(url).toBe(`/api/v1/common-codes/groups/${group}`);
      expect(url).not.toMatch(/\/tenant/);
      expect(url).not.toMatch(/\?codeGroup=/);
      expect(codes).toHaveLength(1);
    }
  );

  test('forceTenant=true 이면 급여 그룹도 /tenant 유지(테넌트 관리 화면)', async() => {
    StandardizedApi.get.mockResolvedValue({ codes: [] });
    await getCommonCodes('SALARY_TYPE', true);
    const url = StandardizedApi.get.mock.calls[0][0];
    expect(url).toMatch(/^\/api\/v1\/common-codes\/tenant/);
    expect(url).toMatch(/codeGroup=SALARY_TYPE/);
  });

  test('기존 하이브리드 SALARY_GRADE 도 /groups/{g}', async() => {
    await getCommonCodes('SALARY_GRADE');
    expect(StandardizedApi.get.mock.calls[0][0]).toBe(
      '/api/v1/common-codes/groups/SALARY_GRADE'
    );
  });

  test('EXPENSE_CATEGORY 는 tenant-only 유지', async() => {
    StandardizedApi.get.mockResolvedValue({ codes: [] });
    await getCommonCodes('EXPENSE_CATEGORY');
    const url = StandardizedApi.get.mock.calls[0][0];
    expect(url).toMatch(/^\/api\/v1\/common-codes\/tenant/);
    expect(url).not.toMatch(/\/groups\//);
  });
});
