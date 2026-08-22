package com.coresolution.consultation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회기 승계 실행 요청.
 *
 * <p>{@code beneficiaryClientId} 또는 {@code newClient} 중 하나 필수.
 * 기존 {@code POST /mappings/transfer}(상담사 이전)와 별도.</p>
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionSuccessionRequest {

    /** 기존 수혜자 CLIENT(users.id). 신규 시 null. */
    private Long beneficiaryClientId;

    /** 신규 수혜자 최소 필드. beneficiaryClientId와 배타. */
    @Valid
    private SessionSuccessionNewClientRequest newClient;

    @NotNull(message = "타깃 상담사는 필수입니다.")
    private Long targetConsultantId;

    @NotNull(message = "이전 회기 수는 필수입니다.")
    @Min(value = 1, message = "이전 회기 수는 1 이상이어야 합니다.")
    private Integer sessionCount;

    private String reason;

    /** 타깃 신규 매핑 시 패키지명(미지정 시 소스 복사). */
    private String packageName;

    /** 타깃 신규 매핑 시 패키지 가격(미지정 시 소스 복사). */
    private Long packagePrice;
}
