import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { FileText, XCircle, Save, CheckCircle, User, AlertTriangle, Clock, Target } from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';

/**
 * 상담일지 작성 모달 컴포넌트
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

  // 우선순위 코드 로드
  const loadPriorityCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/common-codes/PRIORITY');
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
      // 실패 시 기본값 설정
      setPriorityOptions([
        { value: 'LOW', label: '낮음', icon: '🟢', color: '#28a745', description: '낮은 우선순위' },
        { value: 'MEDIUM', label: '보통', icon: '🟡', color: '#ffc107', description: '보통 우선순위' },
        { value: 'HIGH', label: '높음', icon: '🟠', color: '#fd7e14', description: '높은 우선순위' },
        { value: 'URGENT', label: '긴급', icon: '🔴', color: '#dc3545', description: '긴급 우선순위' },
        { value: 'CRITICAL', label: '위험', icon: '🚨', color: '#6f42c1', description: '위험 우선순위' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);
  
  // 상담일지 폼 데이터
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

  // 위험도 옵션 (우선순위 코드 사용)
  const riskLevels = priorityOptions;

  // 목표 달성도 옵션
  const goalAchievementLevels = [
    { value: 'LOW', label: '낮음', color: '#dc3545' },
    { value: 'MEDIUM', label: '보통', color: '#ffc107' },
    { value: 'HIGH', label: '높음', color: '#28a745' }
  ];

  // 완료 상태 코드 로드
  const loadCompletionStatusCodes = useCallback(async () => {
    try {
      setLoadingCompletionCodes(true);
      const response = await apiGet('/api/common-codes/COMPLETION_STATUS');
      if (response && response.length > 0) {
        setCompletionStatusOptions(response.map((code, index) => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon || '📋',
          color: code.colorCode,
          description: code.codeDescription
        })));
      } else {
        // 응답이 비어있을 때 기본값 설정
        setCompletionStatusOptions([
          { value: 'COMPLETED', label: '완료', icon: '✅', color: '#10b981', description: '작업 완료' },
          { value: 'PENDING', label: '대기', icon: '⏳', color: '#ffc107', description: '작업 대기' },
          { value: 'IN_PROGRESS', label: '진행중', icon: '🔄', color: '#17a2b8', description: '작업 진행중' },
          { value: 'CANCELLED', label: '취소', icon: '❌', color: '#ef4444', description: '작업 취소' }
        ]);
      }
    } catch (error) {
      console.error('완료 상태 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setCompletionStatusOptions([
        { value: 'COMPLETED', label: '완료', icon: '✅', color: '#10b981', description: '작업 완료' },
        { value: 'PENDING', label: '대기', icon: '⏳', color: '#ffc107', description: '작업 대기' },
        { value: 'IN_PROGRESS', label: '진행중', icon: '🔄', color: '#17a2b8', description: '작업 진행중' },
        { value: 'CANCELLED', label: '취소', icon: '❌', color: '#ef4444', description: '작업 취소' }
      ]);
    } finally {
      setLoadingCompletionCodes(false);
    }
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (isOpen && scheduleData) {
      loadData();
      loadPriorityCodes();
      loadCompletionStatusCodes();
      // 스케줄에서 세션 정보 자동 설정
      setFormData(prev => ({
        ...prev,
        sessionNumber: scheduleData.sessionNumber || 1, // 스케줄에서 세션 번호 가져오기
        isSessionCompleted: scheduleData.isSessionCompleted || false, // 스케줄에서 완료 여부 가져오기
        sessionDate: safeDateToString(scheduleData.startTime) // 스케줄 날짜로 설정
      }));
    }
  }, [isOpen, scheduleData]);

  // 안전한 날짜 변환 함수
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
      
      // 내담자 정보 로드
      if (scheduleData.clientId) {
        const clientResponse = await apiGet(`/api/admin/users`);
        if (clientResponse.success) {
          const clientData = clientResponse.data.find(u => u.id === scheduleData.clientId);
          if (clientData) {
            setClient(clientData);
          }
        }
      }
      
      // 기존 상담일지 로드
      try {
        const recordResponse = await apiGet(`/api/schedules/consultation-records?consultantId=${user.id}&consultationId=${scheduleData.id}`);
        if (recordResponse.success && recordResponse.data.length > 0) {
          const record = recordResponse.data[0];
          setConsultationRecord(record);
          setIsEditMode(true);
          
          // 폼 데이터 설정
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
          // 새 상담일지인 경우 기본값 설정
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
    
    // 입력 시 해당 필드의 검증 오류 제거
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 필수값 검증 함수
  const validateForm = () => {
    const errors = {};
    
    // 세션 시간 (분) - 필수
    if (!formData.sessionDurationMinutes || formData.sessionDurationMinutes < 1) {
      errors.sessionDurationMinutes = '세션 시간을 입력해주세요 (최소 1분)';
    }
    
    // 내담자 상태 - 필수
    if (!formData.clientCondition || formData.clientCondition.trim() === '') {
      errors.clientCondition = '내담자 상태를 입력해주세요';
    }
    
    // 주요 이슈 - 필수
    if (!formData.mainIssues || formData.mainIssues.trim() === '') {
      errors.mainIssues = '주요 이슈를 입력해주세요';
    }
    
    // 개입 방법 - 필수
    if (!formData.interventionMethods || formData.interventionMethods.trim() === '') {
      errors.interventionMethods = '개입 방법을 입력해주세요';
    }
    
    // 내담자 반응 - 필수
    if (!formData.clientResponse || formData.clientResponse.trim() === '') {
      errors.clientResponse = '내담자 반응을 입력해주세요';
    }
    
    // 위험도 평가 - 필수
    if (!formData.riskAssessment || formData.riskAssessment === '') {
      errors.riskAssessment = '위험도 평가를 선택해주세요';
    }
    
    // 진행 평가 - 필수
    if (!formData.progressEvaluation || formData.progressEvaluation.trim() === '') {
      errors.progressEvaluation = '진행 평가를 입력해주세요';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // 필수값 검증
    if (!validateForm()) {
      notificationManager.error('필수 항목을 모두 입력해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      
      // consultationId 파싱 (schedule-30 형태 처리)
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
    // 필수값 검증
    if (!validateForm()) {
      notificationManager.error('필수 항목을 모두 입력해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      
      // consultationId 파싱 (schedule-30 형태 처리)
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
        // 상담일지 완료 후 바로 모달 닫기
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

  const portalTarget = document.body || document.createElement('div');

  if (loading) {
    return ReactDOM.createPortal(
      <div className="mg-v2-modal-overlay">
        <div className="mg-v2-modal mg-v2-modal-large">
          <div className="mg-v2-modal-body">
            <div className="mg-v2-loading-overlay">
              <UnifiedLoading variant="pulse" size="large" text="데이터를 불러오는 중..." type="inline" />
            </div>
          </div>
        </div>
      </div>,
      portalTarget
    );
  }

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <FileText size={28} className="mg-v2-modal-title-icon" />
            <h2 className="mg-v2-modal-title">
              상담일지 작성
              {isEditMode && <span className="mg-v2-badge mg-v2-badge--info">수정 모드</span>}
            </h2>
          </div>
          <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
            <XCircle size={24} />
          </button>
        </div>

        <div className="mg-v2-modal-body">
          {/* 필수값 안내 */}
          <div className="mg-v2-alert mg-v2-alert--warning mg-v2-mb-md">
            <AlertTriangle size={20} className="mg-v2-section-title-icon" />
            <div>
              <strong>필수 입력 항목 안내</strong>
              <p>
                <span className="mg-v2-form-label-required">*</span> 표시된 항목은 반드시 입력해야 합니다.
                필수 항목: 세션 시간, 내담자 상태, 주요 이슈, 개입 방법, 내담자 반응, 위험도 평가, 진행 평가
              </p>
            </div>
          </div>

          {/* 내담자 정보 */}
          {client && (
            <div className="mg-v2-info-box mg-v2-mb-lg">
              <h3 className="mg-v2-info-box-title">
                <User size={20} className="mg-v2-section-title-icon" />
                내담자 정보
              </h3>
              <div className="mg-v2-info-grid">
                <div className="mg-v2-info-item">
                  <span className="mg-v2-info-label">이름</span>
                  <span className="mg-v2-info-value">{client.name}</span>
                </div>
                <div className="mg-v2-info-item">
                  <span className="mg-v2-info-label">나이</span>
                  <span className="mg-v2-info-value">{client.age ? `${client.age}세` : '미입력'}</span>
                </div>
                <div className="mg-v2-info-item">
                  <span className="mg-v2-info-label">성별</span>
                  <span className="mg-v2-info-value">
                    {client.gender === 'MALE' ? '남성' : 
                     client.gender === 'FEMALE' ? '여성' : 
                     client.gender || '미입력'}
                  </span>
                </div>
                <div className="mg-v2-info-item">
                  <span className="mg-v2-info-label">연락처</span>
                  <span className="mg-v2-info-value">{client.phone || '미입력'}</span>
                </div>
                <div className="mg-v2-info-item">
                  <span className="mg-v2-info-label">주소</span>
                  <span className="mg-v2-info-value">{client.address || '미입력'}</span>
                </div>
                <div className="mg-v2-info-item">
                  <span className="mg-v2-info-label">이메일</span>
                  <span className="mg-v2-info-value">{client.email || '미입력'}</span>
                </div>
                <div className="mg-v2-info-item">
                  <span className="mg-v2-info-label">상담 목적</span>
                  <span className="mg-v2-info-value">{client.consultationPurpose || '미입력'}</span>
                </div>
                <div className="mg-v2-info-item">
                  <span className="mg-v2-info-label">상담 유형</span>
                  <span className="mg-v2-info-value">
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
            <h3 className="mg-v2-section-title">
              <FileText size={20} className="mg-v2-section-title-icon" />
              상담일지 작성
            </h3>
            
            <div className="mg-v2-form-grid">
              {/* 기본 정보 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">세션 일자 *</label>
                <input
                  type="date"
                  name="sessionDate"
                  value={formData.sessionDate}
                  onChange={handleInputChange}
                  className="mg-v2-form-input"
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'not-allowed'
                  }}
                  required
                  disabled
                />
                <small className="mg-v2-text-xs mg-v2-text-secondary" style={{ marginTop: '4px', display: 'block' }}>
                  스케줄에서 선택한 날짜로 고정됩니다
                </small>
              </div>
              
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">세션 번호</label>
                <input
                  type="number"
                  name="sessionNumber"
                  value={formData.sessionNumber}
                  onChange={handleInputChange}
                  min="1"
                  disabled={true}
                  className="mg-v2-form-input"
                  style={{
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    cursor: 'not-allowed'
                  }}
                />
                <small className="mg-v2-text-xs mg-v2-text-secondary">
                  스케줄에서 자동으로 설정됩니다
                </small>
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">
                  세션 시간 (분) <span className="mg-form-required">*</span>
                </label>
                <input
                  type="number"
                  name="sessionDurationMinutes"
                  value={formData.sessionDurationMinutes}
                  onChange={handleInputChange}
                  min="1"
                  max="180"
                  className="mg-v2-form-input"
                  style={{
                    borderColor: validationErrors.sessionDurationMinutes ? '#dc3545' : '#ced4da'
                  }}
                  required
                />
                {validationErrors.sessionDurationMinutes && (
                  <small className="mg-v2-text-xs mg-v2-text-danger" style={{ marginTop: '4px', display: 'block' }}>
                    {validationErrors.sessionDurationMinutes}
                  </small>
                )}
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">세션 완료 여부</label>
                <select
                  name="isSessionCompleted"
                  value={formData.isSessionCompleted}
                  onChange={handleInputChange}
                  disabled={true}
                  style={{
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    cursor: 'not-allowed'
                  }}
                >
                  {completionStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                <small className="mg-v2-text-xs mg-v2-text-secondary">
                  스케줄에서 자동으로 설정됩니다
                </small>
              </div>

              {/* 내담자 상태 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">
                  내담자 상태 <span className="mg-form-required">*</span>
                </label>
                <textarea
                  name="clientCondition"
                  value={formData.clientCondition}
                  onChange={handleInputChange}
                  placeholder="내담자의 현재 상태를 기록해주세요."
                  style={{
                    borderColor: validationErrors.clientCondition ? '#dc3545' : '#ced4da'
                  }}
                  required
                />
                {validationErrors.clientCondition && (
                  <small className="mg-v2-text-xs mg-v2-text-danger" style={{ marginTop: '4px', display: 'block' }}>
                    {validationErrors.clientCondition}
                  </small>
                )}
              </div>

              {/* 주요 이슈 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">
                  주요 이슈 <span className="mg-form-required">*</span>
                </label>
                <textarea
                  name="mainIssues"
                  value={formData.mainIssues}
                  onChange={handleInputChange}
                  placeholder="이번 세션에서 다룬 주요 이슈를 기록해주세요."
                  style={{
                    borderColor: validationErrors.mainIssues ? '#dc3545' : '#ced4da'
                  }}
                  required
                />
                {validationErrors.mainIssues && (
                  <small className="mg-v2-text-xs mg-v2-text-danger" style={{ marginTop: '4px', display: 'block' }}>
                    {validationErrors.mainIssues}
                  </small>
                )}
              </div>

              {/* 개입 방법 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">
                  개입 방법 <span className="mg-form-required">*</span>
                </label>
                <textarea
                  name="interventionMethods"
                  value={formData.interventionMethods}
                  onChange={handleInputChange}
                  placeholder="사용한 상담 기법이나 개입 방법을 기록해주세요."
                  style={{
                    borderColor: validationErrors.interventionMethods ? '#dc3545' : '#ced4da'
                  }}
                  required
                />
                {validationErrors.interventionMethods && (
                  <small className="mg-v2-text-xs mg-v2-text-danger" style={{ marginTop: '4px', display: 'block' }}>
                    {validationErrors.interventionMethods}
                  </small>
                )}
              </div>

              {/* 내담자 반응 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">
                  내담자 반응 <span className="mg-form-required">*</span>
                </label>
                <textarea
                  name="clientResponse"
                  value={formData.clientResponse}
                  onChange={handleInputChange}
                  placeholder="내담자의 반응이나 변화를 기록해주세요."
                  style={{
                    borderColor: validationErrors.clientResponse ? '#dc3545' : '#ced4da'
                  }}
                  required
                />
                {validationErrors.clientResponse && (
                  <small className="mg-v2-text-xs mg-v2-text-danger" style={{ marginTop: '4px', display: 'block' }}>
                    {validationErrors.clientResponse}
                  </small>
                )}
              </div>

              {/* 다음 세션 계획 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">다음 세션 계획</label>
                <textarea
                  name="nextSessionPlan"
                  value={formData.nextSessionPlan}
                  onChange={handleInputChange}
                  placeholder="다음 세션에서 다룰 내용을 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 과제 부여 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">과제 부여</label>
                <textarea
                  name="homeworkAssigned"
                  value={formData.homeworkAssigned}
                  onChange={handleInputChange}
                  placeholder="부여한 과제나 숙제를 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">과제 제출 기한</label>
                <input
                  type="date"
                  name="homeworkDueDate"
                  value={formData.homeworkDueDate}
                  onChange={handleInputChange}
                  className="mg-v2-form-input"
                />
              </div>

              {/* 위험도 평가 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">
                  위험도 평가 <span className="mg-form-required">*</span>
                </label>
                <select
                  name="riskAssessment"
                  value={formData.riskAssessment}
                  onChange={handleInputChange}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    borderColor: validationErrors.riskAssessment ? '#dc3545' : '#ced4da'
                  }}
                  disabled={loadingCodes}
                  required
                >
                  <option value="">위험도를 선택하세요</option>
                  {riskLevels.map(level => (
                    <option key={level.value} value={level.value} style={{color: level.color}}>
                      {level.icon} {level.label}
                    </option>
                  ))}
                </select>
                {validationErrors.riskAssessment && (
                  <small className="mg-v2-text-xs mg-v2-text-danger" style={{ marginTop: '4px', display: 'block' }}>
                    {validationErrors.riskAssessment}
                  </small>
                )}
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">위험 요인</label>
                <textarea
                  name="riskFactors"
                  value={formData.riskFactors}
                  onChange={handleInputChange}
                  placeholder="발견된 위험 요인을 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">응급 대응 계획</label>
                <textarea
                  name="emergencyResponsePlan"
                  value={formData.emergencyResponsePlan}
                  onChange={handleInputChange}
                  placeholder="응급 상황 시 대응 계획을 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 진행 평가 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">
                  진행 평가 <span className="mg-form-required">*</span>
                </label>
                <textarea
                  name="progressEvaluation"
                  value={formData.progressEvaluation}
                  onChange={handleInputChange}
                  placeholder="전반적인 진행 상황을 평가해주세요."
                  style={{
                    borderColor: validationErrors.progressEvaluation ? '#dc3545' : '#ced4da'
                  }}
                  required
                />
                {validationErrors.progressEvaluation && (
                  <small className="mg-v2-text-xs mg-v2-text-danger" style={{ marginTop: '4px', display: 'block' }}>
                    {validationErrors.progressEvaluation}
                  </small>
                )}
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">진행 점수 (0-100)</label>
                <input
                  type="range"
                  name="progressScore"
                  value={formData.progressScore}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="mg-v2-form-input"
                />
                <span style={{fontSize: 'var(--font-size-xs)', color: '#6c757d'}}>{formData.progressScore}점</span>
              </div>

              {/* 목표 달성도 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">목표 달성도</label>
                <select
                  name="goalAchievement"
                  value={formData.goalAchievement}
                  onChange={handleInputChange}
                  className="mg-v2-form-select"
                >
                  {goalAchievementLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">목표 달성 세부사항</label>
                <textarea
                  name="goalAchievementDetails"
                  value={formData.goalAchievementDetails}
                  onChange={handleInputChange}
                  placeholder="목표 달성에 대한 구체적인 내용을 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 상담사 관찰 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">상담사 관찰</label>
                <textarea
                  name="consultantObservations"
                  value={formData.consultantObservations}
                  onChange={handleInputChange}
                  placeholder="내담자에 대한 관찰 내용을 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 상담사 평가 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">상담사 평가</label>
                <textarea
                  name="consultantAssessment"
                  value={formData.consultantAssessment}
                  onChange={handleInputChange}
                  placeholder="전문적인 관점에서의 평가를 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 특별 고려사항 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">특별 고려사항</label>
                <textarea
                  name="specialConsiderations"
                  value={formData.specialConsiderations}
                  onChange={handleInputChange}
                  placeholder="특별히 고려해야 할 사항을 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 의료 정보 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">의료 정보</label>
                <textarea
                  name="medicalInformation"
                  value={formData.medicalInformation}
                  onChange={handleInputChange}
                  placeholder="관련 의료 정보를 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">복용 약물</label>
                <textarea
                  name="medicationInfo"
                  value={formData.medicationInfo}
                  onChange={handleInputChange}
                  placeholder="복용 중인 약물 정보를 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 가족 관계 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">가족 관계</label>
                <textarea
                  name="familyRelationships"
                  value={formData.familyRelationships}
                  onChange={handleInputChange}
                  placeholder="가족 관계에 대한 정보를 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 사회적 지지 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">사회적 지지</label>
                <textarea
                  name="socialSupport"
                  value={formData.socialSupport}
                  onChange={handleInputChange}
                  placeholder="사회적 지지 체계에 대한 정보를 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 환경적 요인 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">환경적 요인</label>
                <textarea
                  name="environmentalFactors"
                  value={formData.environmentalFactors}
                  onChange={handleInputChange}
                  placeholder="환경적 요인에 대한 정보를 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              {/* 미완료 사유 */}
              {!formData.isSessionCompleted && (
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">미완료 사유</label>
                  <textarea
                    name="incompletionReason"
                    value={formData.incompletionReason}
                    onChange={handleInputChange}
                    placeholder="세션이 미완료된 사유를 기록해주세요."
                    className="mg-v2-form-textarea"
                  />
                </div>
              )}

              {/* 다음 세션 일정 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">다음 세션 일정</label>
                <input
                  type="date"
                  name="nextSessionDate"
                  value={formData.nextSessionDate}
                  onChange={handleInputChange}
                  className="mg-v2-form-input"
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'not-allowed'
                  }}
                  disabled
                />
                <small className="mg-v2-text-xs mg-v2-text-secondary" style={{ marginTop: '4px', display: 'block' }}>
                  관리자가 스케줄에서 지정합니다
                </small>
              </div>

              {/* 후속 조치사항 */}
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">후속 조치사항</label>
                <textarea
                  name="followUpActions"
                  value={formData.followUpActions}
                  onChange={handleInputChange}
                  placeholder="후속 조치가 필요한 사항을 기록해주세요."
                  className="mg-v2-form-textarea"
                />
              </div>

              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">후속 조치 기한</label>
                <input
                  type="date"
                  name="followUpDueDate"
                  value={formData.followUpDueDate}
                  onChange={handleInputChange}
                  className="mg-v2-form-input"
                />
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="mg-v2-modal-footer">
              <button
                type="button"
                onClick={onClose}
                className="mg-v2-btn mg-v2-btn--secondary"
                disabled={saving}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="mg-v2-btn mg-v2-btn--primary"
                disabled={saving}
              >
                {saving ? <UnifiedLoading variant="dots" size="small" type="inline" /> : '💾 저장'}
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="mg-v2-btn mg-v2-btn--success"
                disabled={saving}
              >
                {saving ? <UnifiedLoading variant="dots" size="small" type="inline" /> : '✅ 완료'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default ConsultationLogModal;