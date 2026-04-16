import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import StandardizedApi from '../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { isRestrictedClientProfileTier } from '../../constants/clientProfileContext';
import notificationManager from '../../utils/notification';
import { toDisplayString, toErrorMessage } from '../../utils/safeDisplay';
import UnifiedModal from '../common/modals/UnifiedModal';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import '../schedule/ScheduleB0KlA.css';
import ConsultationLogClientProfilePanel from './organisms/ConsultationLogClientProfilePanel';
import ConsultationLogPrecautionsPanel from './organisms/ConsultationLogPrecautionsPanel';
import ConsultationLogFormPanel from './organisms/ConsultationLogFormPanel';
import ConsultationLogRequiredFieldsNotice from './molecules/ConsultationLogRequiredFieldsNotice';
import ConsultationLogSessionHeaderMeta from './molecules/ConsultationLogSessionHeaderMeta';

/** PRIORITY 공통코드가 비어 있거나 로드 실패 시 — 목표 달성도와 동일하게 칩으로 바로 선택 */
const DEFAULT_RISK_LEVEL_OPTIONS = [
  { value: 'LOW', label: '낮음', icon: '🟢', color: 'var(--mg-success-500)', description: '낮은 우선순위' },
  { value: 'MEDIUM', label: '보통', icon: '🟡', color: 'var(--mg-warning-500)', description: '보통 우선순위' },
  { value: 'HIGH', label: '높음', icon: '🟠', color: 'var(--mg-warning-600)', description: '높은 우선순위' },
  { value: 'URGENT', label: '긴급', icon: '🔴', color: 'var(--mg-error-500)', description: '긴급 우선순위' },
  /** 긴급(🔴)과 구분: 원형 이모지 통일 */
  { value: 'CRITICAL', label: '위험', icon: '🟣', color: 'var(--mg-color-secondary-main)', description: '치명적 위험' }
];

