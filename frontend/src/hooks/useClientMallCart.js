/**
 * 내담자 몰 장바구니 상태 — 서버(로그인) / 로컬(게스트) 공통.
 * 담기 즉시 배지·합계 갱신(낙관적) → 서버 반영, 실패 시 되돌림. 토스트 3초.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CLIENT_MALL_COPY, CLIENT_MALL_LIMITS, CLIENT_MALL_TIMING } from '../constants/clientMallConstants';
import {
  fetchShopCart,
  mergeGuestShopCartIntoServer,
  replaceShopCart
} from '../services/clientShopService';
import { buildCartFromGuestLines, indexCatalogBySku, summarizeMallCart } from '../utils/clientMall';
import { getGuestShopCartLines, setGuestShopCartLines } from '../utils/guestShopCart';

const EMPTY_CART = Object.freeze({ lines: [], subtotalMinor: 0 });

const clampQty = (n) => Math.max(0, Math.min(CLIENT_MALL_LIMITS.QTY_MAX, n));

const withTotals = (lines) => {
  const next = lines.filter((l) => l.quantity > 0).map((l) => ({
    ...l,
    lineTotalMinor: (Number(l.unitPriceMinor) || 0) * l.quantity
  }));
  return {
    lines: next,
    subtotalMinor: next.reduce((sum, l) => sum + l.lineTotalMinor, 0)
  };
};

/**
 * @param {Array<object>} lines
 * @param {string} skuCode
 * @param {number} delta
 * @param {Map<string, object>} bySku
 * @returns {Array<object>}
 */
const applyDelta = (lines, skuCode, delta, bySku) => {
  const idx = lines.findIndex((l) => l.skuCode === skuCode);
  if (idx >= 0) {
    return lines.map((l, i) => (i === idx ? { ...l, quantity: clampQty(l.quantity + delta) } : l));
  }
  if (delta <= 0) {
    return lines;
  }
  const row = bySku.get(skuCode);
  if (!row) {
    return lines;
  }
  return [
    ...lines,
    {
      skuCode,
      title: row.title,
      quantity: clampQty(delta),
      unitPriceMinor: Number(row.unitPriceMinor) || 0,
      sessionCount: row.sessionCount
    }
  ];
};

const toPayload = (lines) => lines.map((l) => ({ skuCode: l.skuCode, quantity: l.quantity }));

/**
 * @param {{
 *   isLoggedIn: boolean,
 *   sessionReady: boolean,
 *   catalog?: Array<object>
 * }} options
 */
const useClientMallCart = ({ isLoggedIn, sessionReady, catalog = [] }) => {
  const [cart, setCart] = useState(EMPTY_CART);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [pulse, setPulse] = useState(false);
  const [lastAddedSku, setLastAddedSku] = useState(null);
  const cartRef = useRef(EMPTY_CART);
  const writeChainRef = useRef(Promise.resolve());
  const toastTimerRef = useRef(null);
  const pulseTimerRef = useRef(null);
  const bySku = useMemo(() => indexCatalogBySku(catalog), [catalog]);

  const commit = useCallback((next) => {
    cartRef.current = next;
    setCart(next);
  }, []);

  const load = useCallback(async() => {
    try {
      setError('');
      if (isLoggedIn) {
        try {
          await mergeGuestShopCartIntoServer();
        } catch {
          // 병합 실패해도 서버 카트는 조회
        }
        const serverCart = await fetchShopCart();
        commit({
          lines: Array.isArray(serverCart?.lines) ? serverCart.lines : [],
          subtotalMinor: Number(serverCart?.subtotalMinor) || 0
        });
      } else {
        commit(buildCartFromGuestLines(getGuestShopCartLines(), catalog));
      }
    } catch (e) {
      setError(e?.message || '');
    } finally {
      setLoaded(true);
    }
  }, [isLoggedIn, catalog, commit]);

  useEffect(() => {
    if (sessionReady) {
      load();
    }
  }, [sessionReady, load]);

  useEffect(() => () => {
    clearTimeout(toastTimerRef.current);
    clearTimeout(pulseTimerRef.current);
  }, []);

  const persist = useCallback((nextLines, previous) => {
    const run = async() => {
      if (isLoggedIn) {
        await replaceShopCart(toPayload(nextLines));
      } else {
        setGuestShopCartLines(toPayload(nextLines));
      }
    };
    const chained = writeChainRef.current.then(run, run);
    writeChainRef.current = chained.catch(() => {});
    return chained.catch((e) => {
      commit(previous);
      throw e;
    });
  }, [isLoggedIn, commit]);

  const changeQuantity = useCallback(async(skuCode, delta) => {
    const previous = cartRef.current;
    const next = withTotals(applyDelta(previous.lines, skuCode, delta, bySku));
    commit(next);
    try {
      setError('');
      await persist(next.lines, previous);
      return true;
    } catch (e) {
      setError(e?.message || CLIENT_MALL_COPY.CART_ADD_FAILED);
      return false;
    }
  }, [bySku, commit, persist]);

  const remove = useCallback((skuCode) => {
    const line = cartRef.current.lines.find((l) => l.skuCode === skuCode);
    return line ? changeQuantity(skuCode, -line.quantity) : Promise.resolve(true);
  }, [changeQuantity]);

  const add = useCallback(async(skuCode, quantity = 1) => {
    const previous = cartRef.current;
    const next = withTotals(applyDelta(previous.lines, skuCode, quantity, bySku));
    commit(next);
    setLastAddedSku(skuCode);
    const row = bySku.get(skuCode);
    const summary = summarizeMallCart(next, catalog);
    setToast({ skuCode, title: row?.title || '', quantity: summary.quantity, subtotalMinor: summary.subtotalMinor });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), CLIENT_MALL_TIMING.TOAST_MS);
    setPulse(true);
    clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setPulse(false), CLIENT_MALL_TIMING.BADGE_PULSE_MS);
    try {
      setError('');
      await persist(next.lines, previous);
      return true;
    } catch (e) {
      clearTimeout(toastTimerRef.current);
      setToast(null);
      setLastAddedSku(null);
      setError(e?.message || CLIENT_MALL_COPY.CART_ADD_FAILED);
      return false;
    }
  }, [bySku, catalog, commit, persist]);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const summary = useMemo(() => summarizeMallCart(cart, catalog), [cart, catalog]);

  return {
    cart,
    summary,
    loaded,
    error,
    toast,
    pulse,
    lastAddedSku,
    reload: load,
    add,
    changeQuantity,
    remove,
    dismissToast
  };
};

export default useClientMallCart;
