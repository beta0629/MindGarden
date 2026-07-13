/**
 * MappingEditModal — 회기 0 검증 가드 회귀 테스트.
 *
 * @author MindGarden
 * @since 2026-07-13
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const stableT = (key, fallback) => (typeof fallback === 'string' ? fallback : key);
  return {
    __esModule: true,
    useTranslation: () => ({ t: stableT }),
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getTenantCodes: jest.fn().mockResolvedValue([
    {
      codeValue: 'PSYCH_TEST',
      codeLabel: '심리검사',
      koreanName: '심리검사',
      extraData: JSON.stringify({ sessions: 0, price: 50000 })
    }
  ])
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions, title }) => (
    isOpen ? (
      <div role="dialog" aria-label={title} data-testid="unified-modal-mock">
        {children}
        <div data-testid="modal-actions">{actions}</div>
      </div>
    ) : null
  )
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button', className, loading }) => (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={className}>
      {children}
    </button>
  )
}));

jest.mock('../../common', () => ({
  __esModule: true,
  ActionButton: ({ children, onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled}>{children}</button>
  ),
  StatusBadge: ({ children }) => <span>{children}</span>
}));

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'erp-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

import MappingEditModal from '../MappingEditModal';

describe('MappingEditModal — 회기 0 검증', () => {
  const mappingFixture = {
    id: 42,
    packageName: '심리검사',
    packagePrice: 50000,
    totalSessions: 0,
    consultantName: '상담사A',
    clientName: '내담자A',
    status: 'ACTIVE'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ success: true, message: 'ok' })
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('totalSessions=0 매칭은 폼에 0으로 유지되고 제출이 거부되지 않는다', async () => {
    const onSuccess = jest.fn();
    render(
      <MappingEditModal
        isOpen={true}
        onClose={jest.fn()}
        mapping={mappingFixture}
        onSuccess={onSuccess}
      />
    );

    await waitFor(() => expect(screen.getAllByText('심리검사').length).toBeGreaterThan(0));

    // 0회기가 표시되어야 함 (!totalSessions 가드였다면 검증 실패 / || '' 로 비워짐)
    expect(screen.getAllByText(/0회기/).length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getByText('수정 완료'));
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, fetchOpts] = global.fetch.mock.calls[0];
    const body = JSON.parse(fetchOpts.body);
    expect(body.totalSessions).toBe(0);
    expect(body.packagePrice).toBe(50000);
  });
});
