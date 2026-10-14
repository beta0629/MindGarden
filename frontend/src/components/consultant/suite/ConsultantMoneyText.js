/**
 * ConsultantMoneyText — 금액 「N원」 (₩·￦·WON 금지)
 * 금액 색은 ink. 공제(out)만 파랑 허용. 실수령·KPI 틸/초록 금지.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { formatWon } from '../../../utils/clientPaymentHistoryFormat';
import {
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_MONEY_SIGN,
  CONSULTANT_MONEY_SIGN_GLYPH
} from '../../../constants/consultantSuite';

/**
 * @param {*} value
 * @param {string} [sign]
 * @returns {string}
 */
export const formatConsultantMoney = (value, sign = CONSULTANT_MONEY_SIGN.NONE) => {
  const { text, isNegative } = formatWon(value);
  if (!Number.isFinite(Number(value)) || value === null || value === '') {
    return text;
  }
  const glyph = CONSULTANT_MONEY_SIGN_GLYPH[sign]
    ?? (isNegative ? CONSULTANT_MONEY_SIGN_GLYPH[CONSULTANT_MONEY_SIGN.MINUS] : '');
  return `${glyph}${text}`;
};

const ConsultantMoneyText = ({ value, sign, strong, className }) => {
  const classes = [
    CONSULTANT_SUITE_CLASS.MONEY,
    strong ? CONSULTANT_SUITE_CLASS.MONEY_STRONG : '',
    sign === CONSULTANT_MONEY_SIGN.MINUS ? CONSULTANT_SUITE_CLASS.MONEY_OUT : '',
    className
  ].filter(Boolean).join(' ');

  return <span className={classes}>{formatConsultantMoney(value, sign)}</span>;
};

ConsultantMoneyText.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  sign: PropTypes.oneOf(Object.values(CONSULTANT_MONEY_SIGN)),
  strong: PropTypes.bool,
  className: PropTypes.string
};

ConsultantMoneyText.defaultProps = {
  value: null,
  sign: CONSULTANT_MONEY_SIGN.NONE,
  strong: false,
  className: ''
};

export default ConsultantMoneyText;
