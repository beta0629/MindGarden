/**
 * 공지 작성/수정 모달 (UnifiedModal + 공지 폼)
 * B0KlA 폼 클래스·스펙 적용. 통합 페이지·SystemNotificationListBlock에서 재사용.
 * @author CoreSolution
 * @since 2026-03-17
 */

import React from 'react';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import SettingSwitchRow from '../../common/molecules/SettingSwitchRow';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import { USER_ROLES } from '../../../constants/roles';
import '../../../styles/unified-design-tokens.css';
import '../AdminNotificationsPage.css';
import { useTranslation } from 'react-i18next';

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

const ERR_TITLE_REQUIRED = '제목을 입력해주세요.';
const ERR_CONTENT_REQUIRED = '내용을 입력해주세요.';

const SystemNotificationFormModal = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  loading = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState({
    targetType: 'ALL',
    title: '',
    content: '',
    notificationType: 'GENERAL',
    isImportant: false,
    isUrgent: false,
    expiresAt: ''
  });
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setFormData({
          targetType: initialData.targetType || 'ALL',
          title: toDisplayString(initialData.title, ''),
          content: toDisplayString(initialData.content, ''),
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

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * 저장 전 필드 errors + 필수 검사. toast만 의존하지 않음.
   * @returns {boolean}
   */
  const validateForm = () => {
    const newErrors = {};
    if (!(formData.title || '').trim()) {
      newErrors.title = ERR_TITLE_REQUIRED;
    }
    if (!(formData.content || '').trim()) {
      newErrors.content = ERR_CONTENT_REQUIRED;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const trySave = () => {
    if (!validateForm()) {
      return;
    }
    onSave?.(formData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    trySave();
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
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            aria-label={t('admin.actions.cancel')}
            onClick={onClose}
            disabled={loading}
          >
            {t('admin.actions.cancel')}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            aria-label={t('common.actions.save')}
            onClick={trySave}
            disabled={loading}
          >
            {t('common.actions.save')}
          </MGButton>
        </>
      }
    >
      <div className="mg-v2-ad-b0kla-modal__body">
        <form onSubmit={handleSubmit} aria-label="공지 작성 폼" noValidate>
          <fieldset className="mg-v2-ad-notifications__form-fieldset">
            <legend className="sr-only">공지 정보</legend>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-target" className="mg-v2-label">대상</label>
              <select
                id="admin-notice-form-target"
                className="mg-v2-ad-b0kla__form-select mg-v2-select"
                value={formData.targetType}
                onChange={(e) => updateField('targetType', e.target.value)}
                aria-label="대상 선택"
              >
                {TARGET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{toDisplayString(o.label)}</option>
                ))}
              </select>
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-title" className="mg-v2-label">
                제목
                <span className="mg-v2-form-label-required">*</span>
              </label>
              <input
                type="text"
                id="admin-notice-form-title"
                className={`mg-v2-ad-b0kla__form-input mg-v2-input${errors.title ? ' mg-v2-form-input-error' : ''}`}
                placeholder="제목"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                aria-label="제목"
                aria-invalid={errors.title ? true : undefined}
              />
              {errors.title ? (
                <span className="mg-v2-form-error" role="alert">{errors.title}</span>
              ) : null}
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-body" className="mg-v2-label">
                내용
                <span className="mg-v2-form-label-required">*</span>
              </label>
              <textarea
                id="admin-notice-form-body"
                className={`mg-v2-ad-b0kla__form-textarea mg-v2-textarea${errors.content ? ' mg-v2-form-input-error' : ''}`}
                placeholder="내용"
                rows={10}
                value={formData.content}
                onChange={(e) => updateField('content', e.target.value)}
                aria-label="내용"
                aria-invalid={errors.content ? true : undefined}
              />
              {errors.content ? (
                <span className="mg-v2-form-error" role="alert">{errors.content}</span>
              ) : null}
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-type" className="mg-v2-label">유형</label>
              <select
                id="admin-notice-form-type"
                className="mg-v2-ad-b0kla__form-select mg-v2-select"
                value={formData.notificationType}
                onChange={(e) => updateField('notificationType', e.target.value)}
                aria-label="유형 선택"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{toDisplayString(o.label)}</option>
                ))}
              </select>
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <SettingSwitchRow
                id="admin-notice-form-important"
                label="중요"
                checked={!!formData.isImportant}
                onCheckedChange={(next) => updateField('isImportant', next)}
                ariaLabel="중요"
              />
              <SettingSwitchRow
                id="admin-notice-form-urgent"
                label={t('admin.labels.urgent')}
                checked={!!formData.isUrgent}
                onCheckedChange={(next) => updateField('isUrgent', next)}
                ariaLabel={t('admin.labels.urgent')}
              />
            </div>

            <div className="mg-v2-form-group mg-v2-space-y-md">
              <label htmlFor="admin-notice-form-expiry" className="mg-v2-label">만료일 (선택)</label>
              <input
                type="datetime-local"
                id="admin-notice-form-expiry"
                className="mg-v2-ad-b0kla__form-input mg-v2-input"
                value={formData.expiresAt}
                onChange={(e) => updateField('expiresAt', e.target.value)}
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
