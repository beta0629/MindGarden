import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { Plus, Users, UserCheck, Clock, Link2 } from 'lucide-react';
import { apiGet, apiDelete } from '../../utils/ajax';
import StandardizedApi from '../../utils/standardizedApi';
import { normalizeVehiclePlateInput, validateEmail, validatePhone } from '../../utils/validationUtils';
import { getAllClientsWithStats } from '../../utils/consultantHelper';
import { showError, showSuccess } from '../../utils/notification';
import { VALIDATION_MESSAGES } from '../../constants/messages';
import { getCommonCodes } from '../../utils/commonCodeApi';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ViewModeToggle } from '../common';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import ContentCard from '../dashboard-v2/content/ContentCard';
import { SearchInput } from '../dashboard-v2/atoms';
import ClientOverviewTab from './ClientComprehensiveManagement/ClientOverviewTab';
import ClientConsultationTab from './ClientComprehensiveManagement/ClientConsultationTab';
import ClientMappingTab from './ClientComprehensiveManagement/ClientMappingTab';
import ClientStatisticsTab from './ClientComprehensiveManagement/ClientStatisticsTab';
import ClientModal from './ClientComprehensiveManagement/ClientModal';
import PasswordResetModal from './PasswordResetModal';
import SafeText from '../common/SafeText';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './mapping-management/organisms/MappingKpiSection.css';
import './mapping-management/organisms/MappingSearchSection.css';
import './mapping-management/organisms/MappingListBlock.css';
import './mapping-management/MappingManagementPage.css';
import './ClientManagementPage.css';

