/**
 * QuickActionsDropdown - 역할별 빠른 액션 드롭다운 (Molecule)
 * Portal + position:fixed 로 전역 overflow/transform 영향 없음
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { NavIcon } from '../atoms';
import { sessionManager } from '../../../utils/sessionManager';
import { getQuickActionsForRole } from '../../../constants/gnbQuickActions';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import GnbDropdownPortal from './GnbDropdownPortal';
import './QuickActionsDropdown.css';

const QUICK_ACTIONS_PANEL_ID = 'mg-v2-quick-actions-panel';

const QuickActionsDropdown = ({ onModalAction, navigateQuickActionsFromLnb }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actions, setActions] = useState([]);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const panelStyle = useDropdownPosition(triggerRef, panelRef, isOpen);

  useEffect(() => {
    const user = sessionManager.getUser();
    const roleRaw = user?.role;
    const normalizedRole = roleRaw ? String(roleRaw).toUpperCase() : '';
    const isAdminOrStaff = normalizedRole === 'ADMIN' || normalizedRole === 'STAFF';
    const fromLnb = navigateQuickActionsFromLnb;
    if (
      isAdminOrStaff &&
      Array.isArray(fromLnb) &&
      fromLnb.length > 0
    ) {
      setActions(fromLnb);
      return;
    }
    setActions(getQuickActionsForRole(roleRaw));
  }, [navigateQuickActionsFromLnb]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const { target } = event;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleActionClick = (action) => {
    if (action.type === 'navigate') {
      navigate(action.action);
    } else if (action.type === 'modal' && onModalAction) {
      onModalAction(action.action);
    }
    setIsOpen(false);
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="mg-v2-quick-actions-dropdown" ref={dropdownRef}>
      <div ref={triggerRef}>
        <NavIcon
          icon="ZAP"
          label="빠른 액션"
          onClick={() => setIsOpen(!isOpen)}
          className="mg-v2-quick-actions-trigger"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls={QUICK_ACTIONS_PANEL_ID}
        />
      </div>

      <GnbDropdownPortal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        panelRef={panelRef}
        panelStyle={panelStyle}
        panelClassName="mg-v2-dropdown-panel mg-v2-quick-actions-dropdown__panel"
        panelRole="menu"
        panelId={QUICK_ACTIONS_PANEL_ID}
      >
        <div className="mg-v2-dropdown-panel__header">
          <span className="mg-v2-dropdown-panel__title">빠른 액션</span>
        </div>

        <div className="mg-v2-quick-actions-list">
          {actions.map((action) => (
              <MGButton
                key={action.id}
                type="button"
                variant="outline"
                preventDoubleClick={false}
                className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false, className: 'mg-v2-quick-action-item' })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => handleActionClick(action)}
              >
                <SafeText className="mg-v2-quick-action-item__label" tag="span">{action.label}</SafeText>
              </MGButton>
          ))}
        </div>
      </GnbDropdownPortal>
    </div>
  );
};

QuickActionsDropdown.propTypes = {
  onModalAction: PropTypes.func,
  navigateQuickActionsFromLnb: PropTypes.arrayOf(PropTypes.object)
};

export default QuickActionsDropdown;
