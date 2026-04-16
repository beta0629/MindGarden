import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  FileText,
  CheckCircle,
  Bell,
  AlertCircle,
  Megaphone
} from 'lucide-react';

import { apiGet } from '../../utils/ajax';
import { normalizeApiListPayload, normalizeApiObjectPayload } from '../../utils/apiResponseNormalize';
import notificationManager from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';
import { toDisplayString } from '../../utils/safeDisplay';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import '../../styles/unified-design-tokens.css';
import './ClientMessageSection.css';
/**
 * 내담자 메시지 확인 섹션
/**
 * - 상담사가 보낸 메시지
/**
 * - 시스템 공지 (전체 공지 + 내담자 대상 공지)
/**
 * 디자인 시스템 적용 버전
 */
const MESSAGE_TYPE_LUCIDE = {
  GENERAL: MessageSquare,
  FOLLOW_UP: FileText,
  HOMEWORK: CheckCircle,
  REMINDER: Bell,
  URGENT: AlertCircle,
  SYSTEM_NOTICE: Megaphone
};

const EMPTY_MESSAGE_ICON_SIZE = 40;
const LIST_MESSAGE_ICON_SIZE = 22;

const ClientMessageSection = ({ userId }) => {
  const navigate = useNavigate();
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // 메시지 타입별 정보 (일반 메시지)
  const getMessageTypeInfo = (type) => {
    const types = {
      GENERAL: { 
        iconName: 'MESSAGE_SQUARE',
        label: '일반', 
        colorClass: 'secondary',
        bgClass: 'message-type-general'
      },
      FOLLOW_UP: { 
        iconName: 'FILE_TEXT',
        label: '후속 조치', 
        colorClass: 'primary',
        bgClass: 'message-type-followup'
      },
      HOMEWORK: { 
        iconName: 'CHECK_CIRCLE',
        label: '과제 안내', 
        colorClass: 'success',
        bgClass: 'message-type-homework'
      },
      REMINDER: { 
        iconName: 'BELL',
        label: '알림', 
        colorClass: 'warning',
        bgClass: 'message-type-reminder'
      },
      URGENT: { 
        iconName: 'ALERT_CIRCLE',
        label: '긴급', 
        colorClass: 'danger',
        bgClass: 'message-type-urgent'
      },
      SYSTEM_NOTICE: {
        iconName: 'MEGAPHONE',
        label: '시스템 공지',
        colorClass: 'info',
        bgClass: 'message-type-system'
      }
    };
    return types[type] || types.GENERAL;
  };

  // 메시지 목록 로드 (일반 메시지 + 시스템 공지)
  const loadMessages = async() => {
    try {
      setLoading(true);
      
      // 1. 상담사 메시지 로드
      const messagesResponse = await apiGet(`/api/v1/consultation-messages/client/${userId}`, {
        page: 0,
        size: 10,
        sort: 'createdAt,desc'
      });

      const messagesList = normalizeApiListPayload(messagesResponse);
      let consultantMessages = [];
      if (Array.isArray(messagesList)) {
        // 미완료 상담 관련 메시지 제외
        consultantMessages = messagesList.filter(msg => {
          const title = (msg.title || '').toLowerCase();
          const content = (msg.content || '').toLowerCase();
          const isIncompleteNotification = 
            title.includes('미완료') || 
            content.includes('미완료') ||
            title.includes('상담 미완료') ||
            content.includes('상담 미완료');
          
          return !isIncompleteNotification;
        }).map(msg => ({
          ...msg,
          messageSource: 'CONSULTANT',
          displayDate: msg.sentAt || msg.createdAt
        }));
      }

      // 2. 시스템 공지 로드 (전체 공지만 표시 - 중복 제거)
      const notificationsResponse = await apiGet('/api/v1/system-notifications/active');
      
      let systemNotifications = [];
      const noticeList = normalizeApiListPayload(notificationsResponse);
      if (Array.isArray(noticeList)) {
        // 전체 공지만 필터링하여 중복 제거
        systemNotifications = noticeList
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

      // 3. 두 목록 합치고 날짜순 정렬
      const combined = [...consultantMessages, ...systemNotifications]
        .sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate))
        .slice(0, 10); // 최근 10개만

      setAllMessages(combined);
      
      // 읽지 않은 메시지 개수 계산
      const unread = combined.filter(msg => !msg.isRead).length;
      setUnreadCount(unread);

    } catch (error) {
      // 403 Forbidden은 권한 문제이므로 조용히 처리 (콘솔 오류 표시 안 함)
      if (error.status === 403 || error.message?.includes('접근 권한')) {
        // 권한 없음은 정상적인 상황일 수 있으므로 조용히 처리
        setAllMessages([]);
        setUnreadCount(0);
      } else {
        // 다른 오류만 콘솔에 표시
        console.error('메시지 로드 오류:', error);
        notificationManager.show('메시지를 불러오는 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // 메시지 상세 보기
  const handleMessageClick = async(message) => {
    try {
      if (message.messageSource === 'SYSTEM') {
        // 시스템 공지 상세 조회
        const response = await apiGet(`/api/v1/system-notifications/${message.systemNotificationId}`);
        const detail = normalizeApiObjectPayload(response) ?? (
          response && typeof response === 'object' && !Array.isArray(response) ? response : null
        );
        if (detail) {
          setSelectedMessage({
            ...detail,
            messageType: 'SYSTEM_NOTICE',
            messageSource: 'SYSTEM'
          });
        } else {
          setSelectedMessage(message);
        }
      } else {
        // 일반 메시지 상세 조회
        const response = await apiGet(`/api/v1/consultation-messages/${message.id}`);
        const detail = normalizeApiObjectPayload(response) ?? (
          response && typeof response === 'object' && !Array.isArray(response) ? response : null
        );
        if (detail) {
          setSelectedMessage({
            ...detail,
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
    await loadMessages();
    
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

  // 컴포넌트 마운트 시 메시지 로드
  useEffect(() => {
    if (userId) {
      loadMessages();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="client-message-section">
        <div className="mg-loading">로딩중...</div>
      </div>
    );
  }

  const typeInfo = selectedMessage ? getMessageTypeInfo(selectedMessage.messageType) : null;

  return (
    <div className="client-message-section">
      {/* 섹션 헤더 */}
      <div className="client-message-header">
        <div className="client-message-header-left">
          <h2 className="client-message-title">
            
            알림 및 메시지
          </h2>
          {unreadCount > 0 && (
            <span className="mg-badge mg-badge-danger client-message-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {allMessages.length > 0 && (
          <MGButton
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleViewAllMessages}
          >
            전체보기
          </MGButton>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="client-message-list">
        {allMessages.length === 0 ? (
          <div className="client-message-empty">
            <div className="client-message-empty__icon" aria-hidden>
              <MessageSquare size={EMPTY_MESSAGE_ICON_SIZE} />
            </div>
            <p className="client-message-empty__text">받은 메시지가 없습니다.</p>
            <p className="client-message-empty__hint">공지사항과 상담사 메시지가 여기에 표시됩니다.</p>
          </div>
        ) : (
          allMessages.map((message) => {
            const messageTypeInfo = getMessageTypeInfo(message.messageType);
            const MessageTypeIcon =
              MESSAGE_TYPE_LUCIDE[message.messageType] || MESSAGE_TYPE_LUCIDE.GENERAL;

            return (
              <div
                key={message.id}
                className={`client-message-item ${!message.isRead ? 'client-message-item--unread' : ''} ${message.messageSource === 'SYSTEM' ? 'client-message-item--system' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className={`client-message-item__icon ${messageTypeInfo.bgClass}`} aria-hidden>
                  <MessageTypeIcon size={LIST_MESSAGE_ICON_SIZE} />
                </div>
                <div className="client-message-item__content">
                  <div className="client-message-item__header">
                    <h4 className="client-message-item__title">
                      {message.isImportant && <span className="mg-text-warning mg-text-sm">[중요] </span>}
                      {message.title}
                    </h4>
                    {!message.isRead && (
                      <span className="client-message-item__unread-dot" />
                    )}
                  </div>
                  <div className="client-message-item__preview">
                    <div 
                      dangerouslySetInnerHTML={{
                        __html: message.content?.substring(0, 60) + (message.content?.length > 60 ? '...' : '')
                      }}
                    />
                  </div>
                  <div className="client-message-item__footer">
                    <span className={`mg-badge mg-badge-${messageTypeInfo.colorClass} mg-badge-sm`}>
                      {messageTypeInfo.label}
                    </span>
                    {message.isImportant && (
                      <span className="mg-badge mg-badge-warning mg-badge-sm">중요</span>
                    )}
                    {message.isUrgent && (
                      <span className="mg-badge mg-badge-danger mg-badge-sm">긴급</span>
                    )}
                    <span className="client-message-item__date">
                      
                      {new Date(message.displayDate).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 메시지 상세 모달 */}
      <UnifiedModal
        isOpen={!!selectedMessage}
        onClose={closeModal}
        title={selectedMessage ? toDisplayString(selectedMessage.title, '메시지') : ''}
        size="medium"
        variant="detail"
        backdropClick
        showCloseButton
      >
        {selectedMessage && typeInfo && (
          <div className="client-message-detail">
            <div className="client-message-detail__header">
              <div className="client-message-detail__type">
                {typeInfo.iconName && (
                  <div className={`client-message-detail__type-icon ${typeInfo.bgClass}`} />
                )}
                <span className={`mg-badge mg-badge-${typeInfo.colorClass}`}>
                  {typeInfo.label}
                </span>
                {selectedMessage.isImportant && (
                  <span className="mg-badge mg-badge-warning">중요</span>
                )}
                {selectedMessage.isUrgent && (
                  <span className="mg-badge mg-badge-danger">긴급</span>
                )}
              </div>
              <span className="client-message-detail__date">
                
                {new Date(selectedMessage.displayDate || selectedMessage.sentAt || selectedMessage.createdAt).toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="client-message-detail__content">
              <div
                dangerouslySetInnerHTML={{
                  __html: selectedMessage.content
                }}
              />
            </div>
          </div>
        )}
      </UnifiedModal>
    </div>
  );
};

export default ClientMessageSection;
