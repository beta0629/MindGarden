package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회기 승계 시 신규 수혜자 CLIENT 최소 등록 필드.
 *
 * <p>이름 필수. 이메일·휴대폰 중 최소 하나(기존 ClientRegistrationRequest와 동일 정책).</p>
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionSuccessionNewClientRequest {

    @NotBlank(message = "수혜자 이름은 필수입니다.")
    private String name;

    private String phone;

    private String email;
}
