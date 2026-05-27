package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 옵션 B (예약 우선 매칭) 당일 카드 결제 요청 DTO.
 * <p>
 * 합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 * 사후 카드 결제 흐름에서 PENDING_PAYMENT 매핑 1건을 받아 결제 정보를 입력하면
 * confirmPayment + confirmDeposit + approveMapping이 단일 트랜잭션으로 자동 실행되어
 * 매핑이 ACTIVE(또는 단회기 소진 시 SESSIONS_EXHAUSTED)로 전이된다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutSameDayRequest {

    @NotBlank(message = "결제 방식은 필수입니다.")
    private String paymentMethod;

    @NotBlank(message = "결제 승인번호는 필수입니다.")
    private String paymentReference;

    @NotNull(message = "결제 금액은 필수입니다.")
    @Positive(message = "결제 금액은 0보다 커야 합니다.")
    private Long paymentAmount;

    /**
     * 당일 가예약 일정 ID (옵션).
     * confirmDeposit 내부의 finalizeTentativeBookingsAfterDepositPhase4b()가 매핑의
     * TENTATIVE_PENDING_PAYMENT 일정 중 첫 1건을 자동으로 BOOKED 전환하므로 본 필드는
     * 향후 특정 일정 우선 확정 등 확장용 메타데이터로 사용된다.
     */
    private Long sameDaySessionScheduleId;
}
