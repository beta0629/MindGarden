import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Alert } from 'react-bootstrap';
import { FaUsers, FaUserTie, FaLink, FaCalendarAlt, FaCalendarCheck, FaCog, FaDollarSign, FaChartLine, FaCreditCard, FaReceipt, FaFileAlt, FaCogs, FaBox, FaShoppingCart, FaCheckCircle, FaWallet, FaTruck, FaSyncAlt, FaExclamationTriangle, FaBuilding, FaMapMarkerAlt, FaUserCog, FaToggleOn, FaToggleOff, FaCompressAlt, FaClock, FaChartBar, FaUserGraduate, FaRedo, FaFileExport } from 'react-icons/fa';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import TodayStatistics from './TodayStatistics';
import SystemStatus from './system/SystemStatus';
import SystemTools from './system/SystemTools';
import StatisticsModal from '../common/StatisticsModal';
import ConsultationCompletionStats from './ConsultationCompletionStats';
import VacationStatistics from './VacationStatistics';
import ConsultantRatingStatistics from './ConsultantRatingStatistics';
import PermissionManagement from './PermissionManagement';
// 새로 추가된 모달 컴포넌트들
import ErpReportModal from '../erp/ErpReportModal';
import PerformanceMetricsModal from '../statistics/PerformanceMetricsModal';
import SpecialtyManagementModal from '../consultant/SpecialtyManagementModal';
import RecurringExpenseModal from '../finance/RecurringExpenseModal';
import { useSession } from '../../contexts/SessionContext';
import { COMPONENT_CSS, ICONS } from '../../constants/css-variables';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import '../../styles/main.css';
import './AdminDashboard.new.css';
import './system/SystemStatus.css';
import './system/SystemTools.css';

