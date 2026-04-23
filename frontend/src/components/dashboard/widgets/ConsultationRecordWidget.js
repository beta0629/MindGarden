// CommonDashboard는 본 파일을 사용. WidgetRegistry는 ./consultation/ConsultationRecordWidget.js를 사용한다.
// 스타일 변경 시 ./ConsultationRecordWidget.css와 ./consultation/ConsultationRecordWidget.css를 함께 점검할 것.
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { RoleUtils } from '../../../constants/roles';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import './ConsultationRecordWidget.css';
const ConsultationRecordWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // 데이터 소스 설정 (상담사 전용)
  const getDataSourceConfig = () => ({
    type: 'api',
    cache: true,
    refreshInterval: 300000, // 5분마다 새로고침 (상담일지 변경)
    url: `/api/consultant/${user.id}/consultation-records`,
    params: {
      includeRecentRecords: true,
      recentLimit: 3
    }
  });

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (상담일지 데이터)
  const {
    data: records,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isConsultant(user),
    cache: true,
    retryCount: 3
  });

  // 상담사 전용 위젯 (다른 역할은 표시하지 않음)
  if (!RoleUtils.isConsultant(user)) {
    return null;
  }

  // 상담일지 통계 계산
  const calculateRecordStats = (records) => {
    if (!records || !Array.isArray(records)) {
      return {
        totalRecords: 0,
        todayRecords: 0,
        pendingRecords: 0,
        recentRecords: []
      };
    }

    const today = new Date().toISOString().split('T')[0];
    
    const todayRecords = records.filter(record => 
      record.sessionDate && record.sessionDate.startsWith(today)
    ).length;
    
    return {
      totalRecords: records.length,
      todayRecords: todayRecords,
      pendingRecords: records.filter(record => !record.isCompleted).length,
      recentRecords: records.slice(0, 3)
    };
  };

  const recordStats = calculateRecordStats(records);

  // 네비게이션 핸들러들
  const handleViewAllRecords = () => {
    navigate('/consultant/consultation-records');
  };

  const handleCreateRecord = () => {
    navigate('/consultant/schedule');
  };

  const handleViewStatistics = () => {
    navigate('/consultant/consultation-records/statistics');
  };

  const handleViewRecord = (recordId) => {
    navigate(`/consultant/consultation-record-view/${recordId}`);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  // 위젯 헤더 설정
  const headerConfig = {
    title: (
      <div className="consultation-record-header-title">
        📝 상담일지
      </div>
    ),
    actions: (
      <div className="consultation-record-header-actions">
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={handleViewAllRecords}
          preventDoubleClick={false}
        >
          전체보기
        </MGButton>
        <MGButton
          type="button"
          variant="primary"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'sm',
            loading: false
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={handleCreateRecord}
          preventDoubleClick={false}
        >
          
          새 일지 작성
        </MGButton>
      </div>
    )
  };

  // 위젯 콘텐츠
  const renderContent = () => {
    // 에러 상태
    if (error) {
      return (
        <div className="consultation-record-error">
          
          <p>상담일지 정보를 불러올 수 없습니다.</p>
        </div>
      );
    }

    // 빈 상태 (일지 없음)
    if (isEmpty || recordStats.totalRecords === 0) {
      return (
        <div className="consultation-record-empty">
          <div className="consultation-record-empty-icon">📝</div>
          <div className="consultation-record-empty-text">
            아직 작성된 상담일지가 없습니다
          </div>
          <div className="consultation-record-empty-hint">
            첫 번째 상담일지를 작성해보세요
          </div>
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: false,
              className: 'consultation-record-empty-btn'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleCreateRecord}
            preventDoubleClick={false}
          >
            
            상담일지 작성하기
          </MGButton>
        </div>
      );
    }

    return (
      <div className="consultation-record-content">
        {/* 통계 카드 */}
        <div className="consultation-record-stats">
          <div className="consultation-record-stat-card primary">
            <div className="consultation-record-stat-icon" />
            <div className="consultation-record-stat-content">
              <div className="consultation-record-stat-value">
                {recordStats.totalRecords}
              </div>
              <div className="consultation-record-stat-label">총 일지</div>
            </div>
          </div>

          <div className="consultation-record-stat-card secondary">
            <div className="consultation-record-stat-icon" />
            <div className="consultation-record-stat-content">
              <div className="consultation-record-stat-value">
                {recordStats.todayRecords}
              </div>
              <div className="consultation-record-stat-label">오늘 작성</div>
            </div>
          </div>

          <div className="consultation-record-stat-card warning">
            <div className="consultation-record-stat-icon" />
            <div className="consultation-record-stat-content">
              <div className="consultation-record-stat-value">
                {recordStats.pendingRecords}
              </div>
              <div className="consultation-record-stat-label">미완료</div>
            </div>
          </div>
        </div>

        {/* 최근 상담일지 목록 */}
        {recordStats.recentRecords.length > 0 && (
          <div className="consultation-record-recent">
            <h4 className="consultation-record-section-title">
              최근 상담일지
            </h4>
            <div className="consultation-record-recent-list">
              {recordStats.recentRecords.map((record, index) => (
                <div 
                  key={record.id || index} 
                  className="consultation-record-recent-item"
                >
                  <div className="consultation-record-recent-content">
                    <div className="consultation-record-recent-header">
                      <div className="consultation-record-recent-title">
                        {record.clientName || '내담자'} - {record.sessionDate}
                      </div>
                      <div className="consultation-record-recent-meta">
                        <span className={`consultation-record-status ${record.isCompleted ? 'completed' : 'pending'}`}>
                          {record.isCompleted ? (
                            <>
                              
                              완료
                            </>
                          ) : (
                            <>
                              
                              미완료
                            </>
                          )}
                        </span>
                        <span className="consultation-record-date">
                          {formatDate(record.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <MGButton
                    type="button"
                    variant="outline"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'sm',
                      loading: false,
                      className: 'consultation-record-view-btn'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => handleViewRecord(record.id)}
                    preventDoubleClick={false}
                  >
                    
                    보기
                  </MGButton>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 빠른 액션 */}
        <div className="consultation-record-actions">
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: false,
              className: 'consultation-record-action-btn primary'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleCreateRecord}
            preventDoubleClick={false}
          >
            
            새 일지 작성
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: 'consultation-record-action-btn secondary'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleViewAllRecords}
            preventDoubleClick={false}
          >
            
            전체 목록
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: 'consultation-record-action-btn tertiary'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleViewStatistics}
            preventDoubleClick={false}
          >
            
            통계 보기
          </MGButton>
        </div>
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={null} // 에러를 내부적으로 처리
      hasData={hasData}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="consultation-record-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ConsultationRecordWidget;
