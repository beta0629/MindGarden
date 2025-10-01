import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';
import LoadingSpinner from '../common/LoadingSpinner';
import notificationManager from '../../utils/notification';
import './ClientMessageSection.css';

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

  // 메시지 타입별 아이콘과 색상
  const getMessageTypeInfo = (messageType) => {
    const typeMap = {
      'GENERAL': { icon: '💬', label: '일반', color: '#6c757d' },
      'FOLLOW_UP': { icon: '📋', label: '후속 조치', color: '#007bff' },
      'HOMEWORK': { icon: '📝', label: '과제 안내', color: '#28a745' },
      'APPOINTMENT': { icon: '📅', label: '약속 안내', color: '#ffc107' },
      'EMERGENCY': { icon: '⚠️', label: '긴급 안내', color: '#dc3545' }
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

  if (loading) {
    return (
      <div className="client-message-section">
        <div className="message-header">
          <h3>📨 상담사 메시지</h3>
        </div>
        <div className="message-loading">
          <LoadingSpinner variant="dots" size="small" text="메시지를 불러오는 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className="client-message-section">
      <div className="message-header">
        <h3>📨 상담사 메시지</h3>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="no-messages">
          <div className="no-messages-icon">📭</div>
          <p>받은 메시지가 없습니다.</p>
        </div>
      ) : (
        <div className="message-list">
          {messages.map((message) => {
            const typeInfo = getMessageTypeInfo(message.messageType);
            return (
              <div
                key={message.id}
                className={`message-item ${!message.isRead ? 'unread' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="message-type-icon" data-message-color={typeInfo.color}>
                  {typeInfo.icon}
                </div>
                <div className="message-content">
                  <div className="message-title">
                    {message.title}
                    {message.isImportant && <span className="important-badge">중요</span>}
                    {message.isUrgent && <span className="urgent-badge">긴급</span>}
                  </div>
                  <div className="message-preview">
                    {message.content?.substring(0, 50)}
                    {message.content?.length > 50 && '...'}
                  </div>
                  <div className="message-meta">
                    <span className="message-type">{typeInfo.label}</span>
                    <span className="message-date">{formatDate(message.sentAt || message.createdAt)}</span>
                  </div>
                </div>
                {!message.isRead && <div className="unread-dot"></div>}
              </div>
            );
          })}
        </div>
      )}

      {/* 메시지 상세 모달 */}
      {isDetailModalOpen && selectedMessage && (
        <div className="message-detail-modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="message-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{selectedMessage.title}</h4>
              <button 
                className="close-btn"
                onClick={() => setIsDetailModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="message-meta-info">
                <span 
                  className="message-type-badge" 
                  data-badge-bg={getMessageTypeInfo(selectedMessage.messageType).color}
                >
                  {getMessageTypeInfo(selectedMessage.messageType).icon} {getMessageTypeInfo(selectedMessage.messageType).label}
                </span>
                <span className="message-date">
                  {new Date(selectedMessage.sentAt || selectedMessage.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
              <div className="message-content-full">
                {selectedMessage.content}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="close-button"
                onClick={() => setIsDetailModalOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientMessageSection;
