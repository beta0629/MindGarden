/**
 * 통계 모달 컴포넌트
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2025-09-05
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, BarChart, Calendar } from 'lucide-react';
import { apiGet } from '../../utils/ajax';
import { SCHEDULE_API, API_BASE_URL } from '../../constants/api';
import { STATS_LOADING_STATES, STATS_ERROR_MESSAGES } from '../../constants/stats';
import StatisticsGrid from './StatisticsGrid';
import UnifiedModal from './modals/UnifiedModal';

const StatisticsModal = ({ isOpen, onClose, userRole = 'ADMIN' }) => {
  const [statistics, setStatistics] = useState(null);
  const [todayStatistics, setTodayStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('overall');

  // 통계 데이터 로드
  const loadStatistics = async () => {
    setLoading(true);
    setError(false);
    
    try {
      console.log('📊 통계 API 요청 시작:', SCHEDULE_API.STATISTICS, { userRole });
      console.log('🍪 현재 쿠키:', document.cookie);
      
      // 직접 fetch를 사용해서 더 자세한 로깅
      const url = `${SCHEDULE_API.STATISTICS}?userRole=${userRole}`;
      console.log('🔗 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('📡 응답 상태:', response.status, response.statusText);
      console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 응답 오류:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📊 통계 API 응답:', data);
      
      // 백엔드에서 Map<String, Object>를 직접 반환하므로 success 필드 없음
      if (data && typeof data === 'object') {
        setStatistics(data);
        console.log('✅ 통계 데이터 설정 완료');
      } else {
        console.error('❌ 잘못된 응답 형식:', data);
        setError(true);
      }
    } catch (err) {
      console.error('❌ 통계 로드 실패:', err);
      console.error('❌ 에러 상세:', err.message, err.stack);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 오늘 통계 데이터 로드
  const loadTodayStatistics = async () => {
    setLoading(true);
    setError(false);
    
    try {
      console.log('📊 오늘 통계 API 요청 시작:', SCHEDULE_API.TODAY_STATISTICS, { userRole });
      console.log('🍪 현재 쿠키:', document.cookie);
      
      // 직접 fetch를 사용해서 더 자세한 로깅
      const url = `${API_BASE_URL}${SCHEDULE_API.TODAY_STATISTICS}?userRole=${userRole}`;
      console.log('🔗 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('📡 응답 상태:', response.status, response.statusText);
      console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 응답 오류:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📊 오늘 통계 API 응답:', data);
      
      // 백엔드에서 Map<String, Object>를 직접 반환하므로 success 필드 없음
      if (data && typeof data === 'object') {
        setTodayStatistics(data);
        console.log('✅ 오늘 통계 데이터 설정 완료');
      } else {
        console.error('❌ 잘못된 응답 형식:', data);
        setError(true);
      }
    } catch (err) {
      console.error('❌ 오늘 통계 로드 실패:', err);
      console.error('❌ 에러 상세:', err.message, err.stack);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 통계 로드
  useEffect(() => {
    if (isOpen) {
      loadStatistics();
    }
  }, [isOpen]);

  // 탭 변경 시 해당 통계 로드
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'today') {
        loadTodayStatistics();
      } else {
        loadStatistics();
      }
    }
  }, [activeTab, isOpen]);

  // 카드 클릭 핸들러
  const handleCardClick = (type, value) => {
    console.log('통계 카드 클릭:', type, value);
    // 필요시 상세 정보 모달이나 필터링 기능 구현
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    if (activeTab === 'today') {
      loadTodayStatistics();
    } else {
      loadStatistics();
    }
  };

  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="통계 보기"
      size="auto"
      backdropClick
      showCloseButton
      loading={loading}
      actions={
        <>
          <button
            className="mg-button mg-button-outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} />
            새로고침
          </button>
          <button
            className="mg-button mg-button-primary"
            onClick={onClose}
          >
            닫기
          </button>
        </>
      }
    >
        <div className="mg-modal-body">
          <div className="mg-tabs">
            <button 
              className={`mg-tab ${activeTab === 'overall' ? 'mg-tab-active' : ''}`}
              onClick={() => setActiveTab('overall')}
            >
              <BarChart size={16} />
              전체 통계
            </button>
            <button 
              className={`mg-tab ${activeTab === 'today' ? 'mg-tab-active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              <Calendar size={16} />
              오늘 통계
            </button>
          </div>
          
          <div className="mg-modal-content">
            <StatisticsGrid
              statistics={activeTab === 'overall' ? statistics : todayStatistics}
              loading={loading}
              error={error}
              onCardClick={handleCardClick}
              showOverall={activeTab === 'overall'}
              showToday={activeTab === 'today'}
            />
          </div>
        </div>
    </UnifiedModal>
  );
};

StatisticsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userRole: PropTypes.string
};

// defaultProps 제거 - JavaScript 기본 매개변수 사용 (line 17: userRole = 'ADMIN')

export default StatisticsModal;
