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
import { Check, Info } from 'lucide-react';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import MallSessionChip from '../../../components/shop/atoms/MallSessionChip';
import MallInfoRows from '../../../components/shop/molecules/MallInfoRows';
import MallPrice from '../../../components/shop/molecules/MallPrice';
import MallPayFailedAlert from '../../../components/shop/molecules/MallPayFailedAlert';
import MallPaymentCancelNotice from '../../../components/shop/molecules/MallPaymentCancelNotice';
import MallAgreements from '../../../components/shop/organisms/MallAgreements';
import MGButton from '../../../components/common/MGButton';
import SafeText from '../../../components/common/SafeText';
import {
  CLIENT_MALL_AGREEMENT_ITEMS,
  CLIENT_MALL_AGREEMENT_KEYS,
  CLIENT_MALL_THIRD_PARTY_BODY,
  CLIENT_REFUND_NOTICE,
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
  CLIENT_OFFER_ROUTES,
  SHOP_CLIENT_OFFER_DISCOUNT_TYPE
} from '../../../constants/shopClientOfferConstants';
import { CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE } from '../../../constants/legalPublic';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
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
import { buildSettingsPathWithReturnTo } from '../../../utils/clientSettingsReturnTo';
import {
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
  const navigate = useNavigate();
  const location = useLocation();
  const baseId = useId();
  const payCancelNotice = useShopPaymentCancelNotice();
  const [offers, setOffers] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');
  const [payFailureReason, setPayFailureReason] = useState(() => readClientOffersPayFailureReason(location.state));
  const [selectedSkuCode, setSelectedSkuCode] = useState('');
  const [mappings, setMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [agreements, setAgreements] = useState(EMPTY_AGREEMENTS);
  const restoredRef = useRef(false);
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
  const phoneVerified = portOneCustomerGate.ready;
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
        postShopCheckout: (key, points, mapping) => postShopCheckoutRequest(key, points, mapping, lines),
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

  const discountText = (offer) => (offer.discountType === SHOP_CLIENT_OFFER_DISCOUNT_TYPE.RATE
    ? t('card.discountRate', { value: offer.discountValue })
    : t('card.discountAmount', { value: formatMallNumber(offer.discountValue) }));

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
          <p className="client-offers__orig">
            <span className="sr-only">{t('card.originalSr')}</span>
            <s>{`${formatMallNumber(offer.originalPriceMinor)}${t('card.won')}`}</s>
          </p>
          <p className="client-offers__off">{discountText(offer)}</p>
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
      value: phoneVerified ? (
        <span className="client-mall-phone__done-text">
          {t('buyer.verified', { phone: resolveSessionPhoneNumber(user) || '' })}
        </span>
      ) : (
        <span className="client-mall-phone__needs">
          {t('buyer.needsVerifyText')}{' '}
          <Link to={buildSettingsPathWithReturnTo(`${location.pathname}${location.search}`)}>{t('buyer.settingsLink')}</Link>
        </span>
      )
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

  return (
    <ShopClientLayout
      title={t('pageTitle')}
      testId={T.PAGE}
      meta={<p className="client-mall-page__subtitle">{t('pageSubtitle')}</p>}
      className="client-mall--checkout"
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
                <MallAgreements
                  checked={agreements}
                  onToggle={(key, value) => setAgreements((prev) => ({ ...prev, [key]: value }))}
                  onToggleAll={(value) => setAgreements(setAllAgreements(value))}
                  bodies={agreementBodies}
                  disabled={paying}
                />
              ) : null}
            </>
          ) : null}
          <div className="client-mall-bar-spacer" aria-hidden="true" />
          <div className="client-mall-bar" role="region" aria-label={t('bar.label')} data-testid="client-offers-bar">
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
              <MGButton
                variant="primary"
                preventDoubleClick={false}
                className="client-mall-btn client-mall-btn--primary client-mall-bar__cta"
                aria-disabled={payDisabled}
                aria-describedby={blockMessage ? blockId : undefined}
                onClick={handleCheckout}
                data-testid={T.PAY}
              >
                {paying ? t('bar.paying') : t('bar.pay')}
              </MGButton>
            </div>
          </div>
        </>
      ) : null}
    </ShopClientLayout>
  );
};

export default ClientOffersPage;
