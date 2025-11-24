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
                log.warn("온보딩 프로세스 실행 중 예외 발생: attempt={}/{}, error={}", 
                    attempt, maxRetries, e.getMessage());
                
                // 재시도 가능한 에러인지 확인
                if (!isRetryableError(e) && attempt < maxRetries) {
                    log.error("재시도 불가능한 에러로 인해 재시도 중단: error={}", e.getMessage());
                    break;
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
     * 재시도 가능한 에러인지 확인
     * @param e 예외
     * @return 재시도 가능 여부
     */
    private boolean isRetryableError(Exception e) {
        // 트랜잭션 타이밍 문제, 일시적인 DB 연결 문제 등은 재시도 가능
        if (e instanceof java.sql.SQLException) {
            java.sql.SQLException sqlEx = (java.sql.SQLException) e;
            String sqlState = sqlEx.getSQLState();
            
            // Deadlock, Lock wait timeout 등은 재시도 가능
            if ("40001".equals(sqlState) || "40P01".equals(sqlState)) { // Deadlock
                return true;
            }
            if ("HY000".equals(sqlState) && sqlEx.getErrorCode() == 1205) { // Lock wait timeout
                return true;
            }
        }
        
        // IllegalStateException 중 일부는 재시도 가능 (예: RoleTemplate이 아직 생성되지 않음)
        if (e instanceof IllegalStateException) {
            String message = e.getMessage();
            if (message != null && message.contains("아직 생성되지 않음")) {
                return true;
            }
        }
        
        // 기본적으로는 재시도 불가능 (데이터 검증 오류 등)
        return false;
    }
}

