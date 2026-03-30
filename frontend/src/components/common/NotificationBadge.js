import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {ICONS, ICON_SIZES, ICON_COLORS, IconHelpers} from '../../constants/icons';
import {useNotification} from '../../contexts/NotificationContext';
import {useSession} from '../../contexts/SessionContext';
import './NotificationBadge.css';

/**
 * 알림 배지 컴포넌트 (레거시 - 모달·컨텍스트 연동형)
 * @deprecated 알림 개수만 표시할 경우 dashboard-v2/atoms/NotificationBadge (count prop) 단일 소스 사용 권장.
 * 헤더에서 알림 개수를 표시하는 공통 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
/**
 * @param {string} props.variant - 배지 스타일 (default, primary, success, warning, danger)
/**
 * @param {string} props.size - 배지 크기 (small, medium, large)
/**
 * @param {boolean} props.showZero - COLOR_CONSTANTS.ALPHA_TRANSPARENT일 때도 표시할지 여부
/**
 * @param {string} props.className - 추가 CSS 클래스
/**
 * @param {function} props.onClick - 클릭 핸들러
/**
 * 
/**
 * @author Core Solution
/**
 * @version DEFAULT_VALUES.CURRENT_PAGE.COLOR_CONSTANTS.ALPHA_TRANSPARENT.COLOR_CONSTANTS.ALPHA_TRANSPARENT
/**
 * @since 2025-01-23
 */
const NotificationBadge = ({variant = 'default',
  size = 'medium',
  showZero = false,
  className = '',
  ...props}) => {const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const {user} = useSession();
  const {unreadCount, unreadMessageCount, unreadSystemCount} = useNotification();

  // 총 알림 개수 계산
  const totalCount = unreadCount || COLOR_CONSTANTS.ALPHA_TRANSPARENT;
  const messageCount = unreadMessageCount || COLOR_CONSTANTS.ALPHA_TRANSPARENT;
  const systemCount = unreadSystemCount || COLOR_CONSTANTS.ALPHA_TRANSPARENT;

  // 배지 표시 여부 결정
  const shouldShow = showZero || totalCount > COLOR_CONSTANTS.ALPHA_TRANSPARENT;

  // 알림 클릭 핸들러
  const handleNotificationClick = (e) => {e.stopPropagation();
    console.log('🔔 알림 배지 클릭됨');
    if (onClick) {console.log('🔔 커스텀 onClick 실행');
      onClick(e);} else {console.log('🔔 모달 열기');
      setIsModalOpen(true);}};

  // 모달 닫기
  const handleCloseModal = () => {setIsModalOpen(false);};

  // 상세 페이지로 이동
  const handleNavigateToDetail = (type) => {setIsModalOpen(false);
    
    if (!user?.role) {console.warn('사용자 역할이 없습니다.');
      return;}
    
    const routes = {
      ADMIN: { message: '/admin/messages', system: '/notifications' },
      STAFF: { message: '/admin/messages', system: '/notifications' },
      CONSULTANT: { message: '/consultant/messages', system: '/notifications' },
      CLIENT: { message: '/client/messages', system: '/notifications' }
    };
    const userRoutes = routes[user.role] || routes.CLIENT;
    console.log(`🔔 사용자 역할: ${user.role}, 타입: ${type}`);
    console.log(`🔔 사용 가능한 라우트:`, userRoutes);
    
    if (userRoutes && userRoutes[type]) {console.log(`🔔 알림 모달에서 ${type} 페이지로 이동:`, userRoutes[type]);
      navigate(userRoutes[type]);} else {console.warn(`알림 라우트를 찾을 수 없습니다. 역할: ${user.role}, 타입: ${type}`);}};

  if (!shouldShow) {return null;}

  // 배지 클래스 구성
  const badgeClasses = ['mg-notification-badge',
    `mg-notification-badge--${variant}`,
    `mg-notification-badge--${size}`].filter(Boolean).join(' ');

  return (<>
      <div 
        className={badgeClasses}
        onClick={handleNotificationClick}
        title={`읽지 않은 알림 ${totalCount}개 (메시지: ${messageCount}, 공지: ${systemCount})`}
        {...props}
      >
        <ICONS.BELL size={16} className="mg-v2-v2-notification-badge__icon" />
        <span className="mg-v2-v2-notification-badge__count">
          {totalCount > 99 ? '99+' : totalCount}
        </span>
      </div>

      {/* 알림 모달 */}
      {isModalOpen && (<div className="mg-v2-v2-notification-modal-overlay" onClick={handleCloseModal}>
          <div className="mg-v2-v2-notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mg-v2-v2-notification-modal__header">
              <h3 className="mg-v2-v2-notification-modal__title">알림</h3>
              <button 
                className="mg-v2-v2-notification-modal__close"
                onClick={handleCloseModal}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            
            <div className="mg-v2-v2-notification-modal__content">
              {/* 메시지 알림 */}
              {messageCount > COLOR_CONSTANTS.ALPHA_TRANSPARENT && (<div 
                  className="mg-v2-v2-notification-modal__item"
                  onClick={() => handleNavigateToDetail('message')}
                >
                  <div className="mg-v2-v2-notification-modal__item-icon">
                    <ICONS.MESSAGE_SQUARE size={BUSINESS_CONSTANTS.PAGINATION_SIZE} />
                  </div>
                  <div className="mg-v2-v2-notification-modal__item-content">
                    <div className="mg-v2-v2-notification-modal__item-title">새 메시지</div>
                    <div className="mg-v2-v2-notification-modal__item-count">{messageCount}개의 읽지 않은 메시지</div>
                  </div>
                  <ICONS.CHEVRON_RIGHT size={16} className="mg-v2-v2-notification-modal__item-arrow" />
                </div>)}

              {/* 시스템 알림 */}
              {systemCount > COLOR_CONSTANTS.ALPHA_TRANSPARENT && (<div 
                  className="mg-v2-v2-notification-modal__item"
                  onClick={() => handleNavigateToDetail('system')}
                >
                  <div className="mg-v2-v2-notification-modal__item-icon">
                    <Megaphone size={BUSINESS_CONSTANTS.PAGINATION_SIZE} />
                  </div>
                  <div className="mg-v2-v2-notification-modal__item-content">
                    <div className="mg-v2-v2-notification-modal__item-title">시스템 공지</div>
                    <div className="mg-v2-v2-notification-modal__item-count">{systemCount}개의 새로운 공지</div>
                  </div>
                  <ICONS.CHEVRON_RIGHT size={16} className="mg-v2-v2-notification-modal__item-arrow" />
                </div>)}

              {/* 알림이 없는 경우 */}
              {totalCount === COLOR_CONSTANTS.ALPHA_TRANSPARENT && (<div className="mg-v2-v2-notification-modal__empty">
                  <ICONS.BELL size={32} className="mg-v2-v2-notification-modal__empty-icon" />
                  <div className="mg-v2-v2-notification-modal__empty-text">새로운 알림이 없습니다</div>
                </div>)}
            </div>
          </div>
        </div>)}
    </>);};

export default NotificationBadge;
