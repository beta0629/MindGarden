import React, { useState, useEffect, useCallback, useMemo } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { FaUser } from 'react-icons/fa';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import { getAllClientsWithStats } from '../../utils/consultantHelper';
import { 
    getUserStatusKoreanName,
    getUserGradeKoreanName,
    getUserGradeIcon,
    getStatusColor
} from '../../utils/codeHelper';
import { showError, showSuccess } from '../../utils/notification';
import { getCommonCodes } from '../../utils/commonCodeApi';
import Button from '../ui/Button/Button';
import SimpleLayout from '../layout/SimpleLayout';

import ClientOverviewTab from './ClientComprehensiveManagement/ClientOverviewTab';
import ClientConsultationTab from './ClientComprehensiveManagement/ClientConsultationTab';
import ClientMappingTab from './ClientComprehensiveManagement/ClientMappingTab';
import ClientStatisticsTab from './ClientComprehensiveManagement/ClientStatisticsTab';
import ClientModal from './ClientComprehensiveManagement/ClientModal';
import UnifiedFilterSearch from '../ui/FilterSearch/UnifiedFilterSearch';
import MGButton from '../common/MGButton';
import PasswordResetModal from './PasswordResetModal';
import { Plus } from 'lucide-react';

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
 * @author MindGarden
