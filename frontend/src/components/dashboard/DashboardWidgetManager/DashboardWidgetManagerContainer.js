/**
 * DashboardWidgetManager Container Component
 * 
 * 목적: 위젯 관리 비즈니스 로직 처리
 * 표준: DESIGN_CENTRALIZATION_STANDARD.md 준수
 * 패턴: Container Component (비즈니스 로직 담당)
 * 
 * ✅ 표준화:
 * - 상태 관리 (useState, useEffect)
 * - API 호출 로직
 * - 이벤트 핸들러
 * - Presentation 컴포넌트에 데이터 전달
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */

import React, { useState, useEffect } from 'react';
import DashboardWidgetManagerPresentation from './DashboardWidgetManagerPresentation';

const DashboardWidgetManagerContainer = ({ dashboard, user, onWidgetChange }) => {
  // ========================================
  // 상태 관리
  // ========================================
  const [widgets, setWidgets] = useState([]);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  const [groupedWidgets, setGroupedWidgets] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 사용자 정보 추출
  const tenantId = user?.tenantId;
  const businessType = user?.businessType || 'CONSULTATION';
  const roleCode = user?.role || 'ADMIN';
  
  // ========================================
  // 데이터 로딩
  // ========================================
  
  /**
   * 그룹화된 위젯 조회
   */
  useEffect(() => {
    if (tenantId && businessType && roleCode) {
      fetchGroupedWidgets();
    }
  }, [tenantId, businessType, roleCode]);
  
  /**
   * 독립 위젯 조회 (추가 가능한 위젯)
   */
  useEffect(() => {
    if (businessType) {
      fetchAvailableWidgets();
    }
  }, [businessType]);
  
  /**
   * 그룹화된 위젯 조회 API
   */
  const fetchGroupedWidgets = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/widgets/grouped?businessType=${businessType}&roleCode=${roleCode}`,
        {
          headers: {
            'X-Tenant-ID': tenantId,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGroupedWidgets(result.data);
          
          // 모든 위젯을 평면 배열로 변환
          const allWidgets = Object.values(result.data).flat();
          setWidgets(allWidgets);
        }
      }
    } catch (error) {
      console.error('그룹화된 위젯 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 독립 위젯 조회 API (추가 가능한 위젯)
   */
  const fetchAvailableWidgets = async () => {
    try {
      const response = await fetch(
        `/api/v1/widgets/available?businessType=${businessType}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailableWidgets(result.data);
        }
      }
    } catch (error) {
      console.error('독립 위젯 조회 실패:', error);
    }
  };
  
  // ========================================
  // 이벤트 핸들러
  // ========================================
  
  /**
   * 위젯 추가 핸들러
   */
  const handleAddWidget = async (widgetType) => {
    try {
      const response = await fetch(
        `/api/v1/widgets/dashboards/${dashboard.dashboardId}/widgets`,
        {
          method: 'POST',
          headers: {
            'X-Tenant-ID': tenantId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            widgetType,
            businessType,
            roleCode,
            displayOrder: widgets.length + 1
          })
        }
      );
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(result.message || '위젯이 추가되었습니다');
        setShowAddModal(false);
        fetchGroupedWidgets(); // 새로고침
        if (onWidgetChange) onWidgetChange();
      } else {
        alert(result.message || '위젯 추가에 실패했습니다');
      }
    } catch (error) {
      console.error('위젯 추가 실패:', error);
      alert('위젯 추가 중 오류가 발생했습니다');
    }
  };
  
  /**
   * 위젯 삭제 핸들러
   */
  const handleDeleteWidget = async (widgetId) => {
    if (!confirm('이 위젯을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `/api/v1/widgets/dashboards/${dashboard.dashboardId}/widgets/${widgetId}`,
        {
          method: 'DELETE',
          headers: {
            'X-Tenant-ID': tenantId,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(result.message || '위젯이 삭제되었습니다');
        fetchGroupedWidgets(); // 새로고침
        if (onWidgetChange) onWidgetChange();
      } else {
        alert(result.message || '위젯 삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('위젯 삭제 실패:', error);
      alert('위젯 삭제 중 오류가 발생했습니다');
    }
  };
  
  /**
   * 위젯 설정 핸들러
   */
  const handleConfigureWidget = (widgetId) => {
    // TODO: 위젯 설정 모달 구현
    alert('위젯 설정 기능은 추후 구현 예정입니다');
  };
  
  /**
   * 위젯 추가 모달 열기
   */
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };
  
  /**
   * 위젯 추가 모달 닫기
   */
  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };
  
  // ========================================
  // Presentation 컴포넌트에 전달
  // ========================================
  return (
    <DashboardWidgetManagerPresentation
      // 데이터
      groupedWidgets={groupedWidgets}
      availableWidgets={availableWidgets}
      loading={loading}
      showAddModal={showAddModal}
      
      // 이벤트 핸들러
      onAddWidget={handleAddWidget}
      onDeleteWidget={handleDeleteWidget}
      onConfigureWidget={handleConfigureWidget}
      onShowAddModal={handleShowAddModal}
      onCloseAddModal={handleCloseAddModal}
    />
  );
};

export default DashboardWidgetManagerContainer;

