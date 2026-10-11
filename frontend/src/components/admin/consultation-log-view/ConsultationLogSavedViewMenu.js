/**
 * 저장된 보기를 필터 줄의 메뉴 하나로 접는다.
 *
 * @author CoreSolution
 * @since 2026-10-10
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

const ConsultationLogSavedViewMenu = ({
  label,
  emptyLabel,
  saveLabel,
  deleteLabel,
  views,
  activeViewId,
  onSelectView,
  onSaveCurrent,
  onDeleteView
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const namedViews = (views || []).filter((view) => view && view.id && view.label);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="mg-v2-consultation-log-saved" ref={rootRef}>
      <MGButton
        type="button"
        variant="outline"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'outline',
          size: 'md',
          loading: false,
          className: 'mg-v2-consultation-log-saved__trigger'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        preventDoubleClick={false}
      >
        {label}
      </MGButton>
      {open ? (
        <ul className="mg-v2-consultation-log-saved__menu" id={menuId} role="menu">
          {namedViews.length === 0 ? (
            <li role="presentation">
              <span className="mg-v2-consultation-log-saved__empty" role="menuitem">
                {emptyLabel}
              </span>
            </li>
          ) : namedViews.map((view) => (
            <li key={view.id} role="presentation">
              <button
                type="button"
                role="menuitem"
                className="mg-v2-consultation-log-saved__item"
                aria-current={view.id === activeViewId ? 'true' : undefined}
                onClick={() => {
                  setOpen(false);
                  onSelectView(view.id);
                }}
              >
                {view.label}
              </button>
            </li>
          ))}
          <li role="presentation">
            <button
              type="button"
              role="menuitem"
              className="mg-v2-consultation-log-saved__item"
              onClick={() => {
                setOpen(false);
                onSaveCurrent();
              }}
            >
              {saveLabel}
            </button>
          </li>
          {activeViewId ? (
            <li role="presentation">
              <button
                type="button"
                role="menuitem"
                className="mg-v2-consultation-log-saved__item"
                onClick={() => {
                  setOpen(false);
                  onDeleteView(activeViewId);
                }}
              >
                {deleteLabel}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
};

ConsultationLogSavedViewMenu.propTypes = {
  label: PropTypes.string.isRequired,
  emptyLabel: PropTypes.string.isRequired,
  saveLabel: PropTypes.string.isRequired,
  deleteLabel: PropTypes.string.isRequired,
  views: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string
  })),
  activeViewId: PropTypes.string,
  onSelectView: PropTypes.func.isRequired,
  onSaveCurrent: PropTypes.func.isRequired,
  onDeleteView: PropTypes.func.isRequired
};

ConsultationLogSavedViewMenu.defaultProps = {
  views: [],
  activeViewId: ''
};

export default ConsultationLogSavedViewMenu;
