import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { withFormSubmit } from '../../utils/formSubmitWrapper';
import SimpleLayout from '../layout/SimpleLayout';
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
    
    // 모달 상태
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    useEffect(() => {
        loadAllData();
    }, []);

    // 디버깅을 위한 로딩 상태 강제 해제
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.log('로딩 상태가 너무 오래 지속됨, 강제 해제');
                setLoading(false);
            }
        }, 5000); // 5초 후 강제 해제

        return () => clearTimeout(timer);
    }, [loading]);

    /**
     * 모든 데이터 로드
     */
    const loadAllData = async () => {
        console.log('🔄 데이터 로드 시작');
        setLoading(true);
        try {
            await Promise.all([
                loadClients(),
                loadConsultants(),
                loadMappings(),
                loadConsultations()
            ]);
            console.log('✅ 데이터 로드 완료');
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
            notificationManager.error('데이터 로드에 실패했습니다.');
        } finally {
            console.log('🏁 로딩 상태 해제');
            setLoading(false);
        }
    };

    /**
     * 내담자 목록 로드
     */
    const loadClients = async () => {
        try {
            console.log('🔍 내담자 목록 로드 시작');
            
            // /api/admin/users API를 직접 사용 (복호화가 더 잘 됨)
            const response = await apiGet('/api/admin/users');
            console.log('📊 /api/admin/users 응답:', response);
            
            if (response.success) {
                let clientsData = response.data || [];
                
                // CLIENT 역할만 필터링
                if (Array.isArray(clientsData) && clientsData.length > 0) {
                    clientsData = clientsData.filter(user => user.role === 'CLIENT');
                    console.log('👥 CLIENT 역할 필터링 후:', clientsData.length, '명');
                }
                
                // 각 내담자 데이터를 상세히 로깅
                clientsData.forEach((client, index) => {
                    console.log(`👤 내담자 ${index + 1}:`, {
                        id: client.id,
                        name: client.name,
                        email: client.email,
                        phone: client.phone,
                        role: client.role,
                        isActive: client.isActive,
                        createdAt: client.createdAt
                    });
                    
                    // 전화번호가 제대로 있는지 확인
                    if (client.phone && client.phone !== '전화번호 없음' && client.phone !== '-') {
                        console.log(`✅ 전화번호 확인됨: ${client.name} - ${client.phone}`);
                    } else {
                        console.log(`❌ 전화번호 없음: ${client.name} - ${client.phone}`);
                    }
                });
                
                setClients(clientsData);
            } else {
                console.error('❌ 내담자 목록 로드 실패:', response.message);
            }
        } catch (error) {
            console.error('❌ 내담자 목록 로드 오류:', error);
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
            const response = await apiGet('/api/admin/mappings');
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
            const response = await apiGet('/api/v1/consultations');
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
                const mapping = mappings.find(m => m.clientId === client.id);
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
        return mappings.find(mapping => mapping.clientId === selectedClient.id);
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
            'ACTIVE': '#7bc87b',
            'INACTIVE': '#a8e6a3',
            'SUSPENDED': '#f59e0b',
            'COMPLETED': '#7bc87b'
        };
        return colorMap[status] || '#a8e6a3';
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

    // ==================== CRUD 함수들 ====================

    /**
     * 새 내담자 등록 모달 열기
     */
    const handleCreateClient = () => {
        setModalType('create');
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: ''
        });
        setShowModal(true);
    };

    /**
     * 내담자 수정 모달 열기
     */
    const handleEditClient = (client) => {
        setModalType('edit');
        setEditingClient(client);
        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            password: '' // 수정 시에는 비밀번호를 비워둠
        });
        setShowModal(true);
    };

    /**
     * 내담자 삭제 확인 모달 열기
     */
    const handleDeleteClient = (client) => {
        setModalType('delete');
        setEditingClient(client);
        setShowModal(true);
    };

    /**
     * 모달 닫기
     */
    const handleCloseModal = () => {
        setShowModal(false);
        setModalType('');
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: ''
        });
    };

    /**
     * 폼 데이터 변경
     */
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        
        // 전화번호 자동 하이픈 처리
        if (name === 'phone') {
            const formattedPhone = formatPhoneNumber(value);
            setFormData(prev => ({
                ...prev,
                [name]: formattedPhone
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // 전화번호 자동 하이픈 포맷팅 함수
    const formatPhoneNumber = (value) => {
        // 숫자만 추출
        const numbers = value.replace(/[^\d]/g, '');
        
        // 길이에 따라 하이픈 추가
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else if (numbers.length <= 11) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
        } else {
            // 11자리 초과시 11자리까지만
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
    };

    /**
     * 내담자 등록
     */
    const createClient = async () => {
        try {
            const response = await apiPost('/api/admin/clients', {
                username: formData.email,
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone
            });

            if (response.success) {
                notificationManager.success('내담자가 성공적으로 등록되었습니다.');
                handleCloseModal();
                loadAllData(); // 데이터 새로고침
            } else {
                notificationManager.error(response.message || '내담자 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('내담자 등록 실패:', error);
            notificationManager.error('내담자 등록에 실패했습니다.');
        }
    };

    /**
     * 내담자 수정
     */
    const updateClient = withFormSubmit(async () => {
        const updateData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
        };

        // 비밀번호가 입력된 경우에만 포함
        if (formData.password) {
            updateData.password = formData.password;
        }

        const response = await apiPut(`/api/admin/clients/${editingClient.id}`, updateData);

        if (response.success) {
            notificationManager.success('내담자 정보가 성공적으로 수정되었습니다.');
            handleCloseModal();
            loadAllData(); // 데이터 새로고침
        } else {
            notificationManager.error(response.message || '내담자 수정에 실패했습니다.');
        }
    });

    /**
     * 내담자 삭제
     */
    const deleteClient = async () => {
        try {
            const response = await apiPost(`/api/admin/clients/${editingClient.id}/delete`);

            if (response.success) {
                notificationManager.success('내담자가 성공적으로 삭제되었습니다.');
                handleCloseModal();
                loadAllData(); // 데이터 새로고침
            } else {
                notificationManager.error(response.message || '내담자 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('내담자 삭제 실패:', error);
            notificationManager.error('내담자 삭제에 실패했습니다.');
        }
    };

    /**
     * 모달 제출 처리
     */
    const handleModalSubmit = () => {
        if (modalType === 'create') {
            createClient();
        } else if (modalType === 'edit') {
            updateClient();
        } else if (modalType === 'delete') {
            deleteClient();
        }
    };

    return (
        <SimpleLayout>
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
                            const mapping = mappings.find(m => m.clientId === client.id);
                            return (
                                <div
                                    key={client.id}
                                    className={`client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
                                    onClick={() => handleClientSelect(client)}
                                >
                                    <div className="client-avatar">
                                        <FaUser />
                                    </div>
                                    <div className="client-info">
                                        <div className="client-name">{client.name || 'Unknown Client'}</div>
                                        <div className="client-email">{client.email}</div>
                                        <div className="client-phone">{client.phone || '전화번호 없음'}</div>
                                        <div className="client-grade">
                                            등급: {client.grade || 'CLIENT_BRONZE'}
                                        </div>
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
                                        <div className="client-date">
                                            등록일: {client.createdAt ? new Date(client.createdAt).toLocaleDateString('ko-KR') : '-'}
                                        </div>
                                        <div className="client-sessions">
                                            총 상담: {client.totalConsultations || 0}회
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
                                                    <span className="value">{getClientMapping().consultantName || '알 수 없음'}</span>
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
                        <p>내담자가 직접 가입하지 않은 경우, 관리자가 내담자 계정을 생성하고 기본 정보를 관리할 수 있습니다.</p>
                        
                        {/* 기본관리 기능들 */}
                        <div className="basic-actions">
                            <button className="btn btn-primary" onClick={handleCreateClient}>
                                ➕ 새 내담자 등록
                            </button>
                            <button className="btn btn-secondary" onClick={loadAllData}>
                                🔄 새로고침
                            </button>
                        </div>
                        
                        {/* 검색 및 필터 */}
                        <div className="basic-search-section">
                            <div className="search-filters">
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
                        
                        {/* 내담자 목록 카드 */}
                        <div className="basic-clients-cards">
                            {getFilteredClients().length > 0 ? (
                                getFilteredClients().map(client => {
                                    const mapping = mappings.find(m => m.clientId === client.id);
                                    return (
                                        <div key={client.id} className="basic-client-card">
                                            <div className="card-header">
                                                <div className="client-avatar">
                                                    <FaUser />
                                                </div>
                                                <div className="client-basic-info">
                                                    <h4 className="client-name">{client.name || 'Unknown Client'}</h4>
                                                    <p className="client-email">{client.email || '-'}</p>
                                                </div>
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
                                            
                                            <div className="card-body">
                                                <div className="client-details">
                                                    <div className="detail-item">
                                                        <span className="detail-label">전화번호:</span>
                                                        <span className="detail-value">{client.phone || '전화번호 없음'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">등급:</span>
                                                        <span className="detail-value">{client.grade || 'CLIENT_BRONZE'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">가입일:</span>
                                                        <span className="detail-value">
                                                            {client.createdAt ? 
                                                                new Date(client.createdAt).toLocaleDateString('ko-KR') : 
                                                                '-'
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">총 상담:</span>
                                                        <span className="detail-value">{client.totalConsultations || 0}회</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="card-footer">
                                                <div className="action-buttons">
                                                    <button 
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleEditClient(client)}
                                                    >
                                                        ✏️ 수정
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDeleteClient(client)}
                                                    >
                                                        🗑️ 삭제
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="no-data">
                                    <div className="no-data-icon">👥</div>
                                    <p>등록된 내담자가 없습니다.</p>
                                    <p className="no-data-sub">새 내담자를 등록해보세요.</p>
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

            {/* CRUD 모달 */}
            {showModal && (
                <div className="client-modal-overlay" onClick={handleCloseModal}>
                    <div className="client-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="client-modal-header">
                            <div>
                                <h3>
                                    {modalType === 'create' && '➕ 새 내담자 등록'}
                                    {modalType === 'edit' && '✏️ 내담자 정보 수정'}
                                    {modalType === 'delete' && '🗑️ 내담자 삭제'}
                                </h3>
                                {modalType === 'create' && (
                                    <p className="modal-description">
                                        내담자가 직접 가입하지 않은 경우, 관리자가 내담자 계정을 생성하고 초기 로그인 정보를 설정합니다.
                                    </p>
                                )}
                                {modalType === 'edit' && (
                                    <p className="modal-description">
                                        내담자의 기본 정보를 수정합니다.
                                    </p>
                                )}
                            </div>
                            <button className="client-modal-close" onClick={handleCloseModal}>
                                ✕
                            </button>
                        </div>
                        
                        <div className="client-modal-body">
                            {modalType === 'delete' ? (
                                <div className="delete-confirmation">
                                    <p>정말로 <strong>{editingClient?.name}</strong> 내담자를 삭제하시겠습니까?</p>
                                    <p className="warning-text">⚠️ 이 작업은 되돌릴 수 없습니다.</p>
                                </div>
                            ) : (
                                <div className="client-form">
                                    <div className="form-group">
                                        <label htmlFor="name">이름 *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            placeholder="내담자 이름을 입력하세요"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="email">이메일 *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="이메일을 입력하세요"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="phone">전화번호</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleFormChange}
                                            placeholder="010-1234-5678"
                                            maxLength="13"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="password">
                                            {modalType === 'create' ? '초기 비밀번호 *' : '새 비밀번호 (선택사항)'}
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleFormChange}
                                            placeholder={modalType === 'create' ? '내담자 로그인용 초기 비밀번호를 입력하세요' : '새 비밀번호를 입력하세요 (비워두면 기존 비밀번호 유지)'}
                                            required={modalType === 'create'}
                                        />
                                        {modalType === 'create' && (
                                            <small className="form-help">
                                                💡 관리자가 생성한 계정이므로, 내담자에게 이 초기 비밀번호를 전달해주세요. 첫 로그인 후 비밀번호 변경이 가능합니다.
                                            </small>
                                        )}
                                        {modalType === 'edit' && (
                                            <small className="form-help">
                                                💡 비밀번호를 변경하지 않으려면 비워두세요.
                                            </small>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="client-modal-footer">
                            <button className="btn btn-secondary" onClick={handleCloseModal}>
                                취소
                            </button>
                            <button 
                                className={`btn ${modalType === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleModalSubmit}
                            >
                                {modalType === 'create' && '등록'}
                                {modalType === 'edit' && '수정'}
                                {modalType === 'delete' && '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </SimpleLayout>
    );
};

export default ClientComprehensiveManagement;
