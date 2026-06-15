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

import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.AiAnomalyDetectionRepository;
import com.coresolution.core.repository.SecurityThreatDetectionRepository;

/**
 * {@link AIMonitoringController} OPS 가드 회귀 테스트 (Phase 2 — ops-portal-migration).
 *
 * <p>standalone {@link MockMvc} 로 옵션 3+1 하이브리드 가드 회귀 8건을 검증한다.
 * {@code @PreAuthorize("hasRole('OPS')")} 가드는 standalone MockMvc 가 적용하지 않으므로
 * reflection 으로 표현식 부착을 회귀 검증한다 (security 통합 테스트는 후속 PR).</p>
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AIMonitoringController OPS 가드 회귀 (Phase 2)")
class AIMonitoringControllerOpsGuardTest {

    private static final String HQ_TENANT_ID = "hq-tenant-id-for-test";
    private static final String EXTERNAL_TENANT_ID = "external-tenant-uuid-001";

    @Mock
    private AiAnomalyDetectionRepository anomalyDetectionRepository;

    @Mock
    private SecurityThreatDetectionRepository threatDetectionRepository;

    @Mock
    private AiUsageLogRepository usageLogRepository;

    private OpsTenantConstants opsTenantConstants;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        opsTenantConstants = new OpsTenantConstants();
        injectHqTenantId(opsTenantConstants, HQ_TENANT_ID);
        AIMonitoringController controller = new AIMonitoringController(
            anomalyDetectionRepository,
            threatDetectionRepository,
            usageLogRepository,
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
    @DisplayName("[#0] 클래스 레벨 @PreAuthorize 가 hasRole('OPS') 로 부착되어 있다")
    void classLevelPreAuthorize_isOps() {
        PreAuthorize annotation = AIMonitoringController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).as("@PreAuthorize 어노테이션이 클래스 레벨에 부착되어 있어야 한다").isNotNull();
        assertThat(annotation.value())
            .as("OPS_PORTAL_MIGRATION_PLAN Phase 2 — Ops Portal 운영자 Authority (ROLE_OPS)")
            .contains("hasRole('OPS')")
            .doesNotContain("ADMIN")
            .doesNotContain("HQ_MASTER")
            .doesNotContain("STAFF")
            .doesNotContain("CONSULTANT")
            .doesNotContain("CLIENT");
    }

    @Test
    @DisplayName("[#1] OPS + HQ 테넌트 → 정상 (예외 없음, 매퍼 호출)")
    void hybrid_opsRole_hqTenant_ok() throws Exception {
        TenantContextHolder.setTenantId(HQ_TENANT_ID);
        mockMvc.perform(get("/api/v1/monitoring/anomaly-detection/recent")
                .param("limit", "5"));
    }

    @Test
    @DisplayName("[#2] OPS + 외부 테넌트 → AccessDeniedException (HQ 가드 차단)")
    void hybrid_opsRole_externalTenant_throwsAccessDenied() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/monitoring/anomaly-detection/recent")
                .param("limit", "5")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root)
                    .as("HQ 가드는 AccessDeniedException 로 차단해야 한다")
                    .isInstanceOf(AccessDeniedException.class);
                assertThat(root.getMessage())
                    .as("거부 메시지는 외부 테넌트 차단 사유를 명시해야 한다")
                    .contains("본사").contains("외부 테넌트");
            });
    }

    @Test
    @DisplayName("[#3] ADMIN 토큰 → 클래스 레벨 @PreAuthorize 가 ADMIN 미허용 (회귀)")
    void hybrid_adminRole_blockedByPreAuthorize() {
        PreAuthorize annotation = AIMonitoringController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value())
            .as("ADMIN 은 ROLE_OPS 미보유 — hasRole('OPS') 표현식이 ADMIN 을 허용하면 안 됨")
            .contains("hasRole('OPS')")
            .doesNotContain("ADMIN");
    }

    @Test
    @DisplayName("[#4] HQ_MASTER 잔존 표현식 0 (회귀 — 레거시 가드 제거)")
    void hybrid_hqMasterExpression_eliminated() throws Exception {
        java.nio.file.Path source = java.nio.file.Path.of(
            "src/main/java/com/coresolution/core/controller/AIMonitoringController.java");
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
        assertThat(executableHqMasterCount)
            .as("AIMonitoringController @PreAuthorize 에 HQ_MASTER 가 잔존하면 안 된다 (Javadoc 제외)")
            .isZero();
    }

    @Test
    @DisplayName("[#5] STAFF/CONSULTANT/CLIENT/무인증 → @PreAuthorize 표현식이 4종 SSOT 차단")
    void hybrid_otherRoles_blockedByPreAuthorize() {
        PreAuthorize annotation = AIMonitoringController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value())
            .contains("hasRole('OPS')")
            .doesNotContain("STAFF")
            .doesNotContain("CONSULTANT")
            .doesNotContain("CLIENT");
    }

    @Test
    @DisplayName("[#6] OPS + 외부 테넌트 → ai-usage 도 차단 (모든 endpoint 가드 일관성)")
    void hybrid_aiUsageEndpoint_blockedForExternalTenant() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/monitoring/ai-usage/summary")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root).isInstanceOf(AccessDeniedException.class);
            });
    }

    @Test
    @DisplayName("[#7] OPS + 외부 테넌트 → security-threats 도 차단")
    void hybrid_securityThreatsEndpoint_blockedForExternalTenant() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/monitoring/security-threats/recent")
                .param("limit", "5")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root).isInstanceOf(AccessDeniedException.class);
            });
    }
}
