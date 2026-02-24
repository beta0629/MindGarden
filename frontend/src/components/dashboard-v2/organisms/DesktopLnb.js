/**
 * DesktopLnb - LNB 260px: 다크(#2C2C2C), 메뉴 리스트 (메인/서브 트리 지원)
 * RESPONSIVE_LAYOUT_SPEC: 사이드바 260px, 배경 #2C2C2C
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { LnbMenuItem } from '../molecules';
import './DesktopLnb.css';

const DesktopLnb = ({ menuItems = [], headerTitle = '시스템 관리' }) => {
  const hasChildren = (item) => item.children && item.children.length > 0;

  return (
    <aside className="mg-v2-desktop-lnb" role="navigation" aria-label="좌측 메뉴">
      <div className="mg-v2-desktop-lnb__header">
        <span className="mg-v2-desktop-lnb__title">{headerTitle}</span>
      </div>
      <nav className="mg-v2-desktop-lnb__nav">
        <ul className="mg-v2-desktop-lnb__list">
          {menuItems.map((item) =>
            hasChildren(item) ? (
              <li key={item.to} className="mg-v2-desktop-lnb__group">
                <LnbMenuItem to={item.to} icon={item.icon} end={item.end}>
                  {item.label}
                </LnbMenuItem>
                <ul className="mg-v2-desktop-lnb__sublist">
                  {item.children.map((sub) => (
                    <LnbMenuItem
                      key={sub.to}
                      to={sub.to}
                      icon={sub.icon}
                      end={sub.end !== false}
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
              >
                {item.label}
              </LnbMenuItem>
            )
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default DesktopLnb;
