package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 카카오 알림톡 비시크릿 설정 응답 (시크릿 값 없음).
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantKakaoAlimtalkSettingsResponse {

    private String tenantId;
    private boolean alimtalkEnabled;
    private String templateConsultationConfirmed;
    private String templateConsultationReminder;
    private String templateConsultationCancelled;
    private String templateRefundCompleted;
    private String templateScheduleChanged;
    private String templatePaymentCompleted;
    private String templateDepositPendingReminder;
    private String kakaoApiKeyRef;
    private String kakaoSenderKeyRef;
}
