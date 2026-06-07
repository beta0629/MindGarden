package com.coresolution.consultation.service.impl;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.PushMonitoringErrorCategorization;
import com.coresolution.consultation.constant.PushMonitoringErrorCategorization.Category;
import com.coresolution.consultation.dto.PushMonitoringChannelBreakdown;
import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringDailyTrendPoint;
import com.coresolution.consultation.dto.PushMonitoringFailureItem;
import com.coresolution.consultation.dto.PushMonitoringKpiSummary;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.dto.PushMonitoringTenantSnapshot;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.dto.TestSmsRequest;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.integration.solapi.KakaoSolapiCredentialResolver;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.service.AdminPushMonitoringService;
import com.coresolution.consultation.service.AdminTestNotificationService;
import com.coresolution.consultation.service.impl.AdminTestNotificationRateLimiter.Decision;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * BW-1 「푸시 설정 모니터링」 서비스 구현체.
 *
 * <p>본 클래스는 60s 폴링 응답 합성을 책임진다. 상세 정책은 {@link AdminPushMonitoringService}
 * Javadoc 참조. 핵심 책임:
 * <ol>
 *   <li>{@code notification_batch_send_log} + {@code admin_test_notification_logs} 윈도 union.</li>
 *   <li>4분류 화이트리스트 카테고리화({@link PushMonitoringErrorCategorization}).</li>
 *   <li>일별 trend, KPI summary, 채널 분포, 실패 사례 Top N 합성.</li>
 *   <li>테넌트 설정 스냅샷 — 운영 토글, SOLAPI/Expo 등록 여부, 카카오 템플릿 매핑 수.</li>
 *   <li>재발송 — {@link AdminTestNotificationService#sendSms} / {@code sendAlimtalk} 위임.
 *       Rate-limit 풀은 {@link AdminTestNotificationRateLimiter} 한 곳에서 공유한다.</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPushMonitoringServiceImpl implements AdminPushMonitoringService {

    /** 최근 5분 발송량 KPI 윈도. */
    static final Duration RECENT_FIVE_MINUTE_WINDOW = Duration.ofMinutes(5);

    /** 실패 사례 Top N 기본. */
    static final int FAILURE_LIST_TOP_N = 20;

    /** 카카오 템플릿 매핑 합산 분모(BatchNotificationTemplateCodes 의 7종). */
    static final int KAKAO_TEMPLATE_TOTAL = 7;

    /** 한국어 prefix — 외부발송 실패. */
    static final String FAILURE_PREFIX_EXTERNAL = "발송 실패: ";
    /** 한국어 prefix — 사전검증 skip. */
    static final String FAILURE_PREFIX_VALIDATION = "사전검증 skip: ";
    /** 한국어 prefix — 정책 skip. */
    static final String FAILURE_PREFIX_POLICY = "정책 skip: ";
    /** 한국어 prefix — PENDING. */
    static final String FAILURE_PREFIX_PENDING = "발송 결과 미확정: ";

    private final NotificationBatchSendLogRepository batchLogRepository;
    private final AdminTestNotificationLogRepository adminTestLogRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final BatchNotificationProperties batchProperties;
    private final ExpoPushProperties expoPushProperties;
    private final KakaoSolapiCredentialResolver solapiCredentialResolver;
    private final AdminTestNotificationService testNotificationService;

    @Value("${kakao.alimtalk.enabled:false}")
    private boolean kakaoAlimtalkEnabled;

    @Override
    public PushMonitoringSnapshotResponse buildSnapshot(String tenantId,
            PushMonitoringRange range,
            PushMonitoringChannelFilter channel) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId is blank");
        }
        PushMonitoringRange resolvedRange = range == null ? PushMonitoringRange.D7 : range;
        PushMonitoringChannelFilter resolvedChannel = channel == null
            ? PushMonitoringChannelFilter.ALL : channel;

        ZoneId zone = ZoneId.of("Asia/Seoul");
        LocalDateTime now = LocalDateTime.now(zone);
        LocalDateTime windowStart = now.minus(resolvedRange.getWindow());
        LocalDateTime fiveMinAgo = now.minus(RECENT_FIVE_MINUTE_WINDOW);

        List<NotificationBatchSendLog> batchLogs = batchLogRepository.findWindowByTenantAndChannel(
            tenantId, windowStart, now, channelUsedFilter(resolvedChannel));
        List<AdminTestNotificationLog> testLogs = adminTestLogRepository.findWindowByTenantAndChannel(
            tenantId, windowStart, now, resolvedChannel.toTestChannel());

        long pendingCount = batchLogRepository.countPendingByTenantId(tenantId);
        long batch5min = batchLogRepository.countWindowByTenant(tenantId, fiveMinAgo, now);
        long test5min = adminTestLogRepository.countWindowByTenant(tenantId, fiveMinAgo, now);

        PushMonitoringKpiSummary kpi = composeKpi(batchLogs, testLogs,
            batch5min + test5min, pendingCount);
        List<PushMonitoringChannelBreakdown> channelBreakdown = composeChannelBreakdown(
            batchLogs, testLogs);
        List<PushMonitoringDailyTrendPoint> trend = composeDailyTrend(batchLogs, testLogs,
            windowStart.toLocalDate(), now.toLocalDate());
        PushMonitoringTenantSnapshot tenantSnapshot = composeTenantSnapshot(tenantId);
        List<PushMonitoringFailureItem> failures = composeFailures(batchLogs, testLogs,
            FAILURE_LIST_TOP_N);
        long failuresTotal = countFailures(batchLogs, testLogs);

        return PushMonitoringSnapshotResponse.builder()
            .generatedAt(now)
            .range(resolvedRange)
            .channel(resolvedChannel)
            .kpi(kpi)
            .channelBreakdown(channelBreakdown)
            .trendPoints(trend)
            .tenantSnapshot(tenantSnapshot)
            .operationalToggle(tenantSnapshot.getOperationalToggle())
            .failures(failures)
            .failuresTotal(failuresTotal)
            .pushAutoTrackingAvailable(false)
            .costAvailable(false)
            .build();
    }

    @Override
    public TestNotificationResponse resend(String tenantId, User currentUser, Long logId,
            PushMonitoringFailureItem.Source source) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId is blank");
        }
        if (currentUser == null || currentUser.getId() == null) {
            throw new IllegalStateException("currentUser is required");
        }
        if (logId == null || source == null) {
            throw new IllegalArgumentException("logId/source is required");
        }

        ResendContext context = loadResendContext(tenantId, logId, source);
        if (context == null) {
            return TestNotificationResponse.builder()
                .success(false)
                .errorCode("LOG_NOT_FOUND")
                .errorMessage("재발송 대상 로그를 찾을 수 없습니다.")
                .build();
        }
        if (context.recipientUserId() == null) {
            return TestNotificationResponse.builder()
                .success(false)
                .errorCode("RECIPIENT_USER_MISSING")
                .errorMessage("재발송에는 수신자 사용자 ID 가 필요합니다(자동 푸시 단건은 어드민 수동 한정).")
                .build();
        }
        if (context.channel() == TestNotificationChannel.PUSH) {
            return TestNotificationResponse.builder()
                .success(false)
                .errorCode("PUSH_RESEND_NOT_SUPPORTED")
                .errorMessage("PUSH 채널 재발송은 어드민 수동 발송 도구에서 진행해 주세요.")
                .build();
        }

        Decision decision = testNotificationService.checkRateLimit(tenantId, currentUser.getId());
        if (decision.exceeded()) {
            return TestNotificationResponse.builder()
                .success(false)
                .errorCode("RATE_LIMIT_EXCEEDED")
                .errorMessage("재발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.")
                .build();
        }

        TestSmsRequest smsRequest = TestSmsRequest.builder()
            .recipientMode(TestNotificationRecipientMode.USER)
            .userId(context.recipientUserId())
            .message(context.message())
            .reason(buildResendReason(source, logId))
            .build();
        return testNotificationService.sendSms(tenantId, currentUser, smsRequest);
    }

    private static String buildResendReason(PushMonitoringFailureItem.Source source, Long logId) {
        return "푸시 모니터링 재발송 — source=" + source.name() + ", logId=" + logId;
    }

    private ResendContext loadResendContext(String tenantId, Long logId,
            PushMonitoringFailureItem.Source source) {
        if (source == PushMonitoringFailureItem.Source.BATCH) {
            Optional<NotificationBatchSendLog> opt = batchLogRepository.findByIdAndTenantId(logId,
                tenantId);
            return opt.map(this::toResendContextFromBatch).orElse(null);
        }
        Optional<AdminTestNotificationLog> opt = adminTestLogRepository.findByIdAndTenantId(logId,
            tenantId);
        return opt.map(AdminPushMonitoringServiceImpl::toResendContextFromAdminTest).orElse(null);
    }

    private ResendContext toResendContextFromBatch(NotificationBatchSendLog log) {
        TestNotificationChannel channel = mapBatchChannel(log.getChannelUsed());
        String fallbackBody = "[재발송] " + safe(log.getTemplateCode());
        return new ResendContext(log.getRecipientUserId(), channel, fallbackBody);
    }

    private static ResendContext toResendContextFromAdminTest(AdminTestNotificationLog log) {
        TestNotificationChannel channel = log.getChannel();
        String body = log.getMessageContent();
        if (body == null || body.isBlank()) {
            body = "[재발송] " + safe(log.getTemplateCode());
        }
        return new ResendContext(log.getRecipientUserId(), channel, body);
    }

    private static TestNotificationChannel mapBatchChannel(String channelUsed) {
        if (channelUsed == null) {
            return TestNotificationChannel.SMS;
        }
        switch (channelUsed.trim().toUpperCase()) {
            case "ALIMTALK":
                return TestNotificationChannel.ALIMTALK;
            case "SMS":
                return TestNotificationChannel.SMS;
            case "PUSH":
                return TestNotificationChannel.PUSH;
            default:
                return TestNotificationChannel.SMS;
        }
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static String channelUsedFilter(PushMonitoringChannelFilter filter) {
        return filter == PushMonitoringChannelFilter.ALL ? null : filter.name();
    }

    // --- Aggregation helpers --------------------------------------------------

    private static PushMonitoringKpiSummary composeKpi(List<NotificationBatchSendLog> batchLogs,
            List<AdminTestNotificationLog> testLogs, long fiveMinTotal, long pendingCount) {
        long success = 0;
        long external = 0;
        long validationSkip = 0;
        long policySkip = 0;

        for (NotificationBatchSendLog log : batchLogs) {
            Boolean ok = log.getSuccess();
            if (Boolean.TRUE.equals(ok)) {
                success += 1;
                continue;
            }
            Category category = PushMonitoringErrorCategorization.classify(false,
                log.getChannelUsed(), log.getErrorCode());
            if (category == null) {
                continue;
            }
            switch (category) {
                case EXTERNAL_FAILURE:
                    external += 1;
                    break;
                case VALIDATION_SKIP:
                    validationSkip += 1;
                    break;
                case POLICY_SKIP:
                    policySkip += 1;
                    break;
                case PENDING:
                default:
                    break;
            }
        }
        for (AdminTestNotificationLog log : testLogs) {
            if (Boolean.TRUE.equals(log.getSuccess())) {
                success += 1;
                continue;
            }
            // 어드민 수동은 channelUsed 컬럼이 없으므로 channel 컬럼이 항상 확정 — PENDING 은 0.
            Category category = PushMonitoringErrorCategorization.classify(false,
                log.getChannel() == null ? "" : log.getChannel().name(), log.getErrorCode());
            if (category == null) {
                continue;
            }
            switch (category) {
                case EXTERNAL_FAILURE:
                    external += 1;
                    break;
                case VALIDATION_SKIP:
                    validationSkip += 1;
                    break;
                case POLICY_SKIP:
                    policySkip += 1;
                    break;
                case PENDING:
                default:
                    break;
            }
        }

        long denom = success + external;
        double rate = denom == 0 ? 0d : ((double) external) / denom;
        long skipTotal = validationSkip + policySkip;

        return PushMonitoringKpiSummary.builder()
            .recentFiveMinuteCount(fiveMinTotal)
            .pendingCount(pendingCount)
            .successCount(success)
            .externalFailureCount(external)
            .failureRate(rate)
            .validationSkipCount(validationSkip)
            .policySkipCount(policySkip)
            .skipTotalCount(skipTotal)
            .build();
    }

    private static List<PushMonitoringChannelBreakdown> composeChannelBreakdown(
            List<NotificationBatchSendLog> batchLogs,
            List<AdminTestNotificationLog> testLogs) {
        Map<String, long[]> bucket = new HashMap<>();
        bucket.put("ALIMTALK", new long[2]);
        bucket.put("SMS", new long[2]);
        bucket.put("PUSH", new long[2]);

        for (NotificationBatchSendLog log : batchLogs) {
            String channelKey = normalizeBatchChannel(log.getChannelUsed());
            if (channelKey == null) {
                continue;
            }
            long[] arr = bucket.get(channelKey);
            arr[1] += 1;
            if (Boolean.TRUE.equals(log.getSuccess())) {
                arr[0] += 1;
            }
        }
        for (AdminTestNotificationLog log : testLogs) {
            if (log.getChannel() == null) {
                continue;
            }
            long[] arr = bucket.get(log.getChannel().name());
            if (arr == null) {
                continue;
            }
            arr[1] += 1;
            if (Boolean.TRUE.equals(log.getSuccess())) {
                arr[0] += 1;
            }
        }

        long totalSuccess = 0;
        for (long[] arr : bucket.values()) {
            totalSuccess += arr[0];
        }

        List<PushMonitoringChannelBreakdown> result = new ArrayList<>(3);
        for (String key : new String[] {"ALIMTALK", "SMS", "PUSH"}) {
            long[] arr = bucket.get(key);
            double ratio = totalSuccess == 0 ? 0d : ((double) arr[0]) / totalSuccess;
            result.add(PushMonitoringChannelBreakdown.builder()
                .channel(key)
                .successCount(arr[0])
                .totalCount(arr[1])
                .ratio(ratio)
                .build());
        }
        return result;
    }

    private static String normalizeBatchChannel(String channelUsed) {
        if (channelUsed == null || channelUsed.isBlank()) {
            return null;
        }
        String upper = channelUsed.trim().toUpperCase();
        if (upper.equals("PENDING")) {
            return null;
        }
        if (upper.equals("ALIMTALK") || upper.equals("SMS") || upper.equals("PUSH")) {
            return upper;
        }
        return null;
    }

    private static List<PushMonitoringDailyTrendPoint> composeDailyTrend(
            List<NotificationBatchSendLog> batchLogs,
            List<AdminTestNotificationLog> testLogs,
            LocalDate startDate, LocalDate endDate) {
        Map<LocalDate, long[]> daily = new HashMap<>();
        // Pre-fill range with zeros so the chart shows continuous days.
        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            daily.put(d, new long[7]);
        }
        // index map: 0 alimtalk, 1 sms, 2 push, 3 success, 4 failure, 5 skip, 6 pending

        for (NotificationBatchSendLog log : batchLogs) {
            if (log.getSentAt() == null) {
                continue;
            }
            LocalDate day = log.getSentAt().toLocalDate();
            long[] arr = daily.computeIfAbsent(day, k -> new long[7]);
            String channelKey = normalizeBatchChannel(log.getChannelUsed());
            if ("ALIMTALK".equals(channelKey)) {
                arr[0] += 1;
            } else if ("SMS".equals(channelKey)) {
                arr[1] += 1;
            } else if ("PUSH".equals(channelKey)) {
                arr[2] += 1;
            }
            if (Boolean.TRUE.equals(log.getSuccess())) {
                arr[3] += 1;
            } else {
                Category cat = PushMonitoringErrorCategorization.classify(false,
                    log.getChannelUsed(), log.getErrorCode());
                if (cat == Category.EXTERNAL_FAILURE) {
                    arr[4] += 1;
                } else if (cat == Category.VALIDATION_SKIP || cat == Category.POLICY_SKIP) {
                    arr[5] += 1;
                } else if (cat == Category.PENDING) {
                    arr[6] += 1;
                }
            }
        }
        for (AdminTestNotificationLog log : testLogs) {
            if (log.getSentAt() == null) {
                continue;
            }
            LocalDate day = log.getSentAt().toLocalDate();
            long[] arr = daily.computeIfAbsent(day, k -> new long[7]);
            if (log.getChannel() == TestNotificationChannel.ALIMTALK) {
                arr[0] += 1;
            } else if (log.getChannel() == TestNotificationChannel.SMS) {
                arr[1] += 1;
            } else if (log.getChannel() == TestNotificationChannel.PUSH) {
                arr[2] += 1;
            }
            if (Boolean.TRUE.equals(log.getSuccess())) {
                arr[3] += 1;
            } else {
                Category cat = PushMonitoringErrorCategorization.classify(false,
                    log.getChannel() == null ? "" : log.getChannel().name(), log.getErrorCode());
                if (cat == Category.EXTERNAL_FAILURE) {
                    arr[4] += 1;
                } else if (cat == Category.VALIDATION_SKIP || cat == Category.POLICY_SKIP) {
                    arr[5] += 1;
                } else if (cat == Category.PENDING) {
                    arr[6] += 1;
                }
            }
        }

        List<LocalDate> orderedDays = new ArrayList<>(daily.keySet());
        Collections.sort(orderedDays);
        List<PushMonitoringDailyTrendPoint> result = new ArrayList<>(orderedDays.size());
        for (LocalDate day : orderedDays) {
            long[] arr = daily.get(day);
            result.add(PushMonitoringDailyTrendPoint.builder()
                .dateIso(day)
                .alimtalkCount(arr[0])
                .smsCount(arr[1])
                .pushCount(arr[2])
                .successCount(arr[3])
                .failureCount(arr[4])
                .skipCount(arr[5])
                .pendingCount(arr[6])
                .build());
        }
        return result;
    }

    private PushMonitoringTenantSnapshot composeTenantSnapshot(String tenantId) {
        boolean alimtalkRouteEnabled = batchProperties.isAlimtalkEnabled();
        boolean kakaoApiKeyRegistered = solapiCredentialResolver.hasDefaultCredentials();
        boolean kakaoSenderKeyRegistered = solapiCredentialResolver.hasDefaultPfId();

        long bizCodeCount = commonCodeRepository.countByCodeGroup(
            "ALIMTALK_BIZ_TEMPLATE_CODE");
        int templateMappingFilled = countMappedTemplates(tenantId);

        boolean expoRegistered = expoPushProperties.getAccessToken() != null
            && !expoPushProperties.getAccessToken().isBlank();

        PushMonitoringTenantSnapshot.OperationalToggle toggle =
            PushMonitoringTenantSnapshot.OperationalToggle.builder()
                .alimtalk(kakaoAlimtalkEnabled && alimtalkRouteEnabled)
                .sms(true)
                .push(expoRegistered)
                .build();

        return PushMonitoringTenantSnapshot.builder()
            .alimtalkEnabled(alimtalkRouteEnabled)
            .kakaoApiKeyRegistered(kakaoApiKeyRegistered)
            .kakaoSenderKeyRegistered(kakaoSenderKeyRegistered)
            .templateMapping(PushMonitoringTenantSnapshot.TemplateMapping.builder()
                .filled(templateMappingFilled)
                .total(KAKAO_TEMPLATE_TOTAL)
                .build())
            .alimtalkBizTemplateCodeCount(bizCodeCount)
            .expoPushAccessTokenRegistered(expoRegistered)
            .operationalToggle(toggle)
            .build();
    }

    private int countMappedTemplates(String tenantId) {
        List<String> templateCodes = List.of(
            BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2,
            BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE,
            BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE,
            BatchNotificationTemplateCodes.SESSION_ENDING_SOON,
            BatchNotificationTemplateCodes.SESSION_RENEW_PROMPT,
            BatchNotificationTemplateCodes.CLIENT_WELCOME_FIRST,
            BatchNotificationTemplateCodes.INITIAL_GUIDE_OFFLINE
        );
        int filled = 0;
        for (String code : templateCodes) {
            try {
                Optional<com.coresolution.consultation.entity.CommonCode> opt = commonCodeRepository
                    .findTenantCodeByGroupAndValue(tenantId, "ALIMTALK_BIZ_TEMPLATE_CODE", code);
                if (opt.isEmpty()) {
                    opt = commonCodeRepository.findCoreCodeByGroupAndValue(
                        "ALIMTALK_BIZ_TEMPLATE_CODE", code);
                }
                if (opt.isPresent() && opt.get().getCodeLabel() != null
                        && !opt.get().getCodeLabel().isBlank()) {
                    filled += 1;
                }
            } catch (Exception e) {
                log.debug("템플릿 매핑 조회 실패 — code={}, tenantId={}, msg={}", code, tenantId,
                    e.getMessage());
            }
        }
        return filled;
    }

    private static List<PushMonitoringFailureItem> composeFailures(
            List<NotificationBatchSendLog> batchLogs,
            List<AdminTestNotificationLog> testLogs,
            int topN) {
        List<PushMonitoringFailureItem> all = new ArrayList<>();
        for (NotificationBatchSendLog log : batchLogs) {
            if (Boolean.TRUE.equals(log.getSuccess())) {
                continue;
            }
            Category category = PushMonitoringErrorCategorization.classify(false,
                log.getChannelUsed(), log.getErrorCode());
            String prefix = prefixFor(category);
            all.add(PushMonitoringFailureItem.builder()
                .id(log.getId())
                .source(PushMonitoringFailureItem.Source.BATCH)
                .occurredAt(log.getSentAt())
                .channel(safe(log.getChannelUsed()))
                .templateCode(safe(log.getTemplateCode()))
                .recipientPhoneMasked(safe(log.getRecipientPhoneMasked()))
                .errorCategory(category == null ? "" : category.name())
                .errorCode(safe(log.getErrorCode()))
                .errorMessage(prefix + safe(log.getErrorMessage()))
                .retryable(category == Category.EXTERNAL_FAILURE
                    || category == Category.PENDING)
                .solapiGroupId(log.getSolapiGroupId())
                .solapiMessageId(log.getSolapiMessageId())
                .build());
        }
        for (AdminTestNotificationLog log : testLogs) {
            if (Boolean.TRUE.equals(log.getSuccess())) {
                continue;
            }
            Category category = PushMonitoringErrorCategorization.classify(false,
                log.getChannel() == null ? "" : log.getChannel().name(), log.getErrorCode());
            String prefix = prefixFor(category);
            all.add(PushMonitoringFailureItem.builder()
                .id(log.getId())
                .source(PushMonitoringFailureItem.Source.ADMIN_TEST)
                .occurredAt(log.getSentAt())
                .channel(log.getChannel() == null ? "" : log.getChannel().name())
                .templateCode(safe(log.getTemplateCode()))
                .recipientPhoneMasked(safe(log.getRecipientPhoneMasked()))
                .errorCategory(category == null ? "" : category.name())
                .errorCode(safe(log.getErrorCode()))
                .errorMessage(prefix + safe(log.getErrorMessage()))
                .retryable(category == Category.EXTERNAL_FAILURE
                    && log.getChannel() != TestNotificationChannel.PUSH
                    && log.getRecipientUserId() != null)
                .solapiGroupId(log.getSolapiGroupId())
                .solapiMessageId(log.getSolapiMessageId())
                .build());
        }
        all.sort(Comparator.comparing(PushMonitoringFailureItem::getOccurredAt,
            Comparator.nullsLast(Comparator.reverseOrder())));
        if (all.size() > topN) {
            return all.subList(0, topN);
        }
        return all;
    }

    private static long countFailures(List<NotificationBatchSendLog> batchLogs,
            List<AdminTestNotificationLog> testLogs) {
        long count = 0;
        for (NotificationBatchSendLog log : batchLogs) {
            if (!Boolean.TRUE.equals(log.getSuccess())) {
                count += 1;
            }
        }
        for (AdminTestNotificationLog log : testLogs) {
            if (!Boolean.TRUE.equals(log.getSuccess())) {
                count += 1;
            }
        }
        return count;
    }

    private static String prefixFor(Category category) {
        if (category == null) {
            return "";
        }
        switch (category) {
            case EXTERNAL_FAILURE:
                return FAILURE_PREFIX_EXTERNAL;
            case VALIDATION_SKIP:
                return FAILURE_PREFIX_VALIDATION;
            case POLICY_SKIP:
                return FAILURE_PREFIX_POLICY;
            case PENDING:
                return FAILURE_PREFIX_PENDING;
            default:
                return "";
        }
    }

    /**
     * 재발송 컨텍스트 — 원본 로그에서 발송에 필요한 최소 정보만 추출한다.
     *
     * @param recipientUserId 재발송 대상 사용자 PK (null 가능 — 차단)
     * @param channel         원본 채널
     * @param message         재발송 본문(템플릿 보존, 알림톡은 별도 분기 필요)
     */
    private record ResendContext(Long recipientUserId, TestNotificationChannel channel,
            String message) {
    }
}
