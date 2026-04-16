/**
 * 관리자 메시지 목록 블록 (검색·필터 + 카드 그리드 + 메시지 상세 모달)
 * ADMIN_NOTIFICATIONS_UNIFIED_UI_SPEC §4·§5 반영. 통합 페이지·단독 페이지 재사용.
 * @author CoreSolution
 * @since 2026-03-17
 */

import React, { useState, useEffect, useCallback } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import UnifiedLoading from '../../common/UnifiedLoading';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Badge from '../../common/Badge';
import BadgeSelect from '../../common/BadgeSelect';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import '../../../styles/unified-design-tokens.css';

const MESSAGE_TYPES = {
  ALL: { label: '전체', color: 'var(--mg-color-text-secondary)' },
  GENERAL: { label: '일반', color: 'var(--mg-color-info, #5C6B61)' },
  FOLLOW_UP: { label: '후속 조치', color: 'var(--mg-color-primary-main)' },
  HOMEWORK: { label: '과제 안내', color: 'var(--mg-color-success)' },
  REMINDER: { label: '알림', color: 'var(--mg-color-warning)' },
  URGENT: { label: '긴급', color: 'var(--mg-color-danger)' }
};

const AdminMessageListBlock = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const loadMessages = useCallback(async() => {
    try {
      setLoading(true);
      const response = await StandardizedApi.get('/api/v1/consultation-messages/all');
      const raw = response?.content ?? response?.messages ?? response?.data ?? response;
      const list = Array.isArray(raw) ? raw : [];
      setMessages(list);
    } catch (err) {
      console.error('메시지 로드 중 오류:', err);
      notificationManager.show(err?.message || '메시지를 불러오는 중 오류가 발생했습니다.', 'error');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const filteredMessages = (Array.isArray(messages) ? messages : []).filter((message) => {
    const matchesSearch =
      (message.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.senderName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.receiverName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || message.messageType === filterType;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'UNREAD' && !message.isRead) ||
      (filterStatus === 'READ' && message.isRead);
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleMessageClick = async(message) => {
    try {
      const response = await StandardizedApi.get(`/api/v1/consultation-messages/${message.id}`);
      const detail =
        response && typeof response === 'object' && !Array.isArray(response) ? response : message;
      setSelectedMessage(detail);
    } catch (error) {
      console.error('메시지 상세 조회 오류:', error);
      setSelectedMessage(message);
    }
  };

  const closeModal = useCallback(async() => {
    setSelectedMessage(null);
    await loadMessages();
    globalThis.dispatchEvent(new Event('message-read'));
  }, [loadMessages]);

  return (
    <>
      <section
        className="mg-v2-ad-b0kla__section mg-v2-ad-b0kla__card"
        aria-label="메시지 목록"
      >
        <h2 className="mg-v2-ad-b0kla__section-title">메시지 목록</h2>

        <div
          className="mg-v2-ad-b0kla__section-filters"
          role="search"
          aria-label="목록 필터"
        >
          <label htmlFor="admin-message-search" className="sr-only">검색</label>
          <input
            type="search"
            id="admin-message-search"
            className="mg-v2-ad-b0kla__filter-input"
            placeholder="제목, 내용, 발신·수신자 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="메시지 검색"
          />
          <BadgeSelect
            className="mg-v2-ad-b0kla__filter-select"
            value={filterType}
            onChange={(val) => setFilterType(val)}
            options={Object.entries(MESSAGE_TYPES).map(([value, { label }]) => ({ value, label }))}
            placeholder="유형"
            aria-label="유형 선택"
          />
          <BadgeSelect
            className="mg-v2-ad-b0kla__filter-select"
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: 'ALL', label: '전체' },
              { value: 'UNREAD', label: '미읽음' },
              { value: 'READ', label: '읽음' }
            ]}
            placeholder="읽음 상태"
            aria-label="읽음 상태 선택"
          />
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            aria-label="일괄 읽음"
            disabled
          >
            일괄 읽음
          </MGButton>
        </div>

        <div className="mg-v2-ad-notifications__list">
          {loading && <UnifiedLoading type="inline" text="로딩 중..." />}
          {!loading && filteredMessages.length === 0 && (
            <p
              className="mg-v2-notification-empty mg-v2-ad-b0kla__table-empty"
              aria-live="polite"
            >
              메시지가 없습니다.
            </p>
          )}
          {!loading && filteredMessages.length > 0 && (
            <ul className="mg-v2-ad-notifications__card-grid" aria-label="메시지 카드 목록">
              {filteredMessages.map((message) => (
                <li key={message.id} className="mg-v2-ad-notifications__card">
                  <span
                    className="mg-v2-ad-notifications__card-accent"
                    aria-hidden="true"
                    style={{
                      backgroundColor: message.isRead
                        ? 'var(--mg-color-border-main)'
                        : 'var(--mg-color-accent-main)'
                    }}
                  />
                  <div>
                    <p className="mg-v2-ad-notifications__card-meta">
                      {message.senderType === 'SYSTEM'
                        ? '시스템'
                        : toDisplayString(message.senderName || '알 수 없음')}{' '}
                      → {toDisplayString(message.receiverName)}
                    </p>
                    <h3 className="mg-v2-ad-notifications__card-title">
                      <SafeText tag="span">{message.title}</SafeText>
                    </h3>
                    <p className="mg-v2-ad-notifications__card-meta">
                      {(message.content || '').replaceAll(/<[^>]*>/g, '').slice(0, 80)}
                      {(message.content || '').length > 80 ? '…' : ''}
                    </p>
                    <span className="mg-v2-ad-notifications__card-meta">
                      {new Date(message.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="mg-v2-ad-notifications__card-actions mg-v2-card-actions">
                    <MGButton
                      type="button"
                      variant="outline"
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'md',
                        loading: false
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      aria-label="상세 보기"
                      onClick={() => handleMessageClick(message)}
                    >
                      상세
                    </MGButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <UnifiedModal
        isOpen={!!selectedMessage}
        onClose={closeModal}
        title={selectedMessage ? toDisplayString(selectedMessage.title, '메시지 상세') : '메시지 상세'}
        size="medium"
        showCloseButton
        backdropClick
      >
        {selectedMessage && (
          <div id="admin-message-detail-body" className="mg-v2-ad-b0kla-modal__body">
            <div className="mg-v2-message-modal-content">
              <div className="mg-v2-message-modal-header">
                <Badge
                  variant="status"
                  statusVariant="info"
                  label={MESSAGE_TYPES[selectedMessage.messageType]?.label || '일반'}
                  className="mg-v2-message-badge"
                />
                {selectedMessage.isImportant && (
                  <Badge variant="status" statusVariant="warning" label="중요" />
                )}
                {selectedMessage.isUrgent && (
                  <Badge variant="status" statusVariant="danger" label="긴급" />
                )}
              </div>
              <div className="mg-v2-message-modal-info-grid">
                <div>
                  <strong>발신자:</strong>{' '}
                  {selectedMessage.senderType === 'SYSTEM'
                    ? '시스템 메시지'
                    : toDisplayString(selectedMessage.senderName || '알 수 없음')}
                </div>
                <div>
                  <strong>수신자:</strong> {toDisplayString(selectedMessage.receiverName)}
                </div>
                <div>
                  <strong>발송일:</strong>{' '}
                  {new Date(selectedMessage.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
            </div>
            <div className="mg-v2-message-modal-body">
              {selectedMessage.content}
            </div>
          </div>
        )}
      </UnifiedModal>
    </>
  );
};

export default AdminMessageListBlock;
