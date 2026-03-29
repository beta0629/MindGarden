package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 모든 엔티티의 기본이 되는 BaseEntity (IDENTITY PK)
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@MappedSuperclass
@SuperBuilder
@NoArgsConstructor
public abstract class BaseEntity extends AuditableTenantBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    protected Long id;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        BaseEntity that = (BaseEntity) o;

        return id != null ? id.equals(that.id) : that.id == null;
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "BaseEntity{"
                + "id=" + id
                + ", createdAt=" + getCreatedAt()
                + ", updatedAt=" + getUpdatedAt()
                + ", deletedAt=" + getDeletedAt()
                + ", isDeleted=" + getIsDeleted()
                + ", version=" + getVersion()
                + '}';
    }
}
