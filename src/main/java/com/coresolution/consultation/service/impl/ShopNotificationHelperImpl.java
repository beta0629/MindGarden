package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopNotificationCopy;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.util.ConsultationMessageTypeCodes;
import com.coresolution.consultation.util.MobilePushMessageFormatter;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 쇼핑몰·리워드 P0 알림 구현. PG generic {@code payment_completed}와 분리.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShopNotificationHelperImpl implements ShopNotificationHelper {

    private final MobilePushDispatchService mobilePushDispatchService;
    private final ConsultationMessageService consultationMessageService;
    private final CommonCodeService commonCodeService;
    private final ShopClientOrderLineRepository shopClientOrderLineRepository;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;

    @Override
    public void notifyOrderPaid(String tenantId, ShopClientOrder order) {
        if (!validateOrder(tenantId, order)) {
            return;
        }
        long totalPaid = order.getSubtotalMinor();
        try {
            sendInAppToClient(
                    tenantId,
                    order,
                    ShopNotificationCopy.INAPP_TITLE_ORDER_PAID,
                    String.format(
                            ShopNotificationCopy.INAPP_BODY_ORDER_PAID_FMT,
                            order.getPublicId(),
                            MobilePushMessageFormatter.formatAmount(
                                    java.math.BigDecimal.valueOf(totalPaid))),
                    ShopNotificationCopy.MESSAGE_TYPE_PAYMENT);
        } catch (Exception ex) {
            log.error("쇼핑 주문 결제 완료 인앱 알림 실패: orderPublicId={}", order.getPublicId(), ex);
        }
        try {
            mobilePushDispatchService.dispatchShopOrderPaid(
                    tenantId, order.getClientId(), order.getPublicId(), totalPaid);
        } catch (Exception ex) {
            log.warn("쇼핑 주문 결제 완료 푸시 실패: orderPublicId={}", order.getPublicId(), ex);
        }
    }

    @Override
    public void notifyPaymentFailed(String tenantId, ShopClientOrder order) {
        if (!validateOrder(tenantId, order)) {
            return;
        }
        try {
            sendInAppToClient(
                    tenantId,
                    order,
                    ShopNotificationCopy.INAPP_TITLE_PAYMENT_FAILED,
                    String.format(ShopNotificationCopy.INAPP_BODY_PAYMENT_FAILED_FMT, order.getPublicId()),
                    ShopNotificationCopy.MESSAGE_TYPE_PAYMENT);
        } catch (Exception ex) {
            log.error("쇼핑 주문 결제 실패 인앱 알림 실패: orderPublicId={}", order.getPublicId(), ex);
        }
        try {
            mobilePushDispatchService.dispatchShopPaymentFailed(tenantId, order.getClientId(), order.getPublicId());
        } catch (Exception ex) {
            log.warn("쇼핑 주문 결제 실패 푸시 실패: orderPublicId={}", order.getPublicId(), ex);
        }
    }

    @Override
    public void notifyPointEarned(String tenantId, ShopClientOrder order, long earnAmountMinor) {
        if (!validateOrder(tenantId, order) || earnAmountMinor <= 0L) {
            return;
        }
        try {
            sendInAppToClient(
                    tenantId,
                    order,
                    ShopNotificationCopy.INAPP_TITLE_POINT_EARNED,
                    String.format(
                            ShopNotificationCopy.INAPP_BODY_POINT_EARNED_FMT,
                            MobilePushMessageFormatter.formatAmount(
                                    java.math.BigDecimal.valueOf(earnAmountMinor)),
                            order.getPublicId()),
                    ShopNotificationCopy.MESSAGE_TYPE_GENERAL);
        } catch (Exception ex) {
            log.error("포인트 적립 인앱 알림 실패: orderPublicId={}", order.getPublicId(), ex);
        }
        try {
            mobilePushDispatchService.dispatchPointEarned(
                    tenantId, order.getClientId(), order.getPublicId(), earnAmountMinor);
        } catch (Exception ex) {
            log.warn("포인트 적립 푸시 실패: orderPublicId={}", order.getPublicId(), ex);
        }
    }

    @Override
    public void notifyOrderHoldExpired(String tenantId, ShopClientOrder order) {
        if (!validateOrder(tenantId, order)) {
            return;
        }
        try {
            sendInAppToClient(
                    tenantId,
                    order,
                    ShopNotificationCopy.INAPP_TITLE_HOLD_EXPIRED,
                    String.format(ShopNotificationCopy.INAPP_BODY_HOLD_EXPIRED_FMT, order.getPublicId()),
                    ShopNotificationCopy.MESSAGE_TYPE_GENERAL);
        } catch (Exception ex) {
            log.error("쇼핑 주문 만료 인앱 알림 실패: orderPublicId={}", order.getPublicId(), ex);
        }
        try {
            mobilePushDispatchService.dispatchShopOrderHoldExpired(
                    tenantId, order.getClientId(), order.getPublicId());
        } catch (Exception ex) {
            log.warn("쇼핑 주문 만료 푸시 실패: orderPublicId={}", order.getPublicId(), ex);
        }
    }

    @Override
    public void notifyOrderRefunded(String tenantId, ShopClientOrder order) {
        if (!validateOrder(tenantId, order)) {
            return;
        }
        long refundAmount = order.getSubtotalMinor();
        try {
            sendInAppToClient(
                    tenantId,
                    order,
                    ShopNotificationCopy.INAPP_TITLE_REFUNDED,
                    String.format(ShopNotificationCopy.INAPP_BODY_REFUNDED_FMT, order.getPublicId()),
                    ShopNotificationCopy.MESSAGE_TYPE_PAYMENT);
        } catch (Exception ex) {
            log.error("쇼핑 주문 환불 인앱 알림 실패: orderPublicId={}", order.getPublicId(), ex);
        }
        try {
            mobilePushDispatchService.dispatchShopOrderRefunded(
                    tenantId, order.getClientId(), order.getPublicId(), refundAmount);
        } catch (Exception ex) {
            log.warn("쇼핑 주문 환불 푸시 실패: orderPublicId={}", order.getPublicId(), ex);
        }
    }

    @Override
    public void notifyFulfillmentCompleted(
            String tenantId, ShopClientOrder order, Long consultantUserId, String skuCode) {
        if (!validateOrder(tenantId, order)) {
            return;
        }
        try {
            sendInAppToClient(
                    tenantId,
                    order,
                    ShopNotificationCopy.INAPP_TITLE_FULFILLMENT,
                    String.format(ShopNotificationCopy.INAPP_BODY_FULFILLMENT_CLIENT_FMT, order.getPublicId()),
                    ShopNotificationCopy.MESSAGE_TYPE_GENERAL);
            if (consultantUserId != null) {
                resolveThreadPair(tenantId, order).ifPresent(pair -> consultationMessageService.sendSystemThreadMessage(
                        pair.consultantUserId(),
                        pair.clientUserId(),
                        consultantUserId,
                        null,
                        ShopNotificationCopy.INAPP_TITLE_FULFILLMENT,
                        String.format(
                                ShopNotificationCopy.INAPP_BODY_FULFILLMENT_CONSULTANT_FMT, order.getPublicId()),
                        resolveMessageType(ShopNotificationCopy.MESSAGE_TYPE_GENERAL),
                        false,
                        false));
            }
        } catch (Exception ex) {
            log.error("쇼핑 fulfillment 인앱 알림 실패: orderPublicId={}", order.getPublicId(), ex);
        }
        try {
            mobilePushDispatchService.dispatchShopFulfillmentCompleted(
                    tenantId, order.getClientId(), consultantUserId, order.getPublicId(), skuCode);
        } catch (Exception ex) {
            log.warn("쇼핑 fulfillment 푸시 실패: orderPublicId={}", order.getPublicId(), ex);
        }
    }

    private void sendInAppToClient(
            String tenantId, ShopClientOrder order, String title, String body, String messageTypeKey) {
        resolveThreadPair(tenantId, order).ifPresentOrElse(
                pair -> consultationMessageService.sendSystemThreadMessage(
                        pair.consultantUserId(),
                        pair.clientUserId(),
                        order.getClientId(),
                        null,
                        title,
                        body,
                        resolveMessageType(messageTypeKey),
                        false,
                        false),
                () -> log.debug(
                        "쇼핑 인앱 알림 생략(매칭 스레드 없음): orderPublicId={}", order.getPublicId()));
    }

    private Optional<ThreadPair> resolveThreadPair(String tenantId, ShopClientOrder order) {
        List<ShopClientOrderLine> lines =
                shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId());
        for (ShopClientOrderLine line : lines) {
            Long mappingId = line.getConsultantClientMappingId();
            if (mappingId == null) {
                continue;
            }
            Optional<ConsultantClientMapping> mappingOpt =
                    consultantClientMappingRepository.findByTenantIdAndId(tenantId, mappingId);
            if (mappingOpt.isEmpty()) {
                continue;
            }
            ConsultantClientMapping mapping = mappingOpt.get();
            if (mapping.getConsultant() == null || mapping.getClient() == null) {
                continue;
            }
            return Optional.of(new ThreadPair(mapping.getConsultant().getId(), mapping.getClient().getId()));
        }
        return Optional.empty();
    }

    private String resolveMessageType(String messageTypeKey) {
        return ConsultationMessageTypeCodes.resolve(
                commonCodeService, messageTypeKey, ConsultationMessageTypeCodes.CANONICAL_GENERAL);
    }

    private static boolean validateOrder(String tenantId, ShopClientOrder order) {
        if (order == null || order.getPublicId() == null || order.getPublicId().isBlank()) {
            return false;
        }
        if (order.getClientId() == null) {
            return false;
        }
        String tid = tenantId != null && !tenantId.isBlank() ? tenantId : order.getTenantId();
        return tid != null && !tid.isBlank();
    }

    private record ThreadPair(Long consultantUserId, Long clientUserId) {
    }
}
