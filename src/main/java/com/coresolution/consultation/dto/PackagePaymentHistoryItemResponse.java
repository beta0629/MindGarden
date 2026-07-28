package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내담자 패키지 결제 이력 타임라인 1건.
 *
 * @author MindGarden
 * @since 2026-07-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackagePaymentHistoryItemResponse {

    /** 이력 유형 코드 */
    private PackagePaymentHistoryType type;

    /** 결제일(없으면 생성일) */
    private LocalDateTime paymentDate;

    /** 패키지명 */
    private String packageName;

    /** 회기 수(매핑 totalSessions 또는 회기추가 additionalSessions) */
    private Integer sessions;

    /** 금액 */
    private BigDecimal amount;

    /** 매핑/연장 상태 코드 */
    private String status;

    /** 결제 상태 코드(매핑 전용, 없으면 null) */
    private String paymentStatus;

    /** 담당 상담사 ID */
    private Long consultantId;

    /** 담당 상담사명(복호화) */
    private String consultantName;

    /** 매핑 ID(매핑 행·회기추가 대상 매핑) */
    private Long mappingId;

    /** 회기추가 요청 ID */
    private Long extensionRequestId;

    /** 추가 패키지 타깃 ACTIVE 매핑 ID */
    private Long targetActiveMappingId;

    /** 결제 수단(관리자) */
    private String paymentMethod;

    /** 결제 참조(관리자) */
    private String paymentReference;

    /** 정렬·디버그용 생성 시각 */
    private LocalDateTime createdAt;
}
