/**
 * 상품 구성 빌더 — 선택 목록에서 상품을 담고 빼며, 총 원가·할인율을 보여 주는 공통 UI.
 * 계산은 부모가 utils/packageComposition 으로 수행하고 이 컴포넌트는 표시·입력만 한다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from './SafeText';
import { ChevronDown, Lock, PackageOpen, SearchX, X } from 'lucide-react';
import {
  calculateComposition,
  COMPOSITION_CANDIDATE_STATE,
  COMPOSITION_DISCOUNT_MAX,
  filterCompositionOptions,
  resolveCompositionCandidateState
} from '../../utils/packageComposition';
import '../../i18n';
import './PackageCompositionBuilder.css';

const NS = 'adminShopComposition';

function PackageCompositionBuilder({
  items,
  options,
  originalPrice,
  discountRate,
  disabled,
  onAdd,
  onRemove,
  onDiscountChange,
  registerHref,
  onRegisterClick
}) {
  const { t } = useTranslation(NS);
  const baseId = useId();
  const [overRange, setOverRange] = useState(false);
  const [query, setQuery] = useState('');
  const hasItems = items.length > 0;
  const selectable = filterCompositionOptions(options, query);
  const candidateState = resolveCompositionCandidateState({
    totalActive: options.length,
    matchedCount: selectable.length
  });
  const noCandidates = candidateState === COMPOSITION_CANDIDATE_STATE.NO_CANDIDATES;
  const noResults = candidateState === COMPOSITION_CANDIDATE_STATE.NO_RESULTS;

  const handleSelect = (event) => {
    const option = selectable.find((o) => o.value === event.target.value);
    if (option) {
      onAdd({ ...option });
    }
  };

  const { price: finalPrice } = calculateComposition(items, discountRate);
  const noOptions = selectable.length === 0;
  const addHint = !noOptions && !hasItems ? t('emptyHint') : null;

  return (
    <div className="mg-package-composition" aria-busy={disabled ? 'true' : undefined}>
      <div className="mg-package-composition__add">
        <label className="mg-package-composition__label" htmlFor={`${baseId}-search`}>
          {t('searchLabel')}
        </label>
        <input
          id={`${baseId}-search`}
          type="search"
          className="mg-package-composition__search"
          value={query}
          placeholder={t('searchPlaceholder')}
          disabled={disabled || noCandidates}
          aria-describedby={`${baseId}-search-hint`}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span id={`${baseId}-search-hint`} className="mg-package-composition__hint">
          {t('searchHint')}
        </span>
        <label className="mg-package-composition__label" htmlFor={`${baseId}-add`}>
          {t('addLabelVisible')}
        </label>
        <span className="mg-package-composition__select-wrap">
          <select
            id={`${baseId}-add`}
            className="mg-package-composition__select"
            aria-label={t('addLabel')}
            value=""
            disabled={disabled || noOptions}
            aria-disabled={disabled || noOptions ? 'true' : undefined}
            onChange={handleSelect}
          >
            <option value="">{noOptions ? t('noOptions') : t('addPlaceholder')}</option>
            {selectable.map((o) => (
              <option key={o.value} value={o.value}>
                {t('optionText', { label: o.label, sessions: o.sessions, price: o.price.toLocaleString() })}
              </option>
            ))}
          </select>
          <ChevronDown className="mg-package-composition__chevron" aria-hidden="true" focusable="false" />
        </span>
        {addHint ? <span className="mg-package-composition__hint">{addHint}</span> : null}
      </div>
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
      {noResults ? (
        <div className="mg-package-composition__state" role="status">
          <SearchX className="mg-package-composition__state-icon" aria-hidden="true" focusable="false" />
          <strong className="mg-package-composition__state-title">
            <SafeText>{t('noResult', { q: query.trim() })}</SafeText>
          </strong>
          <span className="mg-package-composition__hint">{t('noResultHint')}</span>
        </div>
      ) : null}
      {hasItems ? (
        <ul className="mg-package-composition__list" aria-label={t('listLabel')}>
          <li className="mg-package-composition__head" aria-hidden="true">
            <span>{t('colName')}</span>
            <span className="mg-package-composition__num">{t('colSessions')}</span>
            <span className="mg-package-composition__num">{t('colPrice')}</span>
            <span />
          </li>
          {items.map((item, index) => (
            <li key={`${item.value}-${index}`} className="mg-package-composition__item">
              <span className="mg-package-composition__name">
                <SafeText>{item.label}</SafeText>
              </span>
              <span className="mg-package-composition__num mg-package-composition__sessions">
                <SafeText>{t('sessionsText', { sessions: item.sessions })}</SafeText>
              </span>
              <span className="mg-package-composition__num mg-package-composition__price">
                <SafeText>{t('priceText', { price: Number(item.price || 0).toLocaleString() })}</SafeText>
              </span>
              <span className="mg-package-composition__meta">
                <SafeText>{t('itemMeta', { sessions: item.sessions, price: Number(item.price || 0).toLocaleString() })}</SafeText>
              </span>
              <button
                type="button"
                className="mg-package-composition__remove"
                aria-label={t('remove', { label: item.label })}
                disabled={disabled}
                onClick={() => onRemove(index)}
              >
                <X aria-hidden="true" focusable="false" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {hasItems ? (
        <>
          <div className="mg-package-composition__summary">
            <div className="mg-package-composition__cell">
              <span className="mg-package-composition__cap">{t('originalPrice')}</span>
              <strong className="mg-package-composition__value">
                <SafeText>{t('priceText', { price: Number(originalPrice || 0).toLocaleString() })}</SafeText>
              </strong>
            </div>
            <div className="mg-package-composition__cell">
              <label className="mg-package-composition__cap" htmlFor={`${baseId}-discount`}>
                {t('discountRateLabel')}
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
                <span className="mg-package-composition__unit">{t('discountRateUnit')}</span>
              </span>
              <span
                id={`${baseId}-discount-hint`}
                className={`mg-package-composition__hint${overRange ? ' mg-package-composition__hint--error' : ''}`}
                role={overRange ? 'alert' : undefined}
              >
                {overRange ? t('discountRateOver') : t('discountRateHint')}
              </span>
            </div>
            <div className="mg-package-composition__cell">
              <span className="mg-package-composition__cap">{t('finalPrice')}</span>
              <strong className="mg-package-composition__value mg-package-composition__value--final" aria-live="polite">
                <SafeText>{t('priceText', { price: Number(finalPrice || 0).toLocaleString() })}</SafeText>
              </strong>
            </div>
          </div>
          <div className="mg-package-composition__notice" role="note">
            <Lock className="mg-package-composition__notice-icon" aria-hidden="true" focusable="false" />
            <span>{t('lockedNoticeNew')}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}

PackageCompositionBuilder.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
    sessions: PropTypes.number,
    price: PropTypes.number
  })),
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string,
    sessions: PropTypes.number,
    price: PropTypes.number
  })),
  originalPrice: PropTypes.number,
  discountRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  disabled: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onDiscountChange: PropTypes.func.isRequired,
  registerHref: PropTypes.string,
  onRegisterClick: PropTypes.func
};

PackageCompositionBuilder.defaultProps = {
  items: [],
  options: [],
  originalPrice: 0,
  discountRate: 0,
  disabled: false,
  registerHref: '',
  onRegisterClick: undefined
};

export default PackageCompositionBuilder;
