package com.coresolution.consultation.dto.shop.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 주문 목록 요약 스트립·합계 (기간·검색 적용, 세그먼트 적용 전).
 *
 * <p>돈 = 결제 완료(만료 임박·기한 만료 포함) − 환불. 회기 = 활성 부여 − 원복, 기한 만료 회기는 별도.
 * 결제 대기·정합 필요·미결제는 돈과 회기 모두 제외.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderAdminListSummary {

    private long inAmount;
    private long inCount;
    private long inPoints;
    private long inSessions;
    private long expiredSessions;
    private long outAmount;
    private long outCount;
    private long outSessions;
    private long pendingCount;
    private long reconcileCount;
    private long expiringSoonCount;
    private long netAmount;
}
