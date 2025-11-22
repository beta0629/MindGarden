/**
 * Management Grid Widget
 * 관리 기능 그리드를 표시하는 위젯
 * AdminDashboard의 관리 기능 카드들을 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Widget.css';

const ManagementGridWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  
  const config = widget.config || {};
  const managementItems = config.items || [];
  const columns = config.columns || 3;
  
  const handleItemClick = (item) => {
    if (item.url) {
      navigate(item.url);
    } else if (item.action) {
      if (item.action.type === 'navigate' && item.action.url) {
        navigate(item.action.url);
      } else if (item.action.type === 'api' && item.action.url) {
        // API 호출 처리
        fetch(item.action.url, {
          method: item.action.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }).then(response => {
          if (response.ok) {
            console.log(`✅ ${item.label} 완료`);
          }
        }).catch(err => {
          console.error(`❌ ${item.label} 실패:`, err);
        });
      } else if (item.action.type === 'modal' && item.action.modalId) {
        // 모달 열기 (부모 컴포넌트에서 처리)
        console.log('모달 열기:', item.action.modalId);
      }
    }
  };
  
  return (
    <div className="widget widget-management-grid">
      {config.title && (
        <div className="widget-header">
          <div className="widget-title">
            <i className="bi bi-grid"></i>
            {config.title}
          </div>
          {config.subtitle && (
            <div className="widget-subtitle">{config.subtitle}</div>
          )}
        </div>
      )}
      <div className="widget-body">
        <div className={`management-grid management-grid-${columns}`}>
          {managementItems.map((item, index) => (
            <div
              key={item.id || index}
              className="management-card"
              onClick={() => handleItemClick(item)}
            >
              <div className="management-card-icon">
                {item.icon && <i className={`bi ${item.icon}`}></i>}
                {item.lucideIcon && React.createElement(item.lucideIcon, { size: 24 })}
              </div>
              <div className="management-card-content">
                <h3 className="management-card-title">{item.label || item.title}</h3>
                {item.description && (
                  <p className="management-card-description">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagementGridWidget;

