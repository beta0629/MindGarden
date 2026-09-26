/**
 * 테넌트 어드민 — 패키지 요금 행의 온라인 상품 내용
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import SettingSwitchRow from '../common/molecules/SettingSwitchRow';
import ShopProductImageUpload from '../shop/organisms/ShopProductImageUpload';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { ADMIN_SHOP_ROUTES } from '../../constants/adminShopApi';
import {
  ADMIN_SHOP_CATALOG_CATEGORY_FIELD_LABEL,
  ADMIN_SHOP_CATALOG_CATEGORY_LEGEND,
  ADMIN_SHOP_FIELD_CODE_PLACEHOLDER,
  ADMIN_SHOP_FIELD_CODE_REQUIRED_MESSAGE,
  ADMIN_SHOP_PACKAGE_FEE_CONTENT_SAVED,
  ADMIN_SHOP_PACKAGE_FEE_DESCRIPTION_LABEL,
  ADMIN_SHOP_PACKAGE_FEE_IDENTITY_HINT,
  ADMIN_SHOP_PACKAGE_FEE_NOT_READY_MESSAGE,
  ADMIN_SHOP_PACKAGE_FEE_PRICE_LABEL,
  ADMIN_SHOP_PACKAGE_FEE_SORT_LABEL,
  ADMIN_SHOP_SKU_FORM_PAGE_TITLE_EDIT,
  ADMIN_SHOP_SKU_IMAGE_REQUIRED_MESSAGE,
  ADMIN_SHOP_SKU_LIST_SESSION_COUNT_COLUMN,
  ADMIN_SHOP_SKU_TEST_IDS,
  ADMIN_SHOP_DESCRIPTION_MAX_LENGTH
} from '../../constants/adminShopCatalog';
import {
  getAdminShopPackageFee,
  patchAdminShopPackageFeeVisible,
  updateAdminShopPackageFeeContent,
  uploadAdminShopCatalogSkuThumbnail
} from '../../services/adminShopCatalogService';
import {
  buildAdminShopPackageContentBody,
  mapAdminShopPackageFeeToForm,
  resolveAdminShopFieldCodeGroup,
  validateAdminShopCatalogFieldCode
} from '../../utils/adminShopCatalogForm';
import { getTenantCodes } from '../../utils/commonCodeApi';
import {
  SHOP_CATALOG_CATEGORY,
  SHOP_CATEGORY_TABS
} from '../../constants/clientShopConstants';
import { formatShopMoney } from '../../utils/clientShopFormat';
import { toDisplayString } from '../../utils/safeDisplay';
import {
  generateShopCatalogPlaceholderDataUri,
  isShopCatalogPlaceholderUrl
} from '../../utils/shopCatalogThumbnail';
import notificationManager from '../../utils/notification';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/shop/AdminShopClinicOs.css';
import './AdminShopCatalogSkuEditorPage.css';
import { useTranslation } from 'react-i18next';

const AdminShopCatalogSkuEditorPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { packageCode } = useParams();
  const baseId = useId();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(mapAdminShopPackageFeeToForm(null));
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fieldOptions, setFieldOptions] = useState([]);

  const loadFee = useCallback(async() => {
    if (!packageCode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAdminShopPackageFee(packageCode);
      if (!data) {
        notificationManager.error('패키지를 찾을 수 없습니다.');
        navigate(ADMIN_SHOP_ROUTES.CATALOG_SKUS, { replace: true });
        return;
      }
      setForm(mapAdminShopPackageFeeToForm(data));
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : '패키지 요금을 불러오지 못했습니다.'
      );
      navigate(ADMIN_SHOP_ROUTES.CATALOG_SKUS, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [packageCode, navigate]);

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
    loadFee();
  }, [sessionLoading, isLoggedIn, user, allowed, navigate, loadFee]);

  const fieldGroup = resolveAdminShopFieldCodeGroup(form.catalogCategory);
  const fieldLabel = form.catalogCategory === SHOP_CATALOG_CATEGORY.ASSESSMENT
    ? ADMIN_SHOP_CATALOG_CATEGORY_FIELD_LABEL.ASSESSMENT
    : ADMIN_SHOP_CATALOG_CATEGORY_FIELD_LABEL.CONSULTATION;

  useEffect(() => {
    let cancelled = false;
    getTenantCodes(fieldGroup)
      .then((rows) => {
        if (cancelled) {
          return;
        }
        const options = (Array.isArray(rows) ? rows : [])
          .filter((row) => row && row.isActive !== false)
          .map((row) => {
            const codeValue = toDisplayString(row.codeValue, '').trim();
            const label = toDisplayString(row.koreanName, '').trim()
              || toDisplayString(row.codeLabel, '').trim()
              || codeValue;
            return { codeValue, label };
          })
          .filter((row) => row.codeValue);
        setFieldOptions(options);
      })
      .catch(() => {
        if (!cancelled) {
          setFieldOptions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fieldGroup]);

  const fieldSelectOptions = useMemo(() => {
    const current = toDisplayString(form.fieldCode, '').trim();
    if (current && !fieldOptions.some((row) => row.codeValue === current)) {
      return [{ codeValue: current, label: current }, ...fieldOptions];
    }
    return fieldOptions;
  }, [fieldOptions, form.fieldCode]);

  const hasThumbnail = Boolean(
    pendingImageFile || (form.thumbnailUrl && String(form.thumbnailUrl).trim())
  );

  const handleSave = async() => {
    const wantVisible = form.catalogVisible === true;
    if (wantVisible && !form.priceReady) {
      notificationManager.show(ADMIN_SHOP_PACKAGE_FEE_NOT_READY_MESSAGE, 'warning');
      return;
    }
    if (wantVisible && !hasThumbnail) {
      notificationManager.show(ADMIN_SHOP_SKU_IMAGE_REQUIRED_MESSAGE, 'warning');
      return;
    }
    const fieldParsed = validateAdminShopCatalogFieldCode(form);
    if (!fieldParsed.valid) {
      notificationManager.show(
        fieldParsed.message || ADMIN_SHOP_FIELD_CODE_REQUIRED_MESSAGE,
        'warning'
      );
      return;
    }
    const hasSavedThumb = Boolean(form.thumbnailUrl && String(form.thumbnailUrl).trim());
    const visibleOnFirstPut = wantVisible && hasSavedThumb && !pendingImageFile;
    setSaving(true);
    try {
      const body = buildAdminShopPackageContentBody({
        ...form,
        catalogVisible: visibleOnFirstPut
      });
      const saved = await updateAdminShopPackageFeeContent(packageCode, body);
      const savedId = saved?.skuId;
      if (savedId == null) {
        throw new Error('상품 내용을 저장하지 못했습니다.');
      }
      if (pendingImageFile) {
        try {
          await uploadAdminShopCatalogSkuThumbnail(savedId, pendingImageFile);
        } catch (uploadErr) {
          const detail = uploadErr?.message != null ? String(uploadErr.message) : '알 수 없는 오류';
          throw new Error(`썸네일 업로드 실패: ${detail}`);
        }
      }
      if (wantVisible && !visibleOnFirstPut) {
        await patchAdminShopPackageFeeVisible(packageCode, true);
      }
      notificationManager.show(ADMIN_SHOP_PACKAGE_FEE_CONTENT_SAVED, 'success');
      navigate(ADMIN_SHOP_ROUTES.CATALOG_SKUS, { replace: true });
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const pendingPreviewUrl = useMemo(() => {
    if (!pendingImageFile) {
      return null;
    }
    return URL.createObjectURL(pendingImageFile);
  }, [pendingImageFile]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
    };
  }, [pendingPreviewUrl]);

  const editorPreviewUrl = useMemo(() => {
    if (pendingPreviewUrl) {
      return pendingPreviewUrl;
    }
    const saved = toDisplayString(form.thumbnailUrl, '').trim();
    if (saved && !isShopCatalogPlaceholderUrl(saved)) {
      return saved;
    }
    return generateShopCatalogPlaceholderDataUri({
      title: form.packageName
    });
  }, [pendingPreviewUrl, form.thumbnailUrl, form.packageName]);

  const priceLabel = form.unitPriceMinor != null
    ? formatShopMoney(form.unitPriceMinor)
    : '—';
  const sessionLabel = form.sessionCount != null ? String(form.sessionCount) : '—';

  return (
    <AdminCommonLayout title={ADMIN_SHOP_SKU_FORM_PAGE_TITLE_EDIT} loading={loading}>
      <div
        className="mg-v2-ad-b0kla admin-shop-sku-editor"
        data-testid={ADMIN_SHOP_SKU_TEST_IDS.FORM_PAGE}
      >
        <ContentArea>
          <ContentHeader
            title={ADMIN_SHOP_SKU_FORM_PAGE_TITLE_EDIT}
            subtitle={ADMIN_SHOP_PACKAGE_FEE_IDENTITY_HINT}
            actions={(
              <>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName('secondary')}
                  disabled={saving}
                  onClick={() => navigate(ADMIN_SHOP_ROUTES.CATALOG_SKUS)}
                >
                  {t('admin.actions.cancel')}
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
            <div className="admin-shop-sku-editor__sections">
              <section className="admin-shop-sku-editor__section" aria-labelledby={`${baseId}-image`}>
                <h2 id={`${baseId}-image`} className="admin-shop-sku-editor__section-title">
                  대표 이미지
                </h2>
                <ShopProductImageUpload
                  previewUrl={editorPreviewUrl}
                  onFileSelect={(file) => setPendingImageFile(file)}
                  onClear={() => {
                    setPendingImageFile(null);
                    setForm((current) => ({ ...current, thumbnailUrl: '' }));
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
                  <p className="mg-v2-label">상품명</p>
                  <p
                    className="admin-shop-sku-editor__sku-code-readonly"
                    data-testid={ADMIN_SHOP_SKU_TEST_IDS.TITLE_READONLY}
                  >
                    <SafeText>{toDisplayString(form.packageName, '—')}</SafeText>
                  </p>

                  <p className="mg-v2-label">{ADMIN_SHOP_PACKAGE_FEE_PRICE_LABEL}</p>
                  <p
                    className="admin-shop-sku-editor__sku-code-readonly"
                    data-testid={ADMIN_SHOP_SKU_TEST_IDS.PRICE_READONLY}
                  >
                    <SafeText>{priceLabel}</SafeText>
                  </p>

                  <p className="mg-v2-label">{ADMIN_SHOP_SKU_LIST_SESSION_COUNT_COLUMN}</p>
                  <p className="admin-shop-sku-editor__sku-code-readonly">
                    <SafeText>{sessionLabel}</SafeText>
                  </p>

                  <fieldset
                    className="admin-shop-sku-editor__category-fieldset"
                    data-testid={ADMIN_SHOP_SKU_TEST_IDS.CATEGORY_FIELDSET}
                  >
                    <legend className="mg-v2-label">
                      {ADMIN_SHOP_CATALOG_CATEGORY_LEGEND}
                      <span className="form-input-required">*</span>
                    </legend>
                    <div className="admin-shop-sku-editor__category-options">
                      {SHOP_CATEGORY_TABS.map((tab) => (
                        <label className="mg-v2-label" key={tab.key} htmlFor={`${baseId}-cat-${tab.key}`}>
                          <input
                            id={`${baseId}-cat-${tab.key}`}
                            type="radio"
                            name={`${baseId}-catalog-category`}
                            value={tab.key}
                            checked={form.catalogCategory === tab.key}
                            disabled={saving}
                            onChange={() => setForm((current) => ({
                              ...current,
                              catalogCategory: tab.key,
                              fieldCode: current.catalogCategory === tab.key ? current.fieldCode : ''
                            }))}
                          />
                          {tab.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="mg-v2-label" htmlFor={`${baseId}-field`}>
                    {fieldLabel}
                    <span className="form-input-required">*</span>
                  </label>
                  <select
                    id={`${baseId}-field`}
                    className="mg-v2-input"
                    value={toDisplayString(form.fieldCode, '')}
                    required
                    aria-required="true"
                    disabled={saving}
                    data-testid={ADMIN_SHOP_SKU_TEST_IDS.FIELD_CODE_SELECT}
                    onChange={(e) => setForm((current) => ({
                      ...current,
                      fieldCode: e.target.value
                    }))}
                  >
                    <option value="">{ADMIN_SHOP_FIELD_CODE_PLACEHOLDER}</option>
                    {fieldSelectOptions.map((option) => (
                      <option key={option.codeValue} value={option.codeValue}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <label className="mg-v2-label" htmlFor={`${baseId}-desc`}>
                    {ADMIN_SHOP_PACKAGE_FEE_DESCRIPTION_LABEL}
                  </label>
                  <textarea
                    id={`${baseId}-desc`}
                    className="mg-v2-input"
                    rows={4}
                    maxLength={ADMIN_SHOP_DESCRIPTION_MAX_LENGTH}
                    value={form.descriptionText}
                    onChange={(e) => setForm((current) => ({
                      ...current,
                      descriptionText: e.target.value
                    }))}
                  />

                  <label className="mg-v2-label" htmlFor={`${baseId}-sort`}>
                    {ADMIN_SHOP_PACKAGE_FEE_SORT_LABEL}
                  </label>
                  <input
                    id={`${baseId}-sort`}
                    className="mg-v2-input"
                    inputMode="numeric"
                    value={form.sortOrder}
                    onChange={(e) => setForm((current) => ({
                      ...current,
                      sortOrder: e.target.value
                    }))}
                  />

                  <SettingSwitchRow
                    id={`${baseId}-catalog-visible`}
                    label="카탈로그 노출"
                    checked={form.catalogVisible === true}
                    onCheckedChange={(next) => setForm((current) => ({
                      ...current,
                      catalogVisible: next
                    }))}
                    ariaLabel="카탈로그 노출"
                    disabled={saving}
                  />
                </div>
              </section>
            </div>
          </ContentSection>
        </ContentArea>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminShopCatalogSkuEditorPage;
