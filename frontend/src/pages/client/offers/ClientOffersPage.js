/**
 * ClientOffersPage — 내담자 전용 결제 (/client/offers). 시안 B.
 * 관리자가 나에게 지정한 상품·할인가만 보여 주고, 결제는 기존 몰 공통 함수(체크아웃·PortOne·완료/복귀)를 import 해 그대로 쓴다.
 * 금액은 서버가 확정한다(지정 SKU 코드로 바로 구매). 기존 몰 파일은 수정하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, Info, Lock } from 'lucide-react';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import MallSessionChip from '../../../components/shop/atoms/MallSessionChip';
import MallInfoRows from '../../../components/shop/molecules/MallInfoRows';
import MallPrice from '../../../components/shop/molecules/MallPrice';
import MallPayFailedAlert from '../../../components/shop/molecules/MallPayFailedAlert';
import MallPaymentCancelNotice from '../../../components/shop/molecules/MallPaymentCancelNotice';
import MallAgreements from '../../../components/shop/organisms/MallAgreements';
import MallPhoneVerifyInline from '../../../components/shop/organisms/MallPhoneVerifyInline';
import MallUsageBanner from '../../../components/shop/molecules/MallUsageBanner';
import MGButton from '../../../components/common/MGButton';
import UnifiedModal from '../../../components/common/modals/UnifiedModal';
import SafeText from '../../../components/common/SafeText';
import {
  CLIENT_MALL_AGREEMENT_ITEMS,
  CLIENT_MALL_AGREEMENT_KEYS,
  CLIENT_MALL_THIRD_PARTY_BODY,
  CLIENT_REFUND_NOTICE,
  CLIENT_MALL_USAGE_BANNER,
  CLIENT_MALL_USAGE_BANNER_EXAMPLE,
  buildClientMallProductUsageNotice
} from '../../../constants/clientMallConstants';
import {
  CLIENT_SHOP_ROUTES,
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_VERIFY_ERROR_PHASE,
  SHOP_USER_CANCEL_OUTCOME,
  buildShopOrderDetailPath,
  buildShopPaymentCompletePath,
  buildShopPaymentReturnPath
} from '../../../constants/clientShopConstants';
import {
  CLIENT_OFFERS_I18N_NS,
  CLIENT_OFFERS_TEST_IDS,
  CLIENT_OFFER_ROUTES
} from '../../../constants/shopClientOfferConstants';
import { CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE } from '../../../constants/legalPublic';
import { useSession } from '../../../contexts/SessionContext';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import usePhoneVerifyFlow from '../../../hooks/usePhoneVerifyFlow';
import { applyVerifiedPhoneToSession } from '../../../utils/clientPhoneVerifiedSession';
import useShopPaymentCancelNotice from '../../../hooks/useShopPaymentCancelNotice';
import {
  cancelShopOrder,
  cancelShopPaymentByUser,
  fetchConsultantMappings,
  postShopCheckout as postShopCheckoutRequest,
  prepareShopPayment
} from '../../../services/clientShopService';
import { listMyClientOffers } from '../../../services/shopClientOfferService';
import {
  assertPortOneCustomerReadyBeforeCheckout,
  resolveSessionFullName,
  resolveSessionPhoneNumber,
  resolveSessionPhoneVerified
} from '../../../utils/clientShopPaymentCustomer';
import { runShopCheckoutWithPortOneGuard } from '../../../utils/shopCheckoutPortOneGuard';
import { runShopPortOnePaymentIfReady } from '../../../utils/shopPortOneCheckout';
import {
  buildShopCheckoutSignature,
  buildShopPaymentCancelNavigationState,
  createShopCheckoutIdempotencyKeyStore,
  resolvePortOneFailureReason
} from '../../../utils/shopPaymentCancel';
import {
  buildConsultantPickerOptions,
  resolveInitialMappingId,
  shouldShowConsultantMappingPicker
} from '../../../utils/clientShopCheckoutMapping';
import { formatMallNumber } from '../../../utils/clientMall';
import { toBuyNowCheckoutLines } from '../../../utils/clientMallBuyNow';
import {
  describeOfferDiscount,
  readClientOffersDraft,
  selectPayableOffers,
  writeClientOffersDraft,
  readClientOffersPayFailureReason
} from '../../../utils/shopClientOffer';
import '../../../styles/tokens/shop-offer-tokens.css';
import './ClientOffersPage.css';

const EMPTY_AGREEMENTS = Object.freeze(
  CLIENT_MALL_AGREEMENT_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: false }), {})
);
const setAllAgreements = (value) => CLIENT_MALL_AGREEMENT_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: value }), {});
const T = CLIENT_OFFERS_TEST_IDS;

const ClientOffersPage = () => {
  const { t } = useTranslation(CLIENT_OFFERS_I18N_NS);
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth({
    requireLogin: true,
    loginRedirectPath: CLIENT_OFFER_ROUTES.OFFERS
  });
  const { checkSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const baseId = useId();
  const payCancelNotice = useShopPaymentCancelNotice();
  const [offers, setOffers] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');
  const [payFailureReason, setPayFailureReason] = useState(() => readClientOffersPayFailureReason(location.state));
  const [termsKey, setTermsKey] = useState('');
  const [selectedSkuCode, setSelectedSkuCode] = useState('');
  const [mappings, setMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [agreements, setAgreements] = useState(EMPTY_AGREEMENTS);
  const restoredRef = useRef(false);
  const termsOpenerRef = useRef(null);
  const idempotencyStoreRef = useRef(null);
  if (idempotencyStoreRef.current == null) {
    idempotencyStoreRef.current = createShopCheckoutIdempotencyKeyStore();
  }
  const userId = user?.id ?? null;

  const payable = useMemo(() => selectPayableOffers(offers), [offers]);
  const selectedOffer = useMemo(
    () => payable.find((o) => o.offerSkuCode === selectedSkuCode) || null,
    [payable, selectedSkuCode]
  );

  const loadData = useCallback(async() => {
    setLoadState('loading');
    setMessage('');
    try {
      const [rows, mappingRows] = await Promise.all([listMyClientOffers(), fetchConsultantMappings()]);
      setOffers(rows);
      setMappings(Array.isArray(mappingRows) ? mappingRows : []);
      setLoadState('ready');
    } catch (e) {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, loadData]);

  // 목록이 오면: 설정에서 돌아온 경우 선택·동의·상담사 복원, 아니면 상품이 1개일 때 자동 선택
  useEffect(() => {
    if (loadState !== 'ready' || restoredRef.current) {
      return;
    }
    restoredRef.current = true;
    const draft = readClientOffersDraft(userId);
    if (draft && payable.some((o) => o.offerSkuCode === draft.skuCode)) {
      setSelectedSkuCode(draft.skuCode);
      setAgreements({ ...EMPTY_AGREEMENTS, ...(draft.agreements || {}) });
      setSelectedMappingId(draft.mappingId || '');
      return;
    }
    if (payable.length === 1) {
      setSelectedSkuCode(payable[0].offerSkuCode);
    }
  }, [loadState, payable, userId]);

  useEffect(() => {
    if (loadState !== 'ready' || !restoredRef.current) {
      return;
    }
    writeClientOffersDraft(userId, selectedSkuCode
      ? { skuCode: selectedSkuCode, agreements, mappingId: selectedMappingId }
      : null);
  }, [loadState, userId, selectedSkuCode, agreements, selectedMappingId]);

  const portOneCustomerGate = useMemo(
    () => assertPortOneCustomerReadyBeforeCheckout(user),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, resolveSessionPhoneNumber(user), resolveSessionPhoneVerified(user)]
  );

  const titles = useMemo(() => (selectedOffer ? [selectedOffer.title] : []), [selectedOffer]);
  const showMappingPicker = shouldShowConsultantMappingPicker(mappings);
  const pickerOptions = useMemo(() => buildConsultantPickerOptions(mappings, titles), [mappings, titles]);
  const allAgreed = CLIENT_MALL_AGREEMENT_ITEMS.every((item) => agreements[item.key]);
  const phoneFlow = usePhoneVerifyFlow({
    initialPhoneDigits: resolveSessionPhoneNumber(user) || '',
    initiallyVerified: portOneCustomerGate.ready,
    onVerified: ({ phoneDigits, response }) => applyVerifiedPhoneToSession({
      phoneDigits,
      phoneVerifiedAt: response?.phoneVerifiedAt ?? null,
      checkSession
    })
  });
  const phoneVerified = portOneCustomerGate.ready && phoneFlow.isVerified;
  const noMapping = mappings.length === 0;
  const needsConsultant = showMappingPicker && !selectedMappingId;

  const blockMessage = (() => {
    if (!selectedOffer) {
      return t('bar.blockNoProduct');
    }
    if (noMapping) {
      return t('bar.blockNoAssign');
    }
    if (needsConsultant) {
      return t('bar.blockConsultant');
    }
    if (!phoneVerified && !allAgreed) {
      return t('bar.blockBoth');
    }
    if (!phoneVerified) {
      return t('bar.blockPhone');
    }
    if (!allAgreed) {
      return t('bar.blockAgreement');
    }
    return '';
  })();
  const payDisabled = paying || Boolean(blockMessage);
  const payBlocked = Boolean(blockMessage);

  useEffect(() => {
    if (!termsKey) {
      return undefined;
    }
    const root = document.querySelector(`[data-testid="${T.PAGE}"]`);
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (root) {
      root.setAttribute('inert', '');
    }
    return () => {
      document.body.style.overflow = previousBody === 'hidden' ? '' : previousBody;
      document.documentElement.style.overflow = previousHtml === 'hidden' ? '' : previousHtml;
      if (root) {
        root.removeAttribute('inert');
      }
      if (scrollY) {
        window.scrollTo(0, scrollY);
      }
    };
  }, [termsKey]);

  const openTerms = (key, opener) => {
    if (paying) {
      return;
    }
    termsOpenerRef.current = opener || null;
    setTermsKey(key);
  };

  const closeTerms = () => {
    const opener = termsOpenerRef.current;
    setTermsKey('');
    window.requestAnimationFrame(() => {
      if (opener && typeof opener.focus === 'function') {
        opener.focus();
      }
    });
  };

  const handleCheckout = async() => {
    if (payDisabled) {
      return;
    }
    const mappingId = selectedMappingId || resolveInitialMappingId(mappings, titles);
    const lines = toBuyNowCheckoutLines({ skuCode: selectedOffer.offerSkuCode, quantity: 1 });
    const store = idempotencyStoreRef.current;
    const signature = buildShopCheckoutSignature({ isBuyNow: true, lines, pointsRedeemMinor: 0, mappingId });
    try {
      setPaying(true);
      setMessage('');
      setPayFailureReason('');
      const flow = await runShopCheckoutWithPortOneGuard({
        user,
        pointsRedeemMinor: 0,
        mappingIdForCheckout: mappingId,
        createIdempotencyKey: () => store.keyFor(signature),
        postShopCheckout: (key, points, mapping) => postShopCheckoutRequest(key, points, mapping, lines, {
          purchase: Boolean(agreements[CLIENT_MALL_AGREEMENT_KEYS.PURCHASE]),
          usageRefund: Boolean(agreements[CLIENT_MALL_AGREEMENT_KEYS.USAGE_REFUND]),
          thirdParty: Boolean(agreements[CLIENT_MALL_AGREEMENT_KEYS.THIRD_PARTY])
        }),
        prepareShopPayment,
        runShopPortOnePaymentIfReady,
        cancelShopOrder,
        cancelShopPaymentByUser
      });
      if (flow.status === 'USER_CANCELLED') {
        if (flow.cancelOutcome === SHOP_USER_CANCEL_OUTCOME.CANCELLED) {
          store.reset();
        }
        navigate(CLIENT_OFFER_ROUTES.OFFERS, { replace: true, state: buildShopPaymentCancelNavigationState() });
        return;
      }
      if (flow.status === 'PAID_AFTER_CANCEL' && flow.checkoutResult?.orderPublicId) {
        writeClientOffersDraft(userId, null);
        navigate(buildShopPaymentReturnPath(flow.checkoutResult.orderPublicId, flow.paymentId), { replace: true });
        return;
      }
      if (flow.status === 'PAYMENT_VERIFIED') {
        writeClientOffersDraft(userId, null);
        const orderId = flow.checkoutResult?.orderPublicId;
        navigate(orderId ? buildShopPaymentCompletePath(orderId) : CLIENT_SHOP_ROUTES.ORDERS, { replace: true });
        return;
      }
      if (flow.status === 'NON_PAYMENT' && flow.checkoutResult?.orderPublicId) {
        navigate(buildShopOrderDetailPath(flow.checkoutResult.orderPublicId), { replace: true });
        return;
      }
      setMessage(flow.message);
      await loadData();
    } catch (e) {
      const verifyOrderId = e && e.shopPaymentPhase === SHOP_PAYMENT_VERIFY_ERROR_PHASE
        && e.orderPublicId != null && String(e.orderPublicId).trim()
        ? String(e.orderPublicId).trim()
        : '';
      if (verifyOrderId) {
        navigate(buildShopOrderDetailPath(verifyOrderId), {
          replace: true,
          state: { shopCheckoutMessage: e.message || SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED_USE_ORDER_CONFIRM }
        });
        return;
      }
      if (e && e.portoneResult) {
        setPayFailureReason(resolvePortOneFailureReason(e.portoneResult, t('states.payFailedReason')));
        return;
      }
      setMessage(e?.message || SHOP_CHECKOUT_ERROR_COPY.CHECKOUT_FAILED);
    } finally {
      setPaying(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title={t('pageTitle')} />;
  }

  // 할인 없는 지정(정가 그대로·정가와 같은 직접 입력)은 정가 취소선과 할인 문구를 숨긴다
  const discountText = (offer) => {
    const d = describeOfferDiscount(offer);
    if (!d) {
      return null;
    }
    return d.kind === 'rate'
      ? t('card.discountRate', { value: d.value })
      : t('card.discountAmount', { value: formatMallNumber(d.value) });
  };

  const renderCard = (offer) => {
    const selected = offer.offerSkuCode === selectedSkuCode;
    const rows = offer.validityMonths != null
      ? [{ key: 'validity', label: t('card.rowValidity'), value: t('card.validity', { n: offer.validityMonths }) }]
      : [];
    return (
      <li key={offer.id} className="client-offers__cell">
        <div
          className="client-mall-card client-offers__card"
          role="radio"
          aria-checked={selected}
          aria-labelledby={`${baseId}-t-${offer.id}`}
          data-testid={T.CARD}
        >
          <div className="client-offers__card-head">
            {offer.sessionCount != null ? <MallSessionChip sessionCount={offer.sessionCount} /> : <span />}
            {selected ? (
              <span className="client-offers__selected-tag"><Check className="client-offers__icon" aria-hidden="true" />{t('card.selectedTag')}</span>
            ) : null}
          </div>
          <h3 className="client-mall-card__title" id={`${baseId}-t-${offer.id}`}><SafeText>{offer.title}</SafeText></h3>
          {discountText(offer) ? (
            <>
              <p className="client-offers__orig">
                <span className="sr-only">{t('card.originalSr')}</span>
                <s>{`${formatMallNumber(offer.originalPriceMinor)}${t('card.won')}`}</s>
              </p>
              <p className="client-offers__off">{discountText(offer)}</p>
            </>
          ) : null}
          <MallPrice amountMinor={Number(offer.finalPriceMinor) || 0} sessionCount={offer.sessionCount || 1} />
          {rows.length ? <MallInfoRows rows={rows} className="client-mall-card__rows" /> : null}
          <MGButton
            variant="outline"
            fullWidth
            preventDoubleClick={false}
            disabled={paying}
            aria-pressed={selected}
            className="client-mall-btn client-mall-btn--ink-line client-offers__select"
            onClick={() => setSelectedSkuCode(offer.offerSkuCode)}
          >
            {selected ? (
              <><Check className="client-offers__icon" aria-hidden="true" />{t('card.selectedTag')}</>
            ) : t('card.select')}
          </MGButton>
        </div>
      </li>
    );
  };

  const buyerRows = selectedOffer ? [
    { key: 'name', label: t('buyer.name'), value: <SafeText>{resolveSessionFullName(user)}</SafeText> },
    ...(showMappingPicker ? [{
      key: 'consultant',
      label: t('buyer.consultant'),
      value: (
        <select
          className="client-mall-field__input"
          value={selectedMappingId}
          onChange={(e) => setSelectedMappingId(e.target.value)}
          disabled={paying}
          aria-label={t('buyer.consultant')}
          aria-invalid={needsConsultant}
        >
          <option value="">{t('buyer.consultantPlaceholder')}</option>
          {pickerOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )
    }] : []),
    ...(!noMapping ? [{
      key: 'phone',
      label: t('buyer.phone'),
      value: <MallPhoneVerifyInline flow={phoneFlow} />
    }] : [])
  ] : [];

  const agreementBodies = {
    [CLIENT_MALL_AGREEMENT_KEYS.PURCHASE]: <p>{CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE}</p>,
    [CLIENT_MALL_AGREEMENT_KEYS.USAGE_REFUND]: (
      <>
        {selectedOffer?.validityMonths != null ? <p>{buildClientMallProductUsageNotice(selectedOffer.validityMonths)}</p> : null}
        <p>{CLIENT_REFUND_NOTICE}</p>
      </>
    ),
    [CLIENT_MALL_AGREEMENT_KEYS.THIRD_PARTY]: <p>{CLIENT_MALL_THIRD_PARTY_BODY}</p>
  };

  const blockId = `${baseId}-block`;
  const payReasonId = `${baseId}-pay-reason`;

  const renderPayButton = (describedBy, extraClass) => (
    <MGButton
      variant="primary"
      preventDoubleClick={false}
      className={`client-mall-btn client-mall-btn--primary client-offers__pay-cta${extraClass ? ` ${extraClass}` : ''}`}
      disabled={payBlocked}
      aria-disabled={payDisabled}
      aria-busy={paying ? true : undefined}
      aria-describedby={describedBy}
      onClick={handleCheckout}
      data-testid={T.PAY}
    >
      {!paying && payBlocked ? <Lock className="client-offers__icon" aria-hidden="true" /> : null}
      {paying ? t('bar.paying') : t('bar.pay')}
    </MGButton>
  );

  const discountOf = selectedOffer ? describeOfferDiscount(selectedOffer) : null;
  const discountValueText = !discountOf
    ? ''
    : discountOf.kind === 'rate'
      ? t('card.discountRate', { value: discountOf.value })
      : t('pay.discountValue', { v: formatMallNumber(discountOf.value) });
  const offerMeta = !selectedOffer
    ? ''
    : selectedOffer.validityMonths != null
      ? t('pay.meta', { n: selectedOffer.sessionCount ?? '', m: selectedOffer.validityMonths })
      : t('pay.metaSessions', { n: selectedOffer.sessionCount ?? '' });
  const reasonText = paying ? t('bar.windowHint') : blockMessage;

  const paySummary = loadState === 'ready' && payable.length > 0 ? (
    <section className="client-mall-box client-offers__pay" aria-label={t('bar.label')} data-testid="client-offers-pay-card">
      <h2 className="client-offers__pay-h">{t('bar.label')}</h2>
      {selectedOffer ? (
        <div className="client-offers__pay-item">
          <span className="client-offers__pay-cap">{t('pay.selected')}</span>
          <span className="client-offers__pay-name"><SafeText>{selectedOffer.title}</SafeText></span>
          <span className="client-offers__pay-meta">{offerMeta}</span>
        </div>
      ) : null}
      <dl className="client-offers__pay-rows">
        {selectedOffer && discountOf ? (
          <>
            <div className="client-offers__pay-row">
              <dt>{t('pay.orig')}</dt>
              <dd><s>{`${formatMallNumber(selectedOffer.originalPriceMinor)}${t('card.won')}`}</s></dd>
            </div>
            <div className="client-offers__pay-row">
              <dt>{t('pay.discount')}</dt>
              <dd>{discountValueText}</dd>
            </div>
          </>
        ) : null}
        <div className="client-offers__pay-row client-offers__pay-row--total">
          <dt>{t('bar.label')}</dt>
          <dd className={selectedOffer ? undefined : 'client-offers__bar-amount--empty'}>
            {selectedOffer
              ? `${formatMallNumber(selectedOffer.finalPriceMinor)}${t('card.won')}`
              : t('bar.emptyAmount')}
          </dd>
        </div>
      </dl>
      <div className="client-offers__pay-refund">
        <Info className="client-offers__icon" aria-hidden="true" />
        <p>{CLIENT_REFUND_NOTICE}</p>
        <button
          type="button"
          className="client-offers__pay-refund-link"
          disabled={paying}
          onClick={(event) => openTerms(CLIENT_MALL_AGREEMENT_KEYS.USAGE_REFUND, event.currentTarget)}
        >
          {t('pay.refundLink')}
        </button>
      </div>
      <div className="client-offers__pay-agree">
        <h3 className="client-offers__pay-h">{t('pay.agreeTitle')}</h3>
        <label className="client-offers__pay-agree-all">
          <input
            type="checkbox"
            className="client-mall-check"
            checked={allAgreed}
            disabled={paying}
            onChange={(event) => setAgreements(setAllAgreements(event.target.checked))}
          />
          <span>{t('agree.all')}</span>
        </label>
        <ul className="client-offers__pay-agree-list">
          {CLIENT_MALL_AGREEMENT_ITEMS.map((item) => (
            <li key={item.key} className="client-offers__pay-agree-row">
              <label className="client-offers__pay-agree-label">
                <input
                  type="checkbox"
                  className="client-mall-check"
                  checked={Boolean(agreements[item.key])}
                  disabled={paying}
                  onChange={(event) => setAgreements((prev) => ({ ...prev, [item.key]: event.target.checked }))}
                  aria-label={t(`agree.${item.key}`)}
                />
                <span className="client-offers__pay-agree-tag">{t('agree.required')}</span>
                <span>{t(`agree.${item.key}`)}</span>
              </label>
              <button
                type="button"
                className="client-offers__pay-agree-more"
                aria-haspopup="dialog"
                aria-label={t('pay.moreAria', { label: t(`agree.${item.key}`) })}
                disabled={paying}
                onClick={(event) => openTerms(item.key, event.currentTarget)}
              >
                <ChevronRight className="client-offers__icon" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="client-offers__pay-actions">
        {renderPayButton(reasonText ? payReasonId : undefined)}
        {reasonText ? (
          <p className={`client-offers__pay-reason${paying ? ' client-offers__pay-reason--quiet' : ''}`} id={payReasonId} role="status">
            {reasonText}
          </p>
        ) : null}
      </div>
    </section>
  ) : null;

  return (
    <>
    <ShopClientLayout
      title={t('pageTitle')}
      testId={T.PAGE}
      meta={<p className="client-mall-page__subtitle">{t('pageSubtitle')}</p>}
      className="client-mall--checkout client-offers"
      aside={paySummary}
    >
      <MallPaymentCancelNotice visible={payCancelNotice.visible} onClose={payCancelNotice.dismiss} />
      <MallPayFailedAlert reason={payFailureReason} />
      {message ? <p className="client-mall-field__error" role="alert"><SafeText>{message}</SafeText></p> : null}
      {loadState === 'loading' ? (
        <div className="client-offers__state" role="status">{t('states.sessionLoading')}</div>
      ) : null}
      {loadState === 'error' ? (
        <div className="client-offers__state" role="alert">
          <p>{t('states.loadFailed')}</p>
          <MGButton variant="primary" preventDoubleClick={false} className="client-mall-btn client-mall-btn--primary" onClick={loadData}>
            {t('states.retry')}
          </MGButton>
        </div>
      ) : null}
      {loadState === 'ready' && payable.length === 0 ? (
        <div className="client-mall-box client-offers__state">
          <p className="client-mall-empty__title">{t('states.emptyTitle')}</p>
          <p className="client-mall-empty__body">{t('states.emptyBody')}</p>
        </div>
      ) : null}
      {loadState === 'ready' && payable.length > 0 ? (
        <>
          <MallUsageBanner text={CLIENT_MALL_USAGE_BANNER} example={CLIENT_MALL_USAGE_BANNER_EXAMPLE} />
          <section aria-labelledby={`${baseId}-list`}>
            <p className="client-offers__list-head" id={`${baseId}-list`}>{t('listHead', { count: payable.length })}</p>
            <ul className="client-offers__grid" role="radiogroup" aria-labelledby={`${baseId}-list`}>
              {payable.map(renderCard)}
            </ul>
          </section>
          {selectedOffer ? (
            <>
              <section className="client-mall-box" aria-labelledby={`${baseId}-buyer`}>
                <header className="client-mall-box__head">
                  <h2 className="client-mall-box__title" id={`${baseId}-buyer`}>{t('buyer.title')}</h2>
                </header>
                <MallInfoRows rows={buyerRows} className="client-mall-rows--wide" />
                {noMapping ? (
                  <div className="client-offers__notice" role="alert">
                    <Info className="client-offers__icon" aria-hidden="true" />
                    <div className="client-offers__notice-body">
                      <span className="client-offers__notice-title">{t('buyer.noAssignTitle')}</span>
                      <span>{t('buyer.noAssignText')}</span>
                    </div>
                  </div>
                ) : null}
              </section>
              {!noMapping ? (
                <div className="client-offers__agreements-flow">
                  <MallAgreements
                    checked={agreements}
                    onToggle={(key, value) => setAgreements((prev) => ({ ...prev, [key]: value }))}
                    onToggleAll={(value) => setAgreements(setAllAgreements(value))}
                    bodies={agreementBodies}
                    disabled={paying}
                  />
                </div>
              ) : null}
            </>
          ) : null}
          <div className="client-mall-bar-spacer" aria-hidden="true" />
          <div
            className="client-mall-bar client-offers__paybar"
            role="region"
            aria-label={t('bar.label')}
            data-testid="client-offers-bar"
          >
            <div className="client-mall-bar__inner">
              <div className="client-mall-bar__sum">
                <span className="client-mall-bar__label">{t('bar.label')}</span>
                <span className={`client-offers__bar-amount${selectedOffer ? '' : ' client-offers__bar-amount--empty'}`}>
                  {selectedOffer ? `${formatMallNumber(selectedOffer.finalPriceMinor)}${t('card.won')}` : t('bar.emptyAmount')}
                </span>
                <span className="client-mall-bar__caption" id={blockId} role="status">
                  {blockMessage || (selectedOffer
                    ? t('bar.summary', { title: selectedOffer.title, n: selectedOffer.sessionCount ?? '' })
                    : '')}
                </span>
              </div>
              {renderPayButton(blockMessage ? blockId : undefined, 'client-mall-bar__cta')}
            </div>
          </div>
        </>
      ) : null}
    </ShopClientLayout>
    <UnifiedModal
      isOpen={Boolean(termsKey)}
      onClose={closeTerms}
      title={termsKey ? t(`agree.${termsKey}`) : ''}
      size="medium"
      variant="detail"
      showCloseButton
      closeButtonDataTestId="client-offers-terms-close"
      className="client-offers-terms"
      actions={(
        <MGButton
          variant="outline"
          preventDoubleClick={false}
          onClick={closeTerms}
          data-testid="client-offers-terms-dismiss"
        >
          {t('pay.termsClose')}
        </MGButton>
      )}
    >
      <div className="client-offers-terms__body">
        {termsKey ? agreementBodies[termsKey] : null}
      </div>
    </UnifiedModal>
    </>
  );
};

export default ClientOffersPage;
