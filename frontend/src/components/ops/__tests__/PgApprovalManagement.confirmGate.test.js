/**
 * PgApprovalManagement — 승인/거부 ConfirmModal 게이트 단위 테스트 (SSOT).
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockConfirm = jest.fn();
const mockApprovePgConfiguration = jest.fn();
const mockRejectPgConfiguration = jest.fn();
const mockActivatePgConfiguration = jest.fn();
const mockGetPendingPgConfigurations = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => [mockConfirm, () => <div data-testid="confirm-modal" />]
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: { userId: 'ops-1', role: 'HQ_ADMIN' },
    isLoggedIn: true,
    isLoading: false
  })
}));

jest.mock('../../../utils/RoleUtils', () => ({
  __esModule: true,
  default: {
    isOps: () => true
  },
  isOps: () => true
}));

jest.mock('../../../utils/pgOpsApi', () => ({
  getPendingPgConfigurations: (...args) => mockGetPendingPgConfigurations(...args),
  getPgConfigurationDetailForOps: jest.fn(),
  approvePgConfiguration: (...args) => mockApprovePgConfiguration(...args),
  rejectPgConfiguration: (...args) => mockRejectPgConfiguration(...args),
  activatePgConfiguration: (...args) => mockActivatePgConfiguration(...args),
  testPgConnectionForOps: jest.fn(),
  decryptPgKeysForOps: jest.fn()
}));

jest.mock('../../../utils/portonePgSettingsJson', () => ({
  maskPortoneChannelKey: (v) => v || '-',
  parsePortoneSettingsJson: () => ({
    webhookSecret: '',
    channelKey: '',
    channelKeyTest: '',
    rest: {}
  })
}));

jest.mock('../../../utils/notification', () => ({
  showNotification: jest.fn()
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>
}));

jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children }) => <div>{children}</div>,
  ContentHeader: ({ title }) => <h1>{title}</h1>
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, type = 'button' }) => (
    <button type={type} onClick={onClick} disabled={disabled || loading}>
      {children}
    </button>
  )
}));

jest.mock('../../erp/common/erpMgButtonProps', () => ({
  buildErpMgButtonClassName: () => '',
  ERP_MG_BUTTON_LOADING_TEXT: 'loading'
}));

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>
}));

jest.mock('../../common/molecules/SettingSwitchRow', () => ({
  __esModule: true,
  default: ({ label, checked, onCheckedChange }) => (
    <label>
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
    </label>
  )
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children, actions }) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <div>{actions}</div>
      </div>
    ) : null
  )
}));

jest.mock('../../../utils/safeDisplay', () => ({
  toDisplayString: (v) => (v == null ? '' : String(v))
}));

jest.mock('../../../constants/icons', () => ({
  ICONS: {
    CHECK_CIRCLE: () => null,
    X_CIRCLE: () => null,
    CLOCK: () => null,
    SEARCH: () => null,
    ALERT_CIRCLE: () => null,
    KEY: () => null,
    EXTERNAL_LINK: () => null
  }
}));

jest.mock('../../../constants/billing', () => ({
  PG_PROVIDER_NAMES: {
    TOSS: 'TOSS',
    KAKAO: 'KAKAO',
    NAVER: 'NAVER',
    PAYPAL: 'PAYPAL',
    STRIPE: 'STRIPE',
    KICC: 'KICC'
  }
}));

jest.mock('../../../constants/kiccPgConfiguration', () => ({
  PG_PROVIDER_KICC: 'KICC'
}));

jest.mock('../../../constants/portonePgConfiguration', () => ({
  PG_PROVIDER_IAMPORT: 'IAMPORT',
  PG_PROVIDER_IAMPORT_DISPLAY_LABEL: 'PortOne'
}));

import PgApprovalManagement from '../PgApprovalManagement';
import { showNotification } from '../../../utils/notification';
import {
  PG_APPROVAL_COPY,
  maskMerchantId
} from '../../../constants/pgApproval';

const PENDING_CONFIG = {
  configId: 'cfg-1',
  pgName: '테스트 PG',
  pgProvider: 'TOSS',
  tenantId: 'center-1',
  merchantId: 'merchant12345678',
  testMode: true,
  requestedAt: '2026-09-01T00:00:00.000Z',
  requestedBy: 'admin',
  notes: ''
};

describe('PgApprovalManagement confirm gate (SSOT)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPendingPgConfigurations.mockResolvedValue([PENDING_CONFIG]);
    mockApprovePgConfiguration.mockResolvedValue({ success: true });
    mockActivatePgConfiguration.mockResolvedValue({ success: true });
    mockRejectPgConfiguration.mockResolvedValue({ success: true });
    mockConfirm.mockResolvedValue(true);
  });

  test('목록 Primary CTA 는 승인 검토·거부 검토이며 즉시 승인 문구가 없다', async() => {
    render(<PgApprovalManagement />);

    await waitFor(() => {
      expect(screen.getByText('테스트 PG')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', {
      name: 'common:ops.PgApprovalManagement.t_0d1cd671'
    })).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'common:ops.PgApprovalManagement.t_7ffb5a8b'
    })).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'common:ops.PgApprovalManagement.t_3da5c18d'
    })).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'common:ops.PgApprovalManagement.t_36fa7537'
    })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^승인$/ })).not.toBeInTheDocument();
  });

  test('승인: confirm false 이면 approve API를 호출하지 않는다', async() => {
    mockConfirm.mockResolvedValue(false);

    render(<PgApprovalManagement />);

    await waitFor(() => {
      expect(screen.getByText('테스트 PG')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'common:ops.PgApprovalManagement.t_0d1cd671' }));

    expect(screen.getByTestId('pg-approval-review-summary')).toBeInTheDocument();
    expect(screen.getByText('common:ops.PgApprovalManagement.t_result_active')).toBeInTheDocument();
    expect(screen.getAllByText(maskMerchantId(PENDING_CONFIG.merchantId)).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByRole('button', {
        name: 'common:ops.PgApprovalManagement.t_approve_proceed'
      })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', {
      name: 'common:ops.PgApprovalManagement.t_approve_proceed'
    }));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: PG_APPROVAL_COPY.CONFIRM_APPROVE_TITLE,
          confirmLabel: PG_APPROVAL_COPY.CONFIRM_APPROVE,
          cancelLabel: PG_APPROVAL_COPY.CANCEL,
          variant: 'warning'
        })
      );
    });
    const confirmArg = mockConfirm.mock.calls[0][0];
    expect(confirmArg.message).toBeTruthy();
    expect(mockApprovePgConfiguration).not.toHaveBeenCalled();
  });

  test('승인: confirm true 이면 approve API를 호출한다', async() => {
    mockConfirm.mockResolvedValue(true);

    render(<PgApprovalManagement />);

    await waitFor(() => {
      expect(screen.getByText('테스트 PG')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'common:ops.PgApprovalManagement.t_0d1cd671' }));
    await waitFor(() => {
      expect(screen.getByRole('button', {
        name: 'common:ops.PgApprovalManagement.t_approve_proceed'
      })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', {
      name: 'common:ops.PgApprovalManagement.t_approve_proceed'
    }));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockApprovePgConfiguration).toHaveBeenCalledWith(
        'cfg-1',
        expect.objectContaining({
          approvedBy: 'ops-1',
          testConnection: false
        })
      );
    });
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmLabel: PG_APPROVAL_COPY.CONFIRM_APPROVE
      })
    );
  });

  test('거부: confirm false 이면 reject API를 호출하지 않는다', async() => {
    mockConfirm.mockResolvedValue(false);

    render(<PgApprovalManagement />);

    await waitFor(() => {
      expect(screen.getByText('테스트 PG')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'common:ops.PgApprovalManagement.t_36fa7537' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/common:ops.PgApprovalManagement.t_9ec8e88f/)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/common:ops.PgApprovalManagement.t_9ec8e88f/), {
      target: { value: '사유가 충분히 길어야 합니다' }
    });

    await waitFor(() => {
      expect(screen.getByRole('button', {
        name: 'common:ops.PgApprovalManagement.t_reject_confirm'
      })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', {
      name: 'common:ops.PgApprovalManagement.t_reject_confirm'
    }));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: PG_APPROVAL_COPY.CONFIRM_REJECT_TITLE,
          confirmLabel: PG_APPROVAL_COPY.CONFIRM_REJECT,
          cancelLabel: PG_APPROVAL_COPY.CANCEL,
          variant: 'danger'
        })
      );
    });
    expect(mockRejectPgConfiguration).not.toHaveBeenCalled();
  });

  test('거부: confirm true 이면 reject API를 호출한다', async() => {
    mockConfirm.mockResolvedValue(true);

    render(<PgApprovalManagement />);

    await waitFor(() => {
      expect(screen.getByText('테스트 PG')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'common:ops.PgApprovalManagement.t_36fa7537' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/common:ops.PgApprovalManagement.t_9ec8e88f/)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/common:ops.PgApprovalManagement.t_9ec8e88f/), {
      target: { value: '사유가 충분히 길어야 합니다' }
    });

    await waitFor(() => {
      expect(screen.getByRole('button', {
        name: 'common:ops.PgApprovalManagement.t_reject_confirm'
      })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', {
      name: 'common:ops.PgApprovalManagement.t_reject_confirm'
    }));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockRejectPgConfiguration).toHaveBeenCalledWith(
        'cfg-1',
        expect.objectContaining({
          rejectedBy: 'ops-1',
          rejectionReason: '사유가 충분히 길어야 합니다'
        })
      );
    });
    expect(showNotification).toHaveBeenCalled();
  });
});
