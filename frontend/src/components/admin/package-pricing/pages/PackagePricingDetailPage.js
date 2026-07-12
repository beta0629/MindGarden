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
import ActionBar from '../../../common/ActionBar';
import ActionBarButton from '../../../common/ActionBarButton';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import ContentArea from '../../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../../dashboard-v2/content/ContentHeader';
import {
  CODE_GROUP_CONSULTATION_PACKAGE,
  API,
  LABELS
} from '../../../../constants/packagePricingConstants';
import { parseExtraData, buildExtraDataString } from '../../../../utils/packagePricing';
import '../../../../styles/unified-design-tokens.css';
import '../../AdminDashboard/AdminDashboardB0KlA.css';
import '../PackagePricingPage.css';

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
    if (form.sessions === '' || Number.isNaN(sessionsNum) || sessionsNum < 0) {
      err.sessions = '회기 수는 0 이상의 숫자를 입력하세요.';
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
              <ActionBarButton
                variant="outline"
                onClick={goToList}
                className="mg-v2-package-header-btn--secondary"
              >
                {LABELS.LIST_BACK}
              </ActionBarButton>
            }
          />

          <section className="mg-v2-ad-b0kla__card mg-v2-package-pricing__form-card">
            <div className="mg-v2-package-pricing__form-stack">
              <div>
                <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                  {LABELS.LABEL_CODE}
                </label>
                <input
                  type="text"
                  className="mg-v2-form-input mg-v2-package-pricing__form-control"
                  value={form.codeValue}
                  onChange={(e) => setForm((f) => ({ ...f, codeValue: e.target.value }))}
                  readOnly={!isNew}
                  disabled={!isNew}
                  placeholder="예: BASIC, SINGLE_80000"
                />
                {formErrors.codeValue && <span className="mg-v2-form-error mg-v2-package-pricing__form-error">{formErrors.codeValue}</span>}
              </div>
              <div>
                <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                  {LABELS.LABEL_NAME}
                </label>
                <input
                  type="text"
                  className="mg-v2-form-input mg-v2-package-pricing__form-control"
                  value={form.koreanName}
                  onChange={(e) => setForm((f) => ({ ...f, koreanName: e.target.value }))}
                  placeholder="패키지 한글명"
                />
                {formErrors.koreanName && <span className="mg-v2-form-error mg-v2-package-pricing__form-error">{formErrors.koreanName}</span>}
              </div>
              <div>
                <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                  {LABELS.LABEL_SESSIONS}
                </label>
                <input
                  type="number"
                  min={0}
                  className="mg-v2-form-input mg-v2-package-pricing__form-control"
                  value={form.sessions}
                  onChange={(e) => setForm((f) => ({ ...f, sessions: e.target.value }))}
                  placeholder="예: 20"
                />
                {formErrors.sessions && <span className="mg-v2-form-error mg-v2-package-pricing__form-error">{formErrors.sessions}</span>}
              </div>
              <div>
                <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                  {LABELS.LABEL_PRICE}
                </label>
                <input
                  type="number"
                  min={0}
                  className="mg-v2-form-input mg-v2-package-pricing__form-control"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="예: 400000"
                />
                {formErrors.price && <span className="mg-v2-form-error mg-v2-package-pricing__form-error">{formErrors.price}</span>}
              </div>
              <div>
                <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                  {LABELS.LABEL_REMARK}
                </label>
                <textarea
                  className="mg-v2-form-input mg-v2-package-pricing__form-control mg-v2-package-pricing__form-control--textarea"
                  value={form.remark}
                  onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                  placeholder="비고 (선택)"
                  rows={2}
                />
              </div>
              <div>
                <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                  {LABELS.LABEL_ACTIVE}
                </label>
                <select
                  className="mg-v2-form-input mg-v2-package-pricing__form-control"
                  value={form.isActive ? 'Y' : 'N'}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'Y' }))}
                >
                  <option value="Y">{LABELS.ACTIVE_YES}</option>
                  <option value="N">{LABELS.ACTIVE_NO}</option>
                </select>
              </div>
              <ActionBar align="end" gap="md" className="mg-v2-package-pricing__form-actions">
                <ActionBarButton variant="outline" onClick={goToList} disabled={submitLoading}>
                  {LABELS.LIST_BACK}
                </ActionBarButton>
                <ActionBarButton variant="primary" onClick={handleSubmit} loading={submitLoading}>
                  {LABELS.SAVE}
                </ActionBarButton>
              </ActionBar>
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
