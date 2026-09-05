/**
 * PendingPackageEditModal — 현재 vs 선택 vs 변경예정 칩 구분 · 레이아웃 회귀
 *
 * @author CoreSolution
 * @since 2026-09-04
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

jest.mock('react-i18next', () => {
  const stableT = (key, fallback) => {
    const ko = {
      'mapping.pendingPackage.modal.badgeCurrent': '현재',
      'mapping.pendingPackage.modal.badgePendingChange': '변경예정',
      'mapping.pendingPackage.modal.ariaStatusCurrent': '현재',
      'mapping.pendingPackage.modal.ariaStatusSelected': '선택됨',
      'mapping.pendingPackage.modal.ariaStatusPendingChange': '변경예정',
      'mapping.pendingPackage.modal.ariaStatusCurrentSelected': '현재, 선택됨'
    };
    if (ko[key]) return ko[key];
    return typeof fallback === 'string' ? fallback : key;
  };
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
  default: ({
    children,
    onClick,
    disabled,
    type = 'button',
    className,
    variant,
    loading,
    ...rest
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`mg-button mg-button--${variant || 'primary'} ${className || ''}`.trim()}
      data-variant={variant || 'primary'}
      {...rest}
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

describe('PendingPackageEditModal — 패키지 선택 현재/선택 구분', () => {
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

  const findCardByLabel = async (label) => {
    await waitFor(() => {
      const matches = screen.getAllByText(label);
      const inCard = matches.find((el) => el.closest('button.mg-v2-package-option-card'));
      expect(inCard).toBeTruthy();
    });
    const matches = screen.getAllByText(label);
    const inCard = matches.find((el) => el.closest('button.mg-v2-package-option-card'));
    return inCard.closest('button.mg-v2-package-option-card');
  };

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
    const card = await findCardByLabel(LONG_LABEL);
    expect(card).toBeTruthy();

    const grid = card.closest('.mg-v2-mapping-edit-modal__package-grid');
    expect(grid).toBeTruthy();
    expect(grid.contains(card)).toBe(true);
  });

  test('초기 로드: 현재 패키지는 current+selected, 배지「현재」와 aria-pressed', async () => {
    render(
      <PendingPackageEditModal
        isOpen={true}
        onClose={jest.fn()}
        mapping={mappingFixture}
        onSuccess={jest.fn()}
      />
    );

    await waitFor(() => expect(getTenantCodes).toHaveBeenCalledWith('CONSULTATION_PACKAGE'));
    const currentCard = await findCardByLabel('단회기');
    expect(currentCard).toBeTruthy();
    expect(currentCard.className).toContain('mg-v2-package-option-card--current');
    expect(currentCard.className).toContain('mg-v2-package-option-card--selected');
    expect(currentCard.className).not.toContain('mg-v2-package-option-card--pending-change');
    expect(currentCard).toHaveAttribute('aria-pressed', 'true');
    expect(currentCard).toHaveAttribute('data-package-current', 'true');
    expect(currentCard.querySelector('.mg-v2-package-option-card__badge')?.textContent).toBe('현재');
    expect(currentCard.querySelectorAll('.mg-v2-package-option-card__badge')).toHaveLength(1);

    const otherCard = await findCardByLabel(LONG_LABEL);
    expect(otherCard.className).not.toContain('mg-v2-package-option-card--current');
    expect(otherCard.className).not.toContain('mg-v2-package-option-card--selected');
    expect(otherCard).toHaveAttribute('aria-pressed', 'false');
  });

  test('다른 패키지 선택 시: 신규는 pending-change, 기존은 current만 유지', async () => {
    render(
      <PendingPackageEditModal
        isOpen={true}
        onClose={jest.fn()}
        mapping={mappingFixture}
        onSuccess={jest.fn()}
      />
    );

    await waitFor(() => expect(getTenantCodes).toHaveBeenCalledWith('CONSULTATION_PACKAGE'));
    const currentCard = await findCardByLabel('단회기');
    const newCard = await findCardByLabel(LONG_LABEL);

    fireEvent.click(currentCard);
    await waitFor(() => {
      expect(currentCard.className).not.toContain('mg-v2-package-option-card--selected');
    });
    expect(currentCard.className).toContain('mg-v2-package-option-card--current');
    expect(currentCard).toHaveAttribute('aria-pressed', 'false');
    expect(currentCard.querySelector('.mg-v2-package-option-card__badge')?.textContent).toBe('현재');

    fireEvent.click(newCard);
    await waitFor(() => {
      expect(newCard.className).toContain('mg-v2-package-option-card--selected');
    });
    expect(newCard.className).toContain('mg-v2-package-option-card--pending-change');
    expect(newCard.className).not.toContain('mg-v2-package-option-card--current');
    expect(newCard).toHaveAttribute('aria-pressed', 'true');
    expect(newCard).toHaveAttribute('data-package-pending-change', 'true');
    expect(newCard.querySelector('.mg-v2-package-option-card__badge')?.textContent).toBe('변경예정');
    expect(newCard.getAttribute('aria-label')).toContain('변경예정');
    expect(currentCard.className).toContain('mg-v2-package-option-card--current');
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
    const card = await findCardByLabel(LONG_LABEL);
    expect(card).toHaveAttribute('data-variant', 'outline');
    expect(card.className).toContain('mg-button--outline');
    expect(card.className).not.toContain('mg-button--primary');

    fireEvent.click(card);

    await waitFor(() => {
      expect(card.className).toContain('mg-v2-package-option-card--selected');
    });
    expect(card).toHaveAttribute('data-variant', 'outline');
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
    const card = await findCardByLabel(LONG_LABEL);
    fireEvent.click(card);

    await waitFor(() => {
      expect(card.className).toContain('mg-v2-package-option-card--selected');
    });

    const grid = card.closest('.mg-v2-mapping-edit-modal__package-grid');
    expect(grid).toBeTruthy();
    expect(grid.contains(card)).toBe(true);

    const labelEl = card.querySelector('.mg-v2-package-option-card__label');
    const metaEl = card.querySelector('.mg-v2-package-option-card__meta');
    expect(labelEl).toBeTruthy();
    expect(metaEl).toBeTruthy();
    expect(labelEl.textContent).toBe(LONG_LABEL);
  });

  test('PackageOptionCard CSS: pending-change warning·solid current+selected·padding·hex 없음', () => {
    const cssPath = path.resolve(__dirname, '../PackageOptionCard.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toMatch(
      /\.mg-v2-package-option-card--selected\s*\{[^}]*--mg-v2-color-primary-solid/s
    );
    expect(css).toMatch(
      /\.mg-v2-package-option-card--current:not\(\.mg-v2-package-option-card--selected\)\s*\{[^}]*--mg-v2-color-primary-subtle/s
    );
    expect(css).toMatch(
      /\.mg-v2-package-option-card--pending-change\s*\{[^}]*--mg-color-warning-100/s
    );
    expect(css).toMatch(
      /\.mg-v2-package-option-card--pending-change\s*\{[^}]*--mg-color-warning-500/s
    );
    expect(css).toMatch(
      /\.mg-v2-package-option-card--pending-change\s*\{[^}]*--mg-color-warning-800/s
    );
    expect(css).toMatch(
      /\.mg-v2-package-option-card--current\.mg-v2-package-option-card--selected\s*\{[^}]*--mg-v2-color-primary-solid/s
    );
    expect(css).toMatch(/padding-block:\s*var\(--mg-v2-space-4/);
    expect(css).toMatch(/padding-inline:\s*var\(--mg-v2-space-5/);
    expect(css).toMatch(/\.mg-v2-package-option-card__badge/);
    expect(css).toMatch(
      /\.mg-v2-package-option-card\.mg-button\.mg-button--outline[\s\S]*?\{[^}]*min-width:\s*0/
    );
    expect(css).toMatch(/max-height:\s*none\s*!important/);
    expect(css).not.toMatch(/max-height:\s*auto/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgb\(/);
  });

  test('공유 package-grid는 좁은 폭용 minmax(min(100%, 160px), 1fr)를 쓴다', () => {
    const cssPath = path.resolve(__dirname, '../../MappingEditModal.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    expect(css).toMatch(
      /\.mg-v2-mapping-edit-modal__package-grid\s*\{[^}]*minmax\(min\(100%,\s*160px\),\s*1fr\)/s
    );
  });
});
