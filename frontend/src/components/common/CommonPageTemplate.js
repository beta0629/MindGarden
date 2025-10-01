import React, { useEffect, useCallback } from 'react';
import DuplicateLoginModal from './DuplicateLoginModal';
import '../../styles/main.css';
import './CommonPageTemplate.css';

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
    <div className={`common-page-template ${bodyClass}`}>
      {children}
      
      {/* 중복 로그인 확인 모달 */}
      <DuplicateLoginModal />
    </div>
  );
};

export default CommonPageTemplate;
