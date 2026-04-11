import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone } from 'lucide-react';

import { ICONS } from '../../constants/icons';
import { useNotification } from '../../contexts/NotificationContext';
import { useSession } from '../../contexts/SessionContext';
import UnifiedModal from './modals/UnifiedModal';
import './NotificationBadge.css';

const BellIcon = ICONS.BELL;
const MessageCircleIcon = ICONS.MESSAGE_CIRCLE;
const ChevronRightIcon = ICONS.CHEVRON_RIGHT;

/**
 * 알림 배지 컴포넌트 (레거시 - 모달·컨텍스트 연동형)
 * @deprecated 알림 개수만 표시할 경우 dashboard-v2/atoms/NotificationBadge (count prop) 단일 소스 사용 권장.
 * 헤더에서 알림 개수를 표시하는 공통 컴포넌트
 *
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.variant - 배지 스타일 (default, primary, success, warning, danger)
 * @param {string} props.size - 배지 크기 (small, medium, large)
 * @param {boolean} props.showZero - 0일 때도 표시할지 여부
 * @param {string} props.className - 추가 CSS 클래스
 * @param {function} props.onClick - 클릭 핸들러
 *
 * @author Core Solution
 * @since 2025-01-23
 */
const NotificationBadge = ({
  variant = 'default',
  size = 'medium',
  showZero = false,
  className = '',
  onClick,
  ...props
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useSession();
  const { unreadCount, unreadMessageCount, unreadSystemCount } = useNotification();

  const totalCount = unreadCount || 0;
  const messageCount = unreadMessageCount || 0;
  const systemCount = unreadSystemCount || 0;

  const shouldShow = showZero || totalCount > 0;

  const handleNotificationClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleNavigateToDetail = (type) => {
    setIsModalOpen(false);

    if (!user?.role) {
      return;
    }

    const routes = {
      ADMIN: { message: '/admin/messages', system: '/notifications' },
      STAFF: { message: '/admin/messages', system: '/notifications' },
      CONSULTANT: { message: '/consultant/messages', system: '/notifications' },
      CLIENT: { message: '/client/messages', system: '/notifications' }
    };
    const userRoutes = routes[user.role] || routes.CLIENT;

    if (userRoutes && userRoutes[type]) {
      navigate(userRoutes[type]);
    }
  };

  if (!shouldShow) {
    return null;
  }

  const badgeClasses = ['mg-notification-badge',
    `mg-notification-badge--${variant}`,
    `mg-notification-badge--${size}`].filter(Boolean).join(' ');

  return (
    <>
      <div
        className={badgeClasses}
        onClick={handleNotificationClick}
        title={`읽지 않은 알림 ${totalCount}개 (메시지: ${messageCount}, 공지: ${systemCount})`}
        {...props}
      >
        <BellIcon size={16} className="mg-notification-badge__icon" />
        <span className="mg-notification-badge__count">
          {totalCount > 99 ? '99+' : totalCount}
        </span>
      </div>

      <UnifiedModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="알림"
        size="auto"
        backdropClick
        showCloseButton
        variant="detail"
      >
        <div className="mg-notification-modal">
          <div className="mg-notification-modal__content">
            {messageCount > 0 && (
              <div
                className="mg-notification-modal__item"
                onClick={() => handleNavigateToDetail('message')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavigateToDetail('message');
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="mg-notification-modal__item-icon">
                  <MessageCircleIcon size={20} />
                </div>
                <div className="mg-notification-modal__item-content">
                  <div className="mg-notification-modal__item-title">새 메시지</div>
                  <div className="mg-notification-modal__item-count">
                    {messageCount}개의 읽지 않은 메시지
                  </div>
                </div>
                <ChevronRightIcon size={16} className="mg-notification-modal__item-arrow" />
              </div>
            )}

            {systemCount > 0 && (
              <div
                className="mg-notification-modal__item"
                onClick={() => handleNavigateToDetail('system')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavigateToDetail('system');
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="mg-notification-modal__item-icon">
                  <Megaphone size={20} aria-hidden />
                </div>
                <div className="mg-notification-modal__item-content">
                  <div className="mg-notification-modal__item-title">시스템 공지</div>
                  <div className="mg-notification-modal__item-count">
                    {systemCount}개의 새로운 공지
                  </div>
                </div>
                <ChevronRightIcon size={16} className="mg-notification-modal__item-arrow" />
              </div>
            )}

            {totalCount === 0 && (
              <div className="mg-notification-modal__empty">
                <BellIcon size={32} className="mg-notification-modal__empty-icon" />
                <div className="mg-notification-modal__empty-text">새로운 알림이 없습니다</div>
              </div>
            )}
          </div>
        </div>
      </UnifiedModal>
    </>
  );
};

export default NotificationBadge;
