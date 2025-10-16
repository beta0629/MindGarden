import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Link2, Plus, Users, CheckCircle, TrendingUp, Clock, Zap } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import StatisticsDashboard from './StatisticsDashboard';
import SearchFilterSection from './SearchFilterSection';
import SectionHeader from './SectionHeader';
import ClientCard from './ClientCard';
import MappingCard from './MappingCard';
import LoadingSpinner from '../common/LoadingSpinner';
import SessionExtensionModal from './mapping/SessionExtensionModal';
import { getFormattedContact, getFormattedConsultationCount, getFormattedRegistrationDate } from '../../utils/codeHelper';
import '../../styles/mindgarden-design-system.css';

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
    
    // 회기 추가 요청 상태
    const [sessionExtensionRequests, setSessionExtensionRequests] = useState([]);
    
    // 결제 확인 모달 상태
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentReference, setPaymentReference] = useState('');

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
            const response = await apiGet('/api/common-codes/group/MAPPING_STATUS');
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
            'PENDING': { text: '대기중', color: 'var(--warning-600)' },
            'PAYMENT_CONFIRMED': { text: '입금확인', color: 'var(--info-600)' },
            'ADMIN_APPROVED': { text: '관리자승인', color: 'var(--success-600)' },
            'COMPLETED': { text: '완료', color: 'var(--success-600)' },
            'REJECTED': { text: '거부됨', color: 'var(--danger-600)' }
        };
        return statusMap[status] || { text: status, color: 'var(--gray-600)' };
    };

    // 입금 확인 처리
    const handlePaymentConfirm = async (requestId) => {
        try {
            setLoading(true);
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
            setLoading(false);
        }
    };

    // 관리자 승인 처리
    const handleAdminApprove = async (requestId) => {
        try {
            setLoading(true);
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
            setLoading(false);
        }
    };

    // 요청 거부 처리
    const handleRejectRequest = async (requestId) => {
        try {
            setLoading(true);
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
            setLoading(false);
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
        return <LoadingSpinner />;
    }

    return (
        <SimpleLayout>
            <div className="mg-session-management-redesign">
                
                {/* 헤더 섹션 */}
                <div className="mg-session-header">
                    <div className="mg-session-header-content">
                        <div className="mg-session-header-left">
                            <Calendar className="mg-session-header-icon" />
                            <div>
                                <h1 className="mg-session-title">회기 관리</h1>
                                <p className="mg-session-subtitle">빠르고 간편한 회기 추가 및 관리</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 통계 카드 그리드 */}
                <div className="mg-session-stats-grid">
                    <div className="mg-stat-card">
                        <div className="mg-stat-card-icon">
                            <Users />
                        </div>
                        <div className="mg-stat-card-content">
                            <div className="mg-stat-card-value">{clients.length}</div>
                            <div className="mg-stat-card-label">총 내담자</div>
                        </div>
                    </div>
                    <div className="mg-stat-card">
                        <div className="mg-stat-card-icon">
                            <CheckCircle />
                        </div>
                        <div className="mg-stat-card-content">
                            <div className="mg-stat-card-value">{mappings.filter(m => m.status === 'ACTIVE').length}</div>
                            <div className="mg-stat-card-label">활성 매핑</div>
                        </div>
                    </div>
                    <div className="mg-stat-card">
                        <div className="mg-stat-card-icon">
                            <Calendar />
                        </div>
                        <div className="mg-stat-card-content">
                            <div className="mg-stat-card-value">{mappings.reduce((sum, m) => sum + (m.usedSessions || 0), 0)}</div>
                            <div className="mg-stat-card-label">사용된 회기</div>
                        </div>
                    </div>
                    <div className="mg-stat-card">
                        <div className="mg-stat-card-icon">
                            <TrendingUp />
                        </div>
                        <div className="mg-stat-card-content">
                            <div className="mg-stat-card-value">
                                {mappings.length > 0 ? Math.round((mappings.filter(m => m.status === 'COMPLETED').length / mappings.length) * 100) : 0}%
                            </div>
                            <div className="mg-stat-card-label">완료율</div>
                        </div>
                    </div>
                </div>

                {/* 메인 콘텐츠 */}
                <div className="mg-session-main-content">
                    
                    {/* 빠른 회기 추가 섹션 */}
                    <div className="mg-session-section">
                        <div className="mg-section-header">
                            <div className="mg-section-header-content">
                                <div className="mg-section-header-left">
                                    <Zap className="mg-section-icon" />
                                    <div>
                                        <h2 className="mg-section-title">빠른 회기 추가</h2>
                                        <p className="mg-section-subtitle">최근 활성 매핑에서 바로 회기를 추가할 수 있습니다</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mg-quick-mappings-grid">
                            {getRecentActiveMappings().map(mapping => {
                                const clientName = mapping.client?.name || mapping.clientName || '알 수 없음';
                                const consultantName = mapping.consultant?.name || mapping.consultantName || '알 수 없음';
                                const totalSessions = mapping.totalSessions || mapping.package?.sessions || 0;
                                const usedSessions = mapping.usedSessions || 0;
                                
                                return (
                                    <div 
                                        key={mapping.id} 
                                        className="mg-quick-mapping-card"
                                        onClick={() => handleQuickAdd(mapping)}
                                    >
                                        <div className="mg-quick-mapping-info">
                                            <div className="mg-quick-mapping-avatar">
                                                {clientName.charAt(0)}
                                            </div>
                                            <div className="mg-quick-mapping-details">
                                                <div className="mg-quick-mapping-client">{clientName}</div>
                                                <div className="mg-quick-mapping-consultant">{consultantName}</div>
                                                <div className="mg-quick-mapping-sessions">
                                                    <span className="mg-sessions-current" style={{color: 'var(--danger-600)', fontWeight: '600'}}>{usedSessions}</span>
                                                    <span className="mg-sessions-separator" style={{margin: '0 4px', color: 'var(--gray-500)'}}>/</span>
                                                    <span className="mg-sessions-total" style={{color: 'var(--primary-600)', fontWeight: '600'}}>{totalSessions}</span>
                                                    <span className="mg-sessions-unit" style={{marginLeft: '2px', color: 'var(--gray-600)', fontSize: 'var(--font-size-xs)'}}>회기</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            className="mg-quick-add-button"
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
                        </div>
                        
                        {getRecentActiveMappings().length === 0 && (
                            <div className="mg-empty-state">
                                <p>활성 매핑이 없습니다.</p>
                            </div>
                        )}
                    </div>

                    {/* 최근 회기 추가 요청 섹션 */}
                    <div className="mg-session-section">
                        <div className="mg-section-header">
                            <div className="mg-section-header-content">
                                <div className="mg-section-header-left">
                                    <Calendar className="mg-section-icon" />
                                    <div>
                                        <h2 className="mg-section-title">최근 회기 추가 요청</h2>
                                        <p className="mg-section-subtitle">
                                            최근 회기 추가 요청 내역을 확인할 수 있습니다
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mg-recent-requests">
                            {getRecentSessionExtensionRequests().map(request => (
                                <div key={request.id} className="mg-request-card">
                                    <div className="mg-request-header">
                                        <div className="mg-request-info">
                                            <div className="mg-request-client">
                                                {request.mapping?.client?.name || request.clientName || '알 수 없음'}
                                            </div>
                                            <div className="mg-request-consultant">
                                                {request.mapping?.consultant?.name || request.consultantName || '알 수 없음'}
                                            </div>
                                        </div>
                                        <div className={`mg-request-status mg-request-status--${request.status?.toLowerCase()}`}>
                                            {getStatusDisplay(request.status).text}
                                        </div>
                                    </div>
                                    
                                    <div className="mg-request-details">
                                        <div className="mg-request-sessions">
                                            +{request.additionalSessions}회기 추가
                                        </div>
                                        <div className="mg-request-package">
                                            {request.packageName} • {parseInt(request.packagePrice || 0).toLocaleString()}원
                                        </div>
                                        <div className="mg-request-date">
                                            {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                                        </div>
                                    </div>
                                    
                                    {request.reason && (
                                        <div className="mg-request-reason">
                                            <strong>사유:</strong> {request.reason}
                                        </div>
                                    )}
                                    
                                    {request.status === 'PENDING' && (
                                        <div className="mg-request-actions">
                                            <button 
                                                className="mg-button mg-button-success mg-button-sm"
                                                onClick={() => handlePaymentConfirm(request.id)}
                                            >
                                                입금 확인
                                            </button>
                                            <button 
                                                className="mg-button mg-button-danger mg-button-sm"
                                                onClick={() => handleRejectRequest(request.id)}
                                            >
                                                거부
                                            </button>
                                        </div>
                                    )}
                                    
                                    {request.status === 'PAYMENT_CONFIRMED' && (
                                        <div className="mg-request-actions">
                                            <button 
                                                className="mg-button mg-button-primary mg-button-sm"
                                                onClick={() => handleAdminApprove(request.id)}
                                            >
                                                관리자 승인
                                            </button>
                                            <button 
                                                className="mg-button mg-button-danger mg-button-sm"
                                                onClick={() => handleRejectRequest(request.id)}
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
                                <p>최근 회기 추가 요청이 없습니다.</p>
                            </div>
                        )}
                    </div>
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