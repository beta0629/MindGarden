/**
 * 커뮤니티 검수 큐 — BW-4 관리자 API 연동 (목록·상세·PATCH 승인/반려)
 * @author CoreSolution
 * @since 2026-05-14
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import BadgeSelect from '../common/BadgeSelect';
import { ListTableView, CardActionGroup } from '../common';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import StandardizedApi from '../../utils/standardizedApi';
import { htmlToPlainText, toDisplayString, toErrorMessage } from '../../utils/safeDisplay';
import {
  ADMIN_WEB_SCAFFOLD_API,
  ADMIN_WEB_SCAFFOLD_COPY,
  COMMUNITY_MODERATION_STATUS,
  COMMUNITY_MODERATION_STATUS_FILTER_OPTIONS,
  buildCommunityModerationPatchBody,
  buildCommunityModerationPatchPath,
  buildCommunityModerationQueueItemPath,
  normalizeApiListPayload,
  normalizeApiRecordPayload,
  pickCommunityRowContent,
  pickCommunityRowId,
  pickCommunityRowStatus,
  pickCommunityRowTitle
} from '../../constants/adminWebScaffold';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_TITLE_ID = 'admin-community-moderation-title';

function matchesStatusFilter(row, filter) {
  if (filter === COMMUNITY_MODERATION_STATUS.ALL) {
    return true;
  }
  const st = pickCommunityRowStatus(row).trim().toUpperCase();
  return st === filter.trim().toUpperCase();
}

const AdminCommunityModerationQueuePage = () => {
  const [statusFilter, setStatusFilter] = useState(COMMUNITY_MODERATION_STATUS.ALL);
  const [rows, setRows] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [selectedListRow, setSelectedListRow] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFetchError, setDetailFetchError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [patchLoading, setPatchLoading] = useState(false);
  const [patchErrorMessage, setPatchErrorMessage] = useState(null);

  const fetchQueue = useCallback(async() => {
    setListLoading(true);
    setListError(null);
    try {
      const params =
        statusFilter === COMMUNITY_MODERATION_STATUS.ALL
          ? {}
          : { status: statusFilter };
      const raw = await StandardizedApi.get(ADMIN_WEB_SCAFFOLD_API.COMMUNITY_MODERATION_QUEUE, params);
      const list = normalizeApiListPayload(raw);
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      setRows([]);
      setListError(err);
    } finally {
      setListLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    setSelectedListRow(null);
  }, [statusFilter]);

  const selectedId = useMemo(
    () => (selectedListRow ? pickCommunityRowId(selectedListRow) : undefined),
    [selectedListRow]
  );

  useEffect(() => {
    if (selectedListRow == null || selectedId == null || String(selectedId).trim() === '') {
      setDetailRecord(null);
      setDetailFetchError(null);
      setDetailLoading(false);
      return undefined;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailFetchError(null);
    setDetailRecord(null);
    (async() => {
      try {
        const raw = await StandardizedApi.get(buildCommunityModerationQueueItemPath(selectedId));
        let rec = normalizeApiRecordPayload(raw);
        if (rec == null && raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
          rec = raw;
        }
        if (!cancelled) {
          setDetailRecord(rec && typeof rec === 'object' ? rec : null);
        }
      } catch (err) {
        if (!cancelled) {
          setDetailFetchError(err);
          setDetailRecord(null);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedListRow, selectedId]);

  const displayRow = useMemo(() => {
    if (!selectedListRow) {
      return null;
    }
    const fromDetail = detailRecord && typeof detailRecord === 'object' ? detailRecord : {};
    return { ...selectedListRow, ...fromDetail };
  }, [selectedListRow, detailRecord]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesStatusFilter(row, statusFilter)),
    [rows, statusFilter]
  );

  const columns = useMemo(
    () => [
      { key: 'title', label: ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_TABLE_TITLE },
      { key: 'status', label: ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_TABLE_STATUS },
      { key: 'author', label: ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_TABLE_AUTHOR },
      { key: 'created', label: ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_TABLE_CREATED }
    ],
    []
  );

  const openConfirmModal = (action) => {
    setPendingAction(action);
    setRejectReason('');
    setConfirmOpen(true);
  };

  const closeConfirmModal = () => {
    if (patchLoading) {
      return;
    }
    setConfirmOpen(false);
    setPendingAction(null);
    setRejectReason('');
  };

  const handleConfirmPatch = async() => {
    if (!displayRow || !pendingAction) {
      return;
    }
    const id = pickCommunityRowId(displayRow);
    if (id == null || String(id).trim() === '') {
      setPatchErrorMessage('처리할 항목 식별자가 없습니다.');
      return;
    }
    setPatchLoading(true);
    try {
      const path = buildCommunityModerationPatchPath(id);
      const body = buildCommunityModerationPatchBody(pendingAction, rejectReason);
      await StandardizedApi.patch(path, body);
      closeConfirmModal();
      setSelectedListRow(null);
      setDetailRecord(null);
      setDetailFetchError(null);
      await fetchQueue();
    } catch (err) {
      setPatchErrorMessage(toErrorMessage(err));
    } finally {
      setPatchLoading(false);
    }
  };

  const tableData = useMemo(
    () =>
      filteredRows.map((row, idx) => {
        const id = pickCommunityRowId(row);
        const author =
          row && typeof row === 'object'
            ? row.authorName ?? row.writerName ?? row.createdBy ?? row.userName ?? ''
            : '';
        const created =
          row && typeof row === 'object'
            ? row.createdAt ?? row.createdDate ?? row.registeredAt ?? ''
            : '';
        return {
          __rowKey: id != null ? String(id) : `row-${idx}`,
          title: pickCommunityRowTitle(row),
          status: pickCommunityRowStatus(row),
          author: author != null ? String(author) : '',
          created: created != null ? String(created) : '',
          __raw: row
        };
      }),
    [filteredRows]
  );

  const handleRowClick = (item) => {
    setSelectedListRow(item.__raw ?? null);
  };

  const renderCell = (columnKey, item) => {
    if (columnKey === 'title') {
      return <SafeText>{item.title}</SafeText>;
    }
    if (columnKey === 'status') {
      return <SafeText>{item.status}</SafeText>;
    }
    if (columnKey === 'author') {
      return <SafeText>{item.author}</SafeText>;
    }
    if (columnKey === 'created') {
      return <SafeText>{item.created}</SafeText>;
    }
    return <SafeText>—</SafeText>;
  };

  const displayBodyPlain = displayRow
    ? htmlToPlainText(pickCommunityRowContent(displayRow))
    : '';

  const actionTargetId = displayRow ? pickCommunityRowId(displayRow) : undefined;
  const canModerate = actionTargetId != null && String(actionTargetId).trim() !== '' && !detailLoading;

  const confirmTitle =
    pendingAction === 'reject'
      ? ADMIN_WEB_SCAFFOLD_COPY.MODAL_CONFIRM_REJECT_TITLE
      : ADMIN_WEB_SCAFFOLD_COPY.MODAL_CONFIRM_APPROVE_TITLE;
  const confirmBody =
    pendingAction === 'reject'
      ? ADMIN_WEB_SCAFFOLD_COPY.MODAL_CONFIRM_REJECT_BODY
      : ADMIN_WEB_SCAFFOLD_COPY.MODAL_CONFIRM_APPROVE_BODY;

  return (
    <AdminCommonLayout title={ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_PAGE_TITLE} loading={listLoading}>
      <div className="mg-v2-ad-b0kla" data-testid="admin-community-moderation-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_PAGE_TITLE}>
            <ContentHeader
              title={ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_PAGE_TITLE}
              subtitle={ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_PAGE_SUBTITLE}
              titleId={PAGE_TITLE_ID}
            />
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
                      fetchQueue();
                    }}
                  >
                    {ADMIN_WEB_SCAFFOLD_COPY.LIST_ERROR_RETRY}
                  </MGButton>
                </div>
              </ContentSection>
            ) : null}
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_STATUS_FILTER} noCard>
              <BadgeSelect
                aria-label="검수 상태 필터"
                options={COMMUNITY_MODERATION_STATUS_FILTER_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </ContentSection>
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_POST_LIST}>
              {!listLoading && tableData.length === 0 ? (
                <EmptyState
                  title={ADMIN_WEB_SCAFFOLD_COPY.EMPTY_COMMUNITY_TITLE}
                  description={ADMIN_WEB_SCAFFOLD_COPY.EMPTY_COMMUNITY_DESC}
                />
              ) : (
                <ListTableView
                  columns={columns}
                  data={tableData}
                  rowKeyField="__rowKey"
                  onRowClick={handleRowClick}
                  renderCell={renderCell}
                />
              )}
            </ContentSection>
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_DETAIL}>
              {displayRow ? (
                <>
                  {detailLoading ? (
                    <p className="mg-v2-content-section__subtitle">
                      <SafeText tag="span">{ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_DETAIL_LOADING}</SafeText>
                    </p>
                  ) : null}
                  {detailFetchError ? (
                    <SafeErrorDisplay
                      error={detailFetchError}
                      variant="inline"
                      prefix={ADMIN_WEB_SCAFFOLD_COPY.DETAIL_LOAD_ERROR_PREFIX}
                    />
                  ) : null}
                  <p className="mg-v2-content-section__subtitle">
                    <SafeText tag="span">{toDisplayString(pickCommunityRowTitle(displayRow))}</SafeText>
                  </p>
                  <p>
                    <SafeText tag="span">{ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_DETAIL_STATUS_PREFIX}</SafeText>
                    <SafeText tag="span">{pickCommunityRowStatus(displayRow)}</SafeText>
                  </p>
                  {displayBodyPlain !== '' ? (
                    <div>
                      <p className="mg-v2-content-section__subtitle">
                        <SafeText tag="span">{ADMIN_WEB_SCAFFOLD_COPY.DETAIL_SECTION_BODY_LABEL}</SafeText>
                      </p>
                      <section
                        className="message-content-full"
                        aria-label={ADMIN_WEB_SCAFFOLD_COPY.DETAIL_SECTION_BODY_LABEL}
                      >
                        <SafeText tag="div">{displayBodyPlain}</SafeText>
                      </section>
                    </div>
                  ) : null}
                  <CardActionGroup>
                    <MGButton
                      type="button"
                      className={buildErpMgButtonClassName({
                        variant: 'primary',
                        size: 'md',
                        className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary'
                      })}
                      variant="primary"
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      disabled={!canModerate || patchLoading}
                      onClick={() => openConfirmModal('approve')}
                    >
                      {ADMIN_WEB_SCAFFOLD_COPY.ACTION_APPROVE}
                    </MGButton>
                    <MGButton
                      type="button"
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'md',
                        className: 'mg-v2-mapping-header-btn'
                      })}
                      variant="outline"
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      disabled={!canModerate || patchLoading}
                      onClick={() => openConfirmModal('reject')}
                    >
                      {ADMIN_WEB_SCAFFOLD_COPY.ACTION_REJECT}
                    </MGButton>
                  </CardActionGroup>
                </>
              ) : (
                <EmptyState title={ADMIN_WEB_SCAFFOLD_COPY.COMMUNITY_SELECT_ROW_HINT_TITLE} description="" />
              )}
            </ContentSection>
          </ContentArea>
        </div>
      </div>

      <UnifiedModal
        isOpen={confirmOpen}
        onClose={closeConfirmModal}
        title={confirmTitle}
        size="small"
        variant="confirm"
        loading={patchLoading}
        backdropClick={!patchLoading}
        showCloseButton={!patchLoading}
        actions={(
          <>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md' })}
              variant="outline"
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              disabled={patchLoading}
              onClick={closeConfirmModal}
            >
              {ADMIN_WEB_SCAFFOLD_COPY.MODAL_ACTION_CANCEL}
            </MGButton>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md' })}
              variant="primary"
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              loading={patchLoading}
              disabled={patchLoading}
              onClick={() => {
                handleConfirmPatch();
              }}
            >
              {ADMIN_WEB_SCAFFOLD_COPY.MODAL_ACTION_CONFIRM}
            </MGButton>
          </>
        )}
      >
        <SafeText tag="p">{confirmBody}</SafeText>
        {pendingAction === 'reject' ? (
          <div className="mg-v2-content-section__subtitle">
            <label htmlFor="admin-community-reject-reason">
              <SafeText tag="span">{ADMIN_WEB_SCAFFOLD_COPY.MODAL_REJECT_REASON_LABEL}</SafeText>
            </label>
            <textarea
              id="admin-community-reject-reason"
              className="mg-v2-ad-b0kla__form-textarea mg-v2-textarea"
              rows={4}
              value={rejectReason}
              disabled={patchLoading}
              onChange={(e) => {
                setRejectReason(e.target.value);
              }}
            />
          </div>
        ) : null}
      </UnifiedModal>

      <UnifiedModal
        isOpen={patchErrorMessage != null}
        onClose={() => {
          setPatchErrorMessage(null);
        }}
        title={ADMIN_WEB_SCAFFOLD_COPY.MODAL_PATCH_ERROR_TITLE}
        size="small"
        variant="alert"
        actions={(
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md' })}
            variant="primary"
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => {
              setPatchErrorMessage(null);
            }}
          >
            {ADMIN_WEB_SCAFFOLD_COPY.MODAL_CLOSE_CONFIRM}
          </MGButton>
        )}
      >
        <SafeText tag="p">{patchErrorMessage != null ? toDisplayString(patchErrorMessage) : ''}</SafeText>
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default AdminCommunityModerationQueuePage;
