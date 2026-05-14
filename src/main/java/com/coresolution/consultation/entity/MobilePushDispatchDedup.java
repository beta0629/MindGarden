package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 모바일 푸시 발송 멱등 행(동일 이벤트 재시도 시 중복 발송 방지).
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@Entity
@Table(
        name = "mobile_push_dispatch_dedup",
        uniqueConstraints = @UniqueConstraint(name = "uk_mpd_dedup", columnNames = {"tenant_id", "push_type",
                "entity_id", "time_bucket"}),
        indexes = @Index(name = "idx_mpd_tenant_created", columnList = "tenant_id,created_at")
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MobilePushDispatchDedup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "push_type", nullable = false, length = 64)
    private String pushType;

    @Column(name = "entity_id", nullable = false, length = 128)
    private String entityId;

    @Column(name = "time_bucket", nullable = false, length = 64)
    private String timeBucket;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * 신규 멱등 행 생성 시각 설정.
     */
    public static MobilePushDispatchDedup newRow(String tenantId, String pushType, String entityId,
            String timeBucket) {
        return MobilePushDispatchDedup.builder()
                .tenantId(tenantId)
                .pushType(pushType)
                .entityId(entityId)
                .timeBucket(timeBucket)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
