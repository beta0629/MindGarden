import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Link2, Plus, Users, CheckCircle, TrendingUp, Clock, Zap } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import StatCard from '../ui/Card/StatCard';
import DashboardSection from '../layout/DashboardSection';
import StatisticsDashboard from './StatisticsDashboard';
import SearchFilterSection from './SearchFilterSection';
import SectionHeader from './SectionHeader';
import ClientCard from '../ui/Card/ClientCard';
import MappingCard from './MappingCard';
import SessionExtensionModal from './mapping/SessionExtensionModal';
import { getFormattedContact, getFormattedConsultationCount, getFormattedRegistrationDate, getMappingStatusKoreanNameSync } from '../../utils/codeHelper';
import '../../styles/unified-design-tokens.css';

/**
 * 회기 관리 컴포넌트 - 완전 재설계
 * - 단일 페이지 레이아웃
 * - 원클릭 회기 추가
 * - 빠른 접근성과 직관적 UI
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 */
const SessionManagement = () => {
    // 데이터 상태
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [mappings, setMappings] = useState([]);
    
    // 검색/필터 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    
    // 코드 옵션 상태
    const [mappingStatusOptions, setMappingStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    // 모달 상태
    const [showSessionExtensionModal, setShowSessionExtensionModal] = useState(false);
    const [selectedMapping, setSelectedMapping] = useState(null);
    
    // 추가 회기 추가 방법들
    const [activeTab, setActiveTab] = useState('quick'); // 'quick', 'search', 'mapping'
    
    // 회기 추가 요청 상태
    const [sessionExtensionRequests, setSessionExtensionRequests] = useState([]);
    
    // 결제 확인 모달 상태
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentReference, setPaymentReference] = useState('');
    
    // 버튼 로딩 상태
    const [confirmingPayment, setConfirmingPayment] = useState(false);
    const [rejectingRequest, setRejectingRequest] = useState(false);

    // 데이터 로드
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            
            // API 응답 구조에 맞게 수정
            const [clientsRes, consultantsRes, mappingsRes, requestsRes] = await Promise.all([
                apiGet('/api/admin/clients/with-mapping-info'),
                apiGet('/api/admin/consultants'),
                apiGet('/api/admin/mappings'),
                apiGet('/api/admin/session-extensions/requests')
            ]);
            
            // 응답 데이터 추출
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
            
            // 회기 추가 요청 데이터 상세 로그
            if (requestsData.length > 0) {
                console.log('🔍 회기 추가 요청 데이터 상세:', requestsData[0]);
                console.log('🔍 매핑 정보:', requestsData[0].mapping);
                console.log('🔍 클라이언트 정보:', requestsData[0].mapping?.client);
                console.log('🔍 상담사 정보:', requestsData[0].mapping?.consultant);
            }
            
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
            notificationManager.error('데이터를 불러오는데 실패했습니다.');
            
            // 빈 배열로 초기화
            setClients([]);
            setConsultants([]);
            setMappings([]);
            setSessionExtensionRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 매핑 상태 코드 로드
    const loadMappingStatusCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/common-codes/MAPPING_STATUS');
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
                { value: 'ACTIVE', label: '활성', icon: '✅', color: 'var(--success-600)' },
                { value: 'INACTIVE', label: '비활성', icon: '❌', color: 'var(--danger-600)' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    // 필터링된 매핑 목록
    const getFilteredMappings = useCallback(() => {
        let filtered = mappings;
        
        // 검색어 필터링
        if (searchTerm) {
            filtered = filtered.filter(mapping => 
                (mapping.clientName && mapping.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (mapping.consultantName && mapping.consultantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (mapping.packageName && mapping.packageName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // 상태별 필터링
        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(mapping => mapping.status === filterStatus);
        }

        return filtered;
    }, [mappings, searchTerm, filterStatus]);

    // 최근 활성 매핑 (빠른 회기 추가용)
    const getRecentActiveMappings = useCallback(() => {
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

    // 빠른 회기 추가
    const handleQuickAdd = (mapping) => {
        console.log('🚀 빠른 회기 추가 클릭:', mapping);
        setSelectedMapping(mapping);
        setShowSessionExtensionModal(true);
    };

    // 최근 회기 추가 요청 목록 (최대 10개)
    const getRecentSessionExtensionRequests = useCallback(() => {
        return sessionExtensionRequests
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
    }, [sessionExtensionRequests]);

    // 상태 표시 함수
    const getStatusDisplay = (status) => {
        const statusMap = {
            'PENDING': { color: 'var(--warning-600)' },
            'PAYMENT_CONFIRMED': { color: 'var(--info-600)' },
            'ADMIN_APPROVED': { color: 'var(--success-600)' },
            'COMPLETED': { color: 'var(--success-600)' },
            'REJECTED': { color: 'var(--danger-600)' }
        };
        const config = statusMap[status] || { color: 'var(--gray-600)' };
        const text = getMappingStatusKoreanNameSync(status);
        return { text, ...config };
    };

    // 입금 확인 처리
    const handlePaymentConfirm = async (requestId) => {
        try {
            setConfirmingPayment(true);
            await apiPost(`/api/admin/session-extensions/requests/${requestId}/confirm-payment`, {
                paymentMethod: 'CASH',
                paymentReference: null
            });
            notificationManager.success('입금이 확인되었습니다. 회기수가 업데이트되었습니다.');
            
            // 즉시 데이터 새로고침 (회기수 업데이트 확인)
            setTimeout(async () => {
                console.log('🔄 입금 확인 후 데이터 새로고침 시작...');
                await loadData();
                console.log('✅ 입금 확인 후 데이터 새로고침 완료 - 회기수 업데이트됨');
            }, 1500); // 1.5초 후 새로고침 (PL/SQL 처리 시간 고려)
            
        } catch (error) {
            console.error('입금 확인 실패:', error);
            notificationManager.error('입금 확인에 실패했습니다.');
        } finally {
            setConfirmingPayment(false);
        }
    };

    // 관리자 승인 처리
    const handleAdminApprove = async (requestId) => {
        try {
            setConfirmingPayment(true); // 재사용
            await apiPost(`/api/admin/session-extensions/requests/${requestId}/approve`, {
                adminId: 1, // TODO: 실제 관리자 ID
                comment: '관리자 승인'
            });
            notificationManager.success('관리자 승인이 완료되었습니다.');
            loadData();
        } catch (error) {
            console.error('관리자 승인 실패:', error);
            notificationManager.error('관리자 승인에 실패했습니다.');
        } finally {
            setConfirmingPayment(false);
        }
    };

    // 요청 거부 처리
    const handleRejectRequest = async (requestId) => {
        try {
            setRejectingRequest(true);
            await apiPost(`/api/admin/session-extensions/requests/${requestId}/reject`, {
                adminId: 1, // TODO: 실제 관리자 ID
                reason: '요청 거부'
            });
            notificationManager.success('요청이 거부되었습니다.');
            loadData();
        } catch (error) {
            console.error('요청 거부 실패:', error);
            notificationManager.error('요청 거부에 실패했습니다.');
        } finally {
            setRejectingRequest(false);
        }
    };

    // 회기 추가 요청 완료 처리
    const handleSessionExtensionRequested = async (mappingId) => {
        console.log('✅ 회기 추가 요청 완료:', mappingId);
        setShowSessionExtensionModal(false);
        setSelectedMapping(null);
        
        // 즉시 데이터 새로고침 (약간의 지연 후)
        setTimeout(async () => {
            console.log('🔄 회기 추가 후 데이터 새로고침 시작...');
            await loadData();
            console.log('✅ 회기 추가 후 데이터 새로고침 완료');
        }, 1000); // 1초 후 새로고침
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadData();
        loadMappingStatusCodes();
    }, [loadData, loadMappingStatusCodes]);

    if (loading && mappings.length === 0) {
        return (
            <SimpleLayout title="회기 관리" loading={true} loadingText="데이터를 불러오는 중...">
                <UnifiedLoading type="page" text="데이터를 불러오는 중..." />
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="회기 관리" loading={loading && clients.length === 0} loadingText="데이터를 불러오는 중...">
            <div className="mg-dashboard-layout">
                {/* Dashboard Header */}
                <div className="mg-dashboard-header">
                    <div className="mg-dashboard-header-content">
                        <div className="mg-dashboard-header-left">
                            <Calendar size={32} />
                            <div>
                                <h1 className="mg-dashboard-title">회기 관리</h1>
                                <p className="mg-dashboard-subtitle">상담 회기 추가 및 관리</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 통계 카드 그리드 */}
                <div className="mg-dashboard-stats">
                    <StatCard
                        icon={<Users />}
                        value={clients.length}
                        label="총 내담자"
                    />
                    <StatCard
                        icon={<CheckCircle />}
                        value={mappings.filter(m => m.status === 'ACTIVE').length}
                        label="활성 매핑"
                    />
                    <StatCard
                        icon={<Calendar />}
                        value={mappings.reduce((sum, m) => sum + (m.usedSessions || 0), 0)}
                        label="사용된 회기"
                    />
                    <StatCard
                        icon={<TrendingUp />}
                        value={`${mappings.length > 0 ? Math.round((mappings.filter(m => m.status === 'SESSIONS_EXHAUSTED' || m.status === 'TERMINATED').length / mappings.length) * 100) : 0}%`}
                        label="완료율"
                    />
                </div>

                {/* 메인 콘텐츠 */}
                <div className="mg-dashboard-content">
                    {/* 회기 추가 방법 선택 탭 */}
                    <div className="mg-v2-card">
                        <div className="mg-tabs">
                            <button 
                                className={`mg-tab ${activeTab === 'quick' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('quick')}
                            >
                                <Zap size={18} />
                                빠른 추가
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'search' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('search')}
                            >
                                <Users size={18} />
                                내담자 검색
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'mapping' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('mapping')}
                            >
                                <Calendar size={18} />
                                전체 매핑
                            </button>
                        </div>

                        {/* 회기 추가 섹션 */}
                        <div className="mg-v2-session-section">
                            {activeTab === 'quick' && (
                                <DashboardSection
                                    title="빠른 회기 추가"
                                    icon={<Zap size={24} />}
                                >
                                    <div className="mg-v2-quick-mappings-grid">
                                {getRecentActiveMappings().map(mapping => {
                                    const clientName = mapping.client?.name || mapping.clientName || '알 수 없음';
                                    const consultantName = mapping.consultant?.name || mapping.consultantName || '알 수 없음';
                                    const totalSessions = mapping.totalSessions || mapping.package?.sessions || 0;
                                    const usedSessions = mapping.usedSessions || 0;
                                    
                                    return (
                                        <div 
                                            key={mapping.id} 
                                            className="mg-v2-quick-mapping-card"
                                            onClick={() => handleQuickAdd(mapping)}
                                        >
                                            <div className="mg-v2-quick-mapping-info">
                                                <div className="mg-v2-quick-mapping-avatar">
                                                    {clientName.charAt(0)}
                                                </div>
                                                <div className="mg-v2-quick-mapping-details">
                                                    <div className="mg-v2-quick-mapping-client">{clientName}</div>
                                                    <div className="mg-v2-quick-mapping-consultant">{consultantName}</div>
                                                    <div className="mg-v2-quick-mapping-sessions">
                                                        <span className="mg-v2-sessions-current mg-v2-sessions-current-danger">{usedSessions}</span>
                                                        <span className="mg-v2-sessions-separator">/</span>
                                                        <span className="mg-v2-sessions-total mg-v2-sessions-total-primary">{totalSessions}</span>
                                                        <span className="mg-v2-sessions-unit">회기</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="mg-button" 
                                                variant="primary"
                                                size="small"
                                                className="mg-v2-quick-add-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickAdd(mapping);
                                                }}
                                            >
                                                <Plus size={16} />
                                                회기 추가
                                            </button>
                                        </div>
                                    );
                                })}
                                
                                {getRecentActiveMappings().length === 0 && (
                                    <div className="mg-empty-state">
                                        <div className="mg-empty-state__text">활성 매핑이 없습니다.</div>
                                    </div>
                                )}
                                    </div>
                                </DashboardSection>
                            )}
                        
                        {activeTab === 'search' && (
                            <DashboardSection
                                title="내담자 검색 후 회기 추가"
                                icon={<Users size={24} />}
                            >
                            <div className="mg-v2-search-section">
                                <div className="mg-v2-search-form">
                                    <input
                                        type="text"
                                        placeholder="내담자 이름으로 검색..."
                                        className="mg-v2-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <button className="mg-button" 
                                        variant="primary" 
                                        size="medium"
                                        onClick={() => {
                                            // 검색 로직
                                            console.log('검색 실행');
                                        }}
                                        preventDoubleClick={true}
                                        clickDelay={500}
                                    >
                                        <Users size={16} />
                                        검색
                                    </button>
                                </div>
                                
                                <div className="mg-v2-search-results">
                                    {clients.filter(client => 
                                        client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).slice(0, 10).map(client => {
                                        const clientMappings = mappings.filter(m => 
                                            m.clientId === client.id && m.status === 'ACTIVE'
                                        );
                                        
                                        return (
                                            <div key={client.id} className="mg-v2-client-mapping-card">
                                                <div className="mg-v2-client-info">
                                                    <div className="mg-v2-client-avatar">
                                                        {client.name.charAt(0)}
                                                    </div>
                                                    <div className="mg-v2-client-details">
                                                        <div className="mg-v2-client-name">{client.name}</div>
                                                        <div className="mg-v2-client-mappings">
                                                            {clientMappings.length}개 활성 매핑
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="mg-button" 
                                                    variant="success"
                                                    size="small"
                                                    disabled={clientMappings.length === 0}
                                                    title={clientMappings.length === 0 ? '활성 매핑이 없습니다' : ''}
                                                    onClick={() => {
                                                        if (clientMappings.length > 0) {
                                                            handleQuickAdd(clientMappings[0]);
                                                        }
                                                    }}
                                                >
                                                    <Plus size={14} />
                                                    회기 추가
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {searchTerm && clients.filter(client => 
                                    client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && (
                                    <div className="mg-empty-state">
                                        <div className="mg-empty-state__text">검색 결과가 없습니다.</div>
                                    </div>
                                )}
                            </div>
                            </DashboardSection>
                        )}
                        
                        {activeTab === 'mapping' && (
                            <DashboardSection
                                title="전체 매핑에서 회기 추가"
                                icon={<Calendar size={24} />}
                            >
                                <div className="mg-v2-mapping-section">
                                    <div className="mg-v2-mapping-filters">
                                        <select 
                                            className="mg-v2-input"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="ALL">모든 상태</option>
                                            <option value="ACTIVE">활성</option>
                                            <option value="PAYMENT_CONFIRMED">결제확인</option>
                                            <option value="COMPLETED">완료</option>
                                        </select>
                                    </div>
                                    
                                    <div className="mg-v2-mapping-grid">
                                        {getFilteredMappings().slice(0, 20).map(mapping => (
                                            <div key={mapping.id} className="mg-v2-mapping-card">
                                                <div className="mg-v2-mapping-info">
                                                    <div className="mg-v2-mapping-client">
                                                        👤 {mapping.clientName}
                                                    </div>
                                                    <div className="mg-v2-mapping-consultant">
                                                        🤝 {mapping.consultantName}
                                                    </div>
                                                    <div className="mg-v2-mapping-sessions">
                                                        📊 {mapping.usedSessions}/{mapping.totalSessions}회기
                                                    </div>
                                                    <div className={`mg-mapping-status mg-status-${mapping.status.toLowerCase()}`}>
                                                        {getMappingStatusKoreanNameSync(mapping.status)}
                                                    </div>
                                                </div>
                                                <div className="mg-v2-mapping-card-actions">
                                                    <button className="mg-button"
                                                        variant="primary"
                                                        size="small"
                                                        onClick={() => handleQuickAdd(mapping)}
                                                        disabled={mapping.status !== 'ACTIVE'}
                                                        title={mapping.status !== 'ACTIVE' ? '활성 상태가 아닙니다' : ''}
                                                    >
                                                        <Plus size={14} />
                                                        회기 추가
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {getFilteredMappings().length === 0 && (
                                        <div className="mg-empty-state">
                                            <div className="mg-empty-state__text">매핑이 없습니다.</div>
                                        </div>
                                    )}
                                </div>
                            </DashboardSection>
                        )}
                    </div>
                    </div>

                    {/* 최근 회기 추가 요청 섹션 */}
                    <DashboardSection
                        title="최근 회기 추가 요청"
                        icon={<Calendar size={24} />}
                    >
                        
                        <div className="mg-v2-recent-requests">
                            {getRecentSessionExtensionRequests().map(request => (
                                <div key={request.id} className="mg-v2-request-card">
                                    <div className="mg-v2-request-header">
                                        <div className="mg-v2-request-info">
                                            <div className="mg-v2-request-client">
                                                {request.mapping?.client?.name || request.clientName || '알 수 없음'}
                                            </div>
                                            <div className="mg-v2-request-consultant">
                                                {request.mapping?.consultant?.name || request.consultantName || '알 수 없음'}
                                            </div>
                                        </div>
                                        <div className={`mg-request-status mg-request-status--${request.status?.toLowerCase()}`}>
                                            {getStatusDisplay(request.status).text}
                                        </div>
                                    </div>
                                    
                                    <div className="mg-v2-request-details">
                                        <div className="mg-v2-request-sessions">
                                            +{request.additionalSessions}회기 추가
                                        </div>
                                        <div className="mg-v2-request-package">
                                            {request.packageName} • {parseInt(request.packagePrice || 0).toLocaleString()}원
                                        </div>
                                        <div className="mg-v2-request-date">
                                            {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                                        </div>
                                    </div>
                                    
                                    {request.reason && (
                                        <div className="mg-v2-request-reason">
                                            <strong>사유:</strong> {request.reason}
                                        </div>
                                    )}
                                    
                                    {request.status === 'PENDING' && (
                                        <div className="mg-v2-request-actions">
                                            <button className="mg-button" 
                                                variant="success"
                                                size="small"
                                                loading={confirmingPayment}
                                                loadingText="확인 중..."
                                                onClick={() => handlePaymentConfirm(request.id)}
                                                preventDoubleClick={true}
                                                clickDelay={2000}
                                            >
                                                입금 확인
                                            </button>
                                            <button className="mg-button" 
                                                variant="danger"
                                                size="small"
                                                loading={rejectingRequest}
                                                loadingText="거부 중..."
                                                onClick={() => handleRejectRequest(request.id)}
                                                preventDoubleClick={true}
                                                clickDelay={1000}
                                            >
                                                거부
                                            </button>
                                        </div>
                                    )}
                                    
                                    {request.status === 'PAYMENT_CONFIRMED' && (
                                        <div className="mg-v2-request-actions">
                                            <button className="mg-button" 
                                                variant="primary"
                                                size="small"
                                                loading={confirmingPayment}
                                                loadingText="승인 중..."
                                                onClick={() => handleAdminApprove(request.id)}
                                                preventDoubleClick={true}
                                                clickDelay={2000}
                                            >
                                                관리자 승인
                                            </button>
                                            <button className="mg-button" 
                                                variant="danger"
                                                size="small"
                                                loading={rejectingRequest}
                                                loadingText="거부 중..."
                                                onClick={() => handleRejectRequest(request.id)}
                                                preventDoubleClick={true}
                                                clickDelay={1000}
                                            >
                                                거부
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {getRecentSessionExtensionRequests().length === 0 && (
                            <div className="mg-empty-state">
                                <div className="mg-empty-state__text">최근 회기 추가 요청이 없습니다.</div>
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
            </div>
        </SimpleLayout>
    );
};

export default SessionManagement;