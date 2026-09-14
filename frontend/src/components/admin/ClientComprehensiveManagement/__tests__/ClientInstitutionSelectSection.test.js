/**
 * 신규 기관 POST 후 내담자 폼에 FK만 남긴다.
 * 편집 재진입 시 선택된 기관이 셀렉트에 표시된다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StandardizedApi from '../../../../utils/standardizedApi';
import { INSTITUTION_LINK_API } from '../../../../constants/institutionLinkAdminApi';
import ClientInstitutionSelectSection, {
  ensurePartnerInstitutionOnForm
} from '../ClientInstitutionSelectSection';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

describe('ensurePartnerInstitutionOnForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

describe('ClientInstitutionSelectSection 선택 복원', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue([
      { id: 1, name: '인천광역시 자립지원전담기관', contactName: '김주리' }
    ]);
  });

  test('partnerInstitutionId 가 있으면 placeholder 대신 기관명을 보여준다', async() => {
    render(
      <ClientInstitutionSelectSection
        type="edit"
        formData={{
          partnerInstitutionId: 1,
          isCreatingInstitution: false,
          institutionName: '인천광역시 자립지원전담기관'
        }}
        setFormData={jest.fn()}
        errors={{}}
        setErrors={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('인천광역시 자립지원전담기관')).toBeInTheDocument();
    });
    expect(screen.queryByText('등록된 기관을 선택하세요')).not.toBeInTheDocument();
  });
});
