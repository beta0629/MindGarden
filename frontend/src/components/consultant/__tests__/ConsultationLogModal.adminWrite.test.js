import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConsultationLogModal from '../ConsultationLogModal';

/**
 * 상담일지 모달 — 관리자 작성·수정 (같은 모달 재사용).
 *
 * <p>관리자 신규 작성은 일정의 담당 상담사를 consultantId 로 보내고(서버가 일정에서 다시 확정),
 * 서버 초안은 관리자 본인 id 로만 조회·저장한다. 관리자 수정은 관리자 수정 API 를 쓰고,
 * 관리자 작성·수정 이력 배지는 관리자 모달에만 보인다.</p>
 */

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPut = jest.fn();
const mockDraftHookArgs = jest.fn();
let mockSessionUser = { id: 1, role: 'ADMIN', tenantId: 'tenant-a' };

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));
jest.mock('../../../i18n', () => ({ t: (key) => key }));
jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: mockSessionUser })
}));
jest.mock('../../../utils/ajax', () => ({
  apiGet: (...args) => mockApiGet(...args),
  apiPost: (...args) => mockApiPost(...args),
  apiPut: (...args) => mockApiPut(...args)
}));
jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({})
  }
}));
jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), error: jest.fn() }
}));
jest.mock('../../../utils/consultationLogFormValidation', () => ({
  buildConsultationLogFormMessages: () => ({ summary: 'required-summary' }),
  validateConsultationLogForm: () => ({})
}));
jest.mock('../../../hooks/useConsultationLogDraftAutosave', () => ({
  DRAFT_AUTOSAVE_STATUS: { IDLE: 'IDLE', SAVING: 'SAVING', SAVED: 'SAVED', ERROR: 'ERROR' },
  formatDraftSavedAtLabel: () => '',
  useConsultationLogDraftAutosave: (args) => {
    mockDraftHookArgs(args);
    return {
      status: 'IDLE',
      savedAtLabel: '',
      notifyDirty: jest.fn(),
      saveNow: jest.fn(),
      discardDraft: jest.fn().mockResolvedValue(undefined),
      resolveRestoreCandidate: jest.fn(),
      loadLatestFromServer: jest.fn(),
      keepMineOnConflict: jest.fn()
    };
  }
}));
jest.mock('../../../hooks/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: () => ({ blocker: null })
}));
jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions }) => (isOpen ? (
    <div data-testid="unified-modal">{children}{actions}</div>
  ) : null)
}));
jest.mock('../../common/ConfirmModal', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled}>{children}</button>
  )
}));
jest.mock('../organisms/ConsultationLogClientProfilePanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../organisms/ConsultationLogPrecautionsPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../molecules/ConsultationLogSessionHeaderMeta', () => ({ __esModule: true, default: () => null }));
jest.mock('../molecules/ConsultationLogRequiredFieldsNotice', () => ({ __esModule: true, default: () => null }));
jest.mock('../organisms/ConsultationLogFormPanel', () => ({
  __esModule: true,
  default: ({ formData }) => <div data-testid="form-panel">{`mainIssues=${formData?.mainIssues ?? ''}`}</div>
}));

const RECORDS_API = '/api/v1/schedules/consultation-records';
const ADMIN_RECORDS_API = '/api/v1/admin/consultation-records';
const ADMIN_ID = 1;
const ASSIGNEE_ID = 7;
const SCHEDULE = {
  id: 900,
  clientId: null,
  consultantId: ASSIGNEE_ID,
  date: '2026-10-04',
  sessionSequence: 3
};
const ADMIN_EDITED_RECORD = {
  id: 555,
  consultationId: 900,
  consultantId: ASSIGNEE_ID,
  clientId: null,
  sessionNumber: 3,
  mainIssues: '기존 내용',
  writtenByAdmin: false,
  editedByAdmin: true,
  lastEditedById: ADMIN_ID,
  lastEditedByRole: 'ADMIN',
  lastEditedAt: '2026-10-05T14:30:00'
};

