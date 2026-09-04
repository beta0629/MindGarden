/**
 * MappingScheduleSidePeekContent — 상담사 in-place 수정 (사이드바 Side Peek)
 *
 * @author CoreSolution
 * @since 2026-09-03
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MappingScheduleSidePeekContent, {
  canEditMappingConsultant
} from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import { USER_ROLES } from '../../../../constants/roles';
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
  getMappingStatusKoreanNameSync: (status) => status || '—'
}));

jest.mock('../integrated-schedule/molecules/VehiclePlateQuickRegisterModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../common/CustomSelect', () => ({
  __esModule: true,
  default: ({ options, value, onChange, disabled }) => (
    <select
      data-testid="side-peek-consultant-select"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {(options || []).map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
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
    put: jest.fn()
  }
}));

jest.mock('../../../../utils/sessionSuccessionOptions', () => ({
  __esModule: true,
  mapSessionSuccessionConsultantOptions: (payload) => {
    const list = payload?.consultants || [];
    return list.map((item) => {
      const c = item.consultant || item;
      return { value: String(c.id), label: c.name };
    });
  }
}));

describe('canEditMappingConsultant', () => {
  it('ADMIN/STAFF만 true, CONSULTANT는 fail-closed', () => {
    expect(canEditMappingConsultant(USER_ROLES.ADMIN)).toBe(true);
    expect(canEditMappingConsultant(USER_ROLES.STAFF)).toBe(true);
    expect(canEditMappingConsultant(USER_ROLES.CONSULTANT)).toBe(false);
    expect(canEditMappingConsultant(null)).toBe(false);
  });
});

describe('MappingScheduleSidePeekContent consultant edit', () => {
  const baseMapping = {
    id: 55,
    clientId: 10,
    clientName: '홍길동',
    consultantId: 11,
    consultantName: '김상담',
    status: 'ACTIVE',
    remainingSessions: 3,
    packageName: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue({
      consultants: [
        { consultant: { id: 11, name: '김상담' } },
        { consultant: { id: 12, name: '이상담' } }
      ]
    });
    StandardizedApi.put.mockResolvedValue({
      success: true,
      data: {
        id: 55,
        consultantId: 12,
        consultantName: '이상담'
      }
    });
  });

  it('ADMIN — 상담사 변경 후 저장 시 PUT consultantId 및 onConsultantUpdated', async() => {
    const onConsultantUpdated = jest.fn();
    render(
      <MappingScheduleSidePeekContent
        mapping={baseMapping}
        userRole={USER_ROLES.ADMIN}
        onConsultantUpdated={onConsultantUpdated}
      />
    );

    const select = await screen.findByTestId('side-peek-consultant-select');
    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });

    fireEvent.change(select, { target: { value: '12' } });
    fireEvent.click(screen.getByTestId('side-peek-consultant-save'));

    await waitFor(() => {
      expect(StandardizedApi.put).toHaveBeenCalledWith(
        '/api/v1/admin/mappings/55',
        { consultantId: 12 }
      );
    });
    await waitFor(() => {
      expect(onConsultantUpdated).toHaveBeenCalledWith({
        mappingId: 55,
        consultantId: 12,
        consultantName: '이상담',
        consultantVehiclePlate: null
      });
    });
  });

  it('CONSULTANT — 선택 UI 없이 이름만 표시 (fail-closed)', () => {
    render(
      <MappingScheduleSidePeekContent
        mapping={baseMapping}
        userRole={USER_ROLES.CONSULTANT}
      />
    );
    expect(screen.queryByTestId('side-peek-consultant-select')).not.toBeInTheDocument();
    expect(screen.getByText('김상담')).toBeInTheDocument();
    expect(StandardizedApi.get).not.toHaveBeenCalled();
  });
});
