/**
 * IntegratedMatchingSchedule — 결제 대기 매칭 취소(매칭 강제 종료·전액 환불)는 관리자에게만 노출.
 *
 * @author Core Solution
 * @since 2026-10-04
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { USER_ROLES } from '../../../../constants/roles';

let mockSessionUser = null;

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ mappings: [] }),
    post: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() }
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => ({ user: mockSessionUser }),
  SessionContext: { Provider: ({ children }) => children }
}));

jest.mock('@fullcalendar/interaction', () => {
  class MockDraggable {
    destroy() {}
  }
  return { __esModule: true, Draggable: MockDraggable };
});

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-loading" />
}));
jest.mock('../../../schedule/UnifiedScheduleComponent', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-schedule" />
}));
jest.mock('../../../schedule/ScheduleModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../MappingCreationModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../mapping/MappingPaymentModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../mapping/MappingDepositModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../mapping/CheckoutSameDayModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));
jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: () => <div />
}));
jest.mock('../integrated-schedule/organisms/MatchingScheduleSidebar', () => ({
  __esModule: true,
  default: ({ onCancelPendingMapping }) => (
    <div
      data-testid="matching-sidebar"
      data-has-cancel-pending={String(typeof onCancelPendingMapping === 'function')}
    />
  )
}));

import IntegratedMatchingSchedule from '../IntegratedMatchingSchedule';

const renderAs = async(role) => {
  mockSessionUser = { id: 1, name: 'tester', role };
  render(<IntegratedMatchingSchedule />);
  return waitFor(() => screen.getByTestId('matching-sidebar'));
};

describe('IntegratedMatchingSchedule.cancelPendingRole', () => {
  test('관리자 — 결제 대기 매칭 취소 액션 전달', async() => {
    const sidebar = await renderAs(USER_ROLES.ADMIN);
    expect(sidebar).toHaveAttribute('data-has-cancel-pending', 'true');
  });

  test.each([USER_ROLES.STAFF, USER_ROLES.CONSULTANT])('%s — 결제 대기 매칭 취소 숨김', async(role) => {
    const sidebar = await renderAs(role);
    expect(sidebar).toHaveAttribute('data-has-cancel-pending', 'false');
  });
});
