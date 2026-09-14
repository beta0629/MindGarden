/**
 * ClientModal 연계 유형 — 타기관일 때만 기관 칸, 저장 전 validate.
 * 배정 화면 문구는 매칭이 아니라 배정.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientModal from '../ClientModal';
import { CLIENT_ENGAGEMENT_TYPE } from '../../../../constants/clientEngagementType';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ isDuplicate: false }))
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
  institutionName: '',
  institutionContactName: '',
  institutionContactPhone: '',
  institutionDocumentPhone: '',
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
  it('일반 회기면 기관 칸을 숨긴다', () => {
    renderModal({ engagementType: CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET });
    expect(screen.queryByLabelText(/기관 이름/)).not.toBeInTheDocument();
    expect(screen.getByText('배정 시 기관연동 배지가 표시됩니다.', { exact: false })).toBeInTheDocument();
  });

  it('타기관 연계면 기관 칸을 보여 준다', () => {
    renderModal({ engagementType: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK });
    expect(screen.getByLabelText(/기관 이름/)).toBeInTheDocument();
    expect(screen.getByLabelText(/문서 발송 이메일/)).toBeInTheDocument();
  });

  it('타기관인데 기관 이름이 없으면 저장하지 않는다', () => {
    const onSave = jest.fn();
    renderModal({ engagementType: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK }, { onSave });
    fireEvent.click(screen.getByRole('button', { name: /등록/i }));
    const alerts = screen.getAllByRole('alert').map((el) => el.textContent);
    expect(alerts.some((text) => text && text.includes('기관 이름을 입력하세요.'))).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });
});
