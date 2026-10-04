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
 * 상담일지 작성·수정 감사 엔티티 (append-only).
 *
 * <p>성공한 작성·수정 1건당 정확히 1행을 남긴다. 바뀐 필드는 <strong>필드명만</strong> 저장하며
 * 본문 값(이전·이후)은 어떤 컬럼에도 담지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@Entity
@Table(name = "consultation_record_edit_audits", indexes = {
    @Index(name = "idx_crea_tenant_record", columnList = "tenant_id,record_id,edited_at"),
    @Index(name = "idx_crea_tenant_editor", columnList = "tenant_id,editor_id,edited_at")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ConsultationRecordEditAudit extends BaseEntity {

    /** 대상 상담일지 ID. */
    @Column(name = "record_id", nullable = false)
    private Long recordId;

    /** 행위 — {@code ConsultationRecordAccessAudit.ACTION_CREATE}·{@code ACTION_EDIT}. */
    @Column(name = "action", nullable = false, length = 20)
    private String action;

    /** 실제 작성·수정자 users.id (시스템 경로면 null). */
    @Column(name = "editor_id")
    private Long editorId;

    /** 실제 작성·수정자 역할명. */
    @Column(name = "editor_role", length = 40)
    private String editorRole;

    /** 바뀐 필드명 목록(콤마 구분). 값은 저장하지 않는다. */
    @Column(name = "changed_fields", length = 2000)
    private String changedFields;

    /** 작성·수정 시각. */
    @Column(name = "edited_at", nullable = false)
    private LocalDateTime editedAt;
}
