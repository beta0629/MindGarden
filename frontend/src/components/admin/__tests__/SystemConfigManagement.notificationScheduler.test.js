/**
 * SystemConfigManagement — PR-2 알림 자동 발송 스케줄러 4 종 토글 섹션 테스트.
 *
 * - 섹션 렌더링 (4 토글 + 라벨 + 마지막 변경자/시각)
 * - 토글 클릭 → UnifiedModal(역할: dialog) 노출 → 확인/취소 흐름
 * - 확인 시 StandardizedApi.put 단일 키 PUT + 4 키 재조회 + 토스트
 * - 키별 status 라벨(켜짐/꺼짐) + role="switch" + aria-checked 동기화
 *
 * @author MindGarden
 * @since 2026-05-25
 */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SystemConfigManagement from '../SystemConfigManagement';

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn().mockResolvedValue({ success: true, configValue: '' }),
  apiPost: jest.fn().mockResolvedValue({ success: true }),
  apiPut: jest.fn().mockResolvedValue({ success: true }),
  apiPatch: jest.fn().mockResolvedValue({ success: true }),
  apiDelete: jest.fn().mockResolvedValue({ success: true }),
  apiPostFormData: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ success: true }),
    put: jest.fn(),
    patch: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true })
  }
}));
import StandardizedApi from '../../../utils/standardizedApi';
const mockStandardizedApi = StandardizedApi;

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getCommonCodes: jest.fn().mockResolvedValue([])
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, defOrOpts, opts) => {
      const hasDefault = typeof defOrOpts === 'string';
      const fallback = hasDefault ? defOrOpts : key;
      const variables = hasDefault ? (opts || {}) : (defOrOpts || {});
      return Object.entries(variables).reduce(
        (acc, [name, value]) => acc.replace(new RegExp(`{{${name}}}`, 'g'), String(value)),
        fallback
      );
    }
  })
}));

const sessionState = {
  user: { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-pr2-toggle' },
  isLoggedIn: true,
  hasCheckedSession: true
};
jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => sessionState,
  SessionContext: { Provider: ({ children }) => children, _currentValue: null }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));
import notificationManager from '../../../utils/notification';
const notificationShow = notificationManager.show;

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-common-layout">{children}</div>
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions, title, subtitle }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {subtitle ? <p data-testid="modal-subtitle">{subtitle}</p> : null}
        <div data-testid="modal-body">{children}</div>
        <div data-testid="modal-actions">{actions}</div>
      </div>
    ) : null
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button', loading, ...rest }) => (
    // eslint-disable-next-line react/button-has-type
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </button>
  )
}));

jest.mock('../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <section data-testid="content-area">{children}</section>
}));

jest.mock('../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, actions }) => (
    <header data-testid="content-header">
      <h1>{title}</h1>
      {actions}
    </header>
  )
}));

jest.mock('../../common/ChipMultiSelect', () => ({
  __esModule: true,
  default: () => <div data-testid="chip-multi-select" />
}));

const FLAG_KEY_WELLNESS = 'notification.scheduler.wellness-tip.enabled';
const FLAG_KEY_RECORD = 'notification.scheduler.consultation-record-alert.enabled';
const FLAG_KEY_WORKFLOW = 'notification.scheduler.workflow-automation.enabled';
const FLAG_KEY_RESERVATION = 'notification.scheduler.reservation-reminder.enabled';

