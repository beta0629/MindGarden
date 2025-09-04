import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

const SummaryPanels = ({ user, consultationData }) => {
  return (
    <div className="summary-panels">
      {/* 상담 일정 요약 */}
      <div className="summary-panel consultation-summary">
        <div className="panel-header">
          <h3 className="panel-title">
            <i className="bi bi-calendar-event"></i>
            상담 일정
          </h3>
        </div>
        <div className="panel-content">
          <div className="summary-item">
            <div className="summary-icon">
              <i className="bi bi-clock-history"></i>
            </div>
            <div className="summary-info">
              <div className="summary-label">다가오는 상담</div>
              <div className="summary-value">없음</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">
              <i className="bi bi-calendar-check"></i>
            </div>
            <div className="summary-info">
              <div className="summary-label">이번 주 상담</div>
              <div className="summary-value">0건</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 상담사 정보 (내담자 전용) */}
      {user?.role === 'CLIENT' && (
        <div className="summary-panel consultant-info">
          <div className="panel-header">
            <h3 className="panel-title">
              <i className="bi bi-person-badge"></i>
              담당 상담사
            </h3>
          </div>
          <div className="panel-content">
            <div className="consultant-profile">
              <div className="consultant-avatar">
                <i className="bi bi-person-circle"></i>
              </div>
              <div className="consultant-details">
                <div className="consultant-name">김상담</div>
                <div className="consultant-specialty">상담 심리학</div>
                <div className="consultant-intro">전문적이고 따뜻한 상담을 제공합니다.</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 상담 통계 (상담사 전용) */}
      {user?.role === 'CONSULTANT' && (
        <div className="summary-panel consultation-stats">
          <div className="panel-header">
            <h3 className="panel-title">
              <i className="bi bi-graph-up"></i>
              상담 통계
            </h3>
          </div>
          <div className="panel-content">
            <div className="summary-item">
              <div className="summary-icon">
                <i className="bi bi-people"></i>
              </div>
              <div className="summary-info">
                <div className="summary-label">이번 달 상담</div>
                <div className="summary-value">12건</div>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon">
                <i className="bi bi-star"></i>
              </div>
              <div className="summary-info">
                <div className="summary-label">평점</div>
                <div className="summary-value">4.8/5.0</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 시스템 현황 (관리자 전용) */}
      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <div className="summary-panel system-status">
          <div className="panel-header">
            <h3 className="panel-title">
              <i className="bi bi-gear"></i>
              시스템 현황
            </h3>
          </div>
          <div className="panel-content">
            <div className="summary-item">
              <div className="summary-icon">
                <i className="bi bi-people"></i>
              </div>
              <div className="summary-info">
                <div className="summary-label">전체 사용자</div>
                <div className="summary-value">{consultationData.totalUsers}명</div>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon">
                <i className="bi bi-calendar-event"></i>
              </div>
              <div className="summary-info">
                <div className="summary-label">오늘 상담</div>
                <div className="summary-value">{consultationData.todayConsultations}건</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 매핑 관리 (관리자 전용) */}
      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <div className="summary-panel mapping-management">
          <div className="panel-header">
            <h3 className="panel-title">
              <i className="bi bi-link-45deg"></i>
              매핑 관리
            </h3>
          </div>
          <div className="panel-content">
            <div className="summary-item">
              <div className="summary-icon">
                <i className="bi bi-clock-history"></i>
              </div>
              <div className="summary-info">
                <div className="summary-label">승인 대기</div>
                <div className="summary-value">{consultationData.pendingMappings || 0}건</div>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="summary-info">
                <div className="summary-label">활성 매핑</div>
                <div className="summary-value">{consultationData.activeMappings || 0}건</div>
              </div>
            </div>
            <div className="mapping-actions">
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
