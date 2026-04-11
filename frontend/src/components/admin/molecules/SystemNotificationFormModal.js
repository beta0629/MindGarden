/**
 * 공지 작성/수정 모달 (UnifiedModal + 공지 폼)
 * B0KlA 폼 클래스·스펙 적용. 통합 페이지·SystemNotificationListBlock에서 재사용.
 * @author CoreSolution
 * @since 2026-03-17
 */

import React from 'react';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';
import { USER_ROLES } from '../../../constants/roles';
import '../../../styles/unified-design-tokens.css';

const TARGET_OPTIONS = [
  { value: 'ALL', label: '전체 사용자' },
  { value: USER_ROLES.CONSULTANT, label: '상담사만' },
  { value: USER_ROLES.CLIENT, label: '내담자만' }
];

const TYPE_OPTIONS = [
  { value: 'GENERAL', label: '일반' },
  { value: 'IMPORTANT', label: '중요' },
  { value: 'URGENT', label: '긴급' },
  { value: 'MAINTENANCE', label: '시스템 점검' },
  { value: 'UPDATE', label: '업데이트 안내' }
];

const SystemNotificationFormModal = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = React.useState({
    targetType: 'ALL',
    title: '',
    content: '',
    notificationType: 'GENERAL',
    isImportant: false,
    isUrgent: false,
    expiresAt: ''
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          targetType: initialData.targetType || 'ALL',
          title: initialData.title || '',
          content: initialData.content || '',
          notificationType: initialData.notificationType || 'GENERAL',
          isImportant: !!initialData.isImportant,
          isUrgent: !!initialData.isUrgent,
          expiresAt: initialData.expiresAt ? (initialData.expiresAt.slice(0, 16)) : ''
        });
      } else {
        setFormData({
          targetType: 'ALL',
          title: '',
          content: '',
          notificationType: 'GENERAL',
          isImportant: false,
          isUrgent: false,
          expiresAt: ''
        });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData);
  };

  const title = initialData ? '공지 수정' : '공지 작성';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="large"
      showCloseButton
      backdropClick
      loading={loading}
      actions={
        <>
          <MGButton
            type="button"
            variant="outline"
            className="mg-v2-button mg-v2-button--outline"
            aria-label="취소"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            className="mg-v2-button mg-v2-button--primary"
            aria-label="저장"
            onClick={() => onSave?.(formData)}
            disabled={loading}
          >
            저장
          </MGButton>
        </>
      }
    >
      <div className="mg-v2-ad-b0kla-modal__body">
        <form onSubmit={handleSubmit} aria-label="공지 작성 폼">
          <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
            <legend className="sr-only">공지 정보</legend>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-target" className="mg-v2-label">대상</label>
              <select
                id="admin-notice-form-target"
                className="mg-v2-ad-b0kla__form-select mg-v2-select"
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                aria-label="대상 선택"
              >
                {TARGET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{toDisplayString(o.label)}</option>
                ))}
              </select>
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-title" className="mg-v2-label">제목</label>
              <input
                type="text"
                id="admin-notice-form-title"
                className="mg-v2-ad-b0kla__form-input mg-v2-input"
                placeholder="제목"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                aria-label="제목"
              />
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-body" className="mg-v2-label">내용</label>
              <textarea
                id="admin-notice-form-body"
                className="mg-v2-ad-b0kla__form-textarea mg-v2-textarea"
                placeholder="내용"
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                aria-label="내용"
              />
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-type" className="mg-v2-label">유형</label>
              <select
                id="admin-notice-form-type"
                className="mg-v2-ad-b0kla__form-select mg-v2-select"
                value={formData.notificationType}
                onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}
                aria-label="유형 선택"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{toDisplayString(o.label)}</option>
                ))}
              </select>
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <div className="mg-v2-checkbox-group">
                <label className="mg-v2-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isImportant}
                    onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                    aria-label="중요"
                  />
                  <span className="mg-v2-checkbox-text">중요</span>
                </label>
                <label className="mg-v2-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isUrgent}
                    onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                    aria-label="긴급"
                  />
                  <span className="mg-v2-checkbox-text">긴급</span>
                </label>
              </div>
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-expiry" className="mg-v2-label">만료일 (선택)</label>
              <input
                type="datetime-local"
                id="admin-notice-form-expiry"
                className="mg-v2-ad-b0kla__form-input mg-v2-input"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                aria-label="만료일"
              />
            </div>
          </fieldset>
        </form>
      </div>
    </UnifiedModal>
  );
};

export default SystemNotificationFormModal;
