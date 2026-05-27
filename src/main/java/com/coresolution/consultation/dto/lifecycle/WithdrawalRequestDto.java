package com.coresolution.consultation.dto.lifecycle;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 자발 탈퇴 신청 요청 DTO — POST /api/v1/mypage/withdrawal/request.
 *
 * <p>본인 확인용 비밀번호 재확인을 입력 받는다. 필요 시 Phase 5 에서 OTP/2FA 필드 확장.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequestDto {

    @NotBlank(message = "비밀번호 재확인이 필요합니다.")
    private String password;

    /** 사유 (선택). 길이 제한은 audit_logs.metadata 적재 시점에 결정. */
    private String reason;
}
