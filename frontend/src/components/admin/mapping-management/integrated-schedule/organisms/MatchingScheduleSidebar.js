/**
 * MatchingScheduleSidebar — 통합 스케줄 좌측 매칭 목록 패널 (필터 + 목록)
 *
 * @author CoreSolution
 * @since 2026-06-27
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MGButton from '../../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import {
  VIEW_FILTER_NEW,
  VIEW_FILTER_REMAINING,
  VIEW_FILTER_ALL,
  VIEW_FILTER_NEW_LABEL,
  STATUS_FILTER_OPTIONS
} from '../../constants/integratedScheduleSidebarFilterConstants';
import MatchingScheduleList from './MatchingScheduleList';

const MatchingScheduleSidebar = ({
  isCollapsed,
  onToggle,
  filteredMappings,
  loading,
  viewFilter,
  onViewFilterChange,
  statusFilter,
  onStatusFilterChange,
  getStatusCount,
  onScheduleFromCard,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  onSessionExtension,
  approveProcessing,
  cancelPendingProcessing,
  cancelTargetMappingId
}) => {
  const { t } = useTranslation();

  return (
    <aside
      className={`integrated-schedule__sidebar${
        isCollapsed ? ' integrated-schedule__sidebar--collapsed' : ''
      }`}
      aria-label="매칭 목록 패널"
    >
      <div className="integrated-schedule__sidebar-header">
        <h2
          className="integrated-schedule__sidebar-title"
          id="integrated-schedule-sidebar-title"
        >
          매칭 목록
          <span
            className="integrated-schedule__sidebar-count"
            aria-label={t('integratedSchedule.sidebar.collapsedBadgeLabel', {
              count: filteredMappings.length
            })}
          >
            {filteredMappings.length}
          </span>
        </h2>
        <button
          type="button"
          className="integrated-schedule__sidebar-toggle"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls="integrated-schedule-sidebar-body"
          aria-label={
            isCollapsed
              ? t('integratedSchedule.sidebar.expandAria')
              : t('integratedSchedule.sidebar.collapseAria')
          }
          title={
            isCollapsed
              ? t('integratedSchedule.sidebar.expandAria')
              : t('integratedSchedule.sidebar.collapseAria')
          }
        >
          {isCollapsed ? (
            <ChevronRight size={18} aria-hidden="true" />
          ) : (
            <ChevronLeft size={18} aria-hidden="true" />
          )}
        </button>
      </div>
      <div
        id="integrated-schedule-sidebar-body"
        className="integrated-schedule__sidebar-body"
        hidden={isCollapsed}
      >
        <fieldset className="integrated-schedule__filter" aria-label="매칭 목록 보기 필터">
          <legend className="integrated-schedule__filter-legend">{t('admin.actions.view')}</legend>
          <label
            className={`integrated-schedule__filter-label ${
              viewFilter === VIEW_FILTER_NEW ? 'integrated-schedule__filter-label--selected' : ''
            }`}
          >
            <input
              type="radio"
              name="viewFilter"
              value={VIEW_FILTER_NEW}
              checked={viewFilter === VIEW_FILTER_NEW}
              onChange={() => onViewFilterChange(VIEW_FILTER_NEW)}
              aria-label={VIEW_FILTER_NEW_LABEL}
            />
            <span className="integrated-schedule__filter-text">{VIEW_FILTER_NEW_LABEL}</span>
          </label>
          <label
            className={`integrated-schedule__filter-label ${
              viewFilter === VIEW_FILTER_REMAINING ? 'integrated-schedule__filter-label--selected' : ''
            }`}
          >
            <input
              type="radio"
              name="viewFilter"
              value={VIEW_FILTER_REMAINING}
              checked={viewFilter === VIEW_FILTER_REMAINING}
              onChange={() => onViewFilterChange(VIEW_FILTER_REMAINING)}
              aria-label="회기 남은 매칭"
            />
            <span className="integrated-schedule__filter-text">회기 남은 매칭</span>
          </label>
          <label
            className={`integrated-schedule__filter-label ${
              viewFilter === VIEW_FILTER_ALL ? 'integrated-schedule__filter-label--selected' : ''
            }`}
          >
            <input
              type="radio"
              name="viewFilter"
              value={VIEW_FILTER_ALL}
              checked={viewFilter === VIEW_FILTER_ALL}
              onChange={() => onViewFilterChange(VIEW_FILTER_ALL)}
              aria-label={t('admin.labels.all')}
            />
            <span className="integrated-schedule__filter-text">{t('admin.labels.all')}</span>
          </label>
        </fieldset>
        <fieldset
          className="integrated-schedule__filter integrated-schedule__filter--status"
          aria-label="상태별 필터"
        >
          <legend className="integrated-schedule__filter-legend">{t('admin.labels.status')}</legend>
          <div className="integrated-schedule__status-btns">
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const count = getStatusCount(opt.value);
              const isSelected = statusFilter === opt.value;
              return (
                <MGButton
                  key={opt.value || 'all'}
                  type="button"
                  variant="outline"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false,
                    className: `integrated-schedule__status-btn ${
                      isSelected ? 'integrated-schedule__status-btn--selected' : ''
                    }`
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => onStatusFilterChange(opt.value)}
                  aria-pressed={isSelected}
                  aria-label={`${toDisplayString(opt.label)} (${count}건)`}
                  preventDoubleClick={false}
                >
                  <span className="integrated-schedule__status-btn-text">
                    {toDisplayString(opt.label)}
                  </span>
                  <span className="integrated-schedule__status-badge" aria-hidden="true">
                    {count}
                  </span>
                </MGButton>
              );
            })}
          </div>
        </fieldset>
        <MatchingScheduleList
          mappings={filteredMappings}
          loading={loading}
          viewFilter={viewFilter}
          statusFilter={statusFilter}
          onScheduleFromCard={onScheduleFromCard}
          onPayment={onPayment}
          onDeposit={onDeposit}
          onApprove={onApprove}
          onCheckoutSameDay={onCheckoutSameDay}
          onCancelPendingMapping={onCancelPendingMapping}
          onSessionExtension={onSessionExtension}
          approveProcessing={approveProcessing}
          cancelPendingProcessing={cancelPendingProcessing}
          cancelTargetMappingId={cancelTargetMappingId}
        />
      </div>
    </aside>
  );
};

MatchingScheduleSidebar.propTypes = {
  isCollapsed: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  filteredMappings: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  viewFilter: PropTypes.string.isRequired,
  onViewFilterChange: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  getStatusCount: PropTypes.func.isRequired,
  onScheduleFromCard: PropTypes.func.isRequired,
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCheckoutSameDay: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
  onSessionExtension: PropTypes.func,
  approveProcessing: PropTypes.bool,
  cancelPendingProcessing: PropTypes.bool,
  cancelTargetMappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

MatchingScheduleSidebar.defaultProps = {
  isCollapsed: false,
  loading: false,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  onCheckoutSameDay: null,
  onCancelPendingMapping: null,
  onSessionExtension: null,
  approveProcessing: false,
  cancelPendingProcessing: false,
  cancelTargetMappingId: null
};

export default MatchingScheduleSidebar;
