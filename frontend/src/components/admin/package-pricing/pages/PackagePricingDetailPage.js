import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import AdminCommonLayout from '../../../layout/AdminCommonLayout';
import ActionBar from '../../../common/ActionBar';
import ActionBarButton from '../../../common/ActionBarButton';
import SettingSwitchRow from '../../../common/molecules/SettingSwitchRow';
import SafeText from '../../../common/SafeText';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import { toDisplayString, toErrorMessage } from '../../../../utils/safeDisplay';
import ContentArea from '../../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../../dashboard-v2/content/ContentHeader';
import {
  CODE_GROUP_CONSULTATION_PACKAGE,
  CODE_ISSUE_MODE,
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
  isActive: true,
  items: [],
  discountRate: 0,
  originalPrice: 0
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
  const [availableItems, setAvailableItems] = useState([]);
  const [codeIssueMode, setCodeIssueMode] = useState(CODE_ISSUE_MODE.AUTO);

  const recalculatePricing = useCallback((newItems, discountRate, prevForm) => {
    if (!newItems || newItems.length === 0) {
      return {
        ...prevForm,
        items: [],
        sessions: prevForm.items?.length > 0 ? '' : prevForm.sessions,
        price: prevForm.items?.length > 0 ? '' : prevForm.price,
        originalPrice: 0,
        discountRate: 0
      };
    }
    const totalSessions = newItems.reduce((acc, curr) => acc + (Number(curr.sessions) || 0), 0);
    const originalPrice = newItems.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    const rate = Number(discountRate) || 0;
    const packagePrice = Math.floor(originalPrice * (1 - rate / 100));

    return {
      ...prevForm,
      items: newItems,
      sessions: String(totalSessions),
      price: String(packagePrice),
      originalPrice,
      discountRate
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await StandardizedApi.get(API.TENANT_CODES_LIST, {
        codeGroup: CODE_GROUP_CONSULTATION_PACKAGE
      });
      const codes = data?.codes ?? (Array.isArray(data) ? data : []);
      setListLength(codes.length);

      const parsedItems = codes.map((c) => {
        const extra = parseExtraData(c.extraData);
        return {
          value: c.codeValue,
          label: c.koreanName || c.codeLabel,
          sessions: extra.sessions || 0,
          price: extra.price || 0
        };
      });
      setAvailableItems(parsedItems);

      if (!isNew) {
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
          isActive: row.isActive === true || row.isActive === undefined,
          items: extra.items || [],
          discountRate: extra.discountRate || 0,
          originalPrice: extra.originalPrice || 0
        });
      }
    } catch (err) {
      console.error('데이터 조회 실패:', err);
      if (!isNew) notificationManager.show('패키지 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, isNew, navigate]);

  useEffect(() => {
    if (isNew) {
      setForm(INITIAL_FORM);
      setFormErrors({});
      setCodeIssueMode(CODE_ISSUE_MODE.AUTO);
    }
    loadData();
  }, [isNew, loadData]);

  const handleCodeIssueModeChange = (nextMode) => {
    setCodeIssueMode(nextMode);
    setFormErrors((prev) => {
      if (!prev.codeValue) return prev;
      const next = { ...prev };
      delete next.codeValue;
      return next;
    });
    if (nextMode === CODE_ISSUE_MODE.AUTO) {
      setForm((f) => ({ ...f, codeValue: '' }));
    }
  };

  const handleAddItem = (e) => {
    const itemValue = e.target.value;
    if (!itemValue) return;
    const item = availableItems.find((i) => i.value === itemValue);
    if (!item) return;

    setForm((prev) => recalculatePricing([...prev.items, item], prev.discountRate, prev));
    e.target.value = '';
  };

  const handleRemoveItem = (index) => {
    setForm((prev) => recalculatePricing(
      prev.items.filter((_, i) => i !== index),
      prev.discountRate,
      prev
    ));
  };

  const handleDiscountChange = (e) => {
    const rateString = e.target.value;
    const rate = rateString === '' ? 0 : Math.max(0, Math.min(100, Number(rateString) || 0));
    setForm((prev) => recalculatePricing(prev.items, rateString === '' ? '' : rate, prev));
  };

  const validateForm = () => {
    const err = {};
    if (isNew) {
      if (codeIssueMode === CODE_ISSUE_MODE.MANUAL && !String(form.codeValue).trim()) {
        err.codeValue = LABELS.CODE_REQUIRED;
      }
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

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const sessionsNum = Number.parseInt(form.sessions, 10);
      const priceNum = Number.parseInt(form.price, 10);

      const extraDataStr = buildExtraDataString(
        sessionsNum,
        priceNum,
        form.remark.trim(),
        form.items,
        form.discountRate,
        form.originalPrice
      );

      if (isNew) {
        const payload = {
          codeGroup: CODE_GROUP_CONSULTATION_PACKAGE,
          codeLabel: form.codeLabel.trim() || form.koreanName.trim(),
          koreanName: form.koreanName.trim(),
          codeDescription: form.remark.trim() || null,
          sortOrder: listLength,
          isActive: form.isActive,
          extraData: extraDataStr
        };
        if (codeIssueMode === CODE_ISSUE_MODE.MANUAL) {
          payload.codeValue = form.codeValue.trim();
        }
        await StandardizedApi.post(API.TENANT_COMMON_CODES, payload);
        notificationManager.show('패키지가 등록되었습니다.', 'success');
      } else {
        await StandardizedApi.put(`${API.TENANT_COMMON_CODES}/${id}`, {
          codeLabel: form.codeLabel.trim() || form.koreanName.trim(),
          koreanName: form.koreanName.trim(),
          codeDescription: form.remark.trim() || null,
          isActive: form.isActive,
          extraData: extraDataStr
        });
        notificationManager.show('패키지가 수정되었습니다.', 'success');
      }
      navigate('/admin/package-pricing');
    } catch (err) {
      notificationManager.show(
        toErrorMessage(err, isNew ? '패키지 등록에 실패했습니다.' : '패키지 수정에 실패했습니다.'),
        'error'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const goToList = () => navigate('/admin/package-pricing');

  const pageTitle = isNew ? LABELS.NEW_PAGE_TITLE : LABELS.DETAIL_PAGE_TITLE;
  const isBuilderActive = form.items && form.items.length > 0;
  const codeValueDisplay = toDisplayString(form.codeValue, '—');

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
            actions={(
              <ActionBarButton
                variant="outline"
                onClick={goToList}
                className="mg-v2-package-header-btn--secondary"
              >
                {LABELS.LIST_BACK}
              </ActionBarButton>
            )}
          />

          <div className="mg-v2-package-pricing__form-stack">
            <section className="mg-v2-ad-b0kla__card mg-v2-package-pricing__form-card">
              <h3 className="mg-v2-ad-b0kla__section-title">기본 정보</h3>
              <div className="mg-v2-package-pricing__form-stack">
                <div>
                  <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                    {LABELS.LABEL_CODE}
                  </label>
                  {isNew ? (
                    <>
                      <div
                        className="mg-v2-package-pricing__code-issue"
                        role="radiogroup"
                        aria-label={LABELS.LABEL_CODE_ISSUE}
                      >
                        <label className="mg-v2-package-pricing__code-issue-option">
                          <input
                            type="radio"
                            name="package-code-issue-mode"
                            value={CODE_ISSUE_MODE.AUTO}
                            checked={codeIssueMode === CODE_ISSUE_MODE.AUTO}
                            onChange={() => handleCodeIssueModeChange(CODE_ISSUE_MODE.AUTO)}
                          />
                          <span>{LABELS.CODE_ISSUE_AUTO}</span>
                        </label>
                        <label className="mg-v2-package-pricing__code-issue-option">
                          <input
                            type="radio"
                            name="package-code-issue-mode"
                            value={CODE_ISSUE_MODE.MANUAL}
                            checked={codeIssueMode === CODE_ISSUE_MODE.MANUAL}
                            onChange={() => handleCodeIssueModeChange(CODE_ISSUE_MODE.MANUAL)}
                          />
                          <span>{LABELS.CODE_ISSUE_MANUAL}</span>
                        </label>
                      </div>
                      {codeIssueMode === CODE_ISSUE_MODE.AUTO ? (
                        <p className="mg-v2-package-pricing__code-hint">
                          <SafeText>{LABELS.CODE_AUTO_HINT}</SafeText>
                        </p>
                      ) : (
                        <input
                          type="text"
                          className="mg-v2-form-input mg-v2-package-pricing__form-control"
                          value={form.codeValue}
                          onChange={(e) => setForm((f) => ({ ...f, codeValue: e.target.value }))}
                          placeholder={LABELS.CODE_MANUAL_PLACEHOLDER}
                          aria-label={LABELS.LABEL_CODE}
                        />
                      )}
                      {formErrors.codeValue && (
                        <span className="mg-v2-form-error mg-v2-package-pricing__form-error">
                          <SafeText>{formErrors.codeValue}</SafeText>
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="mg-v2-package-pricing__code-readonly">
                      <SafeText>{codeValueDisplay}</SafeText>
                    </p>
                  )}
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
                  {formErrors.koreanName && (
                    <span className="mg-v2-form-error mg-v2-package-pricing__form-error">
                      <SafeText>{formErrors.koreanName}</SafeText>
                    </span>
                  )}
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
                  <SettingSwitchRow
                    id="package-pricing-is-active"
                    label={LABELS.LABEL_ACTIVE}
                    statusLabel={form.isActive ? LABELS.ACTIVE_YES : LABELS.ACTIVE_NO}
                    checked={!!form.isActive}
                    onCheckedChange={(next) => setForm((f) => ({ ...f, isActive: next }))}
                    ariaLabel={LABELS.LABEL_ACTIVE}
                  />
                </div>
              </div>
            </section>

            <section className="mg-v2-ad-b0kla__card mg-v2-package-pricing__form-card mg-v2-package-pricing__form-card--builder">
              <h3 className="mg-v2-ad-b0kla__section-title">상품 구성 빌더</h3>
              <p className="mg-v2-package-pricing__code-hint">
                단일 항목(검사 등)을 등록할 때는 아래 구성을 비워두고 요금 설정만 입력하세요. 조합 패키지를 만들 때는 상품을 추가하면 자동 계산됩니다.
              </p>

              <div className="mg-v2-package-pricing__builder-select-wrap">
                <select
                  onChange={handleAddItem}
                  className="mg-v2-form-input mg-v2-package-pricing__builder-select"
                  defaultValue=""
                >
                  <option value="" disabled>+ 상품 추가 (드롭다운)</option>
                  {availableItems.filter((i) => i.value !== form.codeValue).map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label} ({i.sessions}회, {i.price.toLocaleString()}원)
                    </option>
                  ))}
                </select>
              </div>

              {form.items && form.items.length > 0 && (
                <div className="mg-v2-package-pricing__builder-items">
                  {form.items.map((item, idx) => (
                    <div key={`${item.value}-${idx}`} className="mg-v2-package-pricing__builder-item">
                      <div className="mg-v2-package-pricing__builder-item-body">
                        <span className="mg-v2-package-pricing__builder-item-label">
                          <SafeText>{item.label}</SafeText>
                        </span>
                        <span className="mg-v2-package-pricing__builder-item-meta">
                          <SafeText>{`${item.sessions}회 · ${item.price.toLocaleString()}원`}</SafeText>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="mg-v2-package-pricing__builder-item-remove"
                        aria-label="항목 제거"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mg-v2-ad-b0kla__card mg-v2-package-pricing__form-card">
              <h3 className="mg-v2-ad-b0kla__section-title">요금 및 할인 설정</h3>
              <div className="mg-v2-package-pricing__form-stack">
                {isBuilderActive && (
                  <div className="mg-v2-package-pricing__price-row">
                    <span className="mg-v2-package-pricing__price-row-label">총 원가</span>
                    <span className="mg-v2-package-pricing__price-row-value">
                      <SafeText>{`${form.originalPrice?.toLocaleString()}원`}</SafeText>
                    </span>
                  </div>
                )}

                {isBuilderActive && (
                  <div className="mg-v2-package-pricing__price-row mg-v2-package-pricing__price-row--input">
                    <label className="mg-v2-form-label mg-v2-package-pricing__form-label mg-v2-package-pricing__price-row-label">
                      할인율(%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="mg-v2-form-input mg-v2-package-pricing__discount-input"
                      value={form.discountRate === 0 ? '' : form.discountRate}
                      onChange={handleDiscountChange}
                      placeholder="0"
                    />
                  </div>
                )}

                <div>
                  <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                    {LABELS.LABEL_SESSIONS} {isBuilderActive && '(자동 계산됨)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    className={`mg-v2-form-input mg-v2-package-pricing__form-control${isBuilderActive ? ' mg-v2-package-pricing__form-control--readonly' : ''}`}
                    value={form.sessions}
                    onChange={(e) => setForm((f) => ({ ...f, sessions: e.target.value }))}
                    placeholder="예: 20"
                    readOnly={isBuilderActive}
                  />
                  {formErrors.sessions && (
                    <span className="mg-v2-form-error mg-v2-package-pricing__form-error">
                      <SafeText>{formErrors.sessions}</SafeText>
                    </span>
                  )}
                </div>
                <div>
                  <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                    {isBuilderActive ? '최종 패키지 판매가' : LABELS.LABEL_PRICE}
                    {isBuilderActive && ' (자동 계산됨)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    className={`mg-v2-form-input mg-v2-package-pricing__form-control${isBuilderActive ? ' mg-v2-package-pricing__form-control--readonly mg-v2-package-pricing__form-control--emphasis' : ''}`}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="예: 400000"
                    readOnly={isBuilderActive}
                  />
                  {formErrors.price && (
                    <span className="mg-v2-form-error mg-v2-package-pricing__form-error">
                      <SafeText>{formErrors.price}</SafeText>
                    </span>
                  )}
                </div>
              </div>

              <ActionBar align="end" gap="md" className="mg-v2-package-pricing__form-actions">
                <ActionBarButton variant="outline" onClick={goToList} disabled={submitLoading}>
                  {LABELS.LIST_BACK}
                </ActionBarButton>
                <ActionBarButton variant="primary" onClick={handleSubmit} loading={submitLoading}>
                  {LABELS.SAVE}
                </ActionBarButton>
              </ActionBar>
            </section>
          </div>
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
