/**
 * 비밀번호 재설정(토큰) — 공통 비밀번호 정책(usePasswordPolicyField) 적용.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import { apiGet, apiPost } from '../../../utils/ajax';
import '../../../i18n';

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn(), show: jest.fn() }
}));

const FAKE_TOKEN = 'fake-reset-token';

async function renderPage() {
  render(
    <MemoryRouter initialEntries={[`/reset-password?token=${FAKE_TOKEN}`]}>
      <ResetPassword />
    </MemoryRouter>
  );
  return screen.findByLabelText('새 비밀번호');
}

function fill(el, value) {
  fireEvent.change(el, { target: { name: el.getAttribute('name'), value } });
}

describe('ResetPassword 비밀번호 정책', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiGet.mockResolvedValue({ success: true, valid: true });
    apiPost.mockResolvedValue({ success: true });
  });

  test('대문자 없는 비밀번호는 재설정 API 를 부르지 않고 정책 안내를 표시한다', async() => {
    const input = await renderPage();
    fill(input, 'noupper1!x');
    fill(screen.getByLabelText('비밀번호 확인'), 'noupper1!x');
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    const alert = await screen.findByText(/대문자를 포함해야/);
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('특수문자');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(apiPost).not.toHaveBeenCalled();
  });

  test('정책을 만족하고 확인이 일치하면 재설정 API 를 부른다', async() => {
    const input = await renderPage();
    fill(input, 'Fake7!Qzm');
    fill(screen.getByLabelText('비밀번호 확인'), 'Fake7!Qzm');
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    expect(apiPost.mock.calls[0][1].newPassword).toBe('Fake7!Qzm');
  });
});
