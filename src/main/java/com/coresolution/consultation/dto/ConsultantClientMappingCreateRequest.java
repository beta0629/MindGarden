package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사-내담자 매핑 생성 요청 DTO
 *
 * <p>P0 핫픽스 2026-05-28: CheckoutSameDayModal 자동 진입 NPE 방어를 위해
 * 컨트롤러 단계에서 packageName / totalSessions / packagePrice 누락을 차단한다.
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md
 *
 * @author MindGarden
 * @version 1.1.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantClientMappingCreateRequest {

    @NotNull(message = "상담사 ID는 필수입니다.")
    private Long consultantId;

    @NotNull(message = "내담자 ID는 필수입니다.")
    private Long clientId;

    private LocalDate startDate;

    private LocalDate endDate;

    private String status;

    private String notes;

    private String responsibility;

    private String specialConsiderations;

    private String assignedBy;

    // 입금 승인 시스템 관련 필드
    private String paymentStatus;

    @NotNull(message = "회기 수는 필수입니다.")
    @Min(value = 1, message = "회기 수는 1 이상이어야 합니다.")
    private Integer totalSessions;

    private Integer remainingSessions;

    @NotBlank(message = "패키지명은 필수입니다.")
    private String packageName;

    @NotNull(message = "패키지 가격은 필수입니다.")
    @Min(value = 1, message = "패키지 가격은 1 이상이어야 합니다.")
    private Long packagePrice;

    private Long paymentAmount;

    private String paymentMethod;

    private String paymentReference;

    private LocalDateTime paymentDate;

    private String approvedBy;

    // 매핑 생성 시 필요한 정보
    private String mappingType; // "NEW", "EXTENSION", "TRANSFER"

    private String paymentConfirmationNote; // 입금 확인 메모

    /**
     * 옵션 B 결제 방식 의도 (선택값).
     * <ul>
     *   <li>ADVANCE — 선납 입금 (기본/현행)</li>
     *   <li>SAME_DAY_CARD — 당일 방문 시 카드 결제 + 활성화 (옵션 B)</li>
     *   <li>null — 레거시/명시되지 않음 (서비스에서 ADVANCE 와 동등 취급)</li>
     * </ul>
     */
    private String paymentTiming;
}

