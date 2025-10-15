import React, { useState, useEffect, useCallback } from 'react';
import ClientCard from '../ui/Card/ClientCard';
import { apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import csrfTokenManager from '../../utils/csrfTokenManager';
import '../../styles/main.css';

/**
 * 내담자 선택 컴포넌트
 * - 결제 승인되고 세션이 남은 내담자만 표시
 * - 드래그 앤 드롭 기능 지원
 * - 세션 정보 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ClientSelector = ({ 
    clients, 
    selectedConsultant, 
    onClientSelect, 
    selectedClient 
}) => {
    const [clientHistory, setClientHistory] = useState({});
    const [loadingHistory, setLoadingHistory] = useState({});
    const [clientMappings, setClientMappings] = useState({});
    const [loadingMappings, setLoadingMappings] = useState({});
    const [isMobile, setIsMobile] = useState(false);

    // 모바일 감지
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    /**
     * 컴포넌트 마운트 시 모든 내담자의 매핑 정보 일괄 로드
     */
    useEffect(() => {
        if (clients && clients.length > 0 && selectedConsultant) {
            console.log('🚀 내담자 매핑 정보 일괄 로드 시작:', clients.length, '명');
            loadAllClientMappings(clients);
        }
    }, [clients, selectedConsultant]);

    /**
     * 모든 내담자의 매핑 정보를 일괄 로드
     */
    const loadAllClientMappings = useCallback(async (clientsList) => {
        if (!selectedConsultant) return;
        
        try {
            const consultantId = selectedConsultant.originalId || selectedConsultant.id;
            console.log('📊 모든 내담자 매핑 정보 일괄 로드 시작:', { consultantId, clientCount: clientsList.length });
            
            // 상담사별 매핑 정보를 일괄 조회
            const response = await fetch(`/api/admin/mappings/consultant/${consultantId}/clients`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                const mappingsData = responseData.data || [];
                
                // 매핑 데이터를 클라이언트 ID별로 정리
                const mappingsByClientId = {};
                mappingsData.forEach(mapping => {
                    const clientId = mapping.clientId || mapping.client?.id;
                    if (clientId) {
                        mappingsByClientId[clientId] = {
                            hasMapping: true,
                            remainingSessions: mapping.remainingSessions || 0,
                            packageName: mapping.packageName || '기본 패키지',
                            mappingStatus: mapping.status || 'ACTIVE',
                            lastSessionDate: mapping.lastSessionDate,
                            totalSessions: mapping.totalSessions || 0,
                            mappingId: mapping.id
                        };
                    }
                });
                
                // 모든 클라이언트에 대해 매핑 정보 설정 (매핑이 없는 경우 기본값)
                const allClientMappings = {};
                clientsList.forEach(client => {
                    const clientId = client.originalId || client.id;
                    allClientMappings[clientId] = mappingsByClientId[clientId] || {
                        hasMapping: false,
                        remainingSessions: 0,
                        packageName: '매핑 없음',
                        mappingStatus: 'INACTIVE',
                        lastSessionDate: null,
                        totalSessions: 0
                    };
                });
                
                setClientMappings(allClientMappings);
                console.log('📊 모든 내담자 매핑 정보 일괄 로드 완료:', allClientMappings);
            } else {
                console.error('❌ 매핑 정보 일괄 조회 실패:', response.status);
                // 실패 시 기본값 설정
                const defaultMappings = {};
                clientsList.forEach(client => {
                    const clientId = client.originalId || client.id;
                    defaultMappings[clientId] = {
                        hasMapping: false,
                        remainingSessions: 0,
                        packageName: '확인 불가',
                        mappingStatus: 'INACTIVE',
                        lastSessionDate: null,
                        totalSessions: 0
                    };
                });
                setClientMappings(defaultMappings);
            }
        } catch (error) {
            console.error('❌ 내담자 매핑 정보 일괄 로드 오류:', error);
            // 오류 시 기본값 설정
            const defaultMappings = {};
            clientsList.forEach(client => {
                const clientId = client.originalId || client.id;
                defaultMappings[clientId] = {
                    hasMapping: false,
                    remainingSessions: 0,
                    packageName: '확인 불가',
                    mappingStatus: 'INACTIVE',
                    lastSessionDate: null,
                    totalSessions: 0
                };
            });
            setClientMappings(defaultMappings);
        }
    }, [selectedConsultant]);

    /**
     * 개별 내담자 매핑 정보 로드 (필요시에만 사용)
     */
    const loadClientMapping = useCallback(async (client) => {
        const clientId = client.originalId || client.id;
        
        if (clientMappings[clientId] || loadingMappings[clientId]) {
            return; // 이미 로드되었거나 로딩 중
        }

        try {
            setLoadingMappings(prev => ({ ...prev, [clientId]: true }));
            console.log('🔍 내담자 매핑 정보 로드 시작:', { clientId, consultantId: selectedConsultant?.originalId || selectedConsultant?.id });
            
            const mappingInfo = await getClientMappingInfo(client);
            
            console.log('📊 내담자 매핑 정보 로드 완료:', mappingInfo);
            setClientMappings(prev => ({ ...prev, [clientId]: mappingInfo }));
        } catch (error) {
            console.error('❌ 내담자 매핑 정보 로드 오류:', error);
            // 오류 시 기본값 설정
            setClientMappings(prev => ({ 
                ...prev, 
                [clientId]: {
                    hasMapping: false,
                    remainingSessions: 0,
                    packageName: '확인 불가',
                    mappingStatus: 'INACTIVE',
                    lastSessionDate: null,
                    totalSessions: 0
                }
            }));
        } finally {
            setLoadingMappings(prev => ({ ...prev, [clientId]: false }));
        }
    }, [clientMappings, loadingMappings, selectedConsultant]);

    /**
     * 내담자 상담 히스토리 조회
     */
    const loadClientHistory = async (client) => {
        const clientId = client.originalId || client.id;
        const displayId = client.id; // 표시용 ID (client-34-22 형태)
        
        if (clientHistory[displayId] || loadingHistory[displayId]) {
            return; // 이미 로드되었거나 로딩 중
        }

        try {
            setLoadingHistory(prev => ({ ...prev, [displayId]: true }));
            console.log('📋 내담자 히스토리 조회 시작:', { displayId, clientId });
            
            const response = await apiGet(`/api/v1/consultations/client/${clientId}/history`);
            
            if (response.success) {
                console.log('📋 내담자 히스토리 조회 완료:', response.data);
                setClientHistory(prev => ({ ...prev, [displayId]: response.data }));
            } else {
                console.warn('📋 내담자 히스토리 조회 실패:', response.message);
            }
        } catch (error) {
            console.error('📋 내담자 히스토리 조회 오류:', error);
        } finally {
            setLoadingHistory(prev => ({ ...prev, [displayId]: false }));
        }
    };

    /**
     * 내담자와 상담사 간의 매핑 확인
     */
    const getClientMappingInfo = async (client) => {
        // API 엔드포인트와 상수 정의
        const API_ENDPOINTS = {
            CHECK_MAPPING: '/api/schedules/client/mapping/check'
        };
        const MESSAGES = {
            NO_MAPPING: '매핑이 설정되지 않은 내담자입니다.',
            NO_SESSIONS: '남은 세션이 없는 내담자입니다.'
        };
        const MAPPING_STATUS = {
            ACTIVE: 'ACTIVE',
            INACTIVE: 'INACTIVE'
        };
        
        try {
            console.log('🔍 매핑 정보 확인 시작:', {
                clientId: client.originalId || client.id,
                consultantId: selectedConsultant?.originalId || selectedConsultant?.id,
                apiEndpoint: API_ENDPOINTS.CHECK_MAPPING
            });
            
            const requestBody = {
                clientId: client.originalId || client.id,
                consultantId: selectedConsultant?.originalId || selectedConsultant?.id
            };
            
            console.log('📤 요청 데이터:', requestBody);
            
            const response = await csrfTokenManager.post(API_ENDPOINTS.CHECK_MAPPING, requestBody);

            console.log('📥 응답 상태:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📊 응답 데이터:', data);

            if (data.success) {
                console.log('매핑 정보 확인 성공:', data.data);
                return {
                    hasMapping: data.data.hasMapping,
                    remainingSessions: data.data.remainingSessions || 0,
                    packageName: data.data.packageName || '기본 패키지',
                    mappingStatus: data.data.mappingStatus || MAPPING_STATUS.ACTIVE,
                    lastSessionDate: data.data.lastSessionDate,
                    totalSessions: data.data.totalSessions || 0
                };
            } else {
                console.warn('매핑 정보 확인 실패:', data.message);
                return {
                    hasMapping: false,
                    remainingSessions: 0,
                    packageName: '매핑 없음',
                    mappingStatus: MAPPING_STATUS.INACTIVE,
                    lastSessionDate: null,
                    totalSessions: 0
                };
            }
        } catch (error) {
            console.error('매핑 정보 확인 오류:', error);
            console.error('오류 상세:', error.message);
            // 에러 시 기본값 반환
            return {
                hasMapping: false,
                remainingSessions: 0,
                packageName: '확인 불가',
                mappingStatus: MAPPING_STATUS.INACTIVE,
                lastSessionDate: null,
                totalSessions: 0
            };
        }
    };

    /**
     * 프로필 이미지 URL 생성
     */
    const getClientProfileImage = (client) => {
        if (client.profileImage) {
            return client.profileImage;
        }
        
        const firstChar = client.name ? client.name.charAt(0) : '?';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstChar)}&background=28a745&color=fff&size=60&font-size=0.5`;
    };

    /**
     * 세션 상태 배지 색상
     */
    const getSessionBadgeColor = (remainingSessions) => {
        if (remainingSessions <= 1) return 'danger';
        if (remainingSessions <= 3) return 'warning';
        return 'success';
    };

    /**
     * 내담자 카드 클릭 핸들러
     */
    const handleClientClick = async (client) => {
        const MESSAGES = {
            NO_MAPPING: '매핑이 설정되지 않은 내담자입니다.',
            NO_SESSIONS: '남은 세션이 없는 내담자입니다.'
        };
        
        try {
            // 매핑 정보 확인
            const mappingInfo = await getClientMappingInfo(client);
            
            if (!mappingInfo.hasMapping) {
                notificationManager.error(MESSAGES.NO_MAPPING);
                return;
            }
            
            if (mappingInfo.remainingSessions <= 0) {
                notificationManager.error(MESSAGES.NO_SESSIONS);
                return;
            }
            
            // 매핑 정보를 클라이언트 객체에 추가
            const clientWithMapping = {
                ...client,
                mappingInfo
            };
            
            onClientSelect(clientWithMapping);
        } catch (error) {
            console.error('내담자 선택 오류:', error);
            notificationManager.error('내담자 선택 중 오류가 발생했습니다.');
        }
    };

    /**
     * 드래그 시작 핸들러
     */
    const handleDragStart = (e, client) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            id: client.id,
            type: 'client',
            data: client
        }));
        e.dataTransfer.effectAllowed = 'move';
    };

    if (!clients || clients.length === 0) {
        return (
            <div className="client-selector">
                <div className="no-clients">
                    <div className="no-clients-icon">👤</div>
                    <p>사용 가능한 내담자가 없습니다.</p>
                    <small>결제가 승인되고 세션이 남은 내담자가 없습니다.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="client-selector">
            <div className="mg-client-cards-grid mg-client-cards-grid--detailed">
                {clients.map(client => {
                    const clientId = client.originalId || client.id;
                    const mappingInfo = clientMappings[clientId] || {
                        hasMapping: false,
                        remainingSessions: 0,
                        packageName: loadingMappings[clientId] ? '로딩 중' : '확인 중',
                        mappingStatus: 'INACTIVE',
                        lastSessionDate: null,
                        totalSessions: 0
                    };
                    
                    // 디버깅용 로그
                    console.log(`🔍 내담자 ${client.name} (ID: ${clientId}) 매핑 정보:`, {
                        mappingInfo,
                        clientMappings: clientMappings[clientId],
                        loadingMappings: loadingMappings[clientId]
                    });
                    
                    const isSelected = selectedClient?.id === client.id;
                    const isAvailable = mappingInfo.hasMapping && mappingInfo.remainingSessions > 0;
                    
                    return (
                        <ClientCard
                            key={client.id}
                            client={{
                                ...client,
                                status: isAvailable ? 'ACTIVE' : 'INACTIVE',
                                totalSessions: mappingInfo.totalSessions || 0,
                                completedSessions: (mappingInfo.totalSessions || 0) - (mappingInfo.remainingSessions || 0),
                                lastConsultationDate: mappingInfo.lastSessionDate,
                                consultantName: selectedConsultant?.name
                            }}
                            onClick={() => handleClientClick(client)}
                            selected={isSelected}
                            draggable={isAvailable}
                            variant={isMobile ? 'mobile-simple' : 'detailed'}
                            showActions={true}
                            showProgress={true}
                            className={!isAvailable ? 'mg-client-card--unavailable' : ''}
                        />
                    );
                })}
            </div>

            {/* 필터링된 내담자 수 표시 */}
            <div className="client-count">
                총 {clients.length}명의 내담자
            </div>
        </div>
    );
};

export default ClientSelector;
