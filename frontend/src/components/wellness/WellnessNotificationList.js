import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StandardizedApi from '../../utils/standardizedApi';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import Badge from '../common/Badge';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/themes/client-theme.css';
import './WellnessNotificationList.css';

/**
 * 웰니스 알림 목록 페이지 컴포넌트
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-21
 */
const WELLNESS_NOTIFICATION_LIST_TITLE_ID = 'wellness-notification-list-title';

const stripHtmlToPreview = (raw) => {
  const text = toDisplayString(raw, '');
  return text.replace(/<[^>]*>/g, '');
};

const WellnessNotificationList = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  const loadNotifications = async() => {
    try {
      setLoading(true);
      setError(null);

      const response = await StandardizedApi.get('/api/v1/system-notifications/active');

      if (response && response.success) {
        const wellnessNotifications = response.data.filter(
          (notification) => notification.notificationType === 'WELLNESS'
        );
        setNotifications(wellnessNotifications);
      } else {
        setError('알림을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('❌ 웰니스 알림 목록 로드 실패:', err);
      setError('알림을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    navigate(`/client/wellness/${notification.id}`);
  };

  const getNotificationIconLabel = (notification) => {
    if (notification.isUrgent) return '긴급';
    if (notification.isImportant) return '중요';
    return '알림';
  };

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla" data-testid="client-wellness-list-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="웰니스 알림">
          <ContentHeader
            title="웰니스 알림"
            subtitle="마음 건강을 위한 유용한 정보와 팁을 확인하세요"
            titleId={WELLNESS_NOTIFICATION_LIST_TITLE_ID}
          />
          <main aria-labelledby={WELLNESS_NOTIFICATION_LIST_TITLE_ID}>
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminCommonLayout title="웰니스 알림" className="mg-v2-dashboard-layout">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="웰니스 알림을 불러오는 중..." />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (error) {
    return (
      <AdminCommonLayout title="웰니스 알림" className="mg-v2-dashboard-layout">
        {pageShell(
          <div className="wellness-notification-list">
            <div className="wellness-notification-empty">
              <div className="empty-icon" aria-hidden="true">
                오류
              </div>
              <h2 className="empty-title">알림을 불러올 수 없습니다</h2>
              <p className="empty-message"><SafeText>{error}</SafeText></p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={loadNotifications}
              >
                다시 시도
              </MGButton>
            </div>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="웰니스 알림" className="mg-v2-dashboard-layout">
      {pageShell(
        <div className="wellness-notification-list">
          {notifications.length === 0 ? (
            <div className="wellness-notification-empty">
              <div className="empty-icon" aria-hidden="true">
                웰니스
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
                  <div className="card-badges">
                    {notification.isImportant && (
                      <Badge variant="status" statusVariant="warning" label="중요" size="sm" />
                    )}
                    {notification.isUrgent && (
                      <Badge variant="status" statusVariant="danger" label="긴급" size="sm" />
                    )}
                    {!notification.isRead && (
                      <Badge variant="status" statusVariant="info" label="신규" size="sm" />
                    )}
                  </div>

                  <div className="card-icon" aria-hidden="true">
                    {getNotificationIconLabel(notification)}
                  </div>

                  <div className="card-content">
                    <h3 className="card-title"><SafeText>{notification.title}</SafeText></h3>
                    <div
                      className="card-description"
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          const textOnly = stripHtmlToPreview(notification.content);
                          return textOnly.length > 100
                            ? `${textOnly.substring(0, 100)}...`
                            : textOnly;
                        })()
                      }}
                    />
                    <div className="card-meta">
                      <div className="meta-item">
                        <span className="meta-label">게시</span>
                        <span>
                          {toDisplayString(
                            new Date(
                              notification.publishedAt || notification.createdAt
                            ).toLocaleDateString('ko-KR')
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card-arrow" aria-hidden="true">
                    상세
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminCommonLayout>
  );
};

export default WellnessNotificationList;
