/**
 * 패키지 요금 관리 - 목록 페이지
 * MappingManagementPage와 동일 레이아웃: mg-v2-ad-b0kla + ContentArea + ContentHeader + 테이블
 *
 * @author Core Solution
 * @since 2026-02-26
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Ban, CheckCircle } from 'lucide-react';
import UnifiedLoading from '../../../common/UnifiedLoading';
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

  const fetchList = useCallback(async () => {
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

  const handleToggleActive = async (row) => {
    const nextActive = !row.isActive;
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
    }
  };

  const formatPrice = (value) => {
    if (value == null || value === '') return '-';
    const n = Number(value);
    return Number.isNaN(n) ? '-' : `${n.toLocaleString()}원`;
  };

  if (loading) {
    return (
      <div className="mg-v2-ad-b0kla mg-v2-package-pricing">
        <div className="mg-v2-ad-b0kla__container">
          <UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="mg-v2-ad-b0kla mg-v2-package-pricing">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea>
          <ContentHeader
            title={LABELS.PAGE_TITLE}
            subtitle={LABELS.PAGE_SUBTITLE}
            actions={
              <button
                type="button"
                className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
                onClick={() => navigate('/admin/package-pricing/new')}
              >
                <Plus size={20} />
                {LABELS.ADD_BUTTON}
              </button>
            }
          />

          <section className="mg-v2-ad-b0kla__card">
            <h2 className="mg-v2-ad-b0kla__section-title">{LABELS.SECTION_LIST}</h2>
            <div className="mg-v2-ad-b0kla__table-wrap" style={{ overflowX: 'auto' }}>
              <table className="mg-v2-ad-b0kla__table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ad-b0kla-border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>{LABELS.COL_CODE}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>{LABELS.COL_NAME}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{LABELS.COL_SESSIONS}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{LABELS.COL_PRICE}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>{LABELS.COL_REMARK}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>{LABELS.COL_ACTIVE}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>{LABELS.COL_ACTIONS}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--ad-b0kla-text-secondary)' }}>
                        등록된 패키지가 없습니다. 새 패키지를 추가해 주세요.
                      </td>
                    </tr>
                  ) : (
                    list.map((row) => {
                      const extra = parseExtraData(row.extraData);
                      return (
                        <tr key={row.id} style={{ borderBottom: '1px solid var(--ad-b0kla-border)' }}>
                          <td style={{ padding: '12px 16px' }}>{row.codeValue || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>{row.koreanName || row.codeLabel || '-'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {extra.sessions !== null && extra.sessions !== undefined ? extra.sessions : '-'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                            {formatPrice(extra.price)}
                          </td>
                          <td style={{ padding: '12px 16px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {extra.remark || '-'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span className={`mg-v2-badge ${row.isActive === true || row.isActive === undefined ? 'success' : 'secondary'}`}>
                              {row.isActive === true || row.isActive === undefined ? LABELS.ACTIVE_YES : LABELS.ACTIVE_NO}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="mg-v2-button mg-v2-button-secondary"
                              style={{ marginRight: 8, padding: '6px 12px' }}
                              onClick={() => navigate(`/admin/package-pricing/${row.id}`)}
                            >
                              <Edit3 size={14} />
                              {LABELS.EDIT}
                            </button>
                            <button
                              type="button"
                              className={(row.isActive === true || row.isActive === undefined) ? 'mg-v2-button mg-v2-button-danger' : 'mg-v2-button mg-v2-button-success'}
                              style={{ padding: '6px 12px' }}
                              onClick={() => handleToggleActive(row)}
                            >
                              {(row.isActive === true || row.isActive === undefined) ? (
                                <><Ban size={14} /> {LABELS.DEACTIVATE}</>
                              ) : (
                                <><CheckCircle size={14} /> {LABELS.ACTIVATE}</>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </ContentArea>
      </div>
    </div>
  );
}

export default PackagePricingListPage;
