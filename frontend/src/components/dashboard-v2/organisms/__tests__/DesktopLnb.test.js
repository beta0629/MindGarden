/**
 * DesktopLnb 단위 테스트 (LNB IA 재배치 Phase 3 — 2026-05-28)
 *
 * 커버리지:
 *   - 1차 단독 메뉴 렌더 (대시보드/통합 스케줄)
 *   - 그룹 헤더 렌더 + ChevronRight (기본 접힘)
 *   - 그룹 헤더 클릭 시 ChevronDown 으로 토글 + aria-expanded 갱신
 *   - 활성 항목 (current page) 좌측 accent bar via 클래스 (--mg-color-primary-500)
 *   - role="navigation" + aria-label
 *
 * @see docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md
 * @see docs/project-management/2026-05-28/ADMIN_LNB_IA_DESIGN_HANDOFF.md
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DesktopLnb from '../DesktopLnb';

const lnbItems = [
  { to: '/admin/dashboard', icon: 'LAYOUT_DASHBOARD', label: '대시보드', end: true },
  { to: '/admin/integrated-schedule', icon: 'CALENDAR_DAYS', label: '통합 스케줄', end: true },
  {
    to: '/admin/notifications',
    icon: 'BELL',
    label: '알림·메시지',
    end: false,
    children: [
      { to: '/admin/consultation-logs', icon: 'FILE_TEXT', label: '상담일지', end: true }
    ]
  },
  {
    to: '/admin/mapping-management',
    icon: 'CREDIT_CARD',
    label: '매칭·결제·환불',
    end: false,
    children: [
      { to: '/admin/mapping-management', icon: 'LINK', label: '매칭 관리(환불·취소)', end: true },
      { to: '/admin/billing/subscriptions', icon: 'RECEIPT', label: '결제/구독 관리', end: true }
    ]
  }
];

const renderLnb = (initialPath = '/admin/dashboard') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <DesktopLnb menuItems={lnbItems} headerTitle="시스템 관리" />
    </MemoryRouter>
  );

describe('DesktopLnb (LNB IA 재배치)', () => {
  describe('컨테이너 ARIA', () => {
    it('aside 가 role="navigation" + aria-label 을 가진다', () => {
      renderLnb();
      const nav = screen.getByRole('navigation', { name: '좌측 메뉴' });
      expect(nav).toBeInTheDocument();
    });

    it('헤더 타이틀이 렌더된다', () => {
      renderLnb();
      expect(screen.getByText('시스템 관리')).toBeInTheDocument();
    });
  });

  describe('1차 단독 메뉴 렌더', () => {
    it('대시보드와 통합 스케줄이 1차로 노출된다', () => {
      renderLnb();
      expect(screen.getByText('대시보드')).toBeInTheDocument();
      expect(screen.getByText('통합 스케줄')).toBeInTheDocument();
    });
  });

  describe('그룹 확장/축소', () => {
    it('그룹 헤더는 기본 접힘 상태(aria-expanded=false)이다', () => {
      renderLnb();
      const toggleBtn = screen.getByRole('button', { name: /매칭·결제·환불 메뉴 펼치기/ });
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    });

    it('그룹 헤더 chevron 클릭 시 펼쳐지고 aria-expanded=true 가 된다', () => {
      renderLnb();
      const toggleBtn = screen.getByRole('button', { name: /매칭·결제·환불 메뉴 펼치기/ });
      fireEvent.click(toggleBtn);
      const refreshed = screen.getByRole('button', { name: /매칭·결제·환불 메뉴 접기/ });
      expect(refreshed).toHaveAttribute('aria-expanded', 'true');
    });

    it('한 그룹을 펼치면 다른 그룹은 자동 접힘(아코디언 동작)', () => {
      renderLnb();
      const mappingToggle = screen.getByRole('button', { name: /매칭·결제·환불 메뉴 펼치기/ });
      const notificationsToggle = screen.getByRole('button', { name: /알림·메시지 메뉴 펼치기/ });
      fireEvent.click(notificationsToggle);
      fireEvent.click(mappingToggle);
      const refreshedNotifications = screen.getByRole('button', { name: /알림·메시지 메뉴 펼치기/ });
      expect(refreshedNotifications).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('현재 경로 기반 초기 펼침', () => {
    it('현재 경로가 매칭 그룹 하위면 매칭·결제·환불 그룹이 자동 펼침 상태로 시작한다', () => {
      renderLnb('/admin/billing/subscriptions');
      const toggleBtn = screen.getByRole('button', { name: /매칭·결제·환불 메뉴 접기/ });
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('활성 상태 (current page)', () => {
    it('현재 경로의 NavLink 에 --active 클래스가 부여된다 (좌측 accent bar 시각)', () => {
      const { container } = renderLnb('/admin/dashboard');
      const activeLink = container.querySelector('.mg-v2-nav-link--active');
      expect(activeLink).not.toBeNull();
      expect(activeLink?.textContent).toContain('대시보드');
    });

    it('react-router NavLink 가 활성 항목에 aria-current="page" 를 자동 부여한다', () => {
      const { container } = renderLnb('/admin/dashboard');
      const activeLink = container.querySelector('[aria-current="page"]');
      expect(activeLink).not.toBeNull();
    });
  });

  describe('그룹 하위 메뉴 렌더', () => {
    it('펼쳐진 그룹의 하위 메뉴들이 sublist 안에 렌더된다', () => {
      renderLnb('/admin/billing/subscriptions');
      const sublist = screen.getByRole('group', { name: '매칭·결제·환불' });
      expect(within(sublist).getByText('매칭 관리(환불·취소)')).toBeInTheDocument();
      expect(within(sublist).getByText('결제/구독 관리')).toBeInTheDocument();
    });
  });
});
