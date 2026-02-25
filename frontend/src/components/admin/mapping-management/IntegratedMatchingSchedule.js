/**
 * IntegratedMatchingSchedule - 매칭·스케줄 통합 원스톱 화면
 * 좌: 매칭 목록(실 API /api/v1/admin/mappings), 우: 스케줄 캘린더(실 API)
 * "스케줄 등록" 클릭 시 ScheduleModal을 상담사·내담자 Pre-filled로 오픈
 *
 * @author MindGarden
 * @since 2025-02-25
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarPlus } from 'lucide-react';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import UnifiedLoading from '../../common/UnifiedLoading';
import UnifiedScheduleComponent from '../../schedule/UnifiedScheduleComponent';
import ScheduleModal from '../../schedule/ScheduleModal';
import '../../../styles/unified-design-tokens.css';
import '../AdminDashboard/AdminDashboardB0KlA.css';
import './IntegratedMatchingSchedule.css';

const STATUS_KO = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  PENDING_PAYMENT: '결제 대기',
  PAYMENT_CONFIRMED: '결제 확인',
  TERMINATED: '종료됨',
  SESSIONS_EXHAUSTED: '회기 소진',
  SUSPENDED: '일시정지'
};

const getStatusKoreanName = (status) => STATUS_KO[status] || status;

const IntegratedMatchingSchedule = () => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [preFilledMapping, setPreFilledMapping] = useState(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState(() => new Date());
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const loadMappings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await StandardizedApi.get('/api/v1/admin/mappings');
      if (response && response.mappings) {
        setMappings(response.mappings);
      } else if (response && Array.isArray(response)) {
        setMappings(response);
      } else {
        setMappings([]);
      }
    } catch (error) {
      console.error('매칭 목록 로드 실패:', error);
      setMappings([]);
      notificationManager.error('매칭 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  const handleScheduleRegister = (mapping) => {
    if (!mapping.consultantId || !mapping.clientId) {
      notificationManager.error('상담사·내담자 정보가 없는 매칭입니다.');
      return;
    }
    setPreFilledMapping({
      consultantId: mapping.consultantId,
      clientId: mapping.clientId,
      consultantName: mapping.consultantName || '상담사',
      clientName: mapping.clientName || '내담자'
    });
    setSelectedDateForModal(new Date());
    setScheduleModalOpen(true);
  };

  const handleScheduleModalClose = () => {
    setScheduleModalOpen(false);
    setPreFilledMapping(null);
  };

  const handleScheduleCreated = () => {
    setRefetchTrigger((t) => t + 1);
    loadMappings();
    setScheduleModalOpen(false);
    setPreFilledMapping(null);
  };

  return (
    <div className="integrated-schedule">
      <header className="integrated-schedule__header">
        <h1 className="integrated-schedule__title">통합 스케줄링 센터</h1>
      </header>

      <div className="integrated-schedule__content">
        <aside className="integrated-schedule__sidebar">
          <h2 className="integrated-schedule__sidebar-title">매칭 목록</h2>
          {loading ? (
            <UnifiedLoading type="inline" text="매칭 목록 불러오는 중..." />
          ) : (
            <ul className="integrated-schedule__list" aria-label="매칭 목록">
              {mappings.length === 0 ? (
                <li className="integrated-schedule__empty">매칭이 없습니다.</li>
              ) : (
                mappings.map((mapping) => (
                  <li key={mapping.id} className="integrated-schedule__card">
                    <div className="integrated-schedule__card-body">
                      <div className="integrated-schedule__card-parties">
                        <span className="integrated-schedule__card-consultant">
                          {mapping.consultantName || 'N/A'}
                        </span>
                        <span className="integrated-schedule__card-arrow">→</span>
                        <span className="integrated-schedule__card-client">
                          {mapping.clientName || 'N/A'}
                        </span>
                      </div>
                      <div className="integrated-schedule__card-meta">
                        <span className="integrated-schedule__card-status">
                          {getStatusKoreanName(mapping.status)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="integrated-schedule__btn-schedule"
                      onClick={() => handleScheduleRegister(mapping)}
                      aria-label={`${mapping.clientName} 스케줄 등록`}
                    >
                      <CalendarPlus size={14} />
                      스케줄 등록
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </aside>

        <main className="integrated-schedule__calendar-wrapper">
          <UnifiedScheduleComponent
            userRole="ADMIN"
            refetchTrigger={refetchTrigger}
          />
        </main>
      </div>

      {scheduleModalOpen && (
        <ScheduleModal
          isOpen={scheduleModalOpen}
          onClose={handleScheduleModalClose}
          selectedDate={selectedDateForModal}
          selectedInfo={null}
          userRole="ADMIN"
          userId={null}
          onScheduleCreated={handleScheduleCreated}
          preFilledMapping={preFilledMapping}
        />
      )}
    </div>
  );
};

export default IntegratedMatchingSchedule;
