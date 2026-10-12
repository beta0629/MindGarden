/**
 * 테넌트 어드민 — 내담자별 결제 상품 지정 (몰 상품 선택 → 금액/율 할인 → 저장)
 * 결제 금액은 서버가 확정하고, 이 화면의 금액은 미리보기다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import EmptyState from '../common/EmptyState';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { adminClientsWithMappingGetAll } from '../../api/adminListFetch';
import { mapSessionSuccessionClientOptions } from '../../utils/sessionSuccessionOptions';
import {
  cancelAdminClientOffer,
  createAdminClientOffer,
  listAdminClientOffers,
  listAdminOfferSourceOptions
} from '../../services/shopClientOfferService';
import {
  SHOP_CLIENT_OFFER_DISCOUNT_TYPE,
  SHOP_CLIENT_OFFER_I18N_NS,
  SHOP_CLIENT_OFFER_STATUS,
  SHOP_CLIENT_OFFER_TEST_IDS
} from '../../constants/shopClientOfferConstants';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import { formatShopMoney } from '../../utils/clientShopFormat';
import { previewOfferFinalPrice } from '../../utils/shopClientOffer';
import '../../styles/unified-design-tokens.css';
import '../../styles/shop/AdminShopClinicOs.css';
import '../../styles/shop/AdminShopSuite.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_TITLE_ID = 'admin-shop-client-offers-title';

const AdminShopClientOffersPage = () => {
  const { t } = useTranslation(SHOP_CLIENT_OFFER_I18N_NS);
  const navigate = useNavigate();
  const baseId = useId();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [sources, setSources] = useState([]);
  const [offers, setOffers] = useState([]);
  const [clientId, setClientId] = useState('');
  const [sourceSkuCode, setSourceSkuCode] = useState('');
  const [discountType, setDiscountType] = useState(SHOP_CLIENT_OFFER_DISCOUNT_TYPE.AMOUNT);
  const [discountValue, setDiscountValue] = useState('');

  const selectedSource = useMemo(
    () => sources.find((s) => s.skuCode === sourceSkuCode) || null,
    [sources, sourceSkuCode]
  );
  const previewPrice = selectedSource
    ? previewOfferFinalPrice(selectedSource.unitPriceMinor, discountType, discountValue)
    : null;
  const canSave = Boolean(clientId && selectedSource && previewPrice != null) && !saving;

  const loadOffers = useCallback(async(nextClientId) => {
    if (!nextClientId) {
      setOffers([]);
      return;
    }
    try {
      setOffers(await listAdminClientOffers(nextClientId));
    } catch (e) {
      setOffers([]);
      notificationManager.error(e?.message || t('admin.loadFailed'));
    }
  }, [t]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      return;
    }
    if (!allowed) {
      navigate('/', { replace: true });
      return;
    }
    let cancelled = false;
    (async() => {
      try {
        const [clientsRaw, sourceRows] = await Promise.all([
          adminClientsWithMappingGetAll(),
          listAdminOfferSourceOptions()
        ]);
        if (!cancelled) {
          setClients(mapSessionSuccessionClientOptions(clientsRaw, null));
          setSources(sourceRows);
        }
      } catch (e) {
        if (!cancelled) {
          notificationManager.error(e?.message || t('admin.clientLoadFailed'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [sessionLoading, isLoggedIn, user?.id, allowed, navigate, t]);

  const handleClientChange = (value) => {
    setClientId(value);
    loadOffers(value);
  };

  const handleSave = async() => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    try {
      await createAdminClientOffer({
        clientId: Number(clientId),
        sourceSkuCode,
        discountType,
        discountValue: Number(discountValue)
      });
      notificationManager.success(t('admin.saved'));
      setDiscountValue('');
      setSourceSkuCode('');
      await loadOffers(clientId);
    } catch (e) {
      notificationManager.error(e?.message || t('admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async(offerId) => {
    try {
      await cancelAdminClientOffer(offerId);
      notificationManager.success(t('admin.canceled'));
      await loadOffers(clientId);
    } catch (e) {
      notificationManager.error(e?.message || t('admin.cancelFailed'));
    }
  };

  const statusText = (offer) => {
    if (offer.status === SHOP_CLIENT_OFFER_STATUS.CANCELED) {
      return t('admin.statusCanceled');
    }
    return offer.paid ? t('admin.statusPaid') : t('admin.statusActive');
  };

  const discountText = (offer) => (offer.discountType === SHOP_CLIENT_OFFER_DISCOUNT_TYPE.RATE
    ? t('admin.discountRateText', { value: offer.discountValue })
    : t('admin.discountAmountText', { value: formatShopMoney(offer.discountValue) }));

  return (
    <AdminCommonLayout title={t('admin.title')} loading={loading}>
      <ContentArea className="admin-shop-clinic-os admin-shop-suite" ariaLabel={t('admin.title')}>
        <div className="admin-shop-suite" data-testid={SHOP_CLIENT_OFFER_TEST_IDS.ADMIN_PAGE}>
          <ContentHeader
            titleId={PAGE_TITLE_ID}
            title={t('admin.title')}
            subtitle={t('admin.subtitle')}
          />
          <section className="admin-shop-suite__card" aria-labelledby={`${baseId}-form`}>
            <div className="admin-shop-suite__card-head">
              <h2 id={`${baseId}-form`} className="admin-shop-suite__card-title">{t('admin.save')}</h2>
            </div>
            <div className="admin-shop-suite__grid-2">
              <div className="admin-shop-suite__field">
                <label className="admin-shop-suite__label" htmlFor={`${baseId}-client`}>{t('admin.clientLabel')}</label>
                <select
                  id={`${baseId}-client`}
                  className="admin-shop-suite__select"
                  value={clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  <option value="">{t('admin.clientPlaceholder')}</option>
                  {clients.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="admin-shop-suite__field">
                <label className="admin-shop-suite__label" htmlFor={`${baseId}-product`}>{t('admin.productLabel')}</label>
                <select
                  id={`${baseId}-product`}
                  className="admin-shop-suite__select"
                  value={sourceSkuCode}
                  onChange={(e) => setSourceSkuCode(e.target.value)}
                  disabled={sources.length === 0}
                >
                  <option value="">{sources.length === 0 ? t('admin.noProducts') : t('admin.productPlaceholder')}</option>
                  {sources.map((s) => (
                    <option key={s.skuCode} value={s.skuCode}>
                      {t('admin.productOption', {
                        title: s.title,
                        sessions: s.sessionCount,
                        price: formatShopMoney(s.unitPriceMinor)
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-shop-suite__field">
                <label className="admin-shop-suite__label" htmlFor={`${baseId}-type`}>{t('admin.discountTypeLabel')}</label>
                <select
                  id={`${baseId}-type`}
                  className="admin-shop-suite__select"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                >
                  <option value={SHOP_CLIENT_OFFER_DISCOUNT_TYPE.AMOUNT}>{t('admin.discountAmount')}</option>
                  <option value={SHOP_CLIENT_OFFER_DISCOUNT_TYPE.RATE}>{t('admin.discountRate')}</option>
                </select>
              </div>
              <div className="admin-shop-suite__field">
                <label className="admin-shop-suite__label" htmlFor={`${baseId}-value`}>{t('admin.discountValueLabel')}</label>
                <input
                  id={`${baseId}-value`}
                  className="admin-shop-suite__input admin-shop-suite__num"
                  inputMode="numeric"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>
            {selectedSource ? (
              <div className="admin-shop-suite__row-line">
                <span>{t('admin.originalPrice')}</span>
                <span className="admin-shop-suite__row-line-value">
                  <SafeText>{formatShopMoney(selectedSource.unitPriceMinor)}</SafeText>
                </span>
              </div>
            ) : null}
            {selectedSource ? (
              <div className="admin-shop-suite__row-line">
                <span>{t('admin.finalPrice')}</span>
                <span className="admin-shop-suite__row-line-value">
                  <SafeText>{previewPrice != null ? formatShopMoney(previewPrice) : t('admin.previewInvalid')}</SafeText>
                </span>
              </div>
            ) : null}
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: saving })}
              disabled={!canSave}
              loading={saving}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleSave}
              data-testid={SHOP_CLIENT_OFFER_TEST_IDS.ADMIN_SAVE}
            >
              {t('admin.save')}
            </MGButton>
          </section>

          <section className="admin-shop-suite__card" aria-labelledby={`${baseId}-list`}>
            <div className="admin-shop-suite__card-head">
              <h2 id={`${baseId}-list`} className="admin-shop-suite__card-title">{t('admin.listTitle')}</h2>
            </div>
            {!clientId ? (
              <EmptyState title={t('admin.selectClientFirst')} />
            ) : offers.length === 0 ? (
              <EmptyState title={t('admin.listEmpty')} />
            ) : (
              <div className="admin-shop-suite__table-wrap">
                <table className="admin-shop-suite__table">
                  <thead>
                    <tr>
                      <th>{t('admin.colProduct')}</th>
                      <th>{t('admin.colDiscount')}</th>
                      <th className="admin-shop-suite__cell--right">{t('admin.colFinal')}</th>
                      <th>{t('admin.colStatus')}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => (
                      <tr key={offer.id}>
                        <td><SafeText>{offer.title}</SafeText></td>
                        <td><SafeText>{discountText(offer)}</SafeText></td>
                        <td className="admin-shop-suite__cell--right">
                          <SafeText>{formatShopMoney(offer.finalPriceMinor)}</SafeText>
                        </td>
                        <td><SafeText>{statusText(offer)}</SafeText></td>
                        <td>
                          {offer.status === SHOP_CLIENT_OFFER_STATUS.ACTIVE && !offer.paid ? (
                            <MGButton
                              type="button"
                              variant="secondary"
                              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm' })}
                              onClick={() => handleCancel(offer.id)}
                            >
                              {t('admin.cancel')}
                            </MGButton>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default AdminShopClientOffersPage;
