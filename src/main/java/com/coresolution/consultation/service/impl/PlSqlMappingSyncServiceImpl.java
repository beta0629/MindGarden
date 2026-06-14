package com.coresolution.consultation.service.impl;

import java.sql.Types;
import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;
import com.coresolution.consultation.service.PlSqlMappingSyncService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 매핑 동기화 서비스 구현체 (회기 5종 프로시저는 Phase 1 1A 폐기).
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PlSqlMappingSyncServiceImpl implements PlSqlMappingSyncService {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    /**
     * SimpleJdbcCall 카탈로그(=DB명) 명시용 SSOT.
     *
     * <p>{@code spring.datasource.url} 의 {@code ${DB_NAME}} 과 동일 SSOT 를 상속하여
     * 다중 DB(core_solution + mind_garden) 동명 프로시저 메타 충돌
     * ({@code SimpleJdbcCallOperations#metaData()} 시그니처 모호)을 차단한다.</p>
     *
     * <p>MySQL JDBC 모델에서는 catalog = DB명, schema = null. 따라서 catalog 만 명시하고
     * schema 는 명시하지 않는다. (PR-A hotfix, 2026-06-14)</p>
     *
     * @see com.coresolution.consultation.service.impl.PlSqlStatisticsServiceImpl
     */
    @Value("${spring.datasource.schema-name:${DB_NAME:core_solution}}")
    private String dbSchemaName = "core_solution";

    /**
     * UTF-8 인코딩 설정
     */
    private void setUtf8Encoding() {
        try {
            jdbcTemplate.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            jdbcTemplate.execute("SET character_set_client = utf8mb4");
            jdbcTemplate.execute("SET character_set_connection = utf8mb4");
            jdbcTemplate.execute("SET character_set_results = utf8mb4");
        } catch (Exception e) {
            log.warn("UTF-8 인코딩 설정 중 오류 (무시됨): {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public Map<String, Object> validateMappingIntegrity(Long mappingId) {
        log.info("🔍 PL/SQL 매핑 무결성 검증: MappingID={}", mappingId);

        String tenantId = TenantContextHolder.getRequiredTenantId();

        try {
            Map<String, Object> result = new HashMap<>();

            jdbcTemplate.update(
                "CALL ValidateMappingIntegrity(?, ?, @p_success, @p_message, @p_validation_results)",
                mappingId, tenantId
            );

            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            String validationResultsJson = jdbcTemplate.queryForObject("SELECT @p_validation_results", String.class);

            result.put("success", success != null && success);
            result.put("message", message);
            result.put("mappingId", mappingId);
            result.put("validationResults", validationResultsJson);

            if (success != null && success) {
                log.info("✅ PL/SQL 매핑 무결성 검증 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 매핑 무결성 검증 실패: Message={}", message);
            }

            return result;

        } catch (Exception e) {
            log.error("❌ PL/SQL 매핑 무결성 검증 중 오류: {}", e.getMessage(), e);

            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 매핑 무결성 검증 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());

            return result;
        }
    }

    @Override
    public Map<String, Object> syncAllMappings() {
        log.info("🔄 PL/SQL 전체 매핑 동기화 시작");

        String tenantId = TenantContextHolder.getRequiredTenantId();
        String syncedBy = TenantContextHolder.getTenantId();

        try {
            Map<String, Object> result = new HashMap<>();
            setUtf8Encoding();

            SimpleJdbcCall jdbcCall = new SimpleJdbcCall(dataSource)
                .withCatalogName(dbSchemaName)
                .withProcedureName("SyncAllMappings")
                .withoutProcedureColumnMetaDataAccess()
                .declareParameters(
                    new SqlParameter("p_tenant_id", Types.VARCHAR),
                    new SqlParameter("p_synced_by", Types.VARCHAR),
                    new SqlOutParameter("p_success", Types.BOOLEAN),
                    new SqlOutParameter("p_message", Types.VARCHAR),
                    new SqlOutParameter("p_sync_results", Types.LONGVARCHAR)
                );

            Map<String, Object> in = new HashMap<>();
            in.put("p_tenant_id", tenantId);
            in.put("p_synced_by", syncedBy);
            Map<String, Object> out = jdbcCall.execute(in);

            Boolean success = (Boolean) out.get("p_success");
            String message = (String) out.get("p_message");
            String syncResultsJson = (String) out.get("p_sync_results");

            result.put("success", success != null && success);
            result.put("message", message);
            result.put("syncResults", syncResultsJson);

            if (success != null && success) {
                log.info("✅ PL/SQL 전체 매핑 동기화 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 전체 매핑 동기화 실패: Message={}", message);
            }

            return result;

        } catch (Exception e) {
            log.error("❌ PL/SQL 전체 매핑 동기화 중 오류: {}", e.getMessage(), e);

            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 전체 매핑 동기화 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());

            return result;
        }
    }

    /**
     * 환불 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    @Transactional
    public Map<String, Object> getRefundStatistics(String branchCode, String startDate, String endDate) {
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 PL/SQL 환불 통계 조회: tenantId={}, Period={} ~ {}", tenantId, startDate, endDate);

        try {
            Map<String, Object> result = new HashMap<>();

            java.time.LocalDate startLocalDate = java.time.LocalDate.parse(startDate);
            java.time.LocalDate endLocalDate = java.time.LocalDate.parse(endDate);

            jdbcTemplate.update(
                "CALL GetRefundStatistics(?, ?, ?, @p_success, @p_message, @p_statistics)",
                tenantId, startLocalDate, endLocalDate
            );

            Boolean success = jdbcTemplate.queryForObject("SELECT @p_success", Boolean.class);
            String message = jdbcTemplate.queryForObject("SELECT @p_message", String.class);
            String statisticsJson = jdbcTemplate.queryForObject("SELECT @p_statistics", String.class);

            result.put("success", success != null && success);
            result.put("message", message);
            result.put("startDate", startDate);
            result.put("endDate", endDate);
            result.put("statistics", statisticsJson);

            if (success != null && success) {
                log.info("✅ PL/SQL 환불 통계 조회 완료: {}", message);
            } else {
                log.warn("⚠️ PL/SQL 환불 통계 조회 실패: Message={}", message);
            }

            return result;

        } catch (Exception e) {
            log.error("❌ PL/SQL 환불 통계 조회 중 오류: {}", e.getMessage(), e);

            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "PL/SQL 환불 통계 조회 중 오류 발생: " + e.getMessage());
            result.put("error", e.getMessage());

            return result;
        }
    }

    @Override
    public boolean isProcedureAvailable() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.routines "
                + "WHERE routine_schema = DATABASE() "
                + "AND routine_name IN ('ValidateMappingIntegrity', 'SyncAllMappings', 'GetRefundStatistics')",
                Integer.class
            );

            return count != null && count >= 3;

        } catch (Exception e) {
            log.error("❌ PL/SQL 프로시저 사용 가능 여부 확인 실패: {}", e.getMessage());
            return false;
        }
    }
}
