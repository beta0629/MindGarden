import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import StandardizedApi from '../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { isRestrictedClientProfileTier } from '../../constants/clientProfileContext';
import notificationManager from '../../utils/notification';
import { toDisplayString, toErrorMessage } from '../../utils/safeDisplay';
import { hasScheduleSessionStarted } from '../../utils/scheduleSessionStart';
import UnifiedModal from '../common/modals/UnifiedModal';
import ConfirmModal from '../common/ConfirmModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import {
  CONSULTATION_LOG_AUTOSAVE_STRINGS,
  CONSULTATION_LOG_SESSION_NUMBER_STRINGS,
  formatConsultationLogAutosaveString
} from '../../constants/consultationLogAutosaveStrings';
import {
  buildConsultationLogFormMessages,
  validateConsultationLogForm
} from '../../utils/consultationLogFormValidation';
import {
  DRAFT_AUTOSAVE_STATUS,
  formatDraftSavedAtLabel,
  useConsultationLogDraftAutosave
} from '../../hooks/useConsultationLogDraftAutosave';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import {
  resolveSessionNumberFromSchedule,
  shouldBlockSaveForMissingSessionNumber
} from '../../utils/consultationRecordSessionNumber';
import {
  buildScheduleDetailEndpoint,
  normalizeMissingLogScheduleId,
  unwrapScheduleDetail
} from '../../utils/missingConsultationLogNavigation';
import './ConsultationLogModal.css';
import ConsultationLogClientProfilePanel from './organisms/ConsultationLogClientProfilePanel';
import ConsultationLogPrecautionsPanel from './organisms/ConsultationLogPrecautionsPanel';
import ConsultationLogFormPanel from './organisms/ConsultationLogFormPanel';
import ConsultationLogRequiredFieldsNotice from './molecules/ConsultationLogRequiredFieldsNotice';
import ConsultationLogSessionHeaderMeta from './molecules/ConsultationLogSessionHeaderMeta';
import ConsultationLogAdminWriteBadge from './molecules/ConsultationLogAdminWriteBadge';
import {
  INSTITUTION_LINK_CONSULTATION_RECORDS_API,
  buildInstitutionLinkLatestLogUrl,
  buildInstitutionLinkLogRoutingFields,
  isInstitutionLinkConsultationLogContext,
  mapInstitutionLinkLogToConsultationRecord,
  resolveConsultationScheduleId
} from '../../utils/consultationLogInstitutionContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES = '/api/v1/common-codes?codeGroup=PRIORITY';
const API_COMMON_CODES_2 = '/api/v1/common-codes?codeGroup=COMPLETION_STATUS';
const API_SCHEDULES_CONSULTATION_RECORDS = '/api/v1/schedules/consultation-records';


/** PRIORITY 공통코드가 비어 있거나 로드 실패 시 — 목표 달성도와 동일하게 칩으로 바로 선택 */
const DEFAULT_RISK_LEVEL_OPTIONS = [
  { value: 'LOW', label: '낮음', color: 'var(--mg-success-500)', description: '낮은 우선순위' },
  { value: 'MEDIUM', label: '보통', color: 'var(--mg-warning-500)', description: '보통 우선순위' },
  { value: 'HIGH', label: '높음', color: 'var(--mg-warning-600)', description: '높은 우선순위' },
  { value: 'URGENT', label: '긴급', color: 'var(--mg-error-500)', description: '긴급 우선순위' },
  { value: 'CRITICAL', label: '위험', color: 'var(--mg-color-secondary-main)', description: '치명적 위험' }
];

/** API codeLabel이 영문이어도 UI는 항상 한글·동일 아이콘 */
const PRIORITY_DISPLAY_BY_VALUE = DEFAULT_RISK_LEVEL_OPTIONS.reduce((acc, row) => {
  acc[row.value] = { label: row.label };
  return acc;
}, {});

const GOAL_ACHIEVEMENT_UI = new Set(['LOW', 'MEDIUM', 'HIGH']);

/**
 * 목표 달성도: 백엔드 EXCELLENT 등은 UI 3단계(LOW/MEDIUM/HIGH)에 없음 → HIGH로 매핑(최상 달성으로 표시).
 */
const normalizeGoalAchievementForForm = (raw) => {
  const u = String(raw ?? '').trim().toUpperCase();
  if (GOAL_ACHIEVEMENT_UI.has(u)) return u;
  if (u === 'EXCELLENT' || u === 'VERY_HIGH' || u === 'VERYHIGH') return 'HIGH';
  if (u === 'POOR' || u === 'VERY_LOW' || u === 'VERYLOW') return 'LOW';
  return 'MEDIUM';
};

/** 위험도: PRIORITY 코드값과 칩 option.value 정합(대문자·트림). 알 수 없으면 LOW. */
const normalizeRiskAssessmentForForm = (raw) => {
  if (raw == null || String(raw).trim() === '') return 'LOW';
  return String(raw).trim().toUpperCase();
};

const CONSULTATION_LOG_API_VALIDATION_ERROR_CODES = new Set(['CONSTRAINT_VIOLATION', 'BEAN_VALIDATION_ERROR']);

const CONSULTATION_RECORD_DUPLICATE_ERROR_CODE = 'CONSULTATION_RECORD_DUPLICATE';

/**
 * ErrorResponse.details — "field: message, field2: message2" (콤마+공백 구분) 파싱.
 *
 * @param {unknown} details
 * @returns {Record<string, string>}
 */
const parseApiValidationDetailsToFieldMap = (details) => {
  const result = {};
  if (details == null || typeof details !== 'string') {
    return result;
  }
  const trimmed = details.trim();
  if (!trimmed) {
    return result;
  }
  trimmed.split(', ').forEach((segment) => {
    const idx = segment.indexOf(': ');
    if (idx <= 0) {
      return;
    }
    const field = segment.slice(0, idx).trim();
    const msg = segment.slice(idx + 2).trim();
    if (field) {
      result[field] = msg;
    }
  });
  return result;
};

/**
 * 400 + CONSTRAINT_VIOLATION / BEAN_VALIDATION_ERROR 시 필드 오류 반영 및 토스트용 문구 반환.
 *
 * @param {unknown} error
 * @param {function} setValidationErrors validationErrors setState
 * @returns {string|null} 알림 메시지; 일반 오류면 null
 */
const applyConsultationLogApiValidationErrors = (error, setValidationErrors) => {
  const status = error?.status;
  const data = error?.response?.data;
  if (status !== 400 || !data || typeof data !== 'object') {
    return null;
  }
  const code = data.errorCode;
  if (!CONSULTATION_LOG_API_VALIDATION_ERROR_CODES.has(code)) {
    return null;
  }
  const fieldMap = parseApiValidationDetailsToFieldMap(data.details);
  const keys = Object.keys(fieldMap);
  if (keys.length > 0) {
    setValidationErrors((prev) => ({ ...prev, ...fieldMap }));
  }
  if (keys.length === 1) {
    return fieldMap[keys[0]];
  }
  if (keys.length > 1) {
    return i18n.t('common:consultant.ConsultationLogModal.t_ec4468bd', {
      firstField: fieldMap[keys[0]],
      extraCount: keys.length - 1
    });
  }
  return toDisplayString(data.message, '');
};

/**
 * 같은 일정 일지 중복 생성 거부(409 CONSULTATION_RECORD_DUPLICATE) 여부.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
const isConsultationRecordDuplicateError = (error) =>
  error?.status === 409 && error?.response?.data?.errorCode === CONSULTATION_RECORD_DUPLICATE_ERROR_CODE;

/**
 * 로컬 초안 스코프 — tenantId와 함께 사용. 세션(로그인)과 별개로 단말에만 보관.
 *
 * @param {object|null} scheduleData
 * @param {string|number|null|undefined} recordId
 * @returns {{ type: string, id: string }|null}
 */
const resolveConsultationLogDraftScope = (scheduleData, recordId) => {
  if (recordId != null && String(recordId).trim() !== '') {
    return { type: 'record', id: String(recordId) };
  }
  const rawId = scheduleData?.id;
  if (rawId == null || rawId === '') return null;
  if (typeof rawId === 'string' && rawId.startsWith('schedule-')) {
    return { type: 'schedule', id: rawId.replace(/^schedule-/, '') };
  }
  return { type: 'schedule', id: String(rawId) };
};