/**
 * @version 1.0.0
/**
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
    const [userStatusOptions, setUserStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
    const [editingClient, setEditingClient] = useState(null);
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [passwordResetClient, setPasswordResetClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        status: 'ACTIVE',
        grade: 'BRONZE',
        notes: ''
    });

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
                        createdAt: clientEntity.createdAt,
                        updatedAt: clientEntity.updatedAt,
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
            
            if (response && response.success) {
                setMappings(response.data || []);
            } else {
                console.warn('매칭 정보 응답 실패:', response);
                setMappings([]);
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
            notes: client.notes || ''
        });
        setShowModal(true);
    }, []);

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    const handleMainTabChange = useCallback((tab) => {
        setMainTab(tab);
    }, []);

    const handleCreateClient = useCallback(() => {
        setModalType('create');
        setEditingClient(null);
        setFormData({
            name: '', // 이름 입력
            email: '', // 이메일 입력
            password: '', // 비밀번호 입력 (선택사항, 없으면 자동 생성)
            phone: '', // 전화번호 입력 (선택사항)
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            status: 'ACTIVE',
            grade: 'BRONZE',
            notes: ''
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
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            status: client.status || 'ACTIVE',
            grade: client.grade || 'BRONZE',
            notes: client.notes || ''
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
            
            const endpoint = `/api/v1/admin/user-management/${passwordResetClient.id}/reset-password?newPassword=${encodeURIComponent(newPassword)}`;
            const response = await apiPut(endpoint, {});
            
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
        }
    }, [passwordResetClient]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setModalType('');
        setEditingClient(null);
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
        setFilterStatus(filters.status || 'all');
    }, []);
    
    // 빠른 필터 옵션 생성
    const quickFilterOptions = useMemo(() => {
        const options = [
            { value: 'all', label: '전체' }
        ];
        if (userStatusOptions && userStatusOptions.length > 0) {
            options.push(...userStatusOptions.map(opt => ({
                value: opt.codeValue,
                label: opt.codeLabel || opt.codeName
            })));
        }
        return options;
    }, [userStatusOptions]);

    if (loading) {
        return (
            <SimpleLayout title="내담자 종합관리">
                <UnifiedLoading 
                    type="page"
                    text="데이터를 불러오는 중..."
                    variant="pulse"
                />
            </SimpleLayout>
        );
    }

                            return (
        <SimpleLayout>
            <div className="mg-v2-container">
                {/* 헤더 */}
                <div className="mg-v2-section">
                    <h1 className="mg-v2-h1">내담자 종합관리</h1>
                </div>

                {/* 메인 탭 네비게이션 */}
                <div className="mg-v2-section">
                    <div className="mg-v2-tabs">
                        <Button
                            variant={mainTab === 'comprehensive' ? 'primary' : 'outline'}
                            onClick={() => handleMainTabChange('comprehensive')}
                            className="mg-v2-tab"
                            preventDoubleClick={true}
                        >
                            📊 내담자 종합관리
                        </Button>
                        <Button
                            variant={mainTab === 'consultation' ? 'primary' : 'outline'}
                            onClick={() => handleMainTabChange('consultation')}
                            className="mg-v2-tab"
                            preventDoubleClick={true}
                        >
                            💬 상담 이력관리
                        </Button>
                        <Button
                            variant={mainTab === 'mapping' ? 'primary' : 'outline'}
                            onClick={() => handleMainTabChange('mapping')}
                            className="mg-v2-tab"
                            preventDoubleClick={true}
                        >
                            🤝 매칭 관리
                        </Button>
                        <Button
                            variant={mainTab === 'statistics' ? 'primary' : 'outline'}
                            onClick={() => handleMainTabChange('statistics')}
                            className="mg-v2-tab"
                            preventDoubleClick={true}
                        >
                            📈 통계 분석
                        </Button>
                    </div>
                </div>

                {/* 필터 섹션 */}
                <div className="mg-v2-section">
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                        <div style={{ flex: 1 }}>
                            <UnifiedFilterSearch
                                onSearch={handleSearch}
                                onFilterChange={handleFilterChange}
                                searchPlaceholder="이름, 이메일, 전화번호 또는 #태그로 검색..."
                                compact={true}
                                showQuickFilters={true}
                                quickFilterOptions={quickFilterOptions}
                            />
                        </div>
                        <MGButton
                            variant="primary"
                            size="medium"
                            onClick={handleCreateClient}
                            preventDoubleClick={true}
                        >
                            <Plus size={16} />
                            새 내담자 등록
                        </MGButton>
                    </div>
                </div>

                {/* 메인 콘텐츠 */}
                <div className="mg-v2-section">
                    {mainTab === 'comprehensive' && (
                        <ClientOverviewTab
                            clients={filteredClients}
                            onClientSelect={handleClientSelect}
                            onEditClient={handleEditClient}
                            onDeleteClient={handleDeleteClient}
                            onResetPassword={handleResetPassword}
                            consultants={consultants}
                            mappings={mappings}
                            consultations={consultations}
                        />
                    )}
                    
                    {mainTab === 'consultation' && (
                        <ClientConsultationTab
                            clients={filteredClients}
                            consultations={consultations}
                            selectedClient={selectedClient}
                            onClientSelect={handleClientSelect}
                        />
                    )}
                    
                    {mainTab === 'mapping' && (
                        <ClientMappingTab
                            clients={filteredClients}
                            consultants={consultants}
                            mappings={mappings}
                            selectedClient={selectedClient}
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

                {/* 모달 */}
                {showModal && (
                    <ClientModal
                        type={modalType}
                        client={editingClient}
                        formData={formData}
                        setFormData={setFormData}
                        onClose={handleCloseModal}
                        onSave={(data) => {
                            const handleSave = async () => {
                                try {
                                    let response;
                                    if (modalType === 'create') {
                                        console.log('🔧 내담자 등록 시작:', data);
                                        response = await apiPost('/api/v1/admin/clients', data);
                                        console.log('✅ 내담자 등록 응답:', response);
                                        
                                        if (!response) {
                                            throw new Error('등록 응답이 없습니다.');
                                        }
                                        
                                        showSuccess('내담자가 성공적으로 등록되었습니다.');
                                        
                                        // 모달 닫기 전에 목록 새로고침 (DB 커밋 대기)
                                        console.log('🔄 내담자 목록 새로고침 시작 (등록 후)...');
                                        await loadClients();
                                        console.log('✅ 내담자 목록 새로고침 완료');
                                        
                                        // 목록 새로고침 완료 후 모달 닫기
                                        handleCloseModal();
                                    } else if (modalType === 'edit') {
                                        response = await apiPut(`/api/v1/admin/clients/${editingClient.id}`, data);
                                        showSuccess('내담자 정보가 성공적으로 수정되었습니다.');
                                        
                                        // 목록 새로고침
                                        await loadClients();
                                        handleCloseModal();
                                    } else if (modalType === 'delete') {
                                        response = await apiDelete(`/api/v1/admin/clients/${editingClient.id}`);
                                        showSuccess('내담자가 성공적으로 삭제되었습니다.');
                                        
                                        // 목록 새로고침
                                        await loadClients();
                                        handleCloseModal();
                                    }
                                } catch (error) {
                                    console.error('❌ 내담자 처리 실패:', error);
                                    showError('내담자 처리 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
                                }
                            };
                            handleSave();
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
            </div>
        </SimpleLayout>
    );
};

export default ClientComprehensiveManagement;