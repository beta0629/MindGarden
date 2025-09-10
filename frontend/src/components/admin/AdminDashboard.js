import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Alert } from 'react-bootstrap';
import { FaUsers, FaUserTie, FaLink, FaCalendarAlt, FaCalendarCheck, FaCog, FaDollarSign, FaChartLine, FaCreditCard, FaReceipt, FaFileAlt, FaCogs, FaBox, FaShoppingCart, FaCheckCircle, FaWallet, FaTruck } from 'react-icons/fa';
import SimpleLayout from '../layout/SimpleLayout';
import TodayStatistics from './TodayStatistics';
import SystemStatus from './system/SystemStatus';
import SystemTools from './system/SystemTools';
import StatisticsModal from '../common/StatisticsModal';
import { useSession } from '../../contexts/SessionContext';
import { COMPONENT_CSS, ICONS } from '../../constants/css-variables';
import './AdminDashboard.css';
import './system/SystemStatus.css';
import './system/SystemTools.css';

const AdminDashboard = ({ user: propUser }) => {
    const navigate = useNavigate();
    const { user: sessionUser, isLoggedIn, isLoading: sessionLoading } = useSession();
    const [stats, setStats] = useState({
        totalConsultants: 0,
        totalClients: 0,
        totalMappings: 0,
        activeMappings: 0
    });
    
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

    // 세션 체크 및 권한 확인
    useEffect(() => {
        if (sessionLoading) {
            console.log('⏳ 세션 로딩 중...');
            return;
        }

        if (!isLoggedIn) {
            console.log('❌ 로그인되지 않음, 로그인 페이지로 이동');
            navigate('/login', { replace: true });
            return;
        }

        const currentUser = propUser || sessionUser;
        if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPER_ADMIN') {
            console.log('❌ 관리자 권한 없음, 대시보드로 이동');
            navigate('/dashboard', { replace: true });
            return;
        }
    }, [isLoggedIn, sessionLoading, propUser, sessionUser, navigate]);

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

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const createTestData = async () => {
        try {
            const response = await fetch('/api/test/create-test-data', {
                method: 'POST'
            });

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
            const response = await fetch('/api/admin/cache/clear', {
                method: 'POST'
            });

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
            const response = await fetch('/api/admin/backup/create', {
                method: 'POST'
            });

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
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>세션 확인 중...</p>
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
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>등록된 상담사</div>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.OVERVIEW_CARD}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.CARD_ICON} clients`}>
                            <FaUsers />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_CONTENT}>
                            <h3>내담자</h3>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_VALUE}>{stats.totalClients}명</div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.CARD_DESCRIPTION}>등록된 내담자</div>
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
            </div>

            {/* 관리 기능 */}
            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                    <i className={ICONS.BI.GEAR}></i>
                    관리 기능
                </h2>
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_GRID}>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/admin/schedule')}>
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
                    
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/admin/consultant-comprehensive')}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} consultants`}>
                            <FaUserTie />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>상담사 관리</h3>
                            <p>상담사 정보를 관리합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/admin/client-comprehensive')}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} clients`}>
                            <FaUsers />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>내담자 관리</h3>
                            <p>내담자 정보를 관리합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/admin/mapping-management')}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} mappings`}>
                            <FaLink />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>매핑 관리</h3>
                            <p>상담사와 내담자 매핑을 관리합니다</p>
                        </div>
                    </div>
                    
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/admin/common-codes')}>
                        <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} consultants`}>
                            <FaCog />
                        </div>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                            <h3>공통코드 관리</h3>
                            <p>시스템 공통코드를 관리합니다</p>
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

            {/* ERP 관리 (어드민/수퍼어드민) */}
            {((propUser || sessionUser)?.role === 'ADMIN' || (propUser || sessionUser)?.role === 'SUPER_ADMIN') && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-box-seam"></i>
                        ERP 관리
                    </h2>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_GRID}>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/approvals')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} approvals`}>
                                <FaCheckCircle />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>구매 요청 승인</h3>
                                <p>상담사 구매 요청을 검토하고 승인합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/items')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} items`}>
                                <FaBox />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>아이템 관리</h3>
                                <p>구매 가능한 아이템을 등록하고 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/purchase-requests')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} purchase-requests`}>
                                <FaShoppingCart />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>구매 요청 현황</h3>
                                <p>전체 구매 요청 현황을 확인합니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 재무 관리 (수퍼어드민 전용) */}
            {(propUser || sessionUser)?.role === 'SUPER_ADMIN' && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className={ICONS.BI.CURRENCY_DOLLAR}></i>
                        재무 관리
                    </h2>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_GRID}>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/super-admin/finance')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} finance`}>
                                <FaDollarSign />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>자금 대시보드</h3>
                                <p>전체 재무 현황을 한눈에 확인합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/super-admin/revenue')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} revenue`}>
                                <FaChartLine />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>수익 관리</h3>
                                <p>수익 현황을 관리하고 분석합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/super-admin/expenses')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} expenses`}>
                                <FaReceipt />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>지출 관리</h3>
                                <p>지출 내역을 관리하고 분석합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/super-admin/payments')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} payments`}>
                                <FaCreditCard />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>결제 관리</h3>
                                <p>결제 내역을 관리하고 처리합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/super-admin/finance-reports')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} reports`}>
                                <FaFileAlt />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>재무 보고서</h3>
                                <p>재무 보고서를 생성하고 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/super-admin/finance-settings')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} settings`}>
                                <FaCogs />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>자금 설정</h3>
                                <p>재무 관련 설정을 관리합니다</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ERP 관리 (수퍼어드민 전용) */}
            {(propUser || sessionUser)?.role === 'SUPER_ADMIN' && (
                <div className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION}>
                    <h2 className={COMPONENT_CSS.ADMIN_DASHBOARD.SECTION_TITLE}>
                        <i className="bi bi-box-seam"></i>
                        ERP 관리
                    </h2>
                    <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_GRID}>
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/dashboard')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} erp-dashboard`}>
                                <FaChartLine />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>ERP 대시보드</h3>
                                <p>전체 ERP 현황을 한눈에 확인합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/purchase-requests')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} purchase-requests`}>
                                <FaShoppingCart />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>구매 요청</h3>
                                <p>상담사 구매 요청을 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/approvals')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} approvals`}>
                                <FaCheckCircle />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>관리자 승인</h3>
                                <p>구매 요청을 검토하고 승인합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/super-approvals')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} super-approvals`}>
                                <FaCheckCircle />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>수퍼 관리자 승인</h3>
                                <p>최종 승인을 처리합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/items')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} items`}>
                                <FaBox />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>아이템 관리</h3>
                                <p>구매 가능한 아이템을 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/budgets')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} budgets`}>
                                <FaWallet />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>예산 관리</h3>
                                <p>부서별 예산을 관리합니다</p>
                            </div>
                        </div>
                        
                        <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CARD} onClick={() => navigate('/erp/orders')}>
                            <div className={`${COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_ICON} orders`}>
                                <FaTruck />
                            </div>
                            <div className={COMPONENT_CSS.ADMIN_DASHBOARD.MANAGEMENT_CONTENT}>
                                <h3>주문 관리</h3>
                                <p>발주 및 배송을 관리합니다</p>
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
            
            {/* 통계 모달 */}
            <StatisticsModal
                isOpen={showStatisticsModal}
                onClose={() => setShowStatisticsModal(false)}
                userRole={(propUser || sessionUser)?.role || 'ADMIN'}
            />
            
            </div>
        </SimpleLayout>
    );
};

export default AdminDashboard;
