package com.coresolution.consultation.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 강제 로그아웃 요청 DTO.
 *
 * <p>POST {@code /api/v1/admin/sessions/force-logout} 본문. 테넌트는 본문으로 받지 않고
 * 호출 관리자의 인증 컨텍스트에서만 결정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-30
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminForceLogoutRequest {

    /** 강제 로그아웃 대상 사용자 이메일 (호출 관리자와 동일 테넌트여야 함). */
    @NotBlank(message = "이메일을 입력해주세요.")
    private String email;
}
