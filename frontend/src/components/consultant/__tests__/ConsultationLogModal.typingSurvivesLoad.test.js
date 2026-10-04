import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConsultationLogModal from '../ConsultationLogModal';

/**
 * 상담일지 모달 — 폼이 입력 가능해진 직후 입력한 글자가 이후 비동기 응답에 덮이지 않아야 한다.
 */

const mockApiGet = jest.fn();
const mockStdGet = jest.fn();
const mockFetchDraft = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));
jest.mock('../../../i18n', () => ({ t: (key) => key }));
jest.mock('../../../contexts/SessionContext', () => {
  const ReactLib = jest.requireActual('react');
  const user = { id: 7, role: 'CONSULTANT', tenantId: 'tenant-test' };
  return {
    SessionContext: ReactLib.createContext({}),
    useSession: () => ({ user })
  };
});
jest.mock('../../../utils/ajax', () => ({
  apiGet: (...args) => mockApiGet(...args),
  apiPost: jest.fn(),
  apiPut: jest.fn()
}));
jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockStdGet(...args),
    put: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({})
  }
}));
jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), error: jest.fn() }
}));
jest.mock('../../../utils/consultationLogDraftServerAdapter', () => ({
  fetchConsultationLogDraftFromServer: (...args) => mockFetchDraft(...args),
  pushConsultationLogDraftToServer: jest.fn().mockResolvedValue({ ok: true }),
  deleteConsultationLogDraftOnServer: jest.fn().mockResolvedValue({ ok: true }),
  flushConsultationLogDraftWithKeepalive: jest.fn()
}));
jest.mock('../../../utils/consultationLogDraftBackupStore', () => ({
  readDraftBackup: jest.fn().mockResolvedValue(null),
  removeDraftBackup: jest.fn().mockResolvedValue(undefined),
  saveDraftBackup: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../../hooks/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: () => ({ blocker: null, releaseGuard: jest.fn() })
}));
jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions }) => (isOpen ? <div>{children}{actions}</div> : null)
}));
jest.mock('../../common/ConfirmModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../organisms/ConsultationLogClientProfilePanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../organisms/ConsultationLogPrecautionsPanel', () => ({ __esModule: true, default: () => null }));

const SCHEDULE = { id: 900, clientId: 20, consultantId: 7, date: '2026-10-05', sessionSequence: 1 };

/** 수동으로 풀 수 있는 응답 */
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};

describe('ConsultationLogModal — 입력 직후 글자 보존', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockStdGet.mockReset();
    mockFetchDraft.mockReset();
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  });

  it('폼이 보인 직후 입력한 내용이 늦게 끝나는 조회(공통코드·초안)에 덮이지 않는다', async() => {
    const codes = deferred();
    const draft = deferred();
    mockApiGet.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('common-codes') || u.includes('codes')) return codes.promise;
      if (u.includes('consultation-records')) return Promise.resolve({ records: [], content: [] });
      return Promise.resolve({ success: true, data: [] });
    });
    mockStdGet.mockResolvedValue({});
    mockFetchDraft.mockReturnValue(draft.promise);

    render(<ConsultationLogModal isOpen scheduleData={SCHEDULE} onClose={jest.fn()} />);

    const field = await screen.findByLabelText('common:consultant.ConsultationLogFormPanel.t_9ac70e52');
    fireEvent.change(field, { target: { name: 'clientCondition', value: '바로 입력한 내용' } });
    expect(field).toHaveValue('바로 입력한 내용');

    await act(async() => {
      codes.resolve({ codes: [] });
      draft.resolve({ ok: true, hasDraft: false });
    });
    await act(async() => { await new Promise((r) => setTimeout(r, 50)); });

    expect(screen.getByLabelText('common:consultant.ConsultationLogFormPanel.t_9ac70e52'))
      .toHaveValue('바로 입력한 내용');
  });

  it('부모가 같은 일정을 새 객체로 다시 넘겨도 다시 로드해 입력을 덮지 않는다', async() => {
    mockApiGet.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('consultation-records')) return Promise.resolve({ records: [], content: [] });
      return Promise.resolve({ codes: [], success: true, data: [] });
    });
    mockStdGet.mockResolvedValue({});
    mockFetchDraft.mockResolvedValue({ ok: true, hasDraft: false });

    const { rerender } = render(
      <ConsultationLogModal isOpen scheduleData={SCHEDULE} onClose={jest.fn()} />
    );
    const field = await screen.findByLabelText('common:consultant.ConsultationLogFormPanel.t_9ac70e52');
    fireEvent.change(field, { target: { name: 'clientCondition', value: '입력 중인 내용' } });
    const recordCallsBefore = mockApiGet.mock.calls.length;

    rerender(<ConsultationLogModal isOpen scheduleData={{ ...SCHEDULE }} onClose={jest.fn()} />);
    await act(async() => { await new Promise((r) => setTimeout(r, 50)); });

    expect(mockApiGet.mock.calls.length).toBe(recordCallsBefore);
    expect(screen.getByLabelText('common:consultant.ConsultationLogFormPanel.t_9ac70e52'))
      .toHaveValue('입력 중인 내용');
  });
});
