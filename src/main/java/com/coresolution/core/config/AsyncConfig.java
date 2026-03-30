package com.coresolution.core.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 비동기 처리 설정
 * 
 * <p>주요 기능:</p>
 * <ul>
 *   <li>@Async 메서드 실행을 위한 ThreadPool 설정</li>
 *   <li>TenantContext를 비동기 스레드로 전파 (TaskDecorator)</li>
 *   <li>비동기 작업 예외 처리</li>
 * </ul>
 * 
 * <h3>ThreadPool 설정:</h3>
 * <ul>
 *   <li>Core Pool Size: 10 (기본 스레드 수)</li>
 *   <li>Max Pool Size: 20 (최대 스레드 수)</li>
 *   <li>Queue Capacity: 500 (대기 큐 크기)</li>
 * </ul>
 * 
 * <h3>주의사항:</h3>
 * <p>이 설정이 없으면 @Async 메서드에서 TenantContext.getTenantId()가 null을 반환합니다!</p>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-30
 * @see TenantContextTaskDecorator
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    
    /**
     * 비동기 작업용 Executor 설정
     * 
     * <p>TenantContextTaskDecorator를 적용하여 모든 비동기 작업에서 
     * TenantContext가 정상적으로 동작하도록 보장합니다.</p>
     * 
     * @return 설정된 ThreadPoolTaskExecutor
     */
    @Override
    public Executor getAsyncExecutor() {
        log.info("🔧 비동기 Executor 초기화 시작 (TenantContext 전파 활성화)");
        
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // 1. ThreadPool 크기 설정
        executor.setCorePoolSize(10);           // 기본 스레드 수
        executor.setMaxPoolSize(20);            // 최대 스레드 수
        executor.setQueueCapacity(500);         // 대기 큐 크기
        executor.setThreadNamePrefix("async-"); // 스레드 이름 접두사
        
        // 2. 스레드 풀 정책 설정
        executor.setWaitForTasksToCompleteOnShutdown(true); // 종료 시 작업 완료 대기
        executor.setAwaitTerminationSeconds(60);            // 최대 60초 대기
        
        // 3. ⭐ TenantContext 전파 설정 (핵심!)
        executor.setTaskDecorator(new TenantContextTaskDecorator());
        
        // 4. 초기화
        executor.initialize();
        
        log.info("✅ 비동기 Executor 초기화 완료: corePoolSize={}, maxPoolSize={}, queueCapacity={}", 
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());
        
        return executor;
    }
    
    /**
     * 비동기 작업 예외 처리
     * 
     * <p>@Async 메서드에서 발생한 예외를 로깅합니다.</p>
     * 
     * @return 예외 핸들러
     */
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            log.error("❌ [비동기 작업 예외] 메서드: {}, 파라미터: {}, 오류: {}", 
                    method.getName(), params, ex.getMessage(), ex);
            
            // 필요시 알림 발송, 모니터링 시스템 연동 등 추가 가능
        };
    }
}

