/**
 * 테넌트 선택 컴포넌트
 * Phase 3: 멀티 테넌트 사용자 지원
 * 
 * 여러 테넌트에 접근 가능한 사용자가 테넌트를 선택하는 화면
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import CommonPageTemplate from '../common/CommonPageTemplate';
import SimpleLayout from '../layout/SimpleLayout';
import { API_BASE_URL } from '../../constants/api';
import { sessionManager } from '../../utils/sessionManager';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import notificationManager from '../../utils/notification';
import '../../styles/auth/TenantSelection.css';

const TenantSelection = ({ tenants, onSelect, onCancel }) => {
  const navigate = useNavigate();
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 기본 테넌트가 있으면 자동 선택
    if (tenants.length === 1) {
      setSelectedTenantId(tenants[0].tenantId);
    }
  }, [tenants]);

  // 테넌트 선택 완료 핸들러
  const handleTenantSelected = async (tenantId) => {
    setIsLoading(true);
    try {
      console.log('🔄 테넌트 전환 요청:', tenantId);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/tenant/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ tenantId })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ 테넌트 전환 성공:', data);
          
          // 세션 정보 갱신
          const user = sessionManager.getUser();
          if (user) {
            // 테넌트 정보 업데이트
            user.tenantId = tenantId;
            
            // 선택한 테넌트 정보에서 역할 정보 가져오기
            const selectedTenant = tenants.find(t => t.tenantId === tenantId);
            if (selectedTenant && selectedTenant.role) {
              user.role = selectedTenant.role;
            }
            
            sessionManager.setUser(user, sessionManager.getSessionInfo());
            
            // 잠시 대기 후 동적 대시보드로 리다이렉트
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // AuthResponse 형태로 변환
            const authResponse = {
              success: true,
              user: user,
              currentTenantRole: selectedTenant?.tenantRole || null,
              accessibleTenants: tenants
            };
            
            console.log('🎯 테넌트 선택 후 동적 대시보드로 리다이렉트');
            await redirectToDynamicDashboard(authResponse, navigate);
          } else {
            // 사용자 정보가 없어도 대시보드로 이동 시도
            console.log('⚠️ 사용자 정보 없음, 기본 대시보드로 이동');
            window.location.href = '/client/dashboard';
          }
        } else {
          throw new Error(data.message || '테넌트 전환 실패');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '테넌트 전환 API 호출 실패');
      }
    } catch (error) {
      console.error('❌ 테넌트 전환 오류:', error);
      notificationManager.show('테넌트 전환 중 오류가 발생했습니다.', 'error');
      setIsLoading(false);
    }
  };

  const handleSelect = async (tenantId) => {
    setSelectedTenantId(tenantId);
    
    // onSelect가 있으면 사용, 없으면 직접 처리
    if (onSelect) {
      setIsLoading(true);
      try {
        await onSelect(tenantId);
      } catch (error) {
        console.error('테넌트 선택 오류:', error);
        notificationManager.show('테넌트 선택 중 오류가 발생했습니다.', 'error');
        setIsLoading(false);
      }
    } else {
      // onSelect가 없으면 직접 처리
      await handleTenantSelected(tenantId);
    }
  };

  const handleCancel = async () => {
    if (onCancel) {
      await onCancel();
    } else {
      await sessionManager.logout();
      window.location.href = '/login';
    }
  };

  return (
    <CommonPageTemplate>
      <SimpleLayout>
        <div className="tenant-selection">
          <div className="tenant-selection__container">
            <div className="tenant-selection__header">
              <h1 className="tenant-selection__title">테넌트 선택</h1>
              <p className="tenant-selection__subtitle">
                접근 가능한 테넌트를 선택해주세요
              </p>
            </div>

            <div className="tenant-selection__list">
              {tenants.map((tenant) => (
                <button
                  key={tenant.tenantId}
                  type="button"
                  onClick={() => handleSelect(tenant.tenantId)}
                  disabled={isLoading}
                  className={`tenant-selection__item ${
                    selectedTenantId === tenant.tenantId
                      ? 'tenant-selection__item--selected'
                      : ''
                  }`}
                >
                  <div className="tenant-selection__item-content">
                    <div className="tenant-selection__item-name">{tenant.tenantName || tenant.name}</div>
                    <div className="tenant-selection__item-meta">
                      <span className="tenant-selection__item-type">{tenant.businessType}</span>
                      {tenant.status && (
                        <span className={`tenant-selection__item-status tenant-selection__item-status--${tenant.status.toLowerCase()}`}>
                          {tenant.status}
                        </span>
                      )}
                      {tenant.role && (
                        <span className="tenant-selection__item-role">{tenant.role}</span>
                      )}
                    </div>
                  </div>
                  {selectedTenantId === tenant.tenantId && (
                    <div className="tenant-selection__item-check">✓</div>
                  )}
                </button>
              ))}
            </div>

            <div className="tenant-selection__actions">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="tenant-selection__cancel-button"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => selectedTenantId && handleSelect(selectedTenantId)}
                disabled={!selectedTenantId || isLoading}
                className="tenant-selection__confirm-button"
              >
                {isLoading ? <div className="mg-loading">로딩중...</div> : '선택'}
              </button>
            </div>
          </div>
        </div>
      </SimpleLayout>
    </CommonPageTemplate>
  );
};

export default TenantSelection;

