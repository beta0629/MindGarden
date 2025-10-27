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
  
  // DEPRECATED: styles 객체 - CSS 파일로 대체됨
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    },
    header: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    },
    headerTitle: {
      fontSize: 'var(--font-size-xxl)',
      fontWeight: '700',
      color: '#2c3e50',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    headerSubtitle: {
      fontSize: 'var(--font-size-base)',
      color: '#6c757d',
      marginBottom: '20px'
    },
    statsCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px'
    },
    statItem: {
      textAlign: 'center',
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    },
    statValue: {
      fontSize: 'var(--font-size-xxl)',
      fontWeight: '700',
      color: '#007bff',
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: 'var(--font-size-sm)',
      color: '#6c757d',
      fontWeight: '500'
    },
    messagesCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    },
    messagesTitle: {
      fontSize: 'var(--font-size-xl)',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    messageList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    messageItem: {
      padding: '16px',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: '#fff'
    },
    messageItemUnread: {
      backgroundColor: '#f8f9ff',
      borderColor: '#007bff'
    },
    messageItemImportant: {
      backgroundColor: '#fff3cd',
      borderColor: '#ffc107'
    },
    messageItemUrgent: {
      backgroundColor: '#f8d7da',
      borderColor: '#dc3545'
    },
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px'
    },
    messageTitle: {
      fontSize: 'var(--font-size-base)',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '4px'
    },
    messageMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: 'var(--font-size-xs)',
      color: '#6c757d'
    },
    messageContent: {
      fontSize: 'var(--font-size-sm)',
      color: '#495057',
      lineHeight: '1.5',
      marginBottom: '8px'
    },
    messageFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 'var(--font-size-xs)',
      color: '#6c757d'
    },
    messageBadges: {
      display: 'flex',
      gap: '4px'
    },
    badge: {
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: 'var(--font-size-xs)',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    badgeUnread: {
      backgroundColor: '#007bff',
      color: '#fff'
    },
    badgeImportant: {
      backgroundColor: '#ffc107',
      color: '#000'
    },
    badgeUrgent: {
      backgroundColor: '#dc3545',
      color: '#fff'
    },
    badgeRead: {
      backgroundColor: '#28a745',
      color: '#fff'
    },
    messageDetailModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    },
    messageDetailCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    },
    messageDetailHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e9ecef'
    },
    messageDetailTitle: {
      fontSize: 'var(--font-size-xl)',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '8px'
    },
    messageDetailMeta: {
      fontSize: 'var(--font-size-sm)',
      color: '#6c757d',
      marginBottom: '16px'
    },
    messageDetailContent: {
      fontSize: 'var(--font-size-base)',
      color: '#495057',
      lineHeight: '1.6',
      marginBottom: '20px',
      whiteSpace: 'pre-wrap'
    },
    replySection: {
      borderTop: '1px solid #e9ecef',
      paddingTop: '20px'
    },
    replyTitle: {
      fontSize: 'var(--font-size-base)',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '12px'
    },
    replyTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit',
      marginBottom: '12px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
    },
    button: {
      padding: '10px 20px',
      borderRadius: '6px',
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    primaryButton: {
      backgroundColor: '#007bff',
      color: '#fff'
    },
    secondaryButton: {
      backgroundColor: '#6c757d',
      color: '#fff'
    },
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'none',
      border: 'none',
      fontSize: 'var(--font-size-xxl)',
      cursor: 'pointer',
      color: '#6c757d'
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#6c757d'
    },
    emptyIcon: {
      fontSize: 'var(--font-size-xxxl)',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: 'var(--font-size-lg)',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#495057'
    },
    emptyMessage: {
      fontSize: 'var(--font-size-sm)'
    }
  };

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
      <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          💬 상담사 메시지
        </h1>
        <p style={styles.headerSubtitle}>
          상담사로부터 받은 메시지를 확인하고 답장할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={styles.statsCard}>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{messages.length}</div>
            <div style={styles.statLabel}>전체 메시지</div>
          </div>
          <div style={styles.statItem}>
            <div style={{...styles.statValue, color: '#dc3545'}}>{unreadCount}</div>
            <div style={styles.statLabel}>읽지 않음</div>
          </div>
          <div style={styles.statItem}>
            <div style={{...styles.statValue, color: '#ffc107'}}>{importantCount}</div>
            <div style={styles.statLabel}>중요 메시지</div>
          </div>
          <div style={styles.statItem}>
            <div style={{...styles.statValue, color: '#dc3545'}}>{urgentCount}</div>
            <div style={styles.statLabel}>긴급 메시지</div>
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div style={styles.messagesCard}>
        <h2 style={styles.messagesTitle}>
          📨 메시지 목록
        </h2>
        
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyTitle}>받은 메시지가 없습니다</div>
            <div style={styles.emptyMessage}>상담사로부터 메시지를 받으면 여기에 표시됩니다.</div>
          </div>
        ) : (
          <div style={styles.messageList}>
            {messages.map(message => (
              <div
                key={message.id}
                style={{
                  ...styles.messageItem,
                  ...(message.isUrgent ? styles.messageItemUrgent : {}),
                  ...(message.isImportant && !message.isUrgent ? styles.messageItemImportant : {}),
                  ...(!message.isRead ? styles.messageItemUnread : {})
                }}
                onClick={() => handleMessageClick(message)}
              >
                <div style={styles.messageHeader}>
                  <div>
                    <div style={styles.messageTitle}>
                      {getMessageTypeIcon(message.messageType)} {message.title}
                    </div>
                    <div style={styles.messageMeta}>
                      {getMessageTypeLabel(message.messageType)} • {formatDate(message.sentAt)}
                    </div>
                  </div>
                  <div style={styles.messageBadges}>
                    {!message.isRead && <span style={{...styles.badge, ...styles.badgeUnread}}>읽지 않음</span>}
                    {message.isImportant && <span style={{...styles.badge, ...styles.badgeImportant}}>중요</span>}
                    {message.isUrgent && <span style={{...styles.badge, ...styles.badgeUrgent}}>긴급</span>}
                    {message.isRead && <span style={{...styles.badge, ...styles.badgeRead}}>읽음</span>}
                  </div>
                </div>
                <div style={styles.messageContent}>
                  {message.content.length > 100 
                    ? `${message.content.substring(0, 100)}...` 
                    : message.content}
                </div>
                <div style={styles.messageFooter}>
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
        <div style={styles.messageDetailModal} onClick={(e) => e.target === e.currentTarget && setSelectedMessage(null)}>
          <div style={styles.messageDetailCard}>
            <button 
              style={styles.closeButton}
              onClick={() => setSelectedMessage(null)}
            >
              ×
            </button>
            
            <div style={styles.messageDetailHeader}>
              <div>
                <div style={styles.messageDetailTitle}>
                  {getMessageTypeIcon(selectedMessage.messageType)} {selectedMessage.title}
                </div>
                <div style={styles.messageDetailMeta}>
                  {getMessageTypeLabel(selectedMessage.messageType)} • {formatDate(selectedMessage.sentAt)}
                  {selectedMessage.isImportant && ' • ⭐ 중요'}
                  {selectedMessage.isUrgent && ' • ⚠️ 긴급'}
                </div>
              </div>
            </div>
            
            <div style={styles.messageDetailContent}>
              {selectedMessage.content}
            </div>
            
            <div style={styles.replySection}>
              <div style={styles.replyTitle}>답장하기</div>
              <textarea
                style={styles.replyTextarea}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답장 내용을 입력하세요..."
              />
              <div style={styles.buttonGroup}>
                <button
                  style={{...styles.button, ...styles.secondaryButton}}
                  onClick={() => setSelectedMessage(null)}
                >
                  닫기
                </button>
                <button
                  style={{...styles.button, ...styles.primaryButton}}
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
