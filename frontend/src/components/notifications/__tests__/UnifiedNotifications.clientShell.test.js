/**
 * 통합 알림 — 내담자 셸, 탭, 읽음 후 이동, 대상 없음 모달.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { USER_ROLES } from '../../../constants/roles';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import { CLIENT_NOTIFICATIONS_ENTRY_PATH, NOTIFICATION_PAGE_TEST_IDS } from '../../../constants/notificationTabs';
import UnifiedNotifications from '../UnifiedNotifications';
import { apiGet } from '../../../utils/ajax';
import StandardizedApi from '../../../utils/standardizedApi';

jest.mock('react-i18next', () => {
  const ko = require('../../../locales/ko/common.json');
  const lookup = (key) => {
    const path = String(key).replace(/^common:/, '').split('.');
    return path.reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), ko);
  };
  return {
    useTranslation: () => ({
      t: (key, vars) => {
        const raw = lookup(key);
        if (typeof raw !== 'string') {
          return String(key).endsWith('confirm') ? '확인' : key;
        }
        return raw.replace(/\{\{(\w+)\}\}/g, (_, name) => (
          vars && vars[name] != null ? String(vars[name]) : ''
        ));
      }
    })
  };
});

const mockSessionState = {
  user: null,
  isLoggedIn: false,
  setModalOpen: jest.fn()
};
const mockNotificationState = { markSystemNotificationAsRead: jest.fn(() => Promise.resolve()) };

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => mockSessionState
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => mockNotificationState
}));

jest.mock('../../../hooks/useTenantComponentFlags', () => ({
  useTenantComponentFlags: () => ({
    clientShopEnabled: true,
    loading: false,
    fetchFailed: false
  })
}));

jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn(), removeToast: jest.fn(), toasts: [] })
}));

jest.mock('../../../utils/safeHtml', () => ({
  sanitizeRichNoticeHtml: (html) => (html == null ? '' : String(html))
}));

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn()
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ title, children }) => (
    <div data-testid="admin-common-layout">
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({
    isOpen,
    title,
    subtitle,
    children,
    actions,
    closeChromeFree,
    closeContent,
    'data-testid': testId
  }) => (isOpen ? (
    <div role="dialog" data-testid={testId}>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
      {closeChromeFree ? (
        <button type="button" aria-label="닫기" data-gnb-chrome-free="true">{closeContent}</button>
      ) : null}
      {children}
      {actions}
    </div>
  ) : null)
}));

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location-probe">{`${location.pathname}${location.search}`}</output>;
};

const renderPage = (entry = '/notifications') => render(
  <MemoryRouter initialEntries={[entry]}>
    <UnifiedNotifications />
    <LocationProbe />
  </MemoryRouter>
);

const personalPayload = (notifications) => ({
  notifications,
  totalElements: notifications.length
});

beforeEach(() => {
  mockSessionState.user = { id: 7, role: USER_ROLES.CLIENT, name: '이내담' };
  mockSessionState.isLoggedIn = true;
  mockNotificationState.markSystemNotificationAsRead.mockClear();
  apiGet.mockResolvedValue({ notifications: [] });
  StandardizedApi.get.mockResolvedValue(personalPayload([]));
});

describe('UnifiedNotifications 셸', () => {
  test('내담자는 ClientWebPageShell, 상담사는 AdminCommonLayout', async() => {
    const { unmount } = renderPage();
    expect(await screen.findByText('공지와 메시지, 내 알림을 한곳에서 확인해요.')).toBeInTheDocument();
    expect(document.querySelector('.client-web-page-shell')).toBeTruthy();
    expect(screen.queryByTestId('admin-common-layout')).not.toBeInTheDocument();
    unmount();

    mockSessionState.user = { id: 8, role: 'CONSULTANT', name: '김상담' };
    renderPage();
    expect(await screen.findByTestId('admin-common-layout')).toBeInTheDocument();
    expect(document.querySelector('.client-web-page-shell')).toBeNull();
  });

  test('로그아웃 문구는 내담자 셸 안에 있다', () => {
    mockSessionState.user = null;
    mockSessionState.isLoggedIn = false;
    renderPage();
    expect(screen.getByTestId(NOTIFICATION_PAGE_TEST_IDS.LOGIN)).toHaveTextContent('로그인이 필요합니다.');
    expect(document.querySelector('.client-web-page-shell')).toBeTruthy();
  });
});

describe('UnifiedNotifications 내 알림', () => {
  test('좌우 키로 탭을 옮기고, 결제 알림은 읽음 후 결제 내역으로 간다', async() => {
    StandardizedApi.get.mockResolvedValue(personalPayload([
      {
        id: 41,
        isRead: false,
        metadata: {
          kind: 'PAYMENT_CONFIRMED',
          mappingId: 929,
          productName: '1000원_테스트',
          amount: 1000
        },
        createdAt: '2026-09-30T05:58:00'
      },
      {
        id: 42,
        isRead: true,
        title: '예전 알림',
        content: '본문만 있는 알림',
        createdAt: '2026-09-17T04:56:00'
      }
    ]));

    renderPage('/notifications?tab=personal');
    const payment = await screen.findByRole('button', { name: /결제 확인/ });
    expect(payment).toHaveTextContent('읽지 않은 알림');
    expect(payment).not.toHaveTextContent('안 읽음');
    expect(payment.querySelector('.notif-card__dot')).not.toBeNull();
    expect(payment.querySelector('.notif-card__unread')).toBeNull();
    expect(payment.querySelector('.notif-card__icon').className).toBe('notif-card__icon');
    expect(payment).toHaveTextContent('상품');
    expect(payment).toHaveTextContent('1,000원');
    expect(payment.className).toContain('notif-card--unread');
    expect(payment).toHaveAttribute('data-gnb-chrome-free', 'true');
    expect(screen.getByRole('tab', { name: '내 알림' })).toHaveAttribute('data-gnb-chrome-free', 'true');
    expect(screen.getByRole('tab', { name: '내 알림' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(payment);
    await waitFor(() => {
      expect(screen.getByTestId('location-probe')).toHaveTextContent(
        `${CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY}?mappingId=929`
      );
    });
    expect(mockNotificationState.markSystemNotificationAsRead).toHaveBeenCalledWith(41);

    const systemTab = screen.getByRole('tab', { name: '시스템 공지' });
    fireEvent.click(systemTab);
    fireEvent.keyDown(systemTab, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: '일반 메시지' })).toHaveAttribute('aria-selected', 'true');
  });

  test('이동 대상이 없으면 모달을 연다', async() => {
    StandardizedApi.get.mockResolvedValue(personalPayload([
      {
        id: 50,
        isRead: false,
        title: '안내',
        content: '결제가 확인됐어요.',
        createdAt: '2026-09-30T05:58:00'
      }
    ]));
    renderPage('/notifications?tab=personal');
    fireEvent.click(await screen.findByRole('button', { name: /안내/ }));
    const dialog = await screen.findByTestId(NOTIFICATION_PAGE_TEST_IDS.UNAVAILABLE);
    expect(dialog).toHaveTextContent('연결된 화면을 열 수 없어요');
    expect(dialog).toHaveTextContent('2026');
    expect(dialog).not.toHaveTextContent('관리자');
    expect(dialog).toHaveTextContent('결제가 확인됐어요.');
    const closeButton = screen.getByRole('button', { name: '닫기' });
    expect(closeButton).toHaveAttribute('data-gnb-chrome-free', 'true');
    expect(closeButton.querySelector('svg')).not.toBeNull();
    expect(screen.getByRole('button', { name: '확인' })).toHaveAttribute('data-gnb-chrome-free', 'true');
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/notifications?tab=personal');
    expect(mockNotificationState.markSystemNotificationAsRead).toHaveBeenCalledWith(50);
  });

  test('일정·메시지·웰니스·주문 알림은 보기 안내를 보여 준다', async() => {
    StandardizedApi.get.mockResolvedValue(personalPayload([
      {
        id: 61,
        isRead: true,
        notificationType: 'SCHEDULE',
        title: '일정 알림',
        content: '본문',
        createdAt: '2026-09-30T05:58:00'
      },
      {
        id: 62,
        isRead: true,
        notificationType: 'MESSAGE',
        title: '메시지 알림',
        content: '본문',
        createdAt: '2026-09-30T05:58:00'
      },
      {
        id: 63,
        isRead: true,
        notificationType: 'WELLNESS',
        title: '웰니스 알림',
        content: '본문',
        createdAt: '2026-09-30T05:58:00'
      },
      {
        id: 64,
        isRead: true,
        notificationType: 'SHOP_ORDER',
        title: '주문 알림',
        content: '본문',
        createdAt: '2026-09-30T05:58:00'
      }
    ]));
    renderPage('/notifications?tab=personal');
    expect(await screen.findByRole('button', { name: /일정 알림/ })).toHaveTextContent('일정 보기');
    expect(screen.getByRole('button', { name: /메시지 알림/ })).toHaveTextContent('메시지 보기');
    expect(screen.getByRole('button', { name: /웰니스 알림/ })).toHaveTextContent('웰니스 보기');
    expect(screen.getByRole('button', { name: /주문 알림/ })).toHaveTextContent('주문 보기');
    fireEvent.click(screen.getByRole('button', { name: /일정 알림/ }));
    await waitFor(() => {
      expect(screen.getByTestId('location-probe')).toHaveTextContent(CLIENT_DASHBOARD_ROUTES.SCHEDULE);
    });
  });

  test('GNB 딥링크는 공지 모달을 연 뒤 내담자 내 알림 주소로 바꾼다', async() => {
    apiGet.mockImplementation((url) => {
      if (String(url).includes('/api/v1/system-notifications/9')) {
        return Promise.resolve({
          id: 9,
          title: '점검 안내',
          content: '본문',
          publishedAt: '2026-10-01T09:00:00'
        });
      }
      return Promise.resolve({ notifications: [] });
    });
    render(
      <MemoryRouter initialEntries={[{
        pathname: '/client/dashboard',
        state: { openSystemNotificationId: 9 }
      }]}
      >
        <UnifiedNotifications />
        <LocationProbe />
      </MemoryRouter>
    );
    expect(await screen.findByRole('dialog')).toHaveTextContent('점검 안내');
    await waitFor(() => {
      expect(screen.getByTestId('location-probe')).toHaveTextContent(CLIENT_NOTIFICATIONS_ENTRY_PATH);
    });
    expect(screen.getByRole('tab', { name: '내 알림' })).toHaveAttribute('aria-selected', 'true');
  });

  test('상담사 GNB 딥링크는 쿼리 없는 /notifications 와 시스템 공지 탭을 유지한다', async() => {
    mockSessionState.user = { id: 3, role: 'CONSULTANT', name: '김상담' };
    apiGet.mockImplementation((url) => {
      if (String(url).includes('/api/v1/system-notifications/9')) {
        return Promise.resolve({
          id: 9,
          title: '점검 안내',
          content: '본문',
          publishedAt: '2026-10-01T09:00:00'
        });
      }
      return Promise.resolve({ notifications: [] });
    });
    render(
      <MemoryRouter initialEntries={[{
        pathname: '/consultant/dashboard',
        state: { openSystemNotificationId: 9 }
      }]}
      >
        <UnifiedNotifications />
        <LocationProbe />
      </MemoryRouter>
    );
    expect(await screen.findByRole('dialog')).toHaveTextContent('점검 안내');
    await waitFor(() => {
      expect(screen.getByTestId('location-probe')).toHaveTextContent('/notifications');
    });
    expect(screen.getByTestId('location-probe')).not.toHaveTextContent('tab=personal');
    expect(screen.getByRole('tab', { name: '시스템 공지' })).toHaveAttribute('aria-selected', 'true');
  });
});
