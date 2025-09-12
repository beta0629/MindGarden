import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import LoadingSpinner from '../common/LoadingSpinner';
import ErpHeader from './common/ErpHeader';
import ErpModal from './common/ErpModal';

/**
 * 관리자 승인 대시보드 컴포넌트
 */
const AdminApprovalDashboard = () => {
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
      const response = await fetch('/api/erp/purchase-requests/pending-admin');
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

      // 현재 관리자 ID (실제로는 인증 시스템에서 가져와야 함)
      const adminId = 1; // TODO: 실제 관리자 ID로 변경

      const response = await fetch(`/api/erp/purchase-requests/${selectedRequest.id}/approve-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          adminId: adminId.toString(),
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

      // 현재 관리자 ID (실제로는 인증 시스템에서 가져와야 함)
      const adminId = 1; // TODO: 실제 관리자 ID로 변경

      const response = await fetch(`/api/erp/purchase-requests/${selectedRequest.id}/reject-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          adminId: adminId.toString(),
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
    return <LoadingSpinner text="승인 대기 목록을 불러오는 중..." size="medium" />;
  }

  return (
    <SimpleLayout>
      <div style={{ padding: '24px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <ErpHeader
          title="관리자 승인 대시보드"
          subtitle="구매 요청 승인 및 거부"
          actions={
            <ErpButton
              variant="primary"
              onClick={loadPendingRequests}
            >
              새로고침
            </ErpButton>
          }
        />

      {error && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <ErpCard title="승인 대기 목록">
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            fontSize: '16px'
          }}>
            승인 대기 중인 구매 요청이 없습니다.
          </div>
        </ErpCard>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
          gap: '20px' 
        }}>
          {requests.map(request => (
            <ErpCard key={request.id} title={`구매 요청 #${request.id}`}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div><strong>요청자:</strong> {request.requester?.name || '알 수 없음'}</div>
                  <div><strong>요청일:</strong> {formatDate(request.createdAt)}</div>
                  <div><strong>아이템:</strong> {request.item?.name || '알 수 없음'}</div>
                  <div><strong>수량:</strong> {request.quantity}개</div>
                  <div><strong>단가:</strong> {formatCurrency(request.unitPrice)}</div>
                  <div><strong>총액:</strong> {formatCurrency(request.totalAmount)}</div>
                </div>
                
                {request.reason && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>사유:</strong>
                    <div style={{ 
                      marginTop: '4px', 
                      padding: '8px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {request.reason}
                    </div>
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  justifyContent: 'flex-end',
                  marginTop: '16px'
                }}>
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

      {/* 승인 모달 */}
      <ErpModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="구매 요청 승인"
        size="medium"
      >
        {selectedRequest && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4>승인할 구매 요청</h4>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                <div><strong>아이템:</strong> {selectedRequest.item?.name}</div>
                <div><strong>수량:</strong> {selectedRequest.quantity}개</div>
                <div><strong>총액:</strong> {formatCurrency(selectedRequest.totalAmount)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600' 
              }}>
                승인 코멘트 (선택사항)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="승인 사유나 추가 코멘트를 입력하세요..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <ErpButton
                variant="secondary"
                onClick={() => setShowApprovalModal(false)}
                style={{ marginRight: '8px' }}
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

      {/* 거부 모달 */}
      <ErpModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="구매 요청 거부"
        size="medium"
      >
        {selectedRequest && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4>거부할 구매 요청</h4>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                <div><strong>아이템:</strong> {selectedRequest.item?.name}</div>
                <div><strong>수량:</strong> {selectedRequest.quantity}개</div>
                <div><strong>총액:</strong> {formatCurrency(selectedRequest.totalAmount)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600' 
              }}>
                거부 사유 *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="거부 사유를 입력하세요..."
                rows="3"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <ErpButton
                variant="secondary"
                onClick={() => setShowRejectionModal(false)}
                style={{ marginRight: '8px' }}
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
      </div>
    </SimpleLayout>
  );
};

export default AdminApprovalDashboard;
