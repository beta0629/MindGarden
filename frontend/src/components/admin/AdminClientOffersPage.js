/**
 * 테넌트 어드민 — 내담자별 결제 상품 (몰 상품 선택 → 금액/율 할인 → 지정). 시안 A.
 * 결제 금액은 서버가 확정하며 이 화면의 금액은 미리보기다. 서버 오류 문구는 그대로 보여 준다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check, Inbox, Info, Loader2, Users } from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import EmptyState from '../common/EmptyState';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import UnifiedModal from '../common/modals/UnifiedModal';
import ClientSearchCombobox from './shop/ClientSearchCombobox';
import { usePagedList } from '../../hooks/usePagedList';
import {
  cancelAdminClientOffer,
  createAdminClientOffer,
  listAdminClientOffers,
  listAdminOfferSourceOptions,
  searchAdminClientsPage
} from '../../services/shopClientOfferService';
import {
  ADMIN_CLIENT_OFFERS_I18N_NS,
  ADMIN_CLIENT_SEARCH_DEBOUNCE_MS,
  ADMIN_CLIENT_SEARCH_PAGE_SIZE,
  ADMIN_CLIENT_OFFERS_TEST_IDS,
  SHOP_CLIENT_OFFER_DISCOUNT_TYPE,
  SHOP_CLIENT_OFFER_STATUS
} from '../../constants/shopClientOfferConstants';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import { MIN_PAYMENT_AMOUNT } from '../../constants/paymentAmountConstants';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import useDebounce from '../../hooks/useDebounce';
import {
  buildClientOptions,
  describeOfferDiscount,
  isOfferValueInRange,
  previewOfferFinalPrice,
  toOfferRequestValue
} from '../../utils/shopClientOffer';
import '../../styles/unified-design-tokens.css';
import '../../styles/tokens/shop-offer-tokens.css';
import '../../styles/shop/AdminShopClinicOs.css';
import '../../styles/shop/AdminShopSuite.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './AdminClientOffersPage.css';

const TOAST_MS = 6000;
const SKELETON_ROWS = 5;
const SKELETON_COLS = 5;
const T = ADMIN_CLIENT_OFFERS_TEST_IDS;

const num = (value) => Number(value).toLocaleString('ko-KR');

const AdminClientOffersPage = () => {
  const { t } = useTranslation(ADMIN_CLIENT_OFFERS_I18N_NS);
  const won = (value) => t('form.money', { value: num(value) });
  const navigate = useNavigate();
  const baseId = useId();
  const listRef = useRef(null);
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

  const [booting, setBooting] = useState(true);
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [sources, setSources] = useState([]);
  const [bootError, setBootError] = useState('');
  const [offers, setOffers] = useState([]);
  const [listState, setListState] = useState('idle');
  const [clientId, setClientId] = useState('');
  const [sourceSkuCode, setSourceSkuCode] = useState('');
  const [discountType, setDiscountType] = useState(SHOP_CLIENT_OFFER_DISCOUNT_TYPE.NONE);
  const [discountValue, setDiscountValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [canceling, setCanceling] = useState(false);

  const debouncedClientQuery = useDebounce(clientQuery.trim(), ADMIN_CLIENT_SEARCH_DEBOUNCE_MS);
  const fetchClientPage = useCallback(
    (page, size) => searchAdminClientsPage({ q: debouncedClientQuery || undefined, page, size }),
    [debouncedClientQuery]
  );
  const clientSearch = usePagedList({
    fetchPage: fetchClientPage,
    pageSize: ADMIN_CLIENT_SEARCH_PAGE_SIZE,
    enabled: !sessionLoading && isLoggedIn && allowed,
    resetKey: debouncedClientQuery
  });
  const clients = clientSearch.items;
  const clientSearchError = clientSearch.error ? (clientSearch.error.message || t('states.clientsLoadFailed')) : '';
  const clientOptions = useMemo(
    () => buildClientOptions(clients, (name, tail) => t('form.clientOption', { name, phoneTail: tail })),
    [clients, t]
  );
  const selectedSource = useMemo(
    () => sources.find((s) => s.skuCode === sourceSkuCode) || null,
    [sources, sourceSkuCode]
  );
  const isRate = discountType === SHOP_CLIENT_OFFER_DISCOUNT_TYPE.RATE;
  const isNone = discountType === SHOP_CLIENT_OFFER_DISCOUNT_TYPE.NONE;
  const isPrice = discountType === SHOP_CLIENT_OFFER_DISCOUNT_TYPE.PRICE;
  // 정가 그대로·직접 입력은 비워도 정가로 계산된다
  const hasValue = isNone || isPrice || (discountValue !== '' && Number(discountValue) > 0);
  const previewPrice = selectedSource
    ? previewOfferFinalPrice(selectedSource.unitPriceMinor, discountType, discountValue)
    : null;
  const previewDiscount = previewPrice != null ? selectedSource.unitPriceMinor - previewPrice : null;
  const belowMin = Boolean(selectedSource) && hasValue && previewPrice == null && isOfferValueInRange(
    selectedSource.unitPriceMinor, discountType, discountValue
  );
  const canSave = Boolean(selectedClient && selectedSource && previewPrice != null) && !saving;
  const noClient = !selectedClient;

  useEffect(() => {
    if (sessionLoading || !isLoggedIn || !user) {
      return undefined;
    }
    if (!allowed) {
      navigate('/', { replace: true });
      return undefined;
    }
    let cancelled = false;
    (async() => {
      try {
        const sourceRows = await listAdminOfferSourceOptions();
        if (!cancelled) {
          setSources(sourceRows);
        }
      } catch (e) {
        if (!cancelled) {
          setBootError(e?.message || t('states.clientsLoadFailed'));
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [sessionLoading, isLoggedIn, user?.id, allowed, navigate, t]);


  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadOffers = useCallback(async(nextClientId) => {
    if (!nextClientId) {
      setOffers([]);
      setListState('idle');
      return;
    }
    setListState('loading');
    try {
      setOffers(await listAdminClientOffers(nextClientId));
      setListState('ready');
    } catch (e) {
      setOffers([]);
      setListState('error');
    }
  }, []);

  const handleClientChange = (value) => {
    setClientId(value);
    setSelectedClient(clientOptions.find((o) => o.value === value) || null);
    setSaveError('');
    loadOffers(value);
  };

  const handleSave = async(e) => {
    e.preventDefault();
    if (!canSave) {
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await createAdminClientOffer({
        clientId: Number(clientId),
        sourceSkuCode,
        discountType,
        discountValue: toOfferRequestValue(discountType, discountValue)
      });
      setToast({ name: selectedClient.name });
      setDiscountValue('');
      setSourceSkuCode('');
      await loadOffers(clientId);
    } catch (err) {
      setSaveError(err?.message || t('states.saveFailFallback'));
    } finally {
      setSaving(false);
    }
  };

  const confirmCancel = async() => {
    if (!cancelTarget) {
      return;
    }
    setCanceling(true);
    try {
      await cancelAdminClientOffer(cancelTarget.id);
      setCancelTarget(null);
      await loadOffers(clientId);
    } catch (err) {
      setCancelTarget(null);
      setSaveError(err?.message || t('states.cancelFailed'));
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    if (!cancelTarget) {
      return undefined;
    }
    const timer = setTimeout(() => {
      const back = document.querySelector(`[data-testid="${T.CANCEL_BACK}"]`);
      if (back) {
        back.focus();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [cancelTarget]);

  const statusOf = (offer) => {
    if (offer.status === SHOP_CLIENT_OFFER_STATUS.CANCELED) {
      return { cls: 'canceled', text: t('list.statusCanceled') };
    }
    return offer.paid
      ? { cls: 'paid', text: t('list.statusPaid') }
      : { cls: 'pending', text: t('list.statusPending') };
  };
  const discountText = (offer) => {
    const d = describeOfferDiscount(offer);
    if (!d) {
      return t('list.discountNone');
    }
    return d.kind === 'rate'
      ? t('list.discountRate', { value: d.value })
      : t('list.discountAmount', { value: num(d.value) });
  };
  const previewSubText = () => {
    if (!previewDiscount) {
      return t('form.previewNoDiscount');
    }
    return isRate
      ? t('form.previewDiscountRate', { value: discountValue, amount: num(previewDiscount) })
      : t('form.previewDiscountAmount', { value: num(previewDiscount) });
  };
  const valueHint = () => {
    if (isNone) {
      return t('form.valueHintNone');
    }
    if (isPrice) {
      return t('form.valueHintPrice', { min: num(MIN_PAYMENT_AMOUNT) });
    }
    return isRate ? t('form.valueHintRate') : t('form.valueHintAmount');
  };
  const dateText = (offer) => (offer.createdAt ? String(offer.createdAt).slice(0, 10) : '');

  // 미리보기를 못 그릴 때 이유를 알려 준다: 상품 미선택 → 직접 입력 정가 초과 → 기본 안내
  const previewEmptyHint = () => {
    if (!selectedSource) {
      return t('form.previewSelectProduct');
    }
    if (isPrice && String(discountValue).trim() !== '' && Number(discountValue) > selectedSource.unitPriceMinor) {
      return t('form.previewExceedsOriginal', { amount: num(selectedSource.unitPriceMinor) });
    }
    return t('form.previewEmpty');
  };

  const renderPreview = () => {
    if (!selectedSource || previewPrice == null) {
      return (
        <div className="aco-preview__panel">
          <div className="aco-preview__cell">
            <span className="aco-preview__cap">{t('form.previewOriginal')}</span>
            <span className="aco-preview__value aco-preview__value--orig">
              {selectedSource ? won(selectedSource.unitPriceMinor) : '—'}
            </span>
          </div>
          <div className="aco-preview__cell">
            <span className="aco-preview__cap">{isPrice ? t('form.previewFinalPrice') : t('form.previewFinal')}</span>
            <span className="aco-preview__value aco-preview__value--empty">—</span>
            <span className="aco-preview__sub" data-testid="admin-client-offers-preview-hint">{previewEmptyHint()}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="aco-preview__panel">
        <div className="aco-preview__cell">
          <span className="aco-preview__cap">{t('form.previewOriginal')}</span>
          <span className="aco-preview__value aco-preview__value--orig"><SafeText>{won(selectedSource.unitPriceMinor)}</SafeText></span>
        </div>
        <div className="aco-preview__cell">
          <span className="aco-preview__cap">{isPrice ? t('form.previewFinalPrice') : t('form.previewFinal')}</span>
          <span className="aco-preview__value"><SafeText>{won(previewPrice)}</SafeText></span>
          <span className="aco-preview__sub">{previewSubText()}</span>
        </div>
      </div>
    );
  };

  const renderList = () => {
    if (noClient) {
      return (
        <EmptyState
          icon={<Users className="aco-icon" aria-hidden="true" />}
          title={t('states.noClientTitle')}
          description={t('states.noClientDesc')}
        />
      );
    }
    if (listState === 'loading') {
      return (
        <div className="aco-skeleton" role="status" aria-label={t('states.loadingLabel')}>
          {Array.from({ length: SKELETON_ROWS }, (_, r) => (
            <div className="aco-skeleton__row" key={r} aria-hidden="true">
              {Array.from({ length: SKELETON_COLS }, (__, c) => <span className="aco-skeleton__bar" key={c} />)}
            </div>
          ))}
        </div>
      );
    }
    if (listState === 'error') {
      return (
        <EmptyState
          icon={<AlertCircle className="aco-icon" aria-hidden="true" />}
          title={t('states.listErrorTitle')}
          description={t('states.listErrorDesc')}
          action={(
            <MGButton variant="outline" preventDoubleClick={false} onClick={() => loadOffers(clientId)}>
              {t('states.listErrorRetry')}
            </MGButton>
          )}
        />
      );
    }
    if (offers.length === 0) {
      return (
        <EmptyState
          icon={<Inbox className="aco-icon" aria-hidden="true" />}
          title={t('states.listEmptyTitle')}
          description={t('states.listEmptyDesc')}
        />
      );
    }
    return (
      <>
        <table className="aco-otable">
          <caption className="aco-sr-only">{t('list.title')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('list.colProduct')}</th>
              <th scope="col" className="aco-col-discount">{t('list.colDiscount')}</th>
              <th scope="col" className="aco-col-amount aco-num">{t('list.colAmount')}</th>
              <th scope="col" className="aco-col-status">{t('list.colStatus')}</th>
              <th scope="col" className="aco-col-date">{t('list.colDate')}</th>
              <th scope="col" className="aco-col-action"><span className="aco-sr-only">{t('list.colAction')}</span></th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => {
              const status = statusOf(offer);
              const cancelable = offer.status === SHOP_CLIENT_OFFER_STATUS.ACTIVE && !offer.paid;
              return (
                <tr key={offer.id}>
                  <td data-col="product">
                    <div className="aco-cell-stack">
                      <span className="aco-cell-title"><SafeText>{offer.title}</SafeText></span>
                      {offer.sessionCount != null ? <span className="aco-cell-sub">{t('list.sessions', { n: offer.sessionCount })}</span> : null}
                    </div>
                  </td>
                  <td data-col="discount"><SafeText>{discountText(offer)}</SafeText></td>
                  <td data-col="amount" className="aco-num"><SafeText>{won(offer.finalPriceMinor)}</SafeText></td>
                  <td data-col="status"><span className={`aco-chip aco-chip--${status.cls}`}>{status.text}</span></td>
                  <td data-col="date" data-label={t('list.dateLabel')}>{dateText(offer)}</td>
                  <td data-col="action" className="aco-col-action">
                    {cancelable ? (
                      <MGButton
                        variant="danger-outline"
                        size="small"
                        preventDoubleClick={false}
                        aria-label={t('list.cancelAria', { product: offer.title })}
                        onClick={() => setCancelTarget(offer)}
                      >
                        {t('list.cancel')}
                      </MGButton>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="aco-table-foot"><span>{t('list.total', { count: offers.length })}</span></div>
      </>
    );
  };

  const noSources = !booting && sources.length === 0 && !bootError;

  return (
    <AdminCommonLayout title={t('pageTitle')} loading={booting}>
      <ContentArea className="admin-shop-clinic-os admin-shop-suite" ariaLabel={t('regionLabel')}>
        <div className="aco-page" data-testid={T.PAGE}>
          <ContentHeader titleId={`${baseId}-title`} title={t('pageTitle')} subtitle={t('pageSubtitle')} />
          <section className="aco-card" aria-labelledby={`${baseId}-form`}>
            <div className="aco-card__head">
              <h2 className="aco-card__title" id={`${baseId}-form`}>{t('form.title')}</h2>
              <span className="aco-card__hint">{t('form.hint')}</span>
            </div>
            <form className="aco-offer-form" onSubmit={handleSave} aria-busy={saving}>
              <div className="aco-offer-form__fields">
                <div className="aco-field">
                  <span className="aco-field__label" id={`${baseId}-lbl-client`}>
                    {t('form.clientLabel')}<span className="aco-field__req">{t('form.required')}</span>
                  </span>
                  <ClientSearchCombobox
                    options={clientOptions}
                    value={clientId}
                    selectedOption={selectedClient}
                    onChange={handleClientChange}
                    onQueryChange={setClientQuery}
                    loading={clientSearch.loading}
                    loadingText={t('form.clientSearching')}
                    onLoadMore={clientSearch.loadMore}
                    hasMore={clientSearch.hasMore}
                    loadingMore={clientSearch.loadingMore}
                    loadingMoreText={t('form.clientLoadingMore')}
                    label={t('form.clientLabel')}
                    placeholder={t('form.clientSearchPlaceholder')}
                    emptyText={clientSearchError || t('form.clientEmpty')}
                    disabled={saving || booting}
                    testId={T.CLIENT_COMBO}
                  />
                </div>
                <div className="aco-field">
                  <label className="aco-field__label" htmlFor={`${baseId}-product`}>{t('form.productLabel')}</label>
                  <span className="aco-select-wrap">
                    <select
                      id={`${baseId}-product`}
                      className="aco-ctl"
                      value={sourceSkuCode}
                      onChange={(e) => setSourceSkuCode(e.target.value)}
                      disabled={noClient || noSources || saving}
                    >
                      <option value="">{noSources ? t('states.noProductTitle') : t('form.productPlaceholder')}</option>
                      {sources.map((s) => (
                        <option key={s.skuCode} value={s.skuCode}>
                          {t('form.productOption', {
                            name: s.title,
                            sessions: s.sessionCount,
                            price: num(s.unitPriceMinor)
                          })}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className="aco-field__hint">{t('form.productHint')}</span>
                </div>
                <div className="aco-field">
                  <span className="aco-field__label" id={`${baseId}-lbl-mode`}>{t('form.modeLabel')}</span>
                  <div className="aco-seg" role="radiogroup" aria-labelledby={`${baseId}-lbl-mode`} aria-disabled={noClient || saving}>
                    {[
                      [SHOP_CLIENT_OFFER_DISCOUNT_TYPE.NONE, t('form.modeNone')],
                      [SHOP_CLIENT_OFFER_DISCOUNT_TYPE.PRICE, t('form.modePrice')],
                      [SHOP_CLIENT_OFFER_DISCOUNT_TYPE.AMOUNT, t('form.modeAmount')],
                      [SHOP_CLIENT_OFFER_DISCOUNT_TYPE.RATE, t('form.modeRate')]
                    ].map(([type, text]) => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={discountType === type}
                        className="aco-seg__btn"
                        disabled={noClient || saving}
                        onClick={() => { setDiscountType(type); setDiscountValue(''); }}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="aco-field">
                  <label className="aco-field__label" htmlFor={`${baseId}-value`}>
                    {isPrice ? t('form.valueLabelPrice') : t('form.valueLabel')}
                  </label>
                  <div className="aco-affix">
                    <input
                      id={`${baseId}-value`}
                      className="aco-ctl"
                      type="text"
                      inputMode="numeric"
                      value={discountValue}
                      placeholder={isPrice ? t('form.valuePlaceholderPrice') : t('form.valuePlaceholder')}
                      disabled={noClient || saving || isNone}
                      onChange={(e) => setDiscountValue(e.target.value.replace(/\D/g, ''))}
                    />
                    <span className="aco-affix__unit">{isRate ? t('form.unitRate') : t('form.unitAmount')}</span>
                  </div>
                  <span className="aco-field__hint">{valueHint()}</span>
                </div>
                <section className="aco-preview" aria-labelledby={`${baseId}-lbl-prev`} aria-live="polite">
                  <span className="aco-preview__label" id={`${baseId}-lbl-prev`}>{t('form.previewLabel')}</span>
                  {renderPreview()}
                  {belowMin ? (
                    <div className="aco-notice" role="alert">
                      <Info className="aco-icon" aria-hidden="true" />
                      <div className="aco-notice__body">
                        <span className="aco-notice__title">{t('states.minAmountTitle')}</span>
                        <span className="aco-notice__text">{t('states.minAmountText', { min: num(MIN_PAYMENT_AMOUNT) })}</span>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
              {noClient ? (
                <div className="aco-notice aco-notice--quiet"><Info className="aco-icon" aria-hidden="true" />{t('states.noClientTitle')}</div>
              ) : null}
              {noSources && !noClient ? (
                <div className="aco-notice">
                  <Info className="aco-icon" aria-hidden="true" />
                  <div className="aco-notice__body">
                    <span className="aco-notice__title">{t('states.noProductTitle')}</span>
                    <span className="aco-notice__text">{t('states.noProductDesc')}</span>
                    <Link to={ADMIN_ROUTES.SHOP_PRODUCTS} className="aco-link-hint">{t('states.noProductLink')}</Link>
                  </div>
                </div>
              ) : null}
              {bootError ? (
                <div className="aco-notice" role="alert">
                  <AlertCircle className="aco-icon" aria-hidden="true" />
                  <div className="aco-notice__body"><span className="aco-notice__text"><SafeText>{bootError}</SafeText></span></div>
                </div>
              ) : null}
              {saveError ? (
                <div className="aco-notice" role="alert">
                  <AlertCircle className="aco-icon" aria-hidden="true" />
                  <div className="aco-notice__body">
                    <span className="aco-notice__title">{t('states.saveFailTitle')}</span>
                    <span className="aco-notice__text"><SafeText>{saveError}</SafeText></span>
                  </div>
                </div>
              ) : null}
              <div className="aco-offer-form__foot">
                <section className="aco-rules" aria-label={t('rules.title')}>
                  <p className="aco-rules__title"><Info className="aco-icon" aria-hidden="true" />{t('rules.title')}</p>
                  <ul className="aco-rules__list">
                    <li>{t('rules.none')}</li>
                    <li>{t('rules.price', { min: num(MIN_PAYMENT_AMOUNT) })}</li>
                    <li>{t('rules.amount')}</li>
                    <li>{t('rules.rate')}</li>
                    <li>{t('rules.min', { min: num(MIN_PAYMENT_AMOUNT) })}</li>
                  </ul>
                </section>
                <div className="aco-foot-action">
                  {canSave ? (
                    <span className="aco-foot-summary">
                      {t('form.summary', { name: selectedClient.name, amount: num(previewPrice) })}
                    </span>
                  ) : null}
                  <MGButton
                    type="submit"
                    variant="primary"
                    disabled={!canSave}
                    loading={saving}
                    loadingText={t('form.submitting')}
                    preventDoubleClick={false}
                    data-testid={T.SAVE}
                  >
                    {saving ? <Loader2 className="aco-icon" aria-hidden="true" /> : null}
                    {saving ? t('form.submitting') : t('form.submit')}
                  </MGButton>
                </div>
              </div>
            </form>
          </section>

          <section className="aco-card aco-card--flush" aria-labelledby={`${baseId}-list`} ref={listRef}>
            <div className="aco-card__head">
              <h2 className="aco-card__title" id={`${baseId}-list`}>{t('list.title')}</h2>
              {selectedClient ? <span className="aco-card__hint">{t('list.captionClient', { name: selectedClient.name })}</span> : null}
            </div>
            {renderList()}
          </section>
        </div>
        {toast ? (
          <div className="aco-toast-slot">
            <div className="aco-toast" role="status">
              <Check className="aco-icon" aria-hidden="true" />
              <span>{t('states.toastSaved', { name: toast.name })}</span>
              <button
                type="button"
                className="aco-toast__action"
                onClick={() => { setToast(null); listRef.current?.scrollIntoView?.({ block: 'start' }); }}
              >
                {t('states.toastView')}
              </button>
            </div>
          </div>
        ) : null}
        <UnifiedModal
          isOpen={Boolean(cancelTarget)}
          onClose={() => setCancelTarget(null)}
          title={t('states.cancelConfirmTitle')}
          size="small"
          showCloseButton
          backdropClick
          actions={(
            <>
              <MGButton
                variant="secondary"
                preventDoubleClick={false}
                onClick={() => setCancelTarget(null)}
                data-testid={T.CANCEL_BACK}
              >
                {t('states.cancelConfirmNo')}
              </MGButton>
              <MGButton variant="danger" loading={canceling} preventDoubleClick={false} onClick={confirmCancel}>
                {t('states.cancelConfirmYes')}
              </MGButton>
            </>
          )}
        >
          <p className="aco-modal-text">{t('states.cancelConfirmText')}</p>
        </UnifiedModal>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default AdminClientOffersPage;
