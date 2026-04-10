import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Plus, Users, Link2, Calendar, ClipboardList, Edit, Trash2, Key, Mail, Phone } from 'lucide-react';
import Button from '../ui/Button/Button';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { getStatusLabel } from '../../utils/colorUtils';

import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import StandardizedApi from '../../utils/standardizedApi';
import {
    getAllConsultantsWithStats,
    getConsultantBadgeDisplay,
    formatConsultantGenderLabel,
    getConsultantAgeYears
} from '../../utils/consultantHelper';
import SpecialtyDisplay from '../ui/SpecialtyDisplay';
import UnifiedModal from '../common/modals/UnifiedModal';
import { getCommonCodes } from '../../utils/commonCodeApi';
import { sessionManager } from '../../utils/sessionManager';
import MgEmailFieldWithAutocomplete from '../common/MgEmailFieldWithAutocomplete';
import ProfileImageInput from '../common/ProfileImageInput';
import Avatar from '../common/Avatar';
import PasswordResetModal from './PasswordResetModal';
import { showSuccess, showError } from '../../utils/notification';
import { VALIDATION_MESSAGES } from '../../constants/messages';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import ContentCard from '../dashboard-v2/content/ContentCard';
import { SearchInput } from '../dashboard-v2/atoms';
import { ViewModeToggle, SmallCardGrid, ListTableView, StatusBadge } from '../common';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './mapping-management/organisms/MappingKpiSection.css';
import './mapping-management/organisms/MappingSearchSection.css';
import './mapping-management/organisms/MappingListBlock.css';
import './mapping-management/MappingManagementPage.css';
import './ConsultantManagementPage.css';
import './ProfileCard.css';
import { toDisplayString } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';

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
        name: '',
        email: '',
        password: '',
        phone: '',
        status: 'ACTIVE',
        specialty: [],
        profileImageUrl: '',
        grade: '',
        rrnFirst6: '',
        rrnLast1: '',
        address: '',
        addressDetail: '',
        postalCode: '',
        qualifications: '',
        workHistory: ''
    });
    const [specialtyCodes, setSpecialtyCodes] = useState([]);
    const [gradeOptions, setGradeOptions] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [emailCheckStatus, setEmailCheckStatus] = useState(null); // 'checking', 'duplicate', 'available', null
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [viewMode, setViewMode] = useState('smallCard'); // 'largeCard' | 'smallCard' | 'list' — 기본: 컴팩트(작은 카드)

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
                        profileImageUrl: consultantEntity.profileImageUrl,
                        specialty: consultantEntity.specialty,
                        specialtyDetails: consultantEntity.specialtyDetails,
                        specialization: consultantEntity.specialization,
                        specializationDetails: consultantEntity.specializationDetails,
                        address: consultantEntity.address,
                        addressDetail: consultantEntity.addressDetail,
                        postalCode: consultantEntity.postalCode,
                        certification: consultantEntity.certification,
                        workHistory: consultantEntity.workHistory,
                        grade: consultantEntity.grade,
                        yearsOfExperience: consultantEntity.yearsOfExperience,
                        maxClients: consultantEntity.maxClients,
                        totalConsultations: consultantEntity.totalConsultations,
                        createdAt: consultantEntity.createdAt,
                        updatedAt: consultantEntity.updatedAt,
                        status: consultantEntity.status,
                        gender: consultantEntity.gender,
                        birthDate: consultantEntity.birthDate ?? consultantEntity.birth_date,
                        age: consultantEntity.age,
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

    // 상담사 등급 공통코드 로드 (CONSULTANT_GRADE)
    useEffect(() => {
        const loadGradeCodes = async () => {
            try {
                const codes = await getCommonCodes('CONSULTANT_GRADE');
                const list = Array.isArray(codes) ? codes : [];
                setGradeOptions(list.map(c => ({
                    codeValue: c.codeValue || c.value,
                    codeLabel: c.codeLabel || c.codeName || c.label || c.codeValue
                })));
            } catch (error) {
                console.error('상담사 등급 공통코드 로드 실패:', error);
                setGradeOptions([
                    { codeValue: 'CONSULTANT_JUNIOR', codeLabel: '주니어 상담사' },
                    { codeValue: 'CONSULTANT_SENIOR', codeLabel: '시니어 상담사' },
                    { codeValue: 'CONSULTANT_EXPERT', codeLabel: '엑스퍼트 상담사' },
                    { codeValue: 'CONSULTANT_MASTER', codeLabel: '마스터 상담사' }
                ]);
            }
        };
        loadGradeCodes();
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
                    status: consultant.status || 'ACTIVE',
                    specialty: specialties,
                    profileImageUrl: consultant.profileImageUrl || '',
                    grade: consultant.grade || '',
                    rrnFirst6: '',
                    rrnLast1: '',
                    address: consultant.address || '',
                    addressDetail: consultant.addressDetail || '',
                    postalCode: consultant.postalCode || '',
                    qualifications: consultant.certification || '',
                    workHistory: consultant.workHistory || ''
                });
            }
        } else if (type === 'create') {
            setFormData({
                name: '',
                email: '',
                password: '',
                phone: '',
                status: 'ACTIVE',
                specialty: [],
                profileImageUrl: '',
                grade: '',
                rrnFirst6: '',
                rrnLast1: '',
                address: '',
                addressDetail: '',
                postalCode: '',
                qualifications: '',
                workHistory: ''
            });
        }
        setShowModal(true);
    }, [loadSpecialtyCodes]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setModalType('view');
        setSelectedConsultant(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            status: 'ACTIVE',
            specialty: [],
            profileImageUrl: '',
            grade: '',
            rrnFirst6: '',
            rrnLast1: '',
            address: '',
            addressDetail: '',
            postalCode: '',
            qualifications: '',
            workHistory: ''
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
                detail: { message: VALIDATION_MESSAGES.REQUIRED_EMAIL, type: 'warning' }
            }));
            return;
        }
        
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: VALIDATION_MESSAGES.INVALID_EMAIL_FORMAT, type: 'warning' }
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
                        detail: { message: VALIDATION_MESSAGES.EMAIL_EXISTS, type: 'error' }
                    }));
                } else {
                    setEmailCheckStatus('available');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.EMAIL_AVAILABLE, type: 'success' }
                    }));
                }
            } else {
                setEmailCheckStatus(null);
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: VALIDATION_MESSAGES.EMAIL_DUPLICATE_CHECK_ERROR, type: 'error' }
                }));
            }
        } catch (error) {
            console.error('❌ 이메일 중복 확인 오류:', error);
            setEmailCheckStatus(null);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: VALIDATION_MESSAGES.EMAIL_DUPLICATE_CHECK_ERROR, type: 'error' }
            }));
        } finally {
            setIsCheckingEmail(false);
        }
    }, [formData.email]);

    const handleSpecialtyTagClick = useCallback((codeValue) => {
        setFormData(prev => {
            const current = prev.specialty || [];
            const next = current.includes(codeValue)
                ? current.filter(v => v !== codeValue)
                : [...current, codeValue];
            return { ...prev, specialty: next };
        });
    }, []);

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

            // 이메일 필수 검증
            const emailTrimmed = data.email != null ? String(data.email).trim() : '';
            if (!emailTrimmed) {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: VALIDATION_MESSAGES.REQUIRED_EMAIL, type: 'error' }
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
                userId: userId,
                profileImageUrl: data.profileImageUrl || undefined
            };
            
            // specialization 필드 처리: specialty 배열을 문자열로 변환
            if (Array.isArray(data.specialty) && data.specialty.length > 0) {
                requestData.specialization = data.specialty.join(',');
            } else if (data.specialization) {
                // 이미 문자열인 경우 그대로 사용
                requestData.specialization = data.specialization;
            }
            
            console.log('📤 상담사 등록 요청 데이터:', { ...requestData, password: '***', profileImageUrl: requestData.profileImageUrl ? '(base64)' : undefined });
            
            const response = await apiPost('/api/v1/admin/consultants', requestData, options);
            console.log('📥 상담사 등록 응답:', response);
            
            // apiPost가 ApiResponse의 data만 추출하므로, response는 User 객체 또는 null
            // User 객체가 있으면 성공 (id 필드 확인)
            if (response && (response.id || response.userId || response.email)) {
                console.log('✅ 상담사 등록 성공:', response);
                await loadConsultants();
                window.dispatchEvent(new CustomEvent('admin-dashboard-refresh-stats'));
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

    const updateConsultant = useCallback(async (id, data, existing) => {
        try {
            const specialization = Array.isArray(data.specialty) && data.specialty.length > 0
                ? data.specialty.join(',')
                : (data.specialization != null ? String(data.specialization) : '');
            const nameVal = data.name != null ? String(data.name).trim() : '';
            const emailVal = data.email != null ? String(data.email).trim() : '';
            const phoneVal = data.phone != null ? String(data.phone).trim() : '';
            const rrnFirst6 = data.rrnFirst6 != null ? String(data.rrnFirst6).trim() : '';
            const rrnLast1 = data.rrnLast1 != null ? String(data.rrnLast1).trim() : '';
            if (rrnFirst6 || rrnLast1) {
                if (rrnFirst6.length !== 6 || !/^[0-9]{6}$/.test(rrnFirst6)) {
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: '주민번호 앞 6자리는 6자리 숫자, 뒤 1자리는 1자리 숫자로 입력해 주세요.', type: 'error' }
                    }));
                    return { success: false };
                }
                if (rrnLast1.length !== 1 || !/^[1-4]$/.test(rrnLast1)) {
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: '주민번호 앞 6자리는 6자리 숫자, 뒤 1자리는 1자리 숫자로 입력해 주세요.', type: 'error' }
                    }));
                    return { success: false };
                }
            }
            const requestPayload = {
                name: nameVal === '' ? (existing?.name ?? '') : nameVal,
                email: emailVal === '' ? (existing?.email ?? '') : emailVal,
                phone: phoneVal === '' ? (existing?.phone ?? '') : phoneVal,
                specialization,
                profileImageUrl: (data.profileImageUrl != null && data.profileImageUrl !== '') ? data.profileImageUrl : (existing?.profileImageUrl ?? undefined),
                grade: data.grade != null && String(data.grade).trim() !== '' ? String(data.grade).trim() : undefined,
                address: data.address != null ? data.address.trim() : undefined,
                addressDetail: data.addressDetail != null ? data.addressDetail.trim() : undefined,
                postalCode: data.postalCode != null ? data.postalCode.trim() : undefined,
                qualifications: data.qualifications != null ? data.qualifications.trim() : undefined,
                workHistory: data.workHistory != null ? data.workHistory.trim() : undefined
            };
            if (rrnFirst6) requestPayload.rrnFirst6 = rrnFirst6;
            if (rrnLast1) requestPayload.rrnLast1 = rrnLast1;
            const response = await apiPut(`/api/v1/admin/consultants/${id}`, requestPayload);
            // apiPut은 ApiResponse의 data만 반환하므로 success는 response.success가 아닌 반환값 유무/형식으로 판단
            const isSuccess = response != null && (response.success === true || response.id != null);
            if (isSuccess) {
                await loadConsultants();
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '상담사 정보가 성공적으로 수정되었습니다.', type: 'success' }
                }));
                return { success: true };
            } else {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: (response && response.message) || '상담사 수정에 실패했습니다.', type: 'error' }
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
            const response = await StandardizedApi.delete(`/api/v1/admin/consultants/${id}`);
            if (!response || response.success !== false) {
                await loadConsultants();
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '상담사가 성공적으로 삭제되었습니다.', type: 'success' }
                }));
                return { success: true };
            } else {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: response?.message || '상담사 삭제에 실패했습니다.', type: 'error' }
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

            const endpoint = `/api/v1/admin/user-management/${passwordResetConsultant.id}/reset-password`;
            const response = await StandardizedApi.put(endpoint, { newPassword });

            console.log('✅ 비밀번호 초기화 응답:', response);

            if (response && (response.success !== false)) {
                showSuccess('비밀번호가 성공적으로 초기화되었습니다.');
                setShowPasswordResetModal(false);
                setPasswordResetConsultant(null);
            } else {
                throw new Error(response?.message || '비밀번호 초기화에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 비밀번호 초기화 실패:', error);
            showError('비밀번호 초기화 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
            throw error;
        }
    }, [passwordResetConsultant]);

    const handleModalSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        try {
            let result;

            if (modalType === 'create') {
                const emailTrimmed = formData.email != null ? String(formData.email).trim() : '';
                if (emailTrimmed && emailCheckStatus !== 'available') {
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.EMAIL_DUPLICATE_CHECK_REQUIRED, type: 'warning' }
                    }));
                    return;
                }
                result = await createConsultant(formData);
            } else if (modalType === 'edit') {
                result = await updateConsultant(selectedConsultant.id, formData, selectedConsultant);
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
    }, [modalType, formData, selectedConsultant, emailCheckStatus, createConsultant, updateConsultant, deleteConsultant, handleCloseModal]);

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
            return <UnifiedLoading type="inline" text="데이터를 불러오는 중..." variant="pulse" />;
        }
        return (
            <AdminCommonLayout>
                <ContentArea>
                    <UnifiedLoading type="inline" text="데이터를 불러오는 중..." variant="pulse" />
                </ContentArea>
            </AdminCommonLayout>
        );
    }

    const contentBlock = (
        <>
            {!embedded && (
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
            )}

            <ContentSection noCard>
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
            </ContentSection>

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
                                                <span className="mg-v2-mapping-kpi-section__value">{toDisplayString(stats.totalConsultants)}명</span>
                                            </div>
                                        </div>
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--green">
                                                <Link2 size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">활성 매칭</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{toDisplayString(stats.activeMappings)}건</span>
                                            </div>
                                        </div>
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--gray">
                                                <Calendar size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">총 스케줄</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{toDisplayString(stats.totalSchedules)}건</span>
                                            </div>
                                        </div>
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--orange">
                                                <ClipboardList size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">오늘 스케줄</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{toDisplayString(stats.todaySchedules)}건</span>
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
                                            {embedded && (
                                                <button
                                                    type="button"
                                                    className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
                                                    onClick={() => handleOpenModal('create')}
                                                    style={{ marginRight: '8px', height: '32px', fontSize: '13px' }}
                                                >
                                                    <Plus size={16} style={{ marginRight: '4px' }} />
                                                    새 상담사 등록
                                                </button>
                                            )}
                                            {consultantFilterOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    className={`mg-v2-mapping-search-section__chip ${chipFilterStatus === opt.value ? 'mg-v2-mapping-search-section__chip--active' : ''}`}
                                                    onClick={() => handleFilterChange({ ...activeFilters, status: opt.value })}
                                                >
                                                    {toDisplayString(opt.label)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </ContentSection>

                                <ContentSection noCard className="mg-v2-mapping-list-block">
                                    <ContentCard className="mg-v2-mapping-list-block__card">
                                        <div className="mg-v2-mapping-list-block__header">
                                            <div className="mg-v2-mapping-list-block__title">상담사 목록</div>
                                            <ViewModeToggle
                                                viewMode={viewMode}
                                                onViewModeChange={setViewMode}
                                                className="mg-v2-mapping-list-block__toggle"
                                                ariaLabel="목록 보기 전환"
                                            />
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
                                        ) : viewMode === 'largeCard' ? (
                                            <div className="mg-v2-mapping-list-block__grid">
                                                {getFilteredConsultants.map((consultant) => (
                                                    <div
                                                        key={consultant.id}
                                                        className="mg-v2-profile-card"
                                                        onClick={() => handleConsultantSelect(consultant)}
                                                    >
                                                        <div className="mg-v2-profile-card__header">
                                                            <Avatar
                                                                profileImageUrl={consultant.profileImageUrl}
                                                                displayName={toDisplayString(consultant.name)}
                                                                className="mg-v2-profile-card__avatar"
                                                            />
                                                            <div className="mg-v2-profile-card__info">
                                                                <h3 className="mg-v2-profile-card__name"><SafeText fallback="이름 없음">{consultant.name}</SafeText></h3>
                                                                <div className="mg-v2-profile-card__contact">
                                                                    <span className="mg-v2-profile-card__email">
                                                                        <Mail size={12} /> <SafeText>{consultant.email}</SafeText>
                                                                    </span>
                                                                    <span className="mg-v2-profile-card__phone">
                                                                        <Phone size={12} /> <SafeText fallback="전화번호 없음">{consultant.phone}</SafeText>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mg-v2-profile-card__badges">
                                                                {(() => {
                                                                    const { label, level } = getConsultantBadgeDisplay(consultant);
                                                                    return (
                                                                        <span className={`mg-v2-consultant-level-badge mg-v2-consultant-level-badge--${level}`}>
                                                                            <SafeText>{label}</SafeText>
                                                                        </span>
                                                                    );
                                                                })()}
                                                                <StatusBadge status={consultant.status || 'ACTIVE'}><SafeText>{getStatusLabel(consultant.status || 'ACTIVE')}</SafeText></StatusBadge>
                                                            </div>
                                                        </div>
                                                        <div className="mg-v2-profile-card__body">
                                                            <div className="mg-v2-profile-card__stats-grid">
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    <span className="mg-v2-profile-card__stat-label">가입일</span>
                                                                    <span className="mg-v2-profile-card__stat-value"><SafeText fallback="-">{consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString() : null}</SafeText></span>
                                                                </div>
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    <span className="mg-v2-profile-card__stat-label">총 클라이언트</span>
                                                                    <span className="mg-v2-profile-card__stat-value">{toDisplayString(consultant.currentClients ?? 0)}명</span>
                                                                </div>
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    {/* 3단 그리드 여백용 */}
                                                                </div>
                                                            </div>
                                                            {consultant.specialty && (
                                                                <div className="mg-v2-profile-card__extra-info">
                                                                    <span className="mg-v2-profile-card__extra-label">전문분야:</span>
                                                                    <span className="mg-v2-profile-card__extra-value"><SafeText>{consultant.specialty}</SafeText></span>
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
                                        ) : viewMode === 'smallCard' ? (
                                            <SmallCardGrid>
                                                {getFilteredConsultants.map((consultant) => (
                                                    <div
                                                        key={consultant.id}
                                                        className="mg-v2-profile-card mg-v2-profile-card--compact"
                                                        onClick={() => handleConsultantSelect(consultant)}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleConsultantSelect(consultant); } }}
                                                    >
                                                        <div className="mg-v2-profile-card__header">
                                                            <Avatar
                                                                profileImageUrl={consultant.profileImageUrl}
                                                                displayName={toDisplayString(consultant.name)}
                                                                className="mg-v2-profile-card__avatar"
                                                                size={36}
                                                            />
                                                            <div className="mg-v2-profile-card__info">
                                                                <h3 className="mg-v2-profile-card__name"><SafeText fallback="이름 없음">{consultant.name}</SafeText></h3>
                                                                <div className="mg-v2-profile-card__contact">
                                                                    <span className="mg-v2-profile-card__email"><Mail size={12} /> <SafeText>{consultant.email}</SafeText></span>
                                                                    <span className="mg-v2-profile-card__phone"><Phone size={12} /> <SafeText fallback="전화번호 없음">{consultant.phone}</SafeText></span>
                                                                </div>
                                                            </div>
                                                            <div className="mg-v2-profile-card__badges">
                                                                {(() => {
                                                                    const { label, level } = getConsultantBadgeDisplay(consultant);
                                                                    return <span className={`mg-v2-consultant-level-badge mg-v2-consultant-level-badge--${level}`}><SafeText>{label}</SafeText></span>;
                                                                })()}
                                                                <StatusBadge status={consultant.status || 'ACTIVE'}><SafeText>{getStatusLabel(consultant.status || 'ACTIVE')}</SafeText></StatusBadge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </SmallCardGrid>
                                        ) : (
                                            <ListTableView
                                                columns={[
                                                    { key: 'name', label: '이름' },
                                                    { key: 'email', label: '이메일' },
                                                    { key: 'status', label: '상태' },
                                                    { key: 'createdAt', label: '가입일', hideOnMobile: true },
                                                    { key: 'currentClients', label: '클라이언트 수', hideOnMobile: true }
                                                ]}
                                                data={getFilteredConsultants}
                                                renderCell={(key, item) => {
                                                    if (key === 'status') return getStatusLabel(item.status || 'ACTIVE');
                                                    if (key === 'createdAt') return item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '-';
                                                    if (key === 'currentClients') return item.currentClients != null ? `${item.currentClients}명` : '-';
                                                    if (key === 'name' || key === 'email') return toDisplayString(item[key], '-');
                                                    const v = item[key];
                                                    return toDisplayString(v, '-');
                                                }}
                                                onRowClick={handleConsultantSelect}
                                            />
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
                                            {embedded && (
                                                <button
                                                    type="button"
                                                    className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
                                                    onClick={() => handleOpenModal('create')}
                                                    style={{ marginRight: '8px', height: '32px', fontSize: '13px' }}
                                                >
                                                    <Plus size={16} style={{ marginRight: '4px' }} />
                                                    새 상담사 등록
                                                </button>
                                            )}
                                            {consultantFilterOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    className={`mg-v2-mapping-search-section__chip ${chipFilterStatus === opt.value ? 'mg-v2-mapping-search-section__chip--active' : ''}`}
                                                    onClick={() => handleFilterChange({ ...activeFilters, status: opt.value })}
                                                >
                                                    {toDisplayString(opt.label)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </ContentSection>

                                <ContentSection noCard className="mg-v2-mapping-list-block">
                                    <ContentCard className="mg-v2-mapping-list-block__card">
                                        <div className="mg-v2-mapping-list-block__header">
                                            <div className="mg-v2-mapping-list-block__title">상담사 목록</div>
                                            <ViewModeToggle
                                                viewMode={viewMode}
                                                onViewModeChange={setViewMode}
                                                className="mg-v2-mapping-list-block__toggle"
                                                ariaLabel="목록 보기 전환"
                                            />
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
                                        ) : viewMode === 'largeCard' ? (
                                            <div className="mg-v2-mapping-list-block__grid">
                                                {getFilteredConsultants.map((consultant) => (
                                                    <div
                                                        key={consultant.id}
                                                        className="mg-v2-profile-card"
                                                        onClick={() => handleConsultantSelect(consultant)}
                                                    >
                                                        <div className="mg-v2-profile-card__header">
                                                            <Avatar
                                                                profileImageUrl={consultant.profileImageUrl}
                                                                displayName={toDisplayString(consultant.name)}
                                                                className="mg-v2-profile-card__avatar"
                                                            />
                                                            <div className="mg-v2-profile-card__info">
                                                                <h3 className="mg-v2-profile-card__name"><SafeText fallback="이름 없음">{consultant.name}</SafeText></h3>
                                                                <div className="mg-v2-profile-card__contact">
                                                                    <span className="mg-v2-profile-card__email">
                                                                        <Mail size={12} /> <SafeText>{consultant.email}</SafeText>
                                                                    </span>
                                                                    <span className="mg-v2-profile-card__phone">
                                                                        <Phone size={12} /> <SafeText fallback="전화번호 없음">{consultant.phone}</SafeText>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mg-v2-profile-card__badges">
                                                                {(() => {
                                                                    const { label, level } = getConsultantBadgeDisplay(consultant);
                                                                    return (
                                                                        <span className={`mg-v2-consultant-level-badge mg-v2-consultant-level-badge--${level}`}>
                                                                            <SafeText>{label}</SafeText>
                                                                        </span>
                                                                    );
                                                                })()}
                                                                <StatusBadge status={consultant.status || 'ACTIVE'}><SafeText>{getStatusLabel(consultant.status || 'ACTIVE')}</SafeText></StatusBadge>
                                                            </div>
                                                        </div>
                                                        <div className="mg-v2-profile-card__body">
                                                            <div className="mg-v2-profile-card__stats-grid">
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    <span className="mg-v2-profile-card__stat-label">가입일</span>
                                                                    <span className="mg-v2-profile-card__stat-value"><SafeText fallback="-">{consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString() : null}</SafeText></span>
                                                                </div>
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    <span className="mg-v2-profile-card__stat-label">총 클라이언트</span>
                                                                    <span className="mg-v2-profile-card__stat-value">{toDisplayString(consultant.currentClients ?? 0)}명</span>
                                                                </div>
                                                                <div className="mg-v2-profile-card__stat-item">
                                                                    {/* 3단 그리드 여백용 */}
                                                                </div>
                                                            </div>
                                                            {consultant.specialty && (
                                                                <div className="mg-v2-profile-card__extra-info">
                                                                    <span className="mg-v2-profile-card__extra-label">전문분야:</span>
                                                                    <span className="mg-v2-profile-card__extra-value"><SafeText>{consultant.specialty}</SafeText></span>
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
                                        ) : viewMode === 'smallCard' ? (
                                            <SmallCardGrid>
                                                {getFilteredConsultants.map((consultant) => (
                                                    <div
                                                        key={consultant.id}
                                                        className="mg-v2-profile-card mg-v2-profile-card--compact"
                                                        onClick={() => handleConsultantSelect(consultant)}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleConsultantSelect(consultant); } }}
                                                    >
                                                        <div className="mg-v2-profile-card__header">
                                                            <Avatar
                                                                profileImageUrl={consultant.profileImageUrl}
                                                                displayName={toDisplayString(consultant.name)}
                                                                className="mg-v2-profile-card__avatar"
                                                                size={36}
                                                            />
                                                            <div className="mg-v2-profile-card__info">
                                                                <h3 className="mg-v2-profile-card__name"><SafeText fallback="이름 없음">{consultant.name}</SafeText></h3>
                                                                <div className="mg-v2-profile-card__contact">
                                                                    <span className="mg-v2-profile-card__email"><Mail size={12} /> <SafeText>{consultant.email}</SafeText></span>
                                                                    <span className="mg-v2-profile-card__phone"><Phone size={12} /> <SafeText fallback="전화번호 없음">{consultant.phone}</SafeText></span>
                                                                </div>
                                                            </div>
                                                            <div className="mg-v2-profile-card__badges">
                                                                {(() => {
                                                                    const { label, level } = getConsultantBadgeDisplay(consultant);
                                                                    return <span className={`mg-v2-consultant-level-badge mg-v2-consultant-level-badge--${level}`}><SafeText>{label}</SafeText></span>;
                                                                })()}
                                                                <StatusBadge status={consultant.status || 'ACTIVE'}><SafeText>{getStatusLabel(consultant.status || 'ACTIVE')}</SafeText></StatusBadge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </SmallCardGrid>
                                        ) : (
                                            <ListTableView
                                                columns={[
                                                    { key: 'name', label: '이름' },
                                                    { key: 'email', label: '이메일' },
                                                    { key: 'status', label: '상태' },
                                                    { key: 'createdAt', label: '가입일', hideOnMobile: true },
                                                    { key: 'currentClients', label: '클라이언트 수', hideOnMobile: true }
                                                ]}
                                                data={getFilteredConsultants}
                                                renderCell={(key, item) => {
                                                    if (key === 'status') return getStatusLabel(item.status || 'ACTIVE');
                                                    if (key === 'createdAt') return item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '-';
                                                    if (key === 'currentClients') return item.currentClients != null ? `${item.currentClients}명` : '-';
                                                    if (key === 'name' || key === 'email') return toDisplayString(item[key], '-');
                                                    const v = item[key];
                                                    return toDisplayString(v, '-');
                                                }}
                                                onRowClick={handleConsultantSelect}
                                            />
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
            const viewGenderLabel = selectedConsultant
                ? formatConsultantGenderLabel(selectedConsultant.gender)
                : null;
            const viewAgeYears = selectedConsultant
                ? getConsultantAgeYears(selectedConsultant)
                : null;
            return (
                <div className="mg-v2-modal-body">
                    {selectedConsultant && (
                        <div className="mg-v2-consultant-detail">
                            <div className="mg-v2-consultant-detail-header">
                                <Avatar
                                    profileImageUrl={selectedConsultant.profileImageUrl}
                                    displayName={toDisplayString(selectedConsultant.name)}
                                    className="mg-v2-consultant-detail-avatar"
                                    size={64}
                                />
                                <div className="mg-v2-consultant-detail-info">
                                    <h4 className="mg-v2-consultant-detail-name"><SafeText fallback="이름 없음">{selectedConsultant.name}</SafeText></h4>
                                    <p className="mg-v2-consultant-detail-email"><SafeText>{selectedConsultant.email}</SafeText></p>
                                    <span className="mg-status-badge">
                                        <SafeText>{getStatusLabel(selectedConsultant.status)}</SafeText>
                                    </span>
                                </div>
                            </div>
                            <div className="mg-v2-consultant-detail-content">
                                <div className="mg-v2-detail-section">
                                    <h5>기본 정보</h5>
                                    <div className="mg-v2-detail-grid">
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">성별:</span>
                                            <span className="mg-v2-detail-value">
                                                <SafeText fallback="-">{viewGenderLabel ?? null}</SafeText>
                                            </span>
                                        </div>
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">나이:</span>
                                            <span className="mg-v2-detail-value">
                                                <SafeText fallback="-">
                                                    {viewAgeYears != null ? `${viewAgeYears}세` : null}
                                                </SafeText>
                                            </span>
                                        </div>
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">전화번호:</span>
                                            <span className="mg-v2-detail-value"><SafeText fallback="전화번호 없음">{selectedConsultant.phone}</SafeText></span>
                                        </div>
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">가입일:</span>
                                            <span className="mg-v2-detail-value">
                                                <SafeText fallback="-">
                                                  {selectedConsultant.createdAt ? new Date(selectedConsultant.createdAt).toLocaleDateString('ko-KR') : null}
                                                </SafeText>
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
                        <p><SafeText fallback="이 상담사">{selectedConsultant?.name}</SafeText>를 정말 삭제하시겠습니까?</p>
                        {selectedConsultant && (
                            <div className="mg-v2-detail-grid" style={{ marginTop: '0.75rem' }}>
                                <div className="mg-v2-detail-item">
                                    <span className="mg-v2-detail-label">이름:</span>
                                    <span className="mg-v2-detail-value"><SafeText fallback="-">{selectedConsultant.name}</SafeText></span>
                                </div>
                                <div className="mg-v2-detail-item">
                                    <span className="mg-v2-detail-label">이메일:</span>
                                    <span className="mg-v2-detail-value"><SafeText fallback="-">{selectedConsultant.email}</SafeText></span>
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
                    <ProfileImageInput
                        value={formData.profileImageUrl || ''}
                        onChange={(url) => setFormData(prev => ({ ...prev, profileImageUrl: url || '' }))}
                        maxBytes={2 * 1024 * 1024}
                        cropSize={400}
                        maxSize={512}
                        quality={0.85}
                        helpText="이미지 파일만 가능, 최대 2MB (리사이즈·크롭 적용)"
                    />
                    {/* 공통 순서: 1. 주민번호 2. 이름 3. 전화번호 4. 주소 → 나머지 */}
                    <div className="mg-v2-form-group">
                        {modalType === 'edit' && (
                            <small className="mg-v2-form-help">수정 시 기존 값은 표시하지 않습니다. 변경할 때만 입력해 주세요.</small>
                        )}
                        <div className="mg-v2-form-row mg-v2-form-row--two">
                            <div className="mg-v2-form-group">
                                <label htmlFor="consultant-rrnFirst6" className="mg-v2-form-label">주민번호 앞 6자리 (선택)</label>
                                <input
                                    type="text"
                                    id="consultant-rrnFirst6"
                                    name="rrnFirst6"
                                    value={formData.rrnFirst6 || ''}
                                    onChange={handleFormChange}
                                    placeholder="900101"
                                    maxLength={6}
                                    inputMode="numeric"
                                    className="mg-v2-form-input"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <label htmlFor="consultant-rrnLast1" className="mg-v2-form-label">주민번호 뒤 1자리 (선택)</label>
                                <input
                                    type="text"
                                    id="consultant-rrnLast1"
                                    name="rrnLast1"
                                    value={formData.rrnLast1 || ''}
                                    onChange={handleFormChange}
                                    placeholder="1"
                                    maxLength={1}
                                    inputMode="numeric"
                                    className="mg-v2-form-input"
                                />
                            </div>
                        </div>
                    </div>
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
                        <label htmlFor="consultant-grade" className="mg-v2-form-label">등급</label>
                        <select
                            id="consultant-grade"
                            name="grade"
                            value={formData.grade || ''}
                            onChange={handleFormChange}
                            className="mg-v2-form-input"
                        >
                            <option value="">등급 선택</option>
                            {gradeOptions.map((opt) => (
                                <option key={opt.codeValue} value={opt.codeValue}>
                                    {toDisplayString(opt.codeLabel)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">주소 검색</label>
                        <div className="mg-v2-address-search-row">
                            <button
                                type="button"
                                className="mg-v2-button mg-v2-button-secondary"
                                onClick={() => {
                                    if (typeof window !== 'undefined' && window.daum && window.daum.Postcode) {
                                        new window.daum.Postcode({
                                            oncomplete: function (data) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    postalCode: data.zonecode || '',
                                                    address: data.address || ''
                                                }));
                                            }
                                        }).open();
                                    } else {
                                        window.dispatchEvent(new CustomEvent('showNotification', {
                                            detail: { message: '주소 검색 서비스를 불러올 수 없습니다.', type: 'info' }
                                        }));
                                    }
                                }}
                            >
                                주소 검색
                            </button>
                            <input
                                type="text"
                                readOnly
                                className="mg-v2-form-input mg-v2-form-input--readonly"
                                value={formData.address || ''}
                                placeholder="주소 검색 버튼을 눌러 주소를 입력하세요."
                            />
                        </div>
                    </div>
                    <div className="mg-v2-form-group">
                        <label htmlFor="consultant-addressDetail" className="mg-v2-form-label">상세 주소</label>
                        <input
                            type="text"
                            id="consultant-addressDetail"
                            name="addressDetail"
                            value={formData.addressDetail || ''}
                            onChange={handleFormChange}
                            placeholder="동, 호수, 상세 주소를 입력하세요."
                            className="mg-v2-form-input"
                        />
                    </div>
                    <div className="mg-v2-form-group">
                        <label htmlFor="consultant-postalCode" className="mg-v2-form-label">우편번호</label>
                        <input
                            type="text"
                            id="consultant-postalCode"
                            name="postalCode"
                            value={formData.postalCode || ''}
                            onChange={handleFormChange}
                            placeholder="00000"
                            maxLength={5}
                            className="mg-v2-form-input"
                        />
                    </div>
                    <div className="mg-v2-form-group">
                        <label htmlFor="consultant-email" className="mg-v2-form-label">{VALIDATION_MESSAGES.LABEL_EMAIL_REQUIRED}</label>
                        <div className="mg-v2-form-email-row">
                            <div className="mg-v2-form-email-row__input-wrap">
                                <MgEmailFieldWithAutocomplete
                                    id="consultant-email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleFormChange}
                                    placeholder="example@email.com"
                                    required
                                    disabled={modalType === 'edit'}
                                    autocompleteMode="datalist"
                                />
                            </div>
                            {modalType === 'create' && (
                                <button
                                    type="button"
                                    onClick={handleEmailDuplicateCheck}
                                    disabled={isCheckingEmail || !formData.email?.trim()}
                                    className="mg-v2-button mg-v2-button-secondary mg-v2-button--compact"
                                    data-action="email-duplicate-check"
                                >
                                    {isCheckingEmail ? VALIDATION_MESSAGES.BUTTON_CHECKING : VALIDATION_MESSAGES.BUTTON_DUPLICATE_CHECK}
                                </button>
                            )}
                        </div>
                        {modalType === 'edit' && (
                            <small className="mg-v2-form-help">{VALIDATION_MESSAGES.HELP_EMAIL_READONLY}</small>
                        )}
                        {modalType === 'create' && emailCheckStatus === 'duplicate' && (
                            <small className="mg-v2-form-help mg-v2-form-help--error">⚠️ {VALIDATION_MESSAGES.EMAIL_EXISTS}</small>
                        )}
                        {modalType === 'create' && emailCheckStatus === 'available' && (
                            <small className="mg-v2-form-help mg-v2-form-help--success">✅ {VALIDATION_MESSAGES.EMAIL_AVAILABLE}</small>
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
                        <label id="consultant-specialty-label" className="mg-v2-form-label">전문분야</label>
                        <div className="mg-v2-form-help">
                            <span>💡</span>
                            <span>여러 개의 전문분야를 선택할 수 있습니다.</span>
                        </div>
                        <div className="mg-v2-specialty-tags" role="group" aria-labelledby="consultant-specialty-label">
                            {specialtyCodes.map((opt) => {
                                const isSelected = (formData.specialty || []).includes(opt.codeValue);
                                return (
                                    <button
                                        key={opt.codeValue}
                                        type="button"
                                        className={`mg-v2-specialty-tag ${isSelected ? 'mg-v2-specialty-tag--selected' : ''}`}
                                        onClick={() => handleSpecialtyTagClick(opt.codeValue)}
                                    >
                                        {toDisplayString(opt.codeName || opt.codeLabel || opt.codeValue)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {(modalType === 'create' || modalType === 'edit') && (
                        <>
                            <div className="mg-v2-section-heading mg-v2-section-heading--accent">
                                <span className="mg-v2-section-heading__bar" />
                                <h3 className="mg-v2-section-heading__title">자격·경력</h3>
                            </div>
                            <div className="mg-v2-form-group">
                                <label htmlFor="consultant-qualifications" className="mg-v2-form-label">자격증 (선택)</label>
                                <input
                                    type="text"
                                    id="consultant-qualifications"
                                    name="qualifications"
                                    value={formData.qualifications || ''}
                                    onChange={handleFormChange}
                                    placeholder="보유 자격증을 입력하세요. 예) 정신건강임상심리사 1급, 상담심리사 1급"
                                    className="mg-v2-form-input"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <label htmlFor="consultant-workHistory" className="mg-v2-form-label">경력사항 (선택)</label>
                                <textarea
                                    id="consultant-workHistory"
                                    name="workHistory"
                                    value={formData.workHistory || ''}
                                    onChange={handleFormChange}
                                    placeholder="관련 경력 및 근무 이력을 입력하세요."
                                    className="mg-v2-form-textarea"
                                    rows={3}
                                />
                            </div>
                        </>
                    )}
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
        const isCreateSubmitDisabled = modalType === 'create' && (formData.email != null && String(formData.email).trim() !== '') && emailCheckStatus !== 'available';
        return (
            <>
                <button type="button" className="mg-v2-button mg-v2-button-secondary" onClick={handleCloseModal}>
                    취소
                </button>
                <button
                    type="button"
                    className={modalType === 'delete' ? 'mg-v2-button mg-v2-button-danger' : 'mg-v2-button mg-v2-button-primary'}
                    onClick={handleModalSubmit}
                    disabled={isCreateSubmitDisabled}
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
                    <p><SafeText fallback="이 상담사">{selectedConsultant?.name}</SafeText>를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
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
            <ContentArea>
                {contentBlock}
            </ContentArea>
            {modalsBlock}
        </AdminCommonLayout>
    );
};

ConsultantComprehensiveManagement.propTypes = {
  embedded: PropTypes.bool
};

export default ConsultantComprehensiveManagement;