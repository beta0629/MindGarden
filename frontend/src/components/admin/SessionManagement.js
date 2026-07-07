import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Users, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import StatCard from '../ui/Card/StatCard';
import DashboardSection from '../layout/DashboardSection';
import SearchFilterSection from './SearchFilterSection';
import SectionHeader from './SectionHeader';
import SessionExtensionModal from './mapping/SessionExtensionModal';
import SafeText from '../common/SafeText';
import { ProfileCard } from '../ui/Card/index';
import { toDisplayString } from '../../utils/safeDisplay';
import { getFormattedContact, getFormattedConsultationCount, getFormattedRegistrationDate, getMappingStatusKoreanNameSync } from '../../utils/codeHelper';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './SessionManagement.css';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';
import SavedViewControls from './ClientComprehensiveManagement/molecules/SavedViewControls';
import { useSavedViewPreference } from '../../hooks/useSavedViewPreference';
import {
    buildViewModeStorageKey,
    resolveViewModeStorageScope,
    useViewModePreference
} from '../../hooks/useViewModePreference';
import {
    SESSION_MANAGEMENT_ALLOWED_VIEW_MODES,
    SESSION_MANAGEMENT_DEFAULT_ACTIVE_TAB,
    SESSION_MANAGEMENT_DEFAULT_FILTER_STATUS,
    SESSION_MANAGEMENT_DEFAULT_SEARCH_TERM,
    SESSION_MANAGEMENT_DEFAULT_VIEW_MODE,
    SESSION_MANAGEMENT_SAVED_VIEW_PAGE_ID,
    SESSION_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS,
    buildSessionManagementDefaultSavedView
} from '../../constants/sessionManagementSavedViewConstants';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_CLIENTS_WITH_MAPPING_INFO = '/api/v1/admin/clients/with-mapping-info';
const API_ADMIN_SESSION_EXTENSIONS_REQUESTS = '/api/v1/admin/session-extensions/requests';
const API_COMMON_CODES_GROUPS_MAPPING_STATUS = '/api/v1/common-codes/groups/MAPPING_STATUS';

const SESSION_DEFAULT_SAVED_VIEW = buildSessionManagementDefaultSavedView(
    SESSION_MANAGEMENT_DEFAULT_VIEW_MODE
);

const SESSION_SAVED_VIEW_ROW_ARIA_LABEL = '저장된 뷰';

/**
 * 회기 관리 컴포넌트 - 완전 재설계
/**
 * - 단일 페이지 레이아웃
/**
 * - 원클릭 회기 추가
/**
 * - 빠른 접근성과 직관적 UI
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2024-12-19
 */
