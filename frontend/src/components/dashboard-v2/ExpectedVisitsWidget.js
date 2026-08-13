/**
 * ExpectedVisitsWidget — 미예약 예상 내담자 위젯
 * Admin 대시보드 V2에 카드 형태로 배치.
 * 방문 이력 기반 예측 목록 조회·예약 생성·무시·예측 끄기 기능.
 *
 * @author CoreSolution
 * @since 2026-08-13
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, EyeOff, RefreshCw } from 'lucide-react';
import StandardizedApi from '../../utils/standardizedApi';
import { ContentSection } from './content';
import UnifiedModal from '../common/modals/UnifiedModal';
import { EmptyState, StatusBadge, EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../common';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import notificationManager from '../../utils/notification';
import { maskEncryptedDisplay } from '../../utils/codeHelper';
import { toDisplayString } from '../../utils/safeDisplay';
import { useSession } from '../../contexts/SessionContext';
import { USER_ROLES } from '../../constants/roles';
import {
  VISIT_PREDICTION_API,
  PERIOD_FILTER_OPTIONS,
  PERIOD_FILTER_DEFAULT,
  CONFIDENCE_BADGE_MAP,
  EXPECTED_VISITS_STRINGS as S,
  EXPECTED_VISITS_CSS as CSS,
  EXPECTED_VISITS_PAGE_SIZE
} from '../../constants/visitPredictionConstants';
import './ExpectedVisitsWidget.css';

/**
 * 기간 필터 값을 startDate/endDate 쿼리 파라미터로 변환
 * @param {string} period PERIOD_FILTER_OPTIONS value
 * @returns {{ startDate: string, endDate: string }}
 */
function buildDateRange(period) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + mondayOffset);
  thisMonday.setHours(0, 0, 0, 0);

  const fmt = (d) => d.toISOString().split('T')[0];

  if (period === 'THIS_WEEK') {
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    return { startDate: fmt(thisMonday), endDate: fmt(thisSunday) };
  }

  if (period === 'TWO_WEEKS') {
    const nextMonday = new Date(thisMonday);
    nextMonday.setDate(thisMonday.getDate() + 7);
    const twoWeeksSunday = new Date(nextMonday);
    twoWeeksSunday.setDate(nextMonday.getDate() + 13);
    return { startDate: fmt(now), endDate: fmt(twoWeeksSunday) };
  }

  // NEXT_WEEK (기본)
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  return { startDate: fmt(nextMonday), endDate: fmt(nextSunday) };
}

/**
 * 예상 방문일까지의 D-day 계산
 * @param {string} dateStr YYYY-MM-DD
 * @returns {string}
 */
