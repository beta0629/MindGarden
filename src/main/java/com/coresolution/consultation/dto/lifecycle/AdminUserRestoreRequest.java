package com.coresolution.consultation.dto.lifecycle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 "되돌리기" 요청 DTO — USER_LIFECYCLE_TERMINATION_POLICY §0.1 Q5 + §8.
 *
 * <p>POST {@code /api/v1/admin/users/{userId}/restore} 본문 — 사유(reason) 필수.
 * audit_logs 와 destruction_logs 에 기록되어 감사 추적되므로 비어 있을 수 없다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserRestoreRequest {

    /** 되돌리기 사유 (필수, 500자 이하). */
    @NotBlank(message = "되돌리기 사유는 필수입니다.")
    @Size(max = 500, message = "되돌리기 사유는 500자 이하여야 합니다.")
    private String reason;
}
