import React from 'react';
import UnifiedHeader from '../common/UnifiedHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/main.css';
import './SimpleLayout.css';

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
  loadingVariant = "default",
  extraActions = null
}) => {
  return (
    <div className="simple-layout">
      <UnifiedHeader 
        title={title || 'MindGarden'}
        logoType="text"
        showUserMenu={true}
        showHamburger={true}
        variant="default"
        sticky={true}
        extraActions={extraActions}
      />
      
      <main className="simple-main">
        <div className="simple-container">
          {title && (
            <div className="page-header">
              <h1 className="page-title">{title}</h1>
            </div>
          )}
          
          {loading ? (
            <div className="loading-container">
              <UnifiedLoading 
                text={loadingText}
                size="large"
                variant={loadingVariant}
                type="page"
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
