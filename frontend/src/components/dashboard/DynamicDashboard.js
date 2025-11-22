/**
 * 동적 대시보드 컴포넌트
 * 백엔드에서 조회한 대시보드 정보를 기반으로 적절한 대시보드 컴포넌트를 동적으로 로드
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import { getCurrentUserDashboard, getDashboardComponentName } from '../../utils/dashboardUtils';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import notificationManager from '../../utils/notification';

// 대시보드 컴포넌트 동적 import
import CommonDashboard from './CommonDashboard';
import ClientDashboard from '../client/ClientDashboard';
import AdminDashboard from '../admin/AdminDashboard';
import HQDashboard from '../hq/HQDashboard';
import AcademyDashboard from '../academy/AcademyDashboard';

const DASHBOARD_COMPONENTS = {
  'CommonDashboard': CommonDashboard,
  'ClientDashboard': ClientDashboard,
  'AdminDashboard': AdminDashboard,
  'HQDashboard': HQDashboard,
  'AcademyDashboard': AcademyDashboard
};

const DynamicDashboard = ({ user: propUser, dashboard: propDashboard }) => {
  const navigate = useNavigate();
  const { user: sessionUser, isLoading: sessionLoading } = useSession();
  const [dashboard, setDashboard] = useState(propDashboard);
  const [isLoading, setIsLoading] = useState(!propDashboard);
  const [error, setError] = useState(null);
  
  const currentUser = propUser || sessionUser || sessionManager.getUser();

  // 인증 체크: 사용자가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    // 세션이 로딩 중이면 대기
    if (sessionLoading) {
      return;
    }

    // 사용자 정보가 없으면 로그인 페이지로 리다이렉트
    if (!currentUser || !currentUser.id) {
      console.log('❌ 사용자 정보 없음, 로그인 페이지로 이동');
      navigate('/login', { replace: true });
      return;
    }
  }, [currentUser, sessionLoading, navigate]);

  useEffect(() => {
    // propDashboard가 없으면 조회
    if (!propDashboard && currentUser && currentUser.id) {
      loadDashboard();
    }
  }, [currentUser, propDashboard]);

  const loadDashboard = async () => {
    if (!currentUser) {
      setError('사용자 정보가 없습니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 사용자 정보에 tenantId가 없으면 최신 정보 다시 로드 시도
      let userWithTenant = currentUser;
      if (!currentUser.tenantId) {
        console.warn('⚠️ 사용자 정보에 tenantId가 없음, 최신 정보 다시 로드 시도');
        try {
          // sessionManager를 통해 최신 사용자 정보 가져오기
          await sessionManager.checkSession(true);
          const latestUser = sessionManager.getUser();
          if (latestUser && latestUser.tenantId) {
            userWithTenant = latestUser;
            console.log('✅ 최신 사용자 정보 로드 완료, tenantId:', latestUser.tenantId);
          }
        } catch (reloadError) {
          console.warn('⚠️ 최신 사용자 정보 로드 실패:', reloadError);
        }
      }

      const tenantId = userWithTenant.tenantId;
      const tenantRoleId = userWithTenant.currentTenantRoleId || 
                          userWithTenant.tenantRole?.tenantRoleId ||
                          null;

      if (!tenantId) {
        // tenantId가 없으면 역할 기반 라우팅으로 폴백
        console.warn('⚠️ 테넌트 정보가 없어 역할 기반 라우팅으로 폴백합니다.');
        const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
        const authResponse = {
          user: userWithTenant,
          currentTenantRole: sessionManager.getCurrentTenantRole()
        };
        await redirectToDynamicDashboard(authResponse, navigate);
        setIsLoading(false);
        return;
      }

      const dashboardData = await getCurrentUserDashboard(tenantId, tenantRoleId);

      if (dashboardData) {
        setDashboard(dashboardData);
      } else {
        // 대시보드가 없으면 역할 기반 라우팅으로 폴백
        console.warn('⚠️ 대시보드를 찾을 수 없어 역할 기반 라우팅으로 폴백합니다.');
        const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
        const authResponse = {
          user: userWithTenant,
          currentTenantRole: sessionManager.getCurrentTenantRole()
        };
        await redirectToDynamicDashboard(authResponse, navigate);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error('❌ 대시보드 로드 실패:', err);
      setError(err.message || '대시보드를 불러오는 중 오류가 발생했습니다.');
      notificationManager.show('대시보드를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <UnifiedLoading message="대시보드를 불러오는 중..." />
        </div>
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          padding: '2rem'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>대시보드 로드 실패</h2>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={loadDashboard}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
      </SimpleLayout>
    );
  }

  // 대시보드 타입에 따라 적절한 컴포넌트 선택
  // 관리자 역할인 경우 AdminDashboard 컴포넌트 사용
  const userRole = currentUser?.role;
  const adminRoles = ['ADMIN', 'BRANCH_MANAGER', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER'];
  const isAdmin = userRole && adminRoles.includes(userRole);
  
  let DashboardComponent;
  if (isAdmin) {
    // 관리자는 AdminDashboard 컴포넌트 사용 (동적 대시보드 데이터는 전달)
    DashboardComponent = AdminDashboard;
  } else {
    // 일반 사용자는 대시보드 타입에 따라 컴포넌트 선택
    const dashboardType = dashboard?.dashboardType || currentUser?.role || 'DEFAULT';
    const componentName = getDashboardComponentName(dashboardType);
    DashboardComponent = DASHBOARD_COMPONENTS[componentName] || CommonDashboard;
  }

  console.log('🎯 동적 대시보드 렌더링:', {
    userRole,
    isAdmin,
    dashboardType: dashboard?.dashboardType,
    componentName: isAdmin ? 'AdminDashboard' : getDashboardComponentName(dashboard?.dashboardType || currentUser?.role || 'DEFAULT'),
    hasDashboard: !!dashboard,
    user: currentUser
  });

  return (
    <DashboardComponent 
      user={currentUser}
      dashboard={dashboard}
    />
  );
};

export default DynamicDashboard;

