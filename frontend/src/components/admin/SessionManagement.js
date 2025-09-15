import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import './SessionManagement.css';

/**
 * 내담자 회기 관리 컴포넌트
 * - 내담자별 회기 등록
 * - 회기 상태 관리
 * - 회기 사용 내역 조회
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const SessionManagement = () => {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedMapping, setSelectedMapping] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [clientFilterStatus, setClientFilterStatus] = useState('ALL');
    
    // 전체 회기 관리 현황 필터 상태
    const [mappingSearchTerm, setMappingSearchTerm] = useState('');
    const [mappingFilterStatus, setMappingFilterStatus] = useState('ALL');
    const [mappingStatusOptions, setMappingStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [statusOptions, setStatusOptions] = useState([]);
    const [loadingStatusCodes, setLoadingStatusCodes] = useState(false);
    const [packageOptions, setPackageOptions] = useState([]);
    const [loadingPackageCodes, setLoadingPackageCodes] = useState(false);
    
    // 회기 추가 요청 관련 상태
    const [activeTab, setActiveTab] = useState('mappings'); // 'mappings' 또는 'extensions'
    const [extensionRequests, setExtensionRequests] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [paymentData, setPaymentData] = useState({
        paymentMethod: '',
        paymentReference: ''
    });
    const [approvalData, setApprovalData] = useState({
        comment: ''
    });

    // 매핑 상태 코드 로드
    const loadMappingStatusCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/admin/common-codes/values?groupCode=MAPPING_STATUS');
            if (response && response.length > 0) {
                const options = response.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel,
                    icon: code.icon,
                    color: code.colorCode,
                    description: code.codeDescription
                }));
                
                // 중복 제거: value 기준으로 중복 제거 (더 강력한 로직)
                const uniqueOptions = options.reduce((acc, current) => {
                    const existingIndex = acc.findIndex(item => item.value === current.value);
                    if (existingIndex === -1) {
                        acc.push(current);
                    }
                    return acc;
                }, []);
                
                setMappingStatusOptions(uniqueOptions);
            }
        } catch (error) {
            console.error('매핑 상태 코드 로드 실패:', error);
            // 실패 시 기본값 설정
            setMappingStatusOptions([
                { value: 'HAS_MAPPING', label: '매핑 있음', icon: '✅', color: '#10b981', description: '매핑이 있는 상태' },
                { value: 'ACTIVE_MAPPING', label: '활성 매핑', icon: '🟢', color: '#3b82f6', description: '활성화된 매핑 상태' },
                { value: 'NO_MAPPING', label: '매핑 없음', icon: '❌', color: '#ef4444', description: '매핑이 없는 상태' },
                { value: 'PENDING_MAPPING', label: '매핑 대기', icon: '⏳', color: '#f59e0b', description: '매핑 대기 중인 상태' },
                { value: 'INACTIVE_MAPPING', label: '비활성 매핑', icon: '🔴', color: '#6b7280', description: '비활성화된 매핑 상태' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    // 상태 코드 로드
    const loadStatusCodes = useCallback(async () => {
        try {
            setLoadingStatusCodes(true);
            const response = await apiGet('/api/admin/common-codes/values?groupCode=STATUS');
            if (response && response.length > 0) {
                const options = response.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel,
                    icon: code.icon,
                    color: code.colorCode,
                    description: code.codeDescription
                }));
                setStatusOptions(options);
            }
        } catch (error) {
            console.error('상태 코드 로드 실패:', error);
            // 실패 시 기본값 설정
            setStatusOptions([
                { value: 'ACTIVE', label: '활성', icon: '🟢', color: '#10b981', description: '활성 상태' },
                { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#6b7280', description: '비활성 상태' },
                { value: 'PENDING', label: '대기', icon: '⏳', color: '#f59e0b', description: '대기 상태' },
                { value: 'SUSPENDED', label: '일시정지', icon: '⏸️', color: '#ef4444', description: '일시정지 상태' },
                { value: 'DELETED', label: '삭제', icon: '🗑️', color: '#dc2626', description: '삭제된 상태' },
                { value: 'COMPLETED', label: '완료', icon: '✅', color: '#3b82f6', description: '완료된 상태' }
            ]);
        } finally {
            setLoadingStatusCodes(false);
        }
    }, []);

    // 패키지 코드 로드 (매핑 시스템과 동일한 CONSULTATION_PACKAGE 사용)
    const loadPackageCodes = useCallback(async () => {
        try {
            setLoadingPackageCodes(true);
            const response = await apiGet('/api/admin/common-codes/values?groupCode=CONSULTATION_PACKAGE');
            if (response && response.length > 0) {
                const options = response.map(code => {
                    let sessions = 20; // 기본값
                    if (code.extraData) {
                        try {
                            const extraData = JSON.parse(code.extraData);
                            sessions = extraData.sessions || 20;
                        } catch (e) {
                            console.warn('extraData 파싱 실패:', e);
                        }
                    }
                    
                    return {
                        value: code.codeValue,
                        label: code.codeLabel,
                        description: code.codeDescription,
                        price: code.codeDescription ? parseFloat(code.codeDescription) : 0,
                        sessions: sessions,
                        icon: code.icon,
                        color: code.colorCode
                    };
                });
                setPackageOptions(options);
            }
        } catch (error) {
            console.error('패키지 코드 로드 실패:', error);
            // 실패 시 기본값 설정
            setPackageOptions([
                { value: 'BASIC', label: '기본 패키지', description: '200000', price: 200000, sessions: 4 },
                { value: 'STANDARD', label: '표준 패키지', description: '400000', price: 400000, sessions: 8 },
                { value: 'PREMIUM', label: '프리미엄 패키지', description: '600000', price: 600000, sessions: 12 },
                { value: 'VIP', label: 'VIP 패키지', description: '1000000', price: 1000000, sessions: 20 }
            ]);
        } finally {
            setLoadingPackageCodes(false);
        }
    }, []);

    const [newSessionData, setNewSessionData] = useState({
        consultantId: '',
        clientId: '',
        additionalSessions: 5,
        totalSessions: 0,
        usedSessions: 0,
        remainingSessions: 0,
        packageName: '',
        packagePrice: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
        loadMappingStatusCodes();
        loadStatusCodes();
        loadPackageCodes();
        loadExtensionRequests();
    }, [loadMappingStatusCodes, loadStatusCodes, loadPackageCodes]);

    // 결제 방법 변경 시 자동으로 참조번호 생성
    useEffect(() => {
        if (paymentData.paymentMethod && !paymentData.paymentReference) {
            const now = new Date();
            const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
            
            let autoReference = '';
            if (paymentData.paymentMethod === 'CASH') {
                autoReference = `CASH_${timestamp}`;
            } else if (paymentData.paymentMethod === 'CARD') {
                autoReference = `CARD_${timestamp}`;
            } else if (paymentData.paymentMethod === 'BANK_TRANSFER') {
                autoReference = `BANK_${timestamp}`;
            } else {
                autoReference = `${paymentData.paymentMethod}_${timestamp}`;
            }
            
            setPaymentData(prev => ({
                ...prev,
                paymentReference: autoReference
            }));
        }
    }, [paymentData.paymentMethod]);

    /**
     * 초기 데이터 로드
     */
    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadClients(),
                loadConsultants(),
                loadMappings()
            ]);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            notificationManager.error('데이터 로드에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 내담자 목록 로드
     */
    const loadClients = async () => {
        try {
            const response = await apiGet('/api/admin/clients/with-mapping-info');
            if (response.success) {
                setClients(response.data || []);
            }
        } catch (error) {
            console.error('통합 내담자 데이터 로드 실패:', error);
        }
    };

    /**
     * 상담사 목록 로드
     */
    const loadConsultants = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await apiGet(`/api/admin/consultants/with-vacation?date=${today}`);
            if (response.success) {
                setConsultants(response.data || []);
            }
        } catch (error) {
            console.error('통합 상담사 데이터 로드 실패:', error);
        }
    };

    /**
     * 매핑 목록 로드
     */
    const loadMappings = async () => {
        try {
            const response = await apiGet('/api/admin/mappings');
            if (response && response.data) {
                setMappings(response.data || []);
            }
        } catch (error) {
            console.error('매핑 목록 로드 실패:', error);
        }
    };

    /**
     * 회기 추가 요청 목록 로드
     */
    const loadExtensionRequests = async () => {
        try {
            const response = await apiGet('/api/admin/session-extensions/requests');
            if (response.success) {
                setExtensionRequests(response.data || []);
            }
        } catch (error) {
            console.error('회기 추가 요청 목록 로드 실패:', error);
        }
    };

    /**
     * 내담자 선택 처리
     */
    const handleClientSelect = (client) => {
        setSelectedClient(client);
        // 해당 내담자의 매핑 정보 찾기 (ACTIVE 상태 중 가장 최근 것)
        const clientMappings = mappings.filter(mapping => 
            mapping.clientId === client.id &&
            mapping.status === 'ACTIVE'
        );
        
        if (clientMappings.length > 0) {
            // 가장 최근 매핑 선택
            const latestMapping = clientMappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            setSelectedMapping(latestMapping);
        } else {
            setSelectedMapping(null);
        }
    };

    /**
     * 필터링된 매핑 목록 반환
     */
    const getFilteredMappings = () => {
        let filtered = mappings;

        // 특정 내담자가 선택된 경우
        if (selectedClient) {
            filtered = filtered.filter(mapping => mapping.clientId === selectedClient.id);
        } else {
            // 전체 회기 관리 현황에서 필터 적용
            // 검색어 필터링
            if (mappingSearchTerm) {
                filtered = filtered.filter(mapping => 
                    (mapping.clientName && mapping.clientName.toLowerCase().includes(mappingSearchTerm.toLowerCase())) ||
                    (mapping.consultantName && mapping.consultantName.toLowerCase().includes(mappingSearchTerm.toLowerCase())) ||
                    (mapping.packageName && mapping.packageName.toLowerCase().includes(mappingSearchTerm.toLowerCase()))
                );
            }

            // 상태별 필터링
            if (mappingFilterStatus !== 'ALL') {
                filtered = filtered.filter(mapping => {
                    switch (mappingFilterStatus) {
                        case 'ACTIVE':
                            return mapping.status === 'ACTIVE';
                        case 'INACTIVE':
                            return mapping.status === 'INACTIVE';
                        case 'PENDING':
                            return mapping.status === 'PENDING';
                        case 'COMPLETED':
                            return mapping.status === 'COMPLETED';
                        case 'SUSPENDED':
                            return mapping.status === 'SUSPENDED';
                        default:
                            return true;
                    }
                });
            }

            // 필터가 적용되지 않은 경우 최근 10개만 표시
            const hasActiveFilters = mappingSearchTerm || mappingFilterStatus !== 'ALL';
            if (!hasActiveFilters) {
                // 최근 생성된 매핑 10개만 반환 (createdAt 기준으로 정렬)
                return filtered
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                    .slice(0, 10);
            }
        }

        return filtered;
    };

    /**
     * 필터링된 내담자 목록 반환
     */
    const getFilteredClients = () => {
        let filtered = clients;

        // 검색어 필터링
        if (clientSearchTerm) {
            filtered = filtered.filter(client => 
                client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
            );
        }

        // 상태별 필터링
        if (clientFilterStatus !== 'ALL') {
            filtered = filtered.filter(client => {
                const clientMappings = mappings.filter(mapping => mapping.clientId === client.id);
                const activeMappings = clientMappings.filter(mapping => mapping.status === 'ACTIVE');
                
                switch (clientFilterStatus) {
                    case 'HAS_MAPPING':
                        return clientMappings.length > 0;
                    case 'ACTIVE_MAPPING':
                        return activeMappings.length > 0;
                    case 'NO_MAPPING':
                        return clientMappings.length === 0;
                    default:
                        return true;
                }
            });
        }

        // 필터가 적용되지 않은 경우 최근 10명만 표시
        const hasActiveFilters = clientSearchTerm || clientFilterStatus !== 'ALL';
        if (!hasActiveFilters) {
            // 최근 생성된 내담자 10명만 반환 (createdAt 기준으로 정렬)
            return filtered
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .slice(0, 10);
        }

        return filtered;
    };

    /**
     * 새 회기 등록 모달 열기
     */
    const handleAddSession = () => {
        if (!selectedClient) {
            notificationManager.error('내담자를 먼저 선택해주세요.');
            return;
        }
        
        // 기존 매핑이 있으면 해당 상담사를 기본으로 선택 (ACTIVE 상태 중 가장 최근 것)
        const clientMappings = mappings.filter(m => 
            m.clientId === selectedClient.id && 
            m.status === 'ACTIVE'
        );
        
        const existingMapping = selectedMapping || 
            (clientMappings.length > 0 
                ? clientMappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                : null);
        
        const defaultConsultantId = existingMapping?.consultantId || '';
        
        setNewSessionData({
            consultantId: defaultConsultantId,
            clientId: selectedClient.id,
            additionalSessions: 0, // 패키지 선택 시 자동 설정
            totalSessions: existingMapping?.totalSessions || 0,
            usedSessions: existingMapping?.usedSessions || 0,
            remainingSessions: existingMapping?.remainingSessions || 0,
            packageName: '',
            packagePrice: '',
            notes: ''
        });
        setShowAddModal(true);
    };

    /**
     * 회기 추가 요청 생성 처리
     */
    const handleCreateSessionExtensionRequest = async () => {
        if (!newSessionData.consultantId || !newSessionData.clientId) {
            notificationManager.error('상담사와 내담자를 모두 선택해주세요.');
            return;
        }

        if (!newSessionData.packageName || !newSessionData.packagePrice) {
            notificationManager.error('패키지를 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            // 먼저 해당 내담자와 상담사의 매핑을 찾습니다 (ACTIVE 상태 중 가장 최근 것)
            const existingMappings = mappings.filter(mapping => 
                mapping.consultantId === newSessionData.consultantId && 
                mapping.clientId === newSessionData.clientId &&
                mapping.status === 'ACTIVE'
            );
            
            // 가장 최근 매핑 선택 (createdAt 기준으로 정렬)
            const existingMapping = existingMappings.length > 0 
                ? existingMappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                : null;

            if (!existingMapping) {
                notificationManager.error('해당 내담자와 상담사의 매핑을 찾을 수 없습니다. 먼저 매핑을 생성해주세요.');
                return;
            }

            const response = await apiPost('/api/admin/session-extensions/requests', {
                mappingId: existingMapping.id,
                requesterId: 1, // 실제로는 현재 로그인한 사용자 ID
                additionalSessions: newSessionData.additionalSessions,
                packageName: newSessionData.packageName,
                packagePrice: newSessionData.packagePrice,
                reason: newSessionData.notes || '회기 추가 요청'
            });

            if (response.success) {
                notificationManager.success('회기 추가 요청이 생성되었습니다. 입금 확인을 기다려주세요.');
                setShowAddModal(false);
                loadExtensionRequests();
                loadMappings();
                setNewSessionData({
                    consultantId: '',
                    clientId: '',
                    additionalSessions: 5,
                    packageName: '',
                    packagePrice: '',
                    notes: ''
                });
            } else {
                throw new Error(response.message || '회기 추가 요청 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('회기 추가 요청 생성 실패:', error);
            notificationManager.error('회기 추가 요청 생성에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 매핑 상태 변경
     */
    const handleStatusChange = async (mappingId, newStatus) => {
        setLoading(true);
        try {
            const response = await apiPut(`/api/admin/mappings/${mappingId}`, {
                status: newStatus
            });

            if (response.success) {
                notificationManager.success('상태가 변경되었습니다.');
                loadMappings();
            } else {
                throw new Error(response.message || '상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('상태 변경 실패:', error);
            notificationManager.error('상태 변경에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 상태를 한글로 변환
     */
    const getStatusText = (status) => {
        const statusMap = {
            'ACTIVE': '활성',
            'INACTIVE': '비활성',
            'SUSPENDED': '일시정지',
            'TERMINATED': '종료',
            'COMPLETED': '완료',
            'PENDING_PAYMENT': '입금 대기',
            'PAYMENT_CONFIRMED': '입금 확인됨',
            'SESSIONS_EXHAUSTED': '회기 소진'
        };
        return statusMap[status] || status;
    };

    /**
     * 상태별 색상 반환
     */
    const getStatusColor = (status) => {
        const colorMap = {
            'ACTIVE': '#10b981',
            'INACTIVE': '#6b7280',
            'SUSPENDED': '#f59e0b',
            'TERMINATED': '#ef4444',
            'COMPLETED': '#3b82f6',
            'PENDING_PAYMENT': '#f97316',
            'PAYMENT_CONFIRMED': '#22c55e',
            'SESSIONS_EXHAUSTED': '#8b5cf6'
        };
        return colorMap[status] || '#6b7280';
    };

    /**
     * 회기 추가 요청 상태를 한글로 변환
     */
    const getExtensionStatusText = (status) => {
        const statusMap = {
            'PENDING': '입금 대기',
            'PAYMENT_CONFIRMED': '입금 확인됨',
            'ADMIN_APPROVED': '관리자 승인됨',
            'REJECTED': '거부됨',
            'COMPLETED': '완료됨'
        };
        return statusMap[status] || status;
    };

    /**
     * 회기 추가 요청 상태별 색상 반환
     */
    const getExtensionStatusColor = (status) => {
        const colorMap = {
            'PENDING': '#f97316',
            'PAYMENT_CONFIRMED': '#22c55e',
            'ADMIN_APPROVED': '#3b82f6',
            'REJECTED': '#ef4444',
            'COMPLETED': '#10b981'
        };
        return colorMap[status] || '#6b7280';
    };

    /**
     * 요청 완료 처리
     */
    const handleCompleteRequest = async (requestId) => {
        if (!window.confirm('이 요청을 완료하시겠습니까? 회기가 실제로 추가됩니다.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await apiPost(`/api/admin/session-extensions/requests/${requestId}/complete`);

            if (response.success) {
                notificationManager.success('요청이 완료되었습니다. 회기가 추가되었습니다.');
                loadExtensionRequests();
                loadMappings(); // 매핑 목록도 새로고침
            } else {
                throw new Error(response.message || '완료에 실패했습니다.');
            }
        } catch (error) {
            console.error('완료 실패:', error);
            notificationManager.error('완료에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 입금 확인 모달 열기
     */
    const handlePaymentConfirm = (request) => {
        setSelectedRequest(request);
        setPaymentData({
            paymentMethod: '',
            paymentReference: ''
        });
        setShowPaymentModal(true);
    };

    /**
     * 입금 확인 처리
     */
    const handlePaymentConfirmSubmit = async () => {
        if (!selectedRequest || !paymentData.paymentMethod) {
            notificationManager.error('결제 방법을 선택해주세요.');
            return;
        }
        
        // 결제 방법에 따라 자동으로 참조번호 생성
        let finalPaymentReference = paymentData.paymentReference;
        if (!paymentData.paymentReference || paymentData.paymentReference.trim() === '') {
            const now = new Date();
            const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
            
            if (paymentData.paymentMethod === 'CASH') {
                finalPaymentReference = `CASH_${timestamp}`;
            } else if (paymentData.paymentMethod === 'CARD') {
                finalPaymentReference = `CARD_${timestamp}`;
            } else if (paymentData.paymentMethod === 'BANK_TRANSFER') {
                finalPaymentReference = `BANK_${timestamp}`;
            } else {
                finalPaymentReference = `${paymentData.paymentMethod}_${timestamp}`;
            }
        }

        setLoading(true);
        try {
            const response = await apiPost(`/api/admin/session-extensions/requests/${selectedRequest.id}/confirm-payment`, {
                paymentMethod: paymentData.paymentMethod,
                paymentReference: finalPaymentReference
            });

            if (response.success) {
                notificationManager.success('입금이 확인되었습니다.');
                setShowPaymentModal(false);
                loadExtensionRequests();
            } else {
                throw new Error(response.message || '입금 확인에 실패했습니다.');
            }
        } catch (error) {
            console.error('입금 확인 실패:', error);
            notificationManager.error('입금 확인에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 관리자 승인 모달 열기
     */
    const handleAdminApproval = (request) => {
        setSelectedRequest(request);
        setApprovalData({
            comment: ''
        });
        setShowApprovalModal(true);
    };

    /**
     * 관리자 승인 처리
     */
    const handleAdminApprovalSubmit = async () => {
        if (!selectedRequest) {
            notificationManager.error('승인할 요청을 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiPost(`/api/admin/session-extensions/requests/${selectedRequest.id}/approve`, {
                adminId: 1, // 실제로는 세션에서 가져와야 함
                comment: approvalData.comment
            });

            if (response.success) {
                notificationManager.success('회기 추가 요청이 승인되었습니다.');
                setShowApprovalModal(false);
                loadExtensionRequests();
                loadMappings(); // 매핑 목록도 새로고침
            } else {
                throw new Error(response.message || '승인에 실패했습니다.');
            }
        } catch (error) {
            console.error('승인 실패:', error);
            notificationManager.error('승인에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 요청 거부 처리
     */
    const handleRejectRequest = async (requestId) => {
        if (!window.confirm('이 요청을 거부하시겠습니까?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await apiPost(`/api/admin/session-extensions/requests/${requestId}/reject`, {
                adminId: 1, // 실제로는 세션에서 가져와야 함
                comment: '관리자에 의해 거부됨'
            });

            if (response.success) {
                notificationManager.success('요청이 거부되었습니다.');
                loadExtensionRequests();
            } else {
                throw new Error(response.message || '거부에 실패했습니다.');
            }
        } catch (error) {
            console.error('거부 실패:', error);
            notificationManager.error('거부에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SimpleLayout>
            <div className="session-mgmt-container">
            <div className="session-mgmt-header">
                <h2>📋 내담자 회기 관리</h2>
                <p>내담자의 상담 회기를 등록하고 관리할 수 있습니다.</p>
                
                {/* 탭 메뉴 */}
                <div className="session-mgmt-tabs">
                    <button 
                        className={`session-mgmt-tab ${activeTab === 'mappings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mappings')}
                    >
                        📊 회기 관리
                    </button>
                    <button 
                        className={`session-mgmt-tab ${activeTab === 'extensions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('extensions')}
                    >
                        ➕ 회기 추가 요청
                    </button>
                </div>
            </div>

            {/* 회기 관리 탭 내용 */}
            {activeTab === 'mappings' && (
                <>
            {/* 내담자 선택 섹션 */}
            <div className="session-mgmt-client-selection-section">
                <div className="session-mgmt-client-selection-header">
                    <div>
                        <h3>내담자 선택</h3>
                        {(() => {
                            const hasActiveFilters = clientSearchTerm || clientFilterStatus !== 'ALL';
                            const filteredCount = getFilteredClients().length;
                            const totalCount = clients.length;
                            
                            if (hasActiveFilters) {
                                return (
                                    <p style={{ 
                                        margin: '4px 0 0 0', 
                                        fontSize: '14px', 
                                        color: '#6b7280',
                                        fontWeight: 'normal'
                                    }}>
                                        검색 결과: {filteredCount}명 (전체 {totalCount}명 중)
                                    </p>
                                );
                            } else {
                                return (
                                    <p style={{ 
                                        margin: '4px 0 0 0', 
                                        fontSize: '14px', 
                                        color: '#6b7280',
                                        fontWeight: 'normal'
                                    }}>
                                        최근 내담자 {filteredCount}명 표시 (전체 {totalCount}명 중)
                                    </p>
                                );
                            }
                        })()}
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        alignItems: 'center',
                        flexWrap: 'nowrap'
                    }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <input
                                type="text"
                                placeholder="내담자 이름 또는 이메일 검색..."
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>
                        <select
                            value={clientFilterStatus}
                            onChange={(e) => setClientFilterStatus(e.target.value)}
                            disabled={loadingCodes}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white',
                                minWidth: '120px',
                                outline: 'none',
                                cursor: loadingCodes ? 'not-allowed' : 'pointer',
                                opacity: loadingCodes ? 0.6 : 1,
                                transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        >
                            <option value="ALL">전체</option>
                            {mappingStatusOptions.map((status, index) => (
                                <option key={`mapping-status-${status.value}-${index}`} value={status.value}>
                                    {status.icon} {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="session-mgmt-client-list">
                    {getFilteredClients().map(client => {
                        const clientMappings = mappings.filter(mapping => mapping.clientId === client.id);
                        const activeMappings = clientMappings.filter(mapping => mapping.status === 'ACTIVE');
                        
                        return (
                            <div 
                                key={client.id}
                                className={`session-mgmt-client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
                                onClick={() => handleClientSelect(client)}
                            >
                                <div className="session-mgmt-client-info">
                                    <div className="session-mgmt-client-name">{client.name}</div>
                                    <div className="session-mgmt-client-email">{client.email}</div>
                                    <div className="session-mgmt-client-mapping-info">
                                        <span className="session-mgmt-mapping-count">
                                            매핑 {clientMappings.length}개
                                        </span>
                                        {activeMappings.length > 0 && (
                                            <span className="session-mgmt-active-count">
                                                (활성 {activeMappings.length}개)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="session-mgmt-client-status">
                                    {selectedClient?.id === client.id && <span className="session-mgmt-selected-indicator">✓</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {getFilteredClients().length === 0 && (
                    <div className="session-mgmt-no-results">
                        <p>검색 조건에 맞는 내담자가 없습니다.</p>
                    </div>
                )}
            </div>

            {/* 선택된 내담자 정보 */}
            {selectedClient && (
                <div className="session-mgmt-selected-client-info">
                    <h3>선택된 내담자: {selectedClient.name}</h3>
                    
                    {selectedMapping ? (
                        <div className="session-mgmt-mapping-info">
                            <div className="session-mgmt-mapping-details">
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">상담사:</span>
                                    <span className="session-mgmt-value">{selectedMapping.consultant?.name || '알 수 없음'}</span>
                                </div>
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">총 회기:</span>
                                    <span className="session-mgmt-value">{selectedMapping.totalSessions || 0}회</span>
                                </div>
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">사용 회기:</span>
                                    <span className="session-mgmt-value">{selectedMapping.usedSessions || 0}회</span>
                                </div>
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">남은 회기:</span>
                                    <span className="session-mgmt-value">{selectedMapping.remainingSessions || 0}회</span>
                                </div>
                                <div className="session-mgmt-detail-row">
                                    <span className="session-mgmt-label">상태:</span>
                                    <span 
                                        className="session-mgmt-value session-mgmt-status-badge"
                                        style={{ backgroundColor: getStatusColor(selectedMapping.status) }}
                                    >
                                        {getStatusText(selectedMapping.status)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="session-mgmt-mapping-actions">
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-primary"
                                    onClick={handleAddSession}
                                >
                                    회기 추가 요청
                                </button>
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-secondary"
                                    onClick={() => handleStatusChange(selectedMapping.id, 'INACTIVE')}
                                    disabled={selectedMapping.status === 'INACTIVE'}
                                >
                                    비활성화
                                </button>
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-warning"
                                    onClick={() => handleStatusChange(selectedMapping.id, 'SUSPENDED')}
                                    disabled={selectedMapping.status === 'SUSPENDED'}
                                >
                                    일시정지
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="session-mgmt-no-mapping">
                            <p>이 내담자에 대한 상담사 매핑이 없습니다.</p>
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-primary"
                                onClick={handleAddSession}
                            >
                                회기 추가 요청
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 매핑 목록 */}
            <div className="session-mgmt-all-mappings-section">
                <div className="session-mgmt-mappings-header">
                    <div>
                        <h3>
                            {selectedClient ? `${selectedClient.name} 회기 관리 현황` : '전체 회기 관리 현황'}
                            {selectedClient && (
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-secondary"
                                    onClick={() => setSelectedClient(null)}
                                    style={{ marginLeft: '15px' }}
                                >
                                    전체 보기
                                </button>
                            )}
                        </h3>
                        {!selectedClient && (() => {
                            const hasActiveFilters = mappingSearchTerm || mappingFilterStatus !== 'ALL';
                            const filteredCount = getFilteredMappings().length;
                            const totalCount = mappings.length;
                            
                            if (hasActiveFilters) {
                                return (
                                    <p style={{ 
                                        margin: '4px 0 0 0', 
                                        fontSize: '14px', 
                                        color: '#6b7280',
                                        fontWeight: 'normal'
                                    }}>
                                        검색 결과: {filteredCount}개 (전체 {totalCount}개 중)
                                    </p>
                                );
                            } else {
                                return (
                                    <p style={{ 
                                        margin: '4px 0 0 0', 
                                        fontSize: '14px', 
                                        color: '#6b7280',
                                        fontWeight: 'normal'
                                    }}>
                                        최근 매핑 {filteredCount}개 표시 (전체 {totalCount}개 중)
                                    </p>
                                );
                            }
                        })()}
                    </div>
                    
                    {/* 전체 회기 관리 현황 필터 (특정 내담자 선택 시에는 숨김) */}
                    {!selectedClient && (
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'center',
                            flexWrap: 'nowrap',
                            marginTop: '15px'
                        }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                <input
                                    type="text"
                                    placeholder="내담자, 상담사, 패키지명 검색..."
                                    value={mappingSearchTerm}
                                    onChange={(e) => setMappingSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                />
                            </div>
                            <select
                                value={mappingFilterStatus}
                                onChange={(e) => setMappingFilterStatus(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: 'white',
                                    minWidth: '120px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            >
                                <option value="ALL">전체 상태</option>
                                <option value="ACTIVE">활성</option>
                                <option value="INACTIVE">비활성</option>
                                <option value="PENDING">대기</option>
                                <option value="COMPLETED">완료</option>
                                <option value="SUSPENDED">일시정지</option>
                            </select>
                        </div>
                    )}
                </div>
                <div className="session-mgmt-mappings-grid">
                    {getFilteredMappings().map(mapping => (
                        <div key={mapping.id} className="session-mgmt-mapping-card">
                            <div className="session-mgmt-card-header">
                                <div className="session-mgmt-card-title">
                                    <h4>{mapping.clientName || '알 수 없음'}</h4>
                                    <span className="session-mgmt-card-subtitle">내담자</span>
                                </div>
                                <span 
                                    className="session-mgmt-status-badge"
                                    style={{ backgroundColor: getStatusColor(mapping.status) }}
                                >
                                    {getStatusText(mapping.status)}
                                </span>
                            </div>
                            
                            <div className="session-mgmt-card-content">
                                <div className="session-mgmt-info-row">
                                    <span className="session-mgmt-info-label">상담사:</span>
                                    <span className="session-mgmt-info-value">{mapping.consultantName || '알 수 없음'}</span>
                                </div>
                                
                                <div className="session-mgmt-sessions-info">
                                    <div className="session-mgmt-session-item">
                                        <span className="session-mgmt-session-label">총 회기</span>
                                        <span className="session-mgmt-session-value total">{mapping.totalSessions || 0}회</span>
                                    </div>
                                    <div className="session-mgmt-session-item">
                                        <span className="session-mgmt-session-label">사용</span>
                                        <span className="session-mgmt-session-value used">{mapping.usedSessions || 0}회</span>
                                    </div>
                                    <div className="session-mgmt-session-item">
                                        <span className="session-mgmt-session-label">남은</span>
                                        <span className="session-mgmt-session-value remaining">{mapping.remainingSessions || 0}회</span>
                                    </div>
                                </div>
                                
                                {mapping.packageName && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">패키지:</span>
                                        <span className="session-mgmt-info-value">{mapping.packageName}</span>
                                    </div>
                                )}
                                
                                {mapping.paymentAmount && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">결제금액:</span>
                                        <span className="session-mgmt-info-value">{mapping.paymentAmount.toLocaleString()}원</span>
                                    </div>
                                )}
                                
                                {mapping.createdAt && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">등록일:</span>
                                        <span className="session-mgmt-info-value">
                                            {new Date(mapping.createdAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                )}
                                
                                {mapping.adminApprovalDate && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">승인일:</span>
                                        <span className="session-mgmt-info-value">
                                            {new Date(mapping.adminApprovalDate).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                )}
                                
                                {mapping.paymentDate && (
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">결제일:</span>
                                        <span className="session-mgmt-info-value">
                                            {new Date(mapping.paymentDate).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="session-mgmt-card-actions">
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-secondary"
                                    onClick={() => handleStatusChange(mapping.id, 'INACTIVE')}
                                    disabled={mapping.status === 'INACTIVE'}
                                >
                                    비활성
                                </button>
                                <button 
                                    className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-primary"
                                    onClick={() => {
                                        setSelectedMapping(mapping);
                                        setShowAddModal(true);
                                    }}
                                >
                                    회기 추가 요청
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 회기 추가 요청 모달 */}
            {showAddModal && (
                <div className="session-mgmt-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="session-mgmt-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="session-mgmt-modal-header">
                            <h3>회기 추가 요청</h3>
                            <button className="session-mgmt-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        
                        <div className="session-mgmt-modal-body">
                            <div className="session-mgmt-form-group">
                                <label>상담사 선택</label>
                                <select 
                                    value={newSessionData.consultantId}
                                    onChange={(e) => {
                                        const consultantId = e.target.value;
                                        // 해당 상담사와 내담자의 매핑 찾기 (ACTIVE 상태 중 가장 최근 것)
                                        const consultantMappings = mappings.filter(mapping => 
                                            mapping.consultantId === consultantId && 
                                            mapping.clientId === newSessionData.clientId &&
                                            mapping.status === 'ACTIVE'
                                        );
                                        
                                        const latestMapping = consultantMappings.length > 0 
                                            ? consultantMappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                                            : null;
                                        
                                        setNewSessionData({
                                        ...newSessionData,
                                            consultantId: consultantId,
                                            totalSessions: latestMapping?.totalSessions || 0,
                                            usedSessions: latestMapping?.usedSessions || 0,
                                            remainingSessions: latestMapping?.remainingSessions || 0
                                        });
                                    }}
                                >
                                    <option value="">상담사를 선택하세요</option>
                                    {consultants.map(consultant => (
                                        <option key={consultant.id} value={consultant.id}>
                                            {consultant.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* 기존 회기 정보 표시 */}
                            <div className="session-mgmt-form-group">
                                <label>현재 회기 현황</label>
                                <div className="session-mgmt-current-sessions">
                                    <div className="session-mgmt-session-info">
                                        <span className="session-mgmt-session-label">총 회기:</span>
                                        <span className="session-mgmt-session-value">{newSessionData.totalSessions}회</span>
                                    </div>
                                    <div className="session-mgmt-session-info">
                                        <span className="session-mgmt-session-label">사용 회기:</span>
                                        <span className="session-mgmt-session-value">{newSessionData.usedSessions}회</span>
                                    </div>
                                    <div className="session-mgmt-session-info">
                                        <span className="session-mgmt-session-label">남은 회기:</span>
                                        <span className="session-mgmt-session-value">{newSessionData.remainingSessions}회</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="session-mgmt-form-group">
                                <label>추가할 회기 수</label>
                                <input 
                                    type="number"
                                    value={newSessionData.additionalSessions || 0}
                                    readOnly
                                    disabled
                                    className="readonly-input"
                                    placeholder="패키지 선택 시 자동 설정"
                                />
                                <small className="form-text text-muted">
                                    패키지 선택 시 자동으로 설정됩니다.
                                </small>
                            </div>
                            
                            <div className="session-mgmt-form-group">
                                <label>패키지명</label>
                                <select
                                    value={newSessionData.packageName}
                                    onChange={(e) => {
                                        const selectedPackage = packageOptions.find(pkg => pkg.value === e.target.value);
                                        setNewSessionData({
                                        ...newSessionData,
                                            packageName: e.target.value,
                                            packagePrice: selectedPackage ? selectedPackage.price.toString() : '',
                                            additionalSessions: selectedPackage ? selectedPackage.sessions : 5
                                        });
                                    }}
                                    disabled={loadingPackageCodes}
                                >
                                    <option value="">패키지를 선택하세요</option>
                                    {packageOptions.map(pkg => (
                                        <option key={pkg.value} value={pkg.value}>
                                            {pkg.label} ({pkg.sessions}회기, {pkg.price.toLocaleString()}원)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="session-mgmt-form-group">
                                <label>패키지 가격 (원)</label>
                                <input 
                                    type="number"
                                    value={newSessionData.packagePrice}
                                    readOnly
                                    placeholder="패키지를 선택하면 자동으로 설정됩니다"
                                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                />
                            </div>
                            
                            <div className="session-mgmt-form-group">
                                <label>요청 사유</label>
                                <textarea 
                                    value={newSessionData.notes}
                                    onChange={(e) => setNewSessionData({
                                        ...newSessionData,
                                        notes: e.target.value
                                    })}
                                    placeholder="회기 추가 요청 사유를 입력하세요"
                                    rows="3"
                                />
                            </div>
                        </div>
                        
                        <div className="session-mgmt-modal-footer">
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-secondary"
                                onClick={() => setShowAddModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-primary"
                                onClick={handleCreateSessionExtensionRequest}
                                disabled={loading}
                            >
                                {loading ? '요청 중...' : '요청 생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
                </>
            )}

            {/* 회기 추가 요청 탭 내용 */}
            {activeTab === 'extensions' && (
                <div className="session-mgmt-extensions-section">
                    <div className="session-mgmt-extensions-header">
                        <h3>회기 추가 요청 관리</h3>
                        <p>회기 추가 요청의 입금 확인 및 관리자 승인을 처리할 수 있습니다.</p>
                    </div>

                    <div className="session-mgmt-extensions-grid">
                        {extensionRequests.map(request => (
                            <div key={request.id} className="session-mgmt-extension-card">
                                <div className="session-mgmt-card-header">
                                    <div className="session-mgmt-card-title">
                                        <h4>요청 #{request.id}</h4>
                                        <span className="session-mgmt-card-subtitle">
                                            {request.consultantName} → {request.clientName}
                                        </span>
                                    </div>
                                    <span 
                                        className="session-mgmt-status-badge"
                                        style={{ backgroundColor: getExtensionStatusColor(request.status) }}
                                    >
                                        {getExtensionStatusText(request.status)}
                                    </span>
                                </div>
                                
                                <div className="session-mgmt-card-content">
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">추가 회기:</span>
                                        <span className="session-mgmt-info-value">{request.additionalSessions}회</span>
                                    </div>
                                    
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">패키지:</span>
                                        <span className="session-mgmt-info-value">{request.packageName}</span>
                                    </div>
                                    
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">금액:</span>
                                        <span className="session-mgmt-info-value">{request.packagePrice?.toLocaleString()}원</span>
                                    </div>
                                    
                                    <div className="session-mgmt-info-row">
                                        <span className="session-mgmt-info-label">요청일:</span>
                                        <span className="session-mgmt-info-value">
                                            {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                    
                                    {request.reason && (
                                        <div className="session-mgmt-info-row">
                                            <span className="session-mgmt-info-label">사유:</span>
                                            <span className="session-mgmt-info-value">{request.reason}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="session-mgmt-card-actions">
                                    {request.status === 'PENDING' && (
                                        <button 
                                            className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-primary"
                                            onClick={() => handlePaymentConfirm(request)}
                                        >
                                            💳 입금 확인
                                        </button>
                                    )}
                                    
                                    {request.status === 'PAYMENT_CONFIRMED' && (
                                        <>
                                            <button 
                                                className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-success"
                                                onClick={() => handleAdminApproval(request)}
                                            >
                                                ✅ 승인
                                            </button>
                                            <button 
                                                className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-danger"
                                                onClick={() => handleRejectRequest(request.id)}
                                            >
                                                ❌ 거부
                                            </button>
                                        </>
                                    )}
                                    
                                    {request.status === 'ADMIN_APPROVED' && (
                                        <button 
                                            className="session-mgmt-btn session-mgmt-btn-sm session-mgmt-btn-warning"
                                            onClick={() => handleCompleteRequest(request.id)}
                                        >
                                            ✅ 요청 완료
                                        </button>
                                    )}
                                    
                                    {request.status === 'REJECTED' && (
                                        <span className="session-mgmt-status-text">거부됨</span>
                                    )}
                                    
                                    {request.status === 'COMPLETED' && (
                                        <span className="session-mgmt-status-text">완료됨</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {extensionRequests.length === 0 && (
                        <div className="session-mgmt-no-results">
                            <p>회기 추가 요청이 없습니다.</p>
                        </div>
                    )}
                </div>
            )}

            {/* 입금 확인 모달 */}
            {showPaymentModal && (
                <div className="session-mgmt-modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="session-mgmt-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="session-mgmt-modal-header">
                            <h3>입금 확인</h3>
                            <button className="session-mgmt-close-btn" onClick={() => setShowPaymentModal(false)}>✕</button>
                        </div>
                        
                        <div className="session-mgmt-modal-body">
                            <div className="session-mgmt-form-group">
                                <label>결제 방법</label>
                                <select 
                                    value={paymentData.paymentMethod}
                                    onChange={(e) => setPaymentData({
                                        ...paymentData,
                                        paymentMethod: e.target.value,
                                        paymentReference: e.target.value === 'CASH' ? '' : paymentData.paymentReference
                                    })}
                                >
                                    <option value="">결제 방법을 선택하세요</option>
                                    <option value="BANK_TRANSFER">계좌이체</option>
                                    <option value="CARD">카드결제</option>
                                    <option value="CASH">현금</option>
                                </select>
                            </div>
                            
                            <div className="session-mgmt-form-group">
                                <label>결제 참조번호</label>
                                <input 
                                    type="text"
                                    value={paymentData.paymentReference || (() => {
                                        const now = new Date();
                                        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
                                        
                                        if (paymentData.paymentMethod === 'CASH') {
                                            return `CASH_${timestamp}`;
                                        } else if (paymentData.paymentMethod === 'CARD') {
                                            return `CARD_${timestamp}`;
                                        } else if (paymentData.paymentMethod === 'BANK_TRANSFER') {
                                            return `BANK_${timestamp}`;
                                        } else if (paymentData.paymentMethod) {
                                            return `${paymentData.paymentMethod}_${timestamp}`;
                                        }
                                        return '';
                                    })()}
                                    onChange={(e) => setPaymentData({
                                        ...paymentData,
                                        paymentReference: e.target.value
                                    })}
                                    placeholder="자동 생성됩니다 (수정 가능)"
                                />
                                <small className="form-text text-muted">
                                    자동으로 참조번호가 생성됩니다. 필요시 수정할 수 있습니다.
                                </small>
                            </div>
                        </div>
                        
                        <div className="session-mgmt-modal-footer">
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-secondary"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-primary"
                                onClick={handlePaymentConfirmSubmit}
                                disabled={loading}
                            >
                                {loading ? '확인 중...' : '입금 확인'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 관리자 승인 모달 */}
            {showApprovalModal && (
                <div className="session-mgmt-modal-overlay" onClick={() => setShowApprovalModal(false)}>
                    <div className="session-mgmt-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="session-mgmt-modal-header">
                            <h3>관리자 승인</h3>
                            <button className="session-mgmt-close-btn" onClick={() => setShowApprovalModal(false)}>✕</button>
                        </div>
                        
                        <div className="session-mgmt-modal-body">
                            <div className="session-mgmt-form-group">
                                <label>승인 코멘트</label>
                                <textarea 
                                    value={approvalData.comment}
                                    onChange={(e) => setApprovalData({
                                        ...approvalData,
                                        comment: e.target.value
                                    })}
                                    placeholder="승인 관련 코멘트를 입력하세요 (선택사항)"
                                    rows="3"
                                />
                            </div>
                        </div>
                        
                        <div className="session-mgmt-modal-footer">
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-secondary"
                                onClick={() => setShowApprovalModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="session-mgmt-btn session-mgmt-btn-success"
                                onClick={handleAdminApprovalSubmit}
                                disabled={loading}
                            >
                                {loading ? '승인 중...' : '승인'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="session-mgmt-loading-overlay">
                    <div className="session-mgmt-loading-spinner">로딩 중...</div>
                </div>
            )}
            </div>
        </SimpleLayout>
    );
};

export default SessionManagement;
