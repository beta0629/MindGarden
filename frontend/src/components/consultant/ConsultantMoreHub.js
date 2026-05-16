/**
 * ConsultantMoreHub — 상담사「더보기」진입 시 메뉴 허브
 *
 * @author MindGarden
 * @since 2026-05-15
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Wallet, ChevronRight, BarChart3, Inbox } from 'lucide-react';
import { useConsultantSalaryCalculations } from '../../hooks/useConsultantSalaryCalculations';
import { CONSULTANT_SALARY_SETTLEMENT_STRINGS as S } from '../../constants/consultantSalarySettlementStrings';
import {
  CONSULTANT_SESSION_KPI_ROUTE,
  CONSULTANT_SESSION_KPI_STRINGS as KPI_S
} from '../../constants/consultantSessionKpiStrings';
import {
  CONSULTANT_MIND_WEATHER_INBOX_ROUTE,
  CONSULTANT_MIND_WEATHER_INBOX_STRINGS as MW_S
} from '../../constants/consultantMindWeatherInboxStrings';
import './ConsultantMoreHub.css';

const ConsultantMoreHub = () => {
  const navigate = useNavigate();
  const { hasItems, loading } = useConsultantSalaryCalculations();

  return (
    <div className="cr-dashboard cr-more-hub">
      <section className="cr-dashboard__section" aria-label={S.MORE_SECTION_TITLE}>
        <h2 className="cr-dashboard__section-title">{S.MORE_SECTION_TITLE}</h2>
        <div className="cr-more-hub__list">
          <button
            type="button"
            className="cr-more-hub__row"
            onClick={() => navigate(CONSULTANT_SESSION_KPI_ROUTE)}
          >
            <span className="cr-more-hub__row-icon" aria-hidden>
              <BarChart3 size={22} />
            </span>
            <span className="cr-more-hub__row-body">
              <span className="cr-more-hub__row-title">{KPI_S.MENU_TITLE}</span>
              <span className="cr-more-hub__row-sub">{KPI_S.MENU_SUBTITLE}</span>
            </span>
            <ChevronRight size={20} className="cr-more-hub__row-chevron" aria-hidden />
          </button>

          <button
            type="button"
            className="cr-more-hub__row"
            onClick={() => navigate(CONSULTANT_MIND_WEATHER_INBOX_ROUTE)}
          >
            <span className="cr-more-hub__row-icon" aria-hidden>
              <Inbox size={22} />
            </span>
            <span className="cr-more-hub__row-body">
              <span className="cr-more-hub__row-title">{MW_S.MENU_TITLE}</span>
              <span className="cr-more-hub__row-sub">{MW_S.MENU_SUBTITLE}</span>
            </span>
            <ChevronRight size={20} className="cr-more-hub__row-chevron" aria-hidden />
          </button>

          <button
            type="button"
            className="cr-more-hub__row"
            onClick={() => navigate('/consultant/more/community')}
          >
            <span className="cr-more-hub__row-icon" aria-hidden>
              <Users size={22} />
            </span>
            <span className="cr-more-hub__row-body">
              <span className="cr-more-hub__row-title">{S.COMMUNITY_TITLE}</span>
              <span className="cr-more-hub__row-sub">{S.COMMUNITY_SUBTITLE}</span>
            </span>
            <ChevronRight size={20} className="cr-more-hub__row-chevron" aria-hidden />
          </button>

          {!loading && hasItems && (
            <button
              type="button"
              className="cr-more-hub__row"
              onClick={() => navigate('/consultant/salary-settlement')}
            >
              <span className="cr-more-hub__row-icon" aria-hidden>
                <Wallet size={22} />
              </span>
              <span className="cr-more-hub__row-body">
                <span className="cr-more-hub__row-title">{S.SALARY_MENU_TITLE}</span>
                <span className="cr-more-hub__row-sub">{S.SALARY_MENU_SUBTITLE}</span>
              </span>
              <ChevronRight size={20} className="cr-more-hub__row-chevron" aria-hidden />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default ConsultantMoreHub;
