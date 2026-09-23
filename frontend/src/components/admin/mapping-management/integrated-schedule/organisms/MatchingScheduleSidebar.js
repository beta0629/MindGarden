/**
 * MatchingScheduleSidebar — 통합 스케줄 좌측 배정 목록 패널 (필터 + 목록)
 *
 * @author CoreSolution
 * @since 2026-06-27
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import SearchInput from '../../../../dashboard-v2/atoms/SearchInput';
import {
  VIEW_FILTER_NEW,
  VIEW_FILTER_REMAINING,
  VIEW_FILTER_ALL,
  VIEW_FILTER_NEW_LABEL,
  STATUS_FILTER_OPTIONS
} from '../../constants/integratedScheduleSidebarFilterConstants';
import { SIDEBAR_DENSITY_COMFORTABLE } from '../../constants/integratedScheduleSidebarDensityConstants';
import DensityToggle from '../molecules/DensityToggle';
import MatchingScheduleList from './MatchingScheduleList';

/**
 * 사이드바 가예약 섹션 — Clinic-OS MappingScheduleCard family (MatchingScheduleList).
 * count는 mappings.length 파생만 사용. alert strip 금지.
 *
 * @param {object} params
 * @param {{ mappings?: object[], onOpenList?: Function }} params.gareyarkCard
 * @param {Function} params.t i18n
 * @param {string} params.sidebarDensity
 * @param {object} params.listHandlers MatchingScheduleList 와 동일 핸들러 묶음
 * @returns {JSX.Element}
 */
const renderGareyarkSection = ({ gareyarkCard, t, sidebarDensity, listHandlers }) => {
  const mappings = Array.isArray(gareyarkCard.mappings) ? gareyarkCard.mappings : [];
  const count = mappings.length;

  return (
    <section
      className="integrated-schedule__gareyark-section"
      role="region"
      aria-labelledby="integrated-schedule-gareyark-heading"
      aria-live="polite"
      data-testid="integrated-schedule-gareyark-section"
      data-sidebar-gareyark-card="true"
      data-legacy-testid="integrated-schedule-pending-payment-alert"
    >
      <header className="integrated-schedule__gareyark-section-header">
        <h3
          id="integrated-schedule-gareyark-heading"
          className="integrated-schedule__gareyark-section-title"
        >
          {t('mapping.integrated.pendingPayment.alert.title', { defaultValue: '가예약' })}
        </h3>
        <span
          className="integrated-schedule__gareyark-section-count"
          aria-label={t('mapping.integrated.pendingPayment.alert.count', {
            count,
            defaultValue: '{{count}}건'
          })}
        >
          {t('mapping.integrated.pendingPayment.alert.count', {
            count,
            defaultValue: '{{count}}건'
          })}
        </span>
        {typeof gareyarkCard.onOpenList === 'function' ? (
          <button
            type="button"
            className="integrated-schedule__gareyark-section-filter"
            onClick={gareyarkCard.onOpenList}
          >
            {t('mapping.integrated.pendingPayment.alert.action', { defaultValue: '목록' })}
          </button>
        ) : null}
      </header>
      <div className="integrated-schedule__gareyark-section-body">
        <MatchingScheduleList
          mappings={mappings}
          loading={false}
          density={sidebarDensity}
          viewFilter={VIEW_FILTER_ALL}
          statusFilter=""
          {...listHandlers}
        />
      </div>
    </section>
  );
};

