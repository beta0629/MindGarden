import React, { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import MappingCreationModal from '../../admin/MappingCreationModal';
import UnifiedLoading from '../../../components/common/UnifiedLoading'; // 임시 비활성화
import SpecialtyDisplay from '../../ui/SpecialtyDisplay';
import ClientSelector from '../ClientSelector';
import { API_BASE_URL } from '../../../constants/api';
import './ClientSelectionStep.css';

/**
 * 내담자 선택 단계 컴포넌트
/**
 * - 결제 승인된 내담자만 표시
/**
 * - 세션 정보 확인
/**
 * - 매핑 상태 검증
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const ClientSelectionStep = ({ 
    onClientSelect, 
    selectedClient,
    selectedConsultant 
}) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showMappingModal, setShowMappingModal] = useState(false);

    useEffect(() => {
        loadClients();
    }, [selectedConsultant]);

/**
     * 내담자 목록 로드 (선택된 상담사와 매핑된 결제 승인된 내담자만)
     */
    const loadClients = async () => {
        if (!selectedConsultant) {
            console.log('👤 상담사가 선택되지 않았습니다.');
            setClients([]);
            return;
        }

        setLoading(true);
        try {
            console.log('👤 내담자 목록 로드 시작 - 상담사:', selectedConsultant.name);
            
            // 표준화 2025-12-08: /api/v1/admin 경로로 통일
            const response = await fetch(`${API_BASE_URL}/api/v1/admin/mappings/consultant/${selectedConsultant.originalId || selectedConsultant.id}/clients`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('👤 API 응답 데이터:', responseData);
                
                // ApiResponse 래퍼 처리: { success: true, data: { mappings: [...], count: N } }
                let mappingsData = [];
                if (responseData && responseData.data) {
                    if (responseData.data.mappings && Array.isArray(responseData.data.mappings)) {
                        mappingsData = responseData.data.mappings;
                    } else if (Array.isArray(responseData.data)) {
                        mappingsData = responseData.data;
                    }
                } else if (Array.isArray(responseData)) {
                    mappingsData = responseData;
                }
                
                console.log('👤 추출된 매핑 데이터:', mappingsData);
                
                if (!Array.isArray(mappingsData) || mappingsData.length === 0) {
                    console.warn('⚠️ 매핑 데이터가 없거나 배열이 아닙니다:', mappingsData);
                    setClients([]);
                    return;
                }
                
                const clientMap = new Map();
                
                mappingsData.forEach((mapping) => {
                    const clientId = mapping.client.id;
                    
                    if (!clientMap.has(clientId)) {
                        clientMap.set(clientId, {
                            ...mapping.client,
                            id: `client-${clientId}`,
                            originalId: clientId,
                            type: 'client',
                            mappingId: mapping.id,
                            remainingSessions: mapping.remainingSessions,
                            packageName: mapping.packageName,
                            paymentStatus: mapping.paymentStatus,
                            totalSessions: mapping.totalSessions,
                            usedSessions: mapping.usedSessions
                        });
                    } else {
                        const existingClient = clientMap.get(clientId);
                        existingClient.remainingSessions += mapping.remainingSessions;
                        existingClient.totalSessions = (existingClient.totalSessions || 0) + (mapping.totalSessions || 0);
                        existingClient.usedSessions = (existingClient.usedSessions || 0) + (mapping.usedSessions || 0);
                        
                        if (existingClient.packageName !== mapping.packageName) {
                            existingClient.packageName = `${existingClient.packageName}, ${mapping.packageName}`;
                        }
                    }
                });
                
                const availableClients = Array.from(clientMap.values());
                
                setClients(availableClients);
                console.log('👤 내담자 목록 로드 완료 - 상담사별 필터링:', availableClients.length, '명');
            } else {
                console.error('내담자 목록 로드 실패:', response.status);
                await loadClientsFromAllMappings();
            }
        } catch (error) {
            console.error('내담자 목록 로드 실패:', error);
            await loadClientsFromAllMappings();
        } finally {
            setLoading(false);
        }
    };

/**
     * 전체 매핑에서 상담사별 필터링 (백업 방법)
     */
    const loadClientsFromAllMappings = async () => {
        try {
            console.log('👤 전체 매핑에서 상담사별 필터링 시작');
            
            const response = await fetch('/api/v1/admin/mappings/active', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                const mappings = responseData.data || responseData;
                
                if (Array.isArray(mappings)) {
                    const filteredMappings = mappings.filter(mapping => 
                        mapping.consultant && 
                        mapping.consultant.id === (selectedConsultant.originalId || selectedConsultant.id) &&
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        mapping.paymentStatus === 'APPROVED' && 
                        mapping.remainingSessions > 0
                    );
                    
                    const clientMap = new Map();
                    
                    filteredMappings.forEach((mapping) => {
                        const clientId = mapping.client.id;
                        
                        if (!clientMap.has(clientId)) {
                            clientMap.set(clientId, {
                                ...mapping.client,
                                id: `client-${clientId}`,
                                originalId: clientId,
                                type: 'client',
                                mappingId: mapping.id,
                                remainingSessions: mapping.remainingSessions,
                                packageName: mapping.packageName,
                                paymentStatus: mapping.paymentStatus,
                                totalSessions: mapping.totalSessions,
                                usedSessions: mapping.usedSessions
                            });
                        } else {
                            const existingClient = clientMap.get(clientId);
                            existingClient.remainingSessions += mapping.remainingSessions;
                            existingClient.totalSessions = (existingClient.totalSessions || 0) + (mapping.totalSessions || 0);
                            existingClient.usedSessions = (existingClient.usedSessions || 0) + (mapping.usedSessions || 0);
                            
                            if (existingClient.packageName !== mapping.packageName) {
                                existingClient.packageName = `${existingClient.packageName}, ${mapping.packageName}`;
                            }
                        }
                    });
                    
                    const availableClients = Array.from(clientMap.values());
                    setClients(availableClients);
                    console.log('👤 전체 매핑에서 필터링 완료 (중복 제거):', availableClients.length, '명');
                }
            }
        } catch (error) {
            console.error('전체 매핑에서 필터링 실패:', error);
            setClients([]);
        }
    };

/**
     * 내담자 선택 핸들러
     */
    const handleClientSelect = (client) => {
        onClientSelect(client);
    };

/**
     * 매핑 생성 완료 핸들러
     */
    const handleMappingCreated = () => {
        setShowMappingModal(false);
        loadClients(); // 내담자 목록 새로고침
    };

    if (loading) {
        return (
            <div className="client-selection-step mg-v2-ad-client-step">
                <UnifiedLoading type="inline" text="내담자 목록을 불러오는 중..." />
            </div>
        );
    }

    return (
        <div className="client-selection-step mg-v2-ad-client-step">
            <div className="mg-v2-ad-client-step__intro">
                <p className="mg-v2-ad-client-step__subtitle">내담자를 선택하세요</p>
                <p className="mg-v2-ad-client-step__note">
                    결제가 승인되고 세션이 남은 내담자만 표시됩니다
                </p>
            </div>

            <div className="mg-v2-ad-client-step__consultant-chip">
                <span className="mg-v2-ad-client-step__consultant-label">선택된 상담사:</span>
                <span className="mg-v2-ad-client-step__consultant-name">{selectedConsultant?.name}</span>
                <SpecialtyDisplay
                    consultant={selectedConsultant}
                    variant="inline"
                    maxItems={10}
                    debug={true}
                />
            </div>

            {clients.length === 0 ? (
                <div className="mg-v2-ad-client-step__empty">
                    <div className="mg-v2-ad-client-step__empty-icon">
                        <Link2 size={48} strokeWidth={1.5} />
                    </div>
                    <h4 className="mg-v2-ad-client-step__empty-title">매핑된 내담자가 없습니다</h4>
                    <p className="mg-v2-ad-client-step__empty-desc">
                        스케줄을 생성하려면 먼저 상담사와 내담자 간의 매핑을 생성해야 합니다.
                        매핑 생성 후 결제 승인을 받으면 스케줄을 등록할 수 있습니다.
                    </p>
                    <div className="mg-v2-ad-client-step__empty-actions">
                        <button
                            type="button"
                            className="mg-v2-btn--primary mg-v2-ad-client-step__cta"
                            onClick={() => setShowMappingModal(true)}
                        >
                            <Link2 size={16} aria-hidden />
                            <span>매핑 생성하기</span>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <ClientSelector
                        clients={clients}
                        selectedConsultant={selectedConsultant}
                        onClientSelect={handleClientSelect}
                        selectedClient={selectedClient}
                        hideFooterCount
                    />

                    {selectedClient && (
                        <div className="mg-v2-ad-client-step__selected-summary">
                            <span className="mg-v2-ad-client-step__selected-label">선택된 내담자:</span>
                            <span className="mg-v2-ad-client-step__selected-name">{selectedClient.name}</span>
                            <span className="mg-v2-ad-client-step__selected-sessions">
                                (남은 세션: {selectedClient.remainingSessions}회)
                            </span>
                        </div>
                    )}

                    <div className="mg-v2-ad-client-step__footer-count">
                        총 {clients.length}명의 내담자
                    </div>
                </>
            )}

            {/* 매핑 생성 모달 */}
            <MappingCreationModal
                isOpen={showMappingModal}
                onClose={() => setShowMappingModal(false)}
                onMappingCreated={handleMappingCreated}
            />
        </div>
    );
};

export default ClientSelectionStep;
