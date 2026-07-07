/**
 * Client Dashboard — 빠른 메뉴 섹션
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  CalendarDays,
  MessageCircle,
  User,
  Headphones,
  BookOpen
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MGButton from '../../common/MGButton';
import { ContentSection } from '../../dashboard-v2/content';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import {
  CLIENT_DASHBOARD_QUICK_MENU_SECTION_TEST_ID,
  CLIENT_DASHBOARD_QUICK_MENU_TEST_ID,
  CLIENT_QUICK_SECTION_DESC,
  CLIENT_QUICK_SECTION_TITLE
} from './constants';

const QUICK_BTN_CLASS = `${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-dashboard__quick-btn`;

const ClientDashboardQuickMenuSection = ({
  onNavigateSchedule,
  onNavigateMessages,
  onNavigateSettings,
  onCustomerSupport,
  onNavigateWellness
}) => {
  const { t } = useTranslation();

  return (
    <div data-testid={CLIENT_DASHBOARD_QUICK_MENU_TEST_ID}>
      <ContentSection
        title={CLIENT_QUICK_SECTION_TITLE}
        subtitle={CLIENT_QUICK_SECTION_DESC}
        className="client-dashboard__section client-dashboard__section--quick"
        dataTestId={CLIENT_DASHBOARD_QUICK_MENU_SECTION_TEST_ID}
        noCard
      >
        <nav className="client-dashboard__quick-grid" aria-label={CLIENT_QUICK_SECTION_TITLE}>
          <MGButton
            variant="outline"
            className={QUICK_BTN_CLASS}
            onClick={onNavigateSchedule}
            preventDoubleClick={false}
          >
            <CalendarDays size={22} aria-hidden />
            <span>일정</span>
          </MGButton>
          <MGButton
            variant="outline"
            className={QUICK_BTN_CLASS}
            onClick={onNavigateMessages}
            preventDoubleClick={false}
          >
            <MessageCircle size={22} aria-hidden />
            <span>{t('admin.labels.message')}</span>
          </MGButton>
          <MGButton
            variant="outline"
            className={QUICK_BTN_CLASS}
            onClick={onNavigateSettings}
            preventDoubleClick={false}
          >
            <User size={22} aria-hidden />
            <span>설정</span>
          </MGButton>
          <MGButton
            variant="outline"
            className={QUICK_BTN_CLASS}
            onClick={onCustomerSupport}
            preventDoubleClick={false}
          >
            <Headphones size={22} aria-hidden />
            <span>고객센터</span>
          </MGButton>
          <MGButton
            variant="outline"
            className={QUICK_BTN_CLASS}
            onClick={onNavigateWellness}
            preventDoubleClick={false}
          >
            <BookOpen size={22} aria-hidden />
            <span>자료실</span>
          </MGButton>
        </nav>
      </ContentSection>
    </div>
  );
};

ClientDashboardQuickMenuSection.propTypes = {
  onNavigateSchedule: PropTypes.func.isRequired,
  onNavigateMessages: PropTypes.func.isRequired,
  onNavigateSettings: PropTypes.func.isRequired,
  onCustomerSupport: PropTypes.func.isRequired,
  onNavigateWellness: PropTypes.func.isRequired
};

export default ClientDashboardQuickMenuSection;
