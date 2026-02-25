import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Plus, Users, Link2, Calendar, ClipboardList, Edit, Trash2, Key, Mail, Phone } from 'lucide-react';
import Button from '../ui/Button/Button';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { getStatusLabel } from '../../utils/colorUtils';

/** 상담사 경력 연차에 따른 레벨 라벨 (카드 배지용) */
const getConsultantLevel = (consultant) => {
    const years = consultant?.yearsOfExperience ?? 0;
    const num = Number(years);
    if (num >= 6) return { label: '시니어 상담사', level: 'senior' };
    if (num >= 3) return { label: '매니어 상담사', level: 'manier' };
    return { label: '주니어 상담사', level: 'junior' };
};
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import StandardizedApi from '../../utils/standardizedApi';
import { getAllConsultantsWithStats } from '../../utils/consultantHelper';
import SpecialtyDisplay from '../ui/SpecialtyDisplay';
import UnifiedModal from '../common/modals/UnifiedModal';
import { getCommonCodes } from '../../utils/commonCodeApi';
import { sessionManager } from '../../utils/sessionManager';
import PasswordResetModal from './PasswordResetModal';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import ContentCard from '../dashboard-v2/content/ContentCard';
import { SearchInput } from '../dashboard-v2/atoms';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './mapping-management/organisms/MappingKpiSection.css';
import './mapping-management/organisms/MappingSearchSection.css';
import './mapping-management/organisms/MappingListBlock.css';
import './mapping-management/MappingManagementPage.css';
import './ConsultantManagementPage.css';
import './ProfileCard.css';

