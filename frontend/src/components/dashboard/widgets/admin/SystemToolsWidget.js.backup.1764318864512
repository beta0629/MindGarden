/**
 * System Tools Widget
 * 시스템 관리 도구를 제공하는 관리자용 위젯
 * SystemTools를 기반으로 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Widget.css';

const SystemToolsWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  
  const config = widget.config || {};
  const tools = config.tools || [
    {
      id: 'refresh',
      label: '새로고침',
      icon: 'bi-arrow-clockwise',
      variant: 'secondary',
      action: { type: 'refresh' },
      description: '통계 데이터를 새로고침합니다'
    },
    {
      id: 'logs',
      label: '로그 보기',
      icon: 'bi-file-text',
      variant: 'warning',
      action: { type: 'navigate', url: '/admin/logs' },
      description: '시스템 로그를 확인합니다'
    },
    {
      id: 'cache',
      label: '캐시 초기화',
      icon: 'bi-trash',
      variant: 'danger',
      action: { type: 'api', url: '/api/admin/cache/clear', method: 'POST' },
      description: '시스템 캐시를 초기화합니다'
    },
    {
      id: 'backup',
      label: '백업 생성',
      icon: 'bi-download',
      variant: 'success',
      action: { type: 'api', url: '/api/admin/backup/create', method: 'POST' },
      description: '데이터베이스 백업을 생성합니다'
    }
  ];
  
  const handleToolClick = async (tool) => {
    if (!tool.action) return;
    
    const { type, url, method } = tool.action;
    
    switch (type) {
      case 'navigate':
        if (url) {
          navigate(url);
        }
        break;
      case 'api':
        if (url) {
          try {
            const response = await fetch(url, {
              method: method || 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            if (response.ok) {
              console.log(`✅ ${tool.label} 완료`);
            }
          } catch (err) {
            console.error(`❌ ${tool.label} 실패:`, err);
          }
        }
        break;
      case 'refresh':
        window.location.reload();
        break;
      default:
        console.warn('알 수 없는 액션 타입:', type);
    }
  };
  
  const getVariantClass = (variant) => {
    const variants = {
      'primary': 'widget-btn-primary',
      'secondary': 'widget-btn-secondary',
      'success': 'widget-btn-success',
      'danger': 'widget-btn-danger',
      'warning': 'widget-btn-warning',
      'info': 'widget-btn-info'
    };
    return variants[variant] || 'widget-btn-secondary';
  };
  
  return (
    <div className="widget widget-system-tools">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-tools"></i>
          {config.title || '시스템 도구'}
        </div>
      </div>
      <div className="widget-body">
        <div className="system-tools-grid">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`system-tool-card ${getVariantClass(tool.variant)}`}
              onClick={() => handleToolClick(tool)}
              title={tool.description}
            >
              <div className="system-tool-icon">
                <i className={`bi ${tool.icon}`}></i>
              </div>
              <div className="system-tool-content">
                <span className="system-tool-label">{tool.label}</span>
                {tool.description && (
                  <div className="system-tool-description">{tool.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemToolsWidget;



