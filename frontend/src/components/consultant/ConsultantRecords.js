import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { getCommonCodes } from '../../utils/commonCodeUtils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import EmptyState from '../common/EmptyState';
import ConsultantSuitePage from './suite/ConsultantSuitePage';
import ConsultantSuiteButton from './suite/ConsultantSuiteButton';
import ConsultantRecordFilterBlock from './records/ConsultantRecordFilterBlock';
import ConsultantRecordListBlock from './records/ConsultantRecordListBlock';
import ConsultationLogModal from './ConsultationLogModal';
import {
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_TEST_ID
} from '../../constants/consultantSuite';
import {
  buildConsultantConsultationRecordRoute,
  buildConsultantConsultationRecordsRoute,
  CONSULTANT_DASHBOARD_ROUTES
} from '../../constants/consultantDashboardRoutes';
import {
  CONSULTANT_RECORDS_INCOMPLETE_DASHBOARD_CTA,
  CONSULTANT_RECORDS_INCOMPLETE_EMPTY_DESC,
  CONSULTANT_RECORDS_INCOMPLETE_EMPTY_TITLE,
  CONSULTANT_RECORDS_INCOMPLETE_SCHEDULE_CTA
} from '../../constants/consultantDashboardConstants';
import './ConsultantRecords.css';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const CONSULTANT_RECORDS_TITLE_ID = 'consultant-records-title';
const ERROR_ICON_SIZE = 40;

const ConsultantRecords = () => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deepLinkHandledRef = useRef(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [incompleteListMode, setIncompleteListMode] = useState(false);
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

      const response = await StandardizedApi.get(`/api/v1/admin/consultant-records/${user.id}/consultation-records`);
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
      // 일정 등록으로 보내지 않음 — 미작성 일지 맥락으로 정리
      navigate(buildConsultantConsultationRecordsRoute({ filter: 'incomplete' }), { replace: true });
      return;
    }

    deepLinkHandledRef.current = true;

    if (filter === 'incomplete') {
      // PENDING(세션 미완료)로 매핑하지 않음 — 미작성 일지 안내 모드
      setIncompleteListMode(true);
      setFilterStatus('ALL');
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

    const isCompleted = record.isSessionCompleted === true;
    const recordStatus = isCompleted ? 'COMPLETED' : 'PENDING';
    const matchesStatus = filterStatus === 'ALL' || recordStatus === filterStatus || record.status === filterStatus;
    const matchesClient = !clientIdFilter
      || String(record.clientId ?? '') === clientIdFilter
      || String(record.client?.id ?? '') === clientIdFilter;

    // incomplete 모드는 기존 기록 API를 걸러 작성 진입로로 쓰지 않음 — 안내 empty만 표시
    if (incompleteListMode) {
      return false;
    }

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

  const handleNavigateDashboard = () => {
    navigate(CONSULTANT_DASHBOARD_ROUTES.DASHBOARD);
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

  const renderBody = () => {
    if (sessionLoading) {
      return (
        <div className={CONSULTANT_SUITE_CLASS.LOADING} aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text={t('records.sessionLoading')} />
        </div>
      );
    }
    if (!isLoggedIn) {
      return (
        <section className={CONSULTANT_SUITE_CLASS.PANEL}>
          <EmptyState
            className={CONSULTANT_SUITE_CLASS.EMPTY}
            title={t('records.loginRequired')}
            description={t('records.loginRequiredDescription')}
          />
        </section>
      );
    }
    return (
      <>
        <ConsultantRecordFilterBlock
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterStatusChange={(value) => {
            setIncompleteListMode(false);
            setFilterStatus(value);
          }}
          statusOptions={statusOptions}
        />

        {loading && (
          <div className={CONSULTANT_SUITE_CLASS.LOADING} aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text={t('records.loading')} />
          </div>
        )}

        {!loading && error && (
          <section className={CONSULTANT_SUITE_CLASS.PANEL} role="alert">
            <EmptyState
              className={CONSULTANT_SUITE_CLASS.EMPTY}
              icon={<AlertTriangle size={ERROR_ICON_SIZE} aria-hidden />}
              title={error}
              action={(
                <ConsultantSuiteButton onClick={loadRecords} disabled={loading}>
                  {t('actions.retry')}
                </ConsultantSuiteButton>
              )}
            />
          </section>
        )}

        {!loading && !error && (
          <ConsultantRecordListBlock
            records={filteredRecords}
            onViewRecord={handleViewRecord}
            onWriteRecord={handleWriteRecord}
            onNavigateSchedule={handleNavigateSchedule}
            onNavigateDashboard={incompleteListMode ? handleNavigateDashboard : undefined}
            emptyTitle={incompleteListMode
              ? CONSULTANT_RECORDS_INCOMPLETE_EMPTY_TITLE
              : undefined}
            emptyDesc={incompleteListMode
              ? CONSULTANT_RECORDS_INCOMPLETE_EMPTY_DESC
              : undefined}
            scheduleCtaLabel={incompleteListMode
              ? CONSULTANT_RECORDS_INCOMPLETE_SCHEDULE_CTA
              : undefined}
            dashboardCtaLabel={incompleteListMode
              ? CONSULTANT_RECORDS_INCOMPLETE_DASHBOARD_CTA
              : undefined}
          />
        )}
      </>
    );
  };

  return (
    <AdminCommonLayout className="mg-v2-dashboard-layout">
      <ConsultantSuitePage
        title={t('records.title')}
        subtitle={incompleteListMode ? t('records.incompleteSubtitle') : t('records.subtitle')}
        titleId={CONSULTANT_RECORDS_TITLE_ID}
        ariaLabel={t('records.ariaLabel')}
        testId={CONSULTANT_SUITE_TEST_ID.RECORDS_PAGE}
      >
        {renderBody()}
      </ConsultantSuitePage>
      {isLoggedIn ? (
        <ConsultationLogModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          recordId={modalRecordId}
          isAdmin={false}
        />
      ) : null}
    </AdminCommonLayout>
  );
};

export default ConsultantRecords;
