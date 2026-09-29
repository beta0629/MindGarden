/**
 * 테넌트 어드민 — 상품 등록·수정 (가격·회기 + 몰 내용 통합)
 * 저장 순서: 공통코드(가격·회기·홈 공개·판매 사용) → 몰 내용 → 대표 이미지 → 몰 노출
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import Switch from '../common/Switch';
import EntityRowActions from '../common/molecules/EntityRowActions';
import ShopProductImageUpload from '../shop/organisms/ShopProductImageUpload';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import {
  ADMIN_SHOP_PRODUCT_DESCRIPTION_MAX,
  ADMIN_SHOP_PRODUCT_EDITOR_COPY,
  ADMIN_SHOP_PRODUCT_ROUTES,
  ADMIN_SHOP_PRODUCT_SESSION_MIN,
  ADMIN_SHOP_PRODUCTS_COPY,
  ADMIN_SHOP_SUITE_TEST_IDS,
  formatAdminShopCopy
} from '../../constants/adminShopSuite';
import {
  ADMIN_SHOP_CATALOG_CATEGORY_FIELD_LABEL,
  ADMIN_SHOP_CONSULTANT_REQUIRED_MESSAGE,
  ADMIN_SHOP_FIELD_CODE_REQUIRED_MESSAGE
} from '../../constants/adminShopCatalog';
import { SHOP_CATALOG_CATEGORY, SHOP_CATEGORY_TABS } from '../../constants/clientShopConstants';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import useConfirm from '../../hooks/useConfirm';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import { formatShopMoney } from '../../utils/clientShopFormat';
import { buildExtraDataString, parseExtraData } from '../../utils/packagePricing';
import { getTenantCodes } from '../../utils/commonCodeApi';
import { getAllConsultantsWithStats } from '../../utils/consultantHelper';
import {
  buildAdminShopPackageContentBody,
  mapTenantConsultantSelectOptions,
  resolveAdminShopFieldCodeGroup,
  validateAdminShopCatalogConsultant,
  validateAdminShopCatalogFieldCode
} from '../../utils/adminShopCatalogForm';
import { isShopCatalogPlaceholderUrl } from '../../utils/shopCatalogThumbnail';
import {
  computeAdminShopPerSessionPrice,
  emptyAdminShopProductForm,
  mapAdminShopProductToForm,
  mergeAdminShopProducts,
  validateAdminShopProductForm
} from '../../utils/adminShopSuite';
import {
  buildAdminShopProductCodePutBody,
  createAdminShopProductCode,
  listAdminShopProductSources,
  setAdminShopProductMallVisible,
  updateAdminShopProductCode
} from '../../services/adminShopProductService';
import {
  updateAdminShopPackageFeeContent,
  uploadAdminShopCatalogSkuThumbnail
} from '../../services/adminShopCatalogService';
import { AdminShopNotice } from './shop/AdminShopSuiteParts';
import '../../styles/unified-design-tokens.css';
import '../../styles/shop/AdminShopClinicOs.css';
import '../../styles/shop/AdminShopSuite.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_TITLE_ID = 'admin-shop-product-editor-title';

/**
 * @param {Array<object>} products
 * @param {string|undefined} id 패키지 코드 또는 공통코드 id
 * @returns {object|null}
 */
function findProduct(products, id) {
  if (!id) {
    return null;
  }
  const key = String(id);
  return products.find((p) => p.code === key)
    || products.find((p) => p.codeId != null && String(p.codeId) === key)
    || null;
}

/**
 * @param {object} form
 * @returns {boolean}
 */
function hasMallContentInput(form, pendingImageFile) {
  return Boolean(
    form.mallVisible
    || pendingImageFile
    || toDisplayString(form.descriptionText, '').trim()
    || toDisplayString(form.fieldCode, '').trim()
    || toDisplayString(form.consultantId, '').trim()
  );
}

