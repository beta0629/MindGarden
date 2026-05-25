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
import { useSession } from '../../../contexts/SessionContext';
import { USER_ROLES, RoleUtils } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import {
  getSmsTemplates,
  updateSmsTemplateTenantOverride,
  deleteSmsTemplateTenantOverride,
  previewSmsTemplate
} from '../../../api/admin/smsTemplateApi';
import './SmsTemplateManagementPage.css';

const ALLOWED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STAFF];
const PAGE_TITLE_ID = 'admin-sms-template-title';

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
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

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

  const pageTitle = t('smsTemplate.page.title');
  const pageSubtitle = t('smsTemplate.page.subtitle');

  if (sessionLoading || !hasAccess) {
    return (
      <AdminCommonLayout title={pageTitle} className="mg-v2-dashboard-layout">
        <UnifiedLoading text={t('common.loading')} />
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
                  <UnifiedLoading text={t('common.loading')} />
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
                          {item.tenantOverride && (
                            <span className="mg-admin-sms-template__item-badge">
                              {t('smsTemplate.list.overrideBadge')}
                            </span>
                          )}
                        </button>
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
                      <h3 className="mg-admin-sms-template__editor-title">
                        {selectedItem.label || selectedItem.key}
                      </h3>
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
          <>
            <MGButton
              type="button"
              variant="secondary"
              onClick={() => setSaveModalOpen(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              onClick={handleSaveConfirm}
              loading={submitting}
              data-testid="sms-template-save-confirm"
            >
              {t('smsTemplate.modals.confirmSave')}
            </MGButton>
          </>
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
          <>
            <MGButton
              type="button"
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </MGButton>
            <MGButton
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={submitting}
              data-testid="sms-template-delete-confirm"
            >
              {t('smsTemplate.modals.confirmDelete')}
            </MGButton>
          </>
        }
      >
        <div data-testid="sms-template-delete-modal-body">
          {t('smsTemplate.modals.deleteBody')}
        </div>
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default SmsTemplateManagementPage;
