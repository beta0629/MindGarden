import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Mail, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';

/**
 * 내담자 메시지 확인 섹션
 * 상담사가 보낸 메시지를 확인할 수 있는 컴포넌트
 */
const ClientMessageSection = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 메시지 타입별 정보
  const getMessageTypeInfo = (messageType) => {
    const typeMap = {
      'GENERAL': { icon: <Mail size={16} />, label: '일반', colorClass: 'secondary' },
      'FOLLOW_UP': { icon: <CheckCircle size={16} />, label: '후속 조치', colorClass: 'primary' },
      'HOMEWORK': { icon: <Clock size={16} />, label: '과제 안내', colorClass: 'success' },
      'APPOINTMENT': { icon: <Clock size={16} />, label: '약속 안내', colorClass: 'warning' },
      'EMERGENCY': { icon: <AlertCircle size={16} />, label: '긴급 안내', colorClass: 'danger' }
    };
    return typeMap[messageType] || typeMap['GENERAL'];
  };

  // 메시지 목록 로드
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/consultation-messages/client/${userId}`, {
        page: 0,
        size: 10,
        sort: 'createdAt,desc'
      });

      if (response.success) {
        setMessages(response.data || []);
        // 읽지 않은 메시지 개수 계산
        const unread = response.data?.filter(msg => !msg.isRead).length || 0;
        setUnreadCount(unread);
      } else {
        throw new Error(response.message || '메시지 로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
      notificationManager.show('메시지를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 상세 보기
  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
    
    // 읽지 않은 메시지인 경우 읽음 처리
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  // 메시지 읽음 처리
  const markAsRead = async (messageId) => {
    try {
      const response = await apiGet(`/api/consultation-messages/${messageId}/read`);
      if (response.success) {
        // 로컬 상태 업데이트
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('메시지 읽음 처리 오류:', error);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  // 컴포넌트 마운트 시 메시지 로드
  useEffect(() => {
    if (userId) {
      loadMessages();
    }
  }, [userId]);

  return (
    <div className="mg-card">
      <div className="mg-card-header">
        <div className="mg-flex mg-justify-between mg-align-center">
          <h3 className="mg-h4 mg-mb-0 mg-flex mg-align-center mg-gap-sm">
            <Mail size={20} />
            상담사 메시지
            {unreadCount > 0 && (
              <span className="mg-badge mg-badge-danger">{unreadCount}</span>
            )}
          </h3>
        </div>
      </div>

      <div className="mg-card-body">
        {loading ? (
          <div className="mg-loading-container">
            <div className="mg-spinner"></div>
            <p>메시지를 불러오는 중...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="mg-empty-state">
            <div className="mg-empty-state__icon">📭</div>
            <p className="mg-empty-state__text">받은 메시지가 없습니다.</p>
          </div>
        ) : (
          <div className="mg-space-y-sm">
            {messages.map((message) => {
              const typeInfo = getMessageTypeInfo(message.messageType);
              return (
                <div
                  key={message.id}
                  className={`mg-card mg-cursor-pointer ${!message.isRead ? 'message-item-unread' : ''}`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="mg-flex mg-align-start mg-gap-md">
                    <div className={`message-type-icon message-type-icon-${typeInfo.colorClass}`}>
                      {typeInfo.icon}
                    </div>
                    <div className="mg-flex-1">
                      <div className="mg-flex mg-align-center mg-gap-sm mg-mb-xs mg-flex-wrap">
                        <h5 className="mg-h5 mg-mb-0">{message.title}</h5>
                        {message.isImportant && (
                          <span className="mg-badge mg-badge-warning mg-text-xs">중요</span>
                        )}
                        {message.isUrgent && (
                          <span className="mg-badge mg-badge-danger mg-text-xs">긴급</span>
                        )}
                      </div>
                      <p className="mg-text-sm mg-color-text-secondary mg-mb-xs">
                        {message.content?.substring(0, 50)}
                        {message.content?.length > 50 && '...'}
                      </p>
                      <div className="mg-flex mg-align-center mg-gap-sm mg-text-xs mg-color-text-secondary mg-flex-wrap">
                        <span className={`mg-badge mg-badge-${typeInfo.colorClass}`}>{typeInfo.label}</span>
                        <span>{formatDate(message.sentAt || message.createdAt)}</span>
                      </div>
                    </div>
                    {!message.isRead && (
                      <div className="message-item-unread-dot"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 메시지 상세 모달 */}
      {isDetailModalOpen && selectedMessage && ReactDOM.createPortal(
        <div className="mg-modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="mg-modal mg-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="mg-modal-header">
              <h4 className="mg-h4 mg-mb-0">{selectedMessage.title}</h4>
              <button 
                className="mg-modal-close"
                onClick={() => setIsDetailModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="mg-modal-body">
              <div className="mg-flex mg-align-center mg-gap-md mg-mb-md mg-pb-md mg-border-bottom mg-flex-wrap">
                <span className={`mg-badge mg-badge-${getMessageTypeInfo(selectedMessage.messageType).colorClass} mg-flex mg-align-center mg-gap-xs`}>
                  {getMessageTypeInfo(selectedMessage.messageType).icon}
                  {getMessageTypeInfo(selectedMessage.messageType).label}
                </span>
                <span className="mg-text-sm mg-color-text-secondary">
                  {new Date(selectedMessage.sentAt || selectedMessage.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
              <div className="message-content-full">
                {selectedMessage.content}
              </div>
            </div>
            <div className="mg-modal-footer">
              <button 
                className="mg-button mg-button-secondary"
                onClick={() => setIsDetailModalOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ClientMessageSection;