function AdminShopProductEditorPage({ isNew }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const baseId = useId();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);
  const [confirm, ConfirmModal] = useConfirm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(emptyAdminShopProductForm);
  const [initialForm, setInitialForm] = useState(emptyAdminShopProductForm);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [touched, setTouched] = useState(false);
  const [brokenPreviewUrl, setBrokenPreviewUrl] = useState('');
  const [fieldOptions, setFieldOptions] = useState([]);
  const [consultantOptions, setConsultantOptions] = useState([]);
  const savedRef = useRef(false);

  const loadProduct = useCallback(async() => {
    setLoading(true);
    try {
      const sources = await listAdminShopProductSources();
      const merged = mergeAdminShopProducts(sources);
      setProducts(merged);
      if (isNew) {
        const next = emptyAdminShopProductForm();
        setProduct(null);
        setForm(next);
        setInitialForm(next);
        return;
      }
      const found = findProduct(merged, id);
      if (!found || !found.codeRow) {
        notificationManager.error(ADMIN_SHOP_PRODUCT_EDITOR_COPY.NOT_FOUND);
        navigate(ADMIN_SHOP_PRODUCT_ROUTES.LIST, { replace: true });
        return;
      }
      const next = mapAdminShopProductToForm(found);
      setProduct(found);
      setForm(next);
      setInitialForm(next);
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : ADMIN_SHOP_PRODUCT_EDITOR_COPY.NOT_FOUND);
      navigate(ADMIN_SHOP_PRODUCT_ROUTES.LIST, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, isNew, navigate]);

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
    loadProduct();
  }, [sessionLoading, isLoggedIn, user?.id, allowed, navigate, loadProduct]);

  const isConsultation = form.catalogCategory !== SHOP_CATALOG_CATEGORY.ASSESSMENT;
  const fieldGroup = resolveAdminShopFieldCodeGroup(form.catalogCategory);

  useEffect(() => {
    let cancelled = false;
    getTenantCodes(fieldGroup)
      .then((rows) => {
        if (cancelled) {
          return;
        }
        setFieldOptions((Array.isArray(rows) ? rows : [])
          .filter((row) => row && row.isActive !== false && row.codeValue)
          .map((row) => ({
            value: toDisplayString(row.codeValue, ''),
            label: toDisplayString(row.koreanName || row.codeLabel || row.codeValue, '')
          })));
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

  useEffect(() => {
    if (!isConsultation) {
      return undefined;
    }
    let cancelled = false;
    getAllConsultantsWithStats()
      .then((rows) => {
        if (!cancelled) {
          setConsultantOptions(mapTenantConsultantSelectOptions(rows));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConsultantOptions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isConsultation]);

  const dirty = useMemo(
    () => Boolean(pendingImageFile) || JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm, pendingImageFile]
  );

  useEffect(() => {
    if (!dirty) {
      return undefined;
    }
    const handler = (event) => {
      if (savedRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const validation = validateAdminShopProductForm(form);
  const showErrors = touched;
  const perSession = computeAdminShopPerSessionPrice(validation.price, validation.sessions);
  const hasComposition = form.items.length > 0;

  const pendingPreviewUrl = useMemo(
    () => (pendingImageFile ? URL.createObjectURL(pendingImageFile) : null),
    [pendingImageFile]
  );

  useEffect(() => () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
  }, [pendingPreviewUrl]);

  const savedThumb = toDisplayString(form.thumbnailUrl, '').trim();
  const previewUrl = pendingPreviewUrl
    || (savedThumb && !isShopCatalogPlaceholderUrl(savedThumb) ? savedThumb : null);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const stepSessions = (delta) => {
    const current = Number.parseInt(form.sessions, 10);
    const base = Number.isFinite(current) ? current : 0;
    setField('sessions', String(Math.max(0, base + delta)));
  };

  const goList = async() => {
    if (dirty && !savedRef.current) {
      const ok = await confirm({
        title: ADMIN_SHOP_PRODUCT_EDITOR_COPY.LEAVE_TITLE,
        message: ADMIN_SHOP_PRODUCT_EDITOR_COPY.LEAVE_MESSAGE,
        confirmLabel: ADMIN_SHOP_PRODUCT_EDITOR_COPY.LEAVE_CONFIRM,
        cancelLabel: ADMIN_SHOP_PRODUCT_EDITOR_COPY.LEAVE_CANCEL,
        variant: 'warning'
      });
      if (!ok) {
        return;
      }
    }
    navigate(ADMIN_SHOP_PRODUCT_ROUTES.LIST);
  };

  const handleSave = async() => {
    setTouched(true);
    if (!validation.valid) {
      return;
    }
    const validityChanged = toDisplayString(form.validityMonths, '').trim()
      !== toDisplayString(initialForm.validityMonths, '').trim();
    const needsContent = hasMallContentInput(form, pendingImageFile) || validityChanged;
    if (needsContent) {
      const fieldParsed = validateAdminShopCatalogFieldCode(form);
      if (!fieldParsed.valid) {
        notificationManager.show(fieldParsed.message || ADMIN_SHOP_FIELD_CODE_REQUIRED_MESSAGE, 'warning');
        return;
      }
      const consultantParsed = validateAdminShopCatalogConsultant(form);
      if (!consultantParsed.valid) {
        notificationManager.show(consultantParsed.message || ADMIN_SHOP_CONSULTANT_REQUIRED_MESSAGE, 'warning');
        return;
      }
      if (form.mallVisible && !pendingImageFile && !previewUrl) {
        notificationManager.show(ADMIN_SHOP_PRODUCT_EDITOR_COPY.MALL_NEEDS_IMAGE, 'warning');
        return;
      }
    }
    const prevExtra = parseExtraData(product?.codeRow?.extraData);
    const extraData = buildExtraDataString(
      validation.sessions,
      validation.price,
      form.remark.trim(),
      form.items,
      form.discountRate,
      hasComposition ? form.originalPrice : (prevExtra.originalPrice ?? validation.price),
      form.homePublic
    );
    const name = form.name.trim();
    setSaving(true);
    try {
      let packageCode = product?.code;
      if (isNew) {
        const created = await createAdminShopProductCode({
          codeLabel: name,
          koreanName: name,
          codeDescription: form.remark.trim() || null,
          sortOrder: products.length,
          isActive: form.active,
          extraData
        });
        packageCode = toDisplayString(created?.codeValue, '');
      } else {
        await updateAdminShopProductCode(product.codeRow.id, buildAdminShopProductCodePutBody(product.codeRow, {
          codeLabel: name,
          koreanName: name,
          codeDescription: form.remark.trim() || null,
          isActive: form.active,
          extraData
        }));
      }
      if (packageCode && needsContent) {
        const visibleOnFirstPut = form.mallVisible && Boolean(savedThumb) && !pendingImageFile;
        const saved = await updateAdminShopPackageFeeContent(packageCode, buildAdminShopPackageContentBody({
          ...form,
          descriptionText: form.descriptionText.slice(0, ADMIN_SHOP_PRODUCT_DESCRIPTION_MAX),
          catalogVisible: visibleOnFirstPut,
          validityMonths: validation.validityMonths
        }));
        if (pendingImageFile && saved?.skuId != null) {
          await uploadAdminShopCatalogSkuThumbnail(saved.skuId, pendingImageFile);
        }
        if (form.mallVisible && !visibleOnFirstPut) {
          await setAdminShopProductMallVisible({ kind: product?.kind, code: packageCode }, true);
        }
      } else if (packageCode && product && product.mallVisible !== form.mallVisible) {
        await setAdminShopProductMallVisible(product, form.mallVisible);
      }
      savedRef.current = true;
      notificationManager.success(ADMIN_SHOP_PRODUCT_EDITOR_COPY.SAVED);
      navigate(ADMIN_SHOP_PRODUCT_ROUTES.LIST, { replace: true });
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : ADMIN_SHOP_PRODUCT_EDITOR_COPY.SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const title = isNew ? ADMIN_SHOP_PRODUCT_EDITOR_COPY.TITLE_NEW : (form.name || initialForm.name);
  const fieldLabel = isConsultation
    ? ADMIN_SHOP_CATALOG_CATEGORY_FIELD_LABEL.CONSULTATION
    : ADMIN_SHOP_CATALOG_CATEGORY_FIELD_LABEL.ASSESSMENT;
  const sessionsInvalid = showErrors && validation.errors.sessions;
  const saveDisabled = saving || loading || Boolean(validation.errors.sessions)
    || Boolean(validation.errors.validityMonths);
  const validityInvalid = Boolean(validation.errors.validityMonths);
  const priceText = validation.price != null ? formatShopMoney(validation.price) : '—';
  const sessionsText = validation.sessions != null && validation.sessions >= ADMIN_SHOP_PRODUCT_SESSION_MIN
    ? `${validation.sessions}${ADMIN_SHOP_PRODUCTS_COPY.SESSION_UNIT}`
    : ADMIN_SHOP_PRODUCTS_COPY.SESSION_UNSET;

  return (
    <AdminCommonLayout title={title} loading={loading}>
      <ContentArea className="admin-shop-clinic-os admin-shop-suite" ariaLabel={title}>
        <div className="admin-shop-suite" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_EDITOR}>
          <ContentHeader
            titleId={PAGE_TITLE_ID}
            title={isNew ? title : (
              <span className="admin-shop-suite__modal-title">
                <SafeText>{title}</SafeText>
                <span
                  className={`admin-shop-suite__chip ${initialForm.active ? 'admin-shop-suite__chip--on-sale' : 'admin-shop-suite__chip--stopped'}`}
                >
                  {initialForm.active ? ADMIN_SHOP_PRODUCTS_COPY.STATUS_ON_SALE : ADMIN_SHOP_PRODUCTS_COPY.STATUS_STOPPED}
                </span>
              </span>
            )}
            subtitle={isNew
              ? ADMIN_SHOP_PRODUCT_EDITOR_COPY.SUBTITLE_NEW
              : formatAdminShopCopy(ADMIN_SHOP_PRODUCT_EDITOR_COPY.SUBTITLE_EDIT, {
                code: toDisplayString(product?.code, '—')
              })}
            actions={(
              <div className="admin-shop-suite__header-actions">
                <MGButton
                  type="button"
                  variant="secondary"
                  className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
                  onClick={goList}
                  disabled={saving}
                >
                  {ADMIN_SHOP_PRODUCT_EDITOR_COPY.LIST}
                </MGButton>
                {!isNew && product ? (
                  <EntityRowActions
                    ariaLabel={ADMIN_SHOP_PRODUCT_EDITOR_COPY.MENU_ARIA}
                    items={[
                      {
                        id: 'stop',
                        label: ADMIN_SHOP_PRODUCT_EDITOR_COPY.MENU_STOP,
                        variant: 'destructive',
                        hidden: !form.active,
                        onClick: () => setForm((prev) => ({ ...prev, active: false, homePublic: false, mallVisible: false }))
                      }
                    ]}
                  />
                ) : null}
                <MGButton
                  type="button"
                  variant="primary"
                  className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: saving })}
                  onClick={handleSave}
                  disabled={saveDisabled}
                  loading={saving}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_EDITOR_SAVE}
                >
                  {ADMIN_SHOP_PRODUCT_EDITOR_COPY.SAVE}
                </MGButton>
              </div>
            )}
          />

          <div className="admin-shop-suite__layout admin-shop-suite__layout--editor">
            <div className="admin-shop-suite__form-stack">
              <section className="admin-shop-suite__card" aria-labelledby={`${baseId}-price`}>
                <div className="admin-shop-suite__card-head">
                  <h2 id={`${baseId}-price`} className="admin-shop-suite__card-title">
                    {ADMIN_SHOP_PRODUCT_EDITOR_COPY.SECTION_PRICE}
                  </h2>
                  <span className="admin-shop-suite__card-hint">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.SECTION_PRICE_HINT}</span>
                </div>
                <div className="admin-shop-suite__grid-3">
                  <div className="admin-shop-suite__field">
                    <label className="admin-shop-suite__label" htmlFor={`${baseId}-sessions`}>
                      {ADMIN_SHOP_PRODUCT_EDITOR_COPY.SESSIONS}
                      <span className="admin-shop-suite__required" aria-hidden="true">*</span>
                    </label>
                    <div className={`admin-shop-suite__stepper${sessionsInvalid || validation.errors.sessions ? ' admin-shop-suite__stepper--error' : ''}`}>
                      <button
                        type="button"
                        aria-label={ADMIN_SHOP_PRODUCT_EDITOR_COPY.SESSIONS_DEC}
                        disabled={hasComposition || saving}
                        onClick={() => stepSessions(-1)}
                      >
                        −
                      </button>
                      <input
                        id={`${baseId}-sessions`}
                        inputMode="numeric"
                        value={form.sessions}
                        readOnly={hasComposition}
                        aria-invalid={validation.errors.sessions ? true : undefined}
                        data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_EDITOR_SESSIONS}
                        onChange={(e) => setField('sessions', e.target.value.replace(/\D/g, ''))}
                      />
                      <button
                        type="button"
                        aria-label={ADMIN_SHOP_PRODUCT_EDITOR_COPY.SESSIONS_INC}
                        disabled={hasComposition || saving}
                        onClick={() => stepSessions(1)}
                      >
                        +
                      </button>
                    </div>
                    <span className={`admin-shop-suite__hint${validation.errors.sessions ? ' admin-shop-suite__hint--error' : ''}`}>
                      {validation.errors.sessions
                        ? ADMIN_SHOP_PRODUCT_EDITOR_COPY.SESSIONS_ERROR
                        : ADMIN_SHOP_PRODUCT_EDITOR_COPY.SESSIONS_HINT}
                    </span>
                  </div>
                  <div className="admin-shop-suite__field">
                    <label className="admin-shop-suite__label" htmlFor={`${baseId}-price-input`}>
                      {ADMIN_SHOP_PRODUCT_EDITOR_COPY.PRICE}
                      <span className="admin-shop-suite__required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`${baseId}-price-input`}
                      className={`admin-shop-suite__input admin-shop-suite__num${showErrors && validation.errors.price ? ' admin-shop-suite__input--error' : ''}`}
                      inputMode="numeric"
                      value={form.price}
                      readOnly={hasComposition}
                      aria-invalid={showErrors && validation.errors.price ? true : undefined}
                      onChange={(e) => setField('price', e.target.value.replace(/\D/g, ''))}
                    />
                    <span className={`admin-shop-suite__hint${showErrors && validation.errors.price ? ' admin-shop-suite__hint--error' : ''}`}>
                      {showErrors && validation.errors.price
                        ? ADMIN_SHOP_PRODUCT_EDITOR_COPY.PRICE_ERROR
                        : ADMIN_SHOP_PRODUCT_EDITOR_COPY.PRICE_HINT}
                    </span>
                  </div>
                  <div className="admin-shop-suite__field">
                    <span className="admin-shop-suite__label">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.PER_SESSION}</span>
                    <span className="admin-shop-suite__readout">
                      <SafeText>{perSession != null ? formatShopMoney(perSession) : '—'}</SafeText>
                    </span>
                    <span className="admin-shop-suite__hint">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.PER_SESSION_HINT}</span>
                  </div>
                </div>
                <div className="admin-shop-suite__field admin-shop-suite__validity-field">
                  <label className="admin-shop-suite__label" htmlFor={`${baseId}-validity`}>
                    {ADMIN_SHOP_PRODUCT_EDITOR_COPY.VALIDITY}
                  </label>
                  <div className="admin-shop-suite__affix">
                    <span className="admin-shop-suite__affix-text">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.VALIDITY_PREFIX}</span>
                    <input
                      id={`${baseId}-validity`}
                      className={`admin-shop-suite__input admin-shop-suite__num admin-shop-suite__affix-input${validityInvalid ? ' admin-shop-suite__input--error' : ''}`}
                      inputMode="numeric"
                      value={form.validityMonths}
                      disabled={saving}
                      aria-invalid={validityInvalid ? true : undefined}
                      aria-describedby={`${baseId}-validity-hint`}
                      data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PRODUCT_EDITOR_VALIDITY}
                      onChange={(e) => setField('validityMonths', e.target.value.replace(/\D/g, ''))}
                    />
                    <span className="admin-shop-suite__affix-text">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.VALIDITY_SUFFIX}</span>
                  </div>
                  <span
                    id={`${baseId}-validity-hint`}
                    className={`admin-shop-suite__hint${validityInvalid ? ' admin-shop-suite__hint--error' : ''}`}
                  >
                    {validityInvalid
                      ? ADMIN_SHOP_PRODUCT_EDITOR_COPY.VALIDITY_ERROR
                      : ADMIN_SHOP_PRODUCT_EDITOR_COPY.VALIDITY_HINT}
                  </span>
                </div>
                <AdminShopNotice icon={<Info size={14} aria-hidden="true" />}>
                  <p>{ADMIN_SHOP_PRODUCTS_COPY.USAGE_PERIOD_NOTICE}</p>
                  <p className="admin-shop-suite__muted">{ADMIN_SHOP_PRODUCTS_COPY.USAGE_PERIOD_EXPIRY_NOTE}</p>
                </AdminShopNotice>
              </section>

              <section className="admin-shop-suite__card" aria-labelledby={`${baseId}-basic`}>
                <div className="admin-shop-suite__card-head">
                  <h2 id={`${baseId}-basic`} className="admin-shop-suite__card-title">
                    {ADMIN_SHOP_PRODUCT_EDITOR_COPY.SECTION_BASIC}
                  </h2>
                </div>
                <div className="admin-shop-suite__field">
                  <label className="admin-shop-suite__label" htmlFor={`${baseId}-name`}>
                    {ADMIN_SHOP_PRODUCT_EDITOR_COPY.NAME}
                    <span className="admin-shop-suite__required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id={`${baseId}-name`}
                    className={`admin-shop-suite__input${showErrors && validation.errors.name ? ' admin-shop-suite__input--error' : ''}`}
                    value={form.name}
                    aria-invalid={showErrors && validation.errors.name ? true : undefined}
                    onChange={(e) => setField('name', e.target.value)}
                  />
                  {showErrors && validation.errors.name ? (
                    <span className="admin-shop-suite__hint admin-shop-suite__hint--error">
                      {ADMIN_SHOP_PRODUCT_EDITOR_COPY.NAME_ERROR}
                    </span>
                  ) : null}
                </div>
                <div className="admin-shop-suite__grid-2">
                  <div className="admin-shop-suite__field">
                    <span className="admin-shop-suite__label">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.CATEGORY}</span>
                    <div className="admin-shop-suite__chip-group" role="group" aria-label={ADMIN_SHOP_PRODUCT_EDITOR_COPY.CATEGORY}>
                      {SHOP_CATEGORY_TABS.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          className="admin-shop-suite__chip-option"
                          aria-pressed={form.catalogCategory === tab.key}
                          onClick={() => setForm((prev) => ({
                            ...prev,
                            catalogCategory: tab.key,
                            fieldCode: prev.catalogCategory === tab.key ? prev.fieldCode : ''
                          }))}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="admin-shop-suite__field">
                    <span className="admin-shop-suite__label">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.CODE}</span>
                    <span className="admin-shop-suite__readout admin-shop-suite__mono">
                      <SafeText>{product?.code || ADMIN_SHOP_PRODUCT_EDITOR_COPY.CODE_AUTO}</SafeText>
                    </span>
                  </div>
                </div>
                <div className="admin-shop-suite__field">
                  <span className="admin-shop-suite__label">
                    {fieldLabel}
                    <span className="admin-shop-suite__muted">{` · ${ADMIN_SHOP_PRODUCT_EDITOR_COPY.FIELD_MULTI_HINT}`}</span>
                  </span>
                  <div className="admin-shop-suite__chip-group" role="group" aria-label={fieldLabel}>
                    {fieldOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className="admin-shop-suite__chip-option"
                        aria-pressed={form.fieldCode === opt.value}
                        onClick={() => setField('fieldCode', form.fieldCode === opt.value ? '' : opt.value)}
                      >
                        <SafeText>{opt.label}</SafeText>
                      </button>
                    ))}
                  </div>
                </div>
                {isConsultation ? (
                  <div className="admin-shop-suite__field">
                    <label className="admin-shop-suite__label" htmlFor={`${baseId}-consultant`}>
                      {ADMIN_SHOP_PRODUCT_EDITOR_COPY.CONSULTANT}
                    </label>
                    <select
                      id={`${baseId}-consultant`}
                      className="admin-shop-suite__select"
                      value={form.consultantId}
                      onChange={(e) => setField('consultantId', e.target.value)}
                    >
                      <option value="">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.CONSULTANT_PLACEHOLDER}</option>
                      {consultantOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </section>

              <section className="admin-shop-suite__card" aria-labelledby={`${baseId}-mall`}>
                <div className="admin-shop-suite__card-head">
                  <h2 id={`${baseId}-mall`} className="admin-shop-suite__card-title">
                    {ADMIN_SHOP_PRODUCT_EDITOR_COPY.SECTION_MALL}
                  </h2>
                  <span className="admin-shop-suite__card-hint">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.SECTION_MALL_HINT}</span>
                </div>
                <div className="admin-shop-suite__grid-2">
                  <ShopProductImageUpload
                    previewUrl={previewUrl}
                    disabled={saving}
                    onFileSelect={(file) => setPendingImageFile(file)}
                    onClear={() => {
                      setPendingImageFile(null);
                      setField('thumbnailUrl', '');
                    }}
                  />
                  <div className="admin-shop-suite__field">
                    <label className="admin-shop-suite__label" htmlFor={`${baseId}-desc`}>
                      {ADMIN_SHOP_PRODUCT_EDITOR_COPY.DESCRIPTION}
                    </label>
                    <textarea
                      id={`${baseId}-desc`}
                      className="admin-shop-suite__input admin-shop-suite__textarea"
                      maxLength={ADMIN_SHOP_PRODUCT_DESCRIPTION_MAX}
                      value={form.descriptionText}
                      onChange={(e) => setField('descriptionText', e.target.value)}
                    />
                    <span className="admin-shop-suite__hint admin-shop-suite__num">
                      {`${form.descriptionText.length} / ${ADMIN_SHOP_PRODUCT_DESCRIPTION_MAX}`}
                    </span>
                  </div>
                </div>
              </section>

            </div>

            <aside className="admin-shop-suite__card admin-shop-suite__card--paper admin-shop-suite__sticky">
              <span className="admin-shop-suite__eyebrow">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.PREVIEW_EYEBROW}</span>
              {previewUrl && brokenPreviewUrl !== previewUrl ? (
                <img
                  className="admin-shop-suite__preview-thumb"
                  src={previewUrl}
                  alt=""
                  onError={() => setBrokenPreviewUrl(previewUrl)}
                />
              ) : null}
              <strong><SafeText>{form.name || ADMIN_SHOP_PRODUCT_EDITOR_COPY.TITLE_NEW}</SafeText></strong>
              <div className="admin-shop-suite__row-line">
                <span>{ADMIN_SHOP_PRODUCT_EDITOR_COPY.PREVIEW_PRICE}</span>
                <span className="admin-shop-suite__row-line-value"><SafeText>{priceText}</SafeText></span>
              </div>
              <div className="admin-shop-suite__row-line">
                <span>{ADMIN_SHOP_PRODUCT_EDITOR_COPY.PREVIEW_SESSIONS}</span>
                <span className="admin-shop-suite__row-line-value"><SafeText>{sessionsText}</SafeText></span>
              </div>
              <div className="admin-shop-suite__row-line">
                <span>{ADMIN_SHOP_PRODUCT_EDITOR_COPY.PREVIEW_PER_SESSION}</span>
                <span className="admin-shop-suite__row-line-value">
                  <SafeText>{perSession != null ? formatShopMoney(perSession) : '—'}</SafeText>
                </span>
              </div>
              <div className="admin-shop-suite__row-line">
                <span className="admin-shop-suite__row-line-label">
                  {ADMIN_SHOP_PRODUCT_EDITOR_COPY.FLOW_PAY}
                  <span className="admin-shop-suite__muted">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.FLOW_PAY_NOTE}</span>
                </span>
                <span className="admin-shop-suite__row-line-value"><SafeText>{`+${sessionsText}`}</SafeText></span>
              </div>
              <div className="admin-shop-suite__row-line">
                <span className="admin-shop-suite__row-line-label">
                  {ADMIN_SHOP_PRODUCT_EDITOR_COPY.FLOW_REFUND}
                  <span className="admin-shop-suite__muted">{ADMIN_SHOP_PRODUCT_EDITOR_COPY.FLOW_REFUND_NOTE}</span>
                </span>
              </div>
              {[
                { key: 'homePublic', label: ADMIN_SHOP_PRODUCT_EDITOR_COPY.TOGGLE_HOME, hint: ADMIN_SHOP_PRODUCT_EDITOR_COPY.TOGGLE_HOME_HINT },
                { key: 'mallVisible', label: ADMIN_SHOP_PRODUCT_EDITOR_COPY.TOGGLE_MALL, hint: ADMIN_SHOP_PRODUCT_EDITOR_COPY.TOGGLE_MALL_HINT },
                { key: 'active', label: ADMIN_SHOP_PRODUCT_EDITOR_COPY.TOGGLE_ACTIVE, hint: ADMIN_SHOP_PRODUCT_EDITOR_COPY.TOGGLE_ACTIVE_HINT }
              ].map((row) => {
                const mallBlocked = row.key === 'mallVisible' && Boolean(validation.errors.sessions) && !form.mallVisible;
                return (
                  <div key={row.key} className="admin-shop-suite__row-line">
                    <span className="admin-shop-suite__row-line-label">
                      {row.label}
                      <span className="admin-shop-suite__muted">
                        {mallBlocked ? ADMIN_SHOP_PRODUCTS_COPY.MALL_BLOCKED_HINT : row.hint}
                      </span>
                    </span>
                    <span className={mallBlocked ? 'admin-shop-suite__toggle-blocked' : undefined}>
                      <Switch
                        checked={Boolean(form[row.key])}
                        disabled={mallBlocked || saving}
                        ariaLabel={row.label}
                        onCheckedChange={(next) => setField(row.key, next)}
                      />
                    </span>
                  </div>
                );
              })}
            </aside>
          </div>
        </div>
      </ContentArea>
      <ConfirmModal />
    </AdminCommonLayout>
  );
}

AdminShopProductEditorPage.propTypes = {
  isNew: PropTypes.bool
};

AdminShopProductEditorPage.defaultProps = {
  isNew: false
};

export default AdminShopProductEditorPage;
