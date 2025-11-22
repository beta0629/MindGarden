/**
 * Message Widget
 * 메시지 목록을 표시하는 범용 위젯
 * ClientMessageSection을 기반으로 범용화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
import UnifiedLoading from '../../common/UnifiedLoading';
import UnifiedModal from '../../common/modals/UnifiedModal';
import './Widget.css';

const MessageWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const maxItems = config.maxItems || 10;
  const messageTypes = config.messageTypes || {};
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadMessages();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadMessages, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.messages && Array.isArray(config.messages)) {
      setMessages(config.messages);
      setUnreadCount(config.messages.filter(m => !m.isRead).length);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // 실제 API 엔드포인트: /api/consultation-messages/client/{userId}
      const url = dataSource.url || `/api/consultation-messages/client/${user?.id}`;
      const params = { 
        ...dataSource.params, 
        page: 0,
        size: maxItems,
        sort: 'createdAt,desc'
      };
      
      const response = await apiGet(url, params);
      
      if (response && response.success) {
        // ConsultationMessageController 응답 형식: { messages: [...], totalElements: ... }
        const messageList = response.data?.messages || response.messages || [];
        setMessages(Array.isArray(messageList) ? messageList.slice(0, maxItems) : []);
        setUnreadCount(messageList.filter(m => !m.isRead).length);
      } else if (response) {
        // 다른 응답 형식 지원
        const messageList = response.data || response || [];
        setMessages(Array.isArray(messageList) ? messageList.slice(0, maxItems) : []);
        setUnreadCount(messageList.filter(m => !m.isRead).length);
      } else {
        setMessages([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('MessageWidget 데이터 로드 실패:', err);
      setMessages([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  const getMessageTypeInfo = (type) => {
    return messageTypes[type] || messageTypes.DEFAULT || {
      icon: 'bi-envelope',
      label: '메시지',
      colorClass: 'secondary'
    };
  };
  
  const handleMessageClick = (message) => {
    setSelectedMessage(message);
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/messages');
    }
  };
  
  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };
  
  if (loading && messages.length === 0) {
    return (
      <div className="widget widget-message">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  const displayMessages = messages.slice(0, maxItems);
  
  return (
    <div className="widget widget-message">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-envelope"></i>
          {config.title || '메시지'}
          {unreadCount > 0 && (
            <span className="widget-badge">{unreadCount}</span>
          )}
        </div>
        {config.viewAllUrl && (
          <button className="widget-view-all" onClick={handleViewAll}>
            전체보기 →
          </button>
        )}
      </div>
      <div className="widget-body">
        {displayMessages.length > 0 ? (
          <div className="message-list">
            {displayMessages.map((message, index) => {
              const typeInfo = getMessageTypeInfo(message.type);
              return (
                <div
                  key={message.id || index}
                  className={`message-item ${!message.isRead ? 'unread' : ''}`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="message-icon">
                    <i className={`bi ${typeInfo.icon}`}></i>
                  </div>
                  <div className="message-content">
                    <div className="message-title">{message.title || message.subject}</div>
                    <div className="message-preview">{message.content || message.body}</div>
                    <div className="message-meta">
                      <span className="message-time">{formatTime(message.createdAt || message.sentAt)}</span>
                      {message.sender && (
                        <span className="message-sender">{message.sender}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="widget-empty">
            <i className="bi bi-inbox"></i>
            <p>{config.emptyMessage || '메시지가 없습니다'}</p>
          </div>
        )}
      </div>
      
      {selectedMessage && (
        <UnifiedModal
          isOpen={!!selectedMessage}
          onClose={() => setSelectedMessage(null)}
          title={selectedMessage.title || selectedMessage.subject}
        >
          <div className="message-detail">
            <div className="message-detail-content">
              {selectedMessage.content || selectedMessage.body}
            </div>
            <div className="message-detail-meta">
              {selectedMessage.sender && (
                <div>보낸 사람: {selectedMessage.sender}</div>
              )}
              {selectedMessage.createdAt && (
                <div>받은 시간: {new Date(selectedMessage.createdAt).toLocaleString('ko-KR')}</div>
              )}
            </div>
          </div>
        </UnifiedModal>
      )}
    </div>
  );
};

export default MessageWidget;

