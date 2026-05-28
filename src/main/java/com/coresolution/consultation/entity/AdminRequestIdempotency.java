package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 어드민 멱등성 가드 엔티티 — 옵션 B v2.0 합의서 §4·§6 Q11 (2026-05-28).
 *
 * <p>{@code X-Request-Id} 헤더 (Idempotency Key) 1건을 (테넌트 + 키) 단위로 저장하여
 * 5분 윈도우 내 동일 요청 ID 재사용을 차단한다. UNIQUE (tenant_id, request_id) 제약이
 * race condition 을 데이터 계층에서 보장한다.</p>
 *
 * <p>현재 적용 엔드포인트:
 * <ul>
 *   <li>{@code POST /api/v1/admin/mappings/{id}/checkout-same-day}
 *       (operation = {@value AdminRequestIdempotency#OPERATION_CHECKOUT_SAME_DAY})</li>
 * </ul>
 *
 * <p>TTL 운영: {@code created_at} 기반 5 분 만료. 별도 cleanup 스케줄러로 주기 정리한다 (운영팀 가이드).
 * 본 엔티티는 회복 시나리오용 audit log 역할도 겸하므로 soft delete 를 사용하지 않고 직접 hard delete 로 정리한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Entity
@Table(
        name = "admin_request_idempotency",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_admin_request_idempotency_tenant_request",
                        columnNames = {"tenant_id", "request_id"})
        },
        indexes = {
                @Index(name = "idx_admin_request_idempotency_created_at", columnList = "created_at"),
                @Index(
                        name = "idx_admin_request_idempotency_operation_mapping",
                        columnList = "tenant_id, operation, mapping_id")
        }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRequestIdempotency extends BaseEntity {

    /** {@code AdminServiceImpl#checkoutSameDayCard} 호출 식별자. */
    public static final String OPERATION_CHECKOUT_SAME_DAY = "CHECKOUT_SAME_DAY";

    /**
     * 클라이언트 요청 ID (Idempotency Key).
     * 헤더 {@code X-Request-Id} 값. 컨트롤러에서 누락 시 UUID 자동 생성.
     */
    @Column(name = "request_id", nullable = false, length = 100)
    private String requestId;

    /**
     * 멱등성을 보장할 어드민 오퍼레이션 식별자 (예: {@link #OPERATION_CHECKOUT_SAME_DAY}).
     */
    @Column(name = "operation", nullable = false, length = 64)
    private String operation;

    /**
     * 대상 매칭 ID (operation 별 컨텍스트). 매칭과 무관한 op 의 경우 null.
     */
    @Column(name = "mapping_id")
    private Long mappingId;

    /**
     * 처리 결과 status (예: SUCCESS / IN_PROGRESS / FAILED). 운영 분석용.
     */
    @Column(name = "result_status", length = 32)
    private String resultStatus;

    /**
     * 만료 기준 시점 (생성 + TTL). cleanup 스케줄러에서 사용.
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
