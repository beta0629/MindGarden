import React, { useState, useEffect, useCallback } from 'react';
import { FaUser } from 'react-icons/fa';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import { 
    getUserStatusKoreanName,
    getUserGradeKoreanName,
    getUserGradeIcon,
    getStatusColor
} from '../../utils/codeHelper';
import notificationManager from '../../utils/notification';
import { withFormSubmit } from '../../utils/formSubmitWrapper';
import SimpleLayout from '../layout/SimpleLayout';
import './ClientComprehensiveManagement.css';

/**
 * 내담자 종합관리 컴포넌트
 * - 내담자 정보 종합 조회
 * - 상담 이력 관리
 * - 회기 현황 관리
 * - 상담사 매칭 관리
 * - 통계 및 분석
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ClientComprehensiveManagement = () => {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [mainTab, setMainTab] = useState('comprehensive');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [userStatusOptions, setUserStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    // 모달 상태
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    
    // 환불 처리 관련 상태
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundClient, setRefundClient] = useState(null);
    const [refundMappings, setRefundMappings] = useState([]);
    const [selectedMappings, setSelectedMappings] = useState([]);
    const [refundReason, setRefundReason] = useState('');

    // 사용자 상태 코드 로드
    const loadUserStatusCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/common-codes/group/STATUS');
            if (response && response.length > 0) {
                setUserStatusOptions(response.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel,
                    icon: code.icon,
                    color: code.colorCode,
                    description: code.description
                })));
            }
        } catch (error) {
            console.error('사용자 상태 코드 로드 실패:', error);
            // 실패 시 기본값 설정
            setUserStatusOptions([
                { value: 'ACTIVE', label: '활성', icon: '🟢', color: '#10b981', description: '활성 사용자' },
                { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#6b7280', description: '비활성 사용자' },
                { value: 'SUSPENDED', label: '일시정지', icon: '⏸️', color: '#f59e0b', description: '일시정지된 사용자' },
                { value: 'COMPLETED', label: '완료', icon: '✅', color: '#8b5cf6', description: '완료된 사용자' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    useEffect(() => {
        loadAllData();
        loadUserStatusCodes();
    }, [loadUserStatusCodes]);

    // 디버깅을 위한 로딩 상태 강제 해제
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.log('로딩 상태가 너무 오래 지속됨, 강제 해제');
                setLoading(false);
            }
        }, 5000); // 5초 후 강제 해제

        return () => clearTimeout(timer);
    }, [loading]);

    /**
     * 모든 데이터 로드
     */
    const loadAllData = async () => {
        console.log('🔄 데이터 로드 시작');
        setLoading(true);
        try {
            await Promise.all([
                loadClients(),
                loadConsultants(),
                loadMappings(),
                loadConsultations()
            ]);
            console.log('✅ 데이터 로드 완료');
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
            notificationManager.error('데이터 로드에 실패했습니다.');
        } finally {
            console.log('🏁 로딩 상태 해제');
            setLoading(false);
        }
    };

    /**
     * 내담자 목록 로드
     */
    const loadClients = async () => {
        try {
            console.log('🔍 통합 내담자 데이터 로드 시작');
            
            // 통합 내담자 데이터 API 사용 (매칭 정보 포함)
            const response = await apiGet('/api/admin/clients/with-mapping-info');
            console.log('📊 통합 내담자 데이터 응답:', response);
            
            if (response.success) {
                let clientsData = response.data || [];
                console.log('👥 통합 내담자 데이터:', clientsData.length, '명');
                
                // 각 내담자 데이터를 상세히 로깅
                clientsData.forEach((client, index) => {
                    console.log(`👤 내담자 ${index + 1}:`, {
                        id: client.id,
                        name: client.name,
                        email: client.email,
                        phone: client.phone,
                        role: client.role,
                        grade: client.grade,
                        isActive: client.isActive,
                        createdAt: client.createdAt
                    });
                    
                    // 전화번호가 제대로 있는지 확인
                    if (client.phone && client.phone !== '전화번호 없음' && client.phone !== '-') {
                        console.log(`✅ 전화번호 확인됨: ${client.name} - ${client.phone}`);
                    } else {
                        console.log(`❌ 전화번호 없음: ${client.name} - ${client.phone}`);
                    }
                });
                
                setClients(clientsData);
            } else {
                console.error('❌ 내담자 목록 로드 실패:', response.message);
            }
        } catch (error) {
            console.error('❌ 내담자 목록 로드 오류:', error);
        }
    };

    /**
     * 상담사 목록 로드
     */
    const loadConsultants = async () => {
        try {
            console.log('🔍 상담사 목록 로드 시작');
            
            // /api/admin/users API를 사용하여 모든 사용자 조회 후 CONSULTANT 필터링
            const response = await apiGet('/api/admin/users');
            console.log('📊 /api/admin/users 응답:', response);
            
            if (response.success) {
                let consultantsData = response.data || [];
                
                // CONSULTANT 역할만 필터링
                if (Array.isArray(consultantsData) && consultantsData.length > 0) {
                    consultantsData = consultantsData.filter(user => user.role === 'CONSULTANT');
                }
                
                console.log('👥 필터링된 상담사 목록:', consultantsData);
                setConsultants(consultantsData);
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
        }
    };

    /**
     * 매칭 목록 로드
     */
    const loadMappings = async () => {
        try {
            const response = await apiGet('/api/admin/mappings');
            if (response.success) {
                setMappings(response.data || []);
            }
        } catch (error) {
            console.error('매칭 목록 로드 실패:', error);
        }
    };

    /**
     * 상담 이력 로드 (스케줄 데이터)
     */
    const loadConsultations = async () => {
        try {
            console.log('🔍 상담 이력 로드 시작');
            
            // 관리자 권한으로 모든 스케줄 조회
            const response = await apiGet('/api/schedules?userId=0&userRole=ADMIN');
            console.log('📊 /api/schedules 응답:', response);
            
            if (response.success) {
                const schedules = response.data || [];
                console.log('📅 로드된 스케줄 수:', schedules.length);
                
                // 스케줄 데이터를 상담 이력 형태로 변환
                const consultations = schedules.map(schedule => ({
                    id: schedule.id,
                    clientId: schedule.clientId,
                    consultantId: schedule.consultantId,
                    title: schedule.title,
                    description: schedule.description,
                    status: schedule.status,
                    scheduleType: schedule.scheduleType,
                    consultationType: schedule.consultationType,
                    scheduledDate: schedule.scheduledDate,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    createdAt: schedule.createdAt,
                    updatedAt: schedule.updatedAt
                }));
                
                console.log('💬 변환된 상담 이력:', consultations);
                setConsultations(consultations);
            }
        } catch (error) {
            console.error('❌ 상담 이력 로드 실패:', error);
        }
    };

    /**
     * 내담자 선택 처리
     */
    const handleClientSelect = (client) => {
        setSelectedClient(client);
        setActiveTab('overview');
    };

    /**
     * 필터링된 내담자 목록 (최신순 10명 기본 노출, 필터 적용 시 전체 표시)
     */
    const getFilteredClients = () => {
        let filtered = clients;

        // 검색어 필터링 (이름, 이메일, 전화번호)
        if (searchTerm) {
            filtered = filtered.filter(client =>
                client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 상태 필터링
        if (filterStatus !== 'all') {
            filtered = filtered.filter(client => {
                const mapping = mappings.find(m => m.clientId === client.id);
                return mapping?.status === filterStatus;
            });
        }

        // 최신순 정렬 (createdAt 기준)
        filtered = filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.registeredAt || 0);
            const dateB = new Date(b.createdAt || b.registeredAt || 0);
            return dateB - dateA; // 최신순
        });

        // 필터가 적용된 경우 전체 표시, 그렇지 않으면 최신 10명만 표시
        const hasActiveFilter = searchTerm || filterStatus !== 'all';
        return hasActiveFilter ? filtered : filtered.slice(0, 10);
    };

    /**
     * 선택된 내담자의 매칭 정보
     */
    const getClientMapping = () => {
        if (!selectedClient) return null;
        return mappings.find(mapping => mapping.clientId === selectedClient.id);
    };

    /**
     * 선택된 내담자의 상담 이력
     */
    const getClientConsultations = () => {
        if (!selectedClient) return [];
        return consultations.filter(consultation => consultation.clientId === selectedClient.id);
    };

    /**
     * 상태를 한글로 변환 (동기식 fallback)
     */
    const getStatusTextSync = useCallback((status) => {
        if (!status) {
            return '알 수 없음';
        }
        
        // fallback 매칭
        const statusMap = {
            'ACTIVE': '활성',
            'INACTIVE': '비활성',
            'SUSPENDED': '일시정지',
            'COMPLETED': '완료',
            'PENDING': '대기중',
            'APPROVED': '승인됨',
            'REJECTED': '거부됨',
            'PAYMENT_CONFIRMED': '결제확인',
            'PAYMENT_PENDING': '결제대기',
            'PAYMENT_REJECTED': '결제거부',
            'TERMINATED': '종료됨',
            'CLIENT_BRONZE': '브론즈',
            'CLIENT_SILVER': '실버',
            'CLIENT_GOLD': '골드',
            'CLIENT_PLATINUM': '플래티넘',
            'CONSULTANT_JUNIOR': '주니어',
            'CONSULTANT_SENIOR': '시니어',
            'CONSULTANT_EXPERT': '전문가',
            'ADMIN': '관리자',
            'BRANCH_SUPER_ADMIN': '수퍼관리자',
            'HQ_ADMIN': '본사 관리자',
            'SUPER_HQ_ADMIN': '본사 슈퍼 관리자',
            'HQ_MASTER': '본사 마스터',
            'HAS_MAPPING': '매칭 있음',
            'ACTIVE_MAPPING': '활성 매칭',
            'NO_MAPPING': '매칭 없음',
            'PENDING_MAPPING': '매칭 대기',
            'INACTIVE_MAPPING': '비활성 매칭'
        };
        return statusMap[status] || status || '알 수 없음';
    }, []);

    /**
     * 상태를 한글로 변환 (동적 처리)
     */
    const getStatusText = useCallback(async (status) => {
        try {
            if (!status) {
                return '알 수 없음';
            }
            
            // 사용자 상태인지 등급인지 판단
            if (status.startsWith('CLIENT_') || status.startsWith('CONSULTANT_') || 
                status === 'ADMIN' || status === 'BRANCH_SUPER_ADMIN' || 
                status === 'HQ_ADMIN' || status === 'SUPER_HQ_ADMIN' || status === 'HQ_MASTER') {
                return await getUserGradeKoreanName(status);
            } else {
                return await getUserStatusKoreanName(status);
            }
        } catch (error) {
            console.error(`상태 한글명 조회 실패: ${status}`, error);
            return getStatusTextSync(status);
        }
    }, [getStatusTextSync]);

    /**
     * 등급을 한글로 변환 (동기식 fallback)
     */
    const getGradeTextSync = useCallback((grade) => {
        if (!grade) {
            return '브론즈';
        }
        
        // fallback 매칭
        const gradeMap = {
            'CLIENT_BRONZE': '브론즈',
            'CLIENT_SILVER': '실버',
            'CLIENT_GOLD': '골드',
            'CLIENT_PLATINUM': '플래티넘',
            'CLIENT_DIAMOND': '다이아몬드',
            'CONSULTANT_JUNIOR': '주니어',
            'CONSULTANT_SENIOR': '시니어',
            'CONSULTANT_EXPERT': '전문가'
        };
        return gradeMap[grade] || grade || '브론즈';
    }, []);

    /**
     * 등급을 한글로 변환 (동적 처리)
     */
    const getGradeText = useCallback(async (grade) => {
        try {
            if (!grade) {
                return '브론즈';
            }
            return await getUserGradeKoreanName(grade);
        } catch (error) {
            console.error(`등급 한글명 조회 실패: ${grade}`, error);
            return getGradeTextSync(grade);
        }
    }, [getGradeTextSync]);

    /**
     * 등급 아이콘 반환 (동기식 fallback)
     */
    const getGradeIconSync = useCallback((grade) => {
        if (!grade) {
            return '🥉';
        }
        
        // fallback 매칭
        const iconMap = {
            'CLIENT_BRONZE': '🥉',
            'CLIENT_SILVER': '🥈',
            'CLIENT_GOLD': '🥇',
            'CLIENT_PLATINUM': '💎',
            'CLIENT_DIAMOND': '💎',
            'CONSULTANT_JUNIOR': '⭐',
            'CONSULTANT_SENIOR': '⭐⭐',
            'CONSULTANT_EXPERT': '⭐⭐⭐',
            'ADMIN': '👑',
            'BRANCH_SUPER_ADMIN': '👑👑',
            'HQ_ADMIN': '👑👑👑',
            'SUPER_HQ_ADMIN': '👑👑👑👑',
            'HQ_MASTER': '👑👑👑👑👑'
        };
        return iconMap[grade] || '🥉';
    }, []);

    /**
     * 등급 아이콘 반환 (동적 처리)
     */
    const getGradeIcon = useCallback(async (grade) => {
        try {
            if (!grade) {
                return '🥉';
            }
            return await getUserGradeIcon(grade);
        } catch (error) {
            console.error(`등급 아이콘 조회 실패: ${grade}`, error);
            return getGradeIconSync(grade);
        }
    }, [getGradeIconSync]);

    /**
     * 상태별 색상 반환 (동적 처리)
     */
    const getStatusColorLocal = useCallback(async (status) => {
        try {
            // 사용자 상태인지 등급인지 판단
            if (status.startsWith('CLIENT_') || status.startsWith('CONSULTANT_') || 
                status === 'ADMIN' || status === 'BRANCH_SUPER_ADMIN' || 
                status === 'HQ_ADMIN' || status === 'SUPER_HQ_ADMIN' || status === 'HQ_MASTER') {
                return await getStatusColorSync(status, 'USER_GRADE');
            } else {
                return await getStatusColorSync(status, 'STATUS');
            }
        } catch (error) {
            console.error(`상태 색상 조회 실패: ${status}`, error);
            // fallback 매칭
            const colorMap = {
                'ACTIVE': '#7bc87b',
                'INACTIVE': '#a8e6a3',
                'SUSPENDED': '#f59e0b',
                'COMPLETED': '#7bc87b',
                'PENDING': '#ffc107',
                'APPROVED': '#28a745',
                'REJECTED': '#dc3545',
                'PAYMENT_CONFIRMED': '#28a745',
                'PAYMENT_PENDING': '#ffc107',
                'PAYMENT_REJECTED': '#dc3545',
                'TERMINATED': '#dc3545',
                'CLIENT_BRONZE': '#cd7f32',
                'CLIENT_SILVER': '#c0c0c0',
                'CLIENT_GOLD': '#ffd700',
                'CLIENT_PLATINUM': '#e5e4e2',
                'CONSULTANT_JUNIOR': '#17a2b8',
                'CONSULTANT_SENIOR': '#6f42c1',
                'CONSULTANT_EXPERT': '#fd7e14',
                'ADMIN': '#6c757d',
                'BRANCH_SUPER_ADMIN': '#343a40'
            };
            return colorMap[status] || '#a8e6a3';
        }
    }, []);

    /**
     * 상태별 색상 반환 (동기식 fallback)
     */
    const getStatusColorSync = (status) => {
        if (!status) {
            return '#a8e6a3'; // 기본 색상
        }
        
        const colorMap = {
            'ACTIVE': '#7bc87b',
            'INACTIVE': '#a8e6a3',
            'SUSPENDED': '#f59e0b',
            'COMPLETED': '#7bc87b',
            'PENDING': '#ffc107',
            'APPROVED': '#28a745',
            'REJECTED': '#dc3545',
            'PAYMENT_CONFIRMED': '#28a745',
            'PAYMENT_PENDING': '#ffc107',
            'PAYMENT_REJECTED': '#dc3545',
            'TERMINATED': '#dc3545',
            'CLIENT_BRONZE': '#cd7f32',
            'CLIENT_SILVER': '#c0c0c0',
            'CLIENT_GOLD': '#ffd700',
            'CLIENT_PLATINUM': '#e5e4e2',
            'CONSULTANT_JUNIOR': '#17a2b8',
            'CONSULTANT_SENIOR': '#6f42c1',
            'CONSULTANT_EXPERT': '#fd7e14',
            'ADMIN': '#6c757d',
            'BRANCH_SUPER_ADMIN': '#343a40',
            'HQ_ADMIN': '#6c757d',
            'SUPER_HQ_ADMIN': '#343a40',
            'HQ_MASTER': '#000000',
            'HAS_MAPPING': '#28a745',
            'ACTIVE_MAPPING': '#007bff',
            'NO_MAPPING': '#dc3545',
            'PENDING_MAPPING': '#ffc107',
            'INACTIVE_MAPPING': '#6c757d'
        };
        return colorMap[status] || '#a8e6a3';
    };

    /**
     * 전체 통계 계산
     */
    const getOverallStats = () => {
        const totalClients = clients.length;
        const activeMappings = mappings.filter(m => m.status === 'ACTIVE').length;
        const totalConsultations = consultations.length;
        const completedConsultations = consultations.filter(c => c.status === 'COMPLETED').length;

        return {
            totalClients,
            activeMappings,
            totalConsultations,
            completedConsultations,
            completionRate: totalConsultations > 0 ? Math.round((completedConsultations / totalConsultations) * 100) : 0
        };
    };

    const stats = getOverallStats();

    // ==================== CRUD 함수들 ====================

    /**
     * 새 내담자 등록 모달 열기
     */
    const handleCreateClient = () => {
        setModalType('create');
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: ''
        });
        setShowModal(true);
    };

    /**
     * 내담자 수정 모달 열기
     */
    const handleEditClient = (client) => {
        setModalType('edit');
        setEditingClient(client);
        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            password: '' // 수정 시에는 비밀번호를 비워둠
        });
        setShowModal(true);
    };

    /**
     * 내담자 삭제 가능 여부 확인
     */
    const checkClientDeletionStatus = async (clientId) => {
        try {
            const response = await apiGet(`/api/admin/clients/${clientId}/deletion-status`);
            if (response.success && response.data) {
                return response.data;
            } else {
                throw new Error(response.message || '삭제 상태 확인 실패');
            }
        } catch (error) {
            console.error('내담자 삭제 상태 확인 실패:', error);
            throw error;
        }
    };

    /**
     * 내담자 삭제 처리
     */
    const handleClientDeletion = async (client) => {
        try {
            setLoading(true);
            
            // 삭제 가능 여부 확인
            const deletionStatus = await checkClientDeletionStatus(client.id);
            
            if (deletionStatus.canDeleteDirectly) {
                // 직접 삭제 가능한 경우
                const confirmMessage = `${client.name} 내담자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
                if (window.confirm(confirmMessage)) {
                    await deleteClientDirect(client.id);
                }
            } else {
                // 정리가 필요한 경우
                const details = deletionStatus.details;
                let warningMessage = `⚠️ ${client.name} 내담자는 다음 사유로 인해 삭제할 수 없습니다:\n\n`;
                
                if (details.remainingSessionCount > 0) {
                    warningMessage += `• 남은 회기: ${details.remainingSessionCount}회\n`;
                    details.sessionMappings?.forEach(mapping => {
                        warningMessage += `  - ${mapping.consultantName}와의 매칭: ${mapping.remainingSessions}회 남음\n`;
                    });
                    warningMessage += '\n';
                }
                
                if (details.pendingPaymentCount > 0) {
                    warningMessage += `• 결제 대기: ${details.pendingPaymentCount}개\n`;
                    details.paymentMappings?.forEach(mapping => {
                        warningMessage += `  - ${mapping.consultantName}: ${mapping.packageName}\n`;
                    });
                    warningMessage += '\n';
                }
                
                if (details.futureScheduleCount > 0) {
                    warningMessage += `• 예정 스케줄: ${details.futureScheduleCount}개\n\n`;
                }
                
                warningMessage += '회기 소진, 환불 처리, 또는 스케줄 완료 후 다시 시도해주세요.';
                
                // 환불 처리 옵션 제공
                if (details.remainingSessionCount > 0) {
                    warningMessage += '\n\n환불 처리를 원하시면 "환불 처리" 버튼을 클릭해주세요.';
                    
                    const shouldShowRefundOptions = window.confirm(warningMessage + '\n\n환불 처리를 진행하시겠습니까?');
                    if (shouldShowRefundOptions) {
                        handleShowRefundModal(client, details.sessionMappings);
                        return;
                    }
                }
                
                notificationManager.warning(warningMessage, 6000);
            }
            
        } catch (error) {
            console.error('내담자 삭제 처리 실패:', error);
            notificationManager.error('내담자 삭제 상태 확인에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 내담자 직접 삭제
     */
    const deleteClientDirect = async (clientId) => {
        try {
            const response = await apiDelete(`/api/admin/clients/${clientId}`);

            if (response.success) {
                notificationManager.success('내담자가 성공적으로 삭제되었습니다.');
                loadAllData(); // 데이터 새로고침
            } else {
                notificationManager.error(response.message || '내담자 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('내담자 삭제 실패:', error);
            notificationManager.error('내담자 삭제에 실패했습니다.');
        }
    };

    /**
     * 환불 모달 열기
     */
    const handleShowRefundModal = (client, sessionMappings) => {
        setRefundClient(client);
        setRefundMappings(sessionMappings || []);
        setSelectedMappings([]); // 초기화
        setRefundReason('');
        setShowRefundModal(true);
    };

    /**
     * 환불 모달 닫기
     */
    const handleCloseRefundModal = () => {
        setShowRefundModal(false);
        setRefundClient(null);
        setRefundMappings([]);
        setSelectedMappings([]);
        setRefundReason('');
    };

    /**
     * 매칭 선택/해제
     */
    const handleMappingSelection = (mappingId) => {
        setSelectedMappings(prev => {
            if (prev.includes(mappingId)) {
                return prev.filter(id => id !== mappingId);
            } else {
                return [...prev, mappingId];
            }
        });
    };

    /**
     * 환불 처리 실행
     */
    const handleRefundProcess = async () => {
        // 상세한 유효성 검사와 피드백
        if (selectedMappings.length === 0) {
            notificationManager.warning('⚠️ 환불할 매칭을 최소 1개 이상 선택해주세요.');
            return;
        }

        if (!refundReason.trim()) {
            notificationManager.warning('⚠️ 환불 사유를 반드시 입력해주세요.\n\n환불 사유는 ERP 시스템에 전송되며, 회계 처리에 필요한 중요한 정보입니다.');
            return;
        }

        if (refundReason.trim().length < 5) {
            notificationManager.warning('⚠️ 환불 사유를 5자 이상 상세히 입력해주세요.');
            return;
        }

        // 최종 확인
        const confirmMessage = `다음 ${selectedMappings.length}개의 매칭을 환불 처리하시겠습니까?\n\n환불 사유: ${refundReason.trim()}\n\n이 작업은 되돌릴 수 없습니다.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setLoading(true);

            // 선택된 매칭들을 순차적으로 강제 종료
            for (const mappingId of selectedMappings) {
                await apiPost(`/api/admin/mappings/${mappingId}/terminate`, {
                    reason: refundReason
                });
            }

            notificationManager.success(`${selectedMappings.length}개의 매칭이 환불 처리되었습니다. 관련 스케줄도 자동으로 취소됩니다.`);
            handleCloseRefundModal();
            
            // 데이터 새로고침 및 스케줄 컴포넌트 알림
            await loadAllData();
            
            // 백엔드 처리 완료를 위한 지연 후 추가 새로고침
            setTimeout(async () => {
                await loadAllData();
                console.log('🔄 환불 처리 후 추가 데이터 새로고침 완료');
            }, 1000);
            
            // 스케줄 컴포넌트에 환불 처리 완료 이벤트 발송
            window.dispatchEvent(new CustomEvent('refundProcessed', {
                detail: {
                    clientId: refundClient.id,
                    clientName: refundClient.name,
                    mappingIds: selectedMappings,
                    reason: refundReason
                }
            }));

        } catch (error) {
            console.error('환불 처리 실패:', error);
            notificationManager.error('환불 처리에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 내담자 삭제 확인 모달 열기
     */
    const handleDeleteClient = async (client) => {
        setEditingClient(client);
        await handleClientDeletion(client);
    };

    /**
     * 모달 닫기
     */
    const handleCloseModal = () => {
        setShowModal(false);
        setModalType('');
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: ''
        });
    };

    /**
     * 폼 데이터 변경
     */
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        
        // 전화번호 자동 하이픈 처리
        if (name === 'phone') {
            const formattedPhone = formatPhoneNumber(value);
            setFormData(prev => ({
                ...prev,
                [name]: formattedPhone
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // 전화번호 자동 하이픈 포맷팅 함수
    const formatPhoneNumber = (value) => {
        // 숫자만 추출
        const numbers = value.replace(/[^\d]/g, '');
        
        // 길이에 따라 하이픈 추가
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else if (numbers.length <= 11) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
        } else {
            // 11자리 초과시 11자리까지만
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
    };

    /**
     * 내담자 등록
     */
    const createClient = async () => {
        try {
            const response = await apiPost('/api/admin/clients', {
                username: formData.email,
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone
            });

            if (response.success) {
                notificationManager.success('내담자가 성공적으로 등록되었습니다.');
                handleCloseModal();
                loadAllData(); // 데이터 새로고침
            } else {
                notificationManager.error(response.message || '내담자 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('내담자 등록 실패:', error);
            notificationManager.error('내담자 등록에 실패했습니다.');
        }
    };

    /**
     * 내담자 수정
     */
    const updateClient = withFormSubmit(async () => {
        const updateData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
        };

        // 비밀번호가 입력된 경우에만 포함
        if (formData.password) {
            updateData.password = formData.password;
        }

        const response = await apiPut(`/api/admin/clients/${editingClient.id}`, updateData);

        if (response.success) {
            notificationManager.success('내담자 정보가 성공적으로 수정되었습니다.');
            handleCloseModal();
            loadAllData(); // 데이터 새로고침
        } else {
            notificationManager.error(response.message || '내담자 수정에 실패했습니다.');
        }
    });


    /**
     * 모달 제출 처리
     */
    const handleModalSubmit = () => {
        if (modalType === 'create') {
            createClient();
        } else if (modalType === 'edit') {
            updateClient();
        }
        // delete는 별도 처리 (handleClientDeletion 함수 사용)
    };

    return (
        <SimpleLayout>
            <div className="client-comp-container">
                <div className="client-comp-header">
                    <h2>👥 내담자 관리</h2>
                    <p>내담자의 모든 정보를 종합적으로 관리하고 분석할 수 있습니다.</p>
                    
                    {/* 메인 탭 메뉴 */}
                    <div className="client-comp-main-tab-buttons">
                        <button
                            className={`client-comp-main-tab-btn ${mainTab === 'comprehensive' ? 'active' : ''}`}
                            onClick={() => setMainTab('comprehensive')}
                        >
                            📊 내담자 종합관리
                        </button>
                        <button
                            className={`client-comp-main-tab-btn ${mainTab === 'basic' ? 'active' : ''}`}
                            onClick={() => setMainTab('basic')}
                        >
                            👤 내담자 기본관리
                        </button>
                    </div>
                </div>

            {/* 메인 탭 내용 */}
            {mainTab === 'comprehensive' ? (
                <>
                    {/* 전체 통계 */}
                    <div className="client-comp-stats-overview">
                        <div className="client-comp-stat-card">
                            <div className="client-comp-stat-icon">👥</div>
                            <div className="client-comp-stat-content">
                                <div className="client-comp-stat-number">{stats.totalClients}</div>
                                <div className="client-comp-stat-label">총 내담자</div>
                            </div>
                        </div>
                        <div className="client-comp-stat-card">
                            <div className="client-comp-stat-icon">🔗</div>
                            <div className="client-comp-stat-content">
                                <div className="client-comp-stat-number">{stats.activeMappings}</div>
                                <div className="client-comp-stat-label">활성 매칭</div>
                            </div>
                        </div>
                        <div className="client-comp-stat-card">
                            <div className="client-comp-stat-icon">💬</div>
                            <div className="client-comp-stat-content">
                                <div className="client-comp-stat-number">{stats.totalConsultations}</div>
                                <div className="client-comp-stat-label">총 상담</div>
                            </div>
                        </div>
                        <div className="client-comp-stat-card">
                            <div className="client-comp-stat-icon">✅</div>
                            <div className="client-comp-stat-content">
                                <div className="client-comp-stat-number">{stats.completionRate}%</div>
                                <div className="client-comp-stat-label">완료율</div>
                            </div>
                        </div>
                    </div>

            <div className="client-comp-client-list-section">
                {/* 내담자 목록 */}
                <div>
                    <div className="client-comp-section-header">
                        <h3>내담자 목록</h3>
                    </div>

                    {/* 필터 UI */}
                    <div className="client-comp-filters">
                        <input
                            type="text"
                            className="client-comp-search-input"
                            placeholder="이름, 이메일, 전화번호로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        
                        <select
                            className="client-comp-filter-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">전체 상태</option>
                            <option value="ACTIVE">활성</option>
                            <option value="INACTIVE">비활성</option>
                            <option value="SUSPENDED">일시정지</option>
                            <option value="COMPLETED">완료</option>
                            <option value="PENDING">대기중</option>
                        </select>
                        
                        {(searchTerm || filterStatus !== 'all') && (
                            <button
                                className="client-comp-container btn btn-secondary btn-sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterStatus('all');
                                }}
                            >
                                <i className="bi bi-x-circle"></i>
                                초기화
                            </button>
                        )}
                    </div>

                    <div className="client-comp-client-grid">
                        {getFilteredClients().map(client => {
                            const mapping = mappings.find(m => m.clientId === client.id);
                            return (
                                <div
                                    key={client.id}
                                    className={`client-comp-client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
                                    onClick={() => handleClientSelect(client)}
                                >
                                    <div className="client-comp-client-avatar">
                                        <FaUser />
                                    </div>
                                    <div className="client-comp-client-info">
                                        <div className="client-comp-client-status">
                                            <div className="client-comp-client-name">{client.name || 'Unknown Client'}</div>
                                            {mapping ? (
                                                <span className="status-badge">
                                                    {getStatusTextSync(mapping.status)}
                                                </span>
                                            ) : (
                                                <span className="status-badge no-mapping">매칭 없음</span>
                                            )}
                                        </div>
                                        <div className="client-comp-client-email">{client.email}</div>
                                        <div className="client-phone">{client.phone || '전화번호 없음'}</div>
                                        <div className="client-grade">
                                            <span>{getGradeIconSync(client.grade)}</span>
                                            <span>등급: {getGradeTextSync(client.grade) || '브론즈'}</span>
                                        </div>
                                        <div className="client-date">
                                            등록일: {client.createdAt ? new Date(client.createdAt).toLocaleDateString('ko-KR') : '-'}
                                        </div>
                                        <div className="client-sessions">
                                            총 상담: {getClientConsultations().filter(c => c.clientId === client.id).length}회
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 선택된 내담자 상세 정보 */}
                {selectedClient && (
                    <div className="client-detail-section">
                        <div className="detail-header">
                            <h3>{selectedClient.name} 상세 정보</h3>
                            <div className="tab-buttons">
                                <button
                                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    개요
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'mapping' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('mapping')}
                                >
                                    매칭 정보
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('consultations')}
                                >
                                    상담 이력
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('sessions')}
                                >
                                    회기 현황
                                </button>
                            </div>
                        </div>

                        <div className="detail-content">
                            {activeTab === 'overview' && (
                                <div className="overview-tab">
                                    <div className="overview-grid">
                                        <div className="overview-card">
                                            <h4>기본 정보</h4>
                                            <div className="info-list">
                                                <div className="info-item">
                                                    <span className="label">이름:</span>
                                                    <span className="value">{selectedClient.name}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">이메일:</span>
                                                    <span className="value">{selectedClient.email}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">가입일:</span>
                                                    <span className="value">
                                                        {selectedClient.createdAt ? 
                                                            new Date(selectedClient.createdAt).toLocaleDateString('ko-KR') : 
                                                            '알 수 없음'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overview-card">
                                            <h4>상담 현황</h4>
                                            <div className="info-list">
                                                <div className="info-item">
                                                    <span className="label">총 상담:</span>
                                                    <span className="value">{getClientConsultations().length}회</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">완료 상담:</span>
                                                    <span className="value">
                                                        {getClientConsultations().filter(c => c.status === 'COMPLETED').length}회
                                                    </span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">진행중:</span>
                                                    <span className="value">
                                                        {getClientConsultations().filter(c => c.status === 'IN_PROGRESS').length}회
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'mapping' && (
                                <div className="mapping-tab">
                                    {getClientMapping() ? (
                                        <div className="mapping-details">
                                            <div className="mapping-info">
                                                <div className="info-item">
                                                    <span className="label">상담사:</span>
                                                    <span className="value">{getClientMapping().consultantName || '알 수 없음'}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">매칭 상태:</span>
                                                    <span
                                                        className="value status-badge"
                                                        style={{ backgroundColor: getStatusColorSync(getClientMapping().status) }}
                                                    >
                                                        {getStatusTextSync(getClientMapping().status)}
                                                    </span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="label">매칭일:</span>
                                                    <span className="value">
                                                        {getClientMapping().createdAt ? 
                                                            new Date(getClientMapping().createdAt).toLocaleDateString('ko-KR') : 
                                                            '알 수 없음'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-mapping">
                                            <p>이 내담자에 대한 상담사 매칭이 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'consultations' && (
                                <div className="consultations-tab">
                                    <div className="consultations-list">
                                        {getClientConsultations().length > 0 ? (
                                            getClientConsultations().map(consultation => (
                                                <div key={consultation.id} className="consultation-item">
                                                    <div className="consultation-date">
                                                        {consultation.consultationDate ? 
                                                            new Date(consultation.consultationDate).toLocaleDateString('ko-KR') : 
                                                            '날짜 없음'
                                                        }
                                                    </div>
                                                    <div className="consultation-time">
                                                        {consultation.startTime} - {consultation.endTime}
                                                    </div>
                                                    <div className="consultation-status">
                                                        <span className="status-badge">
                                                            {consultation.status === 'COMPLETED' ? '완료' : 
                                                             consultation.status === 'IN_PROGRESS' ? '진행중' : 
                                                             consultation.status || '알 수 없음'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-consultations">
                                                <p>상담 이력이 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sessions' && (
                                <div className="sessions-tab">
                                    {getClientMapping() ? (
                                        <div className="sessions-info">
                                            <div className="session-stats">
                                                <div className="session-stat">
                                                    <div className="stat-number">{getClientMapping().totalSessions || 0}</div>
                                                    <div className="stat-label">총 회기</div>
                                                </div>
                                                <div className="session-stat">
                                                    <div className="stat-number">{getClientMapping().usedSessions || 0}</div>
                                                    <div className="stat-label">사용 회기</div>
                                                </div>
                                                <div className="session-stat">
                                                    <div className="stat-number">{getClientMapping().remainingSessions || 0}</div>
                                                    <div className="stat-label">남은 회기</div>
                                                </div>
                                            </div>
                                            <div className="session-progress">
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ 
                                                            width: `${getClientMapping().totalSessions > 0 ? 
                                                                (getClientMapping().usedSessions / getClientMapping().totalSessions) * 100 : 0}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="progress-text">
                                                    {getClientMapping().totalSessions > 0 ? 
                                                        Math.round((getClientMapping().usedSessions / getClientMapping().totalSessions) * 100) : 0}% 사용됨
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-sessions">
                                            <p>회기 정보가 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
                </>
            ) : (
                /* 내담자 기본관리 탭 */
                <div className="basic-management-tab">
                    <div className="basic-management-content">
                        <h3>내담자 기본 정보 관리</h3>
                        <p>내담자가 직접 가입하지 않은 경우, 관리자가 내담자 계정을 생성하고 기본 정보를 관리할 수 있습니다.</p>
                        
                        {/* 기본관리 기능들 */}
                        <div className="basic-actions">
                            <button className="mg-btn mg-btn--primary" onClick={handleCreateClient}>
                                ➕ 새 내담자 등록
                            </button>
                            <button className="mg-btn mg-btn--secondary" onClick={loadAllData}>
                                🔄 새로고침
                            </button>
                        </div>
                        
                        
                        {/* 필터 UI */}
                        <div className="client-comp-filter-container">
                            <div className="client-comp-filter-content">
                                {/* 검색 입력 */}
                                <div className="client-comp-search-container">
                                    <input
                                        type="text"
                                        placeholder="이름, 이메일, 전화번호로 검색..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="client-comp-search-input"
                                    />
                                    <i className="bi bi-search client-comp-search-icon"></i>
                                </div>
                                
                                {/* 상태 필터 */}
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="mg-select client-comp-filter-select"
                                >
                                    <option key="filter-all" value="all">전체 상태</option>
                                    <option key="filter-active" value="ACTIVE">활성</option>
                                    <option key="filter-inactive" value="INACTIVE">비활성</option>
                                    <option key="filter-suspended" value="SUSPENDED">일시정지</option>
                                    <option key="filter-completed" value="COMPLETED">완료</option>
                                    <option key="filter-pending" value="PENDING">대기중</option>
                                </select>
                                
                                {/* 필터 초기화 */}
                                {(searchTerm || filterStatus !== 'all') && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterStatus('all');
                                        }}
                                        className="mg-button mg-button-secondary"
                                    >
                                        <i className="bi bi-x-circle"></i>
                                        초기화
                                    </button>
                                )}
                            </div>
                            
                            {/* 필터 상태 표시 */}
                            <div className="client-comp-filter-status">
                                <i className="bi bi-info-circle"></i>
                                {searchTerm || filterStatus !== 'all' ? (
                                    <span>
                                        검색 결과: <strong>{getFilteredClients().length}명</strong>
                                        {searchTerm && ` (검색어: "${searchTerm}")`}
                                        {filterStatus !== 'all' && ` (상태: ${getStatusTextSync(filterStatus)})`}
                                    </span>
                                ) : (
                                    <span>
                                        최신 <strong>10명</strong> 표시 중 (전체 {clients.length}명)
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 내담자 목록 카드 */}
                        <div className="client-comp-cards-container">
                            {getFilteredClients().length > 0 ? (
                                <div className="client-comp-cards-grid">
                                    {getFilteredClients().map(client => {
                                        const mapping = mappings.find(m => m.clientId === client.id);
                                        return (
                                            <div key={client.id} style={{
                                                background: 'white',
                                                borderRadius: '12px',
                                                padding: '20px',
                                                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                                                border: '1px solid #e9ecef',
                                                transition: 'all 0.3s ease',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.12)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
                                            }}
                                            >
                                                {/* 카드 헤더 */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '16px',
                                                    paddingBottom: '16px',
                                                    borderBottom: '1px solid #f1f3f4'
                                                }}>
                                                    <div style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        background: 'linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%)',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: 'var(--font-size-xl)',
                                                        marginRight: '12px'
                                                    }}>
                                                        <FaUser />
                                                    </div>
                                                    <div style={{ flex: '1' }}>
                                                        <h3 style={{
                                                            margin: '0 0 4px 0',
                                                            fontSize: 'var(--font-size-lg)',
                                                            fontWeight: '600',
                                                            color: '#2c3e50'
                                                        }}>
                                                            {client.name || 'Unknown Client'}
                                                        </h3>
                                                        <p style={{
                                                            margin: '0',
                                                            fontSize: 'var(--font-size-sm)',
                                                            color: '#6c757d'
                                                        }}>
                                                            {client.email || '이메일 없음'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 카드 내용 */}
                                                <div style={{ marginBottom: '16px' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '12px'
                                                    }}>
                                                        <span style={{
                                                            fontSize: 'var(--font-size-sm)',
                                                            color: '#6c757d',
                                                            fontWeight: '500'
                                                        }}>전화번호</span>
                                                        <span style={{
                                                            fontSize: 'var(--font-size-sm)',
                                                            color: '#2c3e50',
                                                            fontWeight: '500'
                                                        }}>
                                                            {client.phone || '전화번호 없음'}
                                                        </span>
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '12px'
                                                    }}>
                                                        <span style={{
                                                            fontSize: 'var(--font-size-sm)',
                                                            color: '#6c757d',
                                                            fontWeight: '500'
                                                        }}>등급</span>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 12px',
                                                            borderRadius: '16px',
                                                            fontSize: 'var(--font-size-xs)',
                                                            fontWeight: '600',
                                                            background: '#e3f2fd',
                                                            color: '#1976d2'
                                                        }}>
                                                            {getGradeTextSync(client.grade)}
                                                        </span>
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '12px'
                                                    }}>
                                                        <span style={{
                                                            fontSize: 'var(--font-size-sm)',
                                                            color: '#6c757d',
                                                            fontWeight: '500'
                                                        }}>상태</span>
                                                        {mapping ? (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: '4px 12px',
                                                                borderRadius: '16px',
                                                                fontSize: 'var(--font-size-xs)',
                                                                fontWeight: '600',
                                                                color: 'white',
                                                                backgroundColor: getStatusColorSync(mapping.status)
                                                            }}>
                                                                {getStatusTextSync(mapping.status)}
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: '4px 12px',
                                                                borderRadius: '16px',
                                                                fontSize: 'var(--font-size-xs)',
                                                                fontWeight: '600',
                                                                color: 'white',
                                                                backgroundColor: '#6c757d'
                                                            }}>
                                                                매칭 없음
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '12px'
                                                    }}>
                                                        <span style={{
                                                            fontSize: 'var(--font-size-sm)',
                                                            color: '#6c757d',
                                                            fontWeight: '500'
                                                        }}>가입일</span>
                                                        <span style={{
                                                            fontSize: 'var(--font-size-sm)',
                                                            color: '#2c3e50',
                                                            fontWeight: '500'
                                                        }}>
                                                            {client.createdAt ? 
                                                                new Date(client.createdAt).toLocaleDateString('ko-KR') : 
                                                                '-'
                                                            }
                                                        </span>
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <span style={{
                                                            fontSize: 'var(--font-size-sm)',
                                                            color: '#6c757d',
                                                            fontWeight: '500'
                                                        }}>총 상담</span>
                                                        <span style={{
                                                            fontSize: 'var(--font-size-base)',
                                                            color: '#2c3e50',
                                                            fontWeight: '600'
                                                        }}>
                                                            {client.totalConsultations || 0}회
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 액션 버튼 */}
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '8px',
                                                    paddingTop: '16px',
                                                    borderTop: '1px solid #f1f3f4'
                                                }}>
                                                    <button 
                                                        style={{
                                                            flex: '1',
                                                            padding: '10px 16px',
                                                            fontSize: 'var(--font-size-sm)',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            background: '#007bff',
                                                            color: 'white',
                                                            fontWeight: '500',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = '#0056b3'}
                                                        onMouseLeave={(e) => e.target.style.background = '#007bff'}
                                                        onClick={() => handleEditClient(client)}
                                                    >
                                                        ✏️ 수정
                                                    </button>
                                                    <button 
                                                        style={{
                                                            flex: '1',
                                                            padding: '10px 16px',
                                                            fontSize: 'var(--font-size-sm)',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            background: '#dc3545',
                                                            color: 'white',
                                                            fontWeight: '500',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = '#c82333'}
                                                        onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                                                        onClick={() => handleDeleteClient(client)}
                                                    >
                                                        🗑️ 삭제
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '80px 20px',
                                    color: '#6c757d',
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
                                }}>
                                    <div style={{ fontSize: 'var(--font-size-xxxl)', marginBottom: '24px' }}>👥</div>
                                    <p style={{ fontSize: 'var(--font-size-xl)', marginBottom: '12px', fontWeight: '500' }}>등록된 내담자가 없습니다.</p>
                                    <p style={{ fontSize: 'var(--font-size-base)', color: '#adb5bd' }}>새 내담자를 등록해보세요.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="mg-loading-container">
                    <div className="mg-spinner"></div>
                    <p>데이터를 불러오는 중...</p>
                </div>
            )}

            {/* CRUD 모달 */}
            {showModal && (
                <div className="mg-modal-overlay" onClick={handleCloseModal}>
                    <div className="mg-modal mg-modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="mg-modal-header">
                            <div className="mg-modal-title-section">
                                <h3 className="mg-modal-title">
                                    {modalType === 'create' && '➕ 새 내담자 등록'}
                                    {modalType === 'edit' && '✏️ 내담자 정보 수정'}
                                    {modalType === 'delete' && '🗑️ 내담자 삭제'}
                                </h3>
                                {modalType === 'create' && (
                                    <p className="mg-modal-description">
                                        내담자가 직접 가입하지 않은 경우, 관리자가 내담자 계정을 생성하고 초기 로그인 정보를 설정합니다.
                                    </p>
                                )}
                                {modalType === 'edit' && (
                                    <p className="mg-modal-description">
                                        내담자의 기본 정보를 수정합니다.
                                    </p>
                                )}
                            </div>
                            <button className="mg-modal-close" onClick={handleCloseModal}>
                                ✕
                            </button>
                        </div>
                        
                        <div className="mg-modal-body">
                            {modalType === 'delete' ? (
                                <div className="mg-info-box mg-text-center">
                                    <p className="mg-text-base mg-text-primary mg-mb-md">
                                        정말로 <strong className="mg-text-danger">{editingClient?.name}</strong> 내담자를 삭제하시겠습니까?
                                    </p>
                                    <p className="mg-text-sm mg-text-danger mg-font-semibold mg-flex mg-align-center mg-justify-center mg-gap-sm">
                                        ⚠️ 이 작업은 되돌릴 수 없습니다.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="mg-form-group">
                                        <label htmlFor="name" className="mg-label">이름 *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            className="mg-input"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            placeholder="내담자 이름을 입력하세요"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="mg-form-group">
                                        <label htmlFor="email" className="mg-label">이메일 *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            className="mg-input"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="이메일을 입력하세요"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="mg-form-group">
                                        <label htmlFor="phone" className="mg-label">전화번호</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            className="mg-input"
                                            value={formData.phone}
                                            onChange={handleFormChange}
                                            placeholder="010-1234-5678"
                                            maxLength="13"
                                        />
                                    </div>
                                    
                                    <div className="mg-form-group">
                                        <label htmlFor="password" className="mg-label">
                                            {modalType === 'create' ? '초기 비밀번호 *' : '새 비밀번호 (선택사항)'}
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            className="mg-input"
                                            value={formData.password}
                                            onChange={handleFormChange}
                                            placeholder={modalType === 'create' ? '내담자 로그인용 초기 비밀번호를 입력하세요' : '새 비밀번호를 입력하세요 (비워두면 기존 비밀번호 유지)'}
                                            required={modalType === 'create'}
                                        />
                                        {modalType === 'create' && (
                                            <small className="mg-text-xs mg-text-muted mg-mt-sm">
                                                💡 관리자가 생성한 계정이므로, 내담자에게 이 초기 비밀번호를 전달해주세요. 첫 로그인 후 비밀번호 변경이 가능합니다.
                                            </small>
                                        )}
                                        {modalType === 'edit' && (
                                            <small className="mg-text-xs mg-text-muted mg-mt-sm">
                                                💡 비밀번호를 변경하지 않으려면 비워두세요.
                                            </small>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="mg-modal-footer">
                            <button className="mg-button mg-button-secondary" onClick={handleCloseModal}>
                                취소
                            </button>
                            <button 
                                className={`mg-button ${modalType === 'delete' ? 'mg-button-danger' : 'mg-button-primary'}`}
                                onClick={handleModalSubmit}
                            >
                                {modalType === 'create' && '등록'}
                                {modalType === 'edit' && '수정'}
                                {modalType === 'delete' && '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 환불 처리 모달 */}
            {showRefundModal && (
                <div className="mg-modal-overlay">
                    <div className="mg-modal mg-modal-large">
                        {/* 모달 헤더 */}
                        <div className="mg-modal-header">
                            <h3 className="mg-modal-title">
                                🔄 회기 환불 처리 - {refundClient?.name}
                            </h3>
                            <button className="mg-modal-close" onClick={handleCloseRefundModal}>
                                ×
                            </button>
                        </div>

                        {/* 모달 내용 */}
                        <div className="mg-modal-body">
                            <p className="mg-text-sm mg-text-muted mg-mb-lg">
                                환불할 매칭을 선택하고 환불 사유를 입력해주세요. 선택된 매칭의 남은 회기가 모두 환불 처리됩니다.
                            </p>

                            {/* 매칭 목록 */}
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{
                                    margin: '0 0 12px 0',
                                    fontSize: 'var(--font-size-base)',
                                    fontWeight: '600',
                                    color: '#343a40'
                                }}>
                                    환불 대상 매칭 선택
                                </h4>
                                {refundMappings.map(mapping => (
                                    <div key={mapping.mappingId} style={{
                                        border: '2px solid #e9ecef',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: selectedMappings.includes(mapping.mappingId) ? '#e7f3ff' : 'white',
                                        borderColor: selectedMappings.includes(mapping.mappingId) ? '#007bff' : '#e9ecef'
                                    }}
                                    onClick={() => handleMappingSelection(mapping.mappingId)}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{
                                                    fontSize: 'var(--font-size-sm)',
                                                    fontWeight: '600',
                                                    color: '#343a40',
                                                    marginBottom: '4px'
                                                }}>
                                                    {mapping.consultantName}와의 매칭
                                                </div>
                                                <div style={{
                                                    fontSize: 'var(--font-size-xs)',
                                                    color: '#6c757d'
                                                }}>
                                                    {mapping.packageName} | 남은 회기: {mapping.remainingSessions}회
                                                </div>
                                            </div>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: '2px solid #007bff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: selectedMappings.includes(mapping.mappingId) ? '#007bff' : 'white'
                                            }}>
                                                {selectedMappings.includes(mapping.mappingId) && (
                                                    <div style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'white'
                                                    }} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {selectedMappings.length === 0 && (
                                    <div style={{
                                        color: '#dc3545',
                                                                fontSize: 'var(--font-size-xs)',
                                        marginTop: '8px',
                                        fontWeight: '500'
                                    }}>
                                        ⚠️ 환불할 매칭을 최소 1개 이상 선택해주세요.
                                    </div>
                                )}
                            </div>

                            {/* 환불 사유 입력 */}
                            <div>
                                <h4 style={{
                                    margin: '0 0 12px 0',
                                    fontSize: 'var(--font-size-base)',
                                    fontWeight: '600',
                                    color: '#343a40'
                                }}>
                                    환불 사유
                                </h4>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="환불 사유를 상세히 입력해주세요..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: `2px solid ${!refundReason.trim() ? '#dc3545' : '#e9ecef'}`,
                                        borderRadius: '8px',
                                        fontSize: 'var(--font-size-sm)',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        minHeight: '80px'
                                    }}
                                />
                                {!refundReason.trim() && (
                                    <div style={{
                                        color: '#dc3545',
                                                                fontSize: 'var(--font-size-xs)',
                                        marginTop: '4px',
                                        fontWeight: '500'
                                    }}>
                                        ⚠️ 환불 사유를 반드시 입력해주세요.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 모달 푸터 */}
                        <div style={{
                            padding: '20px 24px',
                            backgroundColor: '#f8f9fa',
                            borderTop: '1px solid #e9ecef',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                onClick={handleCloseRefundModal}
                                disabled={loading}
                                className="mg-button mg-button-outline"
                            >
                                취소
                            </button>
                            <button
                                onClick={(e) => {
                                    // 비활성화된 상태에서 클릭 시 안내 메시지
                                    if (selectedMappings.length === 0) {
                                        notificationManager.warning('⚠️ 환불할 매칭을 먼저 선택해주세요.');
                                        return;
                                    }
                                    if (!refundReason.trim()) {
                                        notificationManager.warning('⚠️ 환불 사유를 먼저 입력해주세요.');
                                        return;
                                    }
                                    handleRefundProcess();
                                }}
                                disabled={loading || selectedMappings.length === 0 || !refundReason.trim()}
                                className="mg-button mg-button-danger"
                            >
                                {loading ? '처리 중...' : `환불 처리 (${selectedMappings.length}개)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </SimpleLayout>
    );
};

export default ClientComprehensiveManagement;
