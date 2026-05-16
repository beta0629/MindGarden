package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.MobilePushDispatchConstants;
import com.coresolution.consultation.constant.MobilePushNotificationCategory;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.service.MobilePushDispatchDedupService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        String body = "예약이 확정되었습니다.";
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
        String body = "예약이 취소되었습니다.";
        Map<String, String> data = buildScheduleData(tid, schedule, MobilePushCanonicalTypes.BOOKING_CANCELLED);
        dispatchFanout(tid, targets, MobilePushCanonicalTypes.BOOKING_CANCELLED, title, body, data,
                String.valueOf(schedule.getId()), "cancelled");
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
        String body = "결제가 완료되었습니다.";
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", MobilePushCanonicalTypes.PAYMENT_COMPLETED);
        data.put("tenantId", tid);
        data.put("paymentId", payment.getPaymentId() != null ? payment.getPaymentId() : "");
        data.put("id", payment.getPaymentId() != null ? payment.getPaymentId() : "");
        data.put("amount", amountStr);
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
                payment.getFailureReason() != null && !payment.getFailureReason().isBlank()
                        ? payment.getFailureReason()
                        : "결제에 실패했습니다.",
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

    private Map<String, String> buildScheduleData(String tenantId, Schedule schedule, String canonicalType) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", canonicalType);
        data.put("tenantId", tenantId);
        data.put("scheduleId", String.valueOf(schedule.getId()));
        data.put("id", String.valueOf(schedule.getId()));
        if (schedule.getConsultationId() != null) {
            data.put("consultationId", String.valueOf(schedule.getConsultationId()));
        }
        String shortTitle = switch (canonicalType) {
            case MobilePushCanonicalTypes.BOOKING_REMINDER -> "상담 리마인더";
            case MobilePushCanonicalTypes.BOOKING_CONFIRMED -> "예약 확정";
            case MobilePushCanonicalTypes.BOOKING_CANCELLED -> "예약 취소";
            default -> "상담 알림";
        };
        data.put("title", truncate(shortTitle, MobilePushDispatchConstants.TITLE_MAX_LENGTH));
        sanitizeDataStrings(data);
        return data;
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
