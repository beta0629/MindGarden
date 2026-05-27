package com.coresolution.consultation.dto.lifecycle;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * {@code UserAnonymizationService.anonymize(...)} 결과 VO.
 *
 * <p>익명화된 PII 컬럼 목록 + audit_logs / personal_data_destruction_logs PK 와 W3 email
 * tombstone 패턴(검증·테스트용)을 함께 반환한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
public final class AnonymizeResult {

    private final Long userId;
    private final String emailTombstone;
    private final List<String> piiColumnsAffected;
    private final Long auditLogId;
    private final Long destructionLogId;
    private final LocalDateTime anonymizedAt;

    private AnonymizeResult(Builder builder) {
        this.userId = builder.userId;
        this.emailTombstone = builder.emailTombstone;
        this.piiColumnsAffected = builder.piiColumnsAffected == null
                ? Collections.emptyList()
                : Collections.unmodifiableList(builder.piiColumnsAffected);
        this.auditLogId = builder.auditLogId;
        this.destructionLogId = builder.destructionLogId;
        this.anonymizedAt = builder.anonymizedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmailTombstone() {
        return emailTombstone;
    }

    public List<String> getPiiColumnsAffected() {
        return piiColumnsAffected;
    }

    public Long getAuditLogId() {
        return auditLogId;
    }

    public Long getDestructionLogId() {
        return destructionLogId;
    }

    public LocalDateTime getAnonymizedAt() {
        return anonymizedAt;
    }

    public static final class Builder {
        private Long userId;
        private String emailTombstone;
        private List<String> piiColumnsAffected;
        private Long auditLogId;
        private Long destructionLogId;
        private LocalDateTime anonymizedAt;

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder emailTombstone(String emailTombstone) {
            this.emailTombstone = emailTombstone;
            return this;
        }

        public Builder piiColumnsAffected(List<String> piiColumnsAffected) {
            this.piiColumnsAffected = piiColumnsAffected;
            return this;
        }

        public Builder auditLogId(Long auditLogId) {
            this.auditLogId = auditLogId;
            return this;
        }

        public Builder destructionLogId(Long destructionLogId) {
            this.destructionLogId = destructionLogId;
            return this;
        }

        public Builder anonymizedAt(LocalDateTime anonymizedAt) {
            this.anonymizedAt = anonymizedAt;
            return this;
        }

        public AnonymizeResult build() {
            return new AnonymizeResult(this);
        }
    }
}
