/**
 * 학원 회원가입 — 공통 비밀번호 정책(usePasswordPolicyField) 적용.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AcademyRegister from '../AcademyRegister';
import '../../../i18n';

jest.mock('../../layout/AdminCommonLayout', () => ({ children }) => <div>{children}</div>);

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), error: jest.fn(), success: jest.fn() }
}));

const FAKE_TENANT = 'tenant-fake';
const REGISTER_PATH = '/api/v1/academy/registration/register';

function fill(name, value) {
  const el = document.querySelector(`input[name="${name}"]`);
  fireEvent.change(el, { target: { name, value, type: 'text' } });
  return el;
}

function check(name) {
  fireEvent.click(document.querySelector(`input[name="${name}"]`));
}

async function renderFilled(password) {
  render(
    <MemoryRouter initialEntries={[`/academy/register?tenantId=${FAKE_TENANT}`]}>
      <AcademyRegister />
    </MemoryRouter>
  );
  await waitFor(() => expect(document.querySelector('input[name="password"]')).not.toBeNull());
  fill('name', '홍길동');
  fill('email', 'fake.academy@example.com');
  fill('phone', '010-1234-5678');
  check('agreeTerms');
  check('agreePrivacy');
  const pwd = fill('password', password);
  fill('confirmPassword', password);
  return pwd;
}

const registerCalls = () => global.fetch.mock.calls.filter(([url]) => String(url).includes(REGISTER_PATH));

describe('AcademyRegister 비밀번호 정책', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async() => ({ success: true, data: [] }) });
  });

  test('대문자 없는 비밀번호는 가입 API 를 부르지 않고 정책 안내를 표시한다', async() => {
    const pwd = await renderFilled('noupper1!x');
    fireEvent.submit(pwd.closest('form'));

    const alert = await screen.findByText(/대문자를 포함해야/);
    expect(alert).toHaveAttribute('role', 'alert');
    expect(pwd).toHaveAttribute('aria-invalid', 'true');
    expect(registerCalls()).toHaveLength(0);
  });

  test('정책을 만족하면 가입 API 를 부른다', async() => {
    const pwd = await renderFilled('Fake7!Qzm');
    fireEvent.submit(pwd.closest('form'));
    await waitFor(() => expect(registerCalls()).toHaveLength(1));
  });
});
