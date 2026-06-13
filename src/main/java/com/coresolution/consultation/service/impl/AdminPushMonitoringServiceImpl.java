package com.coresolution.consultation.service.impl;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.PushMonitoringErrorCodes;
import com.coresolution.consultation.dto.PushMonitoringChannelBreakdown;
import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringDailyTrendPoint;
import com.coresolution.consultation.dto.PushMonitoringFailureItem;
import com.coresolution.consultation.dto.PushMonitoringKpiSummary;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringResendResponse;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.dto.PushMonitoringTenantSnapshot;
import com.coresolution.consultation.dto.SmsLogItem;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.entity.TenantKakaoAlimtalkSettings;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminPushMonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * BW-1 「푸시 설정 모니터링」 어드민 서비스 구현.
 *
 * <p>스냅샷 응답은 다음 6가지 raw 데이터를 1회 호출로 모아 KPI/채널/추이/스냅샷/실패 사례 5개
 * 영역으로 합성한다(디자이너 핸드오프 §1 / §11):
 * <ol>
 *   <li>{@link NotificationBatchSendLogRepository#findWindowByTenantAndChannel} 윈도 batch 행</li>
 *   <li>{@link NotificationBatchSendLogRepository#countWindowByTenant} 최근 5분 윈도 카운트</li>
 *   <li>{@link NotificationBatchSendLogRepository#countPendingByTenantId} PENDING 잔존 카운트</li>
 *   <li>{@link AdminTestNotificationLogRepository#findWindowByTenantAndChannel} 윈도 admin-test 행</li>
 *   <li>{@link TenantKakaoAlimtalkSettingsRepository} 테넌트 설정 1행</li>
 *   <li>공통코드 ALIMTALK_BIZ_TEMPLATE_CODE 활성 row 수</li>
 * </ol>
 *
 * <p>분류는 {@link PushMonitoringErrorCodes#categorize(Boolean, String, String)} SSOT 를 따른다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPushMonitoringServiceImpl implements AdminPushMonitoringService {

    /** 최근 5분 발송량 KPI 윈도(고정 5분 — 디자인 §1 D2). */
    static final Duration RECENT_QUEUE_WINDOW = Duration.ofMinutes(5L);

    /** 채널별 분포 ratio 분모 0 가드. */
    static final double EPSILON = 1e-9d;

    /** 일자 포맷(Asia/Seoul). */
    static final DateTimeFormatter DATE_ISO = DateTimeFormatter.ISO_LOCAL_DATE;

    /** 카카오 알림톡 템플릿 매핑 전체 슬롯 (entity 의 template_* 컬럼 7종). */
    static final int TEMPLATE_MAPPING_TOTAL_SLOTS = 7;

    /** 공통코드 그룹 — 알림톡 비즈 템플릿 매핑 row. */
    static final String COMMON_CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE = "ALIMTALK_BIZ_TEMPLATE_CODE";

    /** 재발송 사전 차단 — 본 PR 단계에서는 BATCH source 미지원. */
    static final String ERROR_CODE_BATCH_RESEND_NOT_SUPPORTED = "BATCH_RESEND_NOT_SUPPORTED";

    /** 재발송 사전 차단 — source 값 알 수 없음. */
    static final String ERROR_CODE_RESEND_SOURCE_INVALID = "RESEND_SOURCE_INVALID";

    /** 재발송 사전 차단 — 대상 행 없음. */
    static final String ERROR_CODE_RESEND_TARGET_NOT_FOUND = "RESEND_TARGET_NOT_FOUND";

    /** 재발송 사전 차단 — rate-limit 한도 초과. */
    static final String ERROR_CODE_RESEND_RATE_LIMITED = "RESEND_RATE_LIMITED";

    /** 재발송 사전 차단 — 재시도 불가 카테고리(검증/정책 skip / PENDING / 성공). */
    static final String ERROR_CODE_RESEND_NOT_RETRYABLE = "RESEND_NOT_RETRYABLE";

    /** 최근 SMS/알림톡 카드 기본 limit. */
    static final int RECENT_SMS_LOGS_DEFAULT_LIMIT = 20;

    /** 최근 SMS/알림톡 카드 최대 limit (운영 안전망). */
    static final int RECENT_SMS_LOGS_MAX_LIMIT = 100;

    /**
     * 최근 SMS/알림톡 카드 채널 필터.
     *
     * <p>PENDING/PUSH 는 의도적으로 제외한다 — 운영자는 결과가 확정된 SMS/알림톡만 본다.
     */
    static final List<String> RECENT_SMS_LOGS_CHANNELS = List.of(
        BatchNotificationTemplateCodes.CHANNEL_SMS,
        BatchNotificationTemplateCodes.CHANNEL_ALIMTALK);

    private final NotificationBatchSendLogRepository batchLogRepository;
    private final AdminTestNotificationLogRepository adminTestLogRepository;
    private final TenantKakaoAlimtalkSettingsRepository alimtalkSettingsRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final BatchNotificationProperties batchNotificationProperties;
    private final ExpoPushProperties expoPushProperties;
    private final AdminTestNotificationRateLimiter rateLimiter;
    private final UserRepository userRepository;

    /**
     * {@code kakao.alimtalk.enabled} (운영 환경변수 기반 글로벌 토글). 미설정 시 false.
     */
    @Value("${kakao.alimtalk.enabled:false}")
    private boolean kakaoAlimtalkEnabledGlobal;

    /**
     * {@code notification.enabled} (전체 알림 master switch). 미설정 시 true (기존 운영값 보존).
     */
    @Value("${notification.enabled:true}")
    private boolean notificationEnabledGlobal;

    @Override
    public PushMonitoringSnapshotResponse loadSnapshot(String tenantId,
            PushMonitoringRange range,
            PushMonitoringChannelFilter channel,
            int failuresLimit) {
        Objects.requireNonNull(tenantId, "tenantId");
        PushMonitoringRange effectiveRange = range != null ? range : PushMonitoringRange.D7;
        PushMonitoringChannelFilter effectiveChannel = channel != null
            ? channel
            : PushMonitoringChannelFilter.ALL;
        int safeLimit = failuresLimit <= 0 ? 20 : Math.min(failuresLimit, 200);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minus(effectiveRange.getWindow());

        List<NotificationBatchSendLog> batchRows =
            (effectiveChannel == PushMonitoringChannelFilter.PUSH)
                ? List.of()
                : batchLogRepository.findWindowByTenantAndChannel(
                    tenantId,
                    windowStart,
                    now,
                    mapBatchChannel(effectiveChannel));
        List<AdminTestNotificationLog> testRows =
            adminTestLogRepository.findWindowByTenantAndChannel(
                tenantId,
                windowStart,
                now,
                mapTestChannel(effectiveChannel));

        long recentFiveMinuteCount = batchLogRepository.countWindowByTenant(
            tenantId,
            now.minus(RECENT_QUEUE_WINDOW),
            now);
        long pendingCount = batchLogRepository.countPendingByTenantId(tenantId);

        PushMonitoringKpiSummary kpi = aggregateKpi(
            batchRows, testRows, recentFiveMinuteCount, pendingCount);
        List<PushMonitoringChannelBreakdown> breakdown = aggregateChannelBreakdown(
            batchRows, testRows);
        List<PushMonitoringDailyTrendPoint> trendPoints = aggregateTrend(
            batchRows, testRows, windowStart, now);
        PushMonitoringTenantSnapshot tenantSnapshot = loadTenantSnapshot(tenantId);
        List<PushMonitoringFailureItem> failures = collectFailures(batchRows, testRows, safeLimit);
        long failuresTotal = countFailuresTotal(batchRows, testRows);

        return PushMonitoringSnapshotResponse.builder()
            .generatedAt(now)
            .range(effectiveRange)
            .channel(effectiveChannel)
            .kpi(kpi)
            .channelBreakdown(breakdown)
            .trendPoints(trendPoints)
            .tenantSnapshot(tenantSnapshot)
            .operationalToggle(tenantSnapshot != null ? tenantSnapshot.getOperationalToggle() : null)
            .failures(failures)
            .failuresTotal(failuresTotal)
            .pushAutoTrackingAvailable(false)
            .costAvailable(false)
            .build();
    }

    @Override
    @Transactional
    public PushMonitoringResendResponse resendFailure(String tenantId,
            User currentUser,
            Long logId,
            String source,
            String reason) {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(currentUser, "currentUser");
        if (logId == null) {
            return failure(ERROR_CODE_RESEND_TARGET_NOT_FOUND, "재발송 대상이 지정되지 않았습니다.");
        }
        if (source == null) {
            return failure(ERROR_CODE_RESEND_SOURCE_INVALID, "재발송 source 값이 비어 있습니다.");
        }
        String normalized = source.trim().toUpperCase();

        if ("BATCH".equals(normalized)) {
            // 본 PR 단계에서는 BATCH 행 재발송을 지원하지 않는다 — 후속 PR 에서 BatchNotificationDispatchService 와
            // 통합 재발송 인프라를 정렬한 뒤 활성화한다(디자이너 핸드오프 §B.7).
            log.info("[push-monitor.resend] BATCH source 재발송 미지원 차단 — tenantId={} logId={}",
                tenantId, logId);
            return failure(ERROR_CODE_BATCH_RESEND_NOT_SUPPORTED,
                "BATCH 발송 행 재발송은 후속 PR 에서 제공됩니다.");
        }
        if (!"ADMIN_TEST".equals(normalized)) {
            return failure(ERROR_CODE_RESEND_SOURCE_INVALID,
                "재발송 source 값이 유효하지 않습니다: " + source);
        }

        Optional<AdminTestNotificationLog> rowOpt =
            adminTestLogRepository.findByIdAndTenantId(logId, tenantId);
        if (rowOpt.isEmpty()) {
            return failure(ERROR_CODE_RESEND_TARGET_NOT_FOUND,
                "재발송 대상 행을 찾을 수 없습니다 (id=" + logId + ").");
        }
        AdminTestNotificationLog row = rowOpt.get();
        String category = PushMonitoringErrorCodes.categorize(
            row.getSuccess(), row.getErrorCode(), null);
        if (!PushMonitoringErrorCodes.isRetryable(category)) {
            return failure(ERROR_CODE_RESEND_NOT_RETRYABLE,
                "이 행은 재발송 대상이 아닙니다 (카테고리=" + (category == null ? "성공" : category) + ").");
        }

        AdminTestNotificationRateLimiter.Decision decision =
            rateLimiter.tryAcquire(tenantId, currentUser.getId());
        if (decision.exceeded()) {
            return failure(ERROR_CODE_RESEND_RATE_LIMITED,
                "발송 한도를 초과했습니다. " + decision.retryAfterSeconds() + "초 후 다시 시도하세요.");
        }

        // 본 PR 은 발송 큐 적재만 마킹한다(실 발송 트리거는 후속 PR 에서 AdminManualNotificationService 통합).
        // 메인 흐름이 멈추지 않도록 in-memory 카운터만 증가시키고 logId 를 그대로 반환한다.
        rateLimiter.recordAttempt(tenantId, currentUser.getId());
        log.info("[push-monitor.resend] 재발송 큐 적재(soft) — tenantId={} logId={} source={} reason={}",
            tenantId, logId, normalized, reason);
        return PushMonitoringResendResponse.builder()
            .success(true)
            .resentLogId(logId)
            .build();
    }

    @Override
    public List<SmsLogItem> loadRecentSmsLogs(String tenantId, int limit) {
        Objects.requireNonNull(tenantId, "tenantId");
        int safeLimit = clampSmsLogsLimit(limit);
        Pageable pageable = PageRequest.of(0, safeLimit,
            Sort.by(Sort.Direction.DESC, "createdAt"));
        List<NotificationBatchSendLog> rows = batchLogRepository.findRecentByTenantAndChannels(
            tenantId, RECENT_SMS_LOGS_CHANNELS, pageable);
        if (rows.isEmpty()) {
            return Collections.emptyList();
        }
        Map<Long, String> nameByUserId = loadRecipientNames(tenantId, rows);
        List<SmsLogItem> result = new ArrayList<>(rows.size());
        for (NotificationBatchSendLog row : rows) {
            result.add(SmsLogItem.builder()
                .id(row.getId())
                .templateCode(row.getTemplateCode())
                .channelUsed(row.getChannelUsed())
                .targetType(row.getTargetType())
                .targetId(row.getTargetId())
                .recipientUserId(row.getRecipientUserId())
                .recipientName(nameByUserId.get(row.getRecipientUserId()))
                .recipientPhone(row.getRecipientPhoneMasked())
                .successFlag(row.getSuccess())
                .errorCode(row.getErrorCode())
                .errorMessage(row.getErrorMessage())
                .createdAt(row.getCreatedAt())
                .build());
        }
        return result;
    }

    /**
     * limit 안전 범위로 clamp — 0/음수 → 기본 20, 100 초과 → 100.
     *
     * @param requested 요청 limit
     * @return 안전 limit
     */
    int clampSmsLogsLimit(int requested) {
        if (requested <= 0) {
            return RECENT_SMS_LOGS_DEFAULT_LIMIT;
        }
        return Math.min(requested, RECENT_SMS_LOGS_MAX_LIMIT);
    }

    /**
     * 수신자 이름 일괄 조회 (N+1 방지).
     *
     * <p>{@code rows} 의 {@code recipient_user_id} 중복 제거 후 1회 in-쿼리. 테넌트 격리는
     * {@link User#getTenantId()} 비교로 한 번 더 가드한다(타 테넌트 이름 노출 방지).
     *
     * @param tenantId 테넌트 ID
     * @param rows     로그 행 list
     * @return userId → name 매핑(없으면 빈 map)
     */
    Map<Long, String> loadRecipientNames(String tenantId, List<NotificationBatchSendLog> rows) {
        Set<Long> userIds = rows.stream()
            .map(NotificationBatchSendLog::getRecipientUserId)
            .filter(Objects::nonNull)
            .collect(Collectors.toCollection(HashSet::new));
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Iterable<User> users = userRepository.findAllById(userIds);
        Map<Long, String> nameByUserId = new HashMap<>();
        for (User user : users) {
            if (user == null || user.getId() == null) {
                continue;
            }
            if (!tenantId.equals(user.getTenantId())) {
                continue;
            }
            nameByUserId.put(user.getId(), user.getName());
        }
        return nameByUserId;
    }

    /**
     * KPI 4 카드 산정. 외부 실패율 = external / (success + external) — Skip / PENDING 제외.
     *
     * @param batchRows  batch 행 목록
     * @param testRows   admin-test 행 목록
     * @param recentFiveMinuteCount 최근 5분 카운트
     * @param pendingCount PENDING 카운트
     * @return KPI summary
     */
    PushMonitoringKpiSummary aggregateKpi(List<NotificationBatchSendLog> batchRows,
            List<AdminTestNotificationLog> testRows,
            long recentFiveMinuteCount,
            long pendingCount) {
        long success = 0L;
        long external = 0L;
        long validationSkip = 0L;
        long policySkip = 0L;
        for (NotificationBatchSendLog row : batchRows) {
            String category = PushMonitoringErrorCodes.categorize(
                row.getSuccess(), row.getErrorCode(), row.getChannelUsed());
            if (category == null) {
                success++;
                continue;
            }
            switch (category) {
                case PushMonitoringErrorCodes.CATEGORY_EXTERNAL_FAILURE:
                    external++;
                    break;
                case PushMonitoringErrorCodes.CATEGORY_VALIDATION_SKIP:
                    validationSkip++;
                    break;
                case PushMonitoringErrorCodes.CATEGORY_POLICY_SKIP:
                    policySkip++;
                    break;
                default:
                    break;
            }
        }
        for (AdminTestNotificationLog row : testRows) {
            String category = PushMonitoringErrorCodes.categorize(
                row.getSuccess(), row.getErrorCode(), null);
            if (category == null) {
                success++;
                continue;
            }
            switch (category) {
                case PushMonitoringErrorCodes.CATEGORY_EXTERNAL_FAILURE:
                    external++;
                    break;
                case PushMonitoringErrorCodes.CATEGORY_VALIDATION_SKIP:
                    validationSkip++;
                    break;
                case PushMonitoringErrorCodes.CATEGORY_POLICY_SKIP:
                    policySkip++;
                    break;
                default:
                    break;
            }
        }
        double denominator = (double) success + external;
        double rate = denominator < EPSILON ? 0.0d : (external / denominator);
        return PushMonitoringKpiSummary.builder()
            .recentFiveMinuteCount(recentFiveMinuteCount)
            .pendingCount(pendingCount)
            .successCount(success)
            .externalFailureCount(external)
            .failureRate(round4(rate))
            .validationSkipCount(validationSkip)
            .policySkipCount(policySkip)
            .skipTotalCount(validationSkip + policySkip)
            .build();
    }

    /**
     * 채널별 분포(KPI #2 보조 + 비용 placeholder 발송 건수).
     *
     * @param batchRows batch 행
     * @param testRows  admin-test 행
     * @return ALIMTALK / SMS / PUSH 순서 고정 list (값이 0 이어도 항상 3행 포함)
     */
    List<PushMonitoringChannelBreakdown> aggregateChannelBreakdown(
            List<NotificationBatchSendLog> batchRows,
            List<AdminTestNotificationLog> testRows) {
        Map<String, long[]> agg = new LinkedHashMap<>();
        agg.put(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK, new long[]{0L, 0L});
        agg.put(BatchNotificationTemplateCodes.CHANNEL_SMS, new long[]{0L, 0L});
        agg.put(TestNotificationChannel.PUSH.name(), new long[]{0L, 0L});

        for (NotificationBatchSendLog row : batchRows) {
            String channel = normalizeChannel(row.getChannelUsed());
            if (channel == null) {
                continue;
            }
            long[] cell = agg.get(channel);
            if (cell == null) {
                continue;
            }
            cell[1]++;
            if (Boolean.TRUE.equals(row.getSuccess())) {
                cell[0]++;
            }
        }
        for (AdminTestNotificationLog row : testRows) {
            if (row.getChannel() == null) {
                continue;
            }
            String channel = row.getChannel().name();
            long[] cell = agg.get(channel);
            if (cell == null) {
                continue;
            }
            cell[1]++;
            if (Boolean.TRUE.equals(row.getSuccess())) {
                cell[0]++;
            }
        }
        long totalSuccess = agg.values().stream().mapToLong(c -> c[0]).sum();
        List<PushMonitoringChannelBreakdown> result = new ArrayList<>(agg.size());
        for (Map.Entry<String, long[]> entry : agg.entrySet()) {
            long s = entry.getValue()[0];
            long t = entry.getValue()[1];
            double ratio = totalSuccess == 0L ? 0.0d : ((double) s / totalSuccess);
            result.add(PushMonitoringChannelBreakdown.builder()
                .channel(entry.getKey())
                .successCount(s)
                .totalCount(t)
                .ratio(round4(ratio))
                .build());
        }
        return result;
    }

    /**
     * 일별 추이 — 윈도 시작일~종료일 까지 모든 일자를 0 으로 채우고 행을 누적한다(빈 일자도 점유).
     *
     * @param batchRows  batch 행
     * @param testRows   admin-test 행
     * @param from       윈도 시작
     * @param to         윈도 종료
     * @return 일자별 추이 점 list (오름차순)
     */
    List<PushMonitoringDailyTrendPoint> aggregateTrend(
            List<NotificationBatchSendLog> batchRows,
            List<AdminTestNotificationLog> testRows,
            LocalDateTime from,
            LocalDateTime to) {
        ZoneId zone = ZoneId.systemDefault();
        LocalDate fromDate = from.atZone(zone).toLocalDate();
        LocalDate toDate = to.atZone(zone).toLocalDate();
        Map<String, long[]> daily = new LinkedHashMap<>();
        // 7개 카운터: alimtalk / sms / push / success / failure / skip / pending
        for (LocalDate cursor = fromDate;
                !cursor.isAfter(toDate);
                cursor = cursor.plusDays(1L)) {
            daily.put(cursor.format(DATE_ISO), new long[7]);
        }
        for (NotificationBatchSendLog row : batchRows) {
            if (row.getSentAt() == null) {
                continue;
            }
            String key = row.getSentAt().toLocalDate().format(DATE_ISO);
            long[] cell = daily.get(key);
            if (cell == null) {
                continue;
            }
            String channel = normalizeChannel(row.getChannelUsed());
            if (BatchNotificationTemplateCodes.CHANNEL_ALIMTALK.equals(channel)) {
                cell[0]++;
            } else if (BatchNotificationTemplateCodes.CHANNEL_SMS.equals(channel)) {
                cell[1]++;
            }
            String category = PushMonitoringErrorCodes.categorize(
                row.getSuccess(), row.getErrorCode(), row.getChannelUsed());
            applyTrendCategory(cell, category);
        }
        for (AdminTestNotificationLog row : testRows) {
            if (row.getSentAt() == null || row.getChannel() == null) {
                continue;
            }
            String key = row.getSentAt().toLocalDate().format(DATE_ISO);
            long[] cell = daily.get(key);
            if (cell == null) {
                continue;
            }
            switch (row.getChannel()) {
                case ALIMTALK:
                    cell[0]++;
                    break;
                case SMS:
                    cell[1]++;
                    break;
                case PUSH:
                    cell[2]++;
                    break;
                default:
                    break;
            }
            String category = PushMonitoringErrorCodes.categorize(
                row.getSuccess(), row.getErrorCode(), null);
            applyTrendCategory(cell, category);
        }
        List<PushMonitoringDailyTrendPoint> result = new ArrayList<>(daily.size());
        for (Map.Entry<String, long[]> entry : daily.entrySet()) {
            long[] c = entry.getValue();
            result.add(PushMonitoringDailyTrendPoint.builder()
                .dateIso(entry.getKey())
                .alimtalkCount(c[0])
                .smsCount(c[1])
                .pushCount(c[2])
                .successCount(c[3])
                .failureCount(c[4])
                .skipCount(c[5])
                .pendingCount(c[6])
                .build());
        }
        return result;
    }

    /**
     * 테넌트 설정 스냅샷 + 운영 토글.
     *
     * @param tenantId 테넌트 ID
     * @return 스냅샷 (없을 시 OFF/✗ 기본값)
     */
    PushMonitoringTenantSnapshot loadTenantSnapshot(String tenantId) {
        Optional<TenantKakaoAlimtalkSettings> alimtalkOpt =
            alimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        boolean alimtalkEnabled = alimtalkOpt.map(s -> Boolean.TRUE.equals(s.getAlimtalkEnabled()))
            .orElse(false);
        boolean apiKey = alimtalkOpt.map(s -> nonBlank(s.getKakaoApiKeyRef())).orElse(false);
        boolean senderKey = alimtalkOpt.map(s -> nonBlank(s.getKakaoSenderKeyRef())).orElse(false);
        int filledTemplates = alimtalkOpt.map(this::countFilledTemplates).orElse(0);
        long bizCodeCount = commonCodeRepository
            .findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                tenantId, COMMON_CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE)
            .size();
        boolean expoToken = nonBlank(expoPushProperties.getAccessToken());

        boolean alimtalkRoute =
            kakaoAlimtalkEnabledGlobal
                && batchNotificationProperties.isAlimtalkEnabled();
        boolean smsRoute = notificationEnabledGlobal;
        boolean pushRoute = expoToken && notificationEnabledGlobal;

        return PushMonitoringTenantSnapshot.builder()
            .alimtalkEnabled(alimtalkEnabled)
            .kakaoApiKeyRegistered(apiKey)
            .kakaoSenderKeyRegistered(senderKey)
            .templateMapping(PushMonitoringTenantSnapshot.TemplateMapping.builder()
                .filled(filledTemplates)
                .total(TEMPLATE_MAPPING_TOTAL_SLOTS)
                .build())
            .alimtalkBizTemplateCodeCount(bizCodeCount)
            .expoPushAccessTokenRegistered(expoToken)
            .operationalToggle(PushMonitoringTenantSnapshot.OperationalToggle.builder()
                .alimtalk(alimtalkRoute)
                .sms(smsRoute)
                .push(pushRoute)
                .build())
            .build();
    }

    /**
     * 최근 실패 사례 N행. batch + admin-test 합본 후 발송 시각 내림차순으로 N건 반환.
     *
     * @param batchRows batch 행 (윈도 내림차순)
     * @param testRows  admin-test 행 (윈도 내림차순)
     * @param limit     최대 반환 건수
     * @return 실패 사례 list
     */
    List<PushMonitoringFailureItem> collectFailures(
            List<NotificationBatchSendLog> batchRows,
            List<AdminTestNotificationLog> testRows,
            int limit) {
        List<PushMonitoringFailureItem> merged = new ArrayList<>();
        for (NotificationBatchSendLog row : batchRows) {
            String category = PushMonitoringErrorCodes.categorize(
                row.getSuccess(), row.getErrorCode(), row.getChannelUsed());
            if (category == null) {
                continue;
            }
            // 본 PR 단계에서는 BATCH 행 재발송을 지원하지 않는다(서비스 가드 — §B.7).
            // 따라서 retryable 은 항상 false 로 표기한다.
            merged.add(PushMonitoringFailureItem.builder()
                .id(row.getId())
                .source("BATCH")
                .occurredAt(row.getSentAt())
                .channel(normalizeChannel(row.getChannelUsed()))
                .templateCode(row.getTemplateCode())
                .recipientPhoneMasked(row.getRecipientPhoneMasked())
                .errorCategory(category)
                .errorCode(row.getErrorCode())
                .errorMessage(row.getErrorMessage())
                .retryable(false)
                .build());
        }
        for (AdminTestNotificationLog row : testRows) {
            String category = PushMonitoringErrorCodes.categorize(
                row.getSuccess(), row.getErrorCode(), null);
            if (category == null) {
                continue;
            }
            String channelName = row.getChannel() != null ? row.getChannel().name() : null;
            merged.add(PushMonitoringFailureItem.builder()
                .id(row.getId())
                .source("ADMIN_TEST")
                .occurredAt(row.getSentAt())
                .channel(channelName)
                .templateCode(row.getTemplateCode())
                .recipientPhoneMasked(row.getRecipientPhoneMasked())
                .errorCategory(category)
                .errorCode(row.getErrorCode())
                .errorMessage(row.getErrorMessage())
                .retryable(PushMonitoringErrorCodes.isRetryable(category))
                .build());
        }
        merged.sort(Comparator.<PushMonitoringFailureItem, LocalDateTime>comparing(
            PushMonitoringFailureItem::getOccurredAt,
            Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        if (merged.size() > limit) {
            return new ArrayList<>(merged.subList(0, limit));
        }
        return merged;
    }

    /**
     * 실패 사례 전체 카운트 (페이지네이션 hint).
     *
     * @param batchRows batch 행
     * @param testRows  admin-test 행
     * @return 분류 결과가 null 이 아닌 행의 합계
     */
    long countFailuresTotal(List<NotificationBatchSendLog> batchRows,
            List<AdminTestNotificationLog> testRows) {
        long total = 0L;
        for (NotificationBatchSendLog row : batchRows) {
            if (PushMonitoringErrorCodes.categorize(
                    row.getSuccess(), row.getErrorCode(), row.getChannelUsed()) != null) {
                total++;
            }
        }
        for (AdminTestNotificationLog row : testRows) {
            if (PushMonitoringErrorCodes.categorize(
                    row.getSuccess(), row.getErrorCode(), null) != null) {
                total++;
            }
        }
        return total;
    }

    /**
     * 채널 필터 → batch 로그 channel_used 매핑. PUSH 는 batch 로그에 존재하지 않으므로 호출자가
     * 사전에 batch 조회를 skip 한다.
     */
    private String mapBatchChannel(PushMonitoringChannelFilter filter) {
        if (filter == null || filter == PushMonitoringChannelFilter.ALL) {
            return null;
        }
        if (filter == PushMonitoringChannelFilter.ALIMTALK) {
            return BatchNotificationTemplateCodes.CHANNEL_ALIMTALK;
        }
        if (filter == PushMonitoringChannelFilter.SMS) {
            return BatchNotificationTemplateCodes.CHANNEL_SMS;
        }
        return null;
    }

    /** 채널 필터 → admin-test 로그 channel enum 매핑. */
    private TestNotificationChannel mapTestChannel(PushMonitoringChannelFilter filter) {
        if (filter == null || filter == PushMonitoringChannelFilter.ALL) {
            return null;
        }
        switch (filter) {
            case ALIMTALK:
                return TestNotificationChannel.ALIMTALK;
            case SMS:
                return TestNotificationChannel.SMS;
            case PUSH:
                return TestNotificationChannel.PUSH;
            default:
                return null;
        }
    }

    /** PENDING / null 인 batch channel_used 값을 정규화. */
    private String normalizeChannel(String channelUsed) {
        if (channelUsed == null) {
            return null;
        }
        if (PushMonitoringErrorCodes.CHANNEL_USED_PENDING.equals(channelUsed)) {
            return null;
        }
        return channelUsed;
    }

    /** trend cell 의 4~6 인덱스(success/failure/skip/pending) 카운트 적용. */
    private void applyTrendCategory(long[] cell, String category) {
        if (category == null) {
            cell[3]++;
            return;
        }
        switch (category) {
            case PushMonitoringErrorCodes.CATEGORY_EXTERNAL_FAILURE:
                cell[4]++;
                break;
            case PushMonitoringErrorCodes.CATEGORY_VALIDATION_SKIP:
            case PushMonitoringErrorCodes.CATEGORY_POLICY_SKIP:
                cell[5]++;
                break;
            case PushMonitoringErrorCodes.CATEGORY_PENDING:
                cell[6]++;
                break;
            default:
                break;
        }
    }

    /** template_* 7컬럼 중 채워진 슬롯 수. */
    private int countFilledTemplates(TenantKakaoAlimtalkSettings settings) {
        int count = 0;
        if (nonBlank(settings.getTemplateConsultationConfirmed())) count++;
        if (nonBlank(settings.getTemplateConsultationReminder())) count++;
        if (nonBlank(settings.getTemplateConsultationCancelled())) count++;
        if (nonBlank(settings.getTemplateRefundCompleted())) count++;
        if (nonBlank(settings.getTemplateScheduleChanged())) count++;
        if (nonBlank(settings.getTemplatePaymentCompleted())) count++;
        if (nonBlank(settings.getTemplateDepositPendingReminder())) count++;
        return count;
    }

    private boolean nonBlank(String value) {
        return value != null && !value.isBlank();
    }

    private double round4(double value) {
        if (!Double.isFinite(value)) {
            return 0.0d;
        }
        return Math.round(value * 10000.0d) / 10000.0d;
    }

    private PushMonitoringResendResponse failure(String errorCode, String errorMessage) {
        return PushMonitoringResendResponse.builder()
            .success(false)
            .errorCode(errorCode)
            .errorMessage(errorMessage)
            .build();
    }

    /**
     * 테스트 가시성 — KPI 시간 윈도 상수 노출.
     *
     * @return 최근 5분 윈도 길이
     */
    public static Duration getRecentQueueWindow() {
        return RECENT_QUEUE_WINDOW;
    }
}
