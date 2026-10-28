/**
 * 내담자 등록 모달 — 비밀번호는 서버가 만들고 문자로만 알린다.
 * 화면은 비밀번호를 받지 않고, 이름·이메일이 있으면 저장을 호출한다.
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

const baseForm = {
  name: '',
  email: '',
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

describe('ClientModal 임시 비밀번호 문자', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('비밀번호 입력란 없이 등록하고 문자 안내를 보여 준다', async() => {
    const onSave = jest.fn();
    render(<Harness onSave={onSave} />);
    fill('name', '홍길동');
    fill('email', 'fake.client@example.com');

    expect(document.querySelector('input[name="password"]')).toBeNull();
    expect(screen.getByText(/문자로 보내지 않습니다.*화면에는 표시하지 않으니/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].password).toBeUndefined();
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });
});
