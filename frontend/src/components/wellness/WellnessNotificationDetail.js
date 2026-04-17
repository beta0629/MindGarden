import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StandardizedApi from '../../utils/standardizedApi';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/themes/client-theme.css';
import './WellnessNotificationDetail.css';

/**
 * 웰니스 알림 상세 페이지 컴포넌트
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-21
 */
const WELLNESS_NOTIFICATION_DETAIL_TITLE_ID = 'wellness-notification-detail-title';

const WellnessNotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useSession();
  const [notification, setNotification] = useState(null);
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

    loadNotificationDetail();
  }, [id, isLoggedIn, user, navigate]);

  const loadNotificationDetail = async() => {
    try {
      setLoading(true);
      setError(null);

      const response = await StandardizedApi.get(`/api/v1/system-notifications/${id}`);

      if (response && response.success) {
        setNotification(response.data);
      } else {
        setError('알림을 불러올 수 없습니다.');
        notificationManager.show('알림을 불러오는데 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('❌ 웰니스 알림 상세 로드 실패:', err);
      setError('알림을 불러오는 중 오류가 발생했습니다.');
      notificationManager.show('알림을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
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

  const getNotificationTypeClass = (type) => {
    const classes = {
      GENERAL: 'type-general',
      URGENT: 'type-urgent',
      MAINTENANCE: 'type-maintenance',
      EVENT: 'type-event',
      UPDATE: 'type-update',
      WELLNESS: 'type-wellness'
    };
    return classes[type] || 'type-general';
  };

  const getMetaSubtitle = (n) => {
    const author = toDisplayString(n.authorName, '관리자');
    const published = toDisplayString(
      new Date(n.publishedAt || n.createdAt).toLocaleDateString('ko-KR')
    );
    const parts = [`작성 ${author}`, `게시 ${published}`];
    if (n.expiresAt) {
      parts.push(`만료 ${toDisplayString(new Date(n.expiresAt).toLocaleDateString('ko-KR'))}`);
    }
    return parts.join(' · ');
  };

  /**
   * AI 생성 웰니스 컨텐츠를 HTML로 렌더링
   * - HTML 태그를 그대로 렌더링
   * - 안전한 HTML 렌더링을 위해 dangerouslySetInnerHTML 사용
   */
  const formatWellnessContent = (content) => {
    if (content == null || content === '') return null;

    const html = typeof content === 'string' ? content : toDisplayString(content, '');
    return (
      <div
        className="wellness-content-html"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const backAction = (
    <MGButton
      type="button"
      variant="outline"
      size="small"
      className={buildErpMgButtonClassName({
        variant: 'outline',
        size: 'sm',
        loading: false,
        className: 'back-button'
      })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={handleBack}
      preventDoubleClick={false}
    >
      <span>← 목록으로</span>
    </MGButton>
  );

  const pageShell = (headerTitle, headerSubtitle, body, actions = null) => (
    <div className="mg-v2-ad-b0kla" data-testid="client-wellness-detail-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="웰니스 알림 상세">
          <ContentHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            titleId={WELLNESS_NOTIFICATION_DETAIL_TITLE_ID}
            actions={actions}
          />
          <main aria-labelledby={WELLNESS_NOTIFICATION_DETAIL_TITLE_ID}>
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminCommonLayout title="알림 상세" className="mg-v2-dashboard-layout">
        {pageShell(
          '웰니스 알림',
          '상세 내용을 불러오는 중입니다.',
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="웰니스 알림을 불러오는 중..." />
          </div>,
          backAction
        )}
      </AdminCommonLayout>
    );
  }

  if (error || !notification) {
    return (
      <AdminCommonLayout title="알림 상세" className="mg-v2-dashboard-layout">
        {pageShell(
          '웰니스 알림',
          '요청하신 알림을 찾을 수 없습니다.',
          <div className="wellness-notification-detail">
            <div className="wellness-notification-error">
              <div className="error-icon" aria-hidden="true">
                알림
              </div>
              <h2 className="error-title">알림을 찾을 수 없습니다</h2>
              <p className="error-message">
                <SafeText fallback="요청하신 알림을 찾을 수 없습니다.">{error}</SafeText>
              </p>
              <MGButton
                type="button"
                variant="primary"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'md',
                  loading: false,
                  className: 'mg-btn mg-btn--primary'
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleBack}
                preventDoubleClick={false}
              >
                <span>← 돌아가기</span>
              </MGButton>
            </div>
          </div>,
          backAction
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="알림 상세" className="mg-v2-dashboard-layout">
      {pageShell(
        toDisplayString(notification.title, '웰니스 알림'),
        getMetaSubtitle(notification),
        <div className="wellness-notification-detail">
          <div className="wellness-notification-header wellness-notification-header--badges-only">
            <div className="header-badges">
              {notification.isImportant && (
                <span className="badge badge-important">
                  <span>중요</span>
                </span>
              )}
              {notification.isUrgent && (
                <span className="badge badge-urgent">
                  <span>긴급</span>
                </span>
              )}
              <span className={`badge badge-type ${getNotificationTypeClass(notification.notificationType)}`}>
                <SafeText>{getNotificationTypeLabel(notification.notificationType)}</SafeText>
              </span>
            </div>
          </div>

          <div className="wellness-notification-content">
            <div className="content-body">
              {formatWellnessContent(notification.content)}
            </div>
          </div>

          <div className="wellness-notification-actions">
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({
                variant: 'secondary',
                size: 'md',
                loading: false,
                className: 'mg-btn mg-btn--secondary'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleBack}
              preventDoubleClick={false}
            >
              <span>← 목록으로 돌아가기</span>
            </MGButton>
          </div>
        </div>,
        backAction
      )}
    </AdminCommonLayout>
  );
};

export default WellnessNotificationDetail;
