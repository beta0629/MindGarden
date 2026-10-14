/**
 * MappingScheduleSidePeekContent — 관리자 상태-only 「종료 처리」
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MappingScheduleSidePeekContent, {
  canCloseMappingStatus
} from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import { USER_ROLES } from '../../../../constants/roles';
import { MAPPING_STATUS } from '../../../../constants/mapping';
import { API_ENDPOINTS } from '../../../../constants/apiEndpoints';
import StandardizedApi from '../../../../utils/standardizedApi';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('../../../../utils/safeDisplay', () => {
  const actual = jest.requireActual('../../../../utils/safeDisplay');
  return {
    __esModule: true,
    ...actual,
    toDisplayString: (v, fallback = '') => (v == null || v === '' ? fallback : String(v)),
    toErrorMessage: (err, fallback) => err?.message || fallback
  };
});

jest.mock('../../../../utils/packagePricing', () => ({
  __esModule: true,
  parseCombinedPackageName: () => []
}));

jest.mock('../../../common/ActionButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, 'data-testid': testId }) => (
    <button type="button" data-testid={testId} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}));

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../../common/StatusBadge', () => ({
  __esModule: true,
  default: ({ status, children }) => (
    <span data-testid="status-badge" data-status={status}>{children ?? status}</span>
  )
}));

jest.mock('../../../../utils/codeHelper', () => ({
  __esModule: true,
  getMappingStatusKoreanNameSync: (status) => status || '—'
}));

jest.mock('../integrated-schedule/molecules/VehiclePlateQuickRegisterModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../session-transfer-history/SessionTransferHistorySection', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../integrated-schedule/molecules/SidePeekBillingScheduleAccordion', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../integrated-schedule/molecules/SidePeekMonthlyBillingSummary', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../common/CustomSelect', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, 'data-testid': testId }) => (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => '',
  ERP_MG_BUTTON_LOADING_TEXT: '저장 중'
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children, actions }) => (
    isOpen ? (
      <div data-testid="unified-modal">
        <h2>{title}</h2>
        {children}
        <div>{actions}</div>
      </div>
    ) : null
  )
}));

jest.mock('../../../../utils/sessionSuccessionOptions', () => ({
  __esModule: true,
  mapSessionSuccessionConsultantOptions: () => []
}));

const activeMapping = {
  id: 101,
  clientId: 1,
  clientName: '내담자',
  consultantId: 2,
  consultantName: '상담사',
  status: MAPPING_STATUS.ACTIVE,
  remainingSessions: 3,
  totalSessions: 10,
  packageName: '패키지'
};

describe('canCloseMappingStatus', () => {
  it('ADMIN + ACTIVE 만 true', () => {
    expect(canCloseMappingStatus(activeMapping, USER_ROLES.ADMIN)).toBe(true);
  });

  it('STAFF 는 false', () => {
    expect(canCloseMappingStatus(activeMapping, USER_ROLES.STAFF)).toBe(false);
  });

  it('TERMINATED/CANCELLED/SESSIONS_EXHAUSTED 는 false', () => {
    expect(canCloseMappingStatus(
      { ...activeMapping, status: MAPPING_STATUS.TERMINATED },
      USER_ROLES.ADMIN
    )).toBe(false);
    expect(canCloseMappingStatus(
      { ...activeMapping, status: MAPPING_STATUS.CANCELLED },
      USER_ROLES.ADMIN
    )).toBe(false);
    expect(canCloseMappingStatus(
      { ...activeMapping, status: MAPPING_STATUS.SESSIONS_EXHAUSTED },
      USER_ROLES.ADMIN
    )).toBe(false);
  });
});

describe('MappingScheduleSidePeekContent — status close', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue([]);
  });

  it('ADMIN + 열린 상태에 종료 처리 버튼 노출', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={activeMapping}
        userRole={USER_ROLES.ADMIN}
      />
    );
    expect(screen.getByTestId('side-peek-status-close')).toBeInTheDocument();
  });

  it('STAFF 또는 종료 상태에서는 버튼 숨김', () => {
    const { rerender } = render(
      <MappingScheduleSidePeekContent
        mapping={activeMapping}
        userRole={USER_ROLES.STAFF}
      />
    );
    expect(screen.queryByTestId('side-peek-status-close')).not.toBeInTheDocument();

    rerender(
      <MappingScheduleSidePeekContent
        mapping={{ ...activeMapping, status: MAPPING_STATUS.TERMINATED }}
        userRole={USER_ROLES.ADMIN}
      />
    );
    expect(screen.queryByTestId('side-peek-status-close')).not.toBeInTheDocument();
  });

  it('사유 없으면 submit 불가, 사유 있으면 STATUS_CLOSE API 호출', async() => {
    const onMappingStatusClosed = jest.fn();
    StandardizedApi.post.mockResolvedValue({ success: true });

    render(
      <MappingScheduleSidePeekContent
        mapping={activeMapping}
        userRole={USER_ROLES.ADMIN}
        onMappingStatusClosed={onMappingStatusClosed}
      />
    );

    fireEvent.click(screen.getByTestId('side-peek-status-close'));
    expect(screen.getByTestId('unified-modal')).toBeInTheDocument();
    expect(screen.getByTestId('side-peek-status-close-remaining')).toHaveTextContent('3');

    const submit = screen.getByTestId('side-peek-status-close-submit');
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId('side-peek-status-close-reason'), {
      target: { value: '상담 완료 상태 종료' }
    });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.MAPPINGS.STATUS_CLOSE(101),
        { reason: '상담 완료 상태 종료' }
      );
    });
    await waitFor(() => {
      expect(onMappingStatusClosed).toHaveBeenCalledWith(
        expect.objectContaining({ mappingId: 101, status: 'TERMINATED' })
      );
    });
  });
});
