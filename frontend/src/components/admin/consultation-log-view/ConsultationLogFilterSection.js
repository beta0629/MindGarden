/**
 * 상담일지 조회 필터.
 * layout=query 는 관리자 시안(조회 버튼으로만 검색). 기본값은 상담사 표면의 즉시 필터.
 *
 * @author Core Solution
 * @since 2025-03-02
 * @updated 2026-10-10 — 관리자 한 줄 필터·모바일 시트
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import MGDateInput from '../../common/MGDateInput';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import ConsultationLogSavedViewMenu from './ConsultationLogSavedViewMenu';
import {
  CONSULTATION_LOG_MEDIA_TABLET_UP,
  useMediaQuery
} from './useConsultationLogMedia';
import {
  CONSULTATION_LOG_STATUS_ALL,
  CONSULTATION_LOG_STATUS_DONE,
  CONSULTATION_LOG_STATUS_PENDING
} from './consultationLogQuery';
import '../../../i18n';

const NS = 'adminConsultationLogs';

const personOptions = (rows) => (rows || []).map((row) => (
  <option key={row.id} value={row.id}>
    {row.name || row.userName || ''}
  </option>
));

const LegacyFilter = ({
  isAdmin,
  consultantId,
  consultants,
  onConsultantChange,
  clientId,
  clients,
  onClientChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  t
}) => (
  <section className="mg-v2-consultation-log-filter" aria-label={t('filter.label')}>
    <div className="mg-v2-consultation-log-filter__row">
      {isAdmin ? (
        <div className="mg-v2-consultation-log-filter__field">
          <label className="mg-v2-consultation-log-filter__label" htmlFor="consultation-log-consultant">
            {t('filter.consultant')}
          </label>
          <select
            id="consultation-log-consultant"
            className="mg-v2-consultation-log-filter__select"
            value={consultantId ?? ''}
            onChange={(event) => onConsultantChange(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">{t('filter.all')}</option>
            {personOptions(consultants)}
          </select>
        </div>
      ) : null}
      <div className="mg-v2-consultation-log-filter__field">
        <label className="mg-v2-consultation-log-filter__label" htmlFor="consultation-log-client">
          {t('filter.client')}
        </label>
        <select
          id="consultation-log-client"
          className="mg-v2-consultation-log-filter__select"
          value={clientId ?? ''}
          onChange={(event) => onClientChange(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">{t('filter.all')}</option>
          {personOptions(clients)}
        </select>
      </div>
      <div className="mg-v2-consultation-log-filter__field">
        <label className="mg-v2-consultation-log-filter__label" htmlFor="consultation-log-start">
          {t('filter.periodFrom')}
        </label>
        <MGDateInput
          id="consultation-log-start"
          className="mg-v2-consultation-log-filter__input"
          value={startDate || ''}
          onChange={(event) => onStartDateChange(event.target.value || null)}
        />
      </div>
      <div className="mg-v2-consultation-log-filter__field">
        <label className="mg-v2-consultation-log-filter__label" htmlFor="consultation-log-end">
          {t('filter.periodTo')}
        </label>
        <MGDateInput
          id="consultation-log-end"
          className="mg-v2-consultation-log-filter__input"
          value={endDate || ''}
          onChange={(event) => onEndDateChange(event.target.value || null)}
        />
      </div>
    </div>
  </section>
);

const QueryFilter = (props) => {
  const { t } = useTranslation(NS);
  const tabletUp = useMediaQuery(CONSULTATION_LOG_MEDIA_TABLET_UP);
  const [sheetOpen, setSheetOpen] = useState(false);
  const periodId = 'consultation-log-period-label';
  const statusLabel = props.status === CONSULTATION_LOG_STATUS_DONE
    ? t('status.done')
    : props.status === CONSULTATION_LOG_STATUS_PENDING
      ? t('status.pending')
      : t('filter.all');
  const summary = `${props.startDate || ''} ~ ${props.endDate || ''} · ${statusLabel}`;
  const showSheet = !tabletUp && sheetOpen;

  const submit = (event) => {
    event.preventDefault();
    setSheetOpen(false);
    props.onSearch();
  };

  const fields = (
    <div
      className={`mg-v2-consultation-log-query__fields${showSheet ? ' is-open' : ''}`}
      role={showSheet ? 'dialog' : undefined}
      aria-modal={showSheet ? 'true' : undefined}
      aria-label={showSheet ? t('filter.mobileSheetTitle') : undefined}
    >
      {showSheet ? (
        <div className="mg-v2-consultation-log-query__sheet-bar">
          <h2 className="mg-v2-consultation-log-query__sheet-title">{t('filter.mobileSheetTitle')}</h2>
          <MGButton
            type="button"
            variant="ghost"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'ghost', size: 'sm', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => setSheetOpen(false)}
            preventDoubleClick={false}
          >
            {t('filter.mobileClose')}
          </MGButton>
        </div>
      ) : null}
      <div className="mg-v2-consultation-log-query__period" role="group" aria-labelledby={periodId}>
        <span id={periodId} className="mg-v2-consultation-log-query__label">{t('filter.period')}</span>
        <div className="mg-v2-consultation-log-query__period-inputs">
          <label className="sr-only" htmlFor="consultation-log-start">{t('filter.periodFrom')}</label>
          <MGDateInput
            id="consultation-log-start"
            className="mg-v2-consultation-log-filter__input"
            value={props.startDate || ''}
            onChange={(event) => props.onStartDateChange(event.target.value || null)}
          />
          <span aria-hidden="true">~</span>
          <label className="sr-only" htmlFor="consultation-log-end">{t('filter.periodTo')}</label>
          <MGDateInput
            id="consultation-log-end"
            className="mg-v2-consultation-log-filter__input"
            value={props.endDate || ''}
            onChange={(event) => props.onEndDateChange(event.target.value || null)}
          />
        </div>
      </div>
      {props.isAdmin ? (
        <div className="mg-v2-consultation-log-query__field">
          <label className="mg-v2-consultation-log-query__label" htmlFor="consultation-log-consultant">
            {t('filter.consultant')}
          </label>
          <select
            id="consultation-log-consultant"
            className="mg-v2-consultation-log-filter__select"
            value={props.consultantId ?? ''}
            onChange={(event) => props.onConsultantChange(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">{t('filter.all')}</option>
            {personOptions(props.consultants)}
          </select>
        </div>
      ) : null}
      <div className="mg-v2-consultation-log-query__field">
        <label className="mg-v2-consultation-log-query__label" htmlFor="consultation-log-client">
          {t('filter.client')}
        </label>
        <select
          id="consultation-log-client"
          className="mg-v2-consultation-log-filter__select"
          value={props.clientId ?? ''}
          onChange={(event) => props.onClientChange(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">{t('filter.all')}</option>
          {personOptions(props.clients)}
        </select>
      </div>
      <div className="mg-v2-consultation-log-query__field">
        <label className="mg-v2-consultation-log-query__label" htmlFor="consultation-log-status">
          {t('filter.status')}
        </label>
        <select
          id="consultation-log-status"
          className="mg-v2-consultation-log-filter__select"
          value={props.status || CONSULTATION_LOG_STATUS_ALL}
          onChange={(event) => props.onStatusChange(event.target.value)}
        >
          <option value={CONSULTATION_LOG_STATUS_ALL}>{t('filter.all')}</option>
          <option value={CONSULTATION_LOG_STATUS_DONE}>{t('status.done')}</option>
          <option value={CONSULTATION_LOG_STATUS_PENDING}>{t('status.pending')}</option>
        </select>
      </div>
      <div className="mg-v2-consultation-log-query__field mg-v2-consultation-log-query__field--keyword">
        <label className="mg-v2-consultation-log-query__label" htmlFor="consultation-log-keyword">
          {t('filter.keyword')}
        </label>
        <input
          id="consultation-log-keyword"
          className="mg-v2-consultation-log-filter__input"
          type="search"
          value={props.keyword || ''}
          placeholder={t('filter.keywordPlaceholder')}
          onChange={(event) => props.onKeywordChange(event.target.value)}
        />
      </div>
      <div className="mg-v2-consultation-log-query__actions">
        <MGButton
          type="submit"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
        >
          {t('filter.search')}
        </MGButton>
        <MGButton
          type="button"
          variant="outline"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => {
            setSheetOpen(false);
            props.onReset();
          }}
          preventDoubleClick={false}
        >
          {t('filter.reset')}
        </MGButton>
        <ConsultationLogSavedViewMenu
          label={t('filter.savedViews')}
          emptyLabel={t('filter.savedViewsNone')}
          saveLabel={t('filter.savedViewSaveCurrent')}
          deleteLabel={t('filter.savedViewDelete')}
          views={props.savedViews}
          activeViewId={props.activeViewId}
          onSelectView={props.onSelectSavedView}
          onSaveCurrent={props.onSaveCurrentView}
          onDeleteView={props.onDeleteSavedView}
        />
      </div>
    </div>
  );

  return (
    <form className="mg-v2-consultation-log-query" role="search" aria-label={t('filter.label')} onSubmit={submit}>
      {tabletUp ? fields : (
        <>
          <div className="mg-v2-consultation-log-query__mobile">
            <MGButton
              type="button"
              variant="outline"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => setSheetOpen(true)}
              preventDoubleClick={false}
            >
              {t('filter.mobileButton')}
            </MGButton>
            <MGButton
              type="submit"
              variant="primary"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              {t('filter.search')}
            </MGButton>
            <p className="mg-v2-consultation-log-query__summary">{summary}</p>
          </div>
          {showSheet ? fields : null}
        </>
      )}
    </form>
  );
};

const ConsultationLogFilterSection = ({
  layout = 'legacy',
  isAdmin,
  consultantId = null,
  consultants = [],
  onConsultantChange,
  clientId = null,
  clients = [],
  onClientChange,
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  status = CONSULTATION_LOG_STATUS_ALL,
  onStatusChange,
  keyword = '',
  onKeywordChange,
  onSearch,
  onReset,
  savedViews = [],
  activeViewId = '',
  onSelectSavedView,
  onSaveCurrentView,
  onDeleteSavedView
}) => {
  const { t } = useTranslation(NS);
  const filterProps = {
    layout,
    isAdmin,
    consultantId,
    consultants,
    onConsultantChange,
    clientId,
    clients,
    onClientChange,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    status,
    onStatusChange,
    keyword,
    onKeywordChange,
    onSearch,
    onReset,
    savedViews,
    activeViewId,
    onSelectSavedView,
    onSaveCurrentView,
    onDeleteSavedView
  };
  if (layout === 'query') {
    return <QueryFilter {...filterProps} />;
  }
  return <LegacyFilter {...filterProps} t={t} />;
};

const idShape = PropTypes.arrayOf(PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  userName: PropTypes.string
}));

ConsultationLogFilterSection.propTypes = {
  layout: PropTypes.oneOf(['legacy', 'query']),
  isAdmin: PropTypes.bool.isRequired,
  consultantId: PropTypes.number,
  consultants: idShape,
  onConsultantChange: PropTypes.func.isRequired,
  clientId: PropTypes.number,
  clients: idShape,
  onClientChange: PropTypes.func.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onStartDateChange: PropTypes.func.isRequired,
  onEndDateChange: PropTypes.func.isRequired,
  status: PropTypes.string,
  onStatusChange: PropTypes.func,
  keyword: PropTypes.string,
  onKeywordChange: PropTypes.func,
  onSearch: PropTypes.func,
  onReset: PropTypes.func,
  savedViews: PropTypes.array,
  activeViewId: PropTypes.string,
  onSelectSavedView: PropTypes.func,
  onSaveCurrentView: PropTypes.func,
  onDeleteSavedView: PropTypes.func
};

export default ConsultationLogFilterSection;
