import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FileBarChart, XCircle, Download, Calendar, Building, DollarSign, TrendingUp } from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';

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

    const portalTarget = document.body || document.createElement('div');

    return ReactDOM.createPortal(
        <div className="mg-v2-modal-overlay" onClick={onClose}>
            <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="mg-v2-modal-header">
                    <div className="mg-v2-modal-title-wrapper">
                        <FileBarChart size={28} className="mg-v2-modal-title-icon" />
                        <h2 className="mg-v2-modal-title">ERP 보고서</h2>
                    </div>
                    <button className="mg-v2-modal-close" onClick={handleClose} disabled={loading} aria-label="닫기">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="mg-v2-modal-body">
                    {/* 보고서 설정 */}
                    <div className="mg-v2-form-section">
                        <h3 className="mg-v2-section-title">
                            <Calendar size={20} className="mg-v2-section-title-icon" />
                            보고서 설정
                        </h3>

                        <div className="mg-v2-form-group">
                            <label className="mg-v2-form-label">보고서 유형</label>
                            <div className="mg-v2-form-radio-group">
                                <label className="mg-v2-form-radio">
                                    <input
                                        type="radio"
                                        value="monthly"
                                        checked={reportType === 'monthly'}
                                        onChange={(e) => setReportType(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>월별 보고서</span>
                                </label>
                                <label className="mg-v2-form-radio">
                                    <input
                                        type="radio"
                                        value="quarterly"
                                        checked={reportType === 'quarterly'}
                                        onChange={(e) => setReportType(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>분기별 보고서</span>
                                </label>
                                <label className="mg-v2-form-radio">
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

                        <div className="mg-v2-form-group">
                            <label htmlFor="period" className="mg-v2-form-label">기간 선택</label>
                            {reportType === 'monthly' && (
                                <input
                                    type="month"
                                    id="period"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    disabled={loading}
                                    className="mg-v2-form-input"
                                />
                            )}
                            {reportType === 'quarterly' && (
                                <select
                                    id="period"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    disabled={loading}
                                    className="mg-v2-form-select"
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
                                    className="mg-v2-form-select"
                                >
                                    <option key="year-default" value="">연도를 선택하세요</option>
                                    <option key="2025" value="2025">2025년</option>
                                    <option key="2024" value="2024">2024년</option>
                                    <option key="2023" value="2023">2023년</option>
                                </select>
                            )}
                        </div>

                        <div className="mg-v2-form-group">
                            <label htmlFor="branch" className="mg-v2-form-label">
                                <Building size={20} className="mg-v2-form-label-icon" />
                                지점 선택
                            </label>
                            <select
                                id="branch"
                                value={branchCode}
                                onChange={(e) => setBranchCode(e.target.value)}
                                disabled={loading}
                                className="mg-v2-form-select"
                            >
                                <option key="branch-default" value="">전체 지점</option>
                                {branches.map(branch => (
                                    <option key={branch.code} value={branch.code}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mg-v2-modal-footer">
                            <button 
                                className="mg-v2-button mg-v2-button--secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                <XCircle size={20} className="mg-v2-icon-inline" />
                                취소
                            </button>
                            <button 
                                className="mg-v2-button mg-v2-button--primary"
                                onClick={handleGenerateReport}
                                disabled={loading || !period}
                            >
                                {loading ? <UnifiedLoading variant="dots" size="small" type="inline" /> : (
                                    <>
                                        <TrendingUp size={20} className="mg-v2-icon-inline" />
                                        보고서 생성
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 보고서 결과 */}
                    {reportData && (
                        <div className="mg-v2-form-section mg-v2-mt-lg">
                            <div className="mg-v2-modal-footer mg-v2-justify-between">
                                <h4 className="mg-v2-section-title">
                                    <FileBarChart size={20} className="mg-v2-section-title-icon" />
                                    보고서 결과
                                </h4>
                                <button 
                                    className="mg-v2-button mg-v2-button--success"
                                    onClick={handleDownloadReport}
                                >
                                    <Download size={20} className="mg-v2-icon-inline" />
                                    다운로드
                                </button>
                            </div>

                            <div className="mg-v2-info-grid mg-v2-mt-md">
                                <div className="mg-v2-info-item">
                                    <DollarSign size={20} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">총 수익</span>
                                    <span className="mg-v2-info-value mg-v2-color-success">
                                        {reportData.summary?.totalRevenue?.toLocaleString() || 0}원
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <DollarSign size={20} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">총 지출</span>
                                    <span className="mg-v2-info-value mg-v2-color-danger">
                                        {reportData.summary?.totalExpenses?.toLocaleString() || 0}원
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <TrendingUp size={20} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">순이익</span>
                                    <span className="mg-v2-info-value mg-v2-color-primary">
                                        {reportData.summary?.netProfit?.toLocaleString() || 0}원
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">거래 건수</span>
                                    <span className="mg-v2-info-value">
                                        {reportData.summary?.transactionCount || 0}건
                                    </span>
                                </div>
                            </div>

                            {/* 카테고리별 분석 */}
                            {reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0 && (
                                <div className="mg-v2-mt-lg">
                                    <h5 className="mg-v2-section-title mg-v2-mb-md">카테고리별 분석</h5>
                                    <div className="mg-v2-list-container">
                                        {reportData.categoryBreakdown.map((item, index) => (
                                            <div key={index} className="mg-v2-list-item">
                                                <div className="mg-v2-list-item-content">
                                                    <div className="mg-v2-list-item-title">{item.category}</div>
                                                </div>
                                                <div className="mg-v2-list-item-action">
                                                    <span className="mg-v2-info-value">
                                                        {item.amount?.toLocaleString() || 0}원
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        portalTarget
    );
};

export default ErpReportModal;
