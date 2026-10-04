import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ConsultationLogModal from '../ConsultationLogModal';
import { CONSULTATION_LOG_AUTOSAVE_STRINGS } from '../../../constants/consultationLogAutosaveStrings';

/**
 * 상담일지 모달 — 초안 복구 안내 닫기 = 「나중에」 (PR R · B3).
 *
 * <p>×·ESC·배경 클릭은 모두 ConfirmModal 의 {@code onClose} 로 온다. 이전에는 이 경로가 「버리기」로
 * 처리돼 서버 초안을 DELETE 했다. 이제 {@code onClose} 는 초안을 남기고, 서버 초안 삭제는
 * 「버리기」 버튼({@code onCancel})을 명시적으로 눌렀을 때만 일어난다.</p>
 */

const mockApiGet = jest.fn();
const mockDiscardDraft = jest.fn();
const mockResolveRestoreCandidate = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));
jest.mock('../../../i18n', () => ({ t: (key) => key }));
jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 7, role: 'CONSULTANT', tenantId: 'tenant-a' } })
}));
jest.mock('../../../utils/ajax', () => ({
  apiGet: (...args) => mockApiGet(...args),
  apiPost: jest.fn(),
  apiPut: jest.fn()
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
  default: { show: jest.fn() }
}));
jest.mock('../../../hooks/useConsultationLogDraftAutosave', () => ({
  DRAFT_AUTOSAVE_STATUS: { IDLE: 'IDLE', SAVING: 'SAVING', SAVED: 'SAVED', ERROR: 'ERROR' },
  formatDraftSavedAtLabel: () => '',
  useConsultationLogDraftAutosave: (args) => {
    const mockReact = jest.requireActual('react');
    const firedRef = mockReact.useRef(false);
    mockReact.useEffect(() => {
      if (args.enabled && !firedRef.current) {
        firedRef.current = true;
        args.onRestoreCandidate?.({
          snapshot: { formData: { mainIssues: '서버 초안' } },
          savedAt: Date.now(),
          source: 'server'
        });
      }
    }, [args.enabled, args.onRestoreCandidate]);
    return {
      status: 'IDLE',
      savedAtLabel: '',
      notifyDirty: jest.fn(),
      saveNow: jest.fn(),
      discardDraft: mockDiscardDraft,
      resolveRestoreCandidate: mockResolveRestoreCandidate,
      loadLatestFromServer: jest.fn(),
      keepMineOnConflict: jest.fn()
    };
  }
}));
jest.mock('../../../hooks/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: () => ({ blocker: null, releaseGuard: jest.fn() })
}));
jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children }) => (isOpen ? <div data-testid="unified-modal">{children}</div> : null)
}));
// 실제 ConfirmModal 과 같은 배선: 확인 = onConfirm 후 onClose, 취소 버튼 = onCancel ?? onClose, ×·ESC·배경 = onClose
jest.mock('../../common/ConfirmModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, onConfirm, onClose, onCancel, cancelText }) => (isOpen ? (
    <div role="dialog" aria-label={title}>
      <button type="button" onClick={() => { onConfirm?.(); onClose?.(); }}>확인</button>
      <button type="button" onClick={onCancel || onClose}>{cancelText}</button>
      <button type="button" aria-label="닫기(×·ESC·배경)" onClick={onClose}>×</button>
    </div>
  ) : null)
}));
jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children }) => <button type="button">{children}</button>
}));
jest.mock('../organisms/ConsultationLogClientProfilePanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../organisms/ConsultationLogPrecautionsPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../molecules/ConsultationLogSessionHeaderMeta', () => ({ __esModule: true, default: () => null }));
jest.mock('../molecules/ConsultationLogRequiredFieldsNotice', () => ({ __esModule: true, default: () => null }));
jest.mock('../organisms/ConsultationLogFormPanel', () => ({
  __esModule: true,
  default: ({ formData }) => <div data-testid="form-panel">{`mainIssues=${formData?.mainIssues ?? ''}`}</div>
}));

const RECORD_ID = 502;
const RESTORE_TITLE = CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_TITLE;

const openWithRestorePrompt = async() => {
  render(<ConsultationLogModal isOpen recordId={RECORD_ID} onClose={jest.fn()} />);
  await waitFor(() => expect(screen.getByRole('dialog', { name: RESTORE_TITLE })).toBeInTheDocument());
};

describe('ConsultationLogModal — 초안 복구 안내 닫기는 「나중에」', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockDiscardDraft.mockReset();
    mockResolveRestoreCandidate.mockReset();
    mockApiGet.mockImplementation((url) => {
      if (String(url).includes(`/consultation-records/${RECORD_ID}`)) {
        return Promise.resolve({
          id: RECORD_ID, consultationId: 900, sessionNumber: 2, sessionDate: '2026-10-04',
          mainIssues: '확정본', updatedAt: '2026-10-04T10:00:00'
        });
      }
      return Promise.resolve({ success: true, data: [] });
    });
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn(),
      addListener: jest.fn(), removeListener: jest.fn()
    });
  });

  it('×·ESC·배경 클릭(onClose) — 안내만 닫히고 서버 초안 DELETE 없음, 폼은 확정본 유지', async() => {
    await openWithRestorePrompt();
    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '닫기(×·ESC·배경)' }));
    });
    expect(screen.queryByRole('dialog', { name: RESTORE_TITLE })).not.toBeInTheDocument();
    expect(mockDiscardDraft).not.toHaveBeenCalled();
    expect(screen.getByTestId('form-panel')).toHaveTextContent('mainIssues=확정본');
  });

  it('「버리기」 버튼을 명시적으로 눌렀을 때만 서버 초안을 삭제한다', async() => {
    await openWithRestorePrompt();
    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_DISCARD }));
    });
    expect(mockDiscardDraft).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: RESTORE_TITLE })).not.toBeInTheDocument();
  });

  it('「불러오기」는 덮어쓰기 확인으로 넘어가고 초안을 지우지 않는다', async() => {
    await openWithRestorePrompt();
    await act(async() => {
      fireEvent.click(within(screen.getByRole('dialog', { name: RESTORE_TITLE })).getByRole('button', { name: '확인' }));
    });
    expect(mockDiscardDraft).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_OVERWRITE_TITLE }))
      .toBeInTheDocument();
  });
});
