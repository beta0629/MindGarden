/**
 * MobileLnbDrawer - 280px 슬라이드 드로어, 오버레이 (메인/서브 트리 지원)
 * RESPONSIVE_LAYOUT_SPEC: 모바일 LNB 280px
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { NavLinkWithRouter } from '../atoms';
import { LnbMenuItem } from '../molecules';
import './MobileLnbDrawer.css';

const MobileLnbDrawer = ({ isOpen, onClose, menuItems = [], headerTitle = '시스템 관리', onLogout }) => {
  const hasChildren = (item) => item.children && item.children.length > 0;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`mg-v2-mobile-lnb-overlay ${isOpen ? 'mg-v2-mobile-lnb-overlay--open' : ''}`}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="메뉴 닫기"
      />
      <aside
        className={`mg-v2-mobile-lnb-drawer ${isOpen ? 'mg-v2-mobile-lnb-drawer--open' : ''}`}
        role="navigation"
        aria-label="메뉴"
      >
        <div className="mg-v2-mobile-lnb-drawer__header">
          <span className="mg-v2-mobile-lnb-drawer__title">{headerTitle}</span>
        </div>
        <nav className="mg-v2-mobile-lnb-drawer__nav">
          <ul className="mg-v2-mobile-lnb-drawer__list">
            {menuItems.map((item) =>
              hasChildren(item) ? (
                <li key={item.to} className="mg-v2-mobile-lnb-drawer__group">
                  <div className="mg-v2-mobile-lnb-drawer__group-head">
                    <NavLinkWithRouter
                      to={item.to}
                      icon={item.icon}
                      end={item.end}
                      onClick={onClose}
                    >
                      {item.label}
                    </NavLinkWithRouter>
                  </div>
                  <ul className="mg-v2-mobile-lnb-drawer__sublist">
                    {item.children.map((sub) => (
                      <LnbMenuItem
                        key={sub.to}
                        to={sub.to}
                        icon={sub.icon}
                        end={sub.end !== false}
                        onItemClick={onClose}
                      >
                        {sub.label}
                      </LnbMenuItem>
                    ))}
                  </ul>
                </li>
              ) : (
                <LnbMenuItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  end={item.end !== false}
                  onItemClick={onClose}
                >
                  {item.label}
                </LnbMenuItem>
              )
            )}
          </ul>
        </nav>
        {onLogout && (
          <div className="mg-v2-mobile-lnb-drawer__footer">
            <button
              type="button"
              className="mg-v2-mobile-lnb-drawer__logout"
              onClick={onLogout}
              aria-label="로그아웃"
            >
              <LogOut size={20} aria-hidden />
              <span>로그아웃</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default MobileLnbDrawer;
