import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaUser, FaEdit, FaTrash, FaPlus, FaEye, FaUsers, FaLink, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import { getUserStatusColor, getStatusLabel } from '../../utils/colorUtils';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import { getCurrentUser } from '../../utils/session';
import { getBranchNameByCode } from '../../utils/branchUtils';
import SpecialtyDisplay from '../ui/SpecialtyDisplay';
import { MGConfirmModal } from '../common/MGModal';

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
    const [filterBranch, setFilterBranch] = useState('all');
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 데이터 로드 함수들
    const loadConsultants = useCallback(async () => {
        try {
            console.log('🔄 상담사 목록 로딩 시작...');
            
            // 현재 사용자의 지점코드 가져오기
            const currentUser = getCurrentUser();
            const userBranchCode = currentUser?.branchCode;
            
            console.log('👤 현재 사용자 지점코드:', userBranchCode);
            
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
            console.log('🔍 전문분야 코드 로딩 시작...');
            const response = await apiGet('/api/common-codes/group/SPECIALTY');
            console.log('📋 전문분야 코드 응답:', response);
            
            if (Array.isArray(response)) {
                setSpecialtyCodes(response);
                console.log('✅ 전문분야 코드 로딩 완료:', response.length, '개');
            } else {
                console.warn('⚠️ 전문분야 코드 응답이 배열이 아님:', response);
                setSpecialtyCodes([]);
            }
        } catch (error) {
            console.error('❌ 전문분야 코드 로딩 오류:', error);
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
        console.log('🔍 상담사 필터링 시작:', { searchTerm, filterStatus, filterBranch, consultants: consultants.length });
        
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

        // 지점 필터링
        if (filterBranch && filterBranch !== 'all') {
            filtered = filtered.filter(consultant => consultant.branchCode === filterBranch);
        }

        console.log('✅ 필터링 결과:', filtered.length, '명');
        return filtered;
    }, [consultants, searchTerm, filterStatus, filterBranch]);

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

    const handleSpecialtyChange = useCallback((selectedValues) => {
            setFormData(prev => ({
                ...prev,
            specialty: selectedValues
        }));
    }, []);

    // 커스텀 다중 선택 컴포넌트
    const CustomMultiSelect = ({ options, value, onChange, placeholder }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const dropdownRef = useRef(null);

        // 드롭다운 외부 클릭 시 닫기
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isOpen]);

        const filteredOptions = options.filter(option =>
            (option.codeName || option.codeLabel || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        const handleToggle = (optionValue, event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const newValue = value.includes(optionValue)
                ? value.filter(v => v !== optionValue)
                : [...value, optionValue];
            onChange(newValue);
            // 드롭다운을 열어둔 상태로 유지
            setIsOpen(true);
        };

        const selectedLabels = value.map(val => 
            options.find(opt => opt.codeValue === val)?.codeName || 
            options.find(opt => opt.codeValue === val)?.codeLabel || 
            val
        ).join(', ');

        return (
            <div className="mg-custom-multi-select" ref={dropdownRef}>
                <div 
                    className="mg-custom-multi-select__trigger"
                    onClick={() => setIsOpen(true)}
                >
                    <span className={selectedLabels ? 'mg-custom-multi-select__value' : 'mg-custom-multi-select__placeholder'}>
                        {selectedLabels || placeholder}
                    </span>
                    <span className="mg-custom-multi-select__arrow">▼</span>
                </div>
                
                {isOpen && (
                    <div className="mg-custom-multi-select__dropdown">
                        <div className="mg-custom-multi-select__search">
                            <input
                                type="text"
                                placeholder="검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="mg-custom-multi-select__search-input"
                            />
                        </div>
                        <div className="mg-custom-multi-select__options">
                            {filteredOptions.map(option => (
                                <div
                                    key={option.codeValue}
                                    className={`mg-custom-multi-select__option ${
                                        value.includes(option.codeValue) ? 'mg-custom-multi-select__option--selected' : ''
                                    }`}
                                    onClick={(e) => handleToggle(option.codeValue, e)}
                                >
                                    <span className="mg-custom-multi-select__checkbox">
                                        {value.includes(option.codeValue) ? '✓' : ''}
                                    </span>
                                    <span className="mg-custom-multi-select__label">
                                        {option.icon ? `${option.icon} ` : ''}{option.codeName || option.codeLabel}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };


    // CRUD 작업들
    const createConsultant = useCallback(async (data) => {
        try {
            const response = await apiPost('/api/admin/consultants', data);
            if (response.success) {
                await loadConsultants();
                // 공통 알림 사용
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '상담사가 성공적으로 등록되었습니다.', type: 'success' }
                }));
                return { success: true };
            } else {
                // 공통 알림 사용
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: response.message || '상담사 등록에 실패했습니다.', type: 'error' }
                }));
                return { success: false };
            }
        } catch (error) {
            console.error('상담사 등록 오류:', error);
            // 공통 알림 사용
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '상담사 등록 중 오류가 발생했습니다.', type: 'error' }
            }));
            return { success: false };
        }
    }, [loadConsultants]);

    const updateConsultant = useCallback(async (id, data) => {
        try {
            const response = await apiPut(`/api/admin/consultants/${id}`, data);
            if (response.success) {
                await loadConsultants();
                // 공통 알림 사용
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '상담사 정보가 성공적으로 수정되었습니다.', type: 'success' }
                }));
                return { success: true };
            } else {
                // 공통 알림 사용
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: response.message || '상담사 수정에 실패했습니다.', type: 'error' }
                }));
                return { success: false };
            }
        } catch (error) {
            console.error('상담사 수정 오류:', error);
            // 공통 알림 사용
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '상담사 수정 중 오류가 발생했습니다.', type: 'error' }
            }));
            return { success: false };
        }
    }, [loadConsultants]);

    const deleteConsultant = useCallback(async (id) => {
        try {
            const response = await apiDelete(`/api/admin/consultants/${id}`);
            if (response.success) {
                await loadConsultants();
                // 공통 알림 사용
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '상담사가 성공적으로 삭제되었습니다.', type: 'success' }
                }));
                return { success: true };
            } else {
                // 공통 알림 사용
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: response.message || '상담사 삭제에 실패했습니다.', type: 'error' }
                }));
                return { success: false };
            }
        } catch (error) {
            console.error('상담사 삭제 오류:', error);
            // 공통 알림 사용
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '상담사 삭제 중 오류가 발생했습니다.', type: 'error' }
            }));
            return { success: false };
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
                handleCloseModal();
            }
        } catch (error) {
            console.error('모달 제출 오류:', error);
            // 공통 알림 사용
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '작업 중 오류가 발생했습니다.', type: 'error' }
            }));
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
                            <div className="mg-stats-grid">
                                <div className="mg-stat-card">
                                    <div className="mg-stat-icon">
                                        <FaUsers />
                            </div>
                                    <div className="mg-stat-value">{stats.totalConsultants}</div>
                                    <div className="mg-stat-label">총 상담사</div>
                        </div>
                                <div className="mg-stat-card">
                                    <div className="mg-stat-icon">
                                        <FaLink />
                            </div>
                                    <div className="mg-stat-value">{stats.activeMappings}</div>
                                    <div className="mg-stat-label">활성 매칭</div>
                        </div>
                                <div className="mg-stat-card">
                                    <div className="mg-stat-icon">
                                        <FaCalendarAlt />
                            </div>
                                    <div className="mg-stat-value">{stats.totalSchedules}</div>
                                    <div className="mg-stat-label">총 스케줄</div>
                        </div>
                                <div className="mg-stat-card">
                                    <div className="mg-stat-icon">
                                        <FaClipboardList />
                            </div>
                                    <div className="mg-stat-value">{stats.todaySchedules}</div>
                                    <div className="mg-stat-label">오늘 스케줄</div>
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

                            <div className="mg-consultant-cards-grid mg-consultant-cards-grid--detailed">
                                {getFilteredConsultants.map(consultant => (
                                    <div
                                        key={consultant.id}
                                        className="mg-consultant-card mg-consultant-card--detailed"
                                        onClick={() => handleConsultantSelect(consultant)}
                                    >
                                        <div className="mg-consultant-card__status-badge" style={{ backgroundColor: getUserStatusColor(consultant.status) }}>
                                            <span>{getStatusLabel(consultant.status)}</span>
                        </div>

                                        <div className="mg-consultant-card__avatar mg-consultant-card__avatar--large">
                                            {consultant.name ? consultant.name.charAt(0) : '?'}
                                </div>

                                        <div className="mg-consultant-card__info">
                                            <h4 className="mg-consultant-card__name mg-consultant-card__name--large">{consultant.name || '이름 없음'}</h4>
                                            
                                            <div className="mg-consultant-card__rating-section">
                                                <div className="mg-consultant-card__rating">
                                                    <span className="mg-consultant-card__rating-value">📧</span>
                                                    <span className="mg-consultant-card__rating-text">{consultant.email}</span>
                                                        </div>
                                                <div className="mg-consultant-card__experience">
                                                    <span>📞 {consultant.phone || '전화번호 없음'}</span>
                                                    </div>
                                                </div>

                                            <div className="mg-consultant-card__details">
                                                <div className="mg-consultant-card__detail-item">
                                                    <span>📅 가입일: {consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString() : '알 수 없음'}</span>
                                                        </div>
                                                
                                                <div className="mg-consultant-card__detail-item">
                                                    <span>🏢 지점: {getBranchNameByCode(consultant.branchCode)}</span>
                                                            </div>
                                                
                                                <div className="mg-consultant-card__detail-item">
                                                    <span>👥 총 클라이언트: {consultant.totalClients || 0}명</span>
                                                            </div>
                                                            </div>
                                            
                                            <div className="mg-consultant-card__specialties">
                                                <h5 className="mg-consultant-card__specialties-title">전문 분야</h5>
                                                <div className="mg-consultant-card__specialties-list">
                                                    {consultant.specialties && consultant.specialties.map((specialty, index) => (
                                                        <span key={index} className="mg-consultant-card__specialty-tag">
                                                            {specialty}
                                                                </span>
                                                    ))}
                                                            </div>
                                                        </div>
                                            
                                            <div className="mg-consultant-card__actions">
                                                <button 
                                                    className="mg-button mg-button-primary mg-button-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenModal('edit', consultant);
                                                    }}
                                                >
                                                    수정
                                                </button>
                                                <button 
                                                    className="mg-button mg-button-danger mg-button-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedConsultant(consultant);
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                >
                                                    삭제
                                                </button>
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
                                    className="mg-button mg-button-primary"
                                onClick={() => handleOpenModal('create')}
                            >
                                ➕ 새 상담사 등록
                            </button>
                            <button 
                                    className="mg-button mg-button-secondary"
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

                            <div className="mg-consultant-cards-grid mg-consultant-cards-grid--detailed">
                                {getFilteredConsultants.map(consultant => (
                                <div
                                    key={consultant.id}
                                        className="mg-consultant-card mg-consultant-card--detailed"
                                    >
                                        <div className="mg-consultant-card__status-badge" style={{ backgroundColor: getUserStatusColor(consultant.status) }}>
                                            <span>{getStatusLabel(consultant.status)}</span>
                                        </div>
                                        
                                        <div className="mg-consultant-card__avatar mg-consultant-card__avatar--large">
                                        {consultant.name ? consultant.name.charAt(0) : '?'}
                                    </div>
                                        
                                        <div className="mg-consultant-card__info">
                                            <h4 className="mg-consultant-card__name mg-consultant-card__name--large">{consultant.name || '이름 없음'}</h4>
                                            
                                            <div className="mg-consultant-card__rating-section">
                                                <div className="mg-consultant-card__rating">
                                                    <span className="mg-consultant-card__rating-value">📧</span>
                                                    <span className="mg-consultant-card__rating-text">{consultant.email}</span>
                                        </div>
                                                <div className="mg-consultant-card__experience">
                                                    <span>📞 {consultant.phone || '전화번호 없음'}</span>
                                        </div>
                                    </div>
                                    
                                            <div className="mg-consultant-card__details">
                                                <div className="mg-consultant-card__detail-item">
                                                    <span>📅 가입일: {consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString() : '알 수 없음'}</span>
                                                </div>
                                                
                                                <div className="mg-consultant-card__detail-item">
                                                    <span>🏢 지점: {getBranchNameByCode(consultant.branchCode)}</span>
                                                </div>
                                                
                                                <div className="mg-consultant-card__detail-item">
                                                    <span>👥 총 클라이언트: {consultant.totalClients || 0}명</span>
                                                </div>
                                            </div>
                                            
                                            <div className="mg-consultant-card__specialties">
                                                <h5 className="mg-consultant-card__specialties-title">전문 분야</h5>
                                                <div className="mg-consultant-card__specialties-list">
                                                    {consultant.specialties && consultant.specialties.map((specialty, index) => (
                                                        <span key={index} className="mg-consultant-card__specialty-tag">
                                                            {specialty}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="mg-consultant-card__actions">
                                        <button 
                                                    className="mg-button mg-button-primary mg-button-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenModal('edit', consultant);
                                            }}
                                        >
                                            수정
                                        </button>
                                        <button 
                                                    className="mg-button mg-button-danger mg-button-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                        setSelectedConsultant(consultant);
                                                        setShowDeleteConfirm(true);
                                            }}
                                        >
                                            삭제
                                        </button>
                                            </div>
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
                    <div className={`mg-modal ${modalType === 'delete' ? 'mg-confirm-modal mg-confirm-delete' : 'mg-modal-large'}`}>
                        <div className="mg-modal-header">
                            <h3 className="mg-modal-title">
                                {modalType === 'create' && '새 상담사 등록'}
                                {modalType === 'edit' && '상담사 정보 수정'}
                                {modalType === 'delete' && '상담사 삭제 확인'}
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
                                                    {getStatusLabel(selectedConsultant.status)}
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
                                            <span>여러 개의 전문분야를 선택할 수 있습니다.</span>
                                        </div>
                                        <CustomMultiSelect
                                            options={specialtyCodes}
                                            value={formData.specialty}
                                            onChange={handleSpecialtyChange}
                                            placeholder="전문분야를 선택하세요"
                                        />
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
                                        <button type="button" className="mg-button mg-button-secondary" onClick={handleCloseModal}>
                                취소
                            </button>
                            <button 
                                            type="submit"
                                            className={`mg-button ${modalType === 'delete' ? 'mg-button-danger' : 'mg-button-primary'}`}
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
            
            {/* 삭제 확인 모달 */}
            <MGConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={async () => {
                    if (selectedConsultant) {
                        await deleteConsultant(selectedConsultant.id);
                    }
                }}
                title="상담사 삭제 확인"
                message={`${selectedConsultant?.name || '이 상담사'}를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                confirmText="삭제"
                cancelText="취소"
                confirmVariant="danger"
            />
        </SimpleLayout>
    );
};

export default ConsultantComprehensiveManagement;