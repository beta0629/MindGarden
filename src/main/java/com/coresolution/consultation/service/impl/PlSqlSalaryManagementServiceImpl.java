package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Optional;
import java.math.RoundingMode;
import com.coresolution.consultation.constant.salary.PlSqlSalaryProcedureUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.util.FreelanceWithholdingTaxUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 급여관리 서비스 구현체
 * <p>운영 반영: 급여 관련 표준 프로시저를 DB에 먼저 배포한 뒤, 앱 재기동 필요 여부는 운영 체크리스트에 따른다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PlSqlSalaryManagementServiceImpl implements PlSqlSalaryManagementService {

    /**
     * 시그니처 불일치로 판별될 때 API 응답에 포함할 안내(내부 경로·비밀 미포함).
     */
    private static final String CALCULATE_SALARY_PREVIEW_SIGNATURE_MISMATCH_HINT =
            "DB 저장 프로시저 CalculateSalaryPreview의 파라미터 구성이 애플리케이션 기대와 다를 수 있습니다. "
                    + "표준 CalculateSalaryPreview 프로시저 배포로 시그니처를 맞춰 주세요.";

    private static final String PROCESS_INTEGRATED_SALARY_SIGNATURE_MISMATCH_HINT =
            "표준 ProcessIntegratedSalaryCalculation 프로시저 배포가 필요할 수 있습니다 "
                    + "(deploy-procedures-production-mysql.yml 또는 deploy_standardized_procedures.sh).";

    private static final String DEFAULT_PREVIEW_FAILURE_USER_MESSAGE =
            "급여 계산 미리보기에 실패했습니다. DB에서 사유를 반환하지 않았습니다.";

    private static final String DEFAULT_APPROVE_FAILURE_USER_MESSAGE =
            "급여 승인에 실패했습니다. DB에서 사유를 반환하지 않았습니다.";

    private static final String DEFAULT_PAY_FAILURE_USER_MESSAGE =
            "급여 지급에 실패했습니다. DB에서 사유를 반환하지 않았습니다.";

    private static final String DEFAULT_STATISTICS_FAILURE_USER_MESSAGE =
            "급여 통계 조회에 실패했습니다. DB에서 사유를 반환하지 않았습니다.";

    private final JdbcTemplate jdbcTemplate;

    private final ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    
    @Override
    public Map<String, Object> processIntegratedSalaryCalculation(
            Long consultantId, 
            LocalDate periodStart, 
            LocalDate periodEnd, 
            String triggeredBy) {
        
        log.info("💰 PL/SQL 통합 급여 계산 시작: ConsultantID={}, Period={} ~ {}", 
                consultantId, periodStart, periodEnd);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Map<String, Object> result = new HashMap<>();
        
        try {
            List<ProcedureParameterMeta> procedureMeta =
                    loadRoutineParametersFromInformationSchema("ProcessIntegratedSalaryCalculation");
            if (isCompleteProcessIntegratedProcedureMetadata(procedureMeta)) {
                try {
                    result.putAll(executeProcessIntegratedSalaryCalculationWithMetadata(
                            procedureMeta, consultantId, periodStart, periodEnd, tenantId, triggeredBy));
                    logProcedureIntegratedOutDiagnosticsIfFailedWithBlankMessage(result, procedureMeta);
                    log.info("✅ PL/SQL 통합 급여 계산 완료(메타데이터 매핑): CalculationID={}, GrossSalary={}, NetSalary={}",
                            result.get("calculationId"), result.get("grossSalary"), result.get("netSalary"));
                } catch (SQLException dynamicEx) {
                    log.warn("ProcessIntegratedSalaryCalculation 메타데이터 기반 호출 실패, 개수 분기로 폴백: {}",
                            dynamicEx.getMessage());
                    logProcessIntegratedSalaryParameterDiagnostics(dynamicEx);
                    result.clear();
                }
            }
            if (result.isEmpty()) {
                int paramCount = countProcessIntegratedSalaryCalculationParameters();
                if (paramCount == 13) {
                    result.putAll(executeProcessIntegratedSalaryCalculationStandard(
                            consultantId, periodStart, periodEnd, tenantId, triggeredBy));
                } else if (paramCount == 12) {
                    result.putAll(executeProcessIntegratedSalaryCalculationStandard12Out(
                            consultantId, periodStart, periodEnd, tenantId, triggeredBy));
                } else if (paramCount == 11) {
                    log.warn("⚠️ ProcessIntegratedSalaryCalculation 구버전(11파라미터, p_tenant_id 없음). 표준 프로시저 배포를 권장합니다.");
                    result.putAll(executeProcessIntegratedSalaryCalculationLegacy11(
                            consultantId, periodStart, periodEnd, triggeredBy));
                } else if (paramCount < 0) {
                    try {
                        result.putAll(executeProcessIntegratedSalaryCalculationStandard(
                                consultantId, periodStart, periodEnd, tenantId, triggeredBy));
                    } catch (SQLException ex) {
                        if (shouldLogProcessIntegratedSalarySignatureMismatch(ex)) {
                            log.warn("파라미터 개수 미확인 상태에서 표준(13) 호출 실패, 12OUT·11레거시 순 재시도: {}", ex.getMessage());
                            try {
                                result.putAll(executeProcessIntegratedSalaryCalculationStandard12Out(
                                        consultantId, periodStart, periodEnd, tenantId, triggeredBy));
                            } catch (SQLException ex12) {
                                if (shouldLogProcessIntegratedSalarySignatureMismatch(ex12)) {
                                    result.putAll(executeProcessIntegratedSalaryCalculationLegacy11(
                                            consultantId, periodStart, periodEnd, triggeredBy));
                                } else {
                                    throw ex12;
                                }
                            }
                        } else {
                            throw ex;
                        }
                    }
                } else {
                    log.error("❌ ProcessIntegratedSalaryCalculation 파라미터 개수 비정상: count={}", paramCount);
                    result.put("success", false);
                    result.put("message",
                            "ProcessIntegratedSalaryCalculation 프로시저 정의를 확인할 수 없습니다(parameters=" + paramCount + ").");
                    return result;
                }
                log.info("✅ PL/SQL 통합 급여 계산 완료: CalculationID={}, GrossSalary={}, NetSalary={}",
                        result.get("calculationId"), result.get("grossSalary"), result.get("netSalary"));
            }
        } catch (SQLException e) {
            log.error("❌ PL/SQL 통합 급여 계산 오류", e);
            logProcessIntegratedSalaryParameterDiagnostics(e);
            result.put("success", false);
            if (shouldLogProcessIntegratedSalarySignatureMismatch(e)) {
                result.put("message",
                        "급여 계산 중 오류가 발생했습니다. " + PROCESS_INTEGRATED_SALARY_SIGNATURE_MISMATCH_HINT
                                + " 상세: " + e.getMessage());
            } else {
                result.put("message", "급여 계산 중 오류가 발생했습니다: " + e.getMessage());
            }
        }

        ensureUserFacingMessageWhenProcedureFailed(result,
                PlSqlSalaryProcedureUserFacingMessages.INTEGRATED_CALC_FAILURE_WHEN_DB_SILENT);
        if (!Boolean.TRUE.equals(result.get("success")) && result.get("calculationId") == null) {
            log.info("ProcessIntegratedSalaryCalculation: calculationId가 NULL이면 중복 확정·검증 거절 등으로 미생성된 경우일 수 있습니다.");
        }

        return result;
    }

    /**
     * 표준 13파라미터: 5 IN + 8 OUT(마지막 p_special_support_amount).
     * DB가 아직 12파라미터(특별지원금 OUT 없음)면 {@link #executeProcessIntegratedSalaryCalculationStandard12Out} 사용.
     */
    private Map<String, Object> executeProcessIntegratedSalaryCalculationStandard(
            Long consultantId,
            LocalDate periodStart,
            LocalDate periodEnd,
            String tenantId,
            String triggeredBy) throws SQLException {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(
                        "{CALL ProcessIntegratedSalaryCalculation(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            setConnectionUtf8mb4(connection);
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, tenantId);
            stmt.setString(5, triggeredBy);
            stmt.registerOutParameter(6, Types.BIGINT);
            stmt.registerOutParameter(7, Types.DECIMAL);
            stmt.registerOutParameter(8, Types.DECIMAL);
            stmt.registerOutParameter(9, Types.DECIMAL);
            stmt.registerOutParameter(10, Types.BIGINT);
            stmt.registerOutParameter(11, Types.BOOLEAN);
            stmt.registerOutParameter(12, Types.VARCHAR);
            stmt.registerOutParameter(13, Types.DECIMAL);
            stmt.execute();
            result.put("calculationId", getNullableLong(stmt, 6));
            result.put("grossSalary", stmt.getBigDecimal(7));
            result.put("netSalary", stmt.getBigDecimal(8));
            result.put("taxAmount", stmt.getBigDecimal(9));
            result.put("erpSyncId", getNullableLong(stmt, 10));
            result.put("success", readMysqlProcedureBooleanOut(stmt, 11));
            result.put("message", stmt.getString(12));
            result.put("specialSupportAmount", stmt.getBigDecimal(13));
        }
        return result;
    }

    /**
     * 12파라미터(5 IN + 7 OUT): 특별지원금 OUT 없음. 응답 {@code specialSupportAmount}=0.
     */
    private Map<String, Object> executeProcessIntegratedSalaryCalculationStandard12Out(
            Long consultantId,
            LocalDate periodStart,
            LocalDate periodEnd,
            String tenantId,
            String triggeredBy) throws SQLException {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(
                        "{CALL ProcessIntegratedSalaryCalculation(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            setConnectionUtf8mb4(connection);
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, tenantId);
            stmt.setString(5, triggeredBy);
            stmt.registerOutParameter(6, Types.BIGINT);
            stmt.registerOutParameter(7, Types.DECIMAL);
            stmt.registerOutParameter(8, Types.DECIMAL);
            stmt.registerOutParameter(9, Types.DECIMAL);
            stmt.registerOutParameter(10, Types.BIGINT);
            stmt.registerOutParameter(11, Types.BOOLEAN);
            stmt.registerOutParameter(12, Types.VARCHAR);
            stmt.execute();
            result.put("calculationId", getNullableLong(stmt, 6));
            result.put("grossSalary", stmt.getBigDecimal(7));
            result.put("netSalary", stmt.getBigDecimal(8));
            result.put("taxAmount", stmt.getBigDecimal(9));
            result.put("erpSyncId", getNullableLong(stmt, 10));
            result.put("success", readMysqlProcedureBooleanOut(stmt, 11));
            result.put("message", stmt.getString(12));
            result.put("specialSupportAmount", BigDecimal.ZERO);
        }
        return result;
    }

    private Map<String, Object> executeProcessIntegratedSalaryCalculationLegacy11(
            Long consultantId,
            LocalDate periodStart,
            LocalDate periodEnd,
            String triggeredBy) throws SQLException {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(
                        "{CALL ProcessIntegratedSalaryCalculation(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            setConnectionUtf8mb4(connection);
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, triggeredBy);
            stmt.registerOutParameter(5, Types.BIGINT);
            stmt.registerOutParameter(6, Types.DECIMAL);
            stmt.registerOutParameter(7, Types.DECIMAL);
            stmt.registerOutParameter(8, Types.DECIMAL);
            stmt.registerOutParameter(9, Types.BIGINT);
            stmt.registerOutParameter(10, Types.BOOLEAN);
            stmt.registerOutParameter(11, Types.VARCHAR);
            stmt.execute();
            result.put("calculationId", getNullableLong(stmt, 5));
            result.put("grossSalary", stmt.getBigDecimal(6));
            result.put("netSalary", stmt.getBigDecimal(7));
            result.put("taxAmount", stmt.getBigDecimal(8));
            result.put("erpSyncId", getNullableLong(stmt, 9));
            result.put("success", readMysqlProcedureBooleanOut(stmt, 10));
            result.put("message", stmt.getString(11));
            result.put("specialSupportAmount", BigDecimal.ZERO);
        }
        return result;
    }

    /**
     * information_schema에 기록된 저장 프로시저 파라미터 한 행.
     *
     * @param ordinal   1-based JDBC 순번
     * @param mode      IN / OUT / INOUT
     * @param name      파라미터명(예: p_message)
     * @param dataType  DATA_TYPE 열 값
     */
    private record ProcedureParameterMeta(int ordinal, String mode, String name, String dataType) {
    }

    /**
     * 현재 스키마의 저장 프로시저 파라미터를 이름·순서와 함께 조회한다.
     *
     * @param routineName ROUTINES.SPECIFIC_NAME 과 동일한 프로시저명
     * @return ORDINAL_POSITION 순 정렬 목록, 조회 실패 시 빈 목록
     */
    private List<ProcedureParameterMeta> loadRoutineParametersFromInformationSchema(String routineName) {
        try {
            String sql = "SELECT ORDINAL_POSITION, PARAMETER_MODE, PARAMETER_NAME, DATA_TYPE "
                    + "FROM information_schema.PARAMETERS "
                    + "WHERE SPECIFIC_SCHEMA = DATABASE() AND SPECIFIC_NAME = ? "
                    + "ORDER BY ORDINAL_POSITION";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, routineName);
            if (rows == null || rows.isEmpty()) {
                return Collections.emptyList();
            }
            List<ProcedureParameterMeta> list = new ArrayList<>(rows.size());
            for (Map<String, Object> row : rows) {
                Object ordObj = row.get("ORDINAL_POSITION");
                if (ordObj == null) {
                    continue;
                }
                int ordinal = ((Number) ordObj).intValue();
                String mode = Objects.toString(row.get("PARAMETER_MODE"), "").trim();
                String name = row.get("PARAMETER_NAME") != null
                        ? String.valueOf(row.get("PARAMETER_NAME")).trim()
                        : "";
                String dataType = row.get("DATA_TYPE") != null
                        ? String.valueOf(row.get("DATA_TYPE")).trim()
                        : "";
                list.add(new ProcedureParameterMeta(ordinal, mode, name, dataType));
            }
            return list;
        } catch (Exception e) {
            log.warn("information_schema.PARAMETERS 조회 실패 routine={}: {}", routineName, e.getMessage());
            return Collections.emptyList();
        }
    }

    private static String normalizeMysqlParameterName(String name) {
        if (name == null) {
            return "";
        }
        return name.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * ProcessIntegratedSalaryCalculation 에 대해 information_schema 기반 동적 호출을 쓸 수 있는지 판별한다.
     * 파라미터명이 누락되었거나 개수가 11·12·13이 아니면 false.
     *
     * @param rows 조회된 메타데이터
     * @return 동적 JDBC 호출 가능 여부
     */
    private boolean isCompleteProcessIntegratedProcedureMetadata(List<ProcedureParameterMeta> rows) {
        if (rows == null || rows.isEmpty()) {
            return false;
        }
        int n = rows.size();
        if (n != 11 && n != 12 && n != 13) {
            return false;
        }
        Set<String> names = rows.stream()
                .map(r -> normalizeMysqlParameterName(r.name()))
                .collect(Collectors.toSet());
        if (names.stream().anyMatch(String::isEmpty)) {
            return false;
        }
        Set<String> required = Set.of(
                "p_consultant_id", "p_period_start", "p_period_end", "p_triggered_by",
                "p_calculation_id", "p_gross_salary", "p_net_salary", "p_tax_amount",
                "p_erp_sync_id", "p_success", "p_message");
        if (!names.containsAll(required)) {
            return false;
        }
        if (n == 13) {
            return names.contains("p_tenant_id") && names.contains("p_special_support_amount");
        }
        if (n == 12) {
            return names.contains("p_tenant_id") && !names.contains("p_special_support_amount");
        }
        return !names.contains("p_tenant_id") && !names.contains("p_special_support_amount");
    }

    private Map<String, Object> executeProcessIntegratedSalaryCalculationWithMetadata(
            List<ProcedureParameterMeta> rows,
            Long consultantId,
            LocalDate periodStart,
            LocalDate periodEnd,
            String tenantId,
            String triggeredBy) throws SQLException {
        Map<String, Object> result = new HashMap<>();
        int total = rows.size();
        StringBuilder call = new StringBuilder("{CALL ProcessIntegratedSalaryCalculation(");
        for (int i = 0; i < total; i++) {
            if (i > 0) {
                call.append(", ");
            }
            call.append("?");
        }
        call.append(")}");
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(call.toString())) {
            setConnectionUtf8mb4(connection);
            for (ProcedureParameterMeta r : rows) {
                if ("IN".equalsIgnoreCase(r.mode())) {
                    bindProcessIntegratedInParameter(stmt, r, consultantId, periodStart, periodEnd, tenantId, triggeredBy);
                } else if ("OUT".equalsIgnoreCase(r.mode()) || "INOUT".equalsIgnoreCase(r.mode())) {
                    stmt.registerOutParameter(r.ordinal(), mapMysqlDataTypeToJdbcTypeForOut(r.dataType()));
                }
            }
            stmt.execute();
            for (ProcedureParameterMeta r : rows) {
                if ("IN".equalsIgnoreCase(r.mode())) {
                    continue;
                }
                if (!"OUT".equalsIgnoreCase(r.mode()) && !"INOUT".equalsIgnoreCase(r.mode())) {
                    continue;
                }
                String nm = normalizeMysqlParameterName(r.name());
                int o = r.ordinal();
                switch (nm) {
                    case "p_calculation_id" -> result.put("calculationId", getNullableLong(stmt, o));
                    case "p_gross_salary" -> result.put("grossSalary", stmt.getBigDecimal(o));
                    case "p_net_salary" -> result.put("netSalary", stmt.getBigDecimal(o));
                    case "p_tax_amount" -> result.put("taxAmount", stmt.getBigDecimal(o));
                    case "p_erp_sync_id" -> result.put("erpSyncId", getNullableLong(stmt, o));
                    case "p_success" -> result.put("success", readMysqlProcedureBooleanOut(stmt, o));
                    case "p_message" -> result.put("message", stmt.getString(o));
                    case "p_special_support_amount" -> result.put("specialSupportAmount", stmt.getBigDecimal(o));
                    default -> {
                        // 알 수 없는 OUT은 무시 (향후 확장 호환)
                    }
                }
            }
            if (!result.containsKey("specialSupportAmount")) {
                result.put("specialSupportAmount", BigDecimal.ZERO);
            }
        }
        return result;
    }

    private void bindProcessIntegratedInParameter(
            CallableStatement stmt,
            ProcedureParameterMeta r,
            Long consultantId,
            LocalDate periodStart,
            LocalDate periodEnd,
            String tenantId,
            String triggeredBy) throws SQLException {
        String nm = normalizeMysqlParameterName(r.name());
        int o = r.ordinal();
        switch (nm) {
            case "p_consultant_id" -> stmt.setLong(o, consultantId);
            case "p_period_start" -> stmt.setDate(o, java.sql.Date.valueOf(periodStart));
            case "p_period_end" -> stmt.setDate(o, java.sql.Date.valueOf(periodEnd));
            case "p_tenant_id" -> stmt.setString(o, tenantId);
            case "p_triggered_by" -> stmt.setString(o, triggeredBy);
            default -> throw new SQLException("ProcessIntegratedSalaryCalculation 알 수 없는 IN 파라미터: " + r.name());
        }
    }

    private static int mapMysqlDataTypeToJdbcTypeForOut(String dataType) {
        if (dataType == null || dataType.isEmpty()) {
            return Types.VARCHAR;
        }
        switch (dataType.toUpperCase(Locale.ROOT)) {
            case "BIGINT":
                return Types.BIGINT;
            case "INT":
            case "INTEGER":
                return Types.INTEGER;
            case "DECIMAL":
            case "NUMERIC":
                return Types.DECIMAL;
            case "DATE":
                return Types.DATE;
            case "DATETIME":
            case "TIMESTAMP":
                return Types.TIMESTAMP;
            case "TINYINT":
            case "BIT":
                return Types.TINYINT;
            case "LONGTEXT":
            case "MEDIUMTEXT":
            case "TEXT":
                return Types.LONGVARCHAR;
            case "CHAR":
            case "VARCHAR":
            default:
                return Types.VARCHAR;
        }
    }

    private void logProcedureIntegratedOutDiagnosticsIfFailedWithBlankMessage(
            Map<String, Object> result,
            List<ProcedureParameterMeta> meta) {
        if (Boolean.TRUE.equals(result.get("success"))) {
            return;
        }
        Object raw = result.get("message");
        String text = raw instanceof String s ? s : raw == null ? null : String.valueOf(raw);
        if (text != null && !text.isBlank()) {
            return;
        }
        log.error(
                "ProcessIntegratedSalaryCalculation 실패인데 p_message가 비어 있음. OUT 매핑·프로시저 본문을 확인하세요. meta={}",
                meta);
    }

    /**
     * BIGINT OUT이 SQL NULL일 때 {@link CallableStatement#getLong(int)}의 0과 구분한다.
     *
     * @param stmt  실행 완료 CallableStatement
     * @param index 1-based OUT 인덱스
     * @return NULL이면 null, 아니면 박싱 Long
     * @throws SQLException JDBC 오류
     */
    private static Long getNullableLong(CallableStatement stmt, int index) throws SQLException {
        long v = stmt.getLong(index);
        return stmt.wasNull() ? null : v;
    }

    private int countProcessIntegratedSalaryCalculationParameters() {
        try {
            String sql = "SELECT COUNT(*) FROM information_schema.PARAMETERS "
                    + "WHERE SPECIFIC_SCHEMA = DATABASE() AND SPECIFIC_NAME = 'ProcessIntegratedSalaryCalculation'";
            Integer c = jdbcTemplate.queryForObject(sql, Integer.class);
            return c != null ? c : -1;
        } catch (Exception e) {
            log.warn("ProcessIntegratedSalaryCalculation 파라미터 개수 조회 실패: {}", e.getMessage());
            return -1;
        }
    }

    private boolean shouldLogProcessIntegratedSalarySignatureMismatch(Throwable cause) {
        for (Throwable t = cause; t != null; t = t.getCause()) {
            String msg = t.getMessage();
            if (msg == null || msg.isEmpty()) {
                continue;
            }
            if (msg.contains("OUT parameter")) {
                return true;
            }
            if (msg.contains("Parameter index of") && msg.contains("out of range")) {
                return true;
            }
        }
        return false;
    }

    private void logProcessIntegratedSalaryParameterDiagnostics(Throwable cause) {
        if (!shouldLogProcessIntegratedSalarySignatureMismatch(cause)) {
            return;
        }
        try {
            String sql = "SELECT ORDINAL_POSITION, PARAMETER_MODE, PARAMETER_NAME "
                    + "FROM information_schema.PARAMETERS "
                    + "WHERE SPECIFIC_SCHEMA = DATABASE() AND SPECIFIC_NAME = 'ProcessIntegratedSalaryCalculation' "
                    + "ORDER BY ORDINAL_POSITION";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            log.error(
                    "ProcessIntegratedSalaryCalculation 시그니처 진단: information_schema.PARAMETERS (기대 1-5 IN, 6-13 OUT 표준): rows={}",
                    rows);
        } catch (Exception ex) {
            log.warn("프로시저 파라미터 진단 조회 실패: error={}", ex.getMessage(), ex);
        }
    }
    
    @Override
    public Map<String, Object> approveSalaryWithErpSync(Long calculationId, String approvedBy) {
        
        log.info("✅ PL/SQL 급여 승인 시작: CalculationID={}, ApprovedBy={}", calculationId, approvedBy);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ApproveSalaryWithErpSync(?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            stmt.setLong(1, calculationId);
            stmt.setString(2, approvedBy);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(3, java.sql.Types.BOOLEAN);  // success
            stmt.registerOutParameter(4, java.sql.Types.VARCHAR);  // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", readMysqlProcedureBooleanOut(stmt, 3));
            result.put("message", stmt.getString(4));
            
            log.info("✅ PL/SQL 급여 승인 완료: Success={}", result.get("success"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 급여 승인 오류", e);
            result.put("success", false);
            result.put("message", "급여 승인 중 오류가 발생했습니다: " + e.getMessage());
        }

        ensureUserFacingMessageWhenProcedureFailed(result, DEFAULT_APPROVE_FAILURE_USER_MESSAGE);
        return result;
    }
    
    @Override
    public Map<String, Object> processSalaryPaymentWithErpSync(Long calculationId, String paidBy) {
        
        log.info("💳 PL/SQL 급여 지급 시작: CalculationID={}, PaidBy={}", calculationId, paidBy);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ProcessSalaryPaymentWithErpSync(?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            stmt.setLong(1, calculationId);
            stmt.setString(2, paidBy);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(3, java.sql.Types.BOOLEAN);  // success
            stmt.registerOutParameter(4, java.sql.Types.VARCHAR);  // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", readMysqlProcedureBooleanOut(stmt, 3));
            result.put("message", stmt.getString(4));
            
            log.info("✅ PL/SQL 급여 지급 완료: Success={}", result.get("success"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 급여 지급 오류", e);
            result.put("success", false);
            result.put("message", "급여 지급 중 오류가 발생했습니다: " + e.getMessage());
        }

        ensureUserFacingMessageWhenProcedureFailed(result, DEFAULT_PAY_FAILURE_USER_MESSAGE);
        return result;
    }
    
    /**
     * 통합 급여 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Map<String, Object> getIntegratedSalaryStatistics(
            String branchCode, 
            LocalDate startDate, 
            LocalDate endDate) {
        
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 PL/SQL 통합 급여 통계 조회: tenantId={}, Period={} ~ {}", 
                tenantId, startDate, endDate);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL GetIntegratedSalaryStatistics(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            stmt.setString(1, tenantId); // p_tenant_id (첫 번째 파라미터)
            stmt.setDate(2, java.sql.Date.valueOf(startDate));
            stmt.setDate(3, java.sql.Date.valueOf(endDate));
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(4, java.sql.Types.BOOLEAN);   // success
            stmt.registerOutParameter(5, java.sql.Types.VARCHAR);   // message
            stmt.registerOutParameter(6, java.sql.Types.INTEGER);   // total_calculations
            stmt.registerOutParameter(7, java.sql.Types.DECIMAL);   // total_gross_salary
            stmt.registerOutParameter(8, java.sql.Types.DECIMAL);   // total_net_salary
            stmt.registerOutParameter(9, java.sql.Types.DECIMAL);   // total_tax_amount
            stmt.registerOutParameter(10, java.sql.Types.DECIMAL);   // average_salary
            stmt.registerOutParameter(11, java.sql.Types.DECIMAL);   // erp_sync_success_rate
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", readMysqlProcedureBooleanOut(stmt, 4));
            result.put("message", stmt.getString(5));
            result.put("totalCalculations", stmt.getInt(6));
            result.put("totalGrossSalary", stmt.getBigDecimal(7));
            result.put("totalNetSalary", stmt.getBigDecimal(8));
            result.put("totalTaxAmount", stmt.getBigDecimal(9));
            result.put("averageSalary", stmt.getBigDecimal(10));
            result.put("erpSyncSuccessRate", stmt.getBigDecimal(11));
            
            log.info("✅ PL/SQL 통합 급여 통계 조회 완료: TotalCalculations={}, TotalNetSalary={}", 
                    result.get("totalCalculations"), result.get("totalNetSalary"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 통합 급여 통계 조회 오류", e);
            result.put("success", false);
            result.put("message", "급여 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
        }

        ensureUserFacingMessageWhenProcedureFailed(result, DEFAULT_STATISTICS_FAILURE_USER_MESSAGE);
        return result;
    }
    
    @Override
    public boolean isProcedureAvailable() {
        try {
            // 프로시저 존재 여부 확인
            String sql = "SELECT COUNT(*) FROM information_schema.routines " +
                        "WHERE routine_schema = DATABASE() " +
                        "AND routine_name = 'CalculateSalaryPreview' " +
                        "AND routine_type = 'PROCEDURE'";
            
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
            return count != null && count > 0;
            
        } catch (Exception e) {
            log.error("PL/SQL 프로시저 사용 가능 여부 확인 오류", e);
            return false;
        }
    }
    
    /**
     * 급여 미리보기. 표준 시그니처는 {@code CalculateSalaryPreview_standardized.sql} 과 동일(11파라미터, 특별지원금 OUT).
     * 운영에 구버전(10·9파라미터)이 남은 경우 JDBC 단에서 분기한다.
     * 배포 시 GitHub {@code PRODUCTION_DB_NAME} 과 앱 JDBC 스키마가 다르면 프로시저만 갱신되지 않을 수 있다.
     *
     * @param consultantId 상담사 ID
     * @param periodStart  기간 시작
     * @param periodEnd    기간 종료
     * @return success, message, grossSalary, netSalary, taxAmount, consultationCount, specialSupportAmount
     */
    @Override
    public Map<String, Object> calculateSalaryPreview(Long consultantId, LocalDate periodStart, LocalDate periodEnd) {
        log.info("💰 PL/SQL 급여 미리보기 계산: ConsultantID={}, Period={} ~ {}",
                consultantId, periodStart, periodEnd);

        String tenantId = TenantContextHolder.getRequiredTenantId();
        Map<String, Object> result = new HashMap<>();

        try {
            int paramCount = countCalculateSalaryPreviewParameters();
            if (paramCount == 9) {
                log.warn("⚠️ CalculateSalaryPreview 구버전(9파라미터) 사용 중. tenant_id IN 없음. "
                        + "표준 프로시저 배포 시 CI PRODUCTION_DB_NAME 과 앱 DB 스키마가 동일한지 확인하세요.");
                result.putAll(executeCalculateSalaryPreviewLegacy9(consultantId, periodStart, periodEnd));
            } else if (paramCount == 10) {
                result.putAll(executeCalculateSalaryPreviewStandard(consultantId, periodStart, periodEnd, tenantId));
            } else if (paramCount == 11) {
                result.putAll(executeCalculateSalaryPreviewStandard11(consultantId, periodStart, periodEnd, tenantId));
            } else if (paramCount < 0) {
                try {
                    result.putAll(executeCalculateSalaryPreviewStandard11(consultantId, periodStart, periodEnd, tenantId));
                } catch (SQLException ex) {
                    if (shouldLogCalculateSalaryPreviewSignatureMismatch(ex)) {
                        log.warn("파라미터 개수 미확인 상태에서 표준(11) 호출 실패, 10·9 순 재시도: {}", ex.getMessage());
                        try {
                            result.putAll(executeCalculateSalaryPreviewStandard(consultantId, periodStart, periodEnd, tenantId));
                        } catch (SQLException ex10) {
                            if (shouldLogCalculateSalaryPreviewSignatureMismatch(ex10)) {
                                result.putAll(executeCalculateSalaryPreviewLegacy9(consultantId, periodStart, periodEnd));
                            } else {
                                throw ex10;
                            }
                        }
                    } else {
                        throw ex;
                    }
                }
            } else {
                log.error("❌ CalculateSalaryPreview 파라미터 개수 비정상: count={}", paramCount);
                result.put("success", false);
                result.put("message",
                        "CalculateSalaryPreview 프로시저 정의를 확인할 수 없습니다(parameters=" + paramCount + ").");
                return result;
            }
            if (Boolean.TRUE.equals(result.get("success"))) {
                applyFreelancePreviewTotalsWithSpecialSupport(consultantId, tenantId, result);
            }
            log.info("✅ PL/SQL 급여 미리보기 완료: ConsultantID={}, GrossSalary={}, NetSalary={}, ConsultationCount={}",
                    consultantId, result.get("grossSalary"), result.get("netSalary"), result.get("consultationCount"));
        } catch (Exception e) {
            log.error("PL/SQL 급여 미리보기 실패: error={}", e.getMessage(), e);
            logCalculateSalaryPreviewParameterDiagnostics(e);
            result.put("success", false);
            if (shouldLogCalculateSalaryPreviewSignatureMismatch(e)) {
                result.put("message",
                        "급여 미리보기 중 오류가 발생했습니다. " + CALCULATE_SALARY_PREVIEW_SIGNATURE_MISMATCH_HINT
                                + " 상세: " + e.getMessage());
            } else {
                result.put("message", "급여 미리보기 중 오류가 발생했습니다: " + e.getMessage());
            }
        }
        ensureUserFacingMessageWhenProcedureFailed(result, DEFAULT_PREVIEW_FAILURE_USER_MESSAGE);
        return result;
    }

    /**
     * Freelance preview: add special support to taxable gross, recompute withholding 3.3pct only
     * (rate already includes national + local components), optional VAT 10pct for business-registered profiles.
     */
    private void applyFreelancePreviewTotalsWithSpecialSupport(
            Long consultantId, String tenantId, Map<String, Object> result) {
        Optional<ConsultantSalaryProfile> profileOpt =
                consultantSalaryProfileRepository.findFirstByTenantIdAndConsultantIdAndIsActiveTrueOrderByUpdatedAtDescIdDesc(
                        tenantId, consultantId);
        if (profileOpt.isEmpty()) {
            return;
        }
        ConsultantSalaryProfile profile = profileOpt.get();
        if (!FreelanceWithholdingTaxUtil.CONSULTANT_SALARY_TYPE_FREELANCE.equals(profile.getSalaryType())) {
            return;
        }
        BigDecimal consultationGross = toBigDecimalAmount(result.get("grossSalary"));
        BigDecimal specialSupport = toBigDecimalAmount(result.get("specialSupportAmount"));
        if (specialSupport.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        BigDecimal taxableGross = consultationGross.add(specialSupport);
        BigDecimal withholding = FreelanceWithholdingTaxUtil.calculateWithholdingTaxAmount(taxableGross);
        BigDecimal vat = BigDecimal.ZERO;
        if (Boolean.TRUE.equals(profile.getIsBusinessRegistered())) {
            vat = taxableGross.multiply(new BigDecimal("0.10")).setScale(0, RoundingMode.FLOOR);
        }
        BigDecimal totalTax = withholding.add(vat);
        BigDecimal net = taxableGross.subtract(totalTax);
        result.put("consultationGrossSalary", consultationGross);
        result.put("taxableGrossSalary", taxableGross);
        result.put("taxAmount", totalTax);
        result.put("netSalary", net);
    }

    private static BigDecimal toBigDecimalAmount(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        }
        if (value instanceof Number) {
            return BigDecimal.valueOf(((Number) value).doubleValue());
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException ex) {
            return BigDecimal.ZERO;
        }
    }

    /**
     * 현재 스키마의 CalculateSalaryPreview 파라미터 행 수 (information_schema).
     *
     * @return 9·10·11 등, 조회 실패 시 -1
     */
    private int countCalculateSalaryPreviewParameters() {
        try {
            String sql = "SELECT COUNT(*) FROM information_schema.PARAMETERS "
                    + "WHERE SPECIFIC_SCHEMA = DATABASE() AND SPECIFIC_NAME = 'CalculateSalaryPreview'";
            Integer c = jdbcTemplate.queryForObject(sql, Integer.class);
            return c != null ? c : -1;
        } catch (Exception e) {
            log.warn("CalculateSalaryPreview 파라미터 개수 조회 실패: {}", e.getMessage());
            return -1;
        }
    }

    private void setConnectionUtf8mb4(Connection connection) throws SQLException {
        try (java.sql.Statement st = connection.createStatement()) {
            st.execute("SET character_set_client = utf8mb4");
            st.execute("SET character_set_connection = utf8mb4");
            st.execute("SET character_set_results = utf8mb4");
        }
    }

    /**
     * MySQL BOOLEAN OUT이 TINYINT 등으로 반환될 때 {@link CallableStatement#getBoolean(int)}만으로는
     * 누락될 수 있어 {@link CallableStatement#getObject(int)}로 읽는다.
     *
     * @param stmt  실행 완료된 CallableStatement
     * @param index 1-based OUT 파라미터 인덱스
     * @return true에 해당하면 true
     */
    private static boolean readMysqlProcedureBooleanOut(CallableStatement stmt, int index) throws SQLException {
        Object v = stmt.getObject(index);
        if (v == null) {
            return false;
        }
        if (v instanceof Boolean) {
            return (Boolean) v;
        }
        if (v instanceof Number) {
            return ((Number) v).intValue() != 0;
        }
        String s = String.valueOf(v).trim();
        return "1".equals(s) || "true".equalsIgnoreCase(s);
    }

    /**
     * 표준 10파라미터: 4 IN(마지막 tenant_id) + 6 OUT(success, message, gross, net, tax, count).
     */
    private Map<String, Object> executeCalculateSalaryPreviewStandard(
            Long consultantId, LocalDate periodStart, LocalDate periodEnd, String tenantId) throws SQLException {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(
                        "{CALL CalculateSalaryPreview(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            setConnectionUtf8mb4(connection);
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, tenantId);
            stmt.registerOutParameter(5, Types.BOOLEAN);
            stmt.registerOutParameter(6, Types.VARCHAR);
            stmt.registerOutParameter(7, Types.DECIMAL);
            stmt.registerOutParameter(8, Types.DECIMAL);
            stmt.registerOutParameter(9, Types.DECIMAL);
            stmt.registerOutParameter(10, Types.INTEGER);
            stmt.execute();
            result.put("success", readMysqlProcedureBooleanOut(stmt, 5));
            result.put("message", stmt.getString(6));
            result.put("grossSalary", stmt.getBigDecimal(7));
            result.put("netSalary", stmt.getBigDecimal(8));
            result.put("taxAmount", stmt.getBigDecimal(9));
            result.put("consultationCount", stmt.getInt(10));
            result.put("specialSupportAmount", BigDecimal.ZERO);
        }
        return result;
    }

    /**
     * 표준 11파라미터: 4 IN + 7 OUT(마지막 특별지원금).
     */
    private Map<String, Object> executeCalculateSalaryPreviewStandard11(
            Long consultantId, LocalDate periodStart, LocalDate periodEnd, String tenantId) throws SQLException {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(
                        "{CALL CalculateSalaryPreview(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            setConnectionUtf8mb4(connection);
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, tenantId);
            stmt.registerOutParameter(5, Types.BOOLEAN);
            stmt.registerOutParameter(6, Types.VARCHAR);
            stmt.registerOutParameter(7, Types.DECIMAL);
            stmt.registerOutParameter(8, Types.DECIMAL);
            stmt.registerOutParameter(9, Types.DECIMAL);
            stmt.registerOutParameter(10, Types.INTEGER);
            stmt.registerOutParameter(11, Types.DECIMAL);
            stmt.execute();
            result.put("success", readMysqlProcedureBooleanOut(stmt, 5));
            result.put("message", stmt.getString(6));
            result.put("grossSalary", stmt.getBigDecimal(7));
            result.put("netSalary", stmt.getBigDecimal(8));
            result.put("taxAmount", stmt.getBigDecimal(9));
            result.put("consultationCount", stmt.getInt(10));
            result.put("specialSupportAmount", stmt.getBigDecimal(11));
        }
        return result;
    }

    /**
     * 구버전 9파라미터(운영 로그 기준): 3 IN + 6 OUT.
     * OUT 순서: gross_salary, net_salary, tax_amount, consultation_count, success, message.
     */
    private Map<String, Object> executeCalculateSalaryPreviewLegacy9(
            Long consultantId, LocalDate periodStart, LocalDate periodEnd) throws SQLException {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
                CallableStatement stmt = connection.prepareCall(
                        "{CALL CalculateSalaryPreview(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            setConnectionUtf8mb4(connection);
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.registerOutParameter(4, Types.DECIMAL);
            stmt.registerOutParameter(5, Types.DECIMAL);
            stmt.registerOutParameter(6, Types.DECIMAL);
            stmt.registerOutParameter(7, Types.INTEGER);
            stmt.registerOutParameter(8, Types.BOOLEAN);
            stmt.registerOutParameter(9, Types.VARCHAR);
            stmt.execute();
            result.put("grossSalary", stmt.getBigDecimal(4));
            result.put("netSalary", stmt.getBigDecimal(5));
            result.put("taxAmount", stmt.getBigDecimal(6));
            result.put("consultationCount", stmt.getInt(7));
            result.put("success", readMysqlProcedureBooleanOut(stmt, 8));
            result.put("message", stmt.getString(9));
            result.put("specialSupportAmount", BigDecimal.ZERO);
        }
        return result;
    }

    /**
     * CalculateSalaryPreview 호출 실패가 JDBC 시그니처 불일치로 의심될 때 true.
     * 운영에서는 {@code database/schema/procedures_standardized/CalculateSalaryPreview_standardized.sql} 과
     * 동일한 시그니처로 배포하는 것이 본조치이며, {@code scripts/automation/deployment/deploy-standardized-procedures.sh} 로
     * 표준 프로시저를 반영할 수 있다.
     *
     * @param cause 호출 실패 원인(원인 체인 포함 검사)
     * @return information_schema 진단 로그 및 사용자 메시지 분기 여부
     */
    private boolean shouldLogCalculateSalaryPreviewSignatureMismatch(Throwable cause) {
        for (Throwable t = cause; t != null; t = t.getCause()) {
            String msg = t.getMessage();
            if (msg == null || msg.isEmpty()) {
                continue;
            }
            if (msg.contains("OUT parameter")) {
                return true;
            }
            if (msg.contains("Parameter index of") && msg.contains("out of range")) {
                return true;
            }
        }
        return false;
    }

    /**
     * 시그니처 불일치로 추정될 때 DB에 적용된 파라미터 목록을 로그로 남겨 배포 불일치 진단을 돕는다.
     * 본조치는 표준 프로시저 배포이며, {@link #shouldLogCalculateSalaryPreviewSignatureMismatch(Throwable)} 참고.
     *
     * @param cause 호출 실패 원인
     */
    private void logCalculateSalaryPreviewParameterDiagnostics(Throwable cause) {
        if (!shouldLogCalculateSalaryPreviewSignatureMismatch(cause)) {
            return;
        }
        try {
            String sql = "SELECT ORDINAL_POSITION, PARAMETER_MODE, PARAMETER_NAME "
                    + "FROM information_schema.PARAMETERS "
                    + "WHERE SPECIFIC_SCHEMA = DATABASE() AND SPECIFIC_NAME = 'CalculateSalaryPreview' "
                    + "ORDER BY ORDINAL_POSITION";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            log.error(
                    "CalculateSalaryPreview 시그니처 진단: information_schema.PARAMETERS (기대 1-4 IN, 5-11 OUT): rows={}",
                    rows);
        } catch (Exception ex) {
            log.warn("프로시저 파라미터 진단 조회 실패: error={}", ex.getMessage(), ex);
        }
    }

    /**
     * success가 true가 아닌데 message가 null이거나 공백이면 사용자용 기본 문구를 넣는다.
     *
     * @param result                 프로시저 결과 맵
     * @param defaultWhenBlankOrNull 실패 시 message가 비어 있을 때 사용할 문구
     */
    private static void ensureUserFacingMessageWhenProcedureFailed(
            Map<String, Object> result,
            String defaultWhenBlankOrNull) {
        if (Boolean.TRUE.equals(result.get("success"))) {
            return;
        }
        Object raw = result.get("message");
        String text;
        if (raw == null) {
            text = null;
        } else if (raw instanceof String str) {
            text = str;
        } else {
            text = String.valueOf(raw);
        }
        if (text == null || text.isBlank()) {
            result.put("message", defaultWhenBlankOrNull);
        }
    }
}
