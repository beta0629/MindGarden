import React from 'react';
import { FaChartLine, FaSync } from 'react-icons/fa';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { useTranslation } from 'react-i18next';

/**
 * 오늘의 통계 뷰 컴포넌트 (Presentational)
/**
 * - 순수 UI 컴포넌트
/**
 * - 비즈니스 로직 없음
/**
 * - props로 데이터와 핸들러를 받음
 */
const TodayStatisticsView = ({
    statistics,
    loading,
    lastUpdated,
    onShowStatistics,
    onRefresh
}) => {
    const { t } = useTranslation(['statistics', 'common']);
    return (
        <div className="today-statistics">
            <div className="statistics-header">
                <h3 className="statistics-title">
                    <FaChartLine className="title-icon" />
                    {t('statistics:today.title')}
                </h3>
                <div className="statistics-actions">
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'outline',
                            size: 'md',
                            loading: false,
                            className: 'statistics-view-btn mg-button--with-icon'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={onShowStatistics}
                        title={t('statistics:today.viewAll')}
                        variant="outline"
                        preventDoubleClick={false}
                    >
                        <i className="bi bi-graph-up" />
                        {t('statistics:today.viewAll')}
                    </MGButton>
                    <MGButton
                        type="button"
                        className={buildErpMgButtonClassName({
                            variant: 'outline',
                            size: 'md',
                            loading,
                            className: 'refresh-btn'
                        })}
                        loading={loading}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={onRefresh}
                        disabled={loading}
                        title={t('common.actions.refresh')}
                        variant="outline"
                        preventDoubleClick={false}
                    >
                        <FaSync className={loading ? 'spinning' : ''} />
                    </MGButton>
                </div>
            </div>
            
            <div className="statistics-grid">
                <div className="stat-card total">
                    <div className="stat-number">{statistics.totalToday}</div>
                    <div className="stat-label">{t('statistics:today.totalConsultations')}</div>
                </div>
                
                <div className="stat-card completed">
                    <div className="stat-number">{statistics.completedToday}</div>
                    <div className="stat-label">{t('common.actions.done')}</div>
                </div>
                
                <div className="stat-card in-progress">
                    <div className="stat-number">{statistics.inProgressToday}</div>
                    <div className="stat-label">{t('common.labels.inProgress')}</div>
                </div>
                
                <div className="stat-card cancelled">
                    <div className="stat-number">{statistics.cancelledToday}</div>
                    <div className="stat-label">{t('common.actions.cancel')}</div>
                </div>
            </div>
            
            {lastUpdated && (
                <div className="last-updated">
                    {t('statistics:today.lastUpdated')} {lastUpdated.toLocaleTimeString('ko-KR')}
                </div>
            )}
        </div>
    );
};

export default TodayStatisticsView;

