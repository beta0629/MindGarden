import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { TrendingUp, XCircle, RefreshCw, Calendar, Building, BarChart, Target, DollarSign } from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet, apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';

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

            // 임시: 사용 가능한 API 사용
            const response = await apiGet(`/api/admin/statistics/overall?${params}`);
            
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

    const portalTarget = document.body || document.createElement('div');

    return ReactDOM.createPortal(
        <div className="mg-v2-modal-overlay" onClick={onClose}>
            <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="mg-v2-modal-header">
                    <div className="mg-v2-modal-title-wrapper">
                        <TrendingUp size={28} className="mg-v2-modal-title-icon" />
                        <h2 className="mg-v2-modal-title">성과 지표 대시보드</h2>
                    </div>
                    <button className="mg-v2-modal-close" onClick={handleClose} disabled={loading || recalculating} aria-label="닫기">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="mg-v2-modal-body">
                    {/* 필터 설정 */}
                    <div className="mg-v2-form-section">
                        <h3 className="mg-v2-section-title">
                            <BarChart size={20} className="mg-v2-section-title-icon" />
                            필터 설정
                        </h3>
                        <div className="mg-v2-form-grid">
                            <div className="mg-v2-form-group">
                                <label className="mg-v2-form-label">
                                    <Calendar size={16} className="mg-v2-form-label-icon" />
                                    시작일
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    disabled={loading || recalculating}
                                    className="mg-v2-form-input"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <label className="mg-v2-form-label">
                                    <Calendar size={16} className="mg-v2-form-label-icon" />
                                    종료일
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    disabled={loading || recalculating}
                                    className="mg-v2-form-input"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <label className="mg-v2-form-label">
                                    <Building size={16} className="mg-v2-form-label-icon" />
                                    지점
                                </label>
                                <select
                                    value={branchCode}
                                    onChange={(e) => setBranchCode(e.target.value)}
                                    disabled={loading || recalculating}
                                    className="mg-v2-form-select"
                                >
                                    <option value="">전체 지점</option>
                                    {branches.map(branch => (
                                        <option key={branch.code} value={branch.code}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mg-v2-modal-footer">
                            <button 
                                className="mg-v2-button mg-v2-button--primary"
                                onClick={handleFilterChange}
                                disabled={loading || recalculating}
                            >
                                <BarChart size={20} className="mg-v2-icon-inline" />
                                조회
                            </button>
                            <button 
                                className="mg-v2-button mg-v2-button--secondary"
                                onClick={handleRecalculate}
                                disabled={loading || recalculating}
                            >
                                {recalculating ? <UnifiedLoading variant="dots" size="small" type="inline" /> : (
                                    <>
                                        <RefreshCw size={20} className="mg-v2-icon-inline" />
                                        재계산
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 성과 지표 표시 */}
                    {loading ? (
                        <div className="mg-v2-loading-overlay">
                            <UnifiedLoading variant="pulse" size="large" text="성과 지표를 불러오는 중..." type="inline" />
                        </div>
                    ) : metrics ? (
                        <div className="mg-v2-form-section mg-v2-mt-lg">
                            <h4 className="mg-v2-section-title mg-v2-mb-md">
                                <Target size={20} className="mg-v2-section-title-icon" />
                                주요 성과 지표
                            </h4>
                            <div className="mg-v2-info-grid">
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">총 상담사 수</span>
                                    <span className="mg-v2-info-value">{metrics.totalConsultants || 0}명</span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">총 상담 건수</span>
                                    <span className="mg-v2-info-value">{metrics.totalConsultations || 0}건</span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <DollarSign size={16} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">총 매출</span>
                                    <span className="mg-v2-info-value">
                                        {(metrics.totalRevenue || 0).toLocaleString()}원
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">평균 만족도</span>
                                    <span className="mg-v2-info-value">{metrics.averageSatisfaction || 0}점</span>
                                </div>
                            </div>

                            {/* 상세 지표 */}
                            <div className="mg-v2-mt-lg">
                                <div className="mg-v2-form-section">
                                    <h5 className="mg-v2-section-title mg-v2-mb-md">상담사별 성과</h5>
                                    <div className="mg-v2-list-container">
                                        {metrics.consultantPerformance?.map((consultant, index) => (
                                            <div key={index} className="mg-v2-list-item">
                                                <div className="mg-v2-list-item-content">
                                                    <div className="mg-v2-list-item-title">{consultant.name}</div>
                                                    <div className="mg-v2-list-item-subtitle">
                                                        상담: {consultant.consultationCount}건 · 매출: {consultant.revenue?.toLocaleString()}원 · 만족도: {consultant.satisfaction}점
                                                    </div>
                                                </div>
                                            </div>
                                        )) || <div className="mg-v2-empty-state"><p>데이터가 없습니다.</p></div>}
                                    </div>
                                </div>

                                <div className="mg-v2-form-section mg-v2-mt-lg">
                                    <h5 className="mg-v2-section-title mg-v2-mb-md">일별 성과 추이</h5>
                                    <div className="mg-v2-list-container">
                                        {metrics.dailyTrend?.map((day, index) => (
                                            <div key={index} className="mg-v2-list-item">
                                                <div className="mg-v2-list-item-content">
                                                    <div className="mg-v2-list-item-title">{day.date}</div>
                                                    <div className="mg-v2-list-item-subtitle">
                                                        상담: {day.consultations}건 · 매출: {day.revenue?.toLocaleString()}원
                                                    </div>
                                                </div>
                                            </div>
                                        )) || <div className="mg-v2-empty-state"><p>데이터가 없습니다.</p></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mg-v2-empty-state">
                            <p>성과 지표 데이터가 없습니다.</p>
                            <button 
                                className="mg-v2-button mg-v2-button--primary mg-v2-mt-md"
                                onClick={loadMetrics}
                                disabled={loading}
                            >
                                <RefreshCw size={20} className="mg-v2-icon-inline" />
                                데이터 로드
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        portalTarget
    );
};

export default PerformanceMetricsModal;