const lastDraftConsultantId = () => {
  const calls = mockDraftHookArgs.mock.calls;
  return calls[calls.length - 1][0].consultantId;
};

describe('ConsultationLogModal — 관리자 작성·수정', () => {
  beforeEach(() => {
    [mockApiGet, mockApiPost, mockApiPut, mockDraftHookArgs].forEach((m) => m.mockReset());
    mockSessionUser = { id: ADMIN_ID, role: 'ADMIN', tenantId: 'tenant-a' };
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    });
  });

  it('관리자 신규 작성: 담당 상담사를 consultantId 로 보내고 초안은 관리자 본인 id 로 다룬다', async() => {
    mockApiGet.mockImplementation((url) => (String(url).startsWith(`${RECORDS_API}?`)
      ? Promise.resolve({ records: [] })
      : Promise.resolve({ success: true, data: [] })));
    mockApiPost.mockResolvedValue({ success: true, data: { id: 777, sessionNumber: 3 } });

    render(<ConsultationLogModal isOpen isAdmin scheduleData={SCHEDULE} onClose={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('form-panel')).toBeInTheDocument());

    expect(lastDraftConsultantId()).toBe(ADMIN_ID);
    expect(screen.queryByTestId('consultation-log-admin-write-badge')).not.toBeInTheDocument();

    await act(async() => { fireEvent.click(screen.getByText('저장')); });

    expect(mockApiPost).toHaveBeenCalledTimes(1);
    const [url, body] = mockApiPost.mock.calls[0];
    expect(url).toBe(RECORDS_API);
    expect(body).toMatchObject({ consultationId: 900, consultantId: ASSIGNEE_ID });
  });

  it('관리자 수정: 관리자 수정 API 로 저장하고 「관리자 수정」 배지와 마지막 수정 시각을 보여 준다', async() => {
    mockApiGet.mockImplementation((url) => (url === `${ADMIN_RECORDS_API}/555`
      ? Promise.resolve({ success: true, data: ADMIN_EDITED_RECORD })
      : Promise.resolve({ success: true, data: [] })));
    mockApiPut.mockResolvedValue({ success: true, data: { ...ADMIN_EDITED_RECORD } });

    render(<ConsultationLogModal isOpen isAdmin recordId={555} onClose={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('form-panel')).toHaveTextContent('mainIssues=기존 내용'));

    const badge = screen.getByTestId('consultation-log-admin-write-badge');
    expect(badge).toHaveTextContent('관리자 수정');
    expect(badge).toHaveTextContent('관리자 · 2026-10-05 14:30');
    expect(lastDraftConsultantId()).toBe(ADMIN_ID);

    await act(async() => { fireEvent.click(screen.getByText('저장')); });

    expect(mockApiPut).toHaveBeenCalledWith(
      `${ADMIN_RECORDS_API}/555`,
      expect.objectContaining({ consultationId: 900 })
    );
  });

  it('상담사 모달은 배지 없이 기존과 같이 담당 상담사 id 로 초안을 다룬다', async() => {
    mockSessionUser = { id: ASSIGNEE_ID, role: 'CONSULTANT', tenantId: 'tenant-a' };
    mockApiGet.mockImplementation((url) => (String(url).startsWith(`${RECORDS_API}?`)
      ? Promise.resolve({ records: [ADMIN_EDITED_RECORD] })
      : Promise.resolve({ success: true, data: [] })));

    render(<ConsultationLogModal isOpen scheduleData={SCHEDULE} onClose={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('form-panel')).toHaveTextContent('mainIssues=기존 내용'));

    expect(screen.queryByTestId('consultation-log-admin-write-badge')).not.toBeInTheDocument();
    expect(lastDraftConsultantId()).toBe(ASSIGNEE_ID);
  });
});
