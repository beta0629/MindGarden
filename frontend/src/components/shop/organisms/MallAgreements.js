/**
 * MallAgreements — 「전체 동의」 1개 + 필수 3줄 (펼쳐 읽기)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  CLIENT_MALL_AGREEMENT_ITEMS,
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_TEST_IDS
} from '../../../constants/clientMallConstants';
import { ICONS, ICON_SIZES } from '../../../constants/icons';

const ChevronIcon = ICONS.CHEVRON_RIGHT;

/**
 * @param {{
 *   checked: Record<string, boolean>,
 *   onToggle: (key: string, value: boolean) => void,
 *   onToggleAll: (value: boolean) => void,
 *   bodies: Record<string, import('react').ReactNode>,
 *   disabled?: boolean
 * }} props
 */
const MallAgreements = ({ checked, onToggle, onToggleAll, bodies, disabled = false }) => {
  const allChecked = CLIENT_MALL_AGREEMENT_ITEMS.every((item) => checked[item.key]);
  return (
    <section className="client-mall-box" aria-label={CLIENT_MALL_CHECKOUT_COPY.AGREEMENT_SECTION}>
      <h2 className="client-mall-box__title">{CLIENT_MALL_CHECKOUT_COPY.AGREEMENT_SECTION}</h2>
      <label className="client-mall-agree__all">
        <input
          type="checkbox"
          className="client-mall-check"
          checked={allChecked}
          disabled={disabled}
          onChange={(e) => onToggleAll(e.target.checked)}
          data-testid={CLIENT_MALL_TEST_IDS.CHECKOUT_AGREE_ALL}
        />
        <span>{CLIENT_MALL_CHECKOUT_COPY.AGREEMENT_ALL}</span>
      </label>
      <ul className="client-mall-agree__list">
        {CLIENT_MALL_AGREEMENT_ITEMS.map((item) => (
          <li key={item.key} className="client-mall-agree__item">
            <details className="client-mall-agree__details">
              <summary className="client-mall-agree__summary">
                <input
                  type="checkbox"
                  className="client-mall-check"
                  checked={Boolean(checked[item.key])}
                  disabled={disabled}
                  onChange={(e) => onToggle(item.key, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={item.label}
                />
                <span className="client-mall-agree__tag">{CLIENT_MALL_CHECKOUT_COPY.AGREEMENT_REQUIRED_TAG}</span>
                <span className="client-mall-agree__label">{item.label}</span>
                {ChevronIcon ? (
                  <ChevronIcon size={ICON_SIZES.MD} aria-hidden className="client-mall-agree__chevron" />
                ) : null}
              </summary>
              <div className="client-mall-agree__body">{bodies[item.key]}</div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
};

MallAgreements.propTypes = {
  checked: PropTypes.objectOf(PropTypes.bool).isRequired,
  onToggle: PropTypes.func.isRequired,
  onToggleAll: PropTypes.func.isRequired,
  bodies: PropTypes.objectOf(PropTypes.node).isRequired,
  disabled: PropTypes.bool
};

export default MallAgreements;
