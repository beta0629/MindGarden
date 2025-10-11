import React from 'react';
import IPhone17Card from './IPhone17Card';
import IPhone17Button from './IPhone17Button';
import IPhone17Modal from './IPhone17Modal';
import IPhone17PageHeader from './IPhone17PageHeader';
// import { useResponsive } from '../../hooks/useResponsive';
import './AutoResponsiveWrapper.css';


/**
 * 자동 반응형 래퍼 컴포넌트
 * 
 * 기능:
 * - 화면 크기에 따라 자동으로 레이아웃 변경
 * - 테이블 → 카드 자동 변환
 * - 모든 컴포넌트에 일관된 반응형 적용
 * 
 * 사용법:
 * <AutoResponsiveWrapper type="table">
 *   <YourComponent />
 * </AutoResponsiveWrapper>
 */

const AutoResponsiveWrapper = ({ 
  children, 
  type = 'table', // 'table', 'grid', 'list', 'dashboard'
  className = '',
  mobileClassName = '',
  desktopClassName = '',
  ...props 
}) => {
    // const { isMobile, isTablet, isDesktop } = useResponsive();

  // 반응형 클래스 생성
  const getResponsiveClasses = () => {
    const baseClasses = ['auto-responsive-wrapper'];
    
    // 타입별 클래스
    baseClasses.push(`auto-responsive-wrapper--${type}`);
    
    // 화면 크기별 클래스
    // if (isMobile) {
    //   baseClasses.push('auto-responsive-wrapper--mobile');
    //   if (mobileClassName) baseClasses.push(mobileClassName);
    // } else if (isTablet) {
    //   baseClasses.push('auto-responsive-wrapper--tablet');
    // } else {
    //   baseClasses.push('auto-responsive-wrapper--desktop');
    //   if (desktopClassName) baseClasses.push(desktopClassName);
    // }
    
    // 추가 클래스명
    if (className) baseClasses.push(className);
    
    return baseClasses.join(' ');
  };

  return (
    <div 
      className={getResponsiveClasses()}
      data-responsive-type={type}
      data-device-type="desktop"
      {...props}
    >
      {children}
    </div>
  );
};

export default AutoResponsiveWrapper;

