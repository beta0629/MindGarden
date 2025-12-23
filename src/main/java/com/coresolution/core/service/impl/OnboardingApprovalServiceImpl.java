package com.coresolution.core.service.impl;

import com.coresolution.core.service.OnboardingApprovalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;
import java.util.HashMap;
import java.util.Map;

/**
 * 온보딩 승인 서비스 구현체
 * PL/SQL 프로시저를 호출하여 온보딩 승인 프로세스 처리
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
    public Map<String, Object> processOnboardingApproval(
            java.util.UUID requestId,
            String tenantId,
            String tenantName,
            String businessType,
            String approvedBy,
            String decisionNote,
            String contactEmail,
            String adminPasswordHash,
            String subdomain) {
        
        log.info("온보딩 승인 프로세스 시작: requestId={}, tenantId={}, tenantName={}, contactEmail={}, subdomain={}", 
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
            cs.setBytes(1, uuidBytes);
            cs.setString(2, tenantId);
            cs.setString(3, tenantName);
            cs.setString(4, businessType);
            cs.setString(5, approvedBy);
            cs.setString(6, decisionNote);
            cs.setString(7, contactEmail);  // 추가: 연락 이메일
            cs.setString(8, adminPasswordHash);  // 추가: BCrypt 해시된 비밀번호
            cs.setString(9, subdomain);  // 추가: 서브도메인
            
            // OUT 파라미터 등록
            cs.registerOutParameter(10, Types.BOOLEAN);  // p_success
            cs.registerOutParameter(11, Types.VARCHAR); // p_message
            
            // 프로시저 실행
            log.info("프로시저 실행 시작: requestId={}, tenantId={}, tenantName={}, businessType={}, contactEmail={}, subdomain={}", 
                requestId, tenantId, tenantName, businessType, contactEmail, subdomain);
            boolean hasResult = cs.execute();
            log.info("프로시저 실행 완료: hasResult={}", hasResult);
            
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
                    log.info("프로시저 OUT 파라미터 [10] (success) 원본 값: {}, 타입: {}", successObj, successObj != null ? successObj.getClass().getName() : "null");
                    if (successObj instanceof Boolean) {
                        success = (Boolean) successObj;
                    } else if (successObj instanceof Number) {
                        success = ((Number) successObj).intValue() != 0;
                    } else if (successObj instanceof String) {
                        success = Boolean.parseBoolean((String) successObj) || "1".equals(successObj) || "true".equalsIgnoreCase((String) successObj);
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
            
            log.info("프로시저 결과 (최종): success={}, message={}", success, message);
            
            // NULL 체크 및 기본값 설정
            if (success == null) {
                log.error("❌ 프로시저 success 값이 NULL입니다. 기본값 FALSE로 설정합니다. requestId={}, tenantId={}", requestId, tenantId);
                success = false;
            }
            if (message == null || message.trim().isEmpty()) {
                log.error("❌ 프로시저 message 값이 NULL이거나 비어있습니다. 기본 메시지로 설정합니다. requestId={}, tenantId={}", requestId, tenantId);
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
                log.error("❌ 프로시저 실행 실패 상세 정보:");
                log.error("  - requestId: {}", requestId);
                log.error("  - tenantId: {}", tenantId);
                log.error("  - tenantName: {}", tenantName);
                log.error("  - businessType: {}", businessType);
                log.error("  - contactEmail: {}", contactEmail);
                log.error("  - subdomain: {}", subdomain);
                log.error("  - success: {}", success);
                log.error("  - message: {}", message);
            }
            
            result.put("success", success);
            result.put("message", message);
            
            // 프로시저 성공 여부와 관계없이 관리자 계정 생성 시도 (프로시저 문제 대응)
            if (contactEmail != null && !contactEmail.trim().isEmpty() 
                && adminPasswordHash != null && !adminPasswordHash.trim().isEmpty()) {
                try {
                    createAdminAccountDirectly(tenantId, contactEmail, tenantName, adminPasswordHash, approvedBy);
                    log.info("관리자 계정 생성 완료 (Java 직접 생성)");
                } catch (Exception e) {
                    log.warn("관리자 계정 직접 생성 실패 (프로시저에서 이미 생성되었을 수 있음): {}", e.getMessage());
                }
            }
            
            if (success) {
                log.info("온보딩 승인 프로세스 완료: {}", message);
            } else {
                log.error("온보딩 승인 프로세스 실패: {}", message);
            }
            
            } // CallableStatement 닫기
            
        } catch (SQLException e) {
            log.error("온보딩 승인 프로세스 중 SQL 오류 발생: {}", e.getMessage(), e);
            log.error("SQL 상태 코드: {}, 오류 코드: {}", e.getSQLState(), e.getErrorCode());
            if (e.getNextException() != null) {
                log.error("연결된 예외: {}", e.getNextException().getMessage());
            }
            result.put("success", false);
            result.put("message", "온보딩 승인 프로세스 중 오류 발생: " + e.getMessage() + 
                (e.getSQLState() != null ? " [SQL State: " + e.getSQLState() + "]" : "") +
                (e.getErrorCode() != 0 ? " [Error Code: " + e.getErrorCode() + "]" : ""));
        } catch (Exception e) {
            log.error("온보딩 승인 프로세스 중 예외 발생: {}", e.getMessage(), e);
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
    private void createAdminAccountDirectly(String tenantId, String contactEmail, 
                                            String tenantName, String adminPasswordHash, String approvedBy) {
        log.info("관리자 계정 직접 생성 시작: tenantId={}, email={}", tenantId, contactEmail);
        
        // 이미 존재하는지 확인
        Integer existingCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE tenant_id = ? AND email = ? AND role = 'ADMIN' AND (is_deleted IS NULL OR is_deleted = FALSE)",
            Integer.class,
            tenantId, contactEmail.toLowerCase().trim()
        );
        
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
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE user_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)",
                Integer.class,
                userId
            );
            if (count == null || count == 0) {
                break; // 사용 가능한 user_id
            }
            userId = base + suffix;
            suffix++;
        }
        
        String email = contactEmail.toLowerCase().trim();
        
        // 관리자 계정 생성
        try {
            jdbcTemplate.update(
                "INSERT INTO users (" +
                "    tenant_id, user_id, email, password, name, role, " +
                "    phone, is_active, is_email_verified, is_social_account, " +
                "    created_at, updated_at, created_by, updated_by, is_deleted, version" +
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, FALSE, 0)",
                tenantId,
                userId,
                email,
                adminPasswordHash,
                tenantName + " 관리자",
                "ADMIN",
                null, // phone
                true, // is_active
                true, // is_email_verified
                false, // is_social_account
                approvedBy,
                approvedBy
            );
        } catch (org.springframework.dao.DuplicateKeyException e) {
            // 중복 키 오류 발생 시 (다른 프로세스에서 동시에 생성한 경우)
            log.warn("관리자 계정 생성 중 중복 키 오류 (다른 프로세스에서 이미 생성되었을 수 있음): userId={}, email={}", userId, email);
            // 이미 존재하는지 다시 확인
            Integer finalCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE tenant_id = ? AND email = ? AND role = 'ADMIN' AND (is_deleted IS NULL OR is_deleted = FALSE)",
                Integer.class,
                tenantId, email
            );
            if (finalCount != null && finalCount > 0) {
                log.info("관리자 계정이 이미 존재합니다 (중복 키 오류 후 확인): {}", email);
                return;
            }
            throw e; // 다른 오류면 재발생
        }
        
        log.info("관리자 계정 생성 완료: email={}, tenantId={}", email, tenantId);
    }
}

