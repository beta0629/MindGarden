package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 상담일지 열람 감사 로그 엔티티 (append-only).
 *
 * <p>{@link PersonalDataAccessLog} 는 개인정보 열람 요청·파기 흐름 전용이라 역할(actor_role)과
 * 본문/메타 구분 컬럼이 없다. 상담일지 열람은 본문(VIEW_BODY)·메타(VIEW_META)·목록(LIST)·
 * AI 생성(AI_GENERATE)·내보내기(EXPORT) 를 구분해야 하므로 형제 테이블로 분리한다.</p>
 *
 * <p>본문·식별 가능한 원문(IP·User-Agent)은 저장하지 않는다. IP·User-Agent 는 SHA-256 해시만 남긴다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Entity
@Table(name = "consultation_record_access_logs", indexes = {
    @Index(name = "idx_cral_tenant_accessed", columnList = "tenant_id,accessed_at"),
    @Index(name = "idx_cral_tenant_record", columnList = "tenant_id,record_id,accessed_at"),
    @Index(name = "idx_cral_tenant_actor", columnList = "tenant_id,actor_id,accessed_at")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ConsultationRecordAccessLog extends BaseEntity {

    /** 대상 상담일지 ID. 목록 조회 등 단건이 아니면 null. */
    @Column(name = "record_id")
    private Long recordId;

    /** 대상 종류 — {@code ConsultationRecordAccessAudit.KIND_*}. */
    @Column(name = "record_kind", nullable = false, length = 40)
    private String recordKind;

    /** 대상 내담자 users.id. */
    @Column(name = "client_id")
    private Long clientId;

    /** 일지 작성 상담사 users.id. */
    @Column(name = "author_consultant_id")
    private Long authorConsultantId;

    /** 열람 시도자 users.id. */
    @Column(name = "actor_id")
    private Long actorId;

    /** 열람 시도자 역할. */
    @Column(name = "actor_role", length = 40)
    private String actorRole;

    /** 열람 행위 — {@code ConsultationRecordAccessAudit.ACTION_*}. */
    @Column(name = "action", nullable = false, length = 20)
    private String action;

    /** 처리 결과 — {@code ConsultationRecordAccessAudit.RESULT_*}. */
    @Column(name = "result", nullable = false, length = 20)
    private String result;

    /** 거부 사유. 상담일지 본문은 절대 담지 않는다. */
    @Column(name = "denial_reason", length = 255)
    private String denialReason;

    /** 호출 IP 의 SHA-256 해시 (원본 미저장). */
    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    /** User-Agent 의 SHA-256 해시 (원본 미저장). */
    @Column(name = "user_agent_hash", length = 64)
    private String userAgentHash;

    /** 열람 시각. */
    @Column(name = "accessed_at", nullable = false)
    private LocalDateTime accessedAt;
}
