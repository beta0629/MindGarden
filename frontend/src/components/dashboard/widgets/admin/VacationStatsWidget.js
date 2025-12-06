import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import StatCard from '../../../ui/Card/StatCard';
import MGButton from '../../../../components/common/MGButton'; // 임시 비활성화
import { WIDGET_CONSTANTS } from '../../../../constants/widgetConstants';
import { MG_DESIGN_TOKENS } from '../../../../constants/designTokens';

/**
 * 휴가 통계를 보여주는 위젯
/**
 * 
/**
 * @param {Object} widget - 위젯 설정 정보
/**
 * @param {Object} user - 현재 사용자 정보
/**
 * @returns {JSX.Element}
 */
const VacationStatsWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  
  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 위젯 내용 렌더링
  const renderContent = () => {
    if (!hasData) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_STATS_GRID}>
        <StatCard
          icon={<span>📊</span>}
          value={formatValue(data?.count || 0, 'number')}
          label="데이터 수"
          color={MG_DESIGN_TOKENS.COLORS.PRIMARY}
        />
        {/* TODO: 실제 데이터에 맞게 StatCard들을 추가하세요 */}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default VacationStatsWidget;
