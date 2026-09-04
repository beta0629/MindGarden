/**
 * VehiclePlateQuickRegisterModal — 내담자/상담사 빠른등록 API 경로
 *
 * @author CoreSolution
 * @since 2026-09-04
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VehiclePlateQuickRegisterModal from '../integrated-schedule/molecules/VehiclePlateQuickRegisterModal';
import StandardizedApi from '../../../../utils/standardizedApi';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    put: jest.fn(() => Promise.resolve({ success: true }))
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, subtitle, children, actions }) => (
    isOpen
      ? (
        <div data-testid="unified-modal">
          <h2>{title}</h2>
          {subtitle ? <div data-testid="modal-subtitle">{subtitle}</div> : null}
          <div>{children}</div>
          <div>{actions}</div>
        </div>
      )
      : null
  )
}));

jest.mock('../../../common/ActionBar', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

jest.mock('../../../common/ActionBarButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, ...rest }) => (
    <button type="button" onClick={onClick} disabled={disabled || loading} {...rest}>
      {children}
    </button>
  )
}));

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

describe('VehiclePlateQuickRegisterModal', () => {
  const onClose = jest.fn();
  const onRegistered = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consultant target이면 PUT /api/v1/admin/consultants/{id} 를 호출한다', async() => {
    render(
      <VehiclePlateQuickRegisterModal
        isOpen
        onClose={onClose}
        target="consultant"
        consultantId={42}
        consultantName="김상담"
        onRegistered={onRegistered}
      />
    );

    const input = screen.getByPlaceholderText('admin:clientModal.form.vehiclePlatePlaceholder');
    await userEvent.type(input, '12가3456');
    await userEvent.click(screen.getByText('admin:integratedSchedule.vehiclePlate.save'));

    await waitFor(() => {
      expect(StandardizedApi.put).toHaveBeenCalledWith(
        '/api/v1/admin/consultants/42',
        { vehiclePlate: expect.any(String) }
      );
    });
    expect(onRegistered).toHaveBeenCalledWith({
      consultantId: 42,
      consultantVehiclePlate: expect.any(String)
    });
  });

  it('client target(기본)이면 PUT /api/v1/admin/clients/{id} 를 호출한다', async() => {
    render(
      <VehiclePlateQuickRegisterModal
        isOpen
        onClose={onClose}
        clientId={10}
        clientName="홍길동"
        onRegistered={onRegistered}
      />
    );

    const input = screen.getByPlaceholderText('admin:clientModal.form.vehiclePlatePlaceholder');
    await userEvent.type(input, '12가3456');
    await userEvent.click(screen.getByText('admin:integratedSchedule.vehiclePlate.save'));

    await waitFor(() => {
      expect(StandardizedApi.put).toHaveBeenCalledWith(
        '/api/v1/admin/clients/10',
        { vehiclePlate: expect.any(String) }
      );
    });
    expect(onRegistered).toHaveBeenCalledWith({
      clientId: 10,
      vehiclePlate: expect.any(String)
    });
  });

  it('entityId가 없으면 submit이 disabled이다', () => {
    render(
      <VehiclePlateQuickRegisterModal
        isOpen
        onClose={onClose}
        target="consultant"
        consultantId={null}
      />
    );
    expect(screen.getByText('admin:integratedSchedule.vehiclePlate.save')).toBeDisabled();
  });
});
