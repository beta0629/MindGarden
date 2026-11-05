/**
 * 신규 기관 POST 후 내담자 폼에 FK만 남긴다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import StandardizedApi from '../../../../utils/standardizedApi';
import { INSTITUTION_LINK_API } from '../../../../constants/institutionLinkAdminApi';
import { ensurePartnerInstitutionOnForm } from '../ClientInstitutionSelectSection';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}));

describe('ensurePartnerInstitutionOnForm', () => {
  test('이미 선택한 기관이면 POST하지 않는다', async() => {
    const formData = { partnerInstitutionId: 11, isCreatingInstitution: false };
    const next = await ensurePartnerInstitutionOnForm(formData);
    expect(next).toBe(formData);
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  test('신규 기관은 POST 후 partnerInstitutionId만 채운다', async() => {
    StandardizedApi.post.mockResolvedValue({
      id: 21,
      name: '신규기관',
      contactName: '이담당',
      documentEmail: 'n@partner.example'
    });
    const next = await ensurePartnerInstitutionOnForm({
      isCreatingInstitution: true,
      institutionName: '신규기관',
      institutionContactName: '이담당',
      institutionContactPhone: '01022223333',
      institutionDocumentEmail: 'n@partner.example'
    });
    expect(StandardizedApi.post).toHaveBeenCalledWith(
      INSTITUTION_LINK_API.INSTITUTIONS,
      expect.objectContaining({ name: '신규기관', contactName: '이담당' })
    );
    expect(next.partnerInstitutionId).toBe(21);
    expect(next.isCreatingInstitution).toBe(false);
  });
});