const buildFlagsResponse = (overrides = {}) => ({
  success: true,
  flags: [
    {
      key: FLAG_KEY_WELLNESS,
      value: true,
      description: '웰니스 팁 자동 발송 ON/OFF',
      updatedBy: 'SYSTEM',
      updatedAt: '2026-05-25T08:00:00',
      ...overrides[FLAG_KEY_WELLNESS]
    },
    {
      key: FLAG_KEY_RECORD,
      value: false,
      description: '상담일지 미작성 알림 ON/OFF',
      updatedBy: 'admin@example.com',
      updatedAt: '2026-05-25T09:30:00',
      ...overrides[FLAG_KEY_RECORD]
    },
    {
      key: FLAG_KEY_WORKFLOW,
      value: true,
      description: '워크플로우 자동화 4종 ON/OFF',
      updatedBy: 'SYSTEM',
      updatedAt: '2026-05-25T08:00:00',
      ...overrides[FLAG_KEY_WORKFLOW]
    },
    {
      key: FLAG_KEY_RESERVATION,
      value: true,
      description: '예약 D-2 안내 일괄 발송 ON/OFF',
      updatedBy: 'SYSTEM',
      updatedAt: '2026-05-25T08:00:00',
      ...overrides[FLAG_KEY_RESERVATION]
    }
  ]
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <SystemConfigManagement />
    </MemoryRouter>
  );

const waitForLoaded = async() => {
  await waitFor(() => {
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
  });
};

const findToggleByLabel = async(labelText) => {
  // 토글 섹션에서 라벨 텍스트가 포함된 li 의 role="switch" 버튼 반환
  const labelNode = await screen.findByText(labelText);
  const li = labelNode.closest('li');
  if (!li) {
    throw new Error(`li parent not found for label: ${labelText}`);
  }
  return within(li).getByRole('switch');
};

describe('SystemConfigManagement — PR-2 알림 자동 발송 스케줄러 토글 섹션', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionState.hasCheckedSession = true;
    sessionState.isLoggedIn = true;
    sessionState.user = { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-pr2-toggle' };
    mockStandardizedApi.get.mockResolvedValue(buildFlagsResponse());
    mockStandardizedApi.put.mockResolvedValue({ success: true, flag: null });
  });

  it('마운트 시 GET /api/v1/admin/notification-scheduler/flags 1 회 호출', async() => {
    renderPage();
    await waitForLoaded();

    expect(mockStandardizedApi.get).toHaveBeenCalledWith('/api/v1/admin/notification-scheduler/flags');
    expect(mockStandardizedApi.get).toHaveBeenCalledTimes(1);
  });

  it('4 종 토글 라벨이 모두 렌더링되고 status(켜짐/꺼짐) 도 동기화된다', async() => {
    renderPage();
    await waitForLoaded();

    expect(await screen.findByText('웰니스 일일 팁')).toBeInTheDocument();
    expect(screen.getByText('상담 기록 미작성 알림')).toBeInTheDocument();
    expect(screen.getByText('워크플로우 자동화')).toBeInTheDocument();
    expect(screen.getByText('예약 D-1·D-2 리마인더')).toBeInTheDocument();

    const wellnessSwitch = await findToggleByLabel('웰니스 일일 팁');
    expect(wellnessSwitch).toHaveAttribute('aria-checked', 'true');
    const recordSwitch = await findToggleByLabel('상담 기록 미작성 알림');
    expect(recordSwitch).toHaveAttribute('aria-checked', 'false');
  });

  it('마지막 변경자/시각이 켜짐 항목에 포함되고, 변경 이력 없을 때는 fallback 표시', async() => {
    mockStandardizedApi.get.mockResolvedValueOnce(
      buildFlagsResponse({
        [FLAG_KEY_WORKFLOW]: { updatedBy: '', updatedAt: '' }
      })
    );

    renderPage();
    await waitForLoaded();

    // 웰니스 + 예약 리마인더 = SYSTEM 변경 이력 (2 건). 워크플로우 = 이력 없음.
    const systemMetas = await screen.findAllByText(/마지막 변경: SYSTEM/);
    expect(systemMetas.length).toBe(2);
    expect(screen.getByText(/마지막 변경: admin@example.com/)).toBeInTheDocument();
    expect(screen.getByText('마지막 변경 이력 없음')).toBeInTheDocument();
  });

  it('OFF→ON 토글 클릭 → confirmOn 모달 → 확인 시 PUT + 재조회 + 토스트', async() => {
    mockStandardizedApi.put.mockResolvedValueOnce({
      success: true,
      flag: {
        key: FLAG_KEY_RECORD,
        value: true,
        description: '상담일지 미작성 알림 ON/OFF',
        updatedBy: 'admin@example.com',
        updatedAt: '2026-05-25T10:00:00'
      }
    });
    mockStandardizedApi.get
      .mockResolvedValueOnce(buildFlagsResponse())
      .mockResolvedValueOnce(
        buildFlagsResponse({
          [FLAG_KEY_RECORD]: { value: true, updatedAt: '2026-05-25T10:00:00' }
        })
      );

    renderPage();
    await waitForLoaded();

    const recordSwitch = await findToggleByLabel('상담 기록 미작성 알림');
    fireEvent.click(recordSwitch);

    const dialog = await screen.findByRole('dialog', { name: /자동 발송 토글 확인/ });
    expect(within(dialog).getByText(/켜면 다음 cron 시점부터 자동 발송됩니다/)).toBeInTheDocument();
    expect(within(dialog).getByTestId('modal-subtitle')).toHaveTextContent('상담 기록 미작성 알림');

    fireEvent.click(within(dialog).getByText('확인'));

    await waitFor(() => {
      expect(mockStandardizedApi.put).toHaveBeenCalledWith(
        `/api/v1/admin/notification-scheduler/flags/${encodeURIComponent(FLAG_KEY_RECORD)}`,
        { value: true }
      );
    });
    await waitFor(() => {
      expect(mockStandardizedApi.get).toHaveBeenCalledTimes(2);
    });
    expect(notificationShow).toHaveBeenCalledWith(
      '스케줄러 플래그가 저장되었습니다.',
      'success'
    );
  });

  it('ON→OFF 토글 → confirmOff 모달 → 확인 시 PUT { value: false }', async() => {
    mockStandardizedApi.put.mockResolvedValueOnce({
      success: true,
      flag: {
        key: FLAG_KEY_WELLNESS,
        value: false,
        updatedBy: 'admin@example.com',
        updatedAt: '2026-05-25T10:30:00'
      }
    });

    renderPage();
    await waitForLoaded();

    const wellnessSwitch = await findToggleByLabel('웰니스 일일 팁');
    fireEvent.click(wellnessSwitch);

    const dialog = await screen.findByRole('dialog', { name: /자동 발송 토글 확인/ });
    expect(within(dialog).getByText(/끄면 자동 발송이 즉시 중단됩니다/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByText('확인'));

    await waitFor(() => {
      expect(mockStandardizedApi.put).toHaveBeenCalledWith(
        `/api/v1/admin/notification-scheduler/flags/${encodeURIComponent(FLAG_KEY_WELLNESS)}`,
        { value: false }
      );
    });
  });

  it('취소 시 모달이 닫히고 PUT 호출이 발생하지 않는다', async() => {
    renderPage();
    await waitForLoaded();

    const wellnessSwitch = await findToggleByLabel('웰니스 일일 팁');
    fireEvent.click(wellnessSwitch);

    const dialog = await screen.findByRole('dialog', { name: /자동 발송 토글 확인/ });
    fireEvent.click(within(dialog).getByText('취소'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /자동 발송 토글 확인/ })).not.toBeInTheDocument();
    });
    expect(mockStandardizedApi.put).not.toHaveBeenCalled();
  });

  it('PUT 실패 시 에러 토스트 + 모달은 유지 (재시도/취소 결정 가능)', async() => {
    mockStandardizedApi.put.mockRejectedValueOnce(
      Object.assign(new Error('test'), { data: { message: '백엔드 거부' } })
    );

    renderPage();
    await waitForLoaded();

    fireEvent.click(await findToggleByLabel('웰니스 일일 팁'));
    const dialog = await screen.findByRole('dialog', { name: /자동 발송 토글 확인/ });
    fireEvent.click(within(dialog).getByText('확인'));

    await waitFor(() => {
      expect(notificationShow).toHaveBeenCalledWith('백엔드 거부', 'error');
    });
    expect(screen.queryByRole('dialog', { name: /자동 발송 토글 확인/ })).toBeInTheDocument();
  });

  it('초기 GET 실패 시 에러 토스트 + 토글은 fallback OFF 표시', async() => {
    mockStandardizedApi.get.mockRejectedValueOnce(new Error('network'));

    renderPage();
    await waitForLoaded();

    expect(notificationShow).toHaveBeenCalledWith(
      '스케줄러 플래그를 불러오지 못했습니다.',
      'error'
    );
    const wellnessSwitch = await findToggleByLabel('웰니스 일일 팁');
    expect(wellnessSwitch).toHaveAttribute('aria-checked', 'false');
  });
});
