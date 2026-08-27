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
import { NavLinkWithRouter } from '../atoms';
import Icon from '../../ui/Icon/Icon';
import { LnbMenuItem } from '../molecules';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import './MobileLnbDrawer.css';

const hasChildren = (item) => item.children && item.children.length > 0;

/** 동일 path 숏컷·그룹 병존 시 React key / 아코디언 key 충돌 방지 */
const getLnbItemKey = (item) => {
  if (item?.menuCode) {
    return String(item.menuCode);
  }
  return `${toDisplayString(item?.label)}::${String(item?.to ?? '')}`;
};

/** 현재 경로가 속한 그룹의 key 반환, 없으면 null */
const getInitialExpandedKey = (items, pathname) => {
  const group = items.find(
    (item) =>
      hasChildren(item) &&
      (pathname === item.to ||
        item.children.some(
          (sub) => pathname === sub.to || pathname.startsWith(`${sub.to}/`)
        ))
  );
  return group ? getLnbItemKey(group) : null;
};

/** 그룹 본인 또는 하위가 현재 경로면 그룹 헤드 활성 */
const isGroupPathActive = (item, pathname) => {
  if (!item) {
    return false;
  }
  if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
    return true;
  }
  return (item.children || []).some(
    (sub) => pathname === sub.to || pathname.startsWith(`${sub.to}/`)
  );
};

const sublistId = (prefix, itemKey) =>
  `${prefix}-sublist-${String(itemKey).replaceAll('/', '-').replace(/^-/, '')}`;

const MobileLnbDrawer = ({ isOpen, onClose, menuItems = [], headerTitle = '시스템 관리', onLogout }) => {
  const location = useLocation();
  const { pathname } = location;

  const [expandedGroupKey, setExpandedGroupKey] = useState(() =>
    getInitialExpandedKey(menuItems, pathname)
  );

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
            {menuItems.map((item) => {
              const itemKey = getLnbItemKey(item);
              return hasChildren(item) ? (
                <li
                  key={itemKey}
                  className={`mg-v2-mobile-lnb-drawer__group ${expandedGroupKey === itemKey ? 'mg-v2-mobile-lnb-drawer__group--expanded' : ''} ${isGroupPathActive(item, pathname) ? 'mg-v2-mobile-lnb-drawer__group--active' : ''}`}
                >
                  <div className="mg-v2-mobile-lnb-drawer__group-head">
                    <button
                      type="button"
                      className="mg-v2-mobile-lnb-drawer__group-chevron"
                      onClick={(e) => handleGroupToggle(e, itemKey)}
                      aria-expanded={expandedGroupKey === itemKey}
                      aria-controls={sublistId('mg-v2-mobile-lnb', itemKey)}
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
                      end={item.end}
                      onClick={onClose}
                    >
                      <SafeText>{item.label}</SafeText>
                    </NavLinkWithRouter>
                  </div>
                  <ul
                    id={sublistId('mg-v2-mobile-lnb', itemKey)}
                    className="mg-v2-mobile-lnb-drawer__sublist"
                    role="group"
                    aria-label={toDisplayString(item.label)}
                  >
                    {item.children.map((sub) => (
                      <LnbMenuItem
                        key={getLnbItemKey(sub)}
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
                  key={itemKey}
                  to={item.to}
                  icon={item.icon}
                  end={item.end !== false}
                  onItemClick={onClose}
                >
                  <SafeText>{item.label}</SafeText>
                </LnbMenuItem>
              );
            })}
          </ul>
        </nav>
        {onLogout && (
          <div className="mg-v2-mobile-lnb-drawer__footer">
            <MGButton
              type="button"
              variant="outline"
              size="medium"
              fullWidth
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: 'mg-v2-mobile-lnb-drawer__logout'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onLogout}
              preventDoubleClick={false}
              aria-label="로그아웃"
            >
              <Icon name="LOG_OUT" size="MD" color="TRANSPARENT" aria-hidden />
              <span>로그아웃</span>
            </MGButton>
          </div>
        )}
      </aside>
    </>
  );
};

export default MobileLnbDrawer;
