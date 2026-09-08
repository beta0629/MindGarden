/**
 * OpsApprovalCenter — Clinic-OS 운영 승인 센터 (cross-type inbox)
 * 라우트: `/erp/approvals` (ErpApprovalHub children)
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ContentArea } from '../../dashboard-v2/content';
import ErpPageShell from '../shell/ErpPageShell';
import OpsApprovalQuietHeader from './OpsApprovalQuietHeader';
import OpsApprovalSummaryStrip from './OpsApprovalSummaryStrip';
import {
  approveOpsApprovalItem,
  loadOpsApprovalInbox,
  OAC_ITEM_TYPE,
  rejectOpsApprovalItem
} from './opsApprovalInboxAdapter';
import { buildErpApprovalHubPath } from './erpApprovalHubRoutes';
import { formatApprovalCurrency, formatApprovalDate } from './approvalFormatters';
import { ErpEmptyState, ErpSafeText, useErpSilentRefresh } from '../common';
import MGButton from '../../common/MGButton';
import UnifiedModal from '../../common/modals/UnifiedModal';
import ActionBar from '../../common/ActionBar';
import ActionBarButton from '../../common/ActionBarButton';
import SafeErrorDisplay from '../../common/SafeErrorDisplay';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import { useSession } from '../../../hooks/useSession';
import { toDisplayString } from '../../../utils/safeDisplay';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';
import {
  OAC_ACTIONS,
  OAC_EMPTY,
  OAC_ERRORS,
  OAC_LOADING,
  OAC_MAIN_ARIA_LABEL,
  OAC_MODAL,
  OAC_PAGE_TITLE,
  OAC_SUPER_SUBTITLE,
  OAC_TABLE
} from '../../../constants/opsApprovalCenterStrings';
import '../../../styles/unified-design-tokens.css';
import '../ErpCommon.css';
import './OpsApprovalCenter.css';

/**
 * @param {object} props
 * @param {'admin'|'super'} [props.mode]
 */
