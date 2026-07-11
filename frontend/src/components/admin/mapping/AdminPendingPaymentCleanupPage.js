/**
 * AdminPendingPaymentCleanupPage — 옵션 B R4 디러티 PENDING_PAYMENT 매칭 어드민 수동 정리.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 * 사용자 결정: R4 = "디러티 UI 제외 → 후속 PR로 분리" (정착 완료). 본 페이지는 그 후속.
 *
 * 기능:
 *  - 경과 시간 필터 (24h / 48h / 72h)
 *  - 페이지네이션 목록 (매칭 ID / 상담사 / 내담자 / 생성일 / 경과 / 가격 / 액션)
 *  - 단건 정리 버튼 + 일괄 선택 체크박스 + 일괄 정리 버튼
 *  - CleanupPendingPaymentModal 호출
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import BadgeSelect from '../../common/BadgeSelect';
import { ListTableView, CardActionGroup } from '../../common';
import EmptyState from '../../common/EmptyState';
import SafeText from '../../common/SafeText';
import SafeErrorDisplay from '../../common/SafeErrorDisplay';
import MGButton from '../../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../../erp/common/erpMgButtonProps';
import StandardizedApi from '../../../utils/standardizedApi';
import { toDisplayString } from '../../../utils/safeDisplay';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import CleanupPendingPaymentModal from './CleanupPendingPaymentModal';

const PAGE_TITLE_ID = 'admin-pending-payment-cleanup-title';
const PAGE_SIZE = 20;

const AGE_HOURS_OPTIONS = [
  { value: 24, labelKey: 'admin:mappings.pendingPaymentCleanup.filter.ageHours.24' },
  { value: 48, labelKey: 'admin:mappings.pendingPaymentCleanup.filter.ageHours.48' },
  { value: 72, labelKey: 'admin:mappings.pendingPaymentCleanup.filter.ageHours.72' }
];

const formatDateTime = (value) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch (_err) {
    return String(value);
  }
};

const AdminPendingPaymentCleanupPage = () => {
  const { t } = useTranslation(['admin']);
  const [ageHours, setAgeHours] = useState(24);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [singleCleanupTarget, setSingleCleanupTarget] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const filterOptions = useMemo(() => (
    AGE_HOURS_OPTIONS.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey)
    }))
  ), [t]);

  const fetchList = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const raw = await StandardizedApi.get(
        API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_PAYMENT_DIRTY,
        { ageHours, page, size: PAGE_SIZE }
      );
      const data = raw && raw.data ? raw.data : raw;
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
      setTotalElements(Number(data?.totalElements ?? list.length));
      setTotalPages(Number(data?.totalPages ?? 1));
    } catch (err) {
      setItems([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [ageHours, page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    setSelectedIds([]);
  }, [ageHours, page]);

  const allSelectedOnPage = useMemo(() => (
    items.length > 0 && items.every((it) => selectedIds.includes(it.mappingId))
  ), [items, selectedIds]);

  const toggleSelectAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((it) => it.mappingId).filter((id) => id != null));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const columns = useMemo(() => ([
    { key: 'select', label: t('admin:mappings.pendingPaymentCleanup.columns.select') },
    { key: 'mappingId', label: t('admin:mappings.pendingPaymentCleanup.columns.mappingId') },
    { key: 'consultant', label: t('admin:mappings.pendingPaymentCleanup.columns.consultant') },
    { key: 'client', label: t('admin:mappings.pendingPaymentCleanup.columns.client') },
    { key: 'createdAt', label: t('admin:mappings.pendingPaymentCleanup.columns.createdAt') },
    { key: 'elapsed', label: t('admin:mappings.pendingPaymentCleanup.columns.elapsed') },
    { key: 'price', label: t('admin:mappings.pendingPaymentCleanup.columns.price') },
    { key: 'action', label: t('admin:mappings.pendingPaymentCleanup.columns.action') }
  ]), [t]);

  const tableData = useMemo(() => (
    items.map((it, idx) => ({
      __rowKey: it.mappingId != null ? String(it.mappingId) : `row-${idx}`,
      __raw: it,
      mappingId: it.mappingId,
      consultant: it.consultantName || '',
      client: it.clientName || '',
      createdAt: formatDateTime(it.createdAt),
      elapsed: it.elapsedHours != null ? `${it.elapsedHours}h` : '',
      price: it.packagePrice != null ? `${it.packagePrice.toLocaleString()}원` : ''
    }))
  ), [items]);

  const renderCell = (columnKey, item) => {
    if (columnKey === 'select') {
      return (
        <input
          type="checkbox"
          aria-label={`row-${item.mappingId}`}
          checked={selectedIds.includes(item.mappingId)}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelectOne(item.mappingId);
          }}
        />
      );
    }
    if (columnKey === 'action') {
      return (
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm' })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={(e) => {
            e.stopPropagation();
            setSingleCleanupTarget(item.__raw);
          }}
        >
          {t('admin:mappings.pendingPaymentCleanup.actions.cleanup')}
        </MGButton>
      );
    }
    const value = item[columnKey];
    return <SafeText tag="span">{toDisplayString(value)}</SafeText>;
  };

  const handleSingleCleanupDone = () => {
    setSingleCleanupTarget(null);
    fetchList();
  };

  const handleBulkCleanupDone = () => {
    setBulkModalOpen(false);
    setSelectedIds([]);
    fetchList();
  };

  const empty = !loading && tableData.length === 0;

  return (
    <AdminCommonLayout
      title={t('admin:mappings.pendingPaymentCleanup.title')}
      loading={loading}
    >
      <div className="mg-v2-ad-b0kla" data-testid="admin-pending-payment-cleanup-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={t('admin:mappings.pendingPaymentCleanup.title')}>
            <ContentHeader
              title={t('admin:mappings.pendingPaymentCleanup.title')}
              subtitle={t('admin:mappings.pendingPaymentCleanup.description')}
              titleId={PAGE_TITLE_ID}
            />

            {error ? (
              <ContentSection noCard>
                <SafeErrorDisplay error={error} variant="banner" />
              </ContentSection>
            ) : null}

            <ContentSection
              title={t('admin:mappings.pendingPaymentCleanup.filter.title')}
              noCard
            >
              <BadgeSelect
                aria-label={t('admin:mappings.pendingPaymentCleanup.filter.title')}
                options={filterOptions}
                value={ageHours}
                onChange={(value) => {
                  setPage(0);
                  setAgeHours(Number(value));
                }}
              />
            </ContentSection>

            <ContentSection title={t('admin:mappings.pendingPaymentCleanup.list.title')}>
              <CardActionGroup>
                <MGButton
                  type="button"
                  variant="outline"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm' })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={toggleSelectAll}
                  disabled={empty}
                >
                  {t(allSelectedOnPage
                    ? 'admin:mappings.pendingPaymentCleanup.actions.clearAll'
                    : 'admin:mappings.pendingPaymentCleanup.actions.selectAll')}
                </MGButton>
                <MGButton
                  type="button"
                  variant="primary"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'sm',
                    className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  disabled={selectedIds.length === 0}
                  onClick={() => setBulkModalOpen(true)}
                >
                  {t('admin:mappings.pendingPaymentCleanup.actions.bulkCleanup', {
                    count: selectedIds.length
                  })}
                </MGButton>
              </CardActionGroup>

              {empty ? (
                <EmptyState
                  title={t('admin:mappings.pendingPaymentCleanup.emptyState.title')}
                  description={t('admin:mappings.pendingPaymentCleanup.emptyState.description')}
                />
              ) : (
                <>
                  <ListTableView
                    columns={columns}
                    data={tableData}
                    rowKeyField="__rowKey"
                    renderCell={renderCell}
                  />
                  <div className="mg-v2-content-section__actions mg-v2-content-section__actions--pagination" data-testid="cleanup-pagination">
                    <div className="mg-v2-content-section__pagination-buttons">
                      <MGButton
                        type="button"
                        variant="outline"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm' })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        disabled={page <= 0}
                        onClick={() => setPage(Math.max(page - 1, 0))}
                      >
                        {t('admin:mappings.pendingPaymentCleanup.pagination.prev')}
                      </MGButton>
                      <MGButton
                        type="button"
                        variant="outline"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm' })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        disabled={page + 1 >= totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        {t('admin:mappings.pendingPaymentCleanup.pagination.next')}
                      </MGButton>
                    </div>
                    <span className="mg-v2-content-section__subtitle">
                      <SafeText tag="span">
                        {t('admin:mappings.pendingPaymentCleanup.pagination.summary', {
                          page: page + 1,
                          totalPages: Math.max(totalPages, 1),
                          totalElements
                        })}
                      </SafeText>
                    </span>
                  </div>
                </>
              )}
            </ContentSection>
          </ContentArea>
        </div>
      </div>

      <CleanupPendingPaymentModal
        isOpen={singleCleanupTarget != null}
        mode="single"
        target={singleCleanupTarget}
        selectedIds={singleCleanupTarget ? [singleCleanupTarget.mappingId] : []}
        onClose={() => setSingleCleanupTarget(null)}
        onCompleted={handleSingleCleanupDone}
      />

      <CleanupPendingPaymentModal
        isOpen={bulkModalOpen}
        mode="bulk"
        target={null}
        selectedIds={selectedIds}
        onClose={() => setBulkModalOpen(false)}
        onCompleted={handleBulkCleanupDone}
      />
    </AdminCommonLayout>
  );
};

export default AdminPendingPaymentCleanupPage;
