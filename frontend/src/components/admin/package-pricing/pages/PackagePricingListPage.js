/**
 * 패키지 요금 관리 - 목록 페이지
 * 반응형 카드 그리드: 모바일 1열, 태블릿 2열, 데스크톱 2~3열
 *
 * @author Core Solution
 * @since 2026-02-26
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../../../layout/AdminCommonLayout';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import ContentArea from '../../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../../dashboard-v2/content/ContentHeader';
import {
  CODE_GROUP_CONSULTATION_PACKAGE,
  API,
  LABELS
} from '../../../../constants/packagePricingConstants';
import { parseExtraData, isPublicVisible, withPublicVisible } from '../../../../utils/packagePricing';
import '../../../../styles/unified-design-tokens.css';
import '../../AdminDashboard/AdminDashboardB0KlA.css';
import '../PackagePricingPage.css';

const TOGGLE_KIND = Object.freeze({
  ACTIVE: 'active',
  PUBLIC: 'public'
});

function PackagePricingListPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState(null);

  /**
   * @param {{ silent?: boolean }} [options] silent=true 이면 페이지 로딩(AdminCommonLayout)을 건드리지 않음
   */
  const fetchList = useCallback(async(options = {}) => {
    const silent = options.silent === true;
    if (!silent) setLoading(true);
    try {
      const data = await StandardizedApi.get(API.TENANT_CODES_LIST, {
        codeGroup: CODE_GROUP_CONSULTATION_PACKAGE
      });
      let codes = [];
      if (data && data.codes) codes = data.codes;
      else if (Array.isArray(data)) codes = data;
      setList(codes);
    } catch (err) {
      console.error('패키지 목록 조회 실패:', err);
      notificationManager.show('패키지 목록을 불러오는데 실패했습니다.', 'error');
      setList([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleToggleActive = async(row) => {
    const nextActive = !row.isActive;
    const key = `${row.id}:${TOGGLE_KIND.ACTIVE}`;
    setTogglingKey(key);
    try {
      await StandardizedApi.put(`${API.TENANT_COMMON_CODES}/${row.id}`, {
        codeLabel: row.codeLabel,
        koreanName: row.koreanName || row.codeLabel,
        codeDescription: row.codeDescription || null,
        isActive: nextActive,
        extraData: row.extraData || null
      });
      notificationManager.show(
        nextActive ? LABELS.TOAST_ACTIVE_ON : LABELS.TOAST_ACTIVE_OFF,
        'success'
      );
      setList((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: nextActive } : r)));
      await fetchList({ silent: true });
    } catch (err) {
      notificationManager.show(err.message || LABELS.TOAST_TOGGLE_FAIL, 'error');
    } finally {
      setTogglingKey(null);
    }
  };

  const handleTogglePublicVisible = async(row) => {
    const nextPublic = !isPublicVisible(row.extraData);
    const key = `${row.id}:${TOGGLE_KIND.PUBLIC}`;
    setTogglingKey(key);
    try {
      const nextExtraData = withPublicVisible(row.extraData, nextPublic);
      await StandardizedApi.put(`${API.TENANT_COMMON_CODES}/${row.id}`, {
        codeLabel: row.codeLabel,
        koreanName: row.koreanName || row.codeLabel,
        codeDescription: row.codeDescription || null,
        isActive: row.isActive === true || row.isActive === undefined,
        extraData: nextExtraData
      });
      notificationManager.show(
        nextPublic ? LABELS.TOAST_PUBLIC_ON : LABELS.TOAST_PUBLIC_OFF,
        'success'
      );
      setList((prev) => prev.map((r) => (
        r.id === row.id ? { ...r, extraData: nextExtraData } : r
      )));
      await fetchList({ silent: true });
    } catch (err) {
      notificationManager.show(err.message || LABELS.TOAST_TOGGLE_FAIL, 'error');
    } finally {
      setTogglingKey(null);
    }
  };

  const formatPrice = (value) => {
    if (value == null || value === '') return '-';
    const n = Number(value);
    return Number.isNaN(n) ? '-' : `${n.toLocaleString()}원`;
  };

  return (
    <AdminCommonLayout
      title={LABELS.PAGE_TITLE}
      loading={loading}
      loadingText="데이터를 불러오는 중..."
    >
      <div className="mg-v2-ad-b0kla__container mg-v2-package-pricing">
        <ContentArea>
          <ContentHeader
            title={LABELS.PAGE_TITLE}
            subtitle={LABELS.PAGE_SUBTITLE}
            actions={
              <MGButton
                type="button"
                variant="primary"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  loading: false,
                  className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary'
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => navigate('/admin/package-pricing/new')}
              >
                {LABELS.ADD_BUTTON}
              </MGButton>
            }
          />

          <section className="mg-v2-ad-b0kla__card">
            <h2 className="mg-v2-ad-b0kla__section-title">{LABELS.SECTION_LIST}</h2>
            {list.length === 0 ? (
              <p className="mg-v2-package-pricing-cards-empty">
                등록된 패키지가 없습니다. 새 패키지를 추가해 주세요.
              </p>
            ) : (
              <div className="mg-v2-package-pricing-cards-grid">
                {list.map((row) => {
                  const extra = parseExtraData(row.extraData);
                  const rowActive = row.isActive === true || row.isActive === undefined;
                  const rowPublic = isPublicVisible(row.extraData);
                  const activeToggleKey = `${row.id}:${TOGGLE_KIND.ACTIVE}`;
                  const publicToggleKey = `${row.id}:${TOGGLE_KIND.PUBLIC}`;
                  return (
                    <article
                      key={row.id}
                      className="mg-v2-package-pricing-card mg-v2-ad-b0kla__card"
                    >
                      <div className="mg-v2-package-pricing-card__header">
                        <span className="mg-v2-package-pricing-card__code">{row.codeValue || '-'}</span>
                        <div className="mg-v2-package-pricing-card__badges">
                          <span className={`mg-v2-badge ${rowActive ? 'success' : 'secondary'}`}>
                            {rowActive ? LABELS.ACTIVE_YES : LABELS.ACTIVE_NO}
                          </span>
                          <span
                            className={`mg-v2-badge ${rowPublic ? 'success' : 'secondary'}`}
                            title={LABELS.COL_PUBLIC_VISIBLE}
                          >
                            {rowPublic ? LABELS.PUBLIC_YES : LABELS.PUBLIC_NO}
                          </span>
                        </div>
                      </div>
                      <h3 className="mg-v2-package-pricing-card__title">{row.koreanName || row.codeLabel || '-'}</h3>
                      <dl className="mg-v2-package-pricing-card__meta">
                        <div className="mg-v2-package-pricing-card__row">
                          <dt>{LABELS.COL_SESSIONS}</dt>
                          <dd>{extra.sessions !== null && extra.sessions !== undefined ? extra.sessions : '-'}</dd>
                        </div>
                        <div className="mg-v2-package-pricing-card__row">
                          <dt>{LABELS.COL_PRICE}</dt>
                          <dd className="mg-v2-package-pricing-card__price">{formatPrice(extra.price)}</dd>
                        </div>
                        <div className="mg-v2-package-pricing-card__row">
                          <dt>{LABELS.COL_REMARK}</dt>
                          <dd className="mg-v2-package-pricing-card__remark">{extra.remark || '-'}</dd>
                        </div>
                        <div className="mg-v2-package-pricing-card__row">
                          <dt>{LABELS.COL_PUBLIC_VISIBLE}</dt>
                          <dd>{rowPublic ? LABELS.PUBLIC_YES : LABELS.PUBLIC_NO}</dd>
                        </div>
                      </dl>
                      <div className="mg-v2-package-pricing-card__actions">
                        <MGButton
                          type="button"
                          variant="outline"
                          size="small"
                          className={buildErpMgButtonClassName({
                            variant: 'outline',
                            size: 'sm',
                            loading: false
                          })}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          onClick={() => navigate(`/admin/package-pricing/${row.id}`)}
                        >
                          {LABELS.EDIT}
                        </MGButton>
                        <MGButton
                          type="button"
                          variant={rowActive ? 'danger' : 'success'}
                          size="small"
                          className={buildErpMgButtonClassName({
                            variant: rowActive ? 'danger' : 'success',
                            size: 'sm',
                            loading: togglingKey === activeToggleKey
                          })}
                          onClick={() => handleToggleActive(row)}
                          loading={togglingKey === activeToggleKey}
                          disabled={!!togglingKey}
                          preventDoubleClick={true}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        >
                          {rowActive ? LABELS.DEACTIVATE : LABELS.ACTIVATE}
                        </MGButton>
                        <MGButton
                          type="button"
                          variant={rowPublic ? 'outline' : 'success'}
                          size="small"
                          className={buildErpMgButtonClassName({
                            variant: rowPublic ? 'outline' : 'success',
                            size: 'sm',
                            loading: togglingKey === publicToggleKey
                          })}
                          onClick={() => handleTogglePublicVisible(row)}
                          loading={togglingKey === publicToggleKey}
                          disabled={!!togglingKey}
                          preventDoubleClick={true}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          aria-label={LABELS.COL_PUBLIC_VISIBLE}
                        >
                          {rowPublic ? LABELS.PUBLIC_HIDE : LABELS.PUBLIC_SHOW}
                        </MGButton>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </ContentArea>
      </div>
    </AdminCommonLayout>
  );
}

export default PackagePricingListPage;
