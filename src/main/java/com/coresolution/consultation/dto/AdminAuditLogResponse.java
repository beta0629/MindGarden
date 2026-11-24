package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import com.coresolution.consultation.constant.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ADMIN 감사 로그 조회 응답(메타만, 본문·PII 없음).
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuditLogResponse {
    private Long id;
    private String tenantId;
    private Long actorUserId;
    private String actorRole;
    private Long targetUserId;
    private AuditAction action;
    private String entityType;
    private Long entityId;
    private String metadataJson;
    private LocalDateTime createdAt;
}