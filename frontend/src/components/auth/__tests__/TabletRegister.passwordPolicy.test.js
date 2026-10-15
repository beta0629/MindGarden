/**
 * 회원가입 — 공통 비밀번호 정책(usePasswordPolicyField) 적용.
 * 다른 항목은 모두 유효하게 채워 비밀번호 정책만으로 제출이 막히는지 확인한다.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TabletRegister from '../TabletRegister';
import csrfTokenManager from '../../../utils/csrfTokenManager';
import { apiGet } from '../../../utils/ajax';
import '../../../i18n';

jest.mock('../../../utils/ajax', () => ({ apiGet: jest.fn() }));

jest.mock('../../../utils/csrfTokenManager', () => ({
  __esModule: true,
  default: { post: jest.fn() }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), error: jest.fn(), success: jest.fn() }
}));

function fill(name, value) {
  const el = document.querySelector(`input[name="${name}"]`);
  fireEvent.change(el, { target: { name, value } });
  return el;
}

function check(name) {
  const el = document.querySelector(`input[name="${name}"]`);
  fireEvent.click(el);
}

function renderFilled(password, confirm) {
  render(
    <MemoryRouter>
      <TabletRegister />
    </MemoryRouter>
  );
  fill('name', '홍길동');
  fill('rrnFirst6', '900101');
  fill('rrnLast1', '1');
  fill('email', 'fake.member@example.com');
  fill('phone', '01012345678');
  check('agreeTerms');
  check('agreePrivacy');
  const pwd = fill('password', password);
  fill('confirmPassword', confirm);
  return pwd;
}

describe('TabletRegister 비밀번호 정책', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    apiGet.mockResolvedValue({ isDuplicate: false });
    csrfTokenManager.post.mockResolvedValue({ ok: true, json: async() => ({ success: true }) });
  });

  test('대문자 없는 비밀번호는 가입 API 를 부르지 않고 정책 안내를 표시한다', async() => {
    const pwd = renderFilled('noupper1!x', 'noupper1!x');
    fireEvent.submit(pwd.closest('form'));

    const alert = await screen.findByText(/대문자를 포함해야/);
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('특수문자');
    expect(pwd).toHaveAttribute('aria-invalid', 'true');
    expect(csrfTokenManager.post).not.toHaveBeenCalled();
  });

  test('정책을 만족하면 가입 API 를 부른다', async() => {
    const pwd = renderFilled('Fake7!Qzm', 'Fake7!Qzm');
    fireEvent.submit(pwd.closest('form'));

    await waitFor(() => expect(csrfTokenManager.post).toHaveBeenCalled());
    expect(csrfTokenManager.post.mock.calls[0][1].password).toBe('Fake7!Qzm');
  });
});
