import React, { useState, useEffect, useCallback } from 'react';
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
// import { withFormSubmit } from '../../utils/formSubmitWrapper';
import { Button } from '../ui/Button/Button';
import SimpleLayout from '../layout/SimpleLayout';

// 하위 컴포넌트들 import
import ClientOverviewTab from './ClientComprehensiveManagement/ClientOverviewTab';
import ClientConsultationTab from './ClientComprehensiveManagement/ClientConsultationTab';
import ClientMappingTab from './ClientComprehensiveManagement/ClientMappingTab';
import ClientStatisticsTab from './ClientComprehensiveManagement/ClientStatisticsTab';
import ClientModal from './ClientComprehensiveManagement/ClientModal';
import ClientFilters from './ClientComprehensiveManagement/ClientFilters';

/**
 * 내담자 종합관리 메인 컴포넌트
 * - 내담자 정보 종합 조회
 * - 상담 이력 관리
 * - 회기 현황 관리
 * - 상담사 매칭 관리
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
    const [userStatusOptions, setUserStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    // 모달 상태
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        status: 'ACTIVE',
        grade: 'BRONZE',
        notes: ''
    });

    // 공통 코드 로드
    const loadCommonCodes = useCallback(async () => {
        if (loadingCodes) return;
        
        setLoadingCodes(true);
        try {
            // 표준 API 사용: /api/v1/common-codes?codeGroup=USER_STATUS
            const [userStatusCodes, userGradeCodes] = await Promise.all([
                getCommonCodes('USER_STATUS'),
                getCommonCodes('USER_GRADE')
            ]);
            
            // API 응답이 배열 형태
            setUserStatusOptions(userStatusCodes || []);
            
            // USER_GRADE는 필요시 별도 상태로 관리할 수 있음
            console.log('공통 코드 로드 완료:', {
                status: userStatusCodes?.length || 0,
                grade: userGradeCodes?.length || 0
            });
        } catch (error) {
            console.error('공통 코드 로드 실패:', error);
            // 오류 시 기본값 사용
            setUserStatusOptions([
                { codeValue: 'ACTIVE', codeLabel: '활성' },
                { codeValue: 'INACTIVE', codeLabel: '비활성' },
                { codeValue: 'PENDING', codeLabel: '대기' }
            ]);
            showError('공통 코드를 불러오는데 실패했습니다. 기본값을 사용합니다.');
        } finally {
            setLoadingCodes(false);
        }
    }, [loadingCodes]);

    // 내담자 목록 로드 (통합 API 사용)
    const loadClients = useCallback(async () => {
        setLoading(true);
        try {
            console.log('🔄 내담자 목록 로딩 시작 (통합 API)...');
            
            // 통합 API 사용 (통계 포함)
            const clientsList = await getAllClientsWithStats();
            console.log('📊 통합 API 응답:', clientsList);
            
            if (clientsList && clientsList.length > 0) {
                // 응답 데이터 변환
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
                        // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
                        branchCode: clientEntity.branchCode,
                        createdAt: clientEntity.createdAt,
                        updatedAt: clientEntity.updatedAt,
                        // 통계 정보 추가
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

    // 상담사 목록 로드
    const loadConsultants = useCallback(async () => {
        try {
            const response = await apiGet('/api/admin/consultants');
            console.log('📊 상담사 목록 응답:', response);
            
            if (response && response.success) {
                // 응답 구조: { success: true, data: { consultants: [...], count: N } }
                const consultantsList = response.data?.consultants || response.data || [];
                setConsultants(Array.isArray(consultantsList) ? consultantsList : []);
            } else {
                console.warn('상담사 목록 응답 실패:', response);
                setConsultants([]);
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
            setConsultants([]);
            // 에러가 발생해도 계속 진행 (선택적 데이터)
        }
    }, []);

    // 매칭 정보 로드
    const loadMappings = useCallback(async () => {
        try {
            const response = await apiGet('/api/admin/mappings');
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

    // 상담 이력 로드
    const loadConsultations = useCallback(async () => {
        try {
            console.log('🔄 상담 이력 로드 시작...');
            const response = await apiGet('/api/admin/consultations');
            console.log('📊 상담 이력 응답:', response);
            
            // /api/admin/consultations는 현재 빈 배열을 직접 반환하므로 배열인지 확인
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
            // 403 오류는 권한 문제이므로 조용히 처리
            console.error('❌ 상담 이력 로드 실패:', error);
            if (error.message && error.message.includes('권한')) {
                console.log('⚠️ 상담 이력 조회 권한이 없습니다. 빈 배열로 처리합니다.');
            }
            setConsultations([]);
        }
    }, []);

    // 초기 데이터 로드
    useEffect(() => {
        loadCommonCodes();
        loadClients();
        loadConsultants();
        loadMappings();
        loadConsultations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 내담자 선택 핸들러
    const handleClientSelect = useCallback((client) => {
        setModalType('view');
        setEditingClient(client);
        setFormData({
            username: client.username || '',
            password: '',
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            status: client.status || 'ACTIVE',
            grade: client.grade || 'BRONZE',
            notes: client.notes || ''
        });
        setShowModal(true);
    }, []);

    // 탭 변경 핸들러
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    // 메인 탭 변경 핸들러
    const handleMainTabChange = useCallback((tab) => {
        setMainTab(tab);
    }, []);

    // 모달 핸들러들
    const handleCreateClient = useCallback(() => {
        setModalType('create');
        setEditingClient(null);
        setFormData({
            username: '',
            password: '',
            name: '',
            email: '',
            phone: '',
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
            username: client.username || '',
            password: '',
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
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

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setModalType('');
        setEditingClient(null);
    }, []);

    // 필터링된 내담자 목록
    const filteredClients = clients.filter(client => {
        const matchesSearch = !searchTerm || 
            client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone?.includes(searchTerm);
        
        const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

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
                    <ClientFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        userStatusOptions={userStatusOptions}
                        onCreateClient={handleCreateClient}
                    />
                </div>

                {/* 메인 콘텐츠 */}
                <div className="mg-v2-section">
                    {mainTab === 'comprehensive' && (
                        <ClientOverviewTab
                            clients={filteredClients}
                            onClientSelect={handleClientSelect}
                            onEditClient={handleEditClient}
                            onDeleteClient={handleDeleteClient}
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
                                    if (modalType === 'create') {
                                        await apiPost('/api/admin/clients', data);
                                        showSuccess('내담자가 성공적으로 등록되었습니다.');
                                    } else if (modalType === 'edit') {
                                        await apiPut(`/api/admin/clients/${editingClient.id}`, data);
                                        showSuccess('내담자 정보가 성공적으로 수정되었습니다.');
                                    } else if (modalType === 'delete') {
                                        await apiDelete(`/api/admin/clients/${editingClient.id}`);
                                        showSuccess('내담자가 성공적으로 삭제되었습니다.');
                                    }
                                    
                                    handleCloseModal();
                                    loadClients();
                                } catch (error) {
                                    console.error('내담자 처리 실패:', error);
                                    showError('내담자 처리 중 오류가 발생했습니다.');
                                }
                            };
                            handleSave();
                        }}
                        userStatusOptions={userStatusOptions}
                    />
            )}
            </div>
        </SimpleLayout>
    );
};

export default ClientComprehensiveManagement;