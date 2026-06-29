import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Users, Link2, Calendar, ClipboardList } from 'lucide-react';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
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
import KoreanMobileDuplicateField from '../common/molecules/KoreanMobileDuplicateField';
import Avatar from '../common/Avatar';
import ConsultantCard from '../ui/Card/ConsultantCard';
import PasswordResetModal from './PasswordResetModal';
import { showSuccess, showError } from '../../utils/notification';
import { VALIDATION_MESSAGES } from '../../constants/messages';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import ContentCard from '../dashboard-v2/content/ContentCard';
import { SearchInput } from '../dashboard-v2/atoms';
import { ViewModeToggle, SmallCardGrid, ListTableView, EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../common';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './mapping-management/organisms/MappingKpiSection.css';
import './mapping-management/organisms/MappingSearchSection.css';
import './mapping-management/organisms/MappingListBlock.css';
import './mapping-management/MappingManagementPage.css';
import './ConsultantManagementPage.css';
import './ProfileCard.css';
import { isValidKoreanMobileDigits, normalizeKoreanMobileDigits } from '../../utils/koreanMobilePhone';
import { toDisplayString } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import { generateMgLoginPassword } from '../../utils/generateMgLoginPassword';
import { CONSULTANT_COMP_SPECIALTY, CONSULTANT_COMP_PASSWORD_RESET } from '../../constants/consultantComprehensiveStrings';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import NotificationChannelPreferenceSection from '../mypage/components/NotificationChannelPreferenceSection';
import { NOTIFICATION_CHANNEL_PREFERENCE_VALUE } from '../../constants/notificationChannelPreference';
import {
    LOGIN_PASSWORD_FIELD_PLACEHOLDER,
    LOGIN_PASSWORD_POLICY_HINT_ONE_LINE
} from '../../constants/passwordPolicyUi';
import {
    TENANT_CONSULTANT_GRADE_CODES_PATH,
    extractTenantCommonCodeGroupList,
    mapTenantCommonCodesToGradeSelectOptions,
    DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE,
    FALLBACK_PROFESSIONAL_TYPE_OPTION_LABEL,
    fetchProfessionalProviderTypeSelectOptions,
    getProfessionalProviderTypeLabel
} from '../../constants/professionalProviderRoles';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_SCHEDULES = '/api/v1/admin/schedules';
const API_COMMON_CODES_CORE_GROUPS_SPECIALTY = '/api/v1/common-codes/core/groups/SPECIALTY';
/** ContentHeader / 본문 main aria-labelledby 연동 */
const CONSULTANT_COMP_MGMT_TITLE_ID = 'consultant-comprehensive-management-title';

const CONSULTANT_FORM_NOTIFICATION_CHANNEL_DEFAULTS = {
  notificationChannelPreference: 'TENANT_DEFAULT',
  tenantNotificationChannelKakaoAvailable: undefined,
  tenantNotificationChannelSmsAvailable: undefined,
  tenantDefaultNotificationChannelHint: undefined,
  notificationChannelPreferenceUiAdjusted: undefined,
  notificationChannelPreferenceEditableByCaller: true
};

const ConsultantComprehensiveManagement = ({ embedded = false }) => {
    const { t } = useTranslation(['admin', 'common']);
    const navigate = useNavigate();
    const [consultants, setConsultants] = useState([]);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [mappings, setMappings] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState('comprehensive');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [userStatusOptions, setUserStatusOptions] = useState([]);
    const [professionalTypeOptions, setProfessionalTypeOptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('view');
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [passwordResetConsultant, setPasswordResetConsultant] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        professionalTypeCode: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE,
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
        workHistory: '',
        ...CONSULTANT_FORM_NOTIFICATION_CHANNEL_DEFAULTS
    });
    const [specialtyCodes, setSpecialtyCodes] = useState([]);
    const [gradeOptions, setGradeOptions] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [emailCheckStatus, setEmailCheckStatus] = useState(null); // 'checking', 'duplicate', 'available', null
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [consultantPhoneCheckStatus, setConsultantPhoneCheckStatus] = useState(null);
    const [isCheckingConsultantPhone, setIsCheckingConsultantPhone] = useState(false);
    const consultantEditPhoneBaselineRef = useRef('');
    const [modalSubmitLoading, setModalSubmitLoading] = useState(false);
    const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'largeCard' | 'smallCard' | 'list' — 기본: 목록(밀도 최적)

    const loadProfessionalTypeCodes = useCallback(async() => {
        const fetchOnce = async() => {
            await sessionManager.checkSession(true);
            return fetchProfessionalProviderTypeSelectOptions();
        };
        try {
            let opts = await fetchOnce();
            if (opts.length === 0) {
                await new Promise((resolve) => setTimeout(resolve, 450));
                opts = await fetchOnce();
            }
            setProfessionalTypeOptions(opts);
            if (opts.length === 0) {
                showError(t('admin:consultantMgmt.loadingFailed'));
            }
        } catch (e) {
            console.error('전문가 유형 공통코드 로드 실패:', e);
            try {
                await new Promise((resolve) => setTimeout(resolve, 450));
                const opts = await fetchOnce();
                setProfessionalTypeOptions(opts);
                if (opts.length === 0) {
                    showError(t('admin:consultantMgmt.loadingFailedShort'));
                }
            } catch (retryError) {
                console.error('전문가 유형 공통코드 재시도 실패:', retryError);
                setProfessionalTypeOptions([]);
                showError(t('admin:consultantMgmt.loadingFailedShort'));
            }
        }
    }, []);

    useEffect(() => {
        loadProfessionalTypeCodes();
    }, [loadProfessionalTypeCodes]);

    const loadConsultantGradeCodes = useCallback(async() => {
        try {
            await sessionManager.checkSession(true);
            let list = [];
            const codes = await getCommonCodes('CONSULTANT_GRADE');
            list = Array.isArray(codes) ? codes : [];
            if (list.length === 0) {
                const raw = await StandardizedApi.get(TENANT_CONSULTANT_GRADE_CODES_PATH);
                list = extractTenantCommonCodeGroupList(raw);
            }
            if (list.length === 0) {
                await new Promise((resolve) => setTimeout(resolve, 400));
                await sessionManager.checkSession(true);
                const raw2 = await StandardizedApi.get(TENANT_CONSULTANT_GRADE_CODES_PATH);
                list = extractTenantCommonCodeGroupList(raw2);
            }
            let options = mapTenantCommonCodesToGradeSelectOptions(list);
            if (options.length === 0 && list.length > 0) {
                options = list
                    .map((c) => ({
                        codeValue: c.codeValue || c.code_value || c.value,
                        codeLabel: c.codeLabel || c.code_label || c.koreanName || c.korean_name || c.codeValue
                    }))
                    .filter((o) => o.codeValue);
            }
            if (options.length > 0) {
                setGradeOptions(options);
                return;
            }
            setGradeOptions([
                { codeValue: 'CONSULTANT_JUNIOR', codeLabel: t('admin:consultantMgmt.grade.junior') },
                { codeValue: 'CONSULTANT_SENIOR', codeLabel: t('admin:consultantMgmt.grade.senior') },
                { codeValue: 'CONSULTANT_EXPERT', codeLabel: t('admin:consultantMgmt.grade.expert') },
                { codeValue: 'CONSULTANT_MASTER', codeLabel: t('admin:consultantMgmt.grade.master') }
            ]);
        } catch (error) {
            console.error('상담사 등급 공통코드 로드 실패:', error);
            setGradeOptions([
                { codeValue: 'CONSULTANT_JUNIOR', codeLabel: t('admin:consultantMgmt.grade.junior') },
                { codeValue: 'CONSULTANT_SENIOR', codeLabel: t('admin:consultantMgmt.grade.senior') },
                { codeValue: 'CONSULTANT_EXPERT', codeLabel: t('admin:consultantMgmt.grade.expert') },
                { codeValue: 'CONSULTANT_MASTER', codeLabel: t('admin:consultantMgmt.grade.master') }
            ]);
        }
    }, []);

    useEffect(() => {
        loadConsultantGradeCodes();
    }, [loadConsultantGradeCodes]);

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
                        professionalProviderTypeCode: consultantEntity.professionalProviderTypeCode,
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
            
            const response = await apiGet(API_ENDPOINTS.ADMIN.MAPPINGS.LIST);
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
            
            const response = await apiGet(API_ADMIN_SCHEDULES);
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
                    const coreCodes = await apiGet(API_COMMON_CODES_CORE_GROUPS_SPECIALTY);
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
            void loadProfessionalTypeCodes();
            void loadConsultantGradeCodes();
        } catch (error) {
            console.error('❌ 전체 데이터 로딩 오류:', error);
        } finally {
            setLoading(false);
        }
    }, [loadConsultants, loadMappings, loadSchedules, loadSpecialtyCodes, loadProfessionalTypeCodes, loadConsultantGradeCodes]);

    useEffect(() => {
        // SessionGuard가 먼저 세션을 체크할 시간을 주기 위해 약간의 지연
        const initializeData = async() => {
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
        return () => window.removeEventListener('forceRefresh', handleForceRefresh);
    }, [loadAllData]);

    // 공통코드 로드 (상태 옵션)
    useEffect(() => {
        const loadStatusCodes = async() => {
            try {
                const statusCodes = await getCommonCodes('USER_STATUS');
                const uniqueStatusCodes = (statusCodes || []).filter((option, index, self) => 
                    index === self.findIndex(o => o.codeValue === option.codeValue)
                );
                setUserStatusOptions(uniqueStatusCodes);
            } catch (error) {
                console.error('상태 공통코드 로드 실패:', error);
                setUserStatusOptions([
                    { codeValue: 'ACTIVE', codeLabel: t('admin:labels.active') },
                    { codeValue: 'INACTIVE', codeLabel: t('admin:labels.inactive') },
                    { codeValue: 'SUSPENDED', codeLabel: t('admin:consultantMgmt.status.suspended') }
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
        void loadProfessionalTypeCodes();
        void loadConsultantGradeCodes();
    }, [loadProfessionalTypeCodes, loadConsultantGradeCodes]);

    const handleOpenModal = useCallback((type, consultant = null) => {
        setModalType(type);
        setConsultantPhoneCheckStatus(null);
        
        // 모달이 열릴 때 전문분야·전문가 유형·등급 코드 로드 (테넌트 준비 후 최신 데이터)
        loadSpecialtyCodes();
        void loadProfessionalTypeCodes();
        void loadConsultantGradeCodes();

        if (consultant) {
            setSelectedConsultant(consultant);
            if (type === 'edit') {
                let specialties = [];
                if (consultant.specialization) {
                    specialties = consultant.specialization.split(',').map(s => s.trim());
                } else if (consultant.specialty) {
                    specialties = [consultant.specialty];
                }
                consultantEditPhoneBaselineRef.current = normalizeKoreanMobileDigits(
                    String(consultant.phone ?? '')
                );
                setFormData({
                    name: consultant.name || '',
                    email: consultant.email || '',
                    phone: consultant.phone || '',
                    professionalTypeCode: consultant.professionalProviderTypeCode || DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE,
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
                    workHistory: consultant.workHistory || '',
                    ...CONSULTANT_FORM_NOTIFICATION_CHANNEL_DEFAULTS
                });
            }
        } else if (type === 'create') {
            consultantEditPhoneBaselineRef.current = '';
            setFormData({
                name: '',
                email: '',
                password: generateMgLoginPassword(),
                phone: '',
                professionalTypeCode: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE,
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
                workHistory: '',
                ...CONSULTANT_FORM_NOTIFICATION_CHANNEL_DEFAULTS
            });
        }
        setShowModal(true);
    }, [loadSpecialtyCodes, loadProfessionalTypeCodes, loadConsultantGradeCodes]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setModalType('view');
        setSelectedConsultant(null);
        setConsultantPhoneCheckStatus(null);
        consultantEditPhoneBaselineRef.current = '';
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            professionalTypeCode: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE,
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
            workHistory: '',
            ...CONSULTANT_FORM_NOTIFICATION_CHANNEL_DEFAULTS
        });
    }, []);

    const renderConsultantActions = useCallback((consultant, layout = ENTITY_ROW_ACTIONS_LAYOUT.TABLE) => (
        <EntityRowActions
            layout={layout}
            ariaLabel="상담사 작업"
            items={[
                {
                    id: 'edit',
                    label: t('common.actions.edit'),
                    onClick: () => handleOpenModal('edit', consultant)
                },
                {
                    id: 'reset-password',
                    label: CONSULTANT_COMP_PASSWORD_RESET.BTN_LABEL,
                    title: CONSULTANT_COMP_PASSWORD_RESET.BTN_TITLE,
                    onClick: () => {
                        setPasswordResetConsultant(consultant);
                        setShowPasswordResetModal(true);
                    }
                },
                {
                    id: 'delete',
                    label: t('admin.actions.delete'),
                    onClick: () => {
                        setSelectedConsultant(consultant);
                        setShowDeleteConfirm(true);
                    },
                    variant: 'destructive'
                }
            ]}
        />
    ), [handleOpenModal, t]);

    useEffect(() => {
        if (!showModal || !selectedConsultant?.id) {
            return undefined;
        }
        if (modalType !== 'view' && modalType !== 'edit') {
            return undefined;
        }
        let cancelled = false;
        (async() => {
            try {
                const profile = await StandardizedApi.get(`/api/v1/users/profile/${selectedConsultant.id}`);
                if (cancelled || !profile) {
                    return;
                }
                const profileType =
                    profile.professionalProviderTypeCode ?? profile.professional_provider_type_code;
                setFormData((prev) => {
                    const merged = {
                        ...prev,
                        notificationChannelPreference:
                            profile.notificationChannelPreference || NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT,
                        tenantNotificationChannelKakaoAvailable: profile.tenantNotificationChannelKakaoAvailable,
                        tenantNotificationChannelSmsAvailable: profile.tenantNotificationChannelSmsAvailable,
                        tenantDefaultNotificationChannelHint: profile.tenantDefaultNotificationChannelHint,
                        notificationChannelPreferenceUiAdjusted: profile.notificationChannelPreferenceUiAdjusted,
                        notificationChannelPreferenceEditableByCaller:
                            profile.notificationChannelPreferenceEditableByCaller !== false
                    };
                    if (profile.grade != null && String(profile.grade).trim() !== '') {
                        merged.grade = String(profile.grade).trim();
                    }
                    if (profileType != null && String(profileType).trim() !== '') {
                        merged.professionalTypeCode = String(profileType).trim();
                    }
                    return merged;
                });
            } catch (err) {
                console.debug('상담사 알림 채널 선호 로드 생략:', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [showModal, selectedConsultant?.id, modalType]);

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
            if (name === 'phone') {
                setConsultantPhoneCheckStatus(null);
            }
        }, []);
    
    const handleEmailDuplicateCheck = useCallback(async() => {
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
            const response = await apiGet(`${API_ENDPOINTS.ADMIN.DUPLICATE_CHECK.EMAIL}?email=${encodeURIComponent(email)}`);
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

    const handleConsultantPhoneDuplicateCheck = useCallback(async() => {
        const raw = String(formData.phone ?? '').trim();
        const normalized = normalizeKoreanMobileDigits(raw);
        if (!normalized || !isValidKoreanMobileDigits(normalized)) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: VALIDATION_MESSAGES.INVALID_PHONE, type: 'warning' }
            }));
            setConsultantPhoneCheckStatus(null);
            return;
        }
        setIsCheckingConsultantPhone(true);
        try {
            const params = { phone: normalized };
            if (modalType === 'edit' && selectedConsultant?.id) {
                params.excludeUserId = selectedConsultant.id;
            }
            const response = await StandardizedApi.get(API_ENDPOINTS.ADMIN.DUPLICATE_CHECK.PHONE, params);
            if (response && typeof response.isDuplicate === 'boolean') {
                if (response.isDuplicate === false && response.available === false) {
                    setConsultantPhoneCheckStatus(null);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: response.message || VALIDATION_MESSAGES.INVALID_PHONE, type: 'warning' }
                    }));
                    return;
                }
                if (response.isDuplicate) {
                    setConsultantPhoneCheckStatus('duplicate');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.PHONE_EXISTS, type: 'error' }
                    }));
                } else {
                    setConsultantPhoneCheckStatus('available');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.PHONE_AVAILABLE, type: 'success' }
                    }));
                }
            } else {
                setConsultantPhoneCheckStatus(null);
            }
        } catch (error) {
            console.error('휴대폰 중복 확인 오류:', error);
            setConsultantPhoneCheckStatus(null);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: VALIDATION_MESSAGES.PHONE_DUPLICATE_CHECK_ERROR, type: 'error' }
            }));
        } finally {
            setIsCheckingConsultantPhone(false);
        }
    }, [formData.phone, modalType, selectedConsultant?.id]);

    const handleSpecialtyTagClick = useCallback((codeValue) => {
        setFormData(prev => {
            const current = prev.specialty || [];
            const next = current.includes(codeValue)
                ? current.filter(v => v !== codeValue)
                : [...current, codeValue];
            return { ...prev, specialty: next };
        });
    }, []);

    const createConsultant = useCallback(async(data) => {
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
                            detail: { message: t('admin:consultantMgmt.msg.tenantMissing'), type: 'error' }
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
                    detail: { message: t('admin:consultantMgmt.msg.sessionMissing'), type: 'error' }
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
                    detail: { message: t('admin:consultantMgmt.msg.nameRequired'), type: 'error' }
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
            
            const response = await apiPost(API_ENDPOINTS.ADMIN.CONSULTANTS.LIST, requestData, options);
            console.log('📥 상담사 등록 응답:', response);
            
            // apiPost가 ApiResponse의 data만 추출하므로, response는 User 객체 또는 null
            // User 객체가 있으면 성공 (id 필드 확인)
            if (response && (response.id || response.userId || response.email)) {
                console.log('✅ 상담사 등록 성공:', response);
                await loadConsultants();
                window.dispatchEvent(new CustomEvent('admin-dashboard-refresh-stats'));
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: t('admin:consultantMgmt.msg.createSuccess'), type: 'success' }
                }));
                return { success: true };
            } else {
                console.error('❌ 상담사 등록 실패: 응답이 올바르지 않음', response);
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: (response && response.message) || t('admin:consultantMgmt.msg.createFailed'), type: 'error' }
                }));
                return { success: false };
            }
        } catch (error) {
            console.error('상담사 등록 오류:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: t('admin:consultantMgmt.msg.createError'), type: 'error' }
            }));
            return { success: false };
        }
    }, [loadConsultants]);

    const updateConsultant = useCallback(async(id, data, existing) => {
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
                        detail: { message: t('admin:consultantMgmt.msg.rrnInvalid'), type: 'error' }
                    }));
                    return { success: false };
                }
                if (rrnLast1.length !== 1 || !/^[1-4]$/.test(rrnLast1)) {
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: t('admin:consultantMgmt.msg.rrnInvalid'), type: 'error' }
                    }));
                    return { success: false };
                }
            }
            const requestPayload = {
                name: nameVal === '' ? (existing?.name ?? '') : nameVal,
                email: emailVal === '' ? (existing?.email ?? '') : emailVal,
                phone: phoneVal === '' ? (existing?.phone ?? '') : phoneVal,
                specialization,
                professionalTypeCode: data.professionalTypeCode != null && String(data.professionalTypeCode).trim() !== ''
                    ? String(data.professionalTypeCode).trim()
                    : undefined,
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
            if (data.notificationChannelPreference != null
                && String(data.notificationChannelPreference).trim() !== '') {
                requestPayload.notificationChannelPreference =
                    String(data.notificationChannelPreference).trim();
            }
            const response = await apiPut(`/api/v1/admin/consultants/${id}`, requestPayload);
            // apiPut은 ApiResponse의 data만 반환하므로 success는 response.success가 아닌 반환값 유무/형식으로 판단
            const isSuccess = response != null && (response.success === true || response.id != null);
            if (isSuccess) {
                await loadConsultants();
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: t('admin:consultantMgmt.msg.updateSuccess'), type: 'success' }
                }));
                return { success: true };
            } else {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: (response && response.message) || t('admin:consultantMgmt.msg.updateFailed'), type: 'error' }
                }));
                return { success: false };
            }
        } catch (error) {
            console.error('상담사 수정 오류:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: t('admin:consultantMgmt.msg.updateError'), type: 'error' }
            }));
            return { success: false };
        }
    }, [loadConsultants]);

    const deleteConsultant = useCallback(async(id) => {
        try {
            const response = await StandardizedApi.delete(`/api/v1/admin/consultants/${id}`);
            if (!response || response.success !== false) {
                await loadConsultants();
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: t('admin:consultantMgmt.msg.deleteSuccess'), type: 'success' }
                }));
                return { success: true };
            } else {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: response?.message || t('admin:consultantMgmt.msg.deleteFailed'), type: 'error' }
                }));
                return { success: false };
            }
        } catch (error) {
            console.error('상담사 삭제 오류:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: t('admin:consultantMgmt.msg.deleteError'), type: 'error' }
            }));
            return { success: false };
        }
    }, [loadConsultants]);

    const handlePasswordResetConfirm = useCallback(async(newPassword) => {
        if (!passwordResetConsultant) return;

        try {
            console.log('🔑 상담사 비밀번호 초기화 시작:', passwordResetConsultant.id);

            const endpoint = `/api/v1/admin/user-management/${passwordResetConsultant.id}/reset-password`;
            const response = await StandardizedApi.put(endpoint, { newPassword });

            console.log('✅ 비밀번호 초기화 응답:', response);

            if (response && (response.success !== false)) {
                showSuccess(t('admin:consultantMgmt.msg.passwordResetSuccess'));
                setShowPasswordResetModal(false);
                setPasswordResetConsultant(null);
            } else {
                throw new Error(response?.message || t('admin:consultantMgmt.msg.passwordResetFailed'));
            }
        } catch (error) {
            console.error('❌ 비밀번호 초기화 실패:', error);
            throw error;
        }
    }, [passwordResetConsultant]);

    const handleModalSubmit = useCallback(async(e) => {
        e.preventDefault();
        setModalSubmitLoading(true);
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
                const phoneNorm = normalizeKoreanMobileDigits(String(formData.phone ?? '').trim());
                if (phoneNorm && isValidKoreanMobileDigits(phoneNorm) && consultantPhoneCheckStatus !== 'available') {
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.PHONE_DUPLICATE_CHECK_REQUIRED, type: 'warning' }
                    }));
                    return;
                }
                result = await createConsultant(formData);
            } else if (modalType === 'edit') {
                const phoneNorm = normalizeKoreanMobileDigits(String(formData.phone ?? '').trim());
                const baseline = consultantEditPhoneBaselineRef.current || '';
                if (phoneNorm && isValidKoreanMobileDigits(phoneNorm) && phoneNorm !== baseline
                        && consultantPhoneCheckStatus !== 'available') {
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.PHONE_DUPLICATE_CHECK_REQUIRED, type: 'warning' }
                    }));
                    return;
                }
                result = await updateConsultant(selectedConsultant.id, formData, selectedConsultant);
            } else if (modalType === 'delete') {
                result = await deleteConsultant(selectedConsultant.id);
            }

            if (result && result.success) {
                handleCloseModal();
            }
        } catch (error) {
            console.error('모달 제출 오류:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: t('admin:consultantMgmt.msg.submitError'), type: 'error' }
            }));
        } finally {
            setModalSubmitLoading(false);
        }
    }, [modalType, formData, selectedConsultant, emailCheckStatus, consultantPhoneCheckStatus, createConsultant, updateConsultant, deleteConsultant, handleCloseModal]);

    const stats = getOverallStats();
    const consultantFilterOptions = useMemo(() => {
        const opts = [{ value: 'all', label: t('admin:consultantMgmt.filter.all') }];
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
            return <UnifiedLoading type="inline" text={t('admin:ConsultantComprehensiveManagement.t_ef1822ad')} variant="pulse" />;
        }
        return (
            <AdminCommonLayout title={t('admin:consultant.title')}>
                <div className="mg-v2-ad-b0kla mg-v2-consultant-management">
                    <div className="mg-v2-ad-b0kla__container">
                        <ContentArea ariaLabel={t('admin:consultant.title')}>
                            <ContentHeader
                                title={t('admin:consultant.title')}
                                subtitle={t('admin:consultant.subtitle')}
                                titleId={CONSULTANT_COMP_MGMT_TITLE_ID}
                            />
                            <main aria-labelledby={CONSULTANT_COMP_MGMT_TITLE_ID}>
                                <UnifiedLoading type="inline" text={t('admin:ConsultantComprehensiveManagement.t_ef1822ad')} variant="pulse" />
                            </main>
                        </ContentArea>
                    </div>
                </div>
            </AdminCommonLayout>
        );
    }

    const consultantTabAndBelow = (
        <>
            <ContentSection noCard>
                <div className="mg-v2-ad-b0kla__pill-toggle">
                            <MGButton
                                type="button"
                                variant="primary"
                                preventDoubleClick={false}
                                className={`${buildErpMgButtonClassName({ variant: 'primary', loading: false })} mg-v2-ad-b0kla__pill ${mainTab === 'comprehensive' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setMainTab('comprehensive')}
                            >
                                {t('admin:consultant.tab.list')}
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="primary"
                                preventDoubleClick={false}
                                className={`${buildErpMgButtonClassName({ variant: 'primary', loading: false })} mg-v2-ad-b0kla__pill ${mainTab === 'basic' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setMainTab('basic')}
                            >
                                {t('admin:consultant.tab.detail')}
                            </MGButton>
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
                                                <span className="mg-v2-mapping-kpi-section__label">{t('admin:consultant.table.name')}</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{toDisplayString(stats.totalConsultants)}명</span>
                                            </div>
                                        </div>
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--green">
                                                <Link2 size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">{t('admin:dashboard.summary.activeSessions')}</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{toDisplayString(stats.activeMappings)}건</span>
                                            </div>
                                        </div>
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--gray">
                                                <Calendar size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">{t('admin:consultant.tab.sessions')}</span>
                                                <span className="mg-v2-mapping-kpi-section__value">{toDisplayString(stats.totalSchedules)}건</span>
                                            </div>
                                        </div>
                                        <div className="mg-v2-mapping-kpi-section__card">
                                            <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--orange">
                                                <ClipboardList size={24} />
                                            </div>
                                            <div className="mg-v2-mapping-kpi-section__info">
                                                <span className="mg-v2-mapping-kpi-section__label">{t('admin:ConsultantComprehensiveManagement.t_0bc1947b')}</span>
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
                                                placeholder={t('admin:ConsultantComprehensiveManagement.t_c03d75f9')}
                                            />
                                        </div>
                                        <div className="mg-v2-mapping-search-section__chips">
                                            {embedded && (
                                                <MGButton
                                                    type="button"
                                                    variant="primary"
                                                    size="small"
                                                    preventDoubleClick={false}
                                                    className={buildErpMgButtonClassName({
                                                        variant: 'primary',
                                                        size: 'sm',
                                                        loading: false,
                                                        className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary mg-v2-mapping-search-section__embedded-create'
                                                    })}
                                                    onClick={() => handleOpenModal('create')}
                                                >
                                                    {t('admin:ConsultantComprehensiveManagement.t_72bf00c9')}
                                                </MGButton>
                                            )}
                                            {consultantFilterOptions.map((opt) => (
                                                <MGButton
                                                    key={opt.value}
                                                    type="button"
                                                    variant="outline"
                                                    size="small"
                                                    preventDoubleClick={false}
                                                    className={buildErpMgButtonClassName({
                                                        variant: 'outline',
                                                        size: 'sm',
                                                        loading: false,
                                                        className: `mg-v2-mapping-search-section__chip ${chipFilterStatus === opt.value ? 'mg-v2-mapping-search-section__chip--active' : ''}`
                                                    })}
                                                    onClick={() => handleFilterChange({ ...activeFilters, status: opt.value })}
                                                >
                                                    {toDisplayString(opt.label)}
                                                </MGButton>
                                            ))}
                                        </div>
                                    </div>
                                </ContentSection>

                                <ContentSection noCard className="mg-v2-mapping-list-block">
                                    <ContentCard className="mg-v2-mapping-list-block__card">
                                        <div className="mg-v2-mapping-list-block__header">
                                            <div className="mg-v2-mapping-list-block__title">{t('admin:ConsultantComprehensiveManagement.t_8a952452')}</div>
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
                                                <h3 className="mg-v2-mapping-list-block__empty-title">{t('admin:consultant.empty.title')}</h3>
                                                <p className="mg-v2-mapping-list-block__empty-desc">{t('admin:ConsultantComprehensiveManagement.t_cff51bee')}</p>
                                                <MGButton
                                                    type="button"
                                                    variant="primary"
                                                    preventDoubleClick={false}
                                                    className={buildErpMgButtonClassName({
                                                        variant: 'primary',
                                                        loading: false,
                                                        className: 'mg-v2-mapping-list-block__empty-btn'
                                                    })}
                                                    onClick={() => handleOpenModal('create')}
                                                >
                                                                                                       {t('admin:ConsultantComprehensiveManagement.t_72bf00c9')}
                                                </MGButton>
                                            </div>
                                        ) : viewMode === 'largeCard' ? (
                                            <div className="mg-v2-mapping-list-block__grid">
                                                {getFilteredConsultants.map((consultant) => (
                                                    <ConsultantCard
                                                        key={consultant.id}
                                                        variant="admin-list"
                                                        consultant={consultant}
                                                        badgeInfo={getConsultantBadgeDisplay(consultant)}
                                                        onCardClick={() => handleConsultantSelect(consultant)}
                                                        renderActions={(c) => renderConsultantActions(c, ENTITY_ROW_ACTIONS_LAYOUT.CARD)}
                                                    />
                                                ))}
                                            </div>
                                        ) : viewMode === 'smallCard' ? (
                                            <SmallCardGrid>
                                                {getFilteredConsultants.map((consultant) => (
                                                    <ConsultantCard
                                                        key={consultant.id}
                                                        variant="admin-compact"
                                                        consultant={consultant}
                                                        badgeInfo={getConsultantBadgeDisplay(consultant)}
                                                        onCardClick={() => handleConsultantSelect(consultant)}
                                                        renderActions={(c) => renderConsultantActions(c, ENTITY_ROW_ACTIONS_LAYOUT.CORNER)}
                                                    />
                                                ))}
                                            </SmallCardGrid>
                                        ) : (
                                            <ListTableView
                                                columns={[
                                                    { key: 'name', label: t('admin:consultant.table.name') },
                                                    { key: 'professionalProviderTypeCode', label: t('admin:consultant.filter.specialization') },
                                                    { key: 'email', label: t('admin:consultant.table.email') },
                                                    { key: 'status', label: t('admin:consultant.table.status') },
                                                    { key: 'createdAt', label: t('admin:consultant.table.joinDate'), hideOnMobile: true },
                                                    { key: 'currentClients', label: t('admin:consultant.table.sessionCount'), hideOnMobile: true },
                                                    { key: '_actions', label: t('common.actions.actions', '작업') }
                                                ]}
                                                data={getFilteredConsultants}
                                                renderCell={(key, item) => {
                                                    if (key === '_actions') {
                                                        return renderConsultantActions(item, ENTITY_ROW_ACTIONS_LAYOUT.TABLE);
                                                    }
                                                    if (key === 'professionalProviderTypeCode') return getProfessionalProviderTypeLabel(item.professionalProviderTypeCode) || '-';
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
                                                placeholder={t('admin:ConsultantComprehensiveManagement.t_c03d75f9')}
                                            />
                                        </div>
                                        <div className="mg-v2-mapping-search-section__chips">
                                            {embedded && (
                                                <MGButton
                                                    type="button"
                                                    variant="primary"
                                                    size="small"
                                                    preventDoubleClick={false}
                                                    className={buildErpMgButtonClassName({
                                                        variant: 'primary',
                                                        size: 'sm',
                                                        loading: false,
                                                        className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary mg-v2-mapping-search-section__embedded-create'
                                                    })}
                                                    onClick={() => handleOpenModal('create')}
                                                >
                                                    {t('admin:ConsultantComprehensiveManagement.t_72bf00c9')}
                                                </MGButton>
                                            )}
                                            {consultantFilterOptions.map((opt) => (
                                                <MGButton
                                                    key={opt.value}
                                                    type="button"
                                                    variant="outline"
                                                    size="small"
                                                    preventDoubleClick={false}
                                                    className={buildErpMgButtonClassName({
                                                        variant: 'outline',
                                                        size: 'sm',
                                                        loading: false,
                                                        className: `mg-v2-mapping-search-section__chip ${chipFilterStatus === opt.value ? 'mg-v2-mapping-search-section__chip--active' : ''}`
                                                    })}
                                                    onClick={() => handleFilterChange({ ...activeFilters, status: opt.value })}
                                                >
                                                    {toDisplayString(opt.label)}
                                                </MGButton>
                                            ))}
                                        </div>
                                    </div>
                                </ContentSection>

                                <ContentSection noCard className="mg-v2-mapping-list-block">
                                    <ContentCard className="mg-v2-mapping-list-block__card">
                                        <div className="mg-v2-mapping-list-block__header">
                                            <div className="mg-v2-mapping-list-block__title">{t('admin:ConsultantComprehensiveManagement.t_8a952452')}</div>
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
                                                <h3 className="mg-v2-mapping-list-block__empty-title">{t('admin:consultant.empty.title')}</h3>
                                                <p className="mg-v2-mapping-list-block__empty-desc">{t('admin:ConsultantComprehensiveManagement.t_cff51bee')}</p>
                                                <MGButton
                                                    type="button"
                                                    variant="primary"
                                                    preventDoubleClick={false}
                                                    className={buildErpMgButtonClassName({
                                                        variant: 'primary',
                                                        loading: false,
                                                        className: 'mg-v2-mapping-list-block__empty-btn'
                                                    })}
                                                    onClick={() => handleOpenModal('create')}
                                                >
                                                                                                       {t('admin:ConsultantComprehensiveManagement.t_72bf00c9')}
                                                </MGButton>
                                            </div>
                                        ) : viewMode === 'largeCard' ? (
                                            <div className="mg-v2-mapping-list-block__grid">
                                                {getFilteredConsultants.map((consultant) => (
                                                    <ConsultantCard
                                                        key={consultant.id}
                                                        variant="admin-list"
                                                        consultant={consultant}
                                                        badgeInfo={getConsultantBadgeDisplay(consultant)}
                                                        onCardClick={() => handleConsultantSelect(consultant)}
                                                        renderActions={(c) => renderConsultantActions(c, ENTITY_ROW_ACTIONS_LAYOUT.CARD)}
                                                    />
                                                ))}
                                            </div>
                                        ) : viewMode === 'smallCard' ? (
                                            <SmallCardGrid>
                                                {getFilteredConsultants.map((consultant) => (
                                                    <ConsultantCard
                                                        key={consultant.id}
                                                        variant="admin-compact"
                                                        consultant={consultant}
                                                        badgeInfo={getConsultantBadgeDisplay(consultant)}
                                                        onCardClick={() => handleConsultantSelect(consultant)}
                                                        renderActions={(c) => renderConsultantActions(c, ENTITY_ROW_ACTIONS_LAYOUT.CORNER)}
                                                    />
                                                ))}
                                            </SmallCardGrid>
                                        ) : (
                                            <ListTableView
                                                columns={[
                                                    { key: 'name', label: t('admin:consultant.table.name') },
                                                    { key: 'professionalProviderTypeCode', label: t('admin:consultant.filter.specialization') },
                                                    { key: 'email', label: t('admin:consultant.table.email') },
                                                    { key: 'status', label: t('admin:consultant.table.status') },
                                                    { key: 'createdAt', label: t('admin:consultant.table.joinDate'), hideOnMobile: true },
                                                    { key: 'currentClients', label: t('admin:consultant.table.sessionCount'), hideOnMobile: true },
                                                    { key: '_actions', label: t('common.actions.actions', '작업') }
                                                ]}
                                                data={getFilteredConsultants}
                                                renderCell={(key, item) => {
                                                    if (key === '_actions') {
                                                        return renderConsultantActions(item, ENTITY_ROW_ACTIONS_LAYOUT.TABLE);
                                                    }
                                                    if (key === 'professionalProviderTypeCode') return getProfessionalProviderTypeLabel(item.professionalProviderTypeCode) || '-';
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

    const contentBlock = (
        <>
            {!embedded && (
                <ContentHeader
                    title={t('admin.labels.consultantManagement')}
                    subtitle="상담사의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다"
                    titleId={CONSULTANT_COMP_MGMT_TITLE_ID}
                    actions={
                        <MGButton
                            type="button"
                            variant="primary"
                            preventDoubleClick={false}
                            className={buildErpMgButtonClassName({
                                variant: 'primary',
                                loading: false,
                                className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary'
                            })}
                            onClick={() => handleOpenModal('create')}
                        >
                                                       {t('admin:ConsultantComprehensiveManagement.t_72bf00c9')}
                        </MGButton>
                    }
                />
            )}
            {embedded ? consultantTabAndBelow : (
                <main aria-labelledby={CONSULTANT_COMP_MGMT_TITLE_ID}>
                    {consultantTabAndBelow}
                </main>
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
                                    <h5>{t('admin:consultant.section.basicInfo')}</h5>
                                    <div className="mg-v2-detail-grid">
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">{t('admin:ConsultantComprehensiveManagement.t_f4767ec3')}</span>
                                            <span className="mg-v2-detail-value">
                                                <SafeText fallback="-">{viewGenderLabel ?? null}</SafeText>
                                            </span>
                                        </div>
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">{t('admin:ConsultantComprehensiveManagement.t_d5a23ca7')}</span>
                                            <span className="mg-v2-detail-value">
                                                <SafeText fallback="-">
                                                    {viewAgeYears != null ? `${viewAgeYears}세` : null}
                                                </SafeText>
                                            </span>
                                        </div>
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">{t('admin:ConsultantComprehensiveManagement.t_75db0f2b')}</span>
                                            <span className="mg-v2-detail-value"><SafeText fallback="전화번호 없음">{selectedConsultant.phone}</SafeText></span>
                                        </div>
                                        <div className="mg-v2-detail-item">
                                            <span className="mg-v2-detail-label">{t('admin:ConsultantComprehensiveManagement.t_95b70823')}</span>
                                            <span className="mg-v2-detail-value">
                                                <SafeText fallback="-">
                                                  {selectedConsultant.createdAt ? new Date(selectedConsultant.createdAt).toLocaleDateString('ko-KR') : null}
                                                </SafeText>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mg-v2-detail-section">
                                    <h5>{t('admin:consultant.section.specialty')}</h5>
                                    <div className="mg-v2-specialty-list">
                                        {(selectedConsultant.specialty || selectedConsultant.specialization) ? (
                                            <SpecialtyDisplay
                                                consultant={selectedConsultant}
                                                variant="tag"
                                                showTitle={false}
                                                maxItems={10}
                                            />
                                        ) : (
                                            <span className="mg-v2-no-data">{t('admin:ConsultantComprehensiveManagement.t_19ad510e')}</span>
                                        )}
                                    </div>
                                </div>
                                {selectedConsultant.id ? (
                                    <div className="mg-v2-client-modal__notification-channel">
                                        <NotificationChannelPreferenceSection
                                            subjectRole="CONSULTANT"
                                            isEditing={false}
                                            readOnlyDueToPolicy
                                            preferenceValue={
                                                formData.notificationChannelPreference
                                                || NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT
                                            }
                                            tenantKakaoAvailable={formData.tenantNotificationChannelKakaoAvailable}
                                            tenantSmsAvailable={formData.tenantNotificationChannelSmsAvailable}
                                            tenantDefaultHint={formData.tenantDefaultNotificationChannelHint}
                                            preferenceUiAdjusted={formData.notificationChannelPreferenceUiAdjusted}
                                            onPreferenceChange={() => {}}
                                        />
                                    </div>
                                ) : null}
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
                        <p><SafeText fallback="이 상담사">{selectedConsultant?.name}</SafeText>{t('admin:ConsultantComprehensiveManagement.t_537a7a1c')}</p>
                        {selectedConsultant && (
                            <div className="mg-v2-detail-grid">
                                <div className="mg-v2-detail-item">
                                    <span className="mg-v2-detail-label">{t('admin:ConsultantComprehensiveManagement.t_ed325800')}</span>
                                    <span className="mg-v2-detail-value"><SafeText fallback="-">{selectedConsultant.name}</SafeText></span>
                                </div>
                                <div className="mg-v2-detail-item">
                                    <span className="mg-v2-detail-label">{t('admin:ConsultantComprehensiveManagement.t_6b943a10')}</span>
                                    <span className="mg-v2-detail-value"><SafeText fallback="-">{selectedConsultant.email}</SafeText></span>
                                </div>
                            </div>
                        )}
                        <p className="mg-v2-warning-text">
                            {t('admin:ConsultantComprehensiveManagement.t_ef61194c')}
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
                                {t('admin:ConsultantComprehensiveManagement.t_996eef81')}
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
                    {(modalType === 'create' || modalType === 'edit') && (
                        <div className="mg-v2-form-group">
                            <label htmlFor="consultant-professional-type" className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_c133165d')}</label>
                            <select
                                id="consultant-professional-type"
                                name="professionalTypeCode"
                                value={formData.professionalTypeCode || DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE}
                                onChange={handleFormChange}
                                className="mg-v2-form-input"
                                required
                            >
                                {(professionalTypeOptions.length > 0
                                    ? professionalTypeOptions
                                    : [{ value: DEFAULT_PROFESSIONAL_TYPE_CODE_VALUE, label: FALLBACK_PROFESSIONAL_TYPE_OPTION_LABEL, sortOrder: 0 }]
                                ).map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {/* 공통 순서: 1. 주민번호 2. 이름 3. 전화번호 4. 주소 → 나머지 */}
                    <div className="mg-v2-form-group">
                        {modalType === 'edit' && (
                            <small className="mg-v2-form-help">{t('admin:ConsultantComprehensiveManagement.t_8ef3de07')}</small>
                        )}
                        <div className="mg-v2-form-row mg-v2-form-row--two">
                            <div className="mg-v2-form-group">
                                <label htmlFor="consultant-rrnFirst6" className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_61537487')}</label>
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
                                <label htmlFor="consultant-rrnLast1" className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_77fb1e91')}</label>
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
                        <label className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_8417fb91')}</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleFormChange}
                            placeholder={t('admin:ConsultantComprehensiveManagement.t_25cf7f26')}
                            className="mg-v2-form-input"
                            required
                        />
                    </div>
                    <KoreanMobileDuplicateField
                        id="consultant-phone"
                        name="phone"
                        label={t('admin:ConsultantComprehensiveManagement.t_9a1c3aaa')}
                        value={formData.phone || ''}
                        onChange={handleFormChange}
                        onDuplicateClick={handleConsultantPhoneDuplicateCheck}
                        isCheckingDuplicate={isCheckingConsultantPhone}
                        duplicateButtonDataAction="consultant-modal-phone-duplicate-check"
                        duplicateButtonLabel={VALIDATION_MESSAGES.BUTTON_DUPLICATE_CHECK}
                        checkStatus={consultantPhoneCheckStatus === 'duplicate' ? 'duplicate' : consultantPhoneCheckStatus === 'available' ? 'available' : null}
                        messageDuplicate={VALIDATION_MESSAGES.PHONE_EXISTS}
                        messageAvailable={VALIDATION_MESSAGES.PHONE_AVAILABLE}
                        placeholder={t('admin:ConsultantComprehensiveManagement.t_13749b95')}
                        maxLength={13}
                        autoComplete="tel"
                        onBlur={(e) => {
                            const raw = String(e.target.value ?? '').trim();
                            const n = raw ? normalizeKoreanMobileDigits(raw) : '';
                            setFormData((prev) => (prev.phone === n ? prev : { ...prev, phone: n }));
                        }}
                    />
                    <div className="mg-v2-form-group">
                        <label htmlFor="consultant-grade" className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_89dbf513')}</label>
                        <select
                            id="consultant-grade"
                            name="grade"
                            value={formData.grade || ''}
                            onChange={handleFormChange}
                            className="mg-v2-form-input"
                        >
                            <option value="">{t('admin:ConsultantComprehensiveManagement.t_952a9e9a')}</option>
                            {gradeOptions.map((opt) => (
                                <option key={opt.codeValue} value={opt.codeValue}>
                                    {toDisplayString(opt.codeLabel)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_1c2422dd')}</label>
                        <div className="mg-v2-address-search-row">
                            <MGButton
                                type="button"
                                variant="secondary"
                                preventDoubleClick={false}
                                className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                                onClick={() => {
                                    if (typeof window !== 'undefined' && window.daum && window.daum.Postcode) {
                                        new window.daum.Postcode({
                                            oncomplete: function(data) {
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
                                {t('admin:ConsultantComprehensiveManagement.t_1c2422dd')}
                            </MGButton>
                            <input
                                type="text"
                                readOnly
                                className="mg-v2-form-input mg-v2-form-input--readonly"
                                value={formData.address || ''}
                                placeholder={t('admin:ConsultantComprehensiveManagement.t_c44d8d97')}
                            />
                        </div>
                    </div>
                    <div className="mg-v2-form-group">
                        <label htmlFor="consultant-addressDetail" className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_dad291cb')}</label>
                        <input
                            type="text"
                            id="consultant-addressDetail"
                            name="addressDetail"
                            value={formData.addressDetail || ''}
                            onChange={handleFormChange}
                            placeholder={t('admin:ConsultantComprehensiveManagement.t_9c34782e')}
                            className="mg-v2-form-input"
                        />
                    </div>
                    <div className="mg-v2-form-group">
                        <label htmlFor="consultant-postalCode" className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_cd21379e')}</label>
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
                                <MGButton
                                    type="button"
                                    variant="secondary"
                                    size="small"
                                    preventDoubleClick={false}
                                    onClick={handleEmailDuplicateCheck}
                                    disabled={isCheckingEmail || !formData.email?.trim()}
                                    loading={isCheckingEmail}
                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                    className={buildErpMgButtonClassName({
                                        variant: 'secondary',
                                        size: 'sm',
                                        loading: isCheckingEmail,
                                        className: 'mg-v2-button--compact'
                                    })}
                                    data-action="email-duplicate-check"
                                >
                                    {VALIDATION_MESSAGES.BUTTON_DUPLICATE_CHECK}
                                </MGButton>
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
                            <label className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_81973897')}</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password || ''}
                                onChange={handleFormChange}
                                placeholder={LOGIN_PASSWORD_FIELD_PLACEHOLDER}
                                className="mg-v2-form-input"
                            />
                            <small className="mg-v2-form-help">
                                {LOGIN_PASSWORD_POLICY_HINT_ONE_LINE} 비우면 임시 비밀번호로 등록됩니다.
                            </small>
                        </div>
                    )}
                    <div className="mg-v2-form-group">
                        <label id="consultant-specialty-label" className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_6a1abaf0')}</label>
                        <div className="mg-v2-form-help mg-v2-specialty-help-row">
                            <span className="mg-v2-specialty-help-row__hint">
                                <span aria-hidden="true">💡</span>
                                <span>{t('admin:ConsultantComprehensiveManagement.t_f3e38df7')}</span>
                            </span>
                            <span className="mg-v2-specialty-help-row__actions">
                                <MGButton
                                    type="button"
                                    variant="outline"
                                    size="small"
                                    preventDoubleClick={false}
                                    className={buildErpMgButtonClassName({
                                        variant: 'outline',
                                        size: 'sm',
                                        loading: false,
                                        className: 'mg-v2-button--compact'
                                    })}
                                    onClick={() => loadSpecialtyCodes()}
                                >
                                    {CONSULTANT_COMP_SPECIALTY.BTN_REFRESH_CODES}
                                </MGButton>
                                <MGButton
                                    type="button"
                                    variant="outline"
                                    size="small"
                                    preventDoubleClick={false}
                                    className={buildErpMgButtonClassName({
                                        variant: 'outline',
                                        size: 'sm',
                                        loading: false,
                                        className: 'mg-v2-button--compact'
                                    })}
                                    onClick={() => {
                                        setShowModal(false);
                                        navigate(`${ADMIN_ROUTES.TENANT_COMMON_CODES}?group=${CONSULTANT_COMP_SPECIALTY.TENANT_CODE_GROUP}`);
                                    }}
                                >
                                    {CONSULTANT_COMP_SPECIALTY.BTN_OPEN_TENANT_COMMON_CODES}
                                </MGButton>
                            </span>
                        </div>
                        <div className="mg-v2-form-help mg-v2-form-help--secondary">
                            {CONSULTANT_COMP_SPECIALTY.HELP_MANAGE_VIA_TENANT_CODES}
                        </div>
                        <div className="mg-v2-specialty-tags" role="group" aria-labelledby="consultant-specialty-label">
                            {specialtyCodes.map((opt) => {
                                const isSelected = (formData.specialty || []).includes(opt.codeValue);
                                return (
                                    <MGButton
                                        key={opt.codeValue}
                                        type="button"
                                        variant="outline"
                                        size="small"
                                        preventDoubleClick={false}
                                        className={buildErpMgButtonClassName({
                                            variant: 'outline',
                                            size: 'sm',
                                            loading: false,
                                            className: `mg-v2-specialty-tag ${isSelected ? 'mg-v2-specialty-tag--selected' : ''}`
                                        })}
                                        onClick={() => handleSpecialtyTagClick(opt.codeValue)}
                                    >
                                        {toDisplayString(opt.codeName || opt.codeLabel || opt.codeValue)}
                                    </MGButton>
                                );
                            })}
                        </div>
                    </div>
                    {(modalType === 'create' || modalType === 'edit') && (
                        <>
                            <div className="mg-v2-section-heading mg-v2-section-heading--accent">
                                <span className="mg-v2-section-heading__bar" />
                                <h3 className="mg-v2-section-heading__title">{t('admin:consultant.section.credentials')}</h3>
                            </div>
                            <div className="mg-v2-form-group">
                                <label htmlFor="consultant-qualifications" className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_c44d2799')}</label>
                                <input
                                    type="text"
                                    id="consultant-qualifications"
                                    name="qualifications"
                                    value={formData.qualifications || ''}
                                    onChange={handleFormChange}
                                    placeholder={t('admin:ConsultantComprehensiveManagement.t_7edd2cd8')}
                                    className="mg-v2-form-input"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <label htmlFor="consultant-workHistory" className="mg-v2-form-label">{t('admin:ConsultantComprehensiveManagement.t_c2bd8daf')}</label>
                                <textarea
                                    id="consultant-workHistory"
                                    name="workHistory"
                                    value={formData.workHistory || ''}
                                    onChange={handleFormChange}
                                    placeholder={t('admin:ConsultantComprehensiveManagement.t_8f92fc9c')}
                                    className="mg-v2-form-textarea"
                                    rows={3}
                                />
                            </div>
                        </>
                    )}
                    {modalType === 'edit' && selectedConsultant?.id ? (
                        <div className="mg-v2-client-modal__notification-channel">
                            <NotificationChannelPreferenceSection
                                subjectRole="CONSULTANT"
                                isEditing
                                readOnlyDueToPolicy={formData.notificationChannelPreferenceEditableByCaller === false}
                                readOnlyHintI18nKey="admin.userProfile.notificationChannel.staffReadOnlyHint"
                                preferenceValue={
                                    formData.notificationChannelPreference
                                    || NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT
                                }
                                tenantKakaoAvailable={formData.tenantNotificationChannelKakaoAvailable}
                                tenantSmsAvailable={formData.tenantNotificationChannelSmsAvailable}
                                tenantDefaultHint={formData.tenantDefaultNotificationChannelHint}
                                preferenceUiAdjusted={formData.notificationChannelPreferenceUiAdjusted}
                                onPreferenceChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        notificationChannelPreference: e.target.value
                                    }));
                                }}
                            />
                        </div>
                    ) : null}
                </form>
            </div>
        );
    };

    const getModalActions = () => {
        if (modalType === 'view') {
            return (
                <>
                    <MGButton
                        type="button"
                        variant="secondary"
                        preventDoubleClick={false}
                        className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                        onClick={handleCloseModal}
                    >
                        {t('common:actions.close')}
                    </MGButton>
                    <MGButton
                        type="button"
                        variant="secondary"
                        size="small"
                        preventDoubleClick={true}
                        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                        title={CONSULTANT_COMP_PASSWORD_RESET.BTN_TITLE}
                        onClick={() => {
                            if (!selectedConsultant) return;
                            setPasswordResetConsultant(selectedConsultant);
                            setShowPasswordResetModal(true);
                        }}
                    >
                        {CONSULTANT_COMP_PASSWORD_RESET.BTN_LABEL}
                    </MGButton>
                    <MGButton
                        type="button"
                        variant="primary"
                        preventDoubleClick={false}
                        className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                        onClick={() => handleOpenModal('edit', selectedConsultant)}
                    >
                        {t('common.actions.edit')}
                    </MGButton>
                </>
            );
        }
        const emailTrimmed = formData.email != null ? String(formData.email).trim() : '';
        const phoneNorm = normalizeKoreanMobileDigits(String(formData.phone ?? '').trim());
        const phoneNeedCheck = phoneNorm && isValidKoreanMobileDigits(phoneNorm);
        const isCreateSubmitDisabled = modalType === 'create' && (
            (emailTrimmed !== '' && emailCheckStatus !== 'available')
            || (phoneNeedCheck && consultantPhoneCheckStatus !== 'available')
        );
        return (
            <>
                <MGButton
                    type="button"
                    variant="secondary"
                    preventDoubleClick={false}
                    className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                    onClick={handleCloseModal}
                >
                    {t('admin.actions.cancel')}
                </MGButton>
                <MGButton
                    type="button"
                    variant={modalType === 'delete' ? 'danger' : 'primary'}
                    className={buildErpMgButtonClassName({
                        variant: modalType === 'delete' ? 'danger' : 'primary',
                        loading: modalSubmitLoading
                    })}
                    onClick={handleModalSubmit}
                    disabled={isCreateSubmitDisabled}
                    loading={modalSubmitLoading}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                    {modalType === 'create' && '등록'}
                    {modalType === 'edit' && '수정'}
                    {modalType === 'delete' && '삭제'}
                </MGButton>
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
                title={t('admin:ConsultantComprehensiveManagement.t_88f873b8')}
                size="medium"
                variant="confirm"
                className="mg-v2-ad-b0kla"
                backdropClick
                showCloseButton
                actions={
                    <>
                        <MGButton
                            type="button"
                            variant="secondary"
                            preventDoubleClick={false}
                            className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={deleteConfirmLoading}
                        >
                            {t('admin.actions.cancel')}
                        </MGButton>
                        <MGButton
                            type="button"
                            variant="danger"
                            className={buildErpMgButtonClassName({ variant: 'danger', loading: deleteConfirmLoading })}
                            loading={deleteConfirmLoading}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={async() => {
                                if (!selectedConsultant) return;
                                setDeleteConfirmLoading(true);
                                try {
                                    const result = await deleteConsultant(selectedConsultant.id);
                                    if (result?.success) setShowDeleteConfirm(false);
                                } finally {
                                    setDeleteConfirmLoading(false);
                                }
                            }}
                        >
                            {t('admin.actions.delete')}
                        </MGButton>
                    </>
                }
            >
                <div className="mg-v2-modal-body">
                    <p><SafeText fallback="이 상담사">{selectedConsultant?.name}</SafeText>{t('admin:ConsultantComprehensiveManagement.t_eb69022a')}</p>
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
        <AdminCommonLayout title={t('admin:ConsultantComprehensiveManagement.t_cc2e9864')}>
            <div className="mg-v2-ad-b0kla mg-v2-consultant-management">
                <div className="mg-v2-ad-b0kla__container">
                    <ContentArea ariaLabel="상담사 종합관리 본문">
                        {contentBlock}
                    </ContentArea>
                </div>
            </div>
            {modalsBlock}
        </AdminCommonLayout>
    );
};

ConsultantComprehensiveManagement.propTypes = {
  embedded: PropTypes.bool
};

export default ConsultantComprehensiveManagement;