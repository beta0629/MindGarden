/**
 * 급여 관리·급여 프로필 페이지 (새 레이아웃 + B0KlA·아토믹 디자인)
 * 라우트: /erp/salary
 * ContentHeader + ContentArea, salary-*-block BEM 구조
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../dashboard-v2/content';
import StandardizedApi from '../../utils/standardizedApi';
import {
  SALARY_ACTION_LABELS,
  SALARY_API_ENDPOINTS,
  SALARY_MESSAGES,
  SALARY_PAY_DAY_FALLBACK_OPTIONS,
  SALARY_PREVIEW_SPECIAL_SUPPORT_LABEL,
  SALARY_PREVIEW_CONSULTATION_FEE_LABEL,
  SALARY_PREVIEW_PRE_TAX_TOTAL_LABEL,
  SALARY_CALC_DETAIL_TAX_DEDUCTIONS_LABEL,
  SALARY_CALC_EMPTY_FOR_PERIOD_MESSAGE,
  SALARY_CALC_EMPTY_NO_SELECTION_MESSAGE,
  SALARY_STATUS,
  SALARY_LATE_NOTES_LABELS,
  SALARY_LATE_NOTES_MESSAGES,
  SALARY_LATE_NOTES_CSS,
  SALARY_CALC_SILENT_REFETCH_INTERVAL_MS,
  TAX_BREAKDOWN_ORDER,
  TAX_BREAKDOWN_LABELS
} from '../../constants/salaryConstants';
import {
  buildSalaryCalculationComponentRows,
  normalizeSalaryCalculationStatus,
  isSalaryAdjustmentCalculation,
  orderSalaryCalculationsPrimaryThenAdjustment,
  toSalaryLateNotesErrorMessage
} from '../../utils/salaryCalculationDisplay';
import { getAllConsultantsWithStats } from '../../utils/consultantHelper';
import { getCommonCodes } from '../../utils/commonCodeApi';
import { showNotification } from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';
import ConsultantProfileModal from './ConsultantProfileModal';
import SalaryProfileFormModal from './SalaryProfileFormModal';
import TaxDetailsModal from '../common/TaxDetailsModal';
import SalaryExportModal from '../common/SalaryExportModal';
import SalaryPrintComponent from '../common/SalaryPrintComponent';
import SalaryConfigModal from './SalaryConfigModal';
import MGButton from '../common/MGButton';
import SegmentedTabs from '../common/SegmentedTabs';
import ConsultantCard from '../ui/Card/ConsultantCard';
import { ViewModeToggle, SmallCardGrid, ListTableView } from '../common';
import { getStatusLabel } from '../../utils/colorUtils';
import { toDisplayString, toErrorMessage } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import { useConfirm } from '../../hooks/useConfirm';
import './ErpCommon.css';
import './SalaryManagement.css';
import '../admin/mapping-management/organisms/MappingListBlock.css';
import ErpPageShell from './shell/ErpPageShell';
import { ErpFilterToolbar, useErpSilentRefresh } from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import { useTranslation } from 'react-i18next';

const TAB_CALC = 'calculations';
const TAB_PROFILES = 'profiles';
const TAB_TAX = 'tax';

/**
 * pre-confirm-warning API 응답을 화면용 숫자로 정규화.
 * @param {unknown} response
 * @returns {object|null}
 */
function parsePreConfirmWarningPayload(response) {
  if (response == null || typeof response !== 'object') {
    return null;
  }
  const data = response.data != null && typeof response.data === 'object'
    ? response.data
    : response;
  if (data.success === false) {
    return null;
  }
  const toCount = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    notCompletedCount: toCount(data.notCompletedCount),
    missingRecordCount: toCount(data.missingRecordCount),
    currentCompletedCount: toCount(data.currentCompletedCount),
    storedCompletedCount: toCount(data.storedCompletedCount),
    extraCompletedCount: toCount(data.extraCompletedCount),
    primaryCalculationId: data.primaryCalculationId ?? null,
    primaryStatus: data.primaryStatus != null ? String(data.primaryStatus) : null
  };
}

