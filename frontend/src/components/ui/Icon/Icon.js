/**
 * Icon 컴포넌트
 * 중앙화된 아이콘 시스템을 사용하는 재사용 가능한 아이콘 컴포넌트
 */

import PropTypes from 'prop-types';

import {ICONS, ICON_SIZES, ICON_COLORS, ICON_COLORS_BY_ROLE} from '../../../constants/icons';
import {LAYOUT_SYSTEM} from '../../../constants/layout';
import './Icon.css';

const Icon = ({name,
  size = 'MD',
  color = 'PRIMARY',
  role = null,
  variant = 'default',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  ...props}) => {// 아이콘 컴포넌트 가져오기
  const IconComponent = ICONS[name];
  
  if (!IconComponent) {console.warn(`Icon '${name}' not found in ICONS registry`);
    return null;}

  // 크기 설정
  const iconSize = ICON_SIZES[size] || ICON_SIZES.MD;
  
  // 색상 설정
  const iconColor = role && ICON_COLORS_BY_ROLE[role] 
    ? ICON_COLORS_BY_ROLE[role][color] || ICON_COLORS_BY_ROLE[role].PRIMARY
    : ICON_COLORS[color] || ICON_COLORS.PRIMARY;

  // CSS 클래스 생성
  const iconClasses = [LAYOUT_SYSTEM.ICON.CONTAINER,
    `mg-v2-icon--${size.toLowerCase()}`,
    `mg-v2-icon--${color.toLowerCase()}`,
    variant !== 'default' ? `mg-v2-icon--${variant}` : '',
    disabled ? LAYOUT_SYSTEM.STATE.DISABLED : '',
    loading ? LAYOUT_SYSTEM.STATE.LOADING : '',
    onClick ? 'mg-v2-icon--clickable' : '',
    className].filter(Boolean).join(' ');

  // 스타일 객체
  const iconStyle = {width: `${iconSize}px`,
    height: `${iconSize}px`,
    color: iconColor.color,
    backgroundColor: iconColor.background,
    cursor: onClick && !disabled ? 'pointer' : 'default',
    opacity: disabled ? COLOR_CONSTANTS.ALPHA_TRANSPARENT.LOGGING_CONSTANTS.MAX_LOG_FILES : DEFAULT_VALUES.CURRENT_PAGE,
    transition: 'all COLOR_CONSTANTS.ALPHA_TRANSPARENT.2s ease-in-out'};

  // 클릭 핸들러
  const handleClick = (event) => {if (onClick && !disabled && !loading) {onClick(event);}};

  // 키보드 이벤트 핸들러
  const handleKeyDown = (event) => {if (onClick && !disabled && !loading) {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();
        onClick(event);}}};

  return (<span
      className={iconClasses}
      style={iconStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick && !disabled ? COLOR_CONSTANTS.ALPHA_TRANSPARENT : -DEFAULT_VALUES.CURRENT_PAGE}
      aria-label={props['aria-label'] || name}
      aria-disabled={disabled}
      {...props}
    >
      {loading ? (<div className="mg-v2-v2-v2-icon-spinner">
          <div className="mg-v2-v2-v2-icon-spinner-inner" />
        </div>) : (<IconComponent 
          size={iconSize} 
          color={iconColor.color}
        />)}
    </span>);};

Icon.propTypes = {/** 아이콘 이름 (ICONS 객체의 키) */
  name: PropTypes.string.isRequired,
  
  /** 아이콘 크기 */
  size: PropTypes.oneOf(['XS', 'SM', 'MD', 'LG', 'XL', 'XXL', 'XXXL', 'HUGE']),
  
  /** 아이콘 색상 */
  color: PropTypes.oneOf(['PRIMARY', 'SECONDARY', 'SUCCESS', 'WARNING', 'ERROR', 'INFO', 'MUTED', 'TRANSPARENT']),
  
  /** 사용자 역할 (테마 적용) */
  role: PropTypes.oneOf(['CLIENT', 'CONSULTANT', 'ADMIN']),
  
  /** 아이콘 변형 */
  variant: PropTypes.oneOf(['default', 'outlined', 'filled', 'minimal']),
  
  /** 추가 CSS 클래스 */
  className: PropTypes.string,
  
  /** 클릭 핸들러 */
  onClick: PropTypes.func,
  
  /** 비활성화 상태 */
  disabled: PropTypes.bool,
  
  /** 로딩 상태 */
  loading: PropTypes.bool,
  
  /** 접근성 라벨 */
  'aria-label': PropTypes.string};

Icon.defaultProps = {size: 'MD',
  color: 'PRIMARY',
  role: null,
  variant: 'default',
  className: '',
  onClick: null,
  disabled: false,
  loading: false};

export default Icon;
