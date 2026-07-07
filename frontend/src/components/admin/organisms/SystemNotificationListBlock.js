/**
 * 시스템 공지 목록 블록 (필터 + 카드 그리드 + 공지 작성/수정 모달)
 * ADMIN_NOTIFICATIONS_UNIFIED_UI_SPEC §4·§5 반영. 통합 페이지·단독 페이지 재사용.
 * @author CoreSolution
 * @since 2026-03-17
 */

import React, { useState, useEffect, useCallback } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import { USER_ROLES } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import { useConfirm } from '../../../hooks/useConfirm';
import StatusBadge from '../../common/StatusBadge';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import { EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../../common';
import SystemNotificationFormModal from '../molecules/SystemNotificationFormModal';
import { toDisplayString, htmlToPlainText } from '../../../utils/safeDisplay';
import '../../../styles/unified-design-tokens.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_SYSTEM_NOTIFICATIONS_ADMIN_ALL = '/api/v1/system-notifications/admin/all';
const API_SYSTEM_NOTIFICATIONS_ADMIN = '/api/v1/system-notifications/admin';


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

/**
 * 공지 카드 EntityRowActions primary·overflow 구성 (G1-03 P2 SSOT §3)
 * @param {object} notification
 * @param {object} handlers
 * @param {string} editLabel
 * @param {string} deleteLabel
 * @returns {{ primaryAction: object, items: object[] }}
 */
export const buildNotificationRowActions = (
  notification,
  { onPublish, onArchive, onEdit, onDelete },
  editLabel,
  deleteLabel
) => {
  const deleteItem = {
    id: 'delete',
    label: deleteLabel,
    onClick: () => onDelete(notification.id),
    variant: 'destructive'
  };

  if (notification.status === 'DRAFT') {
    return {
      primaryAction: {
        label: '게시',
        onClick: () => onPublish(notification.id)
      },
      items: [
        { id: 'edit', label: editLabel, onClick: () => onEdit(notification) },
        deleteItem
      ]
    };
  }

  if (notification.status === 'PUBLISHED') {
    return {
      primaryAction: {
        label: '보관',
        onClick: () => onArchive(notification.id)
      },
      items: [
        { id: 'edit', label: editLabel, onClick: () => onEdit(notification) },
        deleteItem
      ]
    };
  }

  return {
    primaryAction: {
      label: editLabel,
      onClick: () => onEdit(notification)
    },
    items: [deleteItem]
  };
};

const SystemNotificationListBlock = ({ hasManagePermission, onOpenCreate }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [confirm, ConfirmModal] = useConfirm();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [filterTarget, setFilterTarget] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadNotifications = useCallback(async() => {
    try {
      setLoading(true);
      const params = {};
      if (filterTarget) params.targetType = filterTarget;
      if (filterStatus) params.status = filterStatus;
      params.page = 0;
      params.size = 50;

      const response = await StandardizedApi.get(API_SYSTEM_NOTIFICATIONS_ADMIN_ALL, params);
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

  const handleSave = async(formData) => {
    if (!formData.title || !formData.content) {
      notificationManager.show('제목과 내용을 입력해주세요.', 'warning');
      return;
    }
    try {
      setSaveLoading(true);
      const endpoint = editingNotification
        ? `/api/v1/system-notifications/admin/${editingNotification.id}`
        : API_SYSTEM_NOTIFICATIONS_ADMIN;
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

  const handlePublish = async(id) => {
    const confirmed = await confirm({
      messageKey: 'admin:systemNotification.confirm.publish',
      variant: 'warning'
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

  const handleArchive = async(id) => {
    const confirmed = await confirm({
      messageKey: 'admin:systemNotification.confirm.archive',
      variant: 'warning'
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

  const handleDelete = async(id) => {
    const confirmed = await confirm({
      messageKey: 'admin:systemNotification.confirm.delete',
      variant: 'danger'
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

  const getTargetTypeLabel = (targetType) => {
    if (targetType === 'ALL') return '전체';
    if (targetType === USER_ROLES.CONSULTANT) return '상담사';
    if (targetType === USER_ROLES.CLIENT) return '내담자';
    return toDisplayString(targetType, '—');
  };

  const getStatusLabel = (status) => {
    if (status === 'PUBLISHED') return '게시중';
    if (status === 'DRAFT') return '임시저장';
    if (status === 'ARCHIVED') return '보관됨';
    return toDisplayString(status, '만료');
  };

  const resolveNotificationRowActions = (notification) => buildNotificationRowActions(
    notification,
    {
      onPublish: handlePublish,
      onArchive: handleArchive,
      onEdit: handleEdit,
      onDelete: handleDelete
    },
    t('common.actions.edit'),
    t('admin.actions.delete')
  );

  const stripHtml = (html) => {
    const text = toDisplayString(htmlToPlainText(html), '');
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
          {t('admin.messages.noAccessPermission')}
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
          <label htmlFor="admin-notice-status" className="sr-only">{t('admin.labels.status')}</label>
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
                    className={`mg-v2-ad-notifications__card-accent ${
                      notification.status === 'PUBLISHED'
                        ? 'mg-v2-ad-notifications__card-accent--published'
                        : notification.status === 'DRAFT'
                          ? 'mg-v2-ad-notifications__card-accent--draft'
                          : 'mg-v2-ad-notifications__card-accent--neutral'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="mg-v2-ad-notifications__card-title">
                      <SafeText tag="span">{notification.title}</SafeText>
                    </h3>
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
                        {toDisplayString(getTargetTypeLabel(notification.targetType))}
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
                        {toDisplayString(getStatusLabel(notification.status))}
                      </StatusBadge>
                      <span>
                        등록일:{' '}
                        {new Date(notification.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  <div className="mg-v2-ad-notifications__card-actions mg-v2-card-actions mg-v2-entity-row-actions">
                    <EntityRowActions
                      layout={ENTITY_ROW_ACTIONS_LAYOUT.CARD}
                      ariaLabel="공지 작업"
                      {...resolveNotificationRowActions(notification)}
                    />
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
      <ConfirmModal />
    </>
  );
};

export default SystemNotificationListBlock;
