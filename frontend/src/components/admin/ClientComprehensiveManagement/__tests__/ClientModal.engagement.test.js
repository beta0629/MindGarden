/**
 * ClientModal 연계 유형 — 타기관일 때 기관 검색/선택 또는 신규.
 * 배정 화면 문구는 매칭이 아니라 배정.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientModal from '../ClientModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import { CLIENT_ENGAGEMENT_TYPE } from '../../../../constants/clientEngagementType';
import { INSTITUTION_LINK_API } from '../../../../constants/institutionLinkAdminApi';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ isDuplicate: false })),
    post: jest.fn()
  }
}));

const baseForm = {
  name: '테스트내담자',
  email: 'client@example.com',
  password: '',
  phone: '',
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
  engagementType: CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET,
  partnerInstitutionId: '',
  isCreatingInstitution: false,
  institutionName: '',
  institutionContactName: '',
  institutionContactPhone: '',
  institutionDocumentEmail: '',
  institutionPrepaid: '',
  institutionPrepaidDate: '',
  institutionPrepaidAmount: ''
};

const renderModal = (formOverrides = {}, extraProps = {}) => {
  const formData = { ...baseForm, ...formOverrides };
  return render(
    <ClientModal
      type="create"
      client={null}
      formData={formData}
      setFormData={jest.fn()}
      onClose={jest.fn()}
      onSave={jest.fn()}
      userStatusOptions={[]}
      {...extraProps}
    />
  );
};

describe('ClientModal 연계 유형', () => {
  beforeEach(() => {
    StandardizedApi.get.mockImplementation((url) => {
      if (String(url).includes(INSTITUTION_LINK_API.INSTITUTIONS)) {
        return Promise.resolve([]);
      }
      return Promise.resolve({ isDuplicate: false });
    });
  });

  it('일반 회기면 기관 칸을 숨긴다', () => {
    renderModal({ engagementType: CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET });
    expect(screen.queryByText('등록된 기관이 없습니다.')).not.toBeInTheDocument();
    expect(screen.getByText('배정 시 기관연동 배지가 표시됩니다.', { exact: false })).toBeInTheDocument();
  });

  it('타기관 연계면 기관 선택·신규가 열린다', async() => {
    renderModal({ engagementType: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK });
    expect(screen.getByRole('heading', { name: '기관' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('등록된 기관이 없습니다.')).toBeInTheDocument();
    });
    expect(screen.getByText('기관 등록')).toBeInTheDocument();
  });

  it('타기관인데 기관을 고르지 않으면 저장하지 않는다', async() => {
    const onSave = jest.fn();
    renderModal({ engagementType: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK }, { onSave });
    await waitFor(() => {
      expect(screen.getByText('등록된 기관이 없습니다.')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    const alerts = screen.getAllByRole('alert').map((el) => el.textContent);
    expect(alerts.some((text) => text && text.includes('기관을 선택하세요.'))).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });
});
