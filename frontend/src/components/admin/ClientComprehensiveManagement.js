import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import './ClientComprehensiveManagement.css';

/**
 * 내담자 종합관리 컴포넌트
 * - 내담자 정보 종합 조회
 * - 상담 이력 관리
 * - 회기 현황 관리
 * - 상담사 매핑 관리
 * - 통계 및 분석
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ClientComprehensiveManagement = () => {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [mainTab, setMainTab] = useState('comprehensive');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        loadAllData();
    }, []);

    /**
     * 모든 데이터 로드
     */
    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadClients(),
                loadConsultants(),
                loadMappings(),
                loadConsultations()
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
     * 상담 이력 로드
     */
    const loadConsultations = async () => {
        try {
            const response = await apiGet('/api/consultations');
            if (response.success) {
                setConsultations(response.data || []);
            }
        } catch (error) {
            console.error('상담 이력 로드 실패:', error);
        }
    };

    /**
     * 내담자 선택 처리
     */
    const handleClientSelect = (client) => {
        setSelectedClient(client);
        setActiveTab('overview');
    };

    /**
     * 필터링된 내담자 목록
     */
    const getFilteredClients = () => {
        let filtered = clients;

        // 검색어 필터링
        if (searchTerm) {
            filtered = filtered.filter(client =>
                client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 상태 필터링
        if (filterStatus !== 'all') {
            filtered = filtered.filter(client => {
                const mapping = mappings.find(m => m.client?.id === client.id);
                return mapping?.status === filterStatus;
            });
        }

        return filtered;
    };

    /**
     * 선택된 내담자의 매핑 정보
     */
    const getClientMapping = () => {
        if (!selectedClient) return null;
        return mappings.find(mapping => mapping.client?.id === selectedClient.id);
    };

    /**
     * 선택된 내담자의 상담 이력
     */
    const getClientConsultations = () => {
        if (!selectedClient) return [];
        return consultations.filter(consultation => consultation.clientId === selectedClient.id);
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

    /**
     * 전체 통계 계산
     */
    const getOverallStats = () => {
        const totalClients = clients.length;
        const activeMappings = mappings.filter(m => m.status === 'ACTIVE').length;
        const totalConsultations = consultations.length;
        const completedConsultations = consultations.filter(c => c.status === 'COMPLETED').length;

        return {
            totalClients,
            activeMappings,
            totalConsultations,
            completedConsultations,
            completionRate: totalConsultations > 0 ? Math.round((completedConsultations / totalConsultations) * 100) : 0
        };
    };

    const stats = getOverallStats();

    return (
        <div className="client-comp-container">
            <div className="client-comp-header">
                <h2>👥 내담자 관리</h2>
                <p>내담자의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다.</p>
                
                {/* 메인 탭 메뉴 */}
                <div className="client-comp-main-tab-buttons">
                    <button
                        className={`client-comp-main-tab-btn ${mainTab === 'comprehensive' ? 'active' : ''}`}
                        onClick={() => setMainTab('comprehensive')}
                    >
                        📊 내담자 종합관리
                    </button>
                    <button
                        className={`client-comp-main-tab-btn ${mainTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setMainTab('basic')}
                    >
                        👤 내담자 기본관리
                    </button>
                </div>
            </div>

            {/* 메인 탭 내용 */}
            {mainTab === 'comprehensive' ? (
                <>
                                        {/* 전체 통계 */}
                    <div className="client-comp-stats-overview">
                <div className="client-comp-stat-card">
                    <div className="client-comp-stat-icon">👥</div>
                    <div className="client-comp-stat-content">
                        <div className="client-comp-stat-number">{stats.totalClients}</div>
                        <div className="client-comp-stat-label">총 내담자</div>
                    </div>
                </div>
                <div className="client-comp-stat-card">
                    <div className="client-comp-stat-icon">🔗</div>
                    <div className="client-comp-stat-content">
                        <div className="client-comp-stat-number">{stats.activeMappings}</div>
                        <div className="client-comp-stat-label">활성 매핑</div>
                    </div>
                </div>
                <div className="client-comp-stat-card">
                    <div className="client-comp-stat-icon">💬</div>
                    <div className="client-comp-stat-content">
                        <div className="client-comp-stat-number">{stats.totalConsultations}</div>
                        <div className="client-comp-stat-label">총 상담</div>
                    </div>
                </div>
                <div className="client-comp-stat-card">
                    <div className="client-comp-stat-icon">✅</div>
                    <div className="client-comp-stat-content">
                        <div className="client-comp-stat-number">{stats.completionRate}%</div>
                        <div className="client-comp-stat-label">완료율</div>
                    </div>
                </div>
                    </div>

            <div className="comprehensive-content">
                {/* 내담자 목록 */}
                <div className="client-list-section">
                    <div className="section-header">
                        <h3>내담자 목록</h3>
                        <div className="filters">
                            <input
                                type="text"
                                placeholder="내담자 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">전체 상태</option>
                                <option value="ACTIVE">활성</option>
                                <option value="INACTIVE">비활성</option>
                                <option value="SUSPENDED">일시정지</option>
                                <option value="COMPLETED">완료</option>
                            </select>
                        </div>
                    </div>

                    <div className="client-grid">
                        {getFilteredClients().map(client => {
                            const mapping = mappings.find(m => m.client?.id === client.id);
                            return (
                                <div
                                    key={client.id}
                                    className={`client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
                                    onClick={() => handleClientSelect(client)}
                                >
                                    <div className="client-avatar">
                                        {client.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="client-info">
                                        <div className="client-name">{client.name || '이름 없음'}</div>
                                        <div className="client-email">{client.email}</div>
                                        <div className="client-status">
                                            {mapping ? (
                                                <span
                                                    className="status-badge"
                                                    style={{ backgroundColor: getStatusColor(mapping.status) }}
                                                >
                                                    {getStatusText(mapping.status)}
                                                </span>
                                            ) : (
                                                <span className="status-badge no-mapping">매핑 없음</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 선택된 내담자 상세 정보 */}
                {selectedClient && (
                    <div className="client-detail-section">
                        <div className="detail-header">
                            <h3>{selectedClient.name} 상세 정보</h3>
                            <div className="tab-buttons">
                                <button
                                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    개요
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'mapping' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('mapping')}
                                >
                                    매핑 정보
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('consultations')}
                                >
                                    상담 이력
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('sessions')}
                                >
                                    회기 현황
                                </button>
                            </div>
                        </div>

                        <div className="detail-content">
                            {activeTab === 'overview' && (
                                <div className="overview-tab">
                                    <div className="overview-grid">
                                        <div className="overview-card">
                                            <h4>기본 정보</h4>
                                            <div className="info-list">
                                                <div className="info-item">
                                                    <span className="label">이름:</span>
                                                    <span className="value">{selectedClient.name}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">이메일:</span>
                                                    <span className="value">{selectedClient.email}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">가입일:</span>
                                                    <span className="value">
                                                        {selectedClient.createdAt ? 
                                                            new Date(selectedClient.createdAt).toLocaleDateString('ko-KR') : 
                                                            '알 수 없음'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overview-card">
                                            <h4>상담 현황</h4>
                                            <div className="info-list">
                                                <div className="info-item">
                                                    <span className="label">총 상담:</span>
                                                    <span className="value">{getClientConsultations().length}회</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">완료 상담:</span>
                                                    <span className="value">
                                                        {getClientConsultations().filter(c => c.status === 'COMPLETED').length}회
                                                    </span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">진행중:</span>
                                                    <span className="value">
                                                        {getClientConsultations().filter(c => c.status === 'IN_PROGRESS').length}회
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'mapping' && (
                                <div className="mapping-tab">
                                    {getClientMapping() ? (
                                        <div className="mapping-details">
                                            <div className="mapping-info">
                                                <div className="info-item">
                                                    <span className="label">상담사:</span>
                                                    <span className="value">{getClientMapping().consultant?.name || '알 수 없음'}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">매핑 상태:</span>
                                                    <span
                                                        className="value status-badge"
                                                        style={{ backgroundColor: getStatusColor(getClientMapping().status) }}
                                                    >
                                                        {getStatusText(getClientMapping().status)}
                                                    </span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">매핑일:</span>
                                                    <span className="value">
                                                        {getClientMapping().createdAt ? 
                                                            new Date(getClientMapping().createdAt).toLocaleDateString('ko-KR') : 
                                                            '알 수 없음'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-mapping">
                                            <p>이 내담자에 대한 상담사 매핑이 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'consultations' && (
                                <div className="consultations-tab">
                                    <div className="consultations-list">
                                        {getClientConsultations().length > 0 ? (
                                            getClientConsultations().map(consultation => (
                                                <div key={consultation.id} className="consultation-item">
                                                    <div className="consultation-date">
                                                        {consultation.consultationDate ? 
                                                            new Date(consultation.consultationDate).toLocaleDateString('ko-KR') : 
                                                            '날짜 없음'
                                                        }
                                                    </div>
                                                    <div className="consultation-time">
                                                        {consultation.startTime} - {consultation.endTime}
                                                    </div>
                                                    <div className="consultation-status">
                                                        <span className="status-badge">
                                                            {consultation.status === 'COMPLETED' ? '완료' : 
                                                             consultation.status === 'IN_PROGRESS' ? '진행중' : 
                                                             consultation.status || '알 수 없음'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-consultations">
                                                <p>상담 이력이 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sessions' && (
                                <div className="sessions-tab">
                                    {getClientMapping() ? (
                                        <div className="sessions-info">
                                            <div className="session-stats">
                                                <div className="session-stat">
                                                    <div className="stat-number">{getClientMapping().totalSessions || 0}</div>
                                                    <div className="stat-label">총 회기</div>
                                                </div>
                                                <div className="session-stat">
                                                    <div className="stat-number">{getClientMapping().usedSessions || 0}</div>
                                                    <div className="stat-label">사용 회기</div>
                                                </div>
                                                <div className="session-stat">
                                                    <div className="stat-number">{getClientMapping().remainingSessions || 0}</div>
                                                    <div className="stat-label">남은 회기</div>
                                                </div>
                                            </div>
                                            <div className="session-progress">
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ 
                                                            width: `${getClientMapping().totalSessions > 0 ? 
                                                                (getClientMapping().usedSessions / getClientMapping().totalSessions) * 100 : 0}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="progress-text">
                                                    {getClientMapping().totalSessions > 0 ? 
                                                        Math.round((getClientMapping().usedSessions / getClientMapping().totalSessions) * 100) : 0}% 사용됨
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-sessions">
                                            <p>회기 정보가 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
                </>
            ) : (
                /* 내담자 기본관리 탭 */
                <div className="basic-management-tab">
                    <div className="basic-management-content">
                        <h3>내담자 기본 정보 관리</h3>
                        <p>내담자의 기본 정보를 등록, 수정, 삭제할 수 있습니다.</p>
                        
                        {/* 기본관리 기능들 */}
                        <div className="basic-actions">
                            <button className="btn btn-primary">
                                ➕ 새 내담자 등록
                            </button>
                            <button className="btn btn-secondary">
                                🔄 새로고침
                            </button>
                        </div>
                        
                        {/* 내담자 목록 테이블 */}
                        <div className="basic-clients-table">
                            <div className="table-header">
                                <div className="header-cell">이름</div>
                                <div className="header-cell">이메일</div>
                                <div className="header-cell">전화번호</div>
                                <div className="header-cell">가입일</div>
                                <div className="header-cell">액션</div>
                            </div>
                            
                            {clients.length > 0 ? (
                                clients.map(client => (
                                    <div key={client.id} className="table-row">
                                        <div className="table-cell">
                                            <div className="client-name">
                                                <div className="client-avatar">
                                                    {client.name?.charAt(0) || '?'}
                                                </div>
                                                <span>{client.name || '이름 없음'}</span>
                                            </div>
                                        </div>
                                        <div className="table-cell">{client.email || '-'}</div>
                                        <div className="table-cell">{client.phone || '-'}</div>
                                        <div className="table-cell">
                                            {client.createdAt ? 
                                                new Date(client.createdAt).toLocaleDateString('ko-KR') : 
                                                '-'
                                            }
                                        </div>
                                        <div className="table-cell">
                                            <div className="action-buttons-cell">
                                                <button className="btn btn-sm btn-primary">
                                                    ✏️ 수정
                                                </button>
                                                <button className="btn btn-sm btn-danger">
                                                    🗑️ 삭제
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-data">
                                    <p>등록된 내담자가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">로딩 중...</div>
                </div>
            )}
        </div>
    );
};

export default ClientComprehensiveManagement;
