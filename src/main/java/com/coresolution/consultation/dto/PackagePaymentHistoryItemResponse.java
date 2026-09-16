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

    /**
     * 표시용 회기 수.
     * <p>최초매칭은 결제 당시(병합·승계 보정) 회기. 추가패키지·회기추가는 해당 건 회기.</p>
     */
    private Integer sessions;

    /**
     * 매핑 현재 잔여 회기(ACTIVE·SESSIONS_EXHAUSTED).
     * <p>결제 당시 {@code sessions}와 구분. 추가패키지 TERMINATED(합산 종료)는 null.</p>
     */
    private Integer remainingSessions;

    /**
     * TERMINATED 추가패키지가 활성 매핑에 합산됐는지 여부.
     * <p>true면 잔여0=소진이 아니라 병합 종료. {@code targetActiveMappingId}와 함께 표시.</p>
     */
    private Boolean mergedIntoActive;

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
