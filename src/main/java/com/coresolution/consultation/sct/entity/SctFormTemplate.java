package com.coresolution.consultation.sct.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * SCT 질문지 템플릿.
 *
 * <p>{@code version} 컬럼은 양식 버전(v3)이며 AuditableTenantBase 의 optimistic lock 과 충돌하므로
 * 독립 엔티티로 둔다. 코어 시드는 {@code tenant_id=''}.</p>
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Entity
@Table(name = "sct_form_templates", uniqueConstraints = {
    @UniqueConstraint(name = "uk_sct_form_tenant_type_ver",
            columnNames = {"tenant_id", "form_type", "version"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctFormTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "form_type", nullable = false, length = 20)
    private String formType;

    @Column(name = "version", nullable = false, length = 20)
    private String formVersion;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "instruction_text", nullable = false, columnDefinition = "TEXT")
    private String instructionText;

    @Column(name = "target_desc", length = 200)
    private String targetDesc;

    /** 머리 칸 JSON (web-handoff / build_sct_v3 header). */
    @Column(name = "header_fields_json", columnDefinition = "TEXT")
    private String headerFieldsJson;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "version_lock", nullable = false)
    @Builder.Default
    private Long versionLock = 0L;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (isActive == null) {
            isActive = true;
        }
        if (versionLock == null) {
            versionLock = 0L;
        }
        if (tenantId == null) {
            tenantId = "";
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
