/**
 * Consultation Summary Widget
 * 상담소 특화 통계 요약 위젯
 * SummaryPanels의 상담소 특화 기능을 포함
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../../common/UnifiedLoading';
import { apiGet } from '../../../../utils/ajax';
import { RoleUtils } from '../../../../constants/roles';
import { getStatusLabel } from '../../../../utils/colorUtils';
import '../Widget.css';
import '../../SummaryPanels.css';

const ConsultationSummaryWidget = ({ widget, user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadData();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadData, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.data) {
      setData(config.data);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(dataSource.url, dataSource.params || {});
      
      if (response) {
        setData(response);
      } else {
        setData(config.data || {});
      }
    } catch (err) {
      console.error('ConsultationSummaryWidget 데이터 로드 실패:', err);
      setError(err.message);
      setData(config.data || {});
    } finally {
      setLoading(false);
    }
  };
  
  // 전문 분야 영어를 한글로 변환
  const convertSpecialtyToKorean = (specialty) => {
    if (!specialty) return '전문 분야 미정';
    
    const specialtyMap = config.specialtyMap || {
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
  
  if (loading && !data) {
    return (
      <div className="widget widget-consultation-summary">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  if (error && !data) {
    return (
      <div className="widget widget-consultation-summary widget-error">
        <div className="widget-title">{config.title || '상담 요약'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  const consultationData = data || {};
  const upcomingCount = consultationData?.upcomingConsultations?.length || 0;
  const weeklyCount = consultationData?.weeklyConsultations || 0;
  const monthlyCount = consultationData?.monthlyConsultations || 0;
  const todayCount = consultationData?.todayConsultations || 0;
  const totalUsers = consultationData?.totalUsers || 0;
  const pendingMappings = consultationData?.pendingMappings || 0;
  const activeMappings = consultationData?.activeMappings || 0;
  const rating = consultationData?.rating || 0;
  
  return (
    <div className="widget widget-consultation-summary">
      <div className="widget-header">
        <div className="widget-title">{config.title || '상담 요약'}</div>
      </div>
      <div className="widget-body">
        {/* 상담 일정 요약 (상담사/관리자 전용) */}
        {(RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user)) && (
          <div className="summary-panel consultation-summary">
            <div className="summary-panel-header">
              <h3 className="summary-panel-title">
                <i className="bi bi-calendar"></i>
                상담 일정
              </h3>
            </div>
            <div className="summary-panel-content">
              <div className="summary-item">
                <div className="summary-icon">
                  <i className="bi bi-clock"></i>
                </div>
                <div className="summary-info">
                  <div className="summary-label">다가오는 상담</div>
                  <div className="summary-value">
                    {upcomingCount > 0 ? (
                      <div>
                        <div className="summary-value-number">{upcomingCount}건</div>
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
                        {upcomingCount > 3 && (
                          <div className="summary-panels-more-indicator">
                            <a href={config.scheduleUrl || "/consultant/schedule"} className="mg-v2-link">
                              +{upcomingCount - 3}건 더 보기 →
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="summary-no-data">예정된 상담이 없습니다</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">
                  <i className="bi bi-calendar-check"></i>
                </div>
                <div className="summary-info">
                  <div className="summary-label">이번 주 상담</div>
                  <div className="summary-value">
                    <div className="summary-value-count">{weeklyCount}건</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 상담 통계 (상담사 전용) */}
        {RoleUtils.isConsultant(user) && (
          <div className="summary-panel consultation-stats">
            <div className="summary-panel-header">
              <h3 className="summary-panel-title">
                <i className="bi bi-graph-up"></i>
                상담 통계
              </h3>
            </div>
            <div className="summary-panel-content">
              <div className="summary-item">
                <div className="summary-icon">
                  <i className="bi bi-calendar"></i>
                </div>
                <div className="summary-info">
                  <div className="summary-label">이번 달 상담</div>
                  <div className="summary-value">{monthlyCount}건</div>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">
                  <i className="bi bi-star"></i>
                </div>
                <div className="summary-info">
                  <div className="summary-label">평점</div>
                  <div className="summary-value">
                    {rating > 0 ? `${rating.toFixed(1)} / 5.0` : '평점 없음'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 시스템 현황 (관리자 전용) */}
        {RoleUtils.isAdmin(user) && (
          <div className="summary-panel system-status">
            <div className="summary-panel-header">
              <h3 className="summary-panel-title">
                <i className="bi bi-gear"></i>
                시스템 현황
              </h3>
            </div>
            <div className="summary-panel-content">
              <div className="summary-item">
                <div className="summary-icon">
                  <i className="bi bi-people"></i>
                </div>
                <div className="summary-info">
                  <div className="summary-label">총 사용자</div>
                  <div className="summary-value">{totalUsers}명</div>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">
                  <i className="bi bi-calendar"></i>
                </div>
                <div className="summary-info">
                  <div className="summary-label">오늘 상담</div>
                  <div className="summary-value">{todayCount}건</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 매핑 관리 (관리자 전용) */}
        {RoleUtils.isAdmin(user) && (
          <div className="summary-panel mapping-management">
            <div className="summary-panel-header">
              <h3 className="summary-panel-title">
                <i className="bi bi-link-45deg"></i>
                매핑 관리
              </h3>
            </div>
            <div className="summary-panel-content">
              <div className="summary-item">
                <div className="summary-icon">
                  <i className="bi bi-clock"></i>
                </div>
                <div className="summary-info">
                  <div className="summary-label">승인 대기</div>
                  <div className="summary-value">{pendingMappings}건</div>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">
                  <i className="bi bi-check-circle"></i>
                </div>
                <div className="summary-info">
                  <div className="summary-label">활성 매핑</div>
                  <div className="summary-value">{activeMappings}건</div>
                </div>
              </div>
              {config.mappingManagementUrl && (
                <div className="summary-panel-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => window.location.href = config.mappingManagementUrl}
                  >
                    <i className="bi bi-gear"></i> 매핑 관리
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationSummaryWidget;

