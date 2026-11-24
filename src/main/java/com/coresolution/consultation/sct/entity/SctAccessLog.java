package com.coresolution.consultation.sct.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * SCT 열람 감사 로그 (append-only). ConsultationRecordAccessLog 형제.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Entity
@Table(name = "sct_access_logs", indexes = {
    @Index(name = "idx_sct_al_tenant_accessed", columnList = "tenant_id,accessed_at"),
    @Index(name = "idx_sct_al_tenant_inv", columnList = "tenant_id,invitation_id,accessed_at")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SctAccessLog extends BaseEntity {

    @Column(name = "invitation_id")
    private Long invitationId;

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_role", length = 40)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 20)
    private String action;

    @Column(name = "accessed_at", nullable = false)
    private LocalDateTime accessedAt;

    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    @Column(name = "user_agent_hash", length = 64)
    private String userAgentHash;
}
