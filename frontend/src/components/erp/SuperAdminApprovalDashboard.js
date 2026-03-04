import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../dashboard-v2/content';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import ErpModal from './common/ErpModal';
import { useSession } from '../../hooks/useSession';
import './ApprovalDashboard.css';

/**
 * 수퍼 관리자 승인 대시보드 컴포넌트
 */
const SuperAdminApprovalDashboard = () => {
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

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/erp/purchase-requests/pending-super-admin');
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data || []);
      } else {
        setError('승인 대기 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('승인 대기 목록 로드 실패:', error);
      setError('승인 대기 목록을 불러오는데 실패했습니다.');
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

  const submitApproval = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      setError('');

      // 현재 수퍼 관리자 ID (세션에서 가져옴)
      const superAdminId = user?.id;
      
      if (!superAdminId) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const response = await fetch(`/api/v1/erp/purchase-requests/${selectedRequest.id}/approve-super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          superAdminId: superAdminId.toString(),
          comment: comment
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowApprovalModal(false);
        loadPendingRequests();
      } else {
        setError(data.message || '승인 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('승인 처리 실패:', error);
      setError('승인 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      setError('');

      // 현재 수퍼 관리자 ID (세션에서 가져옴)
      const superAdminId = user?.id;
      
      if (!superAdminId) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const response = await fetch(`/api/v1/erp/purchase-requests/${selectedRequest.id}/reject-super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          superAdminId: superAdminId.toString(),
          comment: comment
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowRejectionModal(false);
        loadPendingRequests();
      } else {
        setError(data.message || '거부 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('거부 처리 실패:', error);
      setError('거부 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminCommonLayout title="슈퍼 승인">
        <UnifiedLoading type="page" text="수퍼 관리자 승인 대기 요청을 불러오는 중..." />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="슈퍼 승인">
      <ContentHeader
        title="수퍼 관리자 승인 대시보드"
        subtitle="관리자 승인된 구매 요청의 최종 승인"
        actions={
          <ErpButton
            variant="primary"
            onClick={loadPendingRequests}
          >
            <RefreshCw size={16} aria-hidden />
            새로고침
          </ErpButton>
        }
      />
      <ContentArea className="approval-dashboard-container">
        {error && (
          <div className="approval-dashboard-error">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
        <ErpCard title="승인 대기 목록">
          <div className="approval-dashboard-empty">
            수퍼 관리자 승인 대기 중인 구매 요청이 없습니다.
          </div>
        </ErpCard>
      ) : (
        <div className="approval-dashboard-grid">
          {requests.map(request => (
            <ErpCard key={request.id} title={`구매 요청 #${request.id}`}>
              <div className="approval-request-info">
                <div className="approval-request-grid">
                  <div><strong>요청자:</strong> {request.requester?.name || '알 수 없음'}</div>
                  <div><strong>요청일:</strong> {formatDate(request.createdAt)}</div>
                  <div><strong>아이템:</strong> {request.item?.name || '알 수 없음'}</div>
                  <div><strong>수량:</strong> {request.quantity}개</div>
                  <div><strong>단가:</strong> {formatCurrency(request.unitPrice)}</div>
                  <div><strong>총액:</strong> {formatCurrency(request.totalAmount)}</div>
                </div>

                {/* 관리자 승인 정보 */}
                {request.adminApprover && (
                  <div className="approval-admin-info">
                    <div className="approval-admin-status">
                      관리자 승인 완료
                    </div>
                    <div className="mg-v2-text-sm">
                      <div><strong>승인자:</strong> {request.adminApprover.name}</div>
                      <div><strong>승인일:</strong> {formatDate(request.adminApprovedAt)}</div>
                      {request.adminComment && (
                        <div><strong>코멘트:</strong> {request.adminComment}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {request.reason && (
                  <div className="super-admin-form-group">
                    <strong>요청 사유:</strong>
                    <div className="super-admin-reason-box">
                      {request.reason}
                    </div>
                  </div>
                )}

                <div className="super-admin-actions-container">
                  <ErpButton
                    variant="success"
                    size="small"
                    onClick={() => handleApprove(request)}
                  >
                    최종 승인
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

      {/* 승인 모달 */}
      <ErpModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="구매 요청 최종 승인"
        size="medium"
      >
        {selectedRequest && (
          <div>
            <div className="mg-v2-form-group">
              <h4>최종 승인할 구매 요청</h4>
              <div className="super-admin-info-box">
                <div><strong>아이템:</strong> {selectedRequest.item?.name}</div>
                <div><strong>수량:</strong> {selectedRequest.quantity}개</div>
                <div><strong>총액:</strong> {formatCurrency(selectedRequest.totalAmount)}</div>
                <div><strong>요청자:</strong> {selectedRequest.requester?.name}</div>
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
              <ErpButton
                variant="secondary"
                onClick={() => setShowApprovalModal(false)}
                className="super-admin-button-spacing"
              >
                취소
              </ErpButton>
              <ErpButton
                variant="success"
                onClick={submitApproval}
                loading={processing}
              >
                최종 승인하기
              </ErpButton>
            </div>
          </div>
        )}
      </ErpModal>

      {/* 거부 모달 */}
      <ErpModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="구매 요청 거부"
        size="medium"
      >
        {selectedRequest && (
          <div>
            <div className="mg-v2-form-group">
              <h4>거부할 구매 요청</h4>
              <div className="super-admin-info-box">
                <div><strong>아이템:</strong> {selectedRequest.item?.name}</div>
                <div><strong>수량:</strong> {selectedRequest.quantity}개</div>
                <div><strong>총액:</strong> {formatCurrency(selectedRequest.totalAmount)}</div>
                <div><strong>요청자:</strong> {selectedRequest.requester?.name}</div>
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
              <ErpButton
                variant="secondary"
                onClick={() => setShowRejectionModal(false)}
                className="super-admin-button-spacing"
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
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default SuperAdminApprovalDashboard;
