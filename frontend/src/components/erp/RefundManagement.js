import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleLayout from '../layout/SimpleLayout';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import LoadingSpinner from '../common/LoadingSpinner';
import ErpHeader from './common/ErpHeader';
import { FaArrowLeft, FaSync, FaDownload, FaFilter } from 'react-icons/fa';

/**
 * ERP 환불 관리 컴포넌트
 */
const RefundManagement = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [refundStats, setRefundStats] = useState({});
    const [refundHistory, setRefundHistory] = useState([]);
    const [erpSyncStatus, setErpSyncStatus] = useState({});
    const [currentPage, setCurrentPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({});
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedStatus, setSelectedStatus] = useState('all');

    useEffect(() => {
        loadRefundData();
    }, [currentPage, selectedPeriod, selectedStatus]);

    const loadRefundData = useCallback(async () => {
        try {
            setLoading(true);
            
            // 병렬로 데이터 로드
            const [statsRes, historyRes, syncRes] = await Promise.all([
                fetch(`/api/admin/refund-statistics?period=${selectedPeriod}`),
                fetch(`/api/admin/refund-history?page=${currentPage}&size=10&period=${selectedPeriod}&status=${selectedStatus}`),
                fetch('/api/admin/erp-sync-status')
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setRefundStats(statsData.data);
                }
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                if (historyData.success) {
                    setRefundHistory(historyData.data.refundHistory || []);
                    setPageInfo(historyData.data.pageInfo || {});
                }
            }

            if (syncRes.ok) {
                const syncData = await syncRes.json();
                if (syncData.success) {
                    setErpSyncStatus(syncData.data);
                }
            }

        } catch (error) {
            console.error('환불 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedPeriod, selectedStatus]);

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setCurrentPage(0);
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setCurrentPage(0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR').format(amount || 0) + '원';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };

    return (
        <SimpleLayout>
            <div className="erp-system">
                <ErpHeader 
                    title="환불 관리 시스템"
                    subtitle="상담 환불 현황 및 ERP 연동 관리"
                />

                {/* 뒤로가기 버튼 */}
                <div style={{ marginBottom: '20px' }}>
                    <ErpButton
                        variant="secondary"
                        onClick={() => navigate('/erp')}
                        icon={<FaArrowLeft />}
                    >
                        ERP 대시보드로 돌아가기
                    </ErpButton>
                </div>

                {loading && <LoadingSpinner />}

                {/* 환불 통계 카드 */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    <ErpCard title="환불 건수">
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>
                            {refundStats.summary?.totalRefundCount || 0}건
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            {selectedPeriod === 'today' ? '오늘' : 
                             selectedPeriod === 'week' ? '최근 7일' :
                             selectedPeriod === 'month' ? '최근 1개월' : 
                             selectedPeriod === 'quarter' ? '최근 3개월' : '최근 1년'} 환불 처리
                        </div>
                    </ErpCard>

                    <ErpCard title="환불 금액">
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>
                            {formatCurrency(refundStats.summary?.totalRefundAmount)}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            평균: {formatCurrency(refundStats.summary?.averageRefundPerCase)}
                        </div>
                    </ErpCard>

                    <ErpCard title="환불 회기">
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fd7e14' }}>
                            {refundStats.summary?.totalRefundedSessions || 0}회
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            총 환불된 상담 회기
                        </div>
                    </ErpCard>

                    <ErpCard title="ERP 연동 상태">
                        <div style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: 'bold', 
                            color: erpSyncStatus.erpSystemAvailable ? '#28a745' : '#dc3545'
                        }}>
                            {erpSyncStatus.erpSystemAvailable ? '정상' : '오류'}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            성공률: {erpSyncStatus.erpSuccessRate || 0}%
                        </div>
                    </ErpCard>
                </div>

                {/* 필터 및 제어 */}
                <ErpCard title="필터 및 제어">
                    <div style={{ 
                        display: 'flex', 
                        gap: '15px', 
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <div>
                            <label style={{ marginRight: '8px', fontWeight: '600' }}>기간:</label>
                            <select 
                                value={selectedPeriod} 
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '2px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="today">오늘</option>
                                <option value="week">최근 7일</option>
                                <option value="month">최근 1개월</option>
                                <option value="quarter">최근 3개월</option>
                                <option value="year">최근 1년</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ marginRight: '8px', fontWeight: '600' }}>상태:</label>
                            <select 
                                value={selectedStatus} 
                                onChange={(e) => handleStatusChange(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '2px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="all">전체</option>
                                <option value="completed">완료</option>
                                <option value="pending">대기</option>
                                <option value="failed">실패</option>
                            </select>
                        </div>

                        <ErpButton
                            variant="info"
                            onClick={loadRefundData}
                            icon={<FaSync />}
                        >
                            새로고침
                        </ErpButton>

                        <ErpButton
                            variant="success"
                            onClick={() => {
                                // 엑셀 다운로드 기능 (추후 구현)
                                alert('엑셀 다운로드 기능은 추후 구현 예정입니다.');
                            }}
                            icon={<FaDownload />}
                        >
                            엑셀 다운로드
                        </ErpButton>
                    </div>
                </ErpCard>

                {/* 환불 이력 테이블 */}
                <ErpCard title="환불 이력">
                    {refundHistory.length > 0 ? (
                        <>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '14px'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: '600' }}>환불일시</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: '600' }}>내담자</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: '600' }}>상담사</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: '600' }}>패키지</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: '600' }}>환불 회기</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: '600' }}>환불 금액</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: '600' }}>환불 사유</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: '600' }}>ERP 상태</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {refundHistory.map((refund, index) => (
                                            <tr key={refund.mappingId} style={{ 
                                                backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' 
                                            }}>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {refund.terminatedAt}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {refund.clientName}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {refund.consultantName}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {refund.packageName}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                    {refund.refundedSessions}회
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                                                    {formatCurrency(refund.refundAmount)}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {refund.standardizedReason}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        backgroundColor: refund.erpStatus === 'SENT' ? '#28a745' : '#dc3545',
                                                        color: 'white'
                                                    }}>
                                                        {refund.erpStatus === 'SENT' ? '전송완료' : '전송실패'}
                                                    </span>
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
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                    >
                                        이전
                                    </ErpButton>
                                    
                                    <span style={{ fontSize: '14px', color: '#666' }}>
                                        {currentPage + 1} / {pageInfo.totalPages} 페이지
                                    </span>
                                    
                                    <ErpButton
                                        variant="secondary"
                                        disabled={!pageInfo.hasNext}
                                        onClick={() => setCurrentPage(currentPage + 1)}
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
                            fontSize: '16px'
                        }}>
                            선택한 기간에 환불 이력이 없습니다.
                        </div>
                    )}
                </ErpCard>

                {/* 환불 사유별 통계 */}
                <ErpCard title="환불 사유별 통계">
                    {refundStats.refundReasonStats && Object.keys(refundStats.refundReasonStats).length > 0 ? (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: '15px'
                        }}>
                            {Object.entries(refundStats.refundReasonStats || {}).map(([reason, count]) => (
                                <div key={reason} style={{
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                                        {reason}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                                        {count}건
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                            환불 사유별 통계가 없습니다.
                        </div>
                    )}
                </ErpCard>

                {/* ERP 동기화 상태 */}
                <ErpCard title="ERP 동기화 상태">
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '15px'
                    }}>
                        <div style={{
                            padding: '15px',
                            backgroundColor: erpSyncStatus.erpSystemAvailable ? '#d4edda' : '#f8d7da',
                            borderRadius: '8px',
                            border: `1px solid ${erpSyncStatus.erpSystemAvailable ? '#c3e6cb' : '#f5c6cb'}`
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                                ERP 시스템 상태
                            </div>
                            <div style={{ 
                                fontSize: '1.2rem', 
                                fontWeight: 'bold', 
                                color: erpSyncStatus.erpSystemAvailable ? '#155724' : '#721c24'
                            }}>
                                {erpSyncStatus.erpSystemAvailable ? '정상 연결' : '연결 오류'}
                            </div>
                        </div>

                        <div style={{
                            padding: '15px',
                            backgroundColor: '#d1ecf1',
                            borderRadius: '8px',
                            border: '1px solid #bee5eb'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                                전송 성공률
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0c5460' }}>
                                {erpSyncStatus.erpSuccessRate || 0}%
                            </div>
                        </div>

                        <div style={{
                            padding: '15px',
                            backgroundColor: '#fff3cd',
                            borderRadius: '8px',
                            border: '1px solid #ffeaa7'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                                대기 중
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#856404' }}>
                                {erpSyncStatus.pendingErpRequests || 0}건
                            </div>
                        </div>

                        <div style={{
                            padding: '15px',
                            backgroundColor: '#f8d7da',
                            borderRadius: '8px',
                            border: '1px solid #f5c6cb'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                                실패
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#721c24' }}>
                                {erpSyncStatus.failedErpRequests || 0}건
                            </div>
                        </div>
                    </div>

                    <div style={{ 
                        marginTop: '15px',
                        padding: '10px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#6c757d'
                    }}>
                        마지막 동기화: {erpSyncStatus.lastSyncTime || '정보 없음'}
                    </div>
                </ErpCard>

                {/* 회계 처리 현황 */}
                <ErpCard title="회계 처리 현황">
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '15px'
                    }}>
                        <div style={{
                            padding: '15px',
                            backgroundColor: '#d4edda',
                            borderRadius: '8px',
                            border: '1px solid #c3e6cb'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                                오늘 처리
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#155724' }}>
                                {erpSyncStatus.accountingStatus?.processedToday || 0}건
                            </div>
                        </div>

                        <div style={{
                            padding: '15px',
                            backgroundColor: '#fff3cd',
                            borderRadius: '8px',
                            border: '1px solid #ffeaa7'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                                승인 대기
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#856404' }}>
                                {erpSyncStatus.accountingStatus?.pendingApproval || 0}건
                            </div>
                        </div>

                        <div style={{
                            padding: '15px',
                            backgroundColor: '#e2e3e5',
                            borderRadius: '8px',
                            border: '1px solid #d6d8db'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                                총 환불 금액
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#383d41' }}>
                                {formatCurrency(erpSyncStatus.accountingStatus?.totalRefundAmount)}
                            </div>
                        </div>
                    </div>
                </ErpCard>
            </div>
        </SimpleLayout>
    );
};

export default RefundManagement;
