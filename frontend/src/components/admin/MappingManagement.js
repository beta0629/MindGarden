import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleLayout from '../layout/SimpleLayout';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { 
    MAPPING_API_ENDPOINTS, 
    MAPPING_MESSAGES,
    DEFAULT_MAPPING_CONFIG 
} from '../../constants/mapping';
import MappingCreationModal from './MappingCreationModal';
import MappingCard from './mapping/MappingCard';
import MappingFilters from './mapping/MappingFilters';
import MappingStats from './mapping/MappingStats';
import './MappingManagement.css';

/**
 * 매핑 관리 페이지 컴포넌트
 * - 매핑 목록 조회 및 관리
 * - 매핑 상태 변경 (승인, 거부 등)
 * - 매핑 생성, 수정, 삭제
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingManagement = () => {
    const navigate = useNavigate();
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedMapping, setSelectedMapping] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // 데이터 로드
    useEffect(() => {
        loadMappings();
    }, []);

    const loadMappings = async () => {
        setLoading(true);
        try {
            // 실제 API 호출 시도
            const response = await apiGet(MAPPING_API_ENDPOINTS.LIST);
            if (response.success) {
                setMappings(response.data || []);
            } else {
                // API 실패 시 테스트 데이터 사용
                console.log('API 실패, 테스트 데이터 사용');
                setMappings(getTestMappings());
            }
        } catch (error) {
            console.error('매핑 목록 로드 실패:', error);
            // 오류 시 테스트 데이터 사용
            console.log('오류 발생, 테스트 데이터 사용');
            setMappings(getTestMappings());
        } finally {
            setLoading(false);
        }
    };

    // 테스트용 매핑 데이터
    const getTestMappings = () => {
        return [
            {
                id: 1,
                consultant: { id: 1, name: '김상담', email: 'consultant1@mindgarden.com' },
                client: { id: 1, name: '이내담', email: 'client1@mindgarden.com' },
                status: 'ACTIVE',
                paymentStatus: 'APPROVED',
                totalSessions: DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
                remainingSessions: 7,
                usedSessions: 3,
                packageName: DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,
                packagePrice: DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
                startDate: '2024-12-01T00:00:00',
                notes: '정기 상담 진행 중'
            },
            {
                id: 2,
                consultant: { id: 2, name: '박상담', email: 'consultant2@mindgarden.com' },
                client: { id: 2, name: '최내담', email: 'client2@mindgarden.com' },
                status: 'PENDING_PAYMENT',
                paymentStatus: 'PENDING',
                totalSessions: 5,
                remainingSessions: 5,
                usedSessions: 0,
                packageName: '단기 상담 패키지',
                packagePrice: 250000,
                startDate: '2024-12-15T00:00:00',
                notes: '신규 매핑, 결제 대기 중'
            },
            {
                id: 3,
                consultant: { id: 1, name: '김상담', email: 'consultant1@mindgarden.com' },
                client: { id: 3, name: '정내담', email: 'client3@mindgarden.com' },
                status: 'SESSIONS_EXHAUSTED',
                paymentStatus: 'APPROVED',
                totalSessions: 8,
                remainingSessions: 0,
                usedSessions: 8,
                packageName: '중기 상담 패키지',
                packagePrice: 400000,
                startDate: '2024-11-01T00:00:00',
                notes: '상담 완료, 회기 소진'
            }
        ];
    };

    // 매핑 승인
    const handleApproveMapping = async (mappingId) => {
        // 테스트용 알림
        console.log('승인 버튼 클릭됨 - 알림 시도');
        notificationManager.success('테스트 알림: 매핑 승인 버튼 클릭됨');
        console.log('알림 호출 완료');
        
        try {
            const response = await apiPost(`/api/admin/mappings/${mappingId}/approve`, {
                adminName: '관리자'
            });
            
            if (response.success) {
                notificationManager.success('매핑이 승인되었습니다.');
                loadMappings();
            } else {
                notificationManager.error('매핑 승인에 실패했습니다.');
            }
        } catch (error) {
            console.error('매핑 승인 실패:', error);
            notificationManager.error('매핑 승인에 실패했습니다.');
        }
    };

    // 입금 확인
    const handleConfirmPayment = async (mappingId) => {
        try {
            const response = await apiPost(`/api/admin/mappings/${mappingId}/confirm-payment`, {
                paymentMethod: '신용카드',
                paymentReference: `PAY-${Date.now()}`,
                paymentAmount: 300000 // 기본 패키지 가격
            });
            
            if (response.success) {
                notificationManager.success('입금이 확인되었습니다.');
                loadMappings();
            } else {
                notificationManager.error('입금 확인에 실패했습니다.');
            }
        } catch (error) {
            console.error('입금 확인 실패:', error);
            notificationManager.error('입금 확인에 실패했습니다.');
        }
    };

    // 매핑 거부
    const handleRejectMapping = async (mappingId) => {
        // 테스트용 알림
        notificationManager.success('테스트 알림: 매핑 거부 버튼 클릭됨');
        
        try {
            const response = await apiPost(`/api/admin/mappings/${mappingId}/reject`, {
                reason: '관리자 거부'
            });
            
            if (response.success) {
                notificationManager.success('매핑이 거부되었습니다.');
                loadMappings();
            } else {
                notificationManager.error('매핑 거부에 실패했습니다.');
            }
        } catch (error) {
            console.error('매핑 거부 실패:', error);
            notificationManager.error('매핑 거부에 실패했습니다.');
        }
    };

    // 매핑 생성 완료 핸들러
    const handleMappingCreated = () => {
        setShowCreateModal(false);
        loadMappings();
    };

    // 필터 핸들러들
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

    // 통계 카드 클릭 핸들러
    const handleStatCardClick = (stat) => {
        console.log('통계 카드 클릭:', stat);
        
        switch (stat.action) {
            case 'payment':
                // 결제 확인 모달 열기
                if (stat.value > 0) {
                    notificationManager.info(`${stat.label} 매핑의 결제 확인을 진행합니다.`);
                    // TODO: 결제 확인 모달 구현
                } else {
                    notificationManager.info('결제 대기 중인 매핑이 없습니다.');
                }
                break;
            case 'view':
                // 해당 상태의 매핑만 필터링
                setFilterStatus(stat.id);
                notificationManager.info(`${stat.label} 매핑을 필터링합니다.`);
                break;
            case 'view_all':
                // 전체 매핑 표시
                setFilterStatus('ALL');
                notificationManager.info('전체 매핑을 표시합니다.');
                break;
            default:
                console.log('알 수 없는 액션:', stat.action);
        }
    };

    // 필터링된 매핑 목록
    const filteredMappings = mappings.filter(mapping => {
        const matchesStatus = filterStatus === 'ALL' || mapping.status === filterStatus;
        const matchesSearch = searchTerm === '' || 
            mapping.consultant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

            if (loading) {
        return (
            <SimpleLayout>
                <div className="mapping-management">
                    <div className="loading-container">
                        <div className="loading-spinner">{MAPPING_MESSAGES.LOADING}</div>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout>
            <div className="mapping-management">
            <div className="mapping-header">
                <div className="header-content">
                    <h1>🔗 매핑 관리</h1>
                    <p>상담사와 내담자 간의 매핑을 관리합니다.</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <i className="bi bi-plus-circle"></i> 새 매핑 생성
                </button>
            </div>

            <MappingFilters
                filterStatus={filterStatus}
                searchTerm={searchTerm}
                onStatusChange={handleStatusChange}
                onSearchChange={handleSearchChange}
                onReset={handleResetFilters}
            />

            <MappingStats 
                mappings={mappings} 
                onStatCardClick={handleStatCardClick}
            />

            <div className="mapping-list">
                {filteredMappings.length === 0 ? (
                    <div className="no-mappings">
                        <div className="no-mappings-icon">🔗</div>
                        <h3>{MAPPING_MESSAGES.NO_MAPPINGS}</h3>
                        <p>{MAPPING_MESSAGES.NO_MAPPINGS_DESC}</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            매핑 생성하기
                        </button>
                    </div>
                ) : (
                    <div className="mapping-grid">
                        {filteredMappings.map(mapping => (
                            <MappingCard
                                key={mapping.id}
                                mapping={mapping}
                                onApprove={handleApproveMapping}
                                onReject={handleRejectMapping}
                                onConfirmPayment={handleConfirmPayment}
                                onEdit={(mapping) => {
                                    notificationManager.info('매핑 수정 기능은 준비 중입니다.');
                                }}
                                onView={(mapping) => {
                                    notificationManager.info('매핑 상세보기 기능은 준비 중입니다.');
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 매핑 생성 모달 */}
            <MappingCreationModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onMappingCreated={handleMappingCreated}
            />
            </div>
        </SimpleLayout>
    );
};

export default MappingManagement;