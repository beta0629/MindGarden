/**
 * PendingPackageEditModal — 좁은 폭 패키지 카드 레이아웃·선택 variant 회귀
 *
 * @author CoreSolution
 * @since 2026-09-04
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

jest.mock('react-i18next', () => {
  const stableT = (key, fallback) => (typeof fallback === 'string' ? fallback : key);
  return {
    __esModule: true,
    useTranslation: () => ({ t: stableT }),
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

const PACKAGE_CODES_FIXTURE = [
  {
    codeValue: 'LONG_LABEL_PKG',
    codeLabel: '매우긴패키지이름심리검사및심층상담복합패키지세트',
    koreanName: '매우긴패키지이름심리검사및심층상담복합패키지세트',
    extraData: JSON.stringify({ sessions: 10, price: 350000 }),
    sortOrder: 1
  },
  {
    codeValue: 'SHORT_PKG',
    codeLabel: '단회기',
    koreanName: '단회기',
    extraData: JSON.stringify({ sessions: 1, price: 50000 }),
    sortOrder: 2
  }
];

jest.mock('../../../../utils/commonCodeApi', () => ({
  __esModule: true,
  getTenantCodes: jest.fn()
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
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

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button', className, variant, loading }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`mg-button mg-button--${variant || 'primary'} ${className || ''}`.trim()}
      data-variant={variant || 'primary'}
    >
      <span className="mg-button__content">
        <span className="mg-button__text">{children}</span>
      </span>
    </button>
  )
}));

jest.mock('../../../common', () => ({
  __esModule: true,
  ActionButton: ({ children, onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled}>{children}</button>
  )
}));

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children, className, tag: Tag = 'span' }) => (
    <Tag className={className}>{children}</Tag>
  )
}));

import PendingPackageEditModal from '../PendingPackageEditModal';
import { getTenantCodes } from '../../../../utils/commonCodeApi';

describe('PendingPackageEditModal — 패키지 선택 레이아웃', () => {
  const mappingFixture = {
    id: 88,
    packageName: '단회기',
    packagePrice: 50000,
    totalSessions: 1,
    status: 'PENDING_PAYMENT'
  };

  const LONG_LABEL = '매우긴패키지이름심리검사및심층상담복합패키지세트';

  beforeEach(() => {
    jest.clearAllMocks();
    getTenantCodes.mockResolvedValue(PACKAGE_CODES_FIXTURE);
  });

  test('긴 라벨 패키지 카드가 공유 그리드 안에 렌더된다', async () => {
    render(
      <PendingPackageEditModal
        isOpen={true}
        onClose={jest.fn()}
        mapping={mappingFixture}
        onSuccess={jest.fn()}
      />
    );

    await waitFor(() => expect(getTenantCodes).toHaveBeenCalledWith('CONSULTATION_PACKAGE'));
    const longLabel = await screen.findByText(LONG_LABEL);
    const card = longLabel.closest('button.mg-v2-pending-package-edit__package-card');
    expect(card).toBeTruthy();

    const grid = card.closest('.mg-v2-mapping-edit-modal__package-grid');
    expect(grid).toBeTruthy();
    expect(grid.contains(card)).toBe(true);
  });

  test('선택 시 outline + selected class만 사용하고 primary variant는 쓰지 않는다', async () => {
    render(
      <PendingPackageEditModal
        isOpen={true}
        onClose={jest.fn()}
        mapping={mappingFixture}
        onSuccess={jest.fn()}
      />
    );

    await waitFor(() => expect(getTenantCodes).toHaveBeenCalledWith('CONSULTATION_PACKAGE'));
    const longLabel = await screen.findByText(LONG_LABEL);
    const card = longLabel.closest('button.mg-v2-pending-package-edit__package-card');
    expect(card).toBeTruthy();

    expect(card).toHaveAttribute('data-variant', 'outline');
    expect(card.className).toContain('mg-button--outline');
    expect(card.className).not.toContain('mg-button--primary');
    expect(card.className).not.toContain('mg-v2-pending-package-edit__package-card--selected');

    fireEvent.click(card);

    await waitFor(() => {
      expect(card.className).toContain('mg-v2-pending-package-edit__package-card--selected');
    });
    expect(card).toHaveAttribute('data-variant', 'outline');
    expect(card.className).toContain('mg-button--outline');
    expect(card.className).not.toContain('mg-button--primary');
  });

  test('좁은 폭 시나리오: 긴 라벨 선택 상태에서도 그리드·라벨 래핑 클래스가 유지된다', async () => {
    render(
      <PendingPackageEditModal
        isOpen={true}
        onClose={jest.fn()}
        mapping={mappingFixture}
        onSuccess={jest.fn()}
      />
    );

    await waitFor(() => expect(getTenantCodes).toHaveBeenCalledWith('CONSULTATION_PACKAGE'));
    const longLabel = await screen.findByText(LONG_LABEL);
    const card = longLabel.closest('button.mg-v2-pending-package-edit__package-card');
    expect(card).toBeTruthy();

    fireEvent.click(card);

    await waitFor(() => {
      expect(card.className).toContain('mg-v2-pending-package-edit__package-card--selected');
    });

    const grid = card.closest('.mg-v2-mapping-edit-modal__package-grid');
    expect(grid).toBeTruthy();
    expect(grid.contains(card)).toBe(true);

    const labelEl = card.querySelector('.mg-v2-pending-package-edit__package-label');
    const metaEl = card.querySelector('.mg-v2-pending-package-edit__package-meta');
    expect(labelEl).toBeTruthy();
    expect(metaEl).toBeTruthy();
    expect(labelEl.textContent).toBe(LONG_LABEL);
    expect(card).toHaveAttribute('data-variant', 'outline');
    expect(card.className).not.toContain('mg-button--primary');
  });

  test('Pending CSS에 package-card MGButton min-width/white-space 오버라이드가 있다', () => {
    const cssPath = path.resolve(__dirname, '../PendingPackageEditModal.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toMatch(
      /\.mg-v2-pending-package-edit__package-card\.mg-button\.mg-button--outline[\s\S]*?\{[^}]*min-width:\s*0/
    );
    expect(css).toMatch(
      /\.mg-v2-pending-package-edit__package-card\.mg-button\s+\.mg-button__text\s*\{[^}]*white-space:\s*normal/s
    );
    expect(css).toMatch(
      /\.mg-v2-pending-package-edit__package-card\.mg-button\.mg-button--outline[\s\S]*?\{[^}]*height:\s*auto\s*!important/
    );
    expect(css).toMatch(/max-height:\s*none\s*!important/);
    expect(css).not.toMatch(/max-height:\s*auto/);
    expect(css).toMatch(
      /@media\s*\(\s*max-width:\s*768px\s*\)\s*\{[\s\S]*max-height:\s*none\s*!important/
    );
    expect(css).toMatch(
      /\.mg-v2-pending-package-edit__package-label\s*\{[^}]*overflow-wrap:\s*anywhere/s
    );
    expect(css).toMatch(
      /\.mg-v2-pending-package-edit__package-meta\s*\{[^}]*overflow-wrap:\s*anywhere/s
    );
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgb\(/);
  });

  test('공유 package-grid는 좁은 폭용 minmax(min(100%, 160px), 1fr)를 쓴다', () => {
    const cssPath = path.resolve(__dirname, '../../MappingEditModal.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toMatch(
      /\.mg-v2-mapping-edit-modal__package-grid\s*\{[^}]*minmax\(min\(100%,\s*160px\),\s*1fr\)/s
    );
    expect(css).toMatch(
      /\.mg-v2-mapping-edit-modal__package-card\.mg-button\.mg-button--outline[\s\S]*?\{[^}]*min-width:\s*0/
    );
    expect(css).toMatch(
      /\.mg-v2-mapping-edit-modal__package-card\.mg-button[\s\S]*?max-height:\s*none\s*!important/
    );
    expect(css).not.toMatch(/max-height:\s*auto/);
  });
});
