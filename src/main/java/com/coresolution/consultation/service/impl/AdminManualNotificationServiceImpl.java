package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import com.coresolution.consultation.dto.BulkAlimtalkManualRequest;
import com.coresolution.consultation.dto.BulkNotificationResponse;
import com.coresolution.consultation.dto.BulkPushManualRequest;
import com.coresolution.consultation.dto.BulkRecipientResult;
import com.coresolution.consultation.dto.BulkSmsManualRequest;
import com.coresolution.consultation.dto.MobilePushBroadcastResult;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplateSource;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminManualNotificationService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 수동 다중 발송 서비스 구현.
 *
 * <p>발송 흐름은 단일 발송({@link AdminTestNotificationServiceImpl}) 과 동일한 helper·logger·
 * rate-limiter 를 사용하며, 배치 단위로 UUID(batch_id) 를 부여한다(기획 Q4). rate-limit 잔여가 요청
 * 수신자 수보다 부족하면 0건 발송으로 전체 차단(기획 Q5)한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AdminManualNotificationServiceImpl implements AdminManualNotificationService {

    /** rate-limit 잔여 < 요청 수신자 수일 때 배치 전체 차단(0건 발송). */
    public static final String ERROR_CODE_RATE_LIMIT_EXCEEDED_BULK = "RATE_LIMIT_EXCEEDED_BULK";

    /** 알림톡 공통코드 모드에서 매핑 누락(전체 차단). */
    public static final String ERROR_CODE_TEMPLATE_NOT_MAPPED = "TEMPLATE_NOT_MAPPED";

    /** 수신자 미존재 / 다른 테넌트 등 사용자 해석 실패. */
    public static final String ERROR_CODE_RECIPIENT_NOT_FOUND = "RECIPIENT_NOT_FOUND";

    /** 수신자 전화번호 누락(복호화 실패 포함). */
    public static final String ERROR_CODE_RECIPIENT_PHONE_MISSING = "RECIPIENT_PHONE_MISSING";

    /** 푸시 broadcast 전용 placeholder — admin_test_notification_logs.recipient_phone_masked NOT NULL 충족. */
    public static final String PUSH_PHONE_PLACEHOLDER = "[push]";

    private final UserRepository userRepository;
    private final AdminTestNotificationLogRepository logRepository;
    private final AdminTestNotificationLogger logger;
    private final AdminTestNotificationRateLimiter rateLimiter;
    private final NotificationDispatchHelper dispatchHelper;
    private final AlimtalkTemplateMappingResolver templateMappingResolver;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final MobilePushDispatchService mobilePushDispatchService;

    @Override
    public BulkNotificationResponse sendBulkSms(String tenantId, User currentUser,
            BulkSmsManualRequest request) {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(currentUser, "currentUser");
        Objects.requireNonNull(request, "request");

        String batchId = UUID.randomUUID().toString();
        LocalDateTime startedAt = LocalDateTime.now();
        List<Long> orderedIds = dedupePreserveOrder(request.getUserIds());

        // Q5 — rate-limit 잔여가 요청 수신자 수 미만이면 전체 차단(0건 발송, 감사로그 0행).
        AdminTestNotificationRateLimiter.Decision decision =
            rateLimiter.tryAcquire(tenantId, currentUser.getId());
        if (!hasEnoughCapacity(decision, orderedIds.size())) {
            String message = "분당/일당 발송 한도가 부족하여 배치 전체가 차단되었습니다."
                + " (요청=" + orderedIds.size() + ", 분당잔여=" + decision.remainingPerMinute()
                + ", 일당잔여=" + decision.remainingPerDay() + ")";
            log.warn("어드민 수동 다중 SMS — rate-limit 부족으로 차단: tenantId={}, userId={}, ids={}",
                tenantId, currentUser.getId(), orderedIds.size());
            return BulkNotificationResponse.builder()
                .batchId(batchId)
                .channel(TestNotificationChannel.SMS)
                .startedAt(startedAt)
                .totalCount(orderedIds.size())
                .successCount(0)
                .failureCount(orderedIds.size())
                .batchErrorCode(ERROR_CODE_RATE_LIMIT_EXCEEDED_BULK)
                .batchErrorMessage(message)
                .results(Collections.emptyList())
                .build();
        }

        Map<Long, User> resolved = resolveUsers(tenantId, orderedIds);
        List<BulkRecipientResult> results = new ArrayList<>(orderedIds.size());
        int successCount = 0;
        for (Long userId : orderedIds) {
            User target = resolved.get(userId);
            ResolvedRecipient recipient = resolveRecipient(userId, target);
            if (recipient.errorCode() != null) {
                results.add(buildUnresolvedResult(userId, recipient));
                continue;
            }
            AdminTestNotificationLog logEntry = logger.logAttempt(tenantId, currentUser.getId(),
                currentUser.getUserId(), TestNotificationRecipientMode.USER, recipient.userId(),
                recipient.maskedPhone(), TestNotificationChannel.SMS, null, null,
                request.getContent(), request.getReason(), batchId);
            rateLimiter.recordAttempt(tenantId, currentUser.getId());
            NotificationDispatchHelper.DispatchResult dispatch =
                dispatchHelper.dispatchSms(recipient.phone(), request.getContent());
            logger.updateResult(logEntry.getId(), dispatch.success(), null, null,
                dispatch.errorCode(), dispatch.errorMessage());
            if (dispatch.success()) {
                successCount++;
            }
            results.add(BulkRecipientResult.builder()
                .userId(recipient.userId())
                .name(recipient.name())
                .phoneMasked(recipient.maskedPhone())
                .success(dispatch.success())
                .errorCode(dispatch.errorCode())
                .errorMessage(dispatch.errorMessage())
                .solapiGroupId(null)
                .solapiMessageId(null)
                .logId(logEntry.getId())
                .build());
        }

        return BulkNotificationResponse.builder()
            .batchId(batchId)
            .channel(TestNotificationChannel.SMS)
            .startedAt(startedAt)
            .totalCount(orderedIds.size())
            .successCount(successCount)
            .failureCount(orderedIds.size() - successCount)
            .results(results)
            .build();
    }

    @Override
    public BulkNotificationResponse sendBulkAlimtalk(String tenantId, User currentUser,
            BulkAlimtalkManualRequest request) {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(currentUser, "currentUser");
        Objects.requireNonNull(request, "request");

        String batchId = UUID.randomUUID().toString();
        LocalDateTime startedAt = LocalDateTime.now();
        List<Long> orderedIds = dedupePreserveOrder(request.getUserIds());

        // 공통코드 매핑 사전 검증 — 매핑 없음 시 0건 발송으로 전체 차단(기획 Q5 와 동일 정책 확장).
        boolean liveMode = request.getTemplateSource() == TestNotificationAlimtalkTemplateSource.SOLAPI;
        String effectiveTemplateCode = request.getTemplateCode();
        if (!liveMode) {
            String mapped = templateMappingResolver.resolveSolapiTemplateId(
                tenantId, request.getTemplateCode());
            if (mapped == null) {
                String message = "Solapi 템플릿 매핑이 없어 배치 전체가 차단되었습니다 ("
                    + request.getTemplateCode() + "). 공통코드 ALIMTALK_BIZ_TEMPLATE_CODE 에 추가하거나"
                    + " 어드민 UI '솔라피 전체 보기' 에서 실 templateId 를 선택해 주세요.";
                log.warn("어드민 수동 다중 알림톡 — 매핑 없음으로 차단: codeValue={}, tenantId={}",
                    request.getTemplateCode(), tenantId);
                return BulkNotificationResponse.builder()
                    .batchId(batchId)
                    .channel(TestNotificationChannel.ALIMTALK)
                    .startedAt(startedAt)
                    .totalCount(orderedIds.size())
                    .successCount(0)
                    .failureCount(orderedIds.size())
                    .batchErrorCode(ERROR_CODE_TEMPLATE_NOT_MAPPED)
                    .batchErrorMessage(message)
                    .results(Collections.emptyList())
                    .build();
            }
            effectiveTemplateCode = mapped;
        }

        AdminTestNotificationRateLimiter.Decision decision =
            rateLimiter.tryAcquire(tenantId, currentUser.getId());
        if (!hasEnoughCapacity(decision, orderedIds.size())) {
            String message = "분당/일당 발송 한도가 부족하여 배치 전체가 차단되었습니다."
                + " (요청=" + orderedIds.size() + ", 분당잔여=" + decision.remainingPerMinute()
                + ", 일당잔여=" + decision.remainingPerDay() + ")";
            log.warn("어드민 수동 다중 알림톡 — rate-limit 부족으로 차단: tenantId={}, ids={}",
                tenantId, orderedIds.size());
            return BulkNotificationResponse.builder()
                .batchId(batchId)
                .channel(TestNotificationChannel.ALIMTALK)
                .startedAt(startedAt)
                .totalCount(orderedIds.size())
                .successCount(0)
                .failureCount(orderedIds.size())
                .batchErrorCode(ERROR_CODE_RATE_LIMIT_EXCEEDED_BULK)
                .batchErrorMessage(message)
                .results(Collections.emptyList())
                .build();
        }

        Map<String, String> baseParams = request.getTemplateParams() == null
            ? new HashMap<>()
            : new HashMap<>(request.getTemplateParams());

        Map<Long, User> resolved = resolveUsers(tenantId, orderedIds);
        List<BulkRecipientResult> results = new ArrayList<>(orderedIds.size());
        int successCount = 0;
        for (Long userId : orderedIds) {
            User target = resolved.get(userId);
            ResolvedRecipient recipient = resolveRecipient(userId, target);
            if (recipient.errorCode() != null) {
                results.add(buildUnresolvedResult(userId, recipient));
                continue;
            }
            // 같은 템플릿/파라미터 구조이지만 호출당 새 Map 으로 복사하여 외부 변형으로 인한 race 회피.
            Map<String, String> params = new HashMap<>(baseParams);
            AdminTestNotificationLog logEntry = logger.logAttempt(tenantId, currentUser.getId(),
                currentUser.getUserId(), TestNotificationRecipientMode.USER, recipient.userId(),
                recipient.maskedPhone(), TestNotificationChannel.ALIMTALK,
                request.getTemplateCode(), params, null, request.getReason(), batchId);
            rateLimiter.recordAttempt(tenantId, currentUser.getId());
            NotificationDispatchHelper.DispatchResult dispatch =
                dispatchHelper.dispatchAlimtalk(recipient.phone(), effectiveTemplateCode, params);
            logger.updateResult(logEntry.getId(), dispatch.success(),
                dispatch.solapiGroupId(), dispatch.solapiMessageId(),
                dispatch.errorCode(), dispatch.errorMessage());
            if (dispatch.success()) {
                successCount++;
            }
            results.add(BulkRecipientResult.builder()
                .userId(recipient.userId())
                .name(recipient.name())
                .phoneMasked(recipient.maskedPhone())
                .success(dispatch.success())
                .errorCode(dispatch.errorCode())
                .errorMessage(dispatch.errorMessage())
                .solapiGroupId(dispatch.solapiGroupId())
                .solapiMessageId(dispatch.solapiMessageId())
                .logId(logEntry.getId())
                .build());
        }

        return BulkNotificationResponse.builder()
            .batchId(batchId)
            .channel(TestNotificationChannel.ALIMTALK)
            .startedAt(startedAt)
            .totalCount(orderedIds.size())
            .successCount(successCount)
            .failureCount(orderedIds.size() - successCount)
            .results(results)
            .build();
    }

    @Override
    public BulkNotificationResponse sendBulkPush(String tenantId, User currentUser,
            BulkPushManualRequest request) {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(currentUser, "currentUser");
        Objects.requireNonNull(request, "request");

        String batchId = UUID.randomUUID().toString();
        LocalDateTime startedAt = LocalDateTime.now();
        List<Long> orderedIds = dedupePreserveOrder(request.getUserIds());

        // SMS·알림톡과 동일 rate-limit 풀 사용 — 어드민 남용 방지. 잔여 < 요청 수신자 수면 전체 차단.
        AdminTestNotificationRateLimiter.Decision decision =
            rateLimiter.tryAcquire(tenantId, currentUser.getId());
        if (!hasEnoughCapacity(decision, orderedIds.size())) {
            String message = "분당/일당 발송 한도가 부족하여 배치 전체가 차단되었습니다."
                + " (요청=" + orderedIds.size() + ", 분당잔여=" + decision.remainingPerMinute()
                + ", 일당잔여=" + decision.remainingPerDay() + ")";
            log.warn("어드민 수동 다중 푸시 — rate-limit 부족으로 차단: tenantId={}, userId={}, ids={}",
                tenantId, currentUser.getId(), orderedIds.size());
            return BulkNotificationResponse.builder()
                .batchId(batchId)
                .channel(TestNotificationChannel.PUSH)
                .startedAt(startedAt)
                .totalCount(orderedIds.size())
                .successCount(0)
                .failureCount(orderedIds.size())
                .batchErrorCode(ERROR_CODE_RATE_LIMIT_EXCEEDED_BULK)
                .batchErrorMessage(message)
                .results(Collections.emptyList())
                .build();
        }

        // dispatchAdminAnnouncement 가 사용자 단위 SKIPPED/FAILED 사유를 결과로 돌려준다.
        // 토큰 없음·옵트아웃은 SKIPPED — rate-limit 카운트는 호출 시도 시점에 1회씩 증가시킨다.
        Map<Long, User> resolved = resolveUsers(tenantId, orderedIds);
        Map<Long, MobilePushBroadcastResult> dispatchByUser = new LinkedHashMap<>();
        List<MobilePushBroadcastResult> dispatched = mobilePushDispatchService.dispatchAdminAnnouncement(
            tenantId, orderedIds, request.getTitle(), request.getBody(), batchId);
        for (MobilePushBroadcastResult row : dispatched) {
            if (row != null && row.getUserId() != null) {
                dispatchByUser.put(row.getUserId(), row);
            }
        }

        List<BulkRecipientResult> results = new ArrayList<>(orderedIds.size());
        int successCount = 0;
        for (Long userId : orderedIds) {
            User target = resolved.get(userId);
            String name = resolveUserName(target);
            MobilePushBroadcastResult outcome = dispatchByUser.get(userId);

            // 사용자 미존재(다른 tenant 등) — 발송 자체가 일어나지 않으므로 FAILED 처리(SMS/알림톡과 동일 정책).
            if (target == null) {
                results.add(BulkRecipientResult.builder()
                    .userId(userId)
                    .name(null)
                    .phoneMasked(PUSH_PHONE_PLACEHOLDER)
                    .success(false)
                    .errorCode(ERROR_CODE_RECIPIENT_NOT_FOUND)
                    .errorMessage("user not found in current tenant")
                    .logId(null)
                    .build());
                continue;
            }

            AdminTestNotificationLog logEntry = logger.logAttempt(tenantId, currentUser.getId(),
                currentUser.getUserId(), TestNotificationRecipientMode.USER, userId,
                PUSH_PHONE_PLACEHOLDER, TestNotificationChannel.PUSH, null, null,
                request.getTitle() + " | " + request.getBody(), request.getReason(), batchId);
            rateLimiter.recordAttempt(tenantId, currentUser.getId());

            boolean success;
            String errorCode;
            String errorMessage;
            if (outcome == null) {
                // dispatch 가 응답에 누락(이론상 발생 어렵지만 방어): FAILED 처리.
                success = false;
                errorCode = MobilePushBroadcastResult.ERROR_CODE_EXPO_FAILED;
                errorMessage = "dispatch missing result";
            } else {
                success = outcome.getStatus() == MobilePushBroadcastResult.Status.SENT;
                errorCode = outcome.getErrorCode();
                errorMessage = outcome.getErrorMessage();
            }
            logger.updateResult(logEntry.getId(), success, null, null, errorCode, errorMessage);
            if (success) {
                successCount++;
            }
            results.add(BulkRecipientResult.builder()
                .userId(userId)
                .name(name)
                .phoneMasked(PUSH_PHONE_PLACEHOLDER)
                .success(success)
                .errorCode(errorCode)
                .errorMessage(errorMessage)
                .solapiGroupId(null)
                .solapiMessageId(outcome != null ? outcome.getExpoReceiptId() : null)
                .logId(logEntry.getId())
                .build());
        }

        return BulkNotificationResponse.builder()
            .batchId(batchId)
            .channel(TestNotificationChannel.PUSH)
            .startedAt(startedAt)
            .totalCount(orderedIds.size())
            .successCount(successCount)
            .failureCount(orderedIds.size() - successCount)
            .results(results)
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BulkRecipientResult> getBatchDetails(String tenantId, String batchId) {
        Objects.requireNonNull(tenantId, "tenantId");
        if (batchId == null || batchId.isBlank()) {
            return Collections.emptyList();
        }
        List<AdminTestNotificationLog> rows = logRepository.findByTenantIdAndBatchId(tenantId, batchId);
        if (rows.isEmpty()) {
            return Collections.emptyList();
        }
        List<BulkRecipientResult> details = new ArrayList<>(rows.size());
        for (AdminTestNotificationLog row : rows) {
            details.add(BulkRecipientResult.builder()
                .userId(row.getRecipientUserId())
                .name(null)
                .phoneMasked(row.getRecipientPhoneMasked())
                .success(Boolean.TRUE.equals(row.getSuccess()))
                .errorCode(row.getErrorCode())
                .errorMessage(row.getErrorMessage())
                .solapiGroupId(row.getSolapiGroupId())
                .solapiMessageId(row.getSolapiMessageId())
                .logId(row.getId())
                .build());
        }
        return details;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BulkNotificationResponse> getBatchHistory(String tenantId, User currentUser,
            Pageable pageable) {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(currentUser, "currentUser");
        Page<AdminTestNotificationLog> headers =
            logRepository.searchBatchHeaders(tenantId, currentUser.getId(), pageable);
        return headers.map(header -> {
            List<AdminTestNotificationLog> rows =
                logRepository.findByTenantIdAndBatchId(tenantId, header.getBatchId());
            int total = rows.size();
            int success = (int) rows.stream()
                .filter(r -> Boolean.TRUE.equals(r.getSuccess())).count();
            return BulkNotificationResponse.builder()
                .batchId(header.getBatchId())
                .channel(header.getChannel())
                .startedAt(header.getSentAt())
                .totalCount(total)
                .successCount(success)
                .failureCount(total - success)
                .results(Collections.emptyList())
                .build();
        });
    }

    /**
     * rate-limit 잔여가 요청 수신자 수보다 충분한지 판정. 분당·일당 잔여 모두 통과해야 한다.
     *
     * @param decision rate-limit 판정 결과
     * @param requested 요청 수신자 수
     * @return 충분하면 true
     */
    private boolean hasEnoughCapacity(AdminTestNotificationRateLimiter.Decision decision,
            int requested) {
        if (decision.exceeded()) {
            return false;
        }
        return decision.remainingPerMinute() >= requested
            && decision.remainingPerDay() >= requested;
    }

    /**
     * 요청 ID 순서를 보존하면서 중복을 제거한다. 중복 ID 가 있어도 발송은 1회만 수행되도록.
     *
     * @param ids 요청 ID 목록(null/빈 허용)
     * @return 순서 보존 dedupe 결과
     */
    private List<Long> dedupePreserveOrder(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> seen = new LinkedHashSet<>();
        for (Long id : ids) {
            if (id != null) {
                seen.add(id);
            }
        }
        return new ArrayList<>(seen);
    }

    /**
     * tenant 한정으로 ID 목록을 batch 조회한다.
     *
     * @param tenantId 테넌트 ID
     * @param ids ID 목록
     * @return userId → User 매핑(누락 ID 는 매핑에 없음)
     */
    private Map<Long, User> resolveUsers(String tenantId, List<Long> ids) {
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        List<User> users = userRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, ids);
        Map<Long, User> map = new LinkedHashMap<>();
        for (User u : users) {
            map.put(u.getId(), u);
        }
        return map;
    }

    /**
     * 단일 수신자 검증·복호화. 누락·전화번호 부재는 errorCode 로 표기.
     *
     * @param userId 요청 ID(미존재 시에도 보존)
     * @param target {@link #resolveUsers(String, List)} 결과의 User(없으면 null)
     * @return 해석된 수신자 정보
     */
    private ResolvedRecipient resolveRecipient(Long userId, User target) {
        if (target == null) {
            return ResolvedRecipient.error(userId, ERROR_CODE_RECIPIENT_NOT_FOUND,
                "user not found in current tenant");
        }
        String phone = decryptSafely(target.getPhone());
        if (phone == null || phone.isBlank()) {
            return ResolvedRecipient.error(target.getId(), ERROR_CODE_RECIPIENT_PHONE_MISSING,
                "target user has no phone");
        }
        String name = decryptSafely(target.getName());
        return new ResolvedRecipient(target.getId(), name, phone,
            PhoneLogMasking.maskForLog(phone), null, null);
    }

    /**
     * 수신자 해석 실패 시 결과 행을 빌드한다(감사로그 INSERT 없이 응답에만 포함).
     *
     * @param userId 요청 ID
     * @param recipient 해석 실패 객체
     * @return 실패 결과
     */
    private BulkRecipientResult buildUnresolvedResult(Long userId, ResolvedRecipient recipient) {
        return BulkRecipientResult.builder()
            .userId(userId)
            .name(null)
            .phoneMasked("n/a")
            .success(false)
            .errorCode(recipient.errorCode())
            .errorMessage(recipient.errorMessage())
            .solapiGroupId(null)
            .solapiMessageId(null)
            .logId(null)
            .build();
    }

    /**
     * 푸시 결과 행에 표시할 사용자 이름(복호화 가능 시) — SMS/알림톡과 달리 phone 이 없으므로
     * resolveRecipient 와 분리한 경량 helper.
     *
     * @param target 사용자(null 가능 — 매핑 없을 시)
     * @return 복호화 이름 또는 {@code null}
     */
    private String resolveUserName(User target) {
        if (target == null) {
            return null;
        }
        return decryptSafely(target.getName());
    }

    private String decryptSafely(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        try {
            return encryptionUtil.decrypt(value);
        } catch (Exception e) {
            log.debug("개인정보 복호화 실패 (원본 반환 회피): {}", e.getMessage());
            return value;
        }
    }

    /**
     * 단일 수신자 해석 결과(전화번호 평문 포함, 메모리만).
     */
    private record ResolvedRecipient(Long userId, String name, String phone, String maskedPhone,
            String errorCode, String errorMessage) {

        static ResolvedRecipient error(Long userId, String code, String message) {
            return new ResolvedRecipient(userId, null, null, "n/a", code, message);
        }
    }
}
