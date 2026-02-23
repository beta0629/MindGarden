import React, { useState, useEffect, useCallback } from 'react';
import { FileText, XCircle, Save, CheckCircle, User, AlertTriangle, Clock, Target } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';

/**
 * 상담일지 작성 모달 컴포넌트
/**
 * 스케줄 시간에 상담사가 내담자 정보를 보면서 상담일지를 작성할 수 있는 모달
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
  const [consultationRecord, setConsultationRecord] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [completionStatusOptions, setCompletionStatusOptions] = useState([]);
  const [loadingCompletionCodes, setLoadingCompletionCodes] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const loadPriorityCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/v1/common-codes/PRIORITY');
      if (response && response.length > 0) {
        const options = response.map(code => ({
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
      const response = await apiGet('/api/v1/common-codes/COMPLETION_STATUS');
      if (response && response.length > 0) {
        setCompletionStatusOptions(response.map((code, index) => ({
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

  useEffect(() => {
    if (isOpen && scheduleData) {
      loadData();
      loadPriorityCodes();
      loadCompletionStatusCodes();
      setFormData(prev => ({
        ...prev,
        sessionNumber: scheduleData.sessionNumber || 1, // 스케줄에서 세션 번호 가져오기
        isSessionCompleted: scheduleData.isSessionCompleted || false, // 스케줄에서 완료 여부 가져오기
        sessionDate: safeDateToString(scheduleData.startTime) // 스케줄 날짜로 설정
      }));
    }
  }, [isOpen, scheduleData]);

  const safeDateToString = (dateValue) => {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    
    try {
      if (typeof dateValue === 'string') {
        return dateValue.split('T')[0];
      } else if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      } else {
        return new Date(dateValue).toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('날짜 변환 오류:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (scheduleData.clientId) {
        const clientResponse = await apiGet(`/api/admin/users`);
        if (clientResponse.success) {
          const clientData = clientResponse.data.find(u => u.id === scheduleData.clientId);
          if (clientData) {
            setClient(clientData);
          }
        }
      }
      
      try {
        const recordResponse = await apiGet(`/api/schedules/consultation-records?consultantId=${user.id}&consultationId=${scheduleData.id}`);
        if (recordResponse.success && recordResponse.data.length > 0) {
          const record = recordResponse.data[0];
          setConsultationRecord(record);
          setIsEditMode(true);
          
          setFormData({
            sessionDate: record.sessionDate || safeDateToString(scheduleData.startTime),
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
            progressScore: record.progressScore || 50,
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
            sessionDurationMinutes: record.sessionDurationMinutes || 60,
            isSessionCompleted: record.isSessionCompleted || false,
            incompletionReason: record.incompletionReason || '',
            nextSessionDate: record.nextSessionDate || '',
            followUpActions: record.followUpActions || '',
            followUpDueDate: record.followUpDueDate || ''
          });
        } else {
          setFormData(prev => ({
            ...prev,
            sessionDate: safeDateToString(scheduleData.startTime),
            sessionDurationMinutes: 60,
            isSessionCompleted: true
          }));
        }
      } catch (error) {
        console.log('기존 상담일지 없음, 새로 작성');
      }
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
        response = await apiPut(`/api/schedules/consultation-records/${consultationRecord.id}`, recordData);
      } else {
        response = await apiPost(`/api/schedules/consultation-records`, recordData);
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
        response = await apiPut(`/api/schedules/consultation-records/${consultationRecord.id}`, recordData);
      } else {
        response = await apiPost(`/api/schedules/consultation-records`, recordData);
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
      className="mg-v2-ad-b0kla"
      backdropClick
      showCloseButton
      loading={loading}
      actions={
        <div className="mg-v2-modal-footer-inline" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="mg-v2-btn mg-v2-btn-secondary"
            disabled={saving}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="mg-v2-btn mg-v2-btn-primary"
            disabled={saving}
          >
            {saving ? '저장중...' : '💾 저장'}
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="mg-v2-btn mg-v2-btn-success"
            disabled={saving}
          >
            {saving ? '완료중...' : '✅ 완료'}
          </button>
        </div>
      }
    >
        <div className="mg-v2-modal-body" style={{ padding: '24px', backgroundColor: 'var(--mg-white)' }}>
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

          {/* 내담자 정보 */}
          {client && (
            <div className="mg-v2-bg-gray-50 mg-v2-p-lg mg-v2-radius-md mg-v2-border mg-v2-mb-xl">
              <h3 className="mg-v2-text-lg mg-v2-font-bold mg-flex mg-v2-items-center mg-v2-gap-sm mg-v2-mb-md">
                <User size={20} className="mg-v2-text-primary" />
                내담자 정보
              </h3>
              <div className="mg-flex mg-v2-flex-wrap mg-v2-gap-lg">
                <div className="mg-v2-flex mg-v2-flex-col mg-v2-gap-xs" style={{ flex: '1 1 120px' }}>
                  <span className="mg-v2-text-xs mg-v2-font-medium mg-v2-text-secondary">이름</span>
                  <span className="mg-v2-text-sm mg-v2-font-bold">{client.name}</span>
                </div>
                <div className="mg-v2-flex mg-v2-flex-col mg-v2-gap-xs" style={{ flex: '1 1 120px' }}>
                  <span className="mg-v2-text-xs mg-v2-font-medium mg-v2-text-secondary">나이/성별</span>
                  <span className="mg-v2-text-sm mg-v2-font-bold">
                    {client.age ? `${client.age}세` : '미입력'} / {client.gender === 'MALE' ? '남성' : client.gender === 'FEMALE' ? '여성' : '미입력'}
                  </span>
                </div>
                <div className="mg-v2-flex mg-v2-flex-col mg-v2-gap-xs" style={{ flex: '1 1 120px' }}>
                  <span className="mg-v2-text-xs mg-v2-font-medium mg-v2-text-secondary">연락처</span>
                  <span className="mg-v2-text-sm mg-v2-font-bold">{client.phone || '미입력'}</span>
                </div>
                <div className="mg-v2-flex mg-v2-flex-col mg-v2-gap-xs" style={{ flex: '1 1 120px' }}>
                  <span className="mg-v2-text-xs mg-v2-font-medium mg-v2-text-secondary">상담 목적</span>
                  <span className="mg-v2-text-sm mg-v2-font-bold">{client.consultationPurpose || '미입력'}</span>
                </div>
                <div className="mg-v2-flex mg-v2-flex-col mg-v2-gap-xs" style={{ flex: '1 1 120px' }}>
                  <span className="mg-v2-text-xs mg-v2-font-medium mg-v2-text-secondary">상담 유형</span>
                  <span className="mg-v2-text-sm mg-v2-font-bold">
                    {scheduleData.consultationType === 'INDIVIDUAL' ? '개인상담' :
                     scheduleData.consultationType === 'GROUP' ? '그룹상담' :
                     scheduleData.consultationType === 'COUPLE' ? '부부상담' :
                     scheduleData.consultationType === 'FAMILY' ? '가족상담' :
                     scheduleData.consultationType || '미입력'}
                  </span>
                </div>
              </div>
            </div>
          )}

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