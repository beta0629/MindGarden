package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 자동 SMS 발송 게이트 토글 요청 (어드민 PATCH 엔드포인트 공용).
 *
 * <p>적용 위치:
 * <ul>
 *   <li>{@code PATCH /api/v1/admin/sms-templates/global-dispatch} — 글로벌 게이트.</li>
 *   <li>{@code PATCH /api/v1/admin/sms-templates/{key}/dispatch} — 종목별 게이트.</li>
 * </ul>
 *
 * <p>게이트 정책 SSOT:
 * {@link com.coresolution.consultation.constant.SmsDispatchFlagKeys}.
 *
 * @author MindGarden
 * @since 2026-05-27
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsTemplateDispatchFlagRequest {

    /** 토글 값 — true=ON, false=OFF. null 은 잘못된 요청. */
    @NotNull(message = "enabled 값은 필수입니다.")
    private Boolean enabled;
}
