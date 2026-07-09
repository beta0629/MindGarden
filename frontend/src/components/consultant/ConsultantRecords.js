import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { getCommonCodes } from '../../utils/commonCodeUtils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ConsultantRecordFilterBlock from './records/ConsultantRecordFilterBlock';
import ConsultantRecordListBlock from './records/ConsultantRecordListBlock';
import ConsultationLogModal from './ConsultationLogModal';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import {
  buildConsultantConsultationRecordRoute,
  CONSULTANT_DASHBOARD_ROUTES
} from '../../constants/consultantDashboardRoutes';
import './ConsultantRecords.css';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const ConsultantRecords = () => {
  const { t } = useTranslation();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deepLinkHandledRef = useRef(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [clientIdFilter, setClientIdFilter] = useState('');
  const [statusOptions, setStatusOptions] = useState([
    { value: 'ALL', label: '전체' }
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRecordId, setModalRecordId] = useState(null);

  const loadStatusCodes = useCallback(async() => {
    try {
      const codes = await getCommonCodes('STATUS');
      if (codes && codes.length > 0) {
        const options = [
          { value: 'ALL', label: '전체' },
          ...codes.map(code => ({
            value: code.codeValue,
            label: code.codeLabel
          }))
        ];
        setStatusOptions(options);
      } else {
        // 폴백
        setStatusOptions([
          { value: 'ALL', label: '전체' },
          { value: 'COMPLETED', label: '완료' },
          { value: 'PENDING', label: '대기' },
          { value: 'IN_PROGRESS', label: '진행중' },
          { value: 'CANCELLED', label: '취소' }
        ]);
      }
    } catch (err) {
      console.error('상태 코드 로드 실패:', err);
    }
  }, []);

  const loadRecords = useCallback(async() => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error(i18n.t('error:consultant.ConsultantRecords.t_cfaf61dd'));
      }

      // StandardizedApi를 사용하여 백엔드 에러 및 null 등을 안전하게 처리 (에러 핸들러 통일)
      const response = await StandardizedApi.get(`/api/v1/admin/consultant-records/${user.id}/consultation-records`);
      
      // StandardizedApi.get은 response 자체 또는 response.data를 반환할 수 있음
      const data = response?.data || response || [];
      setRecords(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error('❌ 상담 기록 로드 중 오류:', err);
      let errorMessage = '상담 기록을 불러오는 중 오류가 발생했습니다.';
      
      if (err.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (err.status === 403) {
        errorMessage = '접근 권한이 없습니다.';
      } else if (err.message) {
        errorMessage = `오류: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (deepLinkHandledRef.current) {
      return;
    }

    const scheduleId = searchParams.get('scheduleId');
    const action = searchParams.get('action');
    const filter = searchParams.get('filter');
    const clientId = searchParams.get('clientId');

    if (scheduleId) {
      deepLinkHandledRef.current = true;
      navigate(buildConsultantConsultationRecordRoute(scheduleId), { replace: true });
      return;
    }

    if (action === 'create') {
      deepLinkHandledRef.current = true;
      navigate(CONSULTANT_DASHBOARD_ROUTES.SCHEDULE, { replace: true });
      return;
    }

    deepLinkHandledRef.current = true;

    if (filter === 'incomplete') {
      setFilterStatus('PENDING');
    }

    if (clientId) {
      setClientIdFilter(String(clientId));
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id) {
      loadRecords();
      loadStatusCodes();
    }
  }, [sessionLoading, isLoggedIn, user?.id, loadRecords, loadStatusCodes]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      (record.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // API 응답의 status는 PENDING 또는 COMPLETED 등이 들어올 수 있음
    const isCompleted = record.isSessionCompleted === true;
    const recordStatus = isCompleted ? 'COMPLETED' : 'PENDING';
    const matchesStatus = filterStatus === 'ALL' || recordStatus === filterStatus || record.status === filterStatus;
    const matchesClient = !clientIdFilter
      || String(record.clientId ?? '') === clientIdFilter
      || String(record.client?.id ?? '') === clientIdFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleViewRecord = (recordId) => {
    setModalRecordId(recordId);
    setModalOpen(true);
  };

  const handleWriteRecord = (recordId) => {
    setModalRecordId(recordId);
    setModalOpen(true);
  };

  const handleNavigateSchedule = () => {
    navigate(CONSULTANT_DASHBOARD_ROUTES.SCHEDULE);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalRecordId(null);
  };

  const handleModalSave = () => {
    loadRecords();
    setModalOpen(false);
    setModalRecordId(null);
  };

  const renderContent = () => {
    if (sessionLoading) {
      return (
        <div className="consultant-records__session-load" aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text="세션 정보를 불러오는 중..." />
        </div>
      );
    }
    if (!isLoggedIn) {
      return (
        <ContentArea>
          <div className="consultant-records-login-required consultant-records__center-pad-lg">
            <h3>로그인이 필요합니다.</h3>
            <p>상담 기록을 보려면 로그인해주세요.</p>
          </div>
        </ContentArea>
      );
    }
    return (
      <div className="mg-v2-ad-b0kla mg-v2-consultation-log-view">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea>
            <ContentHeader 
              title="상담 기록 조회" 
              subtitle="작성된 상담 기록들을 확인할 수 있습니다. 상담 기록 작성은 일정 관리에서 가능합니다." 
              icon="journal-text"
            />
            
            <ConsultantRecordFilterBlock 
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              statusOptions={statusOptions}
            />

            {loading && (
              <div className="consultant-records__loading">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('common.messages.loading')}</span>
                </div>
                <p className="consultant-records__loading-text">상담 기록을 불러오는 중...</p>
              </div>
            )}

            {error && (
              <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
                <div>
                  <i className="bi bi-exclamation-triangle-fill me-2" />
                  {error}
                </div>
                <MGButton
                  variant="outline"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false,
                    className: 'btn btn-outline-danger btn-sm'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={loadRecords}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-1" />
                  재시도
                </MGButton>
              </div>
            )}

            {!loading && !error && (
              <ConsultantRecordListBlock 
                records={filteredRecords}
                onViewRecord={handleViewRecord}
                onWriteRecord={handleWriteRecord}
                onNavigateSchedule={handleNavigateSchedule}
              />
            )}
          </ContentArea>
        </div>

        <ConsultationLogModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          recordId={modalRecordId}
          isAdmin={false}
        />
      </div>
    );
  };

  return (
    <AdminCommonLayout title="상담 기록">
      {renderContent()}
    </AdminCommonLayout>
  );
};

export default ConsultantRecords;