const ConsultantComprehensiveManagement = ({ embedded = false }) => {
    const [consultants, setConsultants] = useState([]);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [mappings, setMappings] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState('comprehensive');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [userStatusOptions, setUserStatusOptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('view');
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [passwordResetConsultant, setPasswordResetConsultant] = useState(null);
    const [formData, setFormData] = useState({
        name: '', // 이름 (선택사항, 없으면 이메일 로컬 파트에서 자동 생성)
        email: '', // 표준화 2025-12-08: 이메일만 입력받음 (userId 자동 생성)
        password: '', // 비밀번호 (선택사항, 없으면 자동 생성)
        phone: '',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        status: 'ACTIVE',
        specialty: []
    });
    const [specialtyCodes, setSpecialtyCodes] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [emailCheckStatus, setEmailCheckStatus] = useState(null); // 'checking', 'duplicate', 'available', null
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    const loadConsultants = useCallback(async() => {
        try {
            console.log('🔄 상담사 목록 로딩 시작...');
            
            // 세션 갱신을 통해 최신 tenantId 확보 (loadMappings, loadSchedules와 동일한 패턴)
            try {
                await sessionManager.checkSession(true);
                
                // tenantId가 실제로 있는지 확인 (대시보드와 달리 명시적으로 확인 필요)
                const user = sessionManager.getUser();
                const tenantId = user?.tenantId || sessionManager.getSessionInfo()?.tenantId;
                
                const tenantIdTrimmed = tenantId ? tenantId.trim() : '';
                const isInvalidDefault = !tenantId || 
                    tenantIdTrimmed === 'unknown' || tenantIdTrimmed === 'default' ||
                    tenantIdTrimmed.startsWith('unknown-') || tenantIdTrimmed.startsWith('default-') ||
                    tenantIdTrimmed === 'tenant-unknown' || tenantIdTrimmed === 'tenant-default';
                
                if (isInvalidDefault) {
                    console.warn('⚠️ 상담사 목록 로딩: tenantId 없음, 재시도 대기...', {
                        userId: user?.id,
                        email: user?.email,
                        role: user?.role
                    });
                    
                    // 조금 더 기다린 후 재시도
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await sessionManager.checkSession(true);
                    
                    // 재확인
                    const retryUser = sessionManager.getUser();
                    const retryTenantId = retryUser?.tenantId || sessionManager.getSessionInfo()?.tenantId;
                    
                    const retryTenantIdTrimmed = retryTenantId ? retryTenantId.trim() : '';
                    const isRetryInvalidDefault = !retryTenantId || 
                        retryTenantIdTrimmed === 'unknown' || retryTenantIdTrimmed === 'default' ||
                        retryTenantIdTrimmed.startsWith('unknown-') || retryTenantIdTrimmed.startsWith('default-') ||
                        retryTenantIdTrimmed === 'tenant-unknown' || retryTenantIdTrimmed === 'tenant-default';
                    
                    if (isRetryInvalidDefault) {
                        console.error('❌ 상담사 목록 로딩: tenantId를 가져올 수 없음');
                        setConsultants([]);
                        return;
                    }
                    
                    console.log('✅ tenantId 확인 완료:', retryTenantId);
                } else {
                    console.log('✅ tenantId 확인 완료:', tenantId);
                }
            } catch (error) {
                console.error('❌ sessionManager 사용 중 오류:', error);
            }
            
            const consultantsList = await getAllConsultantsWithStats();
            console.log('📊 통합 API 응답:', consultantsList);
            
            if (consultantsList && consultantsList.length > 0) {
                console.log('🔍 첫 번째 아이템 구조:', consultantsList[0]);
                
                const consultants = consultantsList.map(item => {
                    const consultantEntity = item.consultant || {};
                    
                    return {
                        id: consultantEntity.id,
                        name: consultantEntity.name,
                        email: consultantEntity.email,
                        phone: consultantEntity.phone,
                        role: consultantEntity.role,
                        isActive: consultantEntity.isActive,
                        specialty: consultantEntity.specialty, // Consultant 엔티티의 specialty
                        specialtyDetails: consultantEntity.specialtyDetails, // Consultant 엔티티의 specialtyDetails
                        specialization: consultantEntity.specialization, // User 엔티티의 specialization
                        specializationDetails: consultantEntity.specializationDetails, // User 엔티티의 specializationDetails
                        yearsOfExperience: consultantEntity.yearsOfExperience,
                        maxClients: consultantEntity.maxClients,
                        totalConsultations: consultantEntity.totalConsultations,
                        createdAt: consultantEntity.createdAt,
                        updatedAt: consultantEntity.updatedAt,
                        currentClients: item.currentClients || 0,
                        totalClients: item.totalClients || 0,
                        statistics: item.statistics || {}
                    };
                });
                
                setConsultants(consultants);
                console.log('✅ 상담사 목록 설정 완료 (통합 API):', consultants.length, '명');
                
                if (consultants.length > 0) {
                    console.log('🔍 변환된 첫 번째 상담사:', consultants[0]);
                }
            } else {
                console.warn('⚠️ 상담사 데이터 없음');
                setConsultants([]);
            }
        } catch (error) {
            console.error('❌ 상담사 목록 로딩 오류:', error);
            setConsultants([]);
        }
    }, []);

    const loadMappings = useCallback(async() => {
        try {
            // 세션 갱신을 통해 최신 tenantId 확보
            try {
                await sessionManager.checkSession(true);
            } catch (error) {
                console.error('❌ sessionManager 사용 중 오류:', error);
            }
            
            const response = await apiGet('/api/v1/admin/mappings');
            if (response && response.success) {
                setMappings(response.data || []);
                console.log('✅ 매칭 데이터 로딩 완료:', response.data?.length || 0, '개');
            } else {
                console.warn('⚠️ 매칭 데이터 없음:', response);
                setMappings([]);
            }
        } catch (error) {
            console.error('❌ 매칭 로딩 오류:', error);
            setMappings([]);
        }
    }, []);

    const loadSchedules = useCallback(async() => {
        try {
            // 세션 갱신을 통해 최신 tenantId 확보
            try {
                await sessionManager.checkSession(true);
            } catch (error) {
                console.error('❌ sessionManager 사용 중 오류:', error);
            }
            
            const response = await apiGet('/api/v1/admin/schedules');
            if (response && response.success) {
                setSchedules(response.data || []);
                console.log('✅ 스케줄 데이터 로딩 완료:', response.data?.length || 0, '개');
            } else {
                console.warn('⚠️ 스케줄 데이터 없음:', response);
                setSchedules([]);
            }
        } catch (error) {
            console.error('❌ 스케줄 로딩 오류:', error);
            setSchedules([]);
        }
    }, []);

    const loadSpecialtyCodes = useCallback(async() => {
        try {
            console.log('🔍 전문분야 코드 로딩 시작 (테넌트 코드 전용)...');
            
            // tenantId는 필수이므로 세션에서 확보
            let tenantId = null;
            
            // sessionManager를 직접 import해서 사용 (window.sessionManager 대신)
            try {
                // 먼저 현재 사용자 정보 확인
                let user = sessionManager.getUser();
                tenantId = user?.tenantId || sessionManager.getSessionInfo()?.tenantId;
                console.log('🔍 초기 tenantId 확인:', tenantId);
                
                // tenantId가 없거나 유효하지 않으면 세션 강제 갱신
                if (!tenantId || tenantId === 'unknown' || tenantId === 'default' || 
                    tenantId.startsWith('unknown-') || tenantId.startsWith('default-') ||
                    tenantId === 'tenant-unknown' || tenantId === 'tenant-default') {
                    console.warn('⚠️ tenantId가 없거나 유효하지 않음, 세션 재조회 시도...');
                    console.log('🔄 세션 강제 갱신 시작...');
                    
                    // 세션 강제 갱신
                    await sessionManager.checkSession(true);
                    
                    // 갱신 후 다시 확인
                    user = sessionManager.getUser();
                    tenantId = user?.tenantId || sessionManager.getSessionInfo()?.tenantId;
                    console.log('🔍 세션 갱신 후 tenantId:', tenantId);
                    
                    // 여전히 없으면 localStorage에서 확인
                    if (!tenantId || tenantId === 'unknown' || tenantId === 'default') {
                        const storedUser = localStorage.getItem('userInfo');
                        if (storedUser) {
                            try {
                                const parsedUser = JSON.parse(storedUser);
                                tenantId = parsedUser?.tenantId;
                                console.log('🔍 localStorage에서 tenantId 확인:', tenantId);
                            } catch (e) {
                                console.error('❌ localStorage 파싱 오류:', e);
                            }
                        }
                    }
                    
                    // 최종적으로 tenantId가 없으면 오류
                    if (!tenantId || tenantId === 'unknown' || tenantId === 'default') {
                        console.error('❌ tenantId를 찾을 수 없습니다. 로그인 세션을 확인해주세요.');
                        setSpecialtyCodes([]);
                        return;
                    }
                }
                
                console.log('✅ 최종 tenantId:', tenantId);
            } catch (error) {
                console.error('❌ sessionManager 사용 중 오류:', error);
                // localStorage에서 직접 확인 시도
                try {
                    const storedUser = localStorage.getItem('userInfo');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        tenantId = parsedUser?.tenantId;
                        console.log('🔍 localStorage에서 tenantId 확인 (fallback):', tenantId);
                    }
                } catch (e) {
                    console.error('❌ localStorage 파싱 오류:', e);
                }
                
                if (!tenantId || tenantId === 'unknown' || tenantId === 'default') {
                    console.error('❌ tenantId를 찾을 수 없습니다. 로그인 세션을 확인해주세요.');
                    setSpecialtyCodes([]);
                    return;
                }
            }
            
            // 먼저 테넌트 코드 시도
            const { getTenantCodes, getCommonCodes } = await import('../../utils/commonCodeApi');
            let codes = await getTenantCodes('SPECIALTY');
            console.log('📋 전문분야 코드 응답 (테넌트별):', codes, 'length:', codes?.length);
            
            // 테넌트 코드가 없거나 빈 배열이면 코어 코드로 폴백
            if (!Array.isArray(codes) || codes.length === 0) {
                console.log('🔄 테넌트 코드가 없음, 코어 코드로 폴백 시도...');
                try {
                    // 코어 코드 API 직접 호출
                    const coreCodes = await apiGet('/api/v1/common-codes/core/groups/SPECIALTY');
                    console.log('📋 코어 코드 API 응답:', coreCodes);
                    
                    if (Array.isArray(coreCodes)) {
                        codes = coreCodes;
                    } else if (coreCodes && Array.isArray(coreCodes.codes)) {
                        codes = coreCodes.codes;
                    } else if (coreCodes && coreCodes.success && Array.isArray(coreCodes.data)) {
                        codes = coreCodes.data;
                    } else {
                        console.warn('⚠️ 코어 코드 응답 형식이 예상과 다름:', coreCodes);
                        codes = [];
                    }
                    console.log('📋 전문분야 코드 응답 (코어):', codes, 'length:', codes?.length);
                } catch (fallbackError) {
                    console.error('❌ 코어 코드 폴백 실패:', fallbackError);
                    codes = [];
                }
            }
            
            if (Array.isArray(codes) && codes.length > 0) {
                // codeValue, codeLabel, codeName 필드 확인 및 변환
                const formattedCodes = codes.map(code => ({
                    codeValue: code.codeValue || code.value || code.id,
                    codeLabel: code.codeLabel || code.label || code.name,
                    codeName: code.codeName || code.name || code.codeLabel || code.label
                }));
                setSpecialtyCodes(formattedCodes);
                console.log('✅ 전문분야 코드 로딩 완료:', formattedCodes.length, '개');
            } else {
                console.warn('⚠️ 전문분야 코드가 없거나 배열이 아님:', codes);
                setSpecialtyCodes([]);
            }
        } catch (error) {
            console.error('❌ 전문분야 코드 로딩 오류:', error);
            console.error('❌ 오류 상세:', error.message, error.stack);
            setSpecialtyCodes([]);
        }
    }, []);

    const loadAllData = useCallback(async() => {
        setLoading(true);
        try {
            console.log('🚀 전체 데이터 로딩 시작...');
            
            // 세션 강제 갱신하여 tenantId 확보 (API 호출 전에 완료되어야 함)
            try {
                console.log('🔄 세션 강제 갱신 시작...');
                await sessionManager.checkSession(true);
                const user = sessionManager.getUser();
                if (!user || !user.tenantId) {
                    console.warn('⚠️ 세션 갱신 후에도 tenantId를 찾을 수 없음');
                    // localStorage에서 백업 시도
                    const storedUser = localStorage.getItem('userInfo');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        if (parsedUser && parsedUser.tenantId) {
                            console.log('✅ localStorage에서 tenantId 발견:', parsedUser.tenantId);
                            // sessionManager에 설정
                            sessionManager.setUser(parsedUser);
                        }
                    }
                } else {
                    console.log('✅ 세션 갱신 완료, tenantId:', user.tenantId);
                }
            } catch (sessionError) {
                console.warn('⚠️ 세션 갱신 실패:', sessionError);
            }
            
            // 세션 갱신 완료 후 데이터 로드
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

    useEffect(() => {
        // SessionGuard가 먼저 세션을 체크할 시간을 주기 위해 약간의 지연
        const initializeData = async () => {
            // 세션이 준비될 때까지 약간 대기 (SessionGuard가 실행될 시간 확보)
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 세션 확인
            try {
                const user = sessionManager.getUser();
                const tenantId = user?.tenantId || sessionManager.getSessionInfo()?.tenantId;
                
                const tenantIdTrimmed = tenantId ? tenantId.trim() : '';
                const isInvalidDefault = !tenantId || 
                    tenantIdTrimmed === 'unknown' || tenantIdTrimmed === 'default' ||
                    tenantIdTrimmed.startsWith('unknown-') || tenantIdTrimmed.startsWith('default-') ||
                    tenantIdTrimmed === 'tenant-unknown' || tenantIdTrimmed === 'tenant-default';
                
                if (isInvalidDefault) {
                    console.warn('⚠️ 상담사 관리 페이지: tenantId 없음, 세션 갱신 대기...');
                    // 세션 갱신 후 재시도
                    await sessionManager.checkSession(true);
                    // 조금 더 대기
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            } catch (error) {
                console.error('❌ sessionManager 사용 중 오류:', error);
            }
            
            loadAllData();
        };
        
        initializeData();
    }, [loadAllData]);

    useEffect(() => {
        const handleForceRefresh = (event) => {
            if (event.detail === 'consultant-management') {
                console.log('🔄 강제 새로고침 이벤트 수신');
                loadAllData();
            }
        };

        window.addEventListener('forceRefresh', handleForceRefresh);
        return() => window.removeEventListener('forceRefresh', handleForceRefresh);
    }, [loadAllData]);

    // 공통코드 로드 (상태 옵션)
    useEffect(() => {
        const loadStatusCodes = async () => {
            try {
                const statusCodes = await getCommonCodes('USER_STATUS');
                const uniqueStatusCodes = (statusCodes || []).filter((option, index, self) => 
                    index === self.findIndex(o => o.codeValue === option.codeValue)
                );
                setUserStatusOptions(uniqueStatusCodes);
            } catch (error) {
                console.error('상태 공통코드 로드 실패:', error);
                setUserStatusOptions([
                    { codeValue: 'ACTIVE', codeLabel: '활성' },
                    { codeValue: 'INACTIVE', codeLabel: '비활성' },
                    { codeValue: 'SUSPENDED', codeLabel: '일시정지' }
                ]);
            }
        };
        loadStatusCodes();
    }, []);
    
    const getFilteredConsultants = useMemo(() => {
        let filtered = consultants;

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(consultant => 
                (consultant.name || '').toLowerCase().includes(term) ||
                (consultant.email || '').toLowerCase().includes(term) ||
                (consultant.phone || '').includes(term) ||
                (searchTerm.startsWith('#') && consultant.status === searchTerm.substring(1).toUpperCase())
            );
        }

        if (activeFilters.status && activeFilters.status !== 'ALL' && activeFilters.status !== 'all') {
            filtered = filtered.filter(consultant => consultant.status === activeFilters.status);
        }

        return filtered;
    }, [consultants, searchTerm, activeFilters]);
    
    const handleSearch = useCallback((term) => {
        setSearchTerm(term);
    }, []);
    
    const handleFilterChange = useCallback((filters) => {
        setActiveFilters(filters);
    }, []);
    
    const getOverallStats = useCallback(() => {
        const totalConsultants = consultants.length;
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
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

    const handleConsultantSelect = useCallback((consultant) => {
        console.log('👤 상담사 선택:', consultant);
        setSelectedConsultant(consultant);
        setModalType('view');
        setShowModal(true);
    }, []);

    const handleOpenModal = useCallback((type, consultant = null) => {
        setModalType(type);
        
        // 모달이 열릴 때 전문분야 코드 로드 (최신 데이터 보장)
        loadSpecialtyCodes();
        
        if (consultant) {
            setSelectedConsultant(consultant);
            if (type === 'edit') {
                let specialties = [];
                if (consultant.specialization) {
                    specialties = consultant.specialization.split(',').map(s => s.trim());
                } else if (consultant.specialty) {
                    specialties = [consultant.specialty];
                }
                
                setFormData({
                    name: consultant.name || '',
                    email: consultant.email || '',
                    phone: consultant.phone || '',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    status: consultant.status || 'ACTIVE',
                    specialty: specialties
                });
            }
        } else if (type === 'create') {
            setFormData({
                name: '', // 이름 (선택사항)
                email: '', // 표준화 2025-12-08: 이메일만 입력받음
                password: '', // 비밀번호 (선택사항, 없으면 자동 생성)
                phone: '',
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                status: 'ACTIVE',
                specialty: []
            });
        }
        setShowModal(true);
    }, [loadSpecialtyCodes]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setModalType('view');
        setSelectedConsultant(null);
        setFormData({
            name: '', // 이름 (선택사항)
            email: '', // 표준화 2025-12-08: 이메일만 입력받음
            password: '', // 비밀번호 (선택사항, 없으면 자동 생성)
            phone: '',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            status: 'ACTIVE',
            specialty: []
        });
    }, []);

    const handleFormChange = useCallback((e) => { 
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            
            // 이메일 입력 시 중복 확인 상태 초기화
            if (name === 'email') {
                setEmailCheckStatus(null);
            }
        }, []);
    
    const handleEmailDuplicateCheck = useCallback(async () => {
        const email = formData.email?.trim();
        if (!email) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '이메일을 입력해주세요.', type: 'warning' }
            }));
            return;
        }
        
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '올바른 이메일 형식을 입력해주세요.', type: 'warning' }
            }));
            return;
        }
        
        setIsCheckingEmail(true);
        setEmailCheckStatus('checking');
        
        try {
            const response = await apiGet(`/api/v1/admin/duplicate-check/email?email=${encodeURIComponent(email)}`);
            console.log('📧 이메일 중복 확인 응답:', response);
            
            if (response && typeof response.isDuplicate === 'boolean') {
                if (response.isDuplicate) {
                    setEmailCheckStatus('duplicate');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: '이미 사용 중인 이메일입니다.', type: 'error' }
                    }));
                } else {
                    setEmailCheckStatus('available');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: '사용 가능한 이메일입니다.', type: 'success' }
                    }));
                }
            } else {
                setEmailCheckStatus(null);
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '이메일 중복 확인 중 오류가 발생했습니다.', type: 'error' }
                }));
            }
        } catch (error) {
            console.error('❌ 이메일 중복 확인 오류:', error);
            setEmailCheckStatus(null);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '이메일 중복 확인 중 오류가 발생했습니다.', type: 'error' }
            }));
        } finally {
            setIsCheckingEmail(false);
        }
    }, [formData.email]);

    const handleSpecialtyChange = useCallback((selectedValues) => {
            setFormData(prev => ({
                ...prev,
            specialty: selectedValues
        }));
    }, []);

    const CustomMultiSelect = ({ options, value, onChange, placeholder }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const dropdownRef = useRef(null);

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return() => {
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
            setIsOpen(true);
        };

        const selectedLabels = value.map(val => 
            options.find(opt => opt.codeValue === val)?.codeName || 
            options.find(opt => opt.codeValue === val)?.codeLabel || 
            val
        ).join(', ');

        return(
            <div className="mg-v2-custom-multi-select" ref={ dropdownRef }>
                <div 
                    className="mg-v2-custom-multi-select__trigger"
                    onClick={ () => setIsOpen(true) }
                >
                    <span className={ selectedLabels ? 'mg-custom-multi-select__value' : 'mg-custom-multi-select__placeholder' }>
                        { selectedLabels || placeholder }
                    </span>
                    <span className="mg-v2-custom-multi-select__arrow">▼</span>
                </div>
                
                {isOpen && (
                    <div className="mg-v2-custom-multi-select__dropdown">
                        <div className="mg-v2-custom-multi-select__search">
                            <input
                                type="text"
                                placeholder="검색..."
                                value={searchTerm}
                                onChange={ (e) => setSearchTerm(e.target.value) }
                                className="mg-v2-custom-multi-select__search-input"
                            />
                        </div>
                        <div className="mg-v2-custom-multi-select__options">
                            {filteredOptions.map(option => (
                                <div
                                    key={option.codeValue}
                                    className={`mg-custom-multi-select__option ${
                                        value.includes(option.codeValue) ? 'mg-custom-multi-select__option--selected' : ''
                                    }`}
                                    onClick={ (e) => handleToggle(option.codeValue, e) }
                                >
                                    <span className="mg-v2-custom-multi-select__checkbox">
                                        { value.includes(option.codeValue) ? '✓' : '' }
                                    </span>
                                    <span className="mg-v2-custom-multi-select__label">
                                        { option.icon ? `${option.icon } ` : ''}{ option.codeName || option.codeLabel }
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const createConsultant = useCallback(async (data) => {
        try {
            // tenantId 확인 및 세션 갱신
            let tenantId = null;
            try {
                const user = sessionManager.getUser();
                const userTenantId = user?.tenantId ? user.tenantId.trim() : '';
                const isUserInvalidDefault = !user || !user.tenantId || 
                    userTenantId === 'unknown' || userTenantId === 'default' ||
                    userTenantId.startsWith('unknown-') || userTenantId.startsWith('default-') ||
                    userTenantId === 'tenant-unknown' || userTenantId === 'tenant-default';
                
                if (isUserInvalidDefault) {
                    console.warn('⚠️ tenantId가 없거나 유효하지 않음, 세션 갱신 시도...');
                    await sessionManager.checkSession(true);
                    const refreshedUser = sessionManager.getUser();
                    const refreshedTenantId = refreshedUser?.tenantId ? refreshedUser.tenantId.trim() : '';
                    const isRefreshedInvalidDefault = !refreshedUser || !refreshedUser.tenantId || 
                        refreshedTenantId === 'unknown' || refreshedTenantId === 'default' ||
                        refreshedTenantId.startsWith('unknown-') || refreshedTenantId.startsWith('default-') ||
                        refreshedTenantId === 'tenant-unknown' || refreshedTenantId === 'tenant-default';
                    
                    if (isRefreshedInvalidDefault) {
                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: { message: '테넌트 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.', type: 'error' }
                        }));
                        return { success: false };
                    }
                    tenantId = refreshedUser.tenantId;
                } else {
                    tenantId = user.tenantId;
                }
            } catch (error) {
                console.error('❌ sessionManager 사용 중 오류:', error);
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '세션 정보를 가져올 수 없습니다. 페이지를 새로고침해주세요.', type: 'error' }
                }));
                return { success: false };
            }
            
            // tenantId를 헤더에 명시적으로 포함
            const options = {};
            if (tenantId) {
                options.headers = { 'X-Tenant-Id': tenantId };
            }
            
            // 이름 필수 검증
            if (!data.name || !data.name.trim()) {
                console.error('❌ 이름은 필수입니다.');
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '이름은 필수입니다.', type: 'error' }
                }));
                return { success: false };
            }
            
            // 표준화 2025-12-08: userId 자동 생성
            // userId가 없으면 name을 기반으로 자동 생성
            let userId = data.userId && data.userId.trim();
            if (!userId || userId.length < 2) {
                // name을 userId로 사용 (공백 제거, 소문자 변환)
                userId = data.name.trim().toLowerCase().replace(/\s+/g, '');
            }
            
            const requestData = {
                ...data,
                userId: userId
            };
            
            // specialization 필드 처리: specialty 배열을 문자열로 변환
            if (Array.isArray(data.specialty) && data.specialty.length > 0) {
                requestData.specialization = data.specialty.join(',');
            } else if (data.specialization) {
                // 이미 문자열인 경우 그대로 사용
                requestData.specialization = data.specialization;
            }
            
            console.log('📤 상담사 등록 요청 데이터:', { ...requestData, password: '***' });
            
            const response = await apiPost('/api/v1/admin/consultants', requestData, options);
            console.log('📥 상담사 등록 응답:', response);
            
            // apiPost가 ApiResponse의 data만 추출하므로, response는 User 객체 또는 null
            // User 객체가 있으면 성공 (id 필드 확인)
            if (response && (response.id || response.userId || response.email)) {
                console.log('✅ 상담사 등록 성공:', response);
                await loadConsultants();
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '상담사가 성공적으로 등록되었습니다.', type: 'success' }
                }));
                return { success: true };
            } else {
                console.error('❌ 상담사 등록 실패: 응답이 올바르지 않음', response);
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: (response && response.message) || '상담사 등록에 실패했습니다.', type: 'error' }
                }));
                return { success: false };
            }
        } catch (error) {
            console.error('상담사 등록 오류:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '상담사 등록 중 오류가 발생했습니다.', type: 'error' }
            }));
            return { success: false };
        }
    }, [loadConsultants]);

    const updateConsultant = useCallback(async (id, data) => {
        try {
            const response = await apiPut(`/api/v1/admin/consultants/${id}`, data);
            if (response.success) {
                await loadConsultants();
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '상담사 정보가 성공적으로 수정되었습니다.', type: 'success' }
                }));
                return { success: true };
            } else {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: response.message || '상담사 수정에 실패했습니다.', type: 'error' }
                }));
                return { success: false };
            }
        } catch (error) {
            console.error('상담사 수정 오류:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '상담사 수정 중 오류가 발생했습니다.', type: 'error' }
            }));
            return { success: false };
        }
    }, [loadConsultants]);

    const deleteConsultant = useCallback(async (id) => {
        try {
            const response = await apiDelete(`/api/v1/admin/consultants/${id}`);
            if (response.success) {
                await loadConsultants();
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '상담사가 성공적으로 삭제되었습니다.', type: 'success' }
                }));
                return { success: true };
            } else {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: response.message || '상담사 삭제에 실패했습니다.', type: 'error' }
                }));
                return { success: false };
            }
        } catch (error) {
            console.error('상담사 삭제 오류:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '상담사 삭제 중 오류가 발생했습니다.', type: 'error' }
            }));
            return { success: false };
        }
    }, [loadConsultants]);

    const handlePasswordResetConfirm = useCallback(async (newPassword) => {
        if (!passwordResetConsultant) return;

        try {
            console.log('🔑 상담사 비밀번호 초기화 시작:', passwordResetConsultant.id);
            
            const endpoint = `/api/v1/admin/user-management/${passwordResetConsultant.id}/reset-password?newPassword=${encodeURIComponent(newPassword)}`;
            const response = await StandardizedApi.put(endpoint, {});
            
            console.log('✅ 비밀번호 초기화 응답:', response);
            
            if (response && (response.success !== false)) {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '비밀번호가 성공적으로 초기화되었습니다.', type: 'success' }
                }));
                setShowPasswordResetModal(false);
                setPasswordResetConsultant(null);
            } else {
                throw new Error(response?.message || '비밀번호 초기화에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 비밀번호 초기화 실패:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '비밀번호 초기화 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'), type: 'error' }
            }));
        }
    }, [passwordResetConsultant]);

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
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '작업 중 오류가 발생했습니다.', type: 'error' }
            }));
        }
    }, [modalType, formData, selectedConsultant, createConsultant, updateConsultant, deleteConsultant, handleCloseModal]);

    const stats = getOverallStats();
    const consultantFilterOptions = useMemo(() => {
        const opts = [{ value: 'all', label: '전체' }];
        if (userStatusOptions && userStatusOptions.length > 0) {
            opts.push(...userStatusOptions.map(opt => ({
                value: opt.codeValue,
                label: opt.codeLabel || opt.codeName
            })));
        }
        return opts;
    }, [userStatusOptions]);
    const chipFilterStatus = activeFilters.status === 'all' || !activeFilters.status ? 'all' : activeFilters.status;

    if (loading) {
        if (embedded) {
            return <UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse" />;
        }
        return (
            <AdminCommonLayout>
                <div className="mg-v2-ad-b0kla mg-v2-consultant-management">
                    <div className="mg-v2-ad-b0kla__container">
                        <UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse" />
                    </div>
                </div>
            </AdminCommonLayout>
        );
    }

    const contentBlock = (
        <>
            <ContentHeader
                            title="상담사 관리"
                            subtitle="상담사의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다"
                            actions={
                                <button
                                    type="button"
                                    className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
                                    onClick={() => handleOpenModal('create')}
                                >
                                    <Plus size={20} />
                                    새 상담사 등록
                                </button>
                            }
                        />

                        <div className="mg-v2-ad-b0kla__pill-toggle">
                            <button
                                type="button"
                                className={`mg-v2-ad-b0kla__pill ${mainTab === 'comprehensive' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setMainTab('comprehensive')}
                            >
                                종합관리
                            </button>
                            <button
                                type="button"
                                className={`mg-v2-ad-b0kla__pill ${mainTab === 'basic' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setMainTab('basic')}
                            >
                                기본관리
                            </button>
                        </div>

                        {mainTab === 'comprehensive' ? (
                            <>
                                <ContentSection noCard className="mg-v2-mapping-kpi-section">
                                    <div className="mg-v2-mapping-kpi-section__grid">
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--blue">
                                                <Users size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">총 상담사</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{stats.totalConsultants}명</span>
                                            </div>
                                        </div>
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--green">
                                                <Link2 size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">활성 매칭</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{stats.activeMappings}건</span>
                                            </div>
                                        </div>
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--gray">
                                                <Calendar size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">총 스케줄</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{stats.totalSchedules}건</span>
                                            </div>
                                        </div>
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--orange">
                                                <ClipboardList size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">오늘 스케줄</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{stats.todaySchedules}건</span>
                                            </div>
                                        </div>
                                    </div>
                                </ContentSection>

                                <ContentSection noCard className="mg-v2-mapping-search-section">
                                    <div className="mg-v2-mapping-search-section__row">
                                        <div className="mg-v2-mapping-search-section__input-wrap">
                                            <SearchInput
                                                value={searchTerm}
                                                onChange={handleSearch}
                                                placeholder="이름, 이메일, 전화번호 또는 #태그로 검색..."
                                            />
                                        </div>
                                        <div className="mg-v2-mapping-search-section__chips">
                                            {consultantFilterOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    className={`mg-v2-mapping-search-section__chip ${chipFilterStatus === opt.value ? 'mg-v2-mapping-search-section__chip--active' : ''}`}
                                                    onClick={() => handleFilterChange({ ...activeFilters, status: opt.value })}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </ContentSection>

                                <ContentSection noCard className="mg-v2-mapping-list-block">
                                    <ContentCard className="mg-v2-mapping-list-block__card">
                                        <div className="mg-v2-mapping-list-block__header">
                                            <div className="mg-v2-mapping-list-block__title">상담사 목록</div>
                                        </div>
                                        {getFilteredConsultants.length === 0 ? (
                                            <div className="mg-v2-mapping-list-block__empty">
                                                <div className="mg-v2-mapping-list-block__empty-icon">
                                                    <Users size={48} />
                                                </div>
                                                <h3 className="mg-v2-mapping-list-block__empty-title">상담사가 없습니다</h3>
                                                <p className="mg-v2-mapping-list-block__empty-desc">새 상담사를 등록해보세요.</p>
                                                <button
                                                    type="button"
                                                    className="mg-v2-button mg-v2-button-primary mg-v2-mapping-list-block__empty-btn"
                                                    onClick={() => handleOpenModal('create')}
                                                >
                                                    <Plus size={20} />
                                                    새 상담사 등록
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mg-v2-mapping-list-block__grid">
                                                {getFilteredConsultants.map((consultant) => (
                                                    <div
                                                        key={consultant.id}
                                                        className="mg-v2-profile-card"
                                                        onClick={() => handleConsultantSelect(consultant)}
                                                    >
                                                        <div className="mg-v2-profile-card__header">
                                                            <div className="mg-v2-profile-card__avatar">
                                                                {consultant.name ? consultant.name.charAt(0) : '?'}
                                                            </div>
                                                            <div className="mg-v2-profile-card__info">
                                                                <h3 className="mg-v2-profile-card__name">{consultant.name || '이름 없음'}</h3>
                                                                <div className="mg-v2-profile-card__contact">
                                                                    <span className="mg-v2-profile-card__email">
                                                                        <Mail size={12} /> {consultant.email}
                                                                    </span>
                                                                    <span className="mg-v2-profile-card__phone">
                                                                        <Phone size={12} /> {consultant.phone || '전화번호 없음'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mg-v2-profile-card__badges">
                                                                {(() => {
                                                                    const { label, level } = getConsultantLevel(consultant);
                                                                    return (
                                                                        <span className={`mg-v2-consultant-level-badge mg-v2-consultant-level-badge--${level}`}>
                                                                            {label}
                                                                        </span>
                                                                    );
                                                                })()}
                                                                <span className={`mg-v2-status-badge mg-v2-status-badge--${consultant.status?.toLowerCase() || 'active'}`}>
                                                                    {getStatusLabel(consultant.status || 'ACTIVE')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="mg-v2-profile-card__body">
                                                            <div className="mg-v2-profile-card__stats-grid">
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    <span className="mg-v2-profile-card__stat-label">가입일</span>
                                                                    <span className="mg-v2-profile-card__stat-value">{consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString() : '-'}</span>
                                                                </div>
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    <span className="mg-v2-profile-card__stat-label">총 클라이언트</span>
                                                                    <span className="mg-v2-profile-card__stat-value">{consultant.currentClients || 0}명</span>
                                                                </div>
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    {/* 3단 그리드 여백용 */}
                                                                </div>
                                                            </div>
                                                            {consultant.specialty && (
                                                                <div className="mg-v2-profile-card__extra-info">
                                                                    <span className="mg-v2-profile-card__extra-label">전문분야:</span>
                                                                    <span className="mg-v2-profile-card__extra-value">{consultant.specialty}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mg-v2-profile-card__footer">
                                                            <div className="mg-v2-profile-card__actions">
                                                                <Button
                                                                    variant="primary"
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenModal('edit', consultant);
                                                                    }}
                                                                    preventDoubleClick={true}
                                                                >
                                                                    <Edit size={14} /> 수정
                                                                </Button>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPasswordResetConsultant(consultant);
                                                                        setShowPasswordResetModal(true);
                                                                    }}
                                                                    preventDoubleClick={true}
                                                                    title="비밀번호 초기화"
                                                                >
                                                                    <Key size={14} /> 비밀번호 초기화
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedConsultant(consultant);
                                                                        setShowDeleteConfirm(true);
                                                                    }}
                                                                    preventDoubleClick={true}
                                                                >
                                                                    <Trash2 size={14} /> 삭제
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ContentCard>
                                </ContentSection>
                            </>
                        ) : (
                            <>
                                <ContentSection noCard className="mg-v2-mapping-search-section">
                                    <div className="mg-v2-mapping-search-section__row">
                                        <div className="mg-v2-mapping-search-section__input-wrap">
                                            <SearchInput
                                                value={searchTerm}
                                                onChange={handleSearch}
                                                placeholder="이름, 이메일, 전화번호 또는 #태그로 검색..."
                                            />
                                        </div>
                                        <div className="mg-v2-mapping-search-section__chips">
                                            {consultantFilterOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    className={`mg-v2-mapping-search-section__chip ${chipFilterStatus === opt.value ? 'mg-v2-mapping-search-section__chip--active' : ''}`}
                                                    onClick={() => handleFilterChange({ ...activeFilters, status: opt.value })}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mg-v2-consultant-search-actions">
                                            <Button
                                                variant="primary"
                                                size="small"
                                                onClick={() => handleOpenModal('create')}
                                                preventDoubleClick={true}
                                            >
                                                <Plus size={16} /> 새 상담사 등록
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="small"
                                                onClick={loadConsultants}
                                                preventDoubleClick={true}
                                            >
                                                새로고침
                                            </Button>
                                        </div>
                                    </div>
                                </ContentSection>

                                <ContentSection noCard className="mg-v2-mapping-list-block">
                                    <ContentCard className="mg-v2-mapping-list-block__card">
                                        <div className="mg-v2-mapping-list-block__header">
                                            <div className="mg-v2-mapping-list-block__title">상담사 목록</div>
                                        </div>
                                        {getFilteredConsultants.length === 0 ? (
                                            <div className="mg-v2-mapping-list-block__empty">
                                                <div className="mg-v2-mapping-list-block__empty-icon">
                                                    <Users size={48} />
                                                </div>
                                                <h3 className="mg-v2-mapping-list-block__empty-title">상담사가 없습니다</h3>
                                                <p className="mg-v2-mapping-list-block__empty-desc">새 상담사를 등록해보세요.</p>
                                                <button
                                                    type="button"
                                                    className="mg-v2-button mg-v2-button-primary mg-v2-mapping-list-block__empty-btn"
                                                    onClick={() => handleOpenModal('create')}
                                                >
                                                    <Plus size={20} />
                                                    새 상담사 등록
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mg-v2-mapping-list-block__grid">
                                                {getFilteredConsultants.map((consultant) => (
                                                    <div
                                                        key={consultant.id}
                                                        className="mg-v2-profile-card"
                                                        onClick={() => handleConsultantSelect(consultant)}
                                                    >
                                                        <div className="mg-v2-profile-card__header">
                                                            <div className="mg-v2-profile-card__avatar">
                                                                {consultant.name ? consultant.name.charAt(0) : '?'}
                                                            </div>
                                                            <div className="mg-v2-profile-card__info">
                                                                <h3 className="mg-v2-profile-card__name">{consultant.name || '이름 없음'}</h3>
                                                                <div className="mg-v2-profile-card__contact">
                                                                    <span className="mg-v2-profile-card__email">
                                                                        <Mail size={12} /> {consultant.email}
                                                                    </span>
                                                                    <span className="mg-v2-profile-card__phone">
                                                                        <Phone size={12} /> {consultant.phone || '전화번호 없음'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mg-v2-profile-card__badges">
                                                                {(() => {
                                                                    const { label, level } = getConsultantLevel(consultant);
                                                                    return (
                                                                        <span className={`mg-v2-consultant-level-badge mg-v2-consultant-level-badge--${level}`}>
                                                                            {label}
                                                                        </span>
                                                                    );
                                                                })()}
                                                                <span className={`mg-v2-status-badge mg-v2-status-badge--${consultant.status?.toLowerCase() || 'active'}`}>
                                                                    {getStatusLabel(consultant.status || 'ACTIVE')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="mg-v2-profile-card__body">
                                                            <div className="mg-v2-profile-card__stats-grid">
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    <span className="mg-v2-profile-card__stat-label">가입일</span>
                                                                    <span className="mg-v2-profile-card__stat-value">{consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString() : '-'}</span>
                                                                </div>
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    <span className="mg-v2-profile-card__stat-label">총 클라이언트</span>
                                                                    <span className="mg-v2-profile-card__stat-value">{consultant.currentClients || 0}명</span>
                                                                </div>
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    {/* 3단 그리드 여백용 */}
                                                                </div>
                                                            </div>
                                                            {consultant.specialty && (
                                                                <div className="mg-v2-profile-card__extra-info">
                                                                    <span className="mg-v2-profile-card__extra-label">전문분야:</span>
                                                                    <span className="mg-v2-profile-card__extra-value">{consultant.specialty}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mg-v2-profile-card__footer">
                                                            <div className="mg-v2-profile-card__actions">
                                                                <Button
                                                                    variant="primary"
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenModal('edit', consultant);
                                                                    }}
                                                                    preventDoubleClick={true}
                                                                >
                                                                    <Edit size={14} /> 수정
                                                                </Button>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPasswordResetConsultant(consultant);
                                                                        setShowPasswordResetModal(true);
                                                                    }}
                                                                    preventDoubleClick={true}
                                                                    title="비밀번호 초기화"
                                                                >
                                                                    <Key size={14} /> 비밀번호 초기화
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedConsultant(consultant);
                                                                        setShowDeleteConfirm(true);
                                                                    }}
                                                                    preventDoubleClick={true}
                                                                >
                                                                    <Trash2 size={14} /> 삭제
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ContentCard>
                                </ContentSection>
                            </>
                        )}
        </>
    );

    const getModalTitle = () => {
        if (modalType === 'create') return '새 상담사 등록';
        if (modalType === 'edit') return '상담사 정보 수정';
        if (modalType === 'delete') return '상담사 삭제 확인';
        if (modalType === 'view') return '상담사 상세 정보';
        return '';
    };

    const renderModalBody = () => {
        if (modalType === 'view') {
            return (
                <div className="mg-v2-modal-body">
                    {selectedConsultant && (
                        <div className="mg-v2-consultant-detail">
                            <div className="mg-v2-consultant-detail-header">
                                <div className="mg-v2-consultant-detail-avatar">
                                    {selectedConsultant.name ? selectedConsultant.name.charAt(0) : '?'}
                                </div>
                                <div className="mg-v2-consultant-detail-info">
                                    <h4 className="mg-v2-consultant-detail-name">{selectedConsultant.name || '이름 없음'}</h4>
                                    <p className="mg-v2-consultant-detail-email">{selectedConsultant.email}</p>
                                    <span className="mg-status-badge">
                                        {getStatusLabel(selectedConsultant.status)}
                                    </span>
                                </div>
                            </div>
                            <div className="mg-v2-consultant-detail-content">
                                <div className="mg-v2-detail-section">
                                    <h5>기본 정보</h5>
                                    <div className="mg-v2-detail-grid">
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">전화번호:</span>
                                            <span className="mg-v2-detail-value">{selectedConsultant.phone || '전화번호 없음'}</span>
                                        </div>
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">가입일:</span>
                                            <span className="mg-v2-detail-value">
                                                {selectedConsultant.createdAt ? new Date(selectedConsultant.createdAt).toLocaleDateString('ko-KR') : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mg-v2-detail-section">
                                    <h5>전문분야</h5>
                                    <div className="mg-v2-specialty-list">
                                        {(selectedConsultant.specialty || selectedConsultant.specialization) ? (
                                            <SpecialtyDisplay
                                                consultant={selectedConsultant}
                                                variant="tag"
                                                showTitle={false}
                                                maxItems={10}
                                            />
                                        ) : (
                                            <span className="mg-v2-no-data">전문분야 정보가 없습니다.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        if (modalType === 'delete') {
            return (
                <div className="mg-v2-modal-body">
                    <div className="mg-v2-delete-confirmation">
                        <p>{selectedConsultant?.name || '이 상담사'}를 정말 삭제하시겠습니까?</p>
                        {selectedConsultant && (
                            <div className="mg-v2-detail-grid" style={{ marginTop: '0.75rem' }}>
                                <div className="mg-v2-detail-item">
                                    <span className="mg-v2-detail-label">이름:</span>
                                    <span className="mg-v2-detail-value">{selectedConsultant.name || '-'}</span>
                                </div>
                                <div className="mg-v2-detail-item">
                                    <span className="mg-v2-detail-label">이메일:</span>
                                    <span className="mg-v2-detail-value">{selectedConsultant.email || '-'}</span>
                                </div>
                            </div>
                        )}
                        <p className="mg-v2-warning-text" style={{ marginTop: '1rem', color: 'var(--ad-b0kla-danger, var(--color-danger))' }}>
                            ⚠️ 이 작업은 되돌릴 수 없습니다.
                        </p>
                    </div>
                </div>
            );
        }
        return (
            <div className="mg-v2-modal-body">
                <form className="mg-v2-form" onSubmit={(e) => { e.preventDefault(); handleModalSubmit(e); }}>
                    {(modalType === 'create') && (
                        <div className="mg-v2-info-box mg-v2-ad-b0kla-info-box">
                            <p className="mg-v2-info-text">
                                💡 비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.
                            </p>
                        </div>
                    )}
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">이름 *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleFormChange}
                            placeholder="이름을 입력하세요"
                            className="mg-v2-form-input"
                            required
                        />
                    </div>
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">이메일 *</label>
                        <div className="mg-v2-form-email-row">
                            <input
                                type="email"
                                name="email"
                                value={formData.email || ''}
                                onChange={handleFormChange}
                                placeholder="example@email.com"
                                className="mg-v2-form-input"
                                required
                                disabled={modalType === 'edit'}
                            />
                            {modalType === 'create' && (
                                <button
                                    type="button"
                                    onClick={handleEmailDuplicateCheck}
                                    disabled={isCheckingEmail || !formData.email?.trim()}
                                    className="mg-v2-button mg-v2-button-secondary"
                                >
                                    {isCheckingEmail ? '확인 중...' : '중복확인'}
                                </button>
                            )}
                        </div>
                        {modalType === 'edit' && (
                            <small className="mg-v2-form-help">이메일은 변경할 수 없습니다.</small>
                        )}
                        {modalType === 'create' && emailCheckStatus === 'duplicate' && (
                            <small className="mg-v2-form-help mg-v2-form-help--error">⚠️ 이미 사용 중인 이메일입니다.</small>
                        )}
                        {modalType === 'create' && emailCheckStatus === 'available' && (
                            <small className="mg-v2-form-help mg-v2-form-help--success">✅ 사용 가능한 이메일입니다.</small>
                        )}
                    </div>
                    {modalType === 'create' && (
                        <div className="mg-v2-form-group">
                            <label className="mg-v2-form-label">비밀번호</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password || ''}
                                onChange={handleFormChange}
                                placeholder="비밀번호를 입력하지 않으면 자동 생성됩니다"
                                className="mg-v2-form-input"
                            />
                            <small className="mg-v2-form-help">비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.</small>
                        </div>
                    )}
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">전화번호</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleFormChange}
                            placeholder="전화번호를 입력하세요 (선택사항)"
                            className="mg-v2-form-input"
                        />
                    </div>
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">전문분야</label>
                        <div className="mg-v2-form-help">
                            <span>💡</span>
                            <span>여러 개의 전문분야를 선택할 수 있습니다.</span>
                        </div>
                        <CustomMultiSelect
                            options={specialtyCodes}
                            value={formData.specialty}
                            onChange={handleSpecialtyChange}
                            placeholder="전문분야를 선택하세요"
                        />
                        <small className="mg-v2-form-help">
                            💡 Ctrl(Windows) 또는 Cmd(Mac)를 누르고 클릭하여 여러 개 선택할 수 있습니다.
                        </small>
                    </div>
                </form>
            </div>
        );
    };

    const getModalActions = () => {
        if (modalType === 'view') {
            return (
                <>
                    <button type="button" className="mg-v2-button mg-v2-button-secondary" onClick={handleCloseModal}>
                        닫기
                    </button>
                    <button
                        type="button"
                        className="mg-v2-button mg-v2-button-primary"
                        onClick={() => handleOpenModal('edit', selectedConsultant)}
                    >
                        <Edit size={16} /> 수정
                    </button>
                </>
            );
        }
        return (
            <>
                <button type="button" className="mg-v2-button mg-v2-button-secondary" onClick={handleCloseModal}>
                    취소
                </button>
                <button
                    type="button"
                    className={modalType === 'delete' ? 'mg-v2-button mg-v2-button-danger' : 'mg-v2-button mg-v2-button-primary'}
                    onClick={handleModalSubmit}
                >
                    {modalType === 'create' && '등록'}
                    {modalType === 'edit' && '수정'}
                    {modalType === 'delete' && '삭제'}
                </button>
            </>
        );
    };

    const modalsBlock = (
        <>
            <UnifiedModal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={getModalTitle()}
                size="large"
                className="mg-v2-ad-b0kla"
                backdropClick
                showCloseButton
                actions={getModalActions()}
            >
                {renderModalBody()}
            </UnifiedModal>

            <UnifiedModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="상담사 삭제 확인"
                size="medium"
                variant="confirm"
                className="mg-v2-ad-b0kla"
                backdropClick
                showCloseButton
                actions={
                    <>
                        <button
                            type="button"
                            className="mg-v2-button mg-v2-button-secondary"
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            className="mg-v2-button mg-v2-button-danger"
                            onClick={async () => {
                                if (selectedConsultant) {
                                    const result = await deleteConsultant(selectedConsultant.id);
                                    if (result?.success) setShowDeleteConfirm(false);
                                }
                            }}
                        >
                            삭제
                        </button>
                    </>
                }
            >
                <div className="mg-v2-modal-body">
                    <p>{selectedConsultant?.name || '이 상담사'}를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
                </div>
            </UnifiedModal>

            {/* 비밀번호 초기화 모달 */}
            {showPasswordResetModal && passwordResetConsultant && (
                <PasswordResetModal
                    user={passwordResetConsultant}
                    userType="consultant"
                    onClose={() => {
                        setShowPasswordResetModal(false);
                        setPasswordResetConsultant(null);
                    }}
                    onConfirm={handlePasswordResetConfirm}
                />
            )}
        </>
    );

    if (embedded) {
        return <>{contentBlock}{modalsBlock}</>;
    }

    return (
        <AdminCommonLayout>
            <div className="mg-v2-ad-b0kla mg-v2-consultant-management">
                <div className="mg-v2-ad-b0kla__container">
                    <ContentArea>
                        {contentBlock}
                    </ContentArea>
                    {modalsBlock}
                </div>
            </div>
        </AdminCommonLayout>
    );
};

ConsultantComprehensiveManagement.propTypes = {
  embedded: PropTypes.bool
};

export default ConsultantComprehensiveManagement;