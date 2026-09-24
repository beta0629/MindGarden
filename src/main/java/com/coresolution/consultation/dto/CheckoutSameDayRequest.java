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
     * 당일 세션 일정 ID (옵션).
     * <p>
     * confirmDeposit 이후 회기 부여·라벨 배치 차감이 끝난 뒤, 지정된 일정에 대해
     * {@code useSessionForSpecificMapping} 으로 잔여 회기를 타겟 차감한다
     * (이미 sessionSequence 가 있는 COMPLETED/BOOKED 등 — 멱등).
     * null 이면 매핑 단위 라벨 배치 차감만 수행한다.
     */
    private Long sameDaySessionScheduleId;
}
