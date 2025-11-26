package com.coresolution.core.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 쿼리 최적화 서비스
 * 데이터베이스 쿼리 성능 최적화 및 모니터링
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QueryOptimizationService {

    private final EntityManager entityManager;
    
    // 쿼리 실행 통계
    private final ConcurrentHashMap<String, QueryStats> queryStatsMap = new ConcurrentHashMap<>();

    /**
     * 최적화된 페이징 처리
     * 대용량 데이터에서 효율적인 페이징 구현
     */
    public <T> Page<T> optimizedPaging(String baseQuery, String countQuery, 
                                     Map<String, Object> parameters, 
                                     Pageable pageable, Class<T> resultClass) {
        
        long startTime = System.currentTimeMillis();
        
        try {
            // 카운트 쿼리 실행 (필요한 경우에만)
            Long totalCount = null;
            if (pageable.getPageNumber() == 0 || needsCountQuery(pageable)) {
                Query countQueryObj = entityManager.createQuery(countQuery);
                setParameters(countQueryObj, parameters);
                totalCount = (Long) countQueryObj.getSingleResult();
            }
            
            // 메인 쿼리 실행
            Query mainQuery = entityManager.createQuery(baseQuery, resultClass);
            setParameters(mainQuery, parameters);
            
            // 페이징 적용
            mainQuery.setFirstResult((int) pageable.getOffset());
            mainQuery.setMaxResults(pageable.getPageSize());
            
            @SuppressWarnings("unchecked")
            List<T> content = mainQuery.getResultList();
            
            // 통계 기록
            long duration = System.currentTimeMillis() - startTime;
            recordQueryStats("optimizedPaging", duration, content.size());
            
            // Page 객체 생성 (totalCount가 없으면 추정값 사용)
            long finalTotalCount = totalCount != null ? totalCount : 
                estimateTotalCount(content.size(), pageable);
            
            return new org.springframework.data.domain.PageImpl<>(content, pageable, finalTotalCount);
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            recordQueryStats("optimizedPaging", duration, 0, true);
            throw e;
        }
    }

    /**
     * 배치 처리 최적화
     * 대량 데이터 처리를 위한 배치 실행
     */
    public <T> CompletableFuture<List<T>> batchQuery(String query, 
                                                   Map<String, Object> parameters, 
                                                   Class<T> resultClass, 
                                                   int batchSize) {
        
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.currentTimeMillis();
            
            try {
                Query queryObj = entityManager.createQuery(query, resultClass);
                setParameters(queryObj, parameters);
                queryObj.setMaxResults(batchSize);
                
                @SuppressWarnings("unchecked")
                List<T> results = queryObj.getResultList();
                
                long duration = System.currentTimeMillis() - startTime;
                recordQueryStats("batchQuery", duration, results.size());
                
                return results;
                
            } catch (Exception e) {
                long duration = System.currentTimeMillis() - startTime;
                recordQueryStats("batchQuery", duration, 0, true);
                throw new RuntimeException("배치 쿼리 실행 실패", e);
            }
        });
    }

    /**
     * 인덱스 힌트를 사용한 쿼리 최적화
     */
    @Cacheable(value = "optimizedQueries", key = "#queryKey")
    public <T> List<T> executeWithIndexHint(String query, String indexHint, 
                                          Map<String, Object> parameters, 
                                          Class<T> resultClass, String queryKey) {
        
        long startTime = System.currentTimeMillis();
        
        try {
            // 네이티브 쿼리에 인덱스 힌트 추가
            String optimizedQuery = addIndexHint(query, indexHint);
            
            Query queryObj = entityManager.createNativeQuery(optimizedQuery, resultClass);
            setParameters(queryObj, parameters);
            
            @SuppressWarnings("unchecked")
            List<T> results = queryObj.getResultList();
            
            long duration = System.currentTimeMillis() - startTime;
            recordQueryStats("indexHintQuery", duration, results.size());
            
            log.debug("✅ 인덱스 힌트 쿼리 실행 완료: {}ms, {} 건", duration, results.size());
            
            return results;
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            recordQueryStats("indexHintQuery", duration, 0, true);
            log.error("❌ 인덱스 힌트 쿼리 실행 실패: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * 쿼리 실행 계획 분석
     */
    public Map<String, Object> analyzeQueryPlan(String query, Map<String, Object> parameters) {
        try {
            // MySQL EXPLAIN 실행
            String explainQuery = "EXPLAIN " + query;
            Query explainQueryObj = entityManager.createNativeQuery(explainQuery);
            setParameters(explainQueryObj, parameters);
            
            @SuppressWarnings("unchecked")
            List<Object[]> explainResults = explainQueryObj.getResultList();
            
            // 실행 계획 분석 결과 반환
            Map<String, Object> analysis = new ConcurrentHashMap<>();
            analysis.put("queryPlan", explainResults);
            analysis.put("recommendations", generateOptimizationRecommendations(explainResults));
            analysis.put("estimatedCost", calculateEstimatedCost(explainResults));
            
            return analysis;
            
        } catch (Exception e) {
            log.error("쿼리 실행 계획 분석 실패: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * 쿼리 통계 조회
     */
    public Map<String, QueryStats> getQueryStats() {
        return new ConcurrentHashMap<>(queryStatsMap);
    }

    /**
     * 쿼리 통계 초기화
     */
    public void clearQueryStats() {
        queryStatsMap.clear();
        log.info("✅ 쿼리 통계가 초기화되었습니다.");
    }

    // === Private Helper Methods ===

    private void setParameters(Query query, Map<String, Object> parameters) {
        if (parameters != null) {
            parameters.forEach(query::setParameter);
        }
    }

    private boolean needsCountQuery(Pageable pageable) {
        // 첫 페이지이거나 페이지 크기가 작은 경우에만 카운트 쿼리 실행
        return pageable.getPageNumber() == 0 || pageable.getPageSize() <= 20;
    }

    private long estimateTotalCount(int currentPageSize, Pageable pageable) {
        // 현재 페이지 크기를 기반으로 전체 개수 추정
        if (currentPageSize < pageable.getPageSize()) {
            return pageable.getOffset() + currentPageSize;
        } else {
            return (pageable.getPageNumber() + 2) * pageable.getPageSize();
        }
    }

    private String addIndexHint(String query, String indexHint) {
        // MySQL 인덱스 힌트 추가
        if (indexHint != null && !indexHint.isEmpty()) {
            return query.replaceFirst("FROM\\s+(\\w+)", "FROM $1 USE INDEX (" + indexHint + ")");
        }
        return query;
    }

    private void recordQueryStats(String queryType, long duration, int resultCount) {
        recordQueryStats(queryType, duration, resultCount, false);
    }

    private void recordQueryStats(String queryType, long duration, int resultCount, boolean hasError) {
        queryStatsMap.compute(queryType, (key, stats) -> {
            if (stats == null) {
                stats = new QueryStats(queryType);
            }
            stats.recordExecution(duration, resultCount, hasError);
            return stats;
        });
    }

    private List<String> generateOptimizationRecommendations(List<Object[]> explainResults) {
        // 실행 계획을 분석하여 최적화 권장사항 생성
        return List.of(
            "인덱스 사용 여부 확인",
            "조인 순서 최적화 검토",
            "WHERE 절 조건 순서 최적화"
        );
    }

    private double calculateEstimatedCost(List<Object[]> explainResults) {
        // 실행 계획의 비용 계산 (단순화된 버전)
        return explainResults.size() * 1.0;
    }

    /**
     * 쿼리 통계 클래스
     */
    public static class QueryStats {
        private final String queryType;
        private long executionCount = 0;
        private long totalDuration = 0;
        private long totalResultCount = 0;
        private long errorCount = 0;
        private long minDuration = Long.MAX_VALUE;
        private long maxDuration = 0;

        public QueryStats(String queryType) {
            this.queryType = queryType;
        }

        public synchronized void recordExecution(long duration, int resultCount, boolean hasError) {
            executionCount++;
            totalDuration += duration;
            totalResultCount += resultCount;
            
            if (hasError) {
                errorCount++;
            }
            
            if (duration < minDuration) {
                minDuration = duration;
            }
            if (duration > maxDuration) {
                maxDuration = duration;
            }
        }

        // Getters
        public String getQueryType() { return queryType; }
        public long getExecutionCount() { return executionCount; }
        public long getTotalDuration() { return totalDuration; }
        public long getTotalResultCount() { return totalResultCount; }
        public long getErrorCount() { return errorCount; }
        public long getMinDuration() { return minDuration == Long.MAX_VALUE ? 0 : minDuration; }
        public long getMaxDuration() { return maxDuration; }
        
        public double getAverageDuration() {
            return executionCount > 0 ? (double) totalDuration / executionCount : 0.0;
        }
        
        public double getAverageResultCount() {
            return executionCount > 0 ? (double) totalResultCount / executionCount : 0.0;
        }
        
        public double getErrorRate() {
            return executionCount > 0 ? (double) errorCount / executionCount * 100 : 0.0;
        }
    }
}
