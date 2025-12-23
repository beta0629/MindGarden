package com.coresolution.core.service.impl;

import com.coresolution.core.service.OnboardingErrorHandlingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 온보딩 에러 핸들링 및 자동 재시도 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Slf4j
@Service
public class OnboardingErrorHandlingServiceImpl implements OnboardingErrorHandlingService {
    
    @Override
    public ExecutionResult executeWithRetry(OnboardingProcess process, int maxRetries, long retryDelay) {
        int attemptCount = 0;
        Exception lastException = null;
        Map<String, Object> metadata = new HashMap<>();
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            attemptCount = attempt;
            
            try {
                log.debug("온보딩 프로세스 실행 시도: attempt={}/{}", attempt, maxRetries);
                
                boolean success = process.execute();
                
                if (success) {
                    log.info("온보딩 프로세스 실행 성공: attempt={}/{}", attempt, maxRetries);
                    metadata.put("finalAttempt", attempt);
                    return ExecutionResult.success(attempt);
                } else {
                    log.warn("온보딩 프로세스 실행 실패 (false 반환): attempt={}/{}", attempt, maxRetries);
                    lastException = new RuntimeException("프로세스가 false를 반환했습니다.");
                }
                
            } catch (Exception e) {
                lastException = e;
                boolean isRetryable = isRetryableError(e);
                
                log.warn("온보딩 프로세스 실행 중 예외 발생: attempt={}/{}, error={}, retryable={}", 
                    attempt, maxRetries, e.getMessage(), isRetryable);
                
                // 재시도 가능한 에러인지 확인
                if (!isRetryable) {
                    if (attempt < maxRetries) {
                        log.error("재시도 불가능한 에러로 인해 재시도 중단: error={}, attempt={}/{}", 
                                e.getMessage(), attempt, maxRetries);
                        break;
                    } else {
                        log.error("재시도 불가능한 에러 (최대 재시도 횟수 도달): error={}", e.getMessage());
                    }
                } else {
                    log.info("재시도 가능한 에러 감지 - 재시도 진행: error={}, attempt={}/{}", 
                            e.getMessage(), attempt, maxRetries);
                }
            }
            
            // 마지막 시도가 아니면 재시도 전 대기
            if (attempt < maxRetries) {
                try {
                    log.debug("재시도 전 대기: delay={}ms", retryDelay);
                    TimeUnit.MILLISECONDS.sleep(retryDelay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    log.error("재시도 대기 중 인터럽트 발생");
                    break;
                }
            }
        }
        
        // 모든 재시도 실패
        String errorMessage = String.format(
            "온보딩 프로세스 실행 실패: 총 %d회 시도 후 실패. 마지막 에러: %s",
            attemptCount, lastException != null ? lastException.getMessage() : "알 수 없는 오류"
        );
        
        log.error(errorMessage, lastException);
        metadata.put("finalAttempt", attemptCount);
        metadata.put("maxRetries", maxRetries);
        
        return ExecutionResult.failure(attemptCount, lastException, errorMessage);
    }
    
    /**
     * 재시도 가능한 에러인지 확인 (예외 체인 포함)
     * @param e 예외
     * @return 재시도 가능 여부
     */
    private boolean isRetryableError(Exception e) {
        // 예외 체인을 따라가면서 확인
        Throwable current = e;
        int depth = 0;
        while (current != null && depth < 10) { // 최대 10단계까지 체인 확인
            depth++;
            
            // PessimisticLockingFailureException (락 타임아웃) - 재시도 가능
            if (current instanceof org.springframework.dao.PessimisticLockingFailureException) {
                log.debug("락 타임아웃 감지 (예외 체인 depth={}) - 재시도 가능: {}", depth, current.getMessage());
                return true;
            }
            
            // Hibernate 락 예외
            if (current instanceof org.hibernate.PessimisticLockException) {
                log.debug("Hibernate 락 예외 감지 (예외 체인 depth={}) - 재시도 가능: {}", depth, current.getMessage());
                return true;
            }
            
            // MySQL 락 타임아웃 예외
            if (current instanceof com.mysql.cj.jdbc.exceptions.MySQLTransactionRollbackException) {
                String msg = current.getMessage();
                if (msg != null && (msg.contains("Lock wait timeout") || msg.contains("lock timeout"))) {
                    log.debug("MySQL 락 타임아웃 감지 (예외 체인 depth={}) - 재시도 가능: {}", depth, msg);
                    return true;
                }
            }
            
            // SQLException 체크
            if (current instanceof java.sql.SQLException) {
                java.sql.SQLException sqlEx = (java.sql.SQLException) current;
                String sqlState = sqlEx.getSQLState();
                
                // Deadlock
                if ("40001".equals(sqlState) || "40P01".equals(sqlState)) {
                    log.debug("Deadlock 감지 (예외 체인 depth={}) - 재시도 가능", depth);
                    return true;
                }
                // Lock wait timeout (MySQL 에러 코드 1205)
                if ("HY000".equals(sqlState) && sqlEx.getErrorCode() == 1205) {
                    log.debug("Lock wait timeout 감지 (예외 체인 depth={}, errorCode={}) - 재시도 가능", 
                            depth, sqlEx.getErrorCode());
                    return true;
                }
            }
            
            // 락 관련 예외 체크 (메시지 기반) - 모든 예외 레벨에서 확인
            String errorMessage = current.getMessage();
            if (errorMessage != null) {
                String lowerMessage = errorMessage.toLowerCase();
                if (lowerMessage.contains("lock wait timeout") || 
                    lowerMessage.contains("lock wait timeout exceeded") ||
                    lowerMessage.contains("lock timeout") ||
                    lowerMessage.contains("deadlock") ||
                    lowerMessage.contains("try restarting transaction")) {
                    log.debug("락 관련 오류 감지 (예외 체인 depth={}) - 재시도 가능: {}", depth, errorMessage);
                    return true;
                }
            }
            
            // IllegalStateException 중 일부는 재시도 가능 (예: RoleTemplate이 아직 생성되지 않음)
            if (current instanceof IllegalStateException) {
                String message = current.getMessage();
                if (message != null && (message.contains("아직 생성되지 않음") || 
                                        message.contains("not found") ||
                                        message.contains("존재하지 않음"))) {
                    return true;
                }
            }
            
            // 다음 예외 체인으로 이동
            current = current.getCause();
        }
        
        // 기본적으로는 재시도 불가능 (데이터 검증 오류 등)
        return false;
    }
}

