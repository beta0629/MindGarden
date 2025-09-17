import React from 'react';
import SimpleHeader from './SimpleHeader';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * 간단한 레이아웃 컴포넌트
 * 복잡한 로직 없이 기본적인 레이아웃만 제공
 * 공통 로딩 상태 지원
 */
const SimpleLayout = ({ 
  children, 
  title, 
  loading = false, 
  loadingText = "페이지를 불러오는 중...",
  loadingVariant = "default"
}) => {
  return (
    <div className="simple-layout">
      <SimpleHeader title={title} />
      
      <main className="simple-main">
        <div className="simple-container">
          {title && (
            <div className="page-header">
              <h1 className="page-title">{title}</h1>
            </div>
          )}
          
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '400px',
              width: '100%'
            }}>
              <LoadingSpinner 
                text={loadingText}
                size="large"
                variant={loadingVariant}
                inline={true}
              />
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
};

export default SimpleLayout;
