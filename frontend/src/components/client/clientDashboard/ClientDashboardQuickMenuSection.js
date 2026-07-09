/**
 * Client Dashboard — 빠른 메뉴 4 SSOT (LNB 정합 · v1.4)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  CalendarDays,
  ClipboardList,
  Receipt,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import {
  CLIENT_DASHBOARD_QUICK_MENU_ITEMS,
  buildClientDashboardQuickMenuItemTestId
} from '../../../constants/clientDashboardRoutes';
import ClientDashboardSectionBlock from './ClientDashboardSectionBlock';
import {
  CLIENT_DASHBOARD_QUICK_MENU_SECTION_TEST_ID,
  CLIENT_DASHBOARD_QUICK_MENU_TEST_ID,
  CLIENT_QUICK_SECTION_DESC,
  CLIENT_QUICK_SECTION_TITLE
} from './constants';

const QUICK_BTN_CLASS = `${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-dashboard__quick-btn`;

const QUICK_MENU_ICONS = {
  schedule: CalendarDays,
  'session-management': ClipboardList,
  'payment-history': Receipt,
  settings: Settings
};

const ClientDashboardQuickMenuSection = ({ disabled = false }) => {
  const navigate = useNavigate();

  return (
    <div data-testid={CLIENT_DASHBOARD_QUICK_MENU_TEST_ID}>
      <ClientDashboardSectionBlock
        title={CLIENT_QUICK_SECTION_TITLE}
        subtitle={CLIENT_QUICK_SECTION_DESC}
        accentVariant="primary"
        dataTestId={CLIENT_DASHBOARD_QUICK_MENU_SECTION_TEST_ID}
        className="client-dashboard__section client-dashboard__section--quick"
      >
        <nav className="client-dashboard__quick-grid" aria-label={CLIENT_QUICK_SECTION_TITLE}>
          {CLIENT_DASHBOARD_QUICK_MENU_ITEMS.map((item) => {
            const IconComponent = QUICK_MENU_ICONS[item.id];
            return (
              <MGButton
                key={item.id}
                variant="outline"
                className={QUICK_BTN_CLASS}
                onClick={() => navigate(item.route)}
                preventDoubleClick={false}
                disabled={disabled}
                data-testid={buildClientDashboardQuickMenuItemTestId(item.id)}
              >
                {IconComponent ? <IconComponent size={22} aria-hidden /> : null}
                <span>{item.label}</span>
              </MGButton>
            );
          })}
        </nav>
      </ClientDashboardSectionBlock>
    </div>
  );
};

ClientDashboardQuickMenuSection.propTypes = {
  disabled: PropTypes.bool
};

export default ClientDashboardQuickMenuSection;
