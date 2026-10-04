import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ConsultationLogModal from './ConsultationLogModal';
import {
  fetchScheduleMetaForMissingLog,
  normalizeMissingLogScheduleId
} from '../../utils/missingConsultationLogNavigation';
import { CONSULTANT_DASHBOARD_ROUTES } from '../../constants/consultantDashboardRoutes';
import { HTTP_STATUS } from '../../constants/magicNumbers';
import {
  CONSULTATION_RECORD_SCREEN_STATUS,
  CONSULTATION_RECORD_SCREEN_STRINGS
} from '../../constants/consultationRecordScreenStrings';
import { toDisplayString } from '../../utils/safeDisplay';

const CONSULTATION_RECORD_TITLE_ID = 'consultation-record-screen-title';

/** react-router 가 첫 진입(직접 URL) 위치에 붙이는 key — 이 경우 뒤로 갈 이력이 없다 */
const INITIAL_LOCATION_KEY = 'default';

const STATUS_SUBTITLE = {
  [CONSULTATION_RECORD_SCREEN_STATUS.LOADING]: CONSULTATION_RECORD_SCREEN_STRINGS.SUBTITLE_LOADING,
  [CONSULTATION_RECORD_SCREEN_STATUS.READY]: CONSULTATION_RECORD_SCREEN_STRINGS.SUBTITLE_READY,
  [CONSULTATION_RECORD_SCREEN_STATUS.NOT_FOUND]: CONSULTATION_RECORD_SCREEN_STRINGS.NOT_FOUND,
  [CONSULTATION_RECORD_SCREEN_STATUS.FORBIDDEN]: CONSULTATION_RECORD_SCREEN_STRINGS.FORBIDDEN,
  [CONSULTATION_RECORD_SCREEN_STATUS.ERROR]: CONSULTATION_RECORD_SCREEN_STRINGS.LOAD_FAILED
};

/**
 * 일정 조회 오류를 화면 상태로 바꾼다.
 *
 * @param {unknown} error StandardizedApi 오류
 * @returns {string} CONSULTATION_RECORD_SCREEN_STATUS 값
 */
const resolveLoadErrorStatus = (error) => {
  const status = error?.status;
  if (status === HTTP_STATUS.FORBIDDEN) return CONSULTATION_RECORD_SCREEN_STATUS.FORBIDDEN;
  if (status === HTTP_STATUS.NOT_FOUND) return CONSULTATION_RECORD_SCREEN_STATUS.NOT_FOUND;
  return CONSULTATION_RECORD_SCREEN_STATUS.ERROR;
};

/**
 * 상담일지 작성 전체화면 (/consultant/consultation-record/:consultationId).
 *
 * <p>경로의 일정 id 로 일정을 불러온 뒤, 대시보드·일정 화면과 같은 {@link ConsultationLogModal} 을 띄운다.
 * 내담자 프로필·기존 일지 조회, 필수값 검증, 저장/수정 API, 서버 초안 자동저장·복구 확인·덮어쓰기 확인,
 * 미저장 이탈 확인은 모두 모달이 담당한다(화면별 중복 구현 금지).</p>
 *
 * @returns {JSX.Element}
 */
const ConsultationRecordScreen = () => {
  const { t } = useTranslation();
  const { consultationId: routeScheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSession();
  const userId = user?.id;
  const userRole = user?.role;

  const [loadStatus, setLoadStatus] = useState(CONSULTATION_RECORD_SCREEN_STATUS.LOADING);
  const [schedule, setSchedule] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    if (userId == null || !userRole) {
      return undefined;
    }
    const numericScheduleId = normalizeMissingLogScheduleId(routeScheduleId);
    if (numericScheduleId == null) {
      setSchedule(null);
      setLoadStatus(CONSULTATION_RECORD_SCREEN_STATUS.NOT_FOUND);
      return undefined;
    }
    const seq = loadSeqRef.current + 1;
    loadSeqRef.current = seq;
    setSchedule(null);
    setLoadStatus(CONSULTATION_RECORD_SCREEN_STATUS.LOADING);
    (async() => {
      try {
        const resolved = await fetchScheduleMetaForMissingLog({
          scheduleId: numericScheduleId,
          userId,
          userRole
        });
        if (loadSeqRef.current !== seq) return;
        if (!resolved) {
          setLoadStatus(CONSULTATION_RECORD_SCREEN_STATUS.NOT_FOUND);
          return;
        }
        setSchedule(resolved);
        setLoadStatus(CONSULTATION_RECORD_SCREEN_STATUS.READY);
      } catch (error) {
        if (loadSeqRef.current !== seq) return;
        console.warn('상담일지 화면 — 일정 조회 실패:', error?.status);
        setLoadStatus(resolveLoadErrorStatus(error));
      }
    })();
    return () => {
      loadSeqRef.current += 1;
    };
  }, [routeScheduleId, userId, userRole, reloadToken]);

  const handleLeave = useCallback(() => {
    if (location.key && location.key !== INITIAL_LOCATION_KEY) {
      navigate(-1);
      return;
    }
    navigate(CONSULTANT_DASHBOARD_ROUTES.DASHBOARD, { replace: true });
  }, [location.key, navigate]);

  const handleRetry = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  const title = t('common:consultant.ConsultationRecordScreen.t_a0658140');
  const isFailure = loadStatus === CONSULTATION_RECORD_SCREEN_STATUS.NOT_FOUND
    || loadStatus === CONSULTATION_RECORD_SCREEN_STATUS.FORBIDDEN
    || loadStatus === CONSULTATION_RECORD_SCREEN_STATUS.ERROR;

  return (
    <AdminCommonLayout title={title}>
      <ContentArea ariaLabel={title}>
        <ContentHeader
          title={title}
          subtitle={toDisplayString(STATUS_SUBTITLE[loadStatus], '')}
          titleId={CONSULTATION_RECORD_TITLE_ID}
          actions={isFailure ? (
            <>
              {loadStatus === CONSULTATION_RECORD_SCREEN_STATUS.ERROR ? (
                <MGButton
                  type="button"
                  variant="primary"
                  className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleRetry}
                >
                  {CONSULTATION_RECORD_SCREEN_STRINGS.RETRY}
                </MGButton>
              ) : null}
              <MGButton
                type="button"
                variant="secondary"
                className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleLeave}
              >
                {CONSULTATION_RECORD_SCREEN_STRINGS.BACK}
              </MGButton>
            </>
          ) : null}
        />
        {loadStatus === CONSULTATION_RECORD_SCREEN_STATUS.LOADING ? (
          <div className="consultation-record-screen-loading" role="status" aria-live="polite">
            <div className="mg-loading">{t('common:consultant.ConsultationRecordScreen.t_f596b561')}</div>
          </div>
        ) : null}
        <ConsultationLogModal
          isOpen={loadStatus === CONSULTATION_RECORD_SCREEN_STATUS.READY && schedule != null}
          scheduleData={schedule}
          onClose={handleLeave}
          isAdmin={false}
          routeLeaveGuard
        />
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default ConsultationRecordScreen;
