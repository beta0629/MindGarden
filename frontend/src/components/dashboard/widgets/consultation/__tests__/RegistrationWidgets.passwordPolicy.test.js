/**
 * 대시보드 등록 위젯(상담사·내담자) — 비밀번호는 서버가 만들고 등록 시 SMS는 보내지 않는다.
 * 화면은 비밀번호를 받지 않고, 필수 항목이 있으면 등록 API 를 부른다.
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

describe.each(CASES)('$label 임시 비밀번호 문자', ({ Component, start, formSelector }) => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.post.mockResolvedValue({ id: 'u-1', smsSent: true });
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

  test('비밀번호 입력란 없이 등록하고 요청에 비밀번호를 넣지 않는다', async() => {
    await openForm();
    expect(document.querySelector('input[name="password"]')).toBeNull();
    expect(screen.getByText(/등록 시 임시 비밀번호 문자는 보내지 않습니다/)).toBeInTheDocument();

    fireEvent.submit(document.querySelector(formSelector));
    await waitFor(() => expect(StandardizedApi.post).toHaveBeenCalled());
    expect(StandardizedApi.post.mock.calls[0][1].password).toBeUndefined();
  });
});
