package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 테넌트별 카카오 알림톡 비시크릿 설정 (템플릿 코드·기능 on/off·시크릿 참조 ID만).
 * {@code tenant_id}는 {@link AuditableTenantBase} 단일 매핑을 사용한다.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@Entity
@Table(
    name = "tenant_kakao_alimtalk_settings",
    uniqueConstraints = @UniqueConstraint(name = "uk_tenant_kakao_alimtalk_tenant", columnNames = "tenant_id"),
    indexes = {
        @Index(name = "idx_tkas_tenant_deleted", columnList = "tenant_id,is_deleted")
    }
)
@Data
public class TenantKakaoAlimtalkSettings extends BaseEntity {

    @NotNull
    @Column(name = "alimtalk_enabled", nullable = false)
    private Boolean alimtalkEnabled = Boolean.TRUE;

    @Size(max = 120)
    @Column(name = "template_consultation_confirmed", length = 120)
    private String templateConsultationConfirmed;

    @Size(max = 120)
    @Column(name = "template_consultation_reminder", length = 120)
    private String templateConsultationReminder;

    @Size(max = 120)
    @Column(name = "template_consultation_cancelled", length = 120)
    private String templateConsultationCancelled;

    @Size(max = 120)
    @Column(name = "template_refund_completed", length = 120)
    private String templateRefundCompleted;

    @Size(max = 120)
    @Column(name = "template_schedule_changed", length = 120)
    private String templateScheduleChanged;

    @Size(max = 120)
    @Column(name = "template_payment_completed", length = 120)
    private String templatePaymentCompleted;

    @Size(max = 120)
    @Column(name = "template_deposit_pending_reminder", length = 120)
    private String templateDepositPendingReminder;

    @Size(max = 200)
    @Column(name = "kakao_api_key_ref", length = 200)
    private String kakaoApiKeyRef;

    @Size(max = 200)
    @Column(name = "kakao_sender_key_ref", length = 200)
    private String kakaoSenderKeyRef;
}
