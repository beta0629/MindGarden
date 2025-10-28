import React from 'react';
import ErpCard from '../common/ErpCard';
import ErpButton from '../common/ErpButton';

/**
 * 환불 이력 테이블 컴포넌트
 */
const RefundHistoryTable = ({ refundHistory, pageInfo, onPageChange }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR').format(amount || 0) + '원';
    };

    const getErpStatusBadge = (status) => {
        const statusConfig = {
            'SENT': { text: '전송완료', color: '#28a745' },
            'PENDING': { text: '전송대기', color: '#ffc107' },
            'FAILED': { text: '전송실패', color: '#dc3545' },
            'CONFIRMED': { text: '확인완료', color: '#6f42c1' }
        };

        const config = statusConfig[status] || { text: '알수없음', color: '#6c757d' };

        return (
            <span className="refund-history-table-status">
                {config.text}
            </span>
        );
    };

    return (
        <ErpCard title="환불 이력">
            {refundHistory.length > 0 ? (
                <>
                    <div className="mg-v2-table-container">
                        <table className="mg-v2-table">
                            <thead>
                                <tr>
                                    <th>환불일시</th>
                                    <th>내담자</th>
                                    <th>상담사</th>
                                    <th>패키지</th>
                                    <th>환불 회기</th>
                                    <th>환불 금액</th>
                                    <th>환불 사유</th>
                                    <th>ERP 상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refundHistory.map((refund, index) => (
                                    <tr key={`${refund.mappingId}-${refund.terminatedAt}-${index}`} className={index % 2 === 0 ? 'mg-v2-table-row' : 'mg-v2-table-row-alt'}>
                                        <td>
                                            {refund.terminatedAt}
                                        </td>
                                        <td>
                                            {refund.clientName}
                                        </td>
                                        <td>
                                            {refund.consultantName}
                                        </td>
                                        <td>
                                            {refund.packageName}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {refund.refundedSessions}회
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                                            {formatCurrency(refund.refundAmount)}
                                        </td>
                                        <td>
                                            {refund.standardizedReason}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {getErpStatusBadge(refund.erpStatus)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이징 */}
                    {pageInfo.totalPages > 1 && (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            gap: '10px',
                            marginTop: '20px'
                        }}>
                            <ErpButton
                                variant="secondary"
                                disabled={!pageInfo.hasPrevious}
                                onClick={() => onPageChange(pageInfo.currentPage - 1)}
                            >
                                이전
                            </ErpButton>
                            
                            <span style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>
                                {pageInfo.currentPage + 1} / {pageInfo.totalPages} 페이지
                            </span>
                            
                            <ErpButton
                                variant="secondary"
                                disabled={!pageInfo.hasNext}
                                onClick={() => onPageChange(pageInfo.currentPage + 1)}
                            >
                                다음
                            </ErpButton>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: '#666',
                    fontSize: 'var(--font-size-base)'
                }}>
                    선택한 기간에 환불 이력이 없습니다.
                </div>
            )}
        </ErpCard>
    );
};

export default RefundHistoryTable;
