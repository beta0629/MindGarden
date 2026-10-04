package com.coresolution.consultation.service.impl;

import java.util.Optional;

import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.MappingTerminationService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 매칭 단건 강제 종료 — 트랜잭션 없음. 경로 판정(읽기 트랜잭션)과 실제 종료(각자 트랜잭션)를 순서대로 부른다.
 *
 * <p>Path B 매칭은 CANCELLED 로 전이하지 않는다. 주문 환불이 회기 원복·EXPENSE·paymentStatus REFUNDED 를 맡는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MappingTerminationServiceImpl implements MappingTerminationService {

    private final AdminService adminService;
    private final AdminShopOrderRefundService adminShopOrderRefundService;

    @Override
    public void terminate(Long mappingId, String reason) {
        Optional<String> orderPublicId = adminService.findTerminationShopOrderPublicId(mappingId);
        if (orderPublicId.isEmpty()) {
            adminService.terminateMapping(mappingId, reason);
            return;
        }
        String reasonCode = ShopRefundConstants.REASON_CUSTOMER_REQUEST;
        log.info("🛒 Path B 매칭 종료 → 쇼핑 주문 환불 위임: mappingId={}, orderPublicId={}, reasonCode={}",
                mappingId, orderPublicId.get(), reasonCode);
        adminShopOrderRefundService.refundPaidOrder(
                TenantContextHolder.getRequiredTenantId(), orderPublicId.get(), reasonCode);
        log.info("✅ Path B 매칭 종료(쇼핑 환불) 완료 — CANCELLED 미전이: mappingId={}, orderPublicId={}",
                mappingId, orderPublicId.get());
    }
}
