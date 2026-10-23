/**
 * 상품 구성 빌더 — 몰 판매 중 상품을 검색해 담고(수량 스테퍼), 몰 판매가 × 수량 합계·할인·최종 판매가를 보여 주는 공통 UI.
 * 후보 조회는 부모(useCompositionCandidates), 계산은 utils/packageComposition.computeMallComposition.
 * 시안: /workspace/mocks/shop-offers C-02·C-03 (SPEC §4.3)
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import React, { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from './SafeText';
import { AlertCircle, Check, Lock, PackageOpen, RefreshCw, Search, SearchX, X } from 'lucide-react';
import {
  COMPOSITION_CANDIDATE_STATE,
  COMPOSITION_DISCOUNT_MAX,
  COMPOSITION_MIN_QUANTITY,
  COMPOSITION_SESSION_CATEGORY,
  computeMallComposition,
  hasMallCompositionPriceChange,
  resolveCompositionCandidateState
} from '../../utils/packageComposition';
import { COMPOSITION_FETCH_STATUS } from '../../hooks/useCompositionCandidates';
import { ADMIN_SHOP_COMPOSITION_COPY } from '../../constants/adminShopSuite';
import '../../i18n';
import './PackageCompositionBuilder.css';

const NS = 'adminShopComposition';

const money = (value) => Number(value || 0).toLocaleString();

/** 상품명에서 검색어와 맞는 부분만 굵게(색 없음). 빈 조각은 그리지 않는다. */
function HighlightedName({ label = '', query = '' }) {
  const q = String(query || '').trim();
  const text = String(label || '');
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) {
    return <SafeText fallback="">{text}</SafeText>;
  }
  const before = text.slice(0, at);
  const match = text.slice(at, at + q.length);
  const after = text.slice(at + q.length);
  return (
    <>
      {before ? <SafeText fallback="">{before}</SafeText> : null}
      {match ? <b><SafeText fallback="">{match}</SafeText></b> : null}
      {after ? <SafeText fallback="">{after}</SafeText> : null}
    </>
  );
}

HighlightedName.propTypes = { label: PropTypes.string, query: PropTypes.string };

