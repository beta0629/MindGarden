/**
 * MobileLnbDrawer — 아코디언 sync / false-active 회귀 (DesktopLnb 와 동일 로직)
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import MobileLnbDrawer from '../MobileLnbDrawer';

const PathNavigateButton = ({ to, label = 'navigate' }) => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)}>
      {label}
    </button>
  );
};

const findGroupByLabel = (container, label) => {
  const groups = container.querySelectorAll('.mg-v2-mobile-lnb-drawer__group');
  return Array.from(groups).find((el) => (el.textContent || '').includes(label)) || null;
};

describe('MobileLnbDrawer (아코디언·활성)', () => {
  it('nested 경로에서 부모 그룹이 펼쳐진 채로 시작한다', () => {
    const items = [
      {
        to: '/erp/dashboard',
        icon: 'BRIEFCASE',
        label: '운영·재무',
        end: false,
        menuCode: 'ADM_ERP',
        children: [
          { to: '/erp/salary', icon: 'BANKNOTE', label: '급여 관리', end: true }
        ]
      }
    ];
    render(
      <MemoryRouter initialEntries={['/erp/salary']}>
        <MobileLnbDrawer isOpen menuItems={items} onClose={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /운영·재무 메뉴 접기/ }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('menuItems swap(폴백→menuCode) 후에도 부모 펼침을 유지한다', () => {
    const fallback = {
      to: '/erp/dashboard',
      icon: 'BRIEFCASE',
      label: '운영·재무',
      end: false,
      children: [
        { to: '/erp/salary', icon: 'BANKNOTE', label: '급여 관리', end: true }
      ]
    };
    const api = { ...fallback, menuCode: 'ADM_ERP' };

    const Harness = ({ items }) => (
      <MemoryRouter initialEntries={['/erp/salary']}>
        <MobileLnbDrawer isOpen menuItems={items} onClose={() => {}} />
      </MemoryRouter>
    );

    const { rerender } = render(<Harness items={[fallback]} />);
    expect(screen.getByRole('button', { name: /운영·재무 메뉴 접기/ }))
      .toHaveAttribute('aria-expanded', 'true');
    rerender(<Harness items={[api]} />);
    expect(screen.getByRole('button', { name: /운영·재무 메뉴 접기/ }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('pathname 변경 시 설정 그룹 펼침을 유지한다', () => {
    const items = [
      {
        to: '/tenant/profile',
        icon: 'SETTINGS',
        label: '시스템·설정',
        end: false,
        menuCode: 'ADM_SETTINGS',
        children: [
          { to: '/admin/sms-templates', icon: 'FILE_TEXT', label: 'SMS 템플릿 관리', end: true },
          { to: '/admin/common-codes', icon: 'CODE', label: '공통코드', end: true }
        ]
      }
    ];
    render(
      <MemoryRouter initialEntries={['/admin/sms-templates']}>
        <PathNavigateButton to="/admin/common-codes" label="go-codes" />
        <MobileLnbDrawer isOpen menuItems={items} onClose={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /시스템·설정 메뉴 접기/ }))
      .toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'go-codes' }));
    expect(screen.getByRole('button', { name: /시스템·설정 메뉴 접기/ }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('to=/admin 레거시 그룹은 /admin/sms-templates 에서 --active 가 아니다', () => {
    const items = [
      {
        to: '/admin',
        icon: 'SETTINGS',
        label: '시스템 관리',
        end: false,
        menuCode: 'SYSTEM_ADMIN',
        children: [
          { to: '/admin/organization', icon: 'BUILDING', label: '조직 관리', end: true }
        ]
      },
      {
        to: '/tenant/profile',
        icon: 'SETTINGS',
        label: '시스템·설정',
        end: false,
        menuCode: 'ADM_SETTINGS',
        children: [
          { to: '/admin/sms-templates', icon: 'FILE_TEXT', label: 'SMS 템플릿 관리', end: true }
        ]
      }
    ];
    const { container } = render(
      <MemoryRouter initialEntries={['/admin/sms-templates']}>
        <MobileLnbDrawer isOpen menuItems={items} onClose={() => {}} />
      </MemoryRouter>
    );
    const legacyGroup = findGroupByLabel(container, '시스템 관리');
    const settingsGroup = findGroupByLabel(container, '시스템·설정');
    expect(legacyGroup.className).not.toMatch(/--active/);
    expect(settingsGroup.className).toMatch(/--active/);
    expect(settingsGroup.className).toMatch(/--expanded/);
  });
});
