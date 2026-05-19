/**
 * PointInput — 포인트 입력 Molecule
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';

/**
 * @param {{
 *   value: string,
 *   onChange: (v: string) => void,
 *   onUseAll: () => void,
 *   maxMinor: number,
 *   disabled?: boolean
 * }} props
 */
const PointInput = ({ value, onChange, onUseAll, maxMinor, disabled = false }) => (
  <div className="client-shop__point-input-row">
    <label className="visually-hidden" htmlFor="shop-point-redeem-input">
      사용 포인트
    </label>
    <input
      id="shop-point-redeem-input"
      type="number"
      min={0}
      max={maxMinor}
      className="client-shop__input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      inputMode="numeric"
    />
    <button
      type="button"
      className="client-shop__cta client-shop__cta--secondary client-shop__cta--inline"
      onClick={onUseAll}
      disabled={disabled || maxMinor <= 0}
    >
      전액 사용
    </button>
  </div>
);

export default PointInput;
