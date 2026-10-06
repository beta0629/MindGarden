/**
 * 대시보드 등록 위젯(상담사·내담자) — 공통 비밀번호 정책(usePasswordPolicyField) 적용.
 * 두 위젯 모두 비밀번호 필수라 빈 값·정책 위반은 등록 API 를 부르지 않는다.
 */
import React from 'react';
import { webcrypto } from 'crypto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConsultantRegistrationWidget from '../ConsultantRegistrationWidget';
import ClientRegistrationWidget from '../ClientRegistrationWidget';
import StandardizedApi from '../../../../../utils/standardizedApi';
import { fetchProfessionalProviderTypeSelectOptions } from '../../../../../constants/professionalProviderRoles';
import '../../../../../i18n';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));

jest.mock('../../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() }
}));

jest.mock('../../../../../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: jest.fn() })
}));

jest.mock('../../../../../constants/professionalProviderRoles', () => ({
  ...jest.requireActual('../../../../../constants/professionalProviderRoles'),
  fetchProfessionalProviderTypeSelectOptions: jest.fn().mockResolvedValue([])
}));

beforeAll(() => {
  if (!global.crypto) {
    global.crypto = webcrypto;
  }
});

const ADMIN = { id: 'admin-test', role: 'ADMIN' };
const WIDGET = { id: 'w-1', config: {} };

function fill(name, value) {
  const el = document.querySelector(`input[name="${name}"]`);
  fireEvent.change(el, { target: { name, value } });
  return el;
}

const CASES = [
  {
    label: '상담사 등록 위젯',
    Component: ConsultantRegistrationWidget,
    start: '상담사 등록 시작',
    formSelector: 'form'
  },
  {
    label: '내담자 등록 위젯',
    Component: ClientRegistrationWidget,
    start: '내담자 등록 시작',
    formSelector: 'form.client-registration-form'
  }
];

describe.each(CASES)('$label 비밀번호 정책', ({ Component, start, formSelector }) => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.post.mockResolvedValue({ id: 'u-1' });
    fetchProfessionalProviderTypeSelectOptions.mockResolvedValue([]);
  });

  async function openForm() {
    render(<Component widget={WIDGET} user={ADMIN} />);
    fireEvent.click(await screen.findByRole('button', { name: start }));
    fill('userId', 'fakeuser');
    fill('name', '홍길동');
    fill('email', 'fake.user@example.com');
    fill('phone', '010-1234-5678');
  }

  test('대문자 없는 비밀번호는 등록 API 를 부르지 않고 정책 안내를 표시한다', async() => {
    await openForm();
    const pwd = fill('password', 'noupper1!x');
    fireEvent.submit(document.querySelector(formSelector));

    const alert = await screen.findByText(/대문자를 포함해야/);
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('특수문자');
    expect(pwd).toHaveAttribute('aria-invalid', 'true');
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  test('빈 비밀번호는 필수 입력 안내로 막고, 정책 통과 값은 등록한다', async() => {
    await openForm();
    fill('password', '');
    fireEvent.submit(document.querySelector(formSelector));
    expect(await screen.findByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
    expect(StandardizedApi.post).not.toHaveBeenCalled();

    fill('password', 'Fake7!Qzm');
    fireEvent.submit(document.querySelector(formSelector));
    await waitFor(() => expect(StandardizedApi.post).toHaveBeenCalled());
    expect(StandardizedApi.post.mock.calls[0][1].password).toBe('Fake7!Qzm');
  });
});