const SalaryManagement = () => {
  const { t } = useTranslation();
  const [confirm, ConfirmModal] = useConfirm();
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
  /** 급여 승인 API 진행 중인 calculation.id (동시 요청·중복 클릭 방지). */
  const [approvingCalculationId, setApprovingCalculationId] = useState(null);
  /** 최초 상담사 목록 페치 1회 완료 여부(초기 인라인 로딩 vs 이후 로딩 오버레이 구분). */
  const [consultantsInitialFetchDone, setConsultantsInitialFetchDone] = useState(false);
  /** 확정 전 미리보기 경고 (완료 아닌 회기 / 일지 미작성). */
  const [preConfirmWarning, setPreConfirmWarning] = useState(null);
  /** 본정산 id → 빠진 회기(delta) 등. */
  const [lateSessionByPrimaryId, setLateSessionByPrimaryId] = useState({});
  const [recalcLoadingId, setRecalcLoadingId] = useState(null);
  const [adjustmentLoadingId, setAdjustmentLoadingId] = useState(null);
  const refreshCalculationsListRef = useRef(null);

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

  /**
   * YYYY-MM 형식의 period에서 기산일 기준 {periodStart, periodEnd} 산출.
   * 백엔드 /calculation-period(SALARY_BASE_DATE.MONTHLY_BASE_DAY)만 사용.
   * 실패·미응답 시 calendar month silent fallback 금지 — null 반환.
   * @param {string} period YYYY-MM
   * @returns {Promise<{periodStart: string, periodEnd: string} | null>}
   */
  const resolvePeriodRange = async(period) => {
    if (!period) return null;
    const [y, m] = period.split('-');
    const yearN = parseInt(y, 10);
    const monthN = parseInt(m, 10);
    if (!Number.isFinite(yearN) || !Number.isFinite(monthN)) {
      return null;
    }
    try {
      const response = await StandardizedApi.get(
        SALARY_API_ENDPOINTS.CALCULATION_PERIOD,
        { year: yearN, month: monthN }
      );
      const data = (response && (response.data || response)) || null;
      if (data && data.periodStart && data.periodEnd) {
        return {
          periodStart: data.periodStart,
          periodEnd: data.periodEnd
        };
      }
    } catch (e) {
      console.error('급여 계산 기간(calculation-period) 조회 실패:', e);
    }
    return null;
  };

  /**
   * 월 단위 확정 이상 급여 계산 자동 조회. (사용자 보고: "해당하는 달로 가면 자동으로 확정내역이 보여야해")
   * GET /api/v1/admin/salary/calculations/period?startDate&endDate — 확정(CALCULATED) 이상만 반환.
   */
  const loadSalaryCalculationsByPeriod = async(periodStart, periodEnd, options = {}) => {
    const silent = options.silent === true;
    if (!periodStart || !periodEnd) return;
    try {
      if (!silent) setLoading(true);
      const response = await StandardizedApi.get(
        SALARY_API_ENDPOINTS.CALCULATIONS_BY_PERIOD,
        { startDate: periodStart, endDate: periodEnd }
      );
      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && response.success && Array.isArray(response.data)) {
        list = response.data;
      } else if (response && Array.isArray(response.data)) {
        list = response.data;
      }
      setSalaryCalculations(list);
      await refreshLateSessionWarnings(list);
    } catch (error) {
      console.error('월 단위 확정 급여 내역 로드 실패:', error);
      setSalaryCalculations([]);
      setLateSessionByPrimaryId({});
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /**
   * 본정산 행별 빠진 회기(delta) 조회.
   * @param {Array<object>} list
   */
  const refreshLateSessionWarnings = async(list) => {
    const primaries = (Array.isArray(list) ? list : []).filter(
      (calc) => !isSalaryAdjustmentCalculation(calc)
    );
    if (primaries.length === 0) {
      setLateSessionByPrimaryId({});
      return;
    }
    const uniqueByKey = new Map();
    primaries.forEach((calc) => {
      const consultantId = calc?.consultantId;
      const periodStart = calc?.calculationPeriodStart;
      const periodEnd = calc?.calculationPeriodEnd;
      if (consultantId == null || !periodStart || !periodEnd) {
        return;
      }
      const key = `${consultantId}|${periodStart}|${periodEnd}`;
      if (!uniqueByKey.has(key)) {
        uniqueByKey.set(key, {
          consultantId,
          periodStart,
          periodEnd,
          fallbackPrimaryId: calc.id
        });
      }
    });
    const entries = await Promise.all(
      [...uniqueByKey.values()].map(async(query) => {
        try {
          const response = await StandardizedApi.get(
            SALARY_API_ENDPOINTS.PRE_CONFIRM_WARNING,
            {
              consultantId: query.consultantId,
              periodStart: query.periodStart,
              periodEnd: query.periodEnd
            }
          );
          const parsed = parsePreConfirmWarningPayload(response);
          if (!parsed) {
            return null;
          }
          const primaryId = parsed.primaryCalculationId != null
            ? parsed.primaryCalculationId
            : query.fallbackPrimaryId;
          return [primaryId, parsed];
        } catch (error) {
          console.error('빠진 회기 경고 조회 실패:', error);
          return null;
        }
      })
    );
    const nextMap = {};
    entries.forEach((entry) => {
      if (entry) {
        nextMap[entry[0]] = entry[1];
      }
    });
    setLateSessionByPrimaryId(nextMap);
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
          professionalProviderTypeCode: c.professionalProviderTypeCode,
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
      const list = await getCommonCodes('SALARY_PAY_DAY');
      const normalized = Array.isArray(list) ? list : [];
      setPayDayOptions(normalized.length > 0 ? normalized : SALARY_PAY_DAY_FALLBACK_OPTIONS);
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
        const range = await resolvePeriodRange(selectedPeriod);
        if (!range) {
          showNotification('급여 미리보기 기간을 산출하지 못했습니다. calculation-period API를 확인해주세요.', 'error');
          setLoading(false);
          return;
        }
        periodStart = range.periodStart;
        periodEnd = range.periodEnd;
        setCalculationPeriodDisplay({ periodStart, periodEnd });
      }
      // selectedPayDay는 미리보기 API에 미전달. 기간은 기산일(calculation-period)만 사용.
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
        const grossSalary = toSalaryNumber(data?.grossSalary);
        const specialSupportAmount = toSalaryNumber(data?.specialSupportAmount);
        const consultationGrossFromApi = data?.consultationGrossSalary;
        const consultationGrossSalary =
          consultationGrossFromApi != null && consultationGrossFromApi !== ''
            ? toSalaryNumber(consultationGrossFromApi)
            : Math.max(0, grossSalary - specialSupportAmount);
        const taxableGrossSalary =
          data?.taxableGrossSalary != null && data?.taxableGrossSalary !== ''
            ? toSalaryNumber(data.taxableGrossSalary)
            : grossSalary;
        setPreviewResult({
          consultantId: selectedConsultant.id,
          consultantName: selectedConsultant.name,
          period: selectedPeriod,
          periodStart,
          periodEnd,
          grossSalary,
          netSalary: data?.netSalary ?? 0,
          taxAmount: data?.taxAmount ?? 0,
          consultationCount: data?.consultationCount ?? 0,
          specialSupportAmount,
          consultationGrossSalary,
          taxableGrossSalary,
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
      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && response.success) {
        list = response.data ?? [];
      } else if (response && response?.data) {
        list = Array.isArray(response.data) ? response.data : [];
      }
      setSalaryCalculations(list);
      await refreshLateSessionWarnings(list);
    } catch (error) {
      console.error('급여 계산 내역 로드 실패:', error);
      showNotification('급여 계산 내역을 불러오는데 실패했습니다.', 'error');
      setLateSessionByPrimaryId({});
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /**
   * 목록 갱신: 상담사 선택 시 상담사 기준, 아니면 기간 기준.
   * @param {{ silent?: boolean }} [options]
   */
  const refreshCalculationsList = async(options = {}) => {
    const silent = options.silent === true;
    if (selectedConsultant?.id != null) {
      await loadSalaryCalculations(selectedConsultant.id, { silent });
      return;
    }
    if (calculationPeriodDisplay?.periodStart && calculationPeriodDisplay?.periodEnd) {
      await loadSalaryCalculationsByPeriod(
        calculationPeriodDisplay.periodStart,
        calculationPeriodDisplay.periodEnd,
        { silent }
      );
    }
  };
  refreshCalculationsListRef.current = refreshCalculationsList;

  /**
   * 계산완료(CALCULATED) 건만 승인 API 호출 후 목록 갱신.
   * @param {{ id: number|string, status?: string, consultantId?: number|string }} calculation
   */
  const handleApproveSalary = async(calculation) => {
    if (calculation?.id == null) {
      return;
    }
    if (normalizeSalaryCalculationStatus(calculation.status) !== SALARY_STATUS.CALCULATED) {
      return;
    }
    try {
      setApprovingCalculationId(calculation.id);
      const res = await StandardizedApi.post(
        `${SALARY_API_ENDPOINTS.APPROVE}/${calculation.id}`,
        {}
      );
      if (res && typeof res === 'object' && res.success === false) {
        showNotification(
          toErrorMessage(res?.message, SALARY_MESSAGES.APPROVAL_ERROR),
          'error'
        );
      } else {
        showNotification(SALARY_MESSAGES.APPROVAL_SUCCESS, 'success');
        await refreshCalculationsList({ silent: true });
      }
    } catch (err) {
      console.error('급여 승인 API 오류:', err);
      showNotification(
        toErrorMessage(err, SALARY_MESSAGES.APPROVAL_ERROR),
        'error'
      );
    } finally {
      setApprovingCalculationId(null);
    }
  };

  /**
   * 미지급 본정산 제자리 다시 계산 (수동 fallback).
   * @param {object} calculation
   * @param {number} extraCompletedCount
   */
  const handleRecalcSalary = async(calculation, extraCompletedCount) => {
    if (calculation?.id == null || extraCompletedCount <= 0) {
      return;
    }
    const status = normalizeSalaryCalculationStatus(calculation.status);
    const confirmMessage = status === SALARY_STATUS.APPROVED
      ? SALARY_LATE_NOTES_MESSAGES.RECALC_APPROVED_CONFIRM
      : SALARY_LATE_NOTES_MESSAGES.RECALC_CONFIRM;
    const confirmed = await confirm({ message: confirmMessage, variant: 'warning' });
    if (!confirmed) {
      return;
    }
    try {
      setRecalcLoadingId(calculation.id);
      const res = await StandardizedApi.post(
        SALARY_API_ENDPOINTS.getRecalcUrl(calculation.id),
        {}
      );
      if (res && typeof res === 'object' && res.success === false) {
        showNotification(
          toSalaryLateNotesErrorMessage(res?.message, SALARY_LATE_NOTES_MESSAGES.RECALC_ERROR),
          'error'
        );
      } else {
        showNotification(SALARY_LATE_NOTES_MESSAGES.RECALC_SUCCESS, 'success');
        await refreshCalculationsList({ silent: true });
      }
    } catch (err) {
      console.error('다시 계산 API 오류:', err);
      showNotification(
        toSalaryLateNotesErrorMessage(err, SALARY_LATE_NOTES_MESSAGES.RECALC_ERROR),
        'error'
      );
    } finally {
      setRecalcLoadingId(null);
    }
  };

  /**
   * 지급완료 본정산 기준 빠진 회기 추가 정산 (수동 fallback).
   * @param {object} calculation
   * @param {number} extraCompletedCount
   */
  const handleCreateAdjustment = async(calculation, extraCompletedCount) => {
    if (calculation?.id == null || extraCompletedCount <= 0) {
      return;
    }
    const confirmMessage = `${SALARY_LATE_NOTES_MESSAGES.ADJUSTMENT_CONFIRM_PREFIX} ${extraCompletedCount}${SALARY_LATE_NOTES_MESSAGES.ADJUSTMENT_CONFIRM_SUFFIX}`;
    const confirmed = await confirm({ message: confirmMessage, variant: 'info' });
    if (!confirmed) {
      return;
    }
    try {
      setAdjustmentLoadingId(calculation.id);
      const res = await StandardizedApi.post(
        SALARY_API_ENDPOINTS.getAdjustmentUrl(calculation.id),
        {}
      );
      if (res && typeof res === 'object' && res.success === false) {
        showNotification(
          toSalaryLateNotesErrorMessage(res?.message, SALARY_LATE_NOTES_MESSAGES.ADJUSTMENT_ERROR),
          'error'
        );
      } else {
        showNotification(SALARY_LATE_NOTES_MESSAGES.ADJUSTMENT_SUCCESS, 'success');
        await refreshCalculationsList({ silent: true });
      }
    } catch (err) {
      console.error('추가 정산 API 오류:', err);
      showNotification(
        toSalaryLateNotesErrorMessage(err, SALARY_LATE_NOTES_MESSAGES.ADJUSTMENT_ERROR),
        'error'
      );
    } finally {
      setAdjustmentLoadingId(null);
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
      const params = { period };
      if (selectedConsultant?.id != null) {
        params.consultantId = selectedConsultant.id;
      }
      const response = await StandardizedApi.get(SALARY_API_ENDPOINTS.TAX_STATISTICS, params);
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
        if (refreshCalculationsListRef.current) {
          await refreshCalculationsListRef.current({ silent: true });
        }
      } else if (activeTab === TAB_TAX) {
        await loadTaxStatistics(selectedPeriod, silent);
      }
    });
  }, [activeTab, selectedPeriod, runSilentListRefresh]);

  useEffect(() => {
    loadConsultants();
    loadSalaryProfiles();
    loadPayDayOptions();
  }, []);

  /**
   * 페이지 진입 시 현재 월을 selectedPeriod 기본값으로 설정.
   * 이후 selectedPeriod 변경 useEffect가 트리거되어 해당 월 확정 내역이 자동 표시된다.
   */
  useEffect(() => {
    if (!selectedPeriod) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setSelectedPeriod(`${y}-${m}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * selectedPeriod 변경 시: 기산일 기준 기간 산출 → 표시 + 월 확정 내역 자동 조회.
   * 사용자가 매번 미리보기를 다시 누르지 않아도 해당 달 확정 내역이 보이도록 한다.
   */
  useEffect(() => {
    let cancelled = false;
    (async() => {
      if (!selectedPeriod) {
        setCalculationPeriodDisplay(null);
        setSalaryCalculations([]);
        setLateSessionByPrimaryId({});
        return;
      }
      const range = await resolvePeriodRange(selectedPeriod);
      if (cancelled) return;
      if (!range) {
        setCalculationPeriodDisplay(null);
        setSalaryCalculations([]);
        showNotification('급여 계산 기간을 가져오지 못했습니다. 기산일(calculation-period) 설정을 확인해주세요.', 'error');
        return;
      }
      setCalculationPeriodDisplay({
        periodStart: range.periodStart,
        periodEnd: range.periodEnd
      });
      await loadSalaryCalculationsByPeriod(range.periodStart, range.periodEnd, { silent: true });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  /**
   * calc 탭: 창 focus / 탭 가시성 복귀 시 period 계산 목록 silent 재조회.
   * 자동 다시 계산·추가 정산 결과가 새로고침 없이 목록 금액에 반영되도록 한다.
   * 탭이 보일 때만 짧은 interval(보조). focus 재조회가 핵심.
   */
  useEffect(() => {
    if (activeTab !== TAB_CALC) {
      return undefined;
    }

    const runSilentPeriodRefetch = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (refreshCalculationsListRef.current) {
        void refreshCalculationsListRef.current({ silent: true });
      }
    };

    const onWindowFocus = () => {
      runSilentPeriodRefetch();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runSilentPeriodRefetch();
      }
    };

    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = window.setInterval(
      runSilentPeriodRefetch,
      SALARY_CALC_SILENT_REFETCH_INTERVAL_MS
    );

    return () => {
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [activeTab]);

  /** 미리보기 확정 전: 완료 아닌 회기·일지 미작성 건수 (n>0만 배너). */
  useEffect(() => {
    let cancelled = false;
    (async() => {
      if (!previewResult?.consultantId || !previewResult?.periodStart || !previewResult?.periodEnd) {
        setPreConfirmWarning(null);
        return;
      }
      try {
        const response = await StandardizedApi.get(
          SALARY_API_ENDPOINTS.PRE_CONFIRM_WARNING,
          {
            consultantId: previewResult.consultantId,
            periodStart: previewResult.periodStart,
            periodEnd: previewResult.periodEnd
          }
        );
        if (cancelled) {
          return;
        }
        setPreConfirmWarning(parsePreConfirmWarningPayload(response));
      } catch (error) {
        console.error('확정 전 경고 조회 실패:', error);
        if (!cancelled) {
          setPreConfirmWarning(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewResult]);

  /** API BigDecimal·문자열 대응; 미리보기·내역 금액 표시 공통 */
  const toSalaryNumber = (value) => {
    if (value == null || value === '') {
      return 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(toSalaryNumber(amount));
  };

  const orderedSalaryCalculations = useMemo(
    () => orderSalaryCalculationsPrimaryThenAdjustment(salaryCalculations),
    [salaryCalculations]
  );

  const showPreConfirmWarningBanner = Boolean(
    preConfirmWarning
    && (preConfirmWarning.notCompletedCount > 0 || preConfirmWarning.missingRecordCount > 0)
  );

  /** 최초 로드 중·상담사 목록 없음: 본문은 인라인 로더만(헤더·탭은 유지). 이후 동일 조건은 세금 조회 등과 겹치지 않도록 fetch 완료 후에는 사용하지 않음. */
  const showInitialInlineLoad =
    loading && consultants.length === 0 && !consultantsInitialFetchDone;
  /** 초기 인라인과 중복되지 않는 전역 로딩 오버레이(계산·탭 데이터 로드 등). silent 새로고침은 loading을 켜지 않음. */
  const showLoadingOverlay = loading && !showInitialInlineLoad;

  const previewFreelanceSpecialSupportBreakdown =
    previewResult != null
    && toSalaryNumber(previewResult.specialSupportAmount) > 0;

  return (
    <AdminCommonLayout title={t('erp:SalaryManagement.t_5abac593')}>
      <ContentArea className="mg-v2-content-area" ariaLabel="급여·세금 관리 콘텐츠">
            <ErpPageShell
              headerSlot={
                <ContentHeader
                  title={t('erp:SalaryManagement.t_9b3c0eb3')}
                  subtitle="상담사 급여 및 세금 계산·통계"
                  actions={
                    <>
                      <MGButton
                        variant="outline"
                        size="medium"
                        onClick={() => setIsConfigModalOpen(true)}
                        aria-label={t('erp:SalaryManagement.t_a1802bde')}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        className={buildErpMgButtonClassName({
                          variant: 'outline',
                          size: 'md',
                          className: 'salary-management__header-btn'
                        })}
                      >
                        <span className="salary-management__header-btn-text">{t('erp:SalaryManagement.t_583cbabc')}</span>
                      </MGButton>
                      <MGButton
                        variant="primary"
                        size="medium"
                        onClick={() => setActiveTabAndUrl(TAB_CALC)}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        className={buildErpMgButtonClassName({
                          variant: 'primary',
                          size: 'md',
                          className: 'salary-management__header-btn'
                        })}
                        aria-label={t('erp:SalaryManagement.t_e9a9e95d')}
                      >
                        <span className="salary-management__header-btn-text">{t('erp:SalaryManagement.t_e9a9e95d')}</span>
                      </MGButton>
                    </>
                  }
                />
              }
              tabsSlot={
                <div className="mg-v2-ad-b0kla__section salary-management__tabs-wrap">
                  <SegmentedTabs
                    ariaLabel={t('erp:SalaryManagement.t_eeb28eec')}
                    items={[
                      { value: TAB_PROFILES, label: t('erp:SalaryManagement.t_053a17e1'), ariaControls: 'salary-profile-panel', id: 'tab-profiles' },
                      { value: TAB_CALC, label: t('erp:SalaryManagement.t_b2e25782'), ariaControls: 'salary-calc-panel', id: 'tab-calculations' },
                      { value: TAB_TAX, label: t('erp:SalaryManagement.t_780e38c6'), ariaControls: 'salary-tax-panel', id: 'tab-tax' }
                    ]}
                    activeValue={activeTab}
                    onChange={setActiveTabAndUrl}
                    size="sm"
                  />
                </div>
              }
              mainAriaLabel="급여·세금 관리 콘텐츠"
            >
            <div className="mg-v2-ad-b0kla salary-management__main">
            {showInitialInlineLoad ? (
              <div className="salary-management__initial-load" role="status" aria-live="polite" aria-busy="true">
                <UnifiedLoading type="inline" text={t('erp:SalaryManagement.t_ef1822ad')} />
              </div>
            ) : (
              <>
            {/* 블록 1: 계산 대상 선택 */}
            <section className="mg-v2-ad-b0kla__card salary-filter-block" aria-labelledby="salary-filter-title">
              <h2 id="salary-filter-title" className="mg-v2-ad-b0kla__section-title salary-filter-block__title">
                <span className="salary-filter-block__accent" aria-hidden />
                {t('erp:SalaryManagement.t_2e7b5ca6')}
              </h2>
              <div className="mg-w-full">
              <ErpFilterToolbar
                ariaLabel="급여 계산 대상 선택"
                primaryRow={(
                  <div className="salary-filter-block__group">
                    <div className="salary-filter-block__field">
                      <label htmlFor="salary-period" className="mg-v2-form-label">{t('erp:SalaryManagement.t_2622331e')}</label>
                      <select
                        id="salary-period"
                        value={selectedPeriod}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPeriod(val);
                          // calculationPeriodDisplay·salaryCalculations 갱신은 selectedPeriod useEffect가 처리.
                          if (val && activeTab === TAB_TAX) {
                            loadTaxStatistics(val);
                          }
                        }}
                        className="mg-v2-select"
                        aria-label={t('erp:SalaryManagement.t_49470825')}
                      >
                        <option value="">{t('erp:SalaryManagement.t_49470825')}</option>
                        {periodOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{toDisplayString(opt.label)}</option>
                        ))}
                      </select>
                    </div>
                    {selectedPeriod && (
                      <div className="salary-filter-block__field salary-filter-block__period-display" role="status">
                        <span className="mg-v2-form-label">{t('erp:SalaryManagement.t_e5602930')}</span>
                        <span className="salary-filter-block__period-text">
                          {calculationPeriodDisplay
                            ? `${calculationPeriodDisplay.periodStart} ~ ${calculationPeriodDisplay.periodEnd} (기산일 기준)`
                            : '기산일 기간 조회 중… (calculation-period)'}
                        </span>
                        <MGButton
                          type="button"
                          variant="outline"
                          size="small"
                          className={buildErpMgButtonClassName({
                            variant: 'outline',
                            size: 'sm',
                            className: 'salary-filter-block__period-link'
                          })}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          onClick={() => setIsConfigModalOpen(true)}
                          title={t('erp:SalaryManagement.t_9bf8207c')}
                          aria-label={t('erp:SalaryManagement.t_583cbabc')}
                          preventDoubleClick={false}
                        >
                          {t('erp:SalaryManagement.t_c14a567e')}
                        </MGButton>
                      </div>
                    )}
                    <div className="salary-filter-block__field">
                      <label htmlFor="salary-consultant" className="mg-v2-form-label">{t('common.labels.consultant')}</label>
                      <select
                        id="salary-consultant"
                        value={selectedConsultant?.id || ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const consultant = raw
                            ? consultants.find(c => c.id === parseInt(raw, 10))
                            : null;
                          setSelectedConsultant(consultant || null);
                          if (consultant) loadSalaryCalculations(consultant.id);
                          if (activeTab === TAB_TAX && selectedPeriod) {
                            loadTaxStatistics(selectedPeriod, { silent: true });
                          }
                        }}
                        className="mg-v2-select"
                        aria-label={t('erp:SalaryManagement.t_fc554626')}
                      >
                        <option value="">{t('erp:SalaryManagement.t_fc554626')}</option>
                        {consultants.map(c => (
                          <option key={c.id} value={c.id}>{toDisplayString(c.name)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="salary-filter-block__field">
                      <label htmlFor="salary-payday" className="mg-v2-form-label">{t('erp:SalaryManagement.t_41604b0b')}</label>
                      <select
                        id="salary-payday"
                        value={selectedPayDay}
                        onChange={(e) => setSelectedPayDay(e.target.value)}
                        className="mg-v2-select"
                        aria-label={t('erp:SalaryManagement.t_e37bade0')}
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
                      size="medium"
                      onClick={handleDataRefresh}
                      loading={silentListRefreshing}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      disabled={loading}
                      aria-label={t('erp:SalaryManagement.t_8edcbb09')}
                      className={buildErpMgButtonClassName({
                        variant: 'secondary',
                        size: 'md',
                        loading: silentListRefreshing
                      })}
                    >
                      {t('erp:SalaryManagement.t_8edcbb09')}
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
                        size: 'md',
                        loading
                      })}
                    >
                      {t('erp:SalaryManagement.t_dd64b2ef')}
                    </MGButton>
                  </div>
                )}
              />
              </div>
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
                      {t('erp:SalaryManagement.t_ea9daadc')}
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
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        className={buildErpMgButtonClassName({
                          variant: 'primary',
                          size: 'sm'
                        })}
                      >
                        {t('erp:SalaryManagement.t_52ede1a8')}
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
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        className={buildErpMgButtonClassName({ variant: 'primary' })}
                      >
                        {t('erp:SalaryManagement.t_9ec66b62')}
                      </MGButton>
                    </div>
                  )}
                  {loading ? (
                      <div className="salary-management__loading-text-wrap" role="status" aria-live="polite" aria-busy="true">
                        <p className="salary-management__loading-text">{t('common.messages.loadingData')}</p>
                      </div>
                    ) : consultants.length === 0 ? (
                      <p className="salary-profile-block__empty-state">{t('erp:SalaryManagement.t_fcdc229f')}</p>
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
                                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                    className={buildErpMgButtonClassName({
                                      variant: 'outline',
                                      size: 'sm'
                                    })}
                                  >
                                    {t('erp:SalaryManagement.t_d482e14b')}
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
                                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                      className={buildErpMgButtonClassName({
                                        variant: 'outline',
                                        size: 'sm'
                                      })}
                                    >
                                      {t('erp:SalaryManagement.t_5b384d76')}
                                    </MGButton>
                                    <MGButton
                                      variant="outline"
                                      size="small"
                                      onClick={() => handleCreateProfile(c)}
                                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                      className={buildErpMgButtonClassName({
                                        variant: 'outline',
                                        size: 'sm'
                                      })}
                                    >
                                      {t('erp:SalaryManagement.t_d482e14b')}
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
                      {t('erp:SalaryManagement.t_b2e25782')}
                    </h2>
                    {salaryProfiles.length === 0 && (
                      <MGButton
                        variant="outline"
                        size="small"
                        onClick={() => setActiveTab('profiles')}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        className={buildErpMgButtonClassName({
                          variant: 'outline',
                          size: 'sm'
                        })}
                      >
                        {t('erp:SalaryManagement.t_79536663')}
                      </MGButton>
                    )}
                  </div>
                  <div className="salary-calc-block__preview">
                    {previewResult && (
                      <div className="mg-v2-ad-b0kla__card salary-calc-block__preview-card">
                        <h3 className="salary-calc-block__preview-title">{t('erp:SalaryManagement.t_2e4c953b')}</h3>
                        {showPreConfirmWarningBanner && (
                          <div
                            className={SALARY_LATE_NOTES_CSS.PRE_CONFIRM_WARNING}
                            role="status"
                            aria-live="polite"
                          >
                            {preConfirmWarning.notCompletedCount > 0 && (
                              <p className={SALARY_LATE_NOTES_CSS.PRE_CONFIRM_WARNING_ITEM}>
                                {SALARY_LATE_NOTES_LABELS.PRE_CONFIRM_NOT_COMPLETED_PREFIX}
                                {' '}
                                {preConfirmWarning.notCompletedCount}
                                {SALARY_LATE_NOTES_LABELS.COUNT_SUFFIX}
                              </p>
                            )}
                            {preConfirmWarning.missingRecordCount > 0 && (
                              <p className={SALARY_LATE_NOTES_CSS.PRE_CONFIRM_WARNING_ITEM}>
                                {SALARY_LATE_NOTES_LABELS.PRE_CONFIRM_MISSING_RECORD_PREFIX}
                                {' '}
                                {preConfirmWarning.missingRecordCount}
                                {SALARY_LATE_NOTES_LABELS.COUNT_SUFFIX}
                              </p>
                            )}
                          </div>
                        )}
                        {previewResult.periodStart && previewResult.periodEnd && (
                          <p className="salary-calc-block__preview-period">
                            {t('erp:SalaryManagement.t_2b7495ab')} <SafeText>{previewResult.periodStart}</SafeText> ~ <SafeText>{previewResult.periodEnd}</SafeText> {t('erp:SalaryManagement.t_f4ae3170')}
                          </p>
                        )}
                        <div className="salary-calc-block__preview-summary">
                          {previewFreelanceSpecialSupportBreakdown ? (
                            <>
                              <div className="salary-calc-block__preview-card-item">
                                <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">
                                  {SALARY_PREVIEW_CONSULTATION_FEE_LABEL}
                                </span>
                                <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">
                                  {formatCurrency(previewResult.consultationGrossSalary)}
                                </span>
                              </div>
                              <div className="salary-calc-block__preview-card-item">
                                <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">
                                  {SALARY_PREVIEW_SPECIAL_SUPPORT_LABEL}
                                </span>
                                <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">
                                  +{formatCurrency(previewResult.specialSupportAmount)}
                                </span>
                              </div>
                              <div className="salary-calc-block__preview-card-item">
                                <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">
                                  {SALARY_PREVIEW_PRE_TAX_TOTAL_LABEL}
                                </span>
                                <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">
                                  {formatCurrency(
                                    previewResult.taxableGrossSalary != null && previewResult.taxableGrossSalary !== ''
                                      ? previewResult.taxableGrossSalary
                                      : previewResult.grossSalary
                                  )}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="salary-calc-block__preview-card-item">
                              <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">{t('erp:SalaryManagement.t_bd8a97b2')}</span>
                              <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">{formatCurrency(previewResult.grossSalary)}</span>
                            </div>
                          )}
                          {!previewFreelanceSpecialSupportBreakdown
                            && Number(previewResult.specialSupportAmount) > 0 && (
                            <div className="salary-calc-block__preview-card-item">
                              <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">
                                {SALARY_PREVIEW_SPECIAL_SUPPORT_LABEL}
                              </span>
                              <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">
                                +{formatCurrency(previewResult.specialSupportAmount)}
                              </span>
                            </div>
                          )}
                          <div className="salary-calc-block__preview-card-item">
                            <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">{t('erp:SalaryManagement.t_84bfbb23')}</span>
                            <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">-{formatCurrency(previewResult.taxAmount)}</span>
                          </div>
                          <div className="salary-calc-block__preview-card-item salary-calc-block__preview-card-item--net">
                            <span className="mg-v2-ad-b0kla__kpi-label salary-management__stat-label">{t('erp:SalaryManagement.t_1ca8bc0d')}</span>
                            <span className="mg-v2-ad-b0kla__kpi-value salary-management__stat-value">{formatCurrency(previewResult.netSalary)}</span>
                          </div>
                        </div>
                        <dl className="salary-calc-block__preview-grid">
                          <dt className="salary-management__stat-label">{t('common.labels.consultant')}</dt>
                          <dd className="salary-management__stat-value"><SafeText>{previewResult.consultantName}</SafeText></dd>
                          <dt className="salary-management__stat-label">{t('erp:SalaryManagement.t_2622331e')}</dt>
                          <dd className="salary-management__stat-value"><SafeText>{previewResult.period}</SafeText></dd>
                          <dt className="salary-management__stat-label">{t('erp:SalaryManagement.t_b193260c')}</dt>
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
                                  /* 확정 후에만 salary_calculations·salary_tax_calculations에 반영되므로 세금 통계 갱신 */
                                  if (previewResult.period) {
                                    loadTaxStatistics(previewResult.period, { silent: true });
                                  }
                                }
                              } catch (err) {
                                console.error('급여 확정 API 오류:', err);
                                showNotification(
                                  toErrorMessage(err, '확정 처리 중 오류가 발생했습니다.'),
                                  'error'
                                );
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
                            {t('erp:SalaryManagement.t_55536106')}
                          </MGButton>
                          <MGButton
                            variant="outline"
                            size="medium"
                            onClick={() => setPreviewResult(null)}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            className={buildErpMgButtonClassName({ variant: 'outline' })}
                          >
                            {t('erp:SalaryManagement.t_2f1d7d00')}
                          </MGButton>
                        </div>
                        <p className="salary-calc-block__preview-notice">
                          {t('erp:SalaryManagement.t_6c60769a')} <strong>{t('erp:SalaryManagement.t_55536106')}</strong>해야 급여·세금 내역이 저장되며,
                          세금 관리 탭 통계에도 반영됩니다.
                          동일 상담사·동일 월에 이미 확정된 급여가 있으면 확정할 수 없습니다. 아래「급여 계산 내역」을 확인해 주세요.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="salary-calc-block__list">
                    <h3 className="mg-v2-ad-b0kla__section-title salary-calc-block__list-title">{t('erp:SalaryManagement.t_82821fb8')}</h3>
                    {!loading && salaryCalculations.length === 0 && (
                      <div className="salary-calc-block__empty" role="status" data-state="empty">
                        <p className="salary-calc-block__empty-message">
                          {selectedPeriod
                            ? SALARY_CALC_EMPTY_FOR_PERIOD_MESSAGE
                            : SALARY_CALC_EMPTY_NO_SELECTION_MESSAGE}
                        </p>
                      </div>
                    )}
                    {orderedSalaryCalculations.map(calculation => {
                      const isAdjustment = isSalaryAdjustmentCalculation(calculation);
                      const statusNorm = normalizeSalaryCalculationStatus(calculation.status);
                      const lateInfo = lateSessionByPrimaryId[calculation.id];
                      const extraCompletedCount = lateInfo?.extraCompletedCount ?? 0;
                      const showLateNotice = !isAdjustment && extraCompletedCount > 0;
                      const showRecalcAction = showLateNotice
                        && (statusNorm === SALARY_STATUS.CALCULATED
                          || statusNorm === SALARY_STATUS.APPROVED);
                      const showAdjustmentAction = showLateNotice
                        && statusNorm === SALARY_STATUS.PAID;
                      const sessionCount = calculation.completedConsultations != null
                        ? calculation.completedConsultations
                        : calculation.consultationCount;
                      const cardClassName = isAdjustment
                        ? `mg-v2-ad-b0kla__card salary-calc-block__card ${SALARY_LATE_NOTES_CSS.CARD_ADJUSTMENT}`
                        : 'mg-v2-ad-b0kla__card salary-calc-block__card';
                      return (
                      <article key={calculation.id} className={cardClassName}>
                        <div className="salary-calc-block__card-header">
                          <span><SafeText>{calculation.calculationPeriod}</SafeText></span>
                          <div className={SALARY_LATE_NOTES_CSS.CARD_HEADER_BADGES}>
                            {isAdjustment && (
                              <span className={SALARY_LATE_NOTES_CSS.ADJUSTMENT_BADGE} role="status">
                                {SALARY_LATE_NOTES_LABELS.ADJUSTMENT_BADGE}
                              </span>
                            )}
                            <span className="mg-v2-status-badge mg-v2-badge--neutral" role="status">
                              <SafeText>{getStatusLabel(calculation.status)}</SafeText>
                            </span>
                          </div>
                        </div>
                        <div className="salary-calc-block__card-details">
                          {buildSalaryCalculationComponentRows(calculation, toSalaryNumber).map((row, idx) => (
                            <div key={`${row.label}-${idx}`} className="salary-management__detail-row">
                              <span>{row.label}</span>
                              <span>{formatCurrency(row.amount)}</span>
                            </div>
                          ))}
                          {toSalaryNumber(calculation.bonusEarnings) > 0 && (
                            <div className="salary-management__detail-row">
                              <span>{SALARY_PREVIEW_SPECIAL_SUPPORT_LABEL}</span>
                              <span>+{formatCurrency(calculation.bonusEarnings)}</span>
                            </div>
                          )}
                          <div className="salary-management__detail-row">
                            <span>{t('erp:SalaryManagement.t_92a15637')}</span>
                            <span>
                              {formatCurrency(
                                calculation.grossSalary != null && calculation.grossSalary !== ''
                                  ? calculation.grossSalary
                                  : calculation.totalSalary
                              )}
                            </span>
                          </div>
                          {calculation.taxAmount != null && (
                            <div className="salary-management__detail-row salary-management__detail-row--tax">
                              <span>{SALARY_CALC_DETAIL_TAX_DEDUCTIONS_LABEL}</span>
                              <span>-{formatCurrency(calculation.taxAmount)}</span>
                            </div>
                          )}
                          <div className="salary-management__detail-row salary-management__detail-row--total">
                            <span>{t('erp:SalaryManagement.t_c3363939')}</span>
                            <span>
                              {formatCurrency(
                                calculation.netSalary != null && calculation.netSalary !== ''
                                  ? calculation.netSalary
                                  : toSalaryNumber(calculation.totalSalary) - toSalaryNumber(calculation.taxAmount)
                              )}
                            </span>
                          </div>
                          <div className="salary-management__detail-row">
                            <span>{t('erp:SalaryManagement.t_b193260c')}</span>
                            <span>
                              {isAdjustment
                                ? `${SALARY_LATE_NOTES_LABELS.ADJUSTMENT_SESSION_PREFIX}${toDisplayString(sessionCount)}${SALARY_LATE_NOTES_LABELS.COUNT_SUFFIX}`
                                : `${toDisplayString(sessionCount)}${SALARY_LATE_NOTES_LABELS.COUNT_SUFFIX}`}
                            </span>
                          </div>
                        </div>
                        {showLateNotice && (
                          <p className={SALARY_LATE_NOTES_CSS.LATE_SESSION_NOTICE} role="status">
                            {SALARY_LATE_NOTES_LABELS.EXTRA_COMPLETED_PREFIX}
                            {' '}
                            {extraCompletedCount}
                            {SALARY_LATE_NOTES_LABELS.COUNT_SUFFIX}
                          </p>
                        )}
                        <div className="mg-v2-card-actions salary-calc-block__actions">
                          {showRecalcAction && (
                            <MGButton
                              variant="outline"
                              size="small"
                              onClick={() => handleRecalcSalary(calculation, extraCompletedCount)}
                              disabled={Boolean(
                                recalcLoadingId != null
                                || adjustmentLoadingId != null
                                || approvingCalculationId != null
                              )}
                              loading={recalcLoadingId === calculation.id}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: recalcLoadingId === calculation.id
                              })}
                              aria-label={SALARY_LATE_NOTES_LABELS.RECALC}
                            >
                              {SALARY_LATE_NOTES_LABELS.RECALC}
                            </MGButton>
                          )}
                          {showAdjustmentAction && (
                            <MGButton
                              variant="primary"
                              size="small"
                              onClick={() => handleCreateAdjustment(calculation, extraCompletedCount)}
                              disabled={Boolean(
                                recalcLoadingId != null
                                || adjustmentLoadingId != null
                                || approvingCalculationId != null
                              )}
                              loading={adjustmentLoadingId === calculation.id}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              className={buildErpMgButtonClassName({
                                variant: 'primary',
                                size: 'sm',
                                loading: adjustmentLoadingId === calculation.id
                              })}
                              aria-label={SALARY_LATE_NOTES_LABELS.CREATE_ADJUSTMENT}
                            >
                              {SALARY_LATE_NOTES_LABELS.CREATE_ADJUSTMENT}
                            </MGButton>
                          )}
                          <MGButton
                            variant="secondary"
                            size="small"
                            onClick={() => {
                              setSelectedCalculation(calculation);
                              setIsTaxDetailsOpen(true);
                            }}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            className={buildErpMgButtonClassName({
                              variant: 'secondary',
                              size: 'sm'
                            })}
                          >
                            {t('erp:SalaryManagement.t_3c8aa4d4')}
                          </MGButton>
                          {statusNorm === SALARY_STATUS.CALCULATED && (
                            <MGButton
                              variant="primary"
                              size="small"
                              onClick={() => handleApproveSalary(calculation)}
                              disabled={Boolean(
                                approvingCalculationId != null
                                || recalcLoadingId != null
                                || adjustmentLoadingId != null
                              )}
                              loading={approvingCalculationId === calculation.id}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              className={buildErpMgButtonClassName({
                                variant: 'primary',
                                size: 'sm',
                                loading: approvingCalculationId === calculation.id
                              })}
                              aria-label={SALARY_ACTION_LABELS.APPROVE}
                            >
                              {SALARY_ACTION_LABELS.APPROVE}
                            </MGButton>
                          )}
                          <MGButton
                            variant="primary"
                            size="small"
                            onClick={() => {
                              setSelectedCalculation(calculation);
                              setIsExportModalOpen(true);
                            }}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              size: 'sm'
                            })}
                          >
                            {t('erp:SalaryManagement.t_2df41b9a')}
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
                      );
                    })}
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
                      {t('erp:SalaryManagement.t_5708430f')}
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
                      {t('erp:SalaryManagement.t_593249b4')}
                    </MGButton>
                  </div>
                  {taxStatistics ? (
                    <div className="mg-v2-ad-b0kla__card salary-tax-block__card">
                      <h3 className="salary-tax-block__card-title">{t('erp:SalaryManagement.t_269e8dc5')}</h3>
                      <div className="salary-tax-block__card-body">
                        <div className="salary-management__detail-row">
                          <span>{t('erp:SalaryManagement.t_f338f53f')}</span>
                          <span className="salary-tax-block__value">{formatCurrency(taxStatistics.totalTaxAmount || 0)}</span>
                        </div>
                        <div className="salary-management__detail-row">
                          <span>{t('erp:SalaryManagement.t_b9a382d3')}</span>
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
                          <span>{t('erp:SalaryManagement.t_6f01f8c9')}</span>
                          <span>-{formatCurrency(taxStatistics.totalTaxAmount || 0)}</span>
                        </div>
                      </div>
                      <div className="mg-v2-card-actions salary-tax-block__actions">
                        <MGButton
                          variant="secondary"
                          size="small"
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          className={buildErpMgButtonClassName({
                            variant: 'secondary',
                            size: 'sm'
                          })}
                        >
                          {t('erp:SalaryManagement.t_9b206b2c')}
                        </MGButton>
                        <MGButton
                          variant="primary"
                          size="small"
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'sm'
                          })}
                        >
                          {t('erp:SalaryManagement.t_2df41b9a')}
                        </MGButton>
                      </div>
                    </div>
                  ) : (
                    <div className="salary-tax-block__empty" data-state="empty">
                      <p>{t('erp:SalaryManagement.t_2b4bcb92')}</p>
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
        <div
          className="salary-management-loading-overlay"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <UnifiedLoading type="inline" text={t('erp:SalaryManagement.t_06e61b86')} />
        </div>
      )}

      <ConfirmModal />

      <UnifiedModal
        isOpen={isConsultantPickerOpen}
        onClose={closeConsultantPicker}
        title={t('erp:SalaryManagement.t_fc554626')}
        subtitle="급여 프로필을 작성할 상담사를 선택하세요."
        size="small"
        backdropClick={true}
        showCloseButton={true}
        className="mg-v2-ad-b0kla"
      >
        {consultants.length === 0 ? (
          <p className="salary-profile-block__empty-state mg-v2-mb-md">{t('erp:SalaryManagement.t_dba1b53d')}</p>
        ) : (
          <ul className="mg-v2-list-container">
            {consultants.map((consultant) => (
              <li key={consultant.id}>
                <MGButton
                  type="button"
                  variant="outline"
                  fullWidth
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
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