function formatDday(dateStr) {
  if (!dateStr) return '';
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

const ExpectedVisitsWidget = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { hasRole } = useSession();
  const isAdmin = hasRole(USER_ROLES.ADMIN);

  const [period, setPeriod] = useState(PERIOD_FILTER_DEFAULT);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // 예약 모달 상태
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookTarget, setBookTarget] = useState(null);
  const [bookDate, setBookDate] = useState('');
  const [bookSubmitting, setBookSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = buildDateRange(period);
      const data = await StandardizedApi.get(VISIT_PREDICTION_API.UNBOOKED_EXPECTED, {
        startDate,
        endDate,
        page: 0,
        size: EXPECTED_VISITS_PAGE_SIZE
      });
      const payload = data?.data != null ? data.data : data;
      const list = payload?.content ?? payload?.items ?? (Array.isArray(payload) ? payload : []);
      setItems(list);
      setDismissedIds(new Set());
    } catch (err) {
      console.error('미예약 예상 목록 로드 실패:', err);
      setError(err?.message || S.TOAST_ERROR);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleItems = useMemo(
    () => items.filter((item) => !dismissedIds.has(item.mappingId)),
    [items, dismissedIds]
  );

  /* ── 무시 CTA ── */
  const handleDismiss = useCallback(async (item) => {
    setDismissedIds((prev) => new Set(prev).add(item.mappingId));
    try {
      await StandardizedApi.post(VISIT_PREDICTION_API.DISMISS, {
        mappingId: item.mappingId,
        expectedDate: item.expectedDate
      });
      notificationManager.success(S.TOAST_DISMISS_SUCCESS);
    } catch (err) {
      console.error('예상 방문 무시 실패:', err);
      notificationManager.error(err?.message || S.TOAST_ERROR);
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.mappingId);
        return next;
      });
    }
  }, []);

  /* ── 예측 끄기 ── */
  const handleDisablePrediction = useCallback(async (item) => {
    try {
      await StandardizedApi.put(VISIT_PREDICTION_API.SETTINGS(item.mappingId), {
        predictionEnabled: false
      });
      notificationManager.success(S.TOAST_DISABLE_SUCCESS);
      setDismissedIds((prev) => new Set(prev).add(item.mappingId));
    } catch (err) {
      console.error('예측 비활성화 실패:', err);
      notificationManager.error(err?.message || S.TOAST_ERROR);
    }
  }, []);

  /* ── 예약 초안 모달 열기 ── */
  const openBookModal = useCallback((item) => {
    setBookTarget(item);
    setBookDate(item.expectedDate || '');
    setBookModalOpen(true);
  }, []);

  /* ── 예약 생성 ── */
  const handleBookSubmit = useCallback(async () => {
    if (!bookTarget) return;
    setBookSubmitting(true);
    try {
      await StandardizedApi.post(VISIT_PREDICTION_API.CREATE_SCHEDULE, {
        clientId: bookTarget.clientId,
        consultantId: bookTarget.consultantId,
        scheduleDate: bookDate,
        status: 'BOOKED'
      });
      notificationManager.success(S.TOAST_BOOK_SUCCESS);
      setBookModalOpen(false);
      setBookTarget(null);
      setDismissedIds((prev) => new Set(prev).add(bookTarget.mappingId));
    } catch (err) {
      console.error('예약 생성 실패:', err);
      notificationManager.error(err?.message || S.TOAST_ERROR);
    } finally {
      setBookSubmitting(false);
    }
  }, [bookTarget, bookDate]);

  const closeBookModal = useCallback(() => {
    setBookModalOpen(false);
    setBookTarget(null);
  }, []);

  /* ── 기간 필터 + 개별 새로고침 (layout setLoading 금지) ── */
  const sectionActions = (
    <>
      <div className={CSS.FILTER}>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label={S.ARIA_PERIOD_FILTER}
          className="mg-v2-ad-b0kla__select mg-v2-ad-b0kla__select--sm"
        >
          {PERIOD_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <MGButton
        type="button"
        variant="secondary"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'secondary',
          size: 'sm',
          loading
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={loadData}
        disabled={loading}
        loading={loading}
        preventDoubleClick={false}
        aria-label={t('common.actions.refresh', { defaultValue: S.ARIA_REFRESH })}
        data-testid="expected-visits-refresh"
      >
        <RefreshCw size={14} aria-hidden="true" />
      </MGButton>
    </>
  );

  /* ── 신뢰도 배지 ── */
  const renderConfidenceBadge = (confidence) => {
    const badge = CONFIDENCE_BADGE_MAP[confidence] || CONFIDENCE_BADGE_MAP.LOW;
    return <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>;
  };

  /* ── 행 더보기 메뉴 ── */
  const buildRowActions = (item) => [
    {
      id: `dismiss-${item.mappingId}`,
      label: S.CTA_DISMISS,
      onClick: () => handleDismiss(item)
    },
    {
      id: `disable-${item.mappingId}`,
      label: S.CTA_DISABLE_PREDICTION,
      onClick: () => handleDisablePrediction(item),
      variant: 'destructive'
    }
  ];

  /* ── 내용부 ── */
  const renderContent = () => {
    if (loading) {
      return (
        <div className="mg-loading-container mg-flex mg-flex-col mg-align-center mg-justify-center mg-py-xl">
          <div className="mg-loading-spinner" />
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon={<EyeOff size={32} />}
          title={S.EMPTY_NO_DATA}
          description={error}
        />
      );
    }

    if (visibleItems.length === 0) {
      return (
        <EmptyState
          icon={<CalendarPlus size={32} />}
          title={S.EMPTY_NO_DATA}
        />
      );
    }

    return (
      <>
        {/* 데스크톱 테이블 */}
        <div className="mg-v2-expected-visits__table-wrap">
          <table className={CSS.TABLE}>
            <thead className={CSS.TABLE_HEAD}>
              <tr>
                <th>{S.LABEL_CLIENT}</th>
                {isAdmin && <th>{S.LABEL_CONSULTANT}</th>}
                <th>{S.LABEL_EXPECTED_DATE}</th>
                <th>{S.LABEL_PATTERN}</th>
                <th>{S.LABEL_LAST_VISIT}</th>
                <th>{S.LABEL_CONFIDENCE}</th>
                <th>{S.LABEL_ACTIONS}</th>
              </tr>
            </thead>
            <tbody className={CSS.TABLE_BODY}>
              {visibleItems.map((item) => (
                <tr key={item.mappingId} className={CSS.ROW}>
                  <td>{maskEncryptedDisplay(item.clientName, '내담자')}</td>
                  {isAdmin && <td>{toDisplayString(item.consultantName, '-')}</td>}
                  <td>
                    {toDisplayString(item.expectedDate, '-')}
                    {item.expectedDate && (
                      <span className="mg-text-muted mg-text-sm">{` (${formatDday(item.expectedDate)})`}</span>
                    )}
                  </td>
                  <td>{toDisplayString(item.patternSummary, '-')}</td>
                  <td>{toDisplayString(item.lastVisitDate, '-')}</td>
                  <td>{renderConfidenceBadge(item.confidenceLevel)}</td>
                  <td>
                    <div className={CSS.ACTIONS}>
                      <MGButton
                        type="button"
                        variant="primary"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => openBookModal(item)}
                        aria-label={`${maskEncryptedDisplay(item.clientName, '내담자')} ${S.CTA_BOOK}`}
                      >
                        {S.CTA_BOOK}
                      </MGButton>
                      <EntityRowActions
                        layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
                        ariaLabel={`${maskEncryptedDisplay(item.clientName, '내담자')} 추가 작업`}
                        items={buildRowActions(item)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 */}
        <div className={CSS.CARD_LIST}>
          {visibleItems.map((item) => (
            <article key={item.mappingId} className={CSS.CARD_ITEM}>
              <div className="mg-v2-expected-visits__card-item-header">
                <span className="mg-v2-expected-visits__card-item-name">
                  {maskEncryptedDisplay(item.clientName, '내담자')}
                </span>
                {renderConfidenceBadge(item.confidenceLevel)}
              </div>
              <div className="mg-v2-expected-visits__card-fields">
                {isAdmin && (
                  <div className={CSS.CARD_FIELD}>
                    <span className={CSS.CARD_LABEL}>{S.LABEL_CONSULTANT}</span>
                    <span className={CSS.CARD_VALUE}>{toDisplayString(item.consultantName, '-')}</span>
                  </div>
                )}
                <div className={CSS.CARD_FIELD}>
                  <span className={CSS.CARD_LABEL}>{S.LABEL_EXPECTED_DATE}</span>
                  <span className={CSS.CARD_VALUE}>
                    {toDisplayString(item.expectedDate, '-')}
                    {item.expectedDate && ` (${formatDday(item.expectedDate)})`}
                  </span>
                </div>
                <div className={CSS.CARD_FIELD}>
                  <span className={CSS.CARD_LABEL}>{S.LABEL_PATTERN}</span>
                  <span className={CSS.CARD_VALUE}>{toDisplayString(item.patternSummary, '-')}</span>
                </div>
                <div className={CSS.CARD_FIELD}>
                  <span className={CSS.CARD_LABEL}>{S.LABEL_LAST_VISIT}</span>
                  <span className={CSS.CARD_VALUE}>{toDisplayString(item.lastVisitDate, '-')}</span>
                </div>
              </div>
              <div className="mg-v2-expected-visits__card-actions">
                <MGButton
                  type="button"
                  variant="primary"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => openBookModal(item)}
                >
                  {S.CTA_BOOK}
                </MGButton>
                <MGButton
                  type="button"
                  variant="ghost"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'ghost', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => handleDismiss(item)}
                >
                  {S.CTA_DISMISS}
                </MGButton>
                <EntityRowActions
                  layout={ENTITY_ROW_ACTIONS_LAYOUT.CARD}
                  ariaLabel={`${maskEncryptedDisplay(item.clientName, '내담자')} 추가 작업`}
                  items={[
                    {
                      id: `disable-m-${item.mappingId}`,
                      label: S.CTA_DISABLE_PREDICTION,
                      onClick: () => handleDisablePrediction(item),
                      variant: 'destructive'
                    }
                  ]}
                />
              </div>
            </article>
          ))}
        </div>
      </>
    );
  };

  /* ── 예약 초안 모달 ── */
  const renderBookModal = () => {
    if (!bookTarget) return null;
    return (
      <UnifiedModal
        isOpen={bookModalOpen}
        onClose={closeBookModal}
        title={S.MODAL_TITLE}
        subtitle={S.MODAL_SUBTITLE}
        size="small"
        variant="form"
        loading={bookSubmitting}
        actions={
          <>
            <MGButton
              type="button"
              variant="ghost"
              className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={closeBookModal}
              disabled={bookSubmitting}
            >
              취소
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: bookSubmitting })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleBookSubmit}
              loading={bookSubmitting}
              disabled={bookSubmitting || !bookDate}
            >
              예약 생성
            </MGButton>
          </>
        }
      >
        <div className="mg-v2-expected-visits__modal-form">
          <div className="mg-v2-expected-visits__modal-field">
            <span className="mg-v2-expected-visits__modal-label">{S.LABEL_CLIENT}</span>
            <span className="mg-v2-expected-visits__modal-value">
              {maskEncryptedDisplay(bookTarget.clientName, '내담자')}
            </span>
          </div>
          <div className="mg-v2-expected-visits__modal-field">
            <span className="mg-v2-expected-visits__modal-label">{S.LABEL_CONSULTANT}</span>
            <span className="mg-v2-expected-visits__modal-value">
              {toDisplayString(bookTarget.consultantName, '-')}
            </span>
          </div>
          <div className="mg-v2-expected-visits__modal-field">
            <span className="mg-v2-expected-visits__modal-label">{S.LABEL_EXPECTED_DATE}</span>
            <input
              type="date"
              className="mg-v2-expected-visits__modal-input"
              value={bookDate}
              onChange={(e) => setBookDate(e.target.value)}
              aria-label={S.LABEL_EXPECTED_DATE}
            />
          </div>
          <div className="mg-v2-expected-visits__modal-field">
            <span className="mg-v2-expected-visits__modal-label">{S.LABEL_PATTERN}</span>
            <span className="mg-v2-expected-visits__modal-value">
              {toDisplayString(bookTarget.patternSummary, '-')}
            </span>
          </div>
        </div>
      </UnifiedModal>
    );
  };

  return (
    <>
      <ContentSection
        title={S.WIDGET_TITLE}
        subtitle={S.WIDGET_SUBTITLE}
        actions={sectionActions}
        className={CSS.WIDGET}
        dataTestId="expected-visits-widget"
      >
        {renderContent()}
      </ContentSection>

      {renderBookModal()}
    </>
  );
};

export default ExpectedVisitsWidget;
