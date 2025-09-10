import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { SUMMARY_PANELS_CSS } from '../../constants/css';
import { DASHBOARD_ICONS, DASHBOARD_LABELS, DASHBOARD_MESSAGES } from '../../constants/dashboard';
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
      {/* 상담 일정 요약 */}
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
                    <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#495057' }}>{upcomingCount}건</div>
                    {consultationData?.upcomingConsultations?.map((schedule, index) => (
                      <div key={index} style={{ 
                        fontSize: '0.85em', 
                        color: '#6c757d', 
                        marginTop: '6px',
                        padding: '6px 10px',
                        backgroundColor: '#fdf2f8',
                        borderRadius: '6px',
                        border: '1px solid #fce7f3',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ fontWeight: '500', color: '#495057' }}>
                          {new Date(schedule.date).toLocaleDateString('ko-KR')} {schedule.startTime} - {schedule.endTime}
                        </div>
                        <div style={{ 
                          color: schedule.status === 'CONFIRMED' ? '#be185d' : '#6c757d',
                          fontSize: '0.8em',
                          marginTop: '2px'
                        }}>
                          {schedule.status === 'CONFIRMED' ? '확정' : schedule.status === 'BOOKED' ? '예약' : schedule.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#adb5bd', fontStyle: 'italic' }}>{DASHBOARD_MESSAGES.NO_UPCOMING}</div>
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
                <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#495057' }}>{weeklyCount}건</div>
                {consultationData?.weeklyConsultations > 0 && (
                  <div style={{ 
                    fontSize: '0.85em', 
                    color: '#6c757d', 
                    marginTop: '6px',
                    padding: '6px 10px',
                    backgroundColor: '#fdf2f8',
                    borderRadius: '6px',
                    border: '1px solid #fce7f3',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    이번 주 상담 일정
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 상담사 목록 (내담자 전용) */}
      {user?.role === 'CLIENT' && (
        <div className={`${SUMMARY_PANELS_CSS.PANEL} consultant-list`}>
          <div className={SUMMARY_PANELS_CSS.PANEL_HEADER}>
            <h3 className={SUMMARY_PANELS_CSS.PANEL_TITLE}>
              <i className={`${SUMMARY_PANELS_CSS.PANEL_ICON} ${DASHBOARD_ICONS.PERSON_BADGE}`}></i>
              상담사 목록
            </h3>
          </div>
          <div className={SUMMARY_PANELS_CSS.PANEL_CONTENT}>
            {consultationData?.consultantList && consultationData.consultantList.length > 0 ? (
              <div className="consultant-list-container">
                {consultationData.consultantList.map((consultant, index) => (
                  <div key={consultant.id || index} className="consultant-card">
                    <div className="consultant-avatar">
                      <img 
                        src={consultant.profileImage || '/default-avatar.svg'} 
                        alt={`${consultant.name} 상담사`}
                        onError={(e) => {
                          e.target.src = '/default-avatar.svg';
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '50%'
                        }}
                      />
                    </div>
                    <div className="consultant-details">
                      <div className="consultant-name">
                        {consultant.name}
                      </div>
                      <div className="consultant-specialty">
                        {convertSpecialtyToKorean(consultant.specialty)}
                      </div>
                      <div className="consultant-intro">
                        {consultant.intro}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-consultants">
                <i className="bi bi-person-x"></i>
                <p>상담받은 상담사가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 상담 일정 (상담사 전용) */}
      {user?.role === 'CONSULTANT' && (
        <div className={`${SUMMARY_PANELS_CSS.PANEL} consultation-schedule`}>
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
                      <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#495057' }}>{upcomingCount}건</div>
                      {consultationData?.upcomingConsultations?.map((schedule, index) => (
                        <div key={index} style={{ 
                          fontSize: '0.85em', 
                          color: '#6c757d', 
                          marginTop: '6px',
                          padding: '6px 10px',
                          backgroundColor: '#fdf2f8',
                          borderRadius: '6px',
                          border: '1px solid #fce7f3',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ fontWeight: '500', color: '#495057' }}>
                            {new Date(schedule.date).toLocaleDateString('ko-KR')} {schedule.startTime} - {schedule.endTime}
                          </div>
                          <div style={{ 
                            color: schedule.status === 'CONFIRMED' ? '#be185d' : '#6c757d',
                            fontSize: '0.8em',
                            marginTop: '2px'
                          }}>
                            {schedule.status === 'CONFIRMED' ? '확정' : schedule.status === 'BOOKED' ? '예약' : schedule.status}
                          </div>
                          {schedule.clientName && (
                            <div style={{ 
                              color: '#6c757d',
                              fontSize: '0.8em',
                              marginTop: '2px'
                            }}>
                              내담자: {schedule.clientName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#adb5bd', fontStyle: 'italic' }}>{DASHBOARD_MESSAGES.NO_UPCOMING}</div>
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
                  <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#495057' }}>{weeklyCount}건</div>
                  {consultationData?.weeklyConsultations > 0 && (
                    <div style={{ 
                      fontSize: '0.85em', 
                      color: '#6c757d', 
                      marginTop: '6px',
                      padding: '6px 10px',
                      backgroundColor: '#fdf2f8',
                      borderRadius: '6px',
                      border: '1px solid #fce7f3',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
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
      {user?.role === 'CONSULTANT' && (
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
      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
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
      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
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

