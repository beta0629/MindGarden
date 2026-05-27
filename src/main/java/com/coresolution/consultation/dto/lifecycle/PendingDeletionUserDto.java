package com.coresolution.consultation.dto.lifecycle;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 "삭제 대기 사용자" 목록 항목 DTO — USER_LIFECYCLE_TERMINATION_POLICY §0.1 Q5.
 *
 * <p>GET {@code /api/v1/admin/users/pending-deletion} 응답 1행. 이메일은 마스킹된 표현으로
 * 적재되며 (SafeText 패턴), 남은 일수(daysRemaining)는 7 - elapsed 형태로 즉시 계산된다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingDeletionUserDto {

    private Long userId;
    private String name;
    /** 마스킹된 이메일 (예: a***@example.com). */
    private String emailMasked;
    /** 역할 코드 (CLIENT / CONSULTANT 등). */
    private String role;
    /** 강제 종료 진입 시각 (DELETED_BY_ADMIN stamp). */
    private LocalDateTime deletedAt;
    /** 7 - elapsed (0 ~ 7). */
    private int daysRemaining;
    /** 어드민 강제 종료 사유 (audit_logs 보강). */
    private String reason;
    /** 강제 종료를 수행한 어드민 users.id. */
    private Long deletedByAdminId;
    /** 강제 종료를 수행한 어드민 이름 (조회 join 결과). */
    private String deletedByAdminName;
}
