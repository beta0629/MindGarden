import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { ConsultantStatsCard } from '../Card';
import { useTranslation } from 'react-i18next';

/**
 * 상담 완료 통계 뷰 컴포넌트 (Presentational)
/**
 * - 순수 UI 컴포넌트
/**
 * - 비즈니스 로직 없음
/**
 * - props로 데이터와 핸들러를 받음
 */
const ConsultationCompletionStatsView = ({
    statistics,
    loading,
    error,
    selectedPeriod,
    periodOptions,
    onPeriodChange,
    onRetry,
    convertGradeToKorean,
    convertSpecialtyToKorean
}) => {
    const { t } = useTranslation(['statistics', 'common']);
    const getGradeLabel = (grade) =>
      grade ? convertGradeToKorean(grade) : null;
    const getSpecializationLabel = (specialization) =>
      specialization ? convertSpecialtyToKorean(specialization) : null;

    if (loading) {
        return (
            <div className="mg-v2-loading-container">
                <div className="mg-v2-spinner" />
                <p>{t('statistics:completion.loadingText')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mg-v2-error-state">
                <p>{error}</p>
                <MGButton
                    className={buildErpMgButtonClassName({
                        variant: 'danger',
                        size: 'md',
                        loading: false,
                        className: 'mg-v2-button mg-button-danger'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={onRetry}
                    variant="danger"
                >
                    {t('common.labels.retry')}
                </MGButton>
            </div>
        );
    }

    return (
        <div className="mg-v2-card">
            {/* 헤더 */}
            <div className="mg-v2-card-header">
                <div className="mg-v2-flex mg-justify-between mg-align-center mg-mb-md">
                    <h3 className="mg-v2-h3 mg-mb-0">
                        {t('statistics:completion.title')}
                    </h3>
                    <div className="mg-v2-flex mg-align-center mg-gap-sm">
                            <label className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary mg-font-medium">
                            {t('statistics:completion.period')}
                        </label>
                        <select
                            className="mg-v2-select mg-select-sm"
                            value={selectedPeriod}
                            onChange={onPeriodChange}
                        >
                            <option value="">{t('common.labels.all')}</option>
                            {periodOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* 요약 정보 카드 */}
                <div className="mg-v2-stats-grid mg-mt-lg">
                    <div className="mg-v2-stat-card mg-v2-text-center">
                        <div className="mg-v2-stat-icon primary">
                            👥
                        </div>
                        <div className="mg-v2-stat-value mg-v2-color-primary mg-mb-sm">
                            {statistics.length}
                        </div>
                        <div className="mg-v2-stat-label">
                            {t('statistics:completion.totalConsultants')}
                        </div>
                    </div>
                    
                    <div className="mg-v2-stat-card mg-v2-text-center">
                        <div className="mg-v2-stat-icon success">
                            ✅
                        </div>
                        <div className="mg-v2-stat-value mg-v2-color-success mg-mb-sm">
                            {statistics.reduce((sum, stat) => sum + stat.completedCount, 0)}
                        </div>
                        <div className="mg-v2-stat-label">
                            {t('statistics:completion.completedCount')}
                        </div>
                    </div>
                    
                    <div className="mg-v2-stat-card mg-v2-text-center">
                        <div className="mg-v2-stat-icon warning">
                            📊
                        </div>
                        <div className="mg-v2-stat-value mg-v2-stat-value-warning">
                            {statistics.length > 0 
                                ? Math.round(statistics.reduce((sum, stat) => sum + stat.completedCount, 0) / statistics.length)
                                : 0
                            }
                        </div>
                        <div className="mg-v2-stat-label">
                            {t('statistics:completion.avgCount')}
                        </div>
                    </div>
                </div>
            </div>

            {/* 상담사별 통계 카드 그리드 */}
            <div className="mg-v2-management-grid mg-mt-lg">
                {statistics.map((stat, index) => (
                    <ConsultantStatsCard
                        key={stat.consultantId}
                        rank={index + 1}
                        consultantName={stat.consultantName}
                        consultantPhone={stat.consultantPhone}
                        gradeLabel={getGradeLabel(stat.grade)}
                        specializationLabel={getSpecializationLabel(stat.specialization)}
                        completedCount={stat.completedCount}
                        totalCount={stat.totalCount}
                        completionRate={stat.completionRate}
                    />
                ))}
            </div>

            {statistics.length === 0 && (
                <div className="mg-v2-card mg-v2-text-center mg-v2-pt-xl mg-v2-px-xxl mg-v2-mt-md">
                    <div className="mg-v2-empty-state-icon mg-v2-empty-state-icon-large">
                        📊
                    </div>
                    <h3 className="mg-v2-empty-title">
                        {t('statistics:completion.noData')}
                    </h3>
                    <p className="mg-v2-empty-description">
                        {t('statistics:completion.noDataHint')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ConsultationCompletionStatsView;

