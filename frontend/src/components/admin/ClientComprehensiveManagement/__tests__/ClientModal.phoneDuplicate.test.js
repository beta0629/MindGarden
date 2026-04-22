/**
 * ClientModal — create 모드 휴대폰 중복확인 (StandardizedApi.get)
 */
import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import ClientModal from '../ClientModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import { VALIDATION_MESSAGES } from '../../../../constants/messages';
import { API_ENDPOINTS } from '../../../../constants/apiEndpoints';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

const baseFormData = {
  name: '',
  email: '',
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
  vehiclePlate: ''
};

const staticProps = {
  type: 'create',
  client: null,
  onClose: jest.fn(),
  onSave: jest.fn(),
  userStatusOptions: []
};

function ClientModalCreateHarness() {
  const [formData, setFormData] = useState(baseFormData);
  return (
    <ClientModal
      {...staticProps}
      formData={formData}
      setFormData={setFormData}
    />
  );
}

describe('ClientModal create 휴대폰 중복확인', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('중복 아님: 성공 small에 사용 가능 문구가 표시된다', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ isDuplicate: false, available: true });

    render(<ClientModalCreateHarness />);

    const phoneInput = screen.getByLabelText(/휴대폰 번호/i);
    await userEvent.type(phoneInput, '01012345678');

    const phoneGroup = document.getElementById('phone')?.closest('.mg-v2-form-group');
    expect(phoneGroup).toBeTruthy();
    const dupBtn = phoneGroup.querySelector('button[data-action="client-modal-phone-duplicate-check"]');
    expect(dupBtn).toBeTruthy();
    await userEvent.click(dupBtn);

    await waitFor(() => {
      const hint = screen.getByText(VALIDATION_MESSAGES.PHONE_AVAILABLE);
      expect(hint).toBeInTheDocument();
      expect(hint).toHaveClass('mg-v2-form-help--success');
    });
  });

  it('중복: 에러 small에 이미 사용 중 문구가 표시된다', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ isDuplicate: true, available: false });

    render(<ClientModalCreateHarness />);

    const phoneInput = screen.getByLabelText(/휴대폰 번호/i);
    await userEvent.type(phoneInput, '01012345678');

    const phoneGroup = document.getElementById('phone')?.closest('.mg-v2-form-group');
    const dupBtn = phoneGroup.querySelector('button[data-action="client-modal-phone-duplicate-check"]');
    expect(dupBtn).toBeTruthy();
    await userEvent.click(dupBtn);

    await waitFor(() => {
      const hint = screen.getByText(VALIDATION_MESSAGES.PHONE_EXISTS);
      expect(hint).toBeInTheDocument();
      expect(hint).toHaveClass('mg-v2-form-help--error');
    });
  });

  it('StandardizedApi.get이 관리자 전화 중복 확인 경로·정규화 번호로 호출된다', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ isDuplicate: false, available: true });

    render(<ClientModalCreateHarness />);

    const phoneInput = screen.getByLabelText(/휴대폰 번호/i);
    await userEvent.type(phoneInput, '01012345678');

    const phoneGroup = document.getElementById('phone')?.closest('.mg-v2-form-group');
    const dupBtn = phoneGroup.querySelector('button[data-action="client-modal-phone-duplicate-check"]');
    expect(dupBtn).toBeTruthy();
    await userEvent.click(dupBtn);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.DUPLICATE_CHECK.PHONE,
        expect.objectContaining({ phone: '01012345678' })
      );
    });
  });
});
