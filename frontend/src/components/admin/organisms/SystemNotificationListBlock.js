/**
 * 시스템 공지 목록 블록 (필터 + 카드 그리드 + 공지 작성/수정 모달)
 * ADMIN_NOTIFICATIONS_UNIFIED_UI_SPEC §4·§5 반영. 통합 페이지·단독 페이지 재사용.
 * @author CoreSolution
 * @since 2026-03-17
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Send, Archive } from 'lucide-react';
import StandardizedApi from '../../../utils/standardizedApi';
import { USER_ROLES } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import StatusBadge from '../../common/StatusBadge';
import UnifiedLoading from '../../common/UnifiedLoading';
import SystemNotificationFormModal from '../molecules/SystemNotificationFormModal';
import { toDisplayString } from '../../../utils/safeDisplay';
import '../../../styles/unified-design-tokens.css';

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'DRAFT', label: '임시 저장' },
  { value: 'PUBLISHED', label: '게시됨' },
  { value: 'ARCHIVED', label: '보관됨' }
];

const TARGET_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'ALL', label: '전체 사용자' },
  { value: USER_ROLES.CONSULTANT, label: '상담사만' },
  { value: USER_ROLES.CLIENT, label: '내담자만' }
];

const SystemNotificationListBlock = ({ hasManagePermission, onOpenCreate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [filterTarget, setFilterTarget] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterTarget) params.targetType = filterTarget;
      if (filterStatus) params.status = filterStatus;
      params.page = 0;
      params.size = 50;

      const response = await StandardizedApi.get('/api/v1/system-notifications/admin/all', params);
      const raw = response?.notifications ?? response?.content ?? response?.data ?? response;
      const list = Array.isArray(raw) ? raw : [];
      setNotifications(list);
    } catch (error) {
      console.error('공지 목록 로드 오류:', error);
      const message = error?.message || '공지 목록을 불러오는 중 오류가 발생했습니다.';
      notificationManager.show(message, 'error');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filterTarget, filterStatus]);

  useEffect(() => {
    if (hasManagePermission) {
      loadNotifications();
    }
  }, [hasManagePermission, loadNotifications]);

  useEffect(() => {
    if (!onOpenCreate) return;
    const handler = () => {
      setEditingNotification(null);
      setShowModal(true);
    };
    globalThis.addEventListener('admin-notifications-create-notice', handler);
    return () => globalThis.removeEventListener('admin-notifications-create-notice', handler);
  }, [onOpenCreate]);

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    if (!formData.title || !formData.content) {
      notificationManager.show('제목과 내용을 입력해주세요.', 'warning');
      return;
    }
    try {
      setSaveLoading(true);
      const endpoint = editingNotification
        ? `/api/v1/system-notifications/admin/${editingNotification.id}`
        : '/api/v1/system-notifications/admin';
      if (editingNotification) {
        await StandardizedApi.put(endpoint, formData);
      } else {
        await StandardizedApi.post(endpoint, formData);
      }
      notificationManager.show(
        editingNotification ? '공지가 수정되었습니다.' : '공지가 작성되었습니다.',
        'success'
      );
      setShowModal(false);
      loadNotifications();
    } catch (error) {
      console.error('공지 저장 오류:', error);
      notificationManager.show(error?.message || '공지 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePublish = async (id) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('이 공지를 게시하시겠습니까?', resolve);
    });
    if (!confirmed) return;
    try {
      await StandardizedApi.post(`/api/v1/system-notifications/admin/${id}/publish`, {});
      notificationManager.show('공지가 게시되었습니다.', 'success');
      loadNotifications();
    } catch (error) {
      console.error('공지 게시 오류:', error);
      notificationManager.show(error?.message || '공지 게시 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleArchive = async (id) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('이 공지를 보관하시겠습니까?', resolve);
    });
    if (!confirmed) return;
    try {
      await StandardizedApi.post(`/api/v1/system-notifications/admin/${id}/archive`, {});
      notificationManager.show('공지가 보관되었습니다.', 'success');
      loadNotifications();
    } catch (error) {
      console.error('공지 보관 오류:', error);
      notificationManager.show(error?.message || '공지 보관 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('이 공지를 삭제하시겠습니까?', resolve);
    });
    if (!confirmed) return;
    try {
      await StandardizedApi.delete(`/api/v1/system-notifications/admin/${id}`);
      notificationManager.show('공지가 삭제되었습니다.', 'success');
      loadNotifications();
    } catch (error) {
      console.error('공지 삭제 오류:', error);
      notificationManager.show(error?.message || '공지 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const text = String(html).replaceAll(/<[^>]*>/g, '');
    return text.length > 150 ? `${text.substring(0, 150)}...` : text;
  };

  const filteredList = (Array.isArray(notifications) ? notifications : []).filter((n) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (n.title || '').toLowerCase().includes(term) ||
      stripHtml(n.content || '').toLowerCase().includes(term)
    );
  });

  if (!hasManagePermission) {
    return (
      <section className="mg-v2-ad-b0kla__section mg-v2-ad-b0kla__card" aria-label="시스템 공지 목록">
        <p className="mg-v2-ad-b0kla__table-empty" aria-live="polite">
          접근 권한이 없습니다.
        </p>
      </section>
    );
  }

  return (
    <>
      <section
        className="mg-v2-ad-b0kla__section mg-v2-ad-b0kla__card"
        aria-label="시스템 공지 목록"
      >
        <h2 className="mg-v2-ad-b0kla__section-title">공지 목록</h2>

        <div
          className="mg-v2-ad-b0kla__section-filters"
          role="search"
          aria-label="목록 필터"
        >
          <label htmlFor="admin-notice-target" className="sr-only">대상</label>
          <select
            id="admin-notice-target"
            className="mg-v2-ad-b0kla__filter-select"
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            aria-label="대상 선택"
          >
            {TARGET_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{toDisplayString(o.label)}</option>
            ))}
          </select>
          <label htmlFor="admin-notice-status" className="sr-only">상태</label>
          <select
            id="admin-notice-status"
            className="mg-v2-ad-b0kla__filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="상태 선택"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{toDisplayString(o.label)}</option>
            ))}
          </select>
          <label htmlFor="admin-notice-search" className="sr-only">검색</label>
          <input
            type="search"
            id="admin-notice-search"
            className="mg-v2-ad-b0kla__filter-input"
            placeholder="제목·내용 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="공지 검색"
          />
        </div>

        <div className="mg-v2-ad-notifications__list">
          {loading && (
            <UnifiedLoading type="inline" text="로딩 중..." />
          )}
          {!loading && filteredList.length === 0 && (
            <p
              className="mg-v2-notification-empty mg-v2-ad-b0kla__table-empty"
              aria-live="polite"
            >
              등록된 공지가 없습니다.
            </p>
          )}
          {!loading && filteredList.length > 0 && (
            <ul className="mg-v2-ad-notifications__card-grid" aria-label="공지 카드 목록">
              {filteredList.map((notification) => (
                <li key={notification.id} className="mg-v2-ad-notifications__card">
                  <span
                    className="mg-v2-ad-notifications__card-accent"
                    aria-hidden="true"
                    style={{
                      backgroundColor:
                        notification.status === 'PUBLISHED'
                          ? 'var(--mg-color-primary-main)'
                          : notification.status === 'DRAFT'
                            ? 'var(--mg-color-text-secondary)'
                            : 'var(--mg-color-border-main)'
                    }}
                  />
                  <div>
                    <h3 className="mg-v2-ad-notifications__card-title">{toDisplayString(notification.title)}</h3>
                    <div className="mg-v2-ad-notifications__card-meta">
                      <StatusBadge
                        variant={
                          notification.status === 'PUBLISHED'
                            ? 'success'
                            : notification.status === 'DRAFT'
                              ? 'info'
                              : 'neutral'
                        }
                      >
                        {notification.targetType === 'ALL'
                          ? '전체'
                          : notification.targetType === 'CONSULTANT'
                            ? '상담사'
                            : '내담자'}
                      </StatusBadge>
                      <StatusBadge
                        variant={
                          notification.status === 'PUBLISHED'
                            ? 'success'
                            : notification.status === 'DRAFT'
                              ? 'neutral'
                              : 'neutral'
                        }
                      >
                        {notification.status === 'PUBLISHED'
                          ? '게시중'
                          : notification.status === 'DRAFT'
                            ? '임시저장'
                            : '만료'}
                      </StatusBadge>
                      <span>
                        등록일:{' '}
                        {new Date(notification.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  <div className="mg-v2-ad-notifications__card-actions mg-v2-card-actions">
                    {notification.status === 'DRAFT' && (
                      <button
                        type="button"
                        className="mg-v2-button mg-v2-button--outline"
                        aria-label="게시"
                        onClick={() => handlePublish(notification.id)}
                      >
                        <Send size={16} />
                      </button>
                    )}
                    {notification.status === 'PUBLISHED' && (
                      <button
                        type="button"
                        className="mg-v2-button mg-v2-button--outline"
                        aria-label="보관"
                        onClick={() => handleArchive(notification.id)}
                      >
                        <Archive size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="mg-v2-button mg-v2-button--outline"
                      aria-label="수정"
                      onClick={() => handleEdit(notification)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      className="mg-v2-button mg-v2-button--outline"
                      aria-label="삭제"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <SystemNotificationFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={editingNotification}
        onSave={handleSave}
        loading={saveLoading}
      />
    </>
  );
};

export default SystemNotificationListBlock;
