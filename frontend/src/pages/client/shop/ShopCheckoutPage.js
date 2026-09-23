/**
 * ShopCheckoutPage — 체크아웃·포인트 사용·상담 매핑 선택·결제 준비
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import PointInput from '../../../components/shop/molecules/PointInput';
import CheckoutSummary from '../../../components/shop/organisms/CheckoutSummary';
import { formatShopMoney, formatShopPoints } from '../../../utils/clientShopFormat';
import {
  SHOP_CHECKOUT_AGREEMENT_LABEL,
  SHOP_CHECKOUT_EMAIL_COPY,
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_CHECKOUT_FULL_NAME_COPY,
  SHOP_CHECKOUT_MAPPING_COPY,
  SHOP_CHECKOUT_PHONE_COPY,
  SHOP_CATALOG_CATEGORY,
  CLIENT_SHOP_ROUTES,
  SHOP_PAYMENT_LAUNCH_COPY
} from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import {
  fetchConsultantMappings,
  fetchPointBalance,
  fetchShopCart,
  fetchShopCatalog,
  postShopCheckout,
  prepareShopPayment
} from '../../../services/clientShopService';
import {
  isPortOneCustomerEmailFormat,
  isPortOneCustomerPhoneFormat,
  launchShopPaymentFromPrepare,
  resolvePortOneCustomer,
  resolveSessionEmail,
  resolveSessionFullName,
  resolveSessionPhoneNumber
} from '../../../utils/clientShopPaymentLaunch';

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}`;
};

/**
 * Error / string / {message} / 빈 메시지를 사용자용 문자열로 정규화한다.
 *
 * @param {*} error
 * @param {string} fallback
 * @returns {string}
 */
const toUserErrorMessage = (error, fallback) => {
  if (error instanceof Error) {
    const msg = typeof error.message === 'string' ? error.message.trim() : '';
    return msg || fallback;
  }
  if (typeof error === 'string') {
    const msg = error.trim();
    return msg || fallback;
  }
  if (error && typeof error === 'object') {
    const msg = typeof error.message === 'string' ? error.message.trim() : '';
    if (msg) {
      return msg;
    }
  }
  return fallback;
};

/**
 * @param {Array<{ skuCode?: string }>} cartLines
 * @param {Array<{ skuCode?: string, catalogCategory?: string }>} catalog
 */
const cartHasConsultationSku = (cartLines, catalog) => {
  const consultationCodes = new Set(
    (catalog || [])
      .filter((row) => row.catalogCategory === SHOP_CATALOG_CATEGORY.CONSULTATION)
      .map((row) => row.skuCode)
  );
  return (cartLines || []).some((line) => consultationCodes.has(line.skuCode));
};

