/**
 * 상담일지 조회 본문 - ContentArea + ContentHeader + 필터 + 목록
 * 역할별: 관리자 전체/상담사 본인만. 필터 변경 시 목록 재호출.
 *
 * @author Core Solution
 * @since 2025-03-02
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import StandardizedApi from '../../../utils/standardizedApi';
import { useSession } from '../../../contexts/SessionContext';
import { USER_ROLES } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import UnifiedLoading from '../../common/UnifiedLoading';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import ConsultationLogFilterSection from './ConsultationLogFilterSection';
import { toDateStr } from '../../../utils/dateUtils';
import ConsultationLogListBlock from './ConsultationLogListBlock';
import ConsultationLogCalendarBlock from './ConsultationLogCalendarBlock';
import ConsultationLogTableBlock from './ConsultationLogTableBlock';
import ConsultationLogModal from '../../consultant/ConsultationLogModal';
import { getAllConsultantsWithStats, getAllClientsWithStats } from '../../../utils/consultantHelper';
import '../ConsultationLogViewPage.css';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ADMIN_CONSULTATION_RECORDS = '/api/v1/admin/consultation-records';


const PAGE_TITLE = '상담일지 조회';
const PAGE_SUBTITLE = '상담일지를 검색하고 목록에서 클릭해 수정할 수 있습니다.';
const CONTENT_AREA_ARIA_LABEL = '상담일지 조회 콘텐츠';
const VIEW_MODE_LIST = 'list';
const VIEW_MODE_CALENDAR = 'calendar';
const VIEW_MODE_TABLE = 'table';
const TAB_LABELS = {
  [VIEW_MODE_CALENDAR]: '캘린더',
  [VIEW_MODE_LIST]: '목록',
  [VIEW_MODE_TABLE]: '테이블'
};
const DEFAULT_PAGE = 0;
// P0 핫픽스 2026-05-29: 백엔드 어드민 상담일지 조회 캡(200)에 맞춰 100 으로 상향.
// 참고: docs/project-management/2026-05-29/CONSULTATION_LOG_VIEW_APRIL_MISSING_DEBUG.md
const DEFAULT_SIZE = 100;
// 진입 시 기본 표시 기간 = "지난 달 1일 ~ 이번 달 말일".
// 사용자가 startDate/endDate 를 직접 비우면 null 전송 → 백엔드 전체 모드 (페이지네이션).
const DEFAULT_RANGE_MONTHS_BEFORE = 1;

/**
 * 기본 기간 (지난 달 1일 ~ 이번 달 말일) 을 ISO yyyy-MM-dd 문자열로 계산.
 *
 * @param {Date} [now] 기준 일시 (테스트에서 주입 가능, 기본값: 현재 시각)
 * @returns {{ startDate: string, endDate: string }}
 */
export const computeDefaultDateRange = (now = new Date()) => {
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month - DEFAULT_RANGE_MONTHS_BEFORE, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: fmt(start), endDate: fmt(end) };
};

/**
 * URL `?date=yyyy-mm-dd` 등 deep link 쿼리에서 시작·종료 일자를 추출.
 * 단일 날짜만 있을 때는 startDate=endDate=해당일.
 *
 * @param {URLSearchParams|null|undefined} searchParams
 * @returns {{ startDate: string, endDate: string }|null}
 */
