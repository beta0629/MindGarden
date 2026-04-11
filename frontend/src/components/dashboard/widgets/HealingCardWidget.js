/**
 * Healing Card Widget - 표준화된 힐링 카드 위젯
/**
 * HealingCard 컴포넌트를 위젯으로 변환 + 표준화 적용
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */

import React from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import MGButton from '../../common/MGButton';
import { RoleUtils } from '../../../constants/roles';
import './HealingCardWidget.css';
import '../../../components/common/HealingCard.css';

const HealingCardWidget = ({ widget, user }) => {
  // 역할별 데이터 소스 설정
  const getDataSourceConfig = () => {
    const targetRole = RoleUtils.isConsultant(user) ? 'CONSULTANT' : 'CLIENT';
    const category = widget?.config?.category || null;
    
    const params = {};
    if (category) params.category = category;
    if (targetRole) params.userRole = targetRole;

    return {
      type: 'api',
      cache: false, // 힐링 컨텐츠는 항상 최신 상태 유지
      refreshInterval: 300000, // 5분마다 자동 새로고침
      url: '/api/v1/healing/content',
      params: params
    };
  };

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (힐링 컨텐츠 API)
  const {
    data: healingData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isClient(user) || RoleUtils.isConsultant(user),
    cache: false, // 힐링 메시지는 캐시하지 않음
    retryCount: 3
  });

  // 내담자와 상담사만 표시 (다른 역할은 숨김)
  if (!RoleUtils.isClient(user) && !RoleUtils.isConsultant(user)) {
    return null;
  }

  // 새로고침 핸들러 (API 변경)
  const handleRefresh = async () => {
    const targetRole = RoleUtils.isConsultant(user) ? 'CONSULTANT' : 'CLIENT';
    const category = widget?.config?.category || null;
    
    const params = {};
    if (category) params.category = category;
    if (targetRole) params.userRole = targetRole;

    // 새로고침 API 호출 (기존 로직 유지)
    try {
      const { apiGet } = await import('../../../utils/ajax');
      const paramString = new URLSearchParams(params).toString();
      const response = await apiGet(`/api/healing/refresh?${paramString}`);
      
      if (response.success) {
        // 성공 시 위젯 데이터 새로고침
        refresh();
      } else {
        console.error('힐링 컨텐츠 새로고침 실패:', response.message);
      }
    } catch (err) {
      console.error('힐링 컨텐츠 새로고침 오류:', err);
    }
  };

  // 카테고리 한글 이름 변환
  const getCategoryDisplayName = (category) => {
    switch (category) {
      case 'HUMOR': return '유머';
      case 'WARM_WORDS': return '따뜻한 말';
      case 'MEDITATION': return '명상';
      case 'MOTIVATION': return '격려';
      case 'GENERAL': return '힐링';
      default: return '힐링';
    }
  };

  // 기본 힐링 데이터 (API 실패 시 사용)
  const defaultHealingData = {
    emoji: '💚',
    title: '오늘의 힐링',
    content: '마음의 평화를 찾는 하루가 되시길 바랍니다.',
    category: 'GENERAL'
  };

  // 실제 데이터 또는 기본값 사용
  const currentHealingData = healingData || defaultHealingData;

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={false} // 힐링 메시지는 항상 표시
      onRefresh={refresh}
      customActions={[
        {
          icon: <RefreshCw size={16} />,
          label: '새로운 메시지',
          onClick: handleRefresh,
          disabled: loading
        }
      ]}
    >
      <div className="healing-card-widget-content">
        {/* 힐링 카드 헤더 */}
        <div className="healing-card-header">
          <div className="healing-title-section">
            {currentHealingData?.emoji && (
              <span className="healing-emoji">{currentHealingData.emoji}</span>
            )}
            <h3 className="healing-title">
              {currentHealingData?.title || '오늘의 힐링'}
            </h3>
          </div>
          <MGButton
            className="healing-refresh-btn"
            variant="outline"
            type="button"
            onClick={handleRefresh}
            title="새로운 메시지 보기"
            disabled={loading}
          >
            {loading ? (
              <div className="healing-refresh-loading">⏳</div>
            ) : (
              <RefreshCw size={18} />
            )}
          </MGButton>
        </div>

        {/* 힐링 컨텐츠 */}
        <div className="healing-content-section">
          <div 
            className="healing-content"
            dangerouslySetInnerHTML={{
              __html: currentHealingData?.content || '마음의 평화를 찾는 하루가 되시길 바랍니다. 💚'
            }}
          />
        </div>

        {/* 카테고리 배지 */}
        {currentHealingData?.category && (
          <div className="healing-category-section">
            <span className="healing-category-badge">
              <Heart size={14} />
              {getCategoryDisplayName(currentHealingData.category)}
            </span>
          </div>
        )}

        {/* 역할별 맞춤 메시지 */}
        <div className="healing-role-message">
          {RoleUtils.isConsultant(user) ? (
            <p className="role-specific-message consultant">
              🌟 상담사님의 하루에 따뜻함을 더해드려요
            </p>
          ) : (
            <p className="role-specific-message client">
              🌸 오늘도 소중한 당신을 응원합니다
            </p>
          )}
        </div>
      </div>
    </BaseWidget>
  );
};

export default HealingCardWidget;