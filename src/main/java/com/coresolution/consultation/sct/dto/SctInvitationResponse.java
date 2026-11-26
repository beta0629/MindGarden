package com.coresolution.consultation.sct.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 초대 응답(관리).
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctInvitationResponse {
    private Long id;
    private String formType;
    private Long formTemplateId;
    private Long clientId;
    private Long mappingId;
    private Long consultantId;
    /** 테넌트 단위 관리번호(PII 없음). 공개 API에는 포함하지 않음. */
    private String managementNo;
    private String status;
    private String maskedPhone;
    private String maskedEmail;
    private LocalDateTime tokenExpiresAt;
    private LocalDateTime sentAt;
    private LocalDateTime draftSavedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime cancelledAt;
    private String smsDispatchResult;
    private Boolean requiresGuardian;
    /** 보관 기간 경과 시 true — ADMIN 수동 파기 대상. */
    private Boolean destroyEligible;
    /** 미연결 발송 시 관리 화면 표시명(PII 최소). */
    private String recipientName;
    /**
     * 공개 응답 URL(상대경로). 생성·링크 재발급 직후 응답에만 포함(일회성).
     * ADMIN·CONSULTANT만 — STAFF 응답에는 null. FE가 origin을 붙인다.
     */
    private String publicUrl;
    /**
     * 테넌트 도메인 기준 절대 공개 URL. 생성·링크 재발급 직후 응답에만 포함(일회성).
     * ADMIN·CONSULTANT만 — STAFF 응답에는 null. {@code publicUrl} 상대경로 계약과 병행.
     */
    private String absoluteUrl;
    /**
     * 평문 초대 토큰. 생성·링크 재발급 직후에만 포함 — 이후 조회 API에는 없음.
     * ADMIN·CONSULTANT만 — STAFF 응답에는 null.
     */
    private String token;
    private List<SctAnswerView> answers;
}
