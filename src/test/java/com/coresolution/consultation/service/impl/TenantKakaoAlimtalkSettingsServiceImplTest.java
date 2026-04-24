package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.coresolution.consultation.dto.TenantKakaoAlimtalkSettingsResponse;
import com.coresolution.consultation.dto.TenantKakaoAlimtalkSettingsUpdateRequest;
import com.coresolution.consultation.entity.TenantKakaoAlimtalkSettings;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.consultation.service.NotificationService.NotificationType;
import com.coresolution.consultation.service.TenantKakaoAlimtalkSettingsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 테넌트 카카오 알림톡 설정 서비스 — 테넌트 격리·템플릿 오버라이드.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantKakaoAlimtalkSettingsServiceImpl")
class TenantKakaoAlimtalkSettingsServiceImplTest {

    private static final String TENANT_A = "tenant-a-uuid";
    private static final String TENANT_B = "tenant-b-uuid";

    @Mock
    private TenantKakaoAlimtalkSettingsRepository repository;

    @InjectMocks
    private TenantKakaoAlimtalkSettingsServiceImpl service;

    @Test
    @DisplayName("테넌트 A 템플릿 오버라이드는 B에 영향 없음")
    void findBizTemplateCodeOverride_isolatesTenants() {
        TenantKakaoAlimtalkSettings rowA = new TenantKakaoAlimtalkSettings();
        rowA.setTenantId(TENANT_A);
        rowA.setTemplateScheduleChanged("tpl_a_schedule");

        when(repository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.of(rowA));
        when(repository.findByTenantIdAndIsDeletedFalse(TENANT_B)).thenReturn(Optional.empty());

        TenantKakaoAlimtalkSettingsService svc = service;
        assertThat(svc.findBizTemplateCodeOverride(TENANT_A, NotificationType.SCHEDULE_CHANGED))
            .contains("tpl_a_schedule");
        assertThat(svc.findBizTemplateCodeOverride(TENANT_B, NotificationType.SCHEDULE_CHANGED)).isEmpty();
    }

    @Test
    @DisplayName("신규 upsert 시 tenant_id가 저장 엔티티에 설정된다")
    void upsert_setsTenantIdOnCreate() {
        when(repository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.empty());
        when(repository.save(any(TenantKakaoAlimtalkSettings.class))).thenAnswer(invocation -> {
            TenantKakaoAlimtalkSettings e = invocation.getArgument(0);
            e.setId(99L);
            return e;
        });

        TenantKakaoAlimtalkSettingsUpdateRequest req = TenantKakaoAlimtalkSettingsUpdateRequest.builder()
            .alimtalkEnabled(false)
            .templateConsultationConfirmed("ccode")
            .build();

        TenantKakaoAlimtalkSettingsResponse res = service.upsert(TENANT_A, req);

        ArgumentCaptor<TenantKakaoAlimtalkSettings> captor = ArgumentCaptor.forClass(TenantKakaoAlimtalkSettings.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_A);
        assertThat(res.getTenantId()).isEqualTo(TENANT_A);
        assertThat(res.isAlimtalkEnabled()).isFalse();
        assertThat(res.getTemplateConsultationConfirmed()).isEqualTo("ccode");
    }
}
