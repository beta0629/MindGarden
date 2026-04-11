/**
 * 현대적 대시보드 편집기
/**
 * 카드 기반 드래그 앤 드롭으로 직관적인 위젯 편집
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0
/**
 * @since 2025-11-27
 */

import React, { useState, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import { 
  getSupportedWidgetTypes,
  getCommonWidgetTypes,
  getConsultationWidgetTypes,
  getAcademyWidgetTypes,
  getErpWidgetTypes
} from '../dashboard/widgets/WidgetRegistry';
import { toDisplayString } from '../../utils/safeDisplay';
import { 
  FaGripVertical, 
  FaTrash, 
  FaCog, 
  FaPlus,
  FaChartBar,
  FaUsers,
  FaCogs,
  FaCalendarAlt,
  FaBell,
  FaHome,
  FaLayerGroup
} from 'react-icons/fa';
import MGButton from '../common/MGButton';
import './ModernDashboardEditor.css';
import './CompactWidgetEditor.css';

// 위젯 타입별 아이콘 매핑 (시각적 구분)
const WIDGET_ICONS = {
  'welcome': <FaHome />,
  'summary-statistics': <FaChartBar />,
  'statistics': <FaChartBar />,
  'chart': <FaChartBar />,
  'table': <FaLayerGroup />,
  'calendar': <FaCalendarAlt />,
  'system-status': <FaCogs />,
  'system-tools': <FaCogs />,
  'management-grid': <FaUsers />,
  'statistics-grid': <FaChartBar />,
  'permission': <FaUsers />,
  'notification': <FaBell />,
  'schedule': <FaCalendarAlt />,
  'default': <FaLayerGroup />
};

// 위젯 타입 한글 이름
const WIDGET_NAMES = {
  'welcome': '환영 위젯',
  'summary-statistics': '요약 통계',
  'statistics': '통계 위젯',
  'chart': '차트 위젯',
  'table': '테이블 위젯',
  'calendar': '캘린더',
  'system-status': '시스템 상태',
  'system-tools': '시스템 도구',
  'management-grid': '관리 기능',
  'statistics-grid': '통계 대시보드',
  'permission': '권한 관리',
  'notification': '알림',
  'schedule': '일정 관리',
  'consultation-summary': '상담 요약',
  'consultation-schedule': '상담 일정',
  'mapping-management': '매핑 관리'
};

// 위젯 카테고리 정보 (CSS 클래스로 관리)
const WIDGET_CATEGORIES = {
  'common': { cssClass: 'widget-category-common', label: '공통' },
  'admin': { cssClass: 'widget-category-admin', label: '관리자' },
  'consultation': { cssClass: 'widget-category-consultation', label: '상담소' },
  'academy': { cssClass: 'widget-category-academy', label: '학원' },
  'erp': { cssClass: 'widget-category-erp', label: 'ERP' }
};

const ModernDashboardEditor = ({ 
  widgets = [], 
  onWidgetsChange,
  businessType = null 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 사용 가능한 위젯 분류
  const commonWidgets = getCommonWidgetTypes();
  const consultationWidgets = businessType?.toLowerCase() === 'consultation' ? getConsultationWidgetTypes() : [];
  const academyWidgets = businessType?.toLowerCase() === 'academy' ? getAcademyWidgetTypes() : [];
  const erpWidgets = getErpWidgetTypes();

  const allAvailableWidgets = [
    ...commonWidgets.map(type => ({ type, category: 'common' })),
    ...consultationWidgets.map(type => ({ type, category: 'consultation' })),
    ...academyWidgets.map(type => ({ type, category: 'academy' })),
    ...erpWidgets.map(type => ({ type, category: 'erp' }))
  ];

  // 필터링된 위젯 목록
  const filteredWidgets = allAvailableWidgets.filter(widget => {
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      (WIDGET_NAMES[widget.type] || widget.type).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 위젯 추가
  const handleAddWidget = (widgetType) => {
    const newWidget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      config: { title: WIDGET_NAMES[widgetType] || widgetType },
      position: { row: Math.floor(widgets.length / 3), col: widgets.length % 3, span: 1 }
    };
    
    onWidgetsChange([...widgets, newWidget]);
  };

  // 위젯 삭제
  const handleDeleteWidget = (widgetId) => {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId);
    onWidgetsChange(updatedWidgets);
  };

  // 위젯 순서 변경 처리
  const handleWidgetSort = (newWidgets) => {
    // position 재계산
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      position: { row: Math.floor(index / 3), col: index % 3, span: widget.position?.span || 1 }
    }));
    
    onWidgetsChange(updatedWidgets);
  };

  const getWidgetIcon = (widgetType) => {
    return WIDGET_ICONS[widgetType] || WIDGET_ICONS.default;
  };

  const getWidgetCategory = (widgetType) => {
    if (commonWidgets.includes(widgetType)) return 'common';
    if (consultationWidgets.includes(widgetType)) return 'consultation';
    if (academyWidgets.includes(widgetType)) return 'academy';
    if (erpWidgets.includes(widgetType)) return 'erp';
    return 'common';
  };

  return (
    <div className="modern-dashboard-editor">
      
      {/* 왼쪽: 컴팩트한 위젯 팔레트 */}
      <div className="compact-widget-palette">
        <div className="compact-palette-header">
          <h3 className="compact-palette-title">
            📦 위젯 추가
          </h3>
          
          {/* 검색 및 필터 */}
          <div className="palette-controls">
            <input
              type="text"
              placeholder="위젯 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="palette-search"
            />
            
            <div className="palette-categories">
              {['all', 'common', 'admin', 'consultation', 'academy', 'erp'].map(category => (
                <MGButton
                  key={category}
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={() => setSelectedCategory(category)}
                  className={`category-filter ${selectedCategory === category ? 'active' : ''} ${
                    category !== 'all' ? (WIDGET_CATEGORIES[category]?.cssClass || 'widget-category-common') : ''
                  }`}
                  preventDoubleClick={false}
                >
                  {category === 'all' ? '전체' : WIDGET_CATEGORIES[category]?.label || category}
                </MGButton>
              ))}
            </div>
          </div>
        </div>

        {/* 컴팩트한 위젯 카드 그리드 */}
        <div className="compact-widgets-grid">
          {filteredWidgets.map((widget, index) => {
            const category = getWidgetCategory(widget.type);
            const categoryInfo = WIDGET_CATEGORIES[category] || WIDGET_CATEGORIES.common;
            
            return (
              <div
                key={`${widget.type}-${category}-${index}`}
                className={`compact-widget-card mg-category-${category}`}
                onClick={() => handleAddWidget(widget.type)}
              >
                <div className="compact-widget-icon">
                  {getWidgetIcon(widget.type)}
                </div>
                <div className="compact-widget-name">
                  {WIDGET_NAMES[widget.type] || widget.type}
                </div>
                <div className="compact-widget-category">
                  {toDisplayString(categoryInfo.label)}
                </div>
                <div className="compact-add-btn">
                  <FaPlus />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 오른쪽: 대시보드 미리보기 */}
      <div className="dashboard-canvas">
        <div className="canvas-header">
          <h3 className="canvas-title">
            ⚡ 실시간 미리보기
          </h3>
          <div className="canvas-info">
            <span className="widget-count-badge">
              {widgets.length}개 위젯
            </span>
            <span className="grid-info-badge">
              3열 그리드
            </span>
          </div>
        </div>

        {/* 드롭 영역 */}
        <div className="dashboard-drop-zone">
          {widgets.length === 0 ? (
            <div className="empty-dashboard">
              <div className="empty-icon">📱</div>
              <h4>위젯을 여기에 끌어다 놓으세요</h4>
              <p>왼쪽에서 위젯을 드래그하거나 클릭해서 추가할 수 있습니다</p>
            </div>
          ) : (
            <ReactSortable
              list={widgets}
              setList={handleWidgetSort}
              animation={200}
              ghostClass="widget-ghost"
              chosenClass="widget-chosen"
              dragClass="widget-drag"
              className="dashboard-grid"
            >
              {widgets.map((widget) => {
                const category = getWidgetCategory(widget.type);
                const categoryInfo = WIDGET_CATEGORIES[category] || WIDGET_CATEGORIES.common;
                
                return (
                  <div
                    key={widget.id}
                    className={`dashboard-widget-card ${categoryInfo.cssClass || ''} widget-span-${widget.position?.span || 1}`}
                  >
                    {/* 드래그 핸들 */}
                    <div className="widget-drag-handle">
                      <FaGripVertical />
                    </div>
                    
                    {/* 위젯 카드 내용 */}
                    <div className="dashboard-widget-content">
                      <div className="widget-header">
                        <div className={`widget-icon ${categoryInfo.cssClass || ''}`}>
                          {getWidgetIcon(widget.type)}
                        </div>
                        <div className="widget-info">
                          <h4 className="widget-title">
                            {WIDGET_NAMES[widget.type] || widget.type}
                          </h4>
                          <span className={`widget-category ${categoryInfo.cssClass || ''}`}>
                            {toDisplayString(categoryInfo.label)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="widget-preview">
                        <div className="widget-preview-content">
                          {/* 위젯 미리보기 내용 */}
                          <div className="preview-placeholder">
                            미리보기 영역
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 위젯 액션 버튼들 */}
                    <div className="widget-actions">
                      <MGButton
                        type="button"
                        variant="outline"
                        size="small"
                        className="widget-action-btn config-btn"
                        onClick={() => {/* 설정 모달 */}}
                        title="설정"
                        preventDoubleClick={false}
                      >
                        <FaCog />
                      </MGButton>
                      <MGButton
                        type="button"
                        variant="outline"
                        size="small"
                        className="widget-action-btn delete-btn"
                        onClick={() => handleDeleteWidget(widget.id)}
                        title="삭제"
                        preventDoubleClick={false}
                      >
                        <FaTrash />
                      </MGButton>
                    </div>
                  </div>
                );
              })}
            </ReactSortable>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernDashboardEditor;
