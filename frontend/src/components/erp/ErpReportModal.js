import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import './ErpReportModal.css';

/**
 * ERP 보고서 모달 컴포넌트
 * - 월별/분기별/연별 보고서 생성
 * - 보고서 다운로드 기능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-30
 */
const ErpReportModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('monthly');
    const [period, setPeriod] = useState('');
    const [branchCode, setBranchCode] = useState('');
    const [reportData, setReportData] = useState(null);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        if (isOpen) {
            loadBranches();
            // 현재 월로 초기화
            const now = new Date();
            setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
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
     * 보고서 생성
     */
    const handleGenerateReport = async () => {
        if (!period) {
            notificationManager.error('기간을 선택해주세요.');
            return;
        }

        try {
            setLoading(true);
            
            const params = new URLSearchParams({
                type: reportType,
                period: period,
                branchCode: branchCode || ''
            });

            const response = await apiGet(`/api/erp/reports?${params}`);
            
            if (response && response.success !== false) {
                setReportData(response.data);
                notificationManager.success('보고서가 생성되었습니다.');
            } else {
                throw new Error(response?.message || '보고서 생성에 실패했습니다.');
            }

        } catch (error) {
            console.error('❌ 보고서 생성 실패:', error);
            notificationManager.error(error.message || '보고서 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 보고서 다운로드
     */
    const handleDownloadReport = async () => {
        if (!reportData) {
            notificationManager.error('다운로드할 보고서가 없습니다.');
            return;
        }

        try {
            const params = new URLSearchParams({
                type: reportType,
                period: period,
                branchCode: branchCode || '',
                format: 'excel'
            });

            const response = await fetch(`/api/erp/reports/download?${params}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `erp-report-${reportType}-${period}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                notificationManager.success('보고서가 다운로드되었습니다.');
            } else {
                throw new Error('다운로드에 실패했습니다.');
            }

        } catch (error) {
            console.error('❌ 보고서 다운로드 실패:', error);
            notificationManager.error(error.message || '다운로드 중 오류가 발생했습니다.');
        }
    };

    /**
     * 모달 닫기
     */
    const handleClose = () => {
        if (loading) return;
        setReportData(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="erp-report-modal-overlay">
            <div className="erp-report-modal">
                <div className="erp-report-modal-header">
                    <h3>📊 ERP 보고서</h3>
                    <button 
                        className="erp-report-close-btn"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                <div className="erp-report-modal-content">
                    {/* 보고서 설정 */}
                    <div className="report-settings">
                        <div className="form-group">
                            <label>보고서 유형</label>
                            <div className="radio-group">
                                <label className="radio-item">
                                    <input
                                        type="radio"
                                        value="monthly"
                                        checked={reportType === 'monthly'}
                                        onChange={(e) => setReportType(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>월별 보고서</span>
                                </label>
                                <label className="radio-item">
                                    <input
                                        type="radio"
                                        value="quarterly"
                                        checked={reportType === 'quarterly'}
                                        onChange={(e) => setReportType(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>분기별 보고서</span>
                                </label>
                                <label className="radio-item">
                                    <input
                                        type="radio"
                                        value="yearly"
                                        checked={reportType === 'yearly'}
                                        onChange={(e) => setReportType(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>연별 보고서</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="period">기간 선택</label>
                            {reportType === 'monthly' && (
                                <input
                                    type="month"
                                    id="period"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    disabled={loading}
                                />
                            )}
                            {reportType === 'quarterly' && (
                                <select
                                    id="period"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    disabled={loading}
                                >
                                    <option key="quarter-default" value="">분기를 선택하세요</option>
                                    <option key="2025-Q1" value="2025-Q1">2025년 1분기</option>
                                    <option key="2025-Q2" value="2025-Q2">2025년 2분기</option>
                                    <option key="2025-Q3" value="2025-Q3">2025년 3분기</option>
                                    <option key="2025-Q4" value="2025-Q4">2025년 4분기</option>
                                </select>
                            )}
                            {reportType === 'yearly' && (
                                <select
                                    id="period"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    disabled={loading}
                                >
                                    <option key="year-default" value="">연도를 선택하세요</option>
                                    <option key="2025" value="2025">2025년</option>
                                    <option key="2024" value="2024">2024년</option>
                                    <option key="2023" value="2023">2023년</option>
                                </select>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="branch">지점 선택</label>
                            <select
                                id="branch"
                                value={branchCode}
                                onChange={(e) => setBranchCode(e.target.value)}
                                disabled={loading}
                            >
                                <option key="branch-default" value="">전체 지점</option>
                                {branches.map(branch => (
                                    <option key={branch.code} value={branch.code}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button 
                            className="btn-generate"
                            onClick={handleGenerateReport}
                            disabled={loading || !period}
                        >
                            {loading ? '생성 중...' : '보고서 생성'}
                        </button>
                    </div>

                    {/* 보고서 결과 */}
                    {reportData && (
                        <div className="report-results">
                            <div className="report-header">
                                <h4>보고서 결과</h4>
                                <button 
                                    className="btn-download"
                                    onClick={handleDownloadReport}
                                >
                                    📥 다운로드
                                </button>
                            </div>

                            <div className="report-summary">
                                <div className="summary-item">
                                    <span className="label">총 수익</span>
                                    <span className="value revenue">
                                        {reportData.summary?.totalRevenue?.toLocaleString() || 0}원
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">총 지출</span>
                                    <span className="value expense">
                                        {reportData.summary?.totalExpenses?.toLocaleString() || 0}원
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">순이익</span>
                                    <span className="value profit">
                                        {reportData.summary?.netProfit?.toLocaleString() || 0}원
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">거래 건수</span>
                                    <span className="value">
                                        {reportData.summary?.transactionCount || 0}건
                                    </span>
                                </div>
                            </div>

                            {/* 카테고리별 분석 */}
                            {reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 && (
                                <div className="category-breakdown">
                                    <h5>카테고리별 분석</h5>
                                    <div className="category-list">
                                        {reportData.categoryBreakdown.map((item, index) => (
                                            <div key={index} className="category-item">
                                                <span className="category-name">{item.category}</span>
                                                <span className="category-amount">
                                                    {item.amount?.toLocaleString() || 0}원
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErpReportModal;
