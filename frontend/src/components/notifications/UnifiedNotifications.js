import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { getConsultationMessagesListPath } from '../../utils/consultationMessagesApi';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import UnifiedModal from '../common/modals/UnifiedModal';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import '../../styles/unified-design-tokens.css';

/**
 * 통합 알림 페이지
/**
 * 시스템 공지와 일반 메시지를 탭으로 구분하여 표시
 */
const UNIFIED_NOTIFICATIONS_TITLE_ID = 'unified-notifications-title';

const UnifiedNotifications = () => {
  const { user, isLoggedIn } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'messages'
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // 시스템 공지 로드
  const loadSystemNotifications = async() => {
    if (!isLoggedIn || !user?.id) {
      console.log('📢 UnifiedNotifications - 시스템 공지 로드 스킵 - 로그인 정보 없음');
      setSystemNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiGet('/api/v1/system-notifications?page=0&size=50');

      if (response) {
        // 백엔드 응답이 { notifications: [...] } 형태일 수 있음
        const notificationsData = response.notifications || (Array.isArray(response) ? response : []);
        setSystemNotifications(notificationsData);
      }
    } catch (error) {
      // 인증 오류는 조용히 처리
      if (error.status === 401 || error.status === 403) {
        console.log('📢 시스템 공지 로드 실패 - 인증 필요');
      } else {
        console.error('시스템 공지 로드 오류:', error);
      }
      setSystemNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // 일반 메시지 로드
  const loadMessages = async() => {
    if (!isLoggedIn || !user?.id) return;

    try {
      setLoading(true);
      
      const basePath = getConsultationMessagesListPath(user);
      if (!basePath) {
        setMessages([]);
        return;
      }
      console.log('🔍 메시지 로드 - 사용자 역할:', user.role, 'ID:', user.id, '경로:', basePath);
      const response = await apiGet(basePath, { page: 0, size: 50 });

      if (response) {
        // 백엔드 응답이 { messages: [...] } 형태일 수 있음
        const messagesData = response.messages || (Array.isArray(response) ? response : []);
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedItem(null);
    if (tab === 'system') {
      loadSystemNotifications();
    } else {
      loadMessages();
    }
  };

  // 시스템 공지 클릭
  const handleSystemNotificationClick = async(notification) => {
    try {
      // 상세 조회 API 호출 (자동 읽음 처리)
      const response = await apiGet(`/api/v1/system-notifications/${notification.id}`);
      
      if (response) {
        setSelectedItem({ type: 'system', data: response });
      } else {
        // 실패 시 기존 데이터 사용
        setSelectedItem({ type: 'system', data: notification });
      }
    } catch (error) {
      console.error('공지 상세 조회 오류:', error);
      // 오류 시 기존 데이터 사용
      setSelectedItem({ type: 'system', data: notification });
    }
  };

  // 일반 메시지 클릭
  const handleMessageClick = async(message) => {
    try {
      // 상세 조회 API 호출 (자동 읽음 처리)
      const response = await apiGet(`/api/v1/consultation-messages/${message.id}`);
      
      if (response) {
        setSelectedItem({ type: 'message', data: response });
      } else {
        // 실패 시 기존 데이터 사용
        setSelectedItem({ type: 'message', data: message });
      }
    } catch (error) {
      console.error('메시지 상세 조회 오류:', error);
      // 오류 시 기존 데이터 사용
      setSelectedItem({ type: 'message', data: message });
    }
  };

  // 모달 닫기
  const closeModal = async() => {
    setSelectedItem(null);
    
    // 목록 새로고침 (읽음 상태 반영)
    if (activeTab === 'system') {
      await loadSystemNotifications();
      // 공지 읽음 이벤트 발생 (NotificationContext가 카운트 갱신)
      window.dispatchEvent(new Event('notification-read'));
    } else {
      await loadMessages();
      // 메시지 읽음 이벤트 발생 (NotificationContext가 카운트 갱신)
      window.dispatchEvent(new Event('message-read'));
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 메시지 유형 라벨
  const getMessageTypeLabel = (type) => {
    const labels = {
      GENERAL: '일반',
      FOLLOW_UP: '후속 조치',
      HOMEWORK: '과제 안내',
      REMINDER: '알림',
      URGENT: '긴급'
    };
    return labels[type] || '일반';
  };

  // 메시지 유형 색상
  const getMessageTypeColor = (type) => {
    const colors = {
      GENERAL: 'var(--color-info)',
      FOLLOW_UP: 'var(--color-primary)',
      HOMEWORK: 'var(--color-success)',
      REMINDER: 'var(--color-warning)',
      URGENT: 'var(--color-danger)'
    };
    return colors[type] || 'var(--color-info)';
  };

  useEffect(() => {
    if (activeTab === 'system') {
      loadSystemNotifications();
    } else {
      loadMessages();
    }
  }, [isLoggedIn, user?.id]);

  /** GNB 알림 드롭다운 등에서 state로 전달된 공지/메시지 ID → 상세 모달 자동 오픈 */
  useEffect(() => {
    const openSystemId = location.state?.openSystemNotificationId;
    const openMessageId = location.state?.openConsultationMessageId;
    if (!isLoggedIn || (!openSystemId && !openMessageId)) {
      return;
    }

    let cancelled = false;
    (async() => {
      try {
        if (openSystemId != null) {
          setActiveTab('system');
          const response = await apiGet(`/api/v1/system-notifications/${openSystemId}`);
          if (!cancelled && response) {
            setSelectedItem({ type: 'system', data: response });
          }
          if (!cancelled) {
            window.dispatchEvent(new Event('notification-read'));
          }
        } else if (openMessageId != null) {
          setActiveTab('messages');
          const response = await apiGet(`/api/v1/consultation-messages/${openMessageId}`);
          if (!cancelled && response) {
            setSelectedItem({ type: 'message', data: response });
          }
          if (!cancelled) {
            window.dispatchEvent(new Event('message-read'));
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('알림 딥링크 상세 로드 실패:', error);
        }
      } finally {
        if (!cancelled) {
          navigate('/notifications', { replace: true, state: {} });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isLoggedIn,
    location.state?.openSystemNotificationId,
    location.state?.openConsultationMessageId,
    navigate
  ]);

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout title="알림">
        <ContentArea ariaLabel="알림">
          <div className="mg-card mg-v2-text-center mg-p-xl">
            <h3>로그인이 필요합니다.</h3>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="알림">
      <ContentArea ariaLabel="통합 알림">
        <ContentHeader
          title="알림"
          subtitle="시스템 공지와 메시지를 확인하세요."
          titleId={UNIFIED_NOTIFICATIONS_TITLE_ID}
        />

        {/* 탭 */}
        <div className="mg-card mg-mb-lg">
          <div className="mg-flex mg-gap-sm">
            <MGButton
              type="button"
              variant={activeTab === 'system' ? 'primary' : 'outline'}
              className={buildErpMgButtonClassName({
                variant: activeTab === 'system' ? 'primary' : 'outline',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => handleTabChange('system')}
              preventDoubleClick={false}
            >
              시스템 공지
            </MGButton>
            <MGButton
              type="button"
              variant={activeTab === 'messages' ? 'primary' : 'outline'}
              className={buildErpMgButtonClassName({
                variant: activeTab === 'messages' ? 'primary' : 'outline',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => handleTabChange('messages')}
              preventDoubleClick={false}
            >
              일반 메시지
            </MGButton>
          </div>
        </div>

        {/* 로딩 */}
        {loading && <UnifiedLoading type="inline" text="알림을 불러오는 중..." />}

        {/* 시스템 공지 목록 */}
        {!loading && activeTab === 'system' && (
          <div>
            {systemNotifications.length === 0 ? (
              <div className="mg-empty-state">
                <div className="mg-empty-state__text">시스템 공지가 없습니다</div>
              </div>
            ) : (
              <div className="mg-space-y-sm">
                {systemNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleSystemNotificationClick(notification)}
                    className={`mg-card mg-cursor-pointer ${notification.isRead ? 'mg-card-read' : 'mg-card-unread'}`}
                  >
                    <div className="mg-flex mg-gap-md">
                      <div className="mg-flex-1">
                        <div className="mg-flex mg-justify-between mg-align-start mg-mb-sm">
                          <div className="mg-flex mg-align-center mg-gap-sm mg-flex-wrap">
                            <h4 className={`mg-h5 mg-mb-0 ${notification.isRead ? '' : 'mg-font-weight-semibold'}`}>
                              {notification.title}
                            </h4>
                            {notification.isUrgent && (
                              <span className="mg-badge mg-badge-danger mg-v2-text-xs">긴급</span>
                            )}
                            {notification.isImportant && (
                              <span className="mg-badge mg-badge-warning mg-v2-text-xs">중요</span>
                            )}
                            <span className="mg-badge mg-badge-secondary mg-v2-text-xs">
                              {notification.targetType === 'ALL' ? '전체' :
                               notification.targetType === 'CONSULTANT' ? '상담사' : '내담자'}
                            </span>
                          </div>
                          <span className="mg-v2-text-xs mg-v2-color-text-secondary">
                            {formatDate(notification.publishedAt || notification.createdAt)}
                          </span>
                        </div>
                        <div 
                          className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-0"
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              const content = notification.content || '';
                              // HTML 태그 제거하여 미리보기만 표시
                              const textOnly = content.replace(/<[^>]*>/g, '');
                              return textOnly.length > 100
                                ? `${textOnly.substring(0, 100)}...`
                                : textOnly;
                            })()
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 일반 메시지 목록 */}
        {!loading && activeTab === 'messages' && (
          <div>
            {messages.length === 0 ? (
              <div className="mg-empty-state">
                <div className="mg-empty-state__text">메시지가 없습니다</div>
              </div>
            ) : (
              <div className="mg-space-y-sm">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`mg-card mg-cursor-pointer ${message.isRead ? 'mg-card-read' : 'mg-card-unread'}`}
                  >
                    <div className="mg-flex mg-gap-md">
                      <div className="mg-flex-1">
                        <div className="mg-flex mg-justify-between mg-align-start mg-mb-sm">
                          <div className="mg-flex mg-align-center mg-gap-sm mg-flex-wrap">
                            <h4 className={`mg-h5 mg-mb-0 ${message.isRead ? '' : 'mg-font-weight-semibold'}`}>
                              {message.title}
                            </h4>
                            <span 
                              className="mg-badge mg-v2-text-xs mg-badge-message-type"
                              data-type={message.messageType}
                            >
                              {getMessageTypeLabel(message.messageType)}
                            </span>
                            {message.isImportant && (
                              <span className="mg-badge mg-badge-warning mg-v2-text-xs">중요</span>
                            )}
                            {message.isUrgent && (
                              <span className="mg-badge mg-badge-danger mg-v2-text-xs">긴급</span>
                            )}
                          </div>
                          <span className="mg-v2-text-xs mg-v2-color-text-secondary">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mb-sm">
                          {message.content.length > 100
                            ? `${message.content.substring(0, 100)}...`
                            : message.content}
                        </p>
                        <div className="mg-v2-text-xs mg-v2-color-text-secondary">
                          {message.senderType === 'CONSULTANT' ? '발신' : '수신'} ·
                          {message.senderType === 'SYSTEM' ? '시스템 메시지' : (message.senderName || '알 수 없음')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 상세 모달 */}
        {selectedItem && (
          <UnifiedModal
            isOpen={!!selectedItem}
            onClose={closeModal}
            title={selectedItem.data.title}
            subtitle={`${selectedItem.data.senderType === 'SYSTEM' ? '시스템 메시지' : (selectedItem.data.authorName || selectedItem.data.senderName || '관리자')} · ${formatDate(selectedItem.data.publishedAt || selectedItem.data.createdAt)}`}
            size="large"
            actions={
              <MGButton
                type="button"
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={closeModal}
              >
                확인
              </MGButton>
            }
          >
            <div className="mg-flex mg-align-center mg-gap-sm mg-mb-md">
              {selectedItem.data.isUrgent && (
                <span className="mg-badge mg-badge-danger">긴급</span>
              )}
              {selectedItem.data.isImportant && (
                <span className="mg-badge mg-badge-warning">중요</span>
              )}
              {selectedItem.type === 'system' && (
                <span className="mg-badge mg-badge-secondary">
                  {selectedItem.data.targetType === 'ALL' ? '전체' :
                   selectedItem.data.targetType === 'CONSULTANT' ? '상담사' : '내담자'}
                </span>
              )}
              {selectedItem.type === 'message' && (
                <span
                  className="mg-badge mg-badge-message-type"
                  data-type={selectedItem.data.messageType}
                >
                  {getMessageTypeLabel(selectedItem.data.messageType)}
                </span>
              )}
            </div>
            <div
              className="notification-content"
              dangerouslySetInnerHTML={{
                __html: selectedItem.data.content || ''
              }}
            />
          </UnifiedModal>
        )}
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default UnifiedNotifications;

