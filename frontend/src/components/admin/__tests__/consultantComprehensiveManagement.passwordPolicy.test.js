/**
 * 상담사 등록 — 비밀번호 정책 실패는 제출을 막고, 서버 문구는 일반 500 보다 우선한다.
 */
import React from 'react';
import { webcrypto } from 'crypto';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ConsultantComprehensiveManagement from '../ConsultantComprehensiveManagement';
import { apiGet, apiPost } from '../../../utils/ajax';
import { SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE } from '../../../constants/genericServerErrorMessages';
import '../../../i18n';

jest.mock('../../../utils/ajax', () => {
  const actual = jest.requireActual('../../../utils/ajax');
  return {
    ...actual,
    apiGet: jest.fn(),
    apiPost: jest.fn(),
    apiPut: jest.fn()
  };
});

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue([]),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../utils/consultantHelper', () => ({
  getAllConsultantsWithStats: jest.fn().mockResolvedValue([]),
  formatConsultantGenderLabel: jest.fn(() => ''),
  getConsultantAgeYears: jest.fn(() => null)
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    getUser: () => ({ id: 'admin-test', tenantId: 'tenant-test', role: 'ADMIN' }),
    getSessionInfo: () => ({ tenantId: 'tenant-test' }),
    checkSession: jest.fn().mockResolvedValue(true),
    setUser: jest.fn()
  }
}));

jest.setTimeout(20000);

beforeAll(() => {
  if (!global.crypto) {
    global.crypto = webcrypto;
  }
});

const COMPLIANT_PASSWORD = 'Aa1!qzxm';
const NO_UPPERCASE_PASSWORD = 'abcd1234!';
const DUPLICATE_MESSAGE = '이미 등록된 이메일입니다.';

function renderPage() {
  return render(
    <MemoryRouter>
      <ConsultantComprehensiveManagement embedded />
    </MemoryRouter>
  );
}

async function openCreateModal() {
  renderPage();
  const openButtons = await screen.findAllByRole('button', { name: '새 상담사 등록' });
  await userEvent.click(openButtons[0]);
  const password = await screen.findByLabelText('비밀번호', {}, { timeout: 8000 });
  expect(password).toBeInTheDocument();
}

function setField(element, value) {
  fireEvent.change(element, { target: { name: element.getAttribute('name'), value } });
}

describe('ConsultantComprehensiveManagement 비밀번호·서버 메시지', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiGet.mockResolvedValue({ isDuplicate: false });
    apiPost.mockResolvedValue({ id: 'consultant-1', email: 'new@example.com', userId: 'new' });
  });

  test('대문자 없는 비밀번호는 제출하지 않고 정책 안내를 표시한다', async() => {
    await openCreateModal();
    setField(screen.getByLabelText('비밀번호'), NO_UPPERCASE_PASSWORD);
    setField(screen.getByPlaceholderText('이름을 입력하세요'), '홍길동');
    setField(screen.getByLabelText('이메일 *'), 'new@example.com');
    fireEvent.click(document.querySelector('[data-action="email-duplicate-check"]'));
    await screen.findByText('사용 가능한 이메일입니다.');

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('mg-v2-form-help--error');
    expect(alert).toHaveTextContent('대문자');
    expect(alert).toHaveTextContent('소문자');
    expect(alert).toHaveTextContent('특수문자');
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('aria-invalid', 'true');
    expect(apiPost).not.toHaveBeenCalled();
  });

  test('빈 비밀번호는 정책 검사를 통과하고 등록 요청을 보낸다', async() => {
    await openCreateModal();
    setField(screen.getByLabelText('비밀번호'), '');
    setField(screen.getByPlaceholderText('이름을 입력하세요'), '홍길동');
    setField(screen.getByLabelText('이메일 *'), 'new@example.com');
    fireEvent.click(document.querySelector('[data-action="email-duplicate-check"]'));
    await screen.findByText('사용 가능한 이메일입니다.');

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalled();
    });
    const payload = apiPost.mock.calls[0][1];
    expect(payload.password).toBe('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('등록 실패 시 중복 등 서버 메시지를 일반 문구보다 먼저 보여 준다', async() => {
    const duplicateError = new Error('요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
    duplicateError.status = 409;
    duplicateError.response = { data: { message: DUPLICATE_MESSAGE } };

    const notices = [];
    const onNotice = (event) => notices.push(event.detail);
    window.addEventListener('showNotification', onNotice);

    await openCreateModal();
    setField(screen.getByLabelText('비밀번호'), COMPLIANT_PASSWORD);
    setField(screen.getByPlaceholderText('이름을 입력하세요'), '홍길동');
    setField(screen.getByLabelText('이메일 *'), 'new@example.com');
    fireEvent.click(document.querySelector('[data-action="email-duplicate-check"]'));
    await screen.findByText('사용 가능한 이메일입니다.');
    apiPost.mockReset();
    apiPost.mockRejectedValue(duplicateError);
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    const pending = apiPost.mock.results[apiPost.mock.results.length - 1]?.value;
    await act(async() => {
      if (pending && typeof pending.then === 'function') {
        await pending.catch(() => undefined);
      }
    });

    expect(notices.some((notice) => notice.message === DUPLICATE_MESSAGE)).toBe(true);
    expect(notices.some((notice) => notice.message === '상담사 등록 중 오류가 발생했습니다.')).toBe(false);
    window.removeEventListener('showNotification', onNotice);
  });

  test('일반 500 문구만 오면 등록 일반 오류를 보여 준다', async() => {
    const genericError = new Error(SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE);
    genericError.status = 500;
    genericError.response = { data: { message: SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE } };

    const notices = [];
    const onNotice = (event) => notices.push(event.detail);
    window.addEventListener('showNotification', onNotice);

    await openCreateModal();
    setField(screen.getByLabelText('비밀번호'), COMPLIANT_PASSWORD);
    setField(screen.getByPlaceholderText('이름을 입력하세요'), '홍길동');
    setField(screen.getByLabelText('이메일 *'), 'new@example.com');
    fireEvent.click(document.querySelector('[data-action="email-duplicate-check"]'));
    await screen.findByText('사용 가능한 이메일입니다.');
    apiPost.mockReset();
    apiPost.mockRejectedValue(genericError);
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    const pending = apiPost.mock.results[apiPost.mock.results.length - 1]?.value;
    await act(async() => {
      if (pending && typeof pending.then === 'function') {
        await pending.catch(() => undefined);
      }
    });

    expect(notices.some((notice) => notice.message === '상담사 등록 중 오류가 발생했습니다.')).toBe(true);
    expect(notices.some((notice) => notice.message === SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE)).toBe(false);
    window.removeEventListener('showNotification', onNotice);
  });
});
