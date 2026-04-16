import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../utils/safeDisplay';
import './WellnessNotificationDetail.css';

/**
 * 웰니스 알림 상세 페이지 컴포넌트
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-01-21
 */
const WellnessNotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useSession();
  const [notification, setNotification] = useState(null);
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

    loadNotificationDetail();
  }, [id, isLoggedIn, user, navigate]);

  const loadNotificationDetail = async() => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiGet(`/api/v1/system-notifications/${id}`);
      
      if (response && response.success) {
        setNotification(response.data);
      } else {
        setError('알림을 불러올 수 없습니다.');
        notificationManager.show('알림을 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('❌ 웰니스 알림 상세 로드 실패:', error);
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
      'GENERAL': '일반',
      'URGENT': '긴급',
      'MAINTENANCE': '점검',
      'EVENT': '이벤트',
      'UPDATE': '업데이트',
      'WELLNESS': '웰니스'
    };
    return toDisplayString(types[type] ?? type, '—');
  };

  const getNotificationTypeClass = (type) => {
    const classes = {
      'GENERAL': 'type-general',
      'URGENT': 'type-urgent',
      'MAINTENANCE': 'type-maintenance',
      'EVENT': 'type-event',
      'UPDATE': 'type-update',
      'WELLNESS': 'type-wellness'
    };
    return classes[type] || 'type-general';
  };

/**
   * AI 생성 웰니스 컨텐츠를 HTML로 렌더링
/**
   * - HTML 태그를 그대로 렌더링
/**
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


  if (loading) {
    return (
      <AdminCommonLayout title="알림 상세">
        <UnifiedLoading type="inline" text="웰니스 알림을 불러오는 중..." />
      </AdminCommonLayout>
    );
  }

  if (error || !notification) {
    return (
      <AdminCommonLayout title="알림 상세">
        <div className="wellness-notification-detail">
          <div className="wellness-notification-error">
            <div className="error-icon" aria-hidden="true">
              알림
            </div>
            <h2 className="error-title">알림을 찾을 수 없습니다</h2>
            <p className="error-message"><SafeText fallback="요청하신 알림을 찾을 수 없습니다.">{error}</SafeText></p>
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
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="알림 상세">
      <div className="wellness-notification-detail">
        {/* 헤더 */}
        <div className="wellness-notification-header">
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

        {/* 제목 */}
        <div className="wellness-notification-title-section">
          <h1 className="notification-title"><SafeText>{notification.title}</SafeText></h1>
          
          <div className="notification-meta">
            <div className="meta-item">
              <span className="meta-label">작성자</span>
              <span><SafeText fallback="관리자">{notification.authorName}</SafeText></span>
            </div>
            <div className="meta-item">
              <span className="meta-label">게시</span>
              <span>{toDisplayString(new Date(notification.publishedAt || notification.createdAt).toLocaleDateString('ko-KR'))}</span>
            </div>
            {notification.expiresAt && (
              <div className="meta-item">
                <span className="meta-label">만료</span>
                <span>{toDisplayString(new Date(notification.expiresAt).toLocaleDateString('ko-KR'))}</span>
              </div>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div className="wellness-notification-content">
          <div className="content-body">
            {formatWellnessContent(notification.content)}
          </div>
        </div>

        {/* 하단 액션 */}
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
      </div>
    </AdminCommonLayout>
  );
};

export default WellnessNotificationDetail;

