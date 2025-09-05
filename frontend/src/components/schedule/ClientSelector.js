import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';
import './ClientSelector.css';

/**
 * 내담자 선택 컴포넌트
 * - 결제 승인되고 세션이 남은 내담자만 표시
 * - 드래그 앤 드롭 기능 지원
 * - 세션 정보 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ClientSelector = ({ 
    clients, 
    selectedConsultant, 
    onClientSelect, 
    selectedClient 
}) => {
    const [clientHistory, setClientHistory] = useState({});
    const [loadingHistory, setLoadingHistory] = useState({});

    /**
     * 내담자 상담 히스토리 조회
     */
    const loadClientHistory = async (client) => {
        const clientId = client.originalId || client.id;
        const displayId = client.id; // 표시용 ID (client-34-22 형태)
        
        if (clientHistory[displayId] || loadingHistory[displayId]) {
            return; // 이미 로드되었거나 로딩 중
        }

        try {
            setLoadingHistory(prev => ({ ...prev, [displayId]: true }));
            console.log('📋 내담자 히스토리 조회 시작:', { displayId, clientId });
            
            const response = await apiGet(`/api/v1/consultations/client/${clientId}/history`);
            
            if (response.success) {
                console.log('📋 내담자 히스토리 조회 완료:', response.data);
                setClientHistory(prev => ({ ...prev, [displayId]: response.data }));
            } else {
                console.warn('📋 내담자 히스토리 조회 실패:', response.message);
            }
        } catch (error) {
            console.error('📋 내담자 히스토리 조회 오류:', error);
        } finally {
            setLoadingHistory(prev => ({ ...prev, [displayId]: false }));
        }
    };

    /**
     * 내담자와 상담사 간의 매핑 확인
     */
    const getClientMappingInfo = (client) => {
        // 실제로는 백엔드에서 매핑 정보를 확인해야 함
        return {
            hasMapping: true, // TODO: 실제 매핑 확인 로직
            remainingSessions: client.remainingSessions || 0,
            packageName: client.packageName || '기본 패키지'
        };
    };

    /**
     * 프로필 이미지 URL 생성
     */
    const getClientProfileImage = (client) => {
        if (client.profileImage) {
            return client.profileImage;
        }
        
        const firstChar = client.name ? client.name.charAt(0) : '?';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstChar)}&background=28a745&color=fff&size=60&font-size=0.5`;
    };

    /**
     * 세션 상태 배지 색상
     */
    const getSessionBadgeColor = (remainingSessions) => {
        if (remainingSessions <= 1) return 'danger';
        if (remainingSessions <= 3) return 'warning';
        return 'success';
    };

    /**
     * 내담자 카드 클릭 핸들러
     */
    const handleClientClick = (client) => {
        const mappingInfo = getClientMappingInfo(client);
        
        if (!mappingInfo.hasMapping) {
            alert('해당 내담자와 상담사 간의 매핑이 없습니다.');
            return;
        }
        
        if (mappingInfo.remainingSessions <= 0) {
            alert('사용 가능한 세션이 없습니다.');
            return;
        }
        
        onClientSelect(client);
    };

    /**
     * 드래그 시작 핸들러
     */
    const handleDragStart = (e, client) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            id: client.id,
            type: 'client',
            data: client
        }));
        e.dataTransfer.effectAllowed = 'move';
    };

    if (!clients || clients.length === 0) {
        return (
            <div className="client-selector">
                <div className="no-clients">
                    <div className="no-clients-icon">👤</div>
                    <p>사용 가능한 내담자가 없습니다.</p>
                    <small>결제가 승인되고 세션이 남은 내담자가 없습니다.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="client-selector">
            <div className="client-grid">
                {clients.map(client => {
                    const mappingInfo = getClientMappingInfo(client);
                    const isSelected = selectedClient?.id === client.id;
                    const isAvailable = mappingInfo.hasMapping && mappingInfo.remainingSessions > 0;
                    
                    return (
                        <div
                            key={client.id}
                            className={`client-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                            onClick={() => handleClientClick(client)}
                            draggable={isAvailable}
                            onDragStart={(e) => handleDragStart(e, client)}
                            role="button"
                            tabIndex="0"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleClientClick(client);
                                }
                            }}
                        >
                            <div className="client-header">
                                <div className="client-profile">
                                    <img 
                                        src={getClientProfileImage(client)}
                                        alt={`${client.name} 프로필`}
                                        className="client-image"
                                    />
                                    <div className="client-info">
                                        <h4 className="client-name">{client.name}</h4>
                                        <p className="client-details">
                                            {client.gender} • {client.age}세
                                        </p>
                                    </div>
                                </div>
                                
                                {isSelected && (
                                    <div className="selected-check">
                                        <span className="check-icon">✓</span>
                                    </div>
                                )}
                            </div>

                            <div className="client-body">
                                {/* 패키지 정보 */}
                                <div className="package-info">
                                    <span className="package-label">패키지:</span>
                                    <span className="package-name">{mappingInfo.packageName}</span>
                                </div>

                                {/* 세션 정보 */}
                                <div className="session-info">
                                    <span className="session-label">남은 세션:</span>
                                    <span className={`session-badge ${getSessionBadgeColor(mappingInfo.remainingSessions)}`}>
                                        {mappingInfo.remainingSessions}회
                                    </span>
                                </div>

                                {/* 연락처 */}
                                {client.phone && (
                                    <div className="contact-info">
                                        <span className="contact-label">연락처:</span>
                                        <span className="contact-value">{client.phone}</span>
                                    </div>
                                )}

                                {/* 최근 상담일 */}
                                {client.lastConsultationDate && (
                                    <div className="last-consultation">
                                        <span className="last-label">최근 상담:</span>
                                        <span className="last-date">
                                            {new Date(client.lastConsultationDate).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                )}

                                {/* 이전 상담사 정보 */}
                                <div className="consultation-history">
                                    <button 
                                        className="history-toggle-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            loadClientHistory(client);
                                        }}
                                        disabled={loadingHistory[client.id]}
                                    >
                                        {loadingHistory[client.id] ? '로딩...' : '📋 이전 상담사 확인'}
                                    </button>
                                    
                                    {clientHistory[client.id] && clientHistory[client.id].length > 0 && (
                                        <div className="history-info">
                                            <div className="history-label">이전 상담사:</div>
                                            <div className="previous-consultants">
                                                {clientHistory[client.id].slice(0, 3).map((history, index) => (
                                                    <div key={index} className="consultant-history-item">
                                                        <span className="consultant-name">
                                                            {history.consultant?.name || '알 수 없음'}
                                                        </span>
                                                        <span className="consultation-date">
                                                            {new Date(history.consultationDate).toLocaleDateString('ko-KR')}
                                                        </span>
                                                    </div>
                                                ))}
                                                {clientHistory[client.id].length > 3 && (
                                                    <div className="more-history">
                                                        +{clientHistory[client.id].length - 3}명 더
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 특이사항 */}
                                {client.notes && (
                                    <div className="client-notes">
                                        <span className="notes-label">특이사항:</span>
                                        <span className="notes-text">{client.notes}</span>
                                    </div>
                                )}
                            </div>

                            {/* 세션 부족 경고 */}
                            {mappingInfo.remainingSessions <= 1 && (
                                <div className="session-warning">
                                    ⚠️ 세션이 부족합니다
                                </div>
                            )}

                            {/* 매핑 없음 경고 */}
                            {!mappingInfo.hasMapping && (
                                <div className="mapping-warning">
                                    ❌ 매핑이 없습니다
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 필터링된 내담자 수 표시 */}
            <div className="client-count">
                총 {clients.length}명의 내담자
            </div>
        </div>
    );
};

export default ClientSelector;
