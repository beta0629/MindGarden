import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPut, apiPost } from '../../utils/ajax';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { CLIENT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import './ClientMessageScreen.css';

/**
 * 내담자 메시지 확인 화면
 * 상담사로부터 받은 메시지를 확인하고 답장할 수 있는 화면
 */
const ClientMessageScreen = () => {
  const navigate = useNavigate();
  const { user, isLoading: sessionLoading, isLoggedIn } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  // 데이터 로드
  useEffect(() => {
    // 세션이 로딩 중이면 대기
    if (sessionLoading) {
      return;
    }
    
    // 로그인되어 있고 사용자 정보가 있으면 메시지 로드
    if (isLoggedIn && user && user.id) {
      loadMessages();
    } else if (!isLoggedIn) {
      // 로그인되지 않았으면 로그인 페이지로 리다이렉트
      navigate('/login');
    } else {
      // 로그인되어 있지만 사용자 정보가 없으면 로딩 종료
      console.warn('⚠️ 로그인되어 있지만 사용자 정보가 없습니다.');
      setLoading(false);
    }
  }, [user, sessionLoading, isLoggedIn, navigate]);

  const loadMessages = async () => {
    if (!user || !user.id) {
      console.warn('사용자 정보가 없어 메시지를 로드할 수 없습니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // ClientMessageSection과 동일한 방식으로 API 호출
      const response = await apiGet(`/api/v1/consultation-messages/client/${user.id}`, {
        page: 0,
        size: 100,
        sort: 'createdAt,desc'
      });
      
      console.log('📨 메시지 API 응답:', response);
      
      if (response && response.success) {
        // 백엔드 응답 형식: { success: true, data: { messages: [...], totalElements: ... } }
        // ClientMessageSection과 동일하게 처리: response.data는 객체이고, messages 배열을 포함
        let messageData = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            // data가 직접 배열인 경우 (레거시)
            messageData = response.data;
          } else if (response.data.messages && Array.isArray(response.data.messages)) {
            // data.messages가 배열인 경우 (표준)
            messageData = response.data.messages;
          }
        }
        setMessages(messageData);
        console.log('✅ 메시지 로드 성공:', messageData.length, '개');
      } else if (response === null || response === undefined) {
        // 403 등으로 null이 반환된 경우 (권한 문제)
        console.warn('⚠️ 메시지 API 응답이 null입니다. 권한이 없을 수 있습니다.');
        setMessages([]);
      } else {
        // success가 false인 경우
        console.warn('⚠️ 메시지 API 응답 실패:', response);
        setMessages([]);
        // 에러 메시지는 표시하지 않음 (권한 문제일 수 있음)
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
      // 403 오류는 조용히 처리 (권한 문제)
      if (error.status !== 403 && error.message?.includes('접근 권한') === false) {
        notificationManager.show('메시지를 불러오는 중 오류가 발생했습니다.', 'error');
      }
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    
    // 읽지 않은 메시지인 경우 읽음 처리
    if (!message.isRead) {
      try {
        await apiPut(`/api/v1/consultation-messages/${message.id}/read`);
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

      const response = await apiPost(`/api/v1/consultation-messages/${selectedMessage.id}/reply`, replyData);
      
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
      <AdminCommonLayout menuItems={CLIENT_MENU_ITEMS} title="메시지" loading={true} loadingText="로딩중...">
        <div />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout menuItems={CLIENT_MENU_ITEMS} title="메시지">
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
            <div className="client-message-screen-stat-value client-message-screen-stat-value-danger">{unreadCount}</div>
            <div className="client-message-screen-stat-label">읽지 않음</div>
          </div>
          <div className="client-message-screen-stat-item">
            <div className="client-message-screen-stat-value client-message-screen-stat-value-warning">{importantCount}</div>
            <div className="client-message-screen-stat-label">중요 메시지</div>
          </div>
          <div className="client-message-screen-stat-item">
            <div className="client-message-screen-stat-value client-message-screen-stat-value-danger">{urgentCount}</div>
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
                  {(message.content || '').length > 100
                    ? `${(message.content || '').substring(0, 100)}...`
                    : (message.content || '')}
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
              {selectedMessage.content ?? ''}
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
                  {replying ? <div className="mg-loading">로딩중...</div> : '📤 답장 전송'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminCommonLayout>
  );
};

export default ClientMessageScreen;
