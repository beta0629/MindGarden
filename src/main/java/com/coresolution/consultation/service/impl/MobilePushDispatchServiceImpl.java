package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.MobilePushAllowedEvents;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.MobilePushDispatchConstants;
import com.coresolution.consultation.constant.MobilePushNotificationCategory;
import com.coresolution.consultation.constant.ShopNotificationCopy;
import com.coresolution.consultation.dto.MobilePushBroadcastResult;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
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
    private final ScheduleRepository scheduleRepository;
    private final ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    /**
     * 2026-05-26 — Expo 발송 시 알림 센터({@code system_notifications}) 인박스 동기 적재.
     * Expo POST 트랜잭션과 분리({@link Propagation#REQUIRES_NEW}) 하여 OS 푸시는 갔으나
     * 앱/웹 알림센터가 비어 있던 갭을 해소한다. 실패는 swallow.
     */
    private final MobilePushInboxPersister mobilePushInboxPersister;

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
    public void dispatchBookingConfirmed(String tenantId, Schedule schedule, Long actorUserId) {
        if (schedule == null || schedule.getId() == null) {
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
        String entityId = String.valueOf(schedule.getId());

        // 시나리오 #6 — 첫 상담은 내담자 단독 푸시(상담사 skip).
        // BatchNotificationDispatchServiceImpl#dispatchInitialGuide 의 첫상담 판정과 동일한
        // countByClientId(tenantId, clientId) == 1 가드를 답습한다(스케줄 저장 후 호출 기준).
        boolean isFirstBooking = schedule.getClientId() != null
                && isFirstScheduleForClient(tid, schedule.getClientId());

        // 시나리오 #5 — 후속 상담은 내담자·상담사 양쪽 푸시(actor-skip 적용).
        // D-2/D-3 정책: actor(변경 주체)는 자신이 만든 변경 이벤트 푸시를 받지 않는다.
        if (schedule.getClientId() != null) {
            if (isActor(actorUserId, schedule.getClientId())) {
                log.info("actor-skip: type={} scheduleId={} actorUserId={} (client=actor)",
                        MobilePushCanonicalTypes.BOOKING_CONFIRMED, schedule.getId(), actorUserId);
            } else {
                // 기존 dedupe 버킷 "confirmed" 보존 — 이미 발송된 client 푸시 재발화 방지.
                dispatchFanout(tid, List.of(schedule.getClientId()),
                        MobilePushCanonicalTypes.BOOKING_CONFIRMED, title, body, data, entityId, "confirmed");
            }
        }
        if (schedule.getConsultantId() != null) {
            if (isFirstBooking) {
                log.info("first-booking client-only: type={} scheduleId={} consultantId={} skip",
                        MobilePushCanonicalTypes.BOOKING_CONFIRMED, schedule.getId(), schedule.getConsultantId());
            } else if (isActor(actorUserId, schedule.getConsultantId())) {
                log.info("actor-skip: type={} scheduleId={} actorUserId={} (consultant=actor)",
                        MobilePushCanonicalTypes.BOOKING_CONFIRMED, schedule.getId(), actorUserId);
            } else {
                dispatchFanout(tid, List.of(schedule.getConsultantId()),
                        MobilePushCanonicalTypes.BOOKING_CONFIRMED, title, body, data, entityId, "confirmed|consultant");
            }
        }
    }

    /**
     * 첫 상담 여부 — client 의 누적(비삭제) 스케줄 카운트가 정확히 1 인지 검사.
     * 스케줄 저장 후 호출되므로 본 스케줄이 포함된다.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 users.id
     * @return 첫 상담이면 {@code true}
     */
    private boolean isFirstScheduleForClient(String tenantId, Long clientId) {
        try {
            return scheduleRepository.countByClientId(tenantId, clientId) == 1L;
        } catch (Exception ex) {
            log.warn("첫상담 카운트 조회 실패 — 후속 상담으로 가정(consultant 포함): tenantId={}, clientId={}, error={}",
                    tenantId, clientId, ex.getMessage());
            return false;
        }
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchBookingCancelled(String tenantId, Schedule schedule, Long actorUserId) {
        if (schedule == null || schedule.getId() == null) {
            return;
        }
        String tid = requireTenantId(tenantId, schedule.getTenantId());
        if (tid == null) {
            return;
        }
        String title = "예약 취소";
        String consultantName = resolveUserDisplayName(tid, schedule.getConsultantId(),
                MobilePushMessageFormatter.FALLBACK_CONSULTANT_NAME);
        String clientName = resolveUserDisplayName(tid, schedule.getClientId(),
                MobilePushMessageFormatter.FALLBACK_CLIENT_NAME);
        Map<String, String> data = buildScheduleData(tid, schedule, MobilePushCanonicalTypes.BOOKING_CANCELLED);
        String entityId = String.valueOf(schedule.getId());
        if (schedule.getClientId() != null) {
            if (isActor(actorUserId, schedule.getClientId())) {
                log.info("actor-skip: type={} scheduleId={} actorUserId={} (client=actor)",
                        MobilePushCanonicalTypes.BOOKING_CANCELLED, schedule.getId(), actorUserId);
            } else {
                String clientBody = MobilePushMessageFormatter.buildBookingCancelledBody(
                        schedule, consultantName, clientName, false);
                dispatchFanout(tid, List.of(schedule.getClientId()), MobilePushCanonicalTypes.BOOKING_CANCELLED, title,
                        clientBody, data, entityId, "cancelled");
            }
        }
        if (schedule.getConsultantId() != null) {
            if (isActor(actorUserId, schedule.getConsultantId())) {
                log.info("actor-skip: type={} scheduleId={} actorUserId={} (consultant=actor)",
                        MobilePushCanonicalTypes.BOOKING_CANCELLED, schedule.getId(), actorUserId);
            } else {
                String consultantBody = MobilePushMessageFormatter.buildBookingCancelledBody(
                        schedule, consultantName, clientName, true);
                dispatchFanout(tid, List.of(schedule.getConsultantId()), MobilePushCanonicalTypes.BOOKING_CANCELLED,
                        title, consultantBody, data, entityId, "cancelled|consultant");
            }
        }
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void dispatchBookingRescheduled(
            String tenantId,
            Schedule schedule,
            LocalDate previousDate,
            LocalTime previousStart,
            LocalTime previousEnd,
            Long actorUserId) {
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
            if (isActor(actorUserId, schedule.getClientId())) {
                log.info("actor-skip: type={} scheduleId={} actorUserId={} (client=actor)",
                        MobilePushCanonicalTypes.BOOKING_RESCHEDULED, schedule.getId(), actorUserId);
            } else {
                String clientBody = MobilePushMessageFormatter.buildBookingRescheduledBody(
                        oldSlot, newSlot, consultantName, clientName, false);
                dispatchFanout(tid, List.of(schedule.getClientId()), MobilePushCanonicalTypes.BOOKING_RESCHEDULED,
                        title, clientBody, data, entityId, bucket);
            }
        }
        if (schedule.getConsultantId() != null) {
            if (isActor(actorUserId, schedule.getConsultantId())) {
                log.info("actor-skip: type={} scheduleId={} actorUserId={} (consultant=actor)",
                        MobilePushCanonicalTypes.BOOKING_RESCHEDULED, schedule.getId(), actorUserId);
            } else {
                String consultantBody = MobilePushMessageFormatter.buildBookingRescheduledBody(
                        oldSlot, newSlot, consultantName, clientName, true);
                dispatchFanout(tid, List.of(schedule.getConsultantId()), MobilePushCanonicalTypes.BOOKING_RESCHEDULED,
                        title, consultantBody, data, entityId, bucket + "|consultant");
            }
        }
    }

    /**
     * actor(변경 주체) 가드. actorUserId가 null이면 가드 미적용. recipient.userId == actorUserId 면 true.
     */
    private static boolean isActor(Long actorUserId, Long recipientUserId) {
        return actorUserId != null && recipientUserId != null && actorUserId.equals(recipientUserId);
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
    public void dispatchAutoCancellation(
            String tenantId,
            Long userId,
            Long mappingId,
            int cancelCount,
            String mypageUrl) {
        if (userId == null) {
            return;
        }
        String tid = requireTenantId(tenantId, null);
        if (tid == null) {
            return;
        }
        // Phase 0 (Q3=3A·보조=C) 의무 통지: 사용자 카테고리·채널 선호도를 우회하기 위해 dispatchFanout
        // 을 사용하지 않고 자체 경로로 진행한다. 다만 (a) Expo 인프라 미설정·(b) 활성 토큰 없음·
        // (c) 동일 mappingId 멱등 충돌은 정상 skip(로그) — 다른 채널에는 영향 없음.
        if (expoPushProperties.getAccessToken() == null || expoPushProperties.getAccessToken().isBlank()) {
            log.warn("푸시 발송 생략(REFUND_AUTO_CANCEL): Expo access token 미설정 tenantId={} userId={}",
                    tid, userId);
            return;
        }
        List<MobilePushToken> tokens = mobilePushTokenRepository
                .findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(tid, List.of(userId));
        if (tokens.isEmpty()) {
            log.info("푸시 발송 skip(REFUND_AUTO_CANCEL): 활성 토큰 없음 tenantId={} userId={} mappingId={}",
                    tid, userId, mappingId);
            return;
        }
        String dedupeEntity = mappingId != null ? String.valueOf(mappingId) : "u-" + userId;
        String dedupeBucket = "auto-cancel|" + Math.max(cancelCount, 0);
        if (!mobilePushDispatchDedupService.tryClaim(tid,
                MobilePushCanonicalTypes.REFUND_AUTO_CANCEL, dedupeEntity, dedupeBucket)) {
            log.info("푸시 멱등 skip(REFUND_AUTO_CANCEL): tenantId={} userId={} mappingId={} bucket={}",
                    tid, userId, mappingId, dedupeBucket);
            return;
        }

        String title = com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages
                .REFUND_AUTO_CANCEL_NOTIFICATION_TITLE;
        String body = String.format(
                com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages
                        .REFUND_AUTO_CANCEL_NOTIFICATION_BODY_FMT,
                Math.max(cancelCount, 0));
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", MobilePushCanonicalTypes.REFUND_AUTO_CANCEL);
        data.put("tenantId", tid);
        if (mappingId != null) {
            data.put("mappingId", String.valueOf(mappingId));
            data.put("id", String.valueOf(mappingId));
        }
        data.put("cancelCount", String.valueOf(Math.max(cancelCount, 0)));
        if (mypageUrl != null && !mypageUrl.isBlank()) {
            data.put("url", mypageUrl.trim());
        }
        data.put("title", truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);

        sendExpoInBatches(tid, tokens,
                truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH),
                truncate(body, MobilePushDispatchConstants.BODY_MAX_LENGTH),
                data,
                MobilePushCanonicalTypes.REFUND_AUTO_CANCEL);
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
    public void dispatchMoodJournalShared(
            String tenantId,
            Long clientUserId,
            Long consultantUserId,
            String clientDisplayName,
            String journalDate,
            String emoji,
            String memoSnippet) {
        if (clientUserId == null || consultantUserId == null || journalDate == null || journalDate.isBlank()) {
            return;
        }
        String tid = requireTenantId(tenantId, null);
        if (tid == null) {
            return;
        }
        String clientLabel = clientDisplayName != null && !clientDisplayName.isBlank()
            ? clientDisplayName.trim()
            : "내담자";
        String dateLabel = journalDate.trim();
        String snippet = memoSnippet != null && !memoSnippet.isBlank()
            ? truncate(memoSnippet.trim(), 80)
            : (emoji != null && !emoji.isBlank() ? emoji.trim() : "");
        String title = "감정 일기 공유";
        String body = !snippet.isEmpty()
            ? String.format("%s님이 %s 일기를 공유했어요. %s", clientLabel, dateLabel, snippet)
            : String.format("%s님이 %s 감정 일기를 공유했어요.", clientLabel, dateLabel);
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", MobilePushCanonicalTypes.MOOD_JOURNAL_SHARED);
        data.put("tenantId", tid);
        data.put("clientUserId", String.valueOf(clientUserId));
        data.put("journalDate", dateLabel);
        data.put("id", dateLabel);
        data.put("title", truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);
        String dedupeId = clientUserId + ":" + dateLabel;
        dispatchFanout(tid, List.of(consultantUserId), MobilePushCanonicalTypes.MOOD_JOURNAL_SHARED, title, body,
                data, dedupeId, "shared");
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
        // D-4: 결제·예약 푸시 화이트리스트 - 운영 결정에 따라 입금확인/예약확인/예약변경 3종만 허용.
        // 알림톡/SMS 등 다른 채널은 본 가드 영향 없음(본 메서드는 푸시 전용 fanout).
        if (!MobilePushAllowedEvents.isAllowed(canonicalType)) {
            log.info("push-filtered: event={} (not in allowlist) tenantId={} entity={} bucket={}",
                    canonicalType, tenantId, dedupeEntityId, dedupeTimeBucket);
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
        String safeTitle = truncate(title, MobilePushDispatchConstants.TITLE_MAX_LENGTH);
        String safeBody = truncate(body, MobilePushDispatchConstants.BODY_MAX_LENGTH);
        // 알림 센터 인박스 적재: 활성 토큰을 가진 수신자만 대상. Expo POST 결과와 무관하게
        // 시도 기준으로 행을 남겨 OS 푸시-알림센터 갭을 해소한다. persist 실패는 swallow.
        persistInboxRowsForFanout(tenantId, tokens, canonicalType, safeTitle, safeBody);
        sendExpoInBatches(tenantId, tokens, safeTitle, safeBody, data, canonicalType);
    }

    /**
     * fanout 발송 시 활성 토큰을 가진 사용자별로 알림 센터 인박스 row 를 1건씩 저장한다.
     * 사용자가 여러 토큰을 보유해도 row 는 사용자당 1건이며, persist 트랜잭션은 분리되어
     * 일부 사용자 실패가 다른 사용자 persist 또는 푸시 발송을 막지 않는다.
     *
     * @param tenantId      테넌트 ID
     * @param tokens        활성 토큰 목록(사용자당 1+ 토큰)
     * @param canonicalType canonical 푸시 type
     * @param safeTitle     이미 절단된 제목
     * @param safeBody      이미 절단된 본문
     */
    private void persistInboxRowsForFanout(
            String tenantId,
            List<MobilePushToken> tokens,
            String canonicalType,
            String safeTitle,
            String safeBody) {
        Set<Long> persistedUserIds = new LinkedHashSet<>();
        for (MobilePushToken t : tokens) {
            Long uid = t.getUserId();
            if (uid == null || !persistedUserIds.add(uid)) {
                continue;
            }
            try {
                mobilePushInboxPersister.persistForRecipient(tenantId, uid, canonicalType, safeTitle, safeBody);
            } catch (Exception ex) {
                // persister 가 자체 swallow 하지만 이중 안전망: 인박스 적재 실패가
                // 다른 사용자 persist 또는 Expo POST 진행을 막지 않도록 호출 단위로 격리.
                log.warn("fanout 인박스 persist 호출 실패(무시): tenantId={} userId={} type={} reason={}",
                        tenantId, uid, canonicalType, ex.getMessage());
            }
        }
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
            // P0 (2026-06-10) — 사용자 격리 디펜스: 토큰 단위로 결정된 수신자 userId 를 페이로드에
            // 동봉해 앱 측 핸들러가 currentUser != recipient 인 경우 표시·라우팅을 드롭한다.
            // 디바이스에 잔류한 이전 사용자 토큰이 D-1 격리 무력화 상태에서도 알림을 받지 않도록
            // 차단하는 마지막 방어선.
            if (token.getUserId() != null) {
                expoData.put("recipientUserId", String.valueOf(token.getUserId()));
            }
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

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public List<MobilePushBroadcastResult> dispatchAdminAnnouncement(
            String tenantId,
            List<Long> recipientUserIds,
            String title,
            String body,
            String dedupeBucket) {
        // 입력 sanitize — 빈 리스트·null 안전 처리. 수신자 미지정은 정상 비즈니스 케이스(예: rate-limit
        // 차단 후 호출자가 빈 목록을 넘길 수 있음).
        if (recipientUserIds == null || recipientUserIds.isEmpty()) {
            return List.of();
        }
        String tid = requireTenantId(tenantId, null);
        if (tid == null) {
            // 테넌트 누락은 호출자(컨트롤러) 가드를 거쳐도 발생 가능성이 거의 없으므로 빈 결과.
            return List.of();
        }
        String safeTitle = truncate(
                title != null && !title.isBlank() ? title : "알림",
                MobilePushDispatchConstants.TITLE_MAX_LENGTH);
        String safeBody = truncate(
                body != null && !body.isBlank() ? body : safeTitle,
                MobilePushDispatchConstants.BODY_MAX_LENGTH);
        String safeBucket = dedupeBucket != null && !dedupeBucket.isBlank()
                ? dedupeBucket.trim()
                : "default";

        // 입력 순서 보존 + 중복 제거.
        List<Long> orderedIds = recipientUserIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toCollection(java.util.ArrayList::new));
        List<MobilePushBroadcastResult> results = new ArrayList<>(orderedIds.size());

        // Expo access token 누락 — 모든 수신자에 대해 SKIPPED 가 아니라 FAILED 로 표기해도 좋으나,
        // 운영 사고 방지 차원에서 호출자(서비스) 가 별도 게이트로 처리하도록 두고 여기서는 행 단위 FAILED
        // 로 명시한다(빈 결과보다 명확).
        boolean tokenAbsent = expoPushProperties.getAccessToken() == null
                || expoPushProperties.getAccessToken().isBlank();

        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT);
        data.put("tenantId", tid);
        data.put("title", safeTitle);
        sanitizeDataStrings(data);

        for (Long userId : orderedIds) {
            if (tokenAbsent) {
                results.add(MobilePushBroadcastResult.builder()
                        .userId(userId)
                        .status(MobilePushBroadcastResult.Status.FAILED)
                        .errorCode(MobilePushBroadcastResult.ERROR_CODE_EXPO_FAILED)
                        .errorMessage("Expo access token 미설정")
                        .build());
                continue;
            }
            // 1. 카테고리(SYSTEM) 게이트 — 사용자가 OFF 면 SKIPPED.
            if (!isCategoryEnabledForUser(tid, userId, MobilePushNotificationCategory.SYSTEM)) {
                results.add(MobilePushBroadcastResult.builder()
                        .userId(userId)
                        .status(MobilePushBroadcastResult.Status.SKIPPED)
                        .errorCode(MobilePushBroadcastResult.ERROR_CODE_OPTED_OUT)
                        .errorMessage("사용자가 시스템 알림을 끔(opt-out)")
                        .build());
                continue;
            }
            // 2. 활성 토큰 조회 — 없으면 SKIPPED.
            List<MobilePushToken> tokens =
                    mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                            tid, List.of(userId));
            if (tokens.isEmpty()) {
                results.add(MobilePushBroadcastResult.builder()
                        .userId(userId)
                        .status(MobilePushBroadcastResult.Status.SKIPPED)
                        .errorCode(MobilePushBroadcastResult.ERROR_CODE_NO_TOKEN)
                        .errorMessage("푸시 토큰이 없는 사용자")
                        .build());
                continue;
            }
            // 3. 멱등 청구 — bucket 은 호출자(batch UUID) + userId 조합으로 24h 내 중복 차단.
            String dedupeEntity = String.valueOf(userId);
            if (!mobilePushDispatchDedupService.tryClaim(tid,
                    MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT, dedupeEntity, safeBucket)) {
                results.add(MobilePushBroadcastResult.builder()
                        .userId(userId)
                        .status(MobilePushBroadcastResult.Status.SKIPPED)
                        .errorCode(MobilePushBroadcastResult.ERROR_CODE_DUPLICATE)
                        .errorMessage("동일 batch 멱등 중복")
                        .build());
                continue;
            }
            // 4. 단건 Expo POST — 행 단위 결과 보존을 위해 사용자별로 1회 호출.
            MobilePushBroadcastResult outcome = postAdminAnnouncementToExpo(
                    tid, userId, tokens, safeTitle, safeBody, data);
            results.add(outcome);
            // 5. 알림 센터 인박스 적재 — SENT(Expo ok) 인 사용자만. SKIPPED·FAILED 는 적재하지 않아
            //    "OS 푸시는 갔는데 알림센터에는 없음" 갭을 해소하되, 발송되지 않은 사용자 row 는 만들지 않는다.
            //    persister 가 자체 swallow 하지만 이중 안전망으로 호출 자체를 try/catch 한다.
            if (outcome != null && outcome.getStatus() == MobilePushBroadcastResult.Status.SENT) {
                try {
                    mobilePushInboxPersister.persistForRecipient(
                            tid,
                            userId,
                            MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT,
                            safeTitle,
                            safeBody);
                } catch (Exception ex) {
                    log.warn("admin-announcement 인박스 persist 호출 실패(무시): tenantId={} userId={} reason={}",
                            tid, userId, ex.getMessage());
                }
            }
        }
        return results;
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public boolean dispatchAuthenticationOtp(
            String tenantId,
            Long userId,
            String title,
            String body,
            String purposeCode) {
        if (userId == null) {
            return false;
        }
        String tid = requireTenantId(tenantId, null);
        if (tid == null) {
            log.warn("OTP push 발송 생략: tenantId 없음 userId={}", userId);
            return false;
        }
        if (expoPushProperties.getAccessToken() == null || expoPushProperties.getAccessToken().isBlank()) {
            log.warn("OTP push 발송 생략: Expo access token 미설정 tenantId={} userId={}", tid, userId);
            return false;
        }
        List<MobilePushToken> tokens = mobilePushTokenRepository
                .findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(tid, List.of(userId));
        if (tokens.isEmpty()) {
            log.info("OTP push 발송 skip: 활성 토큰 없음 tenantId={} userId={}", tid, userId);
            return false;
        }
        String safeTitle = truncate(
                title != null && !title.isBlank() ? title : "인증번호",
                MobilePushDispatchConstants.TITLE_MAX_LENGTH);
        String safeBody = truncate(
                body != null && !body.isBlank() ? body : safeTitle,
                MobilePushDispatchConstants.BODY_MAX_LENGTH);
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", MobilePushCanonicalTypes.OTP_DELIVERY);
        data.put("tenantId", tid);
        data.put("purpose", purposeCode != null && !purposeCode.isBlank() ? purposeCode.trim() : "generic");
        data.put("title", safeTitle);
        sanitizeDataStrings(data);

        List<Map<String, Object>> messages = new ArrayList<>();
        for (MobilePushToken token : tokens) {
            Map<String, Object> msg = new LinkedHashMap<>();
            msg.put("to", token.getPushToken());
            msg.put("title", safeTitle);
            msg.put("body", safeBody);
            msg.put("sound", "default");
            Map<String, String> expoData = new LinkedHashMap<>(data);
            if (token.getUserId() != null) {
                expoData.put("recipientUserId", String.valueOf(token.getUserId()));
            }
            msg.put("data", expoData);
            messages.add(msg);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(expoPushProperties.getAccessToken().trim());
        HttpEntity<List<Map<String, Object>>> entity = new HttpEntity<>(messages, headers);
        try {
            String responseBody = restTemplate.postForObject(
                    expoPushProperties.getApiUrl(), entity, String.class);
            if (responseBody == null || responseBody.isBlank()) {
                log.warn("OTP push 응답 본문 비어 있음 tenantId={} userId={}", tid, userId);
                return false;
            }
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode dataArray = root.get("data");
            if (dataArray == null || !dataArray.isArray() || dataArray.isEmpty()) {
                log.warn("OTP push 응답 형식 비정상 tenantId={} userId={}", tid, userId);
                return false;
            }
            handleExpoTickets(tid, tokens, dataArray);
            for (int i = 0; i < dataArray.size(); i++) {
                if ("ok".equals(dataArray.get(i).path("status").asText(""))) {
                    log.info("OTP push 발송 성공 tenantId={} userId={} purpose={} tickets={}",
                            tid, userId, purposeCode, dataArray.size());
                    return true;
                }
            }
            log.warn("OTP push 발송 실패: 모든 ticket error tenantId={} userId={}", tid, userId);
            return false;
        } catch (RestClientException ex) {
            log.error("OTP push HTTP 실패 tenantId={} userId={} message={}", tid, userId, ex.getMessage());
            return false;
        } catch (Exception ex) {
            log.error("OTP push 처리 실패 tenantId={} userId={}", tid, userId, ex);
            return false;
        }
    }

    /**
     * 단일 사용자에게 admin announcement Expo POST 1회 수행. 사용자 보유 토큰이 다수일 수 있으므로
     * Expo 배치 messages 로 묶어 1회 POST 한다(여전히 사용자 단위 결과 1행 보존).
     *
     * @param tenantId  테넌트 ID
     * @param userId    수신 사용자 PK
     * @param tokens    사용자 활성 토큰 목록(1+)
     * @param title     제목(이미 truncate 됨)
     * @param body      본문(이미 truncate 됨)
     * @param data      Expo data 페이로드
     * @return 행 단위 결과
     */
    private MobilePushBroadcastResult postAdminAnnouncementToExpo(
            String tenantId,
            Long userId,
            List<MobilePushToken> tokens,
            String title,
            String body,
            Map<String, String> data) {
        List<Map<String, Object>> messages = new ArrayList<>();
        for (MobilePushToken token : tokens) {
            Map<String, Object> msg = new LinkedHashMap<>();
            msg.put("to", token.getPushToken());
            msg.put("title", title);
            msg.put("body", body);
            msg.put("sound", "default");
            Map<String, String> expoData = new LinkedHashMap<>(data);
            expoData.putIfAbsent("type", MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT);
            expoData.putIfAbsent("tenantId", tenantId);
            // P0 (2026-06-10) — 사용자 격리 디펜스: 토큰 단위로 결정된 수신자 userId 동봉.
            // admin announcement 도 동일하게 앱 측 핸들러가 currentUser != recipient 인 경우
            // 표시·라우팅을 드롭하도록 한다.
            Long recipientUserId = token.getUserId() != null ? token.getUserId() : userId;
            if (recipientUserId != null) {
                expoData.put("recipientUserId", String.valueOf(recipientUserId));
            }
            msg.put("data", expoData);
            messages.add(msg);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(expoPushProperties.getAccessToken().trim());
        HttpEntity<List<Map<String, Object>>> entity = new HttpEntity<>(messages, headers);
        try {
            String responseBody = restTemplate.postForObject(
                    expoPushProperties.getApiUrl(), entity, String.class);
            if (responseBody == null || responseBody.isBlank()) {
                log.warn("Expo admin-announcement 응답 본문 비어 있음: userId={}", userId);
                return MobilePushBroadcastResult.builder()
                        .userId(userId)
                        .status(MobilePushBroadcastResult.Status.FAILED)
                        .errorCode(MobilePushBroadcastResult.ERROR_CODE_EXPO_FAILED)
                        .errorMessage("Expo response empty")
                        .build();
            }
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode dataArray = root.get("data");
            if (dataArray == null || !dataArray.isArray() || dataArray.isEmpty()) {
                return MobilePushBroadcastResult.builder()
                        .userId(userId)
                        .status(MobilePushBroadcastResult.Status.FAILED)
                        .errorCode(MobilePushBroadcastResult.ERROR_CODE_EXPO_FAILED)
                        .errorMessage("Expo response shape invalid")
                        .build();
            }
            handleExpoTickets(tenantId, tokens, dataArray);
            // 사용자 단위 결과 — 토큰 중 하나라도 ok 면 SENT, 전체 error 면 FAILED.
            String firstReceiptId = null;
            boolean anyOk = false;
            boolean anyErr = false;
            String firstErrorMessage = null;
            for (int i = 0; i < dataArray.size(); i++) {
                JsonNode ticket = dataArray.get(i);
                String status = ticket.path("status").asText("");
                if ("ok".equals(status)) {
                    anyOk = true;
                    if (firstReceiptId == null) {
                        firstReceiptId = ticket.path("id").asText(null);
                    }
                } else if ("error".equals(status)) {
                    anyErr = true;
                    if (firstErrorMessage == null) {
                        firstErrorMessage = ticket.path("message").asText("expo ticket error");
                    }
                }
            }
            if (anyOk) {
                return MobilePushBroadcastResult.builder()
                        .userId(userId)
                        .status(MobilePushBroadcastResult.Status.SENT)
                        .expoReceiptId(firstReceiptId)
                        .build();
            }
            return MobilePushBroadcastResult.builder()
                    .userId(userId)
                    .status(MobilePushBroadcastResult.Status.FAILED)
                    .errorCode(MobilePushBroadcastResult.ERROR_CODE_EXPO_FAILED)
                    .errorMessage(anyErr ? firstErrorMessage : "Expo ticket missing")
                    .build();
        } catch (RestClientException ex) {
            log.error("Expo admin-announcement HTTP 실패 userId={} message={}", userId, ex.getMessage());
            return MobilePushBroadcastResult.builder()
                    .userId(userId)
                    .status(MobilePushBroadcastResult.Status.FAILED)
                    .errorCode(MobilePushBroadcastResult.ERROR_CODE_EXPO_FAILED)
                    .errorMessage(ex.getMessage() != null ? ex.getMessage() : "RestClientException")
                    .build();
        } catch (Exception ex) {
            log.error("Expo admin-announcement 처리 실패 userId={}", userId, ex);
            return MobilePushBroadcastResult.builder()
                    .userId(userId)
                    .status(MobilePushBroadcastResult.Status.FAILED)
                    .errorCode(MobilePushBroadcastResult.ERROR_CODE_EXPO_FAILED)
                    .errorMessage(ex.getClass().getSimpleName()
                            + (ex.getMessage() != null ? ": " + ex.getMessage() : ""))
                    .build();
        }
    }
}
