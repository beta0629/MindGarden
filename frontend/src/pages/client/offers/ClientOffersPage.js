/**
 * ClientOffersPage — 내담자 전용 결제 화면 (관리자가 나에게 지정한 상품·할인가만 표시)
 * 목록은 서버가 세션 내담자 기준으로 돌려준다. 결제는 기존 바로 구매 체크아웃·PortOne·완료/복귀 화면을
 * 그대로 재사용한다 (기존 몰 파일은 import 만 한다). 지정 상품은 몰 카탈로그에 없어 이 화면이 직접 표시한다.
 *
 * 기존 ShopCheckoutPage 와 겹치는 부분(PR 본문에 명시): 휴대폰 인증 게이트, 약관 본문 조립, 결제 결과 분기.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import MallEmptyState from '../../../components/shop/molecules/MallEmptyState';
import MallInfoRows from '../../../components/shop/molecules/MallInfoRows';
import MallPayFailedAlert from '../../../components/shop/molecules/MallPayFailedAlert';
import MallAgreements from '../../../components/shop/organisms/MallAgreements';
import MallCartBar from '../../../components/shop/organisms/MallCartBar';
import MallPhoneVerifyInline from '../../../components/shop/organisms/MallPhoneVerifyInline';
import MGButton from '../../../components/common/MGButton';
import SafeText from '../../../components/common/SafeText';
import {
  CLIENT_MALL_AGREEMENT_ITEMS,
  CLIENT_MALL_AGREEMENT_KEYS,
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_THIRD_PARTY_BODY,
  CLIENT_REFUND_NOTICE,
  buildClientMallProductUsageNotice
} from '../../../constants/clientMallConstants';
import {
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_CHECKOUT_MAPPING_COPY,
  CLIENT_SHOP_ROUTES,
  SHOP_PAYMENT_VERIFY_ERROR_PHASE,
  SHOP_USER_CANCEL_OUTCOME,
  buildShopOrderDetailPath,
  buildShopPaymentCompletePath,
  buildShopPaymentReturnPath
} from '../../../constants/clientShopConstants';
import {
  CLIENT_OFFER_ROUTES,
  SHOP_CLIENT_OFFER_DISCOUNT_TYPE,
  SHOP_CLIENT_OFFER_I18N_NS,
  SHOP_CLIENT_OFFER_TEST_IDS
} from '../../../constants/shopClientOfferConstants';
import { CLIENT_WEB_SUITE_COPY } from '../../../constants/clientWebSuiteConstants';
import { CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE } from '../../../constants/legalPublic';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import usePhoneVerifyFlow from '../../../hooks/usePhoneVerifyFlow';
import { useSession } from '../../../contexts/SessionContext';
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
import { formatMallWon, resolveMallPayBlock, resolveMallPayBlockMessage } from '../../../utils/clientMall';
import { toBuyNowCheckoutLines } from '../../../utils/clientMallBuyNow';
import { buildSettingsPathWithReturnTo } from '../../../utils/clientSettingsReturnTo';
import { applyVerifiedPhoneToSession } from '../../../utils/clientPhoneVerifiedSession';

const EMPTY_AGREEMENTS = Object.freeze(
  CLIENT_MALL_AGREEMENT_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: false }), {})
);

const ClientOffersPage = () => {
  const { t } = useTranslation(SHOP_CLIENT_OFFER_I18N_NS);
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth({
    requireLogin: true,
    loginRedirectPath: CLIENT_OFFER_ROUTES.OFFERS
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { checkSession } = useSession();
  const [offers, setOffers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [payFailureReason, setPayFailureReason] = useState('');
  const [selectedSkuCode, setSelectedSkuCode] = useState('');
  const [mappings, setMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [agreements, setAgreements] = useState(EMPTY_AGREEMENTS);
  const idempotencyStoreRef = useRef(null);
  if (idempotencyStoreRef.current == null) {
    idempotencyStoreRef.current = createShopCheckoutIdempotencyKeyStore();
  }

  const selectedOffer = useMemo(
    () => offers.find((o) => o.offerSkuCode === selectedSkuCode && !o.paid) || null,
    [offers, selectedSkuCode]
  );

  const loadData = useCallback(async() => {
    try {
      setLoading(true);
      setMessage('');
      const rows = await listMyClientOffers();
      setOffers(rows);
      setMappings(await fetchConsultantMappings());
    } catch (e) {
      setMessage(e.message || t('client.loadFailed'));
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [t]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, loadData]);

  const portOneCustomerGate = useMemo(
    () => assertPortOneCustomerReadyBeforeCheckout(user),
    [user?.id ?? null, resolveSessionPhoneNumber(user), resolveSessionPhoneVerified(user)]
  );

  const phoneFlow = usePhoneVerifyFlow({
    initialPhoneDigits: resolveSessionPhoneNumber(user) || '',
    initiallyVerified: portOneCustomerGate.ready,
    onVerified: ({ phoneDigits, response }) => applyVerifiedPhoneToSession({
      phoneDigits,
      phoneVerifiedAt: response?.phoneVerifiedAt ?? null,
      checkSession
    })
  });

  const titles = useMemo(() => (selectedOffer ? [selectedOffer.title] : []), [selectedOffer]);
  const showMappingPicker = shouldShowConsultantMappingPicker(mappings);
  const pickerOptions = useMemo(() => buildConsultantPickerOptions(mappings, titles), [mappings, titles]);
  const allAgreed = CLIENT_MALL_AGREEMENT_ITEMS.every((item) => agreements[item.key]);
  const phoneVerified = portOneCustomerGate.ready && phoneFlow.isVerified;
  const payBlock = resolveMallPayBlock({ phoneVerified, allAgreed });
  const noMapping = mappings.length === 0;
  const mappingError = showMappingPicker && !selectedMappingId ? SHOP_CHECKOUT_MAPPING_COPY.REQUIRED : '';
  const blockMessage = noMapping ? SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING : resolveMallPayBlockMessage(payBlock);
  const payDisabled = loading || !selectedOffer || Boolean(blockMessage) || Boolean(mappingError);

  const handleCheckout = async() => {
    if (payDisabled || !portOneCustomerGate.ready) {
      setMessage(blockMessage || mappingError);
      return;
    }
    const mappingId = selectedMappingId || resolveInitialMappingId(mappings, titles);
    const lines = toBuyNowCheckoutLines({ skuCode: selectedOffer.offerSkuCode, quantity: 1 });
    const store = idempotencyStoreRef.current;
    const signature = buildShopCheckoutSignature({
      isBuyNow: true,
      lines,
      pointsRedeemMinor: 0,
      mappingId
    });
    try {
      setLoading(true);
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
        navigate(buildShopPaymentReturnPath(flow.checkoutResult.orderPublicId, flow.paymentId), { replace: true });
        return;
      }
      if (flow.status === 'PAYMENT_VERIFIED') {
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
        setPayFailureReason(
          resolvePortOneFailureReason(e.portoneResult, CLIENT_MALL_CHECKOUT_COPY.PAY_FAILED_REASON_FALLBACK)
        );
        return;
      }
      setMessage(e.message || SHOP_CHECKOUT_ERROR_COPY.CHECKOUT_FAILED);
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title={t('client.title')} />;
  }

  const priceLines = (offer) => (
    <>
      <span>{t('client.originalPrice', { price: formatMallWon(offer.originalPriceMinor) })}</span>
      {' · '}
      <span>
        {offer.discountType === SHOP_CLIENT_OFFER_DISCOUNT_TYPE.RATE
          ? t('client.discountRateText', { value: offer.discountValue })
          : t('client.discountAmountText', { value: formatMallWon(offer.discountValue) })}
      </span>
    </>
  );

  const buyerRows = [
    { key: 'name', label: CLIENT_MALL_CHECKOUT_COPY.BUYER_NAME, value: <SafeText>{resolveSessionFullName(user)}</SafeText> },
    ...(showMappingPicker
      ? [{
        key: 'consultant',
        label: CLIENT_MALL_CHECKOUT_COPY.BUYER_CONSULTANT,
        value: (
          <select
            className="client-mall-field__input client-mall-field__select"
            value={selectedMappingId}
            onChange={(e) => setSelectedMappingId(e.target.value)}
            disabled={loading}
            aria-label={SHOP_CHECKOUT_MAPPING_COPY.SECTION_TITLE}
          >
            <option value="">{SHOP_CHECKOUT_MAPPING_COPY.SELECT_PLACEHOLDER}</option>
            {pickerOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )
      }]
      : []),
    { key: 'phone', label: CLIENT_MALL_CHECKOUT_COPY.BUYER_PHONE, value: <MallPhoneVerifyInline flow={phoneFlow} /> }
  ];

  const agreementBodies = {
    [CLIENT_MALL_AGREEMENT_KEYS.PURCHASE]: <p>{CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE}</p>,
    [CLIENT_MALL_AGREEMENT_KEYS.USAGE_REFUND]: (
      <>
        {selectedOffer?.validityMonths != null
          ? <p>{buildClientMallProductUsageNotice(selectedOffer.validityMonths)}</p>
          : null}
        <p>{CLIENT_REFUND_NOTICE}</p>
      </>
    ),
    [CLIENT_MALL_AGREEMENT_KEYS.THIRD_PARTY]: <p>{CLIENT_MALL_THIRD_PARTY_BODY}</p>
  };

  const payable = offers.filter((o) => !o.paid);

  return (
    <ShopClientLayout
      title={t('client.title')}
      eyebrow={t('client.eyebrow')}
      testId={SHOP_CLIENT_OFFER_TEST_IDS.CLIENT_PAGE}
      meta={<p className="client-mall-page__subtitle">{t('client.subtitle')}</p>}
      className="client-mall--checkout"
    >
      {loaded && payable.length === 0 ? <MallEmptyState title={t('client.empty')} /> : null}
      {message ? <p className="client-mall-field__error" role="alert">{message}</p> : null}
      <MallPayFailedAlert reason={payFailureReason} />
      {payable.length > 0 ? (
        <section className="client-mall-box" aria-label={t('client.listSection')}>
          <header className="client-mall-box__head">
            <h2 className="client-mall-box__title">{t('client.listSection')}</h2>
          </header>
          {payable.map((offer) => {
            const selected = offer.offerSkuCode === selectedSkuCode;
            return (
              <div key={offer.id} className="client-mall-line">
                <div>
                  <strong><SafeText>{offer.title}</SafeText></strong>
                  {offer.sessionCount != null
                    ? <span>{` · ${t('client.meta', { sessions: offer.sessionCount })}`}</span>
                    : null}
                  <p className="client-mall-page__hint">{priceLines(offer)}</p>
                  <p><strong>{formatMallWon(offer.finalPriceMinor)}</strong></p>
                </div>
                <MGButton
                  variant={selected ? 'primary' : 'outline'}
                  preventDoubleClick={false}
                  className="client-mall-btn client-mall-btn--ink-line"
                  onClick={() => setSelectedSkuCode(offer.offerSkuCode)}
                  disabled={loading}
                >
                  {selected ? t('client.selected') : t('client.select')}
                </MGButton>
              </div>
            );
          })}
        </section>
      ) : null}
      {selectedOffer ? (
        <>
          <section className="client-mall-box" aria-label={t('client.buyerSection')}>
            <header className="client-mall-box__head">
              <h2 className="client-mall-box__title">{t('client.buyerSection')}</h2>
            </header>
            <MallInfoRows rows={buyerRows} className="client-mall-rows--wide" />
            {!phoneVerified && portOneCustomerGate.message ? (
              <p className="client-mall-page__hint">
                <Link to={buildSettingsPathWithReturnTo(`${location.pathname}${location.search}`)}>
                  {CLIENT_WEB_SUITE_COPY.CHECKOUT_SETTINGS_LINK}
                </Link>
              </p>
            ) : null}
            {mappingError ? <p className="client-mall-field__error" role="alert">{mappingError}</p> : null}
          </section>
          <MallAgreements
            checked={agreements}
            onToggle={(key, value) => setAgreements((prev) => ({ ...prev, [key]: value }))}
            onToggleAll={(value) => setAgreements(
              CLIENT_MALL_AGREEMENT_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: value }), {})
            )}
            bodies={agreementBodies}
            disabled={loading}
          />
          <div className="client-mall-bar-spacer" aria-hidden="true" />
          <MallCartBar
            quantity={1}
            subtotalMinor={selectedOffer.finalPriceMinor}
            heading={t('client.payHeading')}
            label={`${formatMallWon(selectedOffer.finalPriceMinor)}${CLIENT_MALL_CHECKOUT_COPY.PAY_CTA_SUFFIX}`}
            onAction={handleCheckout}
            disabled={payDisabled}
            testId="client-offers-pay-bar"
            actionTestId={SHOP_CLIENT_OFFER_TEST_IDS.CLIENT_PAY}
          />
        </>
      ) : null}
    </ShopClientLayout>
  );
};

export default ClientOffersPage;
