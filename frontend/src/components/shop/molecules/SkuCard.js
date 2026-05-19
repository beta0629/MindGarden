/**
 * SkuCard — 상품 카드 Molecule (PLP, MVP+ 썸네일)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, ImageIcon } from 'lucide-react';
import PriceText from '../atoms/PriceText';
import SafeText from '../../common/SafeText';
import { CLIENT_SHOP_TEST_IDS } from '../../../constants/clientShopConstants';
import { toDisplayString } from '../../../utils/safeDisplay';

const SkuCard = ({
  sku,
  onAddToCart,
  loading = false,
  pointsRedeemable = true,
  detailTo = null,
  addButtonTestId = null
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const thumbnailUrl = toDisplayString(sku?.thumbnailUrl, '');
  const showImage = Boolean(thumbnailUrl) && !imageFailed;
  const titleText = toDisplayString(sku?.title, '');

  return (
    <article className="client-shop__sku-card" data-testid={`sku-card-${sku.skuCode}`}>
      <figure className="client-shop__sku-image-wrapper">
        {showImage ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="client-shop__sku-image"
            data-testid={CLIENT_SHOP_TEST_IDS.SKU_CARD_THUMBNAIL}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="client-shop__sku-image-placeholder"
            data-testid={CLIENT_SHOP_TEST_IDS.SKU_CARD_THUMBNAIL}
            aria-hidden
          >
            <ImageIcon size={28} />
          </div>
        )}
      </figure>
      <div className="client-shop__sku-card-inner">
        <span className="client-shop__accent-bar" aria-hidden />
        <div className="client-shop__sku-body">
          <div>
            <h3 className="client-shop__sku-title">
              {detailTo ? (
                <Link to={detailTo} className="client-shop__sku-title-link">
                  <SafeText>{titleText}</SafeText>
                </Link>
              ) : (
                <SafeText>{titleText}</SafeText>
              )}
            </h3>
            {sku.descriptionText ? (
              <p className="client-shop__sku-desc">
                <SafeText>{sku.descriptionText}</SafeText>
              </p>
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
      </div>
    </article>
  );
};

export default SkuCard;
