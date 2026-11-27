package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import com.coresolution.consultation.config.AdminTestNotificationProperties;
import com.coresolution.consultation.config.ManualNotificationProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
import com.coresolution.consultation.constant.ManualNotificationJobConstants;
import com.coresolution.consultation.constant.ManualNotificationJobStatus;
import com.coresolution.consultation.constant.ManualNotificationRecipientMode;
import com.coresolution.consultation.dto.ManualNotificationConfigResponse;
import com.coresolution.consultation.dto.ManualNotificationJobPreviewResponse;
import com.coresolution.consultation.dto.ManualNotificationJobRequest;
import com.coresolution.consultation.dto.ManualNotificationJobResponse;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplateSource;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.entity.ManualNotificationDispatchRecord;
import com.coresolution.consultation.entity.ManualNotificationJob;
import com.coresolution.consultation.entity.ManualNotificationJobRecipient;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ManualNotificationJobException;
import com.coresolution.consultation.repository.ManualNotificationDispatchRecordRepository;
import com.coresolution.consultation.repository.ManualNotificationJobRecipientRepository;
import com.coresolution.consultation.repository.ManualNotificationJobRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ManualNotificationJobService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 어드민 수동 다중 발송 작업 서비스.
 *
 * <p>확인 단계 인원 = 발송 인원 보장: 미리보기가 확정 집합의 토큰(SHA-256)을 주고, 생성은 같은 규칙으로 다시 확정한 뒤
 * 토큰이 같을 때만 그 목록을 그대로 저장한다. 다르면 409 {@code RECIPIENT_SET_CHANGED}. 저장된 목록만 발송된다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class ManualNotificationJobServiceImpl implements ManualNotificationJobService {

    private static final String MSG_LIMIT_EXCEEDED = "한 번에 최대 %d명까지 발송할 수 있습니다. (발송 대상 %d명)";
    private static final String MSG_RECIPIENTS_REQUIRED = "발송 대상이 없습니다. 수신자·제외 목록과 수신 조건을 확인해 주세요.";
    private static final String MSG_SET_CHANGED = "확인 이후 발송 대상이 바뀌었습니다. 다시 확인해 주세요. (현재 %d명)";
    private static final String MSG_TEMPLATE_NOT_MAPPED = "알림톡 템플릿 매핑이 없어 발송할 수 없습니다. (%s)";
    private static final String MSG_RATE_LIMIT = "발송 작업 생성 한도를 넘었습니다. 잠시 후 다시 시도해 주세요.";
    private static final String MSG_EXCLUSIONS_LIMIT = "제외 목록은 최대 %d명까지 지정할 수 있습니다.";
    private static final String MSG_PUSH_PHONE = "푸시 채널은 전화번호 직접 입력을 지원하지 않습니다.";
    private static final String MSG_JOB_NOT_FOUND = "발송 작업을 찾을 수 없습니다.";
    private static final String MSG_SMS_CONTENT = "메시지 본문은 필수입니다.";
    private static final String MSG_PUSH_CONTENT = "푸시 제목과 본문은 필수입니다.";
    private static final String MSG_ALIMTALK_TEMPLATE = "알림톡 템플릿 코드와 출처는 필수입니다.";
    private static final String MSG_ALL_MODE_SHAPE = "전체 내담자 모드에서는 수신자 목록 대신 제외 목록만 보낼 수 있습니다.";
    private static final String MSG_SELECTED_MODE_SHAPE = "직접 선택 모드에서는 제외 목록을 쓰지 않습니다.";
    private static final String MSG_CREATE_TOKENS = "idempotencyKey 와 snapshotToken 은 필수입니다.";

    private final ManualNotificationProperties properties;
    private final AdminTestNotificationProperties rateLimitProperties;
    private final ManualNotificationRecipientResolver recipientResolver;
    private final ManualNotificationJobStore store;
    private final ManualNotificationJobLauncher launcher;
    private final ManualNotificationDispatchGateway gateway;
    private final ManualNotificationJobRepository jobRepository;
    private final ManualNotificationJobRecipientRepository recipientRepository;
    private final ManualNotificationDispatchRecordRepository dispatchRecordRepository;
    private final UserRepository userRepository;
    private final AlimtalkTemplateMappingResolver templateMappingResolver;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    @Override
    public ManualNotificationConfigResponse getConfig() {
        return ManualNotificationConfigResponse.builder()
            .maxRecipients(properties.getMaxRecipients())
            .previewSize(properties.getPreviewSize())
            .maxExclusions(properties.getMaxExclusions())
            .build();
    }

    @Override
    public ManualNotificationJobPreviewResponse preview(String tenantId, ManualNotificationJobRequest request) {
        validateShape(tenantId, request);
        boolean marketing = isMarketing(request);
        ManualNotificationRecipientResolver.Resolution resolution = resolve(tenantId, request, marketing);
        enforceCount(resolution.recipients().size());

        List<ManualNotificationJobPreviewResponse.PreviewRecipient> previews = new ArrayList<>();
        int previewSize = Math.min(Math.max(0, properties.getPreviewSize()), resolution.recipients().size());
        for (ManualNotificationRecipientResolver.Candidate c : resolution.recipients().subList(0, previewSize)) {
            previews.add(ManualNotificationJobPreviewResponse.PreviewRecipient.builder()
                .userId(c.userId())
                .nameMasked(recipientResolver.maskedName(c.user()))
                .phoneMasked(maskPhone(request.getChannel(), c.phone()))
                .build());
        }
        return ManualNotificationJobPreviewResponse.builder()
            .channel(request.getChannel())
            .recipientMode(request.getRecipientMode())
            .marketing(marketing)
            .finalCount(resolution.recipients().size())
            .excludedCount(resolution.excludedCount())
            .ineligibleCount(resolution.ineligibleCount())
            .ineligibleReasons(resolution.ineligibleReasons())
            .maxRecipients(properties.getMaxRecipients())
            .previewRecipients(previews)
            .messagePreview(ManualNotificationJobPreviewResponse.MessagePreview.builder()
                .content(request.getChannel() == TestNotificationChannel.SMS ? request.getContent() : null)
                .title(request.getChannel() == TestNotificationChannel.PUSH ? request.getTitle() : null)
                .body(request.getChannel() == TestNotificationChannel.PUSH ? request.getBody() : null)
                .templateCode(request.getChannel() == TestNotificationChannel.ALIMTALK
                    ? request.getTemplateCode() : null)
                .templateParams(request.getChannel() == TestNotificationChannel.ALIMTALK
                    ? request.getTemplateParams() : null)
                .build())
            .snapshotToken(resolution.snapshotToken())
            .build();
    }

    @Override
    public ManualNotificationJobResponse createJob(String tenantId, User currentUser,
            ManualNotificationJobRequest request) {
        if (!StringUtils.hasText(request.getIdempotencyKey()) || !StringUtils.hasText(request.getSnapshotToken())) {
            throw new ManualNotificationJobException(ManualNotificationJobConstants.ERROR_INVALID_REQUEST,
                HttpStatus.BAD_REQUEST, MSG_CREATE_TOKENS);
        }
        String idempotencyKey = request.getIdempotencyKey().trim();
        ManualNotificationJob existing = jobRepository
            .findByTenantIdAndCreatedByUserIdAndIdempotencyKey(tenantId, currentUser.getId(), idempotencyKey)
            .orElse(null);
        if (existing != null) {
            return toResponse(existing, true, false);
        }

        validateShape(tenantId, request);
        enforceRateLimit(tenantId, currentUser.getId());
        boolean marketing = isMarketing(request);
        ManualNotificationRecipientResolver.Resolution resolution = resolve(tenantId, request, marketing);
        int total = resolution.recipients().size();
        enforceCount(total);
        if (!resolution.snapshotToken().equals(request.getSnapshotToken().trim())) {
            throw new ManualNotificationJobException(ManualNotificationJobConstants.ERROR_RECIPIENT_SET_CHANGED,
                HttpStatus.CONFLICT, String.format(MSG_SET_CHANGED, total));
        }

        int chunkSize = properties.getJob().forChannel(request.getChannel()).getChunkSize();
        if (chunkSize <= 0) {
            chunkSize = total;
        }
        int chunkCount = (total + chunkSize - 1) / chunkSize;
        ManualNotificationJob job = ManualNotificationJob.builder()
            .tenantId(tenantId)
            .jobUuid(UUID.randomUUID().toString())
            .idempotencyKey(idempotencyKey)
            .createdByUserId(currentUser.getId())
            .createdByUsername(currentUser.getUserId())
            .channel(request.getChannel())
            .recipientMode(request.getRecipientMode())
            .marketing(marketing)
            .status(ManualNotificationJobStatus.PENDING)
            .providerMode(gateway.mode())
            .messageContent(request.getChannel() == TestNotificationChannel.PUSH ? request.getBody()
                : request.getContent())
            .pushTitle(request.getChannel() == TestNotificationChannel.PUSH ? request.getTitle() : null)
            .templateCode(request.getChannel() == TestNotificationChannel.ALIMTALK ? request.getTemplateCode() : null)
            .templateSource(request.getChannel() == TestNotificationChannel.ALIMTALK
                ? request.getTemplateSource() : null)
            .templateParams(request.getChannel() == TestNotificationChannel.ALIMTALK
                ? toJson(request.getTemplateParams()) : null)
            .reason(request.getReason())
            .snapshotToken(resolution.snapshotToken())
            .excludedCount(resolution.excludedCount())
            .ineligibleCount(resolution.ineligibleCount())
            .totalCount(total)
            .sentCount(0)
            .failedCount(0)
            .skippedCount(0)
            .chunkSize(chunkSize)
            .chunkCount(chunkCount)
            .executionAttempts(0)
            .build();

        List<ManualNotificationJobRecipient> rows = new ArrayList<>(total);
        int seq = 0;
        for (ManualNotificationRecipientResolver.Candidate c : resolution.recipients()) {
            seq++;
            rows.add(ManualNotificationJobRecipient.builder()
                .tenantId(tenantId)
                .seq(seq)
                .recipientKey(c.recipientKey())
                .userId(c.userId())
                .phoneMasked(maskPhone(request.getChannel(), c.phone()))
                .phoneEncrypted(c.userId() == null ? encryptionUtil.encrypt(c.phone()) : null)
                .status(ManualNotificationDeliveryStatus.PENDING)
                .chunkIndex((seq - 1) / chunkSize)
                .attemptNo(0)
                .build());
        }

        ManualNotificationJob saved;
        try {
            saved = store.createJob(job, rows);
        } catch (DataIntegrityViolationException e) {
            ManualNotificationJob raced = jobRepository
                .findByTenantIdAndCreatedByUserIdAndIdempotencyKey(tenantId, currentUser.getId(), idempotencyKey)
                .orElseThrow(() -> e);
            return toResponse(raced, true, false);
        }
        log.info("manual_notification_job_created jobId={} tenantId={} channel={} mode={} total={} excluded={}"
                + " ineligible={} chunkSize={} chunkCount={} providerMode={}",
            saved.getJobUuid(), tenantId, saved.getChannel(), saved.getRecipientMode(), total,
            resolution.excludedCount(), resolution.ineligibleCount(), chunkSize, chunkCount, saved.getProviderMode());
        launcher.launch(saved.getId());
        return toResponse(saved, false, false);
    }

    @Override
    public ManualNotificationJobResponse getJob(String tenantId, String jobUuid, boolean includeRecords) {
        ManualNotificationJob job = jobRepository.findByTenantIdAndJobUuidAndIsDeletedFalse(tenantId, jobUuid)
            .orElseThrow(() -> new ManualNotificationJobException(ManualNotificationJobConstants.ERROR_JOB_NOT_FOUND,
                HttpStatus.NOT_FOUND, MSG_JOB_NOT_FOUND));
        return toResponse(job, false, includeRecords);
    }

    private ManualNotificationRecipientResolver.Resolution resolve(String tenantId,
            ManualNotificationJobRequest request, boolean marketing) {
        return recipientResolver.resolve(tenantId, request.getChannel(), request.getRecipientMode(),
            request.getUserIds(), request.getPhoneNumbers(), request.getExcludeIds(), marketing);
    }

    private void validateShape(String tenantId, ManualNotificationJobRequest request) {
        TestNotificationChannel channel = request.getChannel();
        if (channel == TestNotificationChannel.SMS && !StringUtils.hasText(request.getContent())) {
            throw badRequest(ManualNotificationJobConstants.ERROR_INVALID_REQUEST, MSG_SMS_CONTENT);
        }
        if (channel == TestNotificationChannel.PUSH) {
            if (!StringUtils.hasText(request.getTitle()) || !StringUtils.hasText(request.getBody())) {
                throw badRequest(ManualNotificationJobConstants.ERROR_INVALID_REQUEST, MSG_PUSH_CONTENT);
            }
            if (request.getPhoneNumbers() != null && !request.getPhoneNumbers().isEmpty()) {
                throw badRequest(ManualNotificationJobConstants.ERROR_PHONE_NOT_SUPPORTED_FOR_PUSH, MSG_PUSH_PHONE);
            }
        }
        if (channel == TestNotificationChannel.ALIMTALK) {
            if (!StringUtils.hasText(request.getTemplateCode()) || request.getTemplateSource() == null) {
                throw badRequest(ManualNotificationJobConstants.ERROR_INVALID_REQUEST, MSG_ALIMTALK_TEMPLATE);
            }
            if (request.getTemplateSource() == TestNotificationAlimtalkTemplateSource.COMMON_CODE
                    && templateMappingResolver.resolveSolapiTemplateId(tenantId, request.getTemplateCode()) == null) {
                throw new ManualNotificationJobException(ManualNotificationJobConstants.ERROR_TEMPLATE_NOT_MAPPED,
                    HttpStatus.UNPROCESSABLE_ENTITY, String.format(MSG_TEMPLATE_NOT_MAPPED, request.getTemplateCode()));
            }
        }
        if (request.getRecipientMode() == ManualNotificationRecipientMode.ALL_CLIENTS) {
            if (notEmpty(request.getUserIds()) || notEmpty(request.getPhoneNumbers())) {
                throw badRequest(ManualNotificationJobConstants.ERROR_INVALID_REQUEST, MSG_ALL_MODE_SHAPE);
            }
            int maxExclusions = properties.getMaxExclusions();
            if (request.getExcludeIds() != null && request.getExcludeIds().size() > maxExclusions) {
                throw new ManualNotificationJobException(ManualNotificationJobConstants.ERROR_EXCLUSIONS_LIMIT_EXCEEDED,
                    HttpStatus.UNPROCESSABLE_ENTITY, String.format(MSG_EXCLUSIONS_LIMIT, maxExclusions));
            }
        } else if (notEmpty(request.getExcludeIds())) {
            throw badRequest(ManualNotificationJobConstants.ERROR_INVALID_REQUEST, MSG_SELECTED_MODE_SHAPE);
        }
    }

    private void enforceCount(int total) {
        if (total == 0) {
            throw new ManualNotificationJobException(ManualNotificationJobConstants.ERROR_RECIPIENTS_REQUIRED,
                HttpStatus.UNPROCESSABLE_ENTITY, MSG_RECIPIENTS_REQUIRED);
        }
        int max = properties.getMaxRecipients();
        if (total > max) {
            throw new ManualNotificationJobException(ManualNotificationJobConstants.ERROR_RECIPIENTS_LIMIT_EXCEEDED,
                HttpStatus.UNPROCESSABLE_ENTITY, String.format(MSG_LIMIT_EXCEEDED, max, total));
        }
    }

    private void enforceRateLimit(String tenantId, Long userId) {
        LocalDateTime now = LocalDateTime.now();
        int perMinute = rateLimitProperties.getRateLimit().getPerMinute();
        int perDay = rateLimitProperties.getRateLimit().getPerDay();
        long lastMinute = jobRepository.countByTenantIdAndCreatedByUserIdAndCreatedAtAfter(tenantId, userId,
            now.minusMinutes(1));
        long lastDay = jobRepository.countByTenantIdAndCreatedByUserIdAndCreatedAtAfter(tenantId, userId,
            now.minusDays(1));
        if (lastMinute >= perMinute || lastDay >= perDay) {
            throw new ManualNotificationJobException(ManualNotificationJobConstants.ERROR_RATE_LIMIT_EXCEEDED,
                HttpStatus.TOO_MANY_REQUESTS, MSG_RATE_LIMIT);
        }
    }

    private static boolean isMarketing(ManualNotificationJobRequest request) {
        if (Boolean.TRUE.equals(request.getMarketing())) {
            return true;
        }
        return request.getChannel() == TestNotificationChannel.ALIMTALK
            && BatchNotificationTemplateCodes.isMarketingTemplate(request.getTemplateCode());
    }

    private ManualNotificationJobResponse toResponse(ManualNotificationJob job, boolean duplicate,
            boolean includeRecords) {
        int total = nz(job.getTotalCount());
        int sent = nz(job.getSentCount());
        int failed = nz(job.getFailedCount());
        int skipped = nz(job.getSkippedCount());
        ManualNotificationJobResponse.ManualNotificationJobResponseBuilder builder = ManualNotificationJobResponse
            .builder()
            .jobId(job.getJobUuid())
            .duplicateRequest(duplicate)
            .channel(job.getChannel())
            .recipientMode(job.getRecipientMode())
            .status(job.getStatus())
            .providerMode(job.getProviderMode())
            .marketing(Boolean.TRUE.equals(job.getMarketing()))
            .totalCount(total)
            .sentCount(sent)
            .failedCount(failed)
            .skippedCount(skipped)
            .remainingCount(Math.max(0, total - sent - failed - skipped))
            .excludedCount(nz(job.getExcludedCount()))
            .ineligibleCount(nz(job.getIneligibleCount()))
            .errorCode(job.getErrorCode())
            .createdAt(job.getCreatedAt())
            .startedAt(job.getStartedAt())
            .finishedAt(job.getFinishedAt());
        if (includeRecords) {
            appendRecords(job, builder);
        }
        return builder.build();
    }

    private void appendRecords(ManualNotificationJob job,
            ManualNotificationJobResponse.ManualNotificationJobResponseBuilder builder) {
        List<ManualNotificationJobRecipient> recipients = recipientRepository.findByJobIdOrderBySeqAsc(job.getId());
        List<ManualNotificationDispatchRecord> dispatches = dispatchRecordRepository
            .findByJobIdOrderByChunkIndexAscIdAsc(job.getId());
        Map<Long, ManualNotificationDispatchRecord> dispatchByRecipient = new HashMap<>();
        Set<Long> distinctRecipients = new HashSet<>();
        Set<String> distinctKeys = new HashSet<>();
        List<Integer> dispatchChunkSizes = new ArrayList<>();
        for (ManualNotificationDispatchRecord d : dispatches) {
            dispatchByRecipient.putIfAbsent(d.getJobRecipientId(), d);
            distinctRecipients.add(d.getJobRecipientId());
            distinctKeys.add(d.getDispatchKey());
            int idx = nz(d.getChunkIndex());
            while (dispatchChunkSizes.size() <= idx) {
                dispatchChunkSizes.add(0);
            }
            dispatchChunkSizes.set(idx, dispatchChunkSizes.get(idx) + 1);
        }
        int duplicateCount = dispatches.size() - Math.min(distinctRecipients.size(), distinctKeys.size());

        List<Integer> chunkSizes = new ArrayList<>();
        int chunkSize = Math.max(1, nz(job.getChunkSize()));
        int total = nz(job.getTotalCount());
        for (int from = 0; from < total; from += chunkSize) {
            chunkSizes.add(Math.min(chunkSize, total - from));
        }

        Map<Long, User> users = new HashMap<>();
        List<Long> userIds = new ArrayList<>();
        for (ManualNotificationJobRecipient r : recipients) {
            if (r.getUserId() != null) {
                userIds.add(r.getUserId());
            }
        }
        if (!userIds.isEmpty()) {
            for (User u : userRepository.findByTenantIdAndIdIn(job.getTenantId(), userIds)) {
                users.put(u.getId(), u);
            }
        }
        List<ManualNotificationJobResponse.RecipientRecord> records = new ArrayList<>(recipients.size());
        for (ManualNotificationJobRecipient r : recipients) {
            ManualNotificationDispatchRecord d = dispatchByRecipient.get(r.getId());
            records.add(ManualNotificationJobResponse.RecipientRecord.builder()
                .seq(nz(r.getSeq()))
                .userId(r.getUserId())
                .nameMasked(r.getUserId() == null ? null : recipientResolver.maskedName(users.get(r.getUserId())))
                .phoneMasked(r.getPhoneMasked())
                .status(r.getStatus())
                .chunkIndex(r.getChunkIndex())
                .dispatchKey(d == null ? null : d.getDispatchKey())
                .attemptNo(d == null ? null : d.getAttemptNo())
                .dispatchStatus(d == null ? null : d.getStatus())
                .providerResultCode(r.getProviderResultCode())
                .errorCode(r.getErrorCode())
                .errorMessage(r.getErrorMessage())
                .dispatchedAt(d == null ? null : d.getDispatchedAt())
                .completedAt(r.getCompletedAt())
                .build());
        }
        builder.summary(ManualNotificationJobResponse.Summary.builder()
                .total(total)
                .chunkSize(chunkSize)
                .chunkCount(nz(job.getChunkCount()))
                .chunkSizes(chunkSizes)
                .dispatchRecordCount(dispatches.size())
                .dispatchChunkSizes(dispatchChunkSizes)
                .duplicateCount(duplicateCount)
                .build())
            .records(records);
    }

    private static String maskPhone(TestNotificationChannel channel, String phone) {
        if (channel == TestNotificationChannel.PUSH) {
            return ManualNotificationJobConstants.PUSH_PHONE_PLACEHOLDER;
        }
        return phone == null ? ManualNotificationJobConstants.MASK_NOT_AVAILABLE : PhoneLogMasking.maskForLog(phone);
    }

    private String toJson(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(params);
        } catch (JsonProcessingException e) {
            throw badRequest(ManualNotificationJobConstants.ERROR_INVALID_REQUEST, e.getOriginalMessage());
        }
    }

    private static ManualNotificationJobException badRequest(String code, String message) {
        return new ManualNotificationJobException(code, HttpStatus.BAD_REQUEST, message);
    }

    private static boolean notEmpty(List<?> list) {
        return list != null && !list.isEmpty();
    }

    private static int nz(Integer value) {
        return value == null ? 0 : value;
    }
}
