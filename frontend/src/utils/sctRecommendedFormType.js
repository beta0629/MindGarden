/**
 * SCT 발송 시트 — 내담자 나이 기반 추천 양식 타입
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import { SCT_ADULT_AGE, SCT_FORM_TYPE } from '../constants/sctOnline';
import { getConsultantAgeYears } from './consultantHelper';

/**
 * 내담자 만 나이: age 우선, 없으면 birthDate/birth_date 파싱.
 * getConsultantAgeYears와 동일 shape·로직 재사용.
 *
 * @param {{ age?: number|string, birthDate?: string|object, birth_date?: string|object }|null|undefined} client
 * @returns {number|null}
 */
export const resolveClientAgeYears = (client) => getConsultantAgeYears(client);

/**
 * 온라인 SCT 추천 양식. age 없으면 추천 없음(null). CHILD는 온라인 미발송.
 *
 * @param {{ age?: number|string, birthDate?: string|object, birth_date?: string|object }|null|undefined} client
 * @returns {'ADULT'|'ADOLESCENT'|null}
 */
export const resolveSctRecommendedFormType = (client) => {
  const age = resolveClientAgeYears(client);
  if (age == null) {
    return null;
  }
  if (age >= SCT_ADULT_AGE) {
    return SCT_FORM_TYPE.ADULT;
  }
  return SCT_FORM_TYPE.ADOLESCENT;
};
