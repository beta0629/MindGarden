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
    private List<SctAnswerView> answers;
}
