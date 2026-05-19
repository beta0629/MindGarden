package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.MobilePushDispatchConstants;
import com.coresolution.consultation.constant.MobilePushNotificationCategory;
import com.coresolution.consultation.constant.ShopNotificationCopy;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchDedupService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.util.MobilePushMessageFormatter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Expo Push 발송 구현.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MobilePushDispatchServiceImpl implements MobilePushDispatchService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ExpoPushProperties expoPushProperties;
    private final MobilePushTokenRepository mobilePushTokenRepository;
    private final MobilePushSettingsRepository mobilePushSettingsRepository;
    private final MobilePushDispatchDedupService mobilePushDispatchDedupService;
    private final UserRepository userRepository;
    private final ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchBookingReminder(String tenantId, Schedule schedule, String body, String reminderSlotCode) {
        if (schedule == null || schedule.getId() == null) {
            return;
        }
        String tid = requireTenantId(tenantId, schedule.getTenantId());
        if (tid == null) {
            return;
        }
        List<Long> targets = new ArrayList<>();
        if (schedule.getClientId() != null) {
            targets.add(schedule.getClientId());
        }
        if (schedule.getConsultantId() != null) {
            targets.add(schedule.getConsultantId());
        }
        String title = "상담 리마인더";
        String safeBody = truncate(body, MobilePushDispatchConstants.BODY_MAX_LENGTH);
        Map<String, String> data = buildScheduleData(tid, schedule, MobilePushCanonicalTypes.BOOKING_REMINDER);
        String dedupeEntity = String.valueOf(schedule.getId());
        String dedupeBucket = reminderSlotCode + "|" + schedule.getDate();
        dispatchFanout(tid, targets, MobilePushCanonicalTypes.BOOKING_REMINDER, title, safeBody, data, dedupeEntity,
                dedupeBucket);
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchBookingConfirmed(String tenantId, Schedule schedule) {
        if (schedule == null || schedule.getId() == null || schedule.getClientId() == null) {
            return;
        }
        String tid = requireTenantId(tenantId, schedule.getTenantId());
        if (tid == null) {
            return;
        }
        String title = "예약 확정";
        String consultantName = resolveUserDisplayName(tid, schedule.getConsultantId(),
                MobilePushMessageFormatter.FALLBACK_CONSULTANT_NAME);
        String body = MobilePushMessageFormatter.buildBookingConfirmedBody(schedule, consultantName);
        Map<String, String> data = buildScheduleData(tid, schedule, MobilePushCanonicalTypes.BOOKING_CONFIRMED);
        dispatchFanout(tid, List.of(schedule.getClientId()), MobilePushCanonicalTypes.BOOKING_CONFIRMED, title, body,
                data, String.valueOf(schedule.getId()), "confirmed");
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchBookingCancelled(String tenantId, Schedule schedule) {
        if (schedule == null || schedule.getId() == null) {
            return;
        }
        String tid = requireTenantId(tenantId, schedule.getTenantId());
        if (tid == null) {
            return;
        }
        List<Long> targets = new ArrayList<>();
        if (schedule.getClientId() != null) {
            targets.add(schedule.getClientId());
        }
        if (schedule.getConsultantId() != null) {
            targets.add(schedule.getConsultantId());
        }
        String title = "예약 취소";
        String consultantName = resolveUserDisplayName(tid, schedule.getConsultantId(),
                MobilePushMessageFormatter.FALLBACK_CONSULTANT_NAME);
        String clientName = resolveUserDisplayName(tid, schedule.getClientId(),
                MobilePushMessageFormatter.FALLBACK_CLIENT_NAME);
        Map<String, String> data = buildScheduleData(tid, schedule, MobilePushCanonicalTypes.BOOKING_CANCELLED);
        String entityId = String.valueOf(schedule.getId());
        if (schedule.getClientId() != null) {
            String clientBody = MobilePushMessageFormatter.buildBookingCancelledBody(
                    schedule, consultantName, clientName, false);
            dispatchFanout(tid, List.of(schedule.getClientId()), MobilePushCanonicalTypes.BOOKING_CANCELLED, title,
                    clientBody, data, entityId, "cancelled");
        }
        if (schedule.getConsultantId() != null) {
            String consultantBody = MobilePushMessageFormatter.buildBookingCancelledBody(
                    schedule, consultantName, clientName, true);
            dispatchFanout(tid, List.of(schedule.getConsultantId()), MobilePushCanonicalTypes.BOOKING_CANCELLED,
                    title, consultantBody, data, entityId, "cancelled|consultant");
        }
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchBookingRescheduled(
            String tenantId,
            Schedule schedule,
            LocalDate previousDate,
            LocalTime previousStart,
            LocalTime previousEnd) {
        if (schedule == null) {
            return;
        }
        if (schedule.getClientId() == null && schedule.getConsultantId() == null) {
            return;
        }
        String tid = requireTenantId(tenantId, schedule.getTenantId());
        if (tid == null) {
            return;
        }
        String oldSlot = MobilePushMessageFormatter.formatScheduleSlot(previousDate, previousStart, previousEnd);
        String newSlot = MobilePushMessageFormatter.formatScheduleSlot(
                schedule.getDate(), schedule.getStartTime(), schedule.getEndTime());
        String consultantName = resolveUserDisplayName(tid, schedule.getConsultantId(),
                MobilePushMessageFormatter.FALLBACK_CONSULTANT_NAME);
        String clientName = resolveUserDisplayName(tid, schedule.getClientId(),
                MobilePushMessageFormatter.FALLBACK_CLIENT_NAME);
        String title = "예약 일정 변경";
        Map<String, String> data = buildScheduleData(tid, schedule, MobilePushCanonicalTypes.BOOKING_RESCHEDULED);
        String entityId = schedule.getId() != null
                ? String.valueOf(schedule.getId())
                : (schedule.getConsultationId() != null ? "c-" + schedule.getConsultationId() : "unknown");
        String bucket = oldSlot + ">" + newSlot;
        if (schedule.getClientId() != null) {
            String clientBody = MobilePushMessageFormatter.buildBookingRescheduledBody(
                    oldSlot, newSlot, consultantName, clientName, false);
            dispatchFanout(tid, List.of(schedule.getClientId()), MobilePushCanonicalTypes.BOOKING_RESCHEDULED, title,
                    clientBody, data, entityId, bucket);
        }
        if (schedule.getConsultantId() != null) {
            String consultantBody = MobilePushMessageFormatter.buildBookingRescheduledBody(
                    oldSlot, newSlot, consultantName, clientName, true);
            dispatchFanout(tid, List.of(schedule.getConsultantId()), MobilePushCanonicalTypes.BOOKING_RESCHEDULED,
                    title, consultantBody, data, entityId, bucket + "|consultant");
        }
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchPaymentCompleted(String tenantId, Payment payment) {
        if (payment == null || payment.getPayerId() == null) {
            return;
        }
        String tid = requireTenantId(tenantId, payment.getTenantId());
        if (tid == null) {
            return;
        }
        String title = "결제 완료";
        String amountStr = payment.getAmount() != null ? payment.getAmount().toPlainString() : "";
        String body = MobilePushMessageFormatter.buildPaymentCompletedBody(
                payment.getAmount(), payment.getDescription());
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", MobilePushCanonicalTypes.PAYMENT_COMPLETED);
        data.put("tenantId", tid);
        data.put("paymentId", payment.getPaymentId() != null ? payment.getPaymentId() : "");
        data.put("id", payment.getPaymentId() != null ? payment.getPaymentId() : "");
        data.put("amount", amountStr);
        if (payment.getDescription() != null && !payment.getDescription().isBlank()) {
            data.put("description", payment.getDescription().trim());
        }
        data.put("title", truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);
        dispatchFanout(tid, List.of(payment.getPayerId()), MobilePushCanonicalTypes.PAYMENT_COMPLETED, title, body,
                data, payment.getPaymentId() != null ? payment.getPaymentId() : String.valueOf(payment.getId()),
                "approved");
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchPaymentFailed(String tenantId, Payment payment) {
        if (payment == null || payment.getPayerId() == null) {
            return;
        }
        String tid = requireTenantId(tenantId, payment.getTenantId());
        if (tid == null) {
            return;
        }
        String title = "결제 실패";
        String body = truncate(
                MobilePushMessageFormatter.buildPaymentFailedBody(
                        payment.getAmount(), payment.getDescription(), payment.getFailureReason()),
                MobilePushDispatchConstants.BODY_MAX_LENGTH);
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", MobilePushCanonicalTypes.PAYMENT_FAILED);
        data.put("tenantId", tid);
        data.put("paymentId", payment.getPaymentId() != null ? payment.getPaymentId() : "");
        data.put("id", payment.getPaymentId() != null ? payment.getPaymentId() : "");
        data.put("title", truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);
        dispatchFanout(tid, List.of(payment.getPayerId()), MobilePushCanonicalTypes.PAYMENT_FAILED, title, body, data,
                payment.getPaymentId() != null ? payment.getPaymentId() : String.valueOf(payment.getId()), "failed");
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchSessionLow(String tenantId, Long mappingId, Long clientUserId, int remainingSessions) {
        if (mappingId == null || clientUserId == null) {
            return;
        }
        String tid = requireTenantId(tenantId, null);
        if (tid == null) {
            return;
        }
        String title = "회기 소진 임박";
        String body = String.format("남은 회기가 %d회입니다.", remainingSessions);
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", MobilePushCanonicalTypes.SESSION_LOW);
        data.put("tenantId", tid);
        data.put("mappingId", String.valueOf(mappingId));
        data.put("id", String.valueOf(mappingId));
        data.put("remainingSessions", String.valueOf(remainingSessions));
        data.put("title", truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);
        String bucket = "low-r" + remainingSessions;
        dispatchFanout(tid, List.of(clientUserId), MobilePushCanonicalTypes.SESSION_LOW, title, body, data,
                String.valueOf(mappingId), bucket);
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchMindWeatherShared(
            String tenantId,
            Long cardId,
            Long consultantUserId,
            String clientDisplayName,
            String summarySnippet) {
        if (cardId == null || consultantUserId == null) {
            return;
        }
        String tid = requireTenantId(tenantId, null);
        if (tid == null) {
            return;
        }
        String clientLabel = clientDisplayName != null && !clientDisplayName.isBlank()
            ? clientDisplayName.trim()
            : "내담자";
        String title = "마음 날씨 공유";
        String body = summarySnippet != null && !summarySnippet.isBlank()
            ? String.format("%s님이 분석 카드를 공유했어요. %s", clientLabel,
                truncate(summarySnippet.trim(), 80))
            : String.format("%s님이 마음 날씨 분석 카드를 공유했어요.", clientLabel);
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", MobilePushCanonicalTypes.MIND_WEATHER_SHARED);
        data.put("tenantId", tid);
        data.put("cardId", String.valueOf(cardId));
        data.put("id", String.valueOf(cardId));
        data.put("title", truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);
        dispatchFanout(tid, List.of(consultantUserId), MobilePushCanonicalTypes.MIND_WEATHER_SHARED, title, body,
                data, String.valueOf(cardId), "shared");
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchShopOrderPaid(String tenantId, Long clientUserId, String orderPublicId, long totalPaidMinor) {
        dispatchShopClientNotification(
                tenantId,
                clientUserId,
                orderPublicId,
                MobilePushCanonicalTypes.SHOP_ORDER_PAID,
                ShopNotificationCopy.PUSH_TITLE_ORDER_PAID,
                MobilePushMessageFormatter.buildShopOrderPaidBody(orderPublicId, totalPaidMinor),
                "paid");
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchShopPaymentFailed(String tenantId, Long clientUserId, String orderPublicId) {
        dispatchShopClientNotification(
                tenantId,
                clientUserId,
                orderPublicId,
                MobilePushCanonicalTypes.SHOP_PAYMENT_FAILED,
                ShopNotificationCopy.PUSH_TITLE_PAYMENT_FAILED,
                MobilePushMessageFormatter.buildShopPaymentFailedBody(orderPublicId),
                "payment-failed");
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchPointEarned(String tenantId, Long clientUserId, String orderPublicId, long earnAmountMinor) {
        dispatchShopClientNotification(
                tenantId,
                clientUserId,
                orderPublicId,
                MobilePushCanonicalTypes.POINT_EARNED,
                ShopNotificationCopy.PUSH_TITLE_POINT_EARNED,
                MobilePushMessageFormatter.buildPointEarnedBody(orderPublicId, earnAmountMinor),
                "earn");
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchShopOrderHoldExpired(String tenantId, Long clientUserId, String orderPublicId) {
        dispatchShopClientNotification(
                tenantId,
                clientUserId,
                orderPublicId,
                MobilePushCanonicalTypes.SHOP_ORDER_HOLD_EXPIRED,
                ShopNotificationCopy.PUSH_TITLE_HOLD_EXPIRED,
                MobilePushMessageFormatter.buildShopOrderHoldExpiredBody(orderPublicId),
                "hold-expired");
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchShopOrderRefunded(String tenantId, Long clientUserId, String orderPublicId, long refundAmountMinor) {
        dispatchShopClientNotification(
                tenantId,
                clientUserId,
                orderPublicId,
                MobilePushCanonicalTypes.SHOP_ORDER_REFUNDED,
                ShopNotificationCopy.PUSH_TITLE_REFUNDED,
                MobilePushMessageFormatter.buildShopOrderRefundedBody(orderPublicId, refundAmountMinor),
                "refunded");
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchShopFulfillmentCompleted(
            String tenantId,
            Long clientUserId,
            Long consultantUserId,
            String orderPublicId,
            String skuCode) {
        if (clientUserId == null || orderPublicId == null || orderPublicId.isBlank()) {
            return;
        }
        String tid = requireTenantId(tenantId, null);
        if (tid == null) {
            return;
        }
        String safeSku = skuCode != null && !skuCode.isBlank() ? skuCode.trim() : "sku";
        String title = ShopNotificationCopy.PUSH_TITLE_FULFILLMENT;
        String clientBody = MobilePushMessageFormatter.buildShopFulfillmentCompletedBody(orderPublicId, false);
        Map<String, String> data = buildShopOrderData(tid, orderPublicId, MobilePushCanonicalTypes.SHOP_FULFILLMENT_COMPLETED, title);
        data.put("skuCode", safeSku);
        sanitizeDataStrings(data);
        dispatchFanout(
                tid,
                List.of(clientUserId),
                MobilePushCanonicalTypes.SHOP_FULFILLMENT_COMPLETED,
                title,
                clientBody,
                data,
                orderPublicId,
                "fulfillment|" + safeSku);
        if (consultantUserId != null) {
            String consultantBody = MobilePushMessageFormatter.buildShopFulfillmentCompletedBody(orderPublicId, true);
            dispatchFanout(
                    tid,
                    List.of(consultantUserId),
                    MobilePushCanonicalTypes.SHOP_FULFILLMENT_COMPLETED,
                    title,
                    consultantBody,
                    data,
                    orderPublicId,
                    "fulfillment|" + safeSku + "|consultant");
        }
    }

    private void dispatchShopClientNotification(
            String tenantId,
            Long clientUserId,
            String orderPublicId,
            String canonicalType,
            String title,
            String body,
            String dedupeBucket) {
        if (clientUserId == null || orderPublicId == null || orderPublicId.isBlank()) {
            return;
        }
        String tid = requireTenantId(tenantId, null);
        if (tid == null) {
            return;
        }
        String safeTitle = title != null && !title.isBlank() ? title : "알림";
        String safeBody = body != null && !body.isBlank() ? body : safeTitle;
        Map<String, String> data = buildShopOrderData(tid, orderPublicId, canonicalType, safeTitle);
        dispatchFanout(tid, List.of(clientUserId), canonicalType, safeTitle, safeBody, data, orderPublicId, dedupeBucket);
    }

    private Map<String, String> buildShopOrderData(
            String tenantId, String orderPublicId, String canonicalType, String title) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", canonicalType);
        data.put("tenantId", tenantId);
        data.put("orderPublicId", orderPublicId);
        data.put("id", orderPublicId);
        data.put("title", truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);
        return data;
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchMappingSettlement(
            String tenantId,
            Long mappingId,
            Long clientUserId,
            Long consultantUserId,
            boolean includeConsultant,
            String canonicalType,
            String dedupeBucket,
            String title,
            String clientBody,
            String consultantBody) {
        if (mappingId == null || clientUserId == null) {
            return;
        }
        String tid = requireTenantId(tenantId, null);
        if (tid == null) {
            return;
        }
        String safeTitle = title != null && !title.isBlank() ? title : "알림";
        String safeClientBody = clientBody != null && !clientBody.isBlank() ? clientBody : safeTitle;
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", canonicalType);
        data.put("tenantId", tid);
        data.put("mappingId", String.valueOf(mappingId));
        data.put("id", String.valueOf(mappingId));
        data.put("title", truncate(safeTitle, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);
        String entityId = String.valueOf(mappingId);
        String bucket = dedupeBucket != null && !dedupeBucket.isBlank() ? dedupeBucket : "default";
        dispatchFanout(tid, List.of(clientUserId), canonicalType, safeTitle, safeClientBody, data, entityId, bucket);
        if (includeConsultant && consultantUserId != null) {
            String safeConsultantBody = consultantBody != null && !consultantBody.isBlank()
                    ? consultantBody
                    : safeClientBody;
            dispatchFanout(
                    tid,
                    List.of(consultantUserId),
                    canonicalType,
                    safeTitle,
                    safeConsultantBody,
                    data,
                    entityId,
                    bucket + "|consultant");
        }
    }

    private Map<String, String> buildScheduleData(String tenantId, Schedule schedule, String canonicalType) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", canonicalType);
        data.put("tenantId", tenantId);
        data.put("scheduleId", String.valueOf(schedule.getId()));
        data.put("id", String.valueOf(schedule.getId()));
        if (schedule.getConsultationId() != null) {
            data.put("consultationId", String.valueOf(schedule.getConsultationId()));
        }
        if (schedule.getDate() != null) {
            data.put("scheduleDate", schedule.getDate().toString());
        }
        if (schedule.getStartTime() != null) {
            data.put("startTime", MobilePushMessageFormatter.formatTime(schedule.getStartTime()));
        }
        if (schedule.getEndTime() != null) {
            data.put("endTime", MobilePushMessageFormatter.formatTime(schedule.getEndTime()));
        }
        String shortTitle = switch (canonicalType) {
            case MobilePushCanonicalTypes.BOOKING_REMINDER -> "상담 리마인더";
            case MobilePushCanonicalTypes.BOOKING_CONFIRMED -> "예약 확정";
            case MobilePushCanonicalTypes.BOOKING_CANCELLED -> "예약 취소";
            case MobilePushCanonicalTypes.BOOKING_RESCHEDULED -> "예약 일정 변경";
            default -> "상담 알림";
        };
        data.put("title", truncate(shortTitle, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);
        return data;
    }

    private String resolveUserDisplayName(String tenantId, Long userId, String fallback) {
        if (tenantId == null || tenantId.isBlank() || userId == null) {
            return fallback;
        }
        return userRepository.findByTenantIdAndId(tenantId, userId)
                .map(scheduleListUserFieldsResolver::resolveDisplayNameForScheduleList)
                .filter(name -> name != null && !name.isBlank())
                .orElse(fallback);
    }

    private void sanitizeDataStrings(Map<String, String> data) {
        for (Map.Entry<String, String> e : data.entrySet()) {
            if (e.getValue() != null && e.getValue().length() > MobilePushDispatchConstants.DATA_STRING_MAX_LENGTH) {
                e.setValue(e.getValue().substring(0, MobilePushDispatchConstants.DATA_STRING_MAX_LENGTH));
            }
        }
    }

    private String requireTenantId(String primaryTenantId, String fallbackTenantId) {
        String a = primaryTenantId != null ? primaryTenantId.trim() : "";
        if (!a.isEmpty()) {
            return a;
        }
        String b = fallbackTenantId != null ? fallbackTenantId.trim() : "";
        return b.isEmpty() ? null : b;
    }

    private void dispatchFanout(String tenantId, List<Long> rawUserIds, String canonicalType, String title,
            String body, Map<String, String> data, String dedupeEntityId, String dedupeTimeBucket) {
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("푸시 발송 생략: tenantId 없음 type={}", canonicalType);
            return;
        }
        if (expoPushProperties.getAccessToken() == null || expoPushProperties.getAccessToken().isBlank()) {
            log.warn("푸시 발송 생략: Expo access token 미설정 type={}", canonicalType);
            return;
        }
        Set<Long> userIds = rawUserIds.stream().filter(Objects::nonNull).collect(Collectors.toCollection(
                LinkedHashSet::new));
        if (userIds.isEmpty()) {
            return;
        }
        MobilePushNotificationCategory category = MobilePushNotificationCategory.forCanonicalType(canonicalType);
        List<Long> enabledUserIds = userIds.stream()
                .filter(uid -> isCategoryEnabledForUser(tenantId, uid, category))
                .collect(Collectors.toList());
        if (enabledUserIds.isEmpty()) {
            log.debug("푸시 발송 생략: 대상 사용자 모두 카테고리 off type={} tenantId={}", canonicalType, tenantId);
            return;
        }
        List<MobilePushToken> tokens = mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                tenantId, enabledUserIds);
        if (tokens.isEmpty()) {
            log.debug("푸시 발송 생략: 활성 토큰 없음 type={} tenantId={}", canonicalType, tenantId);
            return;
        }
        if (!mobilePushDispatchDedupService.tryClaim(tenantId, canonicalType, dedupeEntityId, dedupeTimeBucket)) {
            log.debug("푸시 멱등으로 스킵 type={} entity={} bucket={}", canonicalType, dedupeEntityId, dedupeTimeBucket);
            return;
        }
        sendExpoInBatches(tenantId, tokens, truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH),
                truncate(body, MobilePushDispatchConstants.BODY_MAX_LENGTH), data, canonicalType);
    }

    private boolean isCategoryEnabledForUser(String tenantId, Long userId,
            MobilePushNotificationCategory category) {
        return mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId)
                .map(category::isEnabledOn)
                .orElse(true);
    }

    private void sendExpoInBatches(String tenantId, List<MobilePushToken> tokens, String title, String body,
            Map<String, String> data, String canonicalType) {
        List<MobilePushToken> batch = new ArrayList<>(MobilePushDispatchConstants.EXPO_MESSAGES_PER_REQUEST_MAX);
        for (MobilePushToken t : tokens) {
            batch.add(t);
            if (batch.size() >= MobilePushDispatchConstants.EXPO_MESSAGES_PER_REQUEST_MAX) {
                postExpoBatch(tenantId, batch, title, body, data, canonicalType);
                batch.clear();
            }
        }
        if (!batch.isEmpty()) {
            postExpoBatch(tenantId, batch, title, body, data, canonicalType);
        }
    }

    private void postExpoBatch(String tenantId, List<MobilePushToken> batchTokens, String title, String body,
            Map<String, String> data, String canonicalType) {
        List<Map<String, Object>> messages = new ArrayList<>();
        for (MobilePushToken token : batchTokens) {
            Map<String, Object> msg = new LinkedHashMap<>();
            msg.put("to", token.getPushToken());
            msg.put("title", title);
            msg.put("body", body);
            msg.put("sound", "default");
            Map<String, String> expoData = new LinkedHashMap<>(data);
            expoData.putIfAbsent("type", canonicalType);
            expoData.putIfAbsent("tenantId", tenantId);
            msg.put("data", expoData);
            messages.add(msg);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(expoPushProperties.getAccessToken().trim());
        HttpEntity<List<Map<String, Object>>> entity = new HttpEntity<>(messages, headers);
        try {
            String responseBody = restTemplate.postForObject(expoPushProperties.getApiUrl(), entity, String.class);
            if (responseBody == null || responseBody.isBlank()) {
                log.warn("Expo 푸시 응답 본문 비어 있음 type={}", canonicalType);
                return;
            }
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode dataArray = root.get("data");
            if (dataArray == null || !dataArray.isArray()) {
                log.warn("Expo 푸시 응답 형식 비정상 type={}", canonicalType);
                return;
            }
            handleExpoTickets(tenantId, batchTokens, dataArray);
        } catch (RestClientException ex) {
            log.error("Expo 푸시 HTTP 실패 type={} tenantId={} message={}", canonicalType, tenantId, ex.getMessage());
        } catch (Exception ex) {
            log.error("Expo 푸시 처리 실패 type={} tenantId={}", canonicalType, tenantId, ex);
        }
    }

    private void handleExpoTickets(String tenantId, List<MobilePushToken> batchTokens, JsonNode dataArray) {
        int n = Math.min(batchTokens.size(), dataArray.size());
        for (int i = 0; i < n; i++) {
            JsonNode ticket = dataArray.get(i);
            if (!"error".equals(ticket.path("status").asText())) {
                continue;
            }
            String errorCode = ticket.path("details").path("error").asText("");
            String message = ticket.path("message").asText("");
            if ("DeviceNotRegistered".equals(errorCode) || message.contains("DeviceNotRegistered")) {
                deactivateInvalidToken(tenantId, batchTokens.get(i));
            } else {
                log.warn("Expo 푸시 티켓 오류 idx={} message={}", i, message);
            }
        }
    }

    private void deactivateInvalidToken(String tenantId, MobilePushToken tokenRow) {
        mobilePushTokenRepository.findByTenantIdAndPushTokenAndIsDeletedFalse(tenantId, tokenRow.getPushToken())
                .ifPresent(t -> {
                    t.setActive(false);
                    mobilePushTokenRepository.save(t);
                    log.info("푸시 토큰 비활성화(무효 응답): tenantId={} userId={}", tenantId, t.getUserId());
                });
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max);
    }
}
