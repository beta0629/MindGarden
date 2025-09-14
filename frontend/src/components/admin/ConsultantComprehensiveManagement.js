import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import { 
    getUserStatusKoreanName,
    getUserGradeKoreanName,
    getUserGradeIcon,
    getStatusColor
} from '../../utils/codeHelper';
import notificationManager from '../../utils/notification';
import { withFormSubmit } from '../../utils/formSubmitWrapper';
import SimpleLayout from '../layout/SimpleLayout';
import { FaUser } from 'react-icons/fa';
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
    
    // 모달 상태
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
    const [editingConsultant, setEditingConsultant] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialty: [],
        password: ''
    });
    
    // 공통 코드 상태
    const [specialtyCodes, setSpecialtyCodes] = useState([]);

    useEffect(() => {
        loadAllData();
        loadSpecialtyCodes();
    }, []);

    // 전문분야 섹션 스타일 강제 적용
    useEffect(() => {
        const applySpecialtyStyles = () => {
            const specialtyElements = document.querySelectorAll('.basic-management-tab .consultant-specialty-display');
            specialtyElements.forEach(element => {
                // 기존 스타일 제거
                element.style.cssText = '';
                
                // 새로운 스타일 강제 적용
                element.style.setProperty('font-size', '14px', 'important');
                element.style.setProperty('color', '#374151', 'important');
                element.style.setProperty('line-height', '1.6', 'important');
                element.style.setProperty('background', '#f0f9ff', 'important');
                element.style.setProperty('padding', '16px 20px', 'important');
                element.style.setProperty('border-radius', '8px', 'important');
                element.style.setProperty('border', '1px solid #e0f2fe', 'important');
                element.style.setProperty('word-wrap', 'break-word', 'important');
                element.style.setProperty('word-break', 'break-word', 'important');
                element.style.setProperty('white-space', 'normal', 'important');
                element.style.setProperty('min-height', '100px', 'important');
                element.style.setProperty('max-height', '120px', 'important');
                element.style.setProperty('display', 'flex', 'important');
                element.style.setProperty('align-items', 'center', 'important');
                element.style.setProperty('justify-content', 'center', 'important');
                element.style.setProperty('text-align', 'center', 'important');
                element.style.setProperty('width', '100%', 'important');
                element.style.setProperty('max-width', '100%', 'important');
                element.style.setProperty('overflow', 'hidden', 'important');
                element.style.setProperty('text-overflow', 'ellipsis', 'important');
                element.style.setProperty('transform', 'none', 'important');
                element.style.setProperty('position', 'relative', 'important');
                element.style.setProperty('z-index', '999', 'important');
                element.style.setProperty('font-weight', '500', 'important');
                element.style.setProperty('box-sizing', 'border-box', 'important');
                element.style.setProperty('margin', '0', 'important');
                element.style.setProperty('border-collapse', 'separate', 'important');
                element.style.setProperty('border-spacing', '0', 'important');
                element.style.setProperty('vertical-align', 'baseline', 'important');
                element.style.setProperty('text-decoration', 'none', 'important');
                element.style.setProperty('text-shadow', 'none', 'important');
                element.style.setProperty('box-shadow', 'none', 'important');
                element.style.setProperty('outline', 'none', 'important');
                element.style.setProperty('resize', 'none', 'important');
                element.style.setProperty('appearance', 'none', 'important');
                element.style.setProperty('-webkit-appearance', 'none', 'important');
                element.style.setProperty('-moz-appearance', 'none', 'important');
            });
        };

        // 컴포넌트 마운트 후 적용
        setTimeout(applySpecialtyStyles, 100);
        
        // 상담사 데이터 로드 후 적용
        if (consultants.length > 0) {
            setTimeout(applySpecialtyStyles, 200);
        }
    }, [consultants]);

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
            const today = new Date().toISOString().split('T')[0];
            const response = await apiGet(`/api/admin/consultants/with-vacation?date=${today}`);
            console.log('🔍 통합 상담사 데이터 로드 응답:', response);
            if (response.success) {
                console.log('📋 통합 상담사 데이터:', response.data);
                // isActive가 true인 상담사만 표시 (삭제된 상담사 제외)
                const activeConsultants = (response.data || []).filter(consultant => consultant.isActive !== false);
                setConsultants(activeConsultants);
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
            const response = await apiGet('/api/admin/clients/with-mapping-info');
            if (response.success) {
                setClients(response.data || []);
            }
        } catch (error) {
            console.error('통합 내담자 데이터 로드 실패:', error);
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
     * 전문분야 공통 코드 로드
     */
    const loadSpecialtyCodes = async () => {
        try {
            console.log('🔍 전문분야 코드 로드 시작...');
            console.log('🌐 API URL:', '/api/admin/common-codes/values?groupCode=SPECIALTY');
            
            const response = await apiGet('/api/admin/common-codes/values?groupCode=SPECIALTY');
            console.log('📋 새로운 API 응답:', response);
            console.log('📋 응답 타입:', typeof response);
            console.log('📋 응답 길이:', response?.length);
            
            if (response && Array.isArray(response) && response.length > 0) {
                console.log('✅ 새로운 API로 전문분야 코드 로드 성공:', response.length, '개');
                console.log('📋 첫 번째 코드:', response[0]);
                setSpecialtyCodes(response);
            } else {
                console.log('⚠️ 새로운 API 응답이 비어있음, 기존 API 시도...');
                // 기존 CommonCode API도 시도
                const fallbackResponse = await apiGet('/api/admin/common-codes/SPECIALTY');
                console.log('📋 기존 API 응답:', fallbackResponse);
                if (fallbackResponse.success) {
                    console.log('✅ 기존 API로 전문분야 코드 로드 성공:', fallbackResponse.data?.length || 0, '개');
                    setSpecialtyCodes(fallbackResponse.data || []);
                }
            }
        } catch (error) {
            console.error('❌ 전문분야 코드 로드 실패:', error);
            console.error('❌ 에러 상세:', error.message);
            console.error('❌ 에러 스택:', error.stack);
            
            // 기존 CommonCode API로 폴백
            try {
                console.log('🔄 기존 API로 폴백 시도...');
                const fallbackResponse = await apiGet('/api/admin/common-codes/SPECIALTY');
                console.log('📋 폴백 API 응답:', fallbackResponse);
                if (fallbackResponse.success) {
                    console.log('✅ 폴백 API로 전문분야 코드 로드 성공:', fallbackResponse.data?.length || 0, '개');
                    setSpecialtyCodes(fallbackResponse.data || []);
                }
            } catch (fallbackError) {
                console.error('❌ 폴백 API도 실패:', fallbackError);
            }
        }
    };

    /**
     * 상담사 등록
     */
    const createConsultant = withFormSubmit(async () => {
        try {
                    const submitData = {
            username: formData.name, // 이름을 username으로 사용
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            specialization: Array.isArray(formData.specialty) ? formData.specialty.join(',') : formData.specialty
        };
            
            const response = await apiPost('/api/admin/consultants', submitData);
            if (response.success) {
                notificationManager.success('상담사가 성공적으로 등록되었습니다.');
                handleCloseModal();
                loadConsultants();
            } else {
                notificationManager.error(response.message || '상담사 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('상담사 등록 실패:', error);
            notificationManager.error('상담사 등록에 실패했습니다.');
        }
    });

    /**
     * 상담사 수정
     */
    const updateConsultant = withFormSubmit(async () => {
        try {
            console.log('🔍 상담사 수정 시작:', {
                editingConsultant: editingConsultant,
                formData: formData
            });

            const updateData = {
                username: formData.name, // 이름을 username으로 사용
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                specialization: Array.isArray(formData.specialty) ? formData.specialty.join(',') : formData.specialty
            };

            // 비밀번호가 입력된 경우에만 포함
            if (formData.password) {
                updateData.password = formData.password;
            }

            console.log('📤 전송할 데이터:', updateData);
            console.log('🌐 API URL:', `/api/admin/consultants/${editingConsultant.id}`);

            const response = await apiPut(`/api/admin/consultants/${editingConsultant.id}`, updateData);
            console.log('📥 API 응답:', response);

            if (response.success) {
                notificationManager.success('상담사 정보가 성공적으로 수정되었습니다.');
                handleCloseModal();
                loadConsultants();
            } else {
                console.error('❌ API 응답 실패:', response);
                notificationManager.error(response.message || '상담사 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 상담사 수정 실패:', error);
            console.error('❌ 에러 상세:', error.message);
            console.error('❌ 에러 스택:', error.stack);
            notificationManager.error('상담사 수정에 실패했습니다.');
        }
    });

    /**
     * 상담사 삭제
     */
    const deleteConsultant = withFormSubmit(async () => {
        try {
            const response = await apiDelete(`/api/admin/consultants/${editingConsultant.id}`);
            if (response.success) {
                notificationManager.success('상담사가 성공적으로 삭제되었습니다.');
                handleCloseModal();
                loadConsultants();
            } else {
                notificationManager.error(response.message || '상담사 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('상담사 삭제 실패:', error);
            notificationManager.error('상담사 삭제에 실패했습니다.');
        }
    });

    /**
     * 모달 열기
     */
    const handleOpenModal = (type, consultant = null) => {
        setModalType(type);
        setEditingConsultant(consultant);
        
        if (type === 'edit' && consultant) {
            const specialtyArray = consultant.specialization ? 
                (Array.isArray(consultant.specialization) ? consultant.specialization : consultant.specialization.split(',').map(s => s.trim())) : [];
            
            console.log('🔍 상담사 수정 모달 열기:', {
                consultant: consultant,
                originalSpecialization: consultant.specialization,
                specialtyArray: specialtyArray
            });
            
            setFormData({
                name: consultant.name || '',
                email: consultant.email || '',
                phone: consultant.phone || '',
                specialty: specialtyArray,
                password: ''
            });
        } else if (type === 'create') {
            setFormData({
                name: '',
                email: '',
                phone: '',
                specialty: [],
                password: ''
            });
        }
        
        setShowModal(true);
    };

    /**
     * 모달 닫기
     */
    const handleCloseModal = () => {
        setShowModal(false);
        setModalType('');
        setEditingConsultant(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            specialty: [],
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
            return numbers.slice(0, 3) + '-' + numbers.slice(3);
        } else if (numbers.length <= 11) {
            return numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7);
        } else {
            // 11자리 초과시 11자리까지만
            return numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
        }
    };

    /**
     * 다중선택 필드 변경 (전문분야)
     */
    const handleSpecialtyChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({
            ...prev,
            specialty: selectedOptions
        }));
    };

    /**
     * 모달 제출 처리
     */
    const handleModalSubmit = () => {
        if (modalType === 'create') {
            createConsultant();
        } else if (modalType === 'edit') {
            updateConsultant();
        } else if (modalType === 'delete') {
            deleteConsultant();
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
     * 상태를 한글로 변환 (동적 처리)
     */
    const getStatusText = async (status) => {
        try {
            return await getUserStatusKoreanName(status);
        } catch (error) {
            console.error(`상태 한글명 조회 실패: ${status}`, error);
            // fallback 매핑
            const statusMap = {
                'ACTIVE': '활성',
                'INACTIVE': '비활성',
                'SUSPENDED': '일시정지',
                'COMPLETED': '완료'
            };
            return statusMap[status] || status;
        }
    };

    /**
     * 전문분야 표시 텍스트 생성 (백엔드에서 제공하는 specializationDetails 사용)
     */
    const getSpecialtyDisplayText = (consultant) => {
        if (consultant.specializationDetails && consultant.specializationDetails.length > 0) {
            return consultant.specializationDetails.map(detail => detail.name).join(', ');
        }
        
        if (consultant.specialization && consultant.specialization.trim() !== '') {
            return consultant.specialization;
        }
        
        return '전문분야 미설정';
    };
    
    /**
     * 전문분야 코드 확인 (분기 처리용)
     */
    const hasSpecialtyCode = (consultant, code) => {
        if (consultant.specialization) {
            return consultant.specialization.includes(code);
        }
        return false;
    };

    /**
     * 상태별 색상 반환 (동적 처리)
     */
    const getStatusColorLocal = async (status) => {
        try {
            return await getStatusColor(status, 'USER_STATUS');
        } catch (error) {
            console.error(`상태 색상 조회 실패: ${status}`, error);
            // fallback 매핑
            const colorMap = {
                'ACTIVE': '#10b981',
                'INACTIVE': '#6b7280',
                'SUSPENDED': '#f59e0b',
                'COMPLETED': '#3b82f6'
            };
            return colorMap[status] || '#6b7280';
        }
    };

    /**
     * 상태별 색상 반환 (동기식 fallback)
     */
    const getStatusColorSync = (status) => {
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
        <SimpleLayout>
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
                                            {consultant.name ? consultant.name.charAt(0) : '?'}
                                        </div>
                                        <div className="consultant-comp-consultant-info">
                                            <div className="consultant-comp-consultant-name">{consultant.name || '이름 없음'}</div>
                                            <div className="consultant-comp-consultant-email">{consultant.email}</div>
                                            <div className="consultant-comp-consultant-phone">{consultant.phone || '전화번호 없음'}</div>
                                            <div 
                                                className={`consultant-comp-consultant-specialty ${!consultant.specialty || consultant.specialty.trim() === '' ? 'no-specialty' : ''}`}
                                                title={consultant.specialty || '전문분야 미설정'}
                                            >
                                                {getSpecialtyDisplayText(consultant)}
                                            </div>
                                            <div className="consultant-comp-consultant-date">
                                                가입일: {consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString('ko-KR') : '-'}
                                            </div>
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
                                                            <span className="value">{getSpecialtyDisplayText(selectedConsultant)}</span>
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
                                                                    style={{ backgroundColor: getStatusColorSync(mapping.status) }}
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
                                                                    style={{ backgroundColor: getStatusColorSync(mapping.status) }}
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
                /* 상담사 기본관리 탭 - 상담사 종합관리와 동일한 디자인 */
                <div className="consultant-comp-container">
                    <div className="consultant-comp-header">
                        <h2>상담사 기본 정보 관리</h2>
                        <p>상담사의 기본 정보를 등록, 수정, 삭제할 수 있습니다.</p>
                        
                        {/* 기본관리 기능들 */}
                        <div className="basic-actions">
                            <button 
                                className="btn btn-primary"
                                onClick={() => handleOpenModal('create')}
                            >
                                ➕ 새 상담사 등록
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={loadConsultants}
                            >
                                🔄 새로고침
                            </button>
                        </div>
                    </div>

                    {/* 상담사 목록 - 상담사 종합관리와 동일한 디자인 */}
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
                                    className="consultant-comp-consultant-card"
                                >
                                    <div className="consultant-comp-consultant-avatar">
                                        {consultant.name ? consultant.name.charAt(0) : '?'}
                                    </div>
                                    <div className="consultant-comp-consultant-info">
                                        <div className="consultant-comp-consultant-name">{consultant.name || '이름 없음'}</div>
                                        <div className="consultant-comp-consultant-email">{consultant.email}</div>
                                        <div className="consultant-comp-consultant-phone">{consultant.phone || '전화번호 없음'}</div>
                                        <div 
                                            className={`consultant-comp-consultant-specialty ${!consultant.specialty || consultant.specialty.trim() === '' ? 'no-specialty' : ''}`}
                                            title={consultant.specialty || '전문분야 미설정'}
                                        >
                                            {getSpecialtyDisplayText(consultant)}
                                        </div>
                                        <div className="consultant-comp-consultant-date">
                                            가입일: {consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString('ko-KR') : '-'}
                                        </div>
                                    </div>
                                    
                                    {/* 수정/삭제 버튼 추가 */}
                                    <div className="consultant-comp-consultant-actions">
                                        <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenModal('edit', consultant);
                                            }}
                                        >
                                            <i className="bi bi-pencil"></i>
                                            수정
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-danger"
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
                </div>
            )}

            {/* 모달 */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                {modalType === 'create' && '새 상담사 등록'}
                                {modalType === 'edit' && '상담사 정보 수정'}
                                {modalType === 'delete' && '상담사 삭제'}
                            </h3>
                            <button className="modal-close" onClick={handleCloseModal}>
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            {modalType === 'delete' ? (
                                <div className="delete-confirmation">
                                    <p>정말로 <strong>{editingConsultant?.name}</strong> 상담사를 삭제하시겠습니까?</p>
                                    <p className="warning-text">이 작업은 되돌릴 수 없습니다.</p>
                                </div>
                            ) : (
                                <form className="consultant-form">
                                    <div className="form-group">
                                        <label>이름 *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            placeholder="상담사 이름을 입력하세요"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '8px',
                                                background: '#ffffff',
                                                color: '#374151',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                                transition: 'all 0.2s ease'
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>이메일 *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="이메일을 입력하세요"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '8px',
                                                background: '#ffffff',
                                                color: '#374151',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                                transition: 'all 0.2s ease'
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>전화번호</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleFormChange}
                                            placeholder="010-1234-5678"
                                            maxLength="13"
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '8px',
                                                background: '#ffffff',
                                                color: '#374151',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                                transition: 'all 0.2s ease'
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="form-group" style={{ marginTop: '24px' }}>
                                        <label style={{ 
                                            display: 'block', 
                                            marginBottom: '12px', 
                                            fontSize: '16px', 
                                            fontWeight: '600', 
                                            color: '#1f2937' 
                                        }}>
                                            전문분야
                                        </label>
                                        <div style={{ 
                                            marginBottom: '8px', 
                                            fontSize: '12px', 
                                            color: '#6b7280',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
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
                                            className="specialty-select"
                                            style={{
                                                padding: '16px 20px',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '12px',
                                                background: '#ffffff',
                                                color: '#374151',
                                                fontSize: '14px',
                                                minHeight: '180px',
                                                height: '180px',
                                                width: '100%',
                                                maxWidth: '100%',
                                                resize: 'vertical',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                                overflowY: 'auto',
                                                lineHeight: '1.6',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {specialtyCodes.length > 0 ? (
                                                specialtyCodes.map(code => {
                                                    const isSelected = Array.isArray(formData.specialty) && formData.specialty.includes(code.codeValue);
                                                    return (
                                                        <option 
                                                            key={code.id || code.codeValue} 
                                                            value={code.codeValue}
                                                            style={{
                                                                backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                                                                color: isSelected ? '#1e40af' : '#374151',
                                                                fontWeight: isSelected ? '600' : '400',
                                                                padding: '8px 12px',
                                                                margin: '2px 0',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                fontSize: '14px',
                                                                lineHeight: '1.5'
                                                            }}
                                                        >
                                                            {code.icon ? `${code.icon} ` : ''}{code.codeLabel}
                                                        </option>
                                                    );
                                                })
                                            ) : (
                                                <option disabled>전문분야 코드를 불러오는 중...</option>
                                            )}
                                        </select>
                                        <small className="form-help-text">
                                            💡 Ctrl(Windows) 또는 Cmd(Mac)를 누르고 클릭하여 여러 개 선택할 수 있습니다.
                                        </small>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>
                                            {modalType === 'create' ? '비밀번호 *' : '새 비밀번호'}
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleFormChange}
                                            placeholder={modalType === 'create' ? '비밀번호를 입력하세요' : '새 비밀번호를 입력하세요 (선택사항)'}
                                            required={modalType === 'create'}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '8px',
                                                background: '#ffffff',
                                                color: '#374151',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box',
                                                transition: 'all 0.2s ease'
                                            }}
                                        />
                                    </div>
                                </form>
                            )}
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={handleCloseModal}
                            >
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

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">로딩 중...</div>
                </div>
            )}
            </div>
        </SimpleLayout>
    );
};

export default ConsultantComprehensiveManagement;
