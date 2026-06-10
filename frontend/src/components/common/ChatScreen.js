/**
 * ChatScreen — 공통 채팅 화면 컴포넌트
 *
 * 상담사·내담자 공용. 역할별 테마(Primary)를 props로 전달받아 적용.
 * 말풍선 좌우 배치, 읽음 표시, 하단 입력 바, 스켈레톤 로딩, Empty State 포함.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Check, CheckCheck, MessageCircle } from 'lucide-react';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import { useToast } from '../../contexts/ToastContext';
import Avatar from './Avatar';
import './ChatScreen.css';
import { USER_ROLES } from '../../constants/roles';

const API_ENDPOINT = '/api/v1/consultation-messages';
const MESSAGES_PER_PAGE = 50;
const INPUT_PLACEHOLDER = '메시지를 입력하세요...';
const EMPTY_TITLE = '메시지가 없습니다';
const EMPTY_DESC = '대화를 시작해 보세요';

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours < 12 ? '오전' : '오후';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${period} ${displayHour}:${minutes}`;
};

const formatDateDivider = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '오늘';
  if (date.toDateString() === yesterday.toDateString()) return '어제';

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return a.toDateString() === b.toDateString();
};

const ChatScreen = ({
  partnerId,
  partnerName = '',
  partnerRole = '',
  partnerAvatar = null,
  currentUserId,
  currentUserRole = USER_ROLES.CLIENT,
  themeVariant = 'client',
  onBack
}) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const themeStyle = {
    '--mg-chat-primary': themeVariant === 'consultant'
      ? 'var(--mg-consultant-primary)'
      : 'var(--mg-client-primary)',
    '--mg-chat-bg': themeVariant === 'consultant'
      ? 'var(--mg-consultant-bg-main)'
      : 'var(--mg-client-bg-main)',
    '--mg-chat-surface': themeVariant === 'consultant'
      ? 'var(--mg-consultant-surface)'
      : 'var(--mg-client-surface)'
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async() => {
    if (!partnerId || !currentUserId) return;
    try {
      setLoading(true);
      const userType = currentUserRole === USER_ROLES.CONSULTANT ? 'consultant' : 'client';
      const response = await TenantAwareApiClient.get(
        `${API_ENDPOINT}/${userType}/${currentUserId}`,
        { partnerId, page: 0, size: MESSAGES_PER_PAGE, sort: 'createdAt,asc' }
      );

      if (response?.success && response.data) {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.messages || response.data.content || [];
        setMessages(data);
      } else if (Array.isArray(response)) {
        setMessages(response);
      }
    } catch (error) {
      console.error('메시지 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId, currentUserId, currentUserRole]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading, scrollToBottom]);

  const handleSend = async() => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      senderId: currentUserId,
      senderType: currentUserRole,
      createdAt: new Date().toISOString(),
      isRead: false,
      isTemp: true
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setSending(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await TenantAwareApiClient.post(API_ENDPOINT, {
        receiverId: partnerId,
        content: trimmed,
        messageType: 'GENERAL'
      });
      await loadMessages();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      showToast({ message: '메시지 전송에 실패했습니다.', type: 'error' });
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInputText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const isMine = (msg) => {
    return String(msg.senderId) === String(currentUserId)
      || msg.senderType === currentUserRole;
  };

  const renderSkeleton = () => (
    <div className="mg-chat__skeleton">
      <div className="mg-chat__skeleton-bubble mg-chat__skeleton-bubble--short" />
      <div className="mg-chat__skeleton-bubble mg-chat__skeleton-bubble--medium" />
      <div className="mg-chat__skeleton-bubble mg-chat__skeleton-bubble--long" />
      <div className="mg-chat__skeleton-bubble mg-chat__skeleton-bubble--short" />
      <div className="mg-chat__skeleton-bubble mg-chat__skeleton-bubble--medium" />
    </div>
  );

  const renderEmpty = () => (
    <div className="mg-chat__empty">
      <div className="mg-chat__empty-icon">
        <MessageCircle size={28} />
      </div>
      <h3 className="mg-chat__empty-title">{EMPTY_TITLE}</h3>
      <p className="mg-chat__empty-desc">{EMPTY_DESC}</p>
    </div>
  );

  const renderMessages = () => {
    const elements = [];

    messages.forEach((msg, idx) => {
      const prevMsg = idx > 0 ? messages[idx - 1] : null;
      if (!isSameDay(prevMsg?.createdAt, msg.createdAt)) {
        elements.push(
          <div key={`date-${msg.createdAt}`} className="mg-chat__date-divider">
            <span className="mg-chat__date-label">
              {formatDateDivider(msg.createdAt)}
            </span>
          </div>
        );
      }

      const mine = isMine(msg);
      elements.push(
        <div
          key={msg.id}
          className={`mg-chat__bubble-wrap ${mine ? 'mg-chat__bubble-wrap--mine' : 'mg-chat__bubble-wrap--theirs'}`}
        >
          <div className={`mg-chat__bubble ${mine ? 'mg-chat__bubble--mine' : 'mg-chat__bubble--theirs'}`}>
            {msg.content}
          </div>
          <div className="mg-chat__meta">
            {mine && (
              <span className={`mg-chat__read-status ${msg.isRead ? '' : 'mg-chat__read-status--unread'}`}>
                {msg.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
              </span>
            )}
            <span className="mg-chat__time">{formatTime(msg.createdAt)}</span>
          </div>
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="mg-chat" style={themeStyle}>
      {/* 상대 프로필 헤더 */}
      {partnerName && (
        <div className="mg-chat__partner-header">
          <Avatar
            profileImageUrl={partnerAvatar}
            displayName={partnerName}
            className="mg-chat__partner-avatar"
            alt={partnerName}
          />
          <div className="mg-chat__partner-info">
            <h2 className="mg-chat__partner-name">{partnerName}</h2>
            {partnerRole && <span className="mg-chat__partner-role">{partnerRole}</span>}
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      <div
        className={`mg-chat__messages ${loading ? 'mg-chat__messages--loading' : ''}`}
        ref={messagesContainerRef}
      >
        {loading && renderSkeleton()}
        {!loading && messages.length === 0 && renderEmpty()}
        {!loading && messages.length > 0 && renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      {/* 하단 입력 바 */}
      <div className="mg-chat__input-bar">
        <textarea
          ref={textareaRef}
          className="mg-chat__input"
          placeholder={INPUT_PLACEHOLDER}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="메시지 입력"
        />
        <button
          className="mg-chat__send-btn"
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          aria-label="전송"
          type="button"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatScreen;
