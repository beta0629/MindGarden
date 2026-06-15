package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.lang.reflect.Field;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.SchedulerExecutionLogRepository;

/**
 * {@link SchedulerMonitoringController} OPS 가드 회귀 테스트 (Phase 2 — ops-portal-migration).
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SchedulerMonitoringController OPS 가드 회귀 (Phase 2)")
class SchedulerMonitoringControllerOpsGuardTest {

    private static final String HQ_TENANT_ID = "hq-tenant-id-for-test";
    private static final String EXTERNAL_TENANT_ID = "external-tenant-uuid-001";

    @Mock
    private SchedulerExecutionLogRepository executionLogRepository;

    private OpsTenantConstants opsTenantConstants;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        opsTenantConstants = new OpsTenantConstants();
        injectHqTenantId(opsTenantConstants, HQ_TENANT_ID);
        SchedulerMonitoringController controller = new SchedulerMonitoringController(
            executionLogRepository, opsTenantConstants);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        TenantContextHolder.setTenantId(HQ_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static void injectHqTenantId(OpsTenantConstants target, String value) throws Exception {
        Field field = OpsTenantConstants.class.getDeclaredField("hqTenantId");
        field.setAccessible(true);
        field.set(target, value);
    }

    @Test
    @DisplayName("[#0] 클래스 레벨 @PreAuthorize 가 hasRole('OPS') 로 부착되어 있다")
    void classLevelPreAuthorize_isOps() {
        PreAuthorize annotation =
            SchedulerMonitoringController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value())
            .contains("hasRole('OPS')")
            .doesNotContain("ADMIN")
            .doesNotContain("HQ_MASTER")
            .doesNotContain("STAFF")
            .doesNotContain("CONSULTANT")
            .doesNotContain("CLIENT");
    }

    @Test
    @DisplayName("[#1] OPS + HQ 테넌트 → /execution/recent 정상")
    void hybrid_opsRole_hqTenant_recentOk() throws Exception {
        TenantContextHolder.setTenantId(HQ_TENANT_ID);
        mockMvc.perform(get("/api/v1/scheduler/execution/recent").param("limit", "5"));
    }

    @Test
    @DisplayName("[#2] OPS + 외부 테넌트 → /execution/recent AccessDenied")
    void hybrid_opsRole_externalTenant_recentBlocked() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/scheduler/execution/recent").param("limit", "5")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root).isInstanceOf(AccessDeniedException.class);
                assertThat(root.getMessage()).contains("본사").contains("외부 테넌트");
            });
    }

    @Test
    @DisplayName("[#3] OPS + 외부 테넌트 → /execution/summary 차단")
    void hybrid_opsRole_externalTenant_summaryBlocked() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/scheduler/execution/summary")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root).isInstanceOf(AccessDeniedException.class);
            });
    }

    @Test
    @DisplayName("[#4] OPS + 외부 테넌트 → /execution/failures 차단")
    void hybrid_opsRole_externalTenant_failuresBlocked() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/scheduler/execution/failures").param("limit", "5")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root).isInstanceOf(AccessDeniedException.class);
            });
    }

    @Test
    @DisplayName("[#5] HQ_MASTER 잔존 @PreAuthorize 표현식 0 — 정리 회귀")
    void hybrid_hqMasterExpression_eliminated() throws Exception {
        java.nio.file.Path source = java.nio.file.Path.of(
            "src/main/java/com/coresolution/core/controller/SchedulerMonitoringController.java");
        if (!java.nio.file.Files.exists(source)) {
            return;
        }
        String content = java.nio.file.Files.readString(source);
        long executableHqMasterCount = content.lines()
            .filter(line -> {
                String trimmed = line.stripLeading();
                return !trimmed.startsWith("*") && !trimmed.startsWith("//");
            })
            .filter(line -> line.contains("HQ_MASTER"))
            .filter(line -> line.contains("@PreAuthorize"))
            .count();
        assertThat(executableHqMasterCount).isZero();
    }
}
