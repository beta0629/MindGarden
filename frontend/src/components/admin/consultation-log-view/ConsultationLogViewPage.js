/**
 * 상담일지 조회 본문 - ContentArea + ContentHeader + 필터 + 목록
 * 역할별: 관리자 전체/상담사 본인만. 필터 변경 시 목록 재호출.
 *
 * @author Core Solution
 * @since 2025-03-02
 */

import React, { useState, useEffect, useCallback } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import { useSession } from '../../../contexts/SessionContext';
import { USER_ROLES } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import UnifiedLoading from '../../common/UnifiedLoading';
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

const PAGE_TITLE = '상담일지 조회';
const PAGE_SUBTITLE = '상담일지를 검색하고 목록에서 클릭해 수정할 수 있습니다.';
const VIEW_MODE_LIST = 'list';
const VIEW_MODE_CALENDAR = 'calendar';
const VIEW_MODE_TABLE = 'table';
const TAB_LABELS = {
  [VIEW_MODE_CALENDAR]: '캘린더',
  [VIEW_MODE_LIST]: '목록',
  [VIEW_MODE_TABLE]: '테이블'
};
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 50;

const ConsultationLogViewPage = () => {
  const { user } = useSession();
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const [consultants, setConsultants] = useState([]);
  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultantId, setConsultantId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [modalRecordId, setModalRecordId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODE_LIST);

  const loadConsultants = useCallback(async () => {
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

  const loadClients = useCallback(async () => {
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

  const loadRecords = useCallback(async () => {
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
          const response = await StandardizedApi.get('/api/v1/admin/consultation-records', params);
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
  }, [user?.id, user?.name, isAdmin, consultantId, clientId, normalizeConsultantRecords]);

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
      <ContentArea>
        <div aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text="데이터를 불러오는 중..." variant="pulse" />
        </div>
      </ContentArea>
    );
  }

  return (
    <>
      <ContentArea>
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
            <button
              key={mode}
              type="button"
              className={`mg-v2-consultation-log-view-tabs__tab ${viewMode === mode ? 'mg-v2-consultation-log-view-tabs__tab--active' : ''}`}
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              aria-current={viewMode === mode ? 'true' : undefined}
            >
              {TAB_LABELS[mode]}
            </button>
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
