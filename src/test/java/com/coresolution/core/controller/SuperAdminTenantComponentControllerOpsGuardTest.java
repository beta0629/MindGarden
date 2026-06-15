package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

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
import com.coresolution.core.dto.ShopRewardComponentActivationResponse;
import com.coresolution.core.service.TenantComponentActivationService;

/**
 * {@link SuperAdminTenantComponentController} OPS 가드 회귀 테스트
 * (Phase 4 — ops-portal-migration).
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SuperAdminTenantComponentController OPS 가드 회귀 (Phase 4)")
class SuperAdminTenantComponentControllerOpsGuardTest {

    private static final String HQ_TENANT_ID = "hq-tenant-id-for-test";
    private static final String EXTERNAL_TENANT_ID = "external-tenant-uuid-001";
    private static final String TARGET_TENANT_ID = "target-tenant-uuid-002";

    @Mock
    private TenantComponentActivationService tenantComponentActivationService;

    private OpsTenantConstants opsTenantConstants;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        opsTenantConstants = new OpsTenantConstants();
        injectHqTenantId(opsTenantConstants, HQ_TENANT_ID);
        SuperAdminTenantComponentController controller =
            new SuperAdminTenantComponentController(
                tenantComponentActivationService, opsTenantConstants);
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
    @DisplayName("[#0] 클래스 레벨 @PreAuthorize 가 hasRole('OPS') 로 격상되었다 (SUPER_ADMIN → OPS)")
    void classLevelPreAuthorize_upgradedToOps() {
        PreAuthorize annotation =
            SuperAdminTenantComponentController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value())
            .as("Phase 4 — 레거시 hasRole('SUPER_ADMIN') → hasRole('OPS') 격상")
            .contains("hasRole('OPS')")
            .doesNotContain("SUPER_ADMIN")
            .doesNotContain("ADMIN")
            .doesNotContain("HQ_MASTER")
            .doesNotContain("STAFF")
            .doesNotContain("CONSULTANT")
            .doesNotContain("CLIENT");
    }

    @Test
    @DisplayName("[#1] OPS + HQ 컨텍스트 → activate 정상 (대상 테넌트는 외부여도 OK)")
    void hybrid_opsRole_hqContext_activateOk() throws Exception {
        TenantContextHolder.setTenantId(HQ_TENANT_ID);
        org.mockito.Mockito.when(
            tenantComponentActivationService.activateShopRewardBundle(
                org.mockito.ArgumentMatchers.eq(TARGET_TENANT_ID),
                org.mockito.ArgumentMatchers.anyString()))
            .thenReturn(ShopRewardComponentActivationResponse.builder()
                .tenantId(TARGET_TENANT_ID)
                .build());

        mockMvc.perform(post(
                "/api/v1/super-admin/tenants/" + TARGET_TENANT_ID + "/components/shop-reward/activate"));
    }

    @Test
    @DisplayName("[#2] OPS + 외부 컨텍스트 → activate AccessDenied (HQ 가드 차단)")
    void hybrid_opsRole_externalContext_activateBlocked() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(post(
                "/api/v1/super-admin/tenants/" + TARGET_TENANT_ID + "/components/shop-reward/activate")))
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
    @DisplayName("[#3] SUPER_ADMIN 잔존 표현식 0 — @PreAuthorize 정리 회귀 (Javadoc 제외)")
    void superAdminExpression_eliminated() throws Exception {
        java.nio.file.Path source = java.nio.file.Path.of(
            "src/main/java/com/coresolution/core/controller/SuperAdminTenantComponentController.java");
        if (!java.nio.file.Files.exists(source)) {
            return;
        }
        String content = java.nio.file.Files.readString(source);
        long superAdminInPreAuthorize = content.lines()
            .filter(line -> {
                String trimmed = line.stripLeading();
                return !trimmed.startsWith("*") && !trimmed.startsWith("//");
            })
            .filter(line -> line.contains("SUPER_ADMIN"))
            .filter(line -> line.contains("@PreAuthorize"))
            .count();
        assertThat(superAdminInPreAuthorize)
            .as("@PreAuthorize 에 SUPER_ADMIN 잔존 표현식 0 (Phase 4 정리)")
            .isZero();
    }
}
