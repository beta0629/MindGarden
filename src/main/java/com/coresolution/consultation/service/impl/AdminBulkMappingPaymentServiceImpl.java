package com.coresolution.consultation.service.impl;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.LongConsumer;
import java.util.regex.Pattern;

import com.coresolution.consultation.constant.admin.AdminBulkMappingConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.admin.BulkMappingPaymentResult;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.exception.MappingAlreadyProcessedException;
import com.coresolution.consultation.exception.RefundLedgerNotRecordedException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AdminBulkMappingPaymentService;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.support.DeferredExternalCalls;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 관리자 일괄 매칭 결제 확인·취소 구현.
 *
 * <p>이 빈에는 트랜잭션 선언을 두지 않는다. {@code NOT_SUPPORTED} 도 동기화 구간을 열어 조회 중 바인딩된
 * EntityManager 가 커넥션을 구간 끝까지 쥐므로, 외부 알림 시점에 커넥션 점유가 0 이 되지 않는다.
 * 매칭마다 {@link AdminService} 프록시를 통해 독립 트랜잭션으로 처리하고, 그 안에서 등록된 외부 알림은
 * {@link DeferredExternalCalls} 로 커밋·커넥션 반환 뒤에 보낸다.
 * 일괄 취소는 원장(재무 전표) 환불만 하며 PG(PortOne) 를 호출하지 않는다 — 쇼핑 주문 결제 매칭은 사전 검증에서 거부.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminBulkMappingPaymentServiceImpl implements AdminBulkMappingPaymentService {

    private static final Pattern DIGITS = Pattern.compile("\\d{1,18}");

    private final AdminService adminService;
    private final ConsultantClientMappingRepository mappingRepository;

    @Override
    public BulkMappingPaymentResult cancelMappings(List<Long> mappingIds, String reason) {
        for (ConsultantClientMapping mapping : loadAll(mappingIds)) {
            if (mapping.getStatus() == MappingStatus.TERMINATED || mapping.getStatus() == MappingStatus.CANCELLED) {
                throw new MappingAlreadyProcessedException(mapping.getId(), null,
                        MappingAlreadyProcessedException.Reason.ALREADY_CLOSED,
                        AdminServiceUserFacingMessages.MSG_MAPPING_ALREADY_TERMINATED);
            }
        }
        for (Long mappingId : mappingIds) {
            if (adminService.requiresShopOrderRefund(mappingId)) {
                throw new MappingAlreadyProcessedException(mappingId, null,
                        MappingAlreadyProcessedException.Reason.SHOP_ORDER_REFUND_REQUIRED,
                        AdminServiceUserFacingMessages.MSG_BULK_CANCEL_SHOP_ORDER_REFUND_REQUIRED);
            }
        }
        return execute(mappingIds, id -> adminService.terminateMapping(id, reason));
    }

    @Override
    public BulkMappingPaymentResult confirmMappings(List<Long> mappingIds, String paymentMethod, Object rawAmount) {
        if (!StringUtils.hasText(paymentMethod)) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_BULK_CONFIRM_PAYMENT_METHOD_REQUIRED);
        }
        long amount = parsePositiveAmount(rawAmount);
        List<ConsultantClientMapping> mappings = loadAll(mappingIds);
        for (ConsultantClientMapping mapping : mappings) {
            if (mapping.getStatus() != MappingStatus.PENDING_PAYMENT) {
                throw new MappingAlreadyProcessedException(mapping.getId(),
                        AdminServiceUserFacingMessages.MSG_BULK_CONFIRM_NOT_PENDING_PAYMENT);
            }
        }
        Map<Long, Long> amounts = resolvePerMappingAmounts(mappings, amount);
        String paymentReference = AdminBulkMappingConstants.BULK_CONFIRM_PAYMENT_REFERENCE_PREFIX
                + System.currentTimeMillis();
        return execute(mappingIds, id -> adminService.confirmPendingPayment(id, paymentMethod, paymentReference,
                amounts.get(id)));
    }

    /**
     * 1건이면 요청 금액, 2건 이상이면 각 매칭 패키지 금액(합계가 요청 금액과 같아야 함).
     */
    private static Map<Long, Long> resolvePerMappingAmounts(List<ConsultantClientMapping> mappings, long amount) {
        Map<Long, Long> amounts = new HashMap<>();
        if (mappings.size() == 1) {
            amounts.put(mappings.get(0).getId(), amount);
            return amounts;
        }
        long sum = 0L;
        for (ConsultantClientMapping mapping : mappings) {
            Long price = mapping.getPackagePrice();
            if (price == null || price <= 0) {
                throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_BULK_CONFIRM_AMOUNT_MISMATCH);
            }
            try {
                sum = Math.addExact(sum, price);
            } catch (ArithmeticException e) {
                throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_BULK_CONFIRM_AMOUNT_MISMATCH);
            }
            amounts.put(mapping.getId(), price);
        }
        if (sum != amount) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_BULK_CONFIRM_AMOUNT_MISMATCH);
        }
        return amounts;
    }

    private List<ConsultantClientMapping> loadAll(List<Long> mappingIds) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<ConsultantClientMapping> mappings = new ArrayList<>(mappingIds.size());
        for (Long mappingId : mappingIds) {
            mappings.add(mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            AdminServiceUserFacingMessages.MSG_MAPPING_NOT_FOUND)));
        }
        return mappings;
    }

    /**
     * 매칭마다 독립 트랜잭션으로 처리한다. 다른 요청이 먼저 처리한 매칭(409)은 건너뛰고,
     * 그 밖의 실패가 나면 그 매칭부터 나머지는 처리하지 않는다.
     */
    private static BulkMappingPaymentResult execute(List<Long> mappingIds, LongConsumer action) {
        List<Long> processed = new ArrayList<>();
        List<Long> skipped = new ArrayList<>();
        for (int i = 0; i < mappingIds.size(); i++) {
            Long mappingId = mappingIds.get(i);
            try {
                DeferredExternalCalls.run(() -> action.accept(mappingId));
                processed.add(mappingId);
            } catch (MappingAlreadyProcessedException e) {
                log.info("일괄 처리 — 이미 처리된 매칭 건너뜀: mappingId={}, reason={}", mappingId, e.getReason());
                skipped.add(mappingId);
            } catch (RuntimeException e) {
                log.error("일괄 처리 실패로 중단: mappingId={}, error={}", mappingId, e.getClass().getSimpleName(), e);
                RefundLedgerNotRecordedException ledgerFailure = e instanceof RefundLedgerNotRecordedException r
                        ? r : null;
                return BulkMappingPaymentResult.builder()
                        .processedMappingIds(processed)
                        .skippedMappingIds(skipped)
                        .failedMappingId(mappingId)
                        .notProcessedMappingIds(new ArrayList<>(mappingIds.subList(i + 1, mappingIds.size())))
                        .failureCode(ledgerFailure != null ? RefundLedgerNotRecordedException.ERROR_CODE : null)
                        .failureMessage(ledgerFailure != null ? ledgerFailure.getMessage() : null)
                        .build();
            }
        }
        return BulkMappingPaymentResult.builder()
                .processedMappingIds(processed)
                .skippedMappingIds(skipped)
                .notProcessedMappingIds(List.of())
                .build();
    }

    private static long parsePositiveAmount(Object raw) {
        long amount;
        if (raw instanceof Integer || raw instanceof Long || raw instanceof Short) {
            amount = ((Number) raw).longValue();
        } else if (raw instanceof BigInteger big && big.bitLength() < Long.SIZE) {
            amount = big.longValue();
        } else if (raw instanceof String text && DIGITS.matcher(text.trim()).matches()) {
            amount = Long.parseLong(text.trim());
        } else {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_BULK_CONFIRM_AMOUNT_INVALID);
        }
        if (amount <= 0) {
            throw new IllegalArgumentException(AdminServiceUserFacingMessages.MSG_BULK_CONFIRM_AMOUNT_INVALID);
        }
        return amount;
    }
}
