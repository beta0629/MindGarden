package com.coresolution.core.service.impl;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.repository.RoleTemplateRepository;
import com.coresolution.core.service.OnboardingApprovalService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.support.TransactionTemplate;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 온보딩 승인 서비스 구현체 PL/SQL 프로시저를 호출하여 온보딩 승인 프로세스 처리
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingApprovalServiceImpl implements OnboardingApprovalService {

    private final JdbcTemplate jdbcTemplate;
    private final RoleTemplateRepository roleTemplateRepository;
    private final EntityManager entityManager;
    private final com.coresolution.core.repository.onboarding.OnboardingRequestRepository onboardingRequestRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final ApplicationContext applicationContext;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
    private final com.coresolution.core.service.TenantDashboardService tenantDashboardService;

    /**
     * 온보딩 승인 프로세스 실행 1. 프로시저를 먼저 시도 2. 프로시저 실패 시 Java 코드로 단계별 처리 (fallback) 전체 프로세스를 하나의 트랜잭션으로 감싸서
     * 실패 시 롤백 보장
     */
    @Override
    @Transactional(rollbackFor = Exception.class, timeout = 600) // 10분 타임아웃 (안전 마진)
    public Map<String, Object> processOnboardingApproval(java.util.UUID requestId, String tenantId,
            String tenantName, String businessType, String approvedBy, String decisionNote,
            String contactEmail, String adminPasswordHash, String subdomain) {

        log.info(OnboardingConstants.LOG_SEPARATOR);
        log.info("🚀 온보딩 승인 프로세스 시작");
        log.info(OnboardingConstants.LOG_SEPARATOR);
        log.info("  - requestId: {}", requestId);
        log.info("  - tenantId: {}", tenantId);
        log.info("  - tenantName: {}", tenantName);
        log.info("  - businessType: {}", businessType);
        log.info("  - contactEmail: {}", contactEmail);
        log.info("  - subdomain: {}", subdomain);
        log.info("  - approvedBy: {}", approvedBy);
        log.info(OnboardingConstants.LOG_SEPARATOR);

        // 1. 프로시저 먼저 시도
        try {
            log.info("📞 프로시저 호출 시도: ProcessOnboardingApproval");
            Map<String, Object> procedureResult =
                    processOnboardingApprovalLegacy(requestId, tenantId, tenantName, businessType,
                            approvedBy, decisionNote, contactEmail, adminPasswordHash, subdomain);
            Boolean procedureSuccess = (Boolean) procedureResult.get("success");
            String procedureMessage = (String) procedureResult.get("message");

            if (procedureSuccess != null && procedureSuccess) {
                log.info("✅ 프로시저 실행 성공: {}", procedureMessage);
                return procedureResult;
            } else {
                log.warn("⚠️ 프로시저 실행 실패: {} - Java fallback으로 전환", procedureMessage);
            }
        } catch (Exception e) {
            log.error("❌ 프로시저 호출 중 예외 발생 - Java fallback으로 전환: {}", e.getMessage(), e);
        }

        // 2. 프로시저 실패 시 Java 코드로 단계별 처리 (fallback)
        log.info(OnboardingConstants.LOG_SEPARATOR);
        log.info("🔄 Java 코드로 단계별 처리 시작 (프로시저 실패 후 fallback)");
        log.info(OnboardingConstants.LOG_SEPARATOR);

        Map<String, Object> result = new HashMap<>();
        Map<String, Object> stepResults = new HashMap<>();

        try {
            // Step 1: 테넌트 생성/활성화
            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
            StepResult tenantResult = executeStepTenantCreation(requestId, tenantId, tenantName,
                    businessType, subdomain, approvedBy);
            stepResults.put(OnboardingConstants.STEP_TENANT_CREATE, tenantResult);

            if (!tenantResult.isSuccess()) {
                log.error("❌ Step 1 실패: 테넌트 생성/활성화 실패 - 트랜잭션 롤백 예정");
                markTransactionForRollback("Step 1 실패: 테넌트 생성/활성화 실패");
                result.put("success", false);
                result.put("message", OnboardingConstants.MSG_TENANT_CREATE_FAILED + ": "
                        + tenantResult.getMessage());
                result.put("stepResults", stepResults);
                // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                throw new RuntimeException(OnboardingConstants.MSG_TENANT_CREATE_FAILED + ": "
                        + tenantResult.getMessage());
            }
            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생

            // Step 2: 역할 템플릿 적용
            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
            StepResult roleResult =
                    executeStepRoleApplication(requestId, tenantId, businessType, approvedBy);
            stepResults.put(OnboardingConstants.STEP_ROLE_APPLY, roleResult);

            if (!roleResult.isSuccess()) {
                log.error("❌ Step 2 실패: 역할 템플릿 적용 실패 - 트랜잭션 롤백 예정");
                markTransactionForRollback("Step 2 실패: 역할 템플릿 적용 실패");
                result.put("success", false);
                result.put("message",
                        OnboardingConstants.MSG_ROLE_APPLY_FAILED + ": " + roleResult.getMessage());
                result.put("stepResults", stepResults);
                // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                throw new RuntimeException(
                        OnboardingConstants.MSG_ROLE_APPLY_FAILED + ": " + roleResult.getMessage());
            }
            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생

            // Step 3: 관리자 계정 생성
            if (contactEmail != null && !contactEmail.trim().isEmpty() && adminPasswordHash != null
                    && !adminPasswordHash.trim().isEmpty()) {
                // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                StepResult adminResult = executeStepAdminAccountCreation(requestId, tenantId,
                        contactEmail, tenantName, adminPasswordHash, approvedBy);
                stepResults.put(OnboardingConstants.STEP_ADMIN_CREATE, adminResult);

                if (!adminResult.isSuccess()) {
                    log.error("❌ Step 3 실패: 관리자 계정 생성 실패 - 트랜잭션 롤백 예정");
                    markTransactionForRollback("Step 3 실패: 관리자 계정 생성 실패");
                    result.put("success", false);
                    result.put("message", OnboardingConstants.MSG_ADMIN_CREATE_FAILED + ": "
                            + adminResult.getMessage());
                    result.put("stepResults", stepResults);
                    // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                    throw new RuntimeException(OnboardingConstants.MSG_ADMIN_CREATE_FAILED + ": "
                            + adminResult.getMessage());
                }
                // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
            } else {
                log.warn("⚠️ 관리자 계정 생성 건너뜀: contactEmail 또는 adminPasswordHash가 없음");
                stepResults.put(OnboardingConstants.STEP_ADMIN_CREATE,
                        StepResult.skip(OnboardingConstants.MSG_ADMIN_CREATE_SKIPPED));
            }

            // Step 4: 대시보드 생성 (역할 생성 후 반드시 생성되어야 함)
            // 역할 생성 후 JPA 캐시를 비워서 대시보드 생성 시 역할이 보이도록 보장
            entityManager.flush();
            entityManager.clear();

            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
            StepResult dashboardResult =
                    executeStepDashboardCreation(requestId, tenantId, businessType, approvedBy);
            stepResults.put(OnboardingConstants.STEP_DASHBOARD_CREATE, dashboardResult);

            if (!dashboardResult.isSuccess()) {
                log.error("❌ Step 4 실패: 대시보드 생성 실패 - 트랜잭션 롤백 예정");
                markTransactionForRollback("Step 4 실패: 대시보드 생성 실패");
                result.put("success", false);
                result.put("message", OnboardingConstants.MSG_DASHBOARD_CREATE_FAILED + ": "
                        + dashboardResult.getMessage());
                result.put("stepResults", stepResults);
                // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                throw new RuntimeException(OnboardingConstants.MSG_DASHBOARD_CREATE_FAILED + ": "
                        + dashboardResult.getMessage());
            }
            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생

            // 모든 단계 성공
            log.info(OnboardingConstants.LOG_SEPARATOR);
            log.info("✅ 온보딩 승인 프로세스 완료 (트랜잭션 커밋 예정)");
            log.info(OnboardingConstants.LOG_SEPARATOR);
            result.put("success", true);
            result.put("message", OnboardingConstants.MSG_PROCESS_COMPLETE);
            result.put("stepResults", stepResults);
            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생

            return result;
        } catch (RuntimeException e) {
            // RuntimeException이 발생하면 트랜잭션이 자동으로 롤백됨
            log.error(OnboardingConstants.LOG_SEPARATOR);
            log.error("❌ 온보딩 승인 프로세스 실패 - 트랜잭션 롤백");
            log.error(OnboardingConstants.LOG_SEPARATOR);
            log.error("  - requestId: {}", requestId);
            log.error("  - tenantId: {}", tenantId);
            log.error("  - 오류: {}", e.getMessage());
            log.error(OnboardingConstants.LOG_SEPARATOR);
            // 예외를 다시 throw하여 트랜잭션 롤백 보장
            throw e;
        } catch (Exception e) {
            // 예상치 못한 예외도 롤백
            log.error(OnboardingConstants.LOG_SEPARATOR);
            log.error("❌ 온보딩 승인 프로세스 예외 발생 - 트랜잭션 롤백");
            log.error(OnboardingConstants.LOG_SEPARATOR);
            log.error("  - requestId: {}", requestId);
            log.error("  - tenantId: {}", tenantId);
            log.error("  - 오류: {}", e.getMessage(), e);
            log.error(OnboardingConstants.LOG_SEPARATOR);
            markTransactionForRollback("예상치 못한 예외 발생: " + e.getMessage());
            throw new RuntimeException("온보딩 승인 프로세스 중 예외 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 현재 트랜잭션을 롤백하도록 표시
     */
    private void markTransactionForRollback(String reason) {
        try {
            org.springframework.transaction.TransactionStatus status =
                    TransactionAspectSupport.currentTransactionStatus();
            if (status != null && !status.isRollbackOnly()) {
                status.setRollbackOnly();
                log.warn("⚠️ 트랜잭션 롤백 표시: {}", reason);
            }
        } catch (Exception e) {
            log.warn("트랜잭션 롤백 표시 실패 (무시): {}", e.getMessage());
        }
    }

    /**
     * Step 1: 테넌트 생성/활성화
     */
    private StepResult executeStepTenantCreation(java.util.UUID requestId, String tenantId,
            String tenantName, String businessType, String subdomain, String approvedBy) {
        log.info(OnboardingConstants.LOG_SEPARATOR);
        log.info("📋 Step 1: 테넌트 생성/활성화");
        log.info(OnboardingConstants.LOG_SEPARATOR);

        try {
            boolean created =
                    ensureTenantExists(tenantId, tenantName, businessType, subdomain, approvedBy);
            if (created) {
                log.info("✅ Step 1 성공: 테넌트 생성/활성화 완료 - tenantId={}", tenantId);
                return StepResult.success(OnboardingConstants.MSG_TENANT_CREATE_COMPLETE);
            } else {
                log.error("❌ Step 1 실패: 테넌트 생성/활성화 실패 - tenantId={}", tenantId);
                return StepResult.failure(OnboardingConstants.MSG_TENANT_CREATE_FAILED);
            }
        } catch (Exception e) {
            log.error("❌ Step 1 예외: 테넌트 생성/활성화 중 오류 발생 - tenantId={}, error={}", tenantId,
                    e.getMessage(), e);
            return StepResult
                    .failure(OnboardingConstants.MSG_TENANT_CREATE_FAILED + ": " + e.getMessage());
        }
    }

    /**
     * Step 2: 역할 템플릿 적용
     */
    private StepResult executeStepRoleApplication(java.util.UUID requestId, String tenantId,
            String businessType, String approvedBy) {
        log.info("==========================================");
        log.info("📋 Step 2: 역할 템플릿 적용");
        log.info("==========================================");

        try {
            int maxRetries = 5; // 10 -> 5로 감소 (타임아웃 방지)
            long baseRetryDelay = 1000; // 2초 -> 1초로 감소
            boolean rolesApplied = false;

            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                // 재시도 전 역할 존재 확인
                try {
                    Integer checkCount = jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)",
                            Integer.class, tenantId);
                    if (checkCount != null && checkCount > 0) {
                        log.info("✅ Step 2 성공: 역할이 이미 존재함 (다른 트랜잭션이 생성) - tenantId={}, count={}",
                                tenantId, checkCount);
                        rolesApplied = true;
                        break;
                    }
                } catch (Exception checkEx) {
                    log.warn("역할 존재 확인 실패: tenantId={}, error={}", tenantId, checkEx.getMessage());
                }

                // 역할 생성은 메인 트랜잭션 내에서 실행 (롤백 보장을 위해)
                // 단, 락 타임아웃을 방지하기 위해 별도 트랜잭션으로 실행하되
                // 실패 시 메인 트랜잭션도 롤백되도록 처리
                TransactionTemplate transactionTemplate =
                        new TransactionTemplate(transactionManager);
                // PROPAGATION_REQUIRES_NEW 대신 PROPAGATION_REQUIRED 사용하여 메인 트랜잭션에 참여
                // 단, 락 문제를 피하기 위해 ISOLATION_READ_COMMITTED 사용
                transactionTemplate.setPropagationBehavior(
                        org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRED);
                transactionTemplate.setIsolationLevel(
                        org.springframework.transaction.TransactionDefinition.ISOLATION_READ_COMMITTED);
                transactionTemplate.setTimeout(300); // 5분 타임아웃 (프로시저 실행 시간 고려, 안전 마진)

                Boolean roleResult = null;
                try {
                    roleResult = transactionTemplate.execute(status -> {
                        return ensureRolesAppliedOnce(tenantId, businessType, approvedBy);
                    });
                } catch (org.springframework.dao.CannotAcquireLockException e) {
                    log.warn("역할 생성 중 락 획득 실패 (재시도 예정): tenantId={}, attempt={}/{}, error={}",
                            tenantId, attempt, maxRetries, e.getMessage());
                    roleResult = false;
                } catch (Exception e) {
                    String errorMsg = e.getMessage();
                    if (errorMsg != null && (errorMsg
                            .contains(OnboardingConstants.ERROR_PATTERN_LOCK_WAIT_TIMEOUT)
                            || errorMsg.contains(OnboardingConstants.ERROR_PATTERN_LOCK_TIMEOUT)
                            || errorMsg.contains(OnboardingConstants.ERROR_PATTERN_DEADLOCK)
                            || errorMsg
                                    .contains(OnboardingConstants.ERROR_PATTERN_QUERY_INTERRUPTED)
                            || (errorMsg.contains(OnboardingConstants.ERROR_CODE_1317) && errorMsg
                                    .contains(OnboardingConstants.ERROR_PATTERN_INTERRUPTED)))) {
                        log.warn(
                                "역할 생성 중 락/쿼리 중단 관련 오류 (재시도 예정): tenantId={}, attempt={}/{}, error={}",
                                tenantId, attempt, maxRetries, errorMsg);
                        roleResult = false;
                    } else {
                        log.error("역할 생성 중 예상치 못한 오류: tenantId={}, attempt={}/{}, error={}",
                                tenantId, attempt, maxRetries, e.getMessage(), e);
                        return StepResult.failure(
                                OnboardingConstants.MSG_ROLE_APPLY_FAILED + ": " + e.getMessage());
                    }
                }

                if (roleResult != null && roleResult) {
                    rolesApplied = true;
                    log.info("✅ Step 2 성공: 역할 템플릿 적용 완료 - tenantId={}, attempt={}", tenantId,
                            attempt);
                    break;
                }

                if (attempt < maxRetries) {
                    long delay = baseRetryDelay * attempt;
                    log.warn("역할 생성 실패 (재시도): tenantId={}, attempt={}/{}, delay={}ms", tenantId,
                            attempt, maxRetries, delay);
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.error("재시도 대기 중 인터럽트 발생");
                        break;
                    }
                }
            }

            if (rolesApplied) {
                return StepResult.success(OnboardingConstants.MSG_ROLE_APPLY_COMPLETE);
            } else {
                log.error("❌ Step 2 실패: 역할 템플릿 적용 실패 (모든 재시도 실패) - tenantId={}", tenantId);
                return StepResult
                        .failure(OnboardingConstants.MSG_ROLE_APPLY_FAILED + ": 모든 재시도 실패");
            }
        } catch (Exception e) {
            log.error("❌ Step 2 예외: 역할 템플릿 적용 중 오류 발생 - tenantId={}, error={}", tenantId,
                    e.getMessage(), e);
            return StepResult
                    .failure(OnboardingConstants.MSG_ROLE_APPLY_FAILED + ": " + e.getMessage());
        }
    }

    /**
     * Step 3: 관리자 계정 생성
     */
    private StepResult executeStepAdminAccountCreation(java.util.UUID requestId, String tenantId,
            String contactEmail, String tenantName, String adminPasswordHash, String approvedBy) {
        log.info(OnboardingConstants.LOG_SEPARATOR);
        log.info("📋 Step 3: 관리자 계정 생성");
        log.info(OnboardingConstants.LOG_SEPARATOR);

        try {
            createAdminAccountDirectly(tenantId, contactEmail, tenantName, adminPasswordHash,
                    approvedBy);
            log.info("✅ Step 3 성공: 관리자 계정 생성 완료 - tenantId={}, email={}", tenantId, contactEmail);
            return StepResult.success(OnboardingConstants.MSG_ADMIN_CREATE_COMPLETE);
        } catch (Exception e) {
            log.error("❌ Step 3 예외: 관리자 계정 생성 중 오류 발생 - tenantId={}, email={}, error={}", tenantId,
                    contactEmail, e.getMessage(), e);
            return StepResult
                    .failure(OnboardingConstants.MSG_ADMIN_CREATE_FAILED + ": " + e.getMessage());
        }
    }

    /**
     * Step 4: 대시보드 생성
     */
    private StepResult executeStepDashboardCreation(java.util.UUID requestId, String tenantId,
            String businessType, String approvedBy) {
        log.info(OnboardingConstants.LOG_SEPARATOR);
        log.info("📋 Step 4: 대시보드 생성");
        log.info(OnboardingConstants.LOG_SEPARATOR);

        try {
            // 테넌트 컨텍스트 설정
            String previousTenantId =
                    com.coresolution.core.context.TenantContextHolder.getTenantId();
            try {
                if (previousTenantId == null || !previousTenantId.equals(tenantId)) {
                    com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);
                    log.debug("테넌트 컨텍스트 설정: tenantId={}", tenantId);
                }

                // 대시보드 생성 (역할이 이미 생성되어 있으므로 바로 생성 가능)
                List<com.coresolution.core.dto.TenantDashboardResponse> dashboards =
                        tenantDashboardService.createDefaultDashboards(tenantId, businessType,
                                approvedBy, null, null);

                if (dashboards == null || dashboards.isEmpty()) {
                    log.error("❌ Step 4 실패: 대시보드가 생성되지 않음 - tenantId={}", tenantId);
                    return StepResult.failure(
                            OnboardingConstants.MSG_DASHBOARD_CREATE_FAILED + ": 대시보드가 생성되지 않음");
                }

                log.info("✅ Step 4 성공: 대시보드 생성 완료 - tenantId={}, count={}", tenantId,
                        dashboards.size());
                return StepResult.success(OnboardingConstants.MSG_DASHBOARD_CREATE_COMPLETE + ": "
                        + dashboards.size() + "개");
            } finally {
                // 테넌트 컨텍스트 복원
                if (previousTenantId != null) {
                    com.coresolution.core.context.TenantContextHolder.setTenantId(previousTenantId);
                } else {
                    com.coresolution.core.context.TenantContextHolder.clear();
                }
            }
        } catch (Exception e) {
            log.error("❌ Step 4 예외: 대시보드 생성 중 오류 발생 - tenantId={}, error={}", tenantId,
                    e.getMessage(), e);
            return StepResult.failure(
                    OnboardingConstants.MSG_DASHBOARD_CREATE_FAILED + ": " + e.getMessage());
        }
    }

    /**
     * 단계별 실행 결과를 담는 내부 클래스
     */
    private static class StepResult {
        private final boolean success;
        private final String message;
        private final String status;

        private StepResult(boolean success, String message, String status) {
            this.success = success;
            this.message = message;
            this.status = status;
        }

        public static StepResult success(String message) {
            return new StepResult(true, message, OnboardingConstants.STATUS_SUCCESS);
        }

        public static StepResult failure(String message) {
            return new StepResult(false, message, OnboardingConstants.STATUS_FAILED);
        }

        public static StepResult skip(String message) {
            return new StepResult(true, message, OnboardingConstants.STATUS_SKIPPED);
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public String getStatus() {
            return status;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("success", success);
            map.put("message", message);
            map.put("status", status);
            return map;
        }
    }

    /**
     * 프로시저 호출 방식 (프로시저 먼저 시도, 실패 시 Java fallback 사용)
     */
    private Map<String, Object> processOnboardingApprovalLegacy(java.util.UUID requestId,
            String tenantId, String tenantName, String businessType, String approvedBy,
            String decisionNote, String contactEmail, String adminPasswordHash, String subdomain) {

        log.info(
                "온보딩 승인 프로세스 시작 (레거시): requestId={}, tenantId={}, tenantName={}, contactEmail={}, subdomain={}",
                requestId, tenantId, tenantName, contactEmail, subdomain);

        Map<String, Object> result = new HashMap<>();

        javax.sql.DataSource dataSource = jdbcTemplate.getDataSource();
        if (dataSource == null) {
            log.error("❌ DataSource가 null입니다. JDBC Template 설정을 확인하세요.");
            result.put("success", false);
            result.put("message", "데이터베이스 연결 설정 오류: DataSource가 null입니다.");
            return result;
        }

        // 주의: Spring 트랜잭션과 연결된 Connection 사용
        // dataSource.getConnection()은 Spring 트랜잭션과 분리된 Connection을 반환하므로
        // DataSourceUtils.getConnection()을 사용하여 Spring이 관리하는 Connection을 가져옴
        Connection connection = null;
        try {
            connection = DataSourceUtils.getConnection(dataSource);

            // Collation 설정 (프로시저 실행 전)
            try (java.sql.Statement stmt = connection.createStatement()) {
                stmt.execute("SET collation_connection = 'utf8mb4_unicode_ci'");
                stmt.execute("SET collation_database = 'utf8mb4_unicode_ci'");
                log.info("✅ Collation 설정 완료: utf8mb4_unicode_ci");
            } catch (SQLException e) {
                log.error("❌ Collation 설정 실패: {}", e.getMessage());
                throw e;
            }

            try (CallableStatement cs = connection.prepareCall(
                    "{CALL ProcessOnboardingApproval(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {

                // 프로시저 실행 타임아웃 설정 (초 단위)
                cs.setQueryTimeout(300); // 5분 타임아웃 (프로시저 실행 시간 고려, 안전 마진)

                // IN 파라미터 설정 - UUID를 BINARY(16)으로 변환
                byte[] uuidBytes = convertUuidToBytes(requestId);
                log.info("프로시저 파라미터 설정:");
                log.info("  [1] requestId (BINARY): {}",
                        java.util.Base64.getEncoder().encodeToString(uuidBytes));
                log.info("  [2] tenantId: {}", tenantId);
                log.info("  [3] tenantName: {}", tenantName);
                log.info("  [4] businessType: {}", businessType);
                log.info("  [5] approvedBy: {}", approvedBy);
                log.info("  [6] decisionNote: {}",
                        decisionNote != null ? (decisionNote.length() > 100
                                ? decisionNote.substring(0, 100) + "..."
                                : decisionNote) : "null");
                log.info("  [7] contactEmail: {}", contactEmail);
                log.info("  [8] adminPasswordHash: {}",
                        adminPasswordHash != null ? (adminPasswordHash.length() > 20
                                ? adminPasswordHash.substring(0, 20) + "..."
                                : adminPasswordHash) : "null");
                log.info("  [9] subdomain: {}", subdomain);

                cs.setBytes(1, uuidBytes);
                cs.setString(2, tenantId);
                cs.setString(3, tenantName);
                cs.setString(4, businessType);
                cs.setString(5, approvedBy);
                cs.setString(6, decisionNote);
                cs.setString(7, contactEmail); // 추가: 연락 이메일
                cs.setString(8, adminPasswordHash); // 추가: BCrypt 해시된 비밀번호
                cs.setString(9, subdomain); // 추가: 서브도메인

                // OUT 파라미터 등록
                cs.registerOutParameter(10, Types.BOOLEAN); // p_success
                cs.registerOutParameter(11, Types.VARCHAR); // p_message
                log.info("OUT 파라미터 등록 완료: [10] success (BOOLEAN), [11] message (VARCHAR)");

                // 프로시저 실행
                log.info("==========================================");
                log.info("🚀 프로시저 실행 시작");
                log.info("  - requestId: {}", requestId);
                log.info("  - tenantId: {}", tenantId);
                log.info("  - tenantName: {}", tenantName);
                log.info("  - businessType: {}", businessType);
                log.info("  - contactEmail: {}", contactEmail);
                log.info("  - subdomain: {}", subdomain);
                log.info("  - approvedBy: {}", approvedBy);
                log.info("==========================================");

                // 프로시저 실행 전 상태 확인
                try {
                    java.sql.Statement checkStmt = connection.createStatement();
                    java.sql.ResultSet rs =
                            checkStmt.executeQuery("SELECT CONNECTION_ID(), DATABASE(), USER()");
                    if (rs.next()) {
                        log.info("프로시저 실행 전 상태: connectionId={}, database={}, user={}",
                                rs.getLong(1), rs.getString(2), rs.getString(3));
                    }
                    rs.close();
                    checkStmt.close();
                } catch (SQLException e) {
                    log.warn("프로시저 실행 전 상태 확인 실패 (무시): {}", e.getMessage());
                }

                long startTime = System.currentTimeMillis();
                boolean hasResult = cs.execute();
                long duration = System.currentTimeMillis() - startTime;

                log.info("프로시저 실행 완료: hasResult={}, duration={}ms", hasResult, duration);

                // 프로시저 실행 후 상태 확인
                try {
                    java.sql.Statement checkStmt = connection.createStatement();
                    java.sql.ResultSet rs = checkStmt.executeQuery(
                            "SELECT @@error_count, @@warning_count, LAST_INSERT_ID()");
                    if (rs.next()) {
                        log.info("프로시저 실행 후 상태: errorCount={}, warningCount={}, lastInsertId={}",
                                rs.getInt(1), rs.getInt(2), rs.getLong(3));
                    }
                    rs.close();
                    checkStmt.close();
                } catch (SQLException e) {
                    log.warn("프로시저 실행 후 상태 확인 실패 (무시): {}", e.getMessage());
                }

                // 결과 추출
                Boolean success = null;
                String message = null;

                try {
                    success = cs.getBoolean(10);
                    log.info("프로시저 OUT 파라미터 [10] (success) 읽기: {}", success);
                } catch (SQLException e) {
                    log.error("프로시저 OUT 파라미터 [10] (success) 읽기 실패: {}", e.getMessage(), e);
                    // VARCHAR로 읽어보기 시도
                    try {
                        Object successObj = cs.getObject(10);
                        log.info("프로시저 OUT 파라미터 [10] (success) 원본 값: {}, 타입: {}", successObj,
                                successObj != null ? successObj.getClass().getName() : "null");
                        if (successObj instanceof Boolean) {
                            success = (Boolean) successObj;
                        } else if (successObj instanceof Number) {
                            success = ((Number) successObj).intValue() != 0;
                        } else if (successObj instanceof String) {
                            success = Boolean.parseBoolean((String) successObj)
                                    || "1".equals(successObj)
                                    || "true".equalsIgnoreCase((String) successObj);
                        }
                    } catch (SQLException e2) {
                        log.error("프로시저 OUT 파라미터 [10] (success) 대체 읽기 실패: {}", e2.getMessage());
                    }
                }

                try {
                    message = cs.getString(11);
                    log.info("프로시저 OUT 파라미터 [11] (message) 읽기: {}", message);
                } catch (SQLException e) {
                    log.error("프로시저 OUT 파라미터 [11] (message) 읽기 실패: {}", e.getMessage(), e);
                    // TEXT로 읽어보기 시도
                    try {
                        Object messageObj = cs.getObject(11);
                        log.info("프로시저 OUT 파라미터 [11] (message) 원본 값: {}", messageObj);
                        if (messageObj != null) {
                            message = messageObj.toString();
                        }
                    } catch (SQLException e2) {
                        log.error("프로시저 OUT 파라미터 [11] (message) 대체 읽기 실패: {}", e2.getMessage());
                    }
                }

                // SQL Warnings 확인 (프로시저 내부 경고)
                try {
                    java.sql.SQLWarning warning = cs.getWarnings();
                    if (warning != null) {
                        log.warn("⚠️ 프로시저 실행 중 SQL Warning 발생:");
                        java.sql.SQLWarning currentWarning = warning;
                        int warningCount = 0;
                        while (currentWarning != null && warningCount < 10) {
                            log.warn("  Warning [{}]: SQLState={}, ErrorCode={}, Message={}",
                                    warningCount + 1, currentWarning.getSQLState(),
                                    currentWarning.getErrorCode(), currentWarning.getMessage());
                            currentWarning = currentWarning.getNextWarning();
                            warningCount++;
                        }
                    }
                } catch (SQLException e) {
                    log.debug("SQL Warning 조회 실패 (무시): {}", e.getMessage());
                }

                log.info("==========================================");
                log.info("📋 프로시저 결과 (최종)");
                log.info("  - success: {}", success);
                log.info("  - message: {}", message);
                log.info("==========================================");

                // NULL 체크 및 기본값 설정
                if (success == null) {
                    log.error("❌❌❌ 프로시저 success 값이 NULL입니다. 기본값 FALSE로 설정합니다.");
                    log.error("  - requestId: {}", requestId);
                    log.error("  - tenantId: {}", tenantId);
                    success = false;
                }
                if (message == null || message.trim().isEmpty()) {
                    log.error("❌❌❌ 프로시저 message 값이 NULL이거나 비어있습니다. 기본 메시지로 설정합니다.");
                    log.error("  - requestId: {}", requestId);
                    log.error("  - tenantId: {}", tenantId);
                    message = "프로시저 실행 중 오류가 발생했습니다. (상세 오류 정보 없음)";
                    // 프로시저 내부 오류 가능성 확인을 위해 SQL 경고 확인
                    try {
                        java.sql.SQLWarning warning = cs.getWarnings();
                        if (warning != null) {
                            log.error("❌ 프로시저 실행 경고: {}", warning.getMessage());
                            message += " [경고: " + warning.getMessage() + "]";
                        }
                    } catch (SQLException e) {
                        log.debug("경고 확인 중 오류 (무시): {}", e.getMessage());
                    }
                }

                // 실패 시 상세 로그 출력
                if (success == null || !success) {
                    log.error("==========================================");
                    log.error("❌❌❌ 프로시저 실행 실패 상세 정보");
                    log.error("==========================================");
                    log.error("  - requestId: {}", requestId);
                    log.error("  - tenantId: {}", tenantId);
                    log.error("  - tenantName: {}", tenantName);
                    log.error("  - businessType: {}", businessType);
                    log.error("  - contactEmail: {}", contactEmail);
                    log.error("  - subdomain: {}", subdomain);
                    log.error("  - approvedBy: {}", approvedBy);
                    log.error("  - success: {}", success);
                    log.error("  - message: {}", message);
                    log.error("==========================================");

                    // 프로시저 내부 단계별 오류 확인을 위한 추가 정보
                    log.error("💡 프로시저 실패 가능 단계:");
                    log.error("  1. CreateOrActivateTenant - 테넌트 생성/활성화");
                    log.error("  2. ApplyDefaultRoleTemplates - 역할 템플릿 적용");
                    log.error("  3. CreateTenantAdminAccount - 관리자 계정 생성");
                    log.error("💡 위 단계 중 하나에서 실패했을 가능성이 높습니다.");
                }

                // 프로시저 실패 시 Java에서 각 단계를 개별적으로 실행 (fallback)
                if (success == null || !success) {
                    log.warn("⚠️ 프로시저 실행 실패 - Java에서 단계별 재시도 시작: tenantId={}", tenantId);

                    boolean tenantCreated = false;
                    boolean rolesApplied = false;
                    StringBuilder fallbackMessage = new StringBuilder("프로시저 실패 후 Java 재시도: ");

                    // 1. 테넌트 생성/활성화 확인 및 필요시 생성
                    updateProcessingStatus(requestId, "TENANT_CREATE", "IN_PROGRESS",
                            "테넌트 생성/활성화 중 (Java 재시도)...");
                    try {
                        tenantCreated = ensureTenantExists(tenantId, tenantName, businessType,
                                subdomain, approvedBy);
                        if (tenantCreated) {
                            fallbackMessage.append("테넌트=OK, ");
                            updateProcessingStatus(requestId, "TENANT_CREATE", "SUCCESS",
                                    "테넌트 생성/활성화 완료");
                        } else {
                            fallbackMessage.append("테넌트=실패, ");
                            updateProcessingStatus(requestId, "TENANT_CREATE", "FAILED",
                                    "테넌트 생성/활성화 실패");
                        }
                    } catch (Exception e) {
                        log.error("테넌트 생성/활성화 실패: tenantId={}, error={}", tenantId, e.getMessage());
                        fallbackMessage.append("테넌트=오류, ");
                        updateProcessingStatus(requestId, "TENANT_CREATE", "FAILED",
                                "테넌트 생성/활성화 오류: " + e.getMessage());
                    }

                    // 2. 역할 템플릿 적용 확인 (테넌트가 존재하는 경우에만)
                    if (tenantCreated) {
                        updateProcessingStatus(requestId, "ROLE_APPLY", "IN_PROGRESS",
                                "역할 템플릿 적용 중 (Java 재시도)...");
                        try {
                            // TransactionTemplate을 사용하여 별도 트랜잭션에서 실행
                            // 재시도 로직을 TransactionTemplate 밖으로 이동하여 각 재시도마다 새로운 트랜잭션 시작
                            int maxRetries = 10; // 재시도 횟수 증가 (5 -> 10)
                            long baseRetryDelay = 2000; // 재시도 지연 시간 증가 (1초 -> 2초)
                            rolesApplied = false;

                            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                                // 재시도 전 역할 존재 확인 (다른 트랜잭션이 생성했을 수 있음)
                                try {
                                    Integer checkCount = jdbcTemplate.queryForObject(
                                            "SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)",
                                            Integer.class, tenantId);
                                    if (checkCount != null && checkCount > 0) {
                                        log.info(
                                                "재시도 전 역할 존재 확인: tenantId={}, count={} (다른 트랜잭션이 생성함)",
                                                tenantId, checkCount);
                                        rolesApplied = true;
                                        break;
                                    }
                                } catch (Exception checkEx) {
                                    log.warn("재시도 전 역할 존재 확인 실패: tenantId={}, error={}", tenantId,
                                            checkEx.getMessage());
                                }

                                TransactionTemplate transactionTemplate =
                                        new TransactionTemplate(transactionManager);
                                // PROPAGATION_REQUIRED 사용하여 메인 트랜잭션에 참여 (락 문제 최소화)
                                transactionTemplate.setPropagationBehavior(
                                        org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRED);
                                transactionTemplate.setIsolationLevel(
                                        org.springframework.transaction.TransactionDefinition.ISOLATION_READ_COMMITTED);
                                // 락 타임아웃 설정 (초 단위, 기본값보다 길게)
                                // 30초는 너무 짧아서 쿼리 실행 중단 오류 발생, 60초로 증가
                                transactionTemplate.setTimeout(300); // 5분 타임아웃 (프로시저 실행 시간 고려, 안전
                                                                     // 마진)

                                Boolean roleResult = null;
                                try {
                                    roleResult = transactionTemplate.execute(status -> {
                                        return ensureRolesAppliedOnce(tenantId, businessType,
                                                approvedBy);
                                    });
                                } catch (org.springframework.dao.CannotAcquireLockException e) {
                                    log.warn(
                                            "역할 생성 중 락 획득 실패 (재시도 예정): tenantId={}, attempt={}/{}, error={}",
                                            tenantId, attempt, maxRetries, e.getMessage());
                                    roleResult = false;
                                } catch (Exception e) {
                                    String errorMsg = e.getMessage();
                                    // Query execution was interrupted (MySQL 에러 코드 1317)도 재시도 가능한
                                    // 오류로 처리
                                    if (errorMsg != null && (errorMsg.contains("Lock wait timeout")
                                            || errorMsg.contains("lock timeout")
                                            || errorMsg.contains("deadlock")
                                            || errorMsg.contains("Query execution was interrupted")
                                            || (errorMsg.contains("1317")
                                                    && errorMsg.contains("interrupted")))) {
                                        log.warn(
                                                "역할 생성 중 락/쿼리 중단 관련 오류 (재시도 예정): tenantId={}, attempt={}/{}, error={}",
                                                tenantId, attempt, maxRetries, errorMsg);
                                        roleResult = false;
                                    } else {
                                        log.error(
                                                "역할 생성 중 예상치 못한 오류: tenantId={}, attempt={}/{}, error={}",
                                                tenantId, attempt, maxRetries, e.getMessage(), e);
                                        roleResult = false;
                                    }
                                }

                                if (roleResult != null && roleResult) {
                                    rolesApplied = true;
                                    break;
                                }

                                if (attempt < maxRetries) {
                                    long delay = baseRetryDelay * attempt; // 지수 백오프
                                    log.warn(
                                            "역할 생성 실패 (재시도): tenantId={}, attempt={}/{}, delay={}ms",
                                            tenantId, attempt, maxRetries, delay);
                                    try {
                                        Thread.sleep(delay);
                                    } catch (InterruptedException ie) {
                                        Thread.currentThread().interrupt();
                                        log.error("재시도 대기 중 인터럽트 발생");
                                        break;
                                    }
                                }
                            }
                            if (rolesApplied) {
                                fallbackMessage.append("역할=OK, ");
                                // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                            } else {
                                fallbackMessage.append("역할=실패, ");
                                // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                            }
                        } catch (Exception e) {
                            log.error("역할 템플릿 적용 실패: tenantId={}, error={}", tenantId,
                                    e.getMessage());
                            fallbackMessage.append("역할=오류, ");
                            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                        }
                    }

                    // 3. 관리자 계정 생성 (테넌트가 존재하는 경우에만)
                    if (tenantCreated && contactEmail != null && !contactEmail.trim().isEmpty()
                            && adminPasswordHash != null && !adminPasswordHash.trim().isEmpty()) {
                        // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                        try {
                            createAdminAccountDirectly(tenantId, contactEmail, tenantName,
                                    adminPasswordHash, approvedBy);
                            fallbackMessage.append("관리자=OK");
                            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                        } catch (Exception e) {
                            log.warn("관리자 계정 직접 생성 실패: tenantId={}, error={}", tenantId,
                                    e.getMessage());
                            fallbackMessage.append("관리자=실패");
                            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                        }
                    }

                    // 최소한 테넌트가 생성되었으면 성공으로 처리
                    if (tenantCreated) {
                        success = true;
                        message = fallbackMessage.toString();
                        log.info("✅ Java 재시도 성공: {}", message);
                    } else {
                        success = false;
                        message = "프로시저 실패 및 Java 재시도 실패: "
                                + (message != null ? message : "알 수 없는 오류");
                        log.error("❌ Java 재시도 실패: {}", message);
                    }
                } else {
                    // 프로시저 성공 시에도 관리자 계정이 없으면 생성 시도
                    if (contactEmail != null && !contactEmail.trim().isEmpty()
                            && adminPasswordHash != null && !adminPasswordHash.trim().isEmpty()) {
                        try {
                            createAdminAccountDirectly(tenantId, contactEmail, tenantName,
                                    adminPasswordHash, approvedBy);
                            log.info("관리자 계정 생성 완료 (Java 직접 생성)");
                        } catch (Exception e) {
                            log.warn("관리자 계정 직접 생성 실패 (프로시저에서 이미 생성되었을 수 있음): {}", e.getMessage());
                        }
                    }
                }

                result.put("success", success);
                result.put("message", message);

                if (success) {
                    log.info("온보딩 승인 프로세스 완료: {}", message);
                } else {
                    log.error("온보딩 승인 프로세스 실패: {}", message);
                }

            } // CallableStatement 닫기

        } catch (SQLException e) {
            log.error("==========================================");
            log.error("❌❌❌ 온보딩 승인 프로세스 중 SQL 오류 발생");
            log.error("==========================================");
            log.error("  - requestId: {}", requestId);
            log.error("  - tenantId: {}", tenantId);
            log.error("  - 오류 메시지: {}", e.getMessage());
            log.error("  - SQL 상태 코드: {}", e.getSQLState());
            log.error("  - 오류 코드: {}", e.getErrorCode());
            if (e.getNextException() != null) {
                log.error("  - 연결된 예외: {}", e.getNextException().getMessage());
            }
            log.error("==========================================");
            log.error("스택 트레이스:", e);

            String errorMessage = "온보딩 승인 프로세스 중 SQL 오류 발생: " + e.getMessage();
            if (e.getSQLState() != null) {
                errorMessage += " [SQL State: " + e.getSQLState() + "]";
            }
            if (e.getErrorCode() != 0) {
                errorMessage += " [Error Code: " + e.getErrorCode() + "]";
            }

            result.put("success", false);
            result.put("message", errorMessage);
        } catch (Exception e) {
            log.error("==========================================");
            log.error("❌❌❌ 온보딩 승인 프로세스 중 예외 발생");
            log.error("==========================================");
            log.error("  - requestId: {}", requestId);
            log.error("  - tenantId: {}", tenantId);
            log.error("  - 오류 메시지: {}", e.getMessage());
            log.error("==========================================");
            log.error("스택 트레이스:", e);

            result.put("success", false);
            result.put("message", "온보딩 승인 프로세스 중 오류 발생: " + e.getMessage());
        } finally {
            // 주의: DataSourceUtils.getConnection()으로 가져온 Connection은
            // Spring 트랜잭션이 관리하므로, 트랜잭션이 활성화되어 있으면 해제하지 않음
            // 트랜잭션이 없거나 이미 종료된 경우에만 해제
            if (connection != null) {
                try {
                    // Spring 트랜잭션이 활성화되어 있는지 확인
                    boolean isTransactionActive =
                            org.springframework.transaction.support.TransactionSynchronizationManager
                                    .isActualTransactionActive();
                    if (!isTransactionActive) {
                        // 트랜잭션이 없으면 해제
                        DataSourceUtils.releaseConnection(connection, dataSource);
                        log.debug("Connection 해제 완료 (트랜잭션 비활성)");
                    } else {
                        // 트랜잭션이 활성화되어 있으면 Spring이 자동으로 해제하므로 해제하지 않음
                        log.debug("Connection은 Spring 트랜잭션이 관리 (자동 해제 예정)");
                    }
                } catch (Exception e) {
                    log.warn("Connection 해제 중 오류 (무시): {}", e.getMessage());
                }
            }
        }

        return result;
    }

    /**
     * UUID를 BINARY(16) 바이트 배열로 변환
     */
    private byte[] convertUuidToBytes(java.util.UUID uuid) {
        java.nio.ByteBuffer bb = java.nio.ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }

    /**
     * 관리자 계정을 직접 생성 (프로시저 실패 시 fallback)
     */
    private void createAdminAccountDirectly(String tenantId, String contactEmail, String tenantName,
            String adminPasswordHash, String approvedBy) {
        log.info("관리자 계정 직접 생성 시작: tenantId={}, email={}", tenantId, contactEmail);

        // 이미 존재하는지 확인
        Integer existingCount = null;
        try {
            existingCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE tenant_id = ? AND email = ? AND role = 'ADMIN' AND (is_deleted IS NULL OR is_deleted = FALSE)",
                    Integer.class, tenantId, contactEmail.toLowerCase().trim());
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            log.warn("관리자 계정 존재 확인 쿼리 결과 없음 (0으로 처리): tenantId={}, email={}", tenantId,
                    contactEmail);
            existingCount = 0;
        } catch (Exception e) {
            log.error("관리자 계정 존재 확인 실패: tenantId={}, email={}, error={}", tenantId, contactEmail,
                    e.getMessage(), e);
            throw e; // 예외를 다시 throw하여 상위에서 처리
        }

        if (existingCount != null && existingCount > 0) {
            log.info("관리자 계정이 이미 존재합니다: {}", contactEmail);
            return;
        }

        // 사용자 ID 생성 (이메일의 로컬 파트, 전역 중복 체크)
        String localPart = contactEmail.substring(0, contactEmail.indexOf('@'));
        String base = localPart.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        if (base.isEmpty()) {
            base = "admin";
        }

        String userId = base;
        int suffix = 1;

        // user_id는 전역적으로 UNIQUE하므로 중복 체크
        while (true) {
            Integer count = null;
            try {
                count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM users WHERE user_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)",
                        Integer.class, userId);
            } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                count = 0; // 결과 없음 = 사용 가능
            } catch (Exception e) {
                log.error("user_id 중복 체크 실패: userId={}, error={}", userId, e.getMessage(), e);
                // 예외 발생 시 기본값 사용
                break;
            }
            if (count == null || count == 0) {
                break; // 사용 가능한 user_id
            }
            userId = base + suffix;
            suffix++;
        }

        String email = contactEmail.toLowerCase().trim();

        // 관리자 계정 생성
        try {
            jdbcTemplate.update("INSERT INTO users ("
                    + "    tenant_id, user_id, email, password, name, role, "
                    + "    phone, is_active, is_email_verified, is_social_account, "
                    + "    created_at, updated_at, created_by, updated_by, is_deleted, version"
                    + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, FALSE, 0)",
                    tenantId, userId, email, adminPasswordHash, tenantName + " 관리자", "ADMIN", null, // phone
                    true, // is_active
                    true, // is_email_verified
                    false, // is_social_account
                    approvedBy, approvedBy);
        } catch (org.springframework.dao.DuplicateKeyException e) {
            // 중복 키 오류 발생 시 (다른 프로세스에서 동시에 생성한 경우)
            log.warn("관리자 계정 생성 중 중복 키 오류 (다른 프로세스에서 이미 생성되었을 수 있음): userId={}, email={}", userId,
                    email);
            // 이미 존재하는지 다시 확인
            Integer finalCount = null;
            try {
                finalCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM users WHERE tenant_id = ? AND email = ? AND role = 'ADMIN' AND (is_deleted IS NULL OR is_deleted = FALSE)",
                        Integer.class, tenantId, email);
            } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
                finalCount = 0; // 결과 없음
            } catch (Exception ex) {
                log.error("관리자 계정 재확인 실패: tenantId={}, email={}, error={}", tenantId, email,
                        ex.getMessage(), ex);
                finalCount = 0; // 오류 시 0으로 처리
            }
            if (finalCount != null && finalCount > 0) {
                log.info("관리자 계정이 이미 존재합니다 (중복 키 오류 후 확인): {}", email);
                return;
            }
            throw e; // 다른 오류면 재발생
        }

        log.info("관리자 계정 생성 완료: email={}, tenantId={}", email, tenantId);
    }

    /**
     * 테넌트가 존재하는지 확인하고, 없으면 생성/활성화
     */
    private boolean ensureTenantExists(String tenantId, String tenantName, String businessType,
            String subdomain, String approvedBy) {
        log.info("테넌트 존재 확인 및 생성: tenantId={}", tenantId);

        // 테넌트 존재 확인
        Integer count = null;
        try {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tenants WHERE tenant_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)",
                    Integer.class, tenantId);
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            log.warn("테넌트 존재 확인 쿼리 결과 없음 (0으로 처리): tenantId={}", tenantId);
            count = 0;
        } catch (Exception ex) {
            log.error("테넌트 존재 확인 실패: tenantId={}, error={}", tenantId, ex.getMessage(), ex);
            return false;
        }

        if (count != null && count > 0) {
            // 기존 테넌트 활성화
            try {
                jdbcTemplate.update(
                        "UPDATE tenants SET status = 'ACTIVE', updated_at = NOW(), updated_by = ? WHERE tenant_id = ?",
                        approvedBy, tenantId);
                log.info("기존 테넌트 활성화 완료: tenantId={}", tenantId);
                return true;
            } catch (Exception e) {
                log.error("테넌트 활성화 실패: tenantId={}, error={}", tenantId, e.getMessage());
                return false;
            }
        } else {
            // 새 테넌트 생성
            try {
                // 서브도메인 생성
                String finalSubdomain = subdomain;
                if (finalSubdomain == null || finalSubdomain.trim().isEmpty()) {
                    finalSubdomain = generateSubdomain(tenantName);
                }

                // 도메인 생성
                String domain = finalSubdomain + ".dev.core-solution.co.kr";

                // settings_json 생성
                String settingsJson = String.format(
                        "{\"subdomain\":\"%s\",\"domain\":\"%s\",\"features\":{\"consultation\":%s,\"academy\":%s}}",
                        finalSubdomain, domain,
                        "CONSULTATION".equals(businessType) ? "true" : "false",
                        "ACADEMY".equals(businessType) ? "true" : "false");

                jdbcTemplate.update("INSERT INTO tenants ("
                        + "    tenant_id, name, business_type, status, subscription_status, "
                        + "    subdomain, settings_json, created_at, updated_at, created_by, updated_by, "
                        + "    is_deleted, version, lang_code"
                        + ") VALUES (?, ?, ?, 'ACTIVE', 'ACTIVE', ?, ?, NOW(), NOW(), ?, ?, FALSE, 0, 'ko')",
                        tenantId, tenantName, businessType, finalSubdomain, settingsJson,
                        approvedBy, approvedBy);

                log.info("새 테넌트 생성 완료: tenantId={}, subdomain={}", tenantId, finalSubdomain);
                return true;
            } catch (org.springframework.dao.DuplicateKeyException e) {
                // 동시성 문제로 테넌트가 이미 생성된 경우 (다른 프로세스에서 생성)
                log.warn("테넌트 생성 중 중복 키 오류 (이미 존재하는 테넌트): tenantId={}, error={}", tenantId,
                        e.getMessage());
                // 기존 테넌트 활성화로 처리
                try {
                    jdbcTemplate.update(
                            "UPDATE tenants SET status = 'ACTIVE', updated_at = NOW(), updated_by = ? WHERE tenant_id = ?",
                            approvedBy, tenantId);
                    log.info("기존 테넌트 활성화 완료 (중복 키 오류 후): tenantId={}", tenantId);
                    return true;
                } catch (Exception updateEx) {
                    log.error("테넌트 활성화 실패 (중복 키 오류 후): tenantId={}, error={}", tenantId,
                            updateEx.getMessage());
                    return false;
                }
            } catch (Exception e) {
                log.error("테넌트 생성 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
                return false;
            }
        }
    }

    /**
     * 서브도메인 생성
     */
    private String generateSubdomain(String tenantName) {
        if (tenantName == null || tenantName.trim().isEmpty()) {
            return "tenant-" + System.currentTimeMillis();
        }

        String subdomain = tenantName.toLowerCase().replaceAll("[^a-z0-9가-힣]", "-")
                .replaceAll("-+", "-").replaceAll("^-|-$", "");

        // 한글 처리 (간단한 변환)
        subdomain = subdomain.replace("상담", "consultation").replace("학원", "academy").replace("센터",
                "center");

        // 영문/숫자/하이픈만 남기기
        subdomain = subdomain.replaceAll("[^a-z0-9-]", "");

        if (subdomain.isEmpty() || subdomain.length() > 63) {
            subdomain = "tenant-" + System.currentTimeMillis();
        }

        return subdomain;
    }

    /**
     * 역할 템플릿이 적용되었는지 확인하고, 없으면 기본 역할 생성 (한 번만 시도, 재시도는 호출부에서 처리)
     */
    private boolean ensureRolesAppliedOnce(String tenantId, String businessType,
            String approvedBy) {
        log.info("역할 템플릿 적용 확인: tenantId={}, businessType={}", tenantId, businessType);

        // 역할 존재 확인
        Integer roleCount = null;
        try {
            roleCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)",
                    Integer.class, tenantId);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            log.warn("역할 존재 확인 쿼리 결과 없음 (0으로 처리): tenantId={}", tenantId);
            roleCount = 0;
        } catch (Exception e) {
            log.error("역할 존재 확인 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
            return false;
        }

        if (roleCount != null && roleCount > 0) {
            log.info("역할이 이미 존재합니다: tenantId={}, count={}", tenantId, roleCount);
            return true;
        }

        // 기본 역할 생성 (CONSULTATION, COUNSELING, ACADEMY 업종 지원)
        if ("CONSULTATION".equals(businessType) || "COUNSELING".equals(businessType)
                || "ACADEMY".equals(businessType)) {
            try {
                // 역할 템플릿 조회 (roleTemplateId 설정을 위해)
                // 각 업종별 템플릿 사용
                String templatePrefix;
                if ("COUNSELING".equals(businessType)) {
                    templatePrefix = "COUNSELING";
                } else if ("ACADEMY".equals(businessType)) {
                    templatePrefix = "ACADEMY";
                } else {
                    templatePrefix = "CONSULTATION";
                }

                String directorTemplateId = roleTemplateRepository
                        .findByTemplateCodeAndIsDeletedFalse(templatePrefix + "_DIRECTOR")
                        .map(rt -> rt.getRoleTemplateId()).orElse(null);
                String counselorTemplateId = roleTemplateRepository
                        .findByTemplateCodeAndIsDeletedFalse(templatePrefix + "_COUNSELOR")
                        .map(rt -> rt.getRoleTemplateId()).orElse(null);
                String clientTemplateId = roleTemplateRepository
                        .findByTemplateCodeAndIsDeletedFalse(templatePrefix + "_CLIENT")
                        .map(rt -> rt.getRoleTemplateId()).orElse(null);
                String staffTemplateId = roleTemplateRepository
                        .findByTemplateCodeAndIsDeletedFalse(templatePrefix + "_STAFF")
                        .map(rt -> rt.getRoleTemplateId()).orElse(null);

                // ACADEMY 업종의 경우 추가 템플릿 조회
                String teacherTemplateId = null;
                String parentTemplateId = null;
                if ("ACADEMY".equals(businessType)) {
                    teacherTemplateId = roleTemplateRepository
                            .findByTemplateCodeAndIsDeletedFalse("ACADEMY_TEACHER")
                            .map(rt -> rt.getRoleTemplateId()).orElse(null);
                    parentTemplateId = roleTemplateRepository
                            .findByTemplateCodeAndIsDeletedFalse("ACADEMY_PARENT")
                            .map(rt -> rt.getRoleTemplateId()).orElse(null);
                }

                log.debug(
                        "역할 템플릿 ID 조회: director={}, counselor={}, client={}, staff={}, teacher={}, parent={}",
                        directorTemplateId, counselorTemplateId, clientTemplateId, staffTemplateId,
                        teacherTemplateId, parentTemplateId);

                // INSERT 전에 역할 존재 여부를 다시 한 번 확인 (락 경합 최소화)
                // 다른 트랜잭션이 이미 역할을 생성했을 수 있음
                Integer doubleCheckCount = null;
                try {
                    doubleCheckCount = jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)",
                            Integer.class, tenantId);
                } catch (Exception e) {
                    log.warn("역할 존재 재확인 실패: tenantId={}, error={}", tenantId, e.getMessage());
                }

                if (doubleCheckCount != null && doubleCheckCount > 0) {
                    log.info("역할이 이미 존재함 (INSERT 전 재확인): tenantId={}, count={}", tenantId,
                            doubleCheckCount);
                    return true;
                }

                // 원자성 보장: 모든 역할을 하나의 배치 INSERT로 생성
                // 실패 시 전체 롤백되어 부분적으로만 생성되는 것을 방지
                // INSERT IGNORE를 사용하여 중복 삽입 시도 시 오류 대신 무시 (락 경합 최소화)
                String insertSql;
                Object[] params;

                if ("ACADEMY".equals(businessType)) {
                    // ACADEMY 업종: 원장, 교사, 학생, 학부모, 사무원
                    insertSql =
                            "INSERT IGNORE INTO tenant_roles (tenant_role_id, tenant_id, role_template_id, name, name_ko, name_en, "
                                    + "description, description_ko, description_en, "
                                    + "is_active, display_order, created_at, updated_at, "
                                    + "created_by, updated_by, is_deleted, version, lang_code) VALUES "
                                    + "(UUID(), ?, ?, '원장', '원장', 'Director', "
                                    + "'학원 원장 역할', '학원 원장 역할', 'Director role for academy', "
                                    + "TRUE, 1, NOW(), NOW(), ?, ?, FALSE, 0, 'ko'), "
                                    + "(UUID(), ?, ?, '교사', '교사', 'Teacher', "
                                    + "'교사 역할', '교사 역할', 'Teacher role', "
                                    + "TRUE, 2, NOW(), NOW(), ?, ?, FALSE, 0, 'ko'), "
                                    + "(UUID(), ?, ?, '학생', '학생', 'Student', "
                                    + "'학생 역할', '학생 역할', 'Student role', "
                                    + "TRUE, 3, NOW(), NOW(), ?, ?, FALSE, 0, 'ko'), "
                                    + "(UUID(), ?, ?, '학부모', '학부모', 'Parent', "
                                    + "'학부모 역할', '학부모 역할', 'Parent role', "
                                    + "TRUE, 4, NOW(), NOW(), ?, ?, FALSE, 0, 'ko'), "
                                    + "(UUID(), ?, ?, '사무원', '사무원', 'Staff', "
                                    + "'사무원 역할', '사무원 역할', 'Staff role', "
                                    + "TRUE, 5, NOW(), NOW(), ?, ?, FALSE, 0, 'ko')";

                    params = new Object[] {tenantId, directorTemplateId, approvedBy, approvedBy,
                            tenantId, teacherTemplateId, approvedBy, approvedBy, tenantId,
                            clientTemplateId, approvedBy, approvedBy, tenantId, parentTemplateId,
                            approvedBy, approvedBy, tenantId, staffTemplateId, approvedBy,
                            approvedBy};
                } else {
                    // CONSULTATION 또는 COUNSELING 업종: 원장, 상담사, 내담자, 사무원
                    insertSql =
                            "INSERT IGNORE INTO tenant_roles (tenant_role_id, tenant_id, role_template_id, name, name_ko, name_en, "
                                    + "description, description_ko, description_en, "
                                    + "is_active, display_order, created_at, updated_at, "
                                    + "created_by, updated_by, is_deleted, version, lang_code) VALUES "
                                    + "(UUID(), ?, ?, '원장', '원장', 'Principal', "
                                    + "'상담소 원장 역할', '상담소 원장 역할', 'Principal role for consultation center', "
                                    + "TRUE, 1, NOW(), NOW(), ?, ?, FALSE, 0, 'ko'), "
                                    + "(UUID(), ?, ?, '상담사', '상담사', 'Consultant', "
                                    + "'상담사 역할', '상담사 역할', 'Consultant role', "
                                    + "TRUE, 2, NOW(), NOW(), ?, ?, FALSE, 0, 'ko'), "
                                    + "(UUID(), ?, ?, '내담자', '내담자', 'Client', "
                                    + "'내담자 역할', '내담자 역할', 'Client role', "
                                    + "TRUE, 3, NOW(), NOW(), ?, ?, FALSE, 0, 'ko'), "
                                    + "(UUID(), ?, ?, '사무원', '사무원', 'Staff', "
                                    + "'사무원 역할', '사무원 역할', 'Staff role', "
                                    + "TRUE, 4, NOW(), NOW(), ?, ?, FALSE, 0, 'ko')";

                    params = new Object[] {tenantId, directorTemplateId, approvedBy, approvedBy,
                            tenantId, counselorTemplateId, approvedBy, approvedBy, tenantId,
                            clientTemplateId, approvedBy, approvedBy, tenantId, staffTemplateId,
                            approvedBy, approvedBy};
                }

                // 배치 INSERT 실행 (원자성 보장: 하나라도 실패하면 전체 롤백)
                int rowsAffected = jdbcTemplate.update(insertSql, params);

                // INSERT IGNORE는 중복 시 0개 행이 영향을 받을 수 있음
                // 하지만 역할이 이미 존재하는 경우도 성공으로 처리
                // INSERT 후 역할 존재 여부 확인 (다른 트랜잭션이 생성했을 수 있음)
                Integer finalCount = null;
                try {
                    finalCount = jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)",
                            Integer.class, tenantId);
                } catch (Exception e) {
                    log.warn("역할 생성 후 존재 확인 실패: tenantId={}, error={}", tenantId, e.getMessage());
                }

                if (finalCount != null && finalCount > 0) {
                    log.info("역할 생성 완료 (배치 INSERT): tenantId={}, rowsAffected={}, finalCount={}",
                            tenantId, rowsAffected, finalCount);
                    // JPA 캐시 갱신 (jdbcTemplate으로 생성한 데이터를 JPA에서 조회할 수 있도록)
                    entityManager.flush();
                    entityManager.clear();
                    return true;
                } else {
                    log.warn("역할 생성 후에도 역할이 없음: tenantId={}, rowsAffected={}, finalCount={}",
                            tenantId, rowsAffected, finalCount);
                    return false;
                }
            } catch (org.springframework.dao.CannotAcquireLockException e) {
                log.warn("역할 생성 중 락 획득 실패: tenantId={}, error={}", tenantId, e.getMessage());
                throw e; // 호출부에서 재시도 처리
            } catch (Exception e) {
                String errorMsg = e.getMessage();
                // Query execution was interrupted (MySQL 에러 코드 1317)도 재시도 가능한 오류로 처리
                if (errorMsg != null && (errorMsg.contains("Lock wait timeout")
                        || errorMsg.contains("lock timeout") || errorMsg.contains("deadlock")
                        || errorMsg.contains("Query execution was interrupted")
                        || (errorMsg.contains("1317") && errorMsg.contains("interrupted")))) {
                    log.warn("역할 생성 중 락/쿼리 중단 관련 오류 발생: tenantId={}, error={}", tenantId, errorMsg);
                    throw e; // 호출부에서 재시도 처리
                } else {
                    log.error("역할 생성 실패: tenantId={}, error={}", tenantId, errorMsg, e);
                    return false;
                }
            }
        } else {
            log.warn("지원하지 않는 업종: businessType={}", businessType);
            return false;
        }
    }

    /**
     * 처리 상태 업데이트 (Java 재시도 단계별 상태 표시용) 별도 트랜잭션으로 분리하여 메인 트랜잭션의 version 충돌 방지
     */
    private void updateProcessingStatus(java.util.UUID requestId, String step, String status,
            String message) {
        try {
            // 별도 트랜잭션에서 실행하여 메인 트랜잭션의 version 충돌 방지
            org.springframework.transaction.support.TransactionTemplate transactionTemplate =
                    new org.springframework.transaction.support.TransactionTemplate(
                            transactionManager);
            transactionTemplate.setPropagationBehavior(
                    org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            transactionTemplate.setIsolationLevel(
                    org.springframework.transaction.TransactionDefinition.ISOLATION_READ_COMMITTED);
            transactionTemplate.setTimeout(30); // 30초 타임아웃

            transactionTemplate.executeWithoutResult(transactionStatus -> {
                try {
                    // 엔티티를 다시 조회하여 최신 버전 사용
                    OnboardingRequest request =
                            onboardingRequestRepository.findById(requestId).orElse(null);
                    if (request == null) {
                        log.warn("온보딩 요청을 찾을 수 없어 상태 업데이트 실패: requestId={}", requestId);
                        return;
                    }

                    Map<String, Object> statusMap = new HashMap<>();
                    String existingJson = request.getInitializationStatusJson();
                    if (existingJson != null && !existingJson.trim().isEmpty()) {
                        try {
                            statusMap = objectMapper.readValue(existingJson,
                                    new TypeReference<Map<String, Object>>() {});
                        } catch (JsonProcessingException e) {
                            log.warn("기존 상태 JSON 파싱 실패, 새로 생성: requestId={}, error={}", requestId,
                                    e.getMessage());
                        }
                    }

                    // 단계별 상태 업데이트
                    Map<String, Object> stepStatus = new HashMap<>();
                    stepStatus.put("status", status);
                    stepStatus.put("message", message != null ? message : "");
                    stepStatus.put("updatedAt", java.time.LocalDateTime.now().toString());
                    statusMap.put(step, stepStatus);

                    // 전체 진행률 계산
                    int totalSteps = 5; // PROCEDURE_START, TENANT_CREATE, ROLE_APPLY, ADMIN_CREATE,
                                        // DASHBOARD_CREATE
                    int completedSteps = 0;
                    String[] steps = {"PROCEDURE_START", "TENANT_CREATE", "ROLE_APPLY",
                            "ADMIN_CREATE", "DASHBOARD_CREATE"};
                    for (String s : steps) {
                        if (statusMap.containsKey(s)) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> stepData = (Map<String, Object>) statusMap.get(s);
                            if (stepData != null && "SUCCESS".equals(stepData.get("status"))) {
                                completedSteps++;
                            }
                        }
                    }
                    int progress = (int) ((completedSteps / (double) totalSteps) * 100);
                    statusMap.put("progress", progress);
                    statusMap.put("lastUpdated", java.time.LocalDateTime.now().toString());

                    String statusJson = objectMapper.writeValueAsString(statusMap);
                    request.setInitializationStatusJson(statusJson);
                    onboardingRequestRepository.save(request);

                    log.debug("처리 상태 업데이트: requestId={}, step={}, status={}, progress={}%",
                            requestId, step, status, progress);
                } catch (Exception e) {
                    log.error("처리 상태 업데이트 실패: requestId={}, step={}, error={}", requestId, step,
                            e.getMessage(), e);
                    // 예외를 throw하지 않음 (상태 업데이트 실패가 전체 프로세스를 중단시키면 안 됨)
                }
            });
        } catch (Exception e) {
            log.error("처리 상태 업데이트 트랜잭션 실패: requestId={}, step={}, error={}", requestId, step,
                    e.getMessage(), e);
            // 예외를 throw하지 않음 (상태 업데이트 실패가 전체 프로세스를 중단시키면 안 됨)
        }
    }
}

