package com.coresolution.consultation.service.shop;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.consultation.util.MappingPartialRefundLedger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 쇼핑 주문 PG 환불 가능 잔액 = 결제액 − 매핑 측 기환불액 − PG 기취소액.
 *
 * <ul>
 *   <li>매핑 측 기환불액: 주문 라인에 연결된 매핑의 활성 부분 환불 EXPENSE 합 (tenantId 스코프,
 *       해당 결제 승인 이전 생성분 제외)</li>
 *   <li>PG 기취소액: PortOne {@code amount.cancelled} (IAMPORT). 조회 실패 시 0 으로 보고 PortOne 이
 *       취소 가능 잔액을 넘는 요청을 거부하는 것에 맡긴다</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ShopOrderRefundableAmountResolver {

    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    private final PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;

    /**
     * 환불 잔액 판정 결과.
     *
     * @param paidAmount            결제액
     * @param mappingRefundedAmount 매핑 측 기환불액
     * @param pgCancelledAmount     PG 기취소액
     */
    public record RefundableAmount(long paidAmount, long mappingRefundedAmount, long pgCancelledAmount) {

        /**
         * @return 이미 환불된 금액 합
         */
        public long alreadyRefundedAmount() {
            return mappingRefundedAmount + pgCancelledAmount;
        }

        /**
         * @return PG 로 환불할 수 있는 잔액 (0 이상)
         */
        public long remainingAmount() {
            return Math.max(0L, paidAmount - alreadyRefundedAmount());
        }

        /**
         * @return 잔액 없음
         */
        public boolean isExhausted() {
            return remainingAmount() <= 0L;
        }

        /**
         * @return 기환불 없이 결제액 전액이 남음 (전액 취소 경로)
         */
        public boolean isFullAmount() {
            return alreadyRefundedAmount() <= 0L;
        }
    }

    /**
     * 주문·결제의 PG 환불 잔액을 계산한다. PortOne 조회가 있으므로 DB 트랜잭션 밖 호출을 권장한다.
     *
     * @param tenantId 테넌트 ID
     * @param order    주문 (tenantId 로 조회된 행)
     * @param payment  환불 대상 결제
     * @return 환불 잔액
     */
    public RefundableAmount resolve(String tenantId, ShopClientOrder order, Payment payment) {
        long paid = payment != null && payment.getAmount() != null ? payment.getAmount().longValue() : 0L;
        long mappingRefunded = sumMappingSideRefunded(tenantId, order, payment);
        long pgCancelled = resolvePgCancelledAmount(tenantId, payment);
        RefundableAmount result = new RefundableAmount(paid, mappingRefunded, pgCancelled);
        if (!result.isFullAmount()) {
            log.info(
                    "쇼핑 주문 환불 잔액: tenantId={}, orderPublicId={}, paid={}, mappingRefunded={}, "
                            + "pgCancelled={}, remaining={}",
                    tenantId,
                    order != null ? order.getPublicId() : null,
                    paid,
                    mappingRefunded,
                    pgCancelled,
                    result.remainingAmount());
        }
        return result;
    }

    private long sumMappingSideRefunded(String tenantId, ShopClientOrder order, Payment payment) {
        if (tenantId == null || tenantId.isBlank() || order == null || order.getId() == null) {
            return 0L;
        }
        Set<Long> mappingIds = new LinkedHashSet<>();
        for (ShopClientOrderLine line
                : shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId())) {
            if (line != null && line.getConsultantClientMappingId() != null) {
                mappingIds.add(line.getConsultantClientMappingId());
            }
        }
        long total = 0L;
        for (Long mappingId : mappingIds) {
            total += MappingPartialRefundLedger.sumActivePartialRefundAmount(
                    financialTransactionRepository
                            .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeStartingWithAndIsDeletedFalse(
                                    tenantId,
                                    mappingId,
                                    FinancialTransactionConstants
                                            .RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND),
                    payment != null ? payment.getApprovedAt() : null);
        }
        return total;
    }

    private long resolvePgCancelledAmount(String tenantId, Payment payment) {
        if (payment == null || payment.getPaymentId() == null
                || !portOneV2PaymentVerifyService.isIamportPayment(payment)) {
            return 0L;
        }
        return portOneV2PaymentCancelService.fetchCancelledAmount(tenantId, payment.getPaymentId())
                .map(BigDecimal::longValue)
                .filter(amount -> amount > 0L)
                .orElse(0L);
    }
}
