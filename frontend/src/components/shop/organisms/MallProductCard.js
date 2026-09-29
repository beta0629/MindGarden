/**
 * MallProductCard — 흰 카드 · 회기 칩 · 상품명(상세 링크) · 설명 · N원 · 회당 · 구성 · 이용기간 · 담기/바로 구매
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import SessionCountTicket from '../atoms/SessionCountTicket';
import MallInfoRows from '../molecules/MallInfoRows';
import MallPrice from '../molecules/MallPrice';
import { CLIENT_MALL_COPY, CLIENT_MALL_TEST_IDS } from '../../../constants/clientMallConstants';
import { formatMallSessionLabel, formatValidityLabel, resolveValidityMonths } from '../../../utils/clientMall';

/**
 * @param {{
 *   sku: object,
 *   detailTo: string,
 *   onAdd: () => void,
 *   onBuyNow: () => void,
 *   disabled?: boolean,
 *   addTestId?: string,
 *   buyNowTestId?: string
 * }} props
 */
const MallProductCard = ({ sku, detailTo, onAdd, onBuyNow, disabled = false, addTestId, buyNowTestId }) => {
  const months = resolveValidityMonths(sku);
  const rows = [
    { key: 'composition', label: CLIENT_MALL_COPY.ROW_COMPOSITION, value: formatMallSessionLabel(sku.sessionCount) }
  ];
  if (months != null) {
    rows.push({ key: 'validity', label: CLIENT_MALL_COPY.ROW_VALIDITY, value: formatValidityLabel(months) });
  }
  return (
    <article className="client-mall-card" role="listitem" data-testid={CLIENT_MALL_TEST_IDS.PRODUCT_CARD}>
      <SessionCountTicket
        sessionCount={sku.sessionCount}
        className="client-mall-chip"
        testId={`client-mall-chip-${sku.skuCode}`}
      />
      <h3 className="client-mall-card__title">
        <Link to={detailTo} className="client-mall-card__title-link">
          <SafeText>{sku.title}</SafeText>
        </Link>
      </h3>
      {sku.descriptionText ? (
        <p className="client-mall-card__desc"><SafeText>{sku.descriptionText}</SafeText></p>
      ) : null}
      <MallPrice amountMinor={Number(sku.unitPriceMinor) || 0} sessionCount={sku.sessionCount} />
      <MallInfoRows rows={rows} className="client-mall-card__rows" />
      <div className="client-mall-card__actions">
        <MGButton
          variant="outline"
          fullWidth
          disabled={disabled}
          preventDoubleClick={false}
          className="client-mall-btn client-mall-btn--line"
          onClick={onAdd}
          data-testid={addTestId}
        >
          {CLIENT_MALL_COPY.ADD_TO_CART}
        </MGButton>
        <MGButton
          variant="outline"
          fullWidth
          disabled={disabled}
          className="client-mall-btn client-mall-btn--ink-line"
          onClick={onBuyNow}
          data-testid={buyNowTestId}
        >
          {CLIENT_MALL_COPY.BUY_NOW}
        </MGButton>
      </div>
    </article>
  );
};

MallProductCard.propTypes = {
  sku: PropTypes.shape({
    skuCode: PropTypes.string.isRequired,
    title: PropTypes.string,
    descriptionText: PropTypes.string,
    unitPriceMinor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    sessionCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    validityMonths: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  detailTo: PropTypes.string.isRequired,
  onAdd: PropTypes.func.isRequired,
  onBuyNow: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  addTestId: PropTypes.string,
  buyNowTestId: PropTypes.string
};

export default MallProductCard;
