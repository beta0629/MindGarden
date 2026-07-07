package com.coresolution.consultation.test.isolation;

import com.coresolution.core.context.TenantContext;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * 표준화 v2 Phase 1 / Slot ⑤ / A2 — failsafe {@code reuseForks=true} ThreadLocal leak 회귀 차단 테스트.
 *
 * <p><b>시나리오 배경 (PR #226 hotfix-4 §B)</b>
 * <ul>
 *   <li>운영 thread-pool 재사용 시 첫 번째 요청이 {@link TenantContextHolder#setTenantId(String)}
 *       호출 후 {@code finally} 가드 누락으로 {@link TenantContextHolder#clear()} 를 실행하지 못함</li>
 *   <li>두 번째 요청이 동일 worker thread 에 할당될 때 이전 {@code tenant_id} 를 leak 받음</li>
 *   <li>동일 시나리오를 surefire/failsafe fork 재사용 환경
 *       (현재 {@code pom.xml} surefire {@code reuseForks=true}; 과거 failsafe 도 동일)
 *       에서 단위 테스트로 재현·검출</li>
 * </ul>
 *
 * <p><b>fork 재사용 환경 (현행 {@code pom.xml})</b>
 * <ul>
 *   <li>surefire: {@code forkCount=1, reuseForks=true} → 본 클래스의 두 메서드는 동일 JVM·동일 thread 에서 실행</li>
 *   <li>failsafe: {@code forkCount=2, reuseForks=false} (2026-06-12 OOM 회귀 차단; PR #232 이전엔 reuseForks=true 였음)</li>
 * </ul>
 * surefire 가 {@code reuseForks=true} 인 한 본 테스트는 같은 JVM·thread 에 두 ordered 메서드를 실행함으로써
 * production thread-pool 재사용 leak 을 정확히 모사한다. failsafe 가 다시 {@code reuseForks=true} 로 회귀하더라도
 * 동일 메커니즘으로 leak 이 발생함을 명시적으로 검증한다.
 *
 * <p><b>이 테스트가 PASS 하는 조건 (현 시점)</b>
 * <ul>
 *   <li>{@code @AfterEach} 가드 ({@link #tearDownTenantContext()}) 가 매 메서드 종료 후
 *       {@link TenantContextHolder#clear()} 를 호출</li>
 *   <li>혹은 향후 도입될 {@code AbstractTenantIsolatedTest} (A1) / SessionBasedAuthenticationFilter
 *       {@code finally} 가드 (B1) 가 leak 을 정리</li>
 * </ul>
 *
 * <p><b>이 테스트가 FAIL 하는 조건 (회귀)</b>
 * <ul>
 *   <li>{@code @AfterEach} 가드 또는 A1/B1 표준이 제거·우회됨</li>
 *   <li>{@link TenantContextHolder#clear()} 가 일부 키 ({@code tenantId} /{@code businessType} /
 *       {@code bypassTenantFilter}) 정리에 실패</li>
 * </ul>
 *
 * <p><b>참조</b>
 * <ul>
 *   <li>표준화 로드맵: {@code docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md} §A2</li>
 *   <li>발견 소스: PR #226 hotfix-4 [a73567ad] §B</li>
 *   <li>스킬: {@code /core-solution-testing}, {@code /core-solution-multi-tenant}</li>
 * </ul>
 *
 * @author core-tester (Slot ⑤ / A2)
 * @since 2026-06-12
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("[A2] failsafe reuseForks=true ThreadLocal leak 회귀 차단")
class ThreadLocalLeakRegressionTest {

    /**
     * 36자 표준 테스트 TENANT UUID. A1 {@code AbstractTenantIsolatedTest} 와 동일 포맷.
     * 운영 데이터와 충돌 가능성이 없도록 {@code 0000-...-0001} 고정 값을 사용한다.
     */
    private static final String TEST_TENANT_ID = "00000000-0000-0000-0000-000000000001";

    /**
     * A1/B1 표준 가드 — 매 테스트 메서드 종료 후 ThreadLocal 정리.
     *
     * <p>본 가드를 제거하면 후속 ordered 메서드({@code @Order(2)} / {@code @Order(5)}) 가
     * 직전 leak 을 감지하고 FAIL → 회귀 차단.
     *
     * <p>이 패턴은 향후 도입될 {@code AbstractTenantIsolatedTest} (A1) 베이스 클래스가 모든 IT 에
     * 강제하는 표준 finally 가드의 단위-테스트 등가물이다.
     */
    @AfterEach
    void tearDownTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @Order(1)
    @DisplayName("Given 첫 번째 테스트가 tenant_id 설정 후 clear() 누락 When 메서드 종료 Then @AfterEach 가드 가 정리해야 함")
    void leaksTenantId_simulatesProductionMissingFinallyClear() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);

        assertEquals(TEST_TENANT_ID, TenantContextHolder.getTenantId(),
                "본 메서드 종료 직전에는 tenant_id 가 set 된 상태여야 함 (setTenantId 시멘틱 회귀 가드)");

    }

    @Test
    @Order(2)
    @DisplayName("Given 동일 fork 재사용 두 번째 테스트 When tenant_id 조회 Then leak 없이 null 이어야 함 (regression guard)")
    void doesNotLeakTenantId_assertsAfterEachGuardCleaned() {
        String leakedTenantId = TenantContextHolder.getTenantId();

        assertNull(leakedTenantId,
                "ThreadLocal leak 회귀 감지: @Order(1) 이 clear() 를 호출하지 않았는데도 "
                        + "@AfterEach 가드가 정리하지 못해 tenant_id(" + TEST_TENANT_ID + ") 가 leak 됨. "
                        + "@AfterEach TenantContextHolder.clear() 가드, AbstractTenantIsolatedTest(A1) 베이스, "
                        + "또는 SessionBasedAuthenticationFilter finally 가드(B1) 누락 여부 확인 필요. "
                        + "발견 PR: #226 hotfix-4 §B (a73567ad)");
    }

    @Test
    @Order(3)
    @DisplayName("Given 메서드 내부 try/finally 가드 When tenant_id set·작업 Then 종료 시 clear() 가 호출되어야 함 (canonical pattern)")
    void canonicalPattern_setTenantIdInsideTryFinally() {
        assertNull(TenantContextHolder.getTenantId(),
                "직전 메서드의 ThreadLocal leak 회귀 감지 (@AfterEach 가드 실패)");

        try {
            TenantContextHolder.setTenantId(TEST_TENANT_ID);
            assertEquals(TEST_TENANT_ID, TenantContextHolder.getTenantId(),
                    "try 블록 내부에서 tenant_id 가 set 되어야 함");
        } finally {
            TenantContextHolder.clear();
        }

        assertNull(TenantContextHolder.getTenantId(),
                "try/finally 가드 종료 후 ThreadLocal 이 정리되어야 함 — "
                        + "이 패턴은 운영 코드(SessionBasedAuthenticationFilter / Async 핸들러)의 canonical 형태");
    }

    @Test
    @Order(4)
    @DisplayName("Given 모든 ThreadLocal 키 (tenantId·businessType·bypassTenantFilter) set·미정리 When 메서드 종료 Then @AfterEach 가드가 일괄 정리")
    void leaksAllThreadLocalKeys_setsButOmitsClear() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
        TenantContextHolder.setBusinessType("CONSULTATION");
        TenantContext.setBypassTenantFilter(true);

        assertEquals(TEST_TENANT_ID, TenantContextHolder.getTenantId());
        assertEquals("CONSULTATION", TenantContextHolder.getBusinessType());

    }

    @Test
    @Order(5)
    @DisplayName("Given @Order(4) 의 모든 ThreadLocal 누락 When 후속 테스트 진입 Then 모든 키가 null/false (TenantContext.clear() 회귀 guard)")
    void doesNotLeakAllThreadLocalKeys_assertsHolderClearCoversAllKeys() {
        assertNull(TenantContextHolder.getTenantId(),
                "tenantId leak — TenantContextHolder.clear() 가 tenantId ThreadLocal 을 정리하지 못함");

        assertNull(TenantContextHolder.getBusinessType(),
                "businessType leak — TenantContextHolder.clear() 가 businessType ThreadLocal 을 정리하지 못함");

        assertFalse(TenantContext.shouldBypassTenantFilter(),
                "bypassTenantFilter leak — TenantContext.clear() 가 bypassTenantFilter ThreadLocal 을 정리하지 못함. "
                        + "본 회귀가 발생하면 SUPER_ADMIN 권한 모드가 후속 요청으로 누설되어 cross-tenant 접근 위험");
    }

    @Test
    @Order(6)
    @DisplayName("Given single-thread executor 재사용 시뮬레이션 When 첫 task 가 clear 누락·두 번째 task 가 동일 thread 에 할당 Then ThreadLocal 시멘틱 검증 (production leak 재현 pin)")
    void pinsProductionThreadPoolReuseSemantics() throws Exception {
        ExecutorService singleThread = Executors.newSingleThreadExecutor();
        try {
            AtomicReference<String> firstWorkerThreadName = new AtomicReference<>();
            AtomicReference<String> secondWorkerThreadName = new AtomicReference<>();
            AtomicReference<String> observedInSecondTask = new AtomicReference<>();

            singleThread.submit(() -> {
                firstWorkerThreadName.set(Thread.currentThread().getName());
                TenantContextHolder.setTenantId(TEST_TENANT_ID);
            }).get();

            singleThread.submit(() -> {
                secondWorkerThreadName.set(Thread.currentThread().getName());
                observedInSecondTask.set(TenantContextHolder.getTenantId());
                TenantContextHolder.clear();
            }).get();

            assertEquals(firstWorkerThreadName.get(), secondWorkerThreadName.get(),
                    "single-thread executor 가 worker thread 를 재사용해야 본 시나리오가 운영 풀 leak 을 모사함");

            assertEquals(TEST_TENANT_ID, observedInSecondTask.get(),
                    "ThreadLocal 재사용 leak 시나리오가 더 이상 재현되지 않음 — "
                            + "TenantContextHolder ThreadLocal 자료구조 변경 또는 set/get 의 thread-scope 시멘틱 변경 여부 확인. "
                            + "본 시나리오가 재현 가능해야 B1 (SessionBasedAuthenticationFilter finally 가드) 의 정당성이 유지됨.");
        } finally {
            singleThread.shutdownNow();
        }
    }
}
