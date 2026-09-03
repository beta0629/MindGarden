/**
 * DesktopLnb - LNB 260px: 다크(var(--mg-dark-bg-800)), 메뉴 리스트 (메인/서브 트리 지원)
 * RESPONSIVE_LAYOUT_SPEC: 사이드바 260px, 배경 var(--mg-dark-bg-800)
 * HTML 유효: ul 직계는 li만. 그룹 시 메인 행은 div+NavLink, 서브만 ul > li(LnbMenuItem).
 * 그룹은 아코디언: 기본 접힘, 헤더 클릭 시 해당 그룹만 펼침.
 *
 * IA 재배치 (V20260606_008, 2026-05-28) + 사용자 관리 숏컷 (V20260727_001):
 *   - 1차: 단독(대시보드/통합 스케줄/사용자 관리) + 그룹 — designer §2/§3 정합
 *   - 활성 항목 좌측 4px accent bar (`--mg-color-primary-500`) — CSS pseudo-element
 *   - ARIA: role="navigation" + aria-expanded(그룹) + aria-current=page(react-router NavLink 자동)
 *   - 그룹 토글: 네이티브 button (Enter/Space 기본 지원) — MGButton chrome 미사용
 *   - React key: menuCode 또는 label::to (동일 path 숏컷·그룹 병존 시 충돌 방지)
 *   - pathname/menuItems 변경 시 아코디언 동기화 (폴백→API hydrate · 서브메뉴 이동)
 *
 * @author CoreSolution
 * @since 2025-02-22 (IA 재배치 2026-05-28)
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NavLinkWithRouter } from '../atoms';
import Icon from '../../ui/Icon/Icon';
import { LnbMenuItem } from '../molecules';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  getInitialExpandedKey,
  getLnbItemKey,
  hasLnbChildren,
  isGroupPathActive,
  lnbSublistId
} from '../utils/lnbAccordion';
import './DesktopLnb.css';

const DesktopLnb = ({ menuItems = [], headerTitle = '운영' }) => {
  const location = useLocation();
  const { pathname } = location;

  const [expandedGroupKey, setExpandedGroupKey] = useState(() =>
    getInitialExpandedKey(menuItems, pathname)
  );

  useEffect(() => {
    setExpandedGroupKey(getInitialExpandedKey(menuItems, pathname));
  }, [pathname, menuItems]);

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
          {menuItems.map((item) => {
            const itemKey = getLnbItemKey(item);
            return hasLnbChildren(item) ? (
              <li
                key={itemKey}
                className={`mg-v2-desktop-lnb__group ${expandedGroupKey === itemKey ? 'mg-v2-desktop-lnb__group--expanded' : ''} ${isGroupPathActive(item, pathname) ? 'mg-v2-desktop-lnb__group--active' : ''}`}
              >
                <div className="mg-v2-desktop-lnb__group-head">
                  <button
                    type="button"
                    className="mg-v2-desktop-lnb__group-chevron"
                    onClick={(e) => handleGroupToggle(e, itemKey)}
                    aria-expanded={expandedGroupKey === itemKey}
                    aria-controls={lnbSublistId('mg-v2-desktop-lnb', itemKey)}
                    aria-label={`${toDisplayString(item.label)} 메뉴 ${expandedGroupKey === itemKey ? '접기' : '펼치기'}`}
                  >
                    {expandedGroupKey === itemKey ? (
                      <Icon name="CHEVRON_DOWN" size="MD" color="INHERIT" aria-hidden />
                    ) : (
                      <Icon name="CHEVRON_RIGHT" size="MD" color="INHERIT" aria-hidden />
                    )}
                  </button>
                  <NavLinkWithRouter
                    to={item.to}
                    icon={item.icon}
                    end
                  >
                    <SafeText>{item.label}</SafeText>
                  </NavLinkWithRouter>
                </div>
                <ul
                  id={lnbSublistId('mg-v2-desktop-lnb', itemKey)}
                  className="mg-v2-desktop-lnb__sublist"
                  role="group"
                  aria-label={toDisplayString(item.label)}
                >
                  {item.children.map((sub) => (
                    <LnbMenuItem
                      key={getLnbItemKey(sub)}
                      to={sub.to}
                      icon={sub.icon}
                      end={sub.end !== false}
                    >
                      <SafeText>{sub.label}</SafeText>
                    </LnbMenuItem>
                  ))}
                </ul>
              </li>
            ) : (
              <LnbMenuItem
                key={itemKey}
                to={item.to}
                icon={item.icon}
                end={item.end !== false}
              >
                <SafeText>{item.label}</SafeText>
              </LnbMenuItem>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default DesktopLnb;
