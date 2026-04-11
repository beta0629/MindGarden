import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';
import { CLINICAL_CSS } from '../../constants/clinicalCss';
import MGButton from '../common/MGButton';
import './RiskAlertBadge.css';

/**
 * 위험 알림 배지 컴포넌트
 * 실시간으로 AI가 감지한 위험 징후 알림 표시
 *
 * @param {Object} props
 * @param {string} props.tenantId - 테넌트 ID
 */
const RiskAlertBadge = ({ tenantId }) => {
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    /**
     * 알림 목록 로드
     */
    useEffect(() => {
        loadAlerts();

        // 30초마다 새로고침
        const interval = setInterval(loadAlerts, 30000);

        return () => clearInterval(interval);
    }, [tenantId]);

    /**
     * 알림 로드
     */
    const loadAlerts = async() => {
        setIsLoading(true);

        try {
            // 고위험 알림만 조회 (AI_DETECTED)
            const data = await apiGet('/api/v1/consultation-record-alerts/high-risk');

            if (!data) {
                throw new Error('알림 로드 실패');
            }

            const aiAlerts = data.alerts?.filter(a =>
                a.alertSource === 'AI_DETECTED' || a.alertSource === 'KEYWORD_MATCH'
            ) || [];

            setAlerts(aiAlerts);

            // 읽지 않은 알림 수 계산
            const unread = aiAlerts.filter(a => a.status === 'PENDING').length;
            setUnreadCount(unread);

        } catch (error) {
            console.error('알림 로드 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 알림 클릭 (상담 기록으로 이동)
     */
    const handleAlertClick = (alert) => {
        // TODO: 상담 기록 상세 페이지로 이동
        console.log('알림 클릭:', alert);

        // 상담 기록 ID가 있으면 해당 페이지로 이동
        if (alert.consultationRecordId) {
            window.location.href = `/consultant/records/${alert.consultationRecordId}`;
        }

        setIsOpen(false);
    };

    /**
     * 심각도별 색상
     */
    const getSeverityColor = (severity) => {
        const colors = {
            'CRITICAL': 'severity-critical',
            'HIGH': 'severity-high',
            'MEDIUM': 'severity-medium',
            'LOW': 'severity-low'
        };
        return colors[severity] || 'severity-medium';
    };

    /**
     * 심각도 레이블
     */
    const getSeverityLabel = (severity) => {
        const labels = {
            'CRITICAL': '매우 위험',
            'HIGH': '위험',
            'MEDIUM': '주의',
            'LOW': '낮음'
        };
        return labels[severity] || severity;
    };

    return (
        <div className={CLINICAL_CSS.RISK_ALERT_BADGE_CONTAINER}>
            {/* 알림 배지 버튼 */}
            <MGButton
                type="button"
                className={`risk-alert-button ${unreadCount > 0 ? 'has-alerts' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="위험 징후 알림"
                variant="outline"
                preventDoubleClick={false}
            >
                <span className="alert-icon">⚠️</span>
                {unreadCount > 0 && (
                    <span className="alert-count-badge">{unreadCount}</span>
                )}
            </MGButton>

            {/* 알림 드롭다운 */}
            {isOpen && (
                <>
                    {/* 배경 오버레이 */}
                    <div
                        className="alert-overlay"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* 알림 목록 */}
                    <div className="alert-dropdown">
                        <div className="alert-dropdown-header">
                            <h4>🚨 위험 징후 알림</h4>
                            <MGButton
                                type="button"
                                className="btn-refresh"
                                onClick={loadAlerts}
                                disabled={isLoading}
                                title="새로고침"
                                variant="outline"
                                loading={isLoading}
                                preventDoubleClick={false}
                            >
                                🔄
                            </MGButton>
                        </div>

                        <div className="alert-list">
                            {isLoading && (
                                <div className="alert-loading">
                                    <div className="spinner-small" />
                                    <p>로딩 중...</p>
                                </div>
                            )}

                            {!isLoading && alerts.length === 0 && (
                                <div className="no-alerts">
                                    <div className="no-alerts-icon">✅</div>
                                    <p>현재 위험 징후 알림이 없습니다.</p>
                                </div>
                            )}

                            {!isLoading && alerts.length > 0 && (
                                alerts.map(alert => (
                                    <div
                                        key={alert.id}
                                        className={`alert-item ${alert.status === 'PENDING' ? 'unread' : 'read'}`}
                                        onClick={() => handleAlertClick(alert)}
                                    >
                                        <div className="alert-item-header">
                                            <span className={`severity-badge ${getSeverityColor(alert.alertLevel)}`}>
                                                {getSeverityLabel(alert.alertLevel)}
                                            </span>
                                            <span className="alert-time">
                                                {new Date(alert.createdAt).toLocaleString('ko-KR', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        <div className="alert-item-content">
                                            <p className="alert-message">{alert.alertMessage}</p>

                                            {alert.detectedKeywords && (
                                                <div className="detected-keywords">
                                                    <strong>감지된 키워드:</strong>
                                                    <span>{alert.detectedKeywords}</span>
                                                </div>
                                            )}

                                            {alert.aiAnalysisText && (
                                                <div className="ai-analysis">
                                                    <strong>AI 분석:</strong>
                                                    <p>{alert.aiAnalysisText}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="alert-item-footer">
                                            <span className="alert-source">
                                                {alert.alertSource === 'AI_DETECTED' ? '🤖 AI 감지' : '🔍 키워드 매칭'}
                                            </span>
                                            {alert.confidenceScore && (
                                                <span className="confidence">
                                                    신뢰도: {alert.confidenceScore}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {alerts.length > 0 && (
                            <div className="alert-dropdown-footer">
                                <MGButton
                                    type="button"
                                    className="btn-view-all"
                                    onClick={() => {
                                        window.location.href = '/consultant/alerts';
                                        setIsOpen(false);
                                    }}
                                    variant="primary"
                                >
                                    전체 알림 보기 →
                                </MGButton>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default RiskAlertBadge;
