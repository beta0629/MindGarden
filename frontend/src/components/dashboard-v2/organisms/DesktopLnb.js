/**
 * DesktopLnb - LNB 260px: 다크(#2C2C2C), 메뉴 리스트 (메인/서브 트리 지원)
 * RESPONSIVE_LAYOUT_SPEC: 사이드바 260px, 배경 #2C2C2C
 * HTML 유효: ul 직계는 li만. 그룹 시 메인 행은 div+NavLink, 서브만 ul > li(LnbMenuItem).
 * 그룹은 아코디언: 기본 접힘, 헤더 클릭 시 해당 그룹만 펼침.
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { NavLinkWithRouter } from '../atoms';
import { LnbMenuItem } from '../molecules';
import './DesktopLnb.css';

const hasChildren = (item) => item.children && item.children.length > 0;

/** 현재 경로가 속한 그룹의 key(item.to) 반환, 없으면 null */
const getInitialExpandedKey = (items, pathname) => {
  const group = items.find(
    (item) =>
      hasChildren(item) &&
      (pathname === item.to ||
        item.children.some(
          (sub) => pathname === sub.to || pathname.startsWith(sub.to + '/')
        ))
  );
  return group ? group.to : null;
};

const sublistId = (prefix, itemTo) =>
  `${prefix}-sublist-${itemTo.replaceAll('/', '-').replace(/^-/, '')}`;

const DesktopLnb = ({ menuItems = [], headerTitle = '시스템 관리' }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const [expandedGroupKey, setExpandedGroupKey] = useState(() =>
    getInitialExpandedKey(menuItems, pathname)
  );

  const handleGroupToggle = (e, groupKey) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedGroupKey((prev) => (prev === groupKey ? null : groupKey));
  };

  return (
    <aside className="mg-v2-desktop-lnb" role="navigation" aria-label="좌측 메뉴">
      <div className="mg-v2-desktop-lnb__header">
        <span className="mg-v2-desktop-lnb__title">{headerTitle}</span>
      </div>
      <nav className="mg-v2-desktop-lnb__nav">
        <ul className="mg-v2-desktop-lnb__list">
          {menuItems.map((item) =>
            hasChildren(item) ? (
              <li
                key={item.to}
                className={`mg-v2-desktop-lnb__group ${expandedGroupKey === item.to ? 'mg-v2-desktop-lnb__group--expanded' : ''}`}
              >
                <div className="mg-v2-desktop-lnb__group-head">
                  <button
                    type="button"
                    className="mg-v2-desktop-lnb__group-chevron"
                    onClick={(e) => handleGroupToggle(e, item.to)}
                    aria-expanded={expandedGroupKey === item.to}
                    aria-controls={sublistId('mg-v2-desktop-lnb', item.to)}
                    aria-label={`${item.label} 메뉴 ${expandedGroupKey === item.to ? '접기' : '펼치기'}`}
                  >
                    {expandedGroupKey === item.to ? (
                      <ChevronDown size={18} aria-hidden />
                    ) : (
                      <ChevronRight size={18} aria-hidden />
                    )}
                  </button>
                  <NavLinkWithRouter
                    to={item.to}
                    icon={item.icon}
                    end={item.end}
                  >
                    {item.label}
                  </NavLinkWithRouter>
                </div>
                <ul
                  id={sublistId('mg-v2-desktop-lnb', item.to)}
                  className="mg-v2-desktop-lnb__sublist"
                  role="group"
                  aria-label={item.label}
                >
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
