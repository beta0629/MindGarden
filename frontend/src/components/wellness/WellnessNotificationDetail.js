import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StandardizedApi from '../../utils/standardizedApi';
import { useClientSessionReady } from '../../hooks/useClientSessionReady';
import { useSoftResourceLoad } from '../../hooks/useSoftResourceLoad';
import { useUserIdScopedLoad } from '../../hooks/useUserIdScopedLoad';
import notificationManager from '../../utils/notification';
import ClientWebPageShell from '../client/ClientWebPageShell';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import SafeText from '../common/SafeText';
import EmptyState from '../common/EmptyState';
import { NotificationUrgentBadge } from '../notifications/NotificationListCard';
import { ICONS, ICON_SIZES } from '../../constants/icons';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../utils/safeDisplay';
import { sanitizeRichNoticeHtml } from '../../utils/safeHtml';
import { CLIENT_DASHBOARD_ROUTES } from '../../constants/clientDashboardRoutes';
import '../../styles/unified-design-tokens.css';
import '../../styles/themes/client-theme.css';
import '../notifications/UnifiedNotifications.css';
import './WellnessNotificationDetail.css';
import { useTranslation } from 'react-i18next';

/**
 * 웰니스 알림 상세 페이지 컴포넌트
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-21
 */
const WELLNESS_NOTIFICATION_DETAIL_TITLE_ID = 'wellness-notification-detail-title';
const AlertIcon = ICONS.ALERT_CIRCLE;
const LIST_LABEL = '목록으로';
const BACK_LINK_LABEL = '< 웰니스 알림';

const WellnessNotificationDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { ready, userId } = useClientSessionReady();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { load: loadNotificationDetail } = useSoftResourceLoad(setLoading, async() => {
    setError(null);
    try {
      const response = await StandardizedApi.get(`/api/v1/system-notifications/${id}`);

      // StandardizedApi.get unwrap → 상세 DTO 직접 사용
      if (response != null && response.success !== false) {
        setNotification(response.data != null ? response.data : response);
      } else {
        setError('알림을 불러올 수 없습니다.');
        notificationManager.show('알림을 불러오는데 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('웰니스 알림 상세 로드 실패:', err);
      setError('알림을 불러오는 중 오류가 발생했습니다.');
      notificationManager.show('알림을 불러오는데 실패했습니다.', 'error');
    }
  });

  useUserIdScopedLoad({
    userId,
    loadFn: loadNotificationDetail,
    enabled: ready,
    extraDeps: [id]
  });

  const handleBackToList = () => {
    navigate(CLIENT_DASHBOARD_ROUTES.WELLNESS);
  };

  const getNotificationTypeLabel = (type) => {
    const types = {
      GENERAL: '일반',
      URGENT: '긴급',
      MAINTENANCE: '점검',
      EVENT: '이벤트',
      UPDATE: '업데이트',
      WELLNESS: '웰니스'
    };
    return toDisplayString(types[type] ?? type, '—');
  };

  const getMetaSubtitle = (n) => {
    const author = toDisplayString(n.authorName, '관리자');
    const published = toDisplayString(
      new Date(n.publishedAt || n.createdAt).toLocaleDateString('ko-KR')
    );
    const parts = [`${author} · ${published}`];
    if (n.expiresAt) {
      parts.push(`만료 ${toDisplayString(new Date(n.expiresAt).toLocaleDateString('ko-KR'))}`);
    }
    return parts.join(' · ');
  };

  /**
   * AI 생성 웰니스 컨텐츠를 정화된 HTML 로 렌더링한다.
   */
  const formatWellnessContent = (content) => {
    if (content == null || content === '') return null;

    const raw = typeof content === 'string' ? content : toDisplayString(content, '');
    const html = sanitizeRichNoticeHtml(raw);
    return (
      <div
        className="wellness-reading__html"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const backLink = (
    <button
      type="button"
      className="wellness-reading__back-link"
      data-testid="wellness-detail-back-link"
      data-gnb-chrome-free="true"
      onClick={handleBackToList}
    >
      {BACK_LINK_LABEL}
    </button>
  );

  const listButton = (
    <MGButton
      type="button"
      variant="outline"
      className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={handleBackToList}
      preventDoubleClick={false}
    >
      {LIST_LABEL}
    </MGButton>
  );

  const pageShell = (headerTitle, headerSubtitle, body) => (
    <ClientWebPageShell
      className="unified-notifications-shell"
      title={headerTitle}
      titleId={WELLNESS_NOTIFICATION_DETAIL_TITLE_ID}
      meta={headerSubtitle ? (
        <p className="unified-notifications__subtitle">{headerSubtitle}</p>
      ) : null}
    >
      <div className="unified-notifications" data-testid="client-wellness-detail-page">
        <main aria-labelledby={WELLNESS_NOTIFICATION_DETAIL_TITLE_ID}>
          {body}
        </main>
      </div>
    </ClientWebPageShell>
  );

  if (loading) {
    return pageShell(
      '웰니스 알림',
      '상세 내용을 불러오는 중입니다.',
      <div className="wellness-reading-wrap" aria-busy="true" aria-live="polite">
        <UnifiedLoading type="inline" text="웰니스 알림을 불러오는 중..." />
      </div>
    );
  }

  if (error || !notification) {
    return pageShell(
      '웰니스 알림',
      '요청하신 알림을 찾을 수 없어요.',
      <div className="wellness-reading-wrap" role="alert">
        <EmptyState
          icon={<AlertIcon size={ICON_SIZES.XXL} aria-hidden />}
          title="알림을 찾을 수 없어요"
          description={<SafeText fallback="요청하신 알림을 찾을 수 없어요.">{error}</SafeText>}
          action={listButton}
        />
      </div>
    );
  }

  return pageShell(
    toDisplayString(notification.title, '웰니스 알림'),
    getMetaSubtitle(notification),
    <div className="wellness-reading-wrap">
      {backLink}
      <article className="wellness-reading">
        <div className="wellness-reading__meta">
          {notification.isUrgent ? (
            <NotificationUrgentBadge label={t('admin.labels.urgent')} />
          ) : null}
          {notification.isImportant ? <span className="mg-badge">중요</span> : null}
          <span className="mg-badge">
            <SafeText>{getNotificationTypeLabel(notification.notificationType)}</SafeText>
          </span>
        </div>
        <div className="wellness-reading__body">
          {formatWellnessContent(notification.content)}
        </div>
        <div className="wellness-reading__foot">
          {listButton}
        </div>
      </article>
    </div>
  );
};

export default WellnessNotificationDetail;
