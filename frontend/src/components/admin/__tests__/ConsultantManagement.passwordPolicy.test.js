/**
 * (레거시) 상담사 등록 폼 — 공통 비밀번호 정책 적용. 필수 입력이라 빈 값은 막는다.
 */
import React from 'react';
import { webcrypto } from 'crypto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ConsultantManagement from '../ConsultantManagement';
import StandardizedApi from '../../../utils/standardizedApi';
import '../../../i18n';

jest.mock('../../layout/AdminCommonLayout', () => ({ children }) => <div>{children}</div>);

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }
}));

jest.mock('../../../utils/consultantHelper', () => ({
  getAllConsultantsWithStats: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn().mockResolvedValue([])
}));

jest.setTimeout(20000);

beforeAll(() => {
  if (!global.crypto) {
    global.crypto = webcrypto;
  }
});

async function openForm() {
  render(<ConsultantManagement onUpdate={jest.fn()} showToast={jest.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: /등록/ }));
  const dialog = await screen.findByRole('dialog');
  const inputs = dialog.querySelectorAll('input');
  const set = (el, value) => fireEvent.change(el, { target: { value } });
  set(inputs[0], 'fakeconsultant');
  set(inputs[1], 'fake.consultant@example.com');
  set(inputs[3], '홍길동');
  set(inputs[4], '010-1234-5678');
  const pwd = dialog.querySelector('#legacy-consultant-password');
  return { dialog, pwd, set };
}

describe('ConsultantManagement(레거시) 비밀번호 정책', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue([]);
    StandardizedApi.post.mockResolvedValue({ id: 'c-1', email: 'fake.consultant@example.com' });
  });

  test('대문자 없는 비밀번호는 등록 API 를 부르지 않고 정책 안내를 표시한다', async() => {
    const { dialog, pwd, set } = await openForm();
    set(pwd, 'noupper1!x');
    fireEvent.click(within(dialog).getAllByRole('button', { name: '등록' }).pop());

    const alert = await within(dialog).findByText(/대문자를 포함해야/);
    expect(alert).toHaveAttribute('role', 'alert');
    expect(pwd).toHaveAttribute('aria-invalid', 'true');
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  test('빈 비밀번호는 필수 입력 안내로 막고, 정책 통과 값은 등록한다', async() => {
    const { dialog, pwd, set } = await openForm();
    set(pwd, '');
    fireEvent.click(within(dialog).getAllByRole('button', { name: '등록' }).pop());
    expect(await within(dialog).findByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
    expect(StandardizedApi.post).not.toHaveBeenCalled();

    set(pwd, 'Fake7!Qzm');
    fireEvent.click(within(dialog).getAllByRole('button', { name: '등록' }).pop());
    await waitFor(() => expect(StandardizedApi.post).toHaveBeenCalled());
  });
});
