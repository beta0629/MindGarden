/**
 * 대시보드 3D 미리보기 컴포넌트
/**
 * 
/**
 * CSS transform을 사용한 입체감 있는 미리보기
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-25
 */

import React, { useState, useRef, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './Dashboard3DPreview.css';
import { useTranslation } from 'react-i18next';

const Dashboard3DPreview = ({ dashboardConfig, dashboardName = '대시보드 미리보기' }) => {
  const { t } = useTranslation();
  const [rotation, setRotation] = useState({ x: -15, y: 25 });
  const [scale, setScale] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const previewRef = useRef(null);

  // 마우스 드래그로 회전
  const handleMouseDown = (e) => {
    setIsDragging(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      setRotation(prev => ({
        x: Math.max(-45, Math.min(45, prev.x - deltaY * 0.5)),
        y: prev.y + deltaX * 0.5
      }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  // 회전 리셋
  const handleResetRotation = () => {
    setRotation({ x: -15, y: 25 });
  };

  // 확대/축소
  const handleZoomIn = () => {
    setScale(prev => Math.min(1.2, prev + 0.1));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.1));
  };

  // 전체화면 토글
  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // 위젯 렌더링 (간단한 미리보기)
  const renderWidgetPreview = (widget, index) => {
    const widgetTypeNames = {
      'welcome': t('admin:Dashboard3DPreview.t_aecb8ded'),
      'statistics': t('admin:Dashboard3DPreview.t_58b0fd13'),
      'summary-statistics': t('admin:Dashboard3DPreview.t_9ad4d55e'),
      'chart': t('admin:Dashboard3DPreview.t_7bcc71c7'),
      'table': t('admin:Dashboard3DPreview.t_a72c4c73'),
      'calendar': t('admin:Dashboard3DPreview.t_b0fbd64a'),
      'schedule': t('admin:Dashboard3DPreview.t_fb58d653'),
      'activity-list': t('admin:Dashboard3DPreview.t_f45a3756'),
      'custom': t('admin:Dashboard3DPreview.t_62544024')
    };

    const widgetName = widgetTypeNames[widget.type] || widget.type;
    const span = widget.position?.span || 1;

    return (
      <div
        key={widget.id || index}
        className="preview-widget-item"
        style={{
          gridColumn: `span ${span}`,
          gridRow: `span 1`
        }}
      >
        <div className="preview-widget-header">
          <span className="preview-widget-icon">📊</span>
          <span className="preview-widget-name">{widgetName}</span>
        </div>
        <div className="preview-widget-content">
          <div className="preview-widget-placeholder">
            {widgetName} 미리보기
          </div>
        </div>
      </div>
    );
  };

  // 대시보드 설정 파싱
  const parsedConfig = dashboardConfig 
    ? (typeof dashboardConfig === 'string' ? JSON.parse(dashboardConfig) : dashboardConfig)
    : { widgets: [], layout: { columns: 3 } };

  const widgets = parsedConfig.widgets || [];
  const columns = parsedConfig.layout?.columns || 3;

  return (
    <div 
      className={`dashboard-3d-preview ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
    >
      {/* 컨트롤 패널 */}
      <div className="preview-controls">
        <div className="preview-controls-left">
          <h3 className="preview-title">
            <FaEye /> {dashboardName}
          </h3>
        </div>
        <div className="preview-controls-right">
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'preview-control-btn'
            })}
            onClick={handleResetRotation}
            title="회전 리셋"
            preventDoubleClick={false}
            loading={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            리셋
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'preview-control-btn'
            })}
            onClick={handleZoomOut}
            title="축소"
            preventDoubleClick={false}
            loading={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            축소
          </MGButton>
          <span className="preview-scale-indicator">
            {Math.round(scale * 100)}%
          </span>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'preview-control-btn'
            })}
            onClick={handleZoomIn}
            title="확대"
            preventDoubleClick={false}
            loading={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            확대
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'preview-control-btn'
            })}
            onClick={handleToggleFullscreen}
            title="전체화면"
            preventDoubleClick={false}
            loading={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            {isFullscreen ? '전체화면 종료' : t('admin:Dashboard3DPreview.t_0e42a470')}
          </MGButton>
        </div>
      </div>

      {/* 3D 미리보기 영역 */}
      <div
        className={`preview-3d-container${isDragging ? ' preview-3d-container--dragging' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div
          ref={previewRef}
          className="preview-3d-content"
          style={{
            transform: `perspective(1200px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* 대시보드 미리보기 */}
          <div 
            className="preview-dashboard"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`
            }}
          >
            {widgets.length === 0 ? (
              <div className="preview-empty-state">
                <p>위젯이 없습니다. 위젯을 추가해주세요.</p>
              </div>
            ) : (
              widgets.map((widget, index) => renderWidgetPreview(widget, index))
            )}
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="preview-help">
        <p>💡 마우스로 드래그하여 회전할 수 있습니다. 컨트롤 버튼으로 확대/축소 및 리셋이 가능합니다.</p>
      </div>
    </div>
  );
};

export default Dashboard3DPreview;

