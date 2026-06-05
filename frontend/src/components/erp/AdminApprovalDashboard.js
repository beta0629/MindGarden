import { useState, useEffect } from 'react';
import CardContainer from '../common/CardContainer';
import MGButton from '../common/MGButton';
import ActionBar from '../common/ActionBar';
import ActionBarButton from '../common/ActionBarButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT,
  mapErpSizeToMg,
  mapErpVariantToMg
} from './common/erpMgButtonProps';
import { ErpSafeText, useErpSilentRefresh } from './common';
import UnifiedModal from '../common/modals/UnifiedModal';
import { useSession } from '../../hooks/useSession';
import './ApprovalDashboard.css';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import ApprovalHubLayout from './approval/ApprovalHubLayout';
import { formatApprovalCurrency, formatApprovalDate } from './approval/approvalFormatters';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API } from '../../constants/api';
import { useTranslation } from 'react-i18next';

/**
 * 관리자 승인 대시보드 컴포넌트
 */
const AdminApprovalDashboard = () => {
  const { t } = useTranslation();
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const { silentListRefreshing, runSilentListRefresh } = useErpSilentRefresh();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async(options = {}) => {
    const silent = options.silent === true;
    const run = async() => {
      setError('');
      const list = await StandardizedApi.get(ERP_API.PURCHASE_REQUESTS_PENDING_ADMIN);
      if (Array.isArray(list)) {
        setRequests(list);
      } else {
        setRequests([]);
        setError('승인 대기 목록을 불러오는데 실패했습니다.');
      }
    };
    try {
      if (silent) {
        await runSilentListRefresh(run);
      } else {
        setLoading(true);
        await run();
      }
    } catch (err) {
      console.error('승인 대기 목록 로드 실패:', err);
      setError(err?.message || '승인 대기 목록을 불러오는데 실패했습니다.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setComment('');
    setShowApprovalModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setComment('');
    setShowRejectionModal(true);
  };

  const submitApproval = async() => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      setError('');

      const adminId = user?.id;

      if (!adminId) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const endpoint = `${ERP_API.PURCHASE_REQUEST_APPROVE_ADMIN(selectedRequest.id)}?adminId=${encodeURIComponent(adminId)}&comment=${encodeURIComponent(comment ?? '')}`;
      const data = await StandardizedApi.post(endpoint, {});

      if (data?.success) {
        setShowApprovalModal(false);
        loadPendingRequests({ silent: true });
      } else {
        setError(data?.message || '승인 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('승인 처리 실패:', error);
      setError('승인 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const submitRejection = async() => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      setError('');

      const adminId = user?.id;

      if (!adminId) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const endpoint = `${ERP_API.PURCHASE_REQUEST_REJECT_ADMIN(selectedRequest.id)}?adminId=${encodeURIComponent(adminId)}&comment=${encodeURIComponent(comment ?? '')}`;
      const data = await StandardizedApi.post(endpoint, {});

      if (data?.success) {
        setShowRejectionModal(false);
        loadPendingRequests({ silent: true });
      } else {
        setError(data?.message || '거부 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('거부 처리 실패:', error);
      setError('거부 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ApprovalHubLayout
      headerTitle="관리자 승인 대시보드"
      headerSubtitle="구매 요청 승인 및 거부"
      loading={loading}
      loadingText="승인 대기 요청을 불러오는 중..."
      refreshing={silentListRefreshing}
      onRefresh={() => loadPendingRequests({ silent: true })}
      activeMode="admin"
    >
      {error && (
        <div className="approval-dashboard-error">
          <SafeErrorDisplay error={error} variant="inline" />
        </div>
      )}

      {requests.length === 0 ? (
        <section className="mg-v2-section" aria-labelledby="approval-admin-empty-title">
          <CardContainer>
            <h3 id="approval-admin-empty-title" className="mg-h4">{t('erp:AdminApprovalDashboard.t_e018899d')}</h3>
            <div className="mg-v2-card-body">
              <div className="approval-dashboard-empty">
                {t('erp:AdminApprovalDashboard.t_b4c9b299')}
              </div>
            </div>
          </CardContainer>
        </section>
      ) : (
        <div className="approval-dashboard-grid">
          {requests.map(request => (
            <section
              key={request.id}
              className="mg-v2-section"
              aria-labelledby={`approval-admin-req-title-${request.id}`}
            >
              <CardContainer>
                <h3 id={`approval-admin-req-title-${request.id}`} className="mg-h4">
                  {toDisplayString(`구매 요청 #${request.id}`)}
                </h3>
                <div className="mg-v2-card-body">
                  <div className="approval-request-info">
                    <div className="approval-request-grid">
                      <div><strong>{t('erp:AdminApprovalDashboard.t_17102fe2')}</strong> <SafeText fallback="알 수 없음">{request.requester?.name}</SafeText></div>
                      <div><strong>{t('erp:AdminApprovalDashboard.t_b478a5ad')}</strong> <ErpSafeText value={formatApprovalDate(request.createdAt)} /></div>
                      <div><strong>{t('erp:AdminApprovalDashboard.t_f2e00fdf')}</strong> <SafeText fallback="알 수 없음">{request.item?.name}</SafeText></div>
                      <div><strong>{t('erp:AdminApprovalDashboard.t_46dfd8e0')}</strong> <ErpSafeText value={request.quantity} />{t('erp:AdminApprovalDashboard.t_11600c9a')}</div>
                      <div><strong>{t('erp:AdminApprovalDashboard.t_a10017a8')}</strong> <ErpSafeText value={formatApprovalCurrency(request.unitPrice)} /></div>
                      <div><strong>{t('erp:AdminApprovalDashboard.t_e2749f0f')}</strong> <ErpSafeText value={formatApprovalCurrency(request.totalAmount)} /></div>
                    </div>

                    {request.reason && (
                      <div className="approval-request-reason">
                        <strong>{t('erp:AdminApprovalDashboard.t_0d80f691')}</strong>
                        <div className="approval-request-reason-text">
                          <SafeText>{request.reason}</SafeText>
                        </div>
                      </div>
                    )}

                    <div className="approval-request-actions">
                      <MGButton
                        variant={mapErpVariantToMg('success')}
                        size={mapErpSizeToMg('small')}
                        className={buildErpMgButtonClassName({ variant: 'success', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => handleApprove(request)}
                      >
                        {t('erp:AdminApprovalDashboard.t_0d1cd671')}
                      </MGButton>
                      <MGButton
                        variant={mapErpVariantToMg('danger')}
                        size={mapErpSizeToMg('small')}
                        className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => handleReject(request)}
                      >
                        {t('erp:AdminApprovalDashboard.t_36fa7537')}
                      </MGButton>
                    </div>
                  </div>
                </div>
              </CardContainer>
            </section>
          ))}
        </div>
      )}

      <UnifiedModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={t('erp:AdminApprovalDashboard.t_2ae8c324')}
        size="auto"
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        {selectedRequest && (
          <div aria-busy={processing}>
            <div className="approval-request-details">
              <h4>{t('erp:AdminApprovalDashboard.t_d8c50e38')}</h4>
              <div className="approval-request-info-box">
                <div><strong>{t('erp:AdminApprovalDashboard.t_f2e00fdf')}</strong> <SafeText>{selectedRequest.item?.name}</SafeText></div>
                <div><strong>{t('erp:AdminApprovalDashboard.t_46dfd8e0')}</strong> <ErpSafeText value={selectedRequest.quantity} />{t('erp:AdminApprovalDashboard.t_11600c9a')}</div>
                <div><strong>{t('erp:AdminApprovalDashboard.t_e2749f0f')}</strong> <ErpSafeText value={formatApprovalCurrency(selectedRequest.totalAmount)} /></div>
              </div>
            </div>

            <div className="approval-request-comment-group">
              <label className="approval-request-comment-label">
                {t('erp:AdminApprovalDashboard.t_bee4541d')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('erp:AdminApprovalDashboard.t_49c6d86b')}
                rows="3"
                className="approval-request-comment-textarea"
              />
            </div>

            <ActionBar align="end" gap="md" className="approval-request-actions">
              <ActionBarButton variant="outline" onClick={() => setShowApprovalModal(false)}>
                {t('common.actions.cancel')}
              </ActionBarButton>
              <ActionBarButton variant="primary" onClick={submitApproval} loading={processing}>
                {t('erp:AdminApprovalDashboard.t_49a2435b')}
              </ActionBarButton>
            </ActionBar>
          </div>
        )}
      </UnifiedModal>

      <UnifiedModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title={t('erp:AdminApprovalDashboard.t_4c549b61')}
        size="auto"
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        {selectedRequest && (
          <div aria-busy={processing}>
            <div className="approval-request-comment-group">
              <h4>{t('erp:AdminApprovalDashboard.t_82938fa2')}</h4>
              <div className="approval-request-info-box">
                <div><strong>{t('erp:AdminApprovalDashboard.t_f2e00fdf')}</strong> <SafeText>{selectedRequest.item?.name}</SafeText></div>
                <div><strong>{t('erp:AdminApprovalDashboard.t_46dfd8e0')}</strong> <ErpSafeText value={selectedRequest.quantity} />{t('erp:AdminApprovalDashboard.t_11600c9a')}</div>
                <div><strong>{t('erp:AdminApprovalDashboard.t_e2749f0f')}</strong> <ErpSafeText value={formatApprovalCurrency(selectedRequest.totalAmount)} /></div>
              </div>
            </div>

            <div className="approval-request-comment-group">
              <label className="approval-request-comment-label">
                {t('erp:AdminApprovalDashboard.t_f1908d6e')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('erp:AdminApprovalDashboard.t_b5091061')}
                rows="3"
                required
                className="approval-request-comment-textarea"
              />
            </div>

            <ActionBar align="end" gap="md" className="approval-request-actions">
              <ActionBarButton variant="outline" onClick={() => setShowRejectionModal(false)}>
                {t('common.actions.cancel')}
              </ActionBarButton>
              <ActionBarButton
                variant="danger"
                onClick={submitRejection}
                loading={processing}
                disabled={!comment.trim()}
              >
                {t('erp:AdminApprovalDashboard.t_9aa55896')}
              </ActionBarButton>
            </ActionBar>
          </div>
        )}
      </UnifiedModal>
    </ApprovalHubLayout>
  );
};

export default AdminApprovalDashboard;
