import { useState, useEffect } from 'react';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import ErpModal from './common/ErpModal';
import { useSession } from '../../hooks/useSession';
import './ApprovalDashboard.css';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import ApprovalHubLayout from './approval/ApprovalHubLayout';
import { formatApprovalCurrency, formatApprovalDate } from './approval/approvalFormatters';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API } from '../../constants/api';

/**
 * 관리자 승인 대시보드 컴포넌트
 */
const AdminApprovalDashboard = () => {
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
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

  const loadPendingRequests = async() => {
    try {
      setLoading(true);
      setError('');
      const list = await StandardizedApi.get(ERP_API.PURCHASE_REQUESTS_PENDING_ADMIN);
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
      setLoading(false);
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
        loadPendingRequests();
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
        loadPendingRequests();
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
      layoutTitle="승인 관리"
      headerTitle="관리자 승인 대시보드"
      headerSubtitle="구매 요청 승인 및 거부"
      loading={loading}
      loadingText="승인 대기 요청을 불러오는 중..."
      onRefresh={loadPendingRequests}
      activeMode="admin"
    >
      {error && (
        <div className="approval-dashboard-error">
          <SafeErrorDisplay error={error} variant="inline" />
        </div>
      )}

      {requests.length === 0 ? (
        <ErpCard title="승인 대기 목록">
          <div className="approval-dashboard-empty">
            승인 대기 중인 구매 요청이 없습니다.
          </div>
        </ErpCard>
      ) : (
        <div className="approval-dashboard-grid">
          {requests.map(request => (
            <ErpCard key={request.id} title={toDisplayString(`구매 요청 #${request.id}`)}>
              <div className="approval-request-info">
                <div className="approval-request-grid">
                  <div><strong>요청자:</strong> <SafeText fallback="알 수 없음">{request.requester?.name}</SafeText></div>
                  <div><strong>요청일:</strong> {toDisplayString(formatApprovalDate(request.createdAt))}</div>
                  <div><strong>아이템:</strong> <SafeText fallback="알 수 없음">{request.item?.name}</SafeText></div>
                  <div><strong>수량:</strong> {toDisplayString(request.quantity)}개</div>
                  <div><strong>단가:</strong> {formatApprovalCurrency(request.unitPrice)}</div>
                  <div><strong>총액:</strong> {formatApprovalCurrency(request.totalAmount)}</div>
                </div>

                {request.reason && (
                  <div className="approval-request-reason">
                    <strong>사유:</strong>
                    <div className="approval-request-reason-text">
                      <SafeText>{request.reason}</SafeText>
                    </div>
                  </div>
                )}

                <div className="approval-request-actions">
                  <ErpButton
                    variant="success"
                    size="small"
                    onClick={() => handleApprove(request)}
                  >
                    승인
                  </ErpButton>
                  <ErpButton
                    variant="danger"
                    size="small"
                    onClick={() => handleReject(request)}
                  >
                    거부
                  </ErpButton>
                </div>
              </div>
            </ErpCard>
          ))}
        </div>
      )}

      <ErpModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="구매 요청 승인"
        size="auto"
      >
        {selectedRequest && (
          <div>
            <div className="approval-request-details">
              <h4>승인할 구매 요청</h4>
              <div className="approval-request-info-box">
                <div><strong>아이템:</strong> <SafeText>{selectedRequest.item?.name}</SafeText></div>
                <div><strong>수량:</strong> {toDisplayString(selectedRequest.quantity)}개</div>
                <div><strong>총액:</strong> {formatApprovalCurrency(selectedRequest.totalAmount)}</div>
              </div>
            </div>

            <div className="approval-request-comment-group">
              <label className="approval-request-comment-label">
                승인 코멘트 (선택사항)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="승인 사유나 추가 코멘트를 입력하세요..."
                rows="3"
                className="approval-request-comment-textarea"
              />
            </div>

            <div className="approval-request-actions">
              <ErpButton
                variant="secondary"
                onClick={() => setShowApprovalModal(false)}
                className="approval-request-approve-btn"
              >
                취소
              </ErpButton>
              <ErpButton
                variant="success"
                onClick={submitApproval}
                loading={processing}
              >
                승인하기
              </ErpButton>
            </div>
          </div>
        )}
      </ErpModal>

      <ErpModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="구매 요청 거부"
        size="auto"
      >
        {selectedRequest && (
          <div>
            <div className="approval-request-comment-group">
              <h4>거부할 구매 요청</h4>
              <div className="approval-request-info-box">
                <div><strong>아이템:</strong> <SafeText>{selectedRequest.item?.name}</SafeText></div>
                <div><strong>수량:</strong> {toDisplayString(selectedRequest.quantity)}개</div>
                <div><strong>총액:</strong> {formatApprovalCurrency(selectedRequest.totalAmount)}</div>
              </div>
            </div>

            <div className="approval-request-comment-group">
              <label className="approval-request-comment-label">
                거부 사유 *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="거부 사유를 입력하세요..."
                rows="3"
                required
                className="approval-request-comment-textarea"
              />
            </div>

            <div className="approval-request-actions">
              <ErpButton
                variant="secondary"
                onClick={() => setShowRejectionModal(false)}
                className="approval-request-approve-btn"
              >
                취소
              </ErpButton>
              <ErpButton
                variant="danger"
                onClick={submitRejection}
                loading={processing}
                disabled={!comment.trim()}
              >
                거부하기
              </ErpButton>
            </div>
          </div>
        )}
      </ErpModal>
    </ApprovalHubLayout>
  );
};

export default AdminApprovalDashboard;
