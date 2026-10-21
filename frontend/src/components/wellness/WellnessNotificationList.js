import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StandardizedApi from '../../utils/standardizedApi';
import { useClientSessionReady } from '../../hooks/useClientSessionReady';
import { useSoftResourceLoad } from '../../hooks/useSoftResourceLoad';
import { useUserIdScopedLoad } from '../../hooks/useUserIdScopedLoad';
import ClientWebPageShell from '../client/ClientWebPageShell';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import SafeText from '../common/SafeText';
import EmptyState from '../common/EmptyState';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import NotificationListCard, { NotificationUrgentBadge } from '../notifications/NotificationListCard';
import { ICONS, ICON_SIZES } from '../../constants/icons';
import { toDisplayString } from '../../utils/safeDisplay';
import { toPlainNoticePreview } from '../../utils/safeHtml';
import '../../styles/unified-design-tokens.css';
import '../../styles/themes/client-theme.css';
import '../notifications/UnifiedNotifications.css';
import './WellnessNotificationList.css';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { NOTIFICATION_PREVIEW_MAX_CHARS } from '../../constants/notificationTabs';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
/**
 * 웰니스 알림 목록 페이지 컴포넌트
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-21
 */
const WELLNESS_NOTIFICATION_LIST_TITLE_ID = 'wellness-notification-list-title';
const LeafIcon = ICONS.LEAF;
const AlertIcon = ICONS.ALERT_CIRCLE;

const WELLNESS_COPY = {
  TITLE: '웰니스 알림',
  SUBTITLE: '마음 건강에 도움이 되는 짧은 글과 연습이에요.',
  GO_LABEL: '읽기',
  IMPORTANT: '중요',
  UNREAD_SR: '읽지 않은 알림',
  EMPTY_TITLE: '웰니스 알림이 아직 없어요',
  EMPTY_DESC: '새 웰니스 알림이 등록되면 여기에 보여요.',
  ERROR_TITLE: '알림을 불러오지 못했어요'
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const toCardPreview = (content) => {
  const text = toPlainNoticePreview(typeof content === 'string' ? content : toDisplayString(content, ''));
  if (text.length <= NOTIFICATION_PREVIEW_MAX_CHARS) {
    return text;
  }
  return `${text.substring(0, NOTIFICATION_PREVIEW_MAX_CHARS)}...`;
};

const WellnessNotificationList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { ready, userId } = useClientSessionReady();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { load: loadNotificationList } = useSoftResourceLoad(setLoading, async() => {
    setError(null);
    try {
      const response = await StandardizedApi.get(API_ENDPOINTS.SYSTEM.NOTIFICATIONS.ACTIVE);

      // StandardizedApi.get unwrap → 알림 배열 직접 수용
      if (response != null && response.success !== false) {
        const list = Array.isArray(response)
          ? response
          : (Array.isArray(response.data) ? response.data : (response.content || []));
        const wellnessNotifications = (Array.isArray(list) ? list : []).filter(
          (notification) => notification.notificationType === 'WELLNESS'
        );
        setNotifications(wellnessNotifications);
      } else {
        setError('알림을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('웰니스 알림 목록 로드 실패:', err);
      setError('알림을 불러오는 중 오류가 발생했습니다.');
    }
  });

  useUserIdScopedLoad({ userId, loadFn: loadNotificationList, enabled: ready });

  const loadNotifications = useCallback(() => {
    void loadNotificationList({ silent: false });
  }, [loadNotificationList]);

  const handleNotificationClick = (notification) => {
    navigate(`/client/wellness/${notification.id}`);
  };

  const pageShell = (body) => (
    <ClientWebPageShell
      className="unified-notifications-shell"
      title={WELLNESS_COPY.TITLE}
      titleId={WELLNESS_NOTIFICATION_LIST_TITLE_ID}
      meta={(
        <p className="unified-notifications__subtitle">{WELLNESS_COPY.SUBTITLE}</p>
      )}
    >
      <div className="unified-notifications" data-testid="client-wellness-list-page">
        <main aria-labelledby={WELLNESS_NOTIFICATION_LIST_TITLE_ID}>
          {body}
        </main>
      </div>
    </ClientWebPageShell>
  );

  if (loading) {
    return pageShell(
      <div className="wellness-notification-list" aria-busy="true" aria-live="polite">
        <UnifiedLoading type="inline" text="웰니스 알림을 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return pageShell(
      <div className="wellness-notification-list" role="alert">
        <EmptyState
          icon={<AlertIcon size={ICON_SIZES.XXL} aria-hidden />}
          title={WELLNESS_COPY.ERROR_TITLE}
          description={<SafeText>{error}</SafeText>}
          action={(
            <MGButton
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={loadNotifications}
            >
              {t('common.labels.retry')}
            </MGButton>
          )}
        />
      </div>
    );
  }

  return pageShell(
    <div className="wellness-notification-list">
      {notifications.length === 0 ? (
        <EmptyState
          icon={<LeafIcon size={ICON_SIZES.XXL} aria-hidden />}
          title={WELLNESS_COPY.EMPTY_TITLE}
          description={WELLNESS_COPY.EMPTY_DESC}
        />
      ) : (
        <ul className="notif-list">
          {notifications.map((notification) => {
            const when = notification.publishedAt || notification.createdAt;
            return (
              <NotificationListCard
                key={notification.id}
                title={toDisplayString(notification.title, '')}
                timeLabel={formatDateTime(when)}
                timeIso={toDisplayString(when, '')}
                summary={toCardPreview(notification.content)}
                meta={toDisplayString(notification.authorName, '')}
                badge={(
                  <>
                    {notification.isUrgent ? (
                      <NotificationUrgentBadge label={t('admin.labels.urgent')} />
                    ) : null}
                    {notification.isImportant ? (
                      <span className="mg-badge">{WELLNESS_COPY.IMPORTANT}</span>
                    ) : null}
                  </>
                )}
                unread={!notification.isRead}
                unreadSr={WELLNESS_COPY.UNREAD_SR}
                icon={LeafIcon}
                goLabel={WELLNESS_COPY.GO_LABEL}
                onClick={() => handleNotificationClick(notification)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default WellnessNotificationList;
