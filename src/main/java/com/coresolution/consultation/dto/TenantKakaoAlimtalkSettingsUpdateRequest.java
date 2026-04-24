package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 카카오 알림톡 비시크릿 설정 수정 요청 (시크릿 본문 금지, 참조 문자열만).
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantKakaoAlimtalkSettingsUpdateRequest {

    @NotNull
    private Boolean alimtalkEnabled;

    @Size(max = 120)
    private String templateConsultationConfirmed;

    @Size(max = 120)
    private String templateConsultationReminder;

    @Size(max = 120)
    private String templateConsultationCancelled;

    @Size(max = 120)
    private String templateRefundCompleted;

    @Size(max = 120)
    private String templateScheduleChanged;

    @Size(max = 120)
    private String templatePaymentCompleted;

    @Size(max = 120)
    private String templateDepositPendingReminder;

    @Size(max = 200)
    private String kakaoApiKeyRef;

    @Size(max = 200)
    private String kakaoSenderKeyRef;
}
