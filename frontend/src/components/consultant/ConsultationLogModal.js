import React, { useState, useEffect, useCallback } from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';
import Button from '../ui/Button';
import { getUserStatusKoreanNameSync } from '../../utils/codeHelper';

/** 심리검사 요약/권고 문장에서 "위험"·"주의"·"권고" 키워드를 굵은 텍스트+색상으로 강조 */
function renderTextWithKeywordHighlight(text) {
  if (!text || typeof text !== 'string') return null;
  const parts = text.split(/(위험|주의|권고)/g);
  return parts.map((part, i) => {
    if (part === '위험') {
      return <strong key={i} style={{ color: 'var(--mg-error-500)', fontWeight: 600 }}>위험</strong>;
    }
    if (part === '주의') {
      return <strong key={i} style={{ color: 'var(--mg-warning-500)', fontWeight: 600 }}>주의</strong>;
    }
    if (part === '권고') {
      return <strong key={i} style={{ color: 'var(--mg-color-primary-main)', fontWeight: 600 }}>권고</strong>;
    }
    return part;
  });
}

/**
 * 상담일지 작성 모달 컴포넌트
 * 스케줄 시간에 상담사가 내담자 정보를 보면서 상담일지를 작성할 수 있는 큰 모달(Large).
 * 상단 고정: 내담자 프로필 요약 → 중요 코멘트 → 심리검사(있을 때) → 상담일지 폼.
 */
