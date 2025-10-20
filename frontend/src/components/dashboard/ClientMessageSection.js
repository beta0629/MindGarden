import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Mail } from 'lucide-react';
import { apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import MessageCard from '../common/MessageCard';

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
            {messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onClick={handleMessageClick}
              />
            ))}
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
