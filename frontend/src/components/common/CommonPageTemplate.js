import React, { useEffect, useCallback } from 'react';

const CommonPageTemplate = ({ 
  title, 
  description, 
  children, 
  bodyClass = 'tablet-page'
}) => {
  
  // 콜백 함수로 메모이제이션
  const logMount = useCallback(() => {
    console.log('🔄 CommonPageTemplate 마운트됨');
    console.log('📱 bodyClass:', bodyClass);
    console.log('📄 title:', title);
    console.log('📝 description:', description);
    console.log('✅ 페이지 로딩 완료');
  }, [bodyClass, title, description]);

  const logUnmount = useCallback(() => {
    console.log('🔄 CommonPageTemplate 언마운트됨');
  }, []);

  useEffect(() => {
    logMount();
    
    // 간단한 헤드 관리
    if (title) {
      document.title = title;
    }
    
    return logUnmount;
  }, [logMount, logUnmount, title]);

  return (
    <div className={bodyClass} style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      minWidth: '768px',
      maxWidth: '1024px',
      margin: '0 auto'
    }}>
      {children}
    </div>
  );
};

export default CommonPageTemplate;
