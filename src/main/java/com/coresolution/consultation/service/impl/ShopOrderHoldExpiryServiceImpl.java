package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.ShopOrderHoldExpiryService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * hold TTL 경과 미결제 주문 만료(EXPIRED + 포인트 hold 해제).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShopOrderHoldExpiryServiceImpl implements ShopOrderHoldExpiryService {

    private static final EnumSet<ShopClientOrderStatus> HOLD_EXPIRY_STATUSES =
            EnumSet.of(ShopClientOrderStatus.CREATED, ShopClientOrderStatus.PENDING_PAYMENT);

    private final ShopClientOrderRepository shopClientOrderRepository;
    private final PointTenantPolicyService pointTenantPolicyService;
    private final ClientShopCheckoutService clientShopCheckoutService;
    private final TenantService tenantService;

    @Override
    public int expireStaleHoldsForTenant(String tenantId) {
        String tid = requireTenant(tenantId);
        EffectivePointTenantPolicies policies = pointTenantPolicyService.getEffectivePoliciesTyped(tid);
        int ttlMinutes = policies.holdTtlMinutes();
        if (ttlMinutes <= 0) {
            log.debug("hold TTL 비활성(tenantId={}, minutes={})", tid, ttlMinutes);
            return 0;
        }
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(ttlMinutes);
        List<ShopClientOrder> targets = shopClientOrderRepository.findHoldExpiredOrders(
                tid, HOLD_EXPIRY_STATUSES, cutoff);
        int expired = 0;
        for (ShopClientOrder order : targets) {
            if (clientShopCheckoutService.expireOrderHold(tid, order.getPublicId())) {
                expired++;
            }
        }
        if (expired > 0) {
            log.info("쇼핑 주문 hold TTL 만료 처리: tenantId={}, count={}", tid, expired);
        }
        return expired;
    }

    @Override
    public int expireStaleHoldsForAllActiveTenants() {
        List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
        if (activeTenantIds.isEmpty()) {
            log.debug("hold TTL 만료 스킵: 활성 테넌트 없음");
            return 0;
        }
        int total = 0;
        for (String tenantId : activeTenantIds) {
            try {
                TenantContextHolder.setTenantId(tenantId);
                total += expireStaleHoldsForTenant(tenantId);
            } catch (Exception e) {
                log.error("hold TTL 만료 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
            } finally {
                TenantContextHolder.clear();
            }
        }
        return total;
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }
}
