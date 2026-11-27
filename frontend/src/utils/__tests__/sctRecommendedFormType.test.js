/**
 * SCT 추천 양식 타입 유틸
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import { SCT_FORM_TYPE } from '../../constants/sctOnline';
import {
  resolveClientAgeYears,
  resolveSctRecommendedFormType
} from '../sctRecommendedFormType';

describe('resolveSctRecommendedFormType', () => {
  it('age 25 → ADULT', () => {
    expect(resolveSctRecommendedFormType({ age: 25 })).toBe(SCT_FORM_TYPE.ADULT);
  });

  it('age 18 → ADOLESCENT', () => {
    expect(resolveSctRecommendedFormType({ age: 18 })).toBe(SCT_FORM_TYPE.ADOLESCENT);
  });

  it('age 19 → ADULT', () => {
    expect(resolveSctRecommendedFormType({ age: 19 })).toBe(SCT_FORM_TYPE.ADULT);
  });

  it('age/birthDate 없음 → null', () => {
    expect(resolveSctRecommendedFormType({})).toBeNull();
    expect(resolveSctRecommendedFormType(null)).toBeNull();
    expect(resolveSctRecommendedFormType(undefined)).toBeNull();
  });

  it('birthDate로 계산되는 경우', () => {
    const birthDate = '2000-01-15';
    const age = resolveClientAgeYears({ birthDate });
    expect(age).not.toBeNull();
    expect(age).toBeGreaterThanOrEqual(19);
    expect(resolveSctRecommendedFormType({ birthDate })).toBe(SCT_FORM_TYPE.ADULT);
  });
});
