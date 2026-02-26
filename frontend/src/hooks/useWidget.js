/**
 * Core Solution 위젯 표준 커스텀 훅
 * 
/**
 * 모든 위젯에서 공통으로 사용되는 로직을 표준화
/**
 * - API 호출 및 데이터 관리
/**
 * - 로딩 및 에러 상태 관리
/**
 * - 자동 새로고침
/**
 * - 캐싱 및 최적화
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-11-28
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '../utils/ajax';
import { WIDGET_CONSTANTS } from '../constants/widgetConstants';

/**
 * 표준화된 위젯 데이터 관리 훅
 * 
 * @param {Object} config - 위젯 설정
 * @param {Object} config.dataSource - 데이터 소스 설정
 * @param {string} config.dataSource.type - 데이터 타입 ('api', 'static')
 * @param {string} config.dataSource.url - API URL
 * @param {Object} config.dataSource.params - API 파라미터
 * @param {number} config.dataSource.refreshInterval - 자동 새로고침 간격 (ms)
 * @param {Function} config.dataSource.transform - 데이터 변환 함수
/**
 * @param {any} config.defaultValue - 기본값
/**
 * @param {Object} user - 현재 사용자 정보
/**
 * @param {Object} options - 추가 옵션
/**
 * @param {boolean} options.immediate - 즉시 로드 여부 (기본: true)
/**
 * @param {boolean} options.cache - 캐싱 사용 여부 (기본: false)
/**
 * @param {number} options.retryCount - 재시도 횟수 (기본: 3)
/**
 * @param {number} options.retryDelay - 재시도 지연 시간 (기본: 1000ms)
/**
 * 
/**
 * @returns {Object} 위젯 상태 및 메서드
 */
