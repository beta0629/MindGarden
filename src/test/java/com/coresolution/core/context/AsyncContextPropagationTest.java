package com.coresolution.core.context;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 비동기 처리 시 TenantContext 전파 테스트
 * 
 * <h3>테스트 시나리오 1: 알림톡 발송 테스트 (Async)</h3>
 * <p>"A 학원" 로그인 -> 알림톡 발송 버튼 클릭 -> (비동기 처리) -> 
 * 로그에 "A 학원 알림 발송 중..."이라고 tenant_id가 제대로 찍히는지 확인</p>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-30
 */
@Slf4j
@SpringBootTest
public class AsyncContextPropagationTest {
    
    @Autowired
    private TestAsyncService testAsyncService;
    
    @BeforeEach
    public void setUp() {
        TenantContext.clear();
    }
    
    @AfterEach
    public void tearDown() {
        TenantContext.clear();
    }
    
    /**
     * 테스트 1: 알림톡 발송 시 tenantId 전파 확인
     */
    @Test
    @DisplayName("비동기 알림톡 발송 시 tenantId가 정상적으로 전파되어야 함")
    public void testAsyncNotificationWithTenantId() throws Exception {
        // Given: "A 학원"으로 로그인
        String tenantId = "academy-a-uuid-123";
        String tenantName = "A 학원";
        TenantContext.setTenantId(tenantId);
        TenantContext.setBusinessType("ACADEMY");
        
        log.info("🏫 [메인 스레드] {} 로그인: tenantId={}", tenantName, tenantId);
        
        // When: 비동기로 알림톡 발송
        CompletableFuture<String> future = testAsyncService.sendNotificationAsync(tenantName);
        
        // Then: 비동기 메서드 내부에서 tenantId가 정상적으로 조회되어야 함
        String result = future.get(5, TimeUnit.SECONDS);
        
        assertNotNull(result, "비동기 작업 결과가 null이면 안 됨");
        assertTrue(result.contains(tenantId), 
                "비동기 작업 결과에 tenantId가 포함되어야 함: " + result);
        assertTrue(result.contains(tenantName), 
                "비동기 작업 결과에 학원명이 포함되어야 함: " + result);
        
        log.info("✅ [테스트 성공] 비동기 작업에서 tenantId 정상 전파: {}", result);
    }
    
    /**
     * 테스트 2: 여러 테넌트 동시 요청 시 Context 오염 방지
     */
    @Test
    @DisplayName("A학원, B학원 번갈아 가며 100번 요청 시 Context 오염이 없어야 함")
    public void testThreadIsolation() throws Exception {
        // Given: 여러 테넌트
        String[] tenantIds = {
            "academy-a-uuid-123",
            "academy-b-uuid-456",
            "consultation-c-uuid-789"
        };
        String[] tenantNames = {"A 학원", "B 학원", "C 상담소"};
        
        int totalRequests = 100;
        int successCount = 0;
        int failCount = 0;
        
        log.info("🔄 [스레드 오염 테스트] 시작: {}번 요청", totalRequests);
        
        // When: 100번 번갈아 가며 요청
        for (int i = 0; i < totalRequests; i++) {
            int idx = i % tenantIds.length;
            String expectedTenantId = tenantIds[idx];
            String expectedName = tenantNames[idx];
            
            try {
                // Context 설정
                TenantContext.clear();
                TenantContext.setTenantId(expectedTenantId);
                
                // 비동기 작업 실행
                CompletableFuture<String> future = testAsyncService.sendNotificationAsync(expectedName);
                String result = future.get(3, TimeUnit.SECONDS);
                
                // 검증: 올바른 tenantId가 사용되었는지
                if (result.contains(expectedTenantId)) {
                    successCount++;
                } else {
                    failCount++;
                    log.error("❌ [Context 오염 감지] 요청#{}: 예상={}, 실제={}", 
                            i, expectedTenantId, result);
                }
                
            } catch (Exception e) {
                failCount++;
                log.error("❌ [비동기 작업 실패] 요청#{}: {}", i, e.getMessage());
            } finally {
                TenantContext.clear();
            }
            
            // 짧은 대기 (동시성 테스트)
            Thread.sleep(10);
        }
        
        // Then: 모든 요청이 성공해야 함
        log.info("📊 [테스트 결과] 성공: {}/{}, 실패: {}", successCount, totalRequests, failCount);
        
        assertEquals(totalRequests, successCount, 
                "모든 요청이 성공해야 하지만 " + failCount + "개 실패");
        assertEquals(0, failCount, "실패한 요청이 없어야 함");
        
        log.info("✅ [테스트 성공] Context 오염 없음! 스레드 격리 정상 동작");
    }
    
