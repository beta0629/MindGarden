import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import LoadingSpinner from '../common/LoadingSpinner';
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

  // 우선순위 코드 로드
  const loadPriorityCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/common-codes/group/PRIORITY');
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
      const response = await apiGet('/api/common-codes/group/COMPLETION_STATUS');
      if (response && response.length > 0) {
        setCompletionStatusOptions(response.map(code => ({
          value: code.codeValue === 'COMPLETED' ? true : false,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        })));
      }
    } catch (error) {
      console.error('완료 상태 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setCompletionStatusOptions([
        { value: true, label: '완료', icon: '✅', color: '#10b981', description: '작업 완료' },
        { value: false, label: '미완료', icon: '❌', color: '#ef4444', description: '작업 미완료' }
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
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

  // 컴포넌트 스타일
  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      width: '95%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      position: 'relative'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 24px',
      borderBottom: '1px solid #e9ecef',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px 12px 0 0'
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6c757d',
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    },
    content: {
      padding: '24px'
    },
    clientInfo: {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      border: '1px solid #e9ecef'
    },
    clientInfoTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#495057',
      marginBottom: '12px'
    },
    clientInfoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px'
    },
    clientInfoItem: {
      display: 'flex',
      flexDirection: 'column',
      padding: '12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    },
    clientInfoLabel: {
      fontSize: '12px',
      color: '#6c757d',
      marginBottom: '6px',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    clientInfoValue: {
      fontSize: '14px',
      color: '#212529',
      fontWeight: '600',
      wordBreak: 'break-word'
    },
    formCard: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #e9ecef'
    },
    formTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: '2px solid #007bff'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    formLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#495057',
      marginBottom: '8px'
    },
    formInput: {
      padding: '10px 12px',
      border: '2px solid #e9ecef',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: '#fff',
      color: '#495057',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    formSelect: {
      padding: '10px 12px',
      border: '2px solid #e9ecef',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: '#fff',
      color: '#495057',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    formTextarea: {
      padding: '10px 12px',
      border: '2px solid #e9ecef',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: '#fff',
      color: '#495057',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: '1px solid #e9ecef'
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      backgroundColor: '#007bff',
      color: '#fff'
    },
    successButton: {
      backgroundColor: '#28a745',
      color: '#fff'
    },
    secondaryButton: {
      backgroundColor: '#6c757d',
      color: '#fff'
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }
  };

  if (loading) {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.loadingOverlay}>
            <LoadingSpinner variant="pulse" size="large" text="데이터를 불러오는 중..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* 헤더 */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>
            📝 상담일지 작성
            {isEditMode && <span style={{...styles.statusBadge, backgroundColor: '#17a2b8', color: '#fff'}}>수정 모드</span>}
          </h1>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.content}>
          {/* 내담자 정보 */}
          {client && (
            <div style={styles.clientInfo}>
              <h3 style={styles.clientInfoTitle}>👤 내담자 정보</h3>
              <div style={styles.clientInfoGrid}>
                <div style={styles.clientInfoItem}>
                  <span style={styles.clientInfoLabel}>이름</span>
                  <span style={styles.clientInfoValue}>{client.name}</span>
                </div>
                <div style={styles.clientInfoItem}>
                  <span style={styles.clientInfoLabel}>나이</span>
                  <span style={styles.clientInfoValue}>{client.age ? `${client.age}세` : '미입력'}</span>
                </div>
                <div style={styles.clientInfoItem}>
                  <span style={styles.clientInfoLabel}>성별</span>
                  <span style={styles.clientInfoValue}>
                    {client.gender === 'MALE' ? '남성' : 
                     client.gender === 'FEMALE' ? '여성' : 
                     client.gender || '미입력'}
                  </span>
                </div>
                <div style={styles.clientInfoItem}>
                  <span style={styles.clientInfoLabel}>연락처</span>
                  <span style={styles.clientInfoValue}>{client.phone || '미입력'}</span>
                </div>
                <div style={styles.clientInfoItem}>
                  <span style={styles.clientInfoLabel}>주소</span>
                  <span style={styles.clientInfoValue}>{client.address || '미입력'}</span>
                </div>
                <div style={styles.clientInfoItem}>
                  <span style={styles.clientInfoLabel}>이메일</span>
                  <span style={styles.clientInfoValue}>{client.email || '미입력'}</span>
                </div>
                <div style={styles.clientInfoItem}>
                  <span style={styles.clientInfoLabel}>상담 목적</span>
                  <span style={styles.clientInfoValue}>{client.consultationPurpose || '미입력'}</span>
                </div>
                <div style={styles.clientInfoItem}>
                  <span style={styles.clientInfoLabel}>상담 유형</span>
                  <span style={styles.clientInfoValue}>
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
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>
              📋 상담일지 작성
            </h2>
            
            <div style={styles.formGrid}>
              {/* 기본 정보 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>세션 일자 *</label>
                <input
                  type="date"
                  name="sessionDate"
                  value={formData.sessionDate}
                  onChange={handleInputChange}
                  style={{
                    ...styles.formInput,
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'not-allowed'
                  }}
                  required
                  disabled
                />
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  스케줄에서 선택한 날짜로 고정됩니다
                </small>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>세션 번호</label>
                <input
                  type="number"
                  name="sessionNumber"
                  value={formData.sessionNumber}
                  onChange={handleInputChange}
                  min="1"
                  disabled={true}
                  style={{
                    ...styles.formInput,
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    cursor: 'not-allowed'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  스케줄에서 자동으로 설정됩니다
                </small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>세션 시간 (분)</label>
                <input
                  type="number"
                  name="sessionDurationMinutes"
                  value={formData.sessionDurationMinutes}
                  onChange={handleInputChange}
                  min="1"
                  max="180"
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>세션 완료 여부</label>
                <select
                  name="isSessionCompleted"
                  value={formData.isSessionCompleted}
                  onChange={handleInputChange}
                  disabled={true}
                  style={{
                    ...styles.formSelect,
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
                <small style={{ color: '#666', fontSize: '12px' }}>
                  스케줄에서 자동으로 설정됩니다
                </small>
              </div>

              {/* 내담자 상태 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>내담자 상태</label>
                <textarea
                  name="clientCondition"
                  value={formData.clientCondition}
                  onChange={handleInputChange}
                  placeholder="내담자의 현재 상태를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 주요 이슈 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>주요 이슈</label>
                <textarea
                  name="mainIssues"
                  value={formData.mainIssues}
                  onChange={handleInputChange}
                  placeholder="이번 세션에서 다룬 주요 이슈를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 개입 방법 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>개입 방법</label>
                <textarea
                  name="interventionMethods"
                  value={formData.interventionMethods}
                  onChange={handleInputChange}
                  placeholder="사용한 상담 기법이나 개입 방법을 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 내담자 반응 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>내담자 반응</label>
                <textarea
                  name="clientResponse"
                  value={formData.clientResponse}
                  onChange={handleInputChange}
                  placeholder="내담자의 반응이나 변화를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 다음 세션 계획 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>다음 세션 계획</label>
                <textarea
                  name="nextSessionPlan"
                  value={formData.nextSessionPlan}
                  onChange={handleInputChange}
                  placeholder="다음 세션에서 다룰 내용을 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 과제 부여 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>과제 부여</label>
                <textarea
                  name="homeworkAssigned"
                  value={formData.homeworkAssigned}
                  onChange={handleInputChange}
                  placeholder="부여한 과제나 숙제를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>과제 제출 기한</label>
                <input
                  type="date"
                  name="homeworkDueDate"
                  value={formData.homeworkDueDate}
                  onChange={handleInputChange}
                  style={styles.formInput}
                />
              </div>

              {/* 위험도 평가 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>위험도 평가</label>
                <select
                  name="riskAssessment"
                  value={formData.riskAssessment}
                  onChange={handleInputChange}
                  style={styles.formSelect}
                  disabled={loadingCodes}
                >
                  <option value="">위험도를 선택하세요</option>
                  {riskLevels.map(level => (
                    <option key={level.value} value={level.value} style={{color: level.color}}>
                      {level.icon} {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>위험 요인</label>
                <textarea
                  name="riskFactors"
                  value={formData.riskFactors}
                  onChange={handleInputChange}
                  placeholder="발견된 위험 요인을 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>응급 대응 계획</label>
                <textarea
                  name="emergencyResponsePlan"
                  value={formData.emergencyResponsePlan}
                  onChange={handleInputChange}
                  placeholder="응급 상황 시 대응 계획을 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 진행 평가 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>진행 평가</label>
                <textarea
                  name="progressEvaluation"
                  value={formData.progressEvaluation}
                  onChange={handleInputChange}
                  placeholder="전반적인 진행 상황을 평가해주세요."
                  style={styles.formTextarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>진행 점수 (0-100)</label>
                <input
                  type="range"
                  name="progressScore"
                  value={formData.progressScore}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  style={styles.formInput}
                />
                <span style={{fontSize: '12px', color: '#6c757d'}}>{formData.progressScore}점</span>
              </div>

              {/* 목표 달성도 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>목표 달성도</label>
                <select
                  name="goalAchievement"
                  value={formData.goalAchievement}
                  onChange={handleInputChange}
                  style={styles.formSelect}
                >
                  {goalAchievementLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>목표 달성 세부사항</label>
                <textarea
                  name="goalAchievementDetails"
                  value={formData.goalAchievementDetails}
                  onChange={handleInputChange}
                  placeholder="목표 달성에 대한 구체적인 내용을 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 상담사 관찰 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>상담사 관찰</label>
                <textarea
                  name="consultantObservations"
                  value={formData.consultantObservations}
                  onChange={handleInputChange}
                  placeholder="내담자에 대한 관찰 내용을 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 상담사 평가 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>상담사 평가</label>
                <textarea
                  name="consultantAssessment"
                  value={formData.consultantAssessment}
                  onChange={handleInputChange}
                  placeholder="전문적인 관점에서의 평가를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 특별 고려사항 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>특별 고려사항</label>
                <textarea
                  name="specialConsiderations"
                  value={formData.specialConsiderations}
                  onChange={handleInputChange}
                  placeholder="특별히 고려해야 할 사항을 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 의료 정보 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>의료 정보</label>
                <textarea
                  name="medicalInformation"
                  value={formData.medicalInformation}
                  onChange={handleInputChange}
                  placeholder="관련 의료 정보를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>복용 약물</label>
                <textarea
                  name="medicationInfo"
                  value={formData.medicationInfo}
                  onChange={handleInputChange}
                  placeholder="복용 중인 약물 정보를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 가족 관계 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>가족 관계</label>
                <textarea
                  name="familyRelationships"
                  value={formData.familyRelationships}
                  onChange={handleInputChange}
                  placeholder="가족 관계에 대한 정보를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 사회적 지지 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>사회적 지지</label>
                <textarea
                  name="socialSupport"
                  value={formData.socialSupport}
                  onChange={handleInputChange}
                  placeholder="사회적 지지 체계에 대한 정보를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 환경적 요인 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>환경적 요인</label>
                <textarea
                  name="environmentalFactors"
                  value={formData.environmentalFactors}
                  onChange={handleInputChange}
                  placeholder="환경적 요인에 대한 정보를 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              {/* 미완료 사유 */}
              {!formData.isSessionCompleted && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>미완료 사유</label>
                  <textarea
                    name="incompletionReason"
                    value={formData.incompletionReason}
                    onChange={handleInputChange}
                    placeholder="세션이 미완료된 사유를 기록해주세요."
                    style={styles.formTextarea}
                  />
                </div>
              )}

              {/* 다음 세션 일정 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>다음 세션 일정</label>
                <input
                  type="date"
                  name="nextSessionDate"
                  value={formData.nextSessionDate}
                  onChange={handleInputChange}
                  style={{
                    ...styles.formInput,
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'not-allowed'
                  }}
                  disabled
                />
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  관리자가 스케줄에서 지정합니다
                </small>
              </div>

              {/* 후속 조치사항 */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>후속 조치사항</label>
                <textarea
                  name="followUpActions"
                  value={formData.followUpActions}
                  onChange={handleInputChange}
                  placeholder="후속 조치가 필요한 사항을 기록해주세요."
                  style={styles.formTextarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>후속 조치 기한</label>
                <input
                  type="date"
                  name="followUpDueDate"
                  value={formData.followUpDueDate}
                  onChange={handleInputChange}
                  style={styles.formInput}
                />
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={onClose}
                style={{...styles.button, ...styles.secondaryButton}}
                disabled={saving}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{...styles.button, ...styles.primaryButton}}
                disabled={saving}
              >
                {saving ? <LoadingSpinner variant="dots" size="small" /> : '💾 저장'}
              </button>
              <button
                type="button"
                onClick={handleComplete}
                style={{...styles.button, ...styles.successButton}}
                disabled={saving}
              >
                {saving ? <LoadingSpinner variant="dots" size="small" /> : '✅ 완료'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationLogModal;