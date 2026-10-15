/**
 * 내담자 등록 모달 — 공통 비밀번호 정책(usePasswordPolicyField) 적용.
 * 정책 실패면 저장(onSave → 등록 API)을 부르지 않고, 빈 값은 임시 비밀번호 등록으로 통과한다.
 */
import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClientModal from '../ClientModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import '../../../../i18n';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ isDuplicate: false })),
    post: jest.fn(),
    put: jest.fn()
  }
}));

const NO_UPPERCASE = 'noupper1!x';

const baseForm = {
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

function Harness({ onSave }) {
  const [formData, setFormData] = useState(baseForm);
  return (
    <ClientModal
      type="create"
      client={null}
      formData={formData}
      setFormData={setFormData}
      onClose={jest.fn()}
      onSave={onSave}
      userStatusOptions={[]}
    />
  );
}

function fill(name, value) {
  const el = document.querySelector(`input[name="${name}"]`);
  fireEvent.change(el, { target: { name, value } });
  return el;
}

describe('ClientModal 비밀번호 정책', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('대문자 없는 비밀번호는 저장하지 않고 정책 안내를 표시한다', async() => {
    const onSave = jest.fn();
    render(<Harness onSave={onSave} />);
    fill('name', '홍길동');
    fill('email', 'fake.client@example.com');
    const pwd = fill('password', NO_UPPERCASE);

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    const alert = await screen.findByText(/대문자를 포함해야/);
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('특수문자');
    expect(pwd).toHaveAttribute('aria-invalid', 'true');
    expect(onSave).not.toHaveBeenCalled();
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  test('빈 비밀번호는 임시 비밀번호 등록으로 통과한다', async() => {
    const onSave = jest.fn();
    render(<Harness onSave={onSave} />);
    fill('name', '홍길동');
    fill('email', 'fake.client@example.com');
    fill('password', '');

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].password).toBe('');
    expect(screen.queryByText(/대문자를 포함해야/)).not.toBeInTheDocument();
  });
});
