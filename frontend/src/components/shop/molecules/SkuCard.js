/**
 * SkuCard — 상품 카드 Molecule
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import PriceText from '../atoms/PriceText';

const SkuCard = ({
  sku,
  onAddToCart,
  loading = false,
  pointsRedeemable = true,
  detailTo = null,
  addButtonTestId = null
}) => (
  <article className="client-shop__sku-card" data-testid={`sku-card-${sku.skuCode}`}>
    <span className="client-shop__accent-bar" aria-hidden />
    <div className="client-shop__sku-body">
      <div>
        <h3 className="client-shop__sku-title">
          {detailTo ? (
            <Link to={detailTo} className="client-shop__sku-title-link">
              {sku.title}
            </Link>
          ) : (
            sku.title
          )}
        </h3>
        {sku.descriptionText ? (
          <p className="client-shop__sku-desc">{sku.descriptionText}</p>
        ) : null}
      </div>
      <div className="client-shop__sku-footer">
        <PriceText amountMinor={sku.unitPriceMinor} currency={sku.currency} />
        <div className="client-shop__sku-actions">
          {pointsRedeemable ? (
            <Coins size={18} color="var(--mg-color-accent-main)" aria-label="포인트 사용 가능" />
          ) : null}
          <button
            type="button"
            className="client-shop__cta client-shop__cta--secondary client-shop__cta--inline"
            onClick={onAddToCart}
            disabled={loading}
            {...(addButtonTestId ? { 'data-testid': addButtonTestId } : {})}
          >
            담기
          </button>
        </div>
      </div>
    </div>
  </article>
);

export default SkuCard;
