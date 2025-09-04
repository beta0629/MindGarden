import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import './SessionManagement.css';

/**
 * 내담자 회기 관리 컴포넌트
 * - 내담자별 회기 등록
 * - 회기 상태 관리
 * - 회기 사용 내역 조회
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const SessionManagement = () => {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedMapping, setSelectedMapping] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [clientFilterStatus, setClientFilterStatus] = useState('ALL');
    const [newSessionData, setNewSessionData] = useState({
        consultantId: '',
        clientId: '',
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 10,
        status: 'ACTIVE',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    /**
     * 초기 데이터 로드
     */
    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadClients(),
                loadConsultants(),
                loadMappings()
            ]);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            notificationManager.error('데이터 로드에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 내담자 목록 로드
     */
    const loadClients = async () => {
        try {
            const response = await apiGet('/api/admin/clients');
            if (response.success) {
                setClients(response.data || []);
            }
        } catch (error) {
            console.error('내담자 목록 로드 실패:', error);
        }
    };

    /**
     * 상담사 목록 로드
     */
    const loadConsultants = async () => {
        try {
            const response = await apiGet('/api/admin/consultants');
            if (response.success) {
                setConsultants(response.data || []);
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
        }
    };

    /**
     * 매핑 목록 로드
     */
    const loadMappings = async () => {
        try {
            const response = await apiGet('/api/admin/mappings');
            if (response.success) {
                setMappings(response.data || []);
            }
        } catch (error) {
            console.error('매핑 목록 로드 실패:', error);
        }
    };

    /**
     * 내담자 선택 처리
     */
    const handleClientSelect = (client) => {
        setSelectedClient(client);
        // 해당 내담자의 매핑 정보 찾기
        const clientMappings = mappings.filter(mapping => 
            mapping.clientId === client.id
        );
        if (clientMappings.length > 0) {
            setSelectedMapping(clientMappings[0]);
        } else {
            setSelectedMapping(null);
        }
    };

    /**
     * 필터링된 매핑 목록 반환
     */
    const getFilteredMappings = () => {
        if (!selectedClient) {
            return mappings; // 내담자가 선택되지 않으면 모든 매핑 표시
        }
        return mappings.filter(mapping => mapping.clientId === selectedClient.id);
    };

    /**
     * 필터링된 내담자 목록 반환
     */
    const getFilteredClients = () => {
        let filtered = clients;

        // 검색어 필터링
        if (clientSearchTerm) {
            filtered = filtered.filter(client => 
                client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
            );
        }

        // 상태별 필터링
        if (clientFilterStatus !== 'ALL') {
            filtered = filtered.filter(client => {
                const clientMappings = mappings.filter(mapping => mapping.clientId === client.id);
                const activeMappings = clientMappings.filter(mapping => mapping.status === 'ACTIVE');
                
                switch (clientFilterStatus) {
                    case 'HAS_MAPPING':
                        return clientMappings.length > 0;
                    case 'ACTIVE_MAPPING':
                        return activeMappings.length > 0;
                    case 'NO_MAPPING':
                        return clientMappings.length === 0;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    };

    /**
     * 새 회기 등록 모달 열기
     */
    const handleAddSession = () => {
        if (!selectedClient) {
            notificationManager.error('내담자를 먼저 선택해주세요.');
            return;
        }
        setNewSessionData({
            consultantId: selectedMapping?.consultant?.id || '',
            clientId: selectedClient.id,
            totalSessions: 10,
            usedSessions: selectedMapping?.usedSessions || 0,
            remainingSessions: 10,
            status: 'ACTIVE',
            notes: ''
        });
        setShowAddModal(true);
    };

    /**
     * 회기 등록 처리
     */
    const handleCreateSession = async () => {
        if (!newSessionData.consultantId || !newSessionData.clientId) {
            notificationManager.error('상담사와 내담자를 모두 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiPost('/api/admin/mappings', {
                consultantId: newSessionData.consultantId,
                clientId: newSessionData.clientId,
                totalSessions: newSessionData.totalSessions,
                usedSessions: newSessionData.usedSessions,
                remainingSessions: newSessionData.remainingSessions,
                status: newSessionData.status,
                notes: newSessionData.notes
            });

            if (response.success) {
                notificationManager.success('회기가 성공적으로 등록되었습니다.');
                setShowAddModal(false);
                loadMappings();
                setNewSessionData({
                    consultantId: '',
                    clientId: '',
                    totalSessions: 10,
                    usedSessions: 0,
                    remainingSessions: 10,
                    status: 'ACTIVE',
                    notes: ''
                });
            } else {
                throw new Error(response.message || '회기 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('회기 등록 실패:', error);
            notificationManager.error('회기 등록에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 매핑 상태 변경
     */
    const handleStatusChange = async (mappingId, newStatus) => {
        setLoading(true);
        try {
            const response = await apiPut(`/api/admin/mappings/${mappingId}`, {
                status: newStatus
            });

            if (response.success) {
                notificationManager.success('상태가 변경되었습니다.');
                loadMappings();
            } else {
                throw new Error(response.message || '상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('상태 변경 실패:', error);
            notificationManager.error('상태 변경에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 상태를 한글로 변환
     */
    const getStatusText = (status) => {
        const statusMap = {
            'ACTIVE': '활성',
            'INACTIVE': '비활성',
            'SUSPENDED': '일시정지',
            'TERMINATED': '종료',
            'COMPLETED': '완료',
            'PENDING_PAYMENT': '입금 대기',
            'PAYMENT_CONFIRMED': '입금 확인됨',
            'SESSIONS_EXHAUSTED': '회기 소진'
        };
        return statusMap[status] || status;
    };

    /**
     * 상태별 색상 반환
     */
    const getStatusColor = (status) => {
        const colorMap = {
            'ACTIVE': '#10b981',
            'INACTIVE': '#6b7280',
            'SUSPENDED': '#f59e0b',
            'TERMINATED': '#ef4444',
            'COMPLETED': '#3b82f6',
            'PENDING_PAYMENT': '#f97316',
            'PAYMENT_CONFIRMED': '#22c55e',
            'SESSIONS_EXHAUSTED': '#8b5cf6'
        };
        return colorMap[status] || '#6b7280';
    };

    return (
        <SimpleLayout>
            <div className="session-mgmt-container">
            <div className="session-mgmt-header">
                <h2>📋 내담자 회기 관리</h2>
                <p>내담자의 상담 회기를 등록하고 관리할 수 있습니다.</p>
            </div>

            {/* 내담자 선택 섹션 */}
            <div className="session-mgmt-client-selection-section">
                <div className="session-mgmt-client-selection-header">
                    <h3>내담자 선택</h3>
                    <div className="session-mgmt-client-filters">
                        <div className="session-mgmt-search-box">
                            <input
                                type="text"
                                placeholder="내담자 이름 또는 이메일 검색..."
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                className="session-mgmt-search-input"
                            />
                        </div>
                        <select
                            value={clientFilterStatus}
                            onChange={(e) => setClientFilterStatus(e.target.value)}
                            className="session-mgmt-filter-select"
                        >
                            <option value="ALL">전체</option>
                            <option value="HAS_MAPPING">매핑 있음</option>
                            <option value="ACTIVE_MAPPING">활성 매핑</option>
                            <option value="NO_MAPPING">매핑 없음</option>
                        </select>
                    </div>
                </div>
                <div className="session-mgmt-client-list">
                    {getFilteredClients().map(client => {
                        const clientMappings = mappings.filter(mapping => mapping.clientId === client.id);
                        const activeMappings = clientMappings.filter(mapping => mapping.status === 'ACTIVE');
                        
                        return (
                            <div 
                                key={client.id}
                                className={`session-mgmt-client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
                                onClick={() => handleClientSelect(client)}
                            >
                                <div className="session-mgmt-client-info">
                                    <div className="session-mgmt-client-name">{client.name}</div>
                                    <div className="session-mgmt-client-email">{client.email}</div>
                                    <div className="session-mgmt-client-mapping-info">
                                        <span className="session-mgmt-mapping-count">
                                            매핑 {clientMappings.length}개
                                        </span>
                                        {activeMappings.length > 0 && (
                                            <span className="session-mgmt-active-count">
                                                (활성 {activeMappings.length}개)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="session-mgmt-client-status">
                                    {selectedClient?.id === client.id && <span className="session-mgmt-selected-indicator">✓</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {getFilteredClients().length === 0 && (
                    <div className="session-mgmt-no-results">
                        <p>검색 조건에 맞는 내담자가 없습니다.</p>
                    </div>
                )}
            </div>

            {/* 선택된 내담자 정보 */}
            {selectedClient && (
                <div className="session-mgmt-selected-client-info">
                    <h3>선택된 내담자: {selectedClient.name}</h3>
                    
                    {selectedMapping ? (
                        <div className="session-mgmt-mapping-info">
                            <div className="session-mgmt-mapping-details">
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">상담사:</span>
                                    <span className="session-mgmt-value">{selectedMapping.consultant?.name || '알 수 없음'}</span>
                                </div>
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">총 회기:</span>
                                    <span className="session-mgmt-value">{selectedMapping.totalSessions || 0}회</span>
                                </div>
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">사용 회기:</span>
                                    <span className="session-mgmt-value">{selectedMapping.usedSessions || 0}회</span>
                                </div>
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">남은 회기:</span>
                                    <span className="session-mgmt-value">{selectedMapping.remainingSessions || 0}회</span>
                                </div>
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">상태:</span>
                                    <span 
                                        className="session-mgmt-value session-mgmt-status-badge"
                                        style={{ backgroundColor: getStatusColor(selectedMapping.status) }}
                                    >
                                        {getStatusText(selectedMapping.status)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="session-mgmt-mapping-actions">
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-primary"
                                    onClick={handleAddSession}
                                >
                                    회기 추가
                                </button>
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-secondary"
                                    onClick={() => handleStatusChange(selectedMapping.id, 'INACTIVE')}
                                    disabled={selectedMapping.status === 'INACTIVE'}
                                >
                                    비활성화
                                </button>
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-warning"
                                    onClick={() => handleStatusChange(selectedMapping.id, 'SUSPENDED')}
                                    disabled={selectedMapping.status === 'SUSPENDED'}
                                >
                                    일시정지
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="session-mgmt-no-mapping">
                            <p>이 내담자에 대한 상담사 매핑이 없습니다.</p>
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-primary"
                                onClick={handleAddSession}
                            >
                                새 회기 등록
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 매핑 목록 */}
            <div className="session-mgmt-all-mappings-section">
                <h3>
                    {selectedClient ? `${selectedClient.name} 회기 관리 현황` : '전체 회기 관리 현황'}
                    {selectedClient && (
                        <button 
                            className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-secondary"
                            onClick={() => setSelectedClient(null)}
                            style={{ marginLeft: '15px' }}
                        >
                            전체 보기
                        </button>
                    )}
                </h3>
                <div className="session-mgmt-mappings-grid">
                    {getFilteredMappings().map(mapping => (
                        <div key={mapping.id} className="session-mgmt-mapping-card">
                            <div className="session-mgmt-card-header">
                                <div className="session-mgmt-card-title">
                                    <h4>{mapping.clientName || '알 수 없음'}</h4>
                                    <span className="session-mgmt-card-subtitle">내담자</span>
                                </div>
                                <span 
                                    className="session-mgmt-status-badge"
                                    style={{ backgroundColor: getStatusColor(mapping.status) }}
                                >
                                    {getStatusText(mapping.status)}
                                </span>
                            </div>
                            
                            <div className="session-mgmt-card-content">
                                <div className="session-mgmt-info-row">
                                    <span className="session-mgmt-info-label">상담사:</span>
                                    <span className="session-mgmt-info-value">{mapping.consultantName || '알 수 없음'}</span>
                                </div>
                                
                                <div className="session-mgmt-sessions-info">
                                    <div className="session-mgmt-session-item">
                                        <span className="session-mgmt-session-label">총 회기</span>
                                        <span className="session-mgmt-session-value total">{mapping.totalSessions || 0}회</span>
                                    </div>
                                    <div className="session-mgmt-session-item">
                                        <span className="session-mgmt-session-label">사용</span>
                                        <span className="session-mgmt-session-value used">{mapping.usedSessions || 0}회</span>
                                    </div>
                                    <div className="session-mgmt-session-item">
                                        <span className="session-mgmt-session-label">남은</span>
                                        <span className="session-mgmt-session-value remaining">{mapping.remainingSessions || 0}회</span>
                                    </div>
                                </div>
                                
                                {mapping.packageName && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">패키지:</span>
                                        <span className="session-mgmt-info-value">{mapping.packageName}</span>
                                    </div>
                                )}
                                
                                {mapping.paymentAmount && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">결제금액:</span>
                                        <span className="session-mgmt-info-value">{mapping.paymentAmount.toLocaleString()}원</span>
                                    </div>
                                )}
                                
                                {mapping.createdAt && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">등록일:</span>
                                        <span className="session-mgmt-info-value">
                                            {new Date(mapping.createdAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                )}
                                
                                {mapping.adminApprovalDate && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">승인일:</span>
                                        <span className="session-mgmt-info-value">
                                            {new Date(mapping.adminApprovalDate).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                )}
                                
                                {mapping.paymentDate && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">결제일:</span>
                                        <span className="session-mgmt-info-value">
                                            {new Date(mapping.paymentDate).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="session-mgmt-card-actions">
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-secondary"
                                    onClick={() => handleStatusChange(mapping.id, 'INACTIVE')}
                                    disabled={mapping.status === 'INACTIVE'}
                                >
                                    비활성
                                </button>
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-primary"
                                    onClick={() => {
                                        setSelectedMapping(mapping);
                                        setShowAddModal(true);
                                    }}
                                >
                                    회기 등록
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 회기 등록 모달 */}
            {showAddModal && (
                <div className="session-mgmt-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="session-mgmt-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="session-mgmt-modal-header">
                            <h3>새 회기 등록</h3>
                            <button className="session-mgmt-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        
                        <div className="session-mgmt-modal-body">
                            <div className="session-mgmt-form-group">
                                <label>상담사 선택</label>
                                <select 
                                    value={newSessionData.consultantId}
                                    onChange={(e) => setNewSessionData({
                                        ...newSessionData,
                                        consultantId: e.target.value
                                    })}
                                >
                                    <option value="">상담사를 선택하세요</option>
                                    {consultants.map(consultant => (
                                        <option key={consultant.id} value={consultant.id}>
                                            {consultant.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="session-mgmt-form-group">
                                <label>총 회기 수</label>
                                <input 
                                    type="number"
                                    value={newSessionData.totalSessions}
                                    onChange={(e) => setNewSessionData({
                                        ...newSessionData,
                                        totalSessions: parseInt(e.target.value) || 0,
                                        remainingSessions: parseInt(e.target.value) || 0
                                    })}
                                    min="1"
                                    max="100"
                                />
                            </div>
                            
                            <div className="session-mgmt-form-group">
                                <label>사용된 회기 수</label>
                                <input 
                                    type="number"
                                    value={newSessionData.usedSessions}
                                    onChange={(e) => setNewSessionData({
                                        ...newSessionData,
                                        usedSessions: parseInt(e.target.value) || 0
                                    })}
                                    min="0"
                                    max={newSessionData.totalSessions}
                                />
                            </div>
                            
                            <div className="session-mgmt-form-group">
                                <label>상태</label>
                                <select 
                                    value={newSessionData.status}
                                    onChange={(e) => setNewSessionData({
                                        ...newSessionData,
                                        status: e.target.value
                                    })}
                                >
                                    <option value="ACTIVE">활성</option>
                                    <option value="INACTIVE">비활성</option>
                                    <option value="SUSPENDED">일시정지</option>
                                </select>
                            </div>
                            
                            <div className="session-mgmt-form-group">
                                <label>메모</label>
                                <textarea 
                                    value={newSessionData.notes}
                                    onChange={(e) => setNewSessionData({
                                        ...newSessionData,
                                        notes: e.target.value
                                    })}
                                    placeholder="회기 등록 관련 메모를 입력하세요"
                                    rows="3"
                                />
                            </div>
                        </div>
                        
                        <div className="session-mgmt-modal-footer">
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-secondary"
                                onClick={() => setShowAddModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-primary"
                                onClick={handleCreateSession}
                                disabled={loading}
                            >
                                {loading ? '등록 중...' : '등록'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="session-mgmt-loading-overlay">
                    <div className="session-mgmt-loading-spinner">로딩 중...</div>
                </div>
            )}
            </div>
        </SimpleLayout>
    );
};

export default SessionManagement;
