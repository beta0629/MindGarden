/**
 * MallToast — 「장바구니에 담았어요」 3초 (닫힘은 훅 타이머)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SafeText from '../../common/SafeText';
import { CLIENT_MALL_COPY, CLIENT_MALL_TEST_IDS } from '../../../constants/clientMallConstants';
import { CLIENT_SHOP_ROUTES } from '../../../constants/clientShopConstants';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import { formatMallWon } from '../../../utils/clientMall';

const CheckIcon = ICONS.CHECK_CIRCLE;

/**
 * @param {{ toast: { title: string, quantity: number, subtotalMinor: number }|null }} props
 */
const MallToast = ({ toast }) => {
  if (!toast) {
    return null;
  }
  return (
    <div className="client-mall-toast" role="status" aria-live="polite" data-testid={CLIENT_MALL_TEST_IDS.TOAST}>
      {CheckIcon ? <CheckIcon size={ICON_SIZES.LG} aria-hidden className="client-mall-toast__icon" /> : null}
      <div className="client-mall-toast__text">
        <p className="client-mall-toast__title">{CLIENT_MALL_COPY.TOAST_TITLE}</p>
        <p className="client-mall-toast__sub">
          <SafeText>{toast.title}</SafeText>
          {' · '}
          {CLIENT_MALL_COPY.TOAST_CART_PREFIX}
          {toast.quantity}
          {CLIENT_MALL_COPY.CART_COUNT_SUFFIX}
          {' · '}
          {formatMallWon(toast.subtotalMinor)}
        </p>
      </div>
      <Link className="client-mall-toast__link" to={CLIENT_SHOP_ROUTES.CART}>
        {CLIENT_MALL_COPY.TOAST_VIEW}
      </Link>
    </div>
  );
};

MallToast.propTypes = {
  toast: PropTypes.shape({
    title: PropTypes.string,
    quantity: PropTypes.number,
    subtotalMinor: PropTypes.number
  })
};

export default MallToast;
