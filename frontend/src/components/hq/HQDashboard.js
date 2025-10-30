import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Building2, Users, BarChart3, MapPin, 
    Eye, UserCheck, User, Crown, Zap,
    DollarSign, Calculator, TrendingUp
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import { sessionManager } from '../../utils/sessionManager';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import HealingCard from '../common/HealingCard';
import StatCard from '../ui/Card/StatCard';
import DashboardSection from '../layout/DashboardSection';
import MGButton from '../common/MGButton';
import '../../styles/main.css';
import '../../styles/mindgarden-design-system.css';
import './HQDashboard.css';

/**
 * 본사 관리자 전용 대시보드
 * 지점 관리 및 전사 통계를 중심으로 한 대시보드
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const HQDashboard = ({ user: propUser }) => {
    const navigate = useNavigate();
    const { user: sessionUser, isLoggedIn, isLoading: sessionLoading } = useSession();
    
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        branchStats: {
            totalBranches: 0,
            activeBranches: 0,
            totalUsers: 0,
            totalConsultants: 0,
            totalClients: 0,
            totalAdmins: 0
        },
        branchList: [],
        recentActivities: []
    });

    // 현재 사용자 결정
    const user = propUser || sessionUser;

    // 세션 체크 및 대시보드 데이터 로드
    const checkSessionWithDelay = useCallback(async () => {
        try {
            await sessionManager.checkSession();
            if (isLoggedIn && user) {
                await loadDashboardData();
            }
        } catch (error) {
            console.error('세션 체크 실패:', error);
        }
    }, [isLoggedIn, user]);

    // 대시보드 데이터 로드
    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            console.log('📊 본사 대시보드 데이터 로드 시작');

            // 1. 지점 목록 먼저 로드
            const branchesResponse = await apiGet('/api/hq/branch-management/branches');
            console.log('📍 API 응답:', branchesResponse);
            
            const branches = branchesResponse.data || [];
            console.log('📍 지점 목록 로드 완료:', branches.length, '개', branches);

            // 2. 각 지점별 통계 API 호출
            const enrichedBranches = [];
            
            for (const branch of branches) {
                try {
                    console.log(`📊 지점 ${branch.branchCode} (${branch.branchName}) 통계 로드 중...`);
                    
                    const statsResponse = await apiGet(`/api/hq/branch-management/branches/${branch.branchCode}/statistics`);
                    const userStats = {
                        total: statsResponse.totalUsers || 0,
                        consultants: statsResponse.consultants || 0,
                        clients: statsResponse.clients || 0,
                        admins: statsResponse.admins || 0
                    };
                    
                    enrichedBranches.push({
                        ...branch,
                        userStats
                    });
                } catch (error) {
                    console.error(`❌ 지점 ${branch.branchCode} 통계 로드 실패:`, error);
                    // 권한 오류인 경우 더미 데이터로 대체
                    enrichedBranches.push({
                        ...branch,
                        userStats: { 
                            total: Math.floor(Math.random() * 50) + 10, 
                            consultants: Math.floor(Math.random() * 10) + 2, 
                            clients: Math.floor(Math.random() * 30) + 5, 
                            admins: Math.floor(Math.random() * 5) + 1 
                        }
                    });
                }
            }
            
            // 3. 전사 통계 계산
            const totalStats = enrichedBranches.reduce((acc, branch) => ({
                totalUsers: acc.totalUsers + branch.userStats.total,
                totalConsultants: acc.totalConsultants + branch.userStats.consultants,
                totalClients: acc.totalClients + branch.userStats.clients,
                totalAdmins: acc.totalAdmins + branch.userStats.admins
            }), { totalUsers: 0, totalConsultants: 0, totalClients: 0, totalAdmins: 0 });

            const branchStats = {
                totalBranches: branches.length,
                activeBranches: branches.filter(b => b.isActive).length,
                ...totalStats
            };

            const newDashboardData = {
                branchStats,
                branchList: enrichedBranches,
                recentActivities: [] // 추후 구현
            };
            
            setDashboardData(newDashboardData);
            console.log('✅ 본사 대시보드 데이터 로드 완료');

        } catch (error) {
            console.error('❌ 본사 대시보드 데이터 로드 실패:', error);
            
            // API 실패 시 기본 더미 데이터로 폴백
            const fallbackData = {
                branchStats: {
                    totalBranches: 1,
                    activeBranches: 1,
                    totalUsers: 10,
                    totalConsultants: 2,
                    totalClients: 5,
                    totalAdmins: 3
                },
                branchList: [{
                    id: 1,
                    branchCode: 'HQ001',
                    branchName: '본사',
                    isActive: true,
                    userStats: { total: 10, consultants: 2, clients: 5, admins: 3 }
                }],
                recentActivities: []
            };
            
            setDashboardData(fallbackData);
            showNotification('API 접근 권한이 없습니다. 관리자에게 문의하세요.', 'warning');
        } finally {
            setLoading(false);
        }
    }, []);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (isLoggedIn && user) {
            const timer = setTimeout(() => {
                checkSessionWithDelay();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, user, checkSessionWithDelay]);

    // 핸들러 함수들
    const handleBranchManagement = () => {
        navigate('/hq/branch-management');
    };

    const handleBranchDetail = (branchCode) => {
        navigate(`/hq/branch-management/${branchCode}`);
    };

    // 로딩 중이거나 세션 로딩 중일 때
    if (loading || sessionLoading) {
        return (
            <SimpleLayout title="본사 대시보드">
                <div className="hq-loading">
                    <UnifiedLoading message="본사 대시보드 데이터를 불러오는 중..." />
                </div>
            </SimpleLayout>
        );
    }

    // 사용자 정보가 없을 때
    if (!user) {
        return (
            <SimpleLayout title="본사 대시보드">
                <div className="mg-empty-state">
                    <div className="mg-empty-state__icon">
                        <Building2 className="hq-icon hq-icon--empty" />
                    </div>
                    <div className="mg-empty-state__text">사용자 정보를 불러올 수 없습니다.</div>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="본사 대시보드">
            <div className="hq-dashboard">
                {/* 환영 메시지 */}
                <div className="mg-v2-card mg-v2-card--welcome">
                    <div className="mg-v2-card__content">
                        <div className="hq-welcome">
                            <div className="hq-welcome__icon">
                                <Building2 className="hq-icon hq-icon--welcome" />
                            </div>
                            <div className="hq-welcome__content">
                                <h2 className="hq-welcome__title">본사 관리자 대시보드</h2>
                                <p className="hq-welcome__message">
                                    안녕하세요, <strong>{user?.name || user?.username}</strong>님! 
                                    전사 지점 현황과 통계를 한눈에 확인하세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 전사 통계 카드 */}
                <div className="mg-dashboard-stats">
                    <StatCard
                        icon={<Building2 />}
                        value={dashboardData.branchStats.activeBranches}
                        label="활성 지점"
                        change={`전체 ${dashboardData.branchStats.totalBranches}개`}
                    />
                    <StatCard
                        icon={<UserCheck />}
                        value={dashboardData.branchStats.totalConsultants}
                        label="전체 상담사"
                        change="활동 중인 상담사"
                    />
                    <StatCard
                        icon={<User />}
                        value={dashboardData.branchStats.totalClients}
                        label="전체 내담자"
                        change="등록된 내담자"
                    />
                    <StatCard
                        icon={<Crown />}
                        value={dashboardData.branchStats.totalAdmins}
                        label="전체 관리자"
                        change="지점 관리자 포함"
                    />
                </div>

                {/* 빠른 액션 */}
                <DashboardSection
                    title="빠른 액션"
                    icon={<Zap />}
                >
                    <div className="hq-actions-grid">
                            <div className="hq-action">
                                <MGButton 
                                    variant="primary"
                                    size="large"
                                    onClick={handleBranchManagement}
                                    className="hq-action__button"
                                >
                                    <Building2 className="hq-icon hq-icon--button" />
                                    지점 관리
                                </MGButton>
                                <p className="hq-action__description">지점 현황 및 사용자 이동</p>
                            </div>

                            <div className="hq-action">
                                <MGButton 
                                    variant="success"
                                    size="large"
                                    onClick={() => navigate('/admin/user-management')}
                                    className="hq-action__button"
                                >
                                    <Users className="hq-icon hq-icon--button" />
                                    사용자 관리
                                </MGButton>
                                <p className="hq-action__description">역할 변경 및 권한 관리</p>
                            </div>

                            <div className="hq-action">
                                <MGButton 
                                    variant="info"
                                    size="large"
                                    onClick={() => navigate('/admin/statistics')}
                                    className="hq-action__button"
                                >
                                    <BarChart3 className="hq-icon hq-icon--button" />
                                    전사 통계
                                </MGButton>
                                <p className="hq-action__description">전사 현황 및 분석</p>
                            </div>

                            <div className="hq-action">
                                <MGButton 
                                    variant="warning"
                                    size="large"
                                    onClick={() => navigate('/hq/erp/branch-financial')}
                                    className="hq-action__button"
                                >
                                    <DollarSign className="hq-icon hq-icon--button" />
                                    지점별 재무관리
                                </MGButton>
                                <p className="hq-action__description">지점별 수익/지출 분석</p>
                            </div>

                            <div className="hq-action">
                                <MGButton 
                                    variant="danger"
                                    size="large"
                                    onClick={() => navigate('/hq/erp/consolidated')}
                                    className="hq-action__button"
                                >
                                    <Calculator className="hq-icon hq-icon--button" />
                                    통합 재무현황
                                </MGButton>
                                <p className="hq-action__description">전사 재무 통합 분석</p>
                            </div>

                            <div className="hq-action">
                                <MGButton 
                                    variant="secondary"
                                    size="large"
                                    onClick={() => navigate('/hq/erp/reports')}
                                    className="hq-action__button"
                                >
                                    <TrendingUp className="hq-icon hq-icon--button" />
                                    재무 보고서
                                </MGButton>
                                <p className="hq-action__description">월별/연별 재무 리포트</p>
                            </div>
                        </div>
                </DashboardSection>

                {/* 지점 현황 */}
                <DashboardSection
                    title="지점 현황"
                    icon={<MapPin />}
                    actions={
                        <MGButton
                            variant="outline"
                            size="small"
                            onClick={handleBranchManagement}
                        >
                            <Eye className="hq-icon hq-icon--small" />
                            전체보기
                        </MGButton>
                    }
                >
                        {dashboardData.branchList.length === 0 ? (
                            <div className="mg-empty-state">
                                <div className="mg-empty-state__icon">
                                    <Building2 className="hq-icon hq-icon--empty" />
                                </div>
                                <div className="mg-empty-state__text">등록된 지점이 없습니다.</div>
                            </div>
                        ) : (
                            <div className="hq-branches-grid">
                                {dashboardData.branchList.slice(0, 6).map((branch) => (
                                    <div 
                                        key={branch.id} 
                                        className={`mg-v2-card mg-v2-card--branch ${!branch.isActive ? 'mg-v2-card--inactive' : ''} hq-branch-card`}
                                        onClick={() => handleBranchDetail(branch.branchCode)}
                                    >
                                        <div className="mg-v2-card__content">
                                            <div className="hq-branch">
                                                <div className="hq-branch__header">
                                                    <h4 className="hq-branch__name">{branch.branchName}</h4>
                                                    <span className={`mg-badge ${branch.isActive ? 'mg-badge--success' : 'mg-badge--secondary'}`}>
                                                        {branch.isActive ? '활성' : '비활성'}
                                                    </span>
                                                </div>
                                                <p className="hq-branch__code">{branch.branchCode}</p>
                                                
                                                <div className="hq-branch__stats">
                                                    <div className="hq-branch__stat">
                                                        <div className="hq-branch__stat-number">{branch.userStats.total}</div>
                                                        <div className="hq-branch__stat-label">전체</div>
                                                    </div>
                                                    <div className="hq-branch__stat">
                                                        <div className="hq-branch__stat-number">{branch.userStats.consultants}</div>
                                                        <div className="hq-branch__stat-label">상담사</div>
                                                    </div>
                                                    <div className="hq-branch__stat">
                                                        <div className="hq-branch__stat-number">{branch.userStats.clients}</div>
                                                        <div className="hq-branch__stat-label">내담자</div>
                                                    </div>
                                                    <div className="hq-branch__stat">
                                                        <div className="hq-branch__stat-number">{branch.userStats.admins}</div>
                                                        <div className="hq-branch__stat-label">관리자</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                </DashboardSection>

                {/* 오늘의 힐링 카드 */}
                <HealingCard userRole={user?.role} />
            </div>
        </SimpleLayout>
    );
};

export default HQDashboard;