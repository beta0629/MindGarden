/**
 * 급여 관리·급여 프로필 페이지 (새 레이아웃 + B0KlA·아토믹 디자인)
 * 라우트: /erp/salary
 * ContentHeader + ContentArea, salary-*-block BEM 구조
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { Settings, Users, Calculator, Receipt } from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../dashboard-v2/content';
import { apiGet, apiPost } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import ConsultantProfileModal from './ConsultantProfileModal';
import SalaryProfileFormModal from './SalaryProfileFormModal';
import TaxDetailsModal from '../common/TaxDetailsModal';
import SalaryExportModal from '../common/SalaryExportModal';
import SalaryPrintComponent from '../common/SalaryPrintComponent';
import SalaryConfigModal from './SalaryConfigModal';
import MGButton from '../common/MGButton';
import { getStatusLabel } from '../../utils/colorUtils';
import './SalaryManagement.css';

const SalaryManagement = () => {
  const [consultants, setConsultants] = useState([]);
  const [salaryProfiles, setSalaryProfiles] = useState([]);
  const [salaryCalculations, setSalaryCalculations] = useState([]);
  const [taxStatistics, setTaxStatistics] = useState(null);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const [isTaxDetailsOpen, setIsTaxDetailsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedPayDay, setSelectedPayDay] = useState('TENTH');
  const [payDayOptions, setPayDayOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profiles');
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [calculationPeriodDisplay, setCalculationPeriodDisplay] = useState(null);

  /** 최근 12개월 기간 옵션 (YYYY-MM) */
  const periodOptions = (() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      list.push({ value: `${y}-${m}`, label: `${y}년 ${m}월` });
    }
    return list;
  })();

  const loadCalculationPeriod = async (year, month) => {
    if (!year || !month) {
      setCalculationPeriodDisplay(null);
      return;
    }
    try {
      const response = await apiGet(`/api/v1/admin/salary/calculation-period?year=${year}&month=${month}`);
      if (response && response.success && response.data) {
        setCalculationPeriodDisplay({
          periodStart: response.data.periodStart,
          periodEnd: response.data.periodEnd
        });
      } else {
        setCalculationPeriodDisplay(null);
      }
    } catch (e) {
      setCalculationPeriodDisplay(null);
    }
  };

  const loadConsultants = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/v1/admin/salary/consultants');
      if (!response) {
        setConsultants([]);
        return;
      }
      if (response && response.success) {
        setConsultants(response.data || []);
      } else {
        setConsultants([]);
        if (response && response.message) {
          showNotification(response.message, 'error');
        }
      }
    } catch (error) {
      console.error('상담사 목록 로드 실패:', error);
      setConsultants([]);
      showNotification('상담사 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSalaryProfiles = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/v1/admin/salary/profiles');
      if (!response) {
        setSalaryProfiles([]);
        return;
      }
      if (response && response.success) {
        setSalaryProfiles(response.data || []);
      } else {
        setSalaryProfiles([]);
        if (response && response.message) {
          showNotification(response.message, 'error');
        }
      }
    } catch (error) {
      console.error('급여 프로필 로드 실패:', error);
      setSalaryProfiles([]);
      showNotification('급여 프로필을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPayDayOptions = async () => {
    try {
      const response = await apiGet('/api/v1/common-codes?codeGroup=SALARY_PAY_DAY');
      if (response && Array.isArray(response)) {
        setPayDayOptions(response);
      }
    } catch (error) {
      console.error('급여일 옵션 로드 실패:', error);
    }
  };

  const executeSalaryCalculation = async () => {
    if (!selectedConsultant || !selectedPeriod) {
      showNotification('상담사와 기간을 선택해주세요.', 'warning');
      return;
    }
    if (salaryProfiles.length === 0) {
      showNotification('급여 계산을 위해서는 먼저 급여 프로필을 작성해주세요.\n급여 프로필 탭에서 "새 프로필 생성" 버튼을 클릭하세요.', 'warning');
      setActiveTab('profiles');
      return;
    }
    const consultantProfile = salaryProfiles.find(profile => profile.consultantId === selectedConsultant.id);
    if (!consultantProfile) {
      showNotification(`${selectedConsultant.name} 상담사의 급여 프로필이 없습니다.\n급여 프로필 탭에서 해당 상담사의 프로필을 먼저 작성해주세요.`, 'warning');
      setActiveTab('profiles');
      return;
    }

    try {
      setLoading(true);
      let periodStart;
      let periodEnd;
      if (calculationPeriodDisplay?.periodStart && calculationPeriodDisplay?.periodEnd) {
        periodStart = calculationPeriodDisplay.periodStart;
        periodEnd = calculationPeriodDisplay.periodEnd;
      } else {
        const [y, m] = selectedPeriod.split('-');
        periodStart = `${y}-${m}-01`;
        const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
        periodEnd = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
      }
      const queryParams = new URLSearchParams({
        consultantId: selectedConsultant.id,
        periodStart,
        periodEnd
      });
      const response = await apiPost(`/api/v1/admin/salary/calculate?${queryParams}`);
      if (response && response.success) {
        showNotification('급여 계산 미리보기가 완료되었습니다.', 'success');
        if (response.data) {
          setPreviewResult({
            consultantId: selectedConsultant.id,
            consultantName: selectedConsultant.name,
            period: selectedPeriod,
            periodStart,
            periodEnd,
            grossSalary: response.data.grossSalary || 0,
            netSalary: response.data.netSalary || 0,
            taxAmount: response.data.taxAmount || 0,
            consultationCount: response.data.consultationCount || 0,
            calculatedAt: new Date().toISOString()
          });
        }
        loadSalaryCalculations(selectedConsultant.id);
      } else {
        showNotification(response?.message || '급여 계산에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('급여 계산 실행 실패:', error);
      showNotification('급여 계산 실행에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (consultant) => {
    setSelectedConsultant(consultant);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedConsultant(null);
  };

  const handleCreateProfile = (consultant) => {
    setSelectedConsultant(consultant);
    setIsProfileFormOpen(true);
  };

  const handleProfileSaved = () => {
    showNotification('급여 프로필이 성공적으로 생성되었습니다.', 'success');
    loadSalaryProfiles();
  };

  const closeProfileForm = () => {
    setIsProfileFormOpen(false);
    setSelectedConsultant(null);
  };

  const loadSalaryCalculations = async (consultantId) => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/v1/admin/salary/calculations/${consultantId}`);
      if (response && response.success) {
        setSalaryCalculations(response.data);
      }
    } catch (error) {
      console.error('급여 계산 내역 로드 실패:', error);
      showNotification('급여 계산 내역을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTaxStatistics = async (period) => {
    try {
      setLoading(true);
      if (!period || period.trim() === '') {
        showNotification('세금 통계를 조회하려면 기간을 먼저 선택해주세요.', 'warning');
        setLoading(false);
        return;
      }
      const response = await apiGet(`/api/v1/admin/salary/tax/statistics?period=${period}`);
      if (response && response.success) {
        setTaxStatistics(response.data);
      }
    } catch (error) {
      console.error('세금 통계 로드 실패:', error);
      showNotification('세금 통계를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultants();
    loadSalaryProfiles();
    loadPayDayOptions();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      const [y, m] = selectedPeriod.split('-');
      loadCalculationPeriod(parseInt(y, 10), parseInt(m, 10));
    } else {
      setCalculationPeriodDisplay(null);
    }
  }, [selectedPeriod]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <AdminCommonLayout title="급여 관리">
      {loading && consultants.length === 0 ? (
        <UnifiedLoading type="page" text="데이터를 불러오는 중..." />
      ) : (
        <>
          <ContentHeader
            title="급여 관리"
            subtitle="상담사 급여 프로필 및 계산 관리"
            actions={
              <>
                <MGButton
                  variant="outline"
                  size="small"
                  onClick={() => setIsConfigModalOpen(true)}
                  aria-label="급여 기산일 설정"
                  className="salary-management__header-btn"
                >
                  <Settings size={18} aria-hidden />
                  <span className="salary-management__header-btn-text">기산일 설정</span>
                </MGButton>
                <select
                  value={selectedPeriod}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedPeriod(val);
                    if (val) {
                      const [y, m] = val.split('-');
                      loadCalculationPeriod(parseInt(y, 10), parseInt(m, 10));
                      if (activeTab === 'tax') loadTaxStatistics(val);
                    } else {
                      setCalculationPeriodDisplay(null);
                    }
                  }}
                  className="mg-v2-select salary-management__period-select"
                  aria-label="기간 선택"
                >
                  <option value="">기간 선택</option>
                  {periodOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <MGButton
                  variant="primary"
                  size="small"
                  onClick={() => setActiveTab('calculations')}
                  className="salary-management__header-btn salary-management__header-btn--primary"
                  aria-label="한 번에 계산"
                >
                  <Calculator size={18} aria-hidden />
                  <span className="salary-management__header-btn-text">한 번에 계산</span>
                </MGButton>
              </>
            }
          />
          <ContentArea
            className="mg-v2-ad-b0kla salary-management__main"
            ariaLabel="급여 관리 콘텐츠"
          >
            {/* (2) 필터·제어 / 계산 대상 선택 */}
            <section className="salary-filter-block" aria-labelledby="salary-filter-title">
              <h2 id="salary-filter-title" className="salary-filter-block__title">
                <span className="salary-filter-block__accent" aria-hidden />
                계산 대상 선택
              </h2>
              <div className="salary-filter-block__group">
                <div className="salary-filter-block__field">
                  <label htmlFor="salary-period" className="mg-v2-form-label">기간</label>
                  <select
                    id="salary-period"
                    value={selectedPeriod}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedPeriod(val);
                      if (val) {
                        const [y, m] = val.split('-');
                        loadCalculationPeriod(parseInt(y, 10), parseInt(m, 10));
                        if (activeTab === 'tax') loadTaxStatistics(val);
                      } else {
                        setCalculationPeriodDisplay(null);
                      }
                    }}
                    className="mg-v2-select"
                  >
                    <option value="">기간 선택</option>
                    {periodOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {calculationPeriodDisplay && selectedPeriod && (
                  <div className="salary-filter-block__field salary-filter-block__period-display" role="status">
                    <span className="mg-v2-form-label">실제 계산 기간</span>
                    <span className="salary-filter-block__period-text">
                      {calculationPeriodDisplay.periodStart} ~ {calculationPeriodDisplay.periodEnd} (기산일 기준)
                    </span>
                  </div>
                )}
                <div className="salary-filter-block__field">
                  <label htmlFor="salary-consultant" className="mg-v2-form-label">상담사</label>
                  <select
                    id="salary-consultant"
                    value={selectedConsultant?.id || ''}
                    onChange={(e) => {
                      const consultant = consultants.find(c => c.id === parseInt(e.target.value, 10));
                      setSelectedConsultant(consultant);
                      if (consultant) loadSalaryCalculations(consultant.id);
                    }}
                    className="mg-v2-select"
                  >
                    <option value="">상담사 선택</option>
                    {consultants.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="salary-filter-block__field">
                  <label htmlFor="salary-payday" className="mg-v2-form-label">급여 지급일</label>
                  <select
                    id="salary-payday"
                    value={selectedPayDay}
                    onChange={(e) => setSelectedPayDay(e.target.value)}
                    className="mg-v2-select"
                  >
                    {payDayOptions.map(opt => (
                      <option key={opt.codeValue} value={opt.codeValue}>{opt.codeLabel}</option>
                    ))}
                  </select>
                </div>
                <div className="salary-filter-block__run-calc">
                  <MGButton
                    variant="primary"
                    size="medium"
                    onClick={executeSalaryCalculation}
                    disabled={loading || !selectedConsultant || !selectedPeriod || salaryProfiles.length === 0}
                    loading={loading}
                    loadingText="계산 중..."
                    className="mg-v2-button mg-v2-button--primary"
                  >
                    계산하기
                  </MGButton>
                </div>
              </div>
            </section>

            {/* (3) 탭 */}
            <div className="mg-v2-ad-b0kla__section salary-management__tabs-wrap">
              <div className="mg-tabs" role="tablist" aria-label="급여 관리 탭">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'profiles'}
                  aria-controls="salary-profile-panel"
                  id="tab-profiles"
                  className={`mg-tab ${activeTab === 'profiles' ? 'mg-tab-active' : ''}`}
                  onClick={() => setActiveTab('profiles')}
                >
                  <Users size={18} aria-hidden />
                  급여 프로필
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'calculations'}
                  aria-controls="salary-calc-panel"
                  id="tab-calculations"
                  className={`mg-tab ${activeTab === 'calculations' ? 'mg-tab-active' : ''}`}
                  onClick={() => setActiveTab('calculations')}
                >
                  <Calculator size={18} aria-hidden />
                  급여 계산
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'tax'}
                  aria-controls="salary-tax-panel"
                  id="tab-tax"
                  className={`mg-tab ${activeTab === 'tax' ? 'mg-tab-active' : ''}`}
                  onClick={() => {
                    setActiveTab('tax');
                    if (selectedPeriod) loadTaxStatistics(selectedPeriod);
                  }}
                >
                  <Receipt size={18} aria-hidden />
                  세금 관리
                </button>
              </div>

              {/* (4) 탭별 콘텐츠 */}
              {activeTab === 'profiles' && (
                <section
                  id="salary-profile-panel"
                  role="tabpanel"
                  aria-labelledby="tab-profiles"
                  className="salary-profile-block"
                >
                  <div className="salary-profile-block__header">
                    <h2 className="salary-profile-block__title">
                      <span className="salary-profile-block__accent" aria-hidden />
                      상담사 급여 프로필
                    </h2>
                    <MGButton
                      variant="primary"
                      size="small"
                      onClick={() => setIsProfileFormOpen(true)}
                      className="mg-v2-button mg-v2-button--primary"
                    >
                      새 프로필 생성
                    </MGButton>
                  </div>
                  {salaryProfiles.length === 0 && !loading && (
                    <div className="salary-profile-block__empty salary-profile-block__empty--no-profiles">
                      <p className="salary-no-profiles-message">
                        급여 프로필이 없습니다. 급여 계산을 하기 위해서는 먼저 상담사별 급여 프로필을 작성해야 합니다.
                        위의 &quot;새 프로필 생성&quot; 버튼을 클릭하여 급여 프로필을 작성해주세요.
                      </p>
                      <MGButton
                        variant="primary"
                        size="medium"
                        onClick={() => setIsProfileFormOpen(true)}
                        className="mg-v2-button mg-v2-button--primary"
                      >
                        지금 프로필 작성하기
                      </MGButton>
                    </div>
                  )}
                  <div className="salary-profile-block__grid">
                    {loading ? (
                      <p className="salary-management__loading-text">데이터를 불러오는 중...</p>
                    ) : consultants.length === 0 ? (
                      <p className="salary-profile-block__empty-state">상담사 데이터가 없습니다.</p>
                    ) : salaryProfiles.length > 0 ? (
                      consultants.map(consultant => {
                        const profile = salaryProfiles.find(p => p.consultantId === consultant.id);
                        return (
                          <article
                            key={consultant.id}
                            className="salary-profile-card"
                            aria-labelledby={`profile-name-${consultant.id}`}
                          >
                            <span className="salary-profile-card__accent" aria-hidden />
                            <div className="salary-profile-card__name" id={`profile-name-${consultant.id}`}>
                              {consultant.name}
                            </div>
                            <div className="salary-profile-card__meta">{consultant.email}</div>
                            <div className="salary-profile-card__grade">등급: {consultant.grade || '—'}</div>
                            <div className="salary-profile-card__base">
                              <span className="salary-management__stat-label">기본급</span>
                              <span className="salary-management__stat-value">
                                {profile ? formatCurrency(profile.baseSalary || 0) : '—'}
                              </span>
                            </div>
                            <div className="salary-profile-card__actions">
                              <MGButton
                                variant="secondary"
                                size="small"
                                onClick={() => openModal(consultant)}
                                className="mg-v2-button mg-v2-button--outline"
                              >
                                프로필 조회
                              </MGButton>
                              <MGButton
                                variant="outline"
                                size="small"
                                onClick={() => handleCreateProfile(consultant)}
                                className="mg-v2-button mg-v2-button--outline"
                              >
                                편집
                              </MGButton>
                            </div>
                          </article>
                        );
                      })
                    ) : null}
                  </div>
                </section>
              )}

              {activeTab === 'calculations' && (
                <section
                  id="salary-calc-panel"
                  role="tabpanel"
                  aria-labelledby="tab-calculations"
                  className="salary-calc-block"
                >
                  <div className="salary-calc-block__header">
                    <h2 className="salary-calc-block__title">
                      <span className="salary-calc-block__accent" aria-hidden />
                      급여 계산
                    </h2>
                    {salaryProfiles.length === 0 && (
                      <MGButton variant="outline" size="small" onClick={() => setActiveTab('profiles')}>
                        지금 작성하기
                      </MGButton>
                    )}
                  </div>
                  <div className="salary-calc-block__preview">
                    {previewResult && (
                      <div className="salary-calc-block__preview-card">
                        <h3 className="salary-calc-block__preview-title">계산 결과 미리보기</h3>
                        {previewResult.periodStart && previewResult.periodEnd && (
                          <p className="salary-calc-block__preview-period">
                            적용 기간: {previewResult.periodStart} ~ {previewResult.periodEnd} (기산일 기준)
                          </p>
                        )}
                        <div className="salary-calc-block__preview-summary">
                          <div className="salary-calc-block__preview-card-item">
                            <span className="salary-management__stat-label">총 급여</span>
                            <span className="salary-management__stat-value">{formatCurrency(previewResult.grossSalary)}</span>
                          </div>
                          <div className="salary-calc-block__preview-card-item">
                            <span className="salary-management__stat-label">세금·공제</span>
                            <span className="salary-management__stat-value">-{formatCurrency(previewResult.taxAmount)}</span>
                          </div>
                          <div className="salary-calc-block__preview-card-item salary-calc-block__preview-card-item--net">
                            <span className="salary-management__stat-label">실지급액</span>
                            <span className="salary-management__stat-value">{formatCurrency(previewResult.netSalary)}</span>
                          </div>
                        </div>
                        <div className="salary-calc-block__preview-grid">
                          <div className="salary-management__stat-label">상담사</div>
                          <div className="salary-management__stat-value">{previewResult.consultantName}</div>
                          <div className="salary-management__stat-label">기간</div>
                          <div className="salary-management__stat-value">{previewResult.period}</div>
                          <div className="salary-management__stat-label">상담 건수</div>
                          <div className="salary-management__stat-value">{previewResult.consultationCount}건</div>
                        </div>
                        <div className="salary-calc-block__preview-actions">
                          <MGButton
                            variant="primary"
                            size="medium"
                            onClick={async () => {
                              if (!previewResult.periodStart || !previewResult.periodEnd) {
                                showNotification('확정할 기간 정보가 없습니다.', 'warning');
                                return;
                              }
                              try {
                                setLoading(true);
                                const params = new URLSearchParams({
                                  consultantId: previewResult.consultantId,
                                  periodStart: previewResult.periodStart,
                                  periodEnd: previewResult.periodEnd
                                });
                                const res = await apiPost(`/api/v1/admin/salary/confirm?${params}`);
                                if (res && res.success) {
                                  showNotification('급여 계산이 확정되었습니다.', 'success');
                                  setPreviewResult(null);
                                  if (previewResult.consultantId) loadSalaryCalculations(previewResult.consultantId);
                                } else {
                                  showNotification(res?.message || '확정에 실패했습니다.', 'error');
                                }
                              } catch (err) {
                                showNotification('확정 처리 중 오류가 발생했습니다.', 'error');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            className="mg-v2-button mg-v2-button--primary"
                          >
                            확정
                          </MGButton>
                          <MGButton
                            variant="outline"
                            size="medium"
                            onClick={() => setPreviewResult(null)}
                            className="mg-v2-button mg-v2-button--outline"
                          >
                            다시 계산
                          </MGButton>
                        </div>
                        <p className="salary-calc-block__preview-notice">
                          미리보기 후 확정하면 해당 기간 급여가 저장됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="salary-calc-block__list">
                    <h3 className="salary-calc-block__list-title">급여 계산 내역</h3>
                    {salaryCalculations.map(calculation => (
                      <article key={calculation.id} className="salary-calc-block__card">
                        <div className="salary-calc-block__card-header">
                          <span>{calculation.calculationPeriod}</span>
                          <span className="mg-v2-status-badge mg-v2-badge--neutral" role="status">
                            {getStatusLabel(calculation.status)}
                          </span>
                        </div>
                        <div className="salary-calc-block__card-details">
                          <div className="salary-management__detail-row">
                            <span>기본 급여</span>
                            <span>{formatCurrency(calculation.baseSalary)}</span>
                          </div>
                          <div className="salary-management__detail-row">
                            <span>옵션 급여</span>
                            <span>{formatCurrency(calculation.optionSalary)}</span>
                          </div>
                          <div className="salary-management__detail-row">
                            <span>총 급여 (세전)</span>
                            <span>{formatCurrency(calculation.baseSalary + calculation.optionSalary)}</span>
                          </div>
                          {calculation.taxAmount != null && (
                            <div className="salary-management__detail-row salary-management__detail-row--tax">
                              <span>원천징수 (3.3%)</span>
                              <span>-{formatCurrency(calculation.taxAmount)}</span>
                            </div>
                          )}
                          <div className="salary-management__detail-row salary-management__detail-row--total">
                            <span>실지급액 (세후)</span>
                            <span>{formatCurrency(calculation.totalSalary - (calculation.taxAmount || 0))}</span>
                          </div>
                          <div className="salary-management__detail-row">
                            <span>상담 건수</span>
                            <span>{calculation.consultationCount}건</span>
                          </div>
                        </div>
                        <div className="salary-calc-block__actions">
                          <MGButton
                            variant="secondary"
                            size="small"
                            onClick={() => {
                              setSelectedCalculation(calculation);
                              setIsTaxDetailsOpen(true);
                            }}
                            className="mg-v2-button mg-v2-button--secondary"
                          >
                            세금 내역 보기
                          </MGButton>
                          <MGButton
                            variant="primary"
                            size="small"
                            onClick={() => {
                              setSelectedCalculation(calculation);
                              setIsExportModalOpen(true);
                            }}
                            className="mg-v2-button mg-v2-button--primary"
                          >
                            출력
                          </MGButton>
                          <SalaryPrintComponent
                            salaryData={calculation}
                            consultantName={consultants.find(c => c.id === calculation.consultantId)?.name || '알 수 없음'}
                            period={calculation.calculationPeriod}
                            includeTaxDetails
                            includeCalculationDetails
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'tax' && (
                <section
                  id="salary-tax-panel"
                  role="tabpanel"
                  aria-labelledby="tab-tax"
                  className="salary-tax-block"
                >
                  <div className="salary-tax-block__header">
                    <h2 className="salary-tax-block__title">
                      <span className="salary-tax-block__accent" aria-hidden />
                      세금 관리
                    </h2>
                    <MGButton
                      variant="primary"
                      size="small"
                      onClick={() => loadTaxStatistics(selectedPeriod)}
                      className="mg-v2-button mg-v2-button--primary"
                    >
                      세금 통계 조회
                    </MGButton>
                  </div>
                  {taxStatistics ? (
                    <div className="salary-tax-block__card">
                      <h3 className="salary-tax-block__card-title">세금 통계 내역</h3>
                      <div className="salary-tax-block__card-body">
                        <div className="salary-management__detail-row">
                          <span>총 세금액</span>
                          <span className="salary-tax-block__value">{formatCurrency(taxStatistics.totalTaxAmount || 0)}</span>
                        </div>
                        <div className="salary-management__detail-row">
                          <span>세금 건수</span>
                          <span>{taxStatistics.taxCount || 0}건</span>
                        </div>
                        {(taxStatistics.withholdingTax > 0 || taxStatistics.localIncomeTax > 0) && (
                          <>
                            <div className="salary-management__detail-row">
                              <span>원천징수세 (3.3%)</span>
                              <span>-{formatCurrency(taxStatistics.withholdingTax || 0)}</span>
                            </div>
                            <div className="salary-management__detail-row">
                              <span>지방소득세 (0.33%)</span>
                              <span>-{formatCurrency(taxStatistics.localIncomeTax || 0)}</span>
                            </div>
                          </>
                        )}
                        {taxStatistics.vat > 0 && (
                          <div className="salary-management__detail-row">
                            <span>부가가치세 (10%)</span>
                            <span>-{formatCurrency(taxStatistics.vat || 0)}</span>
                          </div>
                        )}
                        <div className="salary-management__detail-row">
                          <span>국민연금 (4.5%)</span>
                          <span>-{formatCurrency(taxStatistics.nationalPension || 0)}</span>
                        </div>
                        <div className="salary-management__detail-row">
                          <span>건강보험 (3.545%)</span>
                          <span>-{formatCurrency(taxStatistics.healthInsurance || 0)}</span>
                        </div>
                        <div className="salary-management__detail-row">
                          <span>장기요양보험 (0.545%)</span>
                          <span>-{formatCurrency(taxStatistics.longTermCare || 0)}</span>
                        </div>
                        <div className="salary-management__detail-row">
                          <span>고용보험 (0.9%)</span>
                          <span>-{formatCurrency(taxStatistics.employmentInsurance || 0)}</span>
                        </div>
                        <div className="salary-management__detail-row salary-management__detail-row--total">
                          <span>총 공제액</span>
                          <span>-{formatCurrency(taxStatistics.totalTaxAmount || 0)}</span>
                        </div>
                      </div>
                      <div className="salary-tax-block__actions">
                        <MGButton variant="secondary" size="small" className="mg-v2-button mg-v2-button--secondary">
                          세금 상세 내역 보기
                        </MGButton>
                        <MGButton variant="primary" size="small" className="mg-v2-button mg-v2-button--primary">
                          출력
                        </MGButton>
                      </div>
                    </div>
                  ) : (
                    <div className="salary-tax-block__empty">
                      <p>세금 통계를 조회하려면 기간을 선택한 뒤 &quot;세금 통계 조회&quot; 버튼을 클릭하세요.</p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </ContentArea>
        </>
      )}

      {loading && (
        <div className="salary-management-loading-overlay" aria-hidden>
          <UnifiedLoading type="inline" text="로딩 중..." />
        </div>
      )}

      <ConsultantProfileModal isOpen={isModalOpen} onClose={closeModal} consultant={selectedConsultant} />
      <SalaryProfileFormModal
        isOpen={isProfileFormOpen}
        onClose={closeProfileForm}
        consultant={selectedConsultant}
        onSave={handleProfileSaved}
      />
      <TaxDetailsModal
        isOpen={isTaxDetailsOpen}
        onClose={() => setIsTaxDetailsOpen(false)}
        calculationId={selectedCalculation?.id}
        consultantName={selectedConsultant?.name}
        period={selectedCalculation?.calculationPeriod}
      />
      <SalaryExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        salaryData={selectedCalculation}
        consultantName={selectedConsultant?.name}
        period={selectedCalculation?.calculationPeriod}
      />
      <SalaryConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={() => {
          showNotification('급여 기산일 설정이 저장되었습니다.', 'success');
        }}
      />
    </AdminCommonLayout>
  );
};

export default SalaryManagement;
