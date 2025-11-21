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
            Long requestId,
            String tenantId,
            String tenantName,
            String businessType,
            String approvedBy,
            String decisionNote) {
        
        log.info("온보딩 승인 프로세스 시작: requestId={}, tenantId={}, tenantName={}", 
                requestId, tenantId, tenantName);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement cs = connection.prepareCall(
                 "{CALL ProcessOnboardingApproval(?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            cs.setLong(1, requestId);
            cs.setString(2, tenantId);
            cs.setString(3, tenantName);
            cs.setString(4, businessType);
            cs.setString(5, approvedBy);
            cs.setString(6, decisionNote);
            
            // OUT 파라미터 등록
            cs.registerOutParameter(7, Types.BOOLEAN);  // p_success
            cs.registerOutParameter(8, Types.VARCHAR); // p_message
            
            // 프로시저 실행
            boolean hasResult = cs.execute();
            log.debug("프로시저 실행 완료: hasResult={}", hasResult);
            
            // 결과 추출
            Boolean success = cs.getBoolean(7);
            String message = cs.getString(8);
            
            log.debug("프로시저 결과: success={}, message={}", success, message);
            
            // NULL 체크 및 기본값 설정
            if (success == null) {
                log.warn("프로시저 success 값이 NULL입니다. 기본값 FALSE로 설정합니다.");
                success = false;
            }
            if (message == null || message.trim().isEmpty()) {
                log.warn("프로시저 message 값이 NULL이거나 비어있습니다. 기본 메시지로 설정합니다.");
                message = "프로시저 실행 중 오류가 발생했습니다. (상세 오류 정보 없음)";
                // 프로시저 내부 오류 가능성 확인을 위해 SQL 경고 확인
                try {
                    java.sql.SQLWarning warning = cs.getWarnings();
                    if (warning != null) {
                        log.warn("프로시저 실행 경고: {}", warning.getMessage());
                        message += " [경고: " + warning.getMessage() + "]";
                    }
                } catch (SQLException e) {
                    log.debug("경고 확인 중 오류 (무시): {}", e.getMessage());
                }
            }
            
            result.put("success", success);
            result.put("message", message);
            
            if (success) {
                log.info("온보딩 승인 프로세스 완료: {}", message);
            } else {
                log.error("온보딩 승인 프로세스 실패: {}", message);
            }
            
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
}

