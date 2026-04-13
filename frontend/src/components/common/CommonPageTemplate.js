import React, { useEffect } from 'react';
import DuplicateLoginModal from './DuplicateLoginModal';
import '../../styles/main.css';
import './CommonPageTemplate.css';

const CommonPageTemplate = ({ 
  title, 
  description, 
  children, 
  bodyClass = 'tablet-page'
}) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable no-console -- 개발 환경에서만 CommonPageTemplate 마운트 추적 */
      console.log('🔄 CommonPageTemplate 마운트됨');
      console.log('📱 bodyClass:', bodyClass);
      console.log('📄 title:', title);
      console.log('📝 description:', description);
      console.log('✅ 페이지 로딩 완료');
      /* eslint-enable no-console */
    }

    if (title) {
      document.title = title;
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        /* eslint-disable no-console */
        console.log('🔄 CommonPageTemplate 언마운트됨');
        /* eslint-enable no-console */
      }
    };
  }, [bodyClass, title, description]);

  return (
    <div className={`common-page-template ${bodyClass}`}>
      {children}
      
      {/* 중복 로그인 확인 모달 */}
      <DuplicateLoginModal />
    </div>
  );
};

export default CommonPageTemplate;
