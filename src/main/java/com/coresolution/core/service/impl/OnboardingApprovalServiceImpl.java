package com.coresolution.core.service.impl;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.core.service.OnboardingApprovalService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
@Transactional
@RequiredArgsConstructor
public class OnboardingApprovalServiceImpl implements OnboardingApprovalService {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Map<String, Object> processOnboardingApproval(java.util.UUID requestId, String tenantId,
            String tenantName, String businessType, String approvedBy, String decisionNote,
            String contactEmail, String adminPasswordHash, String subdomain) {

        log.info(
                "온보딩 승인 프로세스 시작: requestId={}, tenantId={}, tenantName={}, contactEmail={}, subdomain={}",
                requestId, tenantId, tenantName, contactEmail, subdomain);

        Map<String, Object> result = new HashMap<>();

        javax.sql.DataSource dataSource = jdbcTemplate.getDataSource();
        if (dataSource == null) {
            log.error("❌ DataSource가 null입니다. JDBC Template 설정을 확인하세요.");
            result.put("success", false);
            result.put("message", "데이터베이스 연결 설정 오류: DataSource가 null입니다.");
            return result;
        }

        try (Connection connection = dataSource.getConnection()) {

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

                long startTime = System.currentTimeMillis();
                boolean hasResult = cs.execute();
                long duration = System.currentTimeMillis() - startTime;

                log.info("프로시저 실행 완료: hasResult={}, duration={}ms", hasResult, duration);

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
                    try {
                        tenantCreated = ensureTenantExists(tenantId, tenantName, businessType,
                                subdomain, approvedBy);
                        if (tenantCreated) {
                            fallbackMessage.append("테넌트=OK, ");
                        } else {
                            fallbackMessage.append("테넌트=실패, ");
                        }
                    } catch (Exception e) {
                        log.error("테넌트 생성/활성화 실패: tenantId={}, error={}", tenantId, e.getMessage());
                        fallbackMessage.append("테넌트=오류, ");
                    }

                    // 2. 역할 템플릿 적용 확인 (테넌트가 존재하는 경우에만)
                    if (tenantCreated) {
                        try {
                            rolesApplied = ensureRolesApplied(tenantId, businessType, approvedBy);
                            if (rolesApplied) {
                                fallbackMessage.append("역할=OK, ");
                            } else {
                                fallbackMessage.append("역할=실패, ");
                            }
                        } catch (Exception e) {
                            log.error("역할 템플릿 적용 실패: tenantId={}, error={}", tenantId,
                                    e.getMessage());
                            fallbackMessage.append("역할=오류, ");
                        }
                    }

                    // 3. 관리자 계정 생성 (테넌트가 존재하는 경우에만)
                    if (tenantCreated && contactEmail != null && !contactEmail.trim().isEmpty()
                            && adminPasswordHash != null && !adminPasswordHash.trim().isEmpty()) {
                        try {
                            createAdminAccountDirectly(tenantId, contactEmail, tenantName,
                                    adminPasswordHash, approvedBy);
                            fallbackMessage.append("관리자=OK");
                        } catch (Exception e) {
                            log.warn("관리자 계정 직접 생성 실패: tenantId={}, error={}", tenantId,
                                    e.getMessage());
                            fallbackMessage.append("관리자=실패");
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
     * 역할 템플릿이 적용되었는지 확인하고, 없으면 기본 역할 생성
     */
    private boolean ensureRolesApplied(String tenantId, String businessType, String approvedBy) {
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

        // 기본 역할 생성 (CONSULTATION 또는 COUNSELING 업종 기준 - 둘 다 상담소이므로 동일한 역할 사용)
        if ("CONSULTATION".equals(businessType) || "COUNSELING".equals(businessType)) {
            try {
                // 원장 (ADMIN)
                jdbcTemplate.update(
                        "INSERT INTO tenant_roles (tenant_id, name_ko, name_en, role_type, display_order, "
                                + "created_at, updated_at, created_by, updated_by, is_deleted, version) "
                                + "VALUES (?, '원장', 'Principal', 'ADMIN', 1, NOW(), NOW(), ?, ?, FALSE, 0)",
                        tenantId, approvedBy, approvedBy);

                // 상담사
                jdbcTemplate.update(
                        "INSERT INTO tenant_roles (tenant_id, name_ko, name_en, role_type, display_order, "
                                + "created_at, updated_at, created_by, updated_by, is_deleted, version) "
                                + "VALUES (?, '상담사', 'Consultant', 'STAFF', 2, NOW(), NOW(), ?, ?, FALSE, 0)",
                        tenantId, approvedBy, approvedBy);

                // 내담자
                jdbcTemplate.update(
                        "INSERT INTO tenant_roles (tenant_id, name_ko, name_en, role_type, display_order, "
                                + "created_at, updated_at, created_by, updated_by, is_deleted, version) "
                                + "VALUES (?, '내담자', 'Client', 'CLIENT', 3, NOW(), NOW(), ?, ?, FALSE, 0)",
                        tenantId, approvedBy, approvedBy);

                // 사무원
                jdbcTemplate.update(
                        "INSERT INTO tenant_roles (tenant_id, name_ko, name_en, role_type, display_order, "
                                + "created_at, updated_at, created_by, updated_by, is_deleted, version) "
                                + "VALUES (?, '사무원', 'Staff', 'STAFF', 4, NOW(), NOW(), ?, ?, FALSE, 0)",
                        tenantId, approvedBy, approvedBy);

                log.info("기본 역할 생성 완료: tenantId={}", tenantId);
                return true;
            } catch (Exception e) {
                log.error("역할 생성 실패: tenantId={}, error={}", tenantId, e.getMessage());
                return false;
            }
        } else {
            log.warn("지원하지 않는 업종: businessType={}", businessType);
            return false;
        }
    }
}

