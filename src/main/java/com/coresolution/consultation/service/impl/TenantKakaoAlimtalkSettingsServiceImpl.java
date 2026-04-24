package com.coresolution.consultation.service.impl;

import java.util.Optional;
import com.coresolution.consultation.dto.TenantKakaoAlimtalkSettingsResponse;
import com.coresolution.consultation.dto.TenantKakaoAlimtalkSettingsUpdateRequest;
import com.coresolution.consultation.entity.TenantKakaoAlimtalkSettings;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.consultation.service.NotificationService.NotificationType;
import com.coresolution.consultation.service.TenantKakaoAlimtalkSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테넌트별 카카오 알림톡 비시크릿 설정 구현.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@Service
@RequiredArgsConstructor
public class TenantKakaoAlimtalkSettingsServiceImpl implements TenantKakaoAlimtalkSettingsService {

    private final TenantKakaoAlimtalkSettingsRepository tenantKakaoAlimtalkSettingsRepository;

    @Override
    @Transactional(readOnly = true)
    public TenantKakaoAlimtalkSettingsResponse getEffectiveSettings(String tenantId) {
        return tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .map(this::toResponse)
            .orElseGet(() -> defaultResponse(tenantId));
    }

    @Override
    @Transactional
    public TenantKakaoAlimtalkSettingsResponse upsert(String tenantId, TenantKakaoAlimtalkSettingsUpdateRequest request) {
        TenantKakaoAlimtalkSettings entity = tenantKakaoAlimtalkSettingsRepository
            .findByTenantIdAndIsDeletedFalse(tenantId)
            .orElseGet(() -> {
                TenantKakaoAlimtalkSettings created = new TenantKakaoAlimtalkSettings();
                created.setTenantId(tenantId);
                return created;
            });
        applyRequest(entity, request);
        TenantKakaoAlimtalkSettings saved = tenantKakaoAlimtalkSettingsRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isAlimTalkEnabledForTenant(String tenantId) {
        return tenantKakaoAlimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .map(TenantKakaoAlimtalkSettings::getAlimtalkEnabled)
            .orElse(Boolean.TRUE);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findBizTemplateCodeOverride(String tenantId, NotificationType type) {
        Optional<TenantKakaoAlimtalkSettings> row = tenantKakaoAlimtalkSettingsRepository
            .findByTenantIdAndIsDeletedFalse(tenantId);
        if (row.isEmpty()) {
            return Optional.empty();
        }
        String raw = switch (type) {
            case CONSULTATION_CONFIRMED -> row.get().getTemplateConsultationConfirmed();
            case CONSULTATION_REMINDER -> row.get().getTemplateConsultationReminder();
            case CONSULTATION_CANCELLED -> row.get().getTemplateConsultationCancelled();
            case REFUND_COMPLETED -> row.get().getTemplateRefundCompleted();
            case SCHEDULE_CHANGED -> row.get().getTemplateScheduleChanged();
            case PAYMENT_COMPLETED -> row.get().getTemplatePaymentCompleted();
            case DEPOSIT_PENDING_REMINDER -> row.get().getTemplateDepositPendingReminder();
        };
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(raw.trim());
    }

    private void applyRequest(TenantKakaoAlimtalkSettings entity, TenantKakaoAlimtalkSettingsUpdateRequest request) {
        entity.setAlimtalkEnabled(request.getAlimtalkEnabled());
        entity.setTemplateConsultationConfirmed(emptyToNull(request.getTemplateConsultationConfirmed()));
        entity.setTemplateConsultationReminder(emptyToNull(request.getTemplateConsultationReminder()));
        entity.setTemplateConsultationCancelled(emptyToNull(request.getTemplateConsultationCancelled()));
        entity.setTemplateRefundCompleted(emptyToNull(request.getTemplateRefundCompleted()));
        entity.setTemplateScheduleChanged(emptyToNull(request.getTemplateScheduleChanged()));
        entity.setTemplatePaymentCompleted(emptyToNull(request.getTemplatePaymentCompleted()));
        entity.setTemplateDepositPendingReminder(emptyToNull(request.getTemplateDepositPendingReminder()));
        entity.setKakaoApiKeyRef(emptyToNull(request.getKakaoApiKeyRef()));
        entity.setKakaoSenderKeyRef(emptyToNull(request.getKakaoSenderKeyRef()));
    }

    private static String emptyToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private TenantKakaoAlimtalkSettingsResponse toResponse(TenantKakaoAlimtalkSettings e) {
        return TenantKakaoAlimtalkSettingsResponse.builder()
            .tenantId(e.getTenantId())
            .alimtalkEnabled(Boolean.TRUE.equals(e.getAlimtalkEnabled()))
            .templateConsultationConfirmed(e.getTemplateConsultationConfirmed())
            .templateConsultationReminder(e.getTemplateConsultationReminder())
            .templateConsultationCancelled(e.getTemplateConsultationCancelled())
            .templateRefundCompleted(e.getTemplateRefundCompleted())
            .templateScheduleChanged(e.getTemplateScheduleChanged())
            .templatePaymentCompleted(e.getTemplatePaymentCompleted())
            .templateDepositPendingReminder(e.getTemplateDepositPendingReminder())
            .kakaoApiKeyRef(e.getKakaoApiKeyRef())
            .kakaoSenderKeyRef(e.getKakaoSenderKeyRef())
            .build();
    }

    private static TenantKakaoAlimtalkSettingsResponse defaultResponse(String tenantId) {
        return TenantKakaoAlimtalkSettingsResponse.builder()
            .tenantId(tenantId)
            .alimtalkEnabled(true)
            .build();
    }
}
