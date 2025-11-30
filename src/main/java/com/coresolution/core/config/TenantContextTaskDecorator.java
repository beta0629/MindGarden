package com.coresolution.core.config;

import com.coresolution.core.context.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.task.TaskDecorator;

/**
 * 비동기 작업 시 TenantContext를 전파하는 TaskDecorator
 * 
 * <p>문제점: ThreadLocal은 스레드별로 독립적이므로, @Async나 @Scheduled로 
 * 새로운 스레드가 생성되면 부모 스레드의 TenantContext가 전달되지 않습니다.</p>
 * 
 * <p>해결책: TaskDecorator를 사용하여 작업 실행 전에 부모 스레드의 Context를 
 * 복사하고, 작업 완료 후 정리합니다.</p>
 * 
 * <h3>사용 예시:</h3>
 * <pre>
 * {@code
 * @Async
 * public void sendNotification(Long userId) {
 *     // 이 메서드 내에서도 TenantContext.getTenantId()가 정상 동작
 *     String tenantId = TenantContextHolder.getRequiredTenantId();
 *     // ... 알림 발송 로직
 * }
 * }
 * </pre>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-30
 * @see TenantContext
 * @see AsyncConfig
 */
@Slf4j
public class TenantContextTaskDecorator implements TaskDecorator {
    
    /**
     * Runnable 작업을 TenantContext 전파 로직으로 감싸서 반환
     * 
     * @param runnable 원본 작업
     * @return TenantContext가 전파되는 작업
     */
    @Override
    public Runnable decorate(Runnable runnable) {
        // 1. 현재 스레드(부모 스레드)의 Context 값을 복사
        String tenantId = TenantContext.getTenantId();
        String branchId = TenantContext.getBranchId();
        String businessType = TenantContext.getBusinessType();
        boolean bypassFilter = TenantContext.shouldBypassTenantFilter();
        
        // 디버그 로그 (개발 환경에서만 활성화 권장)
        if (log.isDebugEnabled()) {
            log.debug("🔄 [TaskDecorator] Context 복사: tenantId={}, branchId={}, businessType={}", 
                    tenantId, branchId, businessType);
        }
        
        // 2. 새로운 Runnable을 반환 (실제 실행은 나중에 새 스레드에서)
        return () -> {
            try {
                // 3. 새 스레드에서 실행 시작 - 복사한 Context 설정
                TenantContext.setTenantId(tenantId);
                TenantContext.setBranchId(branchId);
                TenantContext.setBusinessType(businessType);
                TenantContext.setBypassTenantFilter(bypassFilter);
                
                if (log.isDebugEnabled()) {
                    log.debug("✅ [TaskDecorator] Context 설정 완료: tenantId={}, thread={}", 
                            tenantId, Thread.currentThread().getName());
                }
                
                // 4. 원본 작업 실행
                runnable.run();
                
            } catch (Exception e) {
                log.error("❌ [TaskDecorator] 비동기 작업 실행 중 오류: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
                throw e;
            } finally {
                // 5. 작업 완료 후 Context 정리 (메모리 누수 방지)
                TenantContext.clear();
                
                if (log.isDebugEnabled()) {
                    log.debug("🧹 [TaskDecorator] Context 정리 완료: thread={}", 
                            Thread.currentThread().getName());
                }
            }
        };
    }
}

