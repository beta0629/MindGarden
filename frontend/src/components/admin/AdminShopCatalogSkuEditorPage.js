/**
 * 테넌트 어드민 — 온라인 카탈로그 SKU 등록/수정 전용 페이지 (MVP+)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import ShopProductImageUpload from '../shop/organisms/ShopProductImageUpload';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { ADMIN_SHOP_ROUTES } from '../../constants/adminShopApi';
import {
  ADMIN_SHOP_SKU_FORM_PAGE_TITLE_CREATE,
  ADMIN_SHOP_SKU_FORM_PAGE_TITLE_EDIT,
  ADMIN_SHOP_SKU_FORM_SKU_CODE_LABEL,
  ADMIN_SHOP_SKU_FORM_SKU_CODE_PLACEHOLDER,
  ADMIN_SHOP_SKU_IMAGE_REQUIRED_MESSAGE,
  ADMIN_SHOP_SKU_TITLE_REQUIRED_MESSAGE,
  ADMIN_SHOP_SKU_TEST_IDS
} from '../../constants/adminShopCatalog';
import { SHOP_CATEGORY_TABS } from '../../constants/clientShopConstants';
import {
  createAdminShopCatalogSku,
  getAdminShopCatalogSku,
  updateAdminShopCatalogSku,
  uploadAdminShopCatalogSkuThumbnail
} from '../../services/adminShopCatalogService';
import {
  ADMIN_SHOP_SKU_TITLE_MAX,
  buildAdminShopCatalogUpsertBody,
  emptyAdminShopCatalogForm,
  mapAdminShopCatalogRowToForm
} from '../../utils/adminShopCatalogForm';
import { toDisplayString } from '../../utils/safeDisplay';
import notificationManager from '../../utils/notification';
import { USER_ROLES } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './AdminShopCatalogSkuEditorPage.css';

const AdminShopCatalogSkuEditorPage = ({ isNew: isNewProp = false }) => {
  const navigate = useNavigate();
  const { skuId } = useParams();
  const baseId = useId();
  const isNew = isNewProp === true;
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF);

  const [loading, setLoading] = useState(!isNew);
  const [form, setForm] = useState(emptyAdminShopCatalogForm);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadSku = useCallback(async() => {
    if (isNew || skuId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAdminShopCatalogSku(skuId);
      if (!data) {
        notificationManager.error('상품을 찾을 수 없습니다.');
        navigate(ADMIN_SHOP_ROUTES.CATALOG_SKUS, { replace: true });
        return;
      }
      setForm(mapAdminShopCatalogRowToForm(data));
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : '상품 상세를 불러오지 못했습니다.'
      );
      navigate(ADMIN_SHOP_ROUTES.CATALOG_SKUS, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [isNew, skuId, navigate]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!allowed) {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      navigate('/', { replace: true });
      return;
    }
    loadSku();
  }, [sessionLoading, isLoggedIn, user, allowed, navigate, loadSku]);

  const hasThumbnail = Boolean(
    pendingImageFile || (form.thumbnailUrl && form.thumbnailUrl.trim())
  );

  const handleSave = async() => {
    if (!form.title.trim()) {
      notificationManager.show(ADMIN_SHOP_SKU_TITLE_REQUIRED_MESSAGE, 'warning');
      return;
    }
    if (!hasThumbnail) {
      notificationManager.show(ADMIN_SHOP_SKU_IMAGE_REQUIRED_MESSAGE, 'warning');
      return;
    }
    setSaving(true);
    try {
      const body = buildAdminShopCatalogUpsertBody(form);
      let savedId = skuId;
      if (isNew) {
        const created = await createAdminShopCatalogSku(body);
        savedId = created?.id;
        if (savedId == null) {
          throw new Error('상품 ID를 확인할 수 없습니다.');
        }
      } else if (skuId != null) {
        await updateAdminShopCatalogSku(skuId, body);
      }
      if (pendingImageFile && savedId != null) {
        await uploadAdminShopCatalogSkuThumbnail(savedId, pendingImageFile);
      }
      notificationManager.show(
        isNew ? '상품이 등록되었습니다.' : '상품이 수정되었습니다.',
        'success'
      );
      navigate(ADMIN_SHOP_ROUTES.CATALOG_SKUS, { replace: true });
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isNew
    ? ADMIN_SHOP_SKU_FORM_PAGE_TITLE_CREATE
    : ADMIN_SHOP_SKU_FORM_PAGE_TITLE_EDIT;

  const skuCodeDisplay = isNew
    ? ADMIN_SHOP_SKU_FORM_SKU_CODE_PLACEHOLDER
    : toDisplayString(form.skuCode, '—');

  return (
    <AdminCommonLayout title={pageTitle}>
      <div
        className="mg-v2-ad-b0kla admin-shop-sku-editor"
        data-testid={ADMIN_SHOP_SKU_TEST_IDS.FORM_PAGE}
      >
        <ContentArea>
          <ContentHeader
            title={pageTitle}
            description="대표 이미지·상품 정보를 입력한 뒤 저장합니다."
            actions={(
              <>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName('secondary')}
                  disabled={saving}
                  onClick={() => navigate(ADMIN_SHOP_ROUTES.CATALOG_SKUS)}
                >
                  취소
                </MGButton>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName('primary')}
                  disabled={saving || loading}
                  onClick={handleSave}
                  data-testid={ADMIN_SHOP_SKU_TEST_IDS.SAVE_BUTTON}
                >
                  {saving ? ERP_MG_BUTTON_LOADING_TEXT : '저장'}
                </MGButton>
              </>
            )}
          />
          <ContentSection>
            {loading ? (
              <div data-testid={ADMIN_SHOP_SKU_TEST_IDS.FORM_LOADING}>
                <UnifiedLoading message="불러오는 중…" />
              </div>
            ) : (
              <div className="admin-shop-sku-editor__sections">
                <section className="admin-shop-sku-editor__section" aria-labelledby={`${baseId}-image`}>
                  <h2 id={`${baseId}-image`} className="admin-shop-sku-editor__section-title">
                    대표 이미지
                  </h2>
                  <ShopProductImageUpload
                    previewUrl={form.thumbnailUrl || null}
                    onFileSelect={(file) => setPendingImageFile(file)}
                    onClear={() => {
                      setPendingImageFile(null);
                      setForm((f) => ({ ...f, thumbnailUrl: '' }));
                    }}
                    disabled={saving}
                    testId={ADMIN_SHOP_SKU_TEST_IDS.IMAGE_UPLOAD}
                  />
                </section>

                <section className="admin-shop-sku-editor__section" aria-labelledby={`${baseId}-basic`}>
                  <h2 id={`${baseId}-basic`} className="admin-shop-sku-editor__section-title">
                    기본 정보
                  </h2>
                  <div className="mg-v2-form-stack">
                    <label className="mg-v2-label" htmlFor={`${baseId}-sku-code`}>
                      {ADMIN_SHOP_SKU_FORM_SKU_CODE_LABEL}
                    </label>
                    <p
                      id={`${baseId}-sku-code`}
                      className="admin-shop-sku-editor__sku-code-readonly"
                      data-testid={ADMIN_SHOP_SKU_TEST_IDS.SKU_CODE_READONLY}
                    >
                      <SafeText>{skuCodeDisplay}</SafeText>
                    </p>

                    <label className="mg-v2-label" htmlFor={`${baseId}-title`}>
                      상품명
                    </label>
                    <input
                      id={`${baseId}-title`}
                      className="mg-v2-input"
                      maxLength={ADMIN_SHOP_SKU_TITLE_MAX}
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      data-testid={ADMIN_SHOP_SKU_TEST_IDS.TITLE_INPUT}
                    />

                    <label className="mg-v2-label" htmlFor={`${baseId}-price`}>
                      단가(원, 정수)
                    </label>
                    <input
                      id={`${baseId}-price`}
                      className="mg-v2-input"
                      inputMode="numeric"
                      value={form.unitPriceMinor}
                      onChange={(e) => setForm((f) => ({ ...f, unitPriceMinor: e.target.value }))}
                    />

                    <label className="mg-v2-label" htmlFor={`${baseId}-desc`}>
                      설명(선택)
                    </label>
                    <textarea
                      id={`${baseId}-desc`}
                      className="mg-v2-input"
                      rows={4}
                      value={form.descriptionText}
                      onChange={(e) => setForm((f) => ({ ...f, descriptionText: e.target.value }))}
                    />

                    <fieldset className="admin-shop-sku-editor__category-fieldset">
                      <legend className="mg-v2-label">카테고리</legend>
                      <div className="admin-shop-sku-editor__category-options">
                        {SHOP_CATEGORY_TABS.map((tab) => (
                          <label key={tab.key} className="mg-v2-checkbox-row">
                            <input
                              type="radio"
                              name={`${baseId}-catalog-category`}
                              value={tab.key}
                              checked={form.catalogCategory === tab.key}
                              onChange={() =>
                                setForm((f) => ({ ...f, catalogCategory: tab.key }))
                              }
                            />
                            <SafeText>{tab.label}</SafeText>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <label className="mg-v2-label" htmlFor={`${baseId}-sort`}>
                      정렬 순서
                    </label>
                    <input
                      id={`${baseId}-sort`}
                      className="mg-v2-input"
                      inputMode="numeric"
                      value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    />

                    <label className="mg-v2-checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.catalogVisible}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, catalogVisible: e.target.checked }))
                        }
                      />
                      <SafeText>카탈로그 노출</SafeText>
                    </label>
                    <label className="mg-v2-checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                      />
                      <SafeText>판매 활성</SafeText>
                    </label>
                  </div>
                </section>
              </div>
            )}
          </ContentSection>
        </ContentArea>
      </div>
    </AdminCommonLayout>
  );
};

AdminShopCatalogSkuEditorPage.propTypes = {
  isNew: PropTypes.bool
};

export default AdminShopCatalogSkuEditorPage;
