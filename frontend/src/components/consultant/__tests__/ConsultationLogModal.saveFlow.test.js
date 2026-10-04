import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConsultationLogModal from '../ConsultationLogModal';

/**
 * 상담일지 모달 — 일정 기준 저장 흐름(전체화면 라우트·대시보드 공용).
 *
 * <p>저장은 실제 일지 API({@code POST/PUT /api/v1/schedules/consultation-records}) 로만 한다. 작성자 기준 권한은
 * 서버(상담일지 접근 가드)가 판정하고, 확정 저장 후 서버 초안은 서비스가 같은 트랜잭션에서 지운다(#1409 후속).
 * 화면에서는 확정 저장 뒤 초안 정리(discardDraft)를 호출해야 한다.</p>
 */

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPut = jest.fn();
const mockDiscardDraft = jest.fn();
const mockValidate = jest.fn();
const mockNotify = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));
jest.mock('../../../i18n', () => ({ t: (key) => key }));
jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 7, role: 'CONSULTANT', tenantId: 'tenant-a' } })
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
  default: { show: (...args) => mockNotify(...args), error: (...args) => mockNotify(...args) }
}));
jest.mock('../../../utils/consultationLogFormValidation', () => ({
  buildConsultationLogFormMessages: () => ({ summary: 'required-summary' }),
  validateConsultationLogForm: (...args) => mockValidate(...args)
}));
jest.mock('../../../hooks/useConsultationLogDraftAutosave', () => ({
  DRAFT_AUTOSAVE_STATUS: { IDLE: 'IDLE', SAVING: 'SAVING', SAVED: 'SAVED', ERROR: 'ERROR' },
  formatDraftSavedAtLabel: () => '',
  useConsultationLogDraftAutosave: () => ({
    status: 'IDLE',
    savedAtLabel: '',
    conflictDetected: false,
    staleDraftSavedAt: null,
    notifyDirty: jest.fn(),
    saveNow: jest.fn(),
    saveDraftNow: jest.fn(),
    discardDraft: (...args) => mockDiscardDraft(...args),
    resolveRestoreCandidate: jest.fn(),
    loadLatestFromServer: jest.fn(),
    keepMineOnConflict: jest.fn()
  })
}));
jest.mock('../../../hooks/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: () => ({ blocker: null, releaseGuard: jest.fn() })
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
const SCHEDULE = {
  id: 900,
  clientId: null,
  consultantId: 7,
  date: '2026-10-04',
  sessionSequence: 3
};

/** 기존 일지 조회 결과를 지정한다 (없으면 신규 작성) */
const mockExistingRecords = (records) => {
  mockApiGet.mockImplementation((url) => {
    if (String(url).startsWith(`${RECORDS_API}?`)) {
      return Promise.resolve({ records });
    }
    return Promise.resolve({ success: true, data: [] });
  });
};

const renderReadyModal = async(props = {}) => {
  render(<ConsultationLogModal isOpen scheduleData={SCHEDULE} onClose={jest.fn()} {...props} />);
  await waitFor(() => expect(screen.getByTestId('form-panel')).toBeInTheDocument());
};

describe('ConsultationLogModal — 일정 기준 저장(생성·수정·완료)', () => {
  beforeEach(() => {
    [mockApiGet, mockApiPost, mockApiPut, mockDiscardDraft, mockValidate, mockNotify].forEach((m) => m.mockReset());
    mockValidate.mockReturnValue({});
    mockDiscardDraft.mockResolvedValue(undefined);
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    });
  });

  it('신규 저장은 실제 일지 생성 API 로 보내고, 같은 화면에서 다시 저장하면 방금 만든 일지를 수정한다', async() => {
    mockExistingRecords([]);
    mockApiPost.mockResolvedValue({ success: true, data: { id: 777, sessionNumber: 3 } });
    mockApiPut.mockResolvedValue({ success: true, data: { id: 777, sessionNumber: 3 } });
    await renderReadyModal();

    await act(async() => { fireEvent.click(screen.getByText('저장')); });

    expect(mockApiPost).toHaveBeenCalledTimes(1);
    const [url, body] = mockApiPost.mock.calls[0];
    expect(url).toBe(RECORDS_API);
    expect(body).toMatchObject({ consultationId: 900, scheduleId: 900, consultantId: 7, sessionNumber: 3 });
    expect(mockDiscardDraft).toHaveBeenCalledTimes(1);

    await act(async() => { fireEvent.click(screen.getByText('저장')); });

    expect(mockApiPost).toHaveBeenCalledTimes(1);
    expect(mockApiPut).toHaveBeenCalledWith(`${RECORDS_API}/777`, expect.objectContaining({ consultationId: 900 }));
  });

  it('기존 일지가 있으면 수정 API 만 호출한다', async() => {
    mockExistingRecords([{ id: 555, consultationId: 900, sessionNumber: 3, mainIssues: '기존 내용' }]);
    mockApiPut.mockResolvedValue({ success: true, data: { id: 555, sessionNumber: 3 } });
    await renderReadyModal();
    expect(screen.getByTestId('form-panel')).toHaveTextContent('mainIssues=기존 내용');

    await act(async() => { fireEvent.click(screen.getByText('저장')); });

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(mockApiPut).toHaveBeenCalledWith(`${RECORDS_API}/555`, expect.objectContaining({ consultationId: 900 }));
  });

  it('완료는 완료 플래그로 저장하고 초안을 정리한 뒤 닫는다', async() => {
    mockExistingRecords([]);
    mockApiPost.mockResolvedValue({ success: true, data: { id: 778, sessionNumber: 3 } });
    const onClose = jest.fn();
    await renderReadyModal({ onClose });

    await act(async() => { fireEvent.click(screen.getByText('완료')); });

    expect(mockApiPost).toHaveBeenCalledWith(RECORDS_API, expect.objectContaining({ isSessionCompleted: true }));
    expect(mockDiscardDraft).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('공용 검증(consultationLogFormValidation)에 걸리면 API 를 호출하지 않고 초안도 지우지 않는다', async() => {
    mockExistingRecords([]);
    mockValidate.mockReturnValue({ mainIssues: '필수' });
    await renderReadyModal();

    await act(async() => { fireEvent.click(screen.getByText('저장')); });

    expect(mockValidate).toHaveBeenCalled();
    expect(mockApiPost).not.toHaveBeenCalled();
    expect(mockApiPut).not.toHaveBeenCalled();
    expect(mockDiscardDraft).not.toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith('required-summary');
  });

  it('저장 API 가 실패하면 초안을 지우지 않는다', async() => {
    mockExistingRecords([]);
    mockApiPost.mockRejectedValue(Object.assign(new Error('server'), { status: 500 }));
    await renderReadyModal();

    await act(async() => { fireEvent.click(screen.getByText('저장')); });

    expect(mockApiPost).toHaveBeenCalledTimes(1);
    expect(mockDiscardDraft).not.toHaveBeenCalled();
  });
});
