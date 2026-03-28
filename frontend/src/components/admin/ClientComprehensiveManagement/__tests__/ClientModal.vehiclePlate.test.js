/**
 * 내담자 모달 차량번호 필드 스모크 (표시·접근성·인라인 검증)
 */
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientModal from '../ClientModal';
import { VALIDATION_MESSAGES } from '../../../../constants/messages';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ isDuplicate: false }))
  }
}));

const baseProps = {
  type: 'create',
  client: null,
  formData: {
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
  },
  setFormData: jest.fn(),
  onClose: jest.fn(),
  onSave: jest.fn(),
  userStatusOptions: []
};

describe('ClientModal 차량번호 필드', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('차량번호 라벨·입력란·placeholder가 노출된다', () => {
    render(<ClientModal {...baseProps} />);
    expect(screen.getByLabelText(/차량번호/i)).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/12가 3456/i);
    expect(input).toHaveAttribute('id', 'client-vehiclePlate');
    expect(input).toHaveAttribute('name', 'vehiclePlate');
    expect(input).toHaveAttribute('maxLength', '32');
  });

  it('입력 시 vehiclePlate 상태가 갱신된다', () => {
    function Harness() {
      const [formData, setFormData] = useState(baseProps.formData);
      return (
        <>
          <ClientModal
            {...baseProps}
            formData={formData}
            setFormData={setFormData}
          />
          <span data-testid="plate-dump">{formData.vehiclePlate}</span>
        </>
      );
    }

    render(<Harness />);
    const input = screen.getByPlaceholderText(/12가 3456/i);
    userEvent.type(input, '12가');
    expect(screen.getByTestId('plate-dump')).toHaveTextContent('12가');
  });

  it('허용되지 않는 문자 입력 시 필드 옆 인라인 오류가 표시된다', () => {
    function Harness() {
      const [formData, setFormData] = useState(baseProps.formData);
      return (
        <ClientModal
          {...baseProps}
          formData={formData}
          setFormData={setFormData}
        />
      );
    }

    render(<Harness />);
    const input = screen.getByPlaceholderText(/12가 3456/i);
    userEvent.type(input, '@');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(VALIDATION_MESSAGES.INVALID_VEHICLE_PLATE);
    expect(input).toHaveClass('mg-v2-form-input--error');
  });
});
