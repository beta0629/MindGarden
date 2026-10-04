import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import ConsultationLogModal from '../ConsultationLogModal';
import { CONSULTATION_LOG_AUTOSAVE_STRINGS } from '../../../constants/consultationLogAutosaveStrings';

/**
 * 상담일지 모달 — 레코드 로드 vs 초안 조회 경합 회귀 테스트 (#1409 후속).
 *
 * <p>모달이 열린 직후 첫 페인트가 빈 formData 로 렌더돼 입력칸이 0자로 보였고,
 * 같은 창(로딩 false) 동안 초안 훅이 먼저 켜져 레코드 적용과 초안 복구 판단이 경쟁했다.
 * 로드가 끝날 때까지 폼을 그리지 않고, 초안 훅은 로드 완료 뒤에만 켜져야 한다.</p>
 */

const mockApiGet = jest.fn();
const mockDraftHookArgs = [];

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
    mockDraftHookArgs.push(args);
    return {
      status: 'IDLE',
      savedAtLabel: '',
      conflictDetected: false,
      staleDraftSavedAt: null,
      notifyDirty: jest.fn(),
      saveNow: jest.fn(),
      discardDraft: jest.fn(),
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
  default: ({ isOpen, children }) => (isOpen ? <div data-testid="unified-modal">{children}</div> : null)
}));
jest.mock('../../common/ConfirmModal', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children }) => <button type="button">{children}</button>
}));
jest.mock('../organisms/ConsultationLogClientProfilePanel', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../organisms/ConsultationLogPrecautionsPanel', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../molecules/ConsultationLogSessionHeaderMeta', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../molecules/ConsultationLogRequiredFieldsNotice', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../organisms/ConsultationLogFormPanel', () => ({
  __esModule: true,
  default: ({ formData }) => (
    <div data-testid="form-panel">{`mainIssues=${formData?.mainIssues ?? ''}`}</div>
  )
}));

const RECORD_ID = 501;
const RECORD_UPDATED_AT = '2026-10-04T10:00:00';

/** 레코드 상세만 지연시키고 나머지 조회는 즉시 빈 결과 */
const setupDeferredRecordLoad = () => {
  let resolveRecord;
  mockApiGet.mockImplementation((url) => {
    if (String(url).includes(`/consultation-records/${RECORD_ID}`)) {
      return new Promise((resolve) => { resolveRecord = resolve; });
    }
    return Promise.resolve({ success: true, data: [] });
  });
  return (record) => resolveRecord(record);
};

describe('ConsultationLogModal — 레코드 로드와 초안 조회 경합', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockDraftHookArgs.length = 0;
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    });
  });

  it('레코드 로드가 끝나기 전에는 빈 폼 대신 로딩을 보여 준다 (첫 페인트 포함)', () => {
    setupDeferredRecordLoad();
    render(<ConsultationLogModal isOpen recordId={RECORD_ID} onClose={jest.fn()} />);

    expect(screen.getByText(CONSULTATION_LOG_AUTOSAVE_STRINGS.FORM_LOADING)).toBeInTheDocument();
    expect(screen.queryByTestId('form-panel')).not.toBeInTheDocument();
  });

  it('초안 훅은 레코드 로드 완료 뒤에만 켜지고 확정본 updatedAt 을 함께 받는다', async() => {
    const resolveRecord = setupDeferredRecordLoad();
    render(<ConsultationLogModal isOpen recordId={RECORD_ID} onClose={jest.fn()} />);

    // 로드 중 렌더 전부에서 초안 훅이 꺼져 있어야 한다 — 레코드 반영 전 초안 판단 금지
    expect(mockDraftHookArgs.length).toBeGreaterThan(0);
    expect(mockDraftHookArgs.every((args) => args.enabled === false)).toBe(true);

    await act(async() => {
      resolveRecord({
        id: RECORD_ID,
        clientId: null,
        consultationId: 900,
        sessionNumber: 2,
        sessionDate: '2026-10-04',
        mainIssues: '불면 호소',
        updatedAt: RECORD_UPDATED_AT
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-panel')).toHaveTextContent('mainIssues=불면 호소');
    });
    expect(screen.queryByText(CONSULTATION_LOG_AUTOSAVE_STRINGS.FORM_LOADING)).not.toBeInTheDocument();

    const enabledCalls = mockDraftHookArgs.filter((args) => args.enabled === true);
    expect(enabledCalls.length).toBeGreaterThan(0);
    expect(enabledCalls[0].recordUpdatedAt).toBe(RECORD_UPDATED_AT);
  });

  it('폼이 처음 보일 때 이미 레코드 값이 채워져 있다 (0자 깜빡임 없음)', async() => {
    const resolveRecord = setupDeferredRecordLoad();
    const seen = [];
    const observer = new MutationObserver(() => {
      const panel = document.querySelector('[data-testid="form-panel"]');
      if (panel) seen.push(panel.textContent);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    render(<ConsultationLogModal isOpen recordId={RECORD_ID} onClose={jest.fn()} />);
    await act(async() => {
      resolveRecord({
        id: RECORD_ID,
        clientId: null,
        consultationId: 900,
        sessionNumber: 2,
        sessionDate: '2026-10-04',
        mainIssues: '불면 호소',
        updatedAt: RECORD_UPDATED_AT
      });
    });
    await waitFor(() => expect(screen.getByTestId('form-panel')).toBeInTheDocument());
    observer.disconnect();

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((text) => text === 'mainIssues=불면 호소')).toBe(true);
  });
});
