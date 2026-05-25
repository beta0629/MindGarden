/**
 * ShopPointsPage — 내 포인트 잔액·최근 원장
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import PointBalanceHeader from '../../../components/shop/organisms/PointBalanceHeader';
import {
  buildShopOrderDetailPath,
  isPointLedgerCredit,
  POINT_LEDGER_DEFAULT_LIMIT,
  resolvePointLedgerLabel
} from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import { fetchPointBalance, fetchPointLedger } from '../../../services/clientShopService';
import { formatShopDateTime, formatShopPoints } from '../../../utils/clientShopFormat';
import { toDisplayString } from '../../../utils/safeDisplay';

const ShopPointsPage = () => {
  const { sessionLoading, isLoggedIn } = useClientShopAuth();
  const [balance, setBalance] = useState({ availableMinor: 0, heldMinor: 0 });
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async() => {
    try {
      setLoading(true);
      setMessage('');
      const [bal, ledgerRows] = await Promise.all([
        fetchPointBalance(),
        fetchPointLedger(POINT_LEDGER_DEFAULT_LIMIT)
      ]);
      setBalance(bal);
      setLedger(ledgerRows);
    } catch (e) {
      setMessage(e.message || '포인트 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, loadData]);

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title="내 포인트" />;
  }

  return (
    <ShopClientLayout title="내 포인트" testId="client-shop-points">
      <PointBalanceHeader
        availableMinor={balance.availableMinor}
        heldMinor={balance.heldMinor}
      />
      {message ? (
        <p className="client-shop__message client-shop__message--error" role="alert">
          {message}
        </p>
      ) : null}
      <section className="client-shop__section" aria-label="포인트 내역">
        <h2 className="client-shop__section-title">포인트 내역</h2>
        {loading && ledger.length === 0 ? (
          <p className="client-shop__message">불러오는 중…</p>
        ) : null}
        {ledger.length === 0 ? (
          <p className="client-shop__empty">포인트 내역이 없습니다.</p>
        ) : (
          <ul>
            {ledger.map((entry, index) => {
              const typeLabel = toDisplayString(resolvePointLedgerLabel(entry));
              const isCredit = isPointLedgerCredit(entry.type);
              const amountText = isCredit
                ? `+ ${formatShopPoints(entry.amountMinor)}`
                : `- ${formatShopPoints(entry.amountMinor)}`;
              const rowKey = `${entry.type}-${entry.createdAt || index}-${entry.orderPublicId || index}`;

              return (
                <li key={rowKey} className="client-shop__ledger-item">
                  <div>
                    <p className="client-shop__ledger-type">{typeLabel}</p>
                    <p className="client-shop__ledger-date">
                      {formatShopDateTime(entry.createdAt)}
                    </p>
                    {entry.orderPublicId ? (
                      <Link to={buildShopOrderDetailPath(entry.orderPublicId)}>
                        주문 번호 {toDisplayString(entry.orderPublicId)} 상세보기
                      </Link>
                    ) : null}
                  </div>
                  <span
                    className={`client-shop__ledger-amount${
                      isCredit ? ' client-shop__ledger-amount--earn' : ''
                    }`}
                  >
                    {amountText}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </ShopClientLayout>
  );
};

export default ShopPointsPage;
