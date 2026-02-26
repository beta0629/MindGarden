import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiGet } from '../../utils/ajax';
import { MessageSquare, Search, Filter, Users, User } from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import { sessionManager } from '../../utils/sessionManager';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import MGCard from '../common/MGCard';
import UnifiedModal from '../common/modals/UnifiedModal';
import '../../styles/unified-design-tokens.css';

/**
 * 관리자 메시지 관리 페이지
 * 모든 상담사-내담자 메시지를 조회하고 관리할 수 있는 화면
 */
const AdminMessages = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const { unreadCount = 0 } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // 메시지 유형 옵션
  const MESSAGE_TYPES = {
    ALL: { label: '전체', color: 'var(--color-text-secondary)' },
    GENERAL: { label: '일반', color: 'var(--color-info)' },
    FOLLOW_UP: { label: '후속 조치', color: 'var(--color-primary)' },
    HOMEWORK: { label: '과제 안내', color: 'var(--color-success)' },
    REMINDER: { label: '알림', color: 'var(--color-warning)' },
    URGENT: { label: '긴급', color: 'var(--color-danger)' }
  };

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/v1/consultation-messages/all');
      // apiGet 성공 시 배열(data) 또는 객체만 반환함. response.success / response.data 의존 제거.
      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && Array.isArray(response.data)) {
        list = response.data;
      }
      setMessages(list);
    } catch (err) {
      console.error('메시지 로드 중 오류:', err);
      const message = (err && err.message) ? err.message : '메시지를 불러오는 중 오류가 발생했습니다.';
      notificationManager.show(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (sessionLoading) return;
    const sessionUser = sessionManager.getUser();
    if (user?.id || sessionUser?.id) {
      loadMessages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, sessionLoading]);

  // 메시지 필터링
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.receiverName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'ALL' || message.messageType === filterType;
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'UNREAD' && !message.isRead) ||
                         (filterStatus === 'READ' && message.isRead);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // 메시지 상세 보기 (apiGet 성공 시 data 객체만 반환하므로 그대로 상세로 사용)
  const handleMessageClick = async (message) => {
    try {
      const response = await apiGet(`/api/v1/consultation-messages/${message.id}`);
      const detail = response && typeof response === 'object' && !Array.isArray(response) ? response : message;
      setSelectedMessage(detail);
    } catch (error) {
      console.error('메시지 상세 조회 오류:', error);
      setSelectedMessage(message);
    }
  };

  // 모달 닫기
  const closeModal = async () => {
    setSelectedMessage(null);
    await loadMessages();
    window.dispatchEvent(new Event('message-read'));
  };

  // 메시지 유형별 색상
  const getMessageTypeColor = (type) => {
    return MESSAGE_TYPES[type]?.color || MESSAGE_TYPES.GENERAL.color;
  };

  // 로딩 상태
  if (sessionLoading || loading) {
    return (
      <AdminCommonLayout>
        <div className="mg-v2-dashboard-layout">
          <div className="mg-loading">로딩중...</div>
        </div>
      </AdminCommonLayout>
    );
  }

  // 권한 체크 (sessionManager에서 직접 확인)
  const sessionUser = sessionManager.getUser();
  if (!sessionUser) {
    return (
      <AdminCommonLayout>
        <div className="mg-v2-dashboard-layout">
          <div className="mg-v2-card">
            <h3>로그인이 필요합니다</h3>
            <p>메시지를 확인하려면 로그인해주세요.</p>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout>
      <div className="mg-v2-dashboard-layout">
        {/* 헤더 */}
        <div className="mg-v2-dashboard-header">
          <div className="mg-v2-dashboard-header-content">
            <div className="mg-v2-dashboard-header-left">
              <MessageSquare />
              <div>
                <h1 className="mg-v2-dashboard-title">메시지 관리</h1>
                <p className="mg-v2-dashboard-subtitle">
                  전체 메시지 {messages.length}개 
                  {unreadCount > 0 && ` · 읽지 않음 ${unreadCount}개`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="mg-v2-card mg-v2-message-filters-card">
          <div className="mg-v2-message-filters-container">
            {/* 검색 */}
            <div className="mg-v2-message-search-container">
              <Search 
                size={20} 
                className="mg-v2-message-search-icon" 
              />
              <input
                type="text"
                className="mg-v2-input mg-v2-message-search-input"
                placeholder="제목, 내용, 발신자, 수신자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 유형 필터 */}
            <select
              className="mg-v2-select mg-v2-message-type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {Object.entries(MESSAGE_TYPES).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* 상태 필터 */}
            <select
              className="mg-v2-select mg-v2-message-status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">전체 상태</option>
              <option value="UNREAD">읽지 않음</option>
              <option value="READ">읽음</option>
            </select>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="mg-v2-card">
          {filteredMessages.length === 0 ? (
            <div className="mg-v2-message-empty-state">
              <MessageSquare size={48} className="mg-v2-message-empty-icon" />
              <p>메시지가 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 메시지 카드 리스트 (표준화 원칙: 테이블 → 카드 전환, 데스크탑/모바일 통일) */}
              <div className="mg-v2-message-cards-grid">
                {filteredMessages.map((message) => (
                  <MGCard
                    key={message.id}
                    variant="default"
                    className={`mg-v2-message-card ${!message.isRead ? 'mg-v2-message-card-unread' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessageClick(message);
                    }}
                  >
                    {/* 상단: 상태 + 유형 배지 (표준화 원칙: CSS 클래스 사용) */}
                    <div className="mg-v2-message-card__header">
                      <span className={`mg-v2-badge ${!message.isRead ? 'mg-v2-badge-primary' : 'mg-v2-badge-secondary'}`}>
                        {!message.isRead ? '읽지 않음' : '읽음'}
                      </span>
                      <div className="mg-v2-message-badge-container">
                        <span className="mg-v2-badge mg-v2-message-badge">
                          {MESSAGE_TYPES[message.messageType]?.label || '일반'}
                        </span>
                        {message.isImportant && (
                          <span className="mg-v2-badge mg-v2-badge-warning">중요</span>
                        )}
                        {message.isUrgent && (
                          <span className="mg-v2-badge mg-v2-badge-danger">긴급</span>
                        )}
                      </div>
                    </div>

                    {/* 제목 */}
                    <div className={`mg-v2-message-card__title ${!message.isRead ? 'mg-v2-message-card__title--unread' : ''}`}>
                      {message.title}
                    </div>

                    {/* 발신자/수신자 */}
                    <div className="mg-v2-message-card__participants">
                      <div className="mg-v2-message-card__participant">
                        <User size={14} />
                        <span>발신: {message.senderName}</span>
                      </div>
                      <div className="mg-v2-message-card__participant">
                        <Users size={14} />
                        <span>수신: {message.receiverName}</span>
                      </div>
                    </div>

                    {/* 날짜 */}
                    <div className="mg-v2-message-card__date">
                      {new Date(message.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </MGCard>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 메시지 상세 모달 */}
        <UnifiedModal
          isOpen={!!selectedMessage}
          onClose={closeModal}
          title={selectedMessage?.title || '메시지 상세'}
          size="medium"
          showCloseButton={true}
          backdropClick={true}
        >
          {selectedMessage && (
            <>
              <div className="mg-v2-message-modal-content">
                <div className="mg-v2-message-modal-header">
                  <span className="mg-v2-badge mg-v2-message-badge">
                    {MESSAGE_TYPES[selectedMessage.messageType]?.label || '일반'}
                  </span>
                  {selectedMessage.isImportant && (
                    <span className="mg-v2-badge mg-v2-badge-warning">중요</span>
                  )}
                  {selectedMessage.isUrgent && (
                    <span className="mg-v2-badge mg-v2-badge-danger">긴급</span>
                  )}
                </div>
                <div className="mg-v2-message-modal-info-grid">
                  <div>
                    <strong>발신자:</strong> {selectedMessage.senderName}
                  </div>
                  <div>
                    <strong>수신자:</strong> {selectedMessage.receiverName}
                  </div>
                  <div>
                    <strong>발송일:</strong> {new Date(selectedMessage.createdAt).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
              <div className="mg-v2-message-modal-body">
                {selectedMessage.content}
              </div>
            </>
          )}
        </UnifiedModal>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminMessages;

