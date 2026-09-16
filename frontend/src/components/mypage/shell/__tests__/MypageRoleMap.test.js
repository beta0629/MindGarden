/**
 * MypageRoleMap — dual-role role map (landing + two links; no comparison cards)
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MypageRoleMap from '../MypageRoleMap';
import {
  MYPAGE_DUAL_ROLE_MAP,
  MYPAGE_DUAL_ROLE_MAP_LINKS
} from '../../../../constants/mypageDualRoleUi';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

function renderRoleMap(props = {}) {
  return render(
    <MemoryRouter>
      <MypageRoleMap {...props} />
    </MemoryRouter>
  );
}

describe('MypageRoleMap', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders role map with landing and two CTAs (data-testid)', () => {
    renderRoleMap();

    expect(screen.getByTestId('mypage-role-map')).toBeInTheDocument();
    expect(screen.getByTestId('mypage-role-map-landing')).toHaveTextContent(
      MYPAGE_DUAL_ROLE_MAP.LANDING
    );
    expect(screen.getByTestId('mypage-role-map-own-salary-cta')).toHaveTextContent(
      MYPAGE_DUAL_ROLE_MAP.OWN_SALARY_VIEW_LABEL
    );
    expect(screen.getByTestId('mypage-role-map-ops-finance-cta')).toHaveTextContent(
      MYPAGE_DUAL_ROLE_MAP.OPS_FINANCE_APPROVE_LABEL
    );
    expect(screen.getByTestId('mypage-role-map-consultant-note')).toHaveTextContent(
      MYPAGE_DUAL_ROLE_MAP.CONSULTANT_SCHEDULE_NOTE
    );
  });

  test('does not render v1 comparison-card markers', () => {
    const { container } = renderRoleMap();
    expect(container.querySelector('[data-testid="mypage-role-compare-card"]')).toBeNull();
    expect(container.querySelectorAll('.mg-mypage-clinic-os__role-map-card').length).toBe(0);
  });

  test('CTAs navigate to consultant salary view and ops finance paths', () => {
    renderRoleMap();

    fireEvent.click(screen.getByTestId('mypage-role-map-own-salary-cta'));
    expect(mockNavigate).toHaveBeenCalledWith(MYPAGE_DUAL_ROLE_MAP_LINKS.OWN_SALARY_VIEW);

    fireEvent.click(screen.getByTestId('mypage-role-map-ops-finance-cta'));
    expect(mockNavigate).toHaveBeenCalledWith(MYPAGE_DUAL_ROLE_MAP_LINKS.OPS_FINANCE_APPROVE);
  });
});
