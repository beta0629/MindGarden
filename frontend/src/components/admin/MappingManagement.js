import React, { useState, useEffect } from 'react';
import Button from '../ui/Button/Button';
import { useNavigate } from 'react-router-dom';
import { Link2, Plus } from 'lucide-react';
import SimpleLayout from '../layout/SimpleLayout';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import { API_BASE_URL } from '../../constants/api';
import notificationManager from '../../utils/notification';
import { useSession } from '../../contexts/SessionContext';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { 
    MAPPING_API_ENDPOINTS, 
    MAPPING_MESSAGES,
    DEFAULT_MAPPING_CONFIG 
} from '../../constants/mapping';
import MappingCreationModal from './MappingCreationModal';
import MappingCard from './mapping/MappingCard';
import MappingFilters from './mapping/MappingFilters';
import MappingStats from './mapping/MappingStats';
import ConsultantTransferModal from './mapping/ConsultantTransferModal';
import ConsultantTransferHistory from './mapping/ConsultantTransferHistory';
import PartialRefundModal from './mapping/PartialRefundModal';
import PaymentConfirmationModal from './PaymentConfirmationModal';
import MappingDetailModal from './mapping/MappingDetailModal';
import MappingEditModal from './MappingEditModal';
import '../../styles/unified-design-tokens.css';
import './MappingManagement.css';

