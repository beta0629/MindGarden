import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleLayout from '../layout/SimpleLayout';
import ErpButton from './common/ErpButton';
import LoadingSpinner from '../common/LoadingSpinner';
import ErpHeader from './common/ErpHeader';
import RefundStatsCards from './refund/RefundStatsCards';
import RefundFilters from './refund/RefundFilters';
import RefundHistoryTable from './refund/RefundHistoryTable';
import RefundReasonStats from './refund/RefundReasonStats';
import ErpSyncStatus from './refund/ErpSyncStatus';
import RefundAccountingStatus from './refund/RefundAccountingStatus';
import { FaArrowLeft } from 'react-icons/fa';

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

    const handleExportExcel = () => {
        // 엑셀 다운로드 기능 (추후 구현)
        alert('엑셀 다운로드 기능은 추후 구현 예정입니다.');
    };

    return (
        <SimpleLayout 
            loading={loading}
            loadingText="환불 데이터를 불러오는 중..."
            loadingVariant="pulse"
        >
            <div className="erp-system" style={{ 
                padding: '20px',
                paddingLeft: '40px',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                <ErpHeader 
                    title="환불 관리 시스템"
                    subtitle="상담 환불 현황 및 ERP 연동 관리"
                />

                {/* 뒤로가기 버튼 */}
                <div style={{ marginBottom: '20px' }}>
                    <ErpButton
                        variant="secondary"
                        onClick={() => navigate('/erp/dashboard')}
                        icon={<FaArrowLeft />}
                    >
                        ERP 대시보드로 돌아가기
                    </ErpButton>
                </div>

                {/* 환불 통계 카드 */}
                <RefundStatsCards 
                    refundStats={refundStats}
                    selectedPeriod={selectedPeriod}
                    erpSyncStatus={erpSyncStatus}
                />

                {/* 필터 및 제어 */}
                <RefundFilters
                    selectedPeriod={selectedPeriod}
                    selectedStatus={selectedStatus}
                    onPeriodChange={handlePeriodChange}
                    onStatusChange={handleStatusChange}
                    onRefresh={loadRefundData}
                    onExportExcel={handleExportExcel}
                />

                {/* 환불 이력 테이블 */}
                <RefundHistoryTable
                    refundHistory={refundHistory}
                    pageInfo={pageInfo}
                    onPageChange={setCurrentPage}
                />

                {/* 환불 사유별 통계 */}
                <RefundReasonStats 
                    refundReasonStats={refundStats.refundReasonStats}
                />

                {/* ERP 동기화 상태 */}
                <ErpSyncStatus 
                    erpSyncStatus={erpSyncStatus}
                />

                {/* 회계 처리 현황 */}
                <RefundAccountingStatus 
                    erpSyncStatus={erpSyncStatus}
                />
            </div>
        </SimpleLayout>
    );
};

export default RefundManagement;
