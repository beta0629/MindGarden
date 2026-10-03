/**
 * MypageRoleLinks — 역할 지도 / 바로가기 행 링크 (구 MypageRoleMap primary 버튼 2개 → 행 링크)
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MypageRoleLinks from '../MypageRoleLinks';
import {
  MYPAGE_ROLE_LAYOUT,
  MYPAGE_ROLE_LAYOUT_KEYS
} from '../../../../constants/mypageRoleLayout';
import { MYPAGE_DUAL_ROLE_MAP_LINKS } from '../../../../constants/mypageDualRoleUi';
import { CONSULTANT_DASHBOARD_ROUTES } from '../../../../constants/consultantDashboardRoutes';

const renderLinks = (config) =>
  render(
    <MemoryRouter>
      <MypageRoleLinks title={config.linksTitle} landing={config.linksLanding} links={config.links} />
    </MemoryRouter>
  );

describe('MypageRoleLinks', () => {
  test('operatorDual: 역할 지도 landing + 2 row links (no primary buttons)', () => {
    renderLinks(MYPAGE_ROLE_LAYOUT[MYPAGE_ROLE_LAYOUT_KEYS.OPERATOR_DUAL]);

    expect(screen.getByTestId('mypage-role-links')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '역할 지도' })).toBeInTheDocument();
    expect(screen.getByTestId('mypage-role-links-landing')).toHaveTextContent(
      '한 계정으로 운영과 상담을 함께 합니다. 역할을 바꾸거나 다시 로그인할 필요가 없습니다.'
    );
    expect(screen.getByTestId('mypage-role-link-own-salary')).toHaveAttribute(
      'href',
      MYPAGE_DUAL_ROLE_MAP_LINKS.OWN_SALARY_VIEW
    );
    expect(screen.getByTestId('mypage-role-link-ops-finance')).toHaveAttribute(
      'href',
      MYPAGE_DUAL_ROLE_MAP_LINKS.OPS_FINANCE_APPROVE
    );
    expect(screen.getByTestId('mypage-role-link-own-salary')).toHaveTextContent('상담본인 급여 조회');
    expect(screen.getByTestId('mypage-role-link-ops-finance')).toHaveTextContent('운영상담사 지급 승인');
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('consultant: 바로가기 급여 정산 · 근무 가능 시간', () => {
    renderLinks(MYPAGE_ROLE_LAYOUT[MYPAGE_ROLE_LAYOUT_KEYS.CONSULTANT]);
    expect(screen.getByRole('heading', { name: '바로가기' })).toBeInTheDocument();
    expect(screen.getByTestId('mypage-role-link-salary-settlement')).toHaveAttribute(
      'href',
      CONSULTANT_DASHBOARD_ROUTES.SALARY_SETTLEMENT
    );
    expect(screen.getByTestId('mypage-role-link-availability')).toHaveAttribute(
      'href',
      CONSULTANT_DASHBOARD_ROUTES.AVAILABILITY
    );
  });

  test('operator: no links → renders nothing', () => {
    const { container } = renderLinks(MYPAGE_ROLE_LAYOUT[MYPAGE_ROLE_LAYOUT_KEYS.OPERATOR]);
    expect(container.querySelector('[data-testid="mypage-role-links"]')).toBeNull();
  });

  test('does not render v1 comparison-card markers', () => {
    const { container } = renderLinks(MYPAGE_ROLE_LAYOUT[MYPAGE_ROLE_LAYOUT_KEYS.OPERATOR_DUAL]);
    expect(container.querySelector('[data-testid="mypage-role-compare-card"]')).toBeNull();
  });
});
