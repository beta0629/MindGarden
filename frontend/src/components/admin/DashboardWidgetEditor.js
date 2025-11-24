/**
 * 대시보드 위젯 편집기 컴포넌트
 * 
 * 위젯 추가, 삭제, 설정 기능 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */

import React, { useState } from 'react';
import MGButton from '../common/MGButton';
import { getSupportedWidgetTypes } from '../dashboard/widgets/WidgetRegistry';
import { FaPlus, FaTrash, FaCog, FaGripVertical } from 'react-icons/fa';
import './DashboardWidgetEditor.css';

// 위젯 타입 한글 이름 매핑
const WIDGET_TYPE_NAMES = {
  'welcome': '환영 위젯',
  'statistics': '통계 위젯',
  'summary-statistics': '요약 통계',
  'chart': '차트 위젯',
  'table': '테이블 위젯',
  'calendar': '캘린더 위젯',
  'form': '폼 위젯',
  'activity-list': '활동 목록',
  'quick-actions': '빠른 작업',
  'navigation-menu': '네비게이션 메뉴',
  'message': '메시지 위젯',
  'notification': '알림 위젯',
  'schedule': '일정 위젯',
  'rating': '평점 위젯',
  'payment': '결제 위젯',
  'healing-card': '힐링 카드',
  'purchase-request': '구매 요청',
  'personalized-message': '개인화 메시지',
  'header': '헤더 위젯',
  'erp-card': 'ERP 카드',
  'erp-stats-grid': 'ERP 통계 그리드',
  'erp-management-grid': 'ERP 관리 그리드',
  'system-status': '시스템 상태',
  'system-tools': '시스템 도구',
  'permission': '권한 관리',
  'statistics-grid': '통계 그리드',
  'management-grid': '관리 그리드',
  // 상담소 특화
  'consultation-summary': '상담 요약',
  'consultation-schedule': '상담 일정',
  'consultation-stats': '상담 통계',
  'consultation-record': '상담 기록',
  'consultant-client': '상담사-고객',
  'mapping-management': '매핑 관리',
  'session-management': '세션 관리',
  'schedule-registration': '일정 등록',
  'pending-deposit': '대기 입금',
  'custom': '커스텀 위젯'
};

const DashboardWidgetEditor = ({ 
  widgets = [], 
  onWidgetsChange,
  businessType = null,
  onWidgetConfig 
}) => {
  const [selectedWidget, setSelectedWidget] = useState(null);
  const availableWidgetTypes = getSupportedWidgetTypes(businessType);

  // 위젯 추가
  const handleAddWidget = (widgetType) => {
    // 다음 사용 가능한 위치 계산
    const maxRow = widgets.length > 0 
      ? Math.max(...widgets.map(w => w.position?.row || 0))
      : -1;
    
    // 그리드 컬럼 수 상수 (CSS 변수로 관리 가능하도록)
    const GRID_COLUMNS = 3;
    const widgetsInLastRow = widgets.filter(w => (w.position?.row || 0) === maxRow);
    const nextCol = widgetsInLastRow.length % GRID_COLUMNS;
    const nextRow = nextCol === 0 ? maxRow + 1 : maxRow;

    const newWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: widgetType,
      position: {
        row: nextRow,
        col: nextCol,
        span: 1
      },
      config: {},
      visibility: {
        roles: [],
        conditions: []
      }
    };

    onWidgetsChange([...widgets, newWidget]);
  };

  // 위젯 삭제
  const handleDeleteWidget = (widgetId) => {
    if (window.confirm('이 위젯을 삭제하시겠습니까?')) {
      onWidgetsChange(widgets.filter(w => w.id !== widgetId));
    }
  };

  // 위젯 설정 열기
  const handleConfigWidget = (widget) => {
    setSelectedWidget(widget);
    if (onWidgetConfig) {
      onWidgetConfig(widget);
    }
  };

  // 위젯 타입 이름 가져오기
  const getWidgetTypeName = (widgetType) => {
    return WIDGET_TYPE_NAMES[widgetType] || widgetType;
  };

  return (
    <div className="dashboard-widget-editor">
      {/* 사용 가능한 위젯 목록 */}
      <div className="widget-editor-section">
        <h3 className="widget-editor-section-title">
          사용 가능한 위젯
        </h3>
        <div className="available-widgets-grid">
          {availableWidgetTypes.map(widgetType => (
            <button
              key={widgetType}
              className="available-widget-item"
              onClick={() => handleAddWidget(widgetType)}
              title={getWidgetTypeName(widgetType)}
            >
              <FaPlus className="widget-add-icon" />
              <span className="widget-type-name">
                {getWidgetTypeName(widgetType)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 현재 위젯 목록 */}
      <div className="widget-editor-section">
        <h3 className="widget-editor-section-title">
          현재 위젯 ({widgets.length}개)
        </h3>
        {widgets.length === 0 ? (
          <div className="widget-empty-state">
            <p>추가된 위젯이 없습니다. 위에서 위젯을 추가해주세요.</p>
          </div>
        ) : (
          <div className="current-widgets-list">
            {widgets.map((widget, index) => (
              <div key={widget.id} className="current-widget-item">
                <div className="widget-item-handle">
                  <FaGripVertical className="widget-drag-handle" />
                  <span className="widget-item-number">{index + 1}</span>
                </div>
                <div className="widget-item-info">
                  <span className="widget-item-type">
                    {getWidgetTypeName(widget.type)}
                  </span>
                  <span className="widget-item-position">
                    위치: 행 {widget.position?.row || 0}, 열 {widget.position?.col || 0}
                    {widget.position?.span && widget.position.span > 1 
                      ? ` (${widget.position.span}칸)` 
                      : ''}
                  </span>
                </div>
                <div className="widget-item-actions">
                  <MGButton
                    variant="secondary"
                    size="small"
                    onClick={() => handleConfigWidget(widget)}
                    className="widget-config-btn"
                  >
                    <FaCog /> 설정
                  </MGButton>
                  <MGButton
                    variant="danger"
                    size="small"
                    onClick={() => handleDeleteWidget(widget.id)}
                    className="widget-delete-btn"
                  >
                    <FaTrash /> 삭제
                  </MGButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWidgetEditor;

