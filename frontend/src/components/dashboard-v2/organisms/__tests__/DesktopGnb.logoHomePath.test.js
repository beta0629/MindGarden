/**
 * DesktopGnb — logoHomePath 역할별 랜딩 (상담사 /admin/dashboard 금지)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DesktopGnb from '../DesktopGnb';

jest.mock('../../molecules', () => ({
  GnbRight: () => <div data-testid="gnb-right" />
}));

describe('DesktopGnb logoHomePath', () => {
  test('기본 랜딩은 /erp/dashboard (레거시 /admin/dashboard 아님)', () => {
    render(
      <MemoryRouter>
        <DesktopGnb logoLabel="센터" />
      </MemoryRouter>
    );
    const logo = screen.getByRole('link');
    expect(logo).toHaveAttribute('href', '/erp/dashboard');
    expect(logo).not.toHaveAttribute('href', '/admin/dashboard');
  });

  test('상담사 logoHomePath=/consultant/dashboard', () => {
    render(
      <MemoryRouter>
        <DesktopGnb logoLabel="센터" logoHomePath="/consultant/dashboard" />
      </MemoryRouter>
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/consultant/dashboard');
  });
});
