/**
 * MappingScheduleSidePeekContent — 가계약 패키지 변경 CTA (Side Peek)
 *
 * @author CoreSolution
 * @since 2026-09-04
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MappingScheduleSidePeekContent, {
  canChangePendingPackage
} from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import { USER_ROLES } from '../../../../constants/roles';
import { MAPPING_STATUS, PAYMENT_STATUS } from '../../../../constants/mapping';
import StandardizedApi from '../../../../utils/standardizedApi';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v, fallback = '') => (v == null || v === '' ? fallback : String(v)),
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
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock('../../../../utils/sessionSuccessionOptions', () => ({
  __esModule: true,
  mapSessionSuccessionConsultantOptions: () => []
}));

describe('canChangePendingPackage', () => {
  const pendingMapping = {
    id: 1,
    status: MAPPING_STATUS.PENDING_PAYMENT,
    paymentStatus: PAYMENT_STATUS.PENDING
  };

  it('ADMIN/STAFF + PENDING_PAYMENT(+PENDING)만 true', () => {
    expect(canChangePendingPackage(pendingMapping, USER_ROLES.ADMIN)).toBe(true);
    expect(canChangePendingPackage(pendingMapping, USER_ROLES.STAFF)).toBe(true);
  });

  it('CONSULTANT는 fail-closed', () => {
    expect(canChangePendingPackage(pendingMapping, USER_ROLES.CONSULTANT)).toBe(false);
  });

  it('ACTIVE / TERMINATED / CANCELLED / PAYMENT_CONFIRMED는 CTA 불가', () => {
    expect(canChangePendingPackage(
      { ...pendingMapping, status: MAPPING_STATUS.ACTIVE },
      USER_ROLES.ADMIN
    )).toBe(false);
    expect(canChangePendingPackage(
      { ...pendingMapping, status: MAPPING_STATUS.TERMINATED },
      USER_ROLES.ADMIN
    )).toBe(false);
    expect(canChangePendingPackage(
      { ...pendingMapping, status: MAPPING_STATUS.CANCELLED },
      USER_ROLES.ADMIN
    )).toBe(false);
    expect(canChangePendingPackage(
      { ...pendingMapping, status: MAPPING_STATUS.PAYMENT_CONFIRMED },
      USER_ROLES.ADMIN
    )).toBe(false);
  });

  it('PENDING_PAYMENT이지만 paymentStatus≠PENDING이면 거부', () => {
    expect(canChangePendingPackage(
      { ...pendingMapping, paymentStatus: PAYMENT_STATUS.CONFIRMED },
      USER_ROLES.ADMIN
    )).toBe(false);
  });
});

describe('MappingScheduleSidePeekContent pending package CTA', () => {
  const pendingMapping = {
    id: 77,
    clientId: 10,
    clientName: '홍길동',
    consultantId: 11,
    consultantName: '김상담',
    status: MAPPING_STATUS.PENDING_PAYMENT,
    paymentStatus: PAYMENT_STATUS.PENDING,
    remainingSessions: 0,
    packageName: '단회기'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue({ consultants: [] });
  });

  it('ADMIN PENDING_PAYMENT — 패키지 변경 CTA 노출 및 onChangePendingPackage 호출', () => {
    const onChangePendingPackage = jest.fn();
    render(
      <MappingScheduleSidePeekContent
        mapping={pendingMapping}
        userRole={USER_ROLES.ADMIN}
        onChangePendingPackage={onChangePendingPackage}
      />
    );

    const cta = screen.getByTestId('side-peek-change-pending-package');
    fireEvent.click(cta);
    expect(onChangePendingPackage).toHaveBeenCalledWith(pendingMapping);
  });

  it('CONSULTANT — 패키지 변경 CTA 미노출', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={pendingMapping}
        userRole={USER_ROLES.CONSULTANT}
        onChangePendingPackage={jest.fn()}
      />
    );
    expect(screen.queryByTestId('side-peek-change-pending-package')).not.toBeInTheDocument();
  });

  it('ACTIVE — 패키지 변경 CTA 미노출', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={{ ...pendingMapping, status: MAPPING_STATUS.ACTIVE }}
        userRole={USER_ROLES.ADMIN}
        onChangePendingPackage={jest.fn()}
      />
    );
    expect(screen.queryByTestId('side-peek-change-pending-package')).not.toBeInTheDocument();
  });

  it('PUT 경로를 패키지 CTA로 호출하지 않음', () => {
    const onChangePendingPackage = jest.fn();
    render(
      <MappingScheduleSidePeekContent
        mapping={pendingMapping}
        userRole={USER_ROLES.ADMIN}
        onChangePendingPackage={onChangePendingPackage}
      />
    );
    fireEvent.click(screen.getByTestId('side-peek-change-pending-package'));
    expect(StandardizedApi.put).not.toHaveBeenCalled();
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });
});
