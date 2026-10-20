package com.coresolution.consultation.service.portone;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.Optional;

/**
 * 쇼핑 주문 PortOne PAID 정합 검증 결과.
 * <p>
 * {@link PortOneShopPaidMatchResult#MATCH} 이면 {@code body}·{@code actualPaidAmount} 가 채워진다.
 * {@link PortOneShopPaidMatchResult#MISMATCH} 이면 가능하면 {@code actualPaidAmount}(PortOne {@code amount.paid})
 * 를 포함해 환불에 쓰고, {@code body} 는 있을 때만 채운다.
 * {@link PortOneShopPaidMatchResult#UNKNOWN} 은 필드를 비운다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-10-16
 */
public final class PortOneShopPaidMatch {

    private final PortOneShopPaidMatchResult result;
    private final String body;
    private final BigDecimal actualPaidAmount;

    private PortOneShopPaidMatch(
            PortOneShopPaidMatchResult result, String body, BigDecimal actualPaidAmount) {
        this.result = Objects.requireNonNull(result, "result");
        this.body = body;
        this.actualPaidAmount = actualPaidAmount;
    }

    /**
     * 정합 성공.
     *
     * @param body             PortOne REST JSON
     * @param actualPaidAmount PortOne {@code amount.paid}
     * @return MATCH 결과
     */
    public static PortOneShopPaidMatch match(String body, BigDecimal actualPaidAmount) {
        Objects.requireNonNull(body, "body");
        Objects.requireNonNull(actualPaidAmount, "actualPaidAmount");
        return new PortOneShopPaidMatch(PortOneShopPaidMatchResult.MATCH, body, actualPaidAmount);
    }

    /**
     * PAID 이지만 금액·통화·주문·paymentId 불일치.
     *
     * @param body             REST JSON (없으면 null)
     * @param actualPaidAmount PortOne {@code amount.paid} (파싱 가능하면 필수에 가깝게)
     * @return MISMATCH 결과
     */
    public static PortOneShopPaidMatch mismatch(String body, BigDecimal actualPaidAmount) {
        return new PortOneShopPaidMatch(PortOneShopPaidMatchResult.MISMATCH, body, actualPaidAmount);
    }

    /**
     * 검증 불가(조회 실패·일시 미승인 등). 취소하지 않는다.
     *
     * @return UNKNOWN 결과
     */
    public static PortOneShopPaidMatch unknown() {
        return new PortOneShopPaidMatch(PortOneShopPaidMatchResult.UNKNOWN, null, null);
    }

    /**
     * @return 삼상 결과
     */
    public PortOneShopPaidMatchResult getResult() {
        return result;
    }

    /**
     * @return MATCH 시 REST body. MISMATCH 는 있을 때만.
     */
    public Optional<String> getBody() {
        return Optional.ofNullable(body);
    }

    /**
     * @return PortOne {@code amount.paid} (MATCH 필수, MISMATCH 는 파싱 시)
     */
    public Optional<BigDecimal> getActualPaidAmount() {
        return Optional.ofNullable(actualPaidAmount);
    }

    /**
     * @return MATCH 여부
     */
    public boolean isMatch() {
        return result == PortOneShopPaidMatchResult.MATCH;
    }

    /**
     * @return MISMATCH 여부
     */
    public boolean isMismatch() {
        return result == PortOneShopPaidMatchResult.MISMATCH;
    }

    /**
     * @return UNKNOWN 여부
     */
    public boolean isUnknown() {
        return result == PortOneShopPaidMatchResult.UNKNOWN;
    }
}