/**
 * 매칭 관리 페이지 컴포넌트
/**
 * - 매칭 목록 조회 및 관리
/**
 * - 매칭 상태 변경 (승인, 거부 등)
/**
 * - 매칭 생성, 수정, 삭제
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const MappingManagement = () => {
    const navigate = useNavigate();
    const { user } = useSession();
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedMapping, setSelectedMapping] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showTransferHistory, setShowTransferHistory] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingMappings, setPendingMappings] = useState([]);
    const [mappingStatusInfo, setMappingStatusInfo] = useState({});
    
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundMapping, setRefundMapping] = useState(null);
    const [refundReason, setRefundReason] = useState('');
    
    const [showPartialRefundModal, setShowPartialRefundModal] = useState(false);
    const [partialRefundMapping, setPartialRefundMapping] = useState(null);
    
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailMapping, setDetailMapping] = useState(null);
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [editMapping, setEditMapping] = useState(null);
    const [isLoadingMappings, setIsLoadingMappings] = useState(false);

    const loadMappings = async() => {
        if (isLoadingMappings) {
            return;
        }
        
        setIsLoadingMappings(true);
        setLoading(true);
        try {
            // 표준화 2025-12-08: 올바른 API 경로 사용 (/api/v1/admin/mappings)
            const response = await apiGet('/api/v1/admin/mappings');
            
            if (response && response.mappings) {
                setMappings(response.mappings);
            } else if (response && Array.isArray(response)) {
                setMappings(response);
            } else {
                setMappings([]);
            }
        } catch (error) {
            console.error('❌ 매칭 목록 로드 실패:', error);
            setMappings([]);
            notificationManager.error('매칭 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setIsLoadingMappings(false);
        }
    };

    useEffect(() => {
        loadMappings();
        loadMappingStatusInfo();
    }, []);

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const getStatusKoreanName = (status) => {
        const statusMap = {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'ACTIVE': '활성',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'INACTIVE': '비활성',
            'PENDING_PAYMENT': '결제 대기',
            'PAYMENT_CONFIRMED': '결제 확인',
            'TERMINATED': '종료됨',
            'SESSIONS_EXHAUSTED': '회기 소진',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'SUSPENDED': '일시정지'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'ACTIVE': 'var(--color-success)',           // 녹색 - 활성
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'INACTIVE': 'var(--color-text-secondary)',  // 회색 - 비활성
            'PENDING_PAYMENT': 'var(--color-warning)',  // 주황색 - 결제 대기
            'PAYMENT_CONFIRMED': 'var(--color-info)',   // 파란색 - 결제 확인
            'TERMINATED': 'var(--color-danger)',        // 빨간색 - 종료됨
            'SESSIONS_EXHAUSTED': 'var(--color-warning)', // 주황색 - 회기 소진
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'SUSPENDED': 'var(--color-text-secondary)'  // 회색 - 일시정지
        };
        return colorMap[status] || 'var(--color-primary)';
    };

    const getStatusIcon = (status) => {
        const iconMap = {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'ACTIVE': '✅',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'INACTIVE': '⏸️',
            'PENDING_PAYMENT': '⏳',
            'PAYMENT_CONFIRMED': '💰',
            'TERMINATED': '🚫',  // X 대신 금지 표시 사용
            'SESSIONS_EXHAUSTED': '⚠️',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'SUSPENDED': '⏸️'
        };
        return iconMap[status] || '📋';
    };

    const loadMappingStatusInfo = async() => {
        try {
            // 표준화 2025-12-08: 올바른 API 경로 사용 (/groups/{codeGroup})
            const response = await apiGet('/api/v1/common-codes/groups/MAPPING_STATUS');
            if (response && response.length > 0) {
                const statusInfoMap = {};
                
                response.forEach(code => {
                    statusInfoMap[code.codeValue] = {
                        label: code.koreanName || code.codeLabel,
                        color: code.colorCode || 'var(--mg-secondary-500)',
                        icon: code.icon || '📋'
                    };
                });
                
                const statusMapping = {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'ACTIVE': 'ACTIVE_MAPPING',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'INACTIVE': 'INACTIVE_MAPPING',
                    'TERMINATED': 'TERMINATED_MAPPING',
                    'SESSIONS_EXHAUSTED': 'SESSIONS_EXHAUSTED_MAPPING'
                };
                
                Object.entries(statusMapping).forEach(([actualStatus, apiStatus]) => {
                    if (statusInfoMap[apiStatus]) {
                        statusInfoMap[actualStatus] = statusInfoMap[apiStatus];
                    }
                });
                
                setMappingStatusInfo(statusInfoMap);
                console.log('✅ 매칭 상태 정보 로드 완료:', statusInfoMap);
                console.log('✅ 매칭 상태 정보 키들:', Object.keys(statusInfoMap));
            } else {
                setMappingStatusInfo({
                    'PENDING_PAYMENT': { label: '입금대기', color: 'var(--mg-warning-500)', icon: '⏳' },
                    'PAYMENT_CONFIRMED': { label: '입금확인', color: 'var(--mg-info-500)', icon: '💰' },
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'ACTIVE': { label: '활성', color: 'var(--mg-success-500)', icon: '✅' },
                    'TERMINATED': { label: '종료', color: 'var(--mg-error-500)', icon: '❌' },
                    'SESSIONS_EXHAUSTED': { label: '회기소진', color: '#6f42c1', icon: '🔚' },
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'INACTIVE': { label: '비활성', color: 'var(--mg-secondary-500)', icon: '⚪' },
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'SUSPENDED': { label: '일시정지', color: '#fd7e14', icon: '⏸️' },
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                    'CANCELLED': { label: '취소', color: 'var(--mg-error-500)', icon: '🚫' }
                });
            }
        } catch (error) {
            console.error('매칭 상태 정보 로드 오류:', error);
            setMappingStatusInfo({
                'PENDING_PAYMENT': { label: '입금대기', color: 'var(--mg-warning-500)', icon: '⏳' },
                'PAYMENT_CONFIRMED': { label: '입금확인', color: 'var(--mg-info-500)', icon: '💰' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                'ACTIVE': { label: '활성', color: 'var(--mg-success-500)', icon: '✅' },
                'TERMINATED': { label: '종료', color: 'var(--mg-error-500)', icon: '❌' },
                'SESSIONS_EXHAUSTED': { label: '회기소진', color: '#6f42c1', icon: '🔚' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                'INACTIVE': { label: '비활성', color: 'var(--mg-secondary-500)', icon: '⚪' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                'SUSPENDED': { label: '일시정지', color: '#fd7e14', icon: '⏸️' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                'CANCELLED': { label: '취소', color: 'var(--mg-error-500)', icon: '🚫' }
            });
        }
    };


    const handleApproveMapping = async (mappingId) => {
        try {
            const response = await apiPost(`/api/v1/admin/mappings/${mappingId}/approve`, {
                adminName: user?.name || user?.userId || '관리자'
            });
            
            // apiPost는 ApiResponse의 data만 반환하므로, response가 존재하면 성공
            if (response) {
                notificationManager.success('매칭이 승인되었습니다.');
                loadMappings();
            } else {
                notificationManager.error('매칭 승인에 실패했습니다.');
            }
        } catch (error) {
            console.error('매칭 승인 실패:', error);
            notificationManager.error(error.message || '매칭 승인에 실패했습니다.');
        }
    };

    const handleConfirmPayment = async (mappingId) => {
        loadMappings();
    };

    const handleConfirmDeposit = async (mappingId) => {
        loadMappings();
    };

    const handleRejectMapping = async (mappingId) => {
        try {
            const response = await apiPost(`/api/v1/admin/mappings/${mappingId}/reject`, {
                reason: '관리자 거부'
            });
            
            // apiPost는 ApiResponse의 data만 반환하므로, response가 존재하면 성공
            if (response) {
                notificationManager.success('매칭이 거부되었습니다.');
                loadMappings();
            } else {
                notificationManager.error('매칭 거부에 실패했습니다.');
            }
        } catch (error) {
            console.error('매칭 거부 실패:', error);
            notificationManager.error(error.message || '매칭 거부에 실패했습니다.');
        }
    };

    const handleMappingCreated = () => {
        setShowCreateModal(false);
        loadMappings();
    };

    const handleTransferConsultant = (mapping) => {
        setSelectedMapping(mapping);
        setShowTransferModal(true);
    };

    const handleTransferCompleted = (newMapping) => {
        setShowTransferModal(false);
        setSelectedMapping(null);
        loadMappings();
        notificationManager.success('상담사가 성공적으로 변경되었습니다.');
    };

    const handleViewTransferHistory = (clientId) => {
        setSelectedClientId(clientId);
        setShowTransferHistory(true);
    };

    const handleCloseTransferHistory = () => {
        setShowTransferHistory(false);
        setSelectedClientId(null);
    };

    const handleRefundMapping = (mapping) => {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        if (mapping.status !== 'ACTIVE') {
            notificationManager.warning('활성 상태의 매칭만 환불 처리할 수 있습니다.');
            return;
        }
        
        if (mapping.remainingSessions <= 0) {
            notificationManager.warning('남은 회기가 없는 매칭은 환불 처리할 수 없습니다.');
            return;
        }

        setPartialRefundMapping(mapping);
        setShowPartialRefundModal(true);
    };

    const handleFullRefundMapping = (mapping) => {
        setRefundMapping(mapping);
        setRefundReason('');
        setShowRefundModal(true);
    };
    
    const handleViewMapping = (mapping) => {
        setDetailMapping(mapping);
        setShowDetailModal(true);
    };

    const handleCloseRefundModal = () => {
        setShowRefundModal(false);
        setRefundMapping(null);
        setRefundReason('');
    };

    const handleRefundProcess = async() => {
        if (!refundReason.trim()) {
            notificationManager.warning('⚠️ 환불 사유를 반드시 입력해주세요.');
            return;
        }

        if (refundReason.trim().length < 5) {
            notificationManager.warning('⚠️ 환불 사유를 5자 이상 상세히 입력해주세요.');
            return;
        }

        const confirmMessage = `${ refundMapping.clientName }과의 매칭을 환불 처리하시겠습니까?\n\n환불 회기: ${ refundMapping.remainingSessions }회\n환불 사유: ${ refundReason.trim() }\n\n이 작업은 되돌릴 수 없습니다.`;
        const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(confirmMessage, resolve);
    });
    if (!confirmed) {
        return;
    }

        try {
            setLoading(true);

            // 표준화 2025-12-08: /api/v1/admin 경로로 통일
            const response = await apiPost(`/api/v1/admin/mappings/${refundMapping.id}/terminate`, {
                reason: refundReason.trim()
            });

            if (response.success) {
                notificationManager.success('매칭이 환불 처리되었습니다. 관련 스케줄도 자동으로 취소됩니다.');
                handleCloseRefundModal();
                loadMappings(); // 데이터 새로고침
                
                window.dispatchEvent(new CustomEvent('refundProcessed', {
                    detail: {
                        mappingId: refundMapping.id,
                        clientName: refundMapping.clientName,
                        consultantName: refundMapping.consultantName,
                        reason: refundReason.trim()
                    }
                }));
            } else {
                notificationManager.error(response.message || '환불 처리에 실패했습니다.');
            }

        } catch (error) {
            console.error('환불 처리 실패:', error);
            notificationManager.error('환불 처리에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMapping = (mapping) => {
        setEditMapping(mapping);
        setShowEditModal(true);
    };

    const handleEditSuccess = (updatedData) => {
        loadMappings();
        setShowEditModal(false);
        setEditMapping(null);
    };

    const handleDeleteMapping = async (mapping) => { const confirmMessage = `${mapping.clientName }과의 매칭을 취소하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
        const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(confirmMessage, resolve);
    });
    if (!confirmed) {
        return;
    }

        try {
            setLoading(true);
            
            // 표준화 2025-12-08: /api/v1/admin 경로로 통일
            const response = await fetch(`/api/v1/admin/mappings/${mapping.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'},
                credentials: 'include'  // 세션 쿠키 포함
            });

            const result = await response.json();

            if (result.success) {
                notificationManager.success('매칭이 성공적으로 취소되었습니다.');
                loadMappings(); // 데이터 새로고침
            } else {
                notificationManager.error(result.message || '매칭 취소에 실패했습니다.');
            }

        } catch (error) {
            console.error('매칭 삭제 실패:', error);
            notificationManager.error('매칭 취소에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (status) => {
        setFilterStatus(status);
    };

    const handleSearchChange = (term) => {
        setSearchTerm(term);
    };

    const handleResetFilters = () => {
        setFilterStatus('ALL');
        setSearchTerm('');
    };

    const handleStatCardClick = (stat) => {
        switch (stat.action) {
            case 'payment':
                if (stat.value > 0) {
                    const pendingMappings = mappings.filter(mapping => 
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                        mapping.status === 'PENDING' || mapping.paymentStatus === 'PENDING'
                    );
                    setPendingMappings(pendingMappings);
                    setShowPaymentModal(true);
                    notificationManager.info(`${stat.label} 매칭의 결제 확인을 진행합니다.`);
                } else {
                    notificationManager.info('결제 대기 중인 매칭이 없습니다.');
                }
                break;
            case 'view':
                setFilterStatus(stat.id);
                notificationManager.info(`${ stat.label } 매칭을 필터링합니다.`);
                break;
            case 'view_all':
                setFilterStatus('ALL');
                notificationManager.info('전체 매칭을 표시합니다.');
                break;
        }
    };

    const handlePaymentConfirmed = (updatedMappings) => {
        loadMappings();
        setShowPaymentModal(false);
        setPendingMappings([]);
    };

    const handlePaymentModalClose = () => {
        setShowPaymentModal(false);
        setPendingMappings([]);
    };

    const filteredMappings = mappings
        .filter(mapping => {
            const matchesStatus = filterStatus === 'ALL' || mapping.status === filterStatus;
            const matchesSearch = searchTerm === '' || 
                (mapping.consultantName && mapping.consultantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (mapping.clientName && mapping.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (mapping.packageName && mapping.packageName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => {
            return b.id - a.id;
        });

    console.log('🔍 렌더링 체크 - loading:', loading, 'mappings:', mappings.length);
    
    if (loading) {
        console.log('⏳ 로딩 상태 - UnifiedLoading 표시');
        return(
            <SimpleLayout title="매칭 관리">
                <UnifiedLoading 
                    type="page"
                    text="데이터를 불러오는 중..."
                    variant="pulse"
                />
            </SimpleLayout>
        );
    }

    return(
        <SimpleLayout>
            <div className="mapping-management">
                <div className="mapping-header">
                    <div className="header-content">
                        <h1>🔗 매칭 관리</h1>
                        <p>상담사와 내담자 간의 매칭을 관리합니다.</p>
                    </div>
                    <button 
                        className="mg-v2-button mg-v2-button-primary"
                        onClick={ () => setShowCreateModal(true) }
                    >
                        <Plus size={ 20 } />
                        새 매칭 생성
                    </button>
                </div>

                <MappingFilters
                    filterStatus={ filterStatus }
                    searchTerm={ searchTerm }
                    onStatusChange={ handleStatusChange }
                    onSearchChange={ handleSearchChange }
                    onReset={ handleResetFilters }
                />

                <MappingStats 
                    mappings={ mappings } 
                    onStatCardClick={ handleStatCardClick }
                />

                <div className="mapping-list">
                {filteredMappings.length === 0 ? (
                    <div className="no-mappings">
                        <div className="no-mappings-icon">🔗</div>
                        <h3>{MAPPING_MESSAGES.NO_MAPPINGS}</h3>
                        <p>{ MAPPING_MESSAGES.NO_MAPPINGS_DESC }</p>
                        <button 
                            className="mg-v2-button mg-v2-button-primary"
                            onClick={ () => setShowCreateModal(true) }
                        >
                            <Plus size={ 20 } />
                            매칭 생성하기
                        </button>
                    </div>
                ) : (
                    <div className="mg-v2-cards-grid">
                        {filteredMappings.map(mapping => (
                            <MappingCard
                                key={mapping.id}
                                mapping={ mapping }
                                statusInfo={mappingStatusInfo[mapping.status] || {
                                    label: getStatusKoreanName(mapping.status),
                                    color: getStatusColor(mapping.status),
                                    icon: getStatusIcon(mapping.status)
                                }}
                                onView={ () => handleViewMapping(mapping) }
                                onEdit={ () => handleEditMapping(mapping) }
                                onRefund={ () => handleRefundMapping(mapping) }
                                onConfirmPayment={ () => handleConfirmPayment(mapping) }
                                onConfirmDeposit={ () => handleConfirmDeposit(mapping) }
                                onApprove={ () => handleApproveMapping(mapping.id) }
                            />
                        ))}
                    </div>
                )}
            </div>

            { /* 매칭 생성 모달 */ }
            <MappingCreationModal
                isOpen={ showCreateModal }
                onClose={ () => setShowCreateModal(false) }
                onMappingCreated={ handleMappingCreated }
            />

            { /* 상담사 변경 모달 */ }
            <ConsultantTransferModal
                isOpen={ showTransferModal }
                onClose={ () => setShowTransferModal(false) }
                currentMapping={ selectedMapping }
                onTransfer={ handleTransferCompleted }
            />

            { /* 상담사 변경 이력 모달 */ }
            <ConsultantTransferHistory
                isOpen={ showTransferHistory }
                onClose={ handleCloseTransferHistory }
                clientId={ selectedClientId }
            />

            { /* 결제 확인 모달 */ }
            <PaymentConfirmationModal
                isOpen={ showPaymentModal }
                onClose={ handlePaymentModalClose }
                mappings={ pendingMappings }
                onPaymentConfirmed={ handlePaymentConfirmed }
            />

            { /* 부분 환불 모달 */ }
            <PartialRefundModal
                mapping={ partialRefundMapping }
                isOpen={ showPartialRefundModal }
                onClose={() => {
                    setShowPartialRefundModal(false);
                    setPartialRefundMapping(null);
                }}
                onSuccess={() => {
                    loadMappings(); // 데이터 새로고침
                }}
            />

            { /* 상세보기 모달 */ }
            <MappingDetailModal
                mapping={ detailMapping }
                isOpen={ showDetailModal }
                onClose={() => {
                    setShowDetailModal(false);
                    setDetailMapping(null);
                }}
            />

            { /* 환불 처리 모달 */ }
            {showRefundModal && refundMapping && (
                <div className="mapping-refund-modal-overlay">
                    <div className="mapping-refund-modal">
                        {/* 모달 헤더 */}
                        <div className="mapping-refund-modal-header">
                            <div className="mapping-refund-modal-header-content">
                                <h3 className="mapping-refund-modal-title">
                                    🔄 매칭 환불 처리
                                </h3>
                                <button
                                    onClick={ handleCloseRefundModal }
                                    className="mapping-refund-modal-close"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        { /* 모달 내용 */ }
                        <div className="mapping-refund-modal-body">
                            { /* 매칭 정보 */ }
                            <div className="mapping-refund-info">
                                <h4 className="mapping-refund-info-title">
                                    환불 대상 매칭 정보
                                </h4>
                                <div className="mapping-refund-info-content">
                                    <p><strong>상담사:</strong> { refundMapping.consultantName }</p>
                                    <p><strong>내담자:</strong> { refundMapping.clientName }</p>
                                    <p><strong>패키지:</strong> { refundMapping.packageName }</p>
                                    <p><strong>총 회기:</strong> { refundMapping.totalSessions }회</p>
                                    <p><strong>사용 회기:</strong> { refundMapping.usedSessions }회</p>
                                    <p className="mapping-refund-info-sessions">
                                        <strong>환불 회기:</strong> { refundMapping.remainingSessions }회
                                    </p>
                                </div>
                            </div>

                            { /* 환불 사유 입력 */ }
                            <div className="mapping-refund-reason">
                                <h4 className="mapping-refund-reason-title">
                                    환불 사유 <span className="mapping-refund-required">*</span>
                                </h4>
                                <textarea
                                    value={ refundReason }
                                    onChange={ (e) => setRefundReason(e.target.value) }
                                    placeholder="환불 사유를 상세히 입력해주세요..."
                                    rows={ 4 }
                                    className={ `mapping-refund-reason-input ${!refundReason.trim() ? 'mapping-refund-reason-input--error' : '' }`}
                                />
                                {!refundReason.trim() && (
                                    <div className="mapping-refund-reason-error">
                                        ⚠️ 환불 사유를 반드시 입력해주세요.
                                    </div>
                                )}
                            </div>
                        </div>

                        { /* 모달 푸터 */ }
                        <div className="mapping-refund-modal-footer">
                            <Button
                                variant="secondary"
                                onClick={handleCloseRefundModal}
                                disabled={loading}
                                preventDoubleClick={true}
                            >
                                취소
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleRefundProcess}
                                disabled={loading || !refundReason.trim()}
                                preventDoubleClick={true}
                                loading={loading}
                                loadingText="처리 중..."
                            >
                                환불 처리
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            { /* 매칭 수정 모달 */ }
            <MappingEditModal
                isOpen={ showEditModal }
                onClose={() => {
                    setShowEditModal(false);
                    setEditMapping(null);
                }}
                mapping={ editMapping }
                onSuccess={ handleEditSuccess }
            />
            </div>
        </SimpleLayout>
    );
};

export default MappingManagement;