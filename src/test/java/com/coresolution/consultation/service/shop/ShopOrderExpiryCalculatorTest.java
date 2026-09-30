package com.coresolution.consultation.service.shop;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderExpiryConstants;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ShopOrderExpiryCalculator — 사용 기한 조회 시 판정")
class ShopOrderExpiryCalculatorTest {

    private static final LocalDate PAID = LocalDate.of(2026, 9, 28);

    @Test
    @DisplayName("만료일 당일은 아직 사용 가능 (당일 포함) · 만료 임박 D-0")
    void expireDay_isInclusive() {
        ShopOrderExpiryCalculator.Result r = ShopOrderExpiryCalculator.evaluate(
                ShopClientOrderStatus.PAID, PAID, List.of(3), null, 0, LocalDate.of(2026, 12, 28));
        assertEquals(LocalDate.of(2026, 12, 28), r.expireDate());
        assertEquals(0L, r.daysLeft());
        assertEquals(ShopOrderExpiryConstants.STATE_EXPIRING_SOON, r.state());
        assertTrue(r.sessionsUsable());
    }

    @Test
    @DisplayName("만료일 다음 날은 기한 만료 · 회기 사용 불가")
    void dayAfterExpire_isExpired() {
        ShopOrderExpiryCalculator.Result r = ShopOrderExpiryCalculator.evaluate(
                ShopClientOrderStatus.PAID, PAID, List.of(3), null, 0, LocalDate.of(2026, 12, 29));
        assertEquals(ShopOrderExpiryConstants.STATE_EXPIRED, r.state());
        assertEquals(-1L, r.daysLeft());
        assertFalse(r.sessionsUsable());
    }

    @Test
    @DisplayName("7일 초과 남으면 ACTIVE, 7일 이내면 EXPIRING_SOON")
    void expiringSoonBoundary() {
        LocalDate expire = PAID.plusMonths(1);
        assertEquals(ShopOrderExpiryConstants.STATE_ACTIVE, ShopOrderExpiryCalculator.evaluate(
                ShopClientOrderStatus.PAID, PAID, List.of(1), null, 0, expire.minusDays(8)).state());
        assertEquals(ShopOrderExpiryConstants.STATE_EXPIRING_SOON, ShopOrderExpiryCalculator.evaluate(
                ShopClientOrderStatus.PAID, PAID, List.of(1), null, 0, expire.minusDays(7)).state());
    }

    @Test
    @DisplayName("스냅샷 없는 기존 주문은 기한 없음 (현재 상품 값 소급 금지)")
    void noSnapshot_hasNoExpiry() {
        ShopOrderExpiryCalculator.Result r = ShopOrderExpiryCalculator.evaluate(
                ShopClientOrderStatus.PAID, PAID, Arrays.asList(null, null), null, 0, LocalDate.of(2030, 1, 1));
        assertEquals(ShopOrderExpiryConstants.STATE_NONE, r.state());
        assertNull(r.expireDate());
        assertTrue(r.sessionsUsable());
    }

    @Test
    @DisplayName("PAID 가 아니면 기한 없음")
    void notPaid_hasNoExpiry() {
        ShopOrderExpiryCalculator.Result r = ShopOrderExpiryCalculator.evaluate(
                ShopClientOrderStatus.REFUNDED, PAID, List.of(3), null, 0, LocalDate.of(2030, 1, 1));
        assertEquals(ShopOrderExpiryConstants.STATE_NONE, r.state());
    }

    @Test
    @DisplayName("연장 후 새 만료일로 판정 · 다시 사용 가능 · 원래 만료일 유지")
    void extension_overridesExpire() {
        LocalDate extended = LocalDate.of(2027, 3, 1);
        ShopOrderExpiryCalculator.Result r = ShopOrderExpiryCalculator.evaluate(
                ShopClientOrderStatus.PAID, PAID, List.of(3), extended, 1, LocalDate.of(2027, 1, 10));
        assertEquals(ShopOrderExpiryConstants.STATE_ACTIVE, r.state());
        assertEquals(extended, r.expireDate());
        assertEquals(LocalDate.of(2026, 12, 28), r.originalExpireDate());
        assertEquals(1, r.extensionCount());
        assertTrue(r.sessionsUsable());
    }

    @Test
    @DisplayName("여러 라인이면 가장 긴 유효기간 · 상한 없음")
    void multipleLines_useMaxMonths() {
        ShopOrderExpiryCalculator.Result r = ShopOrderExpiryCalculator.evaluate(
                ShopClientOrderStatus.PAID, PAID, Arrays.asList(1, null, 24), null, 0, PAID);
        assertEquals(24, r.validityMonths());
        assertEquals(PAID.plusMonths(24), r.expireDate());
    }
}
