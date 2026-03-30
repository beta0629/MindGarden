package com.coresolution.core.service;

import java.util.Map;

/**
 * 온보딩 에러 핸들링 및 자동 재시도 서비스
 * 온보딩 프로세스 중 발생하는 에러를 자동으로 처리하고 재시도
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
public interface OnboardingErrorHandlingService {
    
    /**
     * 온보딩 프로세스 실행 (에러 핸들링 및 자동 재시도 포함)
     * @param process 실행할 프로세스
     * @param maxRetries 최대 재시도 횟수
     * @param retryDelay 재시도 지연 시간 (밀리초)
     * @return 실행 결과
     */
    ExecutionResult executeWithRetry(OnboardingProcess process, int maxRetries, long retryDelay);
    
    /**
     * 온보딩 프로세스 실행 (기본 재시도 설정)
     * @param process 실행할 프로세스
     * @return 실행 결과
     */
    default ExecutionResult executeWithRetry(OnboardingProcess process) {
        return executeWithRetry(process, 3, 1000); // 기본: 3회 재시도, 1초 지연
    }
    
    /**
     * 온보딩 프로세스 인터페이스
     */
    @FunctionalInterface
    interface OnboardingProcess {
        /**
         * 프로세스 실행
         * @return 성공 여부
         * @throws Exception 실행 중 발생한 예외
         */
        boolean execute() throws Exception;
    }
    
    /**
     * 실행 결과
     */
    class ExecutionResult {
        private final boolean success;
        private final int attemptCount;
        private final Exception lastException;
        private final String errorMessage;
        private final Map<String, Object> metadata;
        
        public ExecutionResult(boolean success, int attemptCount, Exception lastException, 
                              String errorMessage, Map<String, Object> metadata) {
            this.success = success;
            this.attemptCount = attemptCount;
            this.lastException = lastException;
            this.errorMessage = errorMessage;
            this.metadata = metadata != null ? metadata : java.util.Collections.emptyMap();
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public int getAttemptCount() {
            return attemptCount;
        }
        
        public Exception getLastException() {
            return lastException;
        }
        
        public String getErrorMessage() {
            return errorMessage;
        }
        
        public Map<String, Object> getMetadata() {
            return metadata;
        }
        
        public static ExecutionResult success(int attemptCount) {
            return new ExecutionResult(true, attemptCount, null, null, null);
        }
        
        public static ExecutionResult failure(int attemptCount, Exception exception, String errorMessage) {
            return new ExecutionResult(false, attemptCount, exception, errorMessage, null);
        }
    }
}

