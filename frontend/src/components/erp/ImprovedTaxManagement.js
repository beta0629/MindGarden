import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import StandardizedApi from '../../utils/standardizedApi';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../dashboard-v2/content';
import {
  SALARY_API_ENDPOINTS,
  TAX_BREAKDOWN_ORDER,
  TAX_BREAKDOWN_LABELS,
  TAX_TYPE
} from '../../constants/salaryConstants';
import {
  Calculator,
  LayoutDashboard,
  FileText,
  Settings,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  FilePlus,
  FileCheck
} from 'lucide-react';
import './ErpCommon.css';
import notificationManager from '../../utils/notification';

/** 현재 월 YYYY-MM */
const getDefaultPeriod = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

/** period(YYYY-MM) → 해당 월의 startDate, endDate (YYYY-MM-DD) */
const periodToDateRange = (period) => {
  const [y, m] = period.split('-').map(Number);
  const startDate = `${period}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${period}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
};

/**
 * 개선된 ERP 세무 관리 페이지 - 실데이터 /api/v1/admin/salary/tax/* 연동
 */
const ImprovedTaxManagement = () => {
  useSession();
  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState(() => getDefaultPeriod());
  const [statistics, setStatistics] = useState(null);
  const [calculationsList, setCalculationsList] = useState([]);
  const [taxCategories, setTaxCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newTaxItem, setNewTaxItem] = useState({
    calculationId: '',
    grossAmount: '',
    taxType: TAX_TYPE.VAT,
    taxRate: '',
    taxName: '',
    description: ''
  });

  useEffect(() => {
    if (sessionIsLoggedIn && sessionUser?.id) {
      loadData();
    }
  }, [sessionIsLoggedIn, sessionUser?.id, activeTab, selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 'overview':
          await loadTaxOverview();
          break;
        case 'calculations':
          await loadTaxCalculations();
          break;
        case 'reports':
          await loadTaxReports();
          break;
        case 'settings':
          await loadTaxSettings();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadTaxOverview = async () => {
    try {
      const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.TAX_STATISTICS, {
        period: selectedPeriod
      });
      const data = response?.data ?? response;
      setStatistics(data || null);
    } catch (err) {
      console.error('세금 개요 로드 실패:', err);
      setError('세금 개요를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadTaxCalculations = async () => {
    try {
      const statsRes = await StandardizedApi.get(SALARY_API_ENDPOINTS.TAX_STATISTICS, {
        period: selectedPeriod
      });
      const statsData = statsRes?.data ?? statsRes;
      setStatistics(statsData || null);
      const { startDate, endDate } = periodToDateRange(selectedPeriod);
      const calcRes = await StandardizedApi.get(SALARY_API_ENDPOINTS.CALCULATIONS, {
        startDate,
        endDate
      });
      const list = calcRes?.data ?? calcRes ?? [];
      setCalculationsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('세금 계산 내역 로드 실패:', err);
      setError('세금 계산 내역을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadTaxReports = async () => {
    try {
      console.log('세금 보고서 데이터 로드');
    } catch (err) {
      console.error('세금 보고서 로드 실패:', err);
      setError('세금 보고서를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadTaxSettings = async () => {
    try {
      const response = await StandardizedApi.get('/api/v1/common-codes', {
        codeGroup: 'TAX_CATEGORY'
      });
      const data = response?.data ?? response ?? [];
      setTaxCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('세금 카테고리 로드 실패:', err);
      setError('세금 카테고리를 불러올 수 없습니다.');
    }
  };

  const handleCreateTaxItem = async () => {
    const calculationId = newTaxItem.calculationId ? Number(newTaxItem.calculationId) : null;
    const grossAmount = newTaxItem.grossAmount ? Number(newTaxItem.grossAmount) : null;
    const taxRate = newTaxItem.taxRate ? Number(newTaxItem.taxRate) : null;
    if (!calculationId || grossAmount == null || !newTaxItem.taxType || taxRate == null) {
      notificationManager.warning('급여 계산, 과세 금액, 세금 유형, 세율을 입력해 주세요.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await StandardizedApi.post(SALARY_API_ENDPOINTS.TAX_CALCULATE, {
        calculationId,
        grossAmount,
        taxType: newTaxItem.taxType,
        taxRate,
        taxName: newTaxItem.taxName || undefined,
        description: newTaxItem.description || undefined
      });
      notificationManager.success('추가 세금이 계산·반영되었습니다.');
      setShowCreateModal(false);
      setNewTaxItem({
        calculationId: '',
        grossAmount: '',
        taxType: TAX_TYPE.VAT,
        taxRate: '',
        taxName: '',
        description: ''
      });
      await loadTaxCalculations();
    } catch (err) {
      console.error('세금 항목 생성 실패:', err);
      setError(err?.message || '세금 항목 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /* 백엔드 PUT/DELETE /api/v1/admin/salary/tax/* 미지원. 기획 확정 시 추가 후 연동 */

  const formatCurrency = (amount) => {
    if (!amount) return '0원';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  if (!sessionIsLoggedIn || !sessionUser) {
    return (
      <AdminCommonLayout title="세무 관리">
        <div className="erp-error">
          <h3>로그인이 필요합니다.</h3>
          <p>세무 관리 기능을 사용하려면 로그인해주세요.</p>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="세무 관리">
      <ContentHeader
        title="세무 관리"
        subtitle="세금 계산, 신고, 납부를 체계적으로 관리할 수 있습니다."
        actions={
          <>
            <label className="mg-v2-content-header__period" style={{ marginRight: 'var(--mg-layout-gap)' }}>
              <span style={{ marginRight: 8 }}>기간</span>
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="mg-v2-ad-b0kla__input"
                style={{ padding: '6px 10px', borderRadius: 8 }}
              />
            </label>
            {activeTab === 'calculations' && (
              <button
                type="button"
                className="mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                추가 세금 계산
              </button>
            )}
          </>
        }
      />
      <ContentArea className="erp-system erp-container">
        <div className="mg-v2-ad-b0kla__pill-group" role="tablist">
          <button
            type="button"
            className={`mg-v2-ad-b0kla__pill ${activeTab === 'overview' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            개요
          </button>
          <button
            type="button"
            className={`mg-v2-ad-b0kla__pill ${activeTab === 'calculations' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
            onClick={() => setActiveTab('calculations')}
          >
            <Calculator size={18} />
            세금 계산
          </button>
          <button
            type="button"
            className={`mg-v2-ad-b0kla__pill ${activeTab === 'reports' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText size={18} />
            신고서
          </button>
          <button
            type="button"
            className={`mg-v2-ad-b0kla__pill ${activeTab === 'settings' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            설정
          </button>
        </div>

        <div className="erp-content">
          {loading && (
              <UnifiedLoading type="inline" text="로딩 중..." />
          )}

            {error && (
              <div className="erp-error">
                <div className="mg-v2-content-area__alert" role="alert" style={{ background: 'var(--mg-layout-section-bg)', border: '1px solid var(--mg-color-border-main)', borderRadius: '16px', padding: 'var(--mg-layout-section-padding)' }}>
                  <AlertTriangle size={20} style={{ color: 'var(--mg-color-text-secondary)' }} />
                  {error}
                </div>
                <button type="button" className="mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--outline" onClick={loadData}>
                  <RefreshCw size={16} />
                  다시 시도
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {activeTab === 'overview' && (
                  <section className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-layout-section-bg)', border: '1px solid var(--mg-layout-section-border)', borderRadius: '16px', padding: 'var(--mg-layout-section-padding)' }}>
                    <h2 className="mg-v2-ad-b0kla__chart-title">세무 개요</h2>
                    <div className="mg-v2-ad-b0kla__grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--mg-layout-grid-gap)' }}>
                      <div className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-color-surface-main)', borderLeft: '4px solid var(--mg-color-primary-main)' }}>
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">총 세금액</h3>
                          <DollarSign size={20} style={{ color: 'var(--mg-color-primary-main)' }} />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div style={{ color: 'var(--mg-color-primary-main)', fontWeight: 600 }}>
                            {formatCurrency(statistics?.totalTaxAmount)}
                          </div>
                          <small style={{ color: 'var(--mg-color-text-secondary)' }}>{selectedPeriod}</small>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-color-surface-main)', borderLeft: '4px solid var(--mg-color-primary-main)' }}>
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">계산 건수</h3>
                          <CheckCircle size={20} style={{ color: 'var(--mg-color-success-main, #22c55e)' }} />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div style={{ color: 'var(--mg-color-success-main, #22c55e)', fontWeight: 600 }}>
                            {statistics?.totalCalculations ?? 0}건
                          </div>
                          <small style={{ color: 'var(--mg-color-text-secondary)' }}>급여 계산 기준</small>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-color-surface-main)', borderLeft: '4px solid var(--mg-color-primary-main)' }}>
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">총 급여</h3>
                          <DollarSign size={20} style={{ color: 'var(--mg-color-text-secondary)' }} />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div style={{ color: 'var(--mg-color-text-main)', fontWeight: 600 }}>
                            {formatCurrency(statistics?.totalGrossSalary)}
                          </div>
                          <small style={{ color: 'var(--mg-color-text-secondary)' }}>총 지급액</small>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-color-surface-main)', borderLeft: '4px solid var(--mg-color-primary-main)' }}>
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">실지급액</h3>
                          <DollarSign size={20} style={{ color: 'var(--mg-color-text-secondary)' }} />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div style={{ color: 'var(--mg-color-text-main)', fontWeight: 600 }}>
                            {formatCurrency(statistics?.totalNetSalary)}
                          </div>
                          <small style={{ color: 'var(--mg-color-text-secondary)' }}>공제 후</small>
                        </div>
                      </div>
                    </div>
                    {statistics?.breakdown && (
                      <div style={{ marginTop: 'var(--mg-layout-section-padding)' }}>
                        <h3 className="mg-v2-ad-b0kla__chart-title" style={{ marginBottom: 12 }}>세목별 breakdown</h3>
                        <table className="salary-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--mg-color-border-main)' }}>
                              <th style={{ textAlign: 'left', padding: 8 }}>세목</th>
                              <th style={{ textAlign: 'right', padding: 8 }}>금액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {TAX_BREAKDOWN_ORDER.map((key) => (
                              <tr key={key} style={{ borderBottom: '1px solid var(--mg-color-border-sub)' }}>
                                <td style={{ padding: 8 }}>{TAX_BREAKDOWN_LABELS[key] || key}</td>
                                <td style={{ textAlign: 'right', padding: 8 }}>{formatCurrency(statistics.breakdown[key])}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}

                {activeTab === 'calculations' && (
                  <section className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-layout-section-bg)', border: '1px solid var(--mg-layout-section-border)', borderRadius: '16px', padding: 'var(--mg-layout-section-padding)' }}>
                    <h2 className="mg-v2-ad-b0kla__chart-title">세금 계산 · 기간별 통계</h2>
                    {statistics ? (
                      <>
                        <div className="mg-v2-ad-b0kla__grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--mg-layout-grid-gap)', marginBottom: 24 }}>
                          <div className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-color-surface-main)', borderLeft: '4px solid var(--mg-color-primary-main)' }}>
                            <div className="mg-v2-ad-b0kla__chart-body">
                              <div style={{ fontSize: 12, color: 'var(--mg-color-text-secondary)' }}>총 세금</div>
                              <div style={{ fontWeight: 600 }}>{formatCurrency(statistics.totalTaxAmount)}</div>
                            </div>
                          </div>
                          <div className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-color-surface-main)', borderLeft: '4px solid var(--mg-color-primary-main)' }}>
                            <div className="mg-v2-ad-b0kla__chart-body">
                              <div style={{ fontSize: 12, color: 'var(--mg-color-text-secondary)' }}>계산 건수</div>
                              <div style={{ fontWeight: 600 }}>{statistics.totalCalculations ?? 0}건</div>
                            </div>
                          </div>
                        </div>
                        {statistics.breakdown && (
                          <table className="salary-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--mg-color-border-main)' }}>
                                <th style={{ textAlign: 'left', padding: 8 }}>세목</th>
                                <th style={{ textAlign: 'right', padding: 8 }}>금액</th>
                              </tr>
                            </thead>
                            <tbody>
                              {TAX_BREAKDOWN_ORDER.map((key) => (
                                <tr key={key} style={{ borderBottom: '1px solid var(--mg-color-border-sub)' }}>
                                  <td style={{ padding: 8 }}>{TAX_BREAKDOWN_LABELS[key] || key}</td>
                                  <td style={{ textAlign: 'right', padding: 8 }}>{formatCurrency(statistics.breakdown[key])}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        <p style={{ marginTop: 16, fontSize: 14, color: 'var(--mg-color-text-secondary)' }}>
                          상단 「추가 세금 계산」으로 급여 계산에 추가 세금을 반영할 수 있습니다.
                        </p>
                      </>
                    ) : (
                      <div className="mg-tax-empty" style={{ textAlign: 'center', padding: 'var(--mg-layout-section-padding)', color: 'var(--mg-color-text-secondary)' }}>
                        <Calculator size={48} style={{ marginBottom: 'var(--mg-layout-gap)' }} />
                        <p className="mg-tax-empty__text">해당 기간 데이터가 없습니다.</p>
                      </div>
                    )}
                  </section>
                )}

                {activeTab === 'reports' && (
                  <section className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-layout-section-bg)', border: '1px solid var(--mg-layout-section-border)', borderRadius: '16px', padding: 'var(--mg-layout-section-padding)' }}>
                    <h2 className="mg-v2-ad-b0kla__chart-title">세금 신고서</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--mg-layout-grid-gap)' }}>
                      <div className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-color-surface-main)', borderLeft: '4px solid var(--mg-color-primary-main)' }}>
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">부가가치세 신고</h3>
                          <FileText size={20} style={{ color: 'var(--mg-color-primary-main)' }} />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <p style={{ color: 'var(--mg-color-text-secondary)', fontSize: '14px' }}>분기별 부가가치세 신고서 작성 및 제출</p>
                          <div style={{ marginTop: 'var(--mg-layout-gap)' }}>
                            <div><span style={{ color: 'var(--mg-color-text-secondary)' }}>다음 신고일:</span> 2025-01-25</div>
                            <div><span style={{ color: 'var(--mg-color-text-secondary)' }}>상태:</span> 준비 중</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 'var(--mg-layout-gap)' }}>
                          <button type="button" className="mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--primary">
                            <FilePlus size={16} />
                            신고서 작성
                          </button>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-color-surface-main)', borderLeft: '4px solid var(--mg-color-primary-main)' }}>
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">소득세 신고</h3>
                          <FileText size={20} style={{ color: 'var(--mg-color-success-main, #22c55e)' }} />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <p style={{ color: 'var(--mg-color-text-secondary)', fontSize: '14px' }}>연말정산 및 소득세 신고서 작성</p>
                          <div style={{ marginTop: 'var(--mg-layout-gap)' }}>
                            <div><span style={{ color: 'var(--mg-color-text-secondary)' }}>신고 기간:</span> 2025-01-01 ~ 2025-12-31</div>
                            <div><span style={{ color: 'var(--mg-color-text-secondary)' }}>상태:</span> 진행 중</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 'var(--mg-layout-gap)' }}>
                          <button type="button" className="mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--primary">
                            <FileCheck size={16} />
                            신고서 확인
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === 'settings' && (
                  <section className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-layout-section-bg)', border: '1px solid var(--mg-layout-section-border)', borderRadius: '16px', padding: 'var(--mg-layout-section-padding)' }}>
                    <h2 className="mg-v2-ad-b0kla__chart-title">세무 설정</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--mg-layout-grid-gap)' }}>
                      {taxCategories.map((category) => (
                        <div key={category.id} className="mg-v2-ad-b0kla__card" style={{ background: 'var(--mg-color-surface-main)', borderLeft: '4px solid var(--mg-color-primary-main)' }}>
                          <div className="mg-v2-ad-b0kla__chart-header">
                            <h3 className="mg-v2-ad-b0kla__chart-title">{category.codeLabel}</h3>
                            <span style={{ fontSize: '12px', color: 'var(--mg-color-text-secondary)' }}>활성</span>
                          </div>
                          <div className="mg-v2-ad-b0kla__chart-body">
                            <p style={{ color: 'var(--mg-color-text-secondary)', fontSize: '14px' }}>{category.codeDescription}</p>
                            <div style={{ marginTop: 'var(--mg-layout-gap)' }}>
                              <div><span style={{ color: 'var(--mg-color-text-secondary)' }}>코드:</span> {category.codeValue}</div>
                              <div>
                                <span style={{ color: 'var(--mg-color-text-secondary)' }}>세율:</span>{' '}
                                {(() => {
                                  try {
                                    if (category.extraData) {
                                      const extraData = JSON.parse(category.extraData);
                                      return (extraData.taxRate || 'N/A') + '%';
                                    }
                                    return 'N/A';
                                  } catch {
                                    return 'N/A';
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
        </div>
      </ContentArea>

      {/* 추가 세금 계산 모달 (POST /api/v1/admin/salary/tax/calculate) */}
          {showCreateModal && (
            <div className="modal show d-block tax-management-modal-backdrop">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">추가 세금 계산</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowCreateModal(false)}
                      aria-label="닫기"
                    />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label" htmlFor="tax-modal-calculationId">급여 계산 *</label>
                      <select
                        id="tax-modal-calculationId"
                        className="form-select"
                        value={newTaxItem.calculationId}
                        onChange={(e) => setNewTaxItem({ ...newTaxItem, calculationId: e.target.value })}
                      >
                        <option value="">선택</option>
                        {calculationsList.map((c) => (
                          <option key={c.id} value={c.id}>
                            ID {c.id} · {c.consultant?.name ?? c.consultantId ?? '-'} · {formatCurrency(c.grossSalary)}
                          </option>
                        ))}
                      </select>
                      {calculationsList.length === 0 && (
                        <small className="text-muted">해당 기간 급여 계산이 없습니다. 급여 관리에서 먼저 계산해 주세요.</small>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="tax-modal-grossAmount">과세 기준 금액 *</label>
                      <input
                        id="tax-modal-grossAmount"
                        type="number"
                        min="0"
                        step="1"
                        className="form-control"
                        value={newTaxItem.grossAmount}
                        onChange={(e) => setNewTaxItem({ ...newTaxItem, grossAmount: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="tax-modal-taxType">세금 유형 *</label>
                      <select
                        id="tax-modal-taxType"
                        className="form-select"
                        value={newTaxItem.taxType}
                        onChange={(e) => setNewTaxItem({ ...newTaxItem, taxType: e.target.value })}
                      >
                        {Object.entries(TAX_TYPE).map(([k, v]) => (
                          <option key={k} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="tax-modal-taxRate">세율 (%) *</label>
                      <input
                        id="tax-modal-taxRate"
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        value={newTaxItem.taxRate}
                        onChange={(e) => setNewTaxItem({ ...newTaxItem, taxRate: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="tax-modal-taxName">세금명 (선택)</label>
                      <input
                        id="tax-modal-taxName"
                        type="text"
                        className="form-control"
                        value={newTaxItem.taxName}
                        onChange={(e) => setNewTaxItem({ ...newTaxItem, taxName: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="tax-modal-description">설명 (선택)</label>
                      <textarea
                        id="tax-modal-description"
                        className="form-control"
                        rows={2}
                        value={newTaxItem.description}
                        onChange={(e) => setNewTaxItem({ ...newTaxItem, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCreateTaxItem}
                      disabled={loading}
                    >
                      {loading ? '계산 중...' : '계산 반영'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
    </AdminCommonLayout>
  );
};

export default ImprovedTaxManagement;
