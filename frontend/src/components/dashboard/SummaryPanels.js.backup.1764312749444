import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { SUMMARY_PANELS_CSS } from '../../constants/css';
import { DASHBOARD_ICONS, DASHBOARD_LABELS, DASHBOARD_MESSAGES } from '../../constants/dashboard';
import { RoleUtils } from '../../constants/roles';
import { getStatusLabel } from '../../utils/colorUtils';
import './SummaryPanels.css';

const SummaryPanels = ({ user, consultationData }) => {
  // 상담 일정 데이터 처리
  const upcomingCount = consultationData?.upcomingConsultations?.length || 0;
  const weeklyCount = consultationData?.weeklyConsultations || 0;
  const monthlyCount = consultationData?.monthlyConsultations || 0;
  const todayCount = consultationData?.todayConsultations || 0;
  const totalUsers = consultationData?.totalUsers || 0;
  const pendingMappings = consultationData?.pendingMappings || 0;
  const activeMappings = consultationData?.activeMappings || 0;
  const consultantInfo = consultationData?.consultantInfo || {};
  const rating = consultationData?.rating || 0;

  // 전문 분야 영어를 한글로 변환
  const convertSpecialtyToKorean = (specialty) => {
    if (!specialty) return '전문 분야 미정';
    
    const specialtyMap = {
      'DEPRESSION': '우울증',
      'ANXIETY': '불안장애',
      'TRAUMA': '트라우마',
      'RELATIONSHIP': '관계상담',
      'FAMILY': '가족상담',
      'COUPLE': '부부상담',
      'CHILD': '아동상담',
      'ADOLESCENT': '청소년상담',
      'ADDICTION': '중독상담',
      'EATING_DISORDER': '섭식장애',
      'PERSONALITY': '성격장애',
      'BIPOLAR': '양극성장애',
      'OCD': '강박장애',
      'PTSD': '외상후스트레스장애',
      'GRIEF': '상실상담',
      'CAREER': '진로상담',
      'STRESS': '스트레스관리',
      'SLEEP': '수면장애',
      'ANGER': '분노조절',
      'SELF_ESTEEM': '자존감'
    };

    return specialty.split(',').map(s => {
      const trimmed = s.trim();
      return specialtyMap[trimmed] || trimmed;
    }).join(', ');
  };

  return (
    <div className={SUMMARY_PANELS_CSS.CONTAINER}>
      {/* 상담 일정 요약 (상담사/관리자 전용) */}
      {(RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user)) && (
        <div className={`${SUMMARY_PANELS_CSS.PANEL} consultation-summary`}>
          <div className={SUMMARY_PANELS_CSS.PANEL_HEADER}>
            <h3 className={SUMMARY_PANELS_CSS.PANEL_TITLE}>
              <i className={`${SUMMARY_PANELS_CSS.PANEL_ICON} ${DASHBOARD_ICONS.CALENDAR}`}></i>
              {DASHBOARD_LABELS.CONSULTATION_SCHEDULE}
            </h3>
          </div>
          <div className={SUMMARY_PANELS_CSS.PANEL_CONTENT}>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
                <i className={DASHBOARD_ICONS.CLOCK}></i>
              </div>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>{DASHBOARD_LABELS.UPCOMING_CONSULTATIONS}</div>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>
                  {upcomingCount > 0 ? (
                    <div>
                      <div className="summary-value-number">{upcomingCount}건</div>
                      {/* 최근 3일치 상담만 표시 */}
                      {consultationData?.upcomingConsultations?.slice(0, 3).map((schedule, index) => (
                        <div key={index} className="summary-schedule-item">
                          <div className="summary-schedule-datetime">
                            {new Date(schedule.date).toLocaleDateString('ko-KR')} {schedule.startTime} - {schedule.endTime}
                          </div>
                          <div 
                            className="summary-schedule-status"
                            data-status={schedule.status}
                          >
                            {getStatusLabel(schedule.status)}
                          </div>
                        </div>
                      ))}
                      
                      {/* 더 많은 상담이 있을 때 자세히 보기 링크 */}
                      {upcomingCount > 3 && (
                        <div className="summary-panels-more-indicator">
                          <a 
                            href="/consultant/schedule" 
                            className="mg-v2-link"
                          >
                            +{upcomingCount - 3}건 더 보기 →
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="summary-no-data">{DASHBOARD_MESSAGES.NO_UPCOMING}</div>
                  )}
                </div>
              </div>
            </div>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
                <i className={DASHBOARD_ICONS.CALENDAR_CHECK}></i>
              </div>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>{DASHBOARD_LABELS.THIS_WEEK_CONSULTATIONS}</div>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>
                  <div className="summary-value-count">{weeklyCount}건</div>
                  {consultationData?.weeklyConsultations > 0 && (
                    <div className="summary-value-detail">
                      이번 주 상담 일정
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      

      {/* 상담 통계 (상담사 전용) */}
      {RoleUtils.isConsultant(user) && (
        <div className={`${SUMMARY_PANELS_CSS.PANEL} consultation-stats`}>
          <div className={SUMMARY_PANELS_CSS.PANEL_HEADER}>
            <h3 className={SUMMARY_PANELS_CSS.PANEL_TITLE}>
              <i className={`${SUMMARY_PANELS_CSS.PANEL_ICON} ${DASHBOARD_ICONS.GRAPH_UP}`}></i>
              {DASHBOARD_LABELS.CONSULTATION_STATS}
            </h3>
          </div>
          <div className={SUMMARY_PANELS_CSS.PANEL_CONTENT}>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
                <i className={DASHBOARD_ICONS.CALENDAR}></i>
              </div>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>{DASHBOARD_LABELS.THIS_MONTH_CONSULTATIONS}</div>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>{monthlyCount}건</div>
              </div>
            </div>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
                <i className={DASHBOARD_ICONS.STAR}></i>
              </div>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>{DASHBOARD_LABELS.RATING}</div>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>
                  {rating > 0 ? `${rating.toFixed(1)} / 5.0` : DASHBOARD_MESSAGES.NO_RATING}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {/* 시스템 현황 (관리자 전용) */}
      {RoleUtils.isAdmin(user) && (
        <div className={`${SUMMARY_PANELS_CSS.PANEL} system-status`}>
          <div className={SUMMARY_PANELS_CSS.PANEL_HEADER}>
            <h3 className={SUMMARY_PANELS_CSS.PANEL_TITLE}>
              <i className={`${SUMMARY_PANELS_CSS.PANEL_ICON} ${DASHBOARD_ICONS.GEAR}`}></i>
              {DASHBOARD_LABELS.SYSTEM_STATUS}
            </h3>
          </div>
          <div className={SUMMARY_PANELS_CSS.PANEL_CONTENT}>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
                <i className={DASHBOARD_ICONS.PEOPLE}></i>
              </div>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>{DASHBOARD_LABELS.TOTAL_USERS}</div>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>{totalUsers}명</div>
              </div>
            </div>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
                <i className={DASHBOARD_ICONS.CALENDAR}></i>
              </div>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>{DASHBOARD_LABELS.TODAY_CONSULTATIONS}</div>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>{todayCount}건</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 매핑 관리 (관리자 전용) */}
      {RoleUtils.isAdmin(user) && (
        <div className={`${SUMMARY_PANELS_CSS.PANEL} mapping-management`}>
          <div className={SUMMARY_PANELS_CSS.PANEL_HEADER}>
            <h3 className={SUMMARY_PANELS_CSS.PANEL_TITLE}>
              <i className={`${SUMMARY_PANELS_CSS.PANEL_ICON} ${DASHBOARD_ICONS.LINK}`}></i>
              {DASHBOARD_LABELS.MAPPING_MANAGEMENT}
            </h3>
          </div>
          <div className={SUMMARY_PANELS_CSS.PANEL_CONTENT}>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
                <i className={DASHBOARD_ICONS.CLOCK}></i>
              </div>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>{DASHBOARD_LABELS.PENDING_APPROVALS}</div>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>{pendingMappings}건</div>
              </div>
            </div>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
                <i className="bi bi-check-circle"></i>
              </div>
              <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>{DASHBOARD_LABELS.ACTIVE_MAPPINGS}</div>
                <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>{activeMappings}건</div>
              </div>
            </div>
            <div className={SUMMARY_PANELS_CSS.MAPPING_ACTIONS}>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => window.location.href = '/admin/mapping-management'}
              >
                <i className="bi bi-gear"></i> 매핑 관리
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPanels;

