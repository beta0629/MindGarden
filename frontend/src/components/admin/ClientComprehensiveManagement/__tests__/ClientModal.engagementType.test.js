/**
 * 내담자 등록 연계 유형 BadgeSelect 일반/타기관.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientModal from '../ClientModal';
import { CLIENT_ENGAGEMENT_FORM_DEFAULTS } from '../../../../constants/clientEngagementType';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ isDuplicate: false }))
  }
}));

const baseForm = {
  name: '홍길동',
  email: 'a@example.com',
  password: '',
  phone: '01012345678',
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
  ...CLIENT_ENGAGEMENT_FORM_DEFAULTS
};

describe('ClientModal engagement type', () => {
  test('기본은 일반이고 타기관을 고르면 기관 필드가 열린다', () => {
    const setFormData = jest.fn();
    const { rerender } = render(
      <ClientModal
        type="create"
        client={null}
        formData={baseForm}
        setFormData={setFormData}
        onClose={jest.fn()}
        onSave={jest.fn()}
        userStatusOptions={[]}
      />
    );

    expect(screen.getByText('일반')).toBeInTheDocument();
    expect(screen.getByText('타기관')).toBeInTheDocument();
    expect(screen.queryByText('기관')).toBeNull();

    fireEvent.click(screen.getByText('타기관'));
    expect(setFormData).toHaveBeenCalled();

    rerender(
      <ClientModal
        type="create"
        client={null}
        formData={{ ...baseForm, engagementType: 'INSTITUTION_LINK' }}
        setFormData={setFormData}
        onClose={jest.fn()}
        onSave={jest.fn()}
        userStatusOptions={[]}
      />
    );

    expect(screen.getByText('기관')).toBeInTheDocument();
    expect(screen.getByText('초기 상담 선납')).toBeInTheDocument();
  });
});