/**
 * 상담일지 작성 모달 컴포넌트
 * 스케줄 시간에 상담사가 내담자 정보를 보면서 상담일지를 작성할 수 있는 큰 모달(fullscreen).
 * UnifiedModal 헤더·푸터 고정, 본문 단일 스크롤(.mg-v2-modal-body).
 * 상단: 내담자 프로필(+심리검사 요약)·주의사항 아코디언 → 필수 안내 → 폼.
 */
const ConsultationLogModal = ({
  isOpen,
  onClose,
  scheduleData,
  onSave,
  recordId,
  isAdmin = false,
  routeLeaveGuard = false
}) => {
  const { t } = useTranslation();
  const { user } = useSession();

  /**
   * 로드 완료 대상 키. 모달이 열린 대상(recordId·scheduleData.id)과 같아질 때까지 로딩으로 본다.
   *
   * <p>이전에는 {@code loading} 초기값이 false 라 모달이 열린 직후 첫 페인트가
   * 빈 formData 로 렌더됐다(입력칸 0자 → 2~3초 뒤 채워짐). 로드 effect 는 첫 페인트
   * <strong>이후</strong>에 실행되고, 일정 경로는 {@code enrichScheduleSessionMeta} 를
   * await 한 뒤에야 {@code setLoading(true)} 를 하므로 빈 화면이 더 길게 보였다.
   * 렌더 시점에 파생되는 값으로 바꿔 첫 페인트부터 로딩으로 만든다.</p>
   */
  const [loadedTargetKey, setLoadedTargetKey] = useState(null);
  const openTargetKey = useMemo(() => {
    if (!isOpen) return '';
    return `${recordId ?? ''}|${scheduleData?.id ?? ''}`;
  }, [isOpen, recordId, scheduleData?.id]);
  const openTargetKeyRef = useRef(openTargetKey);
  openTargetKeyRef.current = openTargetKey;
  /** 로더가 돌 대상이 아예 없으면(둘 다 없음) 로딩으로 두지 않는다 */
  const hasLoadTarget = Boolean(recordId) || Boolean(scheduleData);
  const dataLoaded = isOpen && loadedTargetKey === openTargetKey;
  const loading = isOpen && hasLoadTarget && !dataLoaded;
  /** 기존 로더의 setLoading(true/false) 호출부를 그대로 쓰기 위한 어댑터 */
  const setLoading = useCallback((next) => {
    setLoadedTargetKey(next ? null : openTargetKeyRef.current);
  }, []);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState(null);
  /** with-stats 전체 응답(client, statistics, currentConsultants 등) — 권한 있을 때만 채워짐 */
  const [clientWithStats, setClientWithStats] = useState(null);
  const [consultationRecord, setConsultationRecord] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [priorityOptions, setPriorityOptions] = useState(DEFAULT_RISK_LEVEL_OPTIONS);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [completionStatusOptions, setCompletionStatusOptions] = useState([]);
  const [loadingCompletionCodes, setLoadingCompletionCodes] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  /** 중요 코멘트 수집: 내담자 notes, 일정 notes, 이전 일지 특이사항 등 */
  const [importantComments, setImportantComments] = useState([]);
  const [accordionProfileOpen, setAccordionProfileOpen] = useState(true);
  const [accordionPrecautionsOpen, setAccordionPrecautionsOpen] = useState(true);
  const [memoDraft, setMemoDraft] = useState('');
  const [memoDirty, setMemoDirty] = useState(false);
  /** 누락 진입 시 단건/목록 조회로 보강한 일정 메타(sessionSequence SSOT) */
  const scheduleMetaRef = useRef(null);

  /** 뷰포트 높이 ≤768px 일 때 상단 아코디언 기본 접힘 */
  useEffect(() => {
    if (!isOpen) return;
    const mq = globalThis.matchMedia('(max-height: 768px)');
    const shortViewport = mq.matches;
    setAccordionProfileOpen(!shortViewport);
    setAccordionPrecautionsOpen(!shortViewport);
  }, [isOpen]);

  useEffect(() => {
    if (!client) {
      setMemoDraft('');
      setMemoDirty(false);
      return;
    }
    const raw = client.notes;
    setMemoDraft(raw != null ? toDisplayString(raw, '') : '');
    setMemoDirty(false);
  }, [client]);

  const loadPriorityCodes = useCallback(async() => {
    try {
      setLoadingCodes(true);
      const response = await apiGet(API_COMMON_CODES);
      const list = response?.codes ?? [];
      if (list.length > 0) {
        const options = list
          .map((code) => {
            const v = String(code.codeValue ?? '');
            const preset = PRIORITY_DISPLAY_BY_VALUE[v];
            return {
              value: v,
              label: preset?.label ?? code.koreanName ?? code.codeLabel ?? v,
              color: code.colorCode,
              description: code.codeDescription,
              sortOrder: Number(code.sortOrder) || 0
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder);
        setPriorityOptions(options);
      } else {
        setPriorityOptions(DEFAULT_RISK_LEVEL_OPTIONS);
      }
    } catch (error) {
      console.error('우선순위 코드 로드 실패:', error);
      setPriorityOptions(DEFAULT_RISK_LEVEL_OPTIONS);
    } finally {
      setLoadingCodes(false);
    }
  }, []);
  
  const [formData, setFormData] = useState({
    sessionDate: '',
    sessionNumber: null,
    clientCondition: '',
    mainIssues: '',
    interventionMethods: '',
    clientResponse: '',
    nextSessionPlan: '',
    homeworkAssigned: '',
    homeworkDueDate: '',
    riskAssessment: 'LOW',
    riskFactors: '',
    emergencyResponsePlan: '',
    progressEvaluation: '',
    progressScore: 50,
    goalAchievement: 'MEDIUM',
    goalAchievementDetails: '',
    consultantObservations: '',
    consultantAssessment: '',
    specialConsiderations: '',
    medicalInformation: '',
    medicationInfo: '',
    familyRelationships: '',
    socialSupport: '',
    environmentalFactors: '',
    sessionDurationMinutes: 60,
    isSessionCompleted: false,
    incompletionReason: '',
    nextSessionDate: '',
    followUpActions: '',
    followUpDueDate: ''
  });

  const tenantIdStr = useMemo(() => {
    const t = user?.tenantId ?? user?.tenant_id;
    if (t == null || String(t).trim() === '') return '';
    return String(t).trim();
  }, [user?.tenantId, user?.tenant_id]);

  const draftScope = useMemo(
    () => resolveConsultationLogDraftScope(scheduleData, recordId),
    [scheduleData, recordId]
  );

  /** 백엔드 draft API consultationId — 일정 ID(숫자 문자열 또는 schedule- 접두) */
  const draftQueryConsultationId = useMemo(() => {
    if (scheduleData?.id != null && String(scheduleData.id).trim() !== '') {
      return String(scheduleData.id).trim();
    }
    const cid = consultationRecord?.consultationId;
    if (cid != null && String(cid).trim() !== '') {
      return String(cid).trim();
    }
    return '';
  }, [scheduleData?.id, consultationRecord?.consultationId]);

  /** 서버 초안은 작성자 본인 키로만 저장된다 — 관리자는 담당 상담사가 아닌 본인 id 로 조회·저장한다. */
  const draftConsultantId = useMemo(() => {
    if (isAdmin) {
      const adminId = user?.id;
      if (adminId == null || adminId === '') return null;
      const n = typeof adminId === 'number' ? adminId : parseInt(String(adminId), 10);
      return Number.isFinite(n) ? n : null;
    }
    const fromSchedule = scheduleData?.consultantId;
    if (fromSchedule != null && fromSchedule !== '') {
      const n = typeof fromSchedule === 'number' ? fromSchedule : parseInt(String(fromSchedule), 10);
      if (Number.isFinite(n)) return n;
    }
    const fromRecord = consultationRecord?.consultantId;
    if (fromRecord != null && fromRecord !== '') {
      const n = typeof fromRecord === 'number' ? fromRecord : parseInt(String(fromRecord), 10);
      if (Number.isFinite(n)) return n;
    }
    const uid = user?.id;
    if (uid != null && uid !== '') {
      const n = typeof uid === 'number' ? uid : parseInt(String(uid), 10);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }, [isAdmin, scheduleData?.consultantId, consultationRecord?.consultantId, user?.id]);

  const [restoreDraftConfirmOpen, setRestoreDraftConfirmOpen] = useState(false);
  /** 불러오기 확정 전 "작성 중 내용 덮어쓰기" 2차 확인 */
  const [restoreOverwriteConfirmOpen, setRestoreOverwriteConfirmOpen] = useState(false);
  const [pendingRestoreDraft, setPendingRestoreDraft] = useState(null);
  const [closeWithoutSaveConfirmOpen, setCloseWithoutSaveConfirmOpen] = useState(false);
  const [conflictConfirmOpen, setConflictConfirmOpen] = useState(false);

  const formDataRef = useRef(formData);
  const memoDraftRef = useRef(memoDraft);
  const contentDirtyRef = useRef(false);
  const restoreConfirmedRef = useRef(false);
  const overwriteConfirmedRef = useRef(false);
  /** 서버 초안 payloadJson 과 동일 스키마 — 훅이 그대로 직렬화한다 */
  const draftSnapshotRef = useRef({ formData, memoDraft });

  formDataRef.current = formData;
  memoDraftRef.current = memoDraft;
  draftSnapshotRef.current = { formData, memoDraft };

  const onRestoreCandidate = useCallback((candidate) => {
    setPendingRestoreDraft(candidate);
    setRestoreDraftConfirmOpen(true);
  }, []);

  const onConflictDetected = useCallback(() => {
    setConflictConfirmOpen(true);
  }, []);

  const conflictResolvedRef = useRef(false);

  /** 복구·충돌 해소 시 스냅샷을 폼에 반영 (초안 payloadJson 스키마와 동일) */
  const applyRestoredDraftSnapshot = useCallback((snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return;
    if (snapshot.formData && typeof snapshot.formData === 'object') {
      setFormData(snapshot.formData);
    }
    setMemoDraft(typeof snapshot.memoDraft === 'string' ? snapshot.memoDraft : '');
    setMemoDirty(false);
    contentDirtyRef.current = false;
  }, []);

  /** "임시저장된 내용이 있어요(2:03). 불러올까요?" — KST */
  const restoreDraftMessage = useMemo(() => {
    const savedAt = pendingRestoreDraft?.savedAt;
    if (!Number.isFinite(savedAt)) {
      return CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_MESSAGE;
    }
    return formatConsultationLogAutosaveString(
      CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_MESSAGE_WITH_TIME,
      formatDraftSavedAtLabel(savedAt)
    );
  }, [pendingRestoreDraft?.savedAt]);

  const {
    status: draftStatus,
    savedAtLabel: draftSavedAtLabel,
    backupKept: draftBackupKept,
    notifyDirty,
    saveNow: saveDraftNow,
    discardDraft,
    resolveRestoreCandidate,
    loadLatestFromServer,
    keepMineOnConflict
  } = useConsultationLogDraftAutosave({
    // 기록 로드가 끝난 뒤에만 초안을 조회한다 — 레코드 적용과 초안 복구가 경쟁하지 않도록
    // 병합 판단을 한 번만 한다 (레코드 반영 → 초안 복구 여부 질의).
    enabled: isOpen && !loading,
    tenantId: tenantIdStr,
    userId: user?.id,
    consultationId: draftQueryConsultationId,
    consultantId: draftConsultantId,
    legacyScope: draftScope,
    snapshotRef: draftSnapshotRef,
    dirtyRef: contentDirtyRef,
    recordUpdatedAt: consultationRecord?.updatedAt,
    onRestoreCandidate,
    onConflictDetected
  });

  // 새로고침·탭 닫기 확인. 전체화면 라우트(routeLeaveGuard)로 띄울 때만 라우트 이동도 확인한다.
  const { blocker: leaveBlocker, releaseGuard: releaseLeaveGuard } = useUnsavedChangesGuard({
    when: isOpen && (contentDirtyRef.current || memoDirty),
    enableRouteBlocker: routeLeaveGuard
  });

  useEffect(() => {
    if (!isOpen) {
      setRestoreDraftConfirmOpen(false);
      setRestoreOverwriteConfirmOpen(false);
      setPendingRestoreDraft(null);
      setCloseWithoutSaveConfirmOpen(false);
      setConflictConfirmOpen(false);
      return undefined;
    }
    return undefined;
  }, [isOpen]);

  const setFormDataWithDirty = useCallback((updater) => {
    notifyDirty();
    setFormData(updater);
  }, [notifyDirty]);

  const requestClose = useCallback(() => {
    if (saving) return;
    if (contentDirtyRef.current || memoDirty) {
      setCloseWithoutSaveConfirmOpen(true);
      return;
    }
    onClose?.();
  }, [saving, memoDirty, onClose]);

  /** "저장 중… / 2:03 임시저장됨 / 저장 실패(재시도 중)" — KST */
  const autosaveStatusText = useMemo(() => {
    if (saving) return CONSULTATION_LOG_AUTOSAVE_STRINGS.STATUS_FINAL_SAVING;
    if (!tenantIdStr) return CONSULTATION_LOG_AUTOSAVE_STRINGS.STATUS_DRAFT_UNAVAILABLE;
    if (draftStatus === DRAFT_AUTOSAVE_STATUS.SAVING) {
      return CONSULTATION_LOG_AUTOSAVE_STRINGS.STATUS_DRAFT_SAVING;
    }
    if (draftStatus === DRAFT_AUTOSAVE_STATUS.RETRYING) {
      return CONSULTATION_LOG_AUTOSAVE_STRINGS.STATUS_DRAFT_RETRYING;
    }
    if (draftStatus === DRAFT_AUTOSAVE_STATUS.FAILED) {
      return draftBackupKept
        ? CONSULTATION_LOG_AUTOSAVE_STRINGS.STATUS_DRAFT_FAILED
        : CONSULTATION_LOG_AUTOSAVE_STRINGS.STATUS_DRAFT_FAILED_NOT_KEPT;
    }
    if (draftStatus === DRAFT_AUTOSAVE_STATUS.SAVED && draftSavedAtLabel) {
      return formatConsultationLogAutosaveString(
        CONSULTATION_LOG_AUTOSAVE_STRINGS.STATUS_DRAFT_SAVED_WITH_TIME,
        draftSavedAtLabel
      );
    }
    return '';
  }, [saving, tenantIdStr, draftStatus, draftSavedAtLabel, draftBackupKept]);

  const autosaveStatusIsError = draftStatus === DRAFT_AUTOSAVE_STATUS.FAILED
    || draftStatus === DRAFT_AUTOSAVE_STATUS.RETRYING;

  /** 일정에 유효한 내담자 ID가 있는지 (빈 문자열/NaN 제외) */
  const hasValidScheduleClientId = useMemo(() => {
    const raw = scheduleData?.clientId;
    if (raw == null || raw === '') return false;
    const n = typeof raw === 'number' ? raw : parseInt(raw, 10);
    return !Number.isNaN(n);
  }, [scheduleData?.clientId]);

  /** 심리 요약 API용 내담자 ID (프로필·일정·일지 레코드 중 최우선 스칼라) */
  const psychHookClientId = useMemo(() => {
    if (client?.id != null && String(client.id).trim() !== '') {
      const n = Number(client.id);
      return Number.isNaN(n) ? null : n;
    }
    if (consultationRecord?.clientId != null && String(consultationRecord.clientId).trim() !== '') {
      const n = Number(consultationRecord.clientId);
      return Number.isNaN(n) ? null : n;
    }
    const raw = scheduleData?.clientId;
    if (raw == null || raw === '') return null;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return Number.isNaN(n) ? null : n;
  }, [client?.id, consultationRecord?.clientId, scheduleData?.clientId]);

  const riskLevels = priorityOptions;

  const goalAchievementLevels = [
    { value: 'LOW', label: t('common:consultant.ConsultationLogModal.t_437ac8ce'), color: 'var(--mg-error-500)' },
    { value: 'MEDIUM', label: t('common:consultant.ConsultationLogModal.t_2179da2c'), color: 'var(--mg-warning-500)' },
    { value: 'HIGH', label: t('common:consultant.ConsultationLogModal.t_962636f4'), color: 'var(--mg-success-500)' }
  ];

  const loadCompletionStatusCodes = useCallback(async() => {
    try {
      setLoadingCompletionCodes(true);
      const response = await apiGet(API_COMMON_CODES_2);
      const list = response?.codes ?? [];
      if (list.length > 0) {
        setCompletionStatusOptions(list.map((code, index) => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: null,
          color: code.colorCode,
          description: code.codeDescription
        })));
      } else {
        setCompletionStatusOptions([
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'COMPLETED', label: t('common:consultant.ConsultationLogModal.t_8d868037'), color: 'var(--mg-success-500)', description: t('common:consultant.ConsultationLogModal.t_0ea90460') },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'PENDING', label: t('common:consultant.ConsultationLogModal.t_df72a875'), color: 'var(--mg-warning-500)', description: t('common:consultant.ConsultationLogModal.t_f1fea4e3') },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'IN_PROGRESS', label: t('common:consultant.ConsultationLogModal.t_0dae9079'), color: 'var(--mg-info-500)', description: t('common:consultant.ConsultationLogModal.t_b52f3df3') },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'CANCELLED', label: t('common:consultant.ConsultationLogModal.t_19b2d19b'), color: 'var(--mg-error-500)', description: t('common:consultant.ConsultationLogModal.t_ca1719e1') }
        ]);
      }
    } catch (error) {
      console.error('완료 상태 코드 로드 실패:', error);
      setCompletionStatusOptions([
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'COMPLETED', label: t('common:consultant.ConsultationLogModal.t_8d868037'), color: 'var(--mg-success-500)', description: t('common:consultant.ConsultationLogModal.t_0ea90460') },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'PENDING', label: t('common:consultant.ConsultationLogModal.t_df72a875'), color: 'var(--mg-warning-500)', description: t('common:consultant.ConsultationLogModal.t_f1fea4e3') },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'IN_PROGRESS', label: t('common:consultant.ConsultationLogModal.t_0dae9079'), color: 'var(--mg-info-500)', description: t('common:consultant.ConsultationLogModal.t_b52f3df3') },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'CANCELLED', label: t('common:consultant.ConsultationLogModal.t_19b2d19b'), color: 'var(--mg-error-500)', description: t('common:consultant.ConsultationLogModal.t_ca1719e1') }
      ]);
    } finally {
      setLoadingCompletionCodes(false);
    }
  }, []);

  /**
   * 내담자 맥락 프로필 SSOT — ADMIN/STAFF: consultantId 생략, CONSULTANT: consultantId 필수(백엔드 검증).
   */
  const fetchClientWithStats = useCallback(async(clientIdNum) => {
    if (clientIdNum == null || Number.isNaN(Number(clientIdNum))) {
      return { payload: null, clientData: null };
    }
    const cid = Number(clientIdNum);
    if (!isAdmin && (user?.id == null || Number.isNaN(Number(user.id)))) {
      return { payload: null, clientData: null };
    }
    const consultantId = user.id;
    const endpoint = API_ENDPOINTS.CLIENT_CONTEXT.CONTEXT_PROFILE(cid);
    const params = isAdmin ? {} : { consultantId: String(consultantId) };
    const payload = await StandardizedApi.get(endpoint, params);
    const rawClient = payload?.client ?? payload ?? null;
    const clientData = rawClient && typeof rawClient === 'object' && !Array.isArray(rawClient) ? rawClient : null;
    return { payload, clientData };
  }, [isAdmin, user?.id]);

  /** scheduleData에서 세션 일자(YYYY-MM-DD) 추출 — 클릭한 일정 날짜 우선 */
  const getSessionDateFromSchedule = (data) => {
    if (!data) return new Date().toISOString().split('T')[0];
    if (data.sessionDate && typeof data.sessionDate === 'string') return data.sessionDate.split('T')[0];
    if (data.date && typeof data.date === 'string') return data.date.split('T')[0];
    const st = data.startTime;
    if (typeof st === 'string' && st.includes('T')) return st.split('T')[0];
    if (st instanceof Date) return st.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  };

  /**
   * scheduleData 에 sessionSequence 가 없을 때 단건 조회로 보강.
   * @param {object} data
   * @returns {Promise<object>}
   */
  const enrichScheduleSessionMeta = async(data) => {
    const existing = resolveSessionNumberFromSchedule(data);
    if (existing != null) {
      return data;
    }
    const numericId = normalizeMissingLogScheduleId(data?.id ?? data?.scheduleId);
    if (numericId == null || user?.id == null || !user?.role) {
      return data;
    }
    try {
      const detailResponse = await StandardizedApi.get(
        buildScheduleDetailEndpoint(numericId),
        { userId: String(user.id), userRole: String(user.role) }
      );
      const detail = unwrapScheduleDetail(detailResponse);
      if (!detail) {
        return data;
      }
      const sessionNumber = resolveSessionNumberFromSchedule(detail);
      return {
        ...data,
        ...detail,
        id: data.id ?? detail.id,
        sessionSequence: detail.sessionSequence ?? sessionNumber ?? undefined,
        sessionNumber: sessionNumber ?? detail.sessionNumber ?? undefined
      };
    } catch (err) {
      console.warn('상담일지 — 일정 회기 메타 보강 실패:', err);
      return data;
    }
  };

  useEffect(() => {
    if (isOpen && recordId) {
      loadDataByRecordId();
      loadPriorityCodes();
      loadCompletionStatusCodes();
    }
  }, [isOpen, recordId]);

  /**
   * 같은 일정이면 부모가 새 객체를 넘겨도 다시 로드하지 않는다.
   * 다시 로드하면 loadData 가 formData 를 통째로 덮어 입력 중인 글이 사라진다.
   */
  const scheduleDataRef = useRef(scheduleData);
  scheduleDataRef.current = scheduleData;
  const scheduleLoadKey = scheduleData ? String(scheduleData.id ?? scheduleData.scheduleId ?? '') : null;

  useEffect(() => {
    if (!isOpen) {
      scheduleMetaRef.current = null;
      return undefined;
    }
    const currentSchedule = scheduleDataRef.current;
    if (currentSchedule && !recordId) {
      let cancelled = false;
      (async() => {
        loadPriorityCodes();
        loadCompletionStatusCodes();
        const enriched = await enrichScheduleSessionMeta(currentSchedule);
        if (cancelled) {
          return;
        }
        scheduleMetaRef.current = enriched;
        await loadData();
      })();
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [isOpen, scheduleLoadKey, recordId]);

  const loadDataByRecordId = async() => {
    if (!recordId || !user?.id) {
      // 로드할 수 없으면 로딩 상태로 묶어 두지 않는다 (빈 폼이 아니라 로딩이 영구 표시되는 것 방지)
      setLoading(false);
      return;
    }
    try {
      contentDirtyRef.current = false;
      setLoading(true);
      setClientWithStats(null);
      setClient(null);
      setConsultationRecord(null);
      setImportantComments([]);

      let record = null;
      if (isAdmin) {
        const res = await apiGet(`/api/v1/admin/consultation-records/${recordId}`);
        record = res?.data ?? res;
      } else {
        const res = await apiGet(`/api/v1/admin/consultant-records/${user.id}/consultation-records/${recordId}`);
        record = res?.data ?? res;
      }

      if (!record) {
        notificationManager.show(t('common:consultant.ConsultationLogModal.t_c6c0f291'), 'error');
        return;
      }

      const cId = record.clientId != null ? Number(record.clientId) : null;
      if (cId) {
        try {
          const { payload, clientData } = await fetchClientWithStats(cId);
          if (clientData) {
            setClientWithStats(payload && typeof payload === 'object' ? payload : { client: clientData });
            setClient(clientData);
          }
        } catch (err) {
          console.warn('내담자 통계 정보 로드 실패, 기본 정보만 사용:', err);
          // 기본 정보만으로 설정
          setClient({ 
            id: cId, 
            name: record.clientName || t('common:consultant.ConsultationLogModal.t_7941899e', { clientId: cId }),
            email: record.clientEmail || '',
            phone: record.clientPhone || ''
          });
          setClientWithStats({ 
            client: { 
              id: cId, 
              name: record.clientName || t('common:consultant.ConsultationLogModal.t_7941899e', { clientId: cId }),
              email: record.clientEmail || '',
              phone: record.clientPhone || ''
            } 
          });
        }
      }

      const sessionDateStr = record.sessionDate || record.consultationDate;
      const sessionDate = typeof sessionDateStr === 'string' ? sessionDateStr.split('T')[0] : sessionDateStr;

      setConsultationRecord(record);
      setIsEditMode(true);
      setFormData({
        sessionDate: sessionDate || '',
        sessionNumber: record.sessionNumber != null ? Number(record.sessionNumber) : null,
        clientCondition: record.clientCondition || '',
        mainIssues: record.mainIssues || '',
        interventionMethods: record.interventionMethods || '',
        clientResponse: record.clientResponse || '',
        nextSessionPlan: record.nextSessionPlan || '',
        homeworkAssigned: record.homeworkAssigned || '',
        homeworkDueDate: record.homeworkDueDate || '',
        riskAssessment: normalizeRiskAssessmentForForm(record.riskAssessment),
        riskFactors: record.riskFactors || '',
        emergencyResponsePlan: record.emergencyResponsePlan || '',
        progressEvaluation: record.progressEvaluation || '',
        progressScore: record.progressScore ?? 50,
        goalAchievement: normalizeGoalAchievementForForm(record.goalAchievement),
        goalAchievementDetails: record.goalAchievementDetails || '',
        consultantObservations: record.consultantObservations || '',
        consultantAssessment: record.consultantAssessment || '',
        specialConsiderations: record.specialConsiderations || '',
        medicalInformation: record.medicalInformation || '',
        medicationInfo: record.medicationInfo || '',
        familyRelationships: record.familyRelationships || '',
        socialSupport: record.socialSupport || '',
        environmentalFactors: record.environmentalFactors || '',
        sessionDurationMinutes: record.sessionDurationMinutes ?? 60,
        isSessionCompleted: record.isSessionCompleted ?? false,
        incompletionReason: record.incompletionReason || '',
        nextSessionDate: record.nextSessionDate || '',
        followUpActions: record.followUpActions || '',
        followUpDueDate: record.followUpDueDate || ''
      });

      const comments = [];
      if (record.specialConsiderations && String(record.specialConsiderations).trim()) {
        comments.push({ source: t('common:consultant.ConsultationLogModal.t_e7bcdb2a'), text: record.specialConsiderations });
      }
      setImportantComments(comments);
    } catch (error) {
      console.error('상담일지 단건 로드 오류:', error);
      notificationManager.show(t('common:consultant.ConsultationLogModal.t_3e5e7abe'), 'error');
    } finally {
      contentDirtyRef.current = false;
      setLoading(false);
    }
  };

  const loadData = async() => {
    const activeSchedule = scheduleMetaRef.current || scheduleData;
    try {
      contentDirtyRef.current = false;
      setLoading(true);
      setClientWithStats(null);
      setClient(null);
      setImportantComments([]);

      const rawClientId = activeSchedule?.clientId;
      const clientId = (rawClientId != null && rawClientId !== '') ? (typeof rawClientId === 'number' ? (Number.isNaN(rawClientId) ? null : rawClientId) : (() => { const n = parseInt(rawClientId, 10); return Number.isNaN(n) ? null : n; })()) : null;
      let withStatsData = null;
      if (clientId) {
        try {
          const { payload, clientData } = await fetchClientWithStats(clientId);
          if (clientData) {
            withStatsData = payload && typeof payload === 'object' ? payload : { client: clientData };
            setClientWithStats(withStatsData);
            setClient(clientData);
          }
        } catch (err) {
          if (isAdmin && (err?.status === 403 || err?.message?.includes(t('common:consultant.ConsultationLogModal.t_4d02bde7')))) {
            try {
              const usersRes = await apiGet('/api/admin/users');
              const userList = Array.isArray(usersRes) ? usersRes : (usersRes?.data ?? []);
              const fallback = userList.find(u => Number(u.id) === Number(clientId));
              if (fallback) {
                setClient({ id: fallback.id, name: fallback.name, phone: fallback.phone, email: fallback.email, gender: fallback.gender });
              }
            } catch (e) {
              console.warn('내담자 fallback 조회 실패:', e);
            }
          }
        }
      }

      let loadedRecord = null;
      try {
        const clientForContext = withStatsData?.client
          ?? (clientId ? { id: clientId } : null);
        // setClient 비동기 반영 전: 방금 fetch 한 withStats/clientData 로 판별
        const institutionContext = isInstitutionLinkConsultationLogContext(
          activeSchedule,
          withStatsData?.client ?? clientForContext,
          withStatsData
        );

        if (institutionContext) {
          const latestUrl = buildInstitutionLinkLatestLogUrl(activeSchedule);
          if (latestUrl) {
            const institutionResponse = await StandardizedApi.get(latestUrl);
            const institutionRaw = institutionResponse?.data ?? institutionResponse;
            const institutionRecord = mapInstitutionLinkLogToConsultationRecord(institutionRaw);
            if (institutionRecord) {
              loadedRecord = institutionRecord;
              setConsultationRecord(institutionRecord);
              setIsEditMode(true);
              setFormData({
                sessionDate: institutionRecord.sessionDate || getSessionDateFromSchedule(activeSchedule),
                sessionNumber: institutionRecord.sessionNumber != null
                  ? Number(institutionRecord.sessionNumber)
                  : resolveSessionNumberFromSchedule(activeSchedule),
                clientCondition: institutionRecord.clientCondition || '',
                mainIssues: institutionRecord.mainIssues || '',
                interventionMethods: institutionRecord.interventionMethods || '',
                clientResponse: institutionRecord.clientResponse || '',
                nextSessionPlan: institutionRecord.nextSessionPlan || '',
                homeworkAssigned: institutionRecord.homeworkAssigned || '',
                homeworkDueDate: '',
                riskAssessment: '',
                riskFactors: '',
                emergencyResponsePlan: '',
                progressEvaluation: institutionRecord.progressEvaluation || '',
                progressScore: 50,
                goalAchievement: '',
                goalAchievementDetails: '',
                consultantObservations: institutionRecord.consultantObservations || '',
                consultantAssessment: institutionRecord.consultantAssessment || '',
                specialConsiderations: institutionRecord.specialConsiderations || '',
                medicalInformation: '',
                medicationInfo: '',
                familyRelationships: '',
                socialSupport: '',
                environmentalFactors: '',
                sessionDurationMinutes: 60,
                isSessionCompleted: institutionRecord.isSessionCompleted ?? false,
                incompletionReason: '',
                nextSessionDate: '',
                followUpActions: '',
                followUpDueDate: ''
              });
            }
          }
        }

        if (!loadedRecord) {
        // 권한은 서버가 작성자(consultation_records.consultant_id)·같은 테넌트 관리자 기준으로 판정한다.
        const recordUrl = `/api/v1/schedules/consultation-records?consultationId=${activeSchedule.id}`;
        const recordResponse = await apiGet(recordUrl);
        const recordList = recordResponse?.records ?? recordResponse?.data?.records ?? (Array.isArray(recordResponse?.data) ? recordResponse.data : Array.isArray(recordResponse) ? recordResponse : []);
        const hasRecord = recordList.length > 0 && (recordResponse?.success !== false);
        if (hasRecord && recordList[0]) {
          const record = recordList[0];
          loadedRecord = record;
          setConsultationRecord(record);
          setIsEditMode(true);
          setFormData({
            sessionDate: record.sessionDate || getSessionDateFromSchedule(activeSchedule),
            sessionNumber: record.sessionNumber != null
              ? Number(record.sessionNumber)
              : resolveSessionNumberFromSchedule(activeSchedule),
            clientCondition: record.clientCondition || '',
            mainIssues: record.mainIssues || '',
            interventionMethods: record.interventionMethods || '',
            clientResponse: record.clientResponse || '',
            nextSessionPlan: record.nextSessionPlan || '',
            homeworkAssigned: record.homeworkAssigned || '',
            homeworkDueDate: record.homeworkDueDate || '',
            riskAssessment: normalizeRiskAssessmentForForm(record.riskAssessment),
            riskFactors: record.riskFactors || '',
            emergencyResponsePlan: record.emergencyResponsePlan || '',
            progressEvaluation: record.progressEvaluation || '',
            progressScore: record.progressScore ?? 50,
            goalAchievement: normalizeGoalAchievementForForm(record.goalAchievement),
            goalAchievementDetails: record.goalAchievementDetails || '',
            consultantObservations: record.consultantObservations || '',
            consultantAssessment: record.consultantAssessment || '',
            specialConsiderations: record.specialConsiderations || '',
            medicalInformation: record.medicalInformation || '',
            medicationInfo: record.medicationInfo || '',
            familyRelationships: record.familyRelationships || '',
            socialSupport: record.socialSupport || '',
            environmentalFactors: record.environmentalFactors || '',
            sessionDurationMinutes: record.sessionDurationMinutes ?? 60,
            isSessionCompleted: record.isSessionCompleted ?? false,
            incompletionReason: record.incompletionReason || '',
            nextSessionDate: record.nextSessionDate || '',
            followUpActions: record.followUpActions || '',
            followUpDueDate: record.followUpDueDate || ''
          });
        } else {

          let autoFillData = {};
          if (clientId) {
            try {
              const prevEndpoint = isAdmin
                ? `/api/v1/admin/consultation-records?clientId=${clientId}&page=0&size=1`
                : `/api/v1/schedules/consultation-records?clientId=${clientId}&page=0&size=1`;
              const prevRecords = await apiGet(prevEndpoint);
              const prevList = prevRecords?.content
                ?? prevRecords?.data?.content
                ?? prevRecords?.records
                ?? prevRecords?.data?.records
                ?? [];
              if (prevList.length > 0) {
                const latest = prevList[0];
                autoFillData = {
                  ...(latest.familyRelationships ? { familyRelationships: latest.familyRelationships } : {}),
                  ...(latest.socialSupport ? { socialSupport: latest.socialSupport } : {}),
                  ...(latest.medicalInformation ? { medicalInformation: latest.medicalInformation } : {})
                };
              }
            } catch (err) {
              console.warn('이전 상담일지 오토필 조회 실패:', err);
            }
          }
          setFormData(prev => ({
            ...prev,
            sessionDate: getSessionDateFromSchedule(activeSchedule),
            sessionNumber: resolveSessionNumberFromSchedule(activeSchedule),
            sessionDurationMinutes: 60,
            isSessionCompleted: hasScheduleSessionStarted(activeSchedule),
            ...Object.fromEntries(
              Object.entries(autoFillData).filter(([key]) => !prev[key])
            )
          }));
        }
        }
      } catch (error) {
        setFormData(prev => ({
          ...prev,
          sessionDate: getSessionDateFromSchedule(activeSchedule),
          sessionNumber: resolveSessionNumberFromSchedule(activeSchedule),
          sessionDurationMinutes: 60,
          isSessionCompleted: hasScheduleSessionStarted(activeSchedule)
        }));
      }

      const comments = [];
      if (activeSchedule?.notes && String(activeSchedule.notes).trim()) {
        comments.push({ source: t('common:consultant.ConsultationLogModal.t_c266f81d'), text: activeSchedule.notes });
      }
      if (loadedRecord?.specialConsiderations && String(loadedRecord.specialConsiderations).trim()) {
        comments.push({ source: t('common:consultant.ConsultationLogModal.t_e7bcdb2a'), text: loadedRecord.specialConsiderations });
      }
      setImportantComments(comments);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      notificationManager.show(t('common:consultant.ConsultationLogModal.t_3e5e7abe'), 'error');
    } finally {
      contentDirtyRef.current = false;
      setLoading(false);
    }
  };

  const handleMemoChange = (e) => {
    // BadgeSelect 등과 동일하게 stopPropagation 생략 가능
    notifyDirty();
    setMemoDraft(e?.target?.value ?? '');
    setMemoDirty(true);
  };

  const persistClientNotesIfNeeded = async() => {
    if (!memoDirty || !client?.id) {
      return;
    }
    if (isRestrictedClientProfileTier(clientWithStats?.visibilityTier)) {
      return;
    }
    const cid = Number(client.id);
    if (Number.isNaN(cid)) {
      return;
    }
    const base = `/api/v1/clients/${cid}/context-profile/notes`;
    const q = !isAdmin && user?.id != null ? `?consultantId=${encodeURIComponent(String(user.id))}` : '';
    const res = await StandardizedApi.put(`${base}${q}`, { notes: memoDraft });
    const nextNotes = res?.notes != null ? String(res.notes) : memoDraft;
    setClient((prev) => (prev ? { ...prev, notes: nextNotes } : prev));
    setClientWithStats((prev) => {
      if (!prev?.client) return prev;
      return { ...prev, client: { ...prev.client, notes: nextNotes } };
    });
    setMemoDirty(false);
  };

  const handleInputChange = (e) => {
    // BadgeSelect 등은 { target: { name, value } }만 넘김 — stopPropagation 없음
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const target = e?.target;
    if (!target?.name) return;
    const { name, value, type, checked } = target;
    contentDirtyRef.current = true;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const isInstitutionLinkLog = isInstitutionLinkConsultationLogContext(
    scheduleMetaRef.current || scheduleData,
    client,
    clientWithStats
  );

  const resolveLockedSessionNumber = () => {
    const fromSchedule = resolveSessionNumberFromSchedule(scheduleMetaRef.current || scheduleData);
    if (fromSchedule != null) {
      return fromSchedule;
    }
    return resolveSessionNumberFromSchedule({ sessionNumber: formData.sessionNumber });
  };

  const validateForm = () => {
    const lockedSessionNumber = resolveLockedSessionNumber();
    const errors = validateConsultationLogForm({
      formData,
      sessionNumber: lockedSessionNumber ?? formData.sessionNumber,
      isEditMode,
      isInstitutionLinkLog,
      messages: buildConsultationLogFormMessages(t)
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const notifyValidationFailure = () => {
    const lockedSessionNumber = resolveLockedSessionNumber();
    if (shouldBlockSaveForMissingSessionNumber(
      lockedSessionNumber ?? formData.sessionNumber,
      isEditMode
    ) && !isInstitutionLinkLog) {
      notificationManager.error(CONSULTATION_LOG_SESSION_NUMBER_STRINGS.REQUIRED_FOR_COMPLETE);
      return;
    }
    notificationManager.error(buildConsultationLogFormMessages(t).summary);
  };

  const handleSave = async() => {
    if (!validateForm()) {
      notifyValidationFailure();
      return;
    }

    try {
      setSaving(true);

      try {
        await persistClientNotesIfNeeded();
      } catch (memoErr) {
        notificationManager.show(toErrorMessage(memoErr, t('common:consultant.ConsultationLogModal.t_dbd13555')), 'error');
        return;
      }

      const activeSchedule = scheduleMetaRef.current || scheduleData;
      const lockedSessionNumber = resolveLockedSessionNumber();
      const consultationId = resolveConsultationScheduleId(activeSchedule)
        ?? (consultationRecord?.consultationId != null ? Number(consultationRecord.consultationId) : null)
        ?? (consultationRecord?.scheduleId != null ? Number(consultationRecord.scheduleId) : null);

      const routing = buildInstitutionLinkLogRoutingFields(activeSchedule, client);
      const recordData = {
        ...formData,
        sessionNumber: isInstitutionLinkLog
          ? (formData.sessionNumber != null ? Number(formData.sessionNumber) : null)
          : lockedSessionNumber,
        consultationId: consultationId,
        scheduleId: consultationId,
        clientId: client?.id ?? consultationRecord?.clientId,
        consultantId: activeSchedule?.consultantId != null ? Number(activeSchedule.consultantId) : (consultationRecord?.consultantId ?? user.id),
        isSessionCompleted: formData.isSessionCompleted ?? false,
        ...(isInstitutionLinkLog ? {
          mappingId: routing.mappingId,
          paymentTiming: routing.paymentTiming,
          engagementType: routing.engagementType
        } : {})
      };

      let response;
      if (isEditMode && consultationRecord) {
        if (isInstitutionLinkLog || consultationRecord._institutionLinkLog) {
          response = await StandardizedApi.put(
            `${INSTITUTION_LINK_CONSULTATION_RECORDS_API}/${consultationRecord.id}`,
            recordData
          );
        } else if (isAdmin) {
          response = await apiPut(`/api/v1/admin/consultation-records/${consultationRecord.id}`, recordData);
        } else {
          response = await apiPut(`/api/v1/schedules/consultation-records/${consultationRecord.id}`, recordData);
        }
      } else {
        response = await apiPost(API_SCHEDULES_CONSULTATION_RECORDS, recordData);
      }

      const recordRaw = response?.data ?? response;
      const record = (isInstitutionLinkLog || consultationRecord?._institutionLinkLog)
        ? (mapInstitutionLinkLogToConsultationRecord(recordRaw) || recordRaw)
        : recordRaw;
      const isSuccess = response && (response.success === true || (record && record.id != null));
      if (isSuccess && record) {
        notificationManager.show(
          isEditMode ? '상담일지가 수정되었습니다.' : t('common:consultant.ConsultationLogModal.t_41ce4bfb'),
          'success'
        );
        contentDirtyRef.current = false;
        await discardDraft();
        setConsultationRecord(record);
        // 같은 화면에서 다시 저장하면 새 일지를 또 만들지 않고 방금 저장한 일지를 수정한다.
        setIsEditMode(true);
        if (record.sessionNumber != null) {
          setFormData(prev => ({
            ...prev,
            sessionNumber: Number(record.sessionNumber)
          }));
        }
        onSave && onSave(record);
        if (recordId) {
          if (!memoDirty) releaseLeaveGuard();
          onClose && onClose();
        }
      } else {
        throw new Error(response?.message || t('common:consultant.ConsultationLogModal.t_8a91f40c'));
      }
    } catch (error) {
      console.error('저장 오류:', error);
      const validationToast = applyConsultationLogApiValidationErrors(error, setValidationErrors);
      if (validationToast != null) {
        notificationManager.show(
          toDisplayString(validationToast, t('common:consultant.ConsultationLogModal.t_fb06e15d')),
          'error'
        );
      } else {
        notificationManager.show(toErrorMessage(error, t('common:consultant.ConsultationLogModal.t_fb06e15d')), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async() => {
    if (!validateForm()) {
      notifyValidationFailure();
      return;
    }

    try {
      setSaving(true);

      try {
        await persistClientNotesIfNeeded();
      } catch (memoErr) {
        notificationManager.show(toErrorMessage(memoErr, t('common:consultant.ConsultationLogModal.t_dbd13555')), 'error');
        return;
      }

      const activeSchedule = scheduleMetaRef.current || scheduleData;
      const lockedSessionNumber = resolveLockedSessionNumber();
      const consultationId = resolveConsultationScheduleId(activeSchedule)
        ?? (consultationRecord?.consultationId != null ? Number(consultationRecord.consultationId) : null)
        ?? (consultationRecord?.scheduleId != null ? Number(consultationRecord.scheduleId) : null);

      const routing = buildInstitutionLinkLogRoutingFields(activeSchedule, client);
      const recordData = {
        ...formData,
        sessionNumber: isInstitutionLinkLog
          ? (formData.sessionNumber != null ? Number(formData.sessionNumber) : null)
          : lockedSessionNumber,
        consultationId: consultationId,
        scheduleId: consultationId,
        clientId: client?.id ?? consultationRecord?.clientId,
        consultantId: activeSchedule?.consultantId != null ? Number(activeSchedule.consultantId) : (consultationRecord?.consultantId ?? user.id),
        isSessionCompleted: true,
        completionTime: new Date().toISOString(),
        ...(isInstitutionLinkLog ? {
          mappingId: routing.mappingId,
          paymentTiming: routing.paymentTiming,
          engagementType: routing.engagementType
        } : {})
      };

      let response;
      if (isEditMode && consultationRecord) {
        if (isInstitutionLinkLog || consultationRecord._institutionLinkLog) {
          response = await StandardizedApi.put(
            `${INSTITUTION_LINK_CONSULTATION_RECORDS_API}/${consultationRecord.id}`,
            recordData
          );
        } else if (isAdmin) {
          response = await apiPut(`/api/v1/admin/consultation-records/${consultationRecord.id}`, recordData);
        } else {
          response = await apiPut(`/api/v1/schedules/consultation-records/${consultationRecord.id}`, recordData);
        }
      } else {
        response = await apiPost(API_SCHEDULES_CONSULTATION_RECORDS, recordData);
      }

      const recordRaw = response?.data ?? response;
      const record = (isInstitutionLinkLog || consultationRecord?._institutionLinkLog)
        ? (mapInstitutionLinkLogToConsultationRecord(recordRaw) || recordRaw)
        : recordRaw;
      const isSuccess = response && (response.success === true || (record && record.id != null));
      if (isSuccess && record) {
        if (record.isSessionCompleted === false) {
          notificationManager.show(CONSULTATION_LOG_AUTOSAVE_STRINGS.SAVED_BEFORE_SESSION_START, 'info');
        } else {
          notificationManager.show(t('common:consultant.ConsultationLogModal.t_b571e260'), 'success');
        }
        contentDirtyRef.current = false;
        await discardDraft();
        onSave && onSave(record);
        if (!memoDirty) releaseLeaveGuard();
        onClose();
      } else {
        throw new Error(response?.message || t('common:consultant.ConsultationLogModal.t_cbbfa91c'));
      }
    } catch (error) {
      console.error('완료 처리 오류:', error);
      if (isConsultationRecordDuplicateError(error)) {
        notificationManager.show(CONSULTATION_LOG_AUTOSAVE_STRINGS.DUPLICATE_RECORD_EXISTS, 'error');
        return;
      }
      const validationToast = applyConsultationLogApiValidationErrors(error, setValidationErrors);
      if (validationToast != null) {
        notificationManager.show(
          toDisplayString(validationToast, t('common:consultant.ConsultationLogModal.t_bb634bec')),
          'error'
        );
      } else {
        notificationManager.show(toErrorMessage(error, t('common:consultant.ConsultationLogModal.t_bb634bec')), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen && !restoreDraftConfirmOpen && !restoreOverwriteConfirmOpen
    && !closeWithoutSaveConfirmOpen && !conflictConfirmOpen) {
    return null;
  }

  const modalTitle = `상담일지 작성${isEditMode ? ' (수정 모드)' : ''}`;

  /** 닫기 직전 서버 초안으로 한 번 flush (실패 시 훅이 암호화 백업에 보관) */
  const finalizeCloseWithDraftFlush = () => {
    void saveDraftNow({ force: true });
    setMemoDirty(false);
    setCloseWithoutSaveConfirmOpen(false);
    // 방금 「저장하지 않고 닫기」를 확인받았으므로 라우트 이동 확인을 다시 띄우지 않는다.
    releaseLeaveGuard();
    onClose?.();
  };

  const modalFooter = (
    <div className="consultation-log-modal__footer-actions" role="group" aria-label="상담일지 작성 작업">
      <MGButton
        type="button"
        variant="ghost"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'ghost',
          size: 'md',
          loading: false,
          className: 'consultation-log-modal__footer-btn consultation-log-modal__footer-btn--cancel'
        })}
        onClick={requestClose}
        disabled={saving}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
      >
        {t('common.actions.cancel')}
      </MGButton>
      <MGButton
        type="button"
        variant="outline"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'outline',
          size: 'md',
          loading: saving,
          className: 'consultation-log-modal__footer-btn consultation-log-modal__footer-btn--save'
        })}
        onClick={handleSave}
        disabled={saving}
        loading={saving}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
      >
        저장
      </MGButton>
      <MGButton
        type="button"
        variant="primary"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'primary',
          size: 'md',
          loading: saving,
          className: 'consultation-log-modal__footer-btn consultation-log-modal__footer-btn--complete'
        })}
        onClick={handleComplete}
        disabled={saving}
        loading={saving}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
      >
        완료
      </MGButton>
    </div>
  );

  const modalSubtitle = scheduleData
    ? [scheduleData.clientName, scheduleData.sessionDate || scheduleData.date].filter(Boolean).join(' · ')
    : undefined;

  return (
    <>
    <ConfirmModal
      isOpen={restoreDraftConfirmOpen}
      title={CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_TITLE}
      message={toDisplayString(restoreDraftMessage, '')}
      confirmText={CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_CONFIRM}
      cancelText={CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_DISCARD}
      type="default"
      onConfirm={() => {
        restoreConfirmedRef.current = true;
        setRestoreDraftConfirmOpen(false);
        // 화면에 입력된 내용을 덮어쓰게 되므로 한 번 더 확인한다.
        setRestoreOverwriteConfirmOpen(true);
      }}
      onCancel={() => {
        // 「버리기」를 명시적으로 눌렀을 때만 서버 초안·브라우저 백업·레거시 키를 삭제한다.
        void discardDraft();
        setPendingRestoreDraft(null);
        setRestoreDraftConfirmOpen(false);
      }}
      onClose={() => {
        if (restoreConfirmedRef.current) {
          restoreConfirmedRef.current = false;
          return;
        }
        // ×·ESC·배경 클릭은 「나중에」 — 초안을 모두 남겨 두고 다음 진입 때 다시 묻는다.
        setPendingRestoreDraft(null);
        setRestoreDraftConfirmOpen(false);
      }}
    />
    <ConfirmModal
      isOpen={restoreOverwriteConfirmOpen}
      title={CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_OVERWRITE_TITLE}
      message={toDisplayString(CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_OVERWRITE_MESSAGE, '')}
      confirmText={CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_OVERWRITE_CONFIRM}
      cancelText={CONSULTATION_LOG_AUTOSAVE_STRINGS.RESTORE_OVERWRITE_CANCEL}
      type="warning"
      onConfirm={() => {
        overwriteConfirmedRef.current = true;
        applyRestoredDraftSnapshot(pendingRestoreDraft?.snapshot);
        resolveRestoreCandidate();
        setPendingRestoreDraft(null);
        setRestoreOverwriteConfirmOpen(false);
        restoreConfirmedRef.current = false;
      }}
      onClose={() => {
        if (overwriteConfirmedRef.current) {
          overwriteConfirmedRef.current = false;
          return;
        }
        // 덮어쓰기 취소는 복구·버리기 중 어느 쪽도 고르지 않은 보류다.
        // 서버 초안·레거시 초안을 모두 남겨 두고 다음 진입 때 다시 묻는다.
        setPendingRestoreDraft(null);
        setRestoreOverwriteConfirmOpen(false);
        restoreConfirmedRef.current = false;
      }}
    />
    <ConfirmModal
      isOpen={conflictConfirmOpen}
      title={CONSULTATION_LOG_AUTOSAVE_STRINGS.CONFLICT_TITLE}
      message={toDisplayString(CONSULTATION_LOG_AUTOSAVE_STRINGS.CONFLICT_MESSAGE, '')}
      confirmText={CONSULTATION_LOG_AUTOSAVE_STRINGS.CONFLICT_KEEP_MINE}
      cancelText={CONSULTATION_LOG_AUTOSAVE_STRINGS.CONFLICT_LOAD_LATEST}
      type="warning"
      onConfirm={() => {
        conflictResolvedRef.current = true;
        setConflictConfirmOpen(false);
        void keepMineOnConflict();
      }}
      onClose={() => {
        if (conflictResolvedRef.current) {
          conflictResolvedRef.current = false;
          return;
        }
        setConflictConfirmOpen(false);
        void (async() => {
          const latest = await loadLatestFromServer();
          applyRestoredDraftSnapshot(latest);
        })();
      }}
    />
    <ConfirmModal
      isOpen={closeWithoutSaveConfirmOpen}
      title={CONSULTATION_LOG_AUTOSAVE_STRINGS.CLOSE_UNSAVED_TITLE}
      message={toDisplayString(CONSULTATION_LOG_AUTOSAVE_STRINGS.CLOSE_UNSAVED_MESSAGE, '')}
      confirmText={CONSULTATION_LOG_AUTOSAVE_STRINGS.CLOSE_UNSAVED_CONFIRM}
      cancelText={CONSULTATION_LOG_AUTOSAVE_STRINGS.CLOSE_UNSAVED_CANCEL}
      type="warning"
      onConfirm={finalizeCloseWithDraftFlush}
      onClose={() => setCloseWithoutSaveConfirmOpen(false)}
    />
    <ConfirmModal
      isOpen={leaveBlocker?.state === 'blocked'}
      title={CONSULTATION_LOG_AUTOSAVE_STRINGS.LEAVE_TITLE}
      message={toDisplayString(CONSULTATION_LOG_AUTOSAVE_STRINGS.LEAVE_MESSAGE, '')}
      confirmText={CONSULTATION_LOG_AUTOSAVE_STRINGS.LEAVE_CONFIRM}
      cancelText={CONSULTATION_LOG_AUTOSAVE_STRINGS.LEAVE_CANCEL}
      type="warning"
      onConfirm={() => leaveBlocker?.proceed?.()}
      onClose={() => leaveBlocker?.reset?.()}
    />
    <UnifiedModal
      isOpen={isOpen}
      onClose={requestClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="fullscreen"
      className="mg-v2-clinic-os"
      showCloseButton={true}
      backdropClick={true}
      actions={modalFooter}
    >
      {isOpen ? (
      <div className="mg-v2-consultation-log-modal">
        {autosaveStatusText ? (
          <p
            className={[
              'mg-v2-text-sm mg-v2-consultation-log-modal__status',
              autosaveStatusIsError
                ? 'mg-v2-text-danger'
                : 'mg-v2-text-secondary'
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            {toDisplayString(autosaveStatusText, '')}
          </p>
        ) : null}
        <section
          className="mg-v2-modal-body"
          aria-label="상담일지 본문"
        >
          <ConsultationLogSessionHeaderMeta
            sessionNumber={formData.sessionNumber}
            sessionDateLabel={formData.sessionDate}
            institutionLink={isInstitutionLinkLog}
          />
          {isAdmin ? <ConsultationLogAdminWriteBadge record={consultationRecord} /> : null}

          <div className="mg-v2-consultation-log__layout">
            <aside className="mg-v2-consultation-log__sidebar">
              <div className="mg-v2-consultation-log__sidebar-inner">
                <div className="mg-v2-consultation-log__memo-sticky">
                  <div className="mg-accordion mg-v2-consultation-log-modal__accordion">
                    <ConsultationLogClientProfilePanel
                      expanded={accordionProfileOpen}
                      onExpandedChange={setAccordionProfileOpen}
                      client={client}
                      clientWithStats={clientWithStats}
                      visibilityTier={clientWithStats?.visibilityTier}
                      loading={loading}
                      hasValidScheduleClientId={hasValidScheduleClientId}
                      psychClientId={psychHookClientId}
                      memoDraft={memoDraft}
                      onMemoChange={handleMemoChange}
                      memoDirty={memoDirty}
                    />
                  </div>
                </div>
              </div>
            </aside>

            <div className="mg-v2-consultation-log__main">
              {loading ? (
                <div className="mg-v2-consultation-log__form-loading">
                  <div className="mg-loading">
                    {CONSULTATION_LOG_AUTOSAVE_STRINGS.FORM_LOADING}
                  </div>
                </div>
              ) : (
                <>
                  <ConsultationLogRequiredFieldsNotice
                    sessionNumberMissing={!isInstitutionLinkLog && resolveLockedSessionNumber() == null}
                  />

                  <ConsultationLogFormPanel
                    formData={formData}
                    handleInputChange={handleInputChange}
                    setFormData={setFormDataWithDirty}
                    validationErrors={validationErrors}
                    riskLevels={riskLevels}
                    goalAchievementLevels={goalAchievementLevels}
                    completionStatusOptions={completionStatusOptions}
                    loadingCodes={loadingCodes}
                  />
                </>
              )}

              <section
                className="mg-v2-consultation-log-modal__precautions-wrap"
                aria-label="주의사항"
              >
                <div className="mg-accordion mg-v2-consultation-log-modal__accordion">
                  <ConsultationLogPrecautionsPanel
                    expanded={accordionPrecautionsOpen}
                    onExpandedChange={setAccordionPrecautionsOpen}
                    importantComments={importantComments}
                  />
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
      ) : null}
    </UnifiedModal>
    </>
  );
};

export default ConsultationLogModal;