package com.mindgarden.consultation.service.impl;

import java.sql.Types;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import com.mindgarden.consultation.service.PlSqlStatisticsService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 프로시저 기반 통계 처리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PlSqlStatisticsServiceImpl implements PlSqlStatisticsService {
    
    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    
    @Override
    public String updateDailyStatistics(String branchCode, LocalDate statDate) {
        log.info("📊 일별 통계 PL/SQL 프로시저 호출: branchCode={}, statDate={}", branchCode, statDate);
        
        try {
            // UTF-8 인코딩 설정
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            jdbcTemplate.execute("SET character_set_client = utf8mb4");
            jdbcTemplate.execute("SET character_set_connection = utf8mb4");
            jdbcTemplate.execute("SET character_set_results = utf8mb4");
            
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(dataSource)
                .withProcedureName("UpdateDailyStatistics")
                .declareParameters(
                    new SqlParameter("p_branch_code", Types.VARCHAR),
                    new SqlParameter("p_stat_date", Types.DATE)
                );
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_branch_code", branchCode);
            params.put("p_stat_date", java.sql.Date.valueOf(statDate));
            
            jdbcCall.execute(params);
            
            log.info("✅ 일별 통계 PL/SQL 프로시저 실행 완료: branchCode={}, statDate={}", branchCode, statDate);
            return "SUCCESS: Daily statistics updated for branch " + branchCode + " on " + statDate;
            
        } catch (Exception e) {
            log.error("❌ 일별 통계 PL/SQL 프로시저 실행 실패: branchCode={}, statDate={}, 오류={}", 
                     branchCode, statDate, e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }
    
    @Override
    public String updateAllBranchDailyStatistics(LocalDate statDate) {
        log.info("📊 모든 지점 일별 통계 PL/SQL 프로시저 호출: statDate={}", statDate);
        
        try {
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(dataSource)
                .withProcedureName("UpdateAllBranchDailyStatistics")
                .declareParameters(
                    new SqlParameter("p_stat_date", Types.DATE)
                );
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_stat_date", java.sql.Date.valueOf(statDate));
            
            jdbcCall.execute(params);
            
            log.info("✅ 모든 지점 일별 통계 PL/SQL 프로시저 실행 완료: statDate={}", statDate);
            return "SUCCESS: All branch daily statistics updated for " + statDate;
            
        } catch (Exception e) {
            log.error("❌ 모든 지점 일별 통계 PL/SQL 프로시저 실행 실패: statDate={}, 오류={}", 
                     statDate, e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }
    
    @Override
    public String updateConsultantPerformance(Long consultantId, LocalDate performanceDate) {
        log.info("📈 상담사 성과 PL/SQL 프로시저 호출: consultantId={}, performanceDate={}", 
                 consultantId, performanceDate);
        
        try {
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(dataSource)
                .withProcedureName("UpdateConsultantPerformance")
                .declareParameters(
                    new SqlParameter("p_consultant_id", Types.BIGINT),
                    new SqlParameter("p_performance_date", Types.DATE)
                );
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_consultant_id", consultantId);
            params.put("p_performance_date", java.sql.Date.valueOf(performanceDate));
            
            jdbcCall.execute(params);
            
            log.info("✅ 상담사 성과 PL/SQL 프로시저 실행 완료: consultantId={}, performanceDate={}", 
                     consultantId, performanceDate);
            return "SUCCESS: Consultant performance updated for " + consultantId + " on " + performanceDate;
            
        } catch (Exception e) {
            log.error("❌ 상담사 성과 PL/SQL 프로시저 실행 실패: consultantId={}, performanceDate={}, 오류={}", 
                     consultantId, performanceDate, e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }
    
    @Override
    public String updateAllConsultantPerformance(LocalDate performanceDate) {
        log.info("📈 모든 상담사 성과 PL/SQL 프로시저 호출: performanceDate={}", performanceDate);
        
        try {
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(dataSource)
                .withProcedureName("UpdateAllConsultantPerformance")
                .declareParameters(
                    new SqlParameter("p_performance_date", Types.DATE)
                );
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_performance_date", java.sql.Date.valueOf(performanceDate));
            
            jdbcCall.execute(params);
            
            log.info("✅ 모든 상담사 성과 PL/SQL 프로시저 실행 완료: performanceDate={}", performanceDate);
            return "SUCCESS: All consultant performance updated for " + performanceDate;
            
        } catch (Exception e) {
            log.error("❌ 모든 상담사 성과 PL/SQL 프로시저 실행 실패: performanceDate={}, 오류={}", 
                     performanceDate, e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }
    
    @Override
    public int performDailyPerformanceMonitoring(LocalDate monitoringDate) {
        log.info("🔔 일일 성과 모니터링 PL/SQL 프로시저 호출: monitoringDate={}", monitoringDate);
        
        try {
            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(dataSource)
                .withProcedureName("DailyPerformanceMonitoring")
                .declareParameters(
                    new SqlParameter("p_monitoring_date", Types.DATE)
                );
            
            Map<String, Object> params = new HashMap<>();
            params.put("p_monitoring_date", java.sql.Date.valueOf(monitoringDate));
            
            jdbcCall.execute(params);
            
            // 생성된 알림 개수 조회 (성과 알림 테이블에서 오늘 생성된 알림 개수)
            String countQuery = """
                SELECT COUNT(*) FROM performance_alerts 
                WHERE DATE(created_at) = ? AND status = 'PENDING'
                """;
            
            Integer alertCount = jdbcTemplate.queryForObject(countQuery, Integer.class, 
                java.sql.Date.valueOf(monitoringDate));
            
            log.info("✅ 일일 성과 모니터링 PL/SQL 프로시저 실행 완료: monitoringDate={}, 생성된 알림={}개", 
                     monitoringDate, alertCount);
            
            return alertCount != null ? alertCount : 0;
            
        } catch (Exception e) {
            log.error("❌ 일일 성과 모니터링 PL/SQL 프로시저 실행 실패: monitoringDate={}, 오류={}", 
                     monitoringDate, e.getMessage(), e);
            return 0;
        }
    }
    
    @Override
    public boolean isProcedureAvailable() {
        try {
            // MySQL에서 프로시저 존재 여부 확인
            String checkQuery = """
                SELECT COUNT(*) FROM information_schema.ROUTINES 
                WHERE ROUTINE_SCHEMA = DATABASE() 
                AND ROUTINE_TYPE = 'PROCEDURE' 
                AND ROUTINE_NAME IN ('UpdateDailyStatistics', 'UpdateConsultantPerformance', 'DailyPerformanceMonitoring')
                """;
            
            Integer procedureCount = jdbcTemplate.queryForObject(checkQuery, Integer.class);
            boolean available = (procedureCount != null && procedureCount >= 3);
            
            log.info("🔍 PL/SQL 프로시저 가용성 확인: 사용가능={}, 확인된프로시저={}개", available, procedureCount);
            return available;
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 프로시저 가용성 확인 실패: 오류={}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean validateStatisticsConsistency(String branchCode, LocalDate statDate) {
        log.info("🔍 통계 일관성 검증 시작: branchCode={}, statDate={}", branchCode, statDate);
        
        try {
            // 1. Java 기반 통계 계산
            String javaStatsQuery = """
                SELECT 
                    COUNT(DISTINCT s.id) as total_consultations,
                    COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) as completed_consultations,
                    COUNT(CASE WHEN s.status = 'CANCELLED' THEN 1 END) as cancelled_consultations,
                    COALESCE(SUM(ft.amount), 0) as total_revenue
                FROM schedules s
                LEFT JOIN financial_transactions ft ON ft.related_entity_id = s.id 
                    AND ft.related_entity_type = 'CONSULTATION_INCOME'
                    AND ft.transaction_type = 'INCOME'
                WHERE s.date = ? AND s.branch_code = ? AND s.is_deleted = false
                """;
            
            List<Map<String, Object>> javaResults = jdbcTemplate.queryForList(javaStatsQuery, 
                java.sql.Date.valueOf(statDate), branchCode);
            
            // 2. PL/SQL 기반 통계 조회
            String plsqlStatsQuery = """
                SELECT 
                    total_consultations,
                    completed_consultations,
                    cancelled_consultations,
                    total_revenue
                FROM daily_statistics 
                WHERE stat_date = ? AND branch_code = ?
                """;
            
            List<Map<String, Object>> plsqlResults = jdbcTemplate.queryForList(plsqlStatsQuery, 
                java.sql.Date.valueOf(statDate), branchCode);
            
            // 3. 결과 비교
            if (javaResults.isEmpty() || plsqlResults.isEmpty()) {
                log.warn("⚠️ 비교할 통계 데이터가 없습니다: javaResults={}, plsqlResults={}", 
                         javaResults.size(), plsqlResults.size());
                return false;
            }
            
            Map<String, Object> javaData = javaResults.get(0);
            Map<String, Object> plsqlData = plsqlResults.get(0);
            
            boolean consistent = 
                compareValues(javaData.get("total_consultations"), plsqlData.get("total_consultations")) &&
                compareValues(javaData.get("completed_consultations"), plsqlData.get("completed_consultations")) &&
                compareValues(javaData.get("cancelled_consultations"), plsqlData.get("cancelled_consultations")) &&
                compareValues(javaData.get("total_revenue"), plsqlData.get("total_revenue"));
            
            log.info("🔍 통계 일관성 검증 완료: branchCode={}, statDate={}, 일관성={}", 
                     branchCode, statDate, consistent);
            
            if (!consistent) {
                log.warn("⚠️ 통계 불일치 발견: Java결과={}, PL/SQL결과={}", javaData, plsqlData);
            }
            
            return consistent;
            
        } catch (Exception e) {
            log.error("❌ 통계 일관성 검증 실패: branchCode={}, statDate={}, 오류={}", 
                     branchCode, statDate, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 두 값이 동일한지 비교 (null 처리 포함)
     */
    private boolean compareValues(Object value1, Object value2) {
        if (value1 == null && value2 == null) return true;
        if (value1 == null || value2 == null) return false;
        
        // 숫자 타입 비교
        if (value1 instanceof Number && value2 instanceof Number) {
            return ((Number) value1).doubleValue() == ((Number) value2).doubleValue();
        }
        
        return value1.equals(value2);
    }
}
