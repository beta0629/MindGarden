/**
 * 상품 구성 빌더 — 선택 목록에서 상품을 담고 빼며, 총 원가·할인율을 보여 주는 공통 UI.
 * 계산은 부모가 utils/packageComposition 으로 수행하고 이 컴포넌트는 표시·입력만 한다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from './SafeText';
import { COMPOSITION_DISCOUNT_MAX } from '../../utils/packageComposition';
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
  onDiscountChange
}) {
  const { t } = useTranslation(NS);
  const baseId = useId();
  const hasItems = items.length > 0;
  const selectable = options;

  const handleSelect = (event) => {
    const option = selectable.find((o) => o.value === event.target.value);
    if (option) {
      onAdd({ ...option });
    }
  };

  return (
    <div className="mg-package-composition">
      <p className="mg-package-composition__hint">{t('hint')}</p>
      <select
        className="mg-package-composition__select"
        aria-label={t('addLabel')}
        value=""
        disabled={disabled || selectable.length === 0}
        onChange={handleSelect}
      >
        <option value="">{selectable.length === 0 ? t('noOptions') : t('addPlaceholder')}</option>
        {selectable.map((o) => (
          <option key={o.value} value={o.value}>
            {t('optionText', { label: o.label, sessions: o.sessions, price: o.price.toLocaleString() })}
          </option>
        ))}
      </select>
      {hasItems ? (
        <ul className="mg-package-composition__list" aria-label={t('listLabel')}>
          {items.map((item, index) => (
            <li key={`${item.value}-${index}`} className="mg-package-composition__item">
              <span className="mg-package-composition__item-label">
                <SafeText>{item.label}</SafeText>
              </span>
              <span className="mg-package-composition__item-meta">
                <SafeText>{t('itemMeta', { sessions: item.sessions, price: Number(item.price || 0).toLocaleString() })}</SafeText>
              </span>
              <button
                type="button"
                className="mg-package-composition__remove"
                aria-label={t('remove', { label: item.label })}
                disabled={disabled}
                onClick={() => onRemove(index)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {hasItems ? (
        <div className="mg-package-composition__summary">
          <div className="mg-package-composition__row">
            <span>{t('originalPrice')}</span>
            <strong><SafeText>{t('priceText', { price: Number(originalPrice || 0).toLocaleString() })}</SafeText></strong>
          </div>
          <div className="mg-package-composition__row">
            <label htmlFor={`${baseId}-discount`}>{t('discountRate')}</label>
            <input
              id={`${baseId}-discount`}
              className="mg-package-composition__discount"
              type="number"
              min="0"
              max={COMPOSITION_DISCOUNT_MAX}
              inputMode="numeric"
              value={Number(discountRate) === 0 ? '' : discountRate}
              placeholder="0"
              disabled={disabled}
              onChange={(e) => onDiscountChange(e.target.value)}
            />
          </div>
          <p className="mg-package-composition__hint">{t('lockedNotice')}</p>
        </div>
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
  onDiscountChange: PropTypes.func.isRequired
};

PackageCompositionBuilder.defaultProps = {
  items: [],
  options: [],
  originalPrice: 0,
  discountRate: 0,
  disabled: false
};

export default PackageCompositionBuilder;
