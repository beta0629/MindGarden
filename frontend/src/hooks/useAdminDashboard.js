import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { fetchUserPermissions } from '../utils/permissionUtils';
import csrfTokenManager from '../utils/csrfTokenManager';
import { sessionManager } from '../utils/sessionManager';

export const useAdminDashboard = () => {
    const navigate = useNavigate();
    const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();
    
    // 상태 관리
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
    
    // 모달 상태들
    const [showErpReport, setShowErpReport] = useState(false);
    const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
    const [showSpecialtyManagement, setShowSpecialtyManagement] = useState(false);
    const [showRecurringExpense, setShowRecurringExpense] = useState(false);
    const [showStatisticsModal, setShowStatisticsModal] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [showToastState, setShowToastState] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [systemStatus, setSystemStatus] = useState({
        server: 'unknown',
        database: 'unknown',
        lastChecked: null
    });
    
    const isInitialized = useRef(false);

    // 초기화
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

    // 토스트 메시지
    const showToast = useCallback((message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToastState(true);
        setTimeout(() => setShowToastState(false), 3000);
    }, []);

    // 통계 로드
    const loadStats = useCallback(async () => {
        try {
            setLoading(true);
            
            // 기본 통계 로드 (실제 존재하는 API 사용)
            const statsResponse = await fetch('/api/admin/statistics/overall', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfTokenManager.getToken()
                },
                credentials: 'include'
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            }

            // 환불 통계 로드 (실제 존재하는 API 사용)
            const refundResponse = await fetch('/api/admin/statistics/overall', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfTokenManager.getToken()
                },
                credentials: 'include'
            });

            if (refundResponse.ok) {
                const refundData = await refundResponse.json();
                setRefundStats(refundData);
            }

            // 대기 입금 통계 로드 (실제 존재하는 API 사용)
            const depositResponse = await fetch('/api/admin/statistics/overall', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfTokenManager.getToken()
                },
                credentials: 'include'
            });

            if (depositResponse.ok) {
                const depositData = await depositResponse.json();
                setPendingDepositStats(depositData);
            }

        } catch (error) {
            console.error('통계 로드 실패:', error);
            showToast('통계 정보를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // 시스템 상태 체크 (실제 존재하는 API 사용)
    const checkSystemStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/statistics-management/plsql/status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfTokenManager.getToken()
                },
                credentials: 'include'
            });

            if (response.ok) {
                const statusData = await response.json();
                setSystemStatus({
                    ...statusData,
                    lastChecked: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('시스템 상태 체크 실패:', error);
        }
    }, []);

    // 초기 데이터 로드
    useEffect(() => {
        if (isLoggedIn && !loading) {
            loadStats();
            checkSystemStatus();
        }
    }, [isLoggedIn, loadStats, checkSystemStatus]);

    return {
        // 상태
        userPermissions,
        stats,
        refundStats,
        pendingDepositStats,
        loading,
        showToastState,
        toastMessage,
        toastType,
        systemStatus,
        
        // 모달 상태
        showErpReport,
        setShowErpReport,
        showPerformanceMetrics,
        setShowPerformanceMetrics,
        showSpecialtyManagement,
        setShowSpecialtyManagement,
        showRecurringExpense,
        setShowRecurringExpense,
        showStatisticsModal,
        setShowStatisticsModal,
        
        // 함수들
        showToast,
        loadStats,
        checkSystemStatus,
        navigate,
        hasPermission
    };
};