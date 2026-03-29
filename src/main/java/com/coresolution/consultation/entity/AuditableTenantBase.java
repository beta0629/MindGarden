package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 감사 필드·소프트 삭제·테넌트 ID 등 공통 매핑.
 * PK는 하위 타입({@link BaseEntity}, {@link Client} 등)에서 정의합니다.
 *
 * @author CoreSolution
 * @since 2026-03-29
 */
@MappedSuperclass
@EntityListeners({AuditingEntityListener.class, com.coresolution.core.listener.TenantEntityListener.class})
@SuperBuilder
@NoArgsConstructor
public abstract class AuditableTenantBase {

    /**
     * 엔티티 PK. 구현체에서 매핑 ({@link BaseEntity}: IDENTITY, {@link Client}: users.id 동일 할당).
     *
     * @return PK 또는 신규 영속화 전 null
     */
    public abstract Long getId();

    /**
     * @param id PK
     */
    public abstract void setId(Long id);

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    protected LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    protected LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    protected LocalDateTime deletedAt;

    @Column(name = "is_deleted", nullable = false)
    protected Boolean isDeleted = false;

    @Version
    @Column(name = "version", nullable = false)
    protected Long version = 0L;

    /**
     * 테넌트 ID (Multi-tenant 지원)
     */
    @Column(name = "tenant_id", length = 36)
    protected String tenantId;

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    /**
     * 엔티티 삭제 처리 (소프트 삭제)
     */
    public void delete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * 엔티티 복구 처리
     */
    public void restore() {
        this.isDeleted = false;
        this.deletedAt = null;
    }

    /**
     * 엔티티가 삭제되었는지 확인
     */
    public boolean isDeleted() {
        return this.isDeleted != null && this.isDeleted;
    }

    /**
     * 엔티티가 활성 상태인지 확인
     */
    public boolean isActive() {
        return !isDeleted();
    }
}
