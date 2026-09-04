/**
 * MappingScheduleSidePeekContent — 차량번호 표시·등록 CTA (내담자/상담사)
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
  default: ({ children, onClick, ...rest }) => (
    <button type="button" onClick={onClick} {...rest}>{children}</button>
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
  default: ({ isOpen, target, clientId, consultantId }) => (
    isOpen
      ? (
        <div
          data-testid="vehicle-plate-modal"
          data-target={target}
          data-client-id={clientId ?? ''}
          data-consultant-id={consultantId ?? ''}
        />
      )
      : null
  )
}));

describe('MappingScheduleSidePeekContent vehiclePlate', () => {
  const baseMapping = {
    id: 1,
    clientId: 10,
    clientName: '홍길동',
    consultantId: 20,
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
    expect(screen.queryByTestId('side-peek-client-vehicle-plate-register')).not.toBeInTheDocument();
  });

  it('vehiclePlate가 없으면 등록 CTA를 표시한다', () => {
    render(<MappingScheduleSidePeekContent mapping={baseMapping} />);
    expect(screen.getByTestId('side-peek-client-vehicle-plate-register')).toBeInTheDocument();
  });

  it('등록 CTA 클릭 시 모달이 열린다', () => {
    render(<MappingScheduleSidePeekContent mapping={baseMapping} />);
    fireEvent.click(screen.getByTestId('side-peek-client-vehicle-plate-register'));
    const modal = screen.getByTestId('vehicle-plate-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('data-target', 'client');
  });

  it('consultantVehiclePlate가 있으면 값을 표시하고 상담사 CTA는 없다', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={{
          ...baseMapping,
          vehiclePlate: '12가 3456',
          consultantVehiclePlate: '98나 7654'
        }}
      />
    );
    expect(screen.getByText('98나 7654')).toBeInTheDocument();
    expect(screen.queryByTestId('side-peek-consultant-vehicle-plate-register')).not.toBeInTheDocument();
    expect(screen.queryByTestId('side-peek-client-vehicle-plate-register')).not.toBeInTheDocument();
  });

  it('consultantId가 있고 plate가 없으면 상담사 CTA를 표시한다', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={{ ...baseMapping, vehiclePlate: '12가 3456' }}
      />
    );
    expect(screen.getByTestId('side-peek-consultant-vehicle-plate-register')).toBeInTheDocument();
  });

  it('상담사 CTA 클릭 시 consultant target으로 모달이 열린다', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={{ ...baseMapping, vehiclePlate: '12가 3456' }}
      />
    );
    fireEvent.click(screen.getByTestId('side-peek-consultant-vehicle-plate-register'));
    const modal = screen.getByTestId('vehicle-plate-modal');
    expect(modal).toHaveAttribute('data-target', 'consultant');
    expect(modal).toHaveAttribute('data-consultant-id', '20');
  });

  it('consultantId가 없고 plate도 없으면 미등록을 표시한다', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={{
          ...baseMapping,
          consultantId: null,
          vehiclePlate: '12가 3456'
        }}
      />
    );
    expect(screen.queryByTestId('side-peek-consultant-vehicle-plate-register')).not.toBeInTheDocument();
    expect(screen.getByText('admin:integratedSchedule.sidePeek.vehiclePlateUnregistered')).toBeInTheDocument();
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