export const useWidget = (config = {}, user = null, options = {}) => {
  // 기본 옵션 설정
  const {
    immediate = true,
    cache = false,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  // 상태 관리
  const [data, setData] = useState(config.defaultValue || null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // 참조 관리
  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const cacheRef = useRef(new Map());
  const loadDataRef = useRef(null);

  // 데이터 소스 설정 추출
  const dataSource = config.dataSource || {};
  const {
    type = 'static',
    url,
    params = {},
    refreshInterval,
    transform,
    endpoints = [] // multi-api 전용
  } = dataSource;

/**
   * 캐시 키 생성
   */
  const getCacheKey = useCallback(() => {
    if (!url) return null;
    const key = `${url}_${JSON.stringify(params)}_${user?.id || 'anonymous'}`;
    return key;
  }, [url, params, user?.id]);

/**
   * 캐시에서 데이터 가져오기
   */
  const getCachedData = useCallback(() => {
    if (!cache) return null;
    const cacheKey = getCacheKey();
    if (!cacheKey) return null;
    
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5분 캐시
      return cached.data;
    }
    return null;
  }, [cache, getCacheKey]);

/**
   * 캐시에 데이터 저장
   */
  const setCachedData = useCallback((data) => {
    if (!cache) return;
    const cacheKey = getCacheKey();
    if (!cacheKey) return;
    
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }, [cache, getCacheKey]);

/**
   * 데이터 변환 함수
   */
  const transformData = useCallback((rawData) => {
    if (transform && typeof transform === 'function') {
      return transform(rawData);
    }

    // 기본 데이터 변환 로직
    if (rawData && typeof rawData === 'object') {
      // 표준 API 응답 구조에서 데이터 추출
      return rawData.data || rawData.result || rawData.value || rawData;
    }

    return rawData;
  }, [transform]);

/**
   * API 데이터 로드
   */
  const loadData = useCallback(async (showLoading = true) => {
    // static 타입은 그대로 종료
    if (type === 'static') {
      if (showLoading) setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // 캐시된 데이터 확인 (api/multi-api 모두 동일)
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        setLastUpdated(new Date());
        if (showLoading) setLoading(false);
        return;
      }

      // 단일 API (api | single-api 동일 처리)
      if (type === 'api' || type === 'single-api') {
        if (!url) {
          if (showLoading) setLoading(false);
          return;
        }
        console.debug(`🔄 위젯 데이터 로드: ${url}`, params);

        const response = await apiGet(url, params);
        if (response !== null && response !== undefined) {
          const transformedData = transformData(response);
          setData(transformedData);
          setLastUpdated(new Date());
          setRetryAttempt(0);
          setCachedData(transformedData);
          console.debug(`✅ 위젯 데이터 로드 성공: ${url}`, transformedData);
        } else {
          setData(config.defaultValue || null);
          console.warn(`⚠️ 위젯 데이터 응답이 비어있음: ${url}`);
        }
        return;
      }

      // 다중 API (표준 위젯들이 이미 사용 중인 type)
      if (type === 'multi-api') {
        const safeEndpoints = Array.isArray(endpoints) ? endpoints : [];
        if (safeEndpoints.length === 0) {
          setData(config.defaultValue || null);
          return;
        }

        const responses = await Promise.all(
          safeEndpoints.map(async (ep) => {
            const epUrl = ep?.url;
            const epParams = ep?.params || {};
            const fallback = ep?.fallback;
            if (!epUrl) return fallback;
            try {
              const r = await apiGet(epUrl, epParams);
              return r !== null && r !== undefined ? transformData(r) : fallback;
            } catch (e) {
              return fallback;
            }
          })
        );

        const multiTransformed = transform && typeof transform === 'function'
          ? transform(responses)
          : responses;

        setData(multiTransformed);
        setLastUpdated(new Date());
        setRetryAttempt(0);
        setCachedData(multiTransformed);
        return;
      }

      // 알 수 없는 타입
      setData(config.defaultValue || null);
    } catch (err) {
      console.error(`❌ 위젯 데이터 로드 실패: ${url || 'multi-api'}`, err);
      
      const errorMessage = err.message || WIDGET_CONSTANTS.ERROR_MESSAGES.LOAD_FAILED;
      setError(errorMessage);
      
      // 400 Bad Request는 클라이언트 오류이므로 재시도하지 않음 (무한 루프 방지)
      // 401, 403은 인증/권한 문제이므로 재시도하지 않음
      const isClientError = err.status === 400 || err.status === 401 || err.status === 403;
      if (isClientError) {
        console.warn(`⚠️ 클라이언트 오류 (${err.status}) - 재시도 중단: ${url || 'multi-api'}`);
        setData(config.defaultValue || null);
        return; // 재시도하지 않고 종료
      }
      
      // 재시도 로직 (500 이상의 서버 오류만 재시도)
      if (retryAttempt < retryCount) {
        console.log(`🔄 위젯 데이터 재시도 (${retryAttempt + 1}/${retryCount}): ${url || 'multi-api'}`);
        setRetryAttempt(prev => prev + 1);
        
        retryTimeoutRef.current = setTimeout(() => {
          loadData(false); // 재시도 시에는 로딩 상태 표시하지 않음
        }, retryDelay * (retryAttempt + 1)); // 지수 백오프
      } else {
        // 재시도 횟수 초과 시 기본값 사용
        setData(config.defaultValue || null);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [
    type, url, params, endpoints, transform, getCachedData, setCachedData, transformData, 
    config.defaultValue, retryAttempt, retryCount, retryDelay
  ]);

/**
   * 수동 새로고침
   */
  const refresh = useCallback(async () => {
    // 캐시 클리어
    if (cache) {
      const cacheKey = getCacheKey();
      if (cacheKey) {
        cacheRef.current.delete(cacheKey);
      }
    }
    
    setRetryAttempt(0);
    await loadData(true);
  }, [loadData, cache, getCacheKey]);

/**
   * 자동 새로고침 설정
   */
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        loadData(false); // 자동 새로고침 시에는 로딩 상태 표시하지 않음
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refreshInterval, loadData]);

  // loadData 변경 시 ref에 반영 (초기 로드 effect가 loadData에 의존하지 않도록)
  loadDataRef.current = loadData;

  /**
   * 초기 데이터 로드 (api / single-api / multi-api 모두 최초 마운트 시 1회만 실행)
   * loadData를 deps에 넣지 않아, 500 재시도 시 loadData 변경으로 effect가 반복 실행되는 것을 방지
   */
  useEffect(() => {
    if (immediate) {
      if (type === 'api' || type === 'single-api' || type === 'multi-api') {
        loadDataRef.current?.(true);
      } else if (type === 'static' && config.defaultValue !== undefined) {
        setData(config.defaultValue);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [immediate, type, config.defaultValue]);

/**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

/**
   * 데이터 포맷팅 유틸리티
   */
  const formatValue = useCallback((value, format = 'default') => {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'currency':
        return typeof value === 'number' ? `₩${value.toLocaleString()}` : value;
      case 'percentage':
        return typeof value === 'number' ? `${value}%` : value;
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : value;
      case 'datetime':
        return value instanceof Date ? value.toLocaleString() : value;
      default:
        return value;
    }
  }, []);

/**
   * 에러 상태 확인
   */
  const hasError = Boolean(error);
  
/**
   * 데이터 존재 여부 확인
   */
  const hasData = data !== null && data !== undefined;

/**
   * 빈 상태 확인
   */
  const isEmpty = !hasData || (Array.isArray(data) && data.length === 0);

  return {
    // 상태
    data,
    loading,
    error,
    lastUpdated,
    retryAttempt,
    
    // 상태 확인
    hasError,
    hasData,
    isEmpty,
    
    // 메서드
    refresh,
    loadData,
    formatValue,
    
    // 설정
    config: {
      ...config,
      dataSource
    }
  };
};

/**
 * 다중 위젯 데이터 관리를 위한 유틸리티
/**
 * 
/**
 * 주의: React Hook 규칙으로 인해 동적 개수의 Hook을 사용할 수 없으므로
/**
 * 이 함수는 일반 함수로 구현하고, 각 위젯에서 개별적으로 useWidget을 사용하세요.
/**
 * 
/**
 * @param {Array} widgetResults - useWidget 결과들의 배열
/**
 * @returns {Object} 통합된 상태 정보
 */
export const combineWidgetResults = (widgetResults = []) => {
  const loading = widgetResults.some(widget => widget.loading);
  const hasError = widgetResults.some(widget => widget.hasError);
  const errors = widgetResults.filter(widget => widget.hasError).map(widget => widget.error);

  const refresh = async () => {
    await Promise.all(widgetResults.map(widget => widget.refresh()));
  };

  return {
    widgets: widgetResults,
    loading,
    hasError,
    errors,
    refresh
  };
};

export default useWidget;
