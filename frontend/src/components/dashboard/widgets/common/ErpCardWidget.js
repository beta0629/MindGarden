/**
 * ERP Card Widget
 * ErpCard를 기반으로 한 범용 카드 위젯
 * 대시보드에서 카드 형태의 컨텐츠를 표시할 수 있도록 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React from 'react';
import '../Widget.css';
import './ErpCardWidget.css';

const ErpCardWidget = ({ widget, user }) => {
  const config = widget.config || {};
  const title = config.title || '';
  const glassEffect = config.glassEffect === true;
  const className = config.className || '';
  const children = config.content || config.children || null;
  
  // MindGarden 디자인 시스템의 mg-v2-card 또는 mg-glass-card 활용
  const cardClasses = [
    'widget',
    'widget-erp-card',
    glassEffect ? 'mg-glass-card' : 'mg-v2-card',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {title && (
        <div className="widget-header">
          <h3 className="widget-title">{title}</h3>
        </div>
      )}
      <div className="widget-body">
        {children ? (
          typeof children === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: children }} />
          ) : (
            children
          )
        ) : (
          <div className="widget-empty">
            <p>컨텐츠가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErpCardWidget;

