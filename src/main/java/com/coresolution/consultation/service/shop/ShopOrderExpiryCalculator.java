package com.coresolution.consultation.service.shop;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderExpiryConstants;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Objects;

/**
 * 쇼핑 주문 사용 기한 판정 (순수 계산).
 *
 * <p>만료일 = 결제일 + 라인 스냅샷 개월 중 최댓값, 당일 포함. 스냅샷이 하나도 없으면 기한 없음이며
 * 현재 상품 값을 소급하지 않는다. 연장 이력이 있으면 최신 새 만료일이 유효 만료일이다.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public final class ShopOrderExpiryCalculator {

    private ShopOrderExpiryCalculator() {
    }

    /**
     * 판정 결과.
     *
     * @param state              {@link ShopOrderExpiryConstants} STATE_*
     * @param originalExpireDate 결제일 기준 만료일 (없으면 null)
     * @param expireDate         유효 만료일 (연장 반영, 없으면 null)
     * @param daysLeft           오늘부터 만료일까지 남은 일수 (지났으면 음수, 없으면 null)
     * @param validityMonths     적용 유효기간 개월 (없으면 null)
     * @param extensionCount     연장 횟수
     */
    public record Result(
            String state,
            LocalDate originalExpireDate,
            LocalDate expireDate,
            Long daysLeft,
            Integer validityMonths,
            int extensionCount) {

        /**
         * @return 남은 회기를 사용할 수 있는 상태면 true (기한 없음 포함)
         */
        public boolean sessionsUsable() {
            return !ShopOrderExpiryConstants.STATE_EXPIRED.equals(state);
        }
    }

    /**
     * 사용 기한을 판정한다.
     *
     * @param status                  주문 상태 (PAID 가 아니면 기한 없음)
     * @param paidDate                결제일 (없으면 기한 없음)
     * @param lineValidityMonths      라인 유효기간 스냅샷 (null 요소는 무시)
     * @param latestExtendedExpireDate 최신 연장의 새 만료일 (없으면 null)
     * @param extensionCount          연장 횟수
     * @param today                   기준일
     * @return 판정 결과
     */
    public static Result evaluate(
            ShopClientOrderStatus status,
            LocalDate paidDate,
            Collection<Integer> lineValidityMonths,
            LocalDate latestExtendedExpireDate,
            int extensionCount,
            LocalDate today) {
        Integer months = resolveMonths(lineValidityMonths);
        if (status != ShopClientOrderStatus.PAID || paidDate == null || months == null) {
            return new Result(ShopOrderExpiryConstants.STATE_NONE, null, null, null, months, extensionCount);
        }
        LocalDate original = paidDate.plusMonths(months);
        LocalDate effective = latestExtendedExpireDate != null ? latestExtendedExpireDate : original;
        long daysLeft = ChronoUnit.DAYS.between(today, effective);
        String state;
        if (daysLeft < 0) {
            state = ShopOrderExpiryConstants.STATE_EXPIRED;
        } else if (daysLeft <= ShopOrderExpiryConstants.EXPIRING_SOON_DAYS) {
            state = ShopOrderExpiryConstants.STATE_EXPIRING_SOON;
        } else {
            state = ShopOrderExpiryConstants.STATE_ACTIVE;
        }
        return new Result(state, original, effective, daysLeft, months, extensionCount);
    }

    private static Integer resolveMonths(Collection<Integer> lineValidityMonths) {
        if (lineValidityMonths == null) {
            return null;
        }
        return lineValidityMonths.stream()
                .filter(Objects::nonNull)
                .filter(m -> m > 0)
                .max(Integer::compareTo)
                .orElse(null);
    }
}
