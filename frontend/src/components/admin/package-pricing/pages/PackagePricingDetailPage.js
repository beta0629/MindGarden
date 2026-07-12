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

  const recalculatePricing = useCallback((newItems, discountRate, prevForm) => {
    if (!newItems || newItems.length === 0) {
      return {
        ...prevForm,
        items: [],
        sessions: prevForm.items?.length > 0 ? '' : prevForm.sessions, // 항목 비우면 초기화 (기존 단일이 아니었다면)
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
      
      const parsedItems = codes.map(c => {
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
    }
    loadData();
  }, [isNew, loadData]);

  const handleAddItem = (e) => {
    const itemValue = e.target.value;
    if (!itemValue) return;
    const item = availableItems.find(i => i.value === itemValue);
    if (!item) return;
    
    setForm(prev => recalculatePricing([...prev.items, item], prev.discountRate, prev));
    e.target.value = '';
  };

  const handleRemoveItem = (index) => {
    setForm(prev => recalculatePricing(prev.items.filter((_, i) => i !== index), prev.discountRate, prev));
  };

  const handleDiscountChange = (e) => {
    const rateString = e.target.value;
    const rate = rateString === '' ? 0 : Math.max(0, Math.min(100, Number(rateString) || 0));
    setForm(prev => recalculatePricing(prev.items, rateString === '' ? '' : rate, prev));
  };

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
      
      const extraDataStr = buildExtraDataString(
        sessionsNum, 
        priceNum, 
        form.remark.trim(),
        form.items,
        form.discountRate,
        form.originalPrice
      );

      if (isNew) {
        await StandardizedApi.post(API.TENANT_COMMON_CODES, {
          codeGroup: CODE_GROUP_CONSULTATION_PACKAGE,
          codeValue: form.codeValue.trim(),
          codeLabel: form.codeLabel.trim() || form.koreanName.trim(),
          koreanName: form.koreanName.trim(),
          codeDescription: form.remark.trim() || null,
          sortOrder: listLength,
          isActive: form.isActive,
          extraData: extraDataStr
        });
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
      notificationManager.show(err.message || (isNew ? '패키지 등록에 실패했습니다.' : '패키지 수정에 실패했습니다.'), 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const goToList = () => navigate('/admin/package-pricing');

  const pageTitle = isNew ? LABELS.NEW_PAGE_TITLE : LABELS.DETAIL_PAGE_TITLE;
  const isBuilderActive = form.items && form.items.length > 0;

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

          <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
            {/* 기본 정보 블록 */}
            <section className="mg-v2-ad-b0kla__card mg-v2-package-pricing__form-card">
              <h3 className="mg-v2-ad-b0kla__section-title">기본 정보</h3>
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
              </div>
            </section>

            {/* 상품 구성 빌더 블록 */}
            <section className="mg-v2-ad-b0kla__card mg-v2-package-pricing__form-card" style={{ borderLeft: '4px solid var(--mg-primary)' }}>
              <h3 className="mg-v2-ad-b0kla__section-title">상품 구성 빌더</h3>
              <p style={{ fontSize: '13px', color: 'var(--mg-text-secondary)', marginBottom: '16px' }}>
                단일 항목(검사 등)을 등록할 때는 아래 구성을 비워두고 요금 설정만 입력하세요. 조합 패키지를 만들 때는 상품을 추가하면 자동 계산됩니다.
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <select onChange={handleAddItem} className="mg-v2-form-input" style={{ width: '100%', maxWidth: '300px' }} defaultValue="">
                  <option value="" disabled>+ 상품 추가 (드롭다운)</option>
                  {availableItems.filter(i => i.value !== form.codeValue).map(i => (
                    <option key={i.value} value={i.value}>{i.label} ({i.sessions}회, {i.price.toLocaleString()}원)</option>
                  ))}
                </select>
              </div>

              {form.items && form.items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {form.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--mg-border)', borderRadius: '8px', background: '#fff' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--mg-text)' }}>{item.label}</span>
                        <span style={{ fontSize: '13px', color: 'var(--mg-primary)' }}>{item.sessions}회 · {item.price.toLocaleString()}원</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--mg-text-secondary)' }}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 요금 및 할인 설정 블록 */}
            <section className="mg-v2-ad-b0kla__card mg-v2-package-pricing__form-card">
              <h3 className="mg-v2-ad-b0kla__section-title">요금 및 할인 설정</h3>
              <div className="mg-v2-package-pricing__form-stack">
                
                {isBuilderActive && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--mg-border)' }}>
                    <span style={{ fontWeight: 600 }}>총 원가</span>
                    <span style={{ fontWeight: 600 }}>{form.originalPrice?.toLocaleString()}원</span>
                  </div>
                )}
                
                {isBuilderActive && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px dashed var(--mg-border)' }}>
                    <label className="mg-v2-form-label mg-v2-package-pricing__form-label" style={{ marginBottom: 0 }}>할인율(%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="mg-v2-form-input"
                      value={form.discountRate === 0 ? '' : form.discountRate}
                      onChange={handleDiscountChange}
                      placeholder="0"
                      style={{ width: '100px', textAlign: 'right' }}
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
                    className="mg-v2-form-input mg-v2-package-pricing__form-control"
                    value={form.sessions}
                    onChange={(e) => setForm((f) => ({ ...f, sessions: e.target.value }))}
                    placeholder="예: 20"
                    readOnly={isBuilderActive}
                    style={isBuilderActive ? { backgroundColor: 'var(--mg-surface)', color: 'var(--mg-text-secondary)' } : {}}
                  />
                  {formErrors.sessions && <span className="mg-v2-form-error mg-v2-package-pricing__form-error">{formErrors.sessions}</span>}
                </div>
                <div>
                  <label className="mg-v2-form-label mg-v2-package-pricing__form-label">
                    {isBuilderActive ? '최종 패키지 판매가' : LABELS.LABEL_PRICE} {isBuilderActive && '(자동 계산됨)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="mg-v2-form-input mg-v2-package-pricing__form-control"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="예: 400000"
                    readOnly={isBuilderActive}
                    style={isBuilderActive ? { backgroundColor: 'var(--mg-surface)', fontWeight: 'bold', color: 'var(--mg-primary)' } : {}}
                  />
                  {formErrors.price && <span className="mg-v2-form-error mg-v2-package-pricing__form-error">{formErrors.price}</span>}
                </div>

              </div>

              <ActionBar align="end" gap="md" className="mg-v2-package-pricing__form-actions" style={{ marginTop: '32px' }}>
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
