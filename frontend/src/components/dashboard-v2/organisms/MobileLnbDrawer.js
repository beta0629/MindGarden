/**
 * MobileLnbDrawer - 280px 슬라이드 드로어, 오버레이
 * RESPONSIVE_LAYOUT_SPEC: 모바일 LNB 280px
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useEffect } from 'react';
import { LnbMenuItem } from '../molecules';
import './MobileLnbDrawer.css';

const MobileLnbDrawer = ({ isOpen, onClose, menuItems = [], headerTitle = '시스템 관리' }) => {
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
            {menuItems.map((item) => (
              <LnbMenuItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                end={item.end}
                onItemClick={onClose}
              >
                {item.label}
              </LnbMenuItem>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default MobileLnbDrawer;
