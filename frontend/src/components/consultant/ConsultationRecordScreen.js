import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import { CONSULTANT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import { getUserStatusKoreanNameSync } from '../../utils/codeHelper';
import SafeText from '../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import PsychClientContextSummaryBlock from '../psych-context/organisms/PsychClientContextSummaryBlock';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES = '/api/v1/common-codes?codeGroup=PRIORITY';
const API_COMMON_CODES_2 = '/api/v1/common-codes?codeGroup=COMPLETION_STATUS';
const API_SCHEDULES = '/api/v1/schedules?userId=0&userRole=ADMIN';


/**
 * 상담일지 작성 화면
/**
 * 스케줄 시간에 상담사가 내담자 정보를 보면서 상담일지를 작성할 수 있는 종합 화면
 */
const CONSULTATION_RECORD_TITLE_ID = 'consultation-record-screen-title';

const ConsultationRecordScreen = () => {
  const { t } = useTranslation();
  const { consultationId: scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consultation, setConsultation] = useState(null);
  const [client, setClient] = useState(null);
  const [consultationRecord, setConsultationRecord] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [completionStatusOptions, setCompletionStatusOptions] = useState([]);
  const [loadingCompletionCodes, setLoadingCompletionCodes] = useState(false);
  const loadPriorityCodes = useCallback(async() => {
    try {
      setLoadingCodes(true);
      const response = await apiGet(API_COMMON_CODES);
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
        { value: 'HIGH', label: '높음', icon: '🟠', color: 'var(--mg-color-warning-600)', description: '높은 우선순위' },
        { value: 'URGENT', label: '긴급', icon: '🔴', color: 'var(--mg-error-500)', description: '긴급 우선순위' },
        { value: 'CRITICAL', label: '위험', icon: '🚨', color: 'var(--mg-purple-500)', description: '위험 우선순위' }
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

  const goalAchievements = [
    { value: 'LOW', label: '낮음', color: 'var(--mg-error-500)' },
    { value: 'MEDIUM', label: '보통', color: 'var(--mg-warning-500)' },
    { value: 'HIGH', label: '높음', color: 'var(--mg-success-500)' },
    { value: 'EXCELLENT', label: '우수', color: 'var(--mg-primary-500)' }
  ];

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: 'var(--mg-gray-100)',
      padding: '20px'
    },
    header: {
      backgroundColor: 'var(--mg-white, var(--mg-white))',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px var(--mg-shadow-light)',
      border: '1px solid var(--mg-gray-200, var(--mg-color-border-main))'
    },
    headerTitle: {
      fontSize: 'var(--font-size-xxl)',
      fontWeight: '700',
      color: 'var(--mg-gray-800, var(--mg-color-text-main))',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    headerSubtitle: {
      fontSize: 'var(--font-size-base)',
      color: 'var(--mg-secondary-500)',
      marginBottom: '20px'
    },
    clientInfoCard: {
      backgroundColor: 'var(--mg-white, var(--mg-white))',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px var(--mg-shadow-light)',
      border: '1px solid var(--mg-gray-200, var(--mg-color-border-main))'
    },
    clientInfoTitle: {
      fontSize: 'var(--font-size-xl)',
      fontWeight: '600',
      color: 'var(--mg-gray-800, var(--mg-color-text-main))',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    clientInfoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px'
    },
    clientInfoItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    clientInfoLabel: {
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      color: 'var(--mg-secondary-500)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    clientInfoValue: {
      fontSize: 'var(--font-size-base)',
      color: 'var(--mg-gray-800, var(--mg-color-text-main))',
      fontWeight: '500'
    },
    formCard: {
      backgroundColor: 'var(--mg-white, var(--mg-white))',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px var(--mg-shadow-light)',
      border: '1px solid var(--mg-gray-200, var(--mg-color-border-main))'
    },
    formTitle: {
      fontSize: 'var(--font-size-xl)',
      fontWeight: '600',
      color: 'var(--mg-gray-800, var(--mg-color-text-main))',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    formLabel: {
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      color: 'var(--mg-color-text-secondary)',
      marginBottom: '4px'
    },
    formInput: {
      padding: '12px 16px',
      border: '2px solid var(--mg-color-border-main)',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      transition: 'all 0.2s ease',
      backgroundColor: 'var(--mg-white)'
    },
    formTextarea: {
      padding: '12px 16px',
      border: '2px solid var(--mg-color-border-main)',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      backgroundColor: 'var(--mg-white)'
    },
    formSelect: {
      padding: '12px 16px',
      border: '2px solid var(--mg-color-border-main)',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      backgroundColor: 'var(--mg-white, var(--mg-white))',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    formInputFocus: {
      borderColor: 'var(--mg-primary-500)',
      boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: '1px solid var(--mg-color-border-main)'
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      backgroundColor: 'var(--mg-primary-500)',
      color: 'var(--mg-white)'
    },
    secondaryButton: {
      backgroundColor: 'var(--mg-secondary-500)',
      color: 'var(--mg-white)'
    },
    dangerButton: {
      backgroundColor: 'var(--mg-error-500)',
      color: 'var(--mg-white)'
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: 'var(--font-size-xs)',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: 'var(--mg-color-border-main)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    progressFill: {
      height: '100%',
      backgroundColor: 'var(--mg-primary-500)',
      transition: 'width 0.3s ease'
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--mg-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }
  };

  const loadCompletionStatusCodes = useCallback(async() => {
    try {
      setLoadingCompletionCodes(true);
      const response = await apiGet(API_COMMON_CODES_2);
      if (response && response.length > 0) {
        setCompletionStatusOptions(response.map(code => ({
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          value: code.codeValue === 'COMPLETED',
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        })));
      }
    } catch (error) {
      console.error('완료 상태 코드 로드 실패:', error);
      setCompletionStatusOptions([
        { value: true, label: '완료', icon: '✅', color: 'var(--mg-success-500)', description: '작업 완료' },
        { value: false, label: '미완료', icon: '❌', color: 'var(--mg-error-500)', description: '작업 미완료' }
      ]);
    } finally {
      setLoadingCompletionCodes(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadPriorityCodes();
    loadCompletionStatusCodes();
  }, [scheduleId, loadPriorityCodes, loadCompletionStatusCodes]);

  const loadData = async() => {
    try {
      setLoading(true);
      
      const scheduleResponse = await apiGet(API_SCHEDULES);
      if (scheduleResponse.success && scheduleResponse.data.length > 0) {
        const scheduleData = scheduleResponse.data[0];
        const consultationData = {
          id: scheduleData.id,
          clientId: scheduleData.clientId,
          consultantId: scheduleData.consultantId,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          consultationType: scheduleData.consultationType,
          status: scheduleData.status,
          title: scheduleData.title,
          notes: scheduleData.notes
        };
        setConsultation(consultationData);
        
        if (consultationData.clientId) {
          try {
            const clientResponse = await apiGet(`/api/v1/admin/clients/with-stats/${consultationData.clientId}`);
            if (clientResponse && clientResponse.data && clientResponse.data.client) {
              setClient(clientResponse.data.client);
            }
          } catch (err) {
            const fallback = await apiGet(`/api/admin/users`);
            if (fallback && fallback.success && fallback.data) {
              const clientData = fallback.data.find(u => u.id === consultationData.clientId);
              if (clientData) setClient(clientData);
            }
          }
        }
        
        try {
          const recordResponse = await apiGet(`/api/consultants/${user.id}/consultation-records?consultationId=${scheduleId}`);
          if (recordResponse.success && recordResponse.data.length > 0) {
            const record = recordResponse.data[0];
            setConsultationRecord(record);
            setIsEditMode(true);
            
            setFormData({
              sessionDate: record.sessionDate || consultation?.startTime?.split('T')[0] || '',
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
              sessionDate: consultation?.startTime?.split('T')[0] || new Date().toISOString().split('T')[0],
              sessionDurationMinutes: 60,
              isSessionCompleted: true
            }));
          }
        } catch (error) {
          console.log('기존 상담일지 없음, 새로 작성');
        }
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

  const handleSave = async() => {
    try {
      setSaving(true);
      
      const recordData = {
        ...formData,
        consultationId: parseInt(scheduleId),
        clientId: client?.id,
        consultantId: user.id
      };

      let response;
      if (isEditMode && consultationRecord) {
        response = await apiPut(`/api/consultants/${user.id}/consultation-records/${consultationRecord.id}`, recordData);
      } else {
        response = await apiPost(`/api/consultants/${user.id}/consultation-records`, recordData);
      }

      if (response.success) {
        notificationManager.show(
          isEditMode ? '상담일지가 수정되었습니다.' : '상담일지가 저장되었습니다.',
          'success'
        );
        setIsEditMode(true);
        setConsultationRecord(response.data);
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

  const handleComplete = async() => {
    try {
      setSaving(true);
      
      const recordData = {
        ...formData,
        consultationId: parseInt(scheduleId),
        clientId: client?.id,
        consultantId: user.id,
        isSessionCompleted: true,
        completionTime: new Date().toISOString()
      };

      let response;
      if (isEditMode && consultationRecord) {
        response = await apiPut(`/api/consultants/${user.id}/consultation-records/${consultationRecord.id}`, recordData);
      } else {
        response = await apiPost(`/api/consultants/${user.id}/consultation-records`, recordData);
      }

      if (response.success) {
        notificationManager.show('상담일지가 완료되었습니다.', 'success');
        
        navigate(`/consultant/send-message/${scheduleId}`, {
          state: {
            client: client,
            consultation: consultation,
            consultationRecord: response.data
          }
        });
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

  if (loading) {
    return (
      <AdminCommonLayout title={t('common:consultant.ConsultationRecordScreen.t_a0658140')}>
        <ContentArea ariaLabel="상담일지 작성 로딩">
          <div className="consultation-record-screen-loading">
            <div className="mg-loading">{t('common:consultant.ConsultationRecordScreen.t_f596b561')}</div>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!consultation || !client) {
    return (
      <AdminCommonLayout title={t('common:consultant.ConsultationRecordScreen.t_a0658140')}>
        <ContentArea ariaLabel="상담일지 작성">
          <ContentHeader
            title={t('common:consultant.ConsultationRecordScreen.t_a0658140')}
            subtitle="상담 정보를 불러올 수 없습니다."
            titleId={CONSULTATION_RECORD_TITLE_ID}
          />
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={t('common:consultant.ConsultationRecordScreen.t_a0658140')}>
      <ContentArea ariaLabel="상담일지 작성">
        <ContentHeader
          title={t('common:consultant.ConsultationRecordScreen.t_a0658140')}
          subtitle="내담자 정보와 세션 내용을 기록합니다."
          titleId={CONSULTATION_RECORD_TITLE_ID}
        />

      {/* 내담자 정보 카드 */}
      <div className="mg-v2-card mg-mb-lg">
        <h2 className="mg-h3 mg-mb-md mg-flex mg-align-center mg-gap-sm">
          {t('common:consultant.ConsultationRecordScreen.t_dac6c054')}
        </h2>
        <div className="mg-grid mg-grid-cols-2 mg-gap-md">
          <div className="mg-flex mg-flex-col">
            <span className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary">{t('common.labels.name')}</span>
            <span className="mg-v2-text-base mg-font-medium"><SafeText>{client.name}</SafeText></span>
          </div>
          <div style={styles.clientInfoItem}>
            <span style={styles.clientInfoLabel}>{t('common:consultant.ConsultationRecordScreen.t_6c620e5c')}</span>
            <span style={styles.clientInfoValue}>{client.age != null ? `${client.age}세` : '—'}</span>
          </div>
          <div style={styles.clientInfoItem}>
            <span style={styles.clientInfoLabel}>{t('common:consultant.ConsultationRecordScreen.t_77737feb')}</span>
            <span style={styles.clientInfoValue}>
              <SafeText>{client.gender === 'MALE' ? '남' : client.gender === 'FEMALE' ? '여' : client.gender}</SafeText>
            </span>
          </div>
          <div style={styles.clientInfoItem}>
            <span style={styles.clientInfoLabel}>{t('common.labels.email')}</span>
            <span style={styles.clientInfoValue}><SafeText fallback="정보 없음">{client.email}</SafeText></span>
          </div>
          <div style={styles.clientInfoItem}>
            <span style={styles.clientInfoLabel}>{t('common:consultant.ConsultationRecordScreen.t_9a1c3aaa')}</span>
            <span style={styles.clientInfoValue}><SafeText fallback="정보 없음">{client.phone}</SafeText></span>
          </div>
          <div style={styles.clientInfoItem}>
            <span style={styles.clientInfoLabel}>{t('common:consultant.ConsultationRecordScreen.t_117bab80')}</span>
            <span style={styles.clientInfoValue}>
              <SafeText fallback="정보 없음">{[client.postalCode, client.address, client.addressDetail].filter(Boolean).join(' ')}</SafeText>
            </span>
          </div>
          <div style={styles.clientInfoItem}>
            <span style={styles.clientInfoLabel}>{t('common.labels.status')}</span>
            <span style={styles.clientInfoValue}>
              <span style={{
                ...styles.statusBadge,
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                backgroundColor: client.status === 'ACTIVE' ? 'var(--mg-success-500)' : 'var(--mg-secondary-500)',
                color: 'var(--mg-white)'
              }}>
                <SafeText>{getUserStatusKoreanNameSync(client.status)}</SafeText>
              </span>
            </span>
          </div>
          <div style={styles.clientInfoItem}>
            <span style={styles.clientInfoLabel}>{t('common:consultant.ConsultationRecordScreen.t_89dbf513')}</span>
            <span style={styles.clientInfoValue}>
              {client.grade === 'BRONZE' && '🥉 브론즈'}
              {client.grade === 'SILVER' && '🥈 실버'}
              {client.grade === 'GOLD' && '🥇 골드'}
              {client.grade === 'PLATINUM' && '💎 플래티넘'}
              {!['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(client.grade) && '일반'}
            </span>
          </div>
          <div style={styles.clientInfoItem}>
            <span style={styles.clientInfoLabel}>{t('common:consultant.ConsultationRecordScreen.t_170f7b92')}</span>
            <span style={styles.clientInfoValue}><SafeText fallback="정보 없음">{client.createdAt?.split('T')[0]}</SafeText></span>
          </div>
        </div>
      </div>

      <PsychClientContextSummaryBlock clientId={consultation?.clientId} variant="section" />

      {/* 상담일지 작성 폼 */}
      <div style={styles.formCard}>
        <h2 style={styles.formTitle}>
          {t('common:consultant.ConsultationRecordScreen.t_b8e6fb4d')}
        </h2>
        
        <div style={styles.formGrid}>
          {/* 기본 정보 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_9d161eee')}</label>
            <input
              type="date"
              name="sessionDate"
              value={formData.sessionDate}
              onChange={handleInputChange}
              style={{ ...styles.formInput, ...styles.formInputFocus }}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_6ee27466')}</label>
            <input
              type="number"
              name="sessionNumber"
              value={formData.sessionNumber}
              onChange={handleInputChange}
              min="1"
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_ad01b2b5')}</label>
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
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_19279be8')}</label>
            <select
              name="isSessionCompleted"
              value={formData.isSessionCompleted}
              onChange={handleInputChange}
              style={styles.formSelect}
            >
              {completionStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 내담자 상태 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_fa35dc53')}</label>
            <textarea
              name="clientCondition"
              value={formData.clientCondition}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_d59656e7')}
              style={styles.formTextarea}
              required
            />
          </div>

          {/* 주요 이슈 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_e633a3f6')}</label>
            <textarea
              name="mainIssues"
              value={formData.mainIssues}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_1e9fdda7')}
              style={styles.formTextarea}
              required
            />
          </div>

          {/* 개입 방법 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_5620da99')}</label>
            <textarea
              name="interventionMethods"
              value={formData.interventionMethods}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_5159282d')}
              style={styles.formTextarea}
              required
            />
          </div>

          {/* 내담자 반응 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_845225fc')}</label>
            <textarea
              name="clientResponse"
              value={formData.clientResponse}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_8fd7e314')}
              style={styles.formTextarea}
              required
            />
          </div>

          {/* 다음 세션 계획 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_6856fca3')}</label>
            <textarea
              name="nextSessionPlan"
              value={formData.nextSessionPlan}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_39067e66')}
              style={styles.formTextarea}
            />
          </div>

          {/* 과제 부여 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_a6c7c7d5')}</label>
            <textarea
              name="homeworkAssigned"
              value={formData.homeworkAssigned}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_b4fdaee3')}
              style={styles.formTextarea}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_ec235921')}</label>
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
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_92495efd')}</label>
            <select
              name="riskAssessment"
              value={formData.riskAssessment}
              onChange={handleInputChange}
              style={styles.formSelect}
              required
              disabled={loadingCodes}
            >
              <option value="">{t('common:consultant.ConsultationRecordScreen.t_39150dda')}</option>
              {riskLevels.map(level => (
                <option key={level.value} value={level.value} style={{ color: level.color }}>
                  {level.icon} {level.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_be6337f1')}</label>
            <textarea
              name="riskFactors"
              value={formData.riskFactors}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_b4a5c279')}
              style={styles.formTextarea}
            />
          </div>

          {/* 진행도 평가 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_e7b28555')}</label>
            <input
              type="range"
              name="progressScore"
              value={formData.progressScore}
              onChange={handleInputChange}
              min="0"
              max="100"
              style={{ width: '100%' }}
            />
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${formData.progressScore}%` }} />
            </div>
            <span className="mg-v2-text-sm mg-v2-text-secondary">{formData.progressScore}점</span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_526df8c3')}</label>
            <textarea
              name="progressEvaluation"
              value={formData.progressEvaluation}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_c7df43de')}
              style={styles.formTextarea}
            />
          </div>

          {/* 목표 달성도 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_51041d7f')}</label>
            <select
              name="goalAchievement"
              value={formData.goalAchievement}
              onChange={handleInputChange}
              style={styles.formSelect}
            >
              {goalAchievements.map(achievement => (
                <option key={achievement.value} value={achievement.value} style={{ color: achievement.color }}>
                  {achievement.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_5a5ee490')}</label>
            <textarea
              name="goalAchievementDetails"
              value={formData.goalAchievementDetails}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_3a2cf0b7')}
              style={styles.formTextarea}
            />
          </div>

          {/* 상담사 관찰사항 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_1cf7189f')}</label>
            <textarea
              name="consultantObservations"
              value={formData.consultantObservations}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_d81ff6a0')}
              style={styles.formTextarea}
            />
          </div>

          {/* 상담사 평가 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_2ee2ab8d')}</label>
            <textarea
              name="consultantAssessment"
              value={formData.consultantAssessment}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_49ffbe86')}
              style={styles.formTextarea}
            />
          </div>

          {/* 특별 고려사항 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_aec2075b')}</label>
            <textarea
              name="specialConsiderations"
              value={formData.specialConsiderations}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_a7a3fb64')}
              style={styles.formTextarea}
            />
          </div>

          {/* 의료 정보 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_824dd6de')}</label>
            <textarea
              name="medicalInformation"
              value={formData.medicalInformation}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_d3a6608a')}
              style={styles.formTextarea}
            />
          </div>

          {/* 약물 정보 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_b933b126')}</label>
            <textarea
              name="medicationInfo"
              value={formData.medicationInfo}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_eda8a47e')}
              style={styles.formTextarea}
            />
          </div>

          {/* 가족 관계 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_38576d81')}</label>
            <textarea
              name="familyRelationships"
              value={formData.familyRelationships}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_b531fee5')}
              style={styles.formTextarea}
            />
          </div>

          {/* 사회적 지원 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_4cba7523')}</label>
            <textarea
              name="socialSupport"
              value={formData.socialSupport}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_78039485')}
              style={styles.formTextarea}
            />
          </div>

          {/* 환경적 요인 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_45dd416d')}</label>
            <textarea
              name="environmentalFactors"
              value={formData.environmentalFactors}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_7679a7f3')}
              style={styles.formTextarea}
            />
          </div>

          {/* 미완료 사유 */}
          {!formData.isSessionCompleted && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_58561e6f')}</label>
              <textarea
                name="incompletionReason"
                value={formData.incompletionReason}
                onChange={handleInputChange}
                placeholder={t('common:consultant.ConsultationRecordScreen.t_0c9f8f20')}
                style={styles.formTextarea}
              />
            </div>
          )}

          {/* 다음 세션 예정일 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_f2b8c5e7')}</label>
            <input
              type="date"
              name="nextSessionDate"
              value={formData.nextSessionDate}
              onChange={handleInputChange}
              style={styles.formInput}
            />
          </div>

          {/* 후속 조치사항 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_0a6da346')}</label>
            <textarea
              name="followUpActions"
              value={formData.followUpActions}
              onChange={handleInputChange}
              placeholder={t('common:consultant.ConsultationRecordScreen.t_8e6ab501')}
              style={styles.formTextarea}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>{t('common:consultant.ConsultationRecordScreen.t_83b65ae8')}</label>
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
          <MGButton
            type="button"
            variant="secondary"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/consultant/schedule')}
            disabled={saving}
          >
            {t('common.actions.cancel')}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: saving })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleSave}
            disabled={saving}
            loading={saving}
          >
            {t('common:consultant.ConsultationRecordScreen.t_854d3bd6')}
          </MGButton>
          <MGButton
            type="button"
            variant="danger"
            className={buildErpMgButtonClassName({ variant: 'danger', size: 'md', loading: saving })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleComplete}
            disabled={saving}
            loading={saving}
          >
            {t('common:consultant.ConsultationRecordScreen.t_e43453e6')}
          </MGButton>
        </div>
      </div>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default ConsultationRecordScreen;
