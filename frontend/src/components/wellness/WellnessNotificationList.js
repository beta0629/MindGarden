import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Heart, AlertCircle, TrendingUp, Bell } from 'lucide-react';
import { apiGet } from '../../utils/ajax';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import './WellnessNotificationList.css';

/**
 * 웰니스 알림 목록 페이지 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
const WellnessNotificationList = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 권한 체크
    if (!isLoggedIn) {
      notificationManager.show('로그인이 필요합니다.', 'error');
      navigate('/login');
      return;
    }

    if (user?.role !== 'CLIENT' && user?.role !== 'ROLE_CLIENT') {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      navigate('/');
      return;
    }

    loadNotifications();
  }, [isLoggedIn, user, navigate]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // 활성화된 웰니스 알림 가져오기
      const response = await apiGet('/api/system-notifications/active');
      
      if (response && response.success) {
        // 웰니스 타입만 필터링
        const wellnessNotifications = response.data.filter(
          notification => notification.notificationType === 'WELLNESS'
        );
        setNotifications(wellnessNotifications);
      } else {
        setError('알림을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 웰니스 알림 목록 로드 실패:', error);
      setError('알림을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    navigate(`/client/wellness/${notification.id}`);
  };

  const getNotificationIcon = (notification) => {
    if (notification.isUrgent) {
      return <AlertCircle size={24} />;
    }
    if (notification.isImportant) {
      return <Heart size={24} />;
    }
    return <Bell size={24} />;
  };

  if (loading) {
    return (
      <SimpleLayout title="웰니스 알림">
        <div className="wellness-notification-list">
          <UnifiedLoading message="알림을 불러오는 중..." />
        </div>
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout title="웰니스 알림">
        <div className="wellness-notification-list">
          <div className="wellness-notification-empty">
            <div className="empty-icon">
              <AlertCircle size={48} />
            </div>
            <h2 className="empty-title">알림을 불러올 수 없습니다</h2>
            <p className="empty-message">{error}</p>
            <button className="mg-btn mg-btn--primary" onClick={loadNotifications}>
              다시 시도
            </button>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="웰니스 알림">
      <div className="wellness-notification-list">
        {/* 헤더 */}
        <div className="wellness-list-header">
          <div className="header-icon">
            <Heart size={32} />
          </div>
          <div className="header-content">
            <h1 className="header-title">웰니스 알림</h1>
            <p className="header-subtitle">
              마음 건강을 위한 유용한 정보와 팁을 확인하세요
            </p>
          </div>
        </div>

        {/* 알림 목록 */}
        {notifications.length === 0 ? (
          <div className="wellness-notification-empty">
            <div className="empty-icon">
              <Heart size={48} />
            </div>
            <h2 className="empty-title">등록된 웰니스 알림이 없습니다</h2>
            <p className="empty-message">
              새로운 웰니스 알림이 등록되면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="wellness-notification-grid">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`wellness-notification-card ${
                  notification.isImportant ? 'card-important' : ''
                } ${notification.isUrgent ? 'card-urgent' : ''} ${
                  notification.isRead ? 'card-read' : 'card-unread'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* 배지 */}
                <div className="card-badges">
                  {notification.isImportant && (
                    <span className="badge badge-important">
                      <Heart size={12} />
                      <span>중요</span>
                    </span>
                  )}
                  {notification.isUrgent && (
                    <span className="badge badge-urgent">긴급</span>
                  )}
                  {!notification.isRead && (
                    <span className="badge badge-new">NEW</span>
                  )}
                </div>

                {/* 아이콘 */}
                <div className="card-icon">
                  {getNotificationIcon(notification)}
                </div>

                {/* 내용 */}
                <div className="card-content">
                  <h3 className="card-title">{notification.title}</h3>
                  <p className="card-description">
                    {notification.content?.replace(/<[^>]*>/g, '').substring(0, 100)}
                    {notification.content?.length > 100 ? '...' : ''}
                  </p>
                  <div className="card-meta">
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>
                        {new Date(
                          notification.publishedAt || notification.createdAt
                        ).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 화살표 */}
                <div className="card-arrow">
                  <TrendingUp size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default WellnessNotificationList;

