/**
 * MappingScheduleSidePeekContent — EngagementTypeBadge 단일 렌더
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MappingScheduleSidePeekContent from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import { USER_ROLES } from '../../../../constants/roles';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v, fallback = '') => (v == null || v === '' ? fallback : String(v)),
  toSafeNumber: (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  },
  toErrorMessage: (err, fallback) => err?.message || fallback
}));

jest.mock('../../../../utils/packagePricing', () => ({
  __esModule: true,
  parseCombinedPackageName: (name) => (name ? [String(name)] : [])
}));

jest.mock('../../../common/ActionButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>{children}</button>
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
  default: ({ mappingId, clientId }) => (
    <section
      data-testid="session-transfer-history"
      data-mapping-id={mappingId}
      data-client-id={clientId}
    />
  )
}));

jest.mock('../../../common/CustomSelect', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, 'data-testid': testId }) => (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled || loading}
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
    get: jest.fn(() => Promise.resolve([])),
    put: jest.fn()
  }
}));

describe('MappingScheduleSidePeekContent engagement badge', () => {
  it('renders EngagementTypeBadge only once in status fact', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={{
          id: 1,
          clientName: '최가을',
          consultantName: '상담사',
          packageName: '단회기',
          status: 'ACTIVE',
          paymentTiming: 'INSTITUTION_LINK',
          remainingSessions: 0,
          clientCompletedConsultationCount: 3
        }}
        mappingStatusInfo={{
          ACTIVE: { label: '활성' }
        }}
        userRole={USER_ROLES.ADMIN}
      />
    );

    const badges = screen.getAllByTestId('engagement-type-badge');
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveTextContent('기관연동');
    expect(screen.getByTestId('side-peek-status-fact').querySelectorAll(
      '[data-testid="engagement-type-badge"]'
    )).toHaveLength(1);
    expect(screen.getByTestId('side-peek-sessions-fact')).toHaveTextContent('3');
  });
});
