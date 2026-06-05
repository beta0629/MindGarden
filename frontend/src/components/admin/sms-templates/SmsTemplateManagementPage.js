/**
 * 어드민 — 트랜잭션 SMS 템플릿 관리 페이지.
 *
 * 라우트: ADMIN_ROUTES.SMS_TEMPLATES (`/admin/sms-templates`).
 * 기능:
 *   - SMS 템플릿 목록(글로벌 + 테넌트 override) 조회
 *   - 테넌트 override 본문 편집·저장
 *   - 변수 치환 미리보기
 *   - 테넌트 override 삭제 (글로벌 본문으로 회귀)
 *
 * 권한: ADMIN/STAFF 가 진입 가능. 저장·삭제는 ADMIN 만 (백엔드에서 추가 가드).
 *
 * 레이아웃: 좌측 템플릿 키 목록 + 우측 편집·미리보기 패널 2단 그리드.
 *
 * @author MindGarden
 * @since 2026-05-29
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../../dashboard-v2/content';
import UnifiedLoading from '../../common/UnifiedLoading';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import ActionBar from '../../common/ActionBar';
import ActionBarButton from '../../common/ActionBarButton';
import { useSession } from '../../../contexts/SessionContext';
import { USER_ROLES, RoleUtils } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import {
  getSmsTemplates,
  updateSmsTemplateTenantOverride,
  deleteSmsTemplateTenantOverride,
  previewSmsTemplate,
  patchGlobalDispatchFlag,
  patchTemplateDispatchFlag
} from '../../../api/admin/smsTemplateApi';
import './SmsTemplateManagementPage.css';

const ALLOWED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STAFF];
const PAGE_TITLE_ID = 'admin-sms-template-title';

/**
 * audience (수신 대상) Pill 배지 색상 분기 SSOT.
 * 백엔드 {@code SmsTemplateAdminItem.audience} 가 null/미시드면 'CLIENT' 폴백 처리.
 * 색상 토큰은 B0KlA 디자인 시스템과 정합 (info-100/brand-100/neutral-100 cascade).
 */
const AUDIENCE_VARIANT = {
  CLIENT: 'client',
  CONSULTANT: 'consultant',
  BOTH: 'both',
  ADMIN: 'admin',
  SYSTEM: 'system'
};

const audienceVariantOf = (audience) => {
  if (!audience) {
    return AUDIENCE_VARIANT.CLIENT;
  }
  const normalized = String(audience).trim().toUpperCase();
  return AUDIENCE_VARIANT[normalized] || AUDIENCE_VARIANT.CLIENT;
};

/**
 * StandardizedApi 응답에서 데이터 본문을 안전하게 추출한다.
 * 응답 형태: { success: true, data: ... } 또는 raw payload.
 *
 * @param {*} response API 응답
 * @returns {*} 데이터 본문
 */
const unwrapData = (response) => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
};

