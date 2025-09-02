import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
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
            const response = await apiGet('/api/users?role=CLIENT');
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
            const response = await apiGet('/api/users?role=CONSULTANT');
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
            const response = await apiGet('/api/mappings');
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
            mapping.client && mapping.client.id === client.id
        );
        if (clientMappings.length > 0) {
            setSelectedMapping(clientMappings[0]);
        } else {
            setSelectedMapping(null);
        }
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
            const response = await apiPost('/api/mappings', {
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
            const response = await apiPut(`/api/mappings/${mappingId}`, {
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
            'COMPLETED': '완료'
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
            'COMPLETED': '#3b82f6'
        };
        return colorMap[status] || '#6b7280';
    };

    return (
        <div className="session-mgmt-container">
            <div className="session-mgmt-header">
                <h2>📋 내담자 회기 관리</h2>
                <p>내담자의 상담 회기를 등록하고 관리할 수 있습니다.</p>
            </div>

            {/* 내담자 선택 섹션 */}
            <div className="session-mgmt-client-selection-section">
                <h3>내담자 선택</h3>
                <div className="session-mgmt-client-list">
                    {clients.map(client => (
                        <div 
                            key={client.id}
                            className={`session-mgmt-client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
                            onClick={() => handleClientSelect(client)}
                        >
                            <div className="session-mgmt-client-info">
                                <div className="session-mgmt-client-name">{client.name}</div>
                                <div className="session-mgmt-client-email">{client.email}</div>
                            </div>
                            <div className="session-mgmt-client-status">
                                {selectedClient?.id === client.id && <span className="session-mgmt-selected-indicator">✓</span>}
                            </div>
                        </div>
                    ))}
                </div>
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

            {/* 전체 매핑 목록 */}
            <div className="session-mgmt-all-mappings-section">
                <h3>전체 회기 관리 현황</h3>
                <div className="session-mgmt-mappings-table">
                    <div className="session-mgmt-table-header">
                        <div className="session-mgmt-header-cell">내담자</div>
                        <div className="session-mgmt-header-cell">상담사</div>
                        <div className="session-mgmt-header-cell">총 회기</div>
                        <div className="session-mgmt-header-cell">사용</div>
                        <div className="session-mgmt-header-cell">남은</div>
                        <div className="session-mgmt-header-cell">상태</div>
                        <div className="session-mgmt-header-cell">액션</div>
                    </div>
                    {mappings.map(mapping => (
                        <div key={mapping.id} className="session-mgmt-table-row">
                            <div className="session-mgmt-table-cell">{mapping.client?.name || '알 수 없음'}</div>
                            <div className="session-mgmt-table-cell">{mapping.consultant?.name || '알 수 없음'}</div>
                            <div className="session-mgmt-table-cell">{mapping.totalSessions || 0}</div>
                            <div className="session-mgmt-table-cell">{mapping.usedSessions || 0}</div>
                            <div className="session-mgmt-table-cell">{mapping.remainingSessions || 0}</div>
                            <div className="session-mgmt-table-cell">
                                <span 
                                    className="session-mgmt-status-badge"
                                    style={{ backgroundColor: getStatusColor(mapping.status) }}
                                >
                                    {getStatusText(mapping.status)}
                                </span>
                            </div>
                            <div className="session-mgmt-table-cell">
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-secondary"
                                    onClick={() => handleStatusChange(mapping.id, 'INACTIVE')}
                                    disabled={mapping.status === 'INACTIVE'}
                                >
                                    비활성
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
    );
};

export default SessionManagement;
