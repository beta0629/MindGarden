package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.constant.ClientRegistrationConstants;
import com.coresolution.consultation.constant.PaymentConstants;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.dto.PaymentRequest;
import com.coresolution.consultation.dto.PaymentResponse;
import com.coresolution.consultation.dto.shop.ShopCheckoutRequest;
import com.coresolution.consultation.dto.shop.ShopCheckoutResponse;
import com.coresolution.consultation.dto.shop.ShopOrderFulfillmentLineResponse;
import com.coresolution.consultation.dto.shop.ShopOrderLineResponse;
import com.coresolution.consultation.dto.shop.ShopOrderResponse;
import com.coresolution.consultation.dto.shop.ShopOrderSummaryResponse;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentRequest;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopCart;
import com.coresolution.consultation.entity.ShopCartLine;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopCartLineRepository;
import com.coresolution.consultation.repository.ShopCartRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.ClientProfilePhoneVerificationService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.ClientShopConsultantMappingService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.portone.PortOneChannelKeyResolver;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.TenantPgConfigurationDetailResponse;
import com.coresolution.core.service.TenantPgConfigurationService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 체크아웃·주문·PG intent 구현.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientShopCheckoutServiceImpl implements ClientShopCheckoutService {

    private final ShopCartRepository shopCartRepository;
    private final ShopCartLineRepository shopCartLineRepository;
    private final ShopClientOrderRepository shopClientOrderRepository;
    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final ClientPointWalletService clientPointWalletService;
    private final PointTenantPolicyService pointTenantPolicyService;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ClientProfilePhoneVerificationService clientProfilePhoneVerificationService;
    private final ShopOrderFulfillmentService shopOrderFulfillmentService;
    private final ShopOrderFulfillmentEventRepository shopOrderFulfillmentEventRepository;
    private final ClientShopConsultantMappingService clientShopConsultantMappingService;
    private final ShopNotificationHelper shopNotificationHelper;
    private final TenantPgConfigurationService tenantPgConfigurationService;

    @Override
    @Transactional
    public ShopCheckoutResponse checkout(String tenantId, Long clientUserId, ShopCheckoutRequest request) {
        Optional<ShopClientOrder> existed = shopClientOrderRepository.findByTenantClientAndCheckoutKey(
                tenantId, clientUserId, request.getIdempotencyKey());
        if (existed.isPresent()) {
            return toCheckoutResponse(existed.get());
        }

        ShopCart cart = shopCartRepository.findByTenantIdAndClientId(tenantId, clientUserId)
                .orElseThrow(() -> new IllegalArgumentException("장바구니가 비어 있습니다."));
        List<ShopCartLine> cartLines = shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId());
        if (cartLines.isEmpty()) {
            throw new IllegalArgumentException("장바구니가 비어 있습니다.");
        }

        long subtotal = 0L;
        for (ShopCartLine cl : cartLines) {
            ShopCatalogSku sku = cl.getSku();
            subtotal += sku.getUnitPriceMinor() * cl.getQuantity();
        }
        if (subtotal <= 0L) {
            throw new IllegalArgumentException("주문 금액이 유효하지 않습니다.");
        }

        EffectivePointTenantPolicies policies = pointTenantPolicyService.getEffectivePoliciesTyped(tenantId);
        long requestedPoints = Math.max(0L, request.getPointsToRedeemMinor());
        validateRedeemRequest(subtotal, requestedPoints, policies);

        var balance = clientPointWalletService.getBalance(tenantId, clientUserId);
        long maxPoints = Math.min(subtotal, balance.getAvailableMinor());
        if (policies.maxRedeemPerOrderMinor() > 0L) {
            maxPoints = Math.min(maxPoints, policies.maxRedeemPerOrderMinor());
        }
        long points = Math.min(requestedPoints, maxPoints);
        if (requestedPoints > 0L && requestedPoints > points) {
            throw new IllegalArgumentException("사용 가능한 포인트가 부족합니다.");
        }

        long cashDue = subtotal - points;
        if (cashDue == 0L && points > 0L && !policies.allowPointsOnly()) {
            throw new IllegalArgumentException("포인트만으로 결제할 수 없습니다. 카드 결제를 이용해 주세요.");
        }
        if (points > 0L && cashDue > 0L && !policies.allowPgMix()) {
            throw new IllegalArgumentException(
                    "포인트와 카드 결제를 동시에 사용할 수 없습니다. 포인트 전액 또는 카드 전액으로 결제해 주세요.");
        }
        if (cashDue > 0L && cashDue < ShopCheckoutConstants.MIN_CASH_FOR_PAYMENT_GATEWAY) {
            throw new IllegalArgumentException(ShopCheckoutConstants.msgCashBelowMinPayment());
        }

        String publicId = UUID.randomUUID().toString();
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(publicId)
                .clientId(clientUserId)
                .status(ShopClientOrderStatus.CREATED)
                .subtotalMinor(subtotal)
                .pointsRedeemMinor(points)
                .cashDueMinor(cashDue)
                .checkoutIdempotencyKey(request.getIdempotencyKey())
                .build();
        order.setTenantId(tenantId);
        order = shopClientOrderRepository.save(order);

        Long consultationMappingId = resolveConsultationMappingIdForCheckout(tenantId, clientUserId, request, cartLines);

        int lineNo = 1;
        for (ShopCartLine cl : cartLines) {
            ShopCatalogSku sku = cl.getSku();
            long lineTotal = sku.getUnitPriceMinor() * cl.getQuantity();
            Long lineMappingId = null;
            if (ShopCatalogCategory.CONSULTATION.equals(sku.getCatalogCategory())) {
                lineMappingId = consultationMappingId;
            }
            ShopClientOrderLine ol = ShopClientOrderLine.builder()
                    .clientOrder(order)
                    .lineNo(lineNo++)
                    .sku(sku)
                    .skuCodeSnapshot(sku.getSkuCode())
                    .titleSnapshot(sku.getTitle())
                    .unitPriceMinor(sku.getUnitPriceMinor())
                    .sessionCountSnapshot(resolveSessionCount(sku))
                    .quantity(cl.getQuantity())
                    .lineTotalMinor(lineTotal)
                    .consultantClientMappingId(lineMappingId)
                    .build();
            ol.setTenantId(tenantId);
            shopClientOrderLineRepository.save(ol);
        }

        if (points > 0L) {
            clientPointWalletService.hold(
                    tenantId,
                    clientUserId,
                    publicId,
                    points,
                    ShopCheckoutConstants.pointHoldKey(request.getIdempotencyKey()));
        }

        if (cashDue == 0L) {
            markOrderPaidAndCommitPoints(tenantId, order);
        }

        // 장바구니 비우기는 PAID 이행 경로(markOrderPaidAndCommitPoints)에서만 수행.
        // PG 대기(CREATED/PENDING_PAYMENT) 주문은 결제 실패·뒤로가기 시 카트가 유지되어야 한다.
        ShopClientOrder refreshed = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, publicId).orElse(order);
        return toCheckoutResponse(refreshed);
    }

    /**
     * 체크아웃 시 CONSULTATION 라인에 붙일 매핑 ID (요청 오버라이드 우선, 없으면 활성 매핑 1건).
     */
    private Long resolveConsultationMappingIdForCheckout(
            String tenantId,
            Long clientUserId,
            ShopCheckoutRequest request,
            List<ShopCartLine> cartLines) {
        boolean hasConsultation = cartLines.stream()
                .map(ShopCartLine::getSku)
                .anyMatch(sku -> ShopCatalogCategory.CONSULTATION.equals(sku.getCatalogCategory()));
        if (!hasConsultation) {
            return null;
        }
        List<Long> activeIds = clientShopConsultantMappingService.listActiveMappingIds(tenantId, clientUserId);
        if (request.getConsultantClientMappingId() != null) {
            Long requested = request.getConsultantClientMappingId();
            if (!activeIds.contains(requested)) {
                throw new IllegalArgumentException(ShopCheckoutConstants.MSG_CONSULTANT_MAPPING_INVALID);
            }
            return requested;
        }
        if (activeIds.isEmpty()) {
            return null;
        }
        if (activeIds.size() == 1) {
            return activeIds.get(0);
        }
        throw new IllegalArgumentException(ShopCheckoutConstants.MSG_CONSULTANT_MAPPING_SELECTION_REQUIRED);
    }

    private static void validateRedeemRequest(
            long subtotalMinor, long requestedPointsMinor, EffectivePointTenantPolicies policies) {
        if (requestedPointsMinor <= 0L) {
            return;
        }
        if (policies.minOrderForRedeemMinor() > 0L && subtotalMinor < policies.minOrderForRedeemMinor()) {
            throw new IllegalArgumentException(
                    "포인트 사용 가능 최소 주문 금액은 "
                            + policies.minOrderForRedeemMinor()
                            + "원입니다.");
        }
        if (policies.maxRedeemPerOrderMinor() > 0L && requestedPointsMinor > policies.maxRedeemPerOrderMinor()) {
            throw new IllegalArgumentException(
                    "주문당 최대 사용 포인트는 "
                            + policies.maxRedeemPerOrderMinor()
                            + "원입니다.");
        }
    }

    private void clearCartLines(String tenantId, Long clientUserId) {
        shopCartRepository.findByTenantIdAndClientId(tenantId, clientUserId)
                .ifPresent(c -> shopCartLineRepository.hardDeleteByCartId(c.getId()));
    }

    private ShopCheckoutResponse toCheckoutResponse(ShopClientOrder o) {
        String next;
        if (o.getStatus() == ShopClientOrderStatus.PAID) {
            next = "DONE";
        } else if (o.getCashDueMinor() > 0L) {
            next = "PAYMENT";
        } else {
            next = "DONE";
        }
        return ShopCheckoutResponse.builder()
                .orderPublicId(o.getPublicId())
                .status(o.getStatus())
                .subtotalMinor(o.getSubtotalMinor())
                .pointsRedeemMinor(o.getPointsRedeemMinor())
                .cashDueMinor(o.getCashDueMinor())
                .nextStep(next)
                .build();
    }

    @Override
    @Transactional
    public ShopPreparePaymentResponse preparePayment(
            String tenantId,
            Long clientUserId,
            String orderPublicId,
            ShopPreparePaymentRequest request) {

        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (!order.getClientId().equals(clientUserId)) {
            throw new IllegalArgumentException("주문에 접근할 수 없습니다.");
        }
        if (order.getStatus() != ShopClientOrderStatus.CREATED) {
            throw new IllegalArgumentException("결제를 준비할 수 없는 주문 상태입니다.");
        }
        if (order.getCashDueMinor() == 0L) {
            throw new IllegalArgumentException("현금 결제 금액이 없는 주문입니다.");
        }
        if (order.getCashDueMinor() < ShopCheckoutConstants.MIN_CASH_FOR_PAYMENT_GATEWAY) {
            throw new IllegalArgumentException(ShopCheckoutConstants.msgCashBelowMinPayment());
        }

        User user = userRepository.findByTenantIdAndId(tenantId, clientUserId)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
        requireVerifiedKoreanMobileForPayment(user);

        String customerEmail = resolvePaymentCustomerEmail(tenantId, user);
        String customerName = resolvePaymentCustomerName(user);

        Optional<Payment> pending = paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                tenantId, orderPublicId, Payment.PaymentStatus.PENDING);
        if (pending.isPresent()) {
            PaymentResponse pr = paymentService.getPayment(pending.get().getPaymentId());
            return toPrepareResponse(tenantId, orderPublicId, pr, customerEmail, customerName);
        }

        String method = normalizePaymentMethod(request);
        String provider = normalizePaymentProvider(tenantId, request);
        String orderName = buildOrderName(order);

        @SuppressWarnings("deprecation")
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId(orderPublicId)
                .amount(BigDecimal.valueOf(order.getCashDueMinor()))
                .method(method)
                .provider(provider)
                .payerId(clientUserId)
                .recipientId(null)
                .branchId(null)
                .orderName(orderName)
                .customerEmail(customerEmail)
                .customerName(customerName)
                .description("Shop order " + orderPublicId)
                .build();

        PaymentResponse pr = paymentService.createPayment(paymentRequest);
        order.setStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        shopClientOrderRepository.save(order);
        return toPrepareResponse(tenantId, orderPublicId, pr, customerEmail, customerName);
    }

    private static String buildOrderName(ShopClientOrder order) {
        String raw = "주문-" + order.getPublicId();
        return raw.length() <= 100 ? raw : raw.substring(0, 100);
    }

    /**
     * PG customer.email — 실이메일이 있으면 그대로, 없으면 전화+테넌트 합성 SSOT.
     * 사용자에게 이메일 입력을 요구하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param user     결제 게이트 통과한 사용자
     * @return 비어 있지 않은 이메일
     */
    private String resolvePaymentCustomerEmail(String tenantId, User user) {
        if (StringUtils.hasText(user.getEmail())) {
            return user.getEmail().trim();
        }
        String digits = clientProfilePhoneVerificationService.findNormalizedPhoneDigits(user)
                .orElseThrow(() -> new IllegalArgumentException(ShopCheckoutConstants.MSG_PHONE_VERIFICATION_REQUIRED));
        String sanitized = ClientRegistrationConstants.sanitizeTenantIdForSyntheticEmailDomain(tenantId);
        return ClientRegistrationConstants.buildSyntheticEmail(digits, sanitized, 0);
    }

    /**
     * PG customerName — 이름 없으면 soft fallback.
     *
     * @param user 사용자
     * @return 표시명
     */
    private static String resolvePaymentCustomerName(User user) {
        if (StringUtils.hasText(user.getName())) {
            return user.getName().trim();
        }
        return ShopCheckoutConstants.DEFAULT_PAYMENT_CUSTOMER_NAME;
    }

    /**
     * PG prepare 전 휴대폰 OTP 소유 확인 + 유효한 한국 휴대폰 번호 fail-closed.
     * 번호 문자열만 있고 PROFILE {@code phone_otp_attempts.verified_at} 없으면 거부.
     * SNS/OAuth VERIFIED 행 ≠ 결제 verified.
     *
     * @param user 테넌트 스코프 조회된 사용자
     * @throws IllegalArgumentException 미인증·번호 없음·형식 오류
     */
    private void requireVerifiedKoreanMobileForPayment(User user) {
        if (!clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(user)) {
            throw new IllegalArgumentException(ShopCheckoutConstants.MSG_PHONE_VERIFICATION_REQUIRED);
        }
    }

    private static String normalizePaymentMethod(ShopPreparePaymentRequest request) {
        String m = request.getPaymentMethod();
        if (m == null || m.isBlank()) {
            return PaymentConstants.METHOD_CARD;
        }
        try {
            Payment.PaymentMethod.valueOf(m);
            return m;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 결제 방법입니다.");
        }
    }

    /**
     * 결제 대행사 정규화. 요청이 비어 있고 ACTIVE IAMPORT 가 있으면 IAMPORT, 아니면 TOSS 기본.
     *
     * @param tenantId 테넌트
     * @param request  준비 요청
     * @return provider 코드
     */
    private String normalizePaymentProvider(String tenantId, ShopPreparePaymentRequest request) {
        String p = request.getPaymentProvider();
        if (p != null && !p.isBlank()) {
            try {
                Payment.PaymentProvider.valueOf(p);
                return p;
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("유효하지 않은 결제 대행사입니다.");
            }
        }
        TenantPgConfigurationDetailResponse iamport =
                tenantPgConfigurationService.getActiveConfigurationByProvider(tenantId, PgProvider.IAMPORT);
        if (iamport != null) {
            return PaymentConstants.PROVIDER_IAMPORT;
        }
        return PaymentConstants.PROVIDER_TOSS;
    }

    private ShopPreparePaymentResponse toPrepareResponse(
            String tenantId,
            String orderPublicId,
            PaymentResponse pr,
            String customerEmail,
            String customerName) {
        String providerCode = pr.getProvider() != null ? pr.getProvider().name() : null;
        ShopPreparePaymentResponse.ShopPreparePaymentResponseBuilder builder = ShopPreparePaymentResponse.builder()
                .orderPublicId(orderPublicId)
                .paymentId(pr.getPaymentId())
                .cashAmount(pr.getAmount())
                .paymentUrl(pr.getPaymentUrl())
                .paymentStatus(pr.getStatus())
                .paymentProvider(providerCode)
                .pgReady(Boolean.FALSE)
                .customerEmail(customerEmail)
                .customerName(customerName);

        if (PaymentConstants.PROVIDER_IAMPORT.equalsIgnoreCase(providerCode)) {
            attachPortOneClientFields(tenantId, builder);
        }

        return builder.build();
    }

    private void attachPortOneClientFields(
            String tenantId, ShopPreparePaymentResponse.ShopPreparePaymentResponseBuilder builder) {
        try {
            TenantPgConfigurationDetailResponse active =
                    tenantPgConfigurationService.getActiveConfigurationByProvider(tenantId, PgProvider.IAMPORT);
            if (active == null) {
                return;
            }
            Boolean testMode = Boolean.TRUE.equals(active.getTestMode());
            String channelKey = PortOneChannelKeyResolver.resolveChannelKey(active.getSettingsJson(), testMode);
            String storeId = active.getStoreId();
            boolean ready = storeId != null && !storeId.isBlank()
                    && channelKey != null && !channelKey.isBlank();
            builder.storeId(storeId)
                    .channelKey(channelKey)
                    .testMode(testMode)
                    .paymentProvider(PaymentConstants.PROVIDER_IAMPORT)
                    .pgReady(ready);
        } catch (Exception e) {
            log.warn("포트원 prepare 응답 필드 부착 실패 tenantId={}: {}", tenantId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void cancelOrder(String tenantId, Long clientUserId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (!order.getClientId().equals(clientUserId)) {
            throw new IllegalArgumentException("주문에 접근할 수 없습니다.");
        }
        if (order.getStatus() != ShopClientOrderStatus.CREATED
                && order.getStatus() != ShopClientOrderStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException("취소할 수 없는 주문 상태입니다.");
        }
        releasePointsHoldIfAny(tenantId, clientUserId, orderPublicId, order.getPointsRedeemMinor());
        order.setStatus(ShopClientOrderStatus.CANCELLED);
        shopClientOrderRepository.save(order);
    }

    @Override
    @Transactional
    public boolean completeOrderOnPaymentApproved(String tenantId, String orderPublicId) {
        Optional<ShopClientOrder> orderOpt =
                shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId);
        if (orderOpt.isEmpty()) {
            return false;
        }
        ShopClientOrder order = orderOpt.get();
        if (order.getStatus() == ShopClientOrderStatus.PAID) {
            log.debug("쇼핑 주문 이미 PAID(멱등): tenantId={}, orderPublicId={}", tenantId, orderPublicId);
            return true;
        }
        if (order.getStatus() != ShopClientOrderStatus.CREATED
                && order.getStatus() != ShopClientOrderStatus.PENDING_PAYMENT
                && order.getStatus() != ShopClientOrderStatus.EXPIRED) {
            log.warn(
                    "PG 승인 후 PAID 전이 불가 상태: tenantId={}, orderPublicId={}, status={}",
                    tenantId,
                    orderPublicId,
                    order.getStatus());
            return true;
        }
        markOrderPaidAndCommitPoints(tenantId, order);
        log.info("쇼핑 주문 PAID 반영: tenantId={}, orderPublicId={}", tenantId, orderPublicId);
        return true;
    }

    @Override
    @Transactional
    public boolean releaseOrderHoldOnPaymentFailure(String tenantId, String orderPublicId) {
        Optional<ShopClientOrder> orderOpt =
                shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId);
        if (orderOpt.isEmpty()) {
            return false;
        }
        ShopClientOrder order = orderOpt.get();
        if (order.getStatus() == ShopClientOrderStatus.PAID
                || order.getStatus() == ShopClientOrderStatus.CANCELLED
                || order.getStatus() == ShopClientOrderStatus.EXPIRED) {
            return true;
        }
        releasePointsHoldIfAny(tenantId, order.getClientId(), orderPublicId, order.getPointsRedeemMinor());
        if (order.getStatus() == ShopClientOrderStatus.PENDING_PAYMENT) {
            order.setStatus(ShopClientOrderStatus.CREATED);
            shopClientOrderRepository.save(order);
            log.info(
                    "PG 실패·취소 후 주문 CREATED 복귀: tenantId={}, orderPublicId={}",
                    tenantId,
                    orderPublicId);
            try {
                shopNotificationHelper.notifyPaymentFailed(tenantId, order);
            } catch (Exception ex) {
                log.warn("쇼핑 결제 실패 알림 실패: orderPublicId={}", orderPublicId, ex);
            }
        }
        return true;
    }

    @Override
    @Transactional
    public boolean expireOrderHold(String tenantId, String orderPublicId) {
        Optional<ShopClientOrder> orderOpt =
                shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId);
        if (orderOpt.isEmpty()) {
            return false;
        }
        ShopClientOrder order = orderOpt.get();
        if (order.getStatus() == ShopClientOrderStatus.PAID
                || order.getStatus() == ShopClientOrderStatus.CANCELLED
                || order.getStatus() == ShopClientOrderStatus.EXPIRED
                || order.getStatus() == ShopClientOrderStatus.REFUNDED) {
            return false;
        }
        if (order.getStatus() != ShopClientOrderStatus.CREATED
                && order.getStatus() != ShopClientOrderStatus.PENDING_PAYMENT) {
            log.warn(
                    "hold TTL 만료 스킵(비대상 상태): tenantId={}, orderPublicId={}, status={}",
                    tenantId,
                    orderPublicId,
                    order.getStatus());
            return false;
        }
        releasePointsHoldIfAny(tenantId, order.getClientId(), orderPublicId, order.getPointsRedeemMinor());
        order.setStatus(ShopClientOrderStatus.EXPIRED);
        shopClientOrderRepository.save(order);
        log.info("쇼핑 주문 hold TTL 만료: tenantId={}, orderPublicId={}", tenantId, orderPublicId);
        try {
            shopNotificationHelper.notifyOrderHoldExpired(tenantId, order);
        } catch (Exception ex) {
            log.warn("쇼핑 주문 만료 알림 실패: orderPublicId={}", orderPublicId, ex);
        }
        return true;
    }

    private void markOrderPaidAndCommitPoints(String tenantId, ShopClientOrder order) {
        if (order.getStatus() == ShopClientOrderStatus.PAID) {
            return;
        }
        long points = order.getPointsRedeemMinor();
        if (points > 0L) {
            clientPointWalletService.commitHold(
                    tenantId,
                    order.getClientId(),
                    order.getPublicId(),
                    points,
                    ShopCheckoutConstants.pointCommitKey(order.getPublicId()));
        }
        long earnAmount = creditEarnOnPaid(tenantId, order);
        order.setStatus(ShopClientOrderStatus.PAID);
        shopClientOrderRepository.save(order);
        shopOrderFulfillmentService.fulfillPaidOrder(tenantId, order);
        clearCartLines(tenantId, order.getClientId());
        try {
            shopNotificationHelper.notifyOrderPaid(tenantId, order);
        } catch (Exception ex) {
            log.warn("쇼핑 주문 결제 완료 알림 실패: orderPublicId={}", order.getPublicId(), ex);
        }
        if (earnAmount > 0L) {
            try {
                shopNotificationHelper.notifyPointEarned(tenantId, order, earnAmount);
            } catch (Exception ex) {
                log.warn("포인트 적립 알림 실패: orderPublicId={}", order.getPublicId(), ex);
            }
        }
    }

    /**
     * @return 적립 포인트 minor(0이면 미적립)
     */
    private long creditEarnOnPaid(String tenantId, ShopClientOrder order) {
        EffectivePointTenantPolicies policies = pointTenantPolicyService.getEffectivePoliciesTyped(tenantId);
        long earnAmount = policies.computeEarnAmountMinor(order.getSubtotalMinor(), order.getCashDueMinor());
        if (earnAmount <= 0L) {
            return 0L;
        }
        clientPointWalletService.creditEarn(
                tenantId,
                order.getClientId(),
                order.getPublicId(),
                earnAmount,
                ShopCheckoutConstants.pointEarnKey(order.getPublicId()));
        return earnAmount;
    }

    private void releasePointsHoldIfAny(
            String tenantId, Long clientUserId, String orderPublicId, long pointsMinor) {
        if (pointsMinor > 0L) {
            clientPointWalletService.releaseHold(
                    tenantId,
                    clientUserId,
                    orderPublicId,
                    pointsMinor,
                    ShopCheckoutConstants.pointReleaseKey(orderPublicId));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShopOrderSummaryResponse> listMyOrders(String tenantId, Long clientUserId, int page, int size) {
        int p = Math.max(0, page);
        int s = Math.min(Math.max(1, size), 50);
        List<ShopClientOrder> list = shopClientOrderRepository.findRecentByTenantAndClient(
                tenantId, clientUserId, PageRequest.of(p, s));
        List<ShopOrderSummaryResponse> result = new ArrayList<>();
        for (ShopClientOrder o : list) {
            result.add(ShopOrderSummaryResponse.builder()
                    .orderPublicId(o.getPublicId())
                    .status(o.getStatus())
                    .subtotalMinor(o.getSubtotalMinor())
                    .pointsRedeemMinor(o.getPointsRedeemMinor())
                    .cashDueMinor(o.getCashDueMinor())
                    .createdAt(o.getCreatedAt())
                    .build());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public ShopOrderResponse getOrder(String tenantId, Long clientUserId, String orderPublicId) {
        ShopClientOrder order = shopClientOrderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        if (!order.getClientId().equals(clientUserId)) {
            throw new IllegalArgumentException("주문에 접근할 수 없습니다.");
        }
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId());
        List<ShopOrderLineResponse> lr = new ArrayList<>();
        for (ShopClientOrderLine l : lines) {
            int sessionCount = resolveOrderLineSessionCount(l);
            lr.add(ShopOrderLineResponse.builder()
                    .lineNo(l.getLineNo())
                    .skuCode(l.getSkuCodeSnapshot())
                    .title(l.getTitleSnapshot())
                    .quantity(l.getQuantity())
                    .unitPriceMinor(l.getUnitPriceMinor())
                    .lineTotalMinor(l.getLineTotalMinor())
                    .sessionCount(sessionCount)
                    .packageType(ShopSessionCountConstants.resolvePackageType(sessionCount))
                    .build());
        }
        List<ShopOrderFulfillmentEvent> fulfillmentEvents =
                shopOrderFulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        tenantId, orderPublicId);
        List<ShopOrderFulfillmentLineResponse> fulfillmentLines = new ArrayList<>();
        for (ShopOrderFulfillmentEvent event : fulfillmentEvents) {
            fulfillmentLines.add(ShopOrderFulfillmentLineResponse.builder()
                    .skuCode(event.getSkuCode())
                    .category(event.getCategory())
                    .status(event.getStatus())
                    .message(event.getMessage())
                    .build());
        }
        Optional<Payment> paymentOpt = resolveLatestPayment(tenantId, orderPublicId);
        return ShopOrderResponse.builder()
                .orderPublicId(order.getPublicId())
                .status(order.getStatus())
                .subtotalMinor(order.getSubtotalMinor())
                .pointsRedeemMinor(order.getPointsRedeemMinor())
                .cashDueMinor(order.getCashDueMinor())
                .paymentId(paymentOpt.map(Payment::getPaymentId).orElse(null))
                .paymentStatus(paymentOpt.map(Payment::getStatus).map(Enum::name).orElse(null))
                .lines(lr)
                .fulfillmentLines(fulfillmentLines)
                .build();
    }

    /**
     * 주문에 연결된 최신 결제 — APPROVED 우선, 없으면 REFUNDED, 아니면 id 최대 1건.
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 결제 (없으면 empty)
     */
    private Optional<Payment> resolveLatestPayment(String tenantId, String orderPublicId) {
        Optional<Payment> approved = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.APPROVED);
        if (approved.isPresent()) {
            return approved;
        }
        Optional<Payment> refunded = paymentRepository
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, orderPublicId, Payment.PaymentStatus.REFUNDED);
        if (refunded.isPresent()) {
            return refunded;
        }
        return paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(tenantId, orderPublicId)
                .stream()
                .max(Comparator.comparing(Payment::getId, Comparator.nullsLast(Long::compareTo)));
    }

    private static int resolveSessionCount(ShopCatalogSku sku) {
        Integer value = sku.getSessionCount();
        if (value == null || value < ShopSessionCountConstants.MIN_SESSION_COUNT) {
            return ShopSessionCountConstants.MIN_SESSION_COUNT;
        }
        return value;
    }

    private static int resolveOrderLineSessionCount(ShopClientOrderLine line) {
        Integer snapshot = line.getSessionCountSnapshot();
        if (snapshot != null && snapshot >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
            return snapshot;
        }
        if (line.getSku() != null) {
            return resolveSessionCount(line.getSku());
        }
        return ShopSessionCountConstants.MIN_SESSION_COUNT;
    }
}