const MatchingScheduleSidebar = ({
  isCollapsed,
  onToggle,
  filteredMappings,
  loading,
  viewFilter,
  onViewFilterChange,
  statusFilter,
  onStatusFilterChange,
  clientSearchQuery = '',
  onClientSearchChange,
  sidebarDensity = SIDEBAR_DENSITY_COMFORTABLE,
  onSidebarDensityChange,
  savedViewControls = null,
  gareyarkCard = null,
  getStatusCount,
  onScheduleFromCard,
  onOpenPeek,
  onPayment,
  onDeposit,
  onApprove,
  onCheckoutSameDay,
  onCancelPendingMapping,
  onChangePendingPackage,
  onDesyncAction,
  onSessionExtension,
  onSessionSuccession,
  onConfirmSessionExtensionPayment,
  onCancelSessionExtension,
  onPackagePaymentHistory,
  approveProcessing,
  cancelPendingProcessing,
  cancelTargetMappingId,
  desyncProcessing,
  desyncTargetMappingId,
  activePeekMappingId,
  highlightedMappingId
}) => {
  const { t } = useTranslation('admin');
  const clientSearchPlaceholder = t(
    'integratedSchedule.sidebar.clientSearchPlaceholder',
    { defaultValue: '내담자 이름·연락처 검색' }
  );

  const listHandlers = {
    activePeekMappingId,
    highlightedMappingId,
    onOpenPeek,
    onScheduleFromCard,
    onPayment,
    onDeposit,
    onApprove,
    onCheckoutSameDay,
    onCancelPendingMapping,
    onChangePendingPackage,
    onDesyncAction,
    onSessionExtension,
    onSessionSuccession,
    onConfirmSessionExtensionPayment,
    onCancelSessionExtension,
    onPackagePaymentHistory,
    approveProcessing,
    cancelPendingProcessing,
    cancelTargetMappingId,
    desyncProcessing,
    desyncTargetMappingId
  };

  return (
    <aside
      className={`integrated-schedule__sidebar${
        isCollapsed ? ' integrated-schedule__sidebar--collapsed' : ''
      }${
        sidebarDensity !== SIDEBAR_DENSITY_COMFORTABLE
          ? ' integrated-schedule__sidebar--compact'
          : ''
      }`}
      aria-label="오늘 처리할 배정 패널"
    >
      <div className="integrated-schedule__sidebar-header">
        <h2
          className="integrated-schedule__sidebar-title"
          id="integrated-schedule-sidebar-title"
        >
          오늘 처리할 배정
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
        {gareyarkCard
          ? renderGareyarkSection({
            gareyarkCard,
            t,
            sidebarDensity,
            listHandlers
          })
          : null}
        {savedViewControls ? (
          <details className="integrated-schedule__saved-view-details">
            <summary className="integrated-schedule__saved-view-summary">
              저장된 뷰
            </summary>
            <div className="integrated-schedule__saved-view-controls">
              {savedViewControls}
            </div>
          </details>
        ) : null}
        <div className="integrated-schedule__filter-toolbar">
          <fieldset className="integrated-schedule__filter" aria-label="배정 목록 보기 필터">
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
              aria-label="회기 남은 배정"
            />
            <span className="integrated-schedule__filter-text">회기 남은 배정</span>
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
          <DensityToggle
            density={sidebarDensity}
            onDensityChange={onSidebarDensityChange}
          />
        </div>
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
                <button
                  key={opt.value || 'all'}
                  type="button"
                  className={`integrated-schedule__status-btn${
                    isSelected ? ' integrated-schedule__status-btn--selected' : ''
                  }`}
                  onClick={() => onStatusFilterChange(opt.value)}
                  aria-pressed={isSelected}
                  aria-label={`${toDisplayString(opt.label)} (${count}건)`}
                >
                  <span className="integrated-schedule__status-btn-text">
                    {toDisplayString(opt.label)}
                  </span>
                  <span className="integrated-schedule__status-badge" aria-hidden="true">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        {typeof onClientSearchChange === 'function' ? (
          <div
            className="integrated-schedule__client-search"
            role="search"
            aria-label={t('integratedSchedule.sidebar.clientSearchAria', {
              defaultValue: '사이드바 내담자 검색'
            })}
          >
            <SearchInput
              value={clientSearchQuery}
              onChange={onClientSearchChange}
              placeholder={clientSearchPlaceholder}
              className="integrated-schedule__client-search-input"
            />
          </div>
        ) : null}
        <MatchingScheduleList
          mappings={filteredMappings}
          loading={loading}
          density={sidebarDensity}
          viewFilter={viewFilter}
          statusFilter={statusFilter}
          {...listHandlers}
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
  clientSearchQuery: PropTypes.string,
  onClientSearchChange: PropTypes.func,
  sidebarDensity: PropTypes.string,
  onSidebarDensityChange: PropTypes.func,
  savedViewControls: PropTypes.node,
  /** unpaid soft 가예약 섹션 — prop 있으면 mappings.length===0 이어도 chrome 항상 렌더 */
  gareyarkCard: PropTypes.shape({
    mappings: PropTypes.arrayOf(PropTypes.object),
    count: PropTypes.number,
    firstPending: PropTypes.object,
    onOpenList: PropTypes.func,
    onCheckout: PropTypes.func
  }),
  getStatusCount: PropTypes.func.isRequired,
  onScheduleFromCard: PropTypes.func.isRequired,
  onOpenPeek: PropTypes.func,
  onPayment: PropTypes.func,
  onDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCheckoutSameDay: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
  onChangePendingPackage: PropTypes.func,
  onDesyncAction: PropTypes.func,
  onSessionExtension: PropTypes.func,
  onSessionSuccession: PropTypes.func,
  onConfirmSessionExtensionPayment: PropTypes.func,
  onCancelSessionExtension: PropTypes.func,
  onPackagePaymentHistory: PropTypes.func,
  approveProcessing: PropTypes.bool,
  cancelPendingProcessing: PropTypes.bool,
  cancelTargetMappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  desyncProcessing: PropTypes.bool,
  desyncTargetMappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  activePeekMappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  highlightedMappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

MatchingScheduleSidebar.defaultProps = {
  isCollapsed: false,
  loading: false,
  clientSearchQuery: '',
  onClientSearchChange: null,
  sidebarDensity: SIDEBAR_DENSITY_COMFORTABLE,
  onSidebarDensityChange: null,
  savedViewControls: null,
  gareyarkCard: null,
  onOpenPeek: null,
  onPayment: null,
  onDeposit: null,
  onApprove: null,
  onCheckoutSameDay: null,
  onCancelPendingMapping: null,
  onChangePendingPackage: null,
  onDesyncAction: null,
  onSessionExtension: null,
  onSessionSuccession: null,
  onConfirmSessionExtensionPayment: null,
  onCancelSessionExtension: null,
  onPackagePaymentHistory: null,
  approveProcessing: false,
  cancelPendingProcessing: false,
  cancelTargetMappingId: null,
  desyncProcessing: false,
  desyncTargetMappingId: null,
  activePeekMappingId: null,
  highlightedMappingId: null
};

export default MatchingScheduleSidebar;
