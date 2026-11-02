/**
 * 급여 공통코드 4그룹 — 쓰기는 테넌트 격리, 조회만 하이브리드(코어 폴백)
 */
import {
  HYBRID_READ_WITH_CORE_FALLBACK_GROUPS,
  TENANT_WRITE_ISOLATED_GROUPS
} from '../tenantCodeConstants';

const SALARY_HYBRID_READ_GROUPS = [
  'SALARY_TYPE',
  'SALARY_OPTION_TYPE',
  'CONSULTANT_GRADE',
  'SALARY_PAY_DAY'
];

describe('tenantCodeConstants salary hybrid read', () => {
  test.each(SALARY_HYBRID_READ_GROUPS)(
    '%s 는 TENANT_WRITE_ISOLATED 이면서 HYBRID_READ_WITH_CORE_FALLBACK',
    (group) => {
      expect(TENANT_WRITE_ISOLATED_GROUPS).toContain(group);
      expect(HYBRID_READ_WITH_CORE_FALLBACK_GROUPS).toContain(group);
    }
  );

  test('EXPENSE_/INCOME_ 은 하이브리드가 아님(회귀)', () => {
    ['EXPENSE_CATEGORY', 'EXPENSE_SUBCATEGORY', 'INCOME_CATEGORY', 'INCOME_SUBCATEGORY']
      .forEach((g) => {
        expect(HYBRID_READ_WITH_CORE_FALLBACK_GROUPS).not.toContain(g);
      });
  });
});
