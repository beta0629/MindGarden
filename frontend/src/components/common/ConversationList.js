/**
 * ConversationList — 대화 목록 컴포넌트
 *
 * 최근 대화 상대 리스트를 표시. 미읽음 카운트 뱃지, 최근 메시지 미리보기.
 * 상담사·내담자 공통 사용. 역할별 테마를 props로 전달.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import './ConversationList.css';
import { USER_ROLES } from '../../constants/roles';

const API_ENDPOINT = '/api/v1/consultation-messages';
const SEARCH_PLACEHOLDER = '대화 검색';
const EMPTY_TITLE = '대화가 없습니다';
const EMPTY_DESC = '상담이 시작되면 여기에 대화가 표시됩니다';

const SKELETON_COUNT = 5;

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const ConversationList = ({
  currentUserId,
  currentUserRole = USER_ROLES.CLIENT,
  themeVariant = 'client',
  onSelectConversation
}) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const themeStyle = {
    '--mg-chat-primary': themeVariant === 'consultant'
      ? 'var(--mg-consultant-primary)'
      : 'var(--mg-client-primary)',
    '--mg-chat-bg': themeVariant === 'consultant'
      ? 'var(--mg-consultant-bg-main)'
      : 'var(--mg-client-bg-main)'
  };

  const loadConversations = useCallback(async() => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const userType = currentUserRole === USER_ROLES.CONSULTANT ? 'consultant' : 'client';
      const response = await TenantAwareApiClient.get(
        `${API_ENDPOINT}/${userType}/${currentUserId}`,
        { page: 0, size: 100, sort: 'createdAt,desc' }
      );

      let rawMessages = [];
      if (response?.success && response.data) {
        rawMessages = Array.isArray(response.data)
          ? response.data
          : response.data.messages || response.data.content || [];
      } else if (Array.isArray(response)) {
        rawMessages = response;
      }

      const grouped = groupByPartner(rawMessages);
      setConversations(grouped);
    } catch (error) {
      console.error('대화 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentUserRole]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const groupByPartner = (messages) => {
    const map = new Map();

    messages.forEach((msg) => {
      const isMine = String(msg.senderId) === String(currentUserId)
        || msg.senderType === currentUserRole;

      const partnerId = isMine ? msg.receiverId : msg.senderId;
      const partnerName = isMine
        ? (msg.receiverName || msg.clientName || '상대방')
        : (msg.senderName || msg.clientName || '상대방');

      if (!partnerId) return;

      const existing = map.get(String(partnerId));
      if (!existing || new Date(msg.createdAt) > new Date(existing.lastMessageAt)) {
        map.set(String(partnerId), {
          partnerId: String(partnerId),
          partnerName,
          lastMessage: msg.content || msg.title || '',
          lastMessageAt: msg.createdAt,
          unreadCount: existing
            ? existing.unreadCount + (!isMine && !msg.isRead ? 1 : 0)
            : (!isMine && !msg.isRead ? 1 : 0)
        });
      } else if (!isMine && !msg.isRead) {
        existing.unreadCount += 1;
      }
    });

    return Array.from(map.values())
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  };

  const filteredConversations = searchTerm
    ? conversations.filter((c) =>
        c.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  const handleSelect = (conv) => {
    if (onSelectConversation) {
      onSelectConversation({
        partnerId: conv.partnerId,
        partnerName: conv.partnerName
      });
    }
  };

  const renderSkeleton = () => (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="mg-conversations__skeleton-item">
          <div className="mg-conversations__skeleton-avatar" />
          <div className="mg-conversations__skeleton-lines">
            <div className="mg-conversations__skeleton-line mg-conversations__skeleton-line--short" />
            <div className="mg-conversations__skeleton-line mg-conversations__skeleton-line--long" />
          </div>
        </div>
      ))}
    </>
  );

  const renderEmpty = () => (
    <div className="mg-conversations__empty">
      <div className="mg-conversations__empty-icon">
        <MessageCircle size={28} />
      </div>
      <h3 className="mg-conversations__empty-title">{EMPTY_TITLE}</h3>
      <p className="mg-conversations__empty-desc">{EMPTY_DESC}</p>
    </div>
  );

  return (
    <div className="mg-conversations" style={themeStyle}>
      {/* 검색 */}
      <div className="mg-conversations__header">
        <div className="mg-conversations__search">
          <Search size={18} className="mg-conversations__search-icon" />
          <input
            type="text"
            className="mg-conversations__search-input"
            placeholder={SEARCH_PLACEHOLDER}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={SEARCH_PLACEHOLDER}
          />
        </div>
      </div>

      {/* 대화 목록 */}
      <div className="mg-conversations__list">
        {loading && renderSkeleton()}
        {!loading && filteredConversations.length === 0 && renderEmpty()}
        {!loading && filteredConversations.map((conv) => (
          <button
            key={conv.partnerId}
            className={`mg-conversations__item ${conv.unreadCount > 0 ? 'mg-conversations__item--unread' : ''}`}
            onClick={() => handleSelect(conv)}
            type="button"
            aria-label={`${conv.partnerName}과의 대화`}
          >
            <span className="mg-conversations__avatar mg-conversations__avatar--placeholder">
              {conv.partnerName.charAt(0)}
            </span>

            <div className="mg-conversations__content">
              <div className="mg-conversations__top-row">
                <span className={`mg-conversations__name ${conv.unreadCount > 0 ? 'mg-conversations__name--unread' : ''}`}>
                  {conv.partnerName}
                </span>
                <span className="mg-conversations__time">
                  {formatRelativeTime(conv.lastMessageAt)}
                </span>
              </div>
              <span className={`mg-conversations__preview ${conv.unreadCount > 0 ? 'mg-conversations__preview--unread' : ''}`}>
                {conv.lastMessage}
              </span>
            </div>

            {conv.unreadCount > 0 && (
              <span className="mg-conversations__badge">
                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
