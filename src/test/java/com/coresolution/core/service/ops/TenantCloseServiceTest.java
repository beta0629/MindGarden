package com.coresolution.core.service.ops;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.Tenant.TenantStatus;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.tenant.TenantCloseDecision;
import com.coresolution.core.tenant.TenantCloseMessages;
import com.coresolution.core.tenant.TenantClosePolicy;
import com.coresolution.core.tenant.TenantCloseRejectedException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 종료 처리. 행은 남기고 상태·삭제 플래그·서브도메인·설정만 바꾼다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantCloseService")
class TenantCloseServiceTest {

    private static final String TENANT_ID = "tenant-close-service";
    private static final ZoneId SEOUL = TenantCloseMessages.ZONE_SEOUL;
    private static final Instant NOW_INSTANT = LocalDateTime.of(2026, 4, 2, 12, 0)
            .atZone(SEOUL)
            .toInstant();

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private TenantClosePolicy tenantClosePolicy;

    @Mock
    private AuditLogService auditLogService;

    private TenantCloseService tenantCloseService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        tenantCloseService = new TenantCloseService(
                tenantRepository,
                tenantClosePolicy,
                auditLogService,
                Clock.fixed(NOW_INSTANT, SEOUL),
                objectMapper);
    }

    @Test
    @DisplayName("허용되면 CLOSED·is_deleted·deleted_at 을 남기고 서브도메인과 설정 키를 비운다")
    void closeAllowed_updatesIdentityWithoutRemovingRow() throws Exception {
        Tenant tenant = suspendedTenant();
        when(tenantRepository.findByTenantId(TENANT_ID)).thenReturn(Optional.of(tenant));
        when(tenantClosePolicy.evaluate(any(Tenant.class), any(LocalDateTime.class)))
                .thenReturn(TenantCloseDecision.ALLOWED);
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = tenantCloseService.closeTenant(TENANT_ID, "ops-user");

        assertThat(result.get(TenantOpsListItem.STATUS)).isEqualTo("CLOSED");
        assertThat(result.get(TenantOpsListItem.SUBDOMAIN)).isNull();
        assertThat(tenant.getStatus()).isEqualTo(TenantStatus.CLOSED);
        assertThat(tenant.getIsDeleted()).isTrue();
        assertThat(tenant.getDeletedAt()).isEqualTo(LocalDateTime.of(2026, 4, 2, 12, 0));
        assertThat(tenant.getSubdomain()).isNull();
        JsonNode settings = objectMapper.readTree(tenant.getSettingsJson());
        assertThat(settings.has(TenantCloseMessages.SETTINGS_KEY_SUBDOMAIN)).isFalse();
        assertThat(settings.has(TenantCloseMessages.SETTINGS_KEY_DOMAIN)).isFalse();
        assertThat(settings.get("theme").asText()).isEqualTo("clinic");
        verify(tenantRepository, never()).delete(any(Tenant.class));

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).record(auditCaptor.capture());
        AuditLog audit = auditCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo(AuditAction.TENANT_CLOSED);
        assertThat(audit.getBeforeJson()).contains("center-label");
        assertThat(audit.getMetadataJson()).contains("ops-user");
        assertThat(audit.getAfterJson()).contains("CLOSED");
    }

    @Test
    @DisplayName("유예 미경과면 저장하지 않는다")
    void graceNotElapsed_doesNotSave() {
        Tenant tenant = suspendedTenant();
        when(tenantRepository.findByTenantId(TENANT_ID)).thenReturn(Optional.of(tenant));
        when(tenantClosePolicy.evaluate(any(Tenant.class), any(LocalDateTime.class)))
                .thenReturn(TenantCloseDecision.GRACE_NOT_ELAPSED);

        assertThatThrownBy(() -> tenantCloseService.closeTenant(TENANT_ID, "ops-user"))
                .isInstanceOf(TenantCloseRejectedException.class)
                .hasMessage(TenantCloseMessages.MESSAGE_GRACE_NOT_ELAPSED);
        verify(tenantRepository, never()).save(any());
        verify(auditLogService, never()).record(any());
        assertThat(tenant.getSubdomain()).isEqualTo("center-label");
    }

    @Test
    @DisplayName("유효 구독이 있으면 저장하지 않는다")
    void activeSubscription_doesNotSave() {
        Tenant tenant = suspendedTenant();
        when(tenantRepository.findByTenantId(TENANT_ID)).thenReturn(Optional.of(tenant));
        when(tenantClosePolicy.evaluate(any(Tenant.class), any(LocalDateTime.class)))
                .thenReturn(TenantCloseDecision.ACTIVE_SUBSCRIPTION);

        assertThatThrownBy(() -> tenantCloseService.closeTenant(TENANT_ID, "ops-user"))
                .isInstanceOf(TenantCloseRejectedException.class)
                .extracting(ex -> ((TenantCloseRejectedException) ex).getErrorCode())
                .isEqualTo(TenantCloseMessages.CODE_ACTIVE_SUBSCRIPTION);
        verify(tenantRepository, never()).save(any());
    }

    @Test
    @DisplayName("상태가 다르면 저장하지 않는다")
    void wrongStatus_doesNotSave() {
        Tenant tenant = suspendedTenant();
        tenant.setStatus(TenantStatus.ACTIVE);
        when(tenantRepository.findByTenantId(TENANT_ID)).thenReturn(Optional.of(tenant));
        when(tenantClosePolicy.evaluate(any(Tenant.class), any(LocalDateTime.class)))
                .thenReturn(TenantCloseDecision.STATUS_NOT_ALLOWED);

        assertThatThrownBy(() -> tenantCloseService.closeTenant(TENANT_ID, "ops-user"))
                .isInstanceOf(TenantCloseRejectedException.class)
                .extracting(ex -> ((TenantCloseRejectedException) ex).getErrorCode())
                .isEqualTo(TenantCloseMessages.CODE_STATUS_NOT_ALLOWED);
        verify(tenantRepository, never()).save(any());
    }

    private static Tenant suspendedTenant() {
        return Tenant.builder()
                .tenantId(TENANT_ID)
                .name("종료 센터")
                .businessType("CONSULTATION")
                .status(TenantStatus.SUSPENDED)
                .subdomain("center-label")
                .settingsJson("{\"subdomain\":\"center-label\",\"domain\":\"center.example\",\"theme\":\"clinic\"}")
                .build();
    }
}
