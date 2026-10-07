/**
 * 스태프(관리자) 등록 — 공통 비밀번호 정책(usePasswordPolicyField) 적용.
 * 정책 실패면 등록 API 를 부르지 않고, 빈 값은 임시 비밀번호 자동 생성으로 통과한다.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import StaffManagement from '../StaffManagement';
import StandardizedApi from '../../../utils/standardizedApi';
import '../../../i18n';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }
}));

jest.mock('../../../contexts/SessionContext', () => ({
  ...jest.requireActual('../../../contexts/SessionContext'),
  useSession: () => ({ hasRole: () => true, user: { id: 'admin-test', role: 'ADMIN' } })
}));

jest.mock('../../../utils/permissionUtils', () => ({
  fetchUserPermissions: jest.fn(),
  hasPermission: () => true,
  PERMISSIONS: { CONSULTANT_MANAGE: 'CONSULTANT_MANAGE' }
}));

jest.mock('../../../utils/notification', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn()
}));

jest.setTimeout(20000);

const NO_UPPERCASE = 'noupper1!x';

async function openCreateModal() {
  render(<StaffManagement embedded />);
  const openBtn = await screen.findByRole('button', { name: '새 스태프 등록' });
  await waitFor(() => expect(openBtn).not.toBeDisabled());
  fireEvent.click(openBtn);
  const dialog = await screen.findByRole('dialog');
  const fill = (name, value) => {
    const el = dialog.querySelector(`input[name="${name}"]`);
    fireEvent.change(el, { target: { name, value } });
    return el;
  };
  fill('name', '홍길동');
  fill('email', 'fake.staff@example.com');
  return { dialog, fill };
}

function clickRegister(dialog) {
  const buttons = within(dialog).getAllByRole('button', { name: '등록' });
  fireEvent.click(buttons[buttons.length - 1]);
}

describe('StaffManagement 스태프 등록 비밀번호 정책', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue([]);
    StandardizedApi.post.mockResolvedValue({ id: 'staff-1', email: 'fake.staff@example.com' });
  });

  test('대문자 없는 비밀번호는 등록 API 를 부르지 않고 정책 안내를 표시한다', async() => {
    const { dialog, fill } = await openCreateModal();
    const pwd = fill('password', NO_UPPERCASE);
    clickRegister(dialog);

    const alert = await within(dialog).findByText(/대문자를 포함해야/);
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('특수문자');
    expect(pwd).toHaveAttribute('aria-invalid', 'true');
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  test('빈 비밀번호는 임시 비밀번호 자동 생성으로 통과한다', async() => {
    const { dialog, fill } = await openCreateModal();
    fill('password', '');
    clickRegister(dialog);

    await waitFor(() => expect(StandardizedApi.post).toHaveBeenCalled());
    expect(StandardizedApi.post.mock.calls[0][1].password).toBeUndefined();
  });
});
