/**
 * (레거시) 상담사 등록 폼 — 비밀번호는 서버가 만들고 문자로만 알린다.
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
  set(inputs[2], '홍길동');
  set(inputs[3], '010-1234-5678');
  return { dialog };
}

describe('ConsultantManagement(레거시) 임시 비밀번호 문자', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue([]);
    StandardizedApi.post.mockResolvedValue({ id: 'c-1', email: 'fake.consultant@example.com', smsSent: true });
  });

  test('비밀번호 입력란 없이 등록하고 요청에 비밀번호를 넣지 않는다', async() => {
    const { dialog } = await openForm();
    expect(dialog.querySelector('#legacy-consultant-password')).toBeNull();
    expect(dialog.querySelector('input[name="password"]')).toBeNull();
    expect(within(dialog).getByText(/등록 시 임시 비밀번호 문자는 보내지 않습니다/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getAllByRole('button', { name: '등록' }).pop());
    await waitFor(() => expect(StandardizedApi.post).toHaveBeenCalled());
    expect(StandardizedApi.post.mock.calls[0][1].password).toBeUndefined();
  });
});