const ConsultationLogModal = ({
  isOpen,
  onClose,
  scheduleData,
  onSave
}) => {
  const { user } = useSession();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState(null);
  /** with-stats 전체 응답(client, statistics, currentConsultants 등) — 권한 있을 때만 채워짐 */
  const [clientWithStats, setClientWithStats] = useState(null);
  const [consultationRecord, setConsultationRecord] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [completionStatusOptions, setCompletionStatusOptions] = useState([]);
  const [loadingCompletionCodes, setLoadingCompletionCodes] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  /** 심리검사 문서 목록 — clientId 있을 때만 로드 */
  const [psychDocuments, setPsychDocuments] = useState([]);
  const [loadingPsych, setLoadingPsych] = useState(false);
  /** 중요 코멘트 수집: 내담자 notes, 일정 notes, 이전 일지 특이사항 등 */
  const [importantComments, setImportantComments] = useState([]);

  const loadPriorityCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/v1/common-codes?codeGroup=PRIORITY');
      const list = response?.codes ?? [];
      if (list.length > 0) {
        const options = list.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        }));
        setPriorityOptions(options);
      }
    } catch (error) {
      console.error('우선순위 코드 로드 실패:', error);
      setPriorityOptions([
        { value: 'LOW', label: '낮음', icon: '🟢', color: 'var(--mg-success-500)', description: '낮은 우선순위' },
        { value: 'MEDIUM', label: '보통', icon: '🟡', color: 'var(--mg-warning-500)', description: '보통 우선순위' },
        { value: 'HIGH', label: '높음', icon: '🟠', color: '#fd7e14', description: '높은 우선순위' },
        { value: 'URGENT', label: '긴급', icon: '🔴', color: 'var(--mg-error-500)', description: '긴급 우선순위' },
        { value: 'CRITICAL', label: '위험', icon: '🚨', color: '#6f42c1', description: '위험 우선순위' }
      ]);
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

  const riskLevels = priorityOptions;

  const goalAchievementLevels = [
    { value: 'LOW', label: '낮음', color: 'var(--mg-error-500)' },
    { value: 'MEDIUM', label: '보통', color: 'var(--mg-warning-500)' },
    { value: 'HIGH', label: '높음', color: 'var(--mg-success-500)' }
  ];

  const loadCompletionStatusCodes = useCallback(async () => {
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
    if (isOpen && scheduleData) {
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
  }, [isOpen, scheduleData]);

  const loadData = async () => {
    try {
      setLoading(true);
      setClientWithStats(null);
      setClient(null);
      setImportantComments([]);
      setPsychDocuments([]);

      const clientId = scheduleData?.clientId ? (typeof scheduleData.clientId === 'number' ? scheduleData.clientId : parseInt(scheduleData.clientId, 10)) : null;
      let withStatsData = null;
      if (clientId) {
        try {
          const withStatsRes = await apiGet(`/api/v1/admin/clients/with-stats/${clientId}`);
          const payload = withStatsRes?.data != null ? withStatsRes.data : withStatsRes;
          const clientData = payload?.client ?? withStatsRes?.client;
          if (payload && clientData) {
            withStatsData = payload;
            setClientWithStats(payload);
            setClient(clientData);
          }
        } catch (err) {
          if (err?.status === 403 || err?.message?.includes('권한')) {
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
            riskAssessment: record.riskAssessment || 'LOW',
            riskFactors: record.riskFactors || '',
            emergencyResponsePlan: record.emergencyResponsePlan || '',
            progressEvaluation: record.progressEvaluation || '',
            progressScore: record.progressScore ?? 50,
            goalAchievement: record.goalAchievement || 'MEDIUM',
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
      const clientForNotes = withStatsData?.client || null;
      if (clientForNotes?.notes && String(clientForNotes.notes).trim()) {
        comments.push({ source: '내담자 메모', text: clientForNotes.notes });
      }
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

  const handleInputChange = (e) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    const { name, value, type, checked } = e.target;
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

  const handleSave = async () => {
    if (!validateForm()) {
      notificationManager.error('필수 항목을 모두 입력해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      
      const consultationId = scheduleData.id ? 
        (typeof scheduleData.id === 'string' && scheduleData.id.startsWith('schedule-') ? 
          parseInt(scheduleData.id.replace('schedule-', '')) : 
          parseInt(scheduleData.id)) : 
        null;

      const recordData = {
        ...formData,
        consultationId: consultationId,
        clientId: client?.id,
        consultantId: user.id,
        isSessionCompleted: false
      };

      console.log('📝 상담일지 저장 데이터:', recordData);

      let response;
      if (isEditMode && consultationRecord) {
        response = await apiPut(`/api/v1/schedules/consultation-records/${consultationRecord.id}`, recordData);
      } else {
        response = await apiPost(`/api/v1/schedules/consultation-records`, recordData);
      }

      if (response.success) {
        notificationManager.show(
          isEditMode ? '상담일지가 수정되었습니다.' : '상담일지가 저장되었습니다.',
          'success'
        );
        setConsultationRecord(response.data);
        onSave && onSave(response.data);
      } else {
        throw new Error(response.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      notificationManager.show('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      notificationManager.error('필수 항목을 모두 입력해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      
      const consultationId = scheduleData.id ? 
        (typeof scheduleData.id === 'string' && scheduleData.id.startsWith('schedule-') ? 
          parseInt(scheduleData.id.replace('schedule-', '')) : 
          parseInt(scheduleData.id)) : 
        null;

      const recordData = {
        ...formData,
        consultationId: consultationId,
        clientId: client?.id,
        consultantId: user.id,
        isSessionCompleted: true,
        completionTime: new Date().toISOString()
      };

      console.log('📝 상담일지 완료 데이터:', recordData);

      let response;
      if (isEditMode && consultationRecord) {
        response = await apiPut(`/api/v1/schedules/consultation-records/${consultationRecord.id}`, recordData);
      } else {
        response = await apiPost(`/api/v1/schedules/consultation-records`, recordData);
      }

      if (response.success) {
        notificationManager.show('상담일지가 완료되었습니다.', 'success');
        onSave && onSave(response.data);
        onClose();
      } else {
        throw new Error(response.message || '완료 처리에 실패했습니다.');
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

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="large"
      className="mg-v2-ad-b0kla mg-modal--consultation-log"
      backdropClick
      showCloseButton
      loading={loading}
      actions={
        <div className="mg-modal__actions mg-v2-modal-footer-inline">
          <Button
            type="button"
            variant="outline"
            size="medium"
            onClick={onClose}
            disabled={saving}
            preventDoubleClick={false}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="primary"
            size="medium"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            loadingText="저장중..."
            preventDoubleClick={false}
          >
            {saving ? '저장중...' : '💾 저장'}
          </Button>
          <Button
            type="button"
            variant="success"
            size="medium"
            onClick={handleComplete}
            disabled={saving}
            loading={saving}
            loadingText="완료중..."
            preventDoubleClick={false}
          >
            {saving ? '완료중...' : '✅ 완료'}
          </Button>
        </div>
      }
    >
        <div
          className="mg-v2-modal-body"
          style={{
            padding: 'var(--mg-spacing-lg, 24px)',
            background: 'var(--mg-color-background-main, #FAF9F7)',
            backgroundColor: '#FAF9F7',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}
        >
          {/* 상단 고정(Sticky) 영역: 내담자 프로필 → 중요 코멘트 → 심리검사 */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              background: 'var(--mg-color-background-main, #FAF9F7)',
              backgroundColor: '#FAF9F7',
              paddingBottom: 'var(--mg-spacing-lg, 24px)'
            }}
          >
            {/* (1) 내담자 프로필 요약 블록 — clientId 없으면 안내, 로딩 중이면 로딩 문구 */}
            {scheduleData?.clientId == null || scheduleData?.clientId === '' ? (
              <div
                style={{
                  background: 'var(--mg-color-surface-main)',
                  border: '1px solid var(--mg-color-border-main)',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 16,
                  borderLeft: '4px solid var(--mg-color-border-main)'
                }}
              >
                <p style={{ fontSize: 14, color: 'var(--mg-color-text-secondary)', margin: 0 }}>
                  내담자 정보를 불러올 수 없습니다 (일정에 내담자가 연결되지 않았습니다).
                </p>
              </div>
            ) : loading && !client ? (
              <div
                style={{
                  background: 'var(--mg-color-surface-main)',
                  border: '1px solid var(--mg-color-border-main)',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 16,
                  borderLeft: '4px solid var(--mg-color-primary-main)'
                }}
              >
                <p style={{ fontSize: 14, color: 'var(--mg-color-text-secondary)', margin: 0 }}>
                  내담자 정보 로딩 중...
                </p>
              </div>
            ) : scheduleData?.clientId != null && scheduleData?.clientId !== '' && !client ? (
              <div
                style={{
                  background: 'var(--mg-color-surface-main)',
                  border: '1px solid var(--mg-color-border-main)',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 16,
                  borderLeft: '4px solid var(--mg-color-border-main)'
                }}
              >
                <p style={{ fontSize: 14, color: 'var(--mg-color-text-secondary)', margin: 0 }}>
                  내담자 정보를 불러올 수 없습니다.
                </p>
              </div>
            ) : client ? (
              <div
                style={{
                  background: 'var(--mg-color-surface-main, var(--mg-gray-50))',
                  border: '1px solid var(--mg-color-border-main, var(--mg-gray-200))',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 16,
                  borderLeft: '4px solid var(--mg-color-primary-main, var(--mg-primary-500))'
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--mg-color-text-main, var(--mg-gray-800))', marginBottom: 16 }}>
                  내담자 프로필
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))' }}>이름</span>
                    <div style={{ fontSize: 14, color: 'var(--mg-color-text-main, var(--mg-gray-800))' }}>{client.name || '—'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))' }}>연락처(전화)</span>
                    <div style={{ fontSize: 14, color: 'var(--mg-color-text-main, var(--mg-gray-800))' }}>
                      {(client.phone || client.phoneNumber || client.mobile || '').toString().trim() || '—'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))' }}>이메일</span>
                    <div style={{ fontSize: 14, color: 'var(--mg-color-text-main, var(--mg-gray-800))' }}>{client.email || '—'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))' }}>성별</span>
                    <div style={{ fontSize: 14, color: 'var(--mg-color-text-main, var(--mg-gray-800))' }}>
                      {client.gender === 'MALE' ? '남성' : client.gender === 'FEMALE' ? '여성' : client.gender || '—'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))' }}>등급/상태</span>
                    <div style={{ fontSize: 14, color: 'var(--mg-color-text-main, var(--mg-gray-800))' }}>
                      {(() => {
                        const gradeLabel = client.grade === 'BRONZE' ? '브론즈' : client.grade === 'SILVER' ? '실버' : client.grade === 'GOLD' ? '골드' : client.grade === 'PLATINUM' ? '플래티넘' : client.grade || '';
                        const statusLabel = client.status ? getUserStatusKoreanNameSync(client.status) : '';
                        if (gradeLabel && statusLabel) return `${gradeLabel} / ${statusLabel}`;
                        if (gradeLabel) return gradeLabel;
                        if (statusLabel) return statusLabel;
                        return '—';
                      })()}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))' }}>메모 요약</span>
                    <div style={{ fontSize: 14, color: 'var(--mg-color-text-main, var(--mg-gray-800))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                      {client.notes ? (client.notes.length > 80 ? client.notes.slice(0, 80) + '…' : client.notes) : '—'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))' }}>주소 요약</span>
                    <div style={{ fontSize: 14, color: 'var(--mg-color-text-main, var(--mg-gray-800))' }}>
                      {[client.postalCode, client.address, client.addressDetail].filter(Boolean).join(' ') || '—'}
                    </div>
                  </div>
                  {clientWithStats && (
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))' }}>매칭·패키지 요약</span>
                      <div style={{ fontSize: 14, color: 'var(--mg-color-text-main, var(--mg-gray-800))' }}>
                        연결 상담사 {clientWithStats.currentConsultants ?? 0}명
                        {clientWithStats.statistics?.totalSessions != null && ` / 총 세션 ${clientWithStats.statistics.totalSessions}회`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* (2) 중요 코멘트 블록 */}
            <div
              style={{
                background: 'var(--mg-warning-50, var(--cs-warning-50))',
                border: '1px solid var(--mg-color-border-main, var(--mg-gray-200))',
                borderLeft: '4px solid var(--mg-color-accent-main, var(--mg-warning-500))',
                borderRadius: 16,
                padding: 24,
                marginBottom: 16
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--mg-color-text-main, var(--mg-gray-800))', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} style={{ color: 'var(--mg-color-accent-main, var(--mg-warning-500))', flexShrink: 0 }} />
                상담 시 주의사항
              </h3>
              {importantComments.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))', margin: 0 }}>주의사항 없음</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--mg-color-text-main, var(--mg-gray-800))' }}>
                  {importantComments.map((item, idx) => (
                    <li key={`${item.source}-${idx}`} style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary, var(--mg-gray-600))' }}>[{item.source}]</span> {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* (3) 심리검사 블록 — 있을 때만. 요약·위험도·핵심 해석 우선 노출, 뱃지·굵은 텍스트 강조 */}
            {psychDocuments.length > 0 && (
              <div
                style={{
                  background: 'var(--mg-color-surface-main)',
                  border: '1px solid var(--mg-color-border-main)',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 16,
                  borderLeft: '4px solid var(--mg-color-secondary-main)'
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--mg-color-text-main)', marginBottom: 16 }}>
                  심리검사
                </h3>
                {loadingPsych ? (
                  <p style={{ fontSize: 14, color: 'var(--mg-color-text-secondary)' }}>로딩 중...</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {psychDocuments.map((doc, idx) => {
                      const summaryText = doc.summarySection || doc.reportSummary || null;
                      const hasRisk = [summaryText, doc.keyFindings, doc.recommendationSection]
                        .filter(Boolean).some(t => String(t).includes('위험'));
                      const hasCaution = [summaryText, doc.keyFindings, doc.recommendationSection]
                        .filter(Boolean).some(t => String(t).includes('주의'));
                      const isLast = idx === psychDocuments.length - 1;
                      return (
                        <li
                          key={doc.documentId}
                          style={{
                            padding: '12px 0',
                            borderBottom: isLast ? 'none' : '1px solid var(--mg-color-border-main)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            <a
                              href={`/admin/psych-assessment?documentId=${doc.documentId}`}
                              style={{ fontSize: 14, color: 'var(--mg-color-primary-main)', fontWeight: 600, textDecoration: 'none' }}
                              onMouseOver={(e) => { e.target.style.textDecoration = 'underline'; }}
                              onMouseOut={(e) => { e.target.style.textDecoration = 'none'; }}
                              onFocus={(e) => { e.target.style.textDecoration = 'underline'; }}
                              onBlur={(e) => { e.target.style.textDecoration = 'none'; }}
                            >
                              {doc.originalFilename || `심리검사 문서 #${doc.documentId}`}
                            </a>
                            {hasRisk && (
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: 'var(--mg-error-500)',
                                  background: 'var(--cs-error-50)',
                                  padding: '2px 8px',
                                  borderRadius: 6
                                }}
                              >
                                위험
                              </span>
                            )}
                            {hasCaution && !hasRisk && (
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: 'var(--mg-warning-500)',
                                  background: 'var(--cs-warning-50)',
                                  padding: '2px 8px',
                                  borderRadius: 6
                                }}
                              >
                                주의
                              </span>
                            )}
                          </div>
                          {summaryText && (
                            <p style={{ fontSize: 14, color: 'var(--mg-color-text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                              {renderTextWithKeywordHighlight(summaryText)}
                            </p>
                          )}
                          {doc.keyFindings && (
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary)', fontWeight: 600 }}>핵심 해석</span>
                              <p style={{ fontSize: 14, color: 'var(--mg-color-text-main)', fontWeight: 600, margin: '4px 0 0', lineHeight: 1.5 }}>
                                {renderTextWithKeywordHighlight(doc.keyFindings)}
                              </p>
                            </div>
                          )}
                          {doc.recommendationSection && (
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ fontSize: 12, color: 'var(--mg-color-text-secondary)', fontWeight: 600 }}>권고</span>
                              <p style={{ fontSize: 14, color: 'var(--mg-color-text-main)', margin: '4px 0 0', lineHeight: 1.5 }}>
                                {renderTextWithKeywordHighlight(doc.recommendationSection)}
                              </p>
                            </div>
                          )}
                          <a
                            href={`/admin/psych-assessment?documentId=${doc.documentId}`}
                            style={{ fontSize: 13, color: 'var(--mg-color-primary-main)', textDecoration: 'none' }}
                            onMouseOver={(e) => { e.target.style.textDecoration = 'underline'; }}
                            onMouseOut={(e) => { e.target.style.textDecoration = 'none'; }}
                            onFocus={(e) => { e.target.style.textDecoration = 'underline'; }}
                            onBlur={(e) => { e.target.style.textDecoration = 'none'; }}
                          >
                            상세 보기 →
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 필수값 안내 */}
          <div className="mg-v2-bg-yellow-50 mg-v2-p-md mg-v2-radius-md mg-v2-border mg-v2-border-yellow-200 mg-flex mg-v2-items-start mg-v2-gap-sm mg-v2-mb-lg">
            <AlertTriangle size={20} className="mg-v2-text-warning mg-v2-mt-xs" />
            <div>
              <strong className="mg-v2-text-warning mg-v2-font-bold">필수 입력 항목 안내</strong>
              <p className="mg-v2-text-sm mg-v2-text-secondary mg-v2-mt-xs">
                <span className="mg-v2-text-danger">*</span> 표시된 항목은 반드시 입력해야 합니다.<br/>
                필수 항목: 세션 시간, 내담자 상태, 주요 이슈, 개입 방법, 내담자 반응, 위험도 평가, 진행 평가
              </p>
            </div>
          </div>

          {/* 상담일지 작성 폼 */}
          <div className="mg-v2-form-section">
            <h3 className="mg-v2-text-lg mg-v2-font-bold mg-flex mg-v2-items-center mg-v2-gap-sm mg-v2-mb-lg mg-v2-border-b mg-v2-pb-sm">
              <FileText size={20} className="mg-v2-text-primary" />
              상담일지 작성
            </h3>
            
            <div className="mg-v2-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* 기본 정보 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">세션 일자 *</label>
                <input
                  type="date"
                  name="sessionDate"
                  value={formData.sessionDate}
                  onChange={handleInputChange}
                  className="mg-v2-input mg-v2-w-full"
                  style={{ backgroundColor: 'var(--mg-gray-100)', cursor: 'not-allowed' }}
                  required
                  disabled
                />
              </div>
              
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">세션 번호</label>
                <input
                  type="number"
                  name="sessionNumber"
                  value={formData.sessionNumber}
                  onChange={handleInputChange}
                  min="1"
                  disabled={true}
                  className="mg-v2-input mg-v2-w-full"
                  style={{ backgroundColor: 'var(--mg-gray-100)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-label">세션 시간 (분) *</label>
                <input
                  type="number"
                  name="sessionDurationMinutes"
                  value={formData.sessionDurationMinutes}
                  onChange={handleInputChange}
                  min="1"
                  max="180"
                  className="mg-v2-input mg-v2-w-full"
                  style={{ borderColor: validationErrors.sessionDurationMinutes ? 'var(--mg-error-500)' : '' }}
                  required
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-label">세션 완료 여부</label>
                <select
                  name="isSessionCompleted"
                  value={formData.isSessionCompleted}
                  onChange={handleInputChange}
                  disabled={true}
                  className="mg-v2-input mg-v2-w-full"
                  style={{ backgroundColor: 'var(--mg-gray-100)', cursor: 'not-allowed' }}
                >
                  {completionStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* 내담자 상태 */}
              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">내담자 상태 *</label>
                <textarea
                  name="clientCondition"
                  value={formData.clientCondition}
                  onChange={handleInputChange}
                  placeholder="내담자의 현재 상태를 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px', borderColor: validationErrors.clientCondition ? 'var(--mg-error-500)' : '' }}
                  required
                />
              </div>

              {/* 주요 이슈 */}
              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">주요 이슈 *</label>
                <textarea
                  name="mainIssues"
                  value={formData.mainIssues}
                  onChange={handleInputChange}
                  placeholder="이번 세션에서 다룬 주요 이슈를 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px', borderColor: validationErrors.mainIssues ? 'var(--mg-error-500)' : '' }}
                  required
                />
              </div>

              {/* 개입 방법 */}
              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">개입 방법 *</label>
                <textarea
                  name="interventionMethods"
                  value={formData.interventionMethods}
                  onChange={handleInputChange}
                  placeholder="사용한 상담 기법이나 개입 방법을 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px', borderColor: validationErrors.interventionMethods ? 'var(--mg-error-500)' : '' }}
                  required
                />
              </div>

              {/* 내담자 반응 */}
              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">내담자 반응 *</label>
                <textarea
                  name="clientResponse"
                  value={formData.clientResponse}
                  onChange={handleInputChange}
                  placeholder="내담자의 반응이나 변화를 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px', borderColor: validationErrors.clientResponse ? 'var(--mg-error-500)' : '' }}
                  required
                />
              </div>

              {/* 다음 세션 계획 */}
              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">다음 세션 계획</label>
                <textarea
                  name="nextSessionPlan"
                  value={formData.nextSessionPlan}
                  onChange={handleInputChange}
                  placeholder="다음 세션에서 다룰 내용을 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              {/* 과제 부여 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">과제 부여</label>
                <textarea
                  name="homeworkAssigned"
                  value={formData.homeworkAssigned}
                  onChange={handleInputChange}
                  placeholder="부여한 과제나 숙제를 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-label">과제 제출 기한</label>
                <input
                  type="date"
                  name="homeworkDueDate"
                  value={formData.homeworkDueDate}
                  onChange={handleInputChange}
                  className="mg-v2-input mg-v2-w-full"
                />
              </div>

              {/* 위험도 평가 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">위험도 평가 *</label>
                <select
                  name="riskAssessment"
                  value={formData.riskAssessment}
                  onChange={handleInputChange}
                  onClick={(e) => e.stopPropagation()}
                  className="mg-v2-input mg-v2-w-full"
                  style={{ borderColor: validationErrors.riskAssessment ? 'var(--mg-error-500)' : '' }}
                  disabled={loadingCodes}
                  required
                >
                  <option value="">위험도를 선택하세요</option>
                  {riskLevels.map(level => (
                    <option key={level.value} value={level.value} style={{color: level.color}}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-label">위험 요인</label>
                <textarea
                  name="riskFactors"
                  value={formData.riskFactors}
                  onChange={handleInputChange}
                  placeholder="발견된 위험 요인을 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-label">응급 대응 계획</label>
                <textarea
                  name="emergencyResponsePlan"
                  value={formData.emergencyResponsePlan}
                  onChange={handleInputChange}
                  placeholder="응급 상황 시 대응 계획을 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              {/* 진행 평가 */}
              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">진행 평가 *</label>
                <textarea
                  name="progressEvaluation"
                  value={formData.progressEvaluation}
                  onChange={handleInputChange}
                  placeholder="전반적인 진행 상황을 평가해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px', borderColor: validationErrors.progressEvaluation ? 'var(--mg-error-500)' : '' }}
                  required
                />
              </div>

              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">진행 점수 ({formData.progressScore}점)</label>
                <input
                  type="range"
                  name="progressScore"
                  value={formData.progressScore}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="mg-v2-input mg-v2-w-full"
                />
              </div>

              {/* 목표 달성도 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">목표 달성도</label>
                <select
                  name="goalAchievement"
                  value={formData.goalAchievement}
                  onChange={handleInputChange}
                  className="mg-v2-input mg-v2-w-full"
                >
                  {goalAchievementLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">목표 달성 세부사항</label>
                <textarea
                  name="goalAchievementDetails"
                  value={formData.goalAchievementDetails}
                  onChange={handleInputChange}
                  placeholder="목표 달성에 대한 구체적인 내용을 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              {/* 상담사 관찰 */}
              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">상담사 관찰</label>
                <textarea
                  name="consultantObservations"
                  value={formData.consultantObservations}
                  onChange={handleInputChange}
                  placeholder="내담자에 대한 관찰 내용을 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              {/* 상담사 평가 */}
              <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="mg-v2-label">상담사 평가</label>
                <textarea
                  name="consultantAssessment"
                  value={formData.consultantAssessment}
                  onChange={handleInputChange}
                  placeholder="전문적인 관점에서의 평가를 기록해주세요."
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              {/* 환경/사회/가족 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">가족 관계</label>
                <textarea
                  name="familyRelationships"
                  value={formData.familyRelationships}
                  onChange={handleInputChange}
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-label">사회적 지지</label>
                <textarea
                  name="socialSupport"
                  value={formData.socialSupport}
                  onChange={handleInputChange}
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-label">의료/복용 약물</label>
                <textarea
                  name="medicalInformation"
                  value={formData.medicalInformation}
                  onChange={handleInputChange}
                  className="mg-v2-input mg-v2-w-full"
                  style={{ minHeight: '80px' }}
                />
              </div>

              {/* 미완료 사유 */}
              {!formData.isSessionCompleted && (
                <div className="mg-v2-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="mg-v2-label">미완료 사유</label>
                  <textarea
                    name="incompletionReason"
                    value={formData.incompletionReason}
                    onChange={handleInputChange}
                    placeholder="세션이 미완료된 사유를 기록해주세요."
                    className="mg-v2-input mg-v2-w-full"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
    </UnifiedModal>
  );
};

export default ConsultationLogModal;