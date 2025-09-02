import React, { useState, useEffect } from 'react';
import ClientSelector from '../ClientSelector';
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

    useEffect(() => {
        loadClients();
    }, [selectedConsultant]);

    /**
     * 내담자 목록 로드 (결제 승인된 내담자만)
     */
    const loadClients = async () => {
        setLoading(true);
        try {
            console.log('👤 내담자 목록 로드 시작');
            
            // 실제 API 호출
            const response = await fetch('/api/admin/mappings/active', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('👤 API 응답 데이터:', responseData);
                
                // API 응답 구조에 따라 데이터 추출
                const mappings = responseData.data || responseData;
                
                if (!Array.isArray(mappings)) {
                    console.error('매핑 데이터가 배열이 아닙니다:', mappings);
                    setClients([]);
                    return;
                }
                
                // 결제 승인되고 세션이 남은 내담자만 필터링
                const availableClients = mappings
                    .filter(mapping => 
                        mapping.paymentStatus === 'APPROVED' && 
                        mapping.remainingSessions > 0
                    )
                    .map((mapping, index) => ({
                        ...mapping.client,
                        id: `client-${mapping.client.id}-${mapping.id}`, // 매핑 ID도 포함하여 고유성 보장
                        originalId: mapping.client.id,
                        type: 'client',
                        mappingId: mapping.id,
                        remainingSessions: mapping.remainingSessions,
                        packageName: mapping.packageName
                    }));
                setClients(availableClients);
                console.log('👤 내담자 목록 로드 완료 (실제 API)');
            } else {
                console.error('내담자 목록 로드 실패:', response.status);
            }
        } catch (error) {
            console.error('내담자 목록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 내담자 선택 핸들러
     */
    const handleClientSelect = (client) => {
        onClientSelect(client);
    };

    if (loading) {
        return (
            <div className="client-selection-step">
                <div className="loading-container">
                    <div className="loading-spinner">내담자 목록을 불러오는 중...</div>
                </div>
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
                    <span className="consultant-specialty">
                        ({selectedConsultant?.specialties?.[0] || selectedConsultant?.specialty})
                    </span>
                </div>
            </div>

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
        </div>
    );
};

export default ClientSelectionStep;