/** API codeLabel이 영문이어도 UI는 항상 한글·동일 아이콘 */
const PRIORITY_DISPLAY_BY_VALUE = DEFAULT_RISK_LEVEL_OPTIONS.reduce((acc, row) => {
  acc[row.value] = { label: row.label, icon: row.icon };
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
  isAdmin = false
}) => {
  const { user } = useSession();

  const [loading, setLoading] = useState(false);
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
  /** 심리검사 문서 목록 — clientId 있을 때만 로드 */
  const [psychDocuments, setPsychDocuments] = useState([]);
  const [loadingPsych, setLoadingPsych] = useState(false);
  /** 중요 코멘트 수집: 내담자 notes, 일정 notes, 이전 일지 특이사항 등 */
  const [importantComments, setImportantComments] = useState([]);
  const [accordionProfileOpen, setAccordionProfileOpen] = useState(true);
  const [accordionPrecautionsOpen, setAccordionPrecautionsOpen] = useState(true);
  const [memoDraft, setMemoDraft] = useState('');
  const [memoDirty, setMemoDirty] = useState(false);

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
      const response = await apiGet('/api/v1/common-codes?codeGroup=PRIORITY');
      const list = response?.codes ?? [];
      if (list.length > 0) {
        const options = list
          .map((code) => {
            const v = String(code.codeValue ?? '');
            const preset = PRIORITY_DISPLAY_BY_VALUE[v];
            return {
              value: v,
              label: preset?.label ?? code.koreanName ?? code.codeLabel ?? v,
              icon: preset?.icon ?? code.icon,
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
    sessionNumber: 1,
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

  /** 일정에 유효한 내담자 ID가 있는지 (빈 문자열/NaN 제외) */
  const hasValidScheduleClientId = useMemo(() => {
    const raw = scheduleData?.clientId;
    if (raw == null || raw === '') return false;
    const n = typeof raw === 'number' ? raw : parseInt(raw, 10);
    return !Number.isNaN(n);
  }, [scheduleData?.clientId]);

  const riskLevels = priorityOptions;

  const goalAchievementLevels = [
    { value: 'LOW', label: '낮음', color: 'var(--mg-error-500)' },
    { value: 'MEDIUM', label: '보통', color: 'var(--mg-warning-500)' },
    { value: 'HIGH', label: '높음', color: 'var(--mg-success-500)' }
  ];

  const loadCompletionStatusCodes = useCallback(async() => {
    try {
      setLoadingCompletionCodes(true);
      const response = await apiGet('/api/v1/common-codes?codeGroup=COMPLETION_STATUS');
      const list = response?.codes ?? [];
      if (list.length > 0) {
        setCompletionStatusOptions(list.map((code, index) => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon || '📋',
          color: code.colorCode,
          description: code.codeDescription
        })));
      } else {
        setCompletionStatusOptions([
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'COMPLETED', label: '완료', icon: '✅', color: 'var(--mg-success-500)', description: '작업 완료' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'PENDING', label: '대기', icon: '⏳', color: 'var(--mg-warning-500)', description: '작업 대기' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'IN_PROGRESS', label: '진행중', icon: '🔄', color: 'var(--mg-info-500)', description: '작업 진행중' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          { value: 'CANCELLED', label: '취소', icon: '❌', color: 'var(--mg-error-500)', description: '작업 취소' }
        ]);
      }
    } catch (error) {
      console.error('완료 상태 코드 로드 실패:', error);
      setCompletionStatusOptions([
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'COMPLETED', label: '완료', icon: '✅', color: 'var(--mg-success-500)', description: '작업 완료' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'PENDING', label: '대기', icon: '⏳', color: 'var(--mg-warning-500)', description: '작업 대기' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'IN_PROGRESS', label: '진행중', icon: '🔄', color: 'var(--mg-info-500)', description: '작업 진행중' },
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        { value: 'CANCELLED', label: '취소', icon: '❌', color: 'var(--mg-error-500)', description: '작업 취소' }
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

  useEffect(() => {
    if (isOpen && recordId) {
      loadDataByRecordId();
      loadPriorityCodes();
      loadCompletionStatusCodes();
    }
  }, [isOpen, recordId]);

  useEffect(() => {
    if (isOpen && scheduleData && !recordId) {
      loadData();
      loadPriorityCodes();
      loadCompletionStatusCodes();
      setFormData(prev => ({
        ...prev,
        sessionNumber: scheduleData.sessionNumber || 1,
        isSessionCompleted: scheduleData.isSessionCompleted || false,
        sessionDate: getSessionDateFromSchedule(scheduleData)
      }));
    }
  }, [isOpen, scheduleData, recordId]);

  const loadDataByRecordId = async() => {
    if (!recordId || !user?.id) return;
    try {
      setLoading(true);
      setClientWithStats(null);
      setClient(null);
      setConsultationRecord(null);
      setImportantComments([]);
      setPsychDocuments([]);

      let record = null;
      if (isAdmin) {
        const res = await apiGet(`/api/v1/admin/consultation-records/${recordId}`);
        record = res?.data ?? res;
      } else {
        const res = await apiGet(`/api/v1/admin/consultant-records/${user.id}/consultation-records/${recordId}`);
        record = res?.data ?? res;
      }

      if (!record) {
        notificationManager.show('상담일지를 찾을 수 없습니다.', 'error');
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
            name: record.clientName || `내담자 #${cId}`,
            email: record.clientEmail || '',
            phone: record.clientPhone || ''
          });
          setClientWithStats({ 
            client: { 
              id: cId, 
              name: record.clientName || `내담자 #${cId}`,
              email: record.clientEmail || '',
              phone: record.clientPhone || ''
            } 
          });
        }
        setLoadingPsych(true);
        try {
          const psychRes = await apiGet(`/api/v1/assessments/psych/documents/by-client/${cId}`);
          const list = Array.isArray(psychRes) ? psychRes : (psychRes?.data && Array.isArray(psychRes.data) ? psychRes.data : []);
          setPsychDocuments(list);
        } catch (e) {
          setPsychDocuments([]);
        } finally {
          setLoadingPsych(false);
        }
      }

      const sessionDateStr = record.sessionDate || record.consultationDate;
      const sessionDate = typeof sessionDateStr === 'string' ? sessionDateStr.split('T')[0] : sessionDateStr;

      setConsultationRecord(record);
      setIsEditMode(true);
      setFormData({
        sessionDate: sessionDate || '',
        sessionNumber: record.sessionNumber ?? 1,
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
        comments.push({ source: '이전 상담일지 특이사항', text: record.specialConsiderations });
      }
      setImportantComments(comments);
    } catch (error) {
      console.error('상담일지 단건 로드 오류:', error);
      notificationManager.show('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async() => {
    try {
      setLoading(true);
      setClientWithStats(null);
      setClient(null);
      setImportantComments([]);
      setPsychDocuments([]);

      const rawClientId = scheduleData?.clientId;
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
          if (isAdmin && (err?.status === 403 || err?.message?.includes('권한'))) {
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

        setLoadingPsych(true);
        try {
          const psychRes = await apiGet(`/api/v1/assessments/psych/documents/by-client/${clientId}`);
          const list = Array.isArray(psychRes) ? psychRes : (psychRes?.data && Array.isArray(psychRes.data) ? psychRes.data : []);
          setPsychDocuments(list);
        } catch (e) {
          setPsychDocuments([]);
        } finally {
          setLoadingPsych(false);
        }
      }

      let loadedRecord = null;
      try {
        const recordResponse = await apiGet(`/api/v1/schedules/consultation-records?consultantId=${user.id}&consultationId=${scheduleData.id}`);
        const recordList = recordResponse?.records ?? recordResponse?.data?.records ?? (Array.isArray(recordResponse?.data) ? recordResponse.data : Array.isArray(recordResponse) ? recordResponse : []);
        const hasRecord = recordList.length > 0 && (recordResponse?.success !== false);
        if (hasRecord && recordList[0]) {
          const record = recordList[0];
          loadedRecord = record;
          setConsultationRecord(record);
          setIsEditMode(true);
          setFormData({
            sessionDate: record.sessionDate || getSessionDateFromSchedule(scheduleData),
            sessionNumber: record.sessionNumber || 1,
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
          setFormData(prev => ({
            ...prev,
            sessionDate: getSessionDateFromSchedule(scheduleData),
            sessionDurationMinutes: 60,
            isSessionCompleted: true
          }));
        }
      } catch (error) {
        setFormData(prev => ({
          ...prev,
          sessionDate: getSessionDateFromSchedule(scheduleData),
          sessionDurationMinutes: 60,
          isSessionCompleted: true
        }));
      }

      const comments = [];
      if (scheduleData?.notes && String(scheduleData.notes).trim()) {
        comments.push({ source: '일정 메모', text: scheduleData.notes });
      }
      if (loadedRecord?.specialConsiderations && String(loadedRecord.specialConsiderations).trim()) {
        comments.push({ source: '이전 상담일지 특이사항', text: loadedRecord.specialConsiderations });
      }
      setImportantComments(comments);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      notificationManager.show('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMemoChange = (e) => {
    // BadgeSelect 등과 동일하게 stopPropagation 생략 가능
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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.sessionDurationMinutes || formData.sessionDurationMinutes < 1) {
      errors.sessionDurationMinutes = '세션 시간을 입력해주세요 (최소 1분)';
    }
    
    if (!formData.clientCondition || formData.clientCondition.trim() === '') {
      errors.clientCondition = '내담자 상태를 입력해주세요';
    }
    
    if (!formData.mainIssues || formData.mainIssues.trim() === '') {
      errors.mainIssues = '주요 이슈를 입력해주세요';
    }
    
    if (!formData.interventionMethods || formData.interventionMethods.trim() === '') {
      errors.interventionMethods = '개입 방법을 입력해주세요';
    }
    
    if (!formData.clientResponse || formData.clientResponse.trim() === '') {
      errors.clientResponse = '내담자 반응을 입력해주세요';
    }
    
    if (!formData.riskAssessment || formData.riskAssessment === '') {
      errors.riskAssessment = '위험도 평가를 선택해주세요';
    }
    
    if (!formData.progressEvaluation || formData.progressEvaluation.trim() === '') {
      errors.progressEvaluation = '진행 평가를 입력해주세요';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async() => {
    if (!validateForm()) {
      notificationManager.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);

      try {
        await persistClientNotesIfNeeded();
      } catch (memoErr) {
        notificationManager.show(toErrorMessage(memoErr, '메모 저장에 실패했습니다.'), 'error');
        return;
      }

      const consultationId = scheduleData?.id
        ? (typeof scheduleData.id === 'string' && scheduleData.id.startsWith('schedule-')
            ? parseInt(scheduleData.id.replace('schedule-', ''), 10)
            : parseInt(scheduleData.id, 10))
        : (consultationRecord?.consultationId != null ? Number(consultationRecord.consultationId) : null);

      const recordData = {
        ...formData,
        consultationId: consultationId,
        clientId: client?.id ?? consultationRecord?.clientId,
        consultantId: scheduleData?.consultantId != null ? Number(scheduleData.consultantId) : (consultationRecord?.consultantId ?? user.id),
        isSessionCompleted: formData.isSessionCompleted ?? false
      };

      let response;
      if (isEditMode && consultationRecord) {
        if (isAdmin) {
          response = await apiPut(`/api/v1/admin/consultation-records/${consultationRecord.id}`, recordData);
        } else {
          response = await apiPut(`/api/v1/schedules/consultation-records/${consultationRecord.id}`, recordData);
        }
      } else {
        response = await apiPost('/api/v1/schedules/consultation-records', recordData);
      }

      const record = response?.data ?? response;
      const isSuccess = response && (response.success === true || (record && record.id != null));
      if (isSuccess && record) {
        notificationManager.show(
          isEditMode ? '상담일지가 수정되었습니다.' : '상담일지가 저장되었습니다.',
          'success'
        );
        setConsultationRecord(record);
        onSave && onSave(record);
        if (recordId) onClose && onClose();
      } else {
        throw new Error(response?.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      notificationManager.show('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async() => {
    if (!validateForm()) {
      notificationManager.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);

      try {
        await persistClientNotesIfNeeded();
      } catch (memoErr) {
        notificationManager.show(toErrorMessage(memoErr, '메모 저장에 실패했습니다.'), 'error');
        return;
      }

      const consultationId = scheduleData?.id
        ? (typeof scheduleData.id === 'string' && scheduleData.id.startsWith('schedule-')
            ? parseInt(scheduleData.id.replace('schedule-', ''), 10)
            : parseInt(scheduleData.id, 10))
        : (consultationRecord?.consultationId != null ? Number(consultationRecord.consultationId) : null);

      const recordData = {
        ...formData,
        consultationId: consultationId,
        clientId: client?.id ?? consultationRecord?.clientId,
        consultantId: scheduleData?.consultantId != null ? Number(scheduleData.consultantId) : (consultationRecord?.consultantId ?? user.id),
        isSessionCompleted: true,
        completionTime: new Date().toISOString()
      };

      let response;
      if (isEditMode && consultationRecord) {
        if (isAdmin) {
          response = await apiPut(`/api/v1/admin/consultation-records/${consultationRecord.id}`, recordData);
        } else {
          response = await apiPut(`/api/v1/schedules/consultation-records/${consultationRecord.id}`, recordData);
        }
      } else {
        response = await apiPost('/api/v1/schedules/consultation-records', recordData);
      }

      const record = response?.data ?? response;
      const isSuccess = response && (response.success === true || (record && record.id != null));
      if (isSuccess && record) {
        notificationManager.show('상담일지가 완료되었습니다.', 'success');
        onSave && onSave(record);
        onClose();
      } else {
        throw new Error(response?.message || '완료 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('완료 처리 오류:', error);
      notificationManager.show('완료 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = `상담일지 작성${isEditMode ? ' (수정 모드)' : ''}`;

  const modalFooter = (
    <>
      <MGButton
        type="button"
        variant="outline"
        size="medium"
        className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onClose}
        disabled={saving}
        preventDoubleClick={false}
      >
        취소
      </MGButton>
      <MGButton
        type="button"
        variant="primary"
        size="medium"
        className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: saving })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={handleSave}
        disabled={saving}
        loading={saving}
        preventDoubleClick={false}
      >
        💾 저장
      </MGButton>
      <MGButton
        type="button"
        variant="success"
        size="medium"
        className={buildErpMgButtonClassName({ variant: 'success', size: 'md', loading: saving })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={handleComplete}
        disabled={saving}
        loading={saving}
        preventDoubleClick={false}
      >
        ✅ 완료
      </MGButton>
    </>
  );

  const modalSubtitle = scheduleData
    ? [scheduleData.clientName, scheduleData.sessionDate || scheduleData.date].filter(Boolean).join(' · ')
    : undefined;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="fullscreen"
      className="mg-v2-ad-b0kla"
      showCloseButton={true}
      backdropClick={true}
      actions={modalFooter}
    >
      <div className="mg-v2-consultation-log-modal">
        {saving && (
          <p
            className="mg-v2-text-sm mg-v2-text-secondary mg-v2-consultation-log-modal__status"
            role="status"
            aria-live="polite"
          >
            저장 중...
          </p>
        )}
        <section
          className="mg-v2-modal-body"
          aria-label="상담일지 본문"
        >
          <ConsultationLogSessionHeaderMeta
            sessionNumber={formData.sessionNumber}
            sessionDateLabel={formData.sessionDate}
          />

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
                      psychDocuments={psychDocuments}
                      loadingPsych={loadingPsych}
                      memoDraft={memoDraft}
                      onMemoChange={handleMemoChange}
                      memoDirty={memoDirty}
                    />
                  </div>
                </div>
              </div>
            </aside>

            <div className="mg-v2-consultation-log__main">
              <ConsultationLogFormPanel
                formData={formData}
                handleInputChange={handleInputChange}
                setFormData={setFormData}
                validationErrors={validationErrors}
                riskLevels={riskLevels}
                goalAchievementLevels={goalAchievementLevels}
                completionStatusOptions={completionStatusOptions}
                loadingCodes={loadingCodes}
              />

              <ConsultationLogRequiredFieldsNotice />

              <section
                className="mg-v2-ad-modal__section mg-v2-consultation-log-modal__precautions-wrap"
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
    </UnifiedModal>
  );
};

export default ConsultationLogModal;