const ShopCheckoutPage = () => {
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth();
  const [cart, setCart] = useState({ lines: [], subtotalMinor: 0 });
  const [catalog, setCatalog] = useState([]);
  const [balance, setBalance] = useState({ availableMinor: 0, heldMinor: 0 });
  const [consultantMappings, setConsultantMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [pointsInput, setPointsInput] = useState('0');
  const [agreed, setAgreed] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutFullName, setCheckoutFullName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);

  const sessionEmail = useMemo(() => resolveSessionEmail(user), [user]);
  const sessionFullName = useMemo(() => resolveSessionFullName(user), [user]);
  const sessionPhoneNumber = useMemo(() => resolveSessionPhoneNumber(user), [user]);
  const needsCheckoutEmail = !sessionEmail;
  const needsCheckoutFullName = !sessionFullName;
  const needsCheckoutPhone = !sessionPhoneNumber;

  const hasConsultationInCart = useMemo(
    () => cartHasConsultationSku(cart.lines, catalog),
    [cart.lines, catalog]
  );

  const loadData = useCallback(async() => {
    try {
      setLoading(true);
      setMessage('');
      const [catalogData, cartData, balanceData] = await Promise.all([
        fetchShopCatalog(),
        fetchShopCart(),
        fetchPointBalance()
      ]);
      setCatalog(catalogData);
      setCart(cartData);
      setBalance(balanceData);

      const needsMapping = cartHasConsultationSku(cartData.lines, catalogData);
      if (needsMapping) {
        const mappings = await fetchConsultantMappings();
        setConsultantMappings(mappings);
        if (mappings.length === 1) {
          setSelectedMappingId(String(mappings[0].mappingId));
        } else {
          setSelectedMappingId('');
        }
      } else {
        setConsultantMappings([]);
        setSelectedMappingId('');
      }
    } catch (e) {
      setMessage(e.message || '결제 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, loadData]);

  const subtotalMinor = cart.subtotalMinor || 0;
  const availableMinor = balance.availableMinor || 0;

  const pointsRedeemMinor = useMemo(() => {
    const parsed = Math.max(0, parseInt(pointsInput, 10) || 0);
    return Math.min(parsed, availableMinor, subtotalMinor);
  }, [pointsInput, availableMinor, subtotalMinor]);

  const cashDueMinor = Math.max(0, subtotalMinor - pointsRedeemMinor);

  const pointsError = useMemo(() => {
    const parsed = parseInt(pointsInput, 10) || 0;
    if (parsed < 0) {
      return '0 이상 입력해 주세요.';
    }
    if (parsed > availableMinor) {
      return '보유 포인트를 초과할 수 없습니다.';
    }
    if (parsed > subtotalMinor) {
      return '상품 금액을 초과할 수 없습니다.';
    }
    return '';
  }, [pointsInput, availableMinor, subtotalMinor]);

  const mappingError = useMemo(() => {
    if (!hasConsultationInCart) {
      return '';
    }
    if (consultantMappings.length === 0) {
      return SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING;
    }
    if (consultantMappings.length > 1 && !selectedMappingId) {
      return SHOP_CHECKOUT_MAPPING_COPY.REQUIRED;
    }
    return '';
  }, [hasConsultationInCart, consultantMappings.length, selectedMappingId]);

  const singleMappingLabel = useMemo(() => {
    if (consultantMappings.length !== 1) {
      return '';
    }
    const row = consultantMappings[0];
    const name = row.consultantDisplayName || '';
    const suffix = row.label ? ` (${row.label})` : '';
    return `${SHOP_CHECKOUT_MAPPING_COPY.AUTO_PREFIX}: ${name}${suffix}`;
  }, [consultantMappings]);

  const handleUseAllPoints = () => {
    setPointsInput(String(Math.min(availableMinor, subtotalMinor)));
  };

  const handleCheckout = async() => {
    if (!agreed) {
      setMessage('결제 진행에 동의해 주세요.');
      return;
    }
    if (pointsError) {
      setMessage(pointsError);
      return;
    }
    if (mappingError) {
      setMessage(mappingError);
      return;
    }
    if (needsCheckoutEmail) {
      const trimmedCheckoutEmail = checkoutEmail.trim();
      if (!trimmedCheckoutEmail) {
        setMessage(SHOP_CHECKOUT_EMAIL_COPY.REQUIRED);
        return;
      }
      if (!isPortOneCustomerEmailFormat(trimmedCheckoutEmail)) {
        setMessage(SHOP_CHECKOUT_EMAIL_COPY.INVALID);
        return;
      }
    }
    if (needsCheckoutFullName) {
      const trimmedCheckoutFullName = checkoutFullName.trim();
      if (!trimmedCheckoutFullName) {
        setMessage(SHOP_CHECKOUT_FULL_NAME_COPY.REQUIRED);
        return;
      }
    }
    if (needsCheckoutPhone) {
      const trimmedCheckoutPhone = checkoutPhone.trim();
      if (!trimmedCheckoutPhone) {
        setMessage(SHOP_CHECKOUT_PHONE_COPY.REQUIRED);
        return;
      }
      if (!isPortOneCustomerPhoneFormat(trimmedCheckoutPhone)) {
        setMessage(SHOP_CHECKOUT_PHONE_COPY.INVALID);
        return;
      }
    }
    const lines = cart.lines || [];
    if (lines.length === 0) {
      setMessage('장바구니가 비어 있습니다.');
      return;
    }
    const mappingIdForCheckout =
      hasConsultationInCart && selectedMappingId ? selectedMappingId : null;

    let result;
    try {
      setLoading(true);
      setMessage('');
      setCheckoutResult(null);
      result = await postShopCheckout(
        createIdempotencyKey(),
        pointsRedeemMinor,
        mappingIdForCheckout
      );
      setCheckoutResult(result);
    } catch (e) {
      setMessage(toUserErrorMessage(e, SHOP_CHECKOUT_ERROR_COPY.CHECKOUT_FAILED));
      setLoading(false);
      return;
    }

    if (result?.nextStep === 'PAYMENT' && result.orderPublicId) {
      try {
        const prepareResult = await prepareShopPayment(result.orderPublicId);
        try {
          const customer = resolvePortOneCustomer({
            user,
            checkoutEmail,
            checkoutFullName,
            checkoutPhone
          });
          await launchShopPaymentFromPrepare(prepareResult, { customer });
        } catch (launchError) {
          setMessage(
            toUserErrorMessage(
              launchError,
              SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE
            )
          );
          setLoading(false);
          return;
        }
      } catch (prepareError) {
        setMessage(
          toUserErrorMessage(prepareError, SHOP_CHECKOUT_ERROR_COPY.PREPARE_FAILED)
        );
        setLoading(false);
        return;
      }
    }

    try {
      setMessage('주문이 접수되었습니다. 결제 안내에 따라 진행해 주세요.');
      await loadData();
    } catch (e) {
      setMessage(toUserErrorMessage(e, '결제 정보를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title="결제하기" />;
  }

  const lines = cart.lines || [];
  const checkoutEmailBlocked =
    needsCheckoutEmail && !checkoutEmail.trim();
  const checkoutFullNameBlocked =
    needsCheckoutFullName && !checkoutFullName.trim();
  const checkoutPhoneBlocked =
    needsCheckoutPhone && !checkoutPhone.trim();
  const checkoutBlocked =
    Boolean(pointsError) ||
    Boolean(mappingError) ||
    checkoutEmailBlocked ||
    checkoutFullNameBlocked ||
    checkoutPhoneBlocked ||
    (hasConsultationInCart && consultantMappings.length === 0);

  return (
    <ShopClientLayout title="결제하기" testId="client-shop-checkout">
      {lines.length === 0 ? (
        <p className="client-shop__empty">
          장바구니가 비어 있습니다.{' '}
          <Link to={CLIENT_SHOP_ROUTES.CATALOG}>상품 보러 가기</Link>
        </p>
      ) : (
        <>
          <section className="client-shop__section" aria-label="주문 상품">
            <h2 className="client-shop__section-title">주문 상품</h2>
            {lines.map((line) => (
              <p key={line.skuCode} className="client-shop__summary-row">
                <span>
                  {line.title} × {line.quantity}
                </span>
                <span>{formatShopMoney(line.lineTotalMinor)}</span>
              </p>
            ))}
          </section>

          {hasConsultationInCart ? (
            <section className="client-shop__section" aria-label="담당 상담사">
              <h2 className="client-shop__section-title">
                {SHOP_CHECKOUT_MAPPING_COPY.SECTION_TITLE}
              </h2>
              {consultantMappings.length === 0 ? (
                <p className="client-shop__message client-shop__message--error" role="alert">
                  {SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING}
                </p>
              ) : consultantMappings.length === 1 ? (
                <p className="client-shop__message">{singleMappingLabel}</p>
              ) : (
                <>
                  <label className="client-shop__field-label" htmlFor="shop-consultant-mapping">
                    {SHOP_CHECKOUT_MAPPING_COPY.SECTION_TITLE}
                  </label>
                  <select
                    id="shop-consultant-mapping"
                    className="client-shop__select"
                    value={selectedMappingId}
                    onChange={(e) => setSelectedMappingId(e.target.value)}
                    disabled={loading}
                    aria-required="true"
                  >
                    <option value="">{SHOP_CHECKOUT_MAPPING_COPY.SELECT_PLACEHOLDER}</option>
                    {consultantMappings.map((row) => {
                      const labelSuffix = row.label ? ` — ${row.label}` : '';
                      return (
                        <option key={row.mappingId} value={String(row.mappingId)}>
                          {row.consultantDisplayName}
                          {labelSuffix}
                        </option>
                      );
                    })}
                  </select>
                  {mappingError ? (
                    <p className="client-shop__message client-shop__message--error" role="alert">
                      {mappingError}
                    </p>
                  ) : null}
                </>
              )}
            </section>
          ) : null}

          {needsCheckoutEmail ? (
            <section className="client-shop__section" aria-label={SHOP_CHECKOUT_EMAIL_COPY.SECTION_TITLE}>
              <h2 className="client-shop__section-title">
                {SHOP_CHECKOUT_EMAIL_COPY.SECTION_TITLE}
              </h2>
              <p className="client-shop__message">{SHOP_CHECKOUT_EMAIL_COPY.HELP}</p>
              <label className="client-shop__field-label" htmlFor="shop-checkout-email">
                {SHOP_CHECKOUT_EMAIL_COPY.LABEL}
              </label>
              <input
                id="shop-checkout-email"
                type="email"
                className="client-shop__input"
                value={checkoutEmail}
                onChange={(e) => setCheckoutEmail(e.target.value)}
                placeholder={SHOP_CHECKOUT_EMAIL_COPY.PLACEHOLDER}
                disabled={loading}
                autoComplete="email"
                aria-required="true"
              />
            </section>
          ) : null}

          {needsCheckoutFullName ? (
            <section
              className="client-shop__section"
              aria-label={SHOP_CHECKOUT_FULL_NAME_COPY.SECTION_TITLE}
            >
              <h2 className="client-shop__section-title">
                {SHOP_CHECKOUT_FULL_NAME_COPY.SECTION_TITLE}
              </h2>
              <p className="client-shop__message">{SHOP_CHECKOUT_FULL_NAME_COPY.HELP}</p>
              <label className="client-shop__field-label" htmlFor="shop-checkout-full-name">
                {SHOP_CHECKOUT_FULL_NAME_COPY.LABEL}
              </label>
              <input
                id="shop-checkout-full-name"
                type="text"
                className="client-shop__input"
                value={checkoutFullName}
                onChange={(e) => setCheckoutFullName(e.target.value)}
                placeholder={SHOP_CHECKOUT_FULL_NAME_COPY.PLACEHOLDER}
                disabled={loading}
                autoComplete="name"
                aria-required="true"
              />
            </section>
          ) : null}

          {needsCheckoutPhone ? (
            <section
              className="client-shop__section"
              aria-label={SHOP_CHECKOUT_PHONE_COPY.SECTION_TITLE}
            >
              <h2 className="client-shop__section-title">
                {SHOP_CHECKOUT_PHONE_COPY.SECTION_TITLE}
              </h2>
              <p className="client-shop__message">{SHOP_CHECKOUT_PHONE_COPY.HELP}</p>
              <label className="client-shop__field-label" htmlFor="shop-checkout-phone">
                {SHOP_CHECKOUT_PHONE_COPY.LABEL}
              </label>
              <input
                id="shop-checkout-phone"
                type="tel"
                className="client-shop__input"
                value={checkoutPhone}
                onChange={(e) => setCheckoutPhone(e.target.value)}
                placeholder={SHOP_CHECKOUT_PHONE_COPY.PLACEHOLDER}
                disabled={loading}
                autoComplete="tel"
                aria-required="true"
              />
            </section>
          ) : null}

          <section className="client-shop__section" aria-label="포인트 사용">
            <h2 className="client-shop__section-title">포인트 사용</h2>
            <p className="client-shop__message">
              보유 포인트:{' '}
              <strong className="client-shop__point-amount--accent">
                {formatShopPoints(availableMinor)}
              </strong>
            </p>
            <PointInput
              value={pointsInput}
              onChange={setPointsInput}
              onUseAll={handleUseAllPoints}
              maxMinor={Math.min(availableMinor, subtotalMinor)}
              disabled={loading}
            />
            {pointsError ? (
              <p className="client-shop__message client-shop__message--error" role="alert">
                {pointsError}
              </p>
            ) : null}
          </section>

          <CheckoutSummary
            subtotalMinor={subtotalMinor}
            pointsRedeemMinor={pointsRedeemMinor}
            cashDueMinor={cashDueMinor}
          />

          <label className="client-shop__checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>{SHOP_CHECKOUT_AGREEMENT_LABEL}</span>
          </label>

          {message ? (
            <p className="client-shop__message" role="status">
              {message}
            </p>
          ) : null}

          <button
            type="button"
            className="client-shop__cta"
            disabled={loading || !agreed || checkoutBlocked}
            onClick={handleCheckout}
          >
            {formatShopMoney(cashDueMinor)} 결제하기
          </button>

          {checkoutResult?.orderPublicId ? (
            <p className="client-shop__message">
              주문 번호: {checkoutResult.orderPublicId}
            </p>
          ) : null}
        </>
      )}
    </ShopClientLayout>
  );
};

export default ShopCheckoutPage;
