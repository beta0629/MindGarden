package com.coresolution.consultation.entity;

import java.time.LocalDate;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 방문 예측 설정 엔티티
 *
 * <p>내담자-상담사 매핑별 예측 ON/OFF 및 일시 무시(dismiss) 설정을 저장한다.
 * 경량 테이블로, 메타 테이블 없이 실시간 계산 + 이 설정 테이블만으로 운영한다.</p>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
@Entity
@Table(name = "visit_prediction_settings", indexes = {
    @Index(name = "idx_vps_tenant_mapping", columnList = "tenant_id, mapping_id"),
    @Index(name = "idx_vps_tenant_id", columnList = "tenant_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitPredictionSettings extends BaseEntity {

    /**
     * consultant_client_mappings.id 참조
     */
    @Column(name = "mapping_id", nullable = false)
    private Long mappingId;

    /**
     * 예측 활성화 여부 (false면 해당 매핑의 예측을 완전히 끈다)
     */
    @Column(name = "prediction_enabled", nullable = false)
    @Builder.Default
    private Boolean predictionEnabled = true;

    /**
     * 무시 만료일: 이 날짜(포함)까지 해당 매핑의 예상 방문 알림을 무시한다.
     * null이면 무시 설정 없음.
     */
    @Column(name = "dismissed_until_date")
    private LocalDate dismissedUntilDate;
}
