/**
 * MobileLnbDrawer - 280px 슬라이드 드로어, 오버레이 (메인/서브 트리 지원)
 * RESPONSIVE_LAYOUT_SPEC: 모바일 LNB 280px
 * 그룹은 아코디언: 기본 접힘, 헤더 클릭 시 해당 그룹만 펼침.
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, ChevronRight, ChevronDown } from 'lucide-react';
import { NavLinkWithRouter } from '../atoms';
import { LnbMenuItem } from '../molecules';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import './MobileLnbDrawer.css';

const hasChildren = (item) => item.children && item.children.length > 0;
const EXPANDED_GROUP_STORAGE_KEY = 'mg:v2:lnb:mobile:expanded-group';

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

const MobileLnbDrawer = ({ isOpen, onClose, menuItems = [], headerTitle = '시스템 관리', onLogout }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const [expandedGroupKey, setExpandedGroupKey] = useState(() => {
    const initial = getInitialExpandedKey(menuItems, pathname);
    if (typeof globalThis.window === 'undefined') return initial;
    const saved = globalThis.window.sessionStorage.getItem(EXPANDED_GROUP_STORAGE_KEY);
    if (saved && menuItems.some((m) => hasChildren(m) && m.to === saved)) {
      return saved;
    }
    return initial;
  });

  useEffect(() => {
    if (typeof globalThis.window === 'undefined') return;
    if (!expandedGroupKey) {
      globalThis.window.sessionStorage.removeItem(EXPANDED_GROUP_STORAGE_KEY);
      return;
    }
    globalThis.window.sessionStorage.setItem(EXPANDED_GROUP_STORAGE_KEY, expandedGroupKey);
  }, [expandedGroupKey]);

  useEffect(() => {
    if (!expandedGroupKey) return;
    const exists = menuItems.some((item) => hasChildren(item) && item.to === expandedGroupKey);
    if (!exists) {
      setExpandedGroupKey(getInitialExpandedKey(menuItems, pathname));
    }
  }, [expandedGroupKey, menuItems, pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleGroupToggle = (e, groupKey) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedGroupKey((prev) => (prev === groupKey ? null : groupKey));
  };

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
                <li
                  key={item.to}
                  className={`mg-v2-mobile-lnb-drawer__group ${expandedGroupKey === item.to ? 'mg-v2-mobile-lnb-drawer__group--expanded' : ''}`}
                >
                  <div className="mg-v2-mobile-lnb-drawer__group-head">
                    <button
                      type="button"
                      className="mg-v2-mobile-lnb-drawer__group-chevron"
                      onClick={(e) => handleGroupToggle(e, item.to)}
                      aria-expanded={expandedGroupKey === item.to}
                      aria-controls={sublistId('mg-v2-mobile-lnb', item.to)}
                      aria-label={`${toDisplayString(item.label)} 메뉴 ${expandedGroupKey === item.to ? '접기' : '펼치기'}`}
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
                      onClick={onClose}
                    >
                      <SafeText>{item.label}</SafeText>
                    </NavLinkWithRouter>
                  </div>
                  <ul
                    id={sublistId('mg-v2-mobile-lnb', item.to)}
                    className="mg-v2-mobile-lnb-drawer__sublist"
                    role="group"
                    aria-label={toDisplayString(item.label)}
                  >
                    {item.children.map((sub) => (
                      <LnbMenuItem
                        key={sub.to}
                        to={sub.to}
                        icon={sub.icon}
                        end={sub.end !== false}
                        onItemClick={onClose}
                      >
                        <SafeText>{sub.label}</SafeText>
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
                  <SafeText>{item.label}</SafeText>
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
