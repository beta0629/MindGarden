import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPut, apiPost } from '../../utils/ajax';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import './ClientMessageScreen.css';

/**
 * 내담자 메시지 확인 화면
 * 상담사로부터 받은 메시지를 확인하고 답장할 수 있는 화면
 */
const ClientMessageScreen = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  // 데이터 로드
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      const response = await apiGet(`/api/consultation-messages/client/${user.id}`);
      if (response.success) {
        setMessages(response.data);
      } else {
        throw new Error(response.message || '메시지 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
      notificationManager.show('메시지를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    
    // 읽지 않은 메시지인 경우 읽음 처리
    if (!message.isRead) {
      try {
        await apiPut(`/api/consultation-messages/${message.id}/read`);
        // 로컬 상태 업데이트
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
        ));
      } catch (error) {
        console.error('읽음 처리 오류:', error);
      }
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      notificationManager.show('답장 내용을 입력해주세요.', 'warning');
      return;
    }

    try {
      setReplying(true);
      
      const replyData = {
        title: `Re: ${selectedMessage.title}`,
        content: replyContent,
        messageType: 'GENERAL',
        isImportant: false,
        isUrgent: false
      };

      const response = await apiPost(`/api/consultation-messages/${selectedMessage.id}/reply`, replyData);
      
      if (response.success) {
        notificationManager.show('답장이 전송되었습니다.', 'success');
        setReplyContent('');
        setSelectedMessage(null);
        loadMessages(); // 메시지 목록 새로고침
      } else {
        throw new Error(response.message || '답장 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('답장 전송 오류:', error);
      notificationManager.show('답장 전송 중 오류가 발생했습니다.', 'error');
    } finally {
      setReplying(false);
    }
  };

  const getMessageTypeIcon = (messageType) => {
    const icons = {
      'GENERAL': '💬',
      'FOLLOW_UP': '📋',
      'HOMEWORK': '📝',
      'REMINDER': '🔔',
      'URGENT': '⚠️'
    };
    return icons[messageType] || '💬';
  };

  const getMessageTypeLabel = (messageType) => {
    const labels = {
      'GENERAL': '일반',
      'FOLLOW_UP': '후속 조치',
      'HOMEWORK': '과제 안내',
      'REMINDER': '알림',
      'URGENT': '긴급'
    };
    return labels[messageType] || '일반';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = messages.filter(m => !m.isRead).length;
  const importantCount = messages.filter(m => m.isImportant).length;
  const urgentCount = messages.filter(m => m.isUrgent).length;

  if (loading) {
    return (
      <SimpleLayout title="상담사 메시지">
        <div className="client-message-screen-loading">
          <UnifiedLoading variant="pulse" size="large" text="메시지를 불러오는 중..." />
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="상담사 메시지">
      <div className="client-message-screen-container">
      {/* 헤더 */}
      <div className="client-message-screen-header">
        <h1 className="client-message-screen-header-title">
          💬 상담사 메시지
        </h1>
        <p className="client-message-screen-header-subtitle">
          상담사로부터 받은 메시지를 확인하고 답장할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="client-message-screen-stats-card">
        <div className="client-message-screen-stats-grid">
          <div className="client-message-screen-stat-item">
            <div className="client-message-screen-stat-value">{messages.length}</div>
            <div className="client-message-screen-stat-label">전체 메시지</div>
          </div>
          <div className="client-message-screen-stat-item">
            <div className="client-message-screen-stat-value" style={{color: '#dc3545'}}>{unreadCount}</div>
            <div className="client-message-screen-stat-label">읽지 않음</div>
          </div>
          <div className="client-message-screen-stat-item">
            <div className="client-message-screen-stat-value" style={{color: '#ffc107'}}>{importantCount}</div>
            <div className="client-message-screen-stat-label">중요 메시지</div>
          </div>
          <div className="client-message-screen-stat-item">
            <div className="client-message-screen-stat-value" style={{color: '#dc3545'}}>{urgentCount}</div>
            <div className="client-message-screen-stat-label">긴급 메시지</div>
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="client-message-screen-messages-card">
        <h2 className="client-message-screen-messages-title">
          📨 메시지 목록
        </h2>
        
        {messages.length === 0 ? (
          <div className="client-message-screen-empty-state">
            <div className="client-message-screen-empty-icon">📭</div>
            <div className="client-message-screen-empty-title">받은 메시지가 없습니다</div>
            <div className="client-message-screen-empty-message">상담사로부터 메시지를 받으면 여기에 표시됩니다.</div>
          </div>
        ) : (
          <div className="client-message-screen-message-list">
            {messages.map(message => (
              <div
                key={message.id}
                className={`client-message-screen-message-item ${message.isUrgent ? 'client-message-screen-message-item-urgent' : ''} ${message.isImportant && !message.isUrgent ? 'client-message-screen-message-item-important' : ''} ${!message.isRead ? 'client-message-screen-message-item-unread' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="client-message-screen-message-header">
                  <div>
                    <div className="client-message-screen-message-title">
                      {getMessageTypeIcon(message.messageType)} {message.title}
                    </div>
                    <div className="client-message-screen-message-meta">
                      {getMessageTypeLabel(message.messageType)} • {formatDate(message.sentAt)}
                    </div>
                  </div>
                  <div className="client-message-screen-message-badges">
                    {!message.isRead && <span className="client-message-screen-badge client-message-screen-badge-unread">읽지 않음</span>}
                    {message.isImportant && <span className="client-message-screen-badge client-message-screen-badge-important">중요</span>}
                    {message.isUrgent && <span className="client-message-screen-badge client-message-screen-badge-urgent">긴급</span>}
                    {message.isRead && <span className="client-message-screen-badge client-message-screen-badge-read">읽음</span>}
                  </div>
                </div>
                <div className="client-message-screen-message-content">
                  {message.content.length > 100 
                    ? `${message.content.substring(0, 100)}...` 
                    : message.content}
                </div>
                <div className="client-message-screen-message-footer">
                  <span>상담사</span>
                  <span>{message.isRead ? `읽음 ${formatDate(message.readAt)}` : '읽지 않음'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 메시지 상세 모달 */}
      {selectedMessage && (
        <div className="client-message-screen-message-detail-modal" onClick={(e) => e.target === e.currentTarget && setSelectedMessage(null)}>
          <div className="client-message-screen-message-detail-card">
            <button 
              className="client-message-screen-close-button"
              onClick={() => setSelectedMessage(null)}
            >
              ×
            </button>
            
            <div className="client-message-screen-message-detail-header">
              <div>
                <div className="client-message-screen-message-detail-title">
                  {getMessageTypeIcon(selectedMessage.messageType)} {selectedMessage.title}
                </div>
                <div className="client-message-screen-message-detail-meta">
                  {getMessageTypeLabel(selectedMessage.messageType)} • {formatDate(selectedMessage.sentAt)}
                  {selectedMessage.isImportant && ' • ⭐ 중요'}
                  {selectedMessage.isUrgent && ' • ⚠️ 긴급'}
                </div>
              </div>
            </div>
            
            <div className="client-message-screen-message-detail-content">
              {selectedMessage.content}
            </div>
            
            <div className="client-message-screen-reply-section">
              <div className="client-message-screen-reply-title">답장하기</div>
              <textarea
                className="client-message-screen-reply-textarea"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답장 내용을 입력하세요..."
              />
              <div className="client-message-screen-button-group">
                <button
                  className="client-message-screen-secondary-button"
                  onClick={() => setSelectedMessage(null)}
                >
                  닫기
                </button>
                <button
                  className="client-message-screen-primary-button"
                  onClick={handleReply}
                  disabled={replying || !replyContent.trim()}
                >
                  {replying ? <UnifiedLoading variant="dots" size="small" /> : '📤 답장 전송'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </SimpleLayout>
  );
};

export default ClientMessageScreen;
