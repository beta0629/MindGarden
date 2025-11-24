/**
 * 대시보드 레이아웃 편집기 컴포넌트
 * 
 * 드래그 앤 드롭으로 위젯 위치를 변경할 수 있는 편집기
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */

import React, { useState, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import MGButton from '../common/MGButton';
import { FaGripVertical, FaTrash, FaCog } from 'react-icons/fa';
import './DashboardLayoutEditor.css';

// 위젯 타입 한글 이름 매핑 (DashboardWidgetEditor와 동일)
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

const DashboardLayoutEditor = ({ 
  widgets = [], 
  onWidgetsChange,
  onWidgetConfig,
  onWidgetDelete,
  columns = 3 
}) => {
  const [widgetList, setWidgetList] = useState([]);

  // 위젯 목록 초기화
  useEffect(() => {
    // position 기준으로 정렬 (row, col 순서)
    const sorted = [...widgets].sort((a, b) => {
      const aRow = a.position?.row || 0;
      const bRow = b.position?.row || 0;
      if (aRow !== bRow) {
        return aRow - bRow;
      }
      return (a.position?.col || 0) - (b.position?.col || 0);
    });
    setWidgetList(sorted);
  }, [widgets]);

  // 드래그 앤 드롭으로 순서 변경
  const handleSort = (newList) => {
    // 새로운 순서에 따라 position 업데이트
    const updatedWidgets = newList.map((widget, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      return {
        ...widget,
        position: {
          row,
          col,
          span: widget.position?.span || 1
        }
      };
    });

    setWidgetList(updatedWidgets);
    onWidgetsChange(updatedWidgets);
  };

  // 위젯 삭제
  const handleDelete = (widgetId) => {
    if (onWidgetDelete) {
      onWidgetDelete(widgetId);
    } else {
      onWidgetsChange(widgetList.filter(w => w.id !== widgetId));
    }
  };

  // 위젯 타입 이름 가져오기
  const getWidgetTypeName = (widgetType) => {
    return WIDGET_TYPE_NAMES[widgetType] || widgetType;
  };

  // 그리드 컬럼 수를 CSS 변수로 설정
  const getGridContainerClass = () => {
    return `layout-grid-container layout-grid-${columns}-cols`;
  };

  // 위젯 span 클래스 생성
  const getWidgetSpanClass = (span) => {
    const normalizedSpan = Math.min(Math.max(span || 1, 1), 12);
    return `widget-span-${normalizedSpan}`;
  };

  return (
    <div className="dashboard-layout-editor">
      <div className="layout-editor-header">
        <h3 className="layout-editor-title">
          레이아웃 편집 (드래그하여 위치 변경)
        </h3>
        <div className="layout-editor-info">
          <span className="widget-count">위젯 {widgetList.length}개</span>
          <span className="grid-info">{columns}열 그리드</span>
        </div>
      </div>

      {widgetList.length === 0 ? (
        <div className="layout-empty-state">
          <p>위젯이 없습니다. 위젯을 추가해주세요.</p>
        </div>
      ) : (
        <div className={getGridContainerClass()}>
          {/* react-sortablejs animation prop: 200ms (CSS 변수 --mg-sortable-animation-duration와 동일한 값) */}
          <ReactSortable
            list={widgetList}
            setList={handleSort}
            animation={200}
            ghostClass="widget-ghost"
            chosenClass="widget-chosen"
            dragClass="widget-drag"
            handle=".widget-drag-handle"
            className="sortable-widget-list"
          >
            {widgetList.map((widget) => (
              <div
                key={widget.id}
                className={`layout-widget-item ${getWidgetSpanClass(widget.position?.span || 1)}`}
              >
                <div className="widget-item-header">
                  <div className="widget-drag-handle">
                    <FaGripVertical />
                  </div>
                  <div className="widget-item-title">
                    {getWidgetTypeName(widget.type)}
                  </div>
                  <div className="widget-item-actions">
                    {onWidgetConfig && (
                      <button
                        className="widget-action-btn"
                        onClick={() => onWidgetConfig(widget)}
                        title="설정"
                      >
                        <FaCog />
                      </button>
                    )}
                    <button
                      className="widget-action-btn widget-delete-btn"
                      onClick={() => handleDelete(widget.id)}
                      title="삭제"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="widget-item-preview">
                  <div className="widget-preview-content">
                    <span className="widget-preview-label">
                      {getWidgetTypeName(widget.type)}
                    </span>
                    {widget.position && (
                      <span className="widget-preview-position">
                        행 {widget.position.row}, 열 {widget.position.col}
                        {widget.position.span > 1 ? ` (${widget.position.span}칸)` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </ReactSortable>
        </div>
      )}
    </div>
  );
};

export default DashboardLayoutEditor;

