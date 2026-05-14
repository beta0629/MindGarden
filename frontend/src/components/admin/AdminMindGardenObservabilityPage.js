/**
 * 마음 정원 관측 — BW-6 읽기 전용 어드민 API
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

const PAGE_TITLE_ID = 'admin-mind-garden-obs-title';
const PAGE_SIZE = 20;

const columns = [
  { key: 'clientUserId', label: '내담자 PK' },
  { key: 'stageIndex', label: '단계' },
  { key: 'totalPoints', label: '누적 점수' },
  { key: 'weeklyPoints', label: '주간 반영' },
  { key: 'weekKey', label: '주간 키' },
  { key: 'unlocked', label: '해금 요소 수' },
  { key: 'lastSyncedAt', label: '마지막 동기' }
];

const AdminMindGardenObservabilityPage = () => {
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
      const raw = await StandardizedApi.get(ADMIN_WEB_SCAFFOLD_API.MIND_GARDEN_SNAPSHOTS, {
        page,
        size: PAGE_SIZE
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
      const raw = await StandardizedApi.get(ADMIN_WEB_SCAFFOLD_API.MIND_GARDEN_SUMMARY, {});
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
      rows.map((row, idx) => ({
        __rowKey: row?.clientUserId != null ? `mg-${String(row.clientUserId)}` : `mg-${idx}`,
        clientUserId: toDisplayString(row?.clientUserId, '—'),
        stageIndex: toDisplayString(row?.stageIndex, '—'),
        totalPoints: toDisplayString(row?.totalPoints, '—'),
        weeklyPoints: toDisplayString(row?.weeklyPointsCredited, '—'),
        weekKey: toDisplayString(row?.weekKey, '—'),
        unlocked: toDisplayString(row?.unlockedElementCount, '—'),
        lastSyncedAt: toDisplayString(row?.lastSyncedAt, '—'),
        __raw: row
      })),
    [rows]
  );

  const renderCell = (columnKey, item) => <SafeText tag="span">{item[columnKey]}</SafeText>;

  const canPrev = page > 0 && !listLoading;
  const canNext = !listLoading && pageMeta.number + 1 < pageMeta.totalPages;

  return (
    <AdminCommonLayout title={ADMIN_WEB_SCAFFOLD_COPY.MIND_GARDEN_OBS_TITLE} loading={listLoading}>
      <div className="mg-v2-ad-b0kla" data-testid="admin-mind-garden-obs-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.MIND_GARDEN_OBS_TITLE}>
            <ContentHeader
              title={ADMIN_WEB_SCAFFOLD_COPY.MIND_GARDEN_OBS_TITLE}
              subtitle={ADMIN_WEB_SCAFFOLD_COPY.MIND_GARDEN_OBS_SUBTITLE}
              titleId={PAGE_TITLE_ID}
            />
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_MIND_GARDEN_SUMMARY} noCard>
              {summaryError ? (
                <SafeErrorDisplay error={summaryError} variant="inline" />
              ) : null}
              {summary ? (
                <ul className="mg-v2-content-section__subtitle">
                  <li>
                    <SafeText tag="span">스냅샷 사용자 수: {toDisplayString(summary.usersWithSnapshot)}</SafeText>
                  </li>
                  <li>
                    <SafeText tag="span">누적 점수 합: {toDisplayString(summary.sumTotalPoints)}</SafeText>
                  </li>
                  <li>
                    <SafeText tag="span">최대 누적 점수: {toDisplayString(summary.maxTotalPoints)}</SafeText>
                  </li>
                  <li>
                    <SafeText tag="span">
                      평균 누적 점수:{' '}
                      {typeof summary.averageTotalPoints === 'number' && Number.isFinite(summary.averageTotalPoints)
                        ? summary.averageTotalPoints.toFixed(2)
                        : toDisplayString(summary.averageTotalPoints)}
                    </SafeText>
                  </li>
                  <li>
                    <SafeText tag="span">최대 단계 인덱스: {toDisplayString(summary.maxStageIndex)}</SafeText>
                  </li>
                  <li>
                    <SafeText tag="span">
                      인메모리 단일 노드 범위: {summary.singleNodeInMemoryScope === true ? '예' : '아니오'}
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
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_MIND_GARDEN_SNAPSHOTS}>
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
              <div className="mg-v2-content-section__actions">
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
                <span className="mg-v2-content-section__subtitle">
                  <SafeText tag="span">
                    {toDisplayString(pageMeta.number + 1)} / {toDisplayString(Math.max(pageMeta.totalPages, 1))}{' '}
                    (총 {toDisplayString(pageMeta.totalElements)}건)
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

export default AdminMindGardenObservabilityPage;