const OpsApprovalCenter = ({ mode = 'admin' }) => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const { silentListRefreshing, runSilentListRefresh } = useErpSilentRefresh();
  const [items, setItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [openMoreKey, setOpenMoreKey] = useState(null);

  const loadInbox = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    const run = async () => {
      setError('');
      const data = await loadOpsApprovalInbox({ mode });
      setItems(Array.isArray(data.items) ? data.items : []);
      setPendingCount(Number(data.pendingCount) || 0);
      setTodayCount(Number(data.todayCount) || 0);
      setRejectedCount(Number(data.rejectedCount) || 0);
    };
    try {
      if (silent) {
        await runSilentListRefresh(run);
      } else {
        setLoading(true);
        await run();
      }
    } catch (err) {
      console.error('승인 센터 로드 실패:', err);
      setError(err?.message || OAC_ERRORS.LOAD_FAILED);
      setItems([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [mode, runSilentListRefresh]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const openApprove = (item) => {
    setSelectedItem(item);
    setComment('');
    setShowApproveModal(true);
    setOpenMoreKey(null);
  };

  const openReject = (item) => {
    setSelectedItem(item);
    setComment('');
    setShowRejectModal(true);
    setOpenMoreKey(null);
  };

  const submitApprove = async () => {
    if (!selectedItem) return;
    const adminId = user?.id;
    if (!adminId) {
      setError(OAC_ERRORS.NO_USER);
      return;
    }
    try {
      setProcessing(true);
      setError('');
      const data = await approveOpsApprovalItem(selectedItem, {
        adminId,
        comment,
        mode
      });
      if (data?.success === false) {
        setError(data?.message || OAC_ERRORS.APPROVE_FAILED);
        return;
      }
      setShowApproveModal(false);
      await loadInbox({ silent: true });
    } catch (err) {
      console.error('승인 실패:', err);
      setError(err?.message || OAC_ERRORS.APPROVE_FAILED);
    } finally {
      setProcessing(false);
    }
  };

  const submitReject = async () => {
    if (!selectedItem) return;
    if (!comment.trim()) return;
    const adminId = user?.id;
    if (!adminId) {
      setError(OAC_ERRORS.NO_USER);
      return;
    }
    try {
      setProcessing(true);
      setError('');
      const data = await rejectOpsApprovalItem(selectedItem, {
        adminId,
        comment,
        mode
      });
      if (data?.success === false) {
        setError(data?.message || OAC_ERRORS.REJECT_FAILED);
        return;
      }
      setShowRejectModal(false);
      await loadInbox({ silent: true });
    } catch (err) {
      console.error('반려 실패:', err);
      setError(err?.message || OAC_ERRORS.REJECT_FAILED);
    } finally {
      setProcessing(false);
    }
  };

  const amountClassName = (tone) => {
    if (tone === 'inflow') return 'ops-approval-table__amount ops-approval-table__amount--inflow';
    if (tone === 'expense') return 'ops-approval-table__amount ops-approval-table__amount--expense';
    return 'ops-approval-table__amount';
  };

  const renderActions = (item) => (
    <div className="ops-approval-table__actions">
      {item.canApprove ? (
        <MGButton
          type="button"
          variant="primary"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'sm',
            className: 'ops-approval__action-btn'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
          onClick={() => openApprove(item)}
          aria-label={OAC_ACTIONS.APPROVE}
        >
          {OAC_ACTIONS.APPROVE}
        </MGButton>
      ) : null}
      {item.canReject ? (
        <MGButton
          type="button"
          variant="danger"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'danger',
            size: 'sm',
            className: 'ops-approval__action-btn'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
          onClick={() => openReject(item)}
          aria-label={OAC_ACTIONS.REJECT}
        >
          {OAC_ACTIONS.REJECT}
        </MGButton>
      ) : null}
      {item.openRefundManagement ? (
        <MGButton
          type="button"
          variant="primary"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'sm',
            className: 'ops-approval__action-btn'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
          onClick={() => navigate('/erp/refund-management')}
          aria-label={OAC_ACTIONS.OPEN_REFUND}
        >
          {OAC_ACTIONS.OPEN_REFUND}
        </MGButton>
      ) : null}
      <div className="ops-approval-more">
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            className: 'ops-approval__action-btn'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
          onClick={() => setOpenMoreKey((prev) => (prev === item.key ? null : item.key))}
          aria-label={OAC_ACTIONS.MORE_ARIA}
          aria-expanded={openMoreKey === item.key}
        >
          ⋮
        </MGButton>
        {openMoreKey === item.key ? (
          <div className="ops-approval-more__menu" role="menu">
            {item.type === OAC_ITEM_TYPE.SALARY ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpenMoreKey(null);
                  navigate('/erp/salary');
                }}
              >
                {OAC_ACTIONS.OPEN_SALARY}
              </button>
            ) : null}
            {item.type === OAC_ITEM_TYPE.REFUND ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpenMoreKey(null);
                  navigate('/erp/refund-management');
                }}
              >
                {OAC_ACTIONS.OPEN_REFUND}
              </button>
            ) : null}
            {item.type === OAC_ITEM_TYPE.PURCHASE ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpenMoreKey(null);
                  navigate('/erp/purchase');
                }}
              >
                센터 경비에서 보기
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <ContentArea className="mg-v2-content-area" ariaLabel={OAC_MAIN_ARIA_LABEL}>
      <ErpPageShell
        className="ops-approval-shell ops-approval--clinic-os"
        headerSlot={(
          <OpsApprovalQuietHeader
            onRefresh={() => loadInbox({ silent: true })}
            refreshing={silentListRefreshing}
            disabled={loading}
            mode={mode}
            onSwitchAdmin={() => navigate(buildErpApprovalHubPath('admin'))}
            onSwitchSuper={() => navigate(buildErpApprovalHubPath('super'))}
          />
        )}
        mainAriaLabel={OAC_MAIN_ARIA_LABEL}
      >
        <div className="ops-approval" data-testid="ops-approval-center">
          <OpsApprovalSummaryStrip
            loading={loading}
            pendingCount={pendingCount}
            todayCount={todayCount}
            rejectedCount={rejectedCount}
          />

          <div
            className="ops-approval__stage"
            aria-busy={loading || silentListRefreshing}
            aria-label={OAC_TABLE.ARIA}
          >
            {mode === 'super' ? (
              <p className="ops-approval-mode-hint">{OAC_SUPER_SUBTITLE}</p>
            ) : null}

            {error ? (
              <div className="ops-approval-error" role="alert">
                <SafeErrorDisplay error={error} variant="banner" />
              </div>
            ) : null}

            {loading ? (
              <UnifiedLoading type="inline" text={OAC_LOADING.LIST} />
            ) : items.length === 0 ? (
              <ErpEmptyState title={OAC_EMPTY.TITLE} description={OAC_EMPTY.BODY} />
            ) : (
              <div className="ops-approval-table-wrap">
                <table className="ops-approval-table">
                  <caption className="sr-only">{OAC_PAGE_TITLE}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{OAC_TABLE.TYPE}</th>
                      <th scope="col">{OAC_TABLE.TITLE}</th>
                      <th scope="col">{OAC_TABLE.REQUESTER}</th>
                      <th scope="col">{OAC_TABLE.AMOUNT}</th>
                      <th scope="col">{OAC_TABLE.WHEN}</th>
                      <th scope="col">{OAC_TABLE.ACTIONS}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.key}>
                        <td className="ops-approval-table__type">
                          <SafeText>{item.typeLabel}</SafeText>
                        </td>
                        <td>
                          <SafeText>{item.title}</SafeText>
                        </td>
                        <td>
                          <SafeText fallback="알 수 없음">{item.requesterName}</SafeText>
                        </td>
                        <td className={amountClassName(item.amountTone)}>
                          <ErpSafeText value={formatApprovalCurrency(item.amount)} />
                        </td>
                        <td>
                          <ErpSafeText
                            value={item.createdAt ? formatApprovalDate(item.createdAt) : toDisplayString('—')}
                          />
                        </td>
                        <td>{renderActions(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </ErpPageShell>

      <UnifiedModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title={OAC_MODAL.APPROVE_TITLE}
        size="auto"
        backdropClick
      >
        {selectedItem ? (
          <div aria-busy={processing}>
            <p>
              <SafeText>{selectedItem.title}</SafeText>
              {' · '}
              <span className={amountClassName(selectedItem.amountTone)}>
                <ErpSafeText value={formatApprovalCurrency(selectedItem.amount)} />
              </span>
            </p>
            <div className="ops-approval-comment-group">
              <label className="ops-approval-comment-label" htmlFor="ops-approval-approve-comment">
                {OAC_MODAL.COMMENT_OPTIONAL}
              </label>
              <textarea
                id="ops-approval-approve-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={OAC_MODAL.COMMENT_APPROVE_PH}
                rows={3}
                className="ops-approval-comment-textarea"
              />
            </div>
            <ActionBar align="end" gap="md">
              <ActionBarButton variant="outline" onClick={() => setShowApproveModal(false)}>
                {OAC_ACTIONS.CANCEL}
              </ActionBarButton>
              <ActionBarButton variant="primary" onClick={submitApprove} loading={processing}>
                {OAC_ACTIONS.CONFIRM_APPROVE}
              </ActionBarButton>
            </ActionBar>
          </div>
        ) : null}
      </UnifiedModal>

      <UnifiedModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={OAC_MODAL.REJECT_TITLE}
        size="auto"
        backdropClick
      >
        {selectedItem ? (
          <div aria-busy={processing}>
            <p>
              <SafeText>{selectedItem.title}</SafeText>
            </p>
            <div className="ops-approval-comment-group">
              <label className="ops-approval-comment-label" htmlFor="ops-approval-reject-comment">
                {OAC_MODAL.COMMENT_REQUIRED}
              </label>
              <textarea
                id="ops-approval-reject-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={OAC_MODAL.COMMENT_REJECT_PH}
                rows={3}
                required
                className="ops-approval-comment-textarea"
              />
            </div>
            <ActionBar align="end" gap="md">
              <ActionBarButton variant="outline" onClick={() => setShowRejectModal(false)}>
                {OAC_ACTIONS.CANCEL}
              </ActionBarButton>
              <ActionBarButton
                variant="danger"
                onClick={submitReject}
                loading={processing}
                disabled={!comment.trim()}
              >
                {OAC_ACTIONS.CONFIRM_REJECT}
              </ActionBarButton>
            </ActionBar>
          </div>
        ) : null}
      </UnifiedModal>
    </ContentArea>
  );
};

OpsApprovalCenter.propTypes = {
  mode: PropTypes.oneOf(['admin', 'super'])
};

export default OpsApprovalCenter;
