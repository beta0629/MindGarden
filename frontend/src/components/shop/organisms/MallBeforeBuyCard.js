/**
 * MallBeforeBuyCard — 「구매 전에 알아두세요」 (회기 추가 · 환불 · 결제)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import MallInfoRows from '../molecules/MallInfoRows';
import {
  CLIENT_MALL_COPY,
  CLIENT_MALL_TEST_IDS,
  CLIENT_REFUND_NOTICE
} from '../../../constants/clientMallConstants';

const ROWS = [
  { key: 'sessions', label: CLIENT_MALL_COPY.BEFORE_BUY_SESSIONS_LABEL, value: CLIENT_MALL_COPY.BEFORE_BUY_SESSIONS_VALUE },
  { key: 'refund', label: CLIENT_MALL_COPY.BEFORE_BUY_REFUND_LABEL, value: CLIENT_REFUND_NOTICE },
  { key: 'payment', label: CLIENT_MALL_COPY.BEFORE_BUY_PAYMENT_LABEL, value: CLIENT_MALL_COPY.BEFORE_BUY_PAYMENT_VALUE }
];

const MallBeforeBuyCard = () => (
  <section className="client-mall-box" data-testid={CLIENT_MALL_TEST_IDS.BEFORE_BUY}>
    <h2 className="client-mall-box__title">{CLIENT_MALL_COPY.BEFORE_BUY_TITLE}</h2>
    <MallInfoRows rows={ROWS} className="client-mall-rows--wide" />
  </section>
);

export default MallBeforeBuyCard;
