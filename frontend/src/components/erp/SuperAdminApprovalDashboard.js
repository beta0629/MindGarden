import { useState, useEffect } from 'react';
import CardContainer from '../common/CardContainer';
import MGButton from '../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT,
  mapErpSizeToMg,
  mapErpVariantToMg
} from './common/erpMgButtonProps';
import { ErpSafeText } from './common';
import UnifiedModal from '../common/modals/UnifiedModal';
import { useSession } from '../../hooks/useSession';
import './ApprovalDashboard.css';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import { toDisplayString } from '../../utils/safeDisplay';
import ApprovalHubLayout from './approval/ApprovalHubLayout';
import { formatApprovalCurrency, formatApprovalDate } from './approval/approvalFormatters';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API } from '../../constants/api';

/**
 * 수퍼 관리자 승인 대시보드 컴포넌트
 */
const SuperAdminApprovalDashboard = () => {
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      const list = await StandardizedApi.get(ERP_API.PURCHASE_REQUESTS_PENDING_SUPER_ADMIN);
      if (Array.isArray(list)) {
        setRequests(list);
      } else {
        setRequests([]);
        setError('승인 대기 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('승인 대기 목록 로드 실패:', err);
      setError(err?.message || '승인 대기 목록을 불러오는데 실패했습니다.');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
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
      refreshing={refreshing}
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
            <h3 id="approval-super-empty-title" className="mg-h4">승인 대기 목록</h3>
            <div className="mg-v2-card-body">
              <div className="approval-dashboard-empty">
                수퍼 관리자 승인 대기 중인 구매 요청이 없습니다.
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
                      <div><strong>요청자:</strong> <ErpSafeText value={request.requester?.name} fallback="알 수 없음" /></div>
                      <div><strong>요청일:</strong> <ErpSafeText value={formatApprovalDate(request.createdAt)} /></div>
                      <div><strong>아이템:</strong> <ErpSafeText value={request.item?.name} fallback="알 수 없음" /></div>
                      <div><strong>수량:</strong> <ErpSafeText value={request.quantity} />개</div>
                      <div><strong>단가:</strong> <ErpSafeText value={formatApprovalCurrency(request.unitPrice)} /></div>
                      <div><strong>총액:</strong> <ErpSafeText value={formatApprovalCurrency(request.totalAmount)} /></div>
                    </div>

                    {request.adminApprover && (
                      <div className="approval-admin-info">
                        <div className="approval-admin-status">
                          관리자 승인 완료
                        </div>
                        <div className="mg-v2-text-sm">
                          <div><strong>승인자:</strong> <ErpSafeText value={request.adminApprover?.name} fallback="알 수 없음" /></div>
                          <div><strong>승인일:</strong> <ErpSafeText value={formatApprovalDate(request.adminApprovedAt)} /></div>
                          {request.adminComment && (
                            <div><strong>코멘트:</strong> <ErpSafeText value={request.adminComment} /></div>
                          )}
                        </div>
                      </div>
                    )}

                    {request.reason && (
                      <div className="super-admin-form-group">
                        <strong>요청 사유:</strong>
                        <div className="super-admin-reason-box">
                          <ErpSafeText value={request.reason} />
                        </div>
                      </div>
                    )}

                    <div className="super-admin-actions-container">
                      <MGButton
                        variant={mapErpVariantToMg('success')}
                        size={mapErpSizeToMg('small')}
                        className={buildErpMgButtonClassName({ variant: 'success', size: 'small', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => handleApprove(request)}
                      >
                        최종 승인
                      </MGButton>
                      <MGButton
                        variant={mapErpVariantToMg('danger')}
                        size={mapErpSizeToMg('small')}
                        className={buildErpMgButtonClassName({ variant: 'danger', size: 'small', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => handleReject(request)}
                      >
                        거부
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
        title="구매 요청 최종 승인"
        size="auto"
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        {selectedRequest && (
          <div>
            <div className="mg-v2-form-group">
              <h4>최종 승인할 구매 요청</h4>
              <div className="super-admin-info-box">
                <div><strong>아이템:</strong> <ErpSafeText value={selectedRequest.item?.name} /></div>
                <div><strong>수량:</strong> <ErpSafeText value={selectedRequest.quantity} />개</div>
                <div><strong>총액:</strong> <ErpSafeText value={formatApprovalCurrency(selectedRequest.totalAmount)} /></div>
                <div><strong>요청자:</strong> <ErpSafeText value={selectedRequest.requester?.name} /></div>
              </div>
            </div>

            <div className="mg-v2-form-group">
              <label className="super-admin-form-label">
                최종 승인 코멘트 (선택사항)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="최종 승인 사유나 추가 코멘트를 입력하세요..."
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
                취소
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
                최종 승인하기
              </MGButton>
            </div>
          </div>
        )}
      </UnifiedModal>

      <UnifiedModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="구매 요청 거부"
        size="auto"
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        {selectedRequest && (
          <div>
            <div className="mg-v2-form-group">
              <h4>거부할 구매 요청</h4>
              <div className="super-admin-info-box">
                <div><strong>아이템:</strong> <ErpSafeText value={selectedRequest.item?.name} /></div>
                <div><strong>수량:</strong> <ErpSafeText value={selectedRequest.quantity} />개</div>
                <div><strong>총액:</strong> <ErpSafeText value={formatApprovalCurrency(selectedRequest.totalAmount)} /></div>
                <div><strong>요청자:</strong> <ErpSafeText value={selectedRequest.requester?.name} /></div>
              </div>
            </div>

            <div className="mg-v2-form-group">
              <label className="super-admin-form-label">
                거부 사유 *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="거부 사유를 입력하세요..."
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
                취소
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
                거부하기
              </MGButton>
            </div>
          </div>
        )}
      </UnifiedModal>
    </ApprovalHubLayout>
  );
};

export default SuperAdminApprovalDashboard;