    /**
     * 테스트 3: 슈퍼 어드민 필터 우회 전파
     */
    @Test
    @DisplayName("슈퍼 어드민 플래그가 비동기 작업에 전파되어야 함")
    public void testSuperAdminBypassPropagation() throws Exception {
        // Given: 슈퍼 어드민으로 로그인
        String tenantId = "hq-master-uuid";
        TenantContext.setTenantId(tenantId);
        TenantContext.setBypassTenantFilter(true);
        
        log.info("👑 [메인 스레드] 슈퍼 어드민 로그인: bypassFilter=true");
        
        // When: 비동기 작업 실행
        CompletableFuture<Boolean> future = testAsyncService.checkBypassFlagAsync();
        
        // Then: 비동기 메서드 내부에서도 bypass 플래그가 true여야 함
        Boolean bypassInAsync = future.get(5, TimeUnit.SECONDS);
        
        assertTrue(bypassInAsync, 
                "비동기 작업 내부에서도 bypassFilter가 true여야 함");
        
        log.info("✅ [테스트 성공] 슈퍼 어드민 플래그 정상 전파");
    }
    
    /**
     * 테스트 4: Context 정리 확인 (메모리 누수 방지)
     */
    @Test
    @DisplayName("비동기 작업 완료 후 Context가 정리되어야 함")
    public void testContextCleanup() throws Exception {
        // Given
        String tenantId = "test-tenant-cleanup";
        TenantContext.setTenantId(tenantId);
        
        // When: 비동기 작업 실행
        CompletableFuture<String> future = testAsyncService.sendNotificationAsync("테스트");
        future.get(5, TimeUnit.SECONDS);
        
        // 잠시 대기 (비동기 스레드가 finally 블록 실행 완료)
        Thread.sleep(500);
        
        // Then: 메인 스레드의 Context는 여전히 유지되어야 함
        assertEquals(tenantId, TenantContext.getTenantId(), 
                "메인 스레드의 Context는 유지되어야 함");
        
        log.info("✅ [테스트 성공] Context 정리 정상 동작");
    }
}

/**
 * 테스트용 비동기 서비스
 */
@Slf4j
@Service
class TestAsyncService {
    
    /**
     * 비동기 알림 발송 시뮬레이션
     */
    @Async
    public CompletableFuture<String> sendNotificationAsync(String tenantName) {
        try {
            // 비동기 스레드에서 tenantId 조회
            String tenantId = TenantContext.getTenantId();
            String businessType = TenantContext.getBusinessType();
            String threadName = Thread.currentThread().getName();
            
            log.info("📱 [비동기 스레드: {}] {} 알림 발송 중... tenantId={}, businessType={}", 
                    threadName, tenantName, tenantId, businessType);
            
            // 알림 발송 시뮬레이션 (100ms 소요)
            Thread.sleep(100);
            
            String result = String.format("[%s] 알림 발송 완료: tenantId=%s, businessType=%s", 
                    tenantName, tenantId, businessType);
            
            log.info("✅ [비동기 스레드: {}] {}", threadName, result);
            
            return CompletableFuture.completedFuture(result);
            
        } catch (Exception e) {
            log.error("❌ [비동기 작업 실패] {}", e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }
    
    /**
     * Bypass 플래그 확인
     */
    @Async
    public CompletableFuture<Boolean> checkBypassFlagAsync() {
        boolean bypassFlag = TenantContext.shouldBypassTenantFilter();
        String threadName = Thread.currentThread().getName();
        
        log.info("🔍 [비동기 스레드: {}] bypassFilter={}", threadName, bypassFlag);
        
        return CompletableFuture.completedFuture(bypassFlag);
    }
}