const SessionManagement = () => {
    const { t } = useTranslation(['admin', 'common']);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [mappings, setMappings] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState(SESSION_MANAGEMENT_DEFAULT_SEARCH_TERM);
    const [filterStatus, setFilterStatus] = useState(SESSION_MANAGEMENT_DEFAULT_FILTER_STATUS);
    
    const [mappingStatusOptions, setMappingStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    const [showSessionExtensionModal, setShowSessionExtensionModal] = useState(false);
    const [selectedMapping, setSelectedMapping] = useState(null);
    
    const [activeTab, setActiveTab] = useState(SESSION_MANAGEMENT_DEFAULT_ACTIVE_TAB);
    const { viewMode, setViewMode } = useViewModePreference({
        storageKey: buildViewModeStorageKey(
            resolveViewModeStorageScope(),
            SESSION_MANAGEMENT_SAVED_VIEW_PAGE_ID
        ),
        defaultMode: SESSION_MANAGEMENT_DEFAULT_VIEW_MODE,
        allowedModes: SESSION_MANAGEMENT_ALLOWED_VIEW_MODES
    });
    const {
        savedView,
        setSavedView,
        views,
        activeViewId,
        saveNamedView,
        loadNamedView,
        resetToDefaultView,
        deleteNamedView
    } = useSavedViewPreference({
        pageId: SESSION_MANAGEMENT_SAVED_VIEW_PAGE_ID,
        defaultView: SESSION_DEFAULT_SAVED_VIEW,
        namedViews: true
    });
    const savedViewFiltersRestoredRef = useRef(false);
    const savedViewPersistReadyRef = useRef(false);
    const savedViewPersistTimerRef = useRef(null);
    const savedViewMetaRef = useRef({
        sort: SESSION_DEFAULT_SAVED_VIEW.sort,
        density: SESSION_DEFAULT_SAVED_VIEW.density
    });
    
    const [sessionExtensionRequests, setSessionExtensionRequests] = useState([]);
    
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentReference, setPaymentReference] = useState('');
    
    const [confirmingPayment, setConfirmingPayment] = useState(false);
    const [rejectingRequest, setRejectingRequest] = useState(false);

    const loadData = useCallback(async() => {
        try {
            setLoading(true);
            
            const [clientsRes, consultantsRes, mappingsRes, requestsRes] = await Promise.all([
                apiGet(API_ADMIN_CLIENTS_WITH_MAPPING_INFO),
                apiGet(API_ENDPOINTS.ADMIN.CONSULTANTS.LIST),
                apiGet(API_ENDPOINTS.ADMIN.MAPPINGS.LIST),
                apiGet(API_ADMIN_SESSION_EXTENSIONS_REQUESTS)
            ]);
            
            const clientsData = clientsRes?.data || clientsRes || [];
            const consultantsData = consultantsRes?.data || consultantsRes || [];
            const mappingsData = mappingsRes?.data || mappingsRes || [];
            const requestsData = requestsRes?.data || requestsRes || [];
            
            setClients(clientsData);
            setConsultants(consultantsData);
            setMappings(mappingsData);
            setSessionExtensionRequests(requestsData);
            
            console.log('✅ 데이터 로드 완료:', {
                clients: clientsData.length,
                consultants: consultantsData.length,
                mappings: mappingsData.length,
                requests: requestsData.length
            });
            
            if (requestsData.length > 0) {
                console.log('🔍 회기 추가 요청 데이터 상세:', requestsData[0]);
                console.log('🔍 매핑 정보:', requestsData[0].mapping);
                console.log('🔍 클라이언트 정보:', requestsData[0].mapping?.client);
                console.log('🔍 상담사 정보:', requestsData[0].mapping?.consultant);
            }
            
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
            notificationManager.error(t('admin:session.error.dataLoad'));
            
            setClients([]);
            setConsultants([]);
            setMappings([]);
            setSessionExtensionRequests([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    const loadMappingStatusCodes = useCallback(async() => {
        try {
            setLoadingCodes(true);
            // 표준화 2025-12-08: 올바른 API 경로 사용 (/groups/{codeGroup})
            const response = await apiGet(API_COMMON_CODES_GROUPS_MAPPING_STATUS);
            if (response && response.length > 0) {
                const options = response.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel,
                    icon: code.icon,
                    color: code.colorCode,
                    description: code.codeDescription
                }));
                setMappingStatusOptions(options);
            }
        } catch (error) {
            console.error('매핑 상태 코드 로드 실패:', error);
            setMappingStatusOptions([
                { value: 'ACTIVE', label: t('admin:labels.active'), icon: 'Check', color: 'var(--mg-success-600)' },
                { value: 'INACTIVE', label: t('admin:labels.inactive'), icon: 'X', color: 'var(--mg-error-600)' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, [t]);

    const getFilteredMappings = useCallback(() => {
        let filtered = mappings;
        
        if (searchTerm) {
            filtered = filtered.filter(mapping => 
                (mapping.clientName && mapping.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (mapping.consultantName && mapping.consultantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (mapping.packageName && mapping.packageName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(mapping => mapping.status === filterStatus);
        }

        return filtered;
    }, [mappings, searchTerm, filterStatus]);

    const getRecentActiveMappings = useCallback(() => {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        const activeMappings = mappings.filter(mapping => mapping.status === 'ACTIVE');
        const recentMappings = activeMappings
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 6); // 최대 6개
        
        console.log('🔍 최근 활성 매핑:', {
            totalMappings: mappings.length,
            activeMappings: activeMappings.length,
            recentMappings: recentMappings.length,
            mappings: mappings.slice(0, 3) // 처음 3개만 로그
        });
        
        return recentMappings;
    }, [mappings]);

    const handleQuickAdd = (mapping) => {
        console.log('🚀 빠른 회기 추가 클릭:', mapping);
        setSelectedMapping(mapping);
        setShowSessionExtensionModal(true);
    };

    const getRecentSessionExtensionRequests = useCallback(() => {
        return sessionExtensionRequests
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
    }, [sessionExtensionRequests]);

    const getStatusDisplay = (status) => {
        const statusMap = {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'PENDING': { color: 'var(--warning-600)' },
            'PAYMENT_CONFIRMED': { color: 'var(--info-600)' },
            'ADMIN_APPROVED': { color: 'var(--success-600)' },
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'COMPLETED': { color: 'var(--success-600)' },
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'REJECTED': { color: 'var(--danger-600)' }
        };
        const config = statusMap[status] || { color: 'var(--gray-600)' };
        const text = getMappingStatusKoreanNameSync(status);
        return { text, ...config };
    };

    const handlePaymentConfirm = async(requestId) => {
        try {
            setConfirmingPayment(true);
            await apiPost(`/api/admin/session-extensions/requests/${requestId}/confirm-payment`, {
                paymentMethod: 'CASH',
                paymentReference: null
            });
            notificationManager.success(t('admin:session.success.paymentConfirmed'));
            
            setTimeout(async() => {
                console.log('🔄 입금 확인 후 데이터 새로고침 시작...');
                await loadData();
                console.log('✅ 입금 확인 후 데이터 새로고침 완료 - 회기수 업데이트됨');
            }, 1500); // 1.5초 후 새로고침 (PL/SQL 처리 시간 고려)
            
        } catch (error) {
            console.error('입금 확인 실패:', error);
            notificationManager.error(t('admin:session.error.paymentConfirm'));
        } finally {
            setConfirmingPayment(false);
        }
    };

    const handleAdminApprove = async(requestId) => {
        try {
            setConfirmingPayment(true); // 재사용
            await apiPost(`/api/admin/session-extensions/requests/${requestId}/approve`, {
                adminId: 1, // TODO: 실제 관리자 ID
                comment: t('admin:session.adminApproveComment')
            });
            notificationManager.success(t('admin:session.success.adminApprove'));
            loadData();
        } catch (error) {
            console.error('관리자 승인 실패:', error);
            notificationManager.error(t('admin:session.error.adminApprove'));
        } finally {
            setConfirmingPayment(false);
        }
    };

    const handleRejectRequest = async(requestId) => {
        try {
            setRejectingRequest(true);
            await apiPost(`/api/admin/session-extensions/requests/${requestId}/reject`, {
                adminId: 1, // TODO: 실제 관리자 ID
                reason: t('admin:session.rejectReason')
            });
            notificationManager.success(t('admin:session.success.reject'));
            loadData();
        } catch (error) {
            console.error('요청 거부 실패:', error);
            notificationManager.error(t('admin:session.error.reject'));
        } finally {
            setRejectingRequest(false);
        }
    };

    const handleSessionExtensionRequested = async(mappingId) => {
        console.log('✅ 회기 추가 요청 완료:', mappingId);
        setShowSessionExtensionModal(false);
        setSelectedMapping(null);
        
        setTimeout(async() => {
            console.log('🔄 회기 추가 후 데이터 새로고침 시작...');
            await loadData();
            console.log('✅ 회기 추가 후 데이터 새로고침 완료');
        }, 1000); // 1초 후 새로고침
    };

    useEffect(() => {
        if (savedViewFiltersRestoredRef.current) {
            return;
        }
        savedViewFiltersRestoredRef.current = true;
        savedViewMetaRef.current = {
            sort: savedView.sort ?? SESSION_DEFAULT_SAVED_VIEW.sort,
            density: savedView.density ?? SESSION_DEFAULT_SAVED_VIEW.density
        };
        if (savedView?.viewMode) {
            setViewMode(savedView.viewMode);
        }
        const storedFilters = savedView?.filters;
        if (storedFilters && Object.keys(storedFilters).length > 0) {
            if (storedFilters.searchTerm != null) {
                setSearchTerm(storedFilters.searchTerm);
            }
            if (storedFilters.filterStatus != null) {
                setFilterStatus(storedFilters.filterStatus);
            }
            if (storedFilters.activeTab != null) {
                setActiveTab(storedFilters.activeTab);
            }
        }
        savedViewPersistReadyRef.current = true;
    }, [savedView, setViewMode]);

    useEffect(() => {
        if (!savedViewPersistReadyRef.current) {
            return undefined;
        }

        if (savedViewPersistTimerRef.current) {
            clearTimeout(savedViewPersistTimerRef.current);
        }

        savedViewPersistTimerRef.current = setTimeout(() => {
            savedViewPersistTimerRef.current = null;
            setSavedView({
                viewMode,
                filters: { searchTerm, filterStatus, activeTab },
                sort: savedViewMetaRef.current.sort,
                density: savedViewMetaRef.current.density
            });
        }, SESSION_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS);

        return () => {
            if (savedViewPersistTimerRef.current) {
                clearTimeout(savedViewPersistTimerRef.current);
                savedViewPersistTimerRef.current = null;
            }
        };
    }, [viewMode, searchTerm, filterStatus, activeTab, setSavedView]);

    const applySavedViewPayload = useCallback((payload) => {
        if (payload?.viewMode) {
            setViewMode(payload.viewMode);
        }
        const storedFilters = payload?.filters ?? {};
        if (storedFilters.searchTerm != null) {
            setSearchTerm(storedFilters.searchTerm);
        }
        if (storedFilters.filterStatus != null) {
            setFilterStatus(storedFilters.filterStatus);
        }
        if (storedFilters.activeTab != null) {
            setActiveTab(storedFilters.activeTab);
        }
        savedViewMetaRef.current = {
            sort: payload?.sort ?? SESSION_DEFAULT_SAVED_VIEW.sort,
            density: payload?.density ?? SESSION_DEFAULT_SAVED_VIEW.density
        };
    }, [setViewMode]);

    const handleSelectSavedView = useCallback((viewId) => {
        const payload = loadNamedView(viewId);
        applySavedViewPayload(payload);
    }, [loadNamedView, applySavedViewPayload]);

    const handleResetSavedView = useCallback(() => {
        const payload = resetToDefaultView();
        applySavedViewPayload(payload);
    }, [resetToDefaultView, applySavedViewPayload]);

    const handleSaveNamedView = useCallback((label) => {
        saveNamedView(label, {
            viewMode,
            filters: { searchTerm, filterStatus, activeTab },
            sort: savedViewMetaRef.current.sort,
            density: savedViewMetaRef.current.density
        });
    }, [saveNamedView, viewMode, searchTerm, filterStatus, activeTab]);

    const handleDeleteSavedView = useCallback((viewId) => {
        const fallbackPayload = deleteNamedView(viewId);
        if (fallbackPayload) {
            applySavedViewPayload(fallbackPayload);
        }
    }, [deleteNamedView, applySavedViewPayload]);

    useEffect(() => {
        loadData();
        loadMappingStatusCodes();
    }, [loadData, loadMappingStatusCodes]);

    const showSessionBodyLoader =
        (loading && mappings.length === 0) || (loading && clients.length === 0);

    return (
        <AdminCommonLayout title={t('admin:session.pageTitle')}>
            <div className="mg-v2-ad-b0kla mg-v2-session-management">
                <div className="mg-v2-ad-b0kla__container">
                    <ContentArea ariaLabel={t('admin:session.ariaContent')}>
                        <ContentHeader
                            title={t('admin:session.pageTitle')}
                            subtitle={t('admin:session.subtitle')}
                            titleId="session-management-title"
                        />
                        <main aria-labelledby="session-management-title" className="mg-dashboard-layout">
                {showSessionBodyLoader ? (
                    <div className="mg-dashboard-loading" aria-busy="true" aria-live="polite">
                        <UnifiedLoading type="inline" text={t('common:state.dataLoading')} />
                    </div>
                ) : (
                    <>
                <section className="mg-v2-session-saved-view-row" aria-label={SESSION_SAVED_VIEW_ROW_ARIA_LABEL}>
                    <SavedViewControls
                        views={views}
                        activeViewId={activeViewId}
                        onSelectView={handleSelectSavedView}
                        onSaveView={handleSaveNamedView}
                        onResetToDefault={handleResetSavedView}
                        onDeleteView={handleDeleteSavedView}
                    />
                </section>
                {/* 통계 카드 그리드 */}
                <div className="mg-dashboard-stats">
                    <StatCard
                        icon={<Users />}
                        value={clients.length}
                        label={t('admin:session.stat.totalClients')}
                    />
                    <StatCard
                        icon={<CheckCircle />}
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        value={mappings.filter(m => m.status === 'ACTIVE').length}
                        label={t('admin:session.stat.activeMappings')}
                    />
                    <StatCard
                        icon={<Calendar />}
                        value={mappings.reduce((sum, m) => sum + (m.usedSessions || 0), 0)}
                        label={t('admin:session.stat.usedSessions')}
                    />
                    <StatCard
                        icon={<TrendingUp />}
                        value={`${mappings.length > 0 ? Math.round((mappings.filter(m => m.status === 'SESSIONS_EXHAUSTED' || m.status === 'TERMINATED').length / mappings.length) * 100) : 0}%`}
                        label={t('admin:session.stat.completionRate')}
                    />
                </div>

                {/* 메인 콘텐츠 */}
                <div className="mg-dashboard-content">
                    {/* 회기 추가 방법 선택 탭 */}
                    <div className="mg-v2-card">
                        <div className="mg-tabs">
                            <MGButton 
                                type="button"
                                variant="outline"
                                className={buildErpMgButtonClassName({
                                    variant: 'outline',
                                    size: 'md',
                                    loading: false,
                                    className: `mg-tab ${activeTab === 'quick' ? 'mg-tab-active' : ''}`
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() => setActiveTab('quick')}
                                preventDoubleClick={false}
                            >
                                {t('admin:session.tab.quick')}
                            </MGButton>
                            <MGButton 
                                type="button"
                                variant="outline"
                                className={buildErpMgButtonClassName({
                                    variant: 'outline',
                                    size: 'md',
                                    loading: false,
                                    className: `mg-tab ${activeTab === 'search' ? 'mg-tab-active' : ''}`
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() => setActiveTab('search')}
                                preventDoubleClick={false}
                            >
                                {t('admin:session.tab.search')}
                            </MGButton>
                            <MGButton 
                                type="button"
                                variant="outline"
                                className={buildErpMgButtonClassName({
                                    variant: 'outline',
                                    size: 'md',
                                    loading: false,
                                    className: `mg-tab ${activeTab === 'mapping' ? 'mg-tab-active' : ''}`
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() => setActiveTab('mapping')}
                                preventDoubleClick={false}
                            >
                                {t('admin:session.tab.mapping')}
                            </MGButton>
                        </div>

                        {/* 회기 추가 섹션 */}
                        <div className="mg-v2-session-section">
                            {activeTab === 'quick' && (
                                <DashboardSection
                                    title={t('admin:session.section.quickAdd')}
                                    icon={<Zap size={24} />}
                                >
                                    <div className="mg-v2-quick-mappings-grid">
                                {getRecentActiveMappings().map(mapping => {
                                    const clientName = mapping.client?.name || mapping.clientName || t('common:state.unknown');
                                    const consultantName = mapping.consultant?.name || mapping.consultantName || t('common:state.unknown');
                                    const totalSessions = mapping.totalSessions || mapping.package?.sessions || 0;
                                    const usedSessions = mapping.usedSessions || 0;
                                    const clientProfileImageUrl = mapping.client?.profileImageUrl ?? null;
                                    return (
                                        <ProfileCard
                                            key={mapping.id}
                                            variant="compact"
                                            avatar={{
                                                profileImageUrl: clientProfileImageUrl,
                                                displayName: toDisplayString(clientName)
                                            }}
                                            name={<SafeText>{clientName}</SafeText>}
                                            contactInfo={{
                                                email: <SafeText>{consultantName}</SafeText>
                                            }}
                                            badges={[
                                                <span key="sessions" className="mg-v2-badge">
                                                    <span className="mg-v2-sessions-current mg-v2-sessions-current-danger">{toDisplayString(usedSessions)}</span>
                                                    <span className="mg-v2-sessions-separator">/</span>
                                                    <span className="mg-v2-sessions-total mg-v2-sessions-total-primary">{toDisplayString(totalSessions)}</span>
                                                    <span className="mg-v2-sessions-unit">{t('admin:session.sessionUnit')}</span>
                                                </span>
                                            ]}
                                            renderActions={() => (
                                                <MGButton
                                                    variant="primary"
                                                    size="small"
                                                    className={buildErpMgButtonClassName({
                                                        variant: 'primary',
                                                        size: 'sm',
                                                        loading: false,
                                                        className: 'mg-v2-quick-add-button'
                                                    })}
                                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                    preventDoubleClick={false}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleQuickAdd(mapping);
                                                    }}
                                                >
                                                    {t('admin:session.action.addSession')}
                                                </MGButton>
                                            )}
                                            onClick={() => handleQuickAdd(mapping)}
                                        />
                                    );
                                })}
                                
                                {getRecentActiveMappings().length === 0 && (
                                    <div className="mg-empty-state">
                                        <div className="mg-empty-state__text">{t('admin:session.empty.activeMapping')}</div>
                                    </div>
                                )}
                                    </div>
                                </DashboardSection>
                            )}
                        
                        {activeTab === 'search' && (
                            <DashboardSection
                                title={t('admin:session.section.search')}
                                icon={<Users size={24} />}
                            >
                            <div className="mg-v2-search-section">
                                <div className="mg-v2-search-form">
                                    <input
                                        type="text"
                                        placeholder={t('admin:session.search.placeholder')}
                                        className="mg-v2-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <MGButton
                                        variant="primary"
                                        size="medium"
                                        className={buildErpMgButtonClassName({
                                            variant: 'primary',
                                            size: 'md',
                                            loading: false
                                        })}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                        onClick={() => {
                                            console.log('검색 실행');
                                        }}
                                        preventDoubleClick={true}
                                        clickDelay={500}
                                    >
                                        {t('common:action.search')}
                                    </MGButton>
                                </div>
                                
                                <div className="mg-v2-search-results">
                                    {clients.filter(client => 
                                        client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).slice(0, 10).map(client => {
                                        const clientMappings = mappings.filter(m => 
                                            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                            m.clientId === client.id && m.status === 'ACTIVE'
                                        );
                                        
                                        return (
                                            <ProfileCard
                                                key={client.id}
                                                variant="compact"
                                                avatar={{
                                                    profileImageUrl: client.profileImageUrl,
                                                    displayName: toDisplayString(client.name)
                                                }}
                                                name={<SafeText tag="div">{client.name}</SafeText>}
                                                badges={[
                                                    <span key="mappings" className="mg-v2-badge">
                                                        {t('admin:session.activeMappingsCount', { count: clientMappings.length })}
                                                    </span>
                                                ]}
                                                renderActions={() => (
                                                    <MGButton
                                                        variant="success"
                                                        size="small"
                                                        className={buildErpMgButtonClassName({
                                                            variant: 'success',
                                                            size: 'sm',
                                                            loading: false
                                                        })}
                                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                        disabled={clientMappings.length === 0}
                                                        title={toDisplayString(clientMappings.length === 0 ? t('admin:session.noActiveMapping') : '')}
                                                        preventDoubleClick={false}
                                                        onClick={() => {
                                                            if (clientMappings.length > 0) {
                                                                handleQuickAdd(clientMappings[0]);
                                                            }
                                                        }}
                                                    >
                                                        {t('admin:session.action.addSession')}
                                                    </MGButton>
                                                )}
                                            />
                                        );
                                    })}
                                </div>
                                
                                {searchTerm && clients.filter(client => 
                                    client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && (
                                    <div className="mg-empty-state">
                                        <div className="mg-empty-state__text">{t('common:state.noResult')}</div>
                                    </div>
                                )}
                            </div>
                            </DashboardSection>
                        )}
                        
                        {activeTab === 'mapping' && (
                            <DashboardSection
                                title={t('admin:session.section.allMapping')}
                                icon={<Calendar size={24} />}
                            >
                                <div className="mg-v2-mapping-section">
                                    <div className="mg-v2-mapping-filters">
                                        <select 
                                            className="mg-v2-input"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="ALL">{t('admin:session.filter.allStatus')}</option>
                                            <option value="ACTIVE">{t('admin:labels.active')}</option>
                                            <option value="PAYMENT_CONFIRMED">{t('admin:session.status.paymentConfirmed')}</option>
                                            <option value="COMPLETED">{t('admin:actions.done')}</option>
                                        </select>
                                    </div>
                                    
                                    <div className="mg-v2-mapping-grid">
                                        {getFilteredMappings().slice(0, 20).map(mapping => (
                                            <div key={mapping.id} className="mg-v2-mapping-card">
                                                <div className="mg-v2-mapping-info">
                                                    <div className="mg-v2-mapping-client">
                                                        👤 <SafeText>{mapping.clientName}</SafeText>
                                                    </div>
                                                    <div className="mg-v2-mapping-consultant">
                                                        🤝 <SafeText>{mapping.consultantName}</SafeText>
                                                    </div>
                                                    <div className="mg-v2-mapping-sessions">
                                                        📊 <SafeText>{mapping.usedSessions}</SafeText>/<SafeText>{mapping.totalSessions}</SafeText>{t('admin:session.sessionUnit')}
                                                    </div>
                                                    <div className={`mg-mapping-status mg-status-${toDisplayString(mapping.status, 'unknown').toLowerCase()}`}>
                                                        <SafeText>{getMappingStatusKoreanNameSync(mapping.status)}</SafeText>
                                                    </div>
                                                </div>
                                                <div className="mg-v2-mapping-card-actions">
                                                    <MGButton
                                                        variant="primary"
                                                        size="small"
                                                        className={buildErpMgButtonClassName({
                                                            variant: 'primary',
                                                            size: 'sm',
                                                            loading: false
                                                        })}
                                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                        onClick={() => handleQuickAdd(mapping)}
                                                        disabled={mapping.status !== 'ACTIVE'}
                                                        title={toDisplayString(mapping.status !== 'ACTIVE' ? t('admin:session.notActive') : '')}
                                                        preventDoubleClick={false}
                                                    >
                                                        {t('admin:session.action.addSession')}
                                                    </MGButton>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {getFilteredMappings().length === 0 && (
                                        <div className="mg-empty-state">
                                            <div className="mg-empty-state__text">{t('admin:session.empty.mapping')}</div>
                                        </div>
                                    )}
                                </div>
                            </DashboardSection>
                        )}
                    </div>
                    </div>

                    {/* 최근 회기 추가 요청 섹션 */}
                    <DashboardSection
                        title={t('admin:session.section.recentRequests')}
                        icon={<Calendar size={24} />}
                    >
                        
                        <div className="mg-v2-recent-requests">
                            {getRecentSessionExtensionRequests().map(request => (
                                <div key={request.id} className="mg-v2-request-card">
                                    <div className="mg-v2-request-header">
                                        <div className="mg-v2-request-info">
                                            <div className="mg-v2-request-client">
                                                {request.mapping?.client?.name || request.clientName || t('common:state.unknown')}
                                            </div>
                                            <div className="mg-v2-request-consultant">
                                                {request.mapping?.consultant?.name || request.consultantName || t('common:state.unknown')}
                                            </div>
                                        </div>
                                        <div className={`mg-request-status mg-request-status--${request.status?.toLowerCase()}`}>
                                            {getStatusDisplay(request.status).text}
                                        </div>
                                    </div>
                                    
                                    <div className="mg-v2-request-details">
                                        <div className="mg-v2-request-sessions">
                                            +{t('admin:session.addedSessions', { count: request.additionalSessions })}
                                        </div>
                                        <div className="mg-v2-request-package">
                                            {request.packageName} • {parseInt(request.packagePrice || 0).toLocaleString()}{t('admin:mappingCreation.currency')}
                                        </div>
                                        <div className="mg-v2-request-date">
                                            {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                                        </div>
                                    </div>
                                    
                                    {request.reason && (
                                        <div className="mg-v2-request-reason">
                                            <strong>{t('admin:session.reason')}:</strong> {request.reason}
                                        </div>
                                    )}
                                    
                                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                    {request.status === 'PENDING' && (
                                        <div className="mg-v2-request-actions">
                                            <MGButton
                                                variant="success"
                                                size="small"
                                                className={buildErpMgButtonClassName({
                                                    variant: 'success',
                                                    size: 'sm',
                                                    loading: confirmingPayment
                                                })}
                                                loading={confirmingPayment}
                                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                onClick={() => handlePaymentConfirm(request.id)}
                                                preventDoubleClick={true}
                                                clickDelay={2000}
                                            >
                                                {t('admin:session.action.paymentConfirm')}
                                            </MGButton>
                                            <MGButton
                                                variant="danger"
                                                size="small"
                                                className={buildErpMgButtonClassName({
                                                    variant: 'danger',
                                                    size: 'sm',
                                                    loading: rejectingRequest
                                                })}
                                                loading={rejectingRequest}
                                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                onClick={() => handleRejectRequest(request.id)}
                                                preventDoubleClick={true}
                                                clickDelay={1000}
                                            >
                                                {t('admin:session.action.reject')}
                                            </MGButton>
                                        </div>
                                    )}
                                    
                                    {request.status === 'PAYMENT_CONFIRMED' && (
                                        <div className="mg-v2-request-actions">
                                            <MGButton
                                                variant="primary"
                                                size="small"
                                                className={buildErpMgButtonClassName({
                                                    variant: 'primary',
                                                    size: 'sm',
                                                    loading: confirmingPayment
                                                })}
                                                loading={confirmingPayment}
                                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                onClick={() => handleAdminApprove(request.id)}
                                                preventDoubleClick={true}
                                                clickDelay={2000}
                                            >
                                                {t('admin:session.action.adminApprove')}
                                            </MGButton>
                                            <MGButton
                                                variant="danger"
                                                size="small"
                                                className={buildErpMgButtonClassName({
                                                    variant: 'danger',
                                                    size: 'sm',
                                                    loading: rejectingRequest
                                                })}
                                                loading={rejectingRequest}
                                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                onClick={() => handleRejectRequest(request.id)}
                                                preventDoubleClick={true}
                                                clickDelay={1000}
                                            >
                                                {t('admin:session.action.reject')}
                                            </MGButton>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {getRecentSessionExtensionRequests().length === 0 && (
                            <div className="mg-empty-state">
                                <div className="mg-empty-state__text">{t('admin:session.empty.recentRequests')}</div>
                            </div>
                        )}
                    </DashboardSection>
                </div>

                {/* 회기 추가 요청 모달 */}
                <SessionExtensionModal
                    isOpen={showSessionExtensionModal}
                    onClose={() => setShowSessionExtensionModal(false)}
                    mapping={selectedMapping}
                    onSessionExtensionRequested={handleSessionExtensionRequested}
                />
                    </>
                )}
                        </main>
                    </ContentArea>
                </div>
            </div>
        </AdminCommonLayout>
    );
};

export default SessionManagement;