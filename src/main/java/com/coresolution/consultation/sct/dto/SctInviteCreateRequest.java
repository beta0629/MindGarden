package com.coresolution.consultation.sct.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 발송 요청.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctInviteCreateRequest {
    @NotBlank
    private String formType;
    private Long clientId;
    private Long mappingId;
    private String phone;
    private String email;
    /** 만료 일수 오버라이드(1~30). null이면 테넌트 설정. */
    private Integer expiresInDays;
    private Boolean requiresGuardian;
    /** 미연결 발송 시 목록 표시용 이름(선택). */
    private String recipientName;
}
