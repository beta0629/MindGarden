/**
 * MobileLnbDrawer - 280px 슬라이드 드로어, 오버레이 (메인/서브 트리 지원)
 * soft-sheet: stone 면 · dialog a11y(열릴 때만) · 상담사 primary / 관리자 slate 활성
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import useCoverDrawerFocus from '../../common/coverChapter/useCoverDrawerFocus';
import '../../common/coverChapter/CoverChapterMotion.css';
import { useLocation } from 'react-router-dom';
import { NavLinkWithRouter } from '../atoms';
import Icon from '../../ui/Icon/Icon';
import { LnbMenuItem } from '../molecules';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  getInitialExpandedKey,
  getLnbItemKey,
  hasLnbChildren,
  isGroupPathActive,
  lnbSublistId
} from '../utils/lnbAccordion';
import './MobileLnbDrawer.css';

/** soft-sheet ☰ 드로어 — 하네스·테스트 셀렉터 */
export const COUNSELOR_MENU_DRAWER_TEST_ID = 'counselor-menu-drawer';
export const ADMIN_MENU_DRAWER_TEST_ID = 'admin-menu-drawer';
const SOFT_SHEET_MENU_TRIGGER_SELECTOR = '.mg-v2-mobile-gnb__menu';
const SOFT_SHEET_DRAWER_DOM_ID = 'mg-v2-soft-sheet-drawer';

const MobileLnbDrawer = ({
  isOpen,
  onClose,
  menuItems = [],
  headerTitle = '운영',
  onLogout,
  variant,
  /** 'primary'(상담사) | 'slate'(관리자) — soft-sheet 활성 강조 */
  activeTone
}) => {
  const location = useLocation();
  const { pathname } = location;
  const isSoftSheet = variant === 'soft-sheet';
  const isAdminSlate = isSoftSheet && activeTone === 'slate';
  const panelRef = useRef(null);
  const titleId = useId();
  const resolvedTitle = isSoftSheet && isAdminSlate
    ? '메뉴'
    : (headerTitle || (isSoftSheet ? '메뉴' : '운영'));

  /* soft-sheet: 공통 훅(포커스·Tab 트랩·Esc·☰ 복귀) */
  useCoverDrawerFocus({
    isOpen: isSoftSheet && isOpen,
    panelRef,
    onClose,
    returnFocusSelector: SOFT_SHEET_MENU_TRIGGER_SELECTOR
  });

  const [expandedGroupKey, setExpandedGroupKey] = useState(() =>
    getInitialExpandedKey(menuItems, pathname)
  );

  useEffect(() => {
    setExpandedGroupKey(getInitialExpandedKey(menuItems, pathname));
  }, [pathname, menuItems]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isSoftSheet) {
      return undefined;
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSoftSheet, onClose]);

  const handleGroupToggle = (e, groupKey) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedGroupKey((prev) => (prev === groupKey ? null : groupKey));
  };

  const drawerClassName = [
    'mg-v2-mobile-lnb-drawer',
    isOpen ? 'mg-v2-mobile-lnb-drawer--open' : '',
    isSoftSheet ? 'mg-v2-mobile-lnb-drawer--soft-sheet' : '',
    isAdminSlate ? 'mg-v2-mobile-lnb-drawer--admin-slate' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const softSheetDialogProps = isSoftSheet
    ? (isOpen
      ? {
        id: SOFT_SHEET_DRAWER_DOM_ID,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        'aria-hidden': 'false',
        'data-testid': isAdminSlate ? ADMIN_MENU_DRAWER_TEST_ID : COUNSELOR_MENU_DRAWER_TEST_ID
      }
      : {
        id: SOFT_SHEET_DRAWER_DOM_ID,
        'aria-hidden': 'true',
        'aria-label': resolvedTitle,
        'data-testid': isAdminSlate ? ADMIN_MENU_DRAWER_TEST_ID : COUNSELOR_MENU_DRAWER_TEST_ID
      })
    : {
      role: 'navigation',
      'aria-label': '메뉴'
    };

  const overlayClassName = [
    'mg-v2-mobile-lnb-overlay',
    isOpen ? 'mg-v2-mobile-lnb-overlay--open' : '',
    isSoftSheet ? 'mg-v2-mobile-lnb-overlay--soft-sheet' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={overlayClassName}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="메뉴 닫기"
        aria-hidden={!isOpen}
      />
      <aside
        ref={panelRef}
        className={drawerClassName}
        {...softSheetDialogProps}
      >
        <div className="mg-v2-mobile-lnb-drawer__header">
          <span className="mg-v2-mobile-lnb-drawer__title" id={isSoftSheet ? titleId : undefined}>
            {resolvedTitle}
          </span>
          {isSoftSheet ? (
            <MGButton
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: 'mg-v2-mobile-lnb-drawer__close'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onClose}
              preventDoubleClick={false}
              aria-label="메뉴 닫기"
            >
              <Icon name="X" size="MD" color="INHERIT" aria-hidden />
            </MGButton>
          ) : null}
        </div>
        <nav className="mg-v2-mobile-lnb-drawer__nav" aria-label="메뉴 목록">
          <ul className="mg-v2-mobile-lnb-drawer__list">
            {menuItems.map((item) => {
              const itemKey = getLnbItemKey(item);
              return hasLnbChildren(item) ? (
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
                      aria-controls={lnbSublistId('mg-v2-mobile-lnb', itemKey)}
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
                      onClick={onClose}
                    >
                      <SafeText>{item.label}</SafeText>
                    </NavLinkWithRouter>
                  </div>
                  <ul
                    id={lnbSublistId('mg-v2-mobile-lnb', itemKey)}
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
