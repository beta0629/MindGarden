package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import com.coresolution.consultation.config.HomepageInquiryProperties;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.HomepageInquiryConstants;
import com.coresolution.consultation.dto.AdminListPageResult;
import com.coresolution.consultation.dto.request.AdminHomepageInquiryStatusUpdateRequest;
import com.coresolution.consultation.dto.request.PublicHomepageInquiryCreateRequest;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryDetailResponse;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryListItemResponse;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryNewCountResponse;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.HomepageInquiry;
import com.coresolution.consultation.entity.PersonalDataAccessLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ServiceUnavailableException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.HomepageInquiryRepository;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.HomepageInquiryNotificationChannel;
import com.coresolution.consultation.service.HomepageInquiryService;
import com.coresolution.consultation.util.AdminListPaging;
import com.coresolution.consultation.util.ClientIpHashUtils;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.security.CaptchaVerifier;
import com.coresolution.core.util.HttpRequestClientIp;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

/**
 * 홈페이지 문의 서비스 구현.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Slf4j
@Service
@Transactional
public class HomepageInquiryServiceImpl implements HomepageInquiryService {

    private static final String ENTITY_TYPE = "HOMEPAGE_INQUIRY";

    private final HomepageInquiryRepository homepageInquiryRepository;
    private final TenantRepository tenantRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final PersonalDataAccessLogRepository personalDataAccessLogRepository;
    private final AuditLogService auditLogService;
    private final CaptchaVerifier homepageInquiryCaptchaVerifier;
    private final HomepageInquiryProperties homepageInquiryProperties;
    private final HomepageInquiryNotificationChannel notificationChannel;
    private final PersonalDataEncryptionUtil encryptionUtil;

    /**
     * @param homepageInquiryCaptchaVerifier 전용 Turnstile 빈({@code homepageInquiryCaptchaVerifier})
     */
    public HomepageInquiryServiceImpl(
            HomepageInquiryRepository homepageInquiryRepository,
            TenantRepository tenantRepository,
            CommonCodeRepository commonCodeRepository,
            PersonalDataAccessLogRepository personalDataAccessLogRepository,
            AuditLogService auditLogService,
            @Qualifier("homepageInquiryCaptchaVerifier") CaptchaVerifier homepageInquiryCaptchaVerifier,
            HomepageInquiryProperties homepageInquiryProperties,
            HomepageInquiryNotificationChannel notificationChannel,
            PersonalDataEncryptionUtil encryptionUtil) {
        this.homepageInquiryRepository = homepageInquiryRepository;
        this.tenantRepository = tenantRepository;
        this.commonCodeRepository = commonCodeRepository;
        this.personalDataAccessLogRepository = personalDataAccessLogRepository;
        this.auditLogService = auditLogService;
        this.homepageInquiryCaptchaVerifier = homepageInquiryCaptchaVerifier;
        this.homepageInquiryProperties = homepageInquiryProperties;
        this.notificationChannel = notificationChannel;
        this.encryptionUtil = encryptionUtil;
    }

    @Override
    public void submitPublicInquiry(String tenantSlug, PublicHomepageInquiryCreateRequest request,
            HttpServletRequest httpRequest) {
        Tenant tenant = resolveActiveTenantOrNotFound(tenantSlug);

        if (isHoneypotFilled(request)) {
            log.info("homepage-inquiry honeypot discarded: tenantId={}", tenant.getTenantId());
            return;
        }

        verifyHomepageCaptcha(request, httpRequest);

        CommonCode typeCode = resolveInquiryType(tenant.getTenantId(), request.getInquiryType());
        String clientIp = HttpRequestClientIp.resolve(httpRequest);

        HomepageInquiry entity = HomepageInquiry.builder()
                .tenantId(tenant.getTenantId())
                .name(request.getName().trim())
                .phone(request.getPhone().trim())
                .inquiryType(typeCode.getCodeValue())
                .content(request.getContent().trim())
                .privacyConsentAt(LocalDateTime.now())
                .consentVersion(request.getConsentVersion().trim())
                .status(HomepageInquiryConstants.STATUS_NEW)
                .source(HomepageInquiryConstants.SOURCE_WEB_FORM)
                .sourceRef(null)
                .legacyInquiryType(null)
                .clientIpHash(ClientIpHashUtils.sha256Hex(clientIp))
                .isDeleted(false)
                .version(0L)
                .build();

        HomepageInquiry saved = homepageInquiryRepository.save(entity);
        String typeLabel = firstNonBlank(typeCode.getKoreanName(), typeCode.getCodeLabel(), typeCode.getCodeValue());
        notificationChannel.notifyNewInquiry(tenant.getTenantId(), saved.getId(), typeLabel);
        log.info("homepage-inquiry accepted: tenantId={} inquiryId={}", tenant.getTenantId(), saved.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminListPageResult<AdminHomepageInquiryListItemResponse> listForAdmin(
            String tenantId, String status, Integer page, Integer size) {
        requireTenantId(tenantId);
        String statusFilter = normalizeStatusFilter(status);
        int[] paging = AdminListPaging.resolve(page, size);
        Page<HomepageInquiry> result = homepageInquiryRepository.findByTenantIdAndOptionalStatus(
                tenantId, statusFilter, PageRequest.of(paging[0], paging[1]));

        List<AdminHomepageInquiryListItemResponse> items = result.getContent().stream()
                .map(this::toMaskedListItem)
                .toList();
        return new AdminListPageResult<>(items, result.getTotalElements());
    }

    /**
     * 관리자 상세 조회. {@code NEW} 이면 동일 트랜잭션에서 {@code IN_PROGRESS} 로 전환·감사로그 후
     * 개인정보 접근 로그를 남긴다. 접근 로그 또는 상태 저장 실패 시 전체 롤백.
     *
     * <p>클래스 기본 {@code @Transactional} 을 쓰며 readOnly 가 아니다.
     */
    @Override
    public AdminHomepageInquiryDetailResponse getDetailForAdmin(
            String tenantId, Long id, User viewer, HttpServletRequest httpRequest) {
        requireTenantId(tenantId);
        HomepageInquiry inquiry = homepageInquiryRepository
                .findByTenantIdAndIdAndNotDeleted(tenantId, id)
                .orElseThrow(() -> new EntityNotFoundException(
                        HomepageInquiryConstants.GENERIC_NOT_FOUND_MESSAGE));

        if (HomepageInquiryConstants.STATUS_NEW.equals(inquiry.getStatus())) {
            String previous = HomepageInquiryConstants.STATUS_NEW;
            String next = HomepageInquiryConstants.STATUS_IN_PROGRESS;
            inquiry.setStatus(next);
            homepageInquiryRepository.save(inquiry);
            auditLogService.record(AuditLog.builder()
                    .tenantId(tenantId)
                    .actorUserId(viewer != null ? viewer.getId() : null)
                    .actorRole(viewer != null && viewer.getRole() != null ? viewer.getRole().name() : null)
                    .action(AuditAction.LIFECYCLE_STATE_CHANGE)
                    .entityType(ENTITY_TYPE)
                    .entityId(id)
                    .beforeJson("{\"status\":\"" + previous + "\"}")
                    .afterJson("{\"status\":\"" + next + "\"}")
                    .metadataJson(HomepageInquiryConstants.AUDIT_METADATA_AUTO_FROM_DETAIL_VIEW)
                    .build());
        }

        recordPersonalDataAccess(viewer, inquiry, httpRequest);
        return toDetail(inquiry);
    }

    @Override
    public AdminHomepageInquiryDetailResponse updateStatus(
            String tenantId, Long id, AdminHomepageInquiryStatusUpdateRequest request, User actor) {
        requireTenantId(tenantId);
        if (request == null || !request.isAllowedStatus()) {
            throw new ValidationException("허용되지 않는 상태입니다.");
        }
        HomepageInquiry inquiry = homepageInquiryRepository
                .findByTenantIdAndIdAndNotDeleted(tenantId, id)
                .orElseThrow(() -> new EntityNotFoundException(
                        HomepageInquiryConstants.GENERIC_NOT_FOUND_MESSAGE));

        String previous = inquiry.getStatus();
        String next = request.getStatus();
        if (!previous.equals(next)) {
            inquiry.setStatus(next);
            homepageInquiryRepository.save(inquiry);
            auditLogService.record(AuditLog.builder()
                    .tenantId(tenantId)
                    .actorUserId(actor != null ? actor.getId() : null)
                    .actorRole(actor != null && actor.getRole() != null ? actor.getRole().name() : null)
                    .action(AuditAction.LIFECYCLE_STATE_CHANGE)
                    .entityType(ENTITY_TYPE)
                    .entityId(id)
                    .beforeJson("{\"status\":\"" + previous + "\"}")
                    .afterJson("{\"status\":\"" + next + "\"}")
                    .metadataJson("{\"source\":\"homepage-inquiry-admin\"}")
                    .build());
        }
        return toDetail(inquiry);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminHomepageInquiryNewCountResponse countNew(String tenantId) {
        requireTenantId(tenantId);
        long count = homepageInquiryRepository.countByTenantIdAndStatusAndIsDeletedFalse(
                tenantId, HomepageInquiryConstants.STATUS_NEW);
        return AdminHomepageInquiryNewCountResponse.builder().newCount(count).build();
    }

    private void verifyHomepageCaptcha(PublicHomepageInquiryCreateRequest request,
            HttpServletRequest httpRequest) {
        HomepageInquiryProperties.Captcha captcha = homepageInquiryProperties.getCaptcha();
        if (captcha == null || !captcha.isEnabled()) {
            return;
        }
        if (!StringUtils.hasText(captcha.getSecretKey())) {
            log.warn("homepage-inquiry captcha enabled but secret missing — fail closed");
            throw new ServiceUnavailableException(HomepageInquiryConstants.CAPTCHA_UNAVAILABLE_MESSAGE);
        }
        String token = request.getCaptchaToken();
        if (!StringUtils.hasText(token)) {
            throw new ValidationException("캡차 토큰이 필요합니다.");
        }
        String remoteIp = HttpRequestClientIp.resolve(httpRequest);
        if (!homepageInquiryCaptchaVerifier.verify(token.trim(), remoteIp)) {
            throw new ValidationException("캡차 검증에 실패했습니다.");
        }
    }

    private Tenant resolveActiveTenantOrNotFound(String tenantSlug) {
        if (!StringUtils.hasText(tenantSlug)) {
            throw new EntityNotFoundException(HomepageInquiryConstants.GENERIC_NOT_FOUND_MESSAGE);
        }
        Optional<Tenant> tenantOpt = tenantRepository.findBySubdomainIgnoreCase(tenantSlug.trim());
        if (tenantOpt.isEmpty()) {
            throw new EntityNotFoundException(HomepageInquiryConstants.GENERIC_NOT_FOUND_MESSAGE);
        }
        Tenant tenant = tenantOpt.get();
        if (tenant.getStatus() != null && tenant.getStatus() != Tenant.TenantStatus.ACTIVE) {
            throw new EntityNotFoundException(HomepageInquiryConstants.GENERIC_NOT_FOUND_MESSAGE);
        }
        return tenant;
    }

    private boolean isHoneypotFilled(PublicHomepageInquiryCreateRequest request) {
        return request.getWebsite() != null && !request.getWebsite().isBlank();
    }

    private CommonCode resolveInquiryType(String tenantId, String rawType) {
        if (!StringUtils.hasText(rawType)) {
            throw new ValidationException("문의 유형이 필요합니다.");
        }
        String normalized = rawType.trim();
        List<CommonCode> codes = commonCodeRepository
                .findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                        tenantId, HomepageInquiryConstants.CODE_GROUP_INQUIRY_TYPE);
        for (CommonCode code : codes) {
            if (equalsIgnoreCase(code.getCodeValue(), normalized)
                    || equalsIgnoreCase(code.getCodeLabel(), normalized)
                    || equalsIgnoreCase(code.getKoreanName(), normalized)) {
                return code;
            }
        }
        throw new ValidationException("허용되지 않는 문의 유형입니다.");
    }

    private static boolean equalsIgnoreCase(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        return left.trim().equalsIgnoreCase(right.trim());
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private String normalizeStatusFilter(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String trimmed = status.trim().toUpperCase(Locale.ROOT);
        if (!HomepageInquiryConstants.ALLOWED_STATUSES.contains(trimmed)) {
            throw new ValidationException("허용되지 않는 상태 필터입니다.");
        }
        return trimmed;
    }

    private void requireTenantId(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
    }

    private AdminHomepageInquiryListItemResponse toMaskedListItem(HomepageInquiry inquiry) {
        return AdminHomepageInquiryListItemResponse.builder()
                .id(inquiry.getId())
                .nameMasked(encryptionUtil.maskName(inquiry.getName()))
                .phoneMasked(PhoneLogMasking.maskForLog(inquiry.getPhone()))
                .inquiryType(inquiry.getInquiryType())
                .status(inquiry.getStatus())
                .createdAt(inquiry.getCreatedAt())
                .build();
    }

    private AdminHomepageInquiryDetailResponse toDetail(HomepageInquiry inquiry) {
        return AdminHomepageInquiryDetailResponse.builder()
                .id(inquiry.getId())
                .name(inquiry.getName())
                .phone(inquiry.getPhone())
                .inquiryType(inquiry.getInquiryType())
                .content(inquiry.getContent())
                .status(inquiry.getStatus())
                .consentVersion(inquiry.getConsentVersion())
                .privacyConsentAt(inquiry.getPrivacyConsentAt())
                .createdAt(inquiry.getCreatedAt())
                .updatedAt(inquiry.getUpdatedAt())
                .build();
    }

    private void recordPersonalDataAccess(User viewer, HomepageInquiry inquiry,
            HttpServletRequest request) {
        String accessorId = viewer != null && viewer.getId() != null
                ? String.valueOf(viewer.getId()) : "unknown";
        String accessorName = viewer != null ? encryptionUtil.maskName(viewer.getName()) : null;
        PersonalDataAccessLog accessLog = PersonalDataAccessLog.builder()
                .accessorId(accessorId)
                .accessorName(accessorName)
                .dataType(HomepageInquiryConstants.ACCESS_LOG_DATA_TYPE)
                .accessType("READ")
                .accessTime(LocalDateTime.now())
                .ipAddress(ClientIpHashUtils.sha256Hex(HttpRequestClientIp.resolve(request)))
                .reason("홈페이지 문의 상세 열람")
                .result("SUCCESS")
                .dataIdentifier(ENTITY_TYPE + "_" + inquiry.getId())
                .dataDetails("homepage inquiry detail view")
                .sessionId(request != null && request.getSession(false) != null
                        ? request.getSession(false).getId() : null)
                .userAgent(request != null ? request.getHeader("User-Agent") : null)
                .build();
        accessLog.setTenantId(inquiry.getTenantId());
        personalDataAccessLogRepository.save(accessLog);
    }
}
