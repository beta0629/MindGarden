/**
 * Headers Component
/**
 * 
/**
 * Core Solution 디자인 시스템 표준 컴포넌트
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-11-28
 */

import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../utils/classNames';
/* 스타일: main.css 공통 헤더 */
import UnifiedHeader from '../common/UnifiedHeader';

const UnifiedHeader = ({
  title = '', // 빈 문자열이면 브랜딩 정보에서 가져옴
  logoType = '', // 빈 문자열이면 브랜딩 정보에서 가져옴
  logoImage = '', // 빈 문자열이면 브랜딩 정보에서 가져옴
  logoAlt = '', // 빈 문자열이면 브랜딩 정보에서 가져옴
  showUserMenu = true,
  showHamburger = true,
  showBackButton = true, // 백 버튼 표시 여부
  variant = 'default', // default, compact, transparent
  sticky = true,
  className = '',
  onLogoClick,
  extraActions = null,
  notificationAction = null, // 알림 액션
  useBrandingInfo = true, // 브랜딩 정보 사용 여부
  ...props
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = sessionManager.getUser();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isMultiTenant, setIsMultiTenant] = useState(false);
  const [accessibleTenants, setAccessibleTenants] = useState([]);
  const [showTenantSwitchModal, setShowTenantSwitchModal] = useState(false);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // 브랜딩 정보 Hook
  const { headerProps, isLoading: isBrandingLoading } = useBranding({
    autoLoad: useBrandingInfo && !!user,
    useCache: true
  });

  // 실제 사용할 props 결정 (전달받은 props 우선, 없으면 브랜딩 정보 사용)
  const actualTitle = title || (useBrandingInfo ? headerProps.title : 'Core Solution');
  const actualLogoType = logoType || (useBrandingInfo ? headerProps.logoType : 'text');
  const actualLogoImage = logoImage || (useBrandingInfo ? headerProps.logoImage : '');
  const actualLogoAlt = logoAlt || (useBrandingInfo ? headerProps.logoAlt : 'Core Solution');

  // 로고 클릭 핸들러
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      // 기본 동작: 홈으로 이동
      navigate('/');
    }
  };

Headers.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool
};

Headers.defaultProps = {
  className: '',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
};

export default Headers;