const SmsTemplateManagementPage = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [previewVariables, setPreviewVariables] = useState({});
  const [previewResult, setPreviewResult] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [globalEnableModalOpen, setGlobalEnableModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const globalDispatchEnabled = useMemo(
    () => items.some((item) => item?.globalDispatchEnabled === true),
    [items]
  );

  const isAdmin = RoleUtils.hasAnyRole(user, [USER_ROLES.ADMIN]);
  const hasAccess = RoleUtils.hasAnyRole(user, ALLOWED_ROLES);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasAccess) {
      notificationManager.show(
        t('smsTemplate.page.noAccess'),
        'error'
      );
      navigate('/', { replace: true });
    }
  }, [sessionLoading, isLoggedIn, user, hasAccess, navigate, t]);

  const loadList = useCallback(async() => {
    setLoading(true);
    try {
      const response = await getSmsTemplates();
      const data = unwrapData(response) || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('SMS 템플릿 목록 조회 실패', error);
      notificationManager.show(
        t('smsTemplate.errors.loadFailed'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (hasAccess) {
      loadList();
    }
  }, [hasAccess, loadList]);

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      if (item?.category) {
        set.add(item.category);
      }
    });
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      if (!lower) {
        return true;
      }
      return (
        (item.key && item.key.toLowerCase().includes(lower)) ||
        (item.label && item.label.toLowerCase().includes(lower))
      );
    });
  }, [items, searchTerm, categoryFilter]);

  const selectedItem = useMemo(
    () => items.find((item) => item.key === selectedKey) || null,
    [items, selectedKey]
  );

  useEffect(() => {
    if (!selectedItem) {
      setEditingContent('');
      setPreviewVariables({});
      setPreviewResult(null);
      return;
    }
    const initial = selectedItem.tenantContent || selectedItem.globalContent || '';
    setEditingContent(initial);
    setPreviewVariables(
      Array.isArray(selectedItem.variables)
        ? selectedItem.variables.reduce((acc, key) => {
            acc[key] = '';
            return acc;
          }, {})
        : {}
    );
    setPreviewResult(null);
  }, [selectedItem]);

  const handleVariableChange = useCallback((variableKey, value) => {
    setPreviewVariables((prev) => ({ ...prev, [variableKey]: value }));
  }, []);

  const handlePreview = useCallback(async() => {
    if (!selectedKey) {
      return;
    }
    try {
      const response = await previewSmsTemplate(selectedKey, {
        variables: previewVariables,
        preferTenantOverride: true
      });
      setPreviewResult(unwrapData(response));
    } catch (error) {
      console.error('SMS 템플릿 미리보기 실패', error);
      notificationManager.show(
        t('smsTemplate.errors.previewFailed'),
        'error'
      );
    }
  }, [selectedKey, previewVariables, t]);

  const handleSaveConfirm = useCallback(async() => {
    if (!selectedKey || !editingContent.trim()) {
      setSaveModalOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      await updateSmsTemplateTenantOverride(selectedKey, {
        content: editingContent
      });
      notificationManager.show(
        t('smsTemplate.notify.saved'),
        'success'
      );
      setSaveModalOpen(false);
      await loadList();
    } catch (error) {
      console.error('SMS 템플릿 저장 실패', error);
      notificationManager.show(
        t('smsTemplate.errors.saveFailed'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }, [selectedKey, editingContent, loadList, t]);

  const handleDeleteConfirm = useCallback(async() => {
    if (!selectedKey) {
      setDeleteModalOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      await deleteSmsTemplateTenantOverride(selectedKey);
      notificationManager.show(
        t('smsTemplate.notify.deleted'),
        'success'
      );
      setDeleteModalOpen(false);
      await loadList();
    } catch (error) {
      console.error('SMS 템플릿 override 삭제 실패', error);
      notificationManager.show(
        t('smsTemplate.errors.deleteFailed'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }, [selectedKey, loadList, t]);

  const submitGlobalDispatchToggle = useCallback(async(enabled) => {
    setSubmitting(true);
    try {
      await patchGlobalDispatchFlag({ enabled });
      notificationManager.show(
        t('smsTemplate.action.dispatchUpdated'),
        'success'
      );
      await loadList();
    } catch (error) {
      console.error('SMS 글로벌 게이트 토글 실패', error);
      notificationManager.show(
        t('smsTemplate.action.dispatchUpdateFailed'),
        'error'
      );
    } finally {
      setSubmitting(false);
      setGlobalEnableModalOpen(false);
    }
  }, [loadList, t]);

  const handleGlobalToggle = useCallback((nextEnabled) => {
    if (nextEnabled) {
      // ON 으로 전환은 운영 게이트 해제 — 알림톡 검수 통과 확인 후에만 활성화 (확인 모달).
      setGlobalEnableModalOpen(true);
      return;
    }
    submitGlobalDispatchToggle(false);
  }, [submitGlobalDispatchToggle]);

  const handleTemplateDispatchToggle = useCallback(async(templateKey, nextEnabled) => {
    if (!templateKey || !isAdmin) {
      return;
    }
    setSubmitting(true);
    try {
      await patchTemplateDispatchFlag(templateKey, { enabled: nextEnabled });
      notificationManager.show(
        t('smsTemplate.action.dispatchUpdated'),
        'success'
      );
      await loadList();
    } catch (error) {
      console.error('SMS 종목 게이트 토글 실패', error);
      notificationManager.show(
        t('smsTemplate.action.dispatchUpdateFailed'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }, [isAdmin, loadList, t]);

  const pageTitle = t('smsTemplate.page.title');
  const pageSubtitle = t('smsTemplate.page.subtitle');

  if (sessionLoading || !hasAccess) {
    return (
      <AdminCommonLayout title={pageTitle} className="mg-v2-dashboard-layout">
        <UnifiedLoading text={t('common:loading')} />
      </AdminCommonLayout>
    );
  }

  const variableKeys = Array.isArray(selectedItem?.variables)
    ? selectedItem.variables
    : [];

  return (
    <AdminCommonLayout title={pageTitle} className="mg-v2-dashboard-layout">
      <div className="mg-admin-sms-template" data-testid="admin-sms-template-page">
        <ContentArea>
          <ContentHeader
            titleId={PAGE_TITLE_ID}
            title={pageTitle}
            subtitle={pageSubtitle}
          />

          <aside
            className="mg-admin-sms-template__banner"
            data-testid="sms-template-gate-banner"
            role="note"
          >
            {t('smsTemplate.banner.gateNotice')}
          </aside>

          <section
            className="mg-admin-sms-template__global-toggle"
            data-testid="sms-template-global-toggle"
            aria-label={t('smsTemplate.globalDispatch.title')}
          >
            <div className="mg-admin-sms-template__global-toggle-text">
              <h3 className="mg-admin-sms-template__global-toggle-title">
                {t('smsTemplate.globalDispatch.title')}
              </h3>
              <p className="mg-admin-sms-template__global-toggle-description">
                {t('smsTemplate.globalDispatch.description')}
              </p>
            </div>
            <label className="mg-admin-sms-template__switch">
              <input
                type="checkbox"
                className="mg-admin-sms-template__switch-input"
                checked={globalDispatchEnabled}
                onChange={(event) => handleGlobalToggle(event.target.checked)}
                disabled={!isAdmin || submitting}
                data-testid="sms-template-global-toggle-input"
              />
              <span className="mg-admin-sms-template__switch-slider" aria-hidden="true" />
              <span className="mg-admin-sms-template__switch-label">
                {globalDispatchEnabled
                  ? t('smsTemplate.dispatch.badge.on')
                  : t('smsTemplate.dispatch.badge.off')}
              </span>
            </label>
          </section>

          <section
            className="mg-admin-sms-template__panel"
            aria-labelledby={PAGE_TITLE_ID}
          >
            <div className="mg-admin-sms-template__grid">
              <aside className="mg-admin-sms-template__list">
                <div className="mg-admin-sms-template__filters">
                  <input
                    type="search"
                    className="mg-admin-sms-template__search"
                    placeholder={t('smsTemplate.list.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    data-testid="sms-template-search"
                  />
                  <select
                    className="mg-admin-sms-template__filter"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    data-testid="sms-template-category-filter"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === 'ALL'
                          ? t('smsTemplate.list.categoryAll')
                          : category}
                      </option>
                    ))}
                  </select>
                </div>

                {loading ? (
                  <UnifiedLoading text={t('common:loading')} />
                ) : (
                  <ul
                    className="mg-admin-sms-template__items"
                    data-testid="sms-template-items"
                  >
                    {filteredItems.length === 0 && (
                      <li className="mg-admin-sms-template__empty">
                        {t('smsTemplate.list.empty')}
                      </li>
                    )}
                    {filteredItems.map((item) => (
                      <li
                        key={item.key}
                        className={`mg-admin-sms-template__item${
                          selectedKey === item.key
                            ? ' mg-admin-sms-template__item--selected'
                            : ''
                        }`}
                      >
                        <button
                          type="button"
                          className="mg-admin-sms-template__item-button"
                          onClick={() => setSelectedKey(item.key)}
                          data-testid={`sms-template-item-${item.key}`}
                        >
                          <span className="mg-admin-sms-template__item-label">
                            {item.label || item.key}
                          </span>
                          <span className="mg-admin-sms-template__item-key">
                            {item.key}
                          </span>
                          <span
                            className={`mg-admin-sms-template__audience-badge mg-admin-sms-template__audience-badge--${audienceVariantOf(item.audience)}`}
                            data-testid={`sms-template-audience-badge-${item.key}`}
                          >
                            {t(`smsTemplate.audience.${audienceVariantOf(item.audience)}`)}
                          </span>
                          {item.tenantOverride && (
                            <span className="mg-admin-sms-template__item-badge">
                              {t('smsTemplate.list.overrideBadge')}
                            </span>
                          )}
                          {item.trigger && (
                            <span
                              className="mg-admin-sms-template__item-trigger"
                              data-testid={`sms-template-trigger-summary-${item.key}`}
                              title={item.trigger}
                            >
                              {t('smsTemplate.editor.triggerLabel')}: {item.trigger}
                            </span>
                          )}
                          <span
                            className={`mg-admin-sms-template__dispatch-badge${
                              item.effectiveDispatchEnabled
                                ? ' mg-admin-sms-template__dispatch-badge--on'
                                : ' mg-admin-sms-template__dispatch-badge--off'
                            }`}
                            data-testid={`sms-template-dispatch-badge-${item.key}`}
                          >
                            {item.effectiveDispatchEnabled
                              ? t('smsTemplate.dispatch.badge.on')
                              : t('smsTemplate.dispatch.badge.off')}
                          </span>
                        </button>
                        <label
                          className={`mg-admin-sms-template__template-toggle${
                            !globalDispatchEnabled
                              ? ' mg-admin-sms-template__template-toggle--disabled'
                              : ''
                          }`}
                          title={
                            !globalDispatchEnabled
                              ? t('smsTemplate.templateDispatch.disabledByGlobal')
                              : undefined
                          }
                        >
                          <input
                            type="checkbox"
                            className="mg-admin-sms-template__switch-input"
                            checked={Boolean(item.tenantDispatchEnabled
                                ?? item.effectiveDispatchEnabled)}
                            onChange={(event) =>
                              handleTemplateDispatchToggle(item.key, event.target.checked)
                            }
                            disabled={
                              !isAdmin || submitting || !globalDispatchEnabled
                            }
                            data-testid={`sms-template-toggle-${item.key}`}
                          />
                          <span className="mg-admin-sms-template__switch-slider" aria-hidden="true" />
                          <span className="mg-admin-sms-template__switch-label">
                            {t('smsTemplate.templateDispatch.label')}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>

              <main className="mg-admin-sms-template__editor">
                {!selectedItem && (
                  <div className="mg-admin-sms-template__placeholder">
                    {t('smsTemplate.editor.selectPrompt')}
                  </div>
                )}

                {selectedItem && (
                  <>
                    <header className="mg-admin-sms-template__editor-header">
                      <div className="mg-admin-sms-template__editor-title-row">
                        <h3 className="mg-admin-sms-template__editor-title">
                          {selectedItem.label || selectedItem.key}
                        </h3>
                        <span
                          className={`mg-admin-sms-template__audience-badge mg-admin-sms-template__audience-badge--${audienceVariantOf(selectedItem.audience)} mg-admin-sms-template__audience-badge--lg`}
                          data-testid={`sms-template-audience-badge-detail-${selectedItem.key}`}
                        >
                          {t(`smsTemplate.audience.${audienceVariantOf(selectedItem.audience)}`)}
                        </span>
                      </div>
                      {selectedItem.trigger && (
                        <div
                          className="mg-admin-sms-template__trigger-banner"
                          data-testid={`sms-template-trigger-detail-${selectedItem.key}`}
                          role="note"
                        >
                          <strong className="mg-admin-sms-template__trigger-label">
                            {t('smsTemplate.editor.triggerLabel')}
                          </strong>
                          <span className="mg-admin-sms-template__trigger-value">
                            {selectedItem.trigger}
                          </span>
                        </div>
                      )}
                      <p className="mg-admin-sms-template__editor-description">
                        {selectedItem.description}
                      </p>
                    </header>

                    <section className="mg-admin-sms-template__editor-section">
                      <h4 className="mg-admin-sms-template__editor-section-title">
                        {t('smsTemplate.editor.globalLabel')}
                      </h4>
                      <pre
                        className="mg-admin-sms-template__global-content"
                        data-testid="sms-template-global-content"
                      >
                        {selectedItem.globalContent}
                      </pre>
                    </section>

                    <section className="mg-admin-sms-template__editor-section">
                      <h4 className="mg-admin-sms-template__editor-section-title">
                        {t('smsTemplate.editor.tenantLabel')}
                      </h4>
                      <textarea
                        className="mg-admin-sms-template__tenant-content"
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                        rows={5}
                        disabled={!isAdmin}
                        data-testid="sms-template-tenant-content"
                      />
                      <p className="mg-admin-sms-template__hint">
                        {t('smsTemplate.editor.variableHint')}
                      </p>
                    </section>

                    {variableKeys.length > 0 && (
                      <section className="mg-admin-sms-template__editor-section">
                        <h4 className="mg-admin-sms-template__editor-section-title">
                          {t('smsTemplate.editor.variablesLabel')}
                        </h4>
                        <div className="mg-admin-sms-template__variables-grid">
                          {variableKeys.map((variableKey) => (
                            <label
                              key={variableKey}
                              className="mg-admin-sms-template__variable-row"
                            >
                              <span className="mg-admin-sms-template__variable-name">
                                {variableKey}
                              </span>
                              <input
                                type="text"
                                className="mg-admin-sms-template__variable-input"
                                value={previewVariables[variableKey] || ''}
                                onChange={(event) =>
                                  handleVariableChange(variableKey, event.target.value)
                                }
                                data-testid={`sms-template-variable-${variableKey}`}
                              />
                            </label>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="mg-admin-sms-template__editor-section">
                      <div className="mg-admin-sms-template__actions">
                        <MGButton
                          type="button"
                          variant="secondary"
                          onClick={handlePreview}
                          data-testid="sms-template-preview-btn"
                        >
                          {t('smsTemplate.actions.preview')}
                        </MGButton>
                        {isAdmin && (
                          <>
                            <MGButton
                              type="button"
                              variant="primary"
                              onClick={() => setSaveModalOpen(true)}
                              disabled={!editingContent.trim()}
                              data-testid="sms-template-save-btn"
                            >
                              {t('smsTemplate.actions.save')}
                            </MGButton>
                            {selectedItem.tenantOverride && (
                              <MGButton
                                type="button"
                                variant="danger"
                                onClick={() => setDeleteModalOpen(true)}
                                data-testid="sms-template-delete-btn"
                              >
                                {t('smsTemplate.actions.deleteOverride')}
                              </MGButton>
                            )}
                          </>
                        )}
                      </div>
                    </section>

                    {previewResult && (
                      <section
                        className="mg-admin-sms-template__editor-section"
                        data-testid="sms-template-preview-result"
                      >
                        <h4 className="mg-admin-sms-template__editor-section-title">
                          {t('smsTemplate.editor.previewLabel')}
                        </h4>
                        <pre className="mg-admin-sms-template__preview-output">
                          {previewResult.previewContent}
                        </pre>
                        <p className="mg-admin-sms-template__preview-meta">
                          {t('smsTemplate.preview.byteLength')}:{' '}
                          {previewResult.byteLength} /{' '}
                          {t('smsTemplate.preview.charLength')}:{' '}
                          {previewResult.charLength} /{' '}
                          {t('smsTemplate.preview.source')}:{' '}
                          {previewResult.fromTenantOverride
                            ? t('smsTemplate.preview.sourceTenant')
                            : t('smsTemplate.preview.sourceGlobal')}
                        </p>
                        {Array.isArray(previewResult.missingVariables) &&
                          previewResult.missingVariables.length > 0 && (
                            <p className="mg-admin-sms-template__preview-missing">
                              {t('smsTemplate.preview.missing')}
                              : {previewResult.missingVariables.join(', ')}
                            </p>
                          )}
                      </section>
                    )}
                  </>
                )}
              </main>
            </div>
          </section>
        </ContentArea>
      </div>

      <UnifiedModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title={t('smsTemplate.modals.saveTitle')}
        subtitle={t('smsTemplate.modals.saveSubtitle')}
        variant="confirm"
        actions={
          <ActionBar align="end" gap="md">
            <ActionBarButton variant="outline" onClick={() => setSaveModalOpen(false)} disabled={submitting}>
              {t('common:cancel')}
            </ActionBarButton>
            <ActionBarButton
              variant="primary"
              onClick={handleSaveConfirm}
              loading={submitting}
              data-testid="sms-template-save-confirm"
            >
              {t('smsTemplate.modals.confirmSave')}
            </ActionBarButton>
          </ActionBar>
        }
      >
        <div data-testid="sms-template-save-modal-body">
          {t('smsTemplate.modals.saveBody')}
        </div>
      </UnifiedModal>

      <UnifiedModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('smsTemplate.modals.deleteTitle')}
        subtitle={t('smsTemplate.modals.deleteSubtitle')}
        variant="alert"
        actions={
          <ActionBar align="end" gap="md">
            <ActionBarButton variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={submitting}>
              {t('common:cancel')}
            </ActionBarButton>
            <ActionBarButton
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={submitting}
              data-testid="sms-template-delete-confirm"
            >
              {t('smsTemplate.modals.confirmDelete')}
            </ActionBarButton>
          </ActionBar>
        }
      >
        <div data-testid="sms-template-delete-modal-body">
          {t('smsTemplate.modals.deleteBody')}
        </div>
      </UnifiedModal>

      <UnifiedModal
        isOpen={globalEnableModalOpen}
        onClose={() => setGlobalEnableModalOpen(false)}
        title={t('smsTemplate.globalDispatch.title')}
        subtitle={t('smsTemplate.globalDispatch.confirmOn')}
        variant="alert"
        actions={
          <ActionBar align="end" gap="md">
            <ActionBarButton variant="outline" onClick={() => setGlobalEnableModalOpen(false)} disabled={submitting}>
              {t('common:cancel')}
            </ActionBarButton>
            <ActionBarButton
              variant="primary"
              onClick={() => submitGlobalDispatchToggle(true)}
              loading={submitting}
              data-testid="sms-template-global-dispatch-confirm"
            >
              {t('smsTemplate.dispatch.badge.on')}
            </ActionBarButton>
          </ActionBar>
        }
      >
        <div data-testid="sms-template-global-dispatch-modal-body">
          {t('smsTemplate.globalDispatch.description')}
        </div>
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default SmsTemplateManagementPage;
