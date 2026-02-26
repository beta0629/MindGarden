/**
 * 패키지 요금(가격) 관리 페이지
 * 테넌트별 CONSULTATION_PACKAGE 공통코드 목록 조회·등록·수정·비활성화
 * 디자인 스펙: docs/design-system/PACKAGE_PRICING_ADMIN_SCREEN_SPEC.md
 *
 * @author Core Solution
 * @since 2026-02-26
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Ban, CheckCircle } from 'lucide-react';
import UnifiedModal from '../common/modals/UnifiedModal';
import UnifiedLoading from '../common/UnifiedLoading';
import StandardizedApi from '../../utils/standardizedApi';
import notificationManager from '../../utils/notification';
import {
  CODE_GROUP_CONSULTATION_PACKAGE,
  API,
  LABELS
} from '../../constants/packagePricingConstants';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';

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

function PackagePricingManagement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [editingCode, setEditingCode] = useState(null);
  const [form, setForm] = useState({
    codeValue: '',
    codeLabel: '',
    koreanName: '',
    sessions: '',
    price: '',
    remark: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

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

  const openCreateModal = () => {
    setModalMode('create');
    setEditingCode(null);
    setForm({
      codeValue: '',
      codeLabel: '',
      koreanName: '',
      sessions: '',
      price: '',
      remark: '',
      isActive: true
    });
    setFormErrors({});
  };

  const openEditModal = (row) => {
    const extra = parseExtraData(row.extraData);
    setModalMode('edit');
    setEditingCode(row);
    setForm({
      codeValue: row.codeValue || '',
      codeLabel: row.codeLabel || '',
      koreanName: row.koreanName || row.codeLabel || '',
      sessions: (extra.sessions !== null && extra.sessions !== undefined) ? String(extra.sessions) : '',
      price: (extra.price !== null && extra.price !== undefined) ? String(extra.price) : '',
      remark: extra.remark || '',
      isActive: row.isActive === true || row.isActive === undefined
    });
    setFormErrors({});
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingCode(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const err = {};
    if (modalMode === 'create') {
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

  const handleSubmitCreate = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const sessionsNum = Number.parseInt(form.sessions, 10);
      const priceNum = Number.parseInt(form.price, 10);
      await StandardizedApi.post(API.TENANT_COMMON_CODES, {
        codeGroup: CODE_GROUP_CONSULTATION_PACKAGE,
        codeValue: form.codeValue.trim(),
        codeLabel: form.codeLabel.trim() || form.koreanName.trim(),
        koreanName: form.koreanName.trim(),
        codeDescription: form.remark.trim() || null,
        sortOrder: list.length,
        isActive: form.isActive,
        extraData: buildExtraDataString(sessionsNum, priceNum, form.remark.trim())
      });
      notificationManager.show('패키지가 등록되었습니다.', 'success');
      closeModal();
      fetchList();
    } catch (err) {
      notificationManager.show(err.message || '패키지 등록에 실패했습니다.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!validateForm() || !editingCode?.id) return;
    setSubmitLoading(true);
    try {
      const sessionsNum = Number.parseInt(form.sessions, 10);
      const priceNum = Number.parseInt(form.price, 10);
      await StandardizedApi.put(`${API.TENANT_COMMON_CODES}/${editingCode.id}`, {
        codeLabel: form.codeLabel.trim() || form.koreanName.trim(),
        koreanName: form.koreanName.trim(),
        codeDescription: form.remark.trim() || null,
        isActive: form.isActive,
        extraData: buildExtraDataString(sessionsNum, priceNum, form.remark.trim())
      });
      notificationManager.show('패키지가 수정되었습니다.', 'success');
      closeModal();
      fetchList();
    } catch (err) {
      notificationManager.show(err.message || '패키지 수정에 실패했습니다.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

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

  const isCreate = modalMode === 'create';
  const isEdit = modalMode === 'edit';

  return (
    <div className="mg-v2-ad-b0kla">
      <div className="mg-v2-ad-b0kla__container">
        <header className="mg-v2-ad-b0kla__page-header mg-v2-ad-b0kla__header">
          <div className="mg-v2-ad-b0kla__header-left">
            <h1 className="mg-v2-ad-b0kla__header-left-title">{LABELS.PAGE_TITLE}</h1>
            <p className="mg-v2-ad-b0kla__header-left-subtitle">{LABELS.PAGE_SUBTITLE}</p>
          </div>
          <div className="mg-v2-ad-b0kla__header-right">
            <button
              type="button"
              className="mg-v2-button mg-v2-button-primary mg-v2-ad-b0kla__icon-btn"
              onClick={openCreateModal}
              style={{ padding: '10px 20px', height: 40, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={18} />
              {LABELS.ADD_BUTTON}
            </button>
          </div>
        </header>

        <section className="mg-v2-ad-b0kla__card">
          <h2 className="mg-v2-ad-b0kla__section-title">{LABELS.SECTION_LIST}</h2>
          {loading ? (
            <UnifiedLoading />
          ) : (
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
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>{extra.sessions !== null && extra.sessions !== undefined ? extra.sessions : '-'}</td>
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
                              onClick={() => openEditModal(row)}
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
          )}
        </section>
      </div>

      <UnifiedModal
        isOpen={isCreate || isEdit}
        onClose={closeModal}
        title={isCreate ? LABELS.MODAL_ADD_TITLE : LABELS.MODAL_EDIT_TITLE}
        size="medium"
        className="mg-v2-ad-b0kla"
        backdropClick
        showCloseButton
        loading={submitLoading}
        actions={
          <>
            <button
              type="button"
              className="mg-v2-button mg-v2-button-secondary"
              onClick={closeModal}
              disabled={submitLoading}
            >
              {LABELS.CANCEL}
            </button>
            <button
              type="button"
              className="mg-v2-button mg-v2-button-primary"
              onClick={isCreate ? handleSubmitCreate : handleSubmitEdit}
              disabled={submitLoading}
            >
              {submitLoading ? '저장 중...' : LABELS.SAVE}
            </button>
          </>
        }
      >
        <div className="mg-modal__body">
          <div className="mg-v2-ad-b0kla__card" style={{ padding: 24 }}>
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
                  readOnly={isEdit}
                  disabled={isEdit}
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
            </div>
          </div>
        </div>
      </UnifiedModal>
    </div>
  );
}

export default PackagePricingManagement;
