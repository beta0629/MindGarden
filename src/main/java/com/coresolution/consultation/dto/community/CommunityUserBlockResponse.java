package com.coresolution.consultation.dto.community;

import lombok.Builder;
import lombok.Data;

/**
 * Apple T2 (1.2 UGC) — 차단 목록 응답 항목.
 *
 * <p>차단당한 사용자의 식별자·표시명·차단 시각을 노출한다. 표시명은 nickname → name 우선순위로
 * 결정되며 둘 다 없으면 "사용자".</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Data
@Builder
public class CommunityUserBlockResponse {

    /** 차단 row id. */
    private Long id;

    /** 차단 대상 사용자 users.id. */
    private Long blockedUserId;

    /** 차단 대상 표시명. */
    private String blockedDisplayName;

    /** 차단 시각 (ISO LocalDateTime). */
    private String blockedAt;
}
