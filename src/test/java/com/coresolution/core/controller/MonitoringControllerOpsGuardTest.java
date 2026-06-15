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
import com.coresolution.core.repository.AiAnomalyDetectionRepository;
import com.coresolution.core.repository.SecurityThreatDetectionRepository;
import com.coresolution.core.repository.SystemMetricRepository;
import com.coresolution.core.service.AnomalyDetectionService;

/**
 * {@link MonitoringController} OPS 가드 회귀 테스트 (Phase 2 — ops-portal-migration).
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MonitoringController OPS 가드 회귀 (Phase 2)")
class MonitoringControllerOpsGuardTest {

    private static final String HQ_TENANT_ID = "hq-tenant-id-for-test";
    private static final String EXTERNAL_TENANT_ID = "external-tenant-uuid-001";

    @Mock
    private SystemMetricRepository systemMetricRepository;

    @Mock
    private AiAnomalyDetectionRepository anomalyDetectionRepository;

    @Mock
    private SecurityThreatDetectionRepository threatDetectionRepository;

    @Mock
    private AnomalyDetectionService anomalyDetectionService;

    private OpsTenantConstants opsTenantConstants;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        opsTenantConstants = new OpsTenantConstants();
        injectHqTenantId(opsTenantConstants, HQ_TENANT_ID);
        MonitoringController controller = new MonitoringController(
            systemMetricRepository,
            anomalyDetectionRepository,
            threatDetectionRepository,
            anomalyDetectionService,
            opsTenantConstants);
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
    @DisplayName("[#0] 클래스 레벨 @PreAuthorize 가 hasRole('OPS') 로 격상되었다 (ADMIN → OPS)")
    void classLevelPreAuthorize_upgradedToOps() {
        PreAuthorize annotation = MonitoringController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value())
            .as("Phase 2 — 레거시 hasRole('ADMIN') → hasRole('OPS') 격상")
            .contains("hasRole('OPS')")
            .doesNotContain("ADMIN")
            .doesNotContain("HQ_MASTER")
            .doesNotContain("STAFF")
            .doesNotContain("CONSULTANT")
            .doesNotContain("CLIENT");
    }

    @Test
    @DisplayName("[#1] OPS + HQ 테넌트 → /metrics 정상")
    void hybrid_opsRole_hqTenant_metricsOk() throws Exception {
        TenantContextHolder.setTenantId(HQ_TENANT_ID);
        mockMvc.perform(get("/api/v1/monitoring/metrics").param("minutes", "10"));
    }

    @Test
    @DisplayName("[#2] OPS + 외부 테넌트 → /metrics AccessDenied")
    void hybrid_opsRole_externalTenant_metricsBlocked() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/monitoring/metrics").param("minutes", "10")))
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
    @DisplayName("[#3] OPS + 외부 테넌트 → /dashboard 차단")
    void hybrid_opsRole_externalTenant_dashboardBlocked() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/monitoring/dashboard")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root).isInstanceOf(AccessDeniedException.class);
            });
    }

    @Test
    @DisplayName("[#4] OPS + 외부 테넌트 → /threats 차단")
    void hybrid_opsRole_externalTenant_threatsBlocked() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/monitoring/threats").param("hours", "24")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root).isInstanceOf(AccessDeniedException.class);
            });
    }
}
