/**
 * QuickActionsDropdown - 역할별 빠른 액션 드롭다운 (Molecule)
 * Portal + position:fixed 로 전역 overflow/transform 영향 없음
 * Flush HeaderMenuRow — MGButton outline chrome 미사용
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { NavIcon, HeaderMenuRow } from '../atoms';
import { sessionManager } from '../../../utils/sessionManager';
import { getQuickActionsForRole } from '../../../constants/gnbQuickActions';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import SafeText from '../../common/SafeText';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import GnbDropdownPortal from './GnbDropdownPortal';
import './QuickActionsDropdown.css';
import { USER_ROLES } from '../../../constants/roles';

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
    const isAdminOrStaff = normalizedRole === USER_ROLES.ADMIN || normalizedRole === USER_ROLES.STAFF;
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

  const ChevronIcon = ICONS.CHEVRON_RIGHT;

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

        <div className="mg-v2-quick-actions-list" role="none">
          {actions.map((action) => {
            const ActionIcon = action.icon ? ICONS[action.icon] : null;
            return (
              <HeaderMenuRow
                key={action.id}
                className="mg-v2-quick-action-item"
                onClick={() => handleActionClick(action)}
              >
                {ActionIcon ? (
                  <span className="mg-v2-quick-action-item__icon" aria-hidden="true">
                    <ActionIcon size={ICON_SIZES.LG} strokeWidth={2} />
                  </span>
                ) : null}
                <SafeText className="mg-v2-quick-action-item__label" tag="span">
                  {action.label}
                </SafeText>
                {ChevronIcon ? (
                  <span className="mg-v2-quick-action-item__arrow" aria-hidden="true">
                    <ChevronIcon size={ICON_SIZES.MD} strokeWidth={2} />
                  </span>
                ) : null}
              </HeaderMenuRow>
            );
          })}
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
