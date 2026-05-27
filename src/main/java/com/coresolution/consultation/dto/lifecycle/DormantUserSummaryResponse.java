package com.coresolution.consultation.dto.lifecycle;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 휴면 사용자 목록 응답 DTO — Phase 4 (정책서 §10.9 + §10.12).
 *
 * <p>휴면 사용자의 최소 식별 정보 + vault 기반 진행 상태만 포함한다. 원본 PII (이름·이메일·전화)
 * 는 vault 에 암호화 저장되어 있으며 본 응답에는 절대 노출하지 않는다. UI 는 사용자 식별을
 * users.id + 마스킹된 user_id 로 수행한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DormantUserSummaryResponse {

    /** users.id (PK). */
    private Long userId;

    /** users.user_id 의 마스킹된 표현 — 예: "client***". */
    private String maskedUserId;

    /** users.role (CLIENT / CONSULTANT 등). */
    private String role;

    /** DORMANT 진입 시각 — vault.dormant_entered_at. */
    private LocalDateTime dormantEnteredAt;

    /** 4년 후 익명화 예정 시각 — vault.anonymize_scheduled_at. */
    private LocalDateTime anonymizeScheduledAt;

    /** 30일 사전 통지 발송 시각 — null 이면 미발송. */
    private LocalDateTime preNoticeSentAt;

    /** 사전 통지 채널 — EMAIL / KAKAO / SMS / null. */
    private String preNoticeChannel;

    /** vault 행 존재 여부 — false 이면 무결성 경고 (UI 노란색 강조). */
    private boolean vaultPresent;
}
