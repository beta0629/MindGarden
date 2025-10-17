import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaUser, FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import { getUserStatusKoreanName, getStatusColor } from '../../utils/consultantUtils';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import SpecialtyDisplay from '../common/SpecialtyDisplay';

const ConsultantComprehensiveManagement = () => {
    // 상태 관리
    const [consultants, setConsultants] = useState([]);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [mappings, setMappings] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState('comprehensive');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('view');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        status: 'ACTIVE',
        specialty: [],
        password: ''
    });
    const [specialtyCodes, setSpecialtyCodes] = useState([]);

    // 데이터 로드 함수들
    const loadConsultants = useCallback(async () => {
        try {
            console.log('🔄 상담사 목록 로딩 시작...');
            const response = await apiGet('/api/admin/consultants');
            console.log('📊 상담사 목록 응답:', response);
            
            if (response.success) {
                setConsultants(response.data || []);
                console.log('✅ 상담사 목록 설정 완료:', response.data?.length || 0, '명');
            } else {
                console.error('❌ 상담사 목록 로딩 실패:', response.message);
                setConsultants([]);
            }
        } catch (error) {
            console.error('❌ 상담사 목록 로딩 오류:', error);
            setConsultants([]);
        }
    }, []);

    const loadMappings = useCallback(async () => {
        try {
            const response = await apiGet('/api/admin/mappings');
            if (response.success) {
                setMappings(response.data || []);
            }
        } catch (error) {
            console.error('매칭 로딩 오류:', error);
            setMappings([]);
        }
    }, []);

    const loadSchedules = useCallback(async () => {
        try {
            const response = await apiGet('/api/admin/schedules');
            if (response.success) {
                setSchedules(response.data || []);
            }
        } catch (error) {
            console.error('스케줄 로딩 오류:', error);
            setSchedules([]);
        }
    }, []);

    const loadSpecialtyCodes = useCallback(async () => {
        try {
            const response = await apiGet('/api/common-codes/SPECIALTY');
            if (response.success) {
                setSpecialtyCodes(response.data || []);
            }
        } catch (error) {
            console.error('전문분야 코드 로딩 오류:', error);
            setSpecialtyCodes([]);
        }
    }, []);

    // 모든 데이터 로드
    const loadAllData = useCallback(async () => {
        setLoading(true);
        try {
            console.log('🚀 전체 데이터 로딩 시작...');
            
            // Promise.allSettled를 사용하여 일부 API가 실패해도 계속 진행
            const results = await Promise.allSettled([
                loadConsultants(),
                loadMappings(),
                loadSchedules(),
                loadSpecialtyCodes()
            ]);

            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const apiNames = ['상담사', '매칭', '스케줄', '전문분야'];
                    console.error(`❌ ${apiNames[index]} 로딩 실패:`, result.reason);
                }
            });

            console.log('✅ 전체 데이터 로딩 완료');
        } catch (error) {
            console.error('❌ 전체 데이터 로딩 오류:', error);
        } finally {
            setLoading(false);
        }
    }, [loadConsultants, loadMappings, loadSchedules, loadSpecialtyCodes]);

    // 초기 로드
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // 강제 새로고침 이벤트 리스너
    useEffect(() => {
        const handleForceRefresh = (event) => {
            if (event.detail === 'consultant-management') {
                console.log('🔄 강제 새로고침 이벤트 수신');
                loadAllData();
            }
        };

        window.addEventListener('forceRefresh', handleForceRefresh);
        return () => window.removeEventListener('forceRefresh', handleForceRefresh);
    }, [loadAllData]);

    // 필터링된 상담사 목록
    const getFilteredConsultants = useMemo(() => {
        console.log('🔍 상담사 필터링 시작:', { searchTerm, filterStatus, consultants: consultants.length });
        
        let filtered = consultants;

        // 검색어 필터링
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(consultant => 
                consultant.name?.toLowerCase().includes(term) ||
                consultant.email?.toLowerCase().includes(term) ||
                consultant.phone?.includes(term)
            );
        }

        // 상태 필터링
        if (filterStatus && filterStatus !== 'ALL' && filterStatus !== 'all') {
            filtered = filtered.filter(consultant => consultant.status === filterStatus);
        }

        console.log('✅ 필터링 결과:', filtered.length, '명');
        return filtered;
    }, [consultants, searchTerm, filterStatus]);

    // 통계 계산
    const getOverallStats = useCallback(() => {
        const totalConsultants = consultants.length;
        const activeMappings = mappings.filter(m => m.status === 'ACTIVE').length;
        const totalSchedules = schedules.length;
        const todaySchedules = schedules.filter(s => {
            const scheduleDate = new Date(s.scheduleDate);
            const today = new Date();
            return scheduleDate.toDateString() === today.toDateString();
        }).length;

        return {
            totalConsultants,
            activeMappings,
            totalSchedules,
            todaySchedules
        };
    }, [consultants, mappings, schedules]);

    // 상담사 선택 핸들러
    const handleConsultantSelect = useCallback((consultant) => {
        console.log('👤 상담사 선택:', consultant);
        setSelectedConsultant(consultant);
        setModalType('view');
        setShowModal(true);
    }, []);

    // 모달 관련 핸들러들
    const handleOpenModal = useCallback((type, consultant = null) => {
        setModalType(type);
        if (consultant) {
            setSelectedConsultant(consultant);
            if (type === 'edit') {
                setFormData({
                    name: consultant.name || '',
                    email: consultant.email || '',
                    phone: consultant.phone || '',
                    status: consultant.status || 'ACTIVE',
                    specialty: consultant.specialties || [],
                    password: ''
                });
            }
        } else if (type === 'create') {
            setFormData({
                name: '',
                email: '',
                phone: '',
                status: 'ACTIVE',
                specialty: [],
                password: ''
            });
        }
        setShowModal(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setModalType('view');
        setSelectedConsultant(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            status: 'ACTIVE',
            specialty: [],
            password: ''
        });
    }, []);

    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleSpecialtyChange = useCallback((e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({
            ...prev,
            specialty: selectedOptions
        }));
    }, []);

    // CRUD 작업들
    const createConsultant = useCallback(async (data) => {
        try {
            const response = await apiPost('/api/admin/consultants', data);
            if (response.success) {
                await loadConsultants();
                return { success: true, message: '상담사가 성공적으로 등록되었습니다.' };
            } else {
                return { success: false, message: response.message || '상담사 등록에 실패했습니다.' };
            }
        } catch (error) {
            console.error('상담사 등록 오류:', error);
            return { success: false, message: '상담사 등록 중 오류가 발생했습니다.' };
        }
    }, [loadConsultants]);

    const updateConsultant = useCallback(async (id, data) => {
        try {
            const response = await apiPut(`/api/admin/consultants/${id}`, data);
            if (response.success) {
                await loadConsultants();
                return { success: true, message: '상담사 정보가 성공적으로 수정되었습니다.' };
            } else {
                return { success: false, message: response.message || '상담사 수정에 실패했습니다.' };
            }
        } catch (error) {
            console.error('상담사 수정 오류:', error);
            return { success: false, message: '상담사 수정 중 오류가 발생했습니다.' };
        }
    }, [loadConsultants]);

    const deleteConsultant = useCallback(async (id) => {
        try {
            const response = await apiDelete(`/api/admin/consultants/${id}`);
            if (response.success) {
                await loadConsultants();
                return { success: true, message: '상담사가 성공적으로 삭제되었습니다.' };
            } else {
                return { success: false, message: response.message || '상담사 삭제에 실패했습니다.' };
            }
        } catch (error) {
            console.error('상담사 삭제 오류:', error);
            return { success: false, message: '상담사 삭제 중 오류가 발생했습니다.' };
        }
    }, [loadConsultants]);

    // 모달 제출 핸들러
    const handleModalSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        try {
            let result;
            
            if (modalType === 'create') {
                result = await createConsultant(formData);
            } else if (modalType === 'edit') {
                result = await updateConsultant(selectedConsultant.id, formData);
            } else if (modalType === 'delete') {
                result = await deleteConsultant(selectedConsultant.id);
            }

            if (result.success) {
                alert(result.message);
                handleCloseModal();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('모달 제출 오류:', error);
            alert('작업 중 오류가 발생했습니다.');
        }
    }, [modalType, formData, selectedConsultant, createConsultant, updateConsultant, deleteConsultant, handleCloseModal]);

    const stats = getOverallStats();

    return (
        <SimpleLayout>
            <div className="mg-session-management-redesign">
                <div className="mg-section-header">
                    <div className="mg-section-header-content">
                        <div className="mg-section-header-left">
                            <FaUser className="mg-section-icon" />
                            <div>
                                <h2 className="mg-section-title">상담사 관리</h2>
                                <p className="mg-section-subtitle">상담사의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 메인 탭 메뉴 */}
                <div className="mg-session-tabs">
                    <button
                        className={`mg-tab ${mainTab === 'comprehensive' ? 'mg-tab-active' : ''}`}
                        onClick={() => setMainTab('comprehensive')}
                    >
                        📊 상담사 종합관리
                    </button>
                    <button
                        className={`mg-tab ${mainTab === 'basic' ? 'mg-tab-active' : ''}`}
                        onClick={() => setMainTab('basic')}
                    >
                        👤 상담사 기본관리
                    </button>
                </div>

                {/* 메인 탭 내용 */}
                <div className="mg-session-main-content">
                    {mainTab === 'comprehensive' ? (
                        <div className="mg-session-section">
                            {/* 전체 통계 */}
                            <div className="mg-session-stats-grid">
                                <div className="mg-stat-card">
                                    <div className="mg-stat-card-icon">👨‍⚕️</div>
                                    <div className="mg-stat-card-content">
                                        <div className="mg-stat-card-value">{stats.totalConsultants}</div>
                                        <div className="mg-stat-card-label">총 상담사</div>
                                    </div>
                                </div>
                                <div className="mg-stat-card">
                                    <div className="mg-stat-card-icon">🔗</div>
                                    <div className="mg-stat-card-content">
                                        <div className="mg-stat-card-value">{stats.activeMappings}</div>
                                        <div className="mg-stat-card-label">활성 매칭</div>
                                    </div>
                                </div>
                                <div className="mg-stat-card">
                                    <div className="mg-stat-card-icon">📅</div>
                                    <div className="mg-stat-card-content">
                                        <div className="mg-stat-card-value">{stats.totalSchedules}</div>
                                        <div className="mg-stat-card-label">총 스케줄</div>
                                    </div>
                                </div>
                                <div className="mg-stat-card">
                                    <div className="mg-stat-card-icon">📋</div>
                                    <div className="mg-stat-card-content">
                                        <div className="mg-stat-card-value">{stats.todaySchedules}</div>
                                        <div className="mg-stat-card-label">오늘 스케줄</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mg-section-header">
                                <div className="mg-section-header-content">
                                    <div className="mg-section-header-left">
                                        <h3 className="mg-section-title">상담사 목록</h3>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mg-search-filter-section">
                                <input
                                    type="text"
                                    placeholder="상담사 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mg-form-input"
                                />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="mg-form-select"
                                >
                                    <option value="all">전체</option>
                                    <option value="ACTIVE">활성</option>
                                    <option value="INACTIVE">비활성</option>
                                    <option value="SUSPENDED">일시정지</option>
                                </select>
                            </div>

                            <div className="mg-card-grid">
                                {getFilteredConsultants.map(consultant => (
                                    <div
                                        key={consultant.id}
                                        className={`mg-card mg-card-glass ${selectedConsultant?.id === consultant.id ? 'selected' : ''}`}
                                        onClick={() => handleConsultantSelect(consultant)}
                                    >
                                        <div className="mg-card-avatar">
                                            {consultant.name ? consultant.name.charAt(0) : '?'}
                                        </div>
                                        <div className="mg-card-content">
                                            <div className="mg-card-title">{consultant.name || '이름 없음'}</div>
                                            <div className="mg-card-subtitle">{consultant.email}</div>
                                            <div className="mg-card-meta">
                                                <div className="mg-card-meta-item">
                                                    <span className="mg-card-meta-label">전화번호:</span>
                                                    <span className="mg-card-meta-value">{consultant.phone || '전화번호 없음'}</span>
                                                </div>
                                                <div className="mg-card-meta-item">
                                                    <span className="mg-card-meta-label">전문분야:</span>
                                                    <span className="mg-card-meta-value">
                                                        <SpecialtyDisplay 
                                                            consultant={consultant} 
                                                            variant="text" 
                                                            showTitle={false}
                                                        />
                                                    </span>
                                                </div>
                                                <div className="mg-card-meta-item">
                                                    <span className="mg-card-meta-label">가입일:</span>
                                                    <span className="mg-card-meta-value">{consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mg-session-section">
                            <div className="mg-section-header">
                                <div className="mg-section-header-content">
                                    <div className="mg-section-header-left">
                                        <h2 className="mg-section-title">상담사 기본 정보 관리</h2>
                                        <p className="mg-section-subtitle">상담사의 기본 정보를 등록, 수정, 삭제할 수 있습니다.</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 기본관리 기능들 */}
                            <div className="mg-form-actions">
                                <button 
                                    className="mg-btn mg-btn-primary"
                                    onClick={() => handleOpenModal('create')}
                                >
                                    ➕ 새 상담사 등록
                                </button>
                                <button 
                                    className="mg-btn mg-btn-secondary"
                                    onClick={loadConsultants}
                                >
                                    🔄 새로고침
                                </button>
                            </div>

                            {/* 상담사 목록 - 상담사 종합관리와 동일한 디자인 */}
                            <div className="mg-section-header">
                                <div className="mg-section-header-content">
                                    <div className="mg-section-header-left">
                                        <h3 className="mg-section-title">상담사 목록</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="mg-search-filter-section">
                                <input
                                    type="text"
                                    placeholder="상담사 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mg-form-input"
                                />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="mg-form-select"
                                >
                                    <option value="all">전체</option>
                                    <option value="ACTIVE">활성</option>
                                    <option value="INACTIVE">비활성</option>
                                    <option value="SUSPENDED">일시정지</option>
                                </select>
                            </div>

                            <div className="mg-card-grid">
                                {getFilteredConsultants.map(consultant => (
                                    <div
                                        key={consultant.id}
                                        className="mg-card mg-card-glass"
                                    >
                                        <div className="mg-card-avatar">
                                            {consultant.name ? consultant.name.charAt(0) : '?'}
                                        </div>
                                        <div className="mg-card-content">
                                            <div className="mg-card-title">{consultant.name || '이름 없음'}</div>
                                            <div className="mg-card-subtitle">{consultant.email}</div>
                                            <div className="mg-card-meta">
                                                <div className="mg-card-meta-item">
                                                    <span className="mg-card-meta-label">전화번호:</span>
                                                    <span className="mg-card-meta-value">{consultant.phone || '전화번호 없음'}</span>
                                                </div>
                                                <div className="mg-card-meta-item">
                                                    <span className="mg-card-meta-label">전문분야:</span>
                                                    <span className="mg-card-meta-value">
                                                        <SpecialtyDisplay 
                                                            consultant={consultant} 
                                                            variant="text" 
                                                            showTitle={false}
                                                        />
                                                    </span>
                                                </div>
                                                <div className="mg-card-meta-item">
                                                    <span className="mg-card-meta-label">가입일:</span>
                                                    <span className="mg-card-meta-value">{consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* 수정/삭제 버튼 추가 */}
                                        <div className="mg-card-actions">
                                            <button 
                                                className="mg-btn mg-btn-sm mg-btn-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenModal('edit', consultant);
                                                }}
                                            >
                                                <i className="bi bi-pencil"></i>
                                                수정
                                            </button>
                                            <button 
                                                className="mg-btn mg-btn-sm mg-btn-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenModal('delete', consultant);
                                                }}
                                            >
                                                <i className="bi bi-trash"></i>
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 모달 */}
            {showModal && (
                <div className="mg-modal-overlay">
                    <div className="mg-modal mg-modal-large">
                        <div className="mg-modal-header">
                            <h3 className="mg-modal-title">
                                {modalType === 'create' && '새 상담사 등록'}
                                {modalType === 'edit' && '상담사 정보 수정'}
                                {modalType === 'delete' && '상담사 삭제'}
                                {modalType === 'view' && '상담사 상세 정보'}
                            </h3>
                            <button className="mg-modal-close" onClick={handleCloseModal}>
                                <FaEdit />
                            </button>
                        </div>

                        {modalType === 'view' ? (
                            <div className="mg-modal-body">
                                {selectedConsultant && (
                                    <div className="mg-consultant-detail">
                                        <div className="mg-consultant-detail-header">
                                            <div className="mg-consultant-detail-avatar">
                                                {selectedConsultant.name ? selectedConsultant.name.charAt(0) : '?'}
                                            </div>
                                            <div className="mg-consultant-detail-info">
                                                <h4 className="mg-consultant-detail-name">{selectedConsultant.name || '이름 없음'}</h4>
                                                <p className="mg-consultant-detail-email">{selectedConsultant.email}</p>
                                                <span className={`mg-status-badge`}>
                                                    {getUserStatusKoreanName(selectedConsultant.status)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="mg-consultant-detail-content">
                                            <div className="mg-detail-section">
                                                <h5>기본 정보</h5>
                                                <div className="mg-detail-grid">
                                                    <div className="mg-detail-item">
                                                        <span className="mg-detail-label">전화번호:</span>
                                                        <span className="mg-detail-value">{selectedConsultant.phone || '전화번호 없음'}</span>
                                                    </div>
                                                    <div className="mg-detail-item">
                                                        <span className="mg-detail-label">가입일:</span>
                                                        <span className="mg-detail-value">
                                                            {selectedConsultant.createdAt ? new Date(selectedConsultant.createdAt).toLocaleDateString('ko-KR') : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mg-detail-section">
                                                <h5>전문분야</h5>
                                                <div className="mg-specialty-list">
                                                    {selectedConsultant.specialties?.map((specialty, index) => (
                                                        <span key={index} className="mg-specialty-tag">
                                                            {specialty}
                                                        </span>
                                                    )) || <span className="mg-no-data">전문분야 정보가 없습니다.</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mg-modal-body">
                                <form className="mg-form">
                                    <div className="mg-form-group">
                                        <label className="mg-form-label">이름 *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            placeholder="상담사 이름을 입력하세요"
                                            className="mg-form-input"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="mg-form-group">
                                        <label className="mg-form-label">이메일 *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="이메일을 입력하세요"
                                            className="mg-form-input"
                                            required
                                        />
                                    </div>

                                    <div className="mg-form-group">
                                        <label className="mg-form-label">전문분야</label>
                                        <div className="mg-form-help">
                                            <span>💡</span>
                                            <span>Ctrl(Windows) 또는 Cmd(Mac)를 누르고 클릭하여 여러 개 선택할 수 있습니다.</span>
                                        </div>
                                        {console.log('🔍 다중선택 필드 렌더링:', {
                                            formDataSpecialty: formData.specialty,
                                            specialtyType: typeof formData.specialty,
                                            isArray: Array.isArray(formData.specialty),
                                            specialtyCodes: specialtyCodes.map(c => ({code: c.code || c.codeValue, name: c.name || c.codeLabel}))
                                        })}
                                        <select
                                            name="specialty"
                                            value={formData.specialty}
                                            onChange={handleSpecialtyChange}
                                            multiple
                                            size="6"
                                            className="mg-form-select mg-form-select-multiple"
                                        >
                                            {specialtyCodes.length > 0 ? (
                                                specialtyCodes.map(code => {
                                                    const isSelected = Array.isArray(formData.specialty) && formData.specialty.includes(code.codeValue);
                                                    return (
                                                        <option 
                                                            key={code.id || code.codeValue} 
                                                            value={code.codeValue}
                                                            className={isSelected ? 'mg-option-selected' : ''}
                                                        >
                                                            {code.icon ? `${code.icon} ` : ''}{code.codeLabel}
                                                        </option>
                                                    );
                                                })
                                            ) : (
                                                <option disabled>전문분야 코드를 불러오는 중...</option>
                                            )}
                                        </select>
                                        <small className="mg-form-help">
                                            💡 Ctrl(Windows) 또는 Cmd(Mac)를 누르고 클릭하여 여러 개 선택할 수 있습니다.
                                        </small>
                                    </div>
                                    
                                    <div className="mg-form-group">
                                        <label className="mg-form-label">
                                            {modalType === 'create' ? '비밀번호 *' : '새 비밀번호'}
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleFormChange}
                                            placeholder={modalType === 'create' ? '비밀번호를 입력하세요' : '새 비밀번호를 입력하세요 (선택사항)'}
                                            className="mg-form-input"
                                            required={modalType === 'create'}
                                        />
                                    </div>
                                    
                                    <div className="mg-form-actions">
                                        <button type="button" className="mg-btn mg-btn-secondary" onClick={handleCloseModal}>
                                            취소
                                        </button>
                                        <button 
                                            type="submit"
                                            className={`mg-btn ${modalType === 'delete' ? 'mg-btn-danger' : 'mg-btn-primary'}`}
                                            onClick={handleModalSubmit}
                                        >
                                            {modalType === 'create' && '등록'}
                                            {modalType === 'edit' && '수정'}
                                            {modalType === 'delete' && '삭제'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading && <LoadingSpinner />}
        </SimpleLayout>
    );
};

export default ConsultantComprehensiveManagement;