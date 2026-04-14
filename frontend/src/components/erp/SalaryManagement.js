/**
 * 급여 관리·급여 프로필 페이지 (새 레이아웃 + B0KlA·아토믹 디자인)
 * 라우트: /erp/salary
 * ContentHeader + ContentArea, salary-*-block BEM 구조
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../dashboard-v2/content';
import StandardizedApi from '../../utils/standardizedApi';
import {
  SALARY_API_ENDPOINTS,
  SALARY_PAY_DAY_FALLBACK_OPTIONS,
  TAX_BREAKDOWN_ORDER,
  TAX_BREAKDOWN_LABELS
} from '../../constants/salaryConstants';
import { getAllConsultantsWithStats } from '../../utils/consultantHelper';
import { showNotification } from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';
import ConsultantProfileModal from './ConsultantProfileModal';
import SalaryProfileFormModal from './SalaryProfileFormModal';
import TaxDetailsModal from '../common/TaxDetailsModal';
import SalaryExportModal from '../common/SalaryExportModal';
import SalaryPrintComponent from '../common/SalaryPrintComponent';
import SalaryConfigModal from './SalaryConfigModal';
import MGButton from '../common/MGButton';
import ConsultantCard from '../ui/Card/ConsultantCard';
import { ViewModeToggle, SmallCardGrid, ListTableView } from '../common';
import { getStatusLabel } from '../../utils/colorUtils';
import { toDisplayString } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import './ErpCommon.css';
import './SalaryManagement.css';
import '../admin/mapping-management/organisms/MappingListBlock.css';
import ErpPageShell from './shell/ErpPageShell';
import { ErpFilterToolbar, useErpSilentRefresh } from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';

const TAB_CALC = 'calculations';
const TAB_PROFILES = 'profiles';
const TAB_TAX = 'tax';

const SalaryManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab =
    tabFromUrl === TAB_TAX ? TAB_TAX : tabFromUrl === TAB_PROFILES ? TAB_PROFILES : TAB_CALC;

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
  const { silentListRefreshing, runSilentListRefresh } = useErpSilentRefresh();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [calculationPeriodDisplay, setCalculationPeriodDisplay] = useState(null);
  const [isConsultantPickerOpen, setIsConsultantPickerOpen] = useState(false);
  const [profileViewMode, setProfileViewMode] = useState('largeCard');
  const [confirmSalaryLoading, setConfirmSalaryLoading] = useState(false);
  /** 최초 상담사 목록 페치 1회 완료 여부(초기 인라인 로딩 vs 이후 로딩 오버레이 구분). */
  const [consultantsInitialFetchDone, setConsultantsInitialFetchDone] = useState(false);

  useEffect(() => {
    const t = searchParams.get('tab');
    const next = t === TAB_TAX ? TAB_TAX : t === TAB_PROFILES ? TAB_PROFILES : TAB_CALC;
    setActiveTab(next);
  }, [searchParams]);

  const setActiveTabAndUrl = (tab) => {
    setActiveTab(tab);
    if (tab === TAB_CALC) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
    if (tab === TAB_TAX && selectedPeriod) loadTaxStatistics(selectedPeriod);
  };

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

  const loadCalculationPeriod = async(year, month) => {
    if (!year || !month) {
      setCalculationPeriodDisplay(null);
      return;
    }
    try {
      const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.CALCULATION_PERIOD, { year, month });
      if (response && typeof response === 'object' && (response.periodStart != null || response.periodEnd != null)) {
        setCalculationPeriodDisplay({
          periodStart: response.periodStart,
          periodEnd: response.periodEnd
        });
      } else if (response && response.data) {
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

  /** 상담사 목록: 공통 모듈 consultantHelper 사용 (GET /api/v1/admin/consultants/with-stats).
   * API 반환형 { consultant: { id, name, ... }, ... } → item.consultant 기준 평탄화 후 setConsultants (ConsultantManagement/VacationManagementModal과 동일). */
  const loadConsultants = async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (!silent) setLoading(true);
      const list = await getAllConsultantsWithStats();
      const raw = Array.isArray(list) ? list : [];
      const flattened = raw.map((item) => {
        const c = item.consultant || {};
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          role: c.role,
          isActive: c.isActive,
          branchCode: c.branchCode,
          specialty: c.specialty,
          specialtyDetails: c.specialtyDetails,
          specialization: c.specialization,
          specializationDetails: c.specializationDetails,
          yearsOfExperience: c.yearsOfExperience,
          maxClients: c.maxClients,
          currentClients: item.currentClients,
          totalClients: item.totalClients,
          grade: c.grade
        };
      });
      setConsultants(flattened);
    } catch (error) {
      console.error('상담사 목록 로드 실패:', error);
      setConsultants([]);
      showNotification('상담사 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setConsultantsInitialFetchDone(true);
      if (!silent) setLoading(false);
    }
  };

  const loadSalaryProfiles = async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (!silent) setLoading(true);
      const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.PROFILES);
      if (!response) {
        setSalaryProfiles([]);
        return;
      }
      if (Array.isArray(response)) {
        setSalaryProfiles(response);
      } else if (response && response.success) {
        setSalaryProfiles(response.data || []);
      } else {
        setSalaryProfiles(response?.data ?? []);
        if (response && response.message) {
          showNotification(response.message, 'error');
        }
      }
    } catch (error) {
      console.error('급여 프로필 로드 실패:', error);
      setSalaryProfiles([]);
      showNotification('급여 프로필을 불러오는데 실패했습니다.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadPayDayOptions = async() => {
    try {
      const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.COMMON_CODES, {
        codeGroup: 'SALARY_PAY_DAY'
      });
      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && Array.isArray(response.codes)) {
        list = response.codes;
      } else if (response?.data && Array.isArray(response.data.codes)) {
        list = response.data.codes;
      } else if (response?.data && Array.isArray(response.data)) {
        list = response.data;
      }
      setPayDayOptions(list.length > 0 ? list : SALARY_PAY_DAY_FALLBACK_OPTIONS);
    } catch (error) {
      console.error('급여일 옵션 로드 실패:', error);
      setPayDayOptions(SALARY_PAY_DAY_FALLBACK_OPTIONS);
      showNotification('급여 지급일 목록을 불러오지 못해 기본 옵션을 표시합니다.', 'warning');
    }
  };

  const executeSalaryCalculation = async() => {
    if (!selectedConsultant || !selectedPeriod) {
      showNotification('상담사와 기간을 선택해주세요.', 'warning');
      return;
    }
    if (salaryProfiles.length === 0) {
      showNotification('급여 계산을 위해서는 먼저 급여 프로필을 작성해주세요.\n급여 프로필 탭에서 "새 프로필 생성" 버튼을 클릭하세요.', 'warning');
      setActiveTabAndUrl(TAB_PROFILES);
      return;
    }
    const consultantProfile = salaryProfiles.find(profile => profile.consultantId === selectedConsultant.id);
    if (!consultantProfile) {
      showNotification(`${selectedConsultant.name} 상담사의 급여 프로필이 없습니다.\n급여 프로필 탭에서 해당 상담사의 프로필을 먼저 작성해주세요.`, 'warning');
      setActiveTabAndUrl(TAB_PROFILES);
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
      // selectedPayDay(급여 지급일 코드)는 미리보기 API에 미전달. 기간은 calculation-period·월 범위로만 산출.
      const queryParams = new URLSearchParams({
        consultantId: selectedConsultant.id,
        periodStart,
        periodEnd
      });
      const response = await StandardizedApi.post(
        `${SALARY_API_ENDPOINTS.CALCULATE}?${queryParams}`,
        {}
      );
      if (response && typeof response === 'object' && response.success === false) {
        showNotification(response?.message || '급여 계산에 실패했습니다.', 'error');
      } else if (response && typeof response === 'object') {
        const data = response.data ?? response;
        showNotification('급여 계산 미리보기가 완료되었습니다.', 'success');
        setPreviewResult({
          consultantId: selectedConsultant.id,
          consultantName: selectedConsultant.name,
          period: selectedPeriod,
          periodStart,
          periodEnd,
          grossSalary: data?.grossSalary ?? 0,
          netSalary: data?.netSalary ?? 0,
          taxAmount: data?.taxAmount ?? 0,
          consultationCount: data?.consultationCount ?? 0,
          calculatedAt: new Date().toISOString()
        });
        loadSalaryCalculations(selectedConsultant.id);
      } else if (response != null) {
        showNotification('급여 계산 미리보기가 완료되었습니다.', 'success');
        loadSalaryCalculations(selectedConsultant.id);
      } else {
        showNotification('급여 계산에 실패했습니다.', 'error');
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

  /** 새 프로필 생성/지금 프로필 작성하기 클릭 시 상담사 선택 단계 오픈. 상담사 0명이면 모달 띄우지 않고 안내만. */
  const openConsultantPicker = () => {
    if (consultants.length === 0) {
      showNotification('상담사가 없습니다. 상담사를 먼저 등록해주세요.', 'warning');
      return;
    }
    setIsConsultantPickerOpen(true);
  };

  const closeConsultantPicker = () => {
    setIsConsultantPickerOpen(false);
  };

  const handleConsultantPickForProfile = (consultant) => {
    handleCreateProfile(consultant);
    closeConsultantPicker();
  };

  const handleProfileSaved = () => {
    showNotification('급여 프로필이 성공적으로 생성되었습니다.', 'success');
    loadSalaryProfiles();
  };

  const closeProfileForm = () => {
    setIsProfileFormOpen(false);
    setSelectedConsultant(null);
  };

  const loadSalaryCalculations = async(consultantId, options = {}) => {
    const silent = options.silent === true;
    try {
      if (!silent) setLoading(true);
      const response = await StandardizedApi.get(`${SALARY_API_ENDPOINTS.CALCULATIONS}/${consultantId}`);
      if (Array.isArray(response)) {
        setSalaryCalculations(response);
      } else if (response && response.success) {
        setSalaryCalculations(response.data ?? []);
      } else if (response && response?.data) {
        setSalaryCalculations(Array.isArray(response.data) ? response.data : []);
      } else {
        setSalaryCalculations([]);
      }
    } catch (error) {
      console.error('급여 계산 내역 로드 실패:', error);
      showNotification('급여 계산 내역을 불러오는데 실패했습니다.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadTaxStatistics = async(period, options = {}) => {
    const silent = options.silent === true;
    try {
      if (!silent) setLoading(true);
      if (!period || period.trim() === '') {
        showNotification('세금 통계를 조회하려면 기간을 먼저 선택해주세요.', 'warning');
        if (!silent) setLoading(false);
        return;
      }
      const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.TAX_STATISTICS, { period });
      if (response != null && typeof response === 'object') {
        setTaxStatistics(response.data ?? response);
      } else {
        setTaxStatistics(null);
      }
    } catch (error) {
      console.error('세금 통계 로드 실패:', error);
      showNotification('세금 통계를 불러오는데 실패했습니다.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDataRefresh = useCallback(async() => {
    await runSilentListRefresh(async() => {
      const silent = { silent: true };
      if (activeTab === TAB_PROFILES) {
        await Promise.all([
          loadConsultants(silent),
          loadSalaryProfiles(silent),
          loadPayDayOptions()
        ]);
      } else if (activeTab === TAB_CALC) {
        await Promise.all([loadConsultants(silent), loadSalaryProfiles(silent)]);
        if (selectedConsultant?.id) {
          await loadSalaryCalculations(selectedConsultant.id, silent);
        }
      } else if (activeTab === TAB_TAX) {
        await loadTaxStatistics(selectedPeriod, silent);
      }
    });
  }, [activeTab, selectedConsultant, selectedPeriod, runSilentListRefresh]);

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

  /** 최초 로드 중·상담사 목록 없음: 본문은 인라인 로더만(헤더·탭은 유지). 이후 동일 조건은 세금 조회 등과 겹치지 않도록 fetch 완료 후에는 사용하지 않음. */
  const showInitialInlineLoad =
    loading && consultants.length === 0 && !consultantsInitialFetchDone;
  /** 초기 인라인과 중복되지 않는 전역 로딩 오버레이(계산·탭 데이터 로드 등). silent 새로고침은 loading을 켜지 않음. */
  const showLoadingOverlay = loading && !showInitialInlineLoad;

  return (
    <AdminCommonLayout title="급여 관리">
      <ContentArea className="mg-v2-content-area" ariaLabel="급여·세금 관리 콘텐츠">
            <ErpPageShell
              headerSlot={
                <ContentHeader
                  title="급여·세금 관리"
                  subtitle="상담사 급여 및 세금 계산·통계"
                  actions={
                    <>
                      <MGButton
                        variant="outline"
                        size="small"
                        onClick={() => setIsConfigModalOpen(true)}
                        aria-label="급여 기산일 설정"
                        className={buildErpMgButtonClassName({
                          variant: 'outline',
                          size: 'sm',
                          className: 'salary-management__header-btn'
                        })}
                      >
                        <span className="salary-management__header-btn-text">기산일 설정</span>
                      </MGButton>
                      <MGButton
                        variant="primary"
                        size="small"
                        onClick={() => setActiveTabAndUrl(TAB_CALC)}
                        className={buildErpMgButtonClassName({
                          variant: 'primary',
                          size: 'sm',
                          className: 'salary-management__header-btn salary-management__header-btn--primary'
                        })}
                        aria-label="한 번에 계산"
                      >
                        <span className="salary-management__header-btn-text">한 번에 계산</span>
                      </MGButton>
                    </>
                  }
                />
              }
              tabsSlot={
                <div className="mg-v2-ad-b0kla__section salary-management__tabs-wrap">
                  {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- W3C 탭 패턴상 tablist는 div 컨테이너 사용 */}
                  <div className="mg-tabs" role="tablist" aria-label="급여 관리 탭">
                    <MGButton
                      type="button"
                      variant="outline"
                      role="tab"
                      aria-selected={activeTab === TAB_PROFILES}
                      aria-controls="salary-profile-panel"
                      id="tab-profiles"
                      className={`mg-tab ${activeTab === TAB_PROFILES ? 'mg-tab-active' : ''}`}
                      onClick={() => setActiveTabAndUrl(TAB_PROFILES)}
                      preventDoubleClick={false}
                    >
                      급여 프로필
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="outline"
                      role="tab"
                      aria-selected={activeTab === TAB_CALC}
                      aria-controls="salary-calc-panel"
                      id="tab-calculations"
                      className={`mg-tab ${activeTab === TAB_CALC ? 'mg-tab-active' : ''}`}
                      onClick={() => setActiveTabAndUrl(TAB_CALC)}
                      preventDoubleClick={false}
                    >
                      급여 계산
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="outline"
                      role="tab"
                      aria-selected={activeTab === TAB_TAX}
                      aria-controls="salary-tax-panel"
                      id="tab-tax"
                      className={`mg-tab ${activeTab === TAB_TAX ? 'mg-tab-active' : ''}`}
                      onClick={() => setActiveTabAndUrl(TAB_TAX)}
                      preventDoubleClick={false}
                    >
                      세금 관리
                    </MGButton>
                  </div>
                </div>
              }
              mainAriaLabel="급여·세금 관리 콘텐츠"
            >
            <div className="mg-v2-ad-b0kla salary-management__main">
            {showInitialInlineLoad ? (
              <div className="salary-management__initial-load" role="status" aria-live="polite">
                <UnifiedLoading type="inline" text="데이터를 불러오는 중..." />
              </div>
            ) : (
              <>
            {/* 블록 1: 계산 대상 선택 */}
            <section className="mg-v2-ad-b0kla__card salary-filter-block" aria-labelledby="salary-filter-title">
              <h2 id="salary-filter-title" className="mg-v2-ad-b0kla__section-title salary-filter-block__title">
                <span className="salary-filter-block__accent" aria-hidden />
                계산 대상 선택
              </h2>
              <ErpFilterToolbar
                ariaLabel="급여 계산 대상 선택"
                primaryRow={(
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
                            if (activeTab === TAB_TAX) loadTaxStatistics(val);
                          } else {
                            setCalculationPeriodDisplay(null);
                          }
                        }}
                        className="mg-v2-select"
                        aria-label="기간 선택"
                      >
                        <option value="">기간 선택</option>
                        {periodOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{toDisplayString(opt.label)}</option>
                        ))}
                      </select>
                    </div>
                    {selectedPeriod && (
                      <div className="salary-filter-block__field salary-filter-block__period-display" role="status">
                        <span className="mg-v2-form-label">실제 계산 기간</span>
                        <span className="salary-filter-block__period-text">
                          {calculationPeriodDisplay
                            ? `${calculationPeriodDisplay.periodStart} ~ ${calculationPeriodDisplay.periodEnd} (기산일 기준)`
                            : (() => {
                                const [y, m] = selectedPeriod.split('-');
                                const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
                                return `${y}-${m}-01 ~ ${y}-${m}-${String(lastDay).padStart(2, '0')} (기산일 기준, 조회 중…)`;
                              })()}
                        </span>
                        <MGButton
                          type="button"
                          variant="outline"
                          size="small"
                          className="salary-filter-block__period-link"
                          onClick={() => setIsConfigModalOpen(true)}
                          title="기산일 기준 기간입니다. 설정에서 변경할 수 있습니다."
                          aria-label="기산일 설정"
                          preventDoubleClick={false}
                        >
                          설정
                        </MGButton>
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
                        aria-label="상담사 선택"
                      >
                        <option value="">상담사 선택</option>
                        {consultants.map(c => (
                          <option key={c.id} value={c.id}>{toDisplayString(c.name)}</option>
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
                        aria-label="급여 지급일 선택"
                      >
                        {payDayOptions.map(opt => (
                          <option key={opt.codeValue} value={opt.codeValue}>{toDisplayString(opt.codeLabel)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                secondaryRow={(
                  <div className="salary-filter-block__run-calc">
                    <MGButton
                      variant="secondary"
                      size="small"
                      onClick={handleDataRefresh}
                      loading={silentListRefreshing}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      disabled={loading}
                      aria-label="데이터 새로고침"
                      className={buildErpMgButtonClassName({
                        variant: 'secondary',
                        size: 'sm',
                        loading: silentListRefreshing
                      })}
                    >
                      데이터 새로고침
                    </MGButton>
                    <MGButton
                      variant="primary"
                      size="medium"
                      onClick={executeSalaryCalculation}
                      disabled={
                        loading ||
                        silentListRefreshing ||
                        !selectedConsultant ||
                        !selectedPeriod ||
                        salaryProfiles.length === 0
                      }
                      loading={loading}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      className={buildErpMgButtonClassName({
                        variant: 'primary',
                        loading
                      })}
                    >
                      계산하기
                    </MGButton>
                  </div>
                )}
              />
            </section>

              {activeTab === TAB_PROFILES && (
                <section
                  id="salary-profile-panel"
                  role="tabpanel"
                  aria-labelledby="tab-profiles"
                  className="salary-profile-block"
                >
                  <div className="salary-profile-block__header mg-v2-mapping-list-block__header">
                    <div className="mg-v2-mapping-list-block__title">
                      <span className="salary-profile-block__accent" aria-hidden />
                      상담사 급여 프로필
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <ViewModeToggle
                        viewMode={profileViewMode}
                        onViewModeChange={setProfileViewMode}
                        className="mg-v2-mapping-list-block__toggle"
                        ariaLabel="목록 보기 전환"
                      />
                      <MGButton
                        variant="primary"
                        size="small"
                        onClick={openConsultantPicker}
                        className={buildErpMgButtonClassName({
                          variant: 'primary',
                          size: 'sm'
                        })}
                      >
                        새 프로필 생성
                      </MGButton>
                    </div>
                  </div>
                  {salaryProfiles.length === 0 && !loading && (
                    <div className="salary-profile-block__empty salary-profile-block__empty--no-profiles" data-state="empty">
                      <p className="salary-profile-block__empty-message salary-no-profiles-message">
                        급여 프로필이 없습니다. 급여 계산을 하기 위해서는 먼저 상담사별 급여 프로필을 작성해야 합니다.
                        위의 &quot;새 프로필 생성&quot; 버튼을 클릭하여 급여 프로필을 작성해주세요.
                      </p>
                      <MGButton
                        variant="primary"
                        size="medium"
                        onClick={openConsultantPicker}
                        className={buildErpMgButtonClassName({ variant: 'primary' })}
                      >
                        지금 프로필 작성하기
                      </MGButton>
                    </div>
                  )}
                  {loading ? (
                      <p className="salary-management__loading-text">데이터를 불러오는 중...</p>
                    ) : consultants.length === 0 ? (
                      <p className="salary-profile-block__empty-state">상담사 데이터가 없습니다.</p>
                    ) : salaryProfiles.length > 0 ? (
                      profileViewMode === 'list' ? (
                        <ListTableView
                          columns={[
                            { key: 'name', label: '이름' },
                            { key: 'email', label: '이메일' },
                            { key: 'grade', label: '등급' },
                            { key: 'baseSalary', label: '기본급' }
                          ]}
                          data={consultants.map((c) => {
                            const profile = salaryProfiles.find(p => p.consultantId === c.id);
                            return {
                              ...c,
                              grade: c.grade || '—',
                              baseSalary: profile ? (profile.baseSalary || 0) : null
                            };
                          })}
                          renderCell={(key, item) => {
                            if (key === 'baseSalary') return item.baseSalary != null ? formatCurrency(item.baseSalary) : '—';
                            const v = item[key];
                            return v != null ? String(v) : '—';
                          }}
                          onRowClick={(item) => openModal(item)}
                        />
                      ) : profileViewMode === 'smallCard' ? (
                        <SmallCardGrid>
                          {consultants.map((consultant) => {
                            const profile = salaryProfiles.find(p => p.consultantId === consultant.id);
                            return (
                              <ConsultantCard
                                key={consultant.id}
                                variant="salary-profile"
                                consultant={consultant}
                                grade={consultant.grade}
                                baseSalary={profile?.baseSalary}
                                formattedBaseSalary={profile != null ? formatCurrency(profile.baseSalary || 0) : '—'}
                                renderActions={(c) => (
                                  <MGButton
                                    variant="outline"
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleCreateProfile(c); }}
                                    className={buildErpMgButtonClassName({
                                      variant: 'outline',
                                      size: 'sm'
                                    })}
                                  >
                                    편집
                                  </MGButton>
                                )}
                                onCardClick={openModal}
                                compact
                                nameId={`profile-name-sm-${consultant.id}`}
                                className="mg-v2-ad-b0kla__card"
                              />
                            );
                          })}
                        </SmallCardGrid>
                      ) : (
                        <div className="mg-v2-ad-b0kla__admin-grid salary-profile-block__grid">
                          {consultants.map((consultant) => {
                            const profile = salaryProfiles.find(p => p.consultantId === consultant.id);
                            return (
                              <ConsultantCard
                                key={consultant.id}
                                variant="salary-profile"
                                consultant={consultant}
                                grade={consultant.grade}
                                baseSalary={profile?.baseSalary}
                                formattedBaseSalary={profile != null ? formatCurrency(profile.baseSalary || 0) : '—'}
                                renderActions={(c) => (
                                  <>
                                    <MGButton
                                      variant="secondary"
                                      size="small"
                                      onClick={() => openModal(c)}
                                      className={buildErpMgButtonClassName({
                                        variant: 'outline',
                                        size: 'sm'
                                      })}
                                    >
                                      프로필 조회
                                    </MGButton>
                                    <MGButton
                                      variant="outline"
                                      size="small"
                                      onClick={() => handleCreateProfile(c)}
                                      className={buildErpMgButtonClassName({
                                        variant: 'outline',
                                        size: 'sm'
                                      })}
                                    >
                                      편집
                                    </MGButton>
                                  </>
                                )}
                                className="mg-v2-ad-b0kla__card"
                              />
                            );
                          })}
                        </div>
                      )
                    ) : null}
                </section>
              )}

              {activeTab === TAB_CALC && (
                <section
                  id="salary-calc-panel"
                  role="tabpanel"
                  aria-labelledby="tab-calculations"
                  className="salary-calc-block"
                >
                  <div className="salary-calc-block__header">
                    <h2 className="mg-v2-ad-b0kla__section-title salary-calc-block__title">
                      <span className="salary-calc-block__accent" aria-hidden />
                      급여 계산
                    </h2>
                    {salaryProfiles.length === 0 && (
                      <MGButton
                        variant="outline"
                        size="small"
                        onClick={() => setActiveTab('profiles')}
                        className={buildErpMgButtonClassName({
                          variant: 'outline',
                          size: 'sm'
                        })}
                      >
                        지금 작성하기
                      </MGButton>
                    )}
                  </div>
                  <div className="salary-calc-block__preview">
                    {previewResult && (
                      <div className="mg-v2-ad-b0kla__card salary-calc-block__preview-card">
                        <h3 className="salary-calc-block__preview-title">계산 결과 미리보기</h3>
                        {previewResult.periodStart && previewResult.periodEnd && (
                          <p className="salary-calc-block__preview-period">
                            적용 기간: <SafeText>{previewResult.periodStart}</SafeText> ~ <SafeText>{previewResult.periodEnd}</SafeText> (기산일 기준)
                          </p>
                        )}
                        <div className="salary-calc-block__preview-summary">
                          <div className="salary-calc-block__preview-card-item">
                            <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">총 급여</span>
                            <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">{formatCurrency(previewResult.grossSalary)}</span>
                          </div>
                          <div className="salary-calc-block__preview-card-item">
                            <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">세금·공제</span>
                            <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">-{formatCurrency(previewResult.taxAmount)}</span>
                          </div>
                          <div className="salary-calc-block__preview-card-item salary-calc-block__preview-card-item--net">
                            <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">실지급액</span>
                            <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">{formatCurrency(previewResult.netSalary)}</span>
                          </div>
                        </div>
                        <dl className="salary-calc-block__preview-grid">
                          <dt className="salary-management__stat-label">상담사</dt>
                          <dd className="salary-management__stat-value"><SafeText>{previewResult.consultantName}</SafeText></dd>
                          <dt className="salary-management__stat-label">기간</dt>
                          <dd className="salary-management__stat-value"><SafeText>{previewResult.period}</SafeText></dd>
                          <dt className="salary-management__stat-label">상담 건수</dt>
                          <dd className="salary-management__stat-value">{toDisplayString(previewResult.consultationCount)}건</dd>
                        </dl>
                        <div className="mg-v2-card-actions salary-calc-block__preview-actions">
                          <MGButton
                            variant="primary"
                            size="medium"
                            onClick={async() => {
                              if (!previewResult.periodStart || !previewResult.periodEnd) {
                                showNotification('확정할 기간 정보가 없습니다.', 'warning');
                                return;
                              }
                              try {
                                setConfirmSalaryLoading(true);
                                setLoading(true);
                                const confirmParams = new URLSearchParams({
                                  consultantId: previewResult.consultantId,
                                  periodStart: previewResult.periodStart,
                                  periodEnd: previewResult.periodEnd
                                });
                                const res = await StandardizedApi.post(
                                  `${SALARY_API_ENDPOINTS.CONFIRM}?${confirmParams}`,
                                  {}
                                );
                                if (res && typeof res === 'object' && res.success === false) {
                                  showNotification(res?.message || '확정에 실패했습니다.', 'error');
                                } else {
                                  showNotification('급여 계산이 확정되었습니다.', 'success');
                                  setPreviewResult(null);
                                  if (previewResult.consultantId) loadSalaryCalculations(previewResult.consultantId);
                                }
                              } catch (err) {
                                showNotification('확정 처리 중 오류가 발생했습니다.', 'error');
                              } finally {
                                setConfirmSalaryLoading(false);
                                setLoading(false);
                              }
                            }}
                            disabled={loading || confirmSalaryLoading}
                            loading={confirmSalaryLoading}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              loading: confirmSalaryLoading
                            })}
                          >
                            확정
                          </MGButton>
                          <MGButton
                            variant="outline"
                            size="medium"
                            onClick={() => setPreviewResult(null)}
                            className={buildErpMgButtonClassName({ variant: 'outline' })}
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
                    <h3 className="mg-v2-ad-b0kla__section-title salary-calc-block__list-title">급여 계산 내역</h3>
                    {salaryCalculations.map(calculation => (
                      <article key={calculation.id} className="mg-v2-ad-b0kla__card salary-calc-block__card">
                        <div className="salary-calc-block__card-header">
                          <span><SafeText>{calculation.calculationPeriod}</SafeText></span>
                          <span className="mg-v2-status-badge mg-v2-badge--neutral" role="status">
                            <SafeText>{getStatusLabel(calculation.status)}</SafeText>
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
                            <span>{toDisplayString(calculation.consultationCount)}건</span>
                          </div>
                        </div>
                        <div className="mg-v2-card-actions salary-calc-block__actions">
                          <MGButton
                            variant="secondary"
                            size="small"
                            onClick={() => {
                              setSelectedCalculation(calculation);
                              setIsTaxDetailsOpen(true);
                            }}
                            className={buildErpMgButtonClassName({
                              variant: 'secondary',
                              size: 'sm'
                            })}
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
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              size: 'sm'
                            })}
                          >
                            출력
                          </MGButton>
                          <SalaryPrintComponent
                            salaryData={calculation}
                            consultantName={toDisplayString(consultants.find(c => c.id === calculation.consultantId)?.name, '알 수 없음')}
                            period={toDisplayString(calculation.calculationPeriod)}
                            includeTaxDetails
                            includeCalculationDetails
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === TAB_TAX && (
                <section
                  id="salary-tax-panel"
                  role="tabpanel"
                  aria-labelledby="tab-tax"
                  className="salary-tax-block"
                >
                  <div className="salary-tax-block__header">
                    <h2 className="mg-v2-ad-b0kla__section-title salary-tax-block__title">
                      <span className="salary-tax-block__accent" aria-hidden />
                      세금 통계
                    </h2>
                    <MGButton
                      variant="primary"
                      size="small"
                      onClick={() => loadTaxStatistics(selectedPeriod)}
                      loading={loading && activeTab === TAB_TAX}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      disabled={!selectedPeriod || loading || silentListRefreshing}
                      className={buildErpMgButtonClassName({
                        variant: 'primary',
                        size: 'sm',
                        loading: loading && activeTab === TAB_TAX
                      })}
                    >
                      세금 통계 조회
                    </MGButton>
                  </div>
                  {taxStatistics ? (
                    <div className="mg-v2-ad-b0kla__card salary-tax-block__card">
                      <h3 className="salary-tax-block__card-title">세금 통계 내역</h3>
                      <div className="salary-tax-block__card-body">
                        <div className="salary-management__detail-row">
                          <span>총 세금액</span>
                          <span className="salary-tax-block__value">{formatCurrency(taxStatistics.totalTaxAmount || 0)}</span>
                        </div>
                        <div className="salary-management__detail-row">
                          <span>세금 건수</span>
                          <span>{toDisplayString(taxStatistics.taxCount ?? taxStatistics.totalCalculations ?? 0)}건</span>
                        </div>
                        {TAX_BREAKDOWN_ORDER.map((key) => {
                          const breakdown = taxStatistics.breakdown || {};
                          const amount = breakdown[key];
                          const label = TAX_BREAKDOWN_LABELS[key] ?? key;
                          const display = amount != null && Number(amount) !== 0 ? `-${formatCurrency(Number(amount))}` : '—';
                          return (
                            <div key={key} className="salary-management__detail-row">
                              <span><SafeText>{label}</SafeText></span>
                              <span><SafeText>{display}</SafeText></span>
                            </div>
                          );
                        })}
                        <div className="salary-management__detail-row salary-management__detail-row--total">
                          <span>총 공제액</span>
                          <span>-{formatCurrency(taxStatistics.totalTaxAmount || 0)}</span>
                        </div>
                      </div>
                      <div className="mg-v2-card-actions salary-tax-block__actions">
                        <MGButton
                          variant="secondary"
                          size="small"
                          className={buildErpMgButtonClassName({
                            variant: 'secondary',
                            size: 'sm'
                          })}
                        >
                          세금 상세 내역 보기
                        </MGButton>
                        <MGButton
                          variant="primary"
                          size="small"
                          className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'sm'
                          })}
                        >
                          출력
                        </MGButton>
                      </div>
                    </div>
                  ) : (
                    <div className="salary-tax-block__empty" data-state="empty">
                      <p>세금 통계를 조회하려면 기간을 선택한 뒤 &quot;세금 통계 조회&quot; 버튼을 클릭하세요.</p>
                    </div>
                  )}
                </section>
              )}
            </>
            )}
            </div>
            </ErpPageShell>
          </ContentArea>

      {showLoadingOverlay && (
        <div className="salary-management-loading-overlay" aria-hidden>
          <UnifiedLoading type="inline" text="로딩 중..." />
        </div>
      )}

      <UnifiedModal
        isOpen={isConsultantPickerOpen}
        onClose={closeConsultantPicker}
        title="상담사 선택"
        subtitle="급여 프로필을 작성할 상담사를 선택하세요."
        size="small"
        backdropClick={true}
        showCloseButton={true}
        className="mg-v2-ad-b0kla"
      >
        {consultants.length === 0 ? (
          <p className="salary-profile-block__empty-state mg-v2-mb-md">상담사가 없습니다.</p>
        ) : (
          <ul className="mg-v2-list-container">
            {consultants.map((consultant) => (
              <li key={consultant.id}>
                <MGButton
                  type="button"
                  variant="outline"
                  fullWidth
                  className="mg-v2-list-item mg-v2-list-item--clickable salary-consultant-picker-item"
                  onClick={() => handleConsultantPickForProfile(consultant)}
                  preventDoubleClick={false}
                >
                  <span className="mg-v2-list-item-title"><SafeText>{consultant.name}</SafeText></span>
                  {consultant.email && (
                    <span className="mg-v2-list-item-subtitle"><SafeText>{consultant.email}</SafeText></span>
                  )}
                </MGButton>
              </li>
            ))}
          </ul>
        )}
      </UnifiedModal>
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
