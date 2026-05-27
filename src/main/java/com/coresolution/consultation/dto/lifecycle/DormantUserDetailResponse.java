package com.coresolution.consultation.dto.lifecycle;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 휴면 사용자 상세 응답 DTO — Phase 4 (정책서 §10.9 + §10.12).
 *
 * <p>vault 메타데이터 (시각 + 채널) 만 포함한다. encrypted_pii 원문 및 복호화된 PII 는 절대
 * 노출하지 않는다 (PIPA §16 — 안전 보관 원칙). 상세 화면이 community audit 건수도 함께
 * 표시할 수 있도록 {@link #communityAnonymizationAuditCount} 를 포함한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DormantUserDetailResponse {

    /** users.id. */
    private Long userId;

    /** 마스킹된 user_id. */
    private String maskedUserId;

    /** role. */
    private String role;

    /** lifecycle_state — 항상 DORMANT (본 endpoint 가드 통과 시). */
    private String lifecycleState;

    /** 최근 로그인 시각. */
    private LocalDateTime lastLoginAt;

    /** updated_at. */
    private LocalDateTime updatedAt;

    /** vault.dormant_entered_at. */
    private LocalDateTime dormantEnteredAt;

    /** vault.anonymize_scheduled_at. */
    private LocalDateTime anonymizeScheduledAt;

    /** vault.pre_notice_sent_at — null 이면 미발송. */
    private LocalDateTime preNoticeSentAt;

    /** vault.pre_notice_channel. */
    private String preNoticeChannel;

    /** community_anonymization_audit 행 수 (해당 user 가 과거 익명화된 글 보유 시 통계). */
    private long communityAnonymizationAuditCount;

    /** vault 행 존재 여부 — false 이면 reactivate 불가능. */
    private boolean vaultPresent;
}
