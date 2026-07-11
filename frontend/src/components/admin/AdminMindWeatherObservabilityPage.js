/**
 * 마음 날씨 관측 — BW-6 읽기 전용 어드민 API
 * @author CoreSolution
 * @since 2026-05-14
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import { ListTableView } from '../common';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import StandardizedApi from '../../utils/standardizedApi';
import {
  ADMIN_WEB_SCAFFOLD_API,
  ADMIN_WEB_SCAFFOLD_COPY,
  normalizeSpringPageRows,
  pickSpringPageMeta
} from '../../constants/adminWebScaffold';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_TITLE_ID = 'admin-mind-weather-obs-title';
const PAGE_SIZE = 20;

const columns = [
  { key: 'id', label: '카드 ID' },
  { key: 'clientUserId', label: '내담자 PK' },
  { key: 'source', label: '출처' },
  { key: 'tone', label: '톤' },
  { key: 'share', label: '요약공유' },
  { key: 'preview', label: '요약 미리보기' },
  { key: 'createdAt', label: '생성' }
];

const AdminMindWeatherObservabilityPage = () => {
  const [page, setPage] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [pagePayload, setPagePayload] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  const loadList = useCallback(async() => {
    setListLoading(true);
    setListError(null);
    try {
      const raw = await StandardizedApi.get(ADMIN_WEB_SCAFFOLD_API.MIND_WEATHER_CARDS, {
        page,
        size: PAGE_SIZE,
        sort: 'createdAt,desc'
      });
      setPagePayload(raw && typeof raw === 'object' ? raw : null);
    } catch (err) {
      setPagePayload(null);
      setListError(err);
    } finally {
      setListLoading(false);
    }
  }, [page]);

  const loadSummary = useCallback(async() => {
    setSummaryError(null);
    try {
      const raw = await StandardizedApi.get(ADMIN_WEB_SCAFFOLD_API.MIND_WEATHER_SUMMARY, {});
      setSummary(raw && typeof raw === 'object' ? raw : null);
    } catch (err) {
      setSummary(null);
      setSummaryError(err);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const rows = useMemo(() => normalizeSpringPageRows(pagePayload), [pagePayload]);
  const pageMeta = useMemo(() => pickSpringPageMeta(pagePayload), [pagePayload]);

  const tableData = useMemo(
    () =>
      rows.map((row, idx) => {
        const id = row && typeof row === 'object' ? row.id : '';
        const share =
          row && typeof row === 'object'
            ? row.shareSummary === true
              ? 'Y'
              : row.shareSummary === false
                ? 'N'
                : '—'
            : '—';
        const preview =
          row && typeof row === 'object'
            ? row.summaryPreview ?? row.summary ?? ''
            : '';
        return {
          __rowKey: id != null && String(id) !== '' ? `mw-${String(id)}` : `mw-${idx}`,
          id: toDisplayString(id, '—'),
          clientUserId: toDisplayString(row?.clientUserId, '—'),
          source: toDisplayString(row?.source, '—'),
          tone: toDisplayString(row?.tone, '—'),
          share,
          preview: preview != null ? String(preview) : '',
          createdAt: toDisplayString(row?.createdAt, '—'),
          __raw: row
        };
      }),
    [rows]
  );

  const renderCell = (columnKey, item) => {
    if (columnKey === 'preview') {
      return <SafeText tag="span">{item.preview}</SafeText>;
    }
    return <SafeText tag="span">{item[columnKey]}</SafeText>;
  };

  const canPrev = page > 0 && !listLoading;
  const canNext = !listLoading && pageMeta.number + 1 < pageMeta.totalPages;

  return (
    <AdminCommonLayout title={ADMIN_WEB_SCAFFOLD_COPY.MIND_WEATHER_OBS_TITLE} loading={listLoading}>
      <div className="mg-v2-ad-b0kla" data-testid="admin-mind-weather-obs-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.MIND_WEATHER_OBS_TITLE}>
            <ContentHeader
              title={ADMIN_WEB_SCAFFOLD_COPY.MIND_WEATHER_OBS_TITLE}
              subtitle={ADMIN_WEB_SCAFFOLD_COPY.MIND_WEATHER_OBS_SUBTITLE}
              titleId={PAGE_TITLE_ID}
            />
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_MIND_WEATHER_SUMMARY} noCard>
              {summaryError ? (
                <SafeErrorDisplay error={summaryError} variant="inline" />
              ) : null}
              {summary ? (
                <ul className="mg-v2-content-section__subtitle">
                  <li>
                    <SafeText tag="span">전체 카드: {toDisplayString(summary.totalCards)}</SafeText>
                  </li>
                  <li>
                    <SafeText tag="span">요약 공유 ON: {toDisplayString(summary.cardsWithShareSummary)}</SafeText>
                  </li>
                  <li>
                    <SafeText tag="span">24시간 이내 생성: {toDisplayString(summary.cardsCreatedLast24Hours)}</SafeText>
                  </li>
                  <li>
                    <SafeText tag="span">
                      최근 생성 시각: {toDisplayString(summary.newestCardCreatedAt, '—')}
                    </SafeText>
                  </li>
                </ul>
              ) : !summaryError ? (
                <p className="mg-v2-content-section__subtitle">
                  <SafeText tag="span">요약을 불러오는 중…</SafeText>
                </p>
              ) : null}
            </ContentSection>
            {listError ? (
              <ContentSection noCard>
                <SafeErrorDisplay error={listError} variant="banner" />
                <div className="mg-v2-content-section__actions">
                  <MGButton
                    type="button"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      className: 'mg-v2-mapping-header-btn'
                    })}
                    variant="outline"
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    disabled={listLoading}
                    onClick={() => {
                      loadList();
                    }}
                  >
                    {ADMIN_WEB_SCAFFOLD_COPY.LIST_ERROR_RETRY}
                  </MGButton>
                </div>
              </ContentSection>
            ) : null}
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_MIND_WEATHER_CARDS}>
              {!listLoading && tableData.length === 0 ? (
                <EmptyState
                  title={ADMIN_WEB_SCAFFOLD_COPY.EMPTY_CONTENT_TITLE}
                  description={ADMIN_WEB_SCAFFOLD_COPY.EMPTY_CONTENT_DESC}
                />
              ) : (
                <ListTableView
                  columns={columns}
                  data={tableData}
                  rowKeyField="__rowKey"
                  renderCell={renderCell}
                />
              )}
              <div className="mg-v2-content-section__actions mg-v2-content-section__actions--pagination">
                <div className="mg-v2-content-section__pagination-buttons">
                  <MGButton
                    type="button"
                    variant="outline"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      className: 'mg-v2-mapping-header-btn'
                    })}
                    disabled={!canPrev}
                    onClick={() => {
                      setPage((p) => Math.max(0, p - 1));
                    }}
                  >
                    이전 페이지
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="outline"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      className: 'mg-v2-mapping-header-btn'
                    })}
                    disabled={!canNext}
                    onClick={() => {
                      setPage((p) => p + 1);
                    }}
                  >
                    다음 페이지
                  </MGButton>
                </div>
                <span className="mg-v2-content-section__subtitle">
                  <SafeText tag="span">
                    {`${pageMeta.number + 1} / ${Math.max(pageMeta.totalPages, 1)} (총 ${pageMeta.totalElements}건)`}
                  </SafeText>
                </span>
              </div>
            </ContentSection>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminMindWeatherObservabilityPage;
