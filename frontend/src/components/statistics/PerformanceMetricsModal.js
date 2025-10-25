import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet, apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import './PerformanceMetricsModal.css';

/**
 * 성과 지표 대시보드 모달 컴포넌트
 * - 실시간 성과 지표 표시
 * - 지표 재계산 기능
 * - 기간별 필터링
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-30
 */
const PerformanceMetricsModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [metrics, setMetrics] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [branchCode, setBranchCode] = useState('');
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // 현재 월로 초기화
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            setDateRange({
                startDate: firstDay.toISOString().split('T')[0],
                endDate: lastDay.toISOString().split('T')[0]
            });
            
            loadBranches();
            loadMetrics();
        }
    }, [isOpen]);

    /**
     * 지점 목록 로드
     */
    const loadBranches = async () => {
        try {
            const response = await apiGet('/api/branches');
            if (response && response.success !== false) {
                setBranches(response.data || []);
            }
        } catch (error) {
            console.error('지점 목록 로드 실패:', error);
        }
    };

    /**
     * 성과 지표 로드
     */
    const loadMetrics = async () => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                branchCode: branchCode || ''
            });

            const response = await apiGet(`/api/statistics/performance?${params}`);
            
            if (response && response.success !== false) {
                setMetrics(response.data);
            } else {
                throw new Error(response?.message || '성과 지표 조회에 실패했습니다.');
            }

        } catch (error) {
            console.error('❌ 성과 지표 조회 실패:', error);
            notificationManager.error(error.message || '성과 지표 조회 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 성과 지표 재계산
     */
    const handleRecalculate = async () => {
        try {
            setRecalculating(true);
            
            const response = await apiPost('/api/statistics/recalculate', {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                branchCode: branchCode || ''
            });
            
            if (response && response.success !== false) {
                notificationManager.success('성과 지표가 재계산되었습니다.');
                loadMetrics(); // 재계산 후 데이터 새로고침
            } else {
                throw new Error(response?.message || '성과 지표 재계산에 실패했습니다.');
            }

        } catch (error) {
            console.error('❌ 성과 지표 재계산 실패:', error);
            notificationManager.error(error.message || '성과 지표 재계산 중 오류가 발생했습니다.');
        } finally {
            setRecalculating(false);
        }
    };

    /**
     * 필터 변경 처리
     */
    const handleFilterChange = () => {
        loadMetrics();
    };

    /**
     * 모달 닫기
     */
    const handleClose = () => {
        if (loading || recalculating) return;
        setMetrics(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="performance-metrics-modal-overlay">
            <div className="performance-metrics-modal">
                <div className="performance-metrics-modal-header">
                    <h3>📈 성과 지표 대시보드</h3>
                    <button 
                        className="performance-metrics-close-btn"
                        onClick={handleClose}
                        disabled={loading || recalculating}
                    >
                        ✕
                    </button>
                </div>

                <div className="performance-metrics-modal-content">
                    {/* 필터 설정 */}
                    <div className="metrics-filters">
                        <div className="filter-row">
                            <div className="form-group">
                                <label>시작일</label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    disabled={loading || recalculating}
                                />
                            </div>
                            <div className="form-group">
                                <label>종료일</label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    disabled={loading || recalculating}
                                />
                            </div>
                            <div className="form-group">
                                <label>지점</label>
                                <select
                                    value={branchCode}
                                    onChange={(e) => setBranchCode(e.target.value)}
                                    disabled={loading || recalculating}
                                >
                                    <option value="">전체 지점</option>
                                    {branches.map(branch => (
                                        <option key={branch.code} value={branch.code}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-actions">
                                <button 
                                    className="btn-filter"
                                    onClick={handleFilterChange}
                                    disabled={loading || recalculating}
                                >
                                    🔍 조회
                                </button>
                                <button 
                                    className="btn-recalculate"
                                    onClick={handleRecalculate}
                                    disabled={loading || recalculating}
                                >
                                    {recalculating ? '재계산 중...' : '🔄 재계산'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 성과 지표 표시 */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>성과 지표를 불러오는 중...</p>
                        </div>
                    ) : metrics ? (
                        <div className="metrics-content">
                            {/* 주요 지표 */}
                            <div className="main-metrics">
                                <h4>주요 성과 지표</h4>
                                <div className="metrics-grid">
                                    <div className="metric-card">
                                        <div className="metric-icon">👥</div>
                                        <div className="metric-info">
                                            <div className="metric-label">총 상담사 수</div>
                                            <div className="metric-value">{metrics.totalConsultants || 0}명</div>
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-icon">📅</div>
                                        <div className="metric-info">
                                            <div className="metric-label">총 상담 건수</div>
                                            <div className="metric-value">{metrics.totalConsultations || 0}건</div>
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-icon">💰</div>
                                        <div className="metric-info">
                                            <div className="metric-label">총 매출</div>
                                            <div className="metric-value">
                                                {(metrics.totalRevenue || 0).toLocaleString()}원
                                            </div>
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-icon">⭐</div>
                                        <div className="metric-info">
                                            <div className="metric-label">평균 만족도</div>
                                            <div className="metric-value">{metrics.averageSatisfaction || 0}점</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 상세 지표 */}
                            <div className="detailed-metrics">
                                <div className="metrics-section">
                                    <h5>상담사별 성과</h5>
                                    <div className="consultant-performance">
                                        {metrics.consultantPerformance?.map((consultant, index) => (
                                            <div key={index} className="consultant-item">
                                                <div className="consultant-name">{consultant.name}</div>
                                                <div className="consultant-stats">
                                                    <span>상담: {consultant.consultationCount}건</span>
                                                    <span>매출: {consultant.revenue?.toLocaleString()}원</span>
                                                    <span>만족도: {consultant.satisfaction}점</span>
                                                </div>
                                            </div>
                                        )) || <p className="no-data">데이터가 없습니다.</p>}
                                    </div>
                                </div>

                                <div className="metrics-section">
                                    <h5>일별 성과 추이</h5>
                                    <div className="daily-trend">
                                        {metrics.dailyTrend?.map((day, index) => (
                                            <div key={index} className="trend-item">
                                                <div className="trend-date">{day.date}</div>
                                                <div className="trend-stats">
                                                    <span>상담: {day.consultations}건</span>
                                                    <span>매출: {day.revenue?.toLocaleString()}원</span>
                                                </div>
                                            </div>
                                        )) || <p className="no-data">데이터가 없습니다.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-data-container">
                            <p>성과 지표 데이터가 없습니다.</p>
                            <button 
                                className="btn-load"
                                onClick={loadMetrics}
                                disabled={loading}
                            >
                                데이터 로드
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PerformanceMetricsModal;
