/**
 * 대시보드 위젯 편집기 컴포넌트
/**
 * 
/**
 * 위젯 추가, 삭제, 설정 기능 제공
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-24
 */

import React, { useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { 
  getSupportedWidgetTypes,
  getCommonWidgetTypes,
  getConsultationWidgetTypes,
  getAcademyWidgetTypes,
  getErpWidgetTypes
} from '../dashboard/widgets/WidgetRegistry';
import { FaPlus, FaGripVertical } from 'react-icons/fa';
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
  
  // 기본 위젯과 특화 위젯 분리
  const commonWidgetTypes = getCommonWidgetTypes();
  
  // 업종별 특화 위젯 필터링 (엄격한 제어)
  const normalizedBusinessType = businessType?.toLowerCase()?.trim();
  
  // 상담소 특화 위젯: 상담소 업종에서만 표시
  const consultationWidgetTypes = normalizedBusinessType === 'consultation' 
    ? getConsultationWidgetTypes() 
    : [];
  
  // 학원 특화 위젯: 학원 업종에서만 표시
  const academyWidgetTypes = normalizedBusinessType === 'academy' 
    ? getAcademyWidgetTypes() 
    : [];
  
  // ERP 위젯: 모든 업종에서 사용 가능 (ERP 기능 활성화 여부는 위젯 내부에서 체크)
  const erpWidgetTypes = getErpWidgetTypes();
  
  // 특화 위젯 통합 (업종에 맞는 위젯만 포함)
  const specializedWidgetTypes = [
    ...(normalizedBusinessType === 'consultation' ? consultationWidgetTypes : []),
    ...(normalizedBusinessType === 'academy' ? academyWidgetTypes : []),
    ...erpWidgetTypes
  ];

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

  // 위젯 삭제 (확인 없이 바로 삭제 - 간소화)
  const handleDeleteWidget = (widgetId) => {
    onWidgetsChange(widgets.filter(w => w.id !== widgetId));
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
      {/* 기본 위젯 목록 */}
      <div className="widget-editor-section">
        <h3 className="widget-editor-section-title">
          기본 위젯
          <span className="widget-section-badge widget-section-badge--basic">
            {commonWidgetTypes.length}개
          </span>
        </h3>
        <ReactSortable
          list={commonWidgetTypes.map(type => ({ type, id: type }))}
          setList={() => {}} // 원본은 변경하지 않음
          group={{
            name: 'widgets',
            pull: 'clone', // 복사본만 드래그
            put: false // 여기로 드롭 불가
          }}
          sort={false} // 정렬 불가
          clone={(item) => ({
            type: item.type,
            id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          })}
          className="available-widgets-grid"
        >
          {commonWidgetTypes.map(widgetType => (
            <div
              key={widgetType}
              className="available-widget-item available-widget-item--draggable"
              data-widget-type={widgetType}
              title={getWidgetTypeName(widgetType)}
              onClick={() => handleAddWidget(widgetType)}
            >
              <FaGripVertical className="widget-drag-handle-icon widget-drag-handle-icon--corner" />
              <FaPlus className="widget-add-icon" />
              <span className="widget-type-name">
                {getWidgetTypeName(widgetType)}
              </span>
            </div>
          ))}
        </ReactSortable>
      </div>

      {/* 특화 위젯 목록 */}
      {specializedWidgetTypes.length > 0 && (
        <div className="widget-editor-section widget-editor-section--with-top-gap">
          <h3 className="widget-editor-section-title">
            {businessType?.toLowerCase() === 'consultation' && '상담소 특화 위젯'}
            {businessType?.toLowerCase() === 'academy' && '학원 특화 위젯'}
            {!businessType && '특화 위젯'}
            <span className="widget-section-badge widget-section-badge--specialized">
              {specializedWidgetTypes.length}개
            </span>
          </h3>
          <ReactSortable
            list={specializedWidgetTypes.map(type => ({ type, id: type }))}
            setList={() => {}} // 원본은 변경하지 않음
            group={{
              name: 'widgets',
              pull: 'clone', // 복사본만 드래그
              put: false // 여기로 드롭 불가
            }}
            sort={false} // 정렬 불가
            clone={(item) => ({
              type: item.type,
              id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            })}
            className="available-widgets-grid"
          >
            {specializedWidgetTypes.map(widgetType => (
              <div
                key={widgetType}
                className="available-widget-item specialized-widget-item available-widget-item--specialized"
                data-widget-type={widgetType}
                onClick={() => handleAddWidget(widgetType)}
                title={getWidgetTypeName(widgetType)}
              >
                <FaGripVertical className="widget-drag-handle-icon widget-drag-handle-icon--corner" />
                <FaPlus className="widget-add-icon" />
                <span className="widget-type-name">
                  {getWidgetTypeName(widgetType)}
                </span>
                <span className="widget-specialized-badge widget-specialized-badge--marker">
                  특화
                </span>
              </div>
            ))}
          </ReactSortable>
        </div>
      )}

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
                    type="button"
                    variant="outline"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'sm',
                      loading: false,
                      className: 'widget-action-btn widget-config-btn widget-action-btn--config'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => handleConfigWidget(widget)}
                    title="위젯 설정"
                    preventDoubleClick={false}
                  >
                    설정
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="danger"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'danger',
                      size: 'sm',
                      loading: false,
                      className: 'widget-action-btn widget-delete-btn widget-action-btn--delete'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => handleDeleteWidget(widget.id)}
                    title="위젯 삭제"
                    preventDoubleClick={false}
                  >
                    삭제
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

