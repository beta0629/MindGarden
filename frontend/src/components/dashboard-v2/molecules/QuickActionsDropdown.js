/**
 * QuickActionsDropdown - 역할별 빠른 액션 드롭다운 (Molecule)
 * Portal + position:fixed 로 전역 overflow/transform 영향 없음
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavIcon } from '../atoms';
import { sessionManager } from '../../../utils/sessionManager';
import { getQuickActionsForRole } from '../../../constants/gnbQuickActions';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import SafeText from '../../common/SafeText';
import '../styles/dropdown-common.css';
import './QuickActionsDropdown.css';

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
      const target = event.target;
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
          icon={Zap}
          label="빠른 액션"
          onClick={() => setIsOpen(!isOpen)}
          className="mg-v2-quick-actions-trigger"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        />
      </div>

      {isOpen && ReactDOM.createPortal(
        <>
          <button
            className="mg-v2-dropdown-overlay"
            onClick={() => setIsOpen(false)}
            type="button"
            aria-label="드롭다운 닫기"
          />
          <div
            ref={panelRef}
            className="mg-v2-dropdown-panel mg-v2-quick-actions-dropdown__panel"
            role="menu"
            style={panelStyle}
          >
            <div className="mg-v2-dropdown-panel__header">
              <span className="mg-v2-dropdown-panel__title">빠른 액션</span>
            </div>

            <div className="mg-v2-quick-actions-list">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    className="mg-v2-quick-action-item"
                    onClick={() => handleActionClick(action)}
                    type="button"
                  >
                    <Icon size={20} className="mg-v2-quick-action-item__icon" />
                    <SafeText className="mg-v2-quick-action-item__label" tag="span">{action.label}</SafeText>
                    <ChevronRight size={16} className="mg-v2-quick-action-item__arrow" />
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

QuickActionsDropdown.propTypes = {
  onModalAction: PropTypes.func,
  navigateQuickActionsFromLnb: PropTypes.arrayOf(PropTypes.object)
};

export default QuickActionsDropdown;
