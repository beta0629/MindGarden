package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctFeatureFlagKeys;
import com.coresolution.consultation.sct.dto.SctSettingsUpdateRequest;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.impl.SctSettingsServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * SCT 설정 — ADMIN 변경·감사·보관 기본 365.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@ExtendWith(MockitoExtension.class)
class SctSettingsServiceTest {

    @Mock private SystemConfigRepository systemConfigRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private SctFeatureGuard sctFeatureGuard;

    @InjectMocks
    private SctSettingsServiceImpl settingsService;

    @Test
    void defaultExpiryIs14() {
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.LINK_EXPIRY_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.LINK_EXPIRY_DAYS)).thenReturn(Optional.empty());
        assertEquals(14, settingsService.resolveLinkExpiryDays("t1"));
    }

    @Test
    void defaultRetentionIs365() {
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        assertEquals(365, settingsService.resolveRetentionDays("t1"));
    }

    @Test
    void blankRetentionConfigFallsBackTo365() {
        SystemConfig blank = SystemConfig.builder()
                .tenantId("")
                .configKey(SctFeatureFlagKeys.RETENTION_DAYS)
                .configValue(null)
                .isActive(true)
                .build();
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.of(blank));
        assertEquals(365, settingsService.resolveRetentionDays("t1"));
    }

    @Test
    void updateExpiryWritesAuditWithBeforeAfter() {
        SystemConfig existing = SystemConfig.builder()
                .tenantId("t1")
                .configKey(SctFeatureFlagKeys.LINK_EXPIRY_DAYS)
                .configValue("14")
                .isActive(true)
                .build();
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.LINK_EXPIRY_DAYS)).thenReturn(Optional.of(existing));
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        settingsService.updateSettings("t1",
                SctSettingsUpdateRequest.builder().linkExpiryDays(7).build(),
                9L, "ADMIN");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).record(captor.capture());
        AuditLog log = captor.getValue();
        assertEquals(AuditAction.SCT_SETTINGS_CHANGED, log.getAction());
        assertEquals(9L, log.getActorUserId());
        assertEquals("ADMIN", log.getActorRole());
        assertTrueContains(log.getBeforeJson(), "14");
        assertTrueContains(log.getAfterJson(), "7");
        assertEquals(7, settingsService.resolveLinkExpiryDays("t1"));
    }

    @Test
    void clearRetentionResetsToDefault365() {
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.LINK_EXPIRY_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.LINK_EXPIRY_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        var res = settingsService.updateSettings("t1",
                SctSettingsUpdateRequest.builder().clearRetention(true).build(),
                1L, "ADMIN");
        assertEquals(365, res.getRetentionDays());
    }

    private static void assertTrueContains(String hay, String needle) {
        if (hay == null || !hay.contains(needle)) {
            throw new AssertionError("expected containing " + needle + " in " + hay);
        }
    }
}
