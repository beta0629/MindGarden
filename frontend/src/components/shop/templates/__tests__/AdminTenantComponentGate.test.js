/**
 * AdminTenantComponentGate — 기능 비활성 빈 상태는 세로 스택, breadcrumb만, h1 하나
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminTenantComponentGate from '../AdminTenantComponentGate';
import {
  ADMIN_SHOP_CATALOG_UNAVAILABLE_COPY,
  ADMIN_SHOP_GATE_BACK_TO_DASHBOARD_LABEL,
  ADMIN_SHOP_GATE_LAYOUT_TITLE
} from '../../../../constants/adminShopCopy';
import { ADMIN_ROUTES } from '../../../../constants/adminRoutes';
import { PLATFORM_COMPONENT_CODES } from '../../../../constants/tenantComponentApi';

const mockUseTenantComponentFlags = jest.fn();

jest.mock('../../../../hooks/useTenantComponentFlags', () => ({
  useTenantComponentFlags: () => mockUseTenantComponentFlags()
}));

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ title, children }) => (
    <div data-testid="admin-common-layout" data-layout-title={title}>
      {children}
    </div>
  )
}));

describe('AdminTenantComponentGate', () => {
  test('enabled catalog renders children without the empty state', () => {
    mockUseTenantComponentFlags.mockReturnValue({
      loading: false,
      adminShopCatalogEnabled: true
    });

    render(
      <MemoryRouter>
        <AdminTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG}>
          <p>catalog-body</p>
        </AdminTenantComponentGate>
      </MemoryRouter>
    );

    expect(screen.getByText('catalog-body')).toBeInTheDocument();
    expect(screen.queryByText(ADMIN_SHOP_CATALOG_UNAVAILABLE_COPY.TITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-common-layout')).not.toBeInTheDocument();
  });

  test('disabled catalog stacks live copy, hides the page h1, and keeps a breadcrumb', () => {
    mockUseTenantComponentFlags.mockReturnValue({
      loading: false,
      adminShopCatalogEnabled: false
    });

    render(
      <MemoryRouter>
        <AdminTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG}>
          <p>catalog-body</p>
        </AdminTenantComponentGate>
      </MemoryRouter>
    );

    expect(screen.queryByText('catalog-body')).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute(
      'data-layout-title',
      ADMIN_SHOP_GATE_LAYOUT_TITLE
    );

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(ADMIN_SHOP_CATALOG_UNAVAILABLE_COPY.TITLE);
    expect(screen.queryByRole('heading', { name: ADMIN_SHOP_GATE_LAYOUT_TITLE })).not.toBeInTheDocument();
    expect(document.querySelector('.mg-v2-content-header__title')).not.toBeInTheDocument();
    expect(document.querySelector('.mg-v2-settings-header__title')).not.toBeInTheDocument();

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(breadcrumb).toHaveTextContent(ADMIN_SHOP_GATE_LAYOUT_TITLE);
    expect(breadcrumb.tagName).not.toBe('H1');
    expect(breadcrumb).toHaveClass('admin-shop-gate__breadcrumb');

    expect(screen.getByText(ADMIN_SHOP_CATALOG_UNAVAILABLE_COPY.DESCRIPTION)).toBeInTheDocument();

    const link = screen.getByRole('link', { name: ADMIN_SHOP_GATE_BACK_TO_DASHBOARD_LABEL });
    expect(link).toHaveAttribute('href', ADMIN_ROUTES.DASHBOARD);
    expect(link).toHaveClass('feature-unavailable__action');
    expect(link.className).not.toMatch(/primary/);

    const gate = screen.getByTestId(
      `admin-tenant-component-gate--${PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG}`
    );
    expect(gate).toHaveClass('admin-shop-gate');
    expect(gate).toHaveClass('admin-shop-gate__unavailable');
    expect(gate.querySelector('.feature-unavailable')).toBeInTheDocument();
  });

  test('admin shop gate stylesheet fills the column and does not row-pack the stack', () => {
    const css = fs.readFileSync(
      path.join(__dirname, '../../../../styles/shop/AdminShopGate.css'),
      'utf8'
    );
    const gateRule = css.match(/\.admin-shop-gate\s*\{[^}]*\}/);
    expect(gateRule).not.toBeNull();
    expect(gateRule[0]).toMatch(/flex-direction:\s*column/);
    expect(gateRule[0]).toMatch(/align-items:\s*center/);
    expect(gateRule[0]).toMatch(/justify-content:\s*center/);
    expect(gateRule[0]).toMatch(/flex:\s*1\s+1\s+auto/);
    expect(gateRule[0]).not.toMatch(/flex-direction:\s*row/);

    const unavailableRule = css.match(/\.admin-shop-gate__unavailable\s*\{[^}]*\}/);
    expect(unavailableRule).not.toBeNull();
    expect(unavailableRule[0]).toMatch(/max-width:\s*none/);
    expect(unavailableRule[0]).not.toMatch(/28rem/);
  });
});
