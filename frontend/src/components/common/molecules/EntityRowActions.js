/**
 * EntityRowActions — B2B admin 행·카드 overflow 메뉴 (⋮)
 * Primary는 행/카드 클릭으로 처리하고, 수정·삭제 등은 overflow에 배치.
 *
 * @author CoreSolution
 * @since 2026-06-29
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { MoreVertical } from 'lucide-react';
import MGButton from '../MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import './EntityRowActions.css';

export const ENTITY_ROW_ACTIONS_LAYOUT = {
  TABLE: 'table',
  CARD: 'card',
  CORNER: 'corner'
};

const ICON_SIZE = 16;
const MENU_GAP_PX = 4;
const MENU_ESTIMATE_HEIGHT_PX = 160;

function EntityRowActions({
  items = [],
  primaryAction = null,
  layout = ENTITY_ROW_ACTIONS_LAYOUT.TABLE,
  ariaLabel = '작업 메뉴',
  menuId: menuIdProp
}) {
  const [open, setOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState(null);
  const [openUpward, setOpenUpward] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const ignoreOutsideUntilRef = useRef(false);
  const autoMenuId = useId();
  const menuId = menuIdProp || autoMenuId;

  const visibleItems = items.filter((item) => !item.hidden);
  const regularItems = visibleItems.filter((item) => item.variant !== 'destructive');
  const destructiveItems = visibleItems.filter((item) => item.variant === 'destructive');

  const close = useCallback(() => setOpen(false), []);

  const computeMenuCoords = useCallback(() => {
    if (!triggerRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight || MENU_ESTIMATE_HEIGHT_PX;
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUpward = spaceBelow < menuHeight + MENU_GAP_PX
      && rect.top > menuHeight + MENU_GAP_PX;

    setOpenUpward(shouldOpenUpward);

    if (shouldOpenUpward) {
      return {
        position: 'fixed',
        top: `${Math.max(MENU_GAP_PX, rect.top - menuHeight - MENU_GAP_PX)}px`,
        right: `${window.innerWidth - rect.right}px`,
        visibility: 'visible'
      };
    }

    return {
      position: 'fixed',
      top: `${rect.bottom + MENU_GAP_PX}px`,
      right: `${window.innerWidth - rect.right}px`,
      visibility: 'visible'
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuCoords(null);
      setOpenUpward(false);
      return undefined;
    }

    const updatePosition = () => {
      setMenuCoords(computeMenuCoords());
    };

    updatePosition();
    requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, computeMenuCoords, visibleItems.length]);

  useEffect(() => {
    if (!open) return undefined;

    const isInside = (event) => {
      const target = event.target;
      return Boolean(
        rootRef.current?.contains(target)
        || menuRef.current?.contains(target)
        || triggerRef.current?.contains(target)
      );
    };

    const handleOutside = (event) => {
      if (ignoreOutsideUntilRef.current) return;
      if (!isInside(event)) {
        close();
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') close();
    };

    // mousedown 대신 click + rAF 지연: 트리거 클릭과 동일 턴에서 즉시 닫히는 레이스 방지
    const listenerFrame = requestAnimationFrame(() => {
      document.addEventListener('click', handleOutside, true);
    });

    document.addEventListener('keydown', handleEscape);
    return () => {
      cancelAnimationFrame(listenerFrame);
      document.removeEventListener('click', handleOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const handleToggle = (event) => {
    event.stopPropagation();
    ignoreOutsideUntilRef.current = true;
    setOpen((prev) => !prev);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ignoreOutsideUntilRef.current = false;
      });
    });
  };

  const handleItemClick = (item) => (event) => {
    event.stopPropagation();
    if (item.disabled) return;
    close();
    item.onClick?.(event);
  };

  const handlePrimaryClick = (event) => {
    event.stopPropagation();
    primaryAction?.onClick?.(event);
  };

  if (visibleItems.length === 0 && !primaryAction) {
    return null;
  }

  const rootClass = [
    'mg-v2-entity-row-actions',
    `mg-v2-entity-row-actions--${layout}`,
    open && 'mg-v2-entity-row-actions--open'
  ].filter(Boolean).join(' ');

  const menuClassName = [
    'mg-v2-entity-row-actions__menu',
    'mg-v2-entity-row-actions__menu--portal',
    openUpward && 'mg-v2-entity-row-actions__menu--open-upward'
  ].filter(Boolean).join(' ');

  const portalMenuStyle = open
    ? {
      ...(menuCoords || { position: 'fixed', visibility: 'hidden' }),
      zIndex: 'var(--z-modal, 10000)'
    }
    : undefined;

  const menuNode = open ? (
    <div
      ref={menuRef}
      id={menuId}
      className={menuClassName}
      role="menu"
      data-mg-managed-position="entity-row-actions"
      style={portalMenuStyle}
    >
      {regularItems.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className="mg-v2-entity-row-actions__menu-item"
          disabled={item.disabled}
          title={item.title}
          data-testid={item.testId}
          aria-busy={item.busy === true ? 'true' : undefined}
          onClick={handleItemClick(item)}
        >
          {item.label}
        </button>
      ))}
      {regularItems.length > 0 && destructiveItems.length > 0 && (
        <div className="mg-v2-entity-row-actions__menu-divider" role="separator" />
      )}
      {destructiveItems.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className="mg-v2-entity-row-actions__menu-item mg-v2-entity-row-actions__menu-item--destructive"
          disabled={item.disabled}
          title={item.title}
          data-testid={item.testId}
          aria-busy={item.busy === true ? 'true' : undefined}
          onClick={handleItemClick(item)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={rootClass}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onPointerDown={stopPropagation}
      onKeyDown={stopPropagation}
      role="group"
      aria-label={ariaLabel}
    >
      {primaryAction && (
        <MGButton
          type="button"
          variant="secondary"
          size="small"
          className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={handlePrimaryClick}
          preventDoubleClick={true}
        >
          {primaryAction.label}
        </MGButton>
      )}
      {visibleItems.length > 0 && (
        <div
          ref={triggerRef}
          className="mg-v2-entity-row-actions__menu-wrap"
          onMouseDown={stopPropagation}
          onPointerDown={stopPropagation}
        >
          <MGButton
            type="button"
            variant="ghost"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'ghost',
              size: 'sm',
              loading: false,
              className: 'mg-v2-entity-row-actions__trigger'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            aria-label="더보기"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            title="더보기"
            onClick={handleToggle}
            preventDoubleClick={false}
          >
            <MoreVertical size={ICON_SIZE} aria-hidden="true" />
          </MGButton>
          {menuNode && typeof document !== 'undefined'
            ? ReactDOM.createPortal(menuNode, document.body)
            : null}
        </div>
      )}
    </div>
  );
}

EntityRowActions.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      variant: PropTypes.oneOf(['default', 'destructive']),
      disabled: PropTypes.bool,
      hidden: PropTypes.bool,
      title: PropTypes.string,
      testId: PropTypes.string,
      busy: PropTypes.bool
    })
  ),
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  }),
  layout: PropTypes.oneOf(Object.values(ENTITY_ROW_ACTIONS_LAYOUT)),
  ariaLabel: PropTypes.string,
  menuId: PropTypes.string
};

export default EntityRowActions;
