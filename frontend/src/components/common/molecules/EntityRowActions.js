/**
 * EntityRowActions — B2B admin 행·카드 overflow 메뉴 (⋮)
 * Primary는 행/카드 클릭으로 처리하고, 수정·삭제 등은 overflow에 배치.
 *
 * @author CoreSolution
 * @since 2026-06-29
 */

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
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

function EntityRowActions({
  items = [],
  primaryAction = null,
  layout = ENTITY_ROW_ACTIONS_LAYOUT.TABLE,
  ariaLabel = '작업 메뉴',
  menuId: menuIdProp
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const autoMenuId = useId();
  const menuId = menuIdProp || autoMenuId;

  const visibleItems = items.filter((item) => !item.hidden);
  const regularItems = visibleItems.filter((item) => item.variant !== 'destructive');
  const destructiveItems = visibleItems.filter((item) => item.variant === 'destructive');

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        close();
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const handleToggle = (event) => {
    event.stopPropagation();
    setOpen((prev) => !prev);
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

  return (
    <div
      ref={rootRef}
      className={rootClass}
      onClick={stopPropagation}
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
        <div className="mg-v2-entity-row-actions__menu-wrap">
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
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
          {open && (
            <div
              id={menuId}
              className="mg-v2-entity-row-actions__menu"
              role="menu"
            >
              {regularItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className="mg-v2-entity-row-actions__menu-item"
                  disabled={item.disabled}
                  title={item.title}
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
                  onClick={handleItemClick(item)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
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
      title: PropTypes.string
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