function PackageCompositionBuilder({
  items,
  candidates,
  totalActive,
  status,
  query,
  onQueryChange,
  onRetry,
  discountRate,
  disabled,
  onAdd,
  onQuantityChange,
  onRemove,
  onDiscountChange,
  onRecalc,
  registerHref,
  onRegisterClick,
  legacyLabels
}) {
  const { t } = useTranslation(NS);
  const baseId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [overRange, setOverRange] = useState(false);
  const [nav, setNav] = useState({ key: '', index: -1 });
  const candidateKey = candidates.map((c) => String(c.skuId)).join('\u0000');
  const activeIndex = nav.key === candidateKey && nav.index >= 0 && nav.index < candidates.length
    ? nav.index
    : -1;
  const hasItems = items.length > 0;
  const loaded = status === COMPOSITION_FETCH_STATUS.READY;
  const candidateState = loaded
    ? resolveCompositionCandidateState({ totalActive, matchedCount: candidates.length })
    : null;
  const noCandidates = candidateState === COMPOSITION_CANDIDATE_STATE.NO_CANDIDATES;
  const noResults = candidateState === COMPOSITION_CANDIDATE_STATE.NO_RESULTS;
  const addedIds = new Set(items.map((i) => i.skuId));
  const totals = computeMallComposition(items, discountRate);
  const priceChanged = hasMallCompositionPriceChange(items);
  const popOpen = open && !noCandidates && !disabled;
  const listId = `${baseId}-results`;

  const metaOf = (c) => (c.catalogCategory === COMPOSITION_SESSION_CATEGORY
    ? t('resultMetaSession', { price: money(c.unitPrice), n: c.sessions })
    : t('resultMeta', { price: money(c.unitPrice), kind: t('kindGoods') }));

  const tagOf = (item) => (item.catalogCategory === COMPOSITION_SESSION_CATEGORY
    ? t('tagSession', { kind: t('kindSession'), n: item.sessions })
    : t('kindGoods'));

  // 포커스가 구성 빌더 밖 요소로 옮겨질 때만 닫는다.
  // 삭제·수량처럼 빌더 안의 컨트롤, relatedTarget 이 null 인 blur 는 목록을 닫지 않는다.
  const handleBlur = (event) => {
    const next = event.relatedTarget;
    if (next && rootRef.current && !rootRef.current.contains(next)) {
      setOpen(false);
    }
  };

  // mousedown 기본 동작을 막아 검색 입력 포커스를 유지한다. 키보드 이동은 그대로다.
  const preventSearchBlur = (event) => {
    event.preventDefault();
  };

  // 빌더 안 어디를 눌러도 목록이 닫히며 자리가 밀리지 않게 한다. 포커스가 필요한 입력은 그대로 둔다.
  const keepFieldFocus = (event) => {
    const raw = event.target;
    const target = raw instanceof Element ? raw : raw?.parentElement;
    if (target && target.closest('input, textarea, select, label')) return;
    event.preventDefault();
  };

  const addCandidate = (candidate) => {
    if (!candidate || addedIds.has(candidate.skuId) || candidate.composed) return;
    onAdd(candidate);
  };

  const optionIdAt = (index) => `${baseId}-opt-${index}`;

  const moveActive = (delta) => {
    if (candidates.length === 0) return;
    const next = activeIndex < 0
      ? (delta > 0 ? 0 : candidates.length - 1)
      : Math.min(candidates.length - 1, Math.max(0, activeIndex + delta));
    setNav({ key: candidateKey, index: next });
  };

  const resultsVisible = popOpen
    && status !== COMPOSITION_FETCH_STATUS.ERROR
    && !noResults
    && candidates.length > 0;

  // ↓/↑ 는 활성 행, Enter 는 막히지 않은 활성 행만 담는다. Escape 는 목록을 닫는다.
  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (open) event.preventDefault();
      setOpen(false);
      return;
    }
    if (!resultsVisible) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      addCandidate(candidates[activeIndex]);
    }
  };

  const awaitingFirstResults = candidates.length === 0
    && (status === COMPOSITION_FETCH_STATUS.LOADING || status === COMPOSITION_FETCH_STATUS.IDLE);

  const renderPop = () => {
    if (awaitingFirstResults) {
      return (
        <div className="mg-package-composition__pop mg-package-composition__pop--state" id={listId} role="status" onMouseDown={preventSearchBlur}>
          <span className="mg-package-composition__spinner" aria-hidden="true" />
          <span>{t('searching')}</span>
        </div>
      );
    }
    if (status === COMPOSITION_FETCH_STATUS.ERROR) {
      return (
        <div className="mg-package-composition__pop mg-package-composition__pop--state mg-package-composition__pop--error" id={listId} role="alert" onMouseDown={preventSearchBlur}>
          <AlertCircle className="mg-package-composition__state-icon" aria-hidden="true" focusable="false" />
          <span className="mg-package-composition__state-body">
            <strong className="mg-package-composition__state-title">{t('error')}</strong>
            <span className="mg-package-composition__hint">{t('errorHint')}</span>
          </span>
          <button type="button" className="mg-package-composition__btn" onClick={onRetry}>{t('retry')}</button>
        </div>
      );
    }
    if (noResults) {
      return (
        <div className="mg-package-composition__pop mg-package-composition__pop--state" id={listId} role="status" onMouseDown={preventSearchBlur}>
          <SearchX className="mg-package-composition__state-icon" aria-hidden="true" focusable="false" />
          <span className="mg-package-composition__state-body">
            <strong className="mg-package-composition__state-title">
              <SafeText>{t('noResult', { q: String(query || '').trim() })}</SafeText>
            </strong>
            <span className="mg-package-composition__hint">{t('noResultHint')}</span>
          </span>
        </div>
      );
    }
    return (
      <div className="mg-package-composition__pop" id={listId} onMouseDown={preventSearchBlur}>
        <p className="mg-package-composition__count">{t('resultCount', { n: candidates.length })}</p>
        <ul className="mg-package-composition__results mg-listbox--inline" role="listbox" aria-label={t('resultsLabel')}>
          {candidates.map((c, index) => {
            const added = addedIds.has(c.skuId);
            const blocked = added || c.composed;
            const active = index === activeIndex;
            return (
              <li
                key={c.skuId}
                id={optionIdAt(index)}
                className={`mg-package-composition__opt${active ? ' mg-package-composition__opt--active' : ''}`}
                role="option"
                aria-selected={added}
                aria-disabled={blocked}
                onMouseDown={preventSearchBlur}
                onMouseEnter={() => setNav({ key: candidateKey, index })}
                onClick={() => addCandidate(c)}
              >
                <span className="mg-package-composition__opt-main">
                  <span className="mg-package-composition__opt-name"><HighlightedName label={c.label} query={query} /></span>
                  <span className="mg-package-composition__opt-meta"><SafeText>{metaOf(c)}</SafeText></span>
                </span>
                {added ? (
                  <span className="mg-package-composition__tag-added">
                    <Check aria-hidden="true" focusable="false" />
                    {t('added')}
                  </span>
                ) : null}
                {!added && c.composed ? (
                  <span className="mg-package-composition__tag-added">{t('composedTag')}</span>
                ) : null}
                {!blocked ? (
                  <button
                    type="button"
                    className="mg-package-composition__add-btn"
                    aria-label={`${c.label} ${t('add')}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      addCandidate(c);
                    }}
                  >
                    {t('add')}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div
      className="mg-package-composition"
      ref={rootRef}
      onMouseDown={keepFieldFocus}
      aria-busy={disabled ? 'true' : undefined}
    >
      <p className="mg-package-composition__lead">{t('hint')}</p>
      <div className="mg-package-composition__search-block" onBlur={handleBlur}>
        <label className="mg-package-composition__label" htmlFor={`${baseId}-search`}>
          {t('searchLabel')}
        </label>
        <span className="mg-package-composition__search-ctl">
          <Search className="mg-package-composition__search-icon" aria-hidden="true" focusable="false" />
          <input
            id={`${baseId}-search`}
            type="search"
            role="combobox"
            aria-expanded={popOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={resultsVisible && activeIndex >= 0 ? optionIdAt(activeIndex) : undefined}
            className="mg-package-composition__search"
            value={query}
            placeholder={t('searchPlaceholder')}
            disabled={disabled || noCandidates}
            aria-describedby={`${baseId}-search-hint`}
            onFocus={() => setOpen(true)}
            onKeyDown={handleSearchKeyDown}
            onChange={(e) => { setOpen(true); onQueryChange(e.target.value); }}
          />
        </span>
        <span id={`${baseId}-search-hint`} className="mg-package-composition__hint">
          {t('searchHint')}
        </span>
        {popOpen ? renderPop() : null}
      </div>
      {legacyLabels.length > 0 ? (
        <div className="mg-package-composition__notice" role="note">
          <AlertCircle className="mg-package-composition__notice-icon" aria-hidden="true" focusable="false" />
          <span className="mg-package-composition__notice-text">{ADMIN_SHOP_COMPOSITION_COPY.LEGACY_NOTICE}</span>
          <ul className="mg-package-composition__legacy" aria-label={ADMIN_SHOP_COMPOSITION_COPY.LEGACY_LIST_LABEL}>
            {legacyLabels.map((label, index) => (
              <li key={`${label}-${index}`}><SafeText>{label}</SafeText></li>
            ))}
          </ul>
        </div>
      ) : null}
      {noCandidates ? (
        <div className="mg-package-composition__state" role="status">
          <PackageOpen className="mg-package-composition__state-icon" aria-hidden="true" focusable="false" />
          <strong className="mg-package-composition__state-title">{t('noCandTitle')}</strong>
          <span className="mg-package-composition__hint">{t('noCandBody')}</span>
          {registerHref ? (
            <a
              className="mg-package-composition__state-link"
              href={registerHref}
              onClick={onRegisterClick ? (e) => { e.preventDefault(); onRegisterClick(); } : undefined}
            >
              {t('noCandLink')}
            </a>
          ) : null}
        </div>
      ) : null}
      {!hasItems && !noCandidates ? (
        <div className="mg-package-composition__empty">
          <PackageOpen className="mg-package-composition__state-icon" aria-hidden="true" focusable="false" />
          <strong className="mg-package-composition__state-title">{t('emptyTitle')}</strong>
          <span className="mg-package-composition__hint">{t('emptyBody')}</span>
        </div>
      ) : null}
      {hasItems ? (
        <ul className="mg-package-composition__list" aria-label={t('listLabel')}>
          <li className="mg-package-composition__head" aria-hidden="true">
            <span>{t('colName')}</span>
            <span className="mg-package-composition__num">{t('colUnit')}</span>
            <span className="mg-package-composition__cen">{t('colQty')}</span>
            <span className="mg-package-composition__num">{t('colSub')}</span>
            <span />
          </li>
          {items.map((item) => (
            <li key={item.skuId} className="mg-package-composition__item">
              <span className="mg-package-composition__name-wrap">
                <span className="mg-package-composition__name"><SafeText>{item.label}</SafeText></span>
                <span className="mg-package-composition__tag">
                  <SafeText>{item.available === false ? t('unavailableTag') : tagOf(item)}</SafeText>
                </span>
                {item.priceChanged ? (
                  <span
                    className="mg-package-composition__badge"
                    aria-label={t('priceChangedAria', { label: item.label, price: money(item.currentUnitPrice) })}
                  >
                    {ADMIN_SHOP_COMPOSITION_COPY.PRICE_CHANGED}
                  </span>
                ) : null}
              </span>
              <span className="mg-package-composition__num mg-package-composition__unit-price">
                <SafeText>{t('priceText', { price: money(item.unitPrice) })}</SafeText>
              </span>
              <span className="mg-package-composition__cen mg-package-composition__qty">
                <span className="mg-package-composition__stepper">
                  <button
                    type="button"
                    className="mg-package-composition__step"
                    aria-label={t('qtyDec', { label: item.label })}
                    disabled={disabled || item.quantity <= COMPOSITION_MIN_QUANTITY}
                    onClick={() => onQuantityChange(item.skuId, item.quantity - 1)}
                  >
                    {t('qtyDecSymbol')}
                  </button>
                  <span className="mg-package-composition__step-val" aria-live="polite">{item.quantity}</span>
                  <button
                    type="button"
                    className="mg-package-composition__step"
                    aria-label={t('qtyInc', { label: item.label })}
                    disabled={disabled}
                    onClick={() => onQuantityChange(item.skuId, item.quantity + 1)}
                  >
                    {t('qtyIncSymbol')}
                  </button>
                </span>
              </span>
              <span className="mg-package-composition__num mg-package-composition__sub">
                <SafeText>{t('priceText', { price: money(item.unitPrice * item.quantity) })}</SafeText>
              </span>
              <button
                type="button"
                className="mg-package-composition__remove"
                aria-label={t('remove', { label: item.label })}
                disabled={disabled}
                onClick={() => onRemove(item.skuId)}
              >
                <X aria-hidden="true" focusable="false" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {hasItems && priceChanged ? (
        <div className="mg-package-composition__notice" role="status">
          <AlertCircle className="mg-package-composition__notice-icon" aria-hidden="true" focusable="false" />
          <span className="mg-package-composition__notice-text">{t('priceChangedNotice')}</span>
          <button type="button" className="mg-package-composition__btn" disabled={disabled} onClick={onRecalc}>
            <RefreshCw aria-hidden="true" focusable="false" />
            {ADMIN_SHOP_COMPOSITION_COPY.RECALC}
          </button>
        </div>
      ) : null}
      {hasItems ? (
        <>
          <div className="mg-package-composition__summary" role="group" aria-label={t('sumTitle')}>
            <div className="mg-package-composition__row">
              <span className="mg-package-composition__cap">
                {t('subtotal')}
                <span className="mg-package-composition__cap-sub">{t('sessionsSum', { n: totals.sessions })}</span>
              </span>
              <span className="mg-package-composition__value">
                <SafeText>{t('priceText', { price: money(totals.subtotal) })}</SafeText>
              </span>
            </div>
            <div className="mg-package-composition__row">
              <label className="mg-package-composition__cap" htmlFor={`${baseId}-discount`}>
                {t('discountRate')}
                <span
                  id={`${baseId}-discount-hint`}
                  className={`mg-package-composition__cap-sub${overRange ? ' mg-package-composition__hint--error' : ''}`}
                  role={overRange ? 'alert' : undefined}
                >
                  {overRange ? t('discountRateOver') : t('discountHint')}
                </span>
              </label>
              <span className="mg-package-composition__affix">
                <input
                  id={`${baseId}-discount`}
                  className="mg-package-composition__discount"
                  type="text"
                  inputMode="numeric"
                  value={Number(discountRate) === 0 ? '' : discountRate}
                  placeholder="0"
                  disabled={disabled}
                  aria-describedby={`${baseId}-discount-hint`}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    const over = digits !== '' && Number(digits) > COMPOSITION_DISCOUNT_MAX;
                    setOverRange(over);
                    onDiscountChange(over ? String(COMPOSITION_DISCOUNT_MAX) : digits);
                  }}
                />
                <span className="mg-package-composition__unit">{t('discountUnit')}</span>
              </span>
            </div>
            <div className="mg-package-composition__row">
              <span className="mg-package-composition__cap">{t('discountAmount')}</span>
              <span className="mg-package-composition__value">
                <SafeText>{t('discountAmountValue', { price: money(totals.discountAmount) })}</SafeText>
              </span>
            </div>
            <div className="mg-package-composition__row mg-package-composition__row--final">
              <span className="mg-package-composition__cap mg-package-composition__cap--final">{t('final')}</span>
              <strong className="mg-package-composition__value mg-package-composition__value--final" aria-live="polite">
                <SafeText>{t('priceText', { price: money(totals.finalPrice) })}</SafeText>
              </strong>
            </div>
          </div>
          <div className="mg-package-composition__notice mg-package-composition__notice--quiet" role="note">
            <Lock className="mg-package-composition__notice-icon" aria-hidden="true" focusable="false" />
            <span className="mg-package-composition__notice-text">{t('locked')}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}

const itemShape = PropTypes.shape({
  skuId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  label: PropTypes.string,
  catalogCategory: PropTypes.string,
  unitPrice: PropTypes.number,
  sessions: PropTypes.number,
  quantity: PropTypes.number,
  priceChanged: PropTypes.bool,
  currentUnitPrice: PropTypes.number,
  available: PropTypes.bool
});

PackageCompositionBuilder.propTypes = {
  items: PropTypes.arrayOf(itemShape),
  candidates: PropTypes.arrayOf(itemShape),
  totalActive: PropTypes.number,
  status: PropTypes.oneOf(Object.values(COMPOSITION_FETCH_STATUS)),
  query: PropTypes.string,
  onQueryChange: PropTypes.func.isRequired,
  onRetry: PropTypes.func,
  discountRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  disabled: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
  onQuantityChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onDiscountChange: PropTypes.func.isRequired,
  onRecalc: PropTypes.func,
  registerHref: PropTypes.string,
  onRegisterClick: PropTypes.func,
  legacyLabels: PropTypes.arrayOf(PropTypes.string)
};

PackageCompositionBuilder.defaultProps = {
  items: [],
  candidates: [],
  totalActive: 0,
  status: COMPOSITION_FETCH_STATUS.IDLE,
  query: '',
  onRetry: undefined,
  discountRate: 0,
  disabled: false,
  onRecalc: undefined,
  registerHref: '',
  onRegisterClick: undefined,
  legacyLabels: []
};

export default PackageCompositionBuilder;
