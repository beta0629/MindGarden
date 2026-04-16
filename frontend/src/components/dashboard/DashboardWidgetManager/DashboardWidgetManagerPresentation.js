/**
 * DashboardWidgetManager Presentational Component
 * 
 * 목적: 위젯 관리 UI 렌더링 (순수 UI)
 * 표준: DESIGN_CENTRALIZATION_STANDARD.md 준수
 * 패턴: Presentational Component (비즈니스 로직 없음)
/**
 * 
/**
 * ✅ 표준화:
/**
 * - CSS 변수 사용 (하드코딩 금지)
/**
 * - BEM 네이밍 규칙
/**
 * - Props를 통한 데이터 전달만 수행
/**
 * - 상태 관리 없음 (Container에서 처리)
/**
 * 
/**
 * @author CoreSolution Team
/**
 * @since 2025-12-02
 */

import React from 'react';

import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import UnifiedModal from '../../common/modals/UnifiedModal';
import './DashboardWidgetManager.css';
const DashboardWidgetManagerPresentation = ({
  // 데이터
  groupedWidgets,
  availableWidgets,
  loading,
  showAddModal,
  
  // 이벤트 핸들러
  onAddWidget,
  onDeleteWidget,
  onConfigureWidget,
  onShowAddModal,
  onCloseAddModal
}) => {
  // 로딩 상태
  if (loading) {
    return (
      <div className="mg-widget-manager-loading">
        <div className="mg-spinner" />
        <p>위젯 목록을 불러오는 중...</p>
      </div>
    );
  }
  
  return (
    <div className="mg-widget-manager">
      {/* 헤더 */}
      <div className="mg-widget-manager-header">
        <h3 className="mg-widget-manager-title">위젯 관리</h3>
        <MGButton
          variant="primary"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'sm',
            loading: false,
            className: 'mg-widget-manager-header-add mg-button--with-icon'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onShowAddModal}
        >
          
          위젯 추가
        </MGButton>
      </div>
      
      {/* 그룹별 위젯 표시 */}
      {Object.entries(groupedWidgets).map(([groupName, groupWidgets]) => (
        <div key={groupName} className="mg-widget-group">
          <h4 className="mg-widget-group-title">{groupName}</h4>
          
          <div className="mg-widget-list">
            {groupWidgets.map(widget => (
              <WidgetItem
                key={widget.widgetId}
                widget={widget}
                onDelete={onDeleteWidget}
                onConfigure={onConfigureWidget}
              />
            ))}
          </div>
        </div>
      ))}
      
      {/* 위젯 추가 모달 */}
      <AddWidgetModal
        isOpen={showAddModal}
        availableWidgets={availableWidgets}
        onAdd={onAddWidget}
        onClose={onCloseAddModal}
      />
    </div>
  );
};

/**
 * 위젯 아이템 컴포넌트 (Presentational)
 */
const WidgetItem = ({ widget, onDelete, onConfigure }) => {
  return (
    <div className="mg-widget-item">
      <div className="mg-widget-item-header">
        <div className="mg-widget-item-info">
          <h5 className="mg-widget-item-title">{widget.widgetNameKo}</h5>
          <span className="mg-widget-item-type">{widget.widgetType}</span>
        </div>
        
        <div className="mg-widget-item-badges">
          {/* 시스템 관리 위젯 표시 */}
          {widget.isSystemManaged && (
            <span className="mg-badge mg-badge--system">
               시스템 위젯
            </span>
          )}
          
          {/* 필수 위젯 표시 */}
          {widget.isRequired && (
            <span className="mg-badge mg-badge--required">필수</span>
          )}
        </div>
      </div>
      
      <div className="mg-widget-item-actions">
        {/* 이동 버튼 */}
        {widget.isMovable && (
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-widget-item-action-btn'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            title="위젯 이동"
            preventDoubleClick={false}
           />
        )}
        
        {/* 설정 버튼 */}
        {widget.isConfigurable && (
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-widget-item-action-btn'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            title="위젯 설정"
            onClick={() => onConfigure(widget.widgetId)}
           />
        )}
        
        {/* 삭제 버튼 */}
        {widget.isDeletable ? (
          <MGButton
            type="button"
            variant="danger"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'danger',
              size: 'sm',
              loading: false,
              className: 'mg-widget-item-action-btn'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            title="위젯 삭제"
            onClick={() => onDelete(widget.widgetId)}
           />
        ) : (
          <span className="mg-widget-item-locked" title="삭제 불가" />
        )}
      </div>
    </div>
  );
};

/**
 * 위젯 추가 모달 컴포넌트 (Presentational)
 */
const AddWidgetModal = ({ isOpen, availableWidgets, onAdd, onClose }) => {
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="위젯 추가"
      size="medium"
    >
      <p className="mg-text--muted mg-mb-md">
        추가 가능한 위젯 목록입니다. 원하는 위젯을 선택하세요.
      </p>

      <div className="mg-available-widgets">
        {availableWidgets.length > 0 ? (
          availableWidgets.map(widget => (
            <MGButton
              key={widget.widgetId}
              type="button"
              variant="outline"
              fullWidth
              onClick={() => onAdd(widget.widgetType)}
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: 'mg-available-widget-item'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              <div className="mg-available-widget-info">
                <h5>{widget.widgetNameKo}</h5>
                <p className="mg-text--sm mg-text--muted">
                  {widget.description || widget.widgetType}
                </p>
              </div>
              
            </MGButton>
          ))
        ) : (
          <p className="mg-text--muted">추가 가능한 위젯이 없습니다.</p>
        )}
      </div>
    </UnifiedModal>
  );
};

export default DashboardWidgetManagerPresentation;

