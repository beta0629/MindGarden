import React, { useState, useEffect } from 'react';
import ClientSelector from '../ClientSelector';
import MappingCreationModal from '../../admin/MappingCreationModal';
import UnifiedLoading from '../../common/UnifiedLoading';
import SpecialtyDisplay from '../../ui/SpecialtyDisplay';
import { API_BASE_URL } from '../../../constants/api';
import './ClientSelectionStep.css';

/**
 * 내담자 선택 단계 컴포넌트
 * - 결제 승인된 내담자만 표시
 * - 세션 정보 확인
 * - 매핑 상태 검증
 * 
 * @author MindGarden
 * @version 1.0.0
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
            
            // 선택된 상담사와 매핑된 내담자만 조회
            const response = await fetch(`${API_BASE_URL}/api/admin/mappings/consultant/${selectedConsultant.originalId || selectedConsultant.id}/clients`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('👤 API 응답 데이터:', responseData);
                
                // 백엔드 API 응답 구조: { success: true, data: [...], count: ... }
                const mappingsData = responseData.data || [];
                
                if (!Array.isArray(mappingsData)) {
                    console.error('매핑 데이터가 배열이 아닙니다:', mappingsData);
                    setClients([]);
                    return;
                }
                
                // 매핑 데이터에서 내담자 정보 추출 (중복 제거)
                const clientMap = new Map();
                
                mappingsData.forEach((mapping) => {
                    const clientId = mapping.client.id;
                    
                    if (!clientMap.has(clientId)) {
                        // 새로운 내담자 - 첫 번째 매핑 정보 사용
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
                        // 기존 내담자 - 회기수 합산
                        const existingClient = clientMap.get(clientId);
                        existingClient.remainingSessions += mapping.remainingSessions;
                        existingClient.totalSessions = (existingClient.totalSessions || 0) + (mapping.totalSessions || 0);
                        existingClient.usedSessions = (existingClient.usedSessions || 0) + (mapping.usedSessions || 0);
                        
                        // 여러 매핑이 있는 경우 메모에 표시
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
                // API가 없으면 전체 매핑에서 필터링
                await loadClientsFromAllMappings();
            }
        } catch (error) {
            console.error('내담자 목록 로드 실패:', error);
            // API 오류 시 전체 매핑에서 필터링
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
            
            const response = await fetch('/api/admin/mappings/active', {
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
                    // 선택된 상담사와 매핑된 내담자만 필터링
                    const filteredMappings = mappings.filter(mapping => 
                        mapping.consultant && 
                        mapping.consultant.id === (selectedConsultant.originalId || selectedConsultant.id) &&
                        mapping.paymentStatus === 'APPROVED' && 
                        mapping.remainingSessions > 0
                    );
                    
                    // 중복 제거 로직 적용
                    const clientMap = new Map();
                    
                    filteredMappings.forEach((mapping) => {
                        const clientId = mapping.client.id;
                        
                        if (!clientMap.has(clientId)) {
                            // 새로운 내담자 - 첫 번째 매핑 정보 사용
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
                            // 기존 내담자 - 회기수 합산
                            const existingClient = clientMap.get(clientId);
                            existingClient.remainingSessions += mapping.remainingSessions;
                            existingClient.totalSessions = (existingClient.totalSessions || 0) + (mapping.totalSessions || 0);
                            existingClient.usedSessions = (existingClient.usedSessions || 0) + (mapping.usedSessions || 0);
                            
                            // 여러 매핑이 있는 경우 메모에 표시
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
            <div className="client-selection-step">
                <UnifiedLoading 
                    text="내담자 목록을 불러오는 중..." 
                    size="large" 
                    variant="dots"
                    type="inline"
                    className="loading-spinner-inline"
                />
            </div>
        );
    }

    return (
        <div className="client-selection-step">
            <div className="step-header">
                <h4>👤 내담자를 선택하세요</h4>
                <p className="step-description">
                    결제가 승인되고 세션이 남은 내담자만 표시됩니다
                </p>
            </div>

            <div className="selected-consultant-info">
                <div className="consultant-summary">
                    <strong>선택된 상담사:</strong> {selectedConsultant?.name}
                    <SpecialtyDisplay
                        consultant={selectedConsultant}
                        variant="inline"
                        maxItems={10}
                        debug={true}
                    />
                </div>
            </div>

            {clients.length === 0 ? (
                <div className="no-clients-message">
                    <div className="no-clients-icon">🔗</div>
                    <h4>매핑된 내담자가 없습니다</h4>
                    <p>
                        스케줄을 생성하려면 먼저 상담사와 내담자 간의 매핑을 생성해야 합니다.
                        매핑 생성 후 결제 승인을 받으면 스케줄을 등록할 수 있습니다.
                    </p>
                    <div className="mapping-actions">
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowMappingModal(true)}
                        >
                            🔗 매핑 생성하기
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
                    />

                    {selectedClient && (
                        <div className="selected-client-info">
                            <div className="selection-summary">
                                <strong>선택된 내담자:</strong> {selectedClient.name}
                                <span className="client-sessions">
                                    (남은 세션: {selectedClient.remainingSessions}회)
                                </span>
                            </div>
                        </div>
                    )}
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
