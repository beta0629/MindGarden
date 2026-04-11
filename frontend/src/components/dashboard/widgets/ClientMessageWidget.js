import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Bell,
  Megaphone,
  Star
} from 'lucide-react';
import { RoleUtils } from '../../../constants/roles';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { apiGet } from '../../../utils/ajax';
import Badge from '../../common/Badge';
import './ClientMessageWidget.css';
import SafeText from '../../common/SafeText';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';

const ClientMessageWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [allMessages, setAllMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // 데이터 소스 설정 (내담자 전용)
  const getDataSourceConfig = () => ({
    type: 'api',
    cache: true,
    refreshInterval: 120000, // 2분마다 새로고침 (메시지 확인)
    url: `/api/v1/consultation-messages/client/${user.id}`,
    params: {
      page: 0,
      size: 10,
      sort: 'createdAt,desc'
    }
  });

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (상담사 메시지 데이터)
  const {
    data: consultantMessages,
    loading: messagesLoading,
    error: messagesError,
    hasData,
    isEmpty: messagesEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isClient(user),
    cache: true,
    retryCount: 3
  });

  // 메시지 타입별 정보 (statusVariant: common Badge variant=status 매핑)
  const getMessageTypeInfo = (type) => {
    const types = {
      GENERAL: {
        icon: MessageSquare,
        label: '일반',
        statusVariant: 'neutral',
        bgClass: 'message-type-general'
      },
      FOLLOW_UP: {
        icon: FileText,
        label: '후속 조치',
        statusVariant: 'info',
        bgClass: 'message-type-followup'
      },
      HOMEWORK: {
        icon: CheckCircle,
        label: '과제 안내',
        statusVariant: 'success',
        bgClass: 'message-type-homework'
      },
      REMINDER: {
        icon: Bell,
        label: '알림',
        statusVariant: 'warning',
        bgClass: 'message-type-reminder'
      },
      URGENT: {
        icon: AlertCircle,
        label: '긴급',
        statusVariant: 'danger',
        bgClass: 'message-type-urgent'
      },
      SYSTEM_NOTICE: {
        icon: Megaphone,
        label: '시스템 공지',
        statusVariant: 'info',
        bgClass: 'message-type-system'
      }
    };
    return types[type] || types.GENERAL;
  };

  // 시스템 공지와 상담사 메시지 통합
  const loadAllMessages = async() => {
    try {
      // 1. 상담사 메시지 처리
      let processedConsultantMessages = [];
      if (consultantMessages && Array.isArray(consultantMessages)) {
        processedConsultantMessages = consultantMessages
          .filter(msg => {
            // 미완료 상담 관련 메시지 제외
            const title = (msg.title || '').toLowerCase();
            const content = (msg.content || '').toLowerCase();
            const isIncompleteNotification = 
              title.includes('미완료') || 
              content.includes('미완료') ||
              title.includes('상담 미완료') ||
              content.includes('상담 미완료');
            return !isIncompleteNotification;
          })
          .map(msg => ({
            ...msg,
            messageSource: 'CONSULTANT',
            displayDate: msg.sentAt || msg.createdAt
          }));
      }

      // 2. 시스템 공지 로드
      let systemNotifications = [];
      try {
        const notificationsResponse = await apiGet('/api/v1/system-notifications/active');
        if (notificationsResponse?.success) {
          systemNotifications = (notificationsResponse.data || [])
            .filter(notice => {
              const targetRoles = notice.targetRoles || [];
              // 전체 공지만 표시 (내담자 전용 공지는 제외)
              return targetRoles.includes('ALL') && !targetRoles.includes('CLIENT');
            })
            .map(notice => ({
              id: `system-${notice.id}`,
              systemNotificationId: notice.id,
              title: notice.title,
              content: notice.content,
              messageType: 'SYSTEM_NOTICE',
              messageSource: 'SYSTEM',
              isRead: notice.isRead || false,
              displayDate: notice.publishedAt || notice.createdAt,
              isImportant: notice.isImportant,
              isUrgent: notice.isUrgent
            }));
        }
      } catch (error) {
        console.warn('시스템 공지 로드 실패:', error);
      }

      // 3. 두 목록 합치고 날짜순 정렬
      const combined = [...processedConsultantMessages, ...systemNotifications]
        .sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate))
        .slice(0, 10); // 최근 10개만

      setAllMessages(combined);
      
      // 읽지 않은 메시지 개수 계산
      const unread = combined.filter(msg => !msg.isRead).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('메시지 통합 로드 오류:', error);
    }
  };

  // 상담사 메시지 로드 완료 시 시스템 공지와 통합
  useEffect(() => {
    if (consultantMessages !== undefined && RoleUtils.isClient(user)) {
      loadAllMessages();
    }
  }, [consultantMessages, user]);

  // 내담자 전용 위젯 (다른 역할은 표시하지 않음)
  if (!RoleUtils.isClient(user)) {
    return null;
  }

  // 메시지 상세 보기
  const handleMessageClick = async(message) => {
    try {
      if (message.messageSource === 'SYSTEM') {
        // 시스템 공지 상세 조회
        const response = await apiGet(`/api/v1/system-notifications/${message.systemNotificationId}`);
        if (response?.success) {
          setSelectedMessage({
            ...response.data,
            messageType: 'SYSTEM_NOTICE',
            messageSource: 'SYSTEM'
          });
        } else {
          setSelectedMessage(message);
        }
      } else {
        // 일반 메시지 상세 조회
        const response = await apiGet(`/api/v1/consultation-messages/${message.id}`);
        if (response?.success) {
          setSelectedMessage({
            ...response.data,
            messageSource: 'CONSULTANT'
          });
        } else {
          setSelectedMessage(message);
        }
      }
    } catch (error) {
      console.error('메시지 상세 조회 오류:', error);
      setSelectedMessage(message);
    }
  };

  // 모달 닫기
  const closeModal = async() => {
    setSelectedMessage(null);
    await loadAllMessages();
    
    // 읽음 이벤트 발생
    if (selectedMessage?.messageSource === 'SYSTEM') {
      window.dispatchEvent(new Event('notification-read'));
    } else {
      window.dispatchEvent(new Event('message-read'));
    }
  };

  // 전체 메시지 보기
  const handleViewAllMessages = () => {
    navigate('/notifications');
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // 위젯 헤더 설정
  const headerConfig = {
    title: (
      <div className="client-message-header-title">
        <Mail size={24} />
        알림 및 메시지
        {unreadCount > 0 && (
          <Badge variant="count" count={unreadCount} maxCount={9} size="sm" className="client-message-header-title__count" />
        )}
      </div>
    ),
    actions: allMessages.length > 0 && (
      <MGButton
        className="client-message-view-all-btn"
        variant="outline"
        type="button"
        onClick={handleViewAllMessages}
      >
        전체보기
      </MGButton>
    )
  };

  // 위젯 콘텐츠
  const renderContent = () => {
    // 빈 상태 (메시지 없음)
    if (allMessages.length === 0) {
      return (
        <div className="client-message-empty">
          <div className="client-message-empty-icon">
            <Mail size={48} />
          </div>
          <p className="client-message-empty-text">받은 메시지가 없습니다.</p>
          <p className="client-message-empty-hint">
            공지사항과 상담사 메시지가 여기에 표시됩니다.
          </p>
        </div>
      );
    }

    return (
      <div className="client-message-list">
        {allMessages.map((message) => {
          const messageTypeInfo = getMessageTypeInfo(message.messageType);
          const MessageIcon = messageTypeInfo.icon;
          
          return (
            <div
              key={message.id}
              className={`client-message-item ${!message.isRead ? 'unread' : ''} ${message.messageSource === 'SYSTEM' ? 'system' : ''}`}
              onClick={() => handleMessageClick(message)}
            >
              <div className={`client-message-item-icon ${messageTypeInfo.bgClass}`}>
                <MessageIcon size={20} />
              </div>
              <div className="client-message-item-content">
                <div className="client-message-item-header">
                  <h4 className="client-message-item-title">
                    {message.isImportant && <Star size={14} className="important-star" />}
                    <SafeText>{message.title}</SafeText>
                  </h4>
                  {!message.isRead && (
                    <span className="client-message-item-unread-dot" />
                  )}
                </div>
                <div className="client-message-item-preview">
                  {toDisplayString(
                    typeof message.content === 'string'
                      ? `${message.content.slice(0, 60)}${message.content.length > 60 ? '...' : ''}`
                      : message.content,
                    ''
                  )}
                </div>
                <div className="client-message-item-footer">
                  <Badge variant="status" statusVariant={messageTypeInfo.statusVariant} label={messageTypeInfo.label} size="sm" />
                  {message.isImportant && (
                    <Badge variant="status" statusVariant="warning" label="중요" size="sm" />
                  )}
                  {message.isUrgent && (
                    <Badge variant="status" statusVariant="danger" label="긴급" size="sm" />
                  )}
                  <span className="client-message-item-date">
                    <Clock size={12} />
                    {formatDate(message.displayDate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 메시지 상세 모달 (UnifiedModal)
  const renderMessageModal = () => {
    if (!selectedMessage) return null;

    const typeInfo = getMessageTypeInfo(selectedMessage.messageType);
    const TypeIcon = typeInfo?.icon;
    const modalTitle = toDisplayString(selectedMessage.title, '메시지');

    return (
      <UnifiedModal
        isOpen
        onClose={closeModal}
        title={modalTitle}
        size="medium"
        variant="detail"
      >
        <div className="client-message-modal-body">
          <div className="client-message-detail-header">
            <div className="client-message-detail-type">
              {TypeIcon && (
                <div className={`client-message-detail-type-icon ${typeInfo.bgClass}`}>
                  <TypeIcon size={20} />
                </div>
              )}
              <Badge variant="status" statusVariant={typeInfo.statusVariant} label={typeInfo.label} size="sm" />
              {selectedMessage.isImportant && (
                <Badge variant="status" statusVariant="warning" label="중요" size="sm" />
              )}
              {selectedMessage.isUrgent && (
                <Badge variant="status" statusVariant="danger" label="긴급" size="sm" />
              )}
            </div>
            <span className="client-message-detail-date">
              <Clock size={14} />
              {new Date(selectedMessage.displayDate || selectedMessage.sentAt || selectedMessage.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>
          <div className="client-message-detail-content">
            <div dangerouslySetInnerHTML={{ __html: selectedMessage.content }} />
          </div>
        </div>
      </UnifiedModal>
    );
  };

  return (
    <>
      <BaseWidget
        widget={widget}
        user={user}
        loading={messagesLoading}
        error={messagesError}
        hasData={hasData}
        onRefresh={refresh}
        headerConfig={headerConfig}
        className="client-message-widget"
      >
        {renderContent()}
      </BaseWidget>
      
      {renderMessageModal()}
    </>
  );
};

export default ClientMessageWidget;
