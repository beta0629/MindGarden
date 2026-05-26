import { useState, useEffect } from 'react';
import CardContainer from '../common/CardContainer';
import MGButton from '../common/MGButton';
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
import { toDisplayString } from '../../utils/safeDisplay';
import ApprovalHubLayout from './approval/ApprovalHubLayout';
import { formatApprovalCurrency, formatApprovalDate } from './approval/approvalFormatters';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API } from '../../constants/api';
import { useTranslation } from 'react-i18next';

/**
 * 수퍼 관리자 승인 대시보드 컴포넌트
 */
const SuperAdminApprovalDashboard = () => {
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
      const list = await StandardizedApi.get(ERP_API.PURCHASE_REQUESTS_PENDING_SUPER_ADMIN);
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

      const superAdminId = user?.id;

      if (!superAdminId) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const endpoint = `${ERP_API.PURCHASE_REQUEST_APPROVE_SUPER_ADMIN(selectedRequest.id)}?superAdminId=${encodeURIComponent(superAdminId)}&comment=${encodeURIComponent(comment ?? '')}`;
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

      const superAdminId = user?.id;

      if (!superAdminId) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const endpoint = `${ERP_API.PURCHASE_REQUEST_REJECT_SUPER_ADMIN(selectedRequest.id)}?superAdminId=${encodeURIComponent(superAdminId)}&comment=${encodeURIComponent(comment ?? '')}`;
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
      headerTitle="수퍼 관리자 승인 대시보드"
      headerSubtitle="관리자 승인된 구매 요청의 최종 승인"
      loading={loading}
      loadingText="수퍼 관리자 승인 대기 요청을 불러오는 중..."
      refreshing={silentListRefreshing}
      onRefresh={() => loadPendingRequests({ silent: true })}
      activeMode="super"
    >
      {error && (
        <div className="approval-dashboard-error">
          <SafeErrorDisplay error={error} variant="inline" />
        </div>
      )}

      {requests.length === 0 ? (
        <section className="mg-v2-section" aria-labelledby="approval-super-empty-title">
          <CardContainer>
            <h3 id="approval-super-empty-title" className="mg-h4">{t('erp:SuperAdminApprovalDashboard.t_e018899d')}</h3>
            <div className="mg-v2-card-body">
              <div className="approval-dashboard-empty">
                {t('erp:SuperAdminApprovalDashboard.t_3b5f7831')}
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
              aria-labelledby={`approval-super-req-title-${request.id}`}
            >
              <CardContainer>
                <h3 id={`approval-super-req-title-${request.id}`} className="mg-h4">
                  {toDisplayString(`구매 요청 #${request.id}`)}
                </h3>
                <div className="mg-v2-card-body">
                  <div className="approval-request-info">
                    <div className="approval-request-grid">
                      <div><strong>{t('erp:SuperAdminApprovalDashboard.t_17102fe2')}</strong> <ErpSafeText value={request.requester?.name} fallback="알 수 없음" /></div>
                      <div><strong>{t('erp:SuperAdminApprovalDashboard.t_b478a5ad')}</strong> <ErpSafeText value={formatApprovalDate(request.createdAt)} /></div>
                      <div><strong>{t('erp:SuperAdminApprovalDashboard.t_f2e00fdf')}</strong> <ErpSafeText value={request.item?.name} fallback="알 수 없음" /></div>
                      <div><strong>{t('erp:SuperAdminApprovalDashboard.t_46dfd8e0')}</strong> <ErpSafeText value={request.quantity} />{t('erp:SuperAdminApprovalDashboard.t_11600c9a')}</div>
                      <div><strong>{t('erp:SuperAdminApprovalDashboard.t_a10017a8')}</strong> <ErpSafeText value={formatApprovalCurrency(request.unitPrice)} /></div>
                      <div><strong>{t('erp:SuperAdminApprovalDashboard.t_e2749f0f')}</strong> <ErpSafeText value={formatApprovalCurrency(request.totalAmount)} /></div>
                    </div>

                    {request.adminApprover && (
                      <div className="approval-admin-info">
                        <div className="approval-admin-status">
                          {t('erp:SuperAdminApprovalDashboard.t_6e756c95')}
                        </div>
                        <div className="mg-v2-text-sm">
                          <div><strong>{t('erp:SuperAdminApprovalDashboard.t_ba598083')}</strong> <ErpSafeText value={request.adminApprover?.name} fallback="알 수 없음" /></div>
                          <div><strong>{t('erp:SuperAdminApprovalDashboard.t_f8ec57cf')}</strong> <ErpSafeText value={formatApprovalDate(request.adminApprovedAt)} /></div>
                          {request.adminComment && (
                            <div><strong>{t('erp:SuperAdminApprovalDashboard.t_59b435fe')}</strong> <ErpSafeText value={request.adminComment} /></div>
                          )}
                        </div>
                      </div>
                    )}

                    {request.reason && (
                      <div className="super-admin-form-group">
                        <strong>{t('erp:SuperAdminApprovalDashboard.t_ba8f0ebc')}</strong>
                        <div className="super-admin-reason-box">
                          <ErpSafeText value={request.reason} />
                        </div>
                      </div>
                    )}

                    <div className="super-admin-actions-container">
                      <MGButton
                        variant={mapErpVariantToMg('success')}
                        size={mapErpSizeToMg('small')}
                        className={buildErpMgButtonClassName({ variant: 'success', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => handleApprove(request)}
                      >
                        {t('erp:SuperAdminApprovalDashboard.t_aa4f2203')}
                      </MGButton>
                      <MGButton
                        variant={mapErpVariantToMg('danger')}
                        size={mapErpSizeToMg('small')}
                        className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => handleReject(request)}
                      >
                        {t('erp:SuperAdminApprovalDashboard.t_36fa7537')}
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
        title={t('erp:SuperAdminApprovalDashboard.t_fec1c31c')}
        size="auto"
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        {selectedRequest && (
          <div aria-busy={processing}>
            <div className="mg-v2-form-group">
              <h4>{t('erp:SuperAdminApprovalDashboard.t_5ad9ad00')}</h4>
              <div className="super-admin-info-box">
                <div><strong>{t('erp:SuperAdminApprovalDashboard.t_f2e00fdf')}</strong> <ErpSafeText value={selectedRequest.item?.name} /></div>
                <div><strong>{t('erp:SuperAdminApprovalDashboard.t_46dfd8e0')}</strong> <ErpSafeText value={selectedRequest.quantity} />{t('erp:SuperAdminApprovalDashboard.t_11600c9a')}</div>
                <div><strong>{t('erp:SuperAdminApprovalDashboard.t_e2749f0f')}</strong> <ErpSafeText value={formatApprovalCurrency(selectedRequest.totalAmount)} /></div>
                <div><strong>{t('erp:SuperAdminApprovalDashboard.t_17102fe2')}</strong> <ErpSafeText value={selectedRequest.requester?.name} /></div>
              </div>
            </div>

            <div className="mg-v2-form-group">
              <label className="super-admin-form-label">
                {t('erp:SuperAdminApprovalDashboard.t_47579c2e')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('erp:SuperAdminApprovalDashboard.t_252e7f72')}
                rows="3"
                className="super-admin-textarea"
              />
            </div>

            <div className="super-admin-text-right">
              <MGButton
                variant={mapErpVariantToMg('secondary')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({
                  variant: 'secondary',
                  loading: false,
                  className: 'super-admin-button-spacing'
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                onClick={() => setShowApprovalModal(false)}
              >
                {t('common.actions.cancel')}
              </MGButton>
              <MGButton
                variant={mapErpVariantToMg('success')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({ variant: 'success', loading: processing })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                onClick={submitApproval}
                loading={processing}
              >
                {t('erp:SuperAdminApprovalDashboard.t_c1dd57c6')}
              </MGButton>
            </div>
          </div>
        )}
      </UnifiedModal>

      <UnifiedModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title={t('erp:SuperAdminApprovalDashboard.t_4c549b61')}
        size="auto"
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        {selectedRequest && (
          <div aria-busy={processing}>
            <div className="mg-v2-form-group">
              <h4>{t('erp:SuperAdminApprovalDashboard.t_82938fa2')}</h4>
              <div className="super-admin-info-box">
                <div><strong>{t('erp:SuperAdminApprovalDashboard.t_f2e00fdf')}</strong> <ErpSafeText value={selectedRequest.item?.name} /></div>
                <div><strong>{t('erp:SuperAdminApprovalDashboard.t_46dfd8e0')}</strong> <ErpSafeText value={selectedRequest.quantity} />{t('erp:SuperAdminApprovalDashboard.t_11600c9a')}</div>
                <div><strong>{t('erp:SuperAdminApprovalDashboard.t_e2749f0f')}</strong> <ErpSafeText value={formatApprovalCurrency(selectedRequest.totalAmount)} /></div>
                <div><strong>{t('erp:SuperAdminApprovalDashboard.t_17102fe2')}</strong> <ErpSafeText value={selectedRequest.requester?.name} /></div>
              </div>
            </div>

            <div className="mg-v2-form-group">
              <label className="super-admin-form-label">
                {t('erp:SuperAdminApprovalDashboard.t_f1908d6e')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('erp:SuperAdminApprovalDashboard.t_b5091061')}
                rows="3"
                required
                className="super-admin-textarea"
              />
            </div>

            <div className="super-admin-text-right">
              <MGButton
                variant={mapErpVariantToMg('secondary')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({
                  variant: 'secondary',
                  loading: false,
                  className: 'super-admin-button-spacing'
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                onClick={() => setShowRejectionModal(false)}
              >
                {t('common.actions.cancel')}
              </MGButton>
              <MGButton
                variant={mapErpVariantToMg('danger')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({ variant: 'danger', loading: processing })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                onClick={submitRejection}
                loading={processing}
                disabled={!comment.trim()}
              >
                {t('erp:SuperAdminApprovalDashboard.t_9aa55896')}
              </MGButton>
            </div>
          </div>
        )}
      </UnifiedModal>
    </ApprovalHubLayout>
  );
};

export default SuperAdminApprovalDashboard;
