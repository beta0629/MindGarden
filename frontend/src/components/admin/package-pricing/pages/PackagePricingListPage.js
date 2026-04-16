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
import '../../../../styles/unified-design-tokens.css';
import '../../AdminDashboard/AdminDashboardB0KlA.css';
import '../PackagePricingPage.css';

const EXTRA_DATA_KEYS = { SESSIONS: 'sessions', PRICE: 'price', REMARK: 'remark' };

function parseExtraData(extraData) {
  if (!extraData) return { sessions: null, price: null, remark: '' };
  try {
    const o = typeof extraData === 'string' ? JSON.parse(extraData) : extraData;
    return {
      sessions: o?.sessions !== undefined && o?.sessions !== null ? Number(o.sessions) : null,
      price: o?.price !== undefined && o?.price !== null ? Number(o.price) : null,
      remark: o?.remark !== undefined && o?.remark !== null ? String(o.remark) : ''
    };
  } catch {
    return { sessions: null, price: null, remark: '' };
  }
}

function PackagePricingListPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingRowId, setTogglingRowId] = useState(null);

  const fetchList = useCallback(async() => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleToggleActive = async(row) => {
    const nextActive = !row.isActive;
    setTogglingRowId(row.id);
    try {
      await StandardizedApi.put(`${API.TENANT_COMMON_CODES}/${row.id}`, {
        codeLabel: row.codeLabel,
        koreanName: row.koreanName || row.codeLabel,
        codeDescription: row.codeDescription || null,
        isActive: nextActive,
        extraData: row.extraData || null
      });
      notificationManager.show(nextActive ? '활성화되었습니다.' : '비활성화되었습니다.', 'success');
      fetchList();
    } catch (err) {
      notificationManager.show(err.message || '상태 변경에 실패했습니다.', 'error');
    } finally {
      setTogglingRowId(null);
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
                  return (
                    <article
                      key={row.id}
                      className="mg-v2-package-pricing-card mg-v2-ad-b0kla__card"
                    >
                      <div className="mg-v2-package-pricing-card__header">
                        <span className="mg-v2-package-pricing-card__code">{row.codeValue || '-'}</span>
                        <span className={`mg-v2-badge ${row.isActive === true || row.isActive === undefined ? 'success' : 'secondary'}`}>
                          {row.isActive === true || row.isActive === undefined ? LABELS.ACTIVE_YES : LABELS.ACTIVE_NO}
                        </span>
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
                      </dl>
                      <div className="mg-v2-package-pricing-card__actions">
                        <MGButton
                          type="button"
                          variant="secondary"
                          className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          onClick={() => navigate(`/admin/package-pricing/${row.id}`)}
                        >
                          {LABELS.EDIT}
                        </MGButton>
                        <MGButton
                          type="button"
                          variant={row.isActive === true || row.isActive === undefined ? 'danger' : 'success'}
                          size="small"
                          className={buildErpMgButtonClassName({
                            variant: row.isActive === true || row.isActive === undefined ? 'danger' : 'success',
                            size: 'sm',
                            loading: togglingRowId === row.id
                          })}
                          onClick={() => handleToggleActive(row)}
                          loading={togglingRowId === row.id}
                          disabled={!!togglingRowId}
                          preventDoubleClick={true}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        >
                          {(row.isActive === true || row.isActive === undefined)
                            ? LABELS.DEACTIVATE
                            : LABELS.ACTIVATE}
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
