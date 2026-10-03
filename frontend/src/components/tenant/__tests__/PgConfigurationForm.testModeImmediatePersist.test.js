/**
 * PgConfigurationForm — testMode 는 폼 상태만 변경 (P1 보안 2026-10-03)
 *
 * 테넌트 PATCH /test-mode 는 서버에서 항상 403 이므로 즉시 PATCH 하지 않는다.
 * edit: 토글은 로컬 상태만 바꾸고, 저장(PUT) 시 재승인 요청으로 제출 — 안내 문구 노출.
 * IAMPORT OFF 시 라이브 channelKey 없으면 인라인 에러 + ON 유지.
 * create 모드: 로컬만 변경, PATCH 없음.
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PG_PROVIDER_IAMPORT } from '../../../constants/portonePgConfiguration';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => (key === 'common:tenant.PgConfigurationForm.t_cfd49442' ? '테스트 모드' : key),
    i18n: { language: 'ko' }
  })
}));

jest.mock('../../../utils/pgApi', () => ({
  __esModule: true,
  patchPgConfigurationTestMode: jest.fn(),
  testPgConnection: jest.fn()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  showNotification: jest.fn()
}));

jest.mock('../../../constants/icons', () => ({
  __esModule: true,
  ICONS: {
    CREDIT_CARD: () => <span data-testid="icon-card" />,
    ALERT_CIRCLE: () => <span data-testid="icon-alert" />,
    INFO: () => <span data-testid="icon-info" />
  }
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button', 'aria-label': ariaLabel }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  )
}));

jest.mock('../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>
}));

jest.mock('../PgConfigurationForm.css', () => ({}), { virtual: true });

import PgConfigurationForm, {
  PG_TEST_MODE_LIVE_CHANNEL_KEY_REQUIRED,
  PG_TEST_MODE_REAPPROVAL_NOTICE
} from '../PgConfigurationForm';
import { patchPgConfigurationTestMode } from '../../../utils/pgApi';
import { showNotification } from '../../../utils/notification';

const TENANT_ID = 'tenant-for-test';
const CONFIG_ID = 'cfg-test-mode-1';

const IAMPORT_INITIAL = {
  pgProvider: PG_PROVIDER_IAMPORT,
  pgName: '포트원',
  merchantId: '',
  storeId: 'store-1',
  webhookUrl: '',
  returnUrl: '',
  cancelUrl: '',
  testMode: true,
  settingsJson: JSON.stringify({
    portoneChannelKey: 'channel-key-live-xxxxx',
    portoneChannelKeyTest: 'channel-key-test-xxxxx'
  }),
  notes: '',
  approvalStatus: 'PENDING'
};

describe('PgConfigurationForm — testMode 폼 상태 전용 (PATCH 없음)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    patchPgConfigurationTestMode.mockResolvedValue({
      configId: CONFIG_ID,
      testMode: false,
      approvalStatus: 'PENDING'
    });
  });

  it('edit 모드에서 테스트 모드 OFF 시 PATCH 없이 로컬 상태만 반영하고 재승인 안내를 보인다', async() => {
    const onSave = jest.fn();
    render(
      <PgConfigurationForm
        mode="edit"
        tenantId={TENANT_ID}
        configId={CONFIG_ID}
        initialData={IAMPORT_INITIAL}
        onSave={onSave}
        onCancel={jest.fn()}
        hidePageTitle
      />
    );

    const sw = screen.getByRole('switch', { name: '테스트 모드' });
    expect(sw).toHaveAttribute('aria-checked', 'true');

    expect(screen.getByTestId('pg-test-mode-reapproval-notice'))
      .toHaveTextContent(PG_TEST_MODE_REAPPROVAL_NOTICE);

    fireEvent.click(sw);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: '테스트 모드' }))
        .toHaveAttribute('aria-checked', 'false');
    });
    expect(patchPgConfigurationTestMode).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('edit 모드에서 테스트 모드 ON 시에도 PATCH 를 호출하지 않는다', async() => {
    render(
      <PgConfigurationForm
        mode="edit"
        tenantId={TENANT_ID}
        configId={CONFIG_ID}
        initialData={{ ...IAMPORT_INITIAL, testMode: false }}
        onSave={jest.fn()}
        onCancel={jest.fn()}
        hidePageTitle
      />
    );

    fireEvent.click(screen.getByRole('switch', { name: '테스트 모드' }));

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: '테스트 모드' }))
        .toHaveAttribute('aria-checked', 'true');
    });
    expect(patchPgConfigurationTestMode).not.toHaveBeenCalled();
  });

  it('IAMPORT OFF 시 라이브 채널 키 없으면 PATCH 미호출·인라인 에러·ON 유지', async() => {
    render(
      <PgConfigurationForm
        mode="edit"
        tenantId={TENANT_ID}
        configId={CONFIG_ID}
        initialData={{
          ...IAMPORT_INITIAL,
          testMode: true,
          settingsJson: JSON.stringify({
            portoneChannelKeyTest: 'channel-key-test-xxxxx'
          })
        }}
        onSave={jest.fn()}
        onCancel={jest.fn()}
        hidePageTitle
      />
    );

    const sw = screen.getByRole('switch', { name: '테스트 모드' });
    expect(sw).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(sw);

    await waitFor(() => {
      expect(screen.getByTestId('pg-test-mode-error')).toHaveTextContent(
        PG_TEST_MODE_LIVE_CHANNEL_KEY_REQUIRED
      );
    });

    expect(patchPgConfigurationTestMode).not.toHaveBeenCalled();
    expect(screen.getByRole('switch', { name: '테스트 모드' }))
      .toHaveAttribute('aria-checked', 'true');
  });

  it('create 모드에서는 testMode 가 로컬만 변경되고 PATCH 를 호출하지 않는다', async() => {
    render(
      <PgConfigurationForm
        mode="create"
        tenantId={TENANT_ID}
        initialData={null}
        onSave={jest.fn()}
        onCancel={jest.fn()}
        hidePageTitle
      />
    );

    const switches = screen.getAllByRole('switch', { name: '테스트 모드' });
    expect(switches.length).toBeGreaterThan(0);
    // create 기본값은 testMode ON
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(switches[0]);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: '테스트 모드' }))
        .toHaveAttribute('aria-checked', 'false');
    });
    expect(patchPgConfigurationTestMode).not.toHaveBeenCalled();
    expect(screen.queryByTestId('pg-test-mode-reapproval-notice')).not.toBeInTheDocument();
  });
});
