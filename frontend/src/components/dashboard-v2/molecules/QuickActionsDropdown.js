/**
 * QuickActionsDropdown - 역할별 빠른 액션 드롭다운 (Molecule)
 * 
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavIcon } from '../atoms';
import { sessionManager } from '../../../utils/sessionManager';
import { getQuickActionsForRole } from '../../../constants/gnbQuickActions';
import './QuickActionsDropdown.css';

const QuickActionsDropdown = ({ onModalAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actions, setActions] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = sessionManager.getUser();
    const role = user?.role;
    const roleActions = getQuickActionsForRole(role);
    setActions(roleActions);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
      <NavIcon
        icon={Zap}
        label="빠른 액션"
        onClick={() => setIsOpen(!isOpen)}
        className="mg-v2-quick-actions-trigger"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      />

      {isOpen && (
        <>
          <button 
            className="mg-v2-dropdown-overlay" 
            onClick={() => setIsOpen(false)}
            type="button"
            aria-label="드롭다운 닫기"
          />
          <div className="mg-v2-dropdown-panel mg-v2-quick-actions-dropdown__panel" role="menu">
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
                    <span className="mg-v2-quick-action-item__label">{action.label}</span>
                    <ChevronRight size={16} className="mg-v2-quick-action-item__arrow" />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

QuickActionsDropdown.propTypes = {
  onModalAction: PropTypes.func
};

export default QuickActionsDropdown;
