import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import StatisticsDashboard from './StatisticsDashboard';
import SearchFilterSection from './SearchFilterSection';
import SectionHeader from './SectionHeader';
import ClientCard from './ClientCard';
import MappingCard from './MappingCard';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/design-system.css';
import '../../styles/06-components/_buttons.css';
import '../../styles/06-components/_cards.css';
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

    // 매칭 상태 코드 로드
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
            console.error('매칭 상태 코드 로드 실패:', error);
            // 실패 시 기본값 설정
            setMappingStatusOptions([
                { value: 'HAS_MAPPING', label: '매칭 있음', icon: '✅', color: '#10b981', description: '매칭이 있는 상태' },
                { value: 'ACTIVE_MAPPING', label: '활성 매칭', icon: '🟢', color: '#3b82f6', description: '활성화된 매칭 상태' },
                { value: 'NO_MAPPING', label: '매칭 없음', icon: '❌', color: '#ef4444', description: '매칭이 없는 상태' },
                { value: 'PENDING_MAPPING', label: '매칭 대기', icon: '⏳', color: '#f59e0b', description: '매칭 대기 중인 상태' },
                { value: 'INACTIVE_MAPPING', label: '비활성 매칭', icon: '🔴', color: '#6b7280', description: '비활성화된 매칭 상태' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    // 상태 코드 로드
    const loadStatusCodes = useCallback(async () => {
        try {
            setLoadingStatusCodes(true);
            const response = await apiGet('/api/common-codes/group/STATUS');
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

    // 패키지 코드 로드 (매칭 시스템과 동일한 CONSULTATION_PACKAGE 사용)
    const loadPackageCodes = useCallback(async () => {
        try {
            setLoadingPackageCodes(true);
            const response = await apiGet('/api/common-codes/group/CONSULTATION_PACKAGE');
            if (response && response.length > 0) {
                const options = response.map(code => {
                    let sessions = 20; // 기본값
                    let price = 0;
                    
                    // 코드 값에 따라 세션 수와 가격 설정
                    if (code.codeValue === 'BASIC') {
                        sessions = 20;
                        price = 200000;
                    } else if (code.codeValue === 'STANDARD') {
                        sessions = 20;
                        price = 400000;
                    } else if (code.codeValue === 'PREMIUM') {
                        sessions = 20;
                        price = 600000;
                    } else if (code.codeValue === 'VIP') {
                        sessions = 20;
                        price = 1000000;
                    } else if (code.codeValue.startsWith('SINGLE_')) {
                        sessions = 1; // 단회기는 1회기
                        // SINGLE_30000 -> 30000
                        const priceStr = code.codeValue.replace('SINGLE_', '');
                        price = parseInt(priceStr, 10);
                        // NaN 체크
                        if (isNaN(price)) {
                            console.warn(`단회기 가격 파싱 실패: ${code.codeValue} -> ${priceStr}`);
                            price = 30000; // 기본값
                        }
                    } else {
                        // extraData에서 세션 수 가져오기
                        if (code.extraData) {
                            try {
                                const extraData = JSON.parse(code.extraData);
                                sessions = extraData.sessions || 20;
                            } catch (e) {
                                console.warn('extraData 파싱 실패:', e);
                            }
                        }
                        price = code.codeDescription ? parseFloat(code.codeDescription) : 0;
                    }
                    
                    // 패키지별 라벨 생성
                    let label;
                    if (code.codeValue === 'BASIC') {
                        label = '기본 패키지';
                    } else if (code.codeValue === 'STANDARD') {
                        label = '표준 패키지';
                    } else if (code.codeValue === 'PREMIUM') {
                        label = '프리미엄 패키지';
                    } else if (code.codeValue === 'VIP') {
                        label = 'VIP 패키지';
                    } else if (code.codeValue.startsWith('SINGLE_')) {
                        // SINGLE_ 패키지는 코드값 그대로 사용 (SINGLE_30000, SINGLE_35000 등)
                        label = code.codeValue;
                    } else {
                        label = code.codeLabel;
                    }
                    
                    return {
                        value: code.codeValue,
                        label: label,
                        description: code.codeDescription,
                        price: price,
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
     * 매칭 목록 로드
     */
    const loadMappings = async () => {
        try {
            const response = await apiGet('/api/admin/mappings');
            if (response && response.data) {
                setMappings(response.data || []);
            }
        } catch (error) {
            console.error('매칭 목록 로드 실패:', error);
        }
    };

    /**
     * 회기 추가 요청 목록 로드
     */
    const loadExtensionRequests = async () => {
        try {
            console.log('🔄 회기 추가 요청 목록 로드 시작');
            const response = await apiGet('/api/admin/session-extensions/requests');
            console.log('📊 회기 추가 요청 API 응답:', response);
            
            if (response.success) {
                const requests = response.data || [];
                console.log('📋 로드된 회기 추가 요청 수:', requests.length);
                console.log('📋 회기 추가 요청 데이터:', requests);
                setExtensionRequests(requests);
            } else {
                console.error('❌ 회기 추가 요청 목록 로드 실패:', response.message);
            }
        } catch (error) {
            console.error('❌ 회기 추가 요청 목록 로드 실패:', error);
        }
    };

    /**
     * 내담자 선택 처리
     */
    const handleClientSelect = (client) => {
        setSelectedClient(client);
        // 해당 내담자의 매칭 정보 찾기 (ACTIVE 상태 중 가장 최근 것)
        const clientMappings = mappings.filter(mapping => 
            mapping.clientId === client.id &&
            mapping.status === 'ACTIVE'
        );
        
        if (clientMappings.length > 0) {
            // 가장 최근 매칭 선택
            const latestMapping = clientMappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            setSelectedMapping(latestMapping);
        } else {
            setSelectedMapping(null);
        }
    };

    /**
     * 매칭 선택 처리
     */
    const handleMappingSelect = (mapping) => {
        setSelectedMapping(mapping);
        // 해당 매칭의 내담자 정보 찾기
        const client = clients.find(client => client.id === mapping.clientId);
        if (client) {
            setSelectedClient(client);
        }
    };

    /**
     * 필터링된 매칭 목록 반환
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
                // 최근 생성된 매칭 10개만 반환 (createdAt 기준으로 정렬)
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
        
        // 기존 매칭이 있으면 해당 상담사를 기본으로 선택 (ACTIVE 상태 중 가장 최근 것)
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
        
        // 디버깅을 위한 로그
        console.log('회기 추가 요청 모달 열기:', {
            selectedClient: selectedClient.name,
            existingMapping,
            defaultConsultantId,
            consultants: consultants.length
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
            // 먼저 해당 내담자와 상담사의 매칭을 찾습니다 (ACTIVE 상태 중 가장 최근 것)
            const existingMappings = mappings.filter(mapping => 
                mapping.consultantId === newSessionData.consultantId && 
                mapping.clientId === newSessionData.clientId &&
                mapping.status === 'ACTIVE'
            );
            
            // 가장 최근 매칭 선택 (createdAt 기준으로 정렬)
            const existingMapping = existingMappings.length > 0 
                ? existingMappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                : null;

            if (!existingMapping) {
                notificationManager.error('해당 내담자와 상담사의 매칭을 찾을 수 없습니다. 먼저 매칭을 생성해주세요.');
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
     * 매칭 상태 변경
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
     * 상태별 색상 반환 (디자인 시스템 변수 사용)
     */
    const getStatusColor = (status) => {
        const colorMap = {
            'ACTIVE': 'var(--color-success, #34c759)',
            'INACTIVE': 'var(--color-secondary, #6c757d)',
            'SUSPENDED': 'var(--color-warning, #ff9500)',
            'TERMINATED': 'var(--color-danger, #ff3b30)',
            'COMPLETED': 'var(--color-primary, #007aff)',
            'PENDING_PAYMENT': 'var(--ios-orange, #ff9500)',
            'PAYMENT_CONFIRMED': 'var(--color-success, #34c759)',
            'SESSIONS_EXHAUSTED': 'var(--ios-purple, #5856d6)'
        };
        return colorMap[status] || 'var(--color-secondary, #6c757d)';
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
     * 회기 추가 요청 상태별 색상 반환 (디자인 시스템 변수 사용)
     */
    const getExtensionStatusColor = (status) => {
        const colorMap = {
            'PENDING': 'var(--ios-orange, #ff9500)',
            'PAYMENT_CONFIRMED': 'var(--color-success, #34c759)',
            'ADMIN_APPROVED': 'var(--color-primary, #007aff)',
            'REJECTED': 'var(--color-danger, #ff3b30)',
            'COMPLETED': 'var(--color-success, #34c759)'
        };
        return colorMap[status] || 'var(--color-secondary, #6c757d)';
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
                loadMappings(); // 매칭 목록도 새로고침
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
                loadMappings(); // 매칭 목록도 새로고침
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
                {/* 헤더 섹션 */}
                <div className="session-mgmt-header">
                    <div className="header-title">
                        <h1>
                            <i className="bi bi-calendar-check"></i>
                            내담자 회기 관리
                        </h1>
                        <p>내담자의 상담 회기를 등록하고 관리할 수 있습니다</p>
                    </div>
                    
                    <div className="header-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'mappings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('mappings')}
                        >
                            <i className="bi bi-diagram-3"></i>
                            회기 관리
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'extensions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('extensions')}
                        >
                            <i className="bi bi-plus-circle"></i>
                            회기 추가 요청
                        </button>
                    </div>
                </div>

                {/* 통계 대시보드 */}
                <StatisticsDashboard
                    totalClients={clients.length}
                    activeMappings={mappings.filter(m => m.status === 'ACTIVE').length}
                    totalSessions={mappings.reduce((sum, m) => sum + (m.usedSessions || 0), 0)}
                    completionRate={mappings.length > 0 ? Math.round((mappings.filter(m => m.status === 'COMPLETED').length / mappings.length) * 100) : 0}
                />

                {/* 회기 관리 탭 내용 */}
                {activeTab === 'mappings' && (
                    <>
                        {/* 내담자 선택 섹션 */}
                        <div className="session-mgmt-main-card">
                            <SectionHeader
                                title="내담자 선택"
                                subtitle={(() => {
                                    const hasActiveFilters = clientSearchTerm || clientFilterStatus !== 'ALL';
                                    const filteredCount = getFilteredClients().length;
                                    const totalCount = clients.length;
                                    
                                    if (hasActiveFilters) {
                                        return `검색 결과: ${filteredCount}명 (전체 ${totalCount}명 중)`;
                                    } else {
                                        return `최근 내담자 ${filteredCount}명 표시 (전체 ${totalCount}명 중)`;
                                    }
                                })()}
                                icon="bi-person-check"
                            />
                            
                            <SearchFilterSection
                                searchTerm={clientSearchTerm}
                                onSearchChange={setClientSearchTerm}
                                filterValue={clientFilterStatus}
                                onFilterChange={setClientFilterStatus}
                                filterOptions={mappingStatusOptions}
                                placeholder="내담자 검색..."
                                filterLabel="전체"
                            />
                            
                            <div className="session-mgmt-client-list">
                                {getFilteredClients().map(client => {
                                    const clientMappings = mappings.filter(mapping => mapping.clientId === client.id);
                                    const activeMappings = clientMappings.filter(mapping => mapping.status === 'ACTIVE');
                                    
                                    return (
                                        <ClientCard
                                            key={client.id}
                                            client={client}
                                            clientMappings={clientMappings}
                                            activeMappings={activeMappings}
                                            isSelected={selectedClient?.id === client.id}
                                            onClick={handleClientSelect}
                                        />
                                    );
                                })}
                            </div>
                            
                            {getFilteredClients().length === 0 && (
                                <div className="session-mgmt-no-results">
                                    <p>검색 조건에 맞는 내담자가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </>
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
                                        data-bg-color={getStatusColor(selectedMapping.status)}
                                    >
                                        {getStatusText(selectedMapping.status)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="session-mgmt-mapping-actions">
                                <button 
                                    className="mg-btn mg-btn--primary"
                                    onClick={handleAddSession}
                                >
                                    회기 추가 요청
                                </button>
                                <button 
                                    className="mg-btn mg-btn--secondary"
                                    onClick={() => handleStatusChange(selectedMapping.id, 'INACTIVE')}
                                    disabled={selectedMapping.status === 'INACTIVE'}
                                >
                                    비활성화
                                </button>
                                <button 
                                    className="mg-btn mg-btn--warning"
                                    onClick={() => handleStatusChange(selectedMapping.id, 'SUSPENDED')}
                                    disabled={selectedMapping.status === 'SUSPENDED'}
                                >
                                    일시정지
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="session-mgmt-no-mapping">
                            <p>이 내담자에 대한 상담사 매칭이 없습니다.</p>
                            <button 
                                className="mg-btn mg-btn--primary"
                                onClick={handleAddSession}
                            >
                                회기 추가 요청
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 매칭 목록 */}
            <div className="session-mgmt-all-mappings-section">
                <SectionHeader
                    title={selectedClient ? `${selectedClient.name} 회기 관리 현황` : '전체 회기 관리 현황'}
                    subtitle={!selectedClient ? (() => {
                        const hasActiveFilters = mappingSearchTerm || mappingFilterStatus !== 'ALL';
                        const filteredCount = getFilteredMappings().length;
                        const totalCount = mappings.length;
                        
                        if (hasActiveFilters) {
                            return `검색 결과: ${filteredCount}개 (전체 ${totalCount}개 중)`;
                        } else {
                            return `최근 매칭 ${filteredCount}개 표시 (전체 ${totalCount}개 중)`;
                        }
                    })() : null}
                    icon="bi-diagram-3"
                    actions={selectedClient ? (
                        <button 
                            className="mg-btn mg-btn--small mg-btn--secondary"
                            onClick={() => setSelectedClient(null)}
                        >
                            전체 보기
                        </button>
                    ) : null}
                />
                
                <div className="session-mgmt-mappings-grid">
                            {getFilteredMappings().map(mapping => (
                                <MappingCard
                                    key={mapping.id}
                                    mapping={{
                                        ...mapping,
                                        clientName: mapping.clientName || '알 수 없음',
                                        consultantName: mapping.consultantName || '알 수 없음',
                                        totalSessions: mapping.totalSessions || 0,
                                        usedSessions: mapping.usedSessions || 0,
                                        remainingSessions: mapping.remainingSessions || 0,
                                        packageName: mapping.packageName || '알 수 없음'
                                    }}
                                    onClick={() => handleMappingSelect(mapping)}
                                    actions={
                                        <div className="mapping-actions">
                                            <button 
                                                className="action-btn primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddSession();
                                                }}
                                            >
                                                <i className="bi bi-plus-circle"></i>
                                                회기 추가
                                            </button>
                                            <button 
                                                className="action-btn secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(mapping.id, 'INACTIVE');
                                                }}
                                                disabled={mapping.status === 'INACTIVE'}
                                            >
                                                <i className="bi bi-pause-circle"></i>
                                                비활성화
                                            </button>
                                        </div>
                                    }
                                />
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
                                        // 해당 상담사와 내담자의 매칭 찾기 (ACTIVE 상태 중 가장 최근 것)
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
                                    className="session-mgmt-disabled-input"
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
                                className="mg-btn mg-btn--secondary"
                                onClick={() => setShowAddModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="mg-btn mg-btn--primary"
                                onClick={handleCreateSessionExtensionRequest}
                                disabled={loading}
                            >
                                {loading ? '요청 중...' : '요청 생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 회기 추가 요청 탭 내용 */}
            {activeTab === 'extensions' && (
                <div className="session-mgmt-extensions-section">
                    <div className="card card--medium" style={{ marginBottom: '32px' }}>
                        <div className="card__header">
                            <div className="card__title">회기 추가 요청 관리</div>
                            <div className="card__subtitle">회기 추가 요청의 입금 확인 및 관리자 승인을 처리할 수 있습니다.</div>
                        </div>
                    </div>

                    <div className="session-mgmt-extensions-grid">
                        {extensionRequests.map(request => {
                            // 데이터 구조 확인 및 안전한 접근
                            const consultantName = request.mapping?.consultant?.name || 
                                                 request.consultantName || 
                                                 '알 수 없음';
                            const clientName = request.mapping?.client?.name || 
                                             request.clientName || 
                                             '알 수 없음';
                            
                            console.log('🔍 요청 데이터 처리:', {
                                id: request.id,
                                consultantName,
                                clientName,
                                status: request.status,
                                mapping: request.mapping
                            });
                            
                            return (
                                <div key={request.id} className="card card--compact">
                                    <div className="card__header">
                                        <div className="card__title">요청 #{request.id}</div>
                                        <div className="card__subtitle">
                                            {consultantName} → {clientName}
                                        </div>
                                        <span 
                                            className="mg-btn mg-btn--small"
                                            style={{ 
                                                backgroundColor: getExtensionStatusColor(request.status),
                                                color: 'white',
                                                marginTop: '8px',
                                                float: 'right'
                                            }}
                                        >
                                            {getExtensionStatusText(request.status)}
                                        </span>
                                    </div>
                                
                                    <div className="card__body">
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
                                
                                    <div className="card__footer">
                                        <div className="card__actions">
                                            {request.status === 'PENDING' && (
                                                <button 
                                                    className="mg-btn mg-btn--small mg-btn--primary"
                                                    onClick={() => handlePaymentConfirm(request)}
                                                >
                                                    입금 확인
                                                </button>
                                            )}
                                    
                                            {request.status === 'PAYMENT_CONFIRMED' && (
                                                <>
                                                    <button 
                                                        className="mg-btn mg-btn--small mg-btn--success"
                                                        onClick={() => handleAdminApproval(request)}
                                                    >
                                                        승인
                                                    </button>
                                                    <button 
                                                        className="mg-btn mg-btn--small mg-btn--danger"
                                                        onClick={() => handleRejectRequest(request.id)}
                                                    >
                                                        거부
                                                    </button>
                                                </>
                                            )}
                                            
                                            {request.status === 'ADMIN_APPROVED' && (
                                                <button 
                                                    className="mg-btn mg-btn--small mg-btn--warning"
                                                    onClick={() => handleCompleteRequest(request.id)}
                                                >
                                                    요청 완료
                                                </button>
                                            )}
                                            
                                            {request.status === 'REJECTED' && (
                                                <span className="mg-btn mg-btn--small mg-btn--secondary" style={{ cursor: 'default' }}>
                                                    거부됨
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                            {request.status === 'COMPLETED' && (
                                                <span className="mg-btn mg-btn--small mg-btn--success" style={{ cursor: 'default' }}>
                                                    완료됨
                                                </span>
                                            )}
                            </div>
                            );
                        })}
                    </div>

                    {extensionRequests.length === 0 && (
                        <div className="session-mgmt-no-results">
                            <p>회기 추가 요청이 없습니다.</p>
                            <p className="session-mgmt-empty-hint">
                                회기 추가 요청을 생성하면 여기에 표시됩니다.
                            </p>
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
                                className="mg-btn mg-btn--secondary"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="mg-btn mg-btn--primary"
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
                                className="mg-btn mg-btn--secondary"
                                onClick={() => setShowApprovalModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="mg-btn mg-btn--success"
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
                <LoadingSpinner 
                    text="데이터를 불러오는 중..." 
                    variant="default"
                    size="large"
                    fullscreen={true}
                />
            )}
        </SimpleLayout>
    );
};

export default SessionManagement;