const AdminDashboard = ({ user: propUser }) => {
    const navigate = useNavigate();
    const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();
    const [userPermissions, setUserPermissions] = useState([]);
    const [stats, setStats] = useState({
        totalConsultants: 0,
        totalClients: 0,
        totalMappings: 0,
        activeMappings: 0
    });
    
    const [refundStats, setRefundStats] = useState({
        totalRefundCount: 0,
        totalRefundedSessions: 0,
        totalRefundAmount: 0,
        averageRefundPerCase: 0
    });
    
    const [pendingDepositStats, setPendingDepositStats] = useState({
        count: 0,
        totalAmount: 0,
        oldestHours: 0
    });
    
    // 새로 추가된 모달 상태들
    const [showErpReport, setShowErpReport] = useState(false);
    const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
    const [showSpecialtyManagement, setShowSpecialtyManagement] = useState(false);
    const [showRecurringExpense, setShowRecurringExpense] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [showToastState, setShowToastState] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [systemStatus, setSystemStatus] = useState({
        server: 'unknown',
        database: 'unknown',
        lastChecked: null
    });
    const [showStatisticsModal, setShowStatisticsModal] = useState(false);
    const isInitialized = useRef(false);

    // 세션 체크 및 권한 확인
    // 단순한 초기화 메소드
    useEffect(() => {
        if (isInitialized.current) return;
        
        const initializeDashboard = async () => {
            try {
                console.log('🔄 AdminDashboard 초기화 시작...');
                const permissions = await fetchUserPermissions(setUserPermissions);
                console.log('✅ AdminDashboard 초기화 완료:', permissions.length, '개 권한');
                isInitialized.current = true;
            } catch (error) {
                console.error('❌ AdminDashboard 초기화 실패:', error);
                setUserPermissions([]);
                isInitialized.current = true;
            }
        };

        initializeDashboard();
    }, []);

    const showToast = useCallback((message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToastState(true);
        setTimeout(() => setShowToastState(false), 3000);
    }, []);



    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const [consultantsRes, clientsRes, mappingsRes] = await Promise.all([
                fetch('/api/admin/consultants/with-vacation?date=' + new Date().toISOString().split('T')[0]),
                fetch('/api/admin/clients/with-mapping-info'),
                fetch('/api/admin/mappings')
            ]);

            let totalConsultants = 0;
            let totalClients = 0;
            let totalMappings = 0;
            let activeMappings = 0;

            if (consultantsRes.ok) {
                const consultantsData = await consultantsRes.json();
                totalConsultants = consultantsData.count || 0;
            }

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json();
                totalClients = clientsData.count || 0;
            }

            if (mappingsRes.ok) {
                const mappingsData = await mappingsRes.json();
                totalMappings = mappingsData.count || 0;
                activeMappings = (mappingsData.data || []).filter(m => m.status === 'ACTIVE').length;
            }

            setStats({
                totalConsultants,
                totalClients,
                totalMappings,
                activeMappings
            });
        } catch (error) {
            console.error('통계 데이터 로드 실패:', error);
            showToast('통계 데이터 로드에 실패했습니다.', 'danger');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const loadRefundStats = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/refund-statistics?period=month');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.summary) {
                    setRefundStats({
                        totalRefundCount: data.data.summary.totalRefundCount || 0,
                        totalRefundedSessions: data.data.summary.totalRefundedSessions || 0,
                        totalRefundAmount: data.data.summary.totalRefundAmount || 0,
                        averageRefundPerCase: data.data.summary.averageRefundPerCase || 0
                    });
                }
            }
        } catch (error) {
            console.error('환불 통계 로드 실패:', error);
        }
    }, []);

    const loadPendingDepositStats = useCallback(async () => {
        try {
            console.log('🔍 입금 확인 대기 통계 로드 시작...');
            const response = await fetch('/api/admin/mappings/pending-deposit');
            console.log('🔍 API 응답 상태:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 API 응답 데이터:', data);
                
                if (data.success && data.data) {
                    const count = data.data.length;
                    const totalAmount = data.data.reduce((sum, mapping) => sum + (mapping.packagePrice || 0), 0);
                    const oldestHours = Math.max(...data.data.map(mapping => mapping.hoursElapsed || 0), 0);
                    
                    console.log('🔍 계산된 통계:', { count, totalAmount, oldestHours });
                    
                    setPendingDepositStats({
                        count,
                        totalAmount,
                        oldestHours
                    });
                } else {
                    console.log('🔍 데이터가 없거나 실패:', data);
                    setPendingDepositStats({
                        count: 0,
                        totalAmount: 0,
                        oldestHours: 0
                    });
                }
            } else {
                console.error('🔍 API 호출 실패:', response.status, response.statusText);
                setPendingDepositStats({
                    count: 0,
                    totalAmount: 0,
                    oldestHours: 0
                });
            }
        } catch (error) {
            console.error('입금 확인 대기 통계 로드 실패:', error);
            setPendingDepositStats({
                count: 0,
                totalAmount: 0,
                oldestHours: 0
            });
        }
    }, []);

    // 스케줄 자동 완료 처리
    const handleAutoCompleteSchedules = async () => {
        try {
            const response = await csrfTokenManager.post('/api/admin/schedules/auto-complete');

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || '스케줄 자동 완료 처리가 완료되었습니다.');
                loadStats(); // 통계 새로고침
            } else {
                const error = await response.json();
                showToast(error.message || '스케줄 자동 완료 처리에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('스케줄 자동 완료 처리 실패:', error);
            showToast('스케줄 자동 완료 처리에 실패했습니다.', 'danger');
        }
    };

    // 스케줄 자동 완료 처리 및 상담일지 미작성 알림
    const handleAutoCompleteWithReminder = async () => {
        try {
            const response = await csrfTokenManager.post('/api/admin/schedules/auto-complete-with-reminder');

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || '스케줄 자동 완료 처리 및 알림이 완료되었습니다.');
                loadStats(); // 통계 새로고침
            } else {
                const error = await response.json();
                showToast(error.message || '스케줄 자동 완료 처리 및 알림에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('스케줄 자동 완료 처리 및 알림 실패:', error);
            showToast('스케줄 자동 완료 처리 및 알림에 실패했습니다.', 'danger');
        }
    };

    // 중복 매핑 통합 처리
    const handleMergeDuplicateMappings = async () => {
        try {
            // 먼저 중복 매핑 조회
            const checkResponse = await fetch('/api/admin/duplicate-mappings');
            if (!checkResponse.ok) {
                showToast('중복 매핑 조회에 실패했습니다.', 'danger');
                return;
            }
            
            const checkResult = await checkResponse.json();
            if (checkResult.count === 0) {
                showToast('중복된 매핑이 없습니다.');
                return;
            }
            
            // 사용자 확인
            const confirmMessage = `중복된 매핑이 ${checkResult.count}개 발견되었습니다. 통합하시겠습니까?`;
            if (!window.confirm(confirmMessage)) {
                return;
            }
            
            // 중복 매핑 통합 실행
            const response = await csrfTokenManager.post('/api/admin/merge-duplicate-mappings');

            if (response.ok) {
                const result = await response.json();
                showToast(result.message || '중복 매핑 통합이 완료되었습니다.');
                loadStats(); // 통계 새로고침
                loadRefundStats(); // 환불 통계 새로고침
            } else {
                const error = await response.json();
                showToast(error.message || '중복 매핑 통합에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('중복 매핑 통합 실패:', error);
            showToast('중복 매핑 통합에 실패했습니다.', 'danger');
        }
    };

    useEffect(() => {
        loadStats();
        loadRefundStats();
        loadPendingDepositStats();
    }, [loadStats, loadRefundStats, loadPendingDepositStats]);

    const createTestData = async () => {
        try {
            const response = await csrfTokenManager.post('/api/test/create-test-data');

            if (response.ok) {
                showToast('테스트 데이터가 성공적으로 생성되었습니다.');
                loadStats();
            } else {
                const error = await response.json();
                showToast(error.message || '테스트 데이터 생성에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('테스트 데이터 생성 실패:', error);
            showToast('테스트 데이터 생성에 실패했습니다.', 'danger');
        }
    };

    // 시스템 상태 체크
    const checkSystemStatus = async () => {
        setLoading(true);
        try {
            const [serverRes, dbRes] = await Promise.all([
                fetch('/api/health/server'),
                fetch('/api/health/database')
            ]);

            const serverStatus = serverRes.ok ? 'healthy' : 'error';
            const dbStatus = dbRes.ok ? 'healthy' : 'error';

            setSystemStatus({
                server: serverStatus,
                database: dbStatus,
                lastChecked: new Date().toLocaleTimeString('ko-KR')
            });

            if (serverStatus === 'healthy' && dbStatus === 'healthy') {
                showToast('시스템 상태가 정상입니다.', 'success');
            } else {
                showToast('시스템 상태에 문제가 있습니다.', 'warning');
            }
        } catch (error) {
            console.error('시스템 상태 체크 실패:', error);
            setSystemStatus({
                server: 'error',
                database: 'error',
                lastChecked: new Date().toLocaleTimeString('ko-KR')
            });
            showToast('시스템 상태 체크에 실패했습니다.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // 로그 보기
    const viewLogs = async () => {
        try {
            const response = await fetch('/api/admin/logs/recent');
            if (response.ok) {
                const logs = await response.json();
                // 로그를 새 창에서 표시
                const logWindow = window.open('', '_blank');
                logWindow.document.write(`
                    <html>
                        <head><title>시스템 로그</title></head>
                        <body>
                            <h2>최근 시스템 로그</h2>
                            <pre style="white-space: pre-wrap; font-family: monospace;">${JSON.stringify(logs, null, 2)}</pre>
                        </body>
                    </html>
                `);
                showToast('로그를 새 창에서 열었습니다.', 'info');
            } else {
                showToast('로그 조회에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('로그 조회 실패:', error);
            showToast('로그 조회에 실패했습니다.', 'danger');
        }
    };

    // 캐시 초기화
    const clearCache = async () => {
        try {
            const response = await csrfTokenManager.post('/api/admin/cache/clear');

            if (response.ok) {
                showToast('캐시가 성공적으로 초기화되었습니다.', 'success');
                // 통계도 새로고침
                loadStats();
            } else {
                showToast('캐시 초기화에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('캐시 초기화 실패:', error);
            showToast('캐시 초기화에 실패했습니다.', 'danger');
        }
    };

    // 백업 생성
    const createBackup = async () => {
        try {
            const response = await csrfTokenManager.post('/api/admin/backup/create');

            if (response.ok) {
                const backupData = await response.json();
                showToast(`백업이 생성되었습니다: ${backupData.filename}`, 'success');
            } else {
                showToast('백업 생성에 실패했습니다.', 'danger');
            }
        } catch (error) {
            console.error('백업 생성 실패:', error);
            showToast('백업 생성에 실패했습니다.', 'danger');
        }
    };

    // 로딩 상태 처리
    if (sessionLoading) {
        return (
            <div className="admin-dashboard">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '400px'
                }}>
                    <LoadingSpinner 
                        text="세션 확인 중..."
                        size="large"
                        variant="default"
                        inline={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <SimpleLayout>
            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CONTAINER}>
            {/* 오늘의 통계 */}
            {(propUser || sessionUser) && (propUser || sessionUser)?.id && (propUser || sessionUser)?.role && (
                <TodayStatistics 
                    userId={(propUser || sessionUser)?.id} 
                    userRole={(propUser || sessionUser)?.role}
                    onShowStatistics={() => setShowStatisticsModal(true)}
                />
            )}

            {/* 시스템 개요 */}
            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                    <i className={ICONS.BI.SPEEDOMETER}></i>
                    시스템 개요
                </h2>
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARDS}>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} consultants`}>
                            <FaUserTie />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                            <h3>상담사</h3>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{stats.totalConsultants}명</div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>현재 활성화된 상담사</div>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} clients`}>
                            <FaUsers />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                            <h3>내담자</h3>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{stats.totalClients}명</div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>현재 활성화된 내담자</div>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} mappings`}>
                            <FaLink />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                            <h3>매핑</h3>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{stats.totalMappings}개</div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>생성된 매핑</div>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} active`}>
                            <FaLink />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                            <h3>활성 매핑</h3>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{stats.activeMappings}개</div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>활성 상태</div>
                        </div>
                    </div>
                </div>

                {/* 입금 확인 대기 알림 - 매핑 관리 권한이 있는 사용자만 표시 */}
                {(() => {
                    const canViewPendingDeposits = PermissionChecks.canViewMappings(userPermissions);
                    console.log('🔍 입금 확인 대기 알림 권한 체크:', {
                        userPermissions,
                        canViewPendingDeposits,
                        pendingDepositStats
                    });
                    return canViewPendingDeposits;
                })() && pendingDepositStats.count > 0 && (
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                        <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE} style={{ color: 'white' }}>
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            ⚠️ 입금 확인 대기 알림
                        </h2>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARDS}>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD} style={{ backgroundColor: '#fff5f5' }}>
                                <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} pending-deposit`} style={{ backgroundColor: '#dc3545' }}>
                                    <FaExclamationTriangle />
                                </div>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                                    <h3>입금 확인 대기</h3>
                                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE} style={{ color: '#dc3545' }}>
                                        {pendingDepositStats.count}건
                                    </div>
                                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>
                                        결제 확인 완료, 입금 대기 중
                                    </div>
                                </div>
                            </div>
                            
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD} style={{ backgroundColor: '#fff8f0' }}>
                                <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} pending-amount`} style={{ backgroundColor: '#fd7e14' }}>
                                    <FaDollarSign />
                                </div>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                                    <h3>대기 중인 금액</h3>
                                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE} style={{ color: '#fd7e14' }}>
                                        {pendingDepositStats.totalAmount.toLocaleString()}원
                                    </div>
                                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>
                                        입금 확인 대기 중인 총 금액
                                    </div>
                                </div>
                            </div>
                            
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD} style={{ backgroundColor: '#f8f5ff' }}>
                                <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} oldest-waiting`} style={{ backgroundColor: '#6f42c1' }}>
                                    <FaClock />
                                </div>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                                    <h3>최장 대기 시간</h3>
                                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE} style={{ color: '#6f42c1' }}>
                                        {pendingDepositStats.oldestHours}시간
                                    </div>
                                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>
                                        가장 오래 대기 중인 건
                                    </div>
                                </div>
                            </div>
                            
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD} onClick={() => navigate('/admin/mapping-management')} style={{ cursor: 'pointer', backgroundColor: '#f0fdfa' }}>
                                <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} manage-deposits`} style={{ backgroundColor: '#20c997' }}>
                                    <FaCog />
                                </div>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                                    <h3>입금 확인 처리</h3>
                                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE} style={{ color: '#20c997' }}>
                                        처리하기
                                    </div>
                                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>
                                        매핑 관리에서 입금 확인
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 휴가 통계 섹션 */}
                <VacationStatistics />

                {/* 상담사 평가 통계 섹션 */}
                <ConsultantRatingStatistics />

                {/* 환불 통계 섹션 */}
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-arrow-return-left"></i>
                        환불 현황 (최근 1개월)
                    </h2>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARDS}>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} refund-count`} style={{ backgroundColor: '#dc3545' }}>
                                <FaReceipt />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                                <h3>환불 건수</h3>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{refundStats.totalRefundCount}건</div>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>환불 처리 건수</div>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} refund-sessions`} style={{ backgroundColor: '#fd7e14' }}>
                                <FaCalendarAlt />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                                <h3>환불 회기</h3>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{refundStats.totalRefundedSessions}회</div>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>환불된 회기수</div>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} refund-amount`} style={{ backgroundColor: '#6f42c1' }}>
                                <FaDollarSign />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                                <h3>환불 금액</h3>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>
                                    {refundStats.totalRefundAmount.toLocaleString()}원
                                </div>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>총 환불 금액</div>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} refund-average`} style={{ backgroundColor: '#20c997' }}>
                                <FaChartLine />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                                <h3>평균 환불액</h3>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>
                                    {refundStats.averageRefundPerCase.toLocaleString()}원
                                </div>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>건당 평균</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 상담 완료 건수 통계 (어드민/수퍼어드민/지점수퍼어드민) */}
            {((propUser || sessionUser)?.role === 'ADMIN' || (propUser || sessionUser)?.role === 'BRANCH_SUPER_ADMIN' || (propUser || sessionUser)?.role === 'BRANCH_BRANCH_SUPER_ADMIN') && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-graph-up"></i>
                        상담 완료 건수 통계
                    </h2>
                    <ConsultationCompletionStats />
                </div>
            )}

            {/* 관리 기능 */}
            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                    <i className={ICONS.BI.GEAR}></i>
                    관리 기능
                </h2>
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_GRID}>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/admin/schedules')}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} schedule`}>
                            <FaCalendarAlt />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>스케줄 관리</h3>
                            <p>상담 일정을 관리하고 조정합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/admin/sessions')}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} sessions`}>
                            <FaCalendarCheck />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>회기 관리</h3>
                            <p>상담 회기를 등록하고 관리합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={handleAutoCompleteSchedules}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} auto-complete`}>
                            <FaSyncAlt />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>스케줄 자동 완료</h3>
                            <p>지난 스케줄을 자동으로 완료 처리합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={handleAutoCompleteWithReminder}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} auto-complete-reminder`}>
                            <FaExclamationTriangle />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>스케줄 완료 + 알림</h3>
                            <p>지난 스케줄 완료 처리 및 상담일지 미작성 알림</p>
                        </div>
                    </div>
                    
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/admin/consultant-comprehensive')}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} consultants`}>
                            <FaUserTie />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>상담사 관리</h3>
                            <p>상담사 정보를 관리합니다</p>
                        </div>
                    </div>
                    
                    {PermissionChecks.canManageClients(userPermissions) && (
                        <div className="management-card" onClick={() => navigate('/admin/client-comprehensive')}>
                            <div className={`card__icon card__icon--large card__icon-- clients`}>
                                <FaUsers />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>내담자 관리</h3>
                                <p>내담자 정보를 관리합니다</p>
                            </div>
                        </div>
                    )}
                    
                    {PermissionChecks.canManageUsers(userPermissions) && (
                        <div className="management-card" onClick={() => navigate('/admin/user-management')}>
                            <div className={`card__icon card__icon--large card__icon-- user-management`}>
                                <FaUserCog />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>사용자 관리</h3>
                                <p>사용자 역할 변경 및 권한 관리</p>
                            </div>
                        </div>
                    )}
                    
                    {PermissionChecks.canViewMappings(userPermissions) && (
                        <div className="management-card" onClick={() => navigate('/admin/mapping-management')}>
                            <div className={`card__icon card__icon--large card__icon-- mappings`}>
                                <FaLink />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>매핑 관리</h3>
                                <p>상담사와 내담자 매핑을 관리합니다</p>
                            </div>
                        </div>
                    )}
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/admin/common-codes')}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} consultants`}>
                            <FaCog />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>공통코드 관리</h3>
                            <p>시스템 공통코드를 관리합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={handleMergeDuplicateMappings}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} merge`}>
                            <FaCompressAlt />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>중복 매핑 통합</h3>
                            <p>중복된 상담사-내담자 매핑을 통합합니다</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 시스템 도구 */}
            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                    <i className={ICONS.BI.TOOLS}></i>
                    시스템 도구
                </h2>
                
                {/* 시스템 상태 컴포넌트 */}
                <SystemStatus 
                    systemStatus={systemStatus}
                    onStatusCheck={checkSystemStatus}
                    loading={loading}
                />
                
                {/* 시스템 도구 컴포넌트 */}
                <SystemTools 
                    onRefresh={loadStats}
                    onViewLogs={viewLogs}
                    onClearCache={clearCache}
                    onCreateBackup={createBackup}
                    loading={loading}
                />
            </div>



            {/* 컴플라이언스 관리 (관리자 전용) */}
            {((propUser || sessionUser)?.role === 'ADMIN' || (propUser || sessionUser)?.role === 'BRANCH_SUPER_ADMIN' || (propUser || sessionUser)?.role === 'BRANCH_BRANCH_SUPER_ADMIN') && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-shield-check"></i>
                        컴플라이언스 관리
                    </h2>
                    <div className="management-grid">
                        <div className="management-card" onClick={() => navigate('/admin/compliance')}>
                            <div className={`card__icon card__icon--large card__icon-- compliance`}>
                                <i className="bi bi-shield-check"></i>
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>컴플라이언스 대시보드</h3>
                                <p>개인정보보호법 준수 현황을 모니터링합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/admin/compliance/dashboard')}>
                            <div className={`card__icon card__icon--large card__icon-- compliance-dashboard`}>
                                <i className="bi bi-graph-up"></i>
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>종합 모니터링</h3>
                                <p>실시간 컴플라이언스 현황을 확인합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/admin/compliance/personal-data-processing')}>
                            <div className={`card__icon card__icon--large card__icon-- personal-data`}>
                                <i className="bi bi-person-lines-fill"></i>
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>개인정보 처리 현황</h3>
                                <p>개인정보 처리 현황 및 통계를 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/admin/compliance/destruction')}>
                            <div className={`card__icon card__icon--large card__icon-- data-destruction`}>
                                <i className="bi bi-trash"></i>
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>개인정보 파기 관리</h3>
                                <p>자동화된 개인정보 파기 시스템을 관리합니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ERP 관리 */}
            {PermissionChecks.canAccessERP(userPermissions) && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-box-seam"></i>
                        ERP 관리
                    </h2>
                    <div className="management-grid">
                        <div className="management-card" onClick={() => navigate('/erp/dashboard')}>
                            <div className={`card__icon card__icon--large card__icon-- erp-dashboard`}>
                                <FaChartLine />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>ERP 대시보드</h3>
                                <p>전체 ERP 현황을 한눈에 확인합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/erp/purchase-requests')}>
                            <div className={`card__icon card__icon--large card__icon-- purchase-requests`}>
                                <FaShoppingCart />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>구매 요청</h3>
                                <p>상담사 구매 요청을 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/erp/approvals')}>
                            <div className={`card__icon card__icon--large card__icon-- approvals`}>
                                <FaCheckCircle />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>관리자 승인</h3>
                                <p>구매 요청을 검토하고 승인합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/erp/super-approvals')}>
                            <div className={`card__icon card__icon--large card__icon-- super-approvals`}>
                                <FaCheckCircle />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>수퍼 관리자 승인</h3>
                                <p>최종 승인을 처리합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/erp/items')}>
                            <div className={`card__icon card__icon--large card__icon-- items`}>
                                <FaBox />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>아이템 관리</h3>
                                <p>구매 가능한 아이템을 관리합니다</p>
                            </div>
                        </div>
                        
                        {/* 새로 추가된 ERP 보고서 카드 */}
                        <div className="management-card" onClick={() => setShowErpReport(true)}>
                            <div className={`card__icon card__icon--large card__icon-- erp-reports`}>
                                <FaFileExport />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>ERP 보고서</h3>
                                <p>월별/분기별/연별 재무 보고서를 생성합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/erp/budgets')}>
                            <div className={`card__icon card__icon--large card__icon-- budgets`}>
                                <FaWallet />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>예산 관리</h3>
                                <p>부서별 예산을 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/erp/orders')}>
                            <div className={`card__icon card__icon--large card__icon-- orders`}>
                                <FaTruck />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>주문 관리</h3>
                                <p>발주 및 배송을 관리합니다</p>
                            </div>
                        </div>
                        
                        {PermissionChecks.canViewIntegratedFinance(userPermissions) && (
                            <div className="management-card" onClick={() => navigate('/admin/erp/financial')}>
                                <div className={`card__icon card__icon--large card__icon-- finance-integrated`}>
                                    <FaDollarSign />
                                </div>
                                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                    <h3>통합 재무 관리</h3>
                                    <p>수입/지출 통합 관리 및 대차대조표</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 지점 관리 */}
            {PermissionChecks.canViewHQDashboard(userPermissions) && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-building"></i>
                        지점 관리
                    </h2>
                    <div className="management-grid">
                        <div className="management-card" onClick={() => navigate('/hq/dashboard')}>
                            <div className={`card__icon card__icon--large card__icon-- branch-list`}>
                                <FaBuilding />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>지점 관리</h3>
                                <p>지점 등록, 수정, 통계를 통합 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/admin/branch-create')}>
                            <div className={`card__icon card__icon--large card__icon-- branch-create`}>
                                <FaMapMarkerAlt />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>지점 생성</h3>
                                <p>새로운 지점을 등록합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/admin/branch-hierarchy')}>
                            <div className={`card__icon card__icon--large card__icon-- branch-hierarchy`}>
                                <FaCogs />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>지점 계층 구조</h3>
                                <p>지점 간 계층 관계를 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/admin/branch-managers')}>
                            <div className={`card__icon card__icon--large card__icon-- branch-managers`}>
                                <FaUserCog />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>지점장 관리</h3>
                                <p>지점장을 지정하고 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/admin/branch-status')}>
                            <div className={`card__icon card__icon--large card__icon-- branch-status`}>
                                <FaToggleOn />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>지점 상태 관리</h3>
                                <p>지점 활성화/비활성화를 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className="management-card" onClick={() => navigate('/admin/branch-consultants')}>
                            <div className={`card__icon card__icon--large card__icon-- branch-consultants`}>
                                <FaUserTie />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>지점 상담사 관리</h3>
                                <p>지점별 상담사를 할당하고 관리합니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 통계 및 분석 */}
            {PermissionChecks.canViewStatistics(userPermissions) && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-graph-up"></i>
                        통계 및 분석
                    </h2>
                    <div className="management-grid">
                        <div className="management-card" onClick={() => setShowPerformanceMetrics(true)}>
                            <div className={`card__icon card__icon--large card__icon-- performance-metrics`}>
                                <FaChartBar />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>성과 지표 대시보드</h3>
                                <p>실시간 성과 지표를 확인하고 재계산합니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 상담사 관리 */}
            {PermissionChecks.canManageConsultants(userPermissions) && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-people"></i>
                        상담사 관리
                    </h2>
                    <div className="management-grid">
                        <div className="management-card" onClick={() => setShowSpecialtyManagement(true)}>
                            <div className={`card__icon card__icon--large card__icon-- specialty-management`}>
                                <FaUserGraduate />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>전문분야 관리</h3>
                                <p>상담사별 전문분야를 설정하고 관리합니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 재무 관리 */}
            {PermissionChecks.canAccessFinance(userPermissions) && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-cash-stack"></i>
                        재무 관리
                    </h2>
                    <div className="management-grid">
                        <div className="management-card" onClick={() => {
                            console.log('🔄 반복 지출 모달 열기 버튼 클릭');
                            setShowRecurringExpense(true);
                        }}>
                            <div className={`card__icon card__icon--large card__icon-- recurring-expense`}>
                                <FaRedo />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>반복 지출 관리</h3>
                                <p>정기적인 지출을 설정하고 관리합니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 토스트 알림 */}
            {showToastState && (
                <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.TOAST} toast-${toastType}`} style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.TOAST_HEADER}>
                        <strong className="me-auto">알림</strong>
                        <button type="button" className="btn-close" onClick={() => setShowToastState(false)}></button>
                    </div>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.TOAST_BODY}>{toastMessage}</div>
                </div>
            )}

            {/* 권한 관리 - 지점 수퍼 어드민 이상만 접근 가능 */}
            {(() => {
                const currentRole = (propUser || sessionUser)?.role;
                const canManagePermissions = currentRole === 'BRANCH_SUPER_ADMIN' || 
                                           currentRole === 'HQ_ADMIN' || 
                                           currentRole === 'SUPER_HQ_ADMIN' || 
                                           currentRole === 'HQ_MASTER';
                console.log('🔍 권한 관리 섹션 렌더링 체크:', {
                    currentRole,
                    canManagePermissions,
                    userPermissions
                });
                return canManagePermissions;
            })() && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-shield-check"></i>
                        권한 관리
                    </h2>
                    <div className="permission-management-section">
                        <PermissionManagement />
                    </div>
                </div>
            )}
            
            {/* 통계 모달 */}
            <StatisticsModal
                isOpen={showStatisticsModal}
                onClose={() => setShowStatisticsModal(false)}
                userRole={(propUser || sessionUser)?.role || 'ADMIN'}
            />
            
            {/* 새로 추가된 모달들 */}
            <ErpReportModal
                isOpen={showErpReport}
                onClose={() => setShowErpReport(false)}
            />
            
            <PerformanceMetricsModal
                isOpen={showPerformanceMetrics}
                onClose={() => setShowPerformanceMetrics(false)}
            />
            
            <SpecialtyManagementModal
                isOpen={showSpecialtyManagement}
                onClose={() => setShowSpecialtyManagement(false)}
            />
            
            <RecurringExpenseModal
                isOpen={showRecurringExpense}
                onClose={() => setShowRecurringExpense(false)}
            />
            
            </div>
        </SimpleLayout>
    );
};

export default AdminDashboard;