export const computeRangeFromQuery = (searchParams) => {
  if (!searchParams || typeof searchParams.get !== 'function') {
    return null;
  }
  const dateRaw = searchParams.get('date');
  if (!dateRaw) {
    return null;
  }
  const match = String(dateRaw).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    return null;
  }
  const iso = `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
  return { startDate: iso, endDate: iso };
};

/**
 * URL 쿼리에서 숫자 ID 파라미터 추출. 정수가 아닌 경우 null.
 *
 * @param {URLSearchParams|null|undefined} searchParams
 * @param {string} key
 * @returns {number|null}
 */
export const parseNumericQueryParam = (searchParams, key) => {
  if (!searchParams || typeof searchParams.get !== 'function') {
    return null;
  }
  const raw = searchParams.get(key);
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
};

const ConsultationLogViewPage = () => {
  const { user } = useSession();
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const [searchParams] = useSearchParams();

  /**
   * Deep link 쿼리(`?date=...&clientId=...&consultantId=...&scheduleId=...`)를
   * 페이지 초기 필터로 1회 적용. 이후 사용자가 필터를 변경하면 그대로 유지.
   */
  const initialQueryFilter = useMemo(() => {
    const range = computeRangeFromQuery(searchParams);
    return {
      startDate: range?.startDate ?? null,
      endDate: range?.endDate ?? null,
      clientId: parseNumericQueryParam(searchParams, 'clientId'),
      consultantId: parseNumericQueryParam(searchParams, 'consultantId'),
      scheduleId: parseNumericQueryParam(searchParams, 'scheduleId')
    };
  // 초기 마운트 시 1회만 계산 (deep link 의도). 이후 검색 변화 시 사용자 필터 우선.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [consultants, setConsultants] = useState([]);
  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultantId, setConsultantId] = useState(initialQueryFilter.consultantId);
  const [clientId, setClientId] = useState(initialQueryFilter.clientId);
  const [startDate, setStartDate] = useState(
    () => initialQueryFilter.startDate ?? computeDefaultDateRange().startDate
  );
  const [endDate, setEndDate] = useState(
    () => initialQueryFilter.endDate ?? computeDefaultDateRange().endDate
  );
  const [modalRecordId, setModalRecordId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODE_LIST);

  const loadConsultants = useCallback(async() => {
    if (!isAdmin) return;
    try {
      const list = await getAllConsultantsWithStats();
      const arr = Array.isArray(list) ? list : [];
      setConsultants(arr.map((item) => {
        const c = item.consultant || item;
        return { ...item, id: c.id, name: c.name ?? c.userName, userName: c.userName ?? c.name };
      }));
    } catch (e) {
      console.error('상담사 목록 로드 실패:', e);
      setConsultants([]);
    }
  }, [isAdmin]);

  const loadClients = useCallback(async() => {
    try {
      const list = await getAllClientsWithStats();
      const arr = Array.isArray(list) ? list : [];
      setClients(arr.map((item) => {
        const c = item.client || item;
        return { ...item, id: c.id, name: c.name ?? c.userName, userName: c.userName ?? c.name };
      }));
    } catch (e) {
      console.error('내담자 목록 로드 실패:', e);
      setClients([]);
    }
  }, []);

  /** 상담사 본인 목록 응답을 목록 뷰 형식으로 정규화 */
  const normalizeConsultantRecords = useCallback((list, consultantDisplayName) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.map((r) => ({
      id: r.id,
      sessionDate: r.consultationDate ?? r.sessionDate,
      consultationDate: r.consultationDate,
      sessionNumber: r.sessionNumber,
      clientName: r.clientName,
      consultantName: consultantDisplayName ?? '본인',
      isSessionCompleted: r.isSessionCompleted,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      clientId: r.clientId,
      consultantId: r.consultantId
    }));
  }, []);

  const loadRecords = useCallback(async() => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (isAdmin) {
        try {
          const params = {
            page: DEFAULT_PAGE,
            size: DEFAULT_SIZE
          };
          if (consultantId != null) params.consultantId = consultantId;
          if (clientId != null) params.clientId = clientId;
          // P0 핫픽스 2026-05-29: 기간 필터를 백엔드로 전달.
          // (이전: 클라이언트 사이드 필터만 사용 → MAX_PAGE_SIZE=20 캡으로 4월 데이터 미노출)
          if (startDate) params.startDate = startDate;
          if (endDate) params.endDate = endDate;
          const response = await StandardizedApi.get(API_ADMIN_CONSULTATION_RECORDS, params);
          const list = Array.isArray(response) ? response : (response?.data ?? []);
          setRecords(Array.isArray(list) ? list : []);
        } catch (adminErr) {
          if (adminErr?.status === 403 || (adminErr?.message && adminErr.message.includes('관리자 권한'))) {
            const consultantResponse = await StandardizedApi.get(
              `/api/v1/admin/consultant-records/${user.id}/consultation-records`
            );
            const list = Array.isArray(consultantResponse) ? consultantResponse : (consultantResponse?.data ?? []);
            setRecords(normalizeConsultantRecords(list, user?.name));
          } else {
            throw adminErr;
          }
        }
      } else {
        const response = await StandardizedApi.get(
          `/api/v1/admin/consultant-records/${user.id}/consultation-records`
        );
        const list = Array.isArray(response) ? response : (response?.data ?? []);
        setRecords(normalizeConsultantRecords(list, user?.name));
      }
    } catch (e) {
      console.error('상담일지 목록 로드 실패:', e);
      setRecords([]);
      const message = e?.status === 403
        ? '관리자 권한이 필요합니다. 권한을 확인해주세요.'
        : '상담일지 목록을 불러오는데 실패했습니다.';
      notificationManager.error(message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.name, isAdmin, consultantId, clientId, startDate, endDate, normalizeConsultantRecords]);

  useEffect(() => {
    loadConsultants();
    loadClients();
  }, [loadConsultants, loadClients]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const clientNameMap = {};
  const consultantNameMap = {};
  (clients || []).forEach((c) => {
    const id = Number((c.client || c).id ?? c.id);
    const name = (c.client || c).name ?? (c.client || c).userName ?? c.name ?? c.userName ?? '';
    if (!Number.isNaN(id)) clientNameMap[id] = name;
  });
  (consultants || []).forEach((c) => {
    const id = Number((c.consultant || c).id ?? c.id);
    const name = (c.consultant || c).name ?? (c.consultant || c).userName ?? c.name ?? c.userName ?? '';
    if (!Number.isNaN(id)) consultantNameMap[id] = name;
  });

  let filteredRecords = records;
  if (startDate || endDate) {
    filteredRecords = records.filter((r) => {
      const sd = r.sessionDate ?? r.consultationDate;
      const d = toDateStr(sd);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }

  const handleOpenModal = (recordId) => {
    setModalRecordId(recordId);
    setModalOpen(true);
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

  if (loading && records.length === 0) {
    return (
      <ContentArea ariaLabel={CONTENT_AREA_ARIA_LABEL}>
        <ContentHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />
        <div aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text="데이터를 불러오는 중..." variant="pulse" />
        </div>
      </ContentArea>
    );
  }

  return (
    <>
      <ContentArea ariaLabel={CONTENT_AREA_ARIA_LABEL}>
        <ContentHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />

        <ConsultationLogFilterSection
          isAdmin={isAdmin}
          consultantId={consultantId}
          consultants={consultants}
          onConsultantChange={setConsultantId}
          clientId={clientId}
          clients={clients}
          onClientChange={setClientId}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        <nav className="mg-v2-consultation-log-view-tabs" aria-label="뷰 전환">
          {[VIEW_MODE_CALENDAR, VIEW_MODE_LIST, VIEW_MODE_TABLE].map((mode) => (
            <MGButton
              key={mode}
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: `mg-v2-consultation-log-view-tabs__tab ${viewMode === mode ? 'mg-v2-consultation-log-view-tabs__tab--active' : ''}`
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              aria-current={viewMode === mode ? 'true' : undefined}
              preventDoubleClick={false}
            >
              {TAB_LABELS[mode]}
            </MGButton>
          ))}
        </nav>

        {viewMode === VIEW_MODE_CALENDAR && (
          <ConsultationLogCalendarBlock
            records={filteredRecords}
            clientNameMap={clientNameMap}
            consultantNameMap={consultantNameMap}
            onOpenModal={handleOpenModal}
          />
        )}
        {viewMode === VIEW_MODE_LIST && (
          <ConsultationLogListBlock
            records={filteredRecords}
            clientNameMap={clientNameMap}
            consultantNameMap={consultantNameMap}
            onCardClick={handleOpenModal}
          />
        )}
        {viewMode === VIEW_MODE_TABLE && (
          <ConsultationLogTableBlock
            records={filteredRecords}
            clientNameMap={clientNameMap}
            consultantNameMap={consultantNameMap}
            onRowClick={handleOpenModal}
          />
        )}
      </ContentArea>

      <ConsultationLogModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        recordId={modalRecordId}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default ConsultationLogViewPage;
