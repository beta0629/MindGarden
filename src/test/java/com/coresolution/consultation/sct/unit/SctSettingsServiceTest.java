package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctFeatureFlagKeys;
import com.coresolution.consultation.sct.dto.SctSettingsResponse;
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
 * SCT 설정 — ADMIN 변경·감사·보관 기본 365. feature OFF 에서도 GET/PUT 허용.
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
    void resolvePublicContactPhones_fromTenantThenGlobal() {
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.PUBLIC_CONTACT_OFFICE)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.PUBLIC_CONTACT_OFFICE))
                .thenReturn(Optional.of(SystemConfig.builder()
                        .tenantId("")
                        .configKey(SctFeatureFlagKeys.PUBLIC_CONTACT_OFFICE)
                        .configValue("032-724-8501")
                        .isActive(true)
                        .build()));
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.PUBLIC_CONTACT_MOBILE))
                .thenReturn(Optional.of(SystemConfig.builder()
                        .tenantId("t1")
                        .configKey(SctFeatureFlagKeys.PUBLIC_CONTACT_MOBILE)
                        .configValue("010-4285-8570")
                        .isActive(true)
                        .build()));

        assertEquals("032-724-8501", settingsService.resolvePublicOfficePhone("t1"));
        assertEquals("010-4285-8570", settingsService.resolvePublicMobilePhone("t1"));
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
    void getSettingsWhenDisabledReturnsFeatureEnabledFalse() {
        when(sctFeatureGuard.isEnabled("t1")).thenReturn(false);
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.LINK_EXPIRY_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.LINK_EXPIRY_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());

        SctSettingsResponse res = settingsService.getSettings("t1");

        assertFalse(Boolean.TRUE.equals(res.getFeatureEnabled()));
        assertEquals(14, res.getLinkExpiryDays());
        assertEquals(365, res.getRetentionDays());
        verify(sctFeatureGuard, never()).requireEnabled(any());
    }

    @Test
    void updateFeatureEnabledWhenDisabledWritesAuditWithFeatureFlag() {
        when(sctFeatureGuard.isEnabled("t1")).thenReturn(false);
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.LINK_EXPIRY_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.LINK_EXPIRY_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("",
                SctFeatureFlagKeys.RETENTION_DAYS)).thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue("t1",
                SctFeatureFlagKeys.FEATURE_SCT_ENABLED)).thenReturn(Optional.empty());
        when(systemConfigRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        SctSettingsResponse res = settingsService.updateSettings("t1",
                SctSettingsUpdateRequest.builder().featureEnabled(true).build(),
                9L, "ADMIN");

        assertTrue(Boolean.TRUE.equals(res.getFeatureEnabled()));
        ArgumentCaptor<SystemConfig> cfgCaptor = ArgumentCaptor.forClass(SystemConfig.class);
        verify(systemConfigRepository).save(cfgCaptor.capture());
        SystemConfig saved = cfgCaptor.getValue();
        assertEquals(SctFeatureFlagKeys.FEATURE_SCT_ENABLED, saved.getConfigKey());
        assertEquals("true", saved.getConfigValue());
        assertEquals(SctFeatureFlagKeys.FEATURE_CATEGORY, saved.getCategory());

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).record(captor.capture());
        AuditLog log = captor.getValue();
        assertEquals(AuditAction.SCT_SETTINGS_CHANGED, log.getAction());
        assertTrueContains(log.getBeforeJson(), "\"featureEnabled\":false");
        assertTrueContains(log.getAfterJson(), "\"featureEnabled\":true");
        assertTrueContains(log.getMetadataJson(), "feature.sct.enabled");
        verify(sctFeatureGuard, never()).requireEnabled(any());
    }

    @Test
    void updateExpiryWritesAuditWithBeforeAfter() {
        when(sctFeatureGuard.isEnabled("t1")).thenReturn(true);
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
        assertTrueContains(log.getBeforeJson(), "\"featureEnabled\":true");
        assertEquals(7, settingsService.resolveLinkExpiryDays("t1"));
    }

    @Test
    void clearRetentionResetsToDefault365() {
        when(sctFeatureGuard.isEnabled("t1")).thenReturn(true);
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