/**
 * 내담자 종합관리 메인 컴포넌트
/**
 * - 내담자 정보 종합 조회
/**
 * - 상담 이력 관리
/**
 * - 회기 현황 관리
/**
 * - 상담사 매칭 관리
/**
 * - 통계 및 분석
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const ClientComprehensiveManagement = ({ embedded = false }) => {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [mainTab, setMainTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [userStatusOptions, setUserStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [viewMode, setViewMode] = useState('smallCard'); // 'largeCard' | 'smallCard' | 'list' — 기본: 컴팩트(작은 카드)
    
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
    const [editingClient, setEditingClient] = useState(null);
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [passwordResetClient, setPasswordResetClient] = useState(null);
    const formDataRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        status: 'ACTIVE',
        grade: 'BRONZE',
        notes: '',
        profileImageUrl: '',
        rrnFirst6: '',
        rrnLast1: '',
        address: '',
        addressDetail: '',
        postalCode: '',
        vehiclePlate: '',
        consultationPurpose: '',
        consultationHistory: '',
        emergencyContact: '',
        emergencyPhone: ''
    });
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const loadCommonCodes = useCallback(async () => {
        if (loadingCodes) return;
        
        setLoadingCodes(true);
        try {
            const [userStatusCodes, userGradeCodes] = await Promise.all([
                getCommonCodes('USER_STATUS'),
                getCommonCodes('USER_GRADE')
            ]);
            
            // 중복 제거: codeValue 기준으로 중복 제거
            const uniqueStatusCodes = (userStatusCodes || []).filter((option, index, self) => 
                index === self.findIndex(o => o.codeValue === option.codeValue)
            );
            
            setUserStatusOptions(uniqueStatusCodes);
            
            console.log('공통 코드 로드 완료:', {
                status: uniqueStatusCodes.length,
                grade: userGradeCodes?.length || 0,
                originalCount: userStatusCodes?.length || 0,
                uniqueCount: uniqueStatusCodes.length
            });
        } catch (error) {
            console.error('공통 코드 로드 실패:', error);
            setUserStatusOptions([
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { codeValue: 'ACTIVE', codeLabel: '활성' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { codeValue: 'INACTIVE', codeLabel: '비활성' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { codeValue: 'PENDING', codeLabel: '대기' }
            ]);
            showError('공통 코드를 불러오는데 실패했습니다. 기본값을 사용합니다.');
        } finally {
            setLoadingCodes(false);
        }
    }, [loadingCodes]);

    const loadClients = useCallback(async () => {
        setLoading(true);
        try {
            console.log('🔄 내담자 목록 로딩 시작 (통합 API)...');
            
            const clientsList = await getAllClientsWithStats();
            console.log('📊 통합 API 응답:', clientsList);
            
            if (clientsList && clientsList.length > 0) {
                const clientsData = clientsList.map(item => {
                    const clientEntity = item.client || {};
                    return {
                        id: clientEntity.id,
                        name: clientEntity.name,
                        email: clientEntity.email,
                        phone: clientEntity.phone,
                        role: clientEntity.role,
                        status: clientEntity.status,
                        isActive: clientEntity.isActive,
                        branchCode: clientEntity.branchCode,
                        profileImageUrl: clientEntity.profileImageUrl,
                        address: clientEntity.address || '',
                        addressDetail: clientEntity.addressDetail || clientEntity.address_detail || '',
                        postalCode: clientEntity.postalCode || clientEntity.postal_code || '',
                        birthDate: clientEntity.birthDate ?? clientEntity.birth_date,
                        gender: clientEntity.gender,
                        age: clientEntity.age,
                        grade: clientEntity.grade,
                        notes: clientEntity.notes,
                        createdAt: clientEntity.createdAt,
                        updatedAt: clientEntity.updatedAt,
                        vehiclePlate: clientEntity.vehiclePlate,
                        consultationPurpose: clientEntity.consultationPurpose || '',
                        consultationHistory: clientEntity.consultationHistory || '',
                        emergencyContact: clientEntity.emergencyContact || '',
                        emergencyPhone: clientEntity.emergencyPhone || '',
                        currentConsultants: item.currentConsultants || 0,
                        totalConsultants: item.totalConsultants || 0,
                        statistics: item.statistics || {}
                    };
                });
                
                setClients(clientsData);
                console.log('✅ 내담자 목록 설정 완료 (통합 API):', clientsData.length, '명');
            } else {
                console.warn('⚠️ 내담자 데이터 없음');
                setClients([]);
            }
        } catch (error) {
            console.error('❌ 내담자 목록 로딩 오류:', error);
            setClients([]);
            showError('내담자 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadConsultants = useCallback(async () => {
        try {
            const response = await apiGet('/api/v1/admin/consultants');
            console.log('📊 상담사 목록 응답:', response);
            
            if (response && response.success) {
                const consultantsList = response.data?.consultants || response.data || [];
                setConsultants(Array.isArray(consultantsList) ? consultantsList : []);
            } else {
                console.warn('상담사 목록 응답 실패:', response);
                setConsultants([]);
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
            setConsultants([]);
        }
    }, []);

    const loadMappings = useCallback(async () => {
        try {
            const response = await apiGet('/api/v1/admin/mappings');
            console.log('📊 매칭 정보 응답:', response);
            // apiGet이 401/404 시 null 반환 → 총 매칭 0건으로 표시됨. 원인 추적용 로그.
            if (response == null) {
                console.warn('⚠️ 매칭 API 응답 없음 (401/404 또는 리다이렉트). 총 매칭 KPI가 0으로 표시됩니다.');
                setMappings([]);
                return;
            }
            // apiGet이 이미 { success, data }를 풀어 data만 반환 → response = { mappings, count }
            const list = Array.isArray(response?.mappings) ? response.mappings : [];
            if (list.length === 0 && typeof response?.count === 'number' && response.count > 0) {
                console.warn('⚠️ 매칭 API: count는', response.count, '건이나 mappings 배열 없음. 응답 구조 확인 필요.');
            }
            setMappings(list);
            if (list.length > 0) {
                console.log('✅ 매칭 정보 설정:', list.length, '건');
            }
        } catch (error) {
            console.error('매칭 정보 로드 실패:', error);
            setMappings([]);
        }
    }, []);

    const loadConsultations = useCallback(async () => {
        try {
            console.log('🔄 상담 이력 로드 시작...');
            const response = await apiGet('/api/v1/admin/consultations');
            console.log('📊 상담 이력 응답:', response);
            
            if (Array.isArray(response)) {
                console.log('✅ 상담 이력 배열로 처리:', response.length, '건');
                setConsultations(response);
            } else if (response && response.success) {
                console.log('✅ 상담 이력 성공 응답:', response.data?.length || 0, '건');
                setConsultations(response.data || []);
            } else {
                console.warn('⚠️ 상담 이력 응답 실패:', response);
                setConsultations([]);
            }
        } catch (error) {
            console.error('❌ 상담 이력 로드 실패:', error);
            if (error.message && error.message.includes('권한')) {
                console.log('⚠️ 상담 이력 조회 권한이 없습니다. 빈 배열로 처리합니다.');
            }
            setConsultations([]);
        }
    }, []);

    useEffect(() => {
        loadCommonCodes();
        loadClients();
        loadConsultants();
        loadMappings();
        loadConsultations();
    }, []);

    const handleClientSelect = useCallback((client) => {
        setModalType('view');
        setEditingClient(client);
        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            status: client.status || 'ACTIVE',
            grade: client.grade || 'BRONZE',
            notes: client.notes || '',
            profileImageUrl: client.profileImageUrl || '',
            rrnFirst6: '',
            rrnLast1: '',
            gender: client.gender || '',
            birthDate: client.birthDate ?? client.birth_date ?? null,
            age: client.age != null ? client.age : null,
            address: client.address || '',
            addressDetail: client.addressDetail || '',
            postalCode: client.postalCode || '',
            vehiclePlate: client.vehiclePlate || '',
            consultationPurpose: client.consultationPurpose || '',
            consultationHistory: client.consultationHistory || '',
            emergencyContact: client.emergencyContact || '',
            emergencyPhone: client.emergencyPhone || ''
        });
        setShowModal(true);
    }, []);

    const handleMainTabChange = useCallback((tab) => {
        setMainTab(tab);
    }, []);

    const clientFilterOptions = useMemo(() => {
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

    const clientKpiStats = useMemo(() => {
        const total = clients.length;
        const active = clients.filter(c => c.status === 'ACTIVE').length;
        const pending = clients.filter(c => c.status === 'PENDING').length;
        const totalMappings = mappings.length;
        return { total, active, pending, totalMappings };
    }, [clients, mappings]);

    const handleCreateClient = useCallback(() => {
        setModalType('create');
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            status: 'ACTIVE',
            grade: 'BRONZE',
            notes: '',
            profileImageUrl: '',
            rrnFirst6: '',
            rrnLast1: '',
            address: '',
            addressDetail: '',
            postalCode: '',
            vehiclePlate: '',
            consultationPurpose: '',
            consultationHistory: '',
            emergencyContact: '',
            emergencyPhone: ''
        });
        setShowModal(true);
    }, []);

    const handleEditClient = useCallback((client) => {
        setModalType('edit');
        setEditingClient(client);
        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            status: client.status || 'ACTIVE',
            grade: client.grade || 'BRONZE',
            notes: client.notes || '',
            profileImageUrl: client.profileImageUrl || '',
            rrnFirst6: '',
            rrnLast1: '',
            gender: client.gender || '',
            birthDate: client.birthDate ?? client.birth_date ?? null,
            age: client.age != null ? client.age : null,
            address: client.address || '',
            addressDetail: client.addressDetail || '',
            postalCode: client.postalCode || '',
            vehiclePlate: client.vehiclePlate || '',
            consultationPurpose: client.consultationPurpose || '',
            consultationHistory: client.consultationHistory || '',
            emergencyContact: client.emergencyContact || '',
            emergencyPhone: client.emergencyPhone || ''
        });
        setShowModal(true);
    }, []);

    const handleDeleteClient = useCallback((client) => {
        setModalType('delete');
        setEditingClient(client);
        setShowModal(true);
    }, []);

    const handleResetPassword = useCallback((client) => {
        setPasswordResetClient(client);
        setShowPasswordResetModal(true);
    }, []);

    const handlePasswordResetConfirm = useCallback(async (newPassword) => {
        if (!passwordResetClient) return;

        try {
            console.log('🔑 내담자 비밀번호 초기화 시작:', passwordResetClient.id);
            
            const endpoint = `/api/v1/admin/user-management/${passwordResetClient.id}/reset-password`;
            const response = await StandardizedApi.put(endpoint, { newPassword });
            
            console.log('✅ 비밀번호 초기화 응답:', response);
            
            if (response && (response.success !== false)) {
                showSuccess('비밀번호가 성공적으로 초기화되었습니다.');
                setShowPasswordResetModal(false);
                setPasswordResetClient(null);
            } else {
                throw new Error(response?.message || '비밀번호 초기화에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 비밀번호 초기화 실패:', error);
            showError('비밀번호 초기화 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
            throw error;
        }
    }, [passwordResetClient]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setModalType('');
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            status: 'ACTIVE',
            grade: 'BRONZE',
            notes: '',
            profileImageUrl: '',
            rrnFirst6: '',
            rrnLast1: '',
            gender: '',
            birthDate: null,
            age: null,
            address: '',
            addressDetail: '',
            postalCode: '',
            vehiclePlate: '',
            consultationPurpose: '',
            consultationHistory: '',
            emergencyContact: '',
            emergencyPhone: ''
        });
    }, []);

    // 필터링된 내담자 목록
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesSearch = !searchTerm || 
                client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone?.includes(searchTerm) ||
                (searchTerm.startsWith('#') && client.status === searchTerm.substring(1).toUpperCase());
            
            const matchesStatus = !activeFilters.status || activeFilters.status === 'all' || client.status === activeFilters.status;
            
            return matchesSearch && matchesStatus;
        });
    }, [clients, searchTerm, activeFilters]);
    
    // UnifiedFilterSearch 핸들러
    const handleSearch = useCallback((term) => {
        setSearchTerm(term);
    }, []);
    
    const handleFilterChange = useCallback((filters) => {
        setActiveFilters(filters);
    }, []);
    
    if (loading) {
        if (embedded) {
            return <UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse" />;
        }
        return (
            <AdminCommonLayout title="내담자 종합관리">
                <ContentArea>
                    <UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse" />
                </ContentArea>
            </AdminCommonLayout>
        );
    }

    const contentBlock = (
        <>
            {!embedded && (
                <ContentHeader
                    title="내담자 관리"
                    subtitle="내담자 정보·상담 이력·매칭·통계를 종합 관리합니다"
                    actions={
                        <button
                            type="button"
                            className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
                            onClick={handleCreateClient}
                        >
                            <Plus size={20} />
                            새 내담자 등록
                        </button>
                    }
                />
            )}

            <ContentSection noCard>
                <div className="mg-v2-ad-b0kla__pill-toggle">
                            <button
                                type="button"
                                className={`mg-v2-ad-b0kla__pill ${mainTab === 'overview' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => handleMainTabChange('overview')}
                            >
                                개요
                            </button>
                            <button
                                type="button"
                                className={`mg-v2-ad-b0kla__pill ${mainTab === 'consultation' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => handleMainTabChange('consultation')}
                            >
                                상담이력
                            </button>
                            <button
                                type="button"
                                className={`mg-v2-ad-b0kla__pill ${mainTab === 'mapping' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => handleMainTabChange('mapping')}
                            >
                                매칭
                            </button>
                            <button
                                type="button"
                                className={`mg-v2-ad-b0kla__pill ${mainTab === 'statistics' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => handleMainTabChange('statistics')}
                            >
                                통계
                            </button>
                        </div>
            </ContentSection>

                        <ContentSection noCard className="mg-v2-mapping-kpi-section">
                            <div className="mg-v2-mapping-kpi-section__grid">
                                <div className="mg-v2-mapping-kpi-section__card">
                                    <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--blue">
                                        <Users size={24} />
                                    </div>
                                    <div className="mg-v2-mapping-kpi-section__info">
                                        <span className="mg-v2-mapping-kpi-section__label">총 내담자</span>
                                        <span className="mg-v2-mapping-kpi-section__value">{clientKpiStats.total}명</span>
                                    </div>
                                </div>
                                <div className="mg-v2-mapping-kpi-section__card">
                                    <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--green">
                                        <UserCheck size={24} />
                                    </div>
                                    <div className="mg-v2-mapping-kpi-section__info">
                                        <span className="mg-v2-mapping-kpi-section__label">활성</span>
                                        <span className="mg-v2-mapping-kpi-section__value">{clientKpiStats.active}명</span>
                                    </div>
                                </div>
                                <div className="mg-v2-mapping-kpi-section__card">
                                    <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--orange">
                                        <Clock size={24} />
                                    </div>
                                    <div className="mg-v2-mapping-kpi-section__info">
                                        <span className="mg-v2-mapping-kpi-section__label">대기</span>
                                        <span className="mg-v2-mapping-kpi-section__value">{clientKpiStats.pending}명</span>
                                    </div>
                                </div>
                                <div className="mg-v2-mapping-kpi-section__card">
                                    <div className="mg-v2-mapping-kpi-section__icon mg-v2-mapping-kpi-section__icon--gray">
                                        <Link2 size={24} />
                                    </div>
                                    <div className="mg-v2-mapping-kpi-section__info">
                                        <span className="mg-v2-mapping-kpi-section__label">총 매칭</span>
                                        <span className="mg-v2-mapping-kpi-section__value">{clientKpiStats.totalMappings}건</span>
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
                                            onClick={handleCreateClient}
                                            style={{ marginRight: '8px', height: '32px', fontSize: '13px' }}
                                        >
                                            <Plus size={16} style={{ marginRight: '4px' }} />
                                            새 내담자 등록
                                        </button>
                                    )}
                                    {clientFilterOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`mg-v2-mapping-search-section__chip ${chipFilterStatus === opt.value ? 'mg-v2-mapping-search-section__chip--active' : ''}`}
                                            onClick={() => handleFilterChange({ ...activeFilters, status: opt.value })}
                                        >
                                            <SafeText>{opt.label}</SafeText>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </ContentSection>

                        <div className="mg-v2-tab-content">
                            {mainTab === 'overview' && (
                                <ContentSection noCard className="mg-v2-mapping-list-block">
                                    <ContentCard className="mg-v2-mapping-list-block__card">
                                        <div className="mg-v2-mapping-list-block__header">
                                            <div className="mg-v2-mapping-list-block__title">내담자 목록</div>
                                            <ViewModeToggle
                                                viewMode={viewMode}
                                                onViewModeChange={setViewMode}
                                                className="mg-v2-mapping-list-block__toggle"
                                                ariaLabel="목록 보기 전환"
                                            />
                                        </div>
                                        <ClientOverviewTab
                                            clients={filteredClients}
                                            onClientSelect={handleClientSelect}
                                            onEditClient={handleEditClient}
                                            onDeleteClient={handleDeleteClient}
                                            onResetPassword={handleResetPassword}
                                            consultants={consultants}
                                            mappings={mappings}
                                            consultations={consultations}
                                            viewMode={viewMode}
                                        />
                                    </ContentCard>
                                </ContentSection>
                            )}

                            {mainTab === 'consultation' && (
                                <ClientConsultationTab
                                    clients={filteredClients}
                                    consultations={consultations}
                                    onClientSelect={handleClientSelect}
                                />
                            )}

                            {mainTab === 'mapping' && (
                                <ClientMappingTab
                                    clients={filteredClients}
                                    consultants={consultants}
                                    mappings={mappings}
                                    onClientSelect={handleClientSelect}
                                />
                            )}

                            {mainTab === 'statistics' && (
                                <ClientStatisticsTab
                                    clients={filteredClients}
                                    consultations={consultations}
                                    mappings={mappings}
                                />
                            )}
                        </div>
        </>
    );

    const modalsBlock = (
        <>
            {/* 모달 */}
                {showModal && (
                    <ClientModal
                        type={modalType}
                        client={editingClient}
                        formData={formData}
                        setFormData={setFormData}
                        onClose={handleCloseModal}
                        onSave={(data) => {
                            console.log('🔘 내담자 저장 클릭 (onSave 호출)', { modalType, editingClientId: editingClient?.id, hasData: !!data });
                            const handleSave = async () => {
                                if (modalType === 'view') return;
                                // 모달 제출 시점의 최신 폼 데이터(data) 우선 사용. (상담사는 formData 직접 전달과 동일)
                                const dataToUse = data ?? formDataRef.current ?? formData;
                                try {
                                    if (dataToUse.rrnFirst6?.trim() || dataToUse.rrnLast1?.trim()) {
                                        const f = (dataToUse.rrnFirst6 || '').trim();
                                        const l = (dataToUse.rrnLast1 || '').trim();
                                        if (f.length !== 6 || !/^[0-9]{6}$/.test(f) || l.length !== 1 || !/^[1-4]$/.test(l)) {
                                            const rrnMsg = '주민번호 앞 6자리는 6자리 숫자, 뒤 1자리는 1자리 숫자(1~4)로 입력해 주세요.';
                                            showError(rrnMsg);
                                            return;
                                        }
                                    }
                                    const emailTrim = dataToUse.email != null ? String(dataToUse.email).trim() : '';
                                    const phoneTrim = dataToUse.phone != null ? String(dataToUse.phone).trim() : '';
                                    if (modalType === 'create' || modalType === 'edit') {
                                        if (!emailTrim && !phoneTrim) {
                                            showError(VALIDATION_MESSAGES.EMAIL_OR_PHONE_ONE_REQUIRED);
                                            return;
                                        }
                                        if (emailTrim && !validateEmail(emailTrim)) {
                                            showError(VALIDATION_MESSAGES.INVALID_EMAIL_FORMAT);
                                            return;
                                        }
                                        if (phoneTrim && !validatePhone(phoneTrim)) {
                                            showError(VALIDATION_MESSAGES.INVALID_PHONE);
                                            return;
                                        }
                                    }
                                    const payload = {
                                        name: dataToUse.name,
                                        email: dataToUse.email,
                                        phone: dataToUse.phone ?? '',
                                        status: dataToUse.status,
                                        grade: dataToUse.grade,
                                        notes: dataToUse.notes ?? '',
                                        vehiclePlate: normalizeVehiclePlateInput(dataToUse.vehiclePlate || ''),
                                        consultationPurpose: (dataToUse.consultationPurpose ?? '').trim(),
                                        consultationHistory: (dataToUse.consultationHistory ?? '').trim(),
                                        emergencyContact: (dataToUse.emergencyContact ?? '').trim(),
                                        emergencyPhone: (dataToUse.emergencyPhone ?? '').trim()
                                    };
                                    if (modalType === 'create') {
                                        payload.password = dataToUse.password ?? '';
                                    }
                                    if (dataToUse.profileImageUrl && dataToUse.profileImageUrl.trim() !== '') {
                                        payload.profileImageUrl = dataToUse.profileImageUrl;
                                    }
                                    if (dataToUse.address != null) payload.address = dataToUse.address.trim();
                                    if (dataToUse.addressDetail != null) payload.addressDetail = dataToUse.addressDetail.trim();
                                    if (dataToUse.postalCode != null) payload.postalCode = dataToUse.postalCode.trim();
                                    if (dataToUse.rrnFirst6?.trim()) payload.rrnFirst6 = dataToUse.rrnFirst6.trim();
                                    if (dataToUse.rrnLast1?.trim()) payload.rrnLast1 = dataToUse.rrnLast1.trim();
                                    let response;
                                    if (modalType === 'create') {
                                        console.log('🔧 내담자 등록 시작:', { ...payload, profileImageUrl: payload.profileImageUrl ? '(base64)' : undefined });
                                        response = await StandardizedApi.post('/api/v1/admin/clients', payload);
                                        console.log('✅ 내담자 등록 응답:', response);
                                        if (!response) {
                                            throw new Error('등록 응답이 없습니다.');
                                        }
                                        const msg = '내담자가 성공적으로 등록되었습니다.';
                                        showSuccess(msg);
                                        await loadClients();
                                        globalThis.window.dispatchEvent(new CustomEvent('admin-dashboard-refresh-stats'));
                                        handleCloseModal();
                                    } else if (modalType === 'edit') {
                                        if (editingClient?.id == null || editingClient?.id === '') {
                                            const idErr = '내담자 ID가 없어 수정할 수 없습니다. 목록에서 다시 선택해 주세요.';
                                            showError(idErr);
                                            return;
                                        }
                                        console.log('🔧 내담자 수정 요청:', { id: editingClient.id, payload });
                                        response = await StandardizedApi.put(`/api/v1/admin/clients/${editingClient.id}`, payload);
                                        console.log('✅ 내담자 수정 응답:', response);
                                        const success = response != null && (response.success === true || response.id != null);
                                        if (!success) {
                                            throw new Error(response?.message || '수정에 실패했습니다.');
                                        }
                                        const msg = '내담자 정보가 성공적으로 수정되었습니다.';
                                        showSuccess(msg);
                                        await loadClients();
                                        handleCloseModal();
                                    } else if (modalType === 'delete') {
                                        await apiDelete(`/api/v1/admin/clients/${editingClient.id}`);
                                        const msg = '내담자가 성공적으로 삭제되었습니다.';
                                        showSuccess(msg);
                                        await loadClients();
                                        handleCloseModal();
                                    }
                                } catch (error) {
                                    console.error('❌ 내담자 처리 실패:', error);
                                    const errMsg = '내담자 처리 중 오류가 발생했습니다: ' + (error?.message || '알 수 없는 오류');
                                    showError(errMsg);
                                }
                            };
                            return handleSave();
                        }}
                        userStatusOptions={userStatusOptions}
                    />
            )}

            {/* 비밀번호 초기화 모달 */}
            {showPasswordResetModal && passwordResetClient && (
                <PasswordResetModal
                    user={passwordResetClient}
                    userType="client"
                    onClose={() => {
                        setShowPasswordResetModal(false);
                        setPasswordResetClient(null);
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
        <AdminCommonLayout title="내담자 종합관리">
            <ContentArea>
                {contentBlock}
            </ContentArea>
            {modalsBlock}
        </AdminCommonLayout>
    );
};

ClientComprehensiveManagement.propTypes = {
  embedded: PropTypes.bool
};

export default ClientComprehensiveManagement;