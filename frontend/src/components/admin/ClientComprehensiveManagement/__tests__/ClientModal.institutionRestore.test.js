/**
 * 편집 재진입 시 with-stats 가 기관 FK를 복원하고, 생략 시에도 목록값을 지우지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ClientModal from '../ClientModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import {
  CLIENT_ENGAGEMENT_TYPE,
  CLIENT_PREPAID_CHOICE
} from '../../../../constants/clientEngagementType';
import { INSTITUTION_LINK_API } from '../../../../constants/institutionLinkAdminApi';
import { API_ENDPOINTS } from '../../../../constants/apiEndpoints';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

const institutionList = [
  { id: 1, name: '인천광역시 자립지원전담기관', contactName: '김주리' }
];

const baseForm = {
  name: '최가을',
  email: 'choi@example.com',
  password: '',
  phone: '01011112222',
  status: 'ACTIVE',
  grade: 'BRONZE',
  notes: '',
  profileImageUrl: '',
  rrnFirst6: '',
  rrnLast1: '',
  address: '',
  addressDetail: '',
  postalCode: '',
  vehiclePlate: '',
  engagementType: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK,
  partnerInstitutionId: 1,
  isCreatingInstitution: false,
  institutionName: '인천광역시 자립지원전담기관',
  institutionContactName: '김주리',
  institutionContactPhone: '01033334444',
  institutionDocumentEmail: 'doc@partner.example',
  institutionPrepaid: CLIENT_PREPAID_CHOICE.YES,
  institutionPrepaidDate: '2026-09-01',
  institutionPrepaidAmount: 100000
};

function StatefulEditModal({ initialForm }) {
  const [formData, setFormData] = useState(initialForm);
  return (
    <ClientModal
      type="edit"
      client={{ id: 78, name: '최가을', phone: '01011112222' }}
      formData={formData}
      setFormData={setFormData}
      onClose={jest.fn()}
      onSave={jest.fn()}
      userStatusOptions={[]}
    />
  );
}

describe('ClientModal 기관 FK 재진입 복원', () => {
  beforeEach(() => {
    StandardizedApi.get.mockImplementation((url) => {
      const path = String(url);
      if (path.includes(INSTITUTION_LINK_API.INSTITUTIONS)) {
        return Promise.resolve(institutionList);
      }
      if (path.includes(API_ENDPOINTS.ADMIN.CLIENTS.WITH_STATS)) {
        return Promise.resolve({
          currentConsultants: 0,
          statistics: { totalSessions: 0 },
          client: {
            name: '최가을',
            engagementType: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK,
            partnerInstitutionId: 1,
            institutionName: '인천광역시 자립지원전담기관',
            institutionContactName: '김주리',
            institutionPrepaid: true,
            institutionPrepaidDate: '2026-09-01',
            institutionPrepaidAmount: 100000
          }
        });
      }
      if (path.includes('/api/v1/users/profile/')) {
        return Promise.resolve({});
      }
      return Promise.resolve({ isDuplicate: false });
    });
  });

  test('with-stats 에 partnerInstitutionId 가 있으면 셀렉트에 기관명이 복원된다', async() => {
    render(<StatefulEditModal initialForm={baseForm} />);

    await waitFor(() => {
      expect(screen.getByText('인천광역시 자립지원전담기관')).toBeInTheDocument();
    });
    expect(screen.queryByText('등록된 기관을 선택하세요')).not.toBeInTheDocument();
  });

  test('with-stats 가 FK를 생략해도 목록에서 채운 partnerInstitutionId 를 유지한다', async() => {
    StandardizedApi.get.mockImplementation((url) => {
      const path = String(url);
      if (path.includes(INSTITUTION_LINK_API.INSTITUTIONS)) {
        return Promise.resolve(institutionList);
      }
      if (path.includes(API_ENDPOINTS.ADMIN.CLIENTS.WITH_STATS)) {
        return Promise.resolve({
          currentConsultants: 0,
          statistics: { totalSessions: 0 },
          client: {
            name: '최가을',
            engagementType: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK,
            institutionPrepaid: true,
            institutionName: '인천광역시 자립지원전담기관'
          }
        });
      }
      if (path.includes('/api/v1/users/profile/')) {
        return Promise.resolve({});
      }
      return Promise.resolve({ isDuplicate: false });
    });

    render(<StatefulEditModal initialForm={baseForm} />);

    await waitFor(() => {
      expect(screen.getByText('인천광역시 자립지원전담기관')).toBeInTheDocument();
    });
    expect(screen.queryByText('등록된 기관을 선택하세요')).not.toBeInTheDocument();
  });
});
