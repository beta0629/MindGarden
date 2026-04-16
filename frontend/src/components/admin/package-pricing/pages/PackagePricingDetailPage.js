/**
 * 패키지 요금 관리 - 등록/상세(수정) 페이지
 * URL param id 또는 isNew로 생성/수정 구분. B0KlA 컨테이너 + ContentArea + ContentHeader + 폼 + 목록으로
 *
 * @author Core Solution
 * @since 2026-02-26
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
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

function buildExtraDataString(sessions, price, remark) {
  return JSON.stringify({
    [EXTRA_DATA_KEYS.SESSIONS]: sessions,
    [EXTRA_DATA_KEYS.PRICE]: price,
    [EXTRA_DATA_KEYS.REMARK]: remark || ''
  });
}

const INITIAL_FORM = {
  codeValue: '',
  codeLabel: '',
  koreanName: '',
  sessions: '',
  price: '',
  remark: '',
  isActive: true
};

function PackagePricingDetailPage({ isNew: isNewProp }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = isNewProp === true;
  const [loading, setLoading] = useState(!isNew);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [listLength, setListLength] = useState(0);

  const fetchListForEdit = useCallback(async() => {
    if (isNew) return;
    setLoading(true);
    try {
      const data = await StandardizedApi.get(API.TENANT_CODES_LIST, {
        codeGroup: CODE_GROUP_CONSULTATION_PACKAGE
      });
      let codes = [];
      if (data && data.codes) codes = data.codes;
      else if (Array.isArray(data)) codes = data;
      setListLength(codes.length);
      const row = codes.find((r) => String(r.id) === String(id));
      if (!row) {
        notificationManager.show('패키지를 찾을 수 없습니다.', 'error');
        navigate('/admin/package-pricing');
        return;
      }
      const extra = parseExtraData(row.extraData);
      setForm({
        codeValue: row.codeValue || '',
        codeLabel: row.codeLabel || '',
        koreanName: row.koreanName || row.codeLabel || '',
        sessions: (extra.sessions !== null && extra.sessions !== undefined) ? String(extra.sessions) : '',
        price: (extra.price !== null && extra.price !== undefined) ? String(extra.price) : '',
        remark: extra.remark || '',
        isActive: row.isActive === true || row.isActive === undefined
      });
    } catch (err) {
      console.error('패키지 조회 실패:', err);
      notificationManager.show('패키지 정보를 불러오는데 실패했습니다.', 'error');
      navigate('/admin/package-pricing');
    } finally {
      setLoading(false);
    }
  }, [id, isNew, navigate]);

  const fetchListLength = useCallback(async() => {
    try {
      const data = await StandardizedApi.get(API.TENANT_CODES_LIST, {
        codeGroup: CODE_GROUP_CONSULTATION_PACKAGE
      });
      const codes = data?.codes ?? (Array.isArray(data) ? data : []);
      setListLength(codes.length);
    } catch {
      setListLength(0);
    }
  }, []);

  useEffect(() => {
    if (isNew) {
      setForm(INITIAL_FORM);
      setFormErrors({});
      setLoading(false);
      fetchListLength();
      return;
    }
    fetchListForEdit();
  }, [isNew, id, fetchListForEdit, fetchListLength]);

  const validateForm = () => {
    const err = {};
    if (isNew) {
      if (!String(form.codeValue).trim()) err.codeValue = '패키지 코드를 입력하세요.';
      if (!String(form.koreanName).trim()) err.koreanName = '패키지명을 입력하세요.';
    }
    const sessionsNum = Number.parseInt(form.sessions, 10);
    if (form.sessions === '' || Number.isNaN(sessionsNum) || sessionsNum <= 0) {
      err.sessions = '회기 수는 1 이상의 숫자를 입력하세요.';
    }
    const priceNum = Number.parseInt(form.price, 10);
    if (form.price === '' || Number.isNaN(priceNum) || priceNum < 0) {
      err.price = '가격(원)을 0 이상의 숫자로 입력하세요.';
    }
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async() => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const sessionsNum = Number.parseInt(form.sessions, 10);
      const priceNum = Number.parseInt(form.price, 10);
      if (isNew) {
        await StandardizedApi.post(API.TENANT_COMMON_CODES, {
          codeGroup: CODE_GROUP_CONSULTATION_PACKAGE,
          codeValue: form.codeValue.trim(),
          codeLabel: form.codeLabel.trim() || form.koreanName.trim(),
          koreanName: form.koreanName.trim(),
          codeDescription: form.remark.trim() || null,
          sortOrder: listLength,
          isActive: form.isActive,
          extraData: buildExtraDataString(sessionsNum, priceNum, form.remark.trim())
        });
        notificationManager.show('패키지가 등록되었습니다.', 'success');
      } else {
        await StandardizedApi.put(`${API.TENANT_COMMON_CODES}/${id}`, {
          codeLabel: form.codeLabel.trim() || form.koreanName.trim(),
          koreanName: form.koreanName.trim(),
          codeDescription: form.remark.trim() || null,
          isActive: form.isActive,
          extraData: buildExtraDataString(sessionsNum, priceNum, form.remark.trim())
        });
        notificationManager.show('패키지가 수정되었습니다.', 'success');
      }
      navigate('/admin/package-pricing');
    } catch (err) {
      notificationManager.show(err.message || (isNew ? '패키지 등록에 실패했습니다.' : '패키지 수정에 실패했습니다.'), 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const goToList = () => navigate('/admin/package-pricing');

  const pageTitle = isNew ? LABELS.NEW_PAGE_TITLE : LABELS.DETAIL_PAGE_TITLE;

  return (
    <AdminCommonLayout
      title={pageTitle}
      loading={loading}
      loadingText="데이터를 불러오는 중..."
    >
      <div className="mg-v2-ad-b0kla__container mg-v2-package-pricing">
        <ContentArea>
          <ContentHeader
            title={pageTitle}
            subtitle={LABELS.PAGE_SUBTITLE}
            actions={
              <MGButton
                type="button"
                variant="outline"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  loading: false,
                  className: 'mg-v2-package-header-btn--secondary'
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={goToList}
              >
                {LABELS.LIST_BACK}
              </MGButton>
            }
          />

          <section className="mg-v2-ad-b0kla__card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="mg-v2-form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--ad-b0kla-text-secondary)' }}>
                  {LABELS.LABEL_CODE}
                </label>
                <input
                  type="text"
                  className="mg-v2-form-input"
                  value={form.codeValue}
                  onChange={(e) => setForm((f) => ({ ...f, codeValue: e.target.value }))}
                  readOnly={!isNew}
                  disabled={!isNew}
                  placeholder="예: BASIC, SINGLE_80000"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ad-b0kla-border)', borderRadius: 10 }}
                />
                {formErrors.codeValue && <span className="mg-v2-form-error" style={{ fontSize: 12 }}>{formErrors.codeValue}</span>}
              </div>
              <div>
                <label className="mg-v2-form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--ad-b0kla-text-secondary)' }}>
                  {LABELS.LABEL_NAME}
                </label>
                <input
                  type="text"
                  className="mg-v2-form-input"
                  value={form.koreanName}
                  onChange={(e) => setForm((f) => ({ ...f, koreanName: e.target.value }))}
                  placeholder="패키지 한글명"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ad-b0kla-border)', borderRadius: 10 }}
                />
                {formErrors.koreanName && <span className="mg-v2-form-error" style={{ fontSize: 12 }}>{formErrors.koreanName}</span>}
              </div>
              <div>
                <label className="mg-v2-form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--ad-b0kla-text-secondary)' }}>
                  {LABELS.LABEL_SESSIONS}
                </label>
                <input
                  type="number"
                  min={1}
                  className="mg-v2-form-input"
                  value={form.sessions}
                  onChange={(e) => setForm((f) => ({ ...f, sessions: e.target.value }))}
                  placeholder="예: 20"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ad-b0kla-border)', borderRadius: 10 }}
                />
                {formErrors.sessions && <span className="mg-v2-form-error" style={{ fontSize: 12 }}>{formErrors.sessions}</span>}
              </div>
              <div>
                <label className="mg-v2-form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--ad-b0kla-text-secondary)' }}>
                  {LABELS.LABEL_PRICE}
                </label>
                <input
                  type="number"
                  min={0}
                  className="mg-v2-form-input"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="예: 400000"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ad-b0kla-border)', borderRadius: 10 }}
                />
                {formErrors.price && <span className="mg-v2-form-error" style={{ fontSize: 12 }}>{formErrors.price}</span>}
              </div>
              <div>
                <label className="mg-v2-form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--ad-b0kla-text-secondary)' }}>
                  {LABELS.LABEL_REMARK}
                </label>
                <textarea
                  className="mg-v2-form-input"
                  value={form.remark}
                  onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                  placeholder="비고 (선택)"
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ad-b0kla-border)', borderRadius: 10, resize: 'vertical' }}
                />
              </div>
              <div>
                <label className="mg-v2-form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--ad-b0kla-text-secondary)' }}>
                  {LABELS.LABEL_ACTIVE}
                </label>
                <select
                  className="mg-v2-form-input"
                  value={form.isActive ? 'Y' : 'N'}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'Y' }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ad-b0kla-border)', borderRadius: 10 }}
                >
                  <option value="Y">{LABELS.ACTIVE_YES}</option>
                  <option value="N">{LABELS.ACTIVE_NO}</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    loading: false,
                    className: 'mg-v2-package-header-btn--secondary'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={goToList}
                  disabled={submitLoading}
                >
                  {LABELS.LIST_BACK}
                </MGButton>
                <MGButton
                  type="button"
                  variant="primary"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    loading: submitLoading,
                    className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary'
                  })}
                  onClick={handleSubmit}
                  loading={submitLoading}
                  preventDoubleClick={true}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  {LABELS.SAVE}
                </MGButton>
              </div>
            </div>
          </section>
        </ContentArea>
      </div>
    </AdminCommonLayout>
  );
}

PackagePricingDetailPage.propTypes = {
  isNew: PropTypes.bool
};

PackagePricingDetailPage.defaultProps = {
  isNew: false
};

export default PackagePricingDetailPage;
