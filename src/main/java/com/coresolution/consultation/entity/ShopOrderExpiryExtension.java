package com.coresolution.consultation.entity;

import java.time.LocalDate;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 쇼핑 주문 사용 기한 연장 이력 (append-only). 최신 행의 {@code newExpireDate} 가 유효 만료일이다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@Entity
@Table(name = "shop_order_expiry_extensions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopOrderExpiryExtension extends BaseEntity {

    @Column(name = "order_public_id", nullable = false, length = 36)
    private String orderPublicId;

    @Column(name = "previous_expire_date", nullable = false)
    private LocalDate previousExpireDate;

    @Column(name = "new_expire_date", nullable = false)
    private LocalDate newExpireDate;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @Column(name = "extended_by_user_id")
    private Long extendedByUserId;
}
