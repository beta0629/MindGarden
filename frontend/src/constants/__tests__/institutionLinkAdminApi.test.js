/**
 * 기관 마스터 목록/단건 언랩.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import {
  unwrapPartnerInstitution,
  unwrapPartnerInstitutionList
} from '../institutionLinkAdminApi';

describe('institutionLinkAdminApi unwrap', () => {
  test('목록 배열과 data 래핑을 모두 받는다', () => {
    expect(unwrapPartnerInstitutionList([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(unwrapPartnerInstitutionList({ data: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(unwrapPartnerInstitutionList(null)).toEqual([]);
  });

  test('단건 id와 data.id를 읽는다', () => {
    expect(unwrapPartnerInstitution({ id: 9, name: 'A' }).id).toBe(9);
    expect(unwrapPartnerInstitution({ data: { id: 8 } }).id).toBe(8);
    expect(unwrapPartnerInstitution(null)).toBeNull();
  });
});
