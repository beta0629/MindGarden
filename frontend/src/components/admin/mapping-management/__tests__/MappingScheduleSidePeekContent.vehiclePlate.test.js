/**
 * MappingScheduleSidePeekContent — 차량번호 표시·등록 CTA
 *
 * @author CoreSolution
 * @since 2026-08-13
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MappingScheduleSidePeekContent from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v, fallback = '') => (v == null || v === '' ? fallback : String(v))
}));

jest.mock('../../../../utils/packagePricing', () => ({
  __esModule: true,
  parseCombinedPackageName: () => []
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
  getMappingStatusKoreanNameSync: (status) => {
    const map = {
      PENDING_PAYMENT: '결제 대기',
      CANCELLED: '취소',
      ACTIVE: '활성'
    };
    return map[status] || status;
  }
}));

jest.mock('../integrated-schedule/molecules/VehiclePlateQuickRegisterModal', () => ({
  __esModule: true,
  default: ({ isOpen }) => (isOpen ? <div data-testid="vehicle-plate-modal" /> : null)
}));

describe('MappingScheduleSidePeekContent vehiclePlate', () => {
  const baseMapping = {
    id: 1,
    clientId: 10,
    clientName: '홍길동',
    consultantName: '김상담',
    status: 'ACTIVE',
    remainingSessions: 3,
    packageName: null
  };

  it('vehiclePlate가 있으면 fact로 표시한다', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={{ ...baseMapping, vehiclePlate: '12가 3456' }}
      />
    );
    expect(screen.getByText('12가 3456')).toBeInTheDocument();
    expect(screen.queryByText('admin:integratedSchedule.vehiclePlate.registerCta')).not.toBeInTheDocument();
  });

  it('vehiclePlate가 없으면 등록 CTA를 표시한다', () => {
    render(<MappingScheduleSidePeekContent mapping={baseMapping} />);
    expect(screen.getByText('admin:integratedSchedule.vehiclePlate.registerCta')).toBeInTheDocument();
  });

  it('등록 CTA 클릭 시 모달이 열린다', () => {
    render(<MappingScheduleSidePeekContent mapping={baseMapping} />);
    fireEvent.click(screen.getByText('admin:integratedSchedule.vehiclePlate.registerCta'));
    expect(screen.getByTestId('vehicle-plate-modal')).toBeInTheDocument();
  });

  it('PENDING_PAYMENT 상태는 영문 코드 대신 한글 라벨을 표시한다', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={{ ...baseMapping, status: 'PENDING_PAYMENT' }}
      />
    );
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveAttribute('data-status', 'PENDING_PAYMENT');
    expect(badge).toHaveTextContent('결제 대기');
    expect(screen.queryByText('PENDING_PAYMENT')).not.toBeInTheDocument();
  });

  it('CANCELLED 상태는 취소 라벨을 표시한다', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={{ ...baseMapping, status: 'CANCELLED' }}
      />
    );
    expect(screen.getByTestId('status-badge')).toHaveTextContent('취소');
  });
});
