import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import './ConsultantComprehensiveManagement.css';

/**
 * 상담사 종합관리 컴포넌트
 * - 상담사 정보 종합 조회
 * - 상담 이력 관리
 * - 스케줄 현황 관리
 * - 내담자 매핑 관리
 * - 통계 및 분석
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ConsultantComprehensiveManagement = () => {
    const [loading, setLoading] = useState(false);
    const [consultants, setConsultants] = useState([]);
    const [clients, setClients] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
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
                loadConsultants(),
                loadClients(),
                loadMappings(),
                loadSchedules()
            ]);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            notificationManager.error('데이터 로드에 실패했습니다.');
        } finally {
            setLoading(false);
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
     * 스케줄 목록 로드
     */
    const loadSchedules = async () => {
        try {
            const response = await apiGet('/api/schedules?userId=0&userRole=ADMIN');
            if (response.success) {
                setSchedules(response.data || []);
            }
        } catch (error) {
            console.error('스케줄 목록 로드 실패:', error);
        }
    };

    /**
     * 상담사 선택 처리
     */
    const handleConsultantSelect = (consultant) => {
        setSelectedConsultant(consultant);
        setActiveTab('overview');
    };

    /**
     * 필터링된 상담사 목록
     */
    const getFilteredConsultants = () => {
        let filtered = consultants;

        // 검색어 필터링
        if (searchTerm) {
            filtered = filtered.filter(consultant =>
                consultant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                consultant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                consultant.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    };

    /**
     * 선택된 상담사의 매핑 정보
     */
    const getConsultantMappings = () => {
        if (!selectedConsultant) return [];
        return mappings.filter(mapping => mapping.consultant?.id === selectedConsultant.id);
    };

    /**
     * 선택된 상담사의 스케줄
     */
    const getConsultantSchedules = () => {
        if (!selectedConsultant) return [];
        return schedules.filter(schedule => schedule.consultantId === selectedConsultant.id);
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
        const totalConsultants = consultants.length;
        const activeMappings = mappings.filter(m => m.status === 'ACTIVE').length;
        const totalSchedules = schedules.length;
        const todaySchedules = schedules.filter(s => {
            const today = new Date().toISOString().split('T')[0];
            return s.date === today;
        }).length;

        return {
            totalConsultants,
            activeMappings,
            totalSchedules,
            todaySchedules
        };
    };

    const stats = getOverallStats();

    return (
        <div className="consultant-comp-container">
            <div className="consultant-comp-header">
                <h2>👨‍⚕️ 상담사 관리</h2>
                <p>상담사의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다.</p>
                
                {/* 메인 탭 메뉴 */}
                <div className="consultant-comp-main-tab-buttons">
                    <button
                        className={`consultant-comp-main-tab-btn ${mainTab === 'comprehensive' ? 'active' : ''}`}
                        onClick={() => setMainTab('comprehensive')}
                    >
                        📊 상담사 종합관리
                    </button>
                    <button
                        className={`consultant-comp-main-tab-btn ${mainTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setMainTab('basic')}
                    >
                        👤 상담사 기본관리
                    </button>
                </div>
            </div>

            {/* 메인 탭 내용 */}
            {mainTab === 'comprehensive' ? (
                <>
                    {/* 전체 통계 */}
                    <div className="consultant-comp-stats-overview">
                        <div className="consultant-comp-stat-card">
                            <div className="consultant-comp-stat-icon">👨‍⚕️</div>
                            <div className="consultant-comp-stat-content">
                                <div className="consultant-comp-stat-number">{stats.totalConsultants}</div>
                                <div className="consultant-comp-stat-label">총 상담사</div>
                            </div>
                        </div>
                        <div className="consultant-comp-stat-card">
                            <div className="consultant-comp-stat-icon">🔗</div>
                            <div className="consultant-comp-stat-content">
                                <div className="consultant-comp-stat-number">{stats.activeMappings}</div>
                                <div className="consultant-comp-stat-label">활성 매핑</div>
                            </div>
                        </div>
                        <div className="consultant-comp-stat-card">
                            <div className="consultant-comp-stat-icon">📅</div>
                            <div className="consultant-comp-stat-content">
                                <div className="consultant-comp-stat-number">{stats.totalSchedules}</div>
                                <div className="consultant-comp-stat-label">총 스케줄</div>
                            </div>
                        </div>
                        <div className="consultant-comp-stat-card">
                            <div className="consultant-comp-stat-icon">📋</div>
                            <div className="consultant-comp-stat-content">
                                <div className="consultant-comp-stat-number">{stats.todaySchedules}</div>
                                <div className="consultant-comp-stat-label">오늘 스케줄</div>
                            </div>
                        </div>
                    </div>

                    <div className="consultant-comp-comprehensive-content">
                        {/* 상담사 목록 */}
                        <div className="consultant-comp-consultant-list-section">
                            <div className="consultant-comp-section-header">
                                <h3>상담사 목록</h3>
                                <div className="consultant-comp-filters">
                                    <input
                                        type="text"
                                        placeholder="상담사 검색..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="consultant-comp-search-input"
                                    />
                                </div>
                            </div>

                            <div className="consultant-comp-consultant-grid">
                                {getFilteredConsultants().map(consultant => (
                                    <div
                                        key={consultant.id}
                                        className={`consultant-comp-consultant-card ${selectedConsultant?.id === consultant.id ? 'selected' : ''}`}
                                        onClick={() => handleConsultantSelect(consultant)}
                                    >
                                        <div className="consultant-comp-consultant-avatar">
                                            {consultant.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="consultant-comp-consultant-info">
                                            <div className="consultant-comp-consultant-name">{consultant.name || '이름 없음'}</div>
                                            <div className="consultant-comp-consultant-email">{consultant.email}</div>
                                            <div className="consultant-comp-consultant-specialty">{consultant.specialty || '전문분야 미설정'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 선택된 상담사 상세 정보 */}
                        {selectedConsultant && (
                            <div className="consultant-detail-section">
                                <div className="detail-header">
                                    <h3>{selectedConsultant.name} 상세 정보</h3>
                                    <div className="tab-buttons">
                                        <button
                                            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('overview')}
                                        >
                                            개요
                                        </button>
                                        <button
                                            className={`tab-btn ${activeTab === 'mappings' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('mappings')}
                                        >
                                            매핑 정보
                                        </button>
                                        <button
                                            className={`tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('schedules')}
                                        >
                                            스케줄 현황
                                        </button>
                                        <button
                                            className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('clients')}
                                        >
                                            담당 내담자
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
                                                            <span className="value">{selectedConsultant.name}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">이메일:</span>
                                                            <span className="value">{selectedConsultant.email}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">전문분야:</span>
                                                            <span className="value">{selectedConsultant.specialty || '미설정'}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">가입일:</span>
                                                            <span className="value">
                                                                {selectedConsultant.createdAt ? 
                                                                    new Date(selectedConsultant.createdAt).toLocaleDateString('ko-KR') : 
                                                                    '알 수 없음'
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="overview-card">
                                                    <h4>업무 현황</h4>
                                                    <div className="info-list">
                                                        <div className="info-item">
                                                            <span className="label">담당 내담자:</span>
                                                            <span className="value">{getConsultantMappings().length}명</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">총 스케줄:</span>
                                                            <span className="value">{getConsultantSchedules().length}개</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="label">오늘 스케줄:</span>
                                                            <span className="value">
                                                                {getConsultantSchedules().filter(s => {
                                                                    const today = new Date().toISOString().split('T')[0];
                                                                    return s.date === today;
                                                                }).length}개
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'mappings' && (
                                        <div className="mappings-tab">
                                            <div className="mappings-list">
                                                {getConsultantMappings().length > 0 ? (
                                                    getConsultantMappings().map(mapping => (
                                                        <div key={mapping.id} className="mapping-item">
                                                            <div className="mapping-client">
                                                                {mapping.client?.name || '알 수 없음'}
                                                            </div>
                                                            <div className="mapping-sessions">
                                                                {mapping.usedSessions || 0} / {mapping.totalSessions || 0} 회기
                                                            </div>
                                                            <div className="mapping-status">
                                                                <span
                                                                    className="status-badge"
                                                                    style={{ backgroundColor: getStatusColor(mapping.status) }}
                                                                >
                                                                    {getStatusText(mapping.status)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="no-mappings">
                                                        <p>담당 내담자가 없습니다.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'schedules' && (
                                        <div className="schedules-tab">
                                            <div className="schedules-list">
                                                {getConsultantSchedules().length > 0 ? (
                                                    getConsultantSchedules().slice(0, 10).map(schedule => (
                                                        <div key={schedule.id} className="schedule-item">
                                                            <div className="schedule-date">
                                                                {schedule.date ? 
                                                                    new Date(schedule.date).toLocaleDateString('ko-KR') : 
                                                                    '날짜 없음'
                                                                }
                                                            </div>
                                                            <div className="schedule-time">
                                                                {schedule.startTime} - {schedule.endTime}
                                                            </div>
                                                            <div className="schedule-client">
                                                                {schedule.clientName || '내담자 없음'}
                                                            </div>
                                                            <div className="schedule-status">
                                                                <span className="status-badge">
                                                                    {schedule.status === 'BOOKED' ? '예약됨' : 
                                                                     schedule.status === 'COMPLETED' ? '완료' : 
                                                                     schedule.status === 'CANCELLED' ? '취소' : 
                                                                     schedule.status || '알 수 없음'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="no-schedules">
                                                        <p>스케줄이 없습니다.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'clients' && (
                                        <div className="clients-tab">
                                            <div className="clients-list">
                                                {getConsultantMappings().length > 0 ? (
                                                    getConsultantMappings().map(mapping => (
                                                        <div key={mapping.id} className="client-item">
                                                            <div className="client-avatar">
                                                                {mapping.client?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div className="client-info">
                                                                <div className="client-name">{mapping.client?.name || '알 수 없음'}</div>
                                                                <div className="client-email">{mapping.client?.email}</div>
                                                                <div className="client-sessions">
                                                                    남은 회기: {mapping.remainingSessions || 0}회
                                                                </div>
                                                            </div>
                                                            <div className="client-status">
                                                                <span
                                                                    className="status-badge"
                                                                    style={{ backgroundColor: getStatusColor(mapping.status) }}
                                                                >
                                                                    {getStatusText(mapping.status)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="no-clients">
                                                        <p>담당 내담자가 없습니다.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* 상담사 기본관리 탭 */
                <div className="basic-management-tab">
                    <div className="basic-management-content">
                        <h3>상담사 기본 정보 관리</h3>
                        <p>상담사의 기본 정보를 등록, 수정, 삭제할 수 있습니다.</p>
                        
                        {/* 기본관리 기능들 */}
                        <div className="basic-actions">
                            <button className="btn btn-primary">
                                ➕ 새 상담사 등록
                            </button>
                            <button className="btn btn-secondary">
                                🔄 새로고침
                            </button>
                        </div>
                        
                        {/* 상담사 목록 테이블 */}
                        <div className="basic-consultants-table">
                            <div className="table-header">
                                <div className="header-cell">이름</div>
                                <div className="header-cell">이메일</div>
                                <div className="header-cell">전문분야</div>
                                <div className="header-cell">가입일</div>
                                <div className="header-cell">액션</div>
                            </div>
                            
                            {consultants.length > 0 ? (
                                consultants.map(consultant => (
                                    <div key={consultant.id} className="table-row">
                                        <div className="table-cell">
                                            <div className="consultant-name">
                                                <div className="consultant-avatar">
                                                    {consultant.name?.charAt(0) || '?'}
                                                </div>
                                                <span>{consultant.name || '이름 없음'}</span>
                                            </div>
                                        </div>
                                        <div className="table-cell">{consultant.email || '-'}</div>
                                        <div className="table-cell">{consultant.specialty || '-'}</div>
                                        <div className="table-cell">
                                            {consultant.createdAt ? 
                                                new Date(consultant.createdAt).toLocaleDateString('ko-KR') : 
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
                                    <p>등록된 상담사가 없습니다.</p>
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

export default ConsultantComprehensiveManagement;
