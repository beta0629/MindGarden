package com.coresolution.core.service.impl;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.support.TenantOnboardingSalaryAndFinancialSeedDefinitions;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.service.AutoApprovalService;
import com.coresolution.core.service.OnboardingApprovalService;
import com.coresolution.core.service.OnboardingErrorHandlingService;
import com.coresolution.core.service.OnboardingPreValidationService;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.service.BrandingService;
import com.coresolution.core.service.TenantDashboardService;
import com.coresolution.core.service.TenantIdGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import com.coresolution.core.security.PasswordService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.concurrent.Executor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 온보딩 서비스 구현체 온보딩 요청 CRUD 및 승인 프로세스 처리 OnboardingApprovalService와 통합하여 PL/SQL 프로시저 호출
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {

    private final OnboardingRequestRepository repository;
    private final OnboardingApprovalService approvalService;
    private final AutoApprovalService autoApprovalService;
    private final TenantSubscriptionRepository subscriptionRepository;
    private final TenantIdGenerator tenantIdGenerator;
    private final TenantDashboardService tenantDashboardService;
    private final TenantRepository tenantRepository;
    private final BrandingService brandingService;
    private final PasswordService passwordService;
    private final ObjectMapper objectMapper;
    private final CommonCodeService commonCodeService;
    private final CommonCodeRepository commonCodeRepository;
    private final OnboardingPreValidationService preValidationService;
    private final OnboardingErrorHandlingService errorHandlingService;
    private final AccountingService accountingService;
    private final com.coresolution.core.service.PermissionGroupService permissionGroupService;
    private final com.coresolution.core.repository.TenantRoleRepository tenantRoleRepository;
    private final ApplicationContext applicationContext;
    private final EmailService emailService;
    private final JdbcTemplate jdbcTemplate;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
    @Qualifier("onboardingPostApprovalExecutor")
    private final Executor onboardingPostApprovalExecutor;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<OnboardingRequest> findPending() {
        log.debug("대기 중인 온보딩 요청 목록 조회");
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return repository.findByStatusOrderByCreatedAtDesc(OnboardingStatus.PENDING);
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingRequest getById(Long id) {
        log.debug("온보딩 요청 조회: id={}", id);
        return repository.findActiveById(id).orElseThrow(() -> new IllegalArgumentException(
                OnboardingConstants.formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, id)));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public OnboardingRequest create(String tenantId, String tenantName, String requestedBy,
            RiskLevel riskLevel, String checklistJson, String businessType) {

        log.info("온보딩 요청 생성: tenantId={}, tenantName={}, requestedBy={}", tenantId, tenantName,
                requestedBy);

        RiskLevel defaultRiskLevel = getDefaultRiskLevel();
        RiskLevel finalRiskLevel = riskLevel != null ? riskLevel : defaultRiskLevel;

        // checklistJson에서 regionCode와 brandName 추출하여 필드에 저장
        String region = null;
        String brandName = null;

        if (checklistJson != null && !checklistJson.isEmpty()) {
            try {
                Map<String, Object> checklist = objectMapper.readValue(checklistJson,
                        new TypeReference<Map<String, Object>>() {});

                // regionCode 추출
                String regionCode = (String) checklist.get("regionCode");
                if (regionCode != null && !regionCode.trim().isEmpty()) {
                    region = regionCode.trim();
                    log.info("✅ checklistJson에서 regionCode 추출 성공: {}", region);
                }

                // brandName 추출
                brandName = (String) checklist.get("brandName");
                if (brandName != null && !brandName.trim().isEmpty()) {
                    log.info("✅ checklistJson에서 brandName 추출 성공: {}", brandName);
                } else {
                    // brandName이 없으면 tenantName 사용
                    brandName = tenantName;
                    log.info("brandName이 없어 tenantName 사용: {}", brandName);
                }
            } catch (JsonProcessingException e) {
                log.warn("checklistJson 파싱 실패 (region/brandName 추출 실패): {}", e.getMessage());
                // 파싱 실패 시 tenantName을 brandName으로 사용
                brandName = tenantName;
            }
        } else {
            // checklistJson이 없으면 tenantName을 brandName으로 사용
            brandName = tenantName;
        }

        log.info("온보딩 요청 생성 - region: {}, brandName: {}", region, brandName);

        // subdomain 추출 (checklistJson에서)
        String subdomain = null;
        if (checklistJson != null && !checklistJson.trim().isEmpty()) {
            try {
                Map<String, Object> checklist = objectMapper.readValue(checklistJson,
                        new TypeReference<Map<String, Object>>() {});
                subdomain = (String) checklist.get("subdomain");
                if (subdomain != null && !subdomain.trim().isEmpty()) {
                    subdomain = subdomain.trim().toLowerCase(); // 소문자로 정규화
                    log.info("✅ checklistJson에서 subdomain 추출 성공: {}", subdomain);
                }
            } catch (JsonProcessingException e) {
                log.debug("checklistJson에서 subdomain 추출 실패: {}", e.getMessage());
            }
        }

        OnboardingRequest entity =
                OnboardingRequest.builder().tenantId(tenantId).subdomain(subdomain) // 서브도메인 저장
                        .tenantName(tenantName).brandName(brandName) // 브랜드명 저장 (checklistJson에서 추출한
                                                                     // 값 또는 tenantName)
                        .region(region) // 지역 정보 저장 (checklistJson에서 추출한 값)
                        .requestedBy(requestedBy).riskLevel(finalRiskLevel)
                        .checklistJson(checklistJson).businessType(businessType)
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                        .status(OnboardingStatus.PENDING).isDeleted(false) // BaseEntity의 기본값이
                                                                           // Builder에서 적용되지 않으므로
                                                                           // 명시적으로 설정
                        .version(0L) // BaseEntity의 기본값이 Builder에서 적용되지 않으므로 명시적으로 설정
                        .build();

        OnboardingRequest saved = repository.save(entity);

        log.info("온보딩 요청 생성 완료: id={}, tenantId={}", saved.getId(), tenantId);

        if (autoApprovalService.canAutoApprove(saved)) {
            log.info("자동 승인 조건 만족: requestId={}, 자동 승인은 별도로 처리됩니다", saved.getId());
        } else {
            AutoApprovalService.AutoApprovalResult result =
                    autoApprovalService.checkAutoApprovalConditions(saved);
            log.debug("자동 승인 조건 불만족: requestId={}, reason={}", saved.getId(), result.getReason());
        }

        return saved;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public OnboardingRequest update(Long requestId, String tenantName, String subdomain,
            String brandName, String regionCode, String businessType) {

        log.info(
                "온보딩 요청 수정: requestId={}, tenantName={}, subdomain={}, brandName={}, regionCode={}, businessType={}",
                requestId, tenantName, subdomain, brandName, regionCode, businessType);

        OnboardingRequest request = repository.findActiveById(requestId)
                .orElseThrow(() -> new IllegalArgumentException(OnboardingConstants
                        .formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, requestId)));

        // 수정 가능한 상태인지 확인 (PENDING, IN_REVIEW, ON_HOLD만 수정 가능)
        OnboardingStatus currentStatus = request.getStatus();
        if (currentStatus != OnboardingStatus.PENDING && currentStatus != OnboardingStatus.IN_REVIEW
                && currentStatus != OnboardingStatus.ON_HOLD) {
            throw new IllegalStateException(String.format(
                    "온보딩 요청을 수정할 수 없습니다. 현재 상태: %s (수정 가능한 상태: PENDING, IN_REVIEW, ON_HOLD)",
                    currentStatus.name()));
        }

        // tenantName 수정
        if (tenantName != null && !tenantName.trim().isEmpty()) {
            request.setTenantName(tenantName.trim());
            log.info("✅ 테넌트 이름 수정: {}", tenantName.trim());
        }

        // subdomain 수정 (중복 확인 포함)
        if (subdomain != null) {
            String normalizedSubdomain = subdomain.trim().toLowerCase();
            if (normalizedSubdomain.isEmpty()) {
                // 빈 문자열이면 null로 설정
                request.setSubdomain(null);
                log.info("✅ 서브도메인 제거");
            } else {
                // 기존 서브도메인과 다를 때만 중복 확인
                String currentSubdomain = request.getSubdomain();
                if (currentSubdomain == null || !currentSubdomain.equals(normalizedSubdomain)) {
                    // 서브도메인 중복 확인 (현재 요청 제외)
                    OnboardingService.SubdomainCheckResult checkResult =
                            checkSubdomainDuplicate(normalizedSubdomain, request.getId());
                    if (!checkResult.isValid() || !checkResult.available()
                            || checkResult.isDuplicate()) {
                        throw new IllegalArgumentException(
                                String.format("서브도메인을 사용할 수 없습니다: %s", checkResult.message()));
                    }
                    request.setSubdomain(normalizedSubdomain);
                    log.info("✅ 서브도메인 수정: {}", normalizedSubdomain);
                } else {
                    log.debug("서브도메인 변경 없음: {}", normalizedSubdomain);
                }
            }
        }

        // brandName 수정
        if (brandName != null) {
            String trimmedBrandName = brandName.trim();
            if (trimmedBrandName.isEmpty()) {
                request.setBrandName(null);
            } else {
                request.setBrandName(trimmedBrandName);
            }
            log.info("✅ 브랜드명 수정: {}", request.getBrandName());
        }

        // regionCode 수정
        if (regionCode != null) {
            String trimmedRegionCode = regionCode.trim();
            if (trimmedRegionCode.isEmpty()) {
                request.setRegion(null);
            } else {
                request.setRegion(trimmedRegionCode);
            }
            log.info("✅ 지역 코드 수정: {}", request.getRegion());
        }

        // businessType 수정
        if (businessType != null && !businessType.trim().isEmpty()) {
            request.setBusinessType(businessType.trim());
            log.info("✅ 업종 타입 수정: {}", businessType.trim());
        }

        // checklistJson 업데이트 (subdomain, brandName, regionCode 반영)
        try {
            Map<String, Object> checklist = new java.util.HashMap<>();
            if (request.getChecklistJson() != null
                    && !request.getChecklistJson().trim().isEmpty()) {
                checklist = objectMapper.readValue(request.getChecklistJson(),
                        new TypeReference<Map<String, Object>>() {});
            }

            // checklistJson에 subdomain, brandName, regionCode 업데이트
            if (subdomain != null) {
                String normalizedSubdomain = subdomain.trim().toLowerCase();
                if (normalizedSubdomain.isEmpty()) {
                    checklist.remove("subdomain");
                } else {
                    checklist.put("subdomain", normalizedSubdomain);
                }
            }

            if (brandName != null) {
                String trimmedBrandName = brandName.trim();
                if (trimmedBrandName.isEmpty()) {
                    checklist.remove("brandName");
                } else {
                    checklist.put("brandName", trimmedBrandName);
                }
            }

            if (regionCode != null) {
                String trimmedRegionCode = regionCode.trim();
                if (trimmedRegionCode.isEmpty()) {
                    checklist.remove("regionCode");
                } else {
                    checklist.put("regionCode", trimmedRegionCode);
                }
            }

            request.setChecklistJson(objectMapper.writeValueAsString(checklist));
            log.info("✅ checklistJson 업데이트 완료");
        } catch (JsonProcessingException e) {
            log.warn("checklistJson 업데이트 실패: {}", e.getMessage());
            // checklistJson 업데이트 실패해도 계속 진행
        }

        OnboardingRequest updated = repository.save(request);
        log.info("✅ 온보딩 요청 수정 완료: id={}", updated.getId());

        return updated;
    }

    /**
     * 별도 트랜잭션에서 decide 메서드 실행 자동 승인 실패 시에도 원래 트랜잭션이 롤백되지 않도록 함
     *
     * 주의: decideInternal을 호출하여 트랜잭션 전파 문제를 피함 예외가 발생해도 원래 트랜잭션에 영향을 주지 않도록 예외를 catch하고 null 반환
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public OnboardingRequest decideInNewTransaction(Long requestId,
            OnboardingStatus status, String actorId, String note) {
        try {
            return decideInternal(requestId, status, actorId, note);
        } catch (Exception e) {
            log.error("별도 트랜잭션에서 decide 실행 중 오류 발생: requestId={}, error={}, 원래 트랜잭션에 영향 없음",
                    requestId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * decide 메서드의 실제 로직 (트랜잭션 없음) decide와 decideInNewTransaction에서 공통으로 사용
     */
    private OnboardingRequest decideInternal(Long requestId, OnboardingStatus status,
            String actorId, String note) {

        log.info("온보딩 요청 결정 (내부): requestId={}, status={}, actorId={}", requestId, status, actorId);

        OnboardingRequest request = repository.findActiveById(requestId)
                .orElseThrow(() -> new IllegalArgumentException(OnboardingConstants
                        .formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, requestId)));

        // 이미 승인된 요청을 다시 승인하려는 경우 검증
        boolean isReApproval = status == OnboardingStatus.APPROVED
                && request.getStatus() == OnboardingStatus.APPROVED;
        String existingTenantId = null;

        if (isReApproval) {
            log.warn("이미 승인된 온보딩 요청을 다시 승인 시도: requestId={}, tenantId={}, 현재 상태={}", requestId,
                    request.getTenantId(), request.getStatus());

            // 테넌트가 이미 생성되어 있는지 확인
            if (request.getTenantId() != null && !request.getTenantId().trim().isEmpty()) {
                boolean tenantExists = tenantRepository
                        .findByTenantIdAndIsDeletedFalse(request.getTenantId()).isPresent();
                if (tenantExists) {
                    existingTenantId = request.getTenantId();
                    log.info(
                            "이미 승인된 요청이며 테넌트가 존재함. 프로시저는 건너뛰지만 테넌트 초기화 작업은 실행: requestId={}, tenantId={}",
                            requestId, existingTenantId);
                    // 프로시저는 건너뛰지만 테넌트 초기화 작업(공통코드 등)은 실행하도록 계속 진행
                }
            }

            // 테넌트가 없으면 프로시저 실행 (이전 승인 실패했을 수 있음)
            if (existingTenantId == null) {
                log.info("이미 승인된 요청이지만 테넌트가 없음. 프로시저 재실행: requestId={}, tenantId={}", requestId,
                        request.getTenantId());
            }
        }

        // ON_HOLD 상태로 처리할 때는 단순히 상태만 변경하고 저장
        if (status == OnboardingStatus.ON_HOLD) {
            log.info("보류 상태로 처리: requestId={}, currentStatus={}, note={}", requestId,
                    request.getStatus(), note);
            request.setStatus(status);
            request.setDecidedBy(actorId);
            request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
            request.setDecisionNote(note);
            OnboardingRequest saved = repository.save(request);
            log.info("온보딩 요청 결정 완료: id={}, status={}, version={}", saved.getId(), saved.getStatus(),
                    saved.getVersion());
            return saved;
        }

        request.setStatus(status);
        request.setDecidedBy(actorId);
        request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
        request.setDecisionNote(note);

        // 승인 프로세스 결과를 저장할 변수 (블록 밖에서도 사용)
        Boolean success = null;
        String message = null;
        boolean fallbackUsedForPostApproval = false;
        boolean schedulePostApprovalInitialization = false;

        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        // 이미 승인된 테넌트에 대해 재승인한 경우, 프로시저는 건너뛰지만 초기화 작업은 실행
        if (isReApproval && existingTenantId != null) {
            log.info("이미 승인된 테넌트 재승인: 프로시저는 건너뛰고 초기화 작업만 실행: tenantId={}", existingTenantId);
            String pendingReapprovalJson = buildDecisionStatusJson(null,
                    OnboardingConstants.PHASE_REAPPROVAL_INITIALIZATION_PENDING, false, requestId,
                    existingTenantId);
            request.setInitializationStatusJson(pendingReapprovalJson);
            OnboardingRequest saved = repository.save(request);

            schedulePostApprovalInitializationAfterCommit(requestId, existingTenantId,
                    request.getBusinessType(), actorId, false, true);

            log.info("온보딩 요청 결정 완료: id={}, status={}", saved.getId(), saved.getStatus());
            return saved;
        }

        if (status == OnboardingStatus.APPROVED) {
            log.info("테넌트 생성 진행: requestedBy={}, tenantName={}", request.getRequestedBy(),
                    request.getTenantName());

            String tenantIdValue = request.getTenantId();
            if (tenantIdValue == null || tenantIdValue.trim().isEmpty()) {
                String email = request.getRequestedBy();
                if (email != null && !email.trim().isEmpty()) {
                    List<Tenant> deletedTenants = tenantRepository
                            .findDeletedByContactEmailIgnoreCase(email.trim().toLowerCase());
                    if (!deletedTenants.isEmpty()) {
                        Tenant deletedTenant = deletedTenants.get(0);
                        tenantIdValue = deletedTenant.getTenantId();

                        deletedTenant.setIsDeleted(false);
                        deletedTenant.setDeletedAt(null);
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                        deletedTenant.setStatus(Tenant.TenantStatus.PENDING); // 승인 후 ACTIVE로 변경될 예정

                        if (request.getTenantName() != null
                                && !request.getTenantName().trim().isEmpty()) {
                            deletedTenant.setName(request.getTenantName());
                        }
                        if (request.getBusinessType() != null
                                && !request.getBusinessType().trim().isEmpty()) {
                            deletedTenant.setBusinessType(request.getBusinessType());
                        }
                        if (email != null && !email.trim().isEmpty()) {
                            deletedTenant.setContactEmail(email.trim().toLowerCase());
                        }

                        tenantRepository.save(deletedTenant);

                        log.info("삭제된 테넌트 복구: tenantId={}, email={}, name={}", tenantIdValue, email,
                                deletedTenant.getName());
                    }
                }

                if (tenantIdValue == null || tenantIdValue.trim().isEmpty()) {
                    String regionCode = extractRegionCodeFromRequest(request);

                    tenantIdValue = tenantIdGenerator.generateTenantId(request.getTenantName(),
                            request.getBusinessType(), regionCode);
                    log.info(
                            "테넌트 ID 자동 생성: tenantName={}, businessType={}, regionCode={}, tenantId={}",
                            request.getTenantName(), request.getBusinessType(), regionCode,
                            tenantIdValue);

                    // 생성된 테넌트 ID를 즉시 DB에 저장하여 다른 요청이 같은 순번을 조회하지 못하도록 함
                    request.setTenantId(tenantIdValue);
                    repository.save(request); // 즉시 저장하여 동시성 문제 방지
                    log.debug("생성된 테넌트 ID를 DB에 즉시 저장: requestId={}, tenantId={}", requestId,
                            tenantIdValue);
                } else {
                    request.setTenantId(tenantIdValue);
                }
            }

            final String tenantId =
                    request.getTenantId() != null ? request.getTenantId() : tenantIdValue;

            log.info("온보딩 승인 처리 시작: requestId={}, tenantId={}, businessType={}", requestId,
                    tenantId, request.getBusinessType());

            String businessType = getDefaultBusinessType(request.getBusinessType());

            OnboardingPreValidationService.ValidationResult validationResult =
                    preValidationService.validateBeforeApproval(requestId);

            if (!validationResult.isValid()) {
                String validationErrors = String.join(", ", validationResult.getErrors().values());
                String errorMessage = "온보딩 승인 전 사전 검증 실패: " + validationErrors;
                log.error(errorMessage);
                request.setStatus(OnboardingStatus.ON_HOLD);
                request.setDecisionNote(note != null ? note + "\n[사전 검증 실패] " + validationErrors
                        : "[사전 검증 실패] " + validationErrors);
                return repository.save(request);
            }

            if (validationResult.hasWarnings()) {
                String warnings = String.join(", ", validationResult.getWarnings().values());
                log.warn("온보딩 승인 전 사전 검증 경고: {}", warnings);
            }

            OnboardingPreValidationService.ValidationResult metadataResult =
                    preValidationService.validateSystemMetadata(businessType);

            if (!metadataResult.isValid()) {
                String metadataErrors = String.join(", ", metadataResult.getErrors().values());
                String errorMessage = "시스템 메타데이터 검증 실패: " + metadataErrors;
                log.error(errorMessage);
                request.setStatus(OnboardingStatus.ON_HOLD);
                request.setDecisionNote(note != null ? note + "\n[메타데이터 검증 실패] " + metadataErrors
                        : "[메타데이터 검증 실패] " + metadataErrors);
                return repository.save(request);
            }

            String contactEmail = request.getRequestedBy(); // 기본값: requestedBy
            String adminPasswordHash = null;
            String subdomain = request.getSubdomain(); // 온보딩 요청의 서브도메인
            Map<String, String> dashboardTemplates = null;
            final boolean contactEmailPresent =
                    contactEmail != null && !contactEmail.trim().isEmpty();

            if (request.getChecklistJson() != null && !request.getChecklistJson().isEmpty()) {
                try {
                    Map<String, Object> checklist =
                            objectMapper.readValue(request.getChecklistJson(),
                                    new TypeReference<Map<String, Object>>() {});

                    String adminPassword = null;
                    Object adminPwObj = checklist.get("adminPassword");
                    if (adminPwObj instanceof String) {
                        adminPassword = ((String) adminPwObj).trim();
                        if (adminPassword.isEmpty()) {
                            adminPassword = null;
                        }
                    } else if (adminPwObj != null) {
                        String asText = String.valueOf(adminPwObj).trim();
                        adminPassword = asText.isEmpty() ? null : asText;
                    }
                    if (adminPassword != null) {
                        adminPasswordHash = passwordService.encodePassword(adminPassword);
                        log.info("관리자 비밀번호 해시 완료: requestId={}", requestId);
                    } else if (contactEmailPresent) {
                        log.warn("checklistJson에 adminPassword가 없음: requestId={}", requestId);
                    }

                    // 서브도메인이 없으면 checklistJson에서 추출 시도
                    if (subdomain == null || subdomain.trim().isEmpty()) {
                        Object sdObj = checklist.get("subdomain");
                        if (sdObj instanceof String) {
                            String checklistSubdomain = ((String) sdObj).trim();
                            if (!checklistSubdomain.isEmpty()) {
                                subdomain = checklistSubdomain.toLowerCase();
                                log.info("checklistJson에서 서브도메인 추출: requestId={}, subdomain={}",
                                        requestId, subdomain);
                            }
                        }
                    }

                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, String> templates =
                                (Map<String, String>) checklist.get("dashboardTemplates");
                        if (templates != null && !templates.isEmpty()) {
                            dashboardTemplates = templates;
                            log.info("대시보드 템플릿 선택 정보 발견: requestId={}, templates={}", requestId,
                                    templates);
                        } else {
                            log.debug("checklistJson에 dashboardTemplates가 없음 (기본 템플릿 사용): requestId={}",
                                    requestId);
                        }
                    } catch (ClassCastException e) {
                        log.warn("dashboardTemplates 형식이 올바르지 않음: requestId={}, error={}", requestId,
                                e.getMessage());
                    }

                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, java.util.List<String>> widgets =
                                (Map<String, java.util.List<String>>) checklist
                                        .get("dashboardWidgets");
                        if (widgets != null && !widgets.isEmpty()) {
                            log.info("대시보드 위젯 편집 정보 발견: requestId={}, widgets={}", requestId,
                                    widgets);
                        } else {
                            log.debug(
                                    "checklistJson에 dashboardWidgets가 없음 (템플릿 기본 위젯 사용): requestId={}",
                                    requestId);
                        }
                    } catch (ClassCastException e) {
                        log.warn("dashboardWidgets 형식이 올바르지 않음: requestId={}, error={}", requestId,
                                e.getMessage());
                    }
                } catch (JsonProcessingException e) {
                    log.error("checklistJson 파싱 실패: requestId={}, error={}", requestId, e.getMessage());
                    if (contactEmailPresent) {
                        request.setStatus(OnboardingStatus.ON_HOLD);
                        String detail = OnboardingConstants.ERROR_ONBOARDING_CHECKLIST_PARSE_FOR_APPROVAL
                                + " (" + e.getMessage() + ")";
                        request.setDecisionNote(note != null ? note + "\n[승인 중단] " + detail
                                : "[승인 중단] " + detail);
                        return repository.save(request);
                    }
                }
            }

            if (contactEmailPresent
                    && (adminPasswordHash == null || adminPasswordHash.trim().isEmpty())) {
                log.error("연락 이메일은 있으나 관리자 비밀번호 해시를 만들 수 없음: requestId={}", requestId);
                request.setStatus(OnboardingStatus.ON_HOLD);
                request.setDecisionNote(note != null
                        ? note + "\n[승인 중단] "
                                + OnboardingConstants.ERROR_ONBOARDING_ADMIN_PASSWORD_REQUIRED_FOR_APPROVAL
                        : "[승인 중단] "
                                + OnboardingConstants.ERROR_ONBOARDING_ADMIN_PASSWORD_REQUIRED_FOR_APPROVAL);
                return repository.save(request);
            }

            final String finalContactEmail = contactEmail;
            final String finalAdminPasswordHash = adminPasswordHash;
            final String finalSubdomain = (subdomain != null && !subdomain.trim().isEmpty())
                    ? subdomain.trim().toLowerCase()
                    : null;
            final Map<String, String> finalDashboardTemplates = dashboardTemplates;

            Map<String, java.util.List<String>> dashboardWidgets = null;
            if (request.getChecklistJson() != null && !request.getChecklistJson().isEmpty()) {
                try {
                    Map<String, Object> checklist =
                            objectMapper.readValue(request.getChecklistJson(),
                                    new TypeReference<Map<String, Object>>() {});

                    @SuppressWarnings("unchecked")
                    Map<String, java.util.List<String>> widgets =
                            (Map<String, java.util.List<String>>) checklist.get("dashboardWidgets");
                    if (widgets != null && !widgets.isEmpty()) {
                        dashboardWidgets = widgets;
                        log.info("대시보드 위젯 편집 정보 발견: requestId={}, widgets={}", requestId, widgets);
                    }
                } catch (Exception e) {
                    log.debug("dashboardWidgets 추출 실패 (무시): requestId={}, error={}", requestId,
                            e.getMessage());
                }
            }
            final Map<String, java.util.List<String>> finalDashboardWidgets = dashboardWidgets;

            // 처리 상태 초기화
            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
            // 상태는 OnboardingApprovalServiceImpl에서 initializationStatusJson에 저장됨

            // 프로시저 결과를 저장할 변수
            final java.util.concurrent.atomic.AtomicReference<Map<String, Object>> approvalResultRef =
                    new java.util.concurrent.atomic.AtomicReference<>();

            OnboardingErrorHandlingService.ExecutionResult executionResult =
                    errorHandlingService.executeWithRetry(() -> {
                        // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                        Map<String, Object> result = approvalService.processOnboardingApproval(
                                requestId, tenantId, request.getTenantName(), businessType, actorId,
                                note, finalContactEmail, finalAdminPasswordHash, finalSubdomain);
                        approvalResultRef.set(result); // 결과 저장
                        Boolean resultSuccess = (Boolean) result.get("success");
                        String resultMessage = (String) result.get("message");

                        if (resultSuccess == null || !resultSuccess) {
                            // 실패 시 실제 프로시저 오류 메시지를 포함한 예외 발생
                            String errorMsg =
                                    resultMessage != null && !resultMessage.trim().isEmpty()
                                            ? resultMessage
                                            : "프로세스가 false를 반환했습니다.";
                            log.error("❌ 프로시저 실행 실패: requestId={}, message={}", requestId,
                                    resultMessage);
                            // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                            throw new RuntimeException(errorMsg);
                        }
                        // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                        return true;
                    }, 5, // 최대 5회 재시도
                            2000 // 2초 지연
                    );

            Map<String, Object> approvalResult;

            if (executionResult.isSuccess()) {
                // 성공 시 저장된 결과 사용
                approvalResult = approvalResultRef.get();
                if (approvalResult == null) {
                    // 저장된 결과가 없으면 다시 호출
                    approvalResult = approvalService.processOnboardingApproval(requestId, tenantId,
                            request.getTenantName(), businessType, actorId, note, finalContactEmail,
                            finalAdminPasswordHash, finalSubdomain);
                }
                Boolean resultSuccess = (Boolean) approvalResult.get("success");
                String resultMessage = (String) approvalResult.get("message");
                success = resultSuccess;
                message = resultMessage;
            } else {
                // 실패 시 저장된 결과에서 메시지 추출 시도
                Map<String, Object> lastResult = approvalResultRef.get();
                if (lastResult != null) {
                    String lastMessage = (String) lastResult.get("message");
                    if (lastMessage != null && !lastMessage.trim().isEmpty()) {
                        message = lastMessage;
                    } else {
                        message = executionResult.getErrorMessage();
                    }
                } else {
                    message = executionResult.getErrorMessage();
                }

                success = false;
                approvalResult = new java.util.HashMap<>();
                approvalResult.put("success", false);
                approvalResult.put("message", message);
                log.error("❌ 온보딩 승인 프로세스 재시도 실패: requestId={}, attempts={}, error={}", requestId,
                        executionResult.getAttemptCount(), message);
            }

            if (success != null && success) {
                // 역할이 존재하는지 확인 (대시보드 생성 전 필수)
                boolean rolesExist = false;
                try {
                    List<com.coresolution.core.domain.TenantRole> roles =
                            tenantRoleRepository.findByTenantIdAndIsDeletedFalse(tenantId);
                    rolesExist = roles != null && !roles.isEmpty();
                    if (!rolesExist) {
                        log.warn("⚠️ 역할이 없어 대시보드 생성 건너뜀: tenantId={}, roleCount=0", tenantId);
                    } else {
                        log.info("✅ 역할 존재 확인: tenantId={}, roleCount={}, 대시보드 생성 진행", tenantId,
                                roles.size());
                    }
                } catch (Exception e) {
                    log.warn("⚠️ 역할 존재 확인 실패, 대시보드 생성 건너뜀: tenantId={}, error={}", tenantId,
                            e.getMessage());
                }

                // 대시보드 생성은 이제 OnboardingApprovalServiceImpl의 Step 4에서 처리됨
                // 여기서는 더 이상 대시보드 생성을 시도하지 않음
                log.info("✅ 대시보드 생성은 온보딩 승인 프로세스 Step 4에서 처리됨: tenantId={}", tenantId);
            }

            if (success == null || !success) {
                String errorMessage = (message != null && !message.trim().isEmpty()) ? message
                        : "온보딩 승인 프로세스 중 알 수 없는 오류가 발생했습니다. (상세 오류 정보 없음)";

                // "이미 활성화된 테넌트" 메시지는 정상 케이스로 처리 (프로시저 버그 대응)
                if (message != null && message.contains("이미 활성화") && message.contains("정상")) {
                    log.warn("이미 활성화된 테넌트 (정상 케이스): requestId={}, tenantId={}, message={}",
                            requestId, tenantId, message);
                    // success를 true로 강제 설정하여 정상 처리
                    success = true;
                    message = "테넌트가 이미 활성화되어 있습니다 (정상): " + tenantId;
                } else {
                    log.error("온보딩 승인 프로세스 실패: requestId={}, tenantId={}, message={}", requestId,
                            tenantId, errorMessage);
                    log.error("온보딩 승인 프로세스 실패 상세: success={}, message={}, approvalResult={}",
                            success, message, approvalResult);
                    request.setStatus(OnboardingStatus.ON_HOLD);
                    request.setDecisionNote(note != null ? note + "\n[시스템 오류] " + errorMessage
                            : "[시스템 오류] " + errorMessage);
                }
            } else {
                log.info("온보딩 승인 프로세스 완료: {}", message);
                // updateProcessingStatus 제거: 별도 트랜잭션에서 version 충돌 발생
                // 상태는 initializationStatusJson에 저장되므로 별도 업데이트 불필요

                fallbackUsedForPostApproval = isFallbackUsed(approvalResult, message);
                try {
                    updateSubscriptionTenantId(request);
                } catch (Exception e) {
                    log.warn("구독 tenant_id 업데이트 실패 (계속 진행): {}", e.getMessage());
                }

                // 테넌트 시딩·브랜딩·승인 메일은 트랜잭션 커밋 후 백그라운드 실행 → HTTP 응답·프록시 타임아웃 완화
                log.info("🔄 테넌트 사후 초기화 예약(커밋 후 비동기): tenantId={}, requestId={}", tenantId,
                        requestId);
                schedulePostApprovalInitializationAfterCommit(requestId, tenantId,
                        request.getBusinessType(), actorId, fallbackUsedForPostApproval, false);
                schedulePostApprovalInitialization = true;
            }
        }

        // 최종 상태 결정 (승인만 성공/보류로 정규화, 그 외 REJECTED 등은 요청 status 유지)
        final Boolean finalSuccess = success;
        final OnboardingStatus finalStatus;
        if (status == OnboardingStatus.APPROVED) {
            finalStatus = (finalSuccess != null && finalSuccess) ? OnboardingStatus.APPROVED
                    : OnboardingStatus.ON_HOLD;
        } else {
            finalStatus = status;
        }

        // 엔티티를 다시 조회하여 최신 버전 사용 (OptimisticLockException 방지)
        // initializeTenantAfterOnboardingInNewTransaction에서 별도 트랜잭션을 사용하면서
        // 엔티티가 detached 상태가 될 수 있으므로 다시 조회
        OnboardingRequest requestToSave = repository
                .findByTenantIdAndIdAndIsDeletedFalse(request.getTenantId(), requestId)
                .orElseThrow(() -> new IllegalArgumentException(OnboardingConstants
                        .formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, requestId)));

        // 상태를 다시 설정
        requestToSave.setStatus(finalStatus);
        requestToSave.setDecidedBy(actorId);
        requestToSave.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
        requestToSave.setDecisionNote(note);

        if (schedulePostApprovalInitialization && finalStatus == OnboardingStatus.APPROVED
                && finalSuccess != null && finalSuccess) {
            String pendingJson = buildDecisionStatusJson(null,
                    OnboardingConstants.PHASE_POST_APPROVAL_INITIALIZATION_PENDING,
                    fallbackUsedForPostApproval, requestId, requestToSave.getTenantId());
            requestToSave.setInitializationStatusJson(pendingJson);
        }

        // 최종 저장 시도 (OptimisticLockException 발생 시 상위에서 별도 트랜잭션으로 재시도)
        try {
            OnboardingRequest saved = repository.save(requestToSave);
            log.info("온보딩 요청 결정 완료: id={}, status={}, version={}", saved.getId(), saved.getStatus(),
                    saved.getVersion());

            // 사후 시딩을 비동기로 돌린 경우 승인 메일은 백그라운드 파이프라인에서 발송한다.
            if (!schedulePostApprovalInitialization && finalStatus == OnboardingStatus.APPROVED
                    && finalSuccess != null && finalSuccess) {
                String finalTenantId = requestToSave.getTenantId();
                if (finalTenantId != null) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            try {
                                sendOnboardingApprovalEmail(saved, finalTenantId);
                            } catch (Exception e) {
                                log.error(
                                        "온보딩 승인 이메일 발송 실패 (온보딩 프로세스는 계속 진행): requestId={}, error={}",
                                        requestId, e.getMessage(), e);
                            }
                        }
                    });
                } else {
                    log.warn("테넌트 ID가 없어 이메일 발송을 건너뜁니다: requestId={}", requestId);
                }
            }

            return saved;
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            // OptimisticLockException 발생 시 트랜잭션이 rollback-only로 마크되므로
            // 예외를 다시 throw하여 상위에서 별도 트랜잭션으로 재시도하도록 함
            log.warn("OptimisticLockException 발생 (상위에서 별도 트랜잭션으로 재시도 예정): requestId={}, error={}",
                    requestId, e.getMessage());
            throw e;
        } catch (org.springframework.dao.OptimisticLockingFailureException e) {
            // OptimisticLockException 발생 시 트랜잭션이 rollback-only로 마크되므로
            // 예외를 다시 throw하여 상위에서 별도 트랜잭션으로 재시도하도록 함
            log.warn(
                    "OptimisticLockingFailureException 발생 (상위에서 별도 트랜잭션으로 재시도 예정): requestId={}, error={}",
                    requestId, e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public OnboardingRequest decide(Long requestId, OnboardingStatus status,
            String actorId, String note) {
        try {
            return decideInternal(requestId, status, actorId, note);
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            // OptimisticLockException 발생 시 트랜잭션이 rollback-only로 마크됨
            // 별도 트랜잭션에서 재시도
            log.warn("OptimisticLockException 발생, 별도 트랜잭션에서 재시도: requestId={}, error={}", requestId,
                    e.getMessage());
            OnboardingServiceImpl self = applicationContext.getBean(OnboardingServiceImpl.class);
            return self.decideInNewTransaction(requestId, status, actorId, note);
        } catch (org.springframework.dao.OptimisticLockingFailureException e) {
            // OptimisticLockException 발생 시 트랜잭션이 rollback-only로 마크됨
            // 별도 트랜잭션에서 재시도
            log.warn("OptimisticLockingFailureException 발생, 별도 트랜잭션에서 재시도: requestId={}, error={}",
                    requestId, e.getMessage());
            OnboardingServiceImpl self = applicationContext.getBean(OnboardingServiceImpl.class);
            return self.decideInNewTransaction(requestId, status, actorId, note);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<OnboardingRequest> findByTenantId(String tenantId) {
        log.debug("테넌트별 온보딩 요청 목록 조회: tenantId={}", tenantId);
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(OnboardingStatus status) {
        log.debug("상태별 온보딩 요청 개수 조회: status={}", status);
        return repository.countByStatus(status);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OnboardingRequest> findByStatus(OnboardingStatus status, Pageable pageable) {
        log.debug("상태별 온보딩 요청 페이지 조회: status={}, page={}, size={}", status,
                pageable.getPageNumber(), pageable.getPageSize());
        return repository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OnboardingRequest> findAll() {
        log.debug("모든 온보딩 요청 목록 조회");
        return repository.findAllByIsDeletedFalseOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OnboardingRequest> findAll(Pageable pageable) {
        log.debug("모든 온보딩 요청 페이지 조회: page={}, size={}", pageable.getPageNumber(),
                pageable.getPageSize());
        return repository.findAllByIsDeletedFalseOrderByCreatedAtDesc(pageable);
    }

    @Override
    public OnboardingRequest retryApproval(Long requestId, String actorId, String note) {
        log.info("온보딩 승인 프로세스 재시도: requestId={}, actorId={}", requestId, actorId);

        OnboardingRequest request = repository.findActiveById(requestId)
                .orElseThrow(() -> new IllegalArgumentException(OnboardingConstants
                        .formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, requestId)));

        if (request.getStatus() != OnboardingStatus.ON_HOLD) {
            throw new IllegalStateException(OnboardingConstants.formatError(
                    OnboardingConstants.ERROR_RETRY_ONLY_ON_HOLD, request.getStatus()));
        }

        String retryNote = (note != null && !note.trim().isEmpty()) ? note : "프로시저 실패로 인한 재시도";

        if (request.getDecisionNote() != null && !request.getDecisionNote().isEmpty()) {
            retryNote = request.getDecisionNote() + "\n[재시도] " + retryNote;
        } else {
            retryNote = "[재시도] " + retryNote;
        }

        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return decide(requestId, OnboardingStatus.APPROVED, actorId, retryNote);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OnboardingRequest> findByEmail(String email) {
        log.debug("이메일로 온보딩 요청 조회: email={}", email);
        return repository.findByRequestedByAndIsDeletedFalseOrderByCreatedAtDesc(email);
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingRequest findByIdAndEmail(Long id, String email) {
        log.debug("ID와 이메일로 온보딩 요청 조회: id={}, email={}", id, email);
        OnboardingRequest request = repository.findByIdAndRequestedByAndIsDeletedFalse(id, email);
        if (request == null) {
            throw new IllegalArgumentException(
                    OnboardingConstants.ERROR_ONBOARDING_REQUEST_NOT_FOUND);
        }
        return request;
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingService.EmailDuplicateCheckResult checkEmailDuplicate(String email) {
        log.info("이메일 중복 확인 (온보딩 요청 단계): email={}", email);

        if (email == null || email.trim().isEmpty()) {
            log.warn("이메일이 비어있음: email={}", email);
            return new OnboardingService.EmailDuplicateCheckResult(false, true, "이메일을 입력해주세요.",
                    null);
        }

        String normalizedEmail = email.trim().toLowerCase();

        List<OnboardingRequest> pendingRequests =
                repository.findPendingByRequestedByIgnoreCase(normalizedEmail);
        log.info("대기 중인 온보딩 요청 확인: pendingCount={}, email={}", pendingRequests.size(),
                normalizedEmail);

        if (!pendingRequests.isEmpty()) {
            OnboardingRequest latestRequest = pendingRequests.get(0);
            OnboardingStatus status = latestRequest.getStatus();

            String statusMessage;
            String statusName;
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            if (status == OnboardingStatus.PENDING) {
                statusMessage = "이 이메일로 이미 온보딩 신청이 진행 중입니다. 현재 상태: 승인 대기 중입니다. 관리자 승인을 기다려주세요.";
                statusName = "PENDING";
            } else if (status == OnboardingStatus.IN_REVIEW) {
                statusMessage = "이 이메일로 이미 온보딩 신청이 진행 중입니다. 현재 상태: 검토 중입니다. 검토가 완료되면 연락드리겠습니다.";
                statusName = "IN_REVIEW";
            } else if (status == OnboardingStatus.ON_HOLD) {
                statusMessage = "이 이메일로 이미 온보딩 신청이 진행 중입니다. 현재 상태: 보류 중입니다. 추가 정보가 필요할 수 있습니다.";
                statusName = "ON_HOLD";
            } else {
                statusMessage =
                        "이 이메일로 이미 온보딩 신청이 진행 중입니다. 현재 상태: " + status.name() + ". 진행 상황을 확인해주세요.";
                statusName = status.name();
            }

            log.info("이메일 중복: 대기 중인 온보딩 요청 존재 - email={}, status={}, message={}", normalizedEmail,
                    status, statusMessage);

            return new OnboardingService.EmailDuplicateCheckResult(true, false, statusMessage,
                    statusName);
        }

        log.info("이메일 사용 가능 (온보딩 요청 단계): email={}", normalizedEmail);
        return new OnboardingService.EmailDuplicateCheckResult(false, true, "사용 가능한 이메일입니다.", null);
    }


    /**
     * 테넌트 생성 시점에만 중복 체크 (온보딩 승인 시 호출)
     *
     * 멀티 테넌트 지원 원칙: - 같은 이메일로 여러 테넌트를 생성할 수 있음 - 테넌트의 contact_email은 연락처 정보일 뿐이며, 중복 허용 - 이 메서드는 더
     * 이상 사용하지 않음 (항상 false 반환)
     *
     * @deprecated 멀티 테넌트 지원으로 인해 이메일 중복 체크 불필요
     */
    @Deprecated
    @Transactional(readOnly = true)
    private boolean isEmailDuplicateForTenantCreation(String email) {
        log.info("테넌트 생성 시점 이메일 중복 확인 (deprecated): email={}", email);
        log.info("멀티 테넌트 지원으로 인해 이메일 중복 체크 불필요 - 항상 false 반환");
        return false; // 멀티 테넌트 지원으로 항상 false 반환
    }

    /**
     * 관리자 계정 생성은 이제 PL/SQL 프로시저에서 처리됩니다. ProcessOnboardingApproval 프로시저가 CreateTenantAdminAccount를
     * 호출하여 관리자 계정을 생성합니다.
     */

    /**
     * 온보딩 승인 후 구독의 tenant_id 업데이트 checklistJson에서 subscriptionId를 찾아서 생성된 tenant_id로 업데이트
     */
    private void updateSubscriptionTenantId(OnboardingRequest request) {
        if (request.getChecklistJson() == null || request.getChecklistJson().isEmpty()) {
            log.debug("checklistJson이 없어 구독 업데이트 스킵: requestId={}", request.getId());
            return;
        }

        try {
            Map<String, Object> checklist = objectMapper.readValue(request.getChecklistJson(),
                    new TypeReference<Map<String, Object>>() {});

            String subscriptionId = (String) checklist.get("subscriptionId");
            if (subscriptionId == null || subscriptionId.isEmpty()) {
                log.debug("checklistJson에 subscriptionId가 없어 구독 업데이트 스킵: requestId={}",
                        request.getId());
                return;
            }

            String tenantId = request.getTenantId();
            if (tenantId == null || tenantId.isEmpty()) {
                log.warn("tenant_id가 없어 구독 업데이트 불가: requestId={}, subscriptionId={}",
                        request.getId(), subscriptionId);
                return;
            }

            subscriptionRepository.findBySubscriptionId(subscriptionId)
                    .ifPresentOrElse(subscription -> {
                        subscription.setTenantId(tenantId);
                        subscriptionRepository.save(subscription);
                        log.info("구독 tenant_id 업데이트 완료: subscriptionId={}, tenantId={}",
                                subscriptionId, tenantId);
                    }, () -> log.warn("구독을 찾을 수 없음: subscriptionId={}", subscriptionId));

        } catch (JsonProcessingException e) {
            log.error("checklistJson 파싱 실패: requestId={}, error={}", request.getId(),
                    e.getMessage(), e);
            throw new RuntimeException("checklistJson 파싱 실패", e);
        } catch (Exception e) {
            log.error("구독 tenant_id 업데이트 중 오류 발생: requestId={}, error={}", request.getId(),
                    e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 기본 업종 조회 (공통 코드에서 동적으로 가져옴) businessType이 null이거나 비어있으면 공통 코드에서 기본 업종을 조회 공통 코드 조회 실패 시 상수에
     * 정의된 기본값 사용
     *
     * @param businessType 요청된 업종 (null 가능)
     * @return 업종 코드 값
     */
    @Transactional(readOnly = true)
    private String getDefaultBusinessType(String businessType) {
        if (businessType != null && !businessType.trim().isEmpty()) {
            return businessType.trim();
        }

        try {
            List<CommonCode> businessTypes = commonCodeService
                    .getActiveCommonCodesByGroup(OnboardingConstants.CODE_GROUP_BUSINESS_TYPE);

            if (businessTypes != null && !businessTypes.isEmpty()) {
                Optional<CommonCode> defaultType = businessTypes.stream()
                        .filter(code -> OnboardingConstants.CODE_VALUE_DEFAULT_BUSINESS_TYPE
                                .equals(code.getCodeValue()))
                        .findFirst();

                if (defaultType.isPresent()) {
                    log.debug("공통 코드에서 기본 업종 조회 성공: {}", defaultType.get().getCodeValue());
                    return defaultType.get().getCodeValue();
                } else {
                    log.debug("공통 코드에서 첫 번째 업종 사용: {}", businessTypes.get(0).getCodeValue());
                    return businessTypes.get(0).getCodeValue();
                }
            }
        } catch (Exception e) {
            log.warn("공통 코드에서 업종 조회 실패, 기본값 사용: {}", e.getMessage());
        }

        log.debug("기본 업종 사용 (상수): {}", OnboardingConstants.CODE_VALUE_DEFAULT_BUSINESS_TYPE);
        return OnboardingConstants.CODE_VALUE_DEFAULT_BUSINESS_TYPE;
    }

    /**
     * 기본 위험도 조회 (공통 코드에서 동적으로 가져옴) 공통 코드 조회 실패 시 상수에 정의된 기본값 사용
     *
     * @return 기본 위험도 (RiskLevel Enum)
     */
    @Transactional(readOnly = true)
    private RiskLevel getDefaultRiskLevel() {
        try {
            List<CommonCode> riskLevels = commonCodeService
                    .getActiveCommonCodesByGroup(OnboardingConstants.CODE_GROUP_RISK_LEVEL);

            if (riskLevels != null && !riskLevels.isEmpty()) {
                Optional<CommonCode> lowRisk = riskLevels.stream().filter(
                        code -> OnboardingConstants.CODE_VALUE_LOW.equals(code.getCodeValue()))
                        .findFirst();

                if (lowRisk.isPresent()) {
                    try {
                        RiskLevel riskLevel = RiskLevel.valueOf(lowRisk.get().getCodeValue());
                        log.debug("공통 코드에서 기본 위험도 조회 성공: {}", riskLevel);
                        return riskLevel;
                    } catch (IllegalArgumentException e) {
                        log.warn("공통 코드 값이 RiskLevel Enum과 일치하지 않음: {}, 기본값 사용",
                                lowRisk.get().getCodeValue());
                    }
                } else {
                    try {
                        RiskLevel riskLevel = RiskLevel.valueOf(riskLevels.get(0).getCodeValue());
                        log.debug("공통 코드에서 첫 번째 위험도 사용: {}", riskLevel);
                        return riskLevel;
                    } catch (IllegalArgumentException e) {
                        log.warn("공통 코드 값이 RiskLevel Enum과 일치하지 않음: {}, 기본값 사용",
                                riskLevels.get(0).getCodeValue());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("공통 코드에서 위험도 조회 실패, 기본값 사용: {}", e.getMessage());
        }

        log.debug("기본 위험도 사용 (상수): {}", RiskLevel.LOW);
        return RiskLevel.LOW;
    }

    /**
     * 온보딩 요청에서 지역 코드 추출 checklistJson에서 주소 정보를 추출하여 지역 코드 생성
     *
     * @param request 온보딩 요청
     * @return 지역 코드 (예: "seoul", "busan", "tokyo", "newyork")
     */
    private String extractRegionCodeFromRequest(OnboardingRequest request) {
        try {
            if (request.getChecklistJson() == null || request.getChecklistJson().isEmpty()) {
                return null;
            }

            Map<String, Object> checklist = objectMapper.readValue(request.getChecklistJson(),
                    new TypeReference<Map<String, Object>>() {});

            // regionCode를 직접 사용 (우선순위 1)
            String regionCode = (String) checklist.get("regionCode");
            if (regionCode != null && !regionCode.trim().isEmpty()) {
                return regionCode.trim();
            }

            // region 필드도 지원 (하위 호환성)
            String region = (String) checklist.get(OnboardingConstants.CHECKLIST_JSON_KEY_REGION);
            if (region != null && !region.trim().isEmpty()) {
                return region.trim();
            }

            String address = (String) checklist.get(OnboardingConstants.CHECKLIST_JSON_KEY_ADDRESS);
            String postalCode = (String) checklist.get(OnboardingConstants.CHECKLIST_JSON_KEY_POSTAL_CODE);

            if (address != null && !address.trim().isEmpty()) {
                return extractRegionFromAddress(address);
            }

            if (postalCode != null && !postalCode.trim().isEmpty()) {
                return extractRegionFromPostalCode(postalCode);
            }

            return null;

        } catch (Exception e) {
            log.warn(OnboardingConstants.LOG_WARN_REGION_CODE_EXTRACT_FAILED, request.getId(),
                    e.getMessage());
            return null;
        }
    }

    /**
     * 주소에서 지역 코드 추출
     *
     * @param address 주소 문자열
     * @return 지역 코드
     */
    private String extractRegionFromAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return null;
        }

        String normalizedAddress = address.trim().toLowerCase();

        if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SEOUL_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SEOUL_EN)) {
            return OnboardingConstants.REGION_CODE_SEOUL;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_BUSAN_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_BUSAN_EN)) {
            return OnboardingConstants.REGION_CODE_BUSAN;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_INCHEON_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_INCHEON_EN)) {
            return OnboardingConstants.REGION_CODE_INCHEON;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_DAEGU_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_DAEGU_EN)) {
            return OnboardingConstants.REGION_CODE_DAEGU;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_DAEJEON_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_DAEJEON_EN)) {
            return OnboardingConstants.REGION_CODE_DAEJEON;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GWANGJU_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GWANGJU_EN)) {
            return OnboardingConstants.REGION_CODE_GWANGJU;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_ULSAN_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_ULSAN_EN)) {
            return OnboardingConstants.REGION_CODE_ULSAN;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SEJONG_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SEJONG_EN)) {
            return OnboardingConstants.REGION_CODE_SEJONG;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GYEONGGI_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GYEONGGI_EN)) {
            return OnboardingConstants.REGION_CODE_GYEONGGI;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GANGWON_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GANGWON_EN)) {
            return OnboardingConstants.REGION_CODE_GANGWON;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_CHUNGBUK_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_CHUNGBUK_EN)) {
            return OnboardingConstants.REGION_CODE_CHUNGBUK;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_CHUNGNAM_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_CHUNGNAM_EN)) {
            return OnboardingConstants.REGION_CODE_CHUNGNAM;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_JEONBUK_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_JEONBUK_EN)) {
            return OnboardingConstants.REGION_CODE_JEONBUK;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_JEONNAM_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_JEONNAM_EN)) {
            return OnboardingConstants.REGION_CODE_JEONNAM;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GYEONGBUK_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GYEONGBUK_EN)) {
            return OnboardingConstants.REGION_CODE_GYEONGBUK;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GYEONGNAM_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_GYEONGNAM_EN)) {
            return OnboardingConstants.REGION_CODE_GYEONGNAM;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_JEJU_KO)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_JEJU_EN)) {
            return OnboardingConstants.REGION_CODE_JEJU;
        }

        else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_TOKYO_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_TOKYO_KO)) {
            return OnboardingConstants.REGION_CODE_TOKYO;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_OSAKA_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_OSAKA_KO)) {
            return OnboardingConstants.REGION_CODE_OSAKA;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_NEW_YORK_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_NEW_YORK_KO)) {
            return OnboardingConstants.REGION_CODE_NEWYORK;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_LOS_ANGELES_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_LOS_ANGELES_ABBR_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_LOS_ANGELES_KO)) {
            return OnboardingConstants.REGION_CODE_LOSANGELES;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_LONDON_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_LONDON_KO)) {
            return OnboardingConstants.REGION_CODE_LONDON;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_PARIS_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_PARIS_KO)) {
            return OnboardingConstants.REGION_CODE_PARIS;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SINGAPORE_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SINGAPORE_KO)) {
            return OnboardingConstants.REGION_CODE_SINGAPORE;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_HONG_KONG_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_HONG_KONG_KO)) {
            return OnboardingConstants.REGION_CODE_HONGKONG;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_BEIJING_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_BEIJING_KO_A)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_BEIJING_KO_B)) {
            return OnboardingConstants.REGION_CODE_BEIJING;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SHANGHAI_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SHANGHAI_KO)) {
            return OnboardingConstants.REGION_CODE_SHANGHAI;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SYDNEY_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_SYDNEY_KO)) {
            return OnboardingConstants.REGION_CODE_SYDNEY;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_MELBOURNE_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_MELBOURNE_KO)) {
            return OnboardingConstants.REGION_CODE_MELBOURNE;
        }

        else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_JAPAN_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_JAPAN_KO)) {
            return OnboardingConstants.REGION_CODE_JAPAN;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_USA_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_UNITED_STATES_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_USA_KO)) {
            return OnboardingConstants.REGION_CODE_USA;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_UK_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_UNITED_KINGDOM_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_UK_KO)) {
            return OnboardingConstants.REGION_CODE_UK;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_FRANCE_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_FRANCE_KO)) {
            return OnboardingConstants.REGION_CODE_FRANCE;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_CHINA_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_CHINA_KO)) {
            return OnboardingConstants.REGION_CODE_CHINA;
        } else if (normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_AUSTRALIA_EN)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_AUSTRALIA_KO_A)
                || normalizedAddress.contains(OnboardingConstants.ADDRESS_TOKEN_AUSTRALIA_KO_B)) {
            return OnboardingConstants.REGION_CODE_AUSTRALIA;
        }

        return null;
    }

    /**
     * 우편번호에서 지역 코드 추출 (한국 우편번호 기준)
     *
     * @param postalCode 우편번호
     * @return 지역 코드
     */
    private String extractRegionFromPostalCode(String postalCode) {
        if (postalCode == null || postalCode.trim().isEmpty()) {
            return null;
        }

        String code = postalCode.trim().replaceAll(OnboardingConstants.POSTAL_CODE_NON_DIGIT_STRIP_PATTERN,
                "");
        if (code.length() < OnboardingConstants.POSTAL_CODE_PREFIX_MIN_LENGTH) {
            return null;
        }

        String prefix = code.substring(0, OnboardingConstants.POSTAL_CODE_PREFIX_SUBSTRING_LENGTH);
        int prefixNum = Integer.parseInt(prefix);

        if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_SEOUL_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_SEOUL_MAX) {
            return OnboardingConstants.REGION_CODE_SEOUL;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_BUSAN_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_BUSAN_MAX) {
            return OnboardingConstants.REGION_CODE_BUSAN;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_DAEGU_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_DAEGU_MAX) {
            return OnboardingConstants.REGION_CODE_DAEGU;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_INCHEON_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_INCHEON_MAX) {
            return OnboardingConstants.REGION_CODE_INCHEON;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_GWANGJU_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_GWANGJU_MAX) {
            return OnboardingConstants.REGION_CODE_GWANGJU;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_DAEJEON_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_DAEJEON_MAX) {
            return OnboardingConstants.REGION_CODE_DAEJEON;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_ULSAN_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_ULSAN_MAX) {
            return OnboardingConstants.REGION_CODE_ULSAN;
        } else if (prefixNum == OnboardingConstants.POSTAL_PREFIX_NUM_SEJONG) {
            return OnboardingConstants.REGION_CODE_SEJONG;
        } else if ((prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_GYEONGGI_MIN_A
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_GYEONGGI_MAX_A)
                || (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_GYEONGGI_MIN_B
                        && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_GYEONGGI_MAX_B)) {
            return OnboardingConstants.REGION_CODE_GYEONGGI;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_GANGWON_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_GANGWON_MAX) {
            return OnboardingConstants.REGION_CODE_GANGWON;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_CHUNGBUK_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_CHUNGBUK_MAX) {
            return OnboardingConstants.REGION_CODE_CHUNGBUK;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_CHUNGNAM_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_CHUNGNAM_MAX) {
            return OnboardingConstants.REGION_CODE_CHUNGNAM;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_JEONBUK_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_JEONBUK_MAX) {
            return OnboardingConstants.REGION_CODE_JEONBUK;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_JEONNAM_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_JEONNAM_MAX) {
            return OnboardingConstants.REGION_CODE_JEONNAM;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_GYEONGBUK_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_GYEONGBUK_MAX) {
            return OnboardingConstants.REGION_CODE_GYEONGBUK;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_GYEONGNAM_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_GYEONGNAM_MAX) {
            return OnboardingConstants.REGION_CODE_GYEONGNAM;
        } else if (prefixNum >= OnboardingConstants.POSTAL_PREFIX_NUM_JEJU_MIN
                && prefixNum <= OnboardingConstants.POSTAL_PREFIX_NUM_JEJU_MAX) {
            return OnboardingConstants.REGION_CODE_JEJU;
        }

        return null;
    }


    /**
     * 별도 트랜잭션에서 테넌트 초기화 작업 실행 메인 트랜잭션에 영향을 주지 않도록 별도 트랜잭션으로 분리
     *
     * @param tenantId 테넌트 ID
     * @param businessType 업종 타입
     * @param actorId 실행자 ID
     * @param requestId 온보딩 요청 ID (상태 저장용)
     * @return 초기화 작업 상태 JSON 문자열 (메인 트랜잭션에서 저장하기 위해 반환)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public String initializeTenantAfterOnboardingInNewTransaction(String tenantId,
            String businessType, String actorId, Long requestId) {
        // 각 작업을 별도 트랜잭션으로 분리하여 하나가 실패해도 다른 것들은 성공하도록 처리
        OnboardingServiceImpl self = applicationContext.getBean(OnboardingServiceImpl.class);

        // 초기화 작업 상태 맵 생성
        Map<String, Object> statusMap = new java.util.HashMap<>();
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_COMMON_CODES,
                createInitializationStatus(OnboardingConstants.STATUS_PENDING, null));
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_ROLE_CODES,
                createInitializationStatus(OnboardingConstants.STATUS_PENDING, null));
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_PERMISSION_GROUPS,
                createInitializationStatus(OnboardingConstants.STATUS_PENDING, null));
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_ERP_ACCOUNTS,
                createInitializationStatus(OnboardingConstants.STATUS_PENDING, null));
        String now = Instant.now().toString();
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_CREATED_AT, now);
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_UPDATED_AT, now);
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_PHASE,
                OnboardingConstants.PHASE_TENANT_INITIALIZATION);
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_FALLBACK_USED, false);

        // 1. 공통코드 삽입 (별도 트랜잭션)
        try {
            self.insertDefaultTenantCommonCodesInNewTransaction(tenantId, actorId);
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_COMMON_CODES,
                    createInitializationStatus(OnboardingConstants.STATUS_SUCCESS, null));
            log.info(OnboardingConstants.LOG_INFO_COMMON_CODES_INSERT_OK, tenantId);
        } catch (Exception e) {
            String errorMsg =
                    e.getMessage() != null ? e.getMessage() : OnboardingConstants.ERROR_MESSAGE_UNKNOWN;
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_COMMON_CODES,
                    createInitializationStatus(OnboardingConstants.STATUS_FAILED, errorMsg));
            log.error(OnboardingConstants.LOG_ERROR_COMMON_CODES_INSERT_FAIL_CONTINUE, tenantId, errorMsg,
                    e);
        }

        // 2. 역할 코드 생성 (별도 트랜잭션)
        try {
            self.insertTenantRoleCodesInNewTransaction(tenantId, businessType, actorId);
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_ROLE_CODES,
                    createInitializationStatus(OnboardingConstants.STATUS_SUCCESS, null));
            log.info(OnboardingConstants.LOG_INFO_ROLE_CODES_CREATE_OK, tenantId);
        } catch (Exception e) {
            String errorMsg =
                    e.getMessage() != null ? e.getMessage() : OnboardingConstants.ERROR_MESSAGE_UNKNOWN;
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_ROLE_CODES,
                    createInitializationStatus(OnboardingConstants.STATUS_FAILED, errorMsg));
            log.error(OnboardingConstants.LOG_ERROR_ROLE_CODES_CREATE_FAIL_CONTINUE, tenantId, errorMsg, e);
        }

        // 3. 권한 그룹 할당 (별도 트랜잭션)
        try {
            self.assignDefaultPermissionGroupsToAdminInNewTransaction(tenantId, actorId);
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_PERMISSION_GROUPS,
                    createInitializationStatus(OnboardingConstants.STATUS_SUCCESS, null));
            log.info(OnboardingConstants.LOG_INFO_PERMISSION_GROUPS_ASSIGN_OK, tenantId);
        } catch (Exception e) {
            String errorMsg =
                    e.getMessage() != null ? e.getMessage() : OnboardingConstants.ERROR_MESSAGE_UNKNOWN;
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_PERMISSION_GROUPS,
                    createInitializationStatus(OnboardingConstants.STATUS_FAILED, errorMsg));
            log.error(OnboardingConstants.LOG_ERROR_PERMISSION_GROUPS_ASSIGN_FAIL_CONTINUE, tenantId,
                    errorMsg, e);
        }

        // 4. ERP 계정 매핑 시딩 (별도 트랜잭션)
        try {
            accountingService.ensureErpAccountMappingForTenant(tenantId);
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_ERP_ACCOUNTS,
                    createInitializationStatus(OnboardingConstants.STATUS_SUCCESS, null));
            log.info(OnboardingConstants.LOG_INFO_ERP_ACCOUNT_SEED_OK, tenantId);
        } catch (Exception e) {
            String errorMsg =
                    e.getMessage() != null ? e.getMessage() : OnboardingConstants.ERROR_MESSAGE_UNKNOWN;
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_ERP_ACCOUNTS,
                    createInitializationStatus(OnboardingConstants.STATUS_FAILED, errorMsg));
            log.error(OnboardingConstants.LOG_ERROR_ERP_ACCOUNT_SEED_FAIL_CONTINUE, tenantId, errorMsg, e);
        }

        // 상태 JSON 생성 (메인 트랜잭션에서 저장하기 위해 반환)
        try {
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_UPDATED_AT, Instant.now().toString());
            String statusJson = objectMapper.writeValueAsString(statusMap);
            log.info(OnboardingConstants.LOG_INFO_INIT_STATUS_JSON_READY, requestId);
            log.info(OnboardingConstants.LOG_INFO_TENANT_INIT_AFTER_ONBOARDING_OK, tenantId);
            return statusJson;
        } catch (Exception e) {
            log.warn(OnboardingConstants.LOG_WARN_INIT_STATUS_JSON_BUILD_FAIL_IGNORE, requestId,
                    e.getMessage());
            return null;
        }
    }

    /**
     * 초기화 작업 상태 객체 생성
     */
    private Map<String, Object> createInitializationStatus(String status, String errorMessage) {
        Map<String, Object> statusObj = new java.util.HashMap<>();
        statusObj.put(OnboardingConstants.INIT_STATUS_OBJ_KEY_STATUS, status); // PENDING, SUCCESS, FAILED
        statusObj.put(OnboardingConstants.INIT_STATUS_JSON_KEY_UPDATED_AT,
                java.time.Instant.now().toString());
        if (errorMessage != null) {
            statusObj.put(OnboardingConstants.INIT_STATUS_OBJ_KEY_ERROR_MESSAGE, errorMessage);
        }
        return statusObj;
    }

    private boolean isFallbackUsed(Map<String, Object> approvalResult, String message) {
        if (approvalResult != null
                && approvalResult.get(OnboardingConstants.INIT_STATUS_JSON_KEY_FALLBACK_USED) instanceof Boolean fallbackValue) {
            return fallbackValue;
        }

        if (message == null || message.trim().isEmpty()) {
            return false;
        }

        String normalizedMessage = message.toLowerCase();
        return normalizedMessage.contains(OnboardingConstants.FALLBACK_DETECT_SUBSTRING_EN)
                || normalizedMessage.contains(OnboardingConstants.FALLBACK_DETECT_SUBSTRING_KO);
    }

    private void persistInitializationStatusAfterDecision(Long requestId, String tenantId,
            String statusJson, String phase, boolean fallbackUsed) {
        String normalizedStatusJson =
                buildDecisionStatusJson(statusJson, phase, fallbackUsed, requestId, tenantId);
        if (normalizedStatusJson == null || normalizedStatusJson.trim().isEmpty()) {
            return;
        }

        try {
            OnboardingServiceImpl self = applicationContext.getBean(OnboardingServiceImpl.class);
            if (tenantId != null && !tenantId.trim().isEmpty()) {
                self.saveInitializationStatusInNewTransaction(requestId, tenantId, normalizedStatusJson);
                return;
            }

            OnboardingRequest request = repository.findActiveById(requestId).orElse(null);
            if (request != null) {
                request.setInitializationStatusJson(normalizedStatusJson);
                repository.save(request);
            }
        } catch (Exception e) {
            log.warn(OnboardingConstants.LOG_WARN_INIT_STATUS_AFTER_DECISION_SAVE_FAIL_IGNORE, requestId,
                    tenantId, e.getMessage());
        }
    }

    private String buildDecisionStatusJson(String existingStatusJson, String phase, boolean fallbackUsed,
            Long requestId, String tenantId) {
        Map<String, Object> statusMap = new java.util.HashMap<>();
        if (existingStatusJson != null && !existingStatusJson.trim().isEmpty()) {
            try {
                statusMap = objectMapper.readValue(existingStatusJson,
                        new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn(OnboardingConstants.LOG_WARN_EXISTING_INIT_STATUS_JSON_PARSE_FAIL, requestId,
                        e.getMessage());
            }
        }

        String now = Instant.now().toString();
        statusMap.putIfAbsent(OnboardingConstants.INIT_STATUS_JSON_KEY_CREATED_AT, now);
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_UPDATED_AT, now);
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_PHASE, phase);
        statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_FALLBACK_USED, fallbackUsed);
        if (tenantId != null && !tenantId.trim().isEmpty()) {
            statusMap.put(OnboardingConstants.INIT_STATUS_JSON_KEY_TENANT_ID, tenantId);
        }

        try {
            return objectMapper.writeValueAsString(statusMap);
        } catch (Exception e) {
            log.warn(OnboardingConstants.LOG_WARN_INIT_STATUS_JSON_SERIALIZE_FAIL, requestId,
                    e.getMessage());
            return null;
        }
    }

    /**
     * 커밋 후 테넌트 시딩·브랜딩·승인 메일을 백그라운드에서 실행하여 decision HTTP 응답 시간을 단축한다.
     *
     * @param reapprovalFlow true이면 재승인(프로시저 생략) 경로의 phase/에러 라벨을 사용한다.
     */
    private void schedulePostApprovalInitializationAfterCommit(Long requestId, String tenantId,
            String businessType, String actorId, boolean fallbackUsed, boolean reapprovalFlow) {
        Runnable pipeline = () -> executePostApprovalInitializationWork(requestId, tenantId, businessType,
                actorId, fallbackUsed, reapprovalFlow);
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    onboardingPostApprovalExecutor.execute(() -> {
                        try {
                            pipeline.run();
                        } catch (Exception e) {
                            log.error(OnboardingConstants.LOG_ERROR_POST_APPROVAL_INIT_BG_FAIL, requestId,
                                    e.getMessage(), e);
                        }
                    });
                }
            });
        } else {
            log.debug(OnboardingConstants.LOG_DEBUG_NO_ACTIVE_TX_POST_APPROVAL_SYNC, requestId);
            try {
                pipeline.run();
            } catch (Exception e) {
                log.error(OnboardingConstants.LOG_ERROR_POST_APPROVAL_INIT_SYNC_FAIL, requestId,
                        e.getMessage(), e);
            }
        }
    }

    /**
     * 테넌트 시딩·초기화 JSON 저장·브랜딩·승인 메일 (트랜잭션 커밋 이후 실행 전제).
     */
    private void executePostApprovalInitializationWork(Long requestId, String tenantId, String businessType,
            String actorId, boolean fallbackUsed, boolean reapprovalFlow) {
        String successPhase =
                reapprovalFlow ? OnboardingConstants.PHASE_REAPPROVAL_INITIALIZATION
                        : OnboardingConstants.PHASE_POST_APPROVAL_INITIALIZATION;
        String errorPhase = reapprovalFlow ? OnboardingConstants.PHASE_REAPPROVAL_INITIALIZATION_ERROR
                : OnboardingConstants.PHASE_POST_APPROVAL_INITIALIZATION_ERROR;
        try {
            log.info(OnboardingConstants.LOG_INFO_POST_APPROVAL_INIT_START, tenantId, requestId,
                    reapprovalFlow);
            OnboardingServiceImpl self = applicationContext.getBean(OnboardingServiceImpl.class);
            String initializationStatusJson =
                    self.initializeTenantAfterOnboardingInNewTransaction(tenantId, businessType, actorId,
                            requestId);
            persistInitializationStatusAfterDecision(requestId, tenantId, initializationStatusJson,
                    successPhase, fallbackUsed);
            log.info(OnboardingConstants.LOG_INFO_POST_APPROVAL_STATUS_SAVED, requestId);
            try {
                OnboardingRequest forBranding = repository.findActiveById(requestId).orElse(null);
                if (forBranding != null) {
                    setTenantBranding(tenantId, forBranding);
                }
            } catch (Exception e) {
                log.warn(OnboardingConstants.LOG_WARN_BRAND_NAME_SET_FAIL_POST, tenantId, e.getMessage());
            }
            OnboardingRequest latest = repository.findActiveById(requestId).orElse(null);
            if (latest != null) {
                sendOnboardingApprovalEmail(latest, tenantId);
            } else {
                log.warn(OnboardingConstants.LOG_WARN_ONBOARDING_APPROVAL_EMAIL_SKIPPED, requestId);
            }
        } catch (Exception e) {
            log.error(OnboardingConstants.LOG_ERROR_TENANT_INIT_AFTER_ONBOARDING_FAIL_POST, tenantId,
                    requestId, e.getMessage(), e);
            persistInitializationStatusAfterDecision(requestId, tenantId, null, errorPhase, fallbackUsed);
        }
    }

    /**
     * 별도 트랜잭션에서 공통코드 삽입
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public void insertDefaultTenantCommonCodesInNewTransaction(String tenantId, String createdBy) {
        try {
            insertDefaultTenantCommonCodes(tenantId, createdBy);
        } catch (Exception e) {
            log.error(OnboardingConstants.LOG_ERROR_COMMON_CODES_INSERT_TX_COMMIT, tenantId, e.getMessage(),
                    e);
            // 예외를 다시 throw하지 않음 (noRollbackFor로 설정되어 있어도 예외를 throw하면 롤백될 수 있음)
        }
    }

    /**
     * 별도 트랜잭션에서 역할 코드 생성
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public void insertTenantRoleCodesInNewTransaction(String tenantId, String businessType,
            String createdBy) {
        try {
            insertTenantRoleCodes(tenantId, businessType, createdBy);
        } catch (Exception e) {
            log.error(OnboardingConstants.LOG_ERROR_ROLE_CODES_CREATE_TX_COMMIT, tenantId, e.getMessage(),
                    e);
        }
    }

    /**
     * 메인 트랜잭션에서 권한 그룹 할당
     * REQUIRED를 사용하여 메인 트랜잭션에 참여하여 프로시저가 생성한 역할을 즉시 조회 가능
     */
    @Transactional(propagation = Propagation.REQUIRED, noRollbackFor = Exception.class)
    public void assignDefaultPermissionGroupsToAdminInNewTransaction(String tenantId,
            String actorId) {
        try {
            assignDefaultPermissionGroupsToAdmin(tenantId, actorId);
            log.info(OnboardingConstants.LOG_INFO_PERMISSION_GROUPS_ASSIGN_DONE, tenantId);
        } catch (Exception e) {
            log.error(OnboardingConstants.LOG_ERROR_PERMISSION_GROUPS_ASSIGN_TX_COMMIT, tenantId,
                    e.getMessage(), e);
            // noRollbackFor로 설정되어 있지만 예외를 throw하면 트랜잭션이 rollback-only로 마크됨
            // 따라서 예외를 throw하지 않고 내부에서 처리하여 트랜잭션 커밋 보장
            // 상위에서 상태를 FAILED로 저장할 수 있도록 예외 정보는 로그로만 남김
        }
    }

    /**
     * 테넌트 브랜딩 정보 설정 (브랜드명 저장)
     *
     * @param tenantId 테넌트 ID
     * @param request 온보딩 요청
     */
    private void setTenantBranding(String tenantId, OnboardingRequest request) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn(OnboardingConstants.LOG_WARN_TENANT_ID_EMPTY_SKIP_BRANDING);
            return;
        }

        try {
            Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId).orElse(null);

            if (tenant == null) {
                log.warn(OnboardingConstants.LOG_WARN_TENANT_NOT_FOUND_SKIP_BRANDING, tenantId);
                return;
            }

            // checklistJson에서 brandName 추출
            String brandName = null;
            if (request.getChecklistJson() != null && !request.getChecklistJson().isEmpty()) {
                try {
                    Map<String, Object> checklist =
                            objectMapper.readValue(request.getChecklistJson(),
                                    new TypeReference<Map<String, Object>>() {});
                    brandName = (String) checklist.get(OnboardingConstants.CHECKLIST_JSON_KEY_BRAND_NAME);
                } catch (JsonProcessingException e) {
                    log.warn(OnboardingConstants.LOG_WARN_CHECKLIST_JSON_PARSE_BRAND_FAIL, tenantId,
                            e.getMessage());
                }
            }

            // brandName이 없으면 tenantName 사용
            if (brandName == null || brandName.trim().isEmpty()) {
                brandName = request.getTenantName();
            }

            // 기존 branding_json 파싱 또는 기본값 생성
            com.coresolution.core.dto.BrandingInfo brandingInfo;
            if (tenant.getBrandingJson() != null && !tenant.getBrandingJson().trim().isEmpty()) {
                try {
                    brandingInfo = objectMapper.readValue(tenant.getBrandingJson(),
                            com.coresolution.core.dto.BrandingInfo.class);
                    // 기존 정보 유지하면서 companyName만 업데이트
                    brandingInfo.setCompanyName(brandName);
                } catch (JsonProcessingException e) {
                    log.warn(OnboardingConstants.LOG_WARN_BRANDING_JSON_PARSE_FALLBACK, tenantId,
                            e.getMessage());
                    brandingInfo = com.coresolution.core.dto.BrandingInfo.createDefault(brandName);
                }
            } else {
                // branding_json이 없으면 기본값 생성
                brandingInfo = com.coresolution.core.dto.BrandingInfo.createDefault(brandName);
            }

            // JSON으로 변환하여 저장
            try {
                brandingService.stripLogoDataUriForPersistence(brandingInfo);
                String brandingJson = objectMapper.writeValueAsString(brandingInfo);
                tenant.setBrandingJson(brandingJson);
                tenantRepository.save(tenant);

                log.info(OnboardingConstants.LOG_INFO_TENANT_BRANDING_SET_OK, tenantId, brandName);
            } catch (JsonProcessingException e) {
                log.error(OnboardingConstants.LOG_ERROR_BRANDING_JSON_SERIALIZE_FAIL, tenantId,
                        e.getMessage(), e);
                throw new RuntimeException(OnboardingConstants.ERROR_MESSAGE_BRANDING_SAVE_FAILED, e);
            }

        } catch (Exception e) {
            log.error(OnboardingConstants.LOG_ERROR_TENANT_BRANDING_SET_FAIL, tenantId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 프로시저가 실패한 경우를 대비한 Java 코드에서 직접 삽입 배치 처리로 최적화: 개별 save() 대신 saveAll() 사용하여 DB 쿼리 수 대폭 감소
     *
     * @param tenantId 테넌트 ID
     * @param createdBy 생성자 ID
     */
    private void insertDefaultTenantCommonCodes(String tenantId, String createdBy) {
        log.info(OnboardingConstants.LOG_INFO_DEFAULT_TENANT_COMMON_CODES_BATCH_START, tenantId);

        String createdByValue =
                createdBy != null ? createdBy : OnboardingConstants.CREATED_BY_SYSTEM_ONBOARDING;

        try {
            // 1. 기존 코드를 한 번에 조회하여 중복 체크용 Set 생성
            List<CommonCode> existingCodes = commonCodeRepository.findByTenantId(tenantId);
            Set<String> existingCodeKeys = new HashSet<>();
            for (CommonCode code : existingCodes) {
                existingCodeKeys.add(code.getCodeGroup() + OnboardingConstants.COMMON_CODE_CACHE_KEY_SEPARATOR
                        + code.getCodeValue());
            }
            log.debug(OnboardingConstants.LOG_DEBUG_EXISTING_COMMON_CODE_COUNT, existingCodes.size(),
                    tenantId);

            // 2. 삽입할 공통코드 리스트 생성
            List<CommonCode> codesToInsert = new ArrayList<>();

            // 상담 패키지 코드
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_CODE_VALUE_CP_INDIVIDUAL,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_INDIVIDUAL,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_INDIVIDUAL,
                    OnboardingConstants.TENANT_SEED_DESC_CT_INDIVIDUAL_1_1,
                    OnboardingConstants.TENANT_SEED_EXTRA_CP_PACKAGE_INDIVIDUAL,
                    OnboardingConstants.TENANT_SEED_SORT_CP_PACKAGE_INDIVIDUAL, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_CODE_VALUE_CP_FAMILY,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_FAMILY,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_FAMILY,
                    OnboardingConstants.TENANT_SEED_DESC_CT_FAMILY,
                    OnboardingConstants.TENANT_SEED_EXTRA_CP_PACKAGE_FAMILY,
                    OnboardingConstants.TENANT_SEED_SORT_CP_PACKAGE_FAMILY, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_CODE_VALUE_CP_GROUP,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_GROUP,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_GROUP,
                    OnboardingConstants.TENANT_SEED_DESC_CP_PACKAGE_GROUP,
                    OnboardingConstants.TENANT_SEED_EXTRA_CP_PACKAGE_GROUP,
                    OnboardingConstants.TENANT_SEED_SORT_CP_PACKAGE_GROUP, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_CODE_VALUE_CP_SINGLE_75000,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_75000_WON,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_75000_WON,
                    OnboardingConstants.TENANT_SEED_DESC_ONE_SESSION_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_EXTRA_CP_SINGLE_75000,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_75000,
                    createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_CODE_VALUE_CP_SINGLE_80000,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_80000_WON,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_80000_WON,
                    OnboardingConstants.TENANT_SEED_DESC_ONE_SESSION_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_EXTRA_CP_SINGLE_80000,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_80000,
                    createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_CODE_VALUE_CP_SINGLE_85000,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_85000_WON,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_85000_WON,
                    OnboardingConstants.TENANT_SEED_DESC_ONE_SESSION_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_EXTRA_CP_SINGLE_85000,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_85000,
                    createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_CODE_VALUE_CP_SINGLE_90000,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_90000_WON,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_90000_WON,
                    OnboardingConstants.TENANT_SEED_DESC_ONE_SESSION_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_EXTRA_CP_SINGLE_90000,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_90000,
                    createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_CODE_VALUE_CP_SINGLE_95000,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_95000_WON,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_95000_WON,
                    OnboardingConstants.TENANT_SEED_DESC_ONE_SESSION_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_EXTRA_CP_SINGLE_95000,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_95000,
                    createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_CODE_VALUE_CP_SINGLE_100000,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_100000_WON,
                    OnboardingConstants.TENANT_SEED_KO_LABEL_SINGLE_100000_WON,
                    OnboardingConstants.TENANT_SEED_DESC_ONE_SESSION_CONSULTATION_PACKAGE,
                    OnboardingConstants.TENANT_SEED_EXTRA_CP_SINGLE_100000,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_100000,
                    createdByValue);

            // 결제 방법 코드
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_PAYMENT_METHOD,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_PAYMENT_CASH,
                    OnboardingConstants.TENANT_COMMON_LABEL_CASH,
                    OnboardingConstants.TENANT_COMMON_LABEL_CASH,
                    OnboardingConstants.TENANT_COMMON_DESC_PAYMENT_CASH, null,
                    OnboardingConstants.TENANT_SEED_SORT_PAYMENT_METHOD_CASH, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_PAYMENT_METHOD,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_PAYMENT_CARD,
                    OnboardingConstants.TENANT_COMMON_LABEL_CARD,
                    OnboardingConstants.TENANT_COMMON_LABEL_CARD,
                    OnboardingConstants.TENANT_COMMON_DESC_PAYMENT_CARD, null,
                    OnboardingConstants.TENANT_SEED_SORT_PAYMENT_METHOD_CARD, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_PAYMENT_METHOD,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_PAYMENT_TRANSFER,
                    OnboardingConstants.TENANT_COMMON_LABEL_TRANSFER,
                    OnboardingConstants.TENANT_COMMON_LABEL_TRANSFER,
                    OnboardingConstants.TENANT_COMMON_DESC_PAYMENT_TRANSFER, null,
                    OnboardingConstants.TENANT_SEED_SORT_PAYMENT_METHOD_TRANSFER, createdByValue);

            // 전문분야 코드
            for (String[] specialty : OnboardingConstants.TENANT_SEED_SPECIALTY_ROWS) {
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_SPECIALTY, specialty[0],
                        specialty[1], specialty[1], specialty[2], null,
                        Integer.parseInt(specialty[3]), createdByValue);
            }

            // 상담 유형 코드 (스케줄·공통코드 API CONSULTATION_TYPE = 회기 유형; 대면/비대면/전화는 consultation_method 등 별도)
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_TYPE, "INDIVIDUAL",
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_INDIVIDUAL,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_INDIVIDUAL,
                    OnboardingConstants.TENANT_SEED_DESC_CT_INDIVIDUAL_1_1,
                    OnboardingConstants.TENANT_SEED_EXTRA_CONSULTATION_TYPE_INDIVIDUAL,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_TYPE_INDIVIDUAL,
                    createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_TYPE, "FAMILY",
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_FAMILY,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_FAMILY,
                    OnboardingConstants.TENANT_SEED_DESC_CT_FAMILY,
                    OnboardingConstants.TENANT_SEED_EXTRA_CONSULTATION_TYPE_FAMILY,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_TYPE_FAMILY, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_TYPE, "COUPLE",
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_COUPLE,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_COUPLE,
                    OnboardingConstants.TENANT_SEED_DESC_CT_COUPLE,
                    OnboardingConstants.TENANT_SEED_EXTRA_CONSULTATION_TYPE_COUPLE,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_TYPE_COUPLE, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_TYPE, "INITIAL",
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_INITIAL,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_INITIAL,
                    OnboardingConstants.TENANT_SEED_DESC_CT_INITIAL,
                    OnboardingConstants.TENANT_SEED_EXTRA_CONSULTATION_TYPE_INITIAL,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_TYPE_INITIAL, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_TYPE, "GROUP",
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_GROUP,
                    OnboardingConstants.TENANT_SEED_KO_NAME_CT_GROUP,
                    OnboardingConstants.TENANT_SEED_DESC_CT_GROUP,
                    OnboardingConstants.TENANT_SEED_EXTRA_CONSULTATION_TYPE_GROUP,
                    OnboardingConstants.TENANT_SEED_SORT_CONSULTATION_TYPE_GROUP, createdByValue);

            // 담당 업무 코드
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_RESPONSIBILITY,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_RESPONSIBILITY_COUNSELING,
                    OnboardingConstants.TENANT_SEED_LABEL_RESPONSIBILITY_COUNSELING,
                    OnboardingConstants.TENANT_SEED_LABEL_RESPONSIBILITY_COUNSELING,
                    OnboardingConstants.TENANT_SEED_DESC_RESPONSIBILITY_COUNSELING, null,
                    OnboardingConstants.TENANT_SEED_SORT_RESPONSIBILITY_COUNSELING, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_RESPONSIBILITY,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_RESPONSIBILITY_ADMINISTRATION,
                    OnboardingConstants.TENANT_SEED_LABEL_RESPONSIBILITY_ADMIN,
                    OnboardingConstants.TENANT_SEED_LABEL_RESPONSIBILITY_ADMIN,
                    OnboardingConstants.TENANT_SEED_DESC_RESPONSIBILITY_ADMIN, null,
                    OnboardingConstants.TENANT_SEED_SORT_RESPONSIBILITY_ADMIN, createdByValue);

            // 패키지 유형 (copy_default_tenant_codes / TENANT_CODE_GROUPS PACKAGE_TYPE)
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_PACKAGE_TYPE, "INDIVIDUAL",
                    OnboardingConstants.TENANT_SEED_LABEL_PT_INDIVIDUAL,
                    OnboardingConstants.TENANT_SEED_LABEL_PT_INDIVIDUAL,
                    OnboardingConstants.TENANT_SEED_DESC_PT_INDIVIDUAL, null,
                    OnboardingConstants.TENANT_SEED_SORT_PACKAGE_TYPE_INDIVIDUAL, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_PACKAGE_TYPE, "GROUP",
                    OnboardingConstants.TENANT_SEED_LABEL_PT_GROUP,
                    OnboardingConstants.TENANT_SEED_LABEL_PT_GROUP,
                    OnboardingConstants.TENANT_SEED_DESC_PT_GROUP, null,
                    OnboardingConstants.TENANT_SEED_SORT_PACKAGE_TYPE_GROUP, createdByValue);

            // 매핑 상태 (frontend/src/constants/mapping.js MAPPING_STATUS 와 코드값 정합)
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_MAPPING_STATUS,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_MAPPING_PENDING_PAYMENT,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_PENDING_PAYMENT,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_PENDING_PAYMENT,
                    OnboardingConstants.TENANT_SEED_DESC_MS_PENDING_PAYMENT, null,
                    OnboardingConstants.TENANT_SEED_SORT_MAPPING_STATUS_1, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_MAPPING_STATUS,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_MAPPING_PAYMENT_CONFIRMED,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_PAYMENT_CONFIRMED,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_PAYMENT_CONFIRMED,
                    OnboardingConstants.TENANT_SEED_DESC_MS_PAYMENT_CONFIRMED, null,
                    OnboardingConstants.TENANT_SEED_SORT_MAPPING_STATUS_2, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_MAPPING_STATUS,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_MAPPING_ACTIVE,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_ACTIVE,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_ACTIVE,
                    OnboardingConstants.TENANT_SEED_DESC_MS_ACTIVE, null,
                    OnboardingConstants.TENANT_SEED_SORT_MAPPING_STATUS_3, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_MAPPING_STATUS,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_MAPPING_INACTIVE,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_INACTIVE,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_INACTIVE,
                    OnboardingConstants.TENANT_SEED_DESC_MS_INACTIVE, null,
                    OnboardingConstants.TENANT_SEED_SORT_MAPPING_STATUS_4, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_MAPPING_STATUS,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_MAPPING_SUSPENDED,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_SUSPENDED,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_SUSPENDED,
                    OnboardingConstants.TENANT_SEED_DESC_MS_SUSPENDED, null,
                    OnboardingConstants.TENANT_SEED_SORT_MAPPING_STATUS_5, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_MAPPING_STATUS,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_MAPPING_TERMINATED,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_TERMINATED,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_TERMINATED,
                    OnboardingConstants.TENANT_SEED_DESC_MS_TERMINATED, null,
                    OnboardingConstants.TENANT_SEED_SORT_MAPPING_STATUS_6, createdByValue);
            addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                    OnboardingConstants.TENANT_COMMON_CODE_GROUP_MAPPING_STATUS,
                    OnboardingConstants.TENANT_COMMON_CODE_VALUE_MAPPING_SESSIONS_EXHAUSTED,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_SESSIONS_EXHAUSTED,
                    OnboardingConstants.TENANT_SEED_LABEL_MS_SESSIONS_EXHAUSTED,
                    OnboardingConstants.TENANT_SEED_DESC_MS_SESSIONS_EXHAUSTED, null,
                    OnboardingConstants.TENANT_SEED_SORT_MAPPING_STATUS_7, createdByValue);

            // 급여·ERP 필수 공통코드 (테넌트 행; 코어 폴백만 가정하지 않음). 시드 정의 동기화:
            // TenantOnboardingSalaryAndFinancialSeedDefinitions
            for (TenantOnboardingSalaryAndFinancialSeedDefinitions.SeedRow row : TenantOnboardingSalaryAndFinancialSeedDefinitions
                    .allRows()) {
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, row.codeGroup(),
                        row.codeValue(), row.koreanName(), row.codeLabel(), row.description(),
                        row.extraData(), row.sortOrder(), createdByValue, row.parentCodeGroup(),
                        row.parentCodeValue());
            }

            // 3. 배치 저장 (한 번의 쿼리로 모든 코드 삽입)
            if (!codesToInsert.isEmpty()) {
                commonCodeRepository.saveAll(codesToInsert);
                log.info(OnboardingConstants.LOG_MSG_TENANT_COMMON_CODES_BATCH_SAVE_OK, tenantId,
                        codesToInsert.size());
            } else {
                log.info(OnboardingConstants.LOG_MSG_TENANT_COMMON_CODES_ALL_EXIST, tenantId);
            }

        } catch (Exception e) {
            log.error(OnboardingConstants.LOG_MSG_TENANT_COMMON_CODES_INSERT_FAIL, tenantId,
                    e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 공통코드 리스트에 추가 (중복 체크)
     */
    private void addCodeIfNotExists(List<CommonCode> codesToInsert, Set<String> existingCodeKeys,
            String tenantId, String codeGroup, String codeValue, String koreanName,
            String codeLabel, String description, String extraData, Integer sortOrder,
            String createdBy) {
        addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, codeGroup, codeValue,
                koreanName, codeLabel, description, extraData, sortOrder, createdBy, null, null);
    }

    /**
     * parentCodeGroup/parentCodeValue: INCOME_SUBCATEGORY·EXPENSE_SUBCATEGORY 등 계층 코드용 (없으면 null).
     */
    private void addCodeIfNotExists(List<CommonCode> codesToInsert, Set<String> existingCodeKeys,
            String tenantId, String codeGroup, String codeValue, String koreanName,
            String codeLabel, String description, String extraData, Integer sortOrder,
            String createdBy, String parentCodeGroup, String parentCodeValue) {
        String codeKey = codeGroup + ":" + codeValue;
        if (existingCodeKeys.contains(codeKey)) {
            log.debug(OnboardingConstants.LOG_DEBUG_COMMON_CODE_ALREADY_EXISTS, tenantId, codeGroup,
                    codeValue);
            return;
        }

        CommonCode code = CommonCode.builder().codeGroup(codeGroup).codeValue(codeValue)
                .koreanName(koreanName).codeLabel(codeLabel).codeDescription(description)
                .sortOrder(sortOrder != null ? sortOrder : 0).isActive(true).extraData(extraData)
                .parentCodeGroup(parentCodeGroup).parentCodeValue(parentCodeValue).build();

        code.setTenantId(tenantId);
        codesToInsert.add(code);
        existingCodeKeys.add(codeKey);
    }

    /**
     * 테넌트 기본 공통코드 추가 (공개 메서드) 기존 테넌트에도 기본 코드를 추가할 수 있도록 제공
     *
     * @param tenantId 테넌트 ID
     * @param createdBy 생성자 ID
     * @return 추가된 코드 개수
     */
    public int addDefaultTenantCommonCodes(String tenantId, String createdBy) {
        log.info(OnboardingConstants.LOG_MSG_ADD_DEFAULT_TENANT_CODES_REQUEST, tenantId);
        int beforeCount = 0;
        try {
            List<CommonCode> existingCodes = commonCodeRepository.findByTenantId(tenantId);
            beforeCount = existingCodes != null ? existingCodes.size() : 0;
        } catch (Exception e) {
            log.warn(OnboardingConstants.LOG_WARN_EXISTING_CODE_COUNT_FAILED, e.getMessage());
        }

        insertDefaultTenantCommonCodes(tenantId, createdBy);

        int afterCount = 0;
        try {
            List<CommonCode> updatedCodes = commonCodeRepository.findByTenantId(tenantId);
            afterCount = updatedCodes != null ? updatedCodes.size() : 0;
        } catch (Exception e) {
            log.warn(OnboardingConstants.LOG_WARN_AFTER_CODE_COUNT_FAILED, e.getMessage());
        }

        int addedCount = afterCount - beforeCount;
        log.info(OnboardingConstants.LOG_MSG_ADD_DEFAULT_TENANT_CODES_DONE, tenantId, addedCount);
        return addedCount;
    }

    /**
     * 공통코드 삽입 (중복 체크) - Deprecated: 배치 처리로 대체됨
     *
     * @deprecated 배치 처리를 위해 addCodeIfNotExists()와 saveAll() 사용
     */
    @Deprecated
    private void insertCommonCodeIfNotExists(String tenantId, String codeGroup, String codeValue,
            String koreanName, String codeLabel, String description, String extraData,
            Integer sortOrder, String createdBy) {
        // 레거시 호환성을 위해 유지하지만 사용하지 않음
        // 배치 처리를 위해 addCodeIfNotExists()와 saveAll() 사용
        log.warn(OnboardingConstants.LOG_WARN_DEPRECATED_INSERT_COMMON_CODE_IF_NOT_EXISTS);
    }

    /**
     * 테넌트별 비즈니스 타입별 역할 코드 생성 표준화 2025-12-05: 비즈니스 타입에 따라 역할 코드 자동 생성 배치 처리로 최적화: 개별 save() 대신
     * saveAll() 사용하여 DB 쿼리 수 대폭 감소
     *
     * @param tenantId 테넌트 ID
     * @param businessType 비즈니스 타입
     * @param createdBy 생성자 ID
     */
    private void insertTenantRoleCodes(String tenantId, String businessType, String createdBy) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn(OnboardingConstants.LOG_WARN_TENANT_ID_EMPTY_SKIP_ROLE_CODES);
            return;
        }

        if (businessType == null || businessType.trim().isEmpty()) {
            log.warn(OnboardingConstants.LOG_WARN_BUSINESS_TYPE_EMPTY_SKIP_ROLE_CODES, tenantId);
            return;
        }

        log.info(OnboardingConstants.LOG_MSG_TENANT_ROLE_CODES_START, tenantId, businessType);

        String createdByValue = createdBy != null ? createdBy
                : OnboardingConstants.CREATED_BY_SYSTEM_ONBOARDING;

        try {
            // 1. 기존 코드를 한 번에 조회하여 중복 체크용 Set 생성
            List<CommonCode> existingCodes = commonCodeRepository.findByTenantId(tenantId);
            Set<String> existingCodeKeys = new HashSet<>();
            for (CommonCode code : existingCodes) {
                if (OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE.equals(code.getCodeGroup())) {
                    existingCodeKeys.add(code.getCodeGroup() + ":" + code.getCodeValue());
                }
            }

            // 2. 삽입할 역할 코드 리스트 생성
            List<CommonCode> codesToInsert = new ArrayList<>();

            // 상담소(CONSULTATION)
            if (OnboardingConstants.TENANT_BUSINESS_TYPE_CONSULTATION.equals(businessType)) {
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_ADMIN,
                        OnboardingConstants.TENANT_ROLE_LABEL_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_LABEL_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_DESC_CONSULTATION_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_JSON_CONSULTATION_ADMIN,
                        OnboardingConstants.TENANT_ROLE_SORT_FIRST, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_DESC_CONSULTATION_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_JSON_CONSULTATION_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_SORT_SECOND, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_CLIENT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CLIENT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CLIENT,
                        OnboardingConstants.TENANT_ROLE_DESC_CONSULTATION_CLIENT,
                        OnboardingConstants.TENANT_ROLE_JSON_CONSULTATION_CLIENT,
                        OnboardingConstants.TENANT_ROLE_SORT_THIRD, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_STAFF,
                        OnboardingConstants.TENANT_ROLE_LABEL_STAFF_OFFICE,
                        OnboardingConstants.TENANT_ROLE_LABEL_STAFF_OFFICE,
                        OnboardingConstants.TENANT_ROLE_DESC_CONSULTATION_STAFF,
                        OnboardingConstants.TENANT_ROLE_JSON_CONSULTATION_STAFF,
                        OnboardingConstants.TENANT_ROLE_SORT_FOURTH, createdByValue);
            }
            // 심리상담(COUNSELING)
            else if (OnboardingConstants.TENANT_BUSINESS_TYPE_COUNSELING.equals(businessType)) {
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_ADMIN,
                        OnboardingConstants.TENANT_ROLE_LABEL_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_LABEL_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_DESC_COUNSELING_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_JSON_COUNSELING_ADMIN,
                        OnboardingConstants.TENANT_ROLE_SORT_FIRST, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_DESC_COUNSELING_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_JSON_COUNSELING_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_SORT_SECOND, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_CLIENT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CLIENT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CLIENT,
                        OnboardingConstants.TENANT_ROLE_DESC_COUNSELING_CLIENT,
                        OnboardingConstants.TENANT_ROLE_JSON_COUNSELING_CLIENT,
                        OnboardingConstants.TENANT_ROLE_SORT_THIRD, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_STAFF,
                        OnboardingConstants.TENANT_ROLE_LABEL_STAFF_OFFICE,
                        OnboardingConstants.TENANT_ROLE_LABEL_STAFF_OFFICE,
                        OnboardingConstants.TENANT_ROLE_DESC_COUNSELING_STAFF,
                        OnboardingConstants.TENANT_ROLE_JSON_COUNSELING_STAFF,
                        OnboardingConstants.TENANT_ROLE_SORT_FOURTH, createdByValue);
            }
            // 학원(ACADEMY)
            else if (OnboardingConstants.TENANT_BUSINESS_TYPE_ACADEMY.equals(businessType)) {
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_ADMIN,
                        OnboardingConstants.TENANT_ROLE_LABEL_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_LABEL_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_DESC_ACADEMY_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_JSON_ACADEMY_ADMIN,
                        OnboardingConstants.TENANT_ROLE_SORT_FIRST, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_LABEL_TEACHER,
                        OnboardingConstants.TENANT_ROLE_LABEL_TEACHER,
                        OnboardingConstants.TENANT_ROLE_DESC_ACADEMY_TEACHER,
                        OnboardingConstants.TENANT_ROLE_JSON_ACADEMY_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_SORT_SECOND, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_CLIENT,
                        OnboardingConstants.TENANT_ROLE_LABEL_STUDENT,
                        OnboardingConstants.TENANT_ROLE_LABEL_STUDENT,
                        OnboardingConstants.TENANT_ROLE_DESC_ACADEMY_STUDENT,
                        OnboardingConstants.TENANT_ROLE_JSON_ACADEMY_CLIENT,
                        OnboardingConstants.TENANT_ROLE_SORT_THIRD, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_PARENT,
                        OnboardingConstants.TENANT_ROLE_LABEL_PARENT,
                        OnboardingConstants.TENANT_ROLE_LABEL_PARENT,
                        OnboardingConstants.TENANT_ROLE_DESC_ACADEMY_PARENT,
                        OnboardingConstants.TENANT_ROLE_JSON_ACADEMY_PARENT,
                        OnboardingConstants.TENANT_ROLE_SORT_FOURTH, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_STAFF,
                        OnboardingConstants.TENANT_ROLE_LABEL_ADMIN_STAFF,
                        OnboardingConstants.TENANT_ROLE_LABEL_ADMIN_STAFF,
                        OnboardingConstants.TENANT_ROLE_DESC_ACADEMY_ADMIN_STAFF,
                        OnboardingConstants.TENANT_ROLE_JSON_ACADEMY_STAFF,
                        OnboardingConstants.TENANT_ROLE_SORT_FIFTH, createdByValue);
            }
            // 요식업(FOOD_SERVICE)
            else if (OnboardingConstants.TENANT_BUSINESS_TYPE_FOOD_SERVICE.equals(businessType)) {
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_ADMIN,
                        OnboardingConstants.TENANT_ROLE_LABEL_CEO,
                        OnboardingConstants.TENANT_ROLE_LABEL_CEO,
                        OnboardingConstants.TENANT_ROLE_DESC_FOOD_SERVICE_CEO,
                        OnboardingConstants.TENANT_ROLE_JSON_FOOD_SERVICE_ADMIN,
                        OnboardingConstants.TENANT_ROLE_SORT_FIRST, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CHEF,
                        OnboardingConstants.TENANT_ROLE_LABEL_CHEF,
                        OnboardingConstants.TENANT_ROLE_DESC_FOOD_SERVICE_CHEF,
                        OnboardingConstants.TENANT_ROLE_JSON_FOOD_SERVICE_CONSULTANT,
                        OnboardingConstants.TENANT_ROLE_SORT_SECOND, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_CLIENT,
                        OnboardingConstants.TENANT_ROLE_LABEL_CUSTOMER,
                        OnboardingConstants.TENANT_ROLE_LABEL_CUSTOMER,
                        OnboardingConstants.TENANT_ROLE_DESC_FOOD_SERVICE_CUSTOMER,
                        OnboardingConstants.TENANT_ROLE_JSON_FOOD_SERVICE_CLIENT,
                        OnboardingConstants.TENANT_ROLE_SORT_THIRD, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_STAFF,
                        OnboardingConstants.TENANT_ROLE_LABEL_EMPLOYEE,
                        OnboardingConstants.TENANT_ROLE_LABEL_EMPLOYEE,
                        OnboardingConstants.TENANT_ROLE_DESC_FOOD_SERVICE_EMPLOYEE,
                        OnboardingConstants.TENANT_ROLE_JSON_FOOD_SERVICE_STAFF,
                        OnboardingConstants.TENANT_ROLE_SORT_FOURTH, createdByValue);
            }
            // 태권도(TAEKWONDO)
            else if (OnboardingConstants.TENANT_BUSINESS_TYPE_TAEKWONDO.equals(businessType)) {
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_ROLE,
                        OnboardingConstants.TENANT_ROLE_CODE_VALUE_ADMIN,
                        OnboardingConstants.TENANT_ROLE_LABEL_TAEKWONDO_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_LABEL_TAEKWONDO_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_DESC_TAEKWONDO_DIRECTOR,
                        OnboardingConstants.TENANT_ROLE_JSON_TAEKWONDO_ADMIN,
                        OnboardingConstants.TENANT_ROLE_SORT_FIRST, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "CONSULTANT",
                        "사범", "사범", "태권도 사범 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"TAEKWONDO\"}",
                        2, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "CLIENT",
                        "학생", "학생", "태권도 학생 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"TAEKWONDO\"}",
                        3, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "STAFF", "직원",
                        "직원", "태권도 직원 역할",
                        "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"TAEKWONDO\"}",
                        4, createdByValue);
            }
            // 과외(TUTORING)
            else if ("TUTORING".equals(businessType)) {
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "ADMIN", "원장",
                        "원장", "과외 원장 역할",
                        "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"TUTORING\"}",
                        1, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "CONSULTANT",
                        "강사", "강사", "과외 강사 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"TUTORING\"}",
                        2, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "CLIENT",
                        "학생", "학생", "과외 학생 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"TUTORING\"}",
                        3, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "STAFF", "직원",
                        "직원", "과외 직원 역할",
                        "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"TUTORING\"}",
                        4, createdByValue);
            }
            // 기타 비즈니스 타입
            else {
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "ADMIN",
                        "관리자", "관리자", "관리자 역할",
                        String.format(
                                "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"%s\"}",
                                businessType),
                        1, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "CONSULTANT",
                        "전문가", "전문가", "전문가 역할",
                        String.format(
                                "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"%s\"}",
                                businessType),
                        2, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "CLIENT",
                        "고객", "고객", "고객 역할",
                        String.format(
                                "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"%s\"}",
                                businessType),
                        3, createdByValue);
                addCodeIfNotExists(codesToInsert, existingCodeKeys, tenantId, "ROLE", "STAFF", "직원",
                        "직원", "직원 역할",
                        String.format(
                                "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"%s\"}",
                                businessType),
                        4, createdByValue);
            }

            // 3. 배치 저장 (한 번의 쿼리로 모든 역할 코드 삽입)
            if (!codesToInsert.isEmpty()) {
                commonCodeRepository.saveAll(codesToInsert);
                log.info("✅ 테넌트 역할 코드 배치 저장 완료: tenantId={}, businessType={}, insertedCount={}",
                        tenantId, businessType, codesToInsert.size());
            } else {
                log.info("✅ 모든 역할 코드가 이미 존재함: tenantId={}, businessType={}", tenantId,
                        businessType);
            }

        } catch (Exception e) {
            log.error("❌ 테넌트 역할 코드 생성 실패: tenantId={}, businessType={}, error={}", tenantId,
                    businessType, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 관리자 역할에 기본 권한 그룹 할당 표준화 2025-12-08: 모든 관리자에게 DASHBOARD_ERP 권한 그룹 자동 할당
     *
     * @param tenantId 테넌트 ID
     * @param actorId 실행자 ID
     */
    private void assignDefaultPermissionGroupsToAdmin(String tenantId, String actorId) {
        log.info("🔄 관리자 권한 그룹 할당 시작: tenantId={}", tenantId);

        try {
            // JDBC를 사용하여 역할 직접 조회
            // 프로시저가 이미 역할을 생성했으므로, display_order=1을 우선 조회하고
            // 트랜잭션 커밋 대기 시간을 최소화
            String tenantRoleId = null;
            String roleName = null;
            int maxRetries = 10;
            long baseRetryDelayMs = 200L;

            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                tenantRoleId = null;
                roleName = null;

                // 1. display_order=1인 역할 찾기 (가장 빠르고 확실한 방법)
                // 프로시저가 항상 display_order=1로 원장 역할을 생성하므로 우선 조회
                try {
                    String sql =
                            "SELECT tenant_role_id, name_ko FROM tenant_roles WHERE tenant_id = ? AND display_order = 1 AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1";
                    java.util.Map<String, Object> result =
                            jdbcTemplate.queryForMap(sql, tenantId);
                    if (result != null && result.get("tenant_role_id") != null) {
                        tenantRoleId = (String) result.get("tenant_role_id");
                        roleName = (String) result.get("name_ko");
                        log.info("✅ JDBC로 display_order=1 역할 찾음: tenantId={}, tenantRoleId={}, roleName={}, attempt={}",
                                tenantId, tenantRoleId, roleName, attempt);
                        break; // 역할을 찾았으므로 루프 종료
                    }
                } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                    log.debug("display_order=1 역할 없음: tenantId={}, attempt={}", tenantId, attempt);
                }

                // 2. name_en이 "Director"인 역할 찾기 (CONSULTATION 업종)
                if (tenantRoleId == null) {
                    try {
                        String sql =
                                "SELECT tenant_role_id, name_ko FROM tenant_roles WHERE tenant_id = ? AND name_en = 'Director' AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1";
                        java.util.Map<String, Object> result =
                                jdbcTemplate.queryForMap(sql, tenantId);
                        if (result != null && result.get("tenant_role_id") != null) {
                            tenantRoleId = (String) result.get("tenant_role_id");
                            roleName = (String) result.get("name_ko");
                            log.info("✅ JDBC로 'Director' 역할 찾음: tenantId={}, tenantRoleId={}, roleName={}, attempt={}",
                                    tenantId, tenantRoleId, roleName, attempt);
                            break; // 역할을 찾았으므로 루프 종료
                        }
                    } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                        log.debug("'Director' 역할 없음: tenantId={}, attempt={}", tenantId, attempt);
                    }
                }

                // 3. "원장" 역할 찾기 (CONSULTATION/COUNSELING 업종)
                if (tenantRoleId == null) {
                    try {
                        String sql =
                                "SELECT tenant_role_id, name_ko FROM tenant_roles WHERE tenant_id = ? AND name_ko = '원장' AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1";
                        java.util.Map<String, Object> result = jdbcTemplate.queryForMap(sql, tenantId);
                        if (result != null && result.get("tenant_role_id") != null) {
                            tenantRoleId = (String) result.get("tenant_role_id");
                            roleName = (String) result.get("name_ko");
                            log.info("✅ JDBC로 '원장' 역할 찾음: tenantId={}, tenantRoleId={}, roleName={}, attempt={}",
                                    tenantId, tenantRoleId, roleName, attempt);
                            break; // 역할을 찾았으므로 루프 종료
                        }
                    } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                        log.debug("'원장' 역할 없음: tenantId={}, attempt={}", tenantId, attempt);
                    }
                }

                // 4. "관리자" 역할 찾기
                if (tenantRoleId == null) {
                    try {
                        String sql =
                                "SELECT tenant_role_id, name_ko FROM tenant_roles WHERE tenant_id = ? AND name_ko = '관리자' AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1";
                        java.util.Map<String, Object> result =
                                jdbcTemplate.queryForMap(sql, tenantId);
                        if (result != null && result.get("tenant_role_id") != null) {
                            tenantRoleId = (String) result.get("tenant_role_id");
                            roleName = (String) result.get("name_ko");
                            log.info("✅ JDBC로 '관리자' 역할 찾음: tenantId={}, tenantRoleId={}, roleName={}, attempt={}",
                                    tenantId, tenantRoleId, roleName, attempt);
                            break; // 역할을 찾았으므로 루프 종료
                        }
                    } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                        log.debug("'관리자' 역할 없음: tenantId={}, attempt={}", tenantId, attempt);
                    }
                }

                // 5. name_en이 "Admin"인 역할 찾기
                if (tenantRoleId == null) {
                    try {
                        String sql =
                                "SELECT tenant_role_id, name_ko FROM tenant_roles WHERE tenant_id = ? AND name_en = 'Admin' AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1";
                        java.util.Map<String, Object> result =
                                jdbcTemplate.queryForMap(sql, tenantId);
                        if (result != null && result.get("tenant_role_id") != null) {
                            tenantRoleId = (String) result.get("tenant_role_id");
                            roleName = (String) result.get("name_ko");
                            log.info("✅ JDBC로 'Admin' 역할 찾음: tenantId={}, tenantRoleId={}, roleName={}, attempt={}",
                                    tenantId, tenantRoleId, roleName, attempt);
                            break; // 역할을 찾았으므로 루프 종료
                        }
                    } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                        log.debug("'Admin' 역할 없음: tenantId={}, attempt={}", tenantId, attempt);
                    }
                }

                // 역할을 찾았으면 루프 종료
                if (tenantRoleId != null) {
                    break;
                }

                // 마지막 시도가 아니면 대기 후 재시도 (트랜잭션 커밋 대기)
                if (attempt < maxRetries) {
                    try {
                        long delay = Math.min(2500L, baseRetryDelayMs * attempt);
                        Thread.sleep(delay);
                        log.debug("역할을 찾지 못함, 재시도 대기: tenantId={}, attempt={}/{}, delay={}ms",
                                tenantId, attempt, maxRetries, delay);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        log.warn("재시도 대기 중 인터럽트: tenantId={}", tenantId);
                        break;
                    }
                }
            }

            if (tenantRoleId == null) {
                log.warn("⚠️ 관리자 역할을 찾을 수 없습니다 ({}회 시도 후): tenantId={}", maxRetries, tenantId);
                return;
            }

            log.info("✅ 관리자 역할 찾음: tenantId={}, tenantRoleId={}, roleName={}", tenantId,
                    tenantRoleId, roleName);

            // DASHBOARD_ERP 권한 그룹 할당
            try {
                permissionGroupService.grantPermissionGroup(tenantId, tenantRoleId, "DASHBOARD_ERP",
                        "FULL");
                log.info("✅ 관리자에게 DASHBOARD_ERP 권한 그룹 할당 완료: tenantId={}, tenantRoleId={}",
                        tenantId, tenantRoleId);
            } catch (Exception e) {
                log.warn("⚠️ DASHBOARD_ERP 권한 그룹 할당 실패 (건너뜀): tenantId={}, error={}", tenantId,
                        e.getMessage());
            }

        } catch (Exception e) {
            log.error("❌ 관리자 권한 그룹 할당 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
            // 실패해도 계속 진행 (온보딩 프로세스 중단 방지)
        }
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingService.SubdomainCheckResult checkSubdomainDuplicate(String subdomain) {
        return checkSubdomainDuplicate(subdomain, null);
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingService.SubdomainCheckResult checkSubdomainDuplicate(String subdomain,
            Long excludeRequestId) {
        log.info("서브도메인 중복 확인: subdomain={}, excludeRequestId={}", subdomain, excludeRequestId);

        // 1. 유효성 검증
        if (subdomain == null || subdomain.trim().isEmpty()) {
            log.warn("서브도메인이 비어있음: subdomain={}", subdomain);
            return new OnboardingService.SubdomainCheckResult(false, false, "서브도메인을 입력해주세요.",
                    false);
        }

        String normalizedSubdomain = subdomain.trim().toLowerCase();

        // 2. DNS 제약 조건 검증 (최대 63자, 영문/숫자/하이픈만 허용)
        if (normalizedSubdomain.length() > 63) {
            log.warn("서브도메인 길이 초과: subdomain={}, length={}", normalizedSubdomain,
                    normalizedSubdomain.length());
            return new OnboardingService.SubdomainCheckResult(false, false,
                    "서브도메인은 최대 63자까지 입력 가능합니다.", false);
        }

        if (!normalizedSubdomain.matches("^[a-z0-9-]+$")) {
            log.warn("서브도메인 형식 오류: subdomain={}", normalizedSubdomain);
            return new OnboardingService.SubdomainCheckResult(false, false,
                    "서브도메인은 영문, 숫자, 하이픈(-)만 사용 가능합니다.", false);
        }

        if (normalizedSubdomain.startsWith("-") || normalizedSubdomain.endsWith("-")) {
            log.warn("서브도메인은 하이픈으로 시작하거나 끝날 수 없음: subdomain={}", normalizedSubdomain);
            return new OnboardingService.SubdomainCheckResult(false, false,
                    "서브도메인은 하이픈(-)으로 시작하거나 끝날 수 없습니다.", false);
        }

        // 3. 기본 서브도메인 제외 (dev, app, api, staging, www 등)
        String[] reservedSubdomains =
                {"dev", "app", "api", "staging", "www", "admin", "ops", "apply"};
        for (String reserved : reservedSubdomains) {
            if (normalizedSubdomain.equals(reserved)) {
                log.warn("예약된 서브도메인 사용 시도: subdomain={}", normalizedSubdomain);
                return new OnboardingService.SubdomainCheckResult(false, false,
                        "이 서브도메인은 시스템에서 사용 중입니다. 다른 서브도메인을 선택해주세요.", false);
            }
        }

        // 4. 테넌트 테이블에서 중복 확인
        boolean existsInTenants = tenantRepository.existsBySubdomain(normalizedSubdomain);
        if (existsInTenants) {
            log.warn("서브도메인 중복 (테넌트): subdomain={}", normalizedSubdomain);
            return new OnboardingService.SubdomainCheckResult(true, false,
                    "이미 사용 중인 서브도메인입니다. 다른 서브도메인을 선택해주세요.", true);
        }

        // 5. 온보딩 요청 테이블에서 중복 확인 (PENDING, IN_REVIEW, ON_HOLD 상태만)
        // excludeRequestId가 있으면 해당 요청 제외
        boolean existsInOnboarding;
        if (excludeRequestId != null) {
            existsInOnboarding = repository.existsBySubdomainAndPendingStatusExcludingId(
                    normalizedSubdomain, excludeRequestId);
        } else {
            existsInOnboarding = repository.existsBySubdomainAndPendingStatus(normalizedSubdomain);
        }
        if (existsInOnboarding) {
            log.warn("서브도메인 중복 (온보딩 요청): subdomain={}, excludeRequestId={}", normalizedSubdomain,
                    excludeRequestId);
            return new OnboardingService.SubdomainCheckResult(true, false,
                    "이미 신청 중인 서브도메인입니다. 다른 서브도메인을 선택해주세요.", true);
        }

        log.info("서브도메인 사용 가능: subdomain={}, excludeRequestId={}", normalizedSubdomain,
                excludeRequestId);
        return new OnboardingService.SubdomainCheckResult(false, true, "사용 가능한 서브도메인입니다.", true);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public OnboardingRequest retryInitializationTask(Long requestId, String taskType,
            String actorId) {
        log.info("초기화 작업 재실행: requestId={}, taskType={}, actorId={}", requestId, taskType, actorId);

        // 별도 트랜잭션에서 요청 조회
        OnboardingRequest request = repository.findActiveById(requestId).orElse(null);
        if (request == null) {
            String errorMsg = OnboardingConstants
                    .formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, requestId);
            log.error("온보딩 요청을 찾을 수 없음: requestId={}, error={}", requestId, errorMsg);
            // 예외를 throw하지 않고 null 반환 (상위에서 처리)
            return null;
        }

        if (request.getTenantId() == null || request.getTenantId().trim().isEmpty()) {
            log.error("테넌트 ID가 없어 초기화 작업을 재실행할 수 없음: requestId={}", requestId);
            // 예외를 throw하지 않고 현재 요청 반환
            return request;
        }

        String tenantId = request.getTenantId();
        OnboardingServiceImpl self = applicationContext.getBean(OnboardingServiceImpl.class);

        // 초기화 작업 상태 맵 읽기
        Map<String, Object> statusMap = new java.util.HashMap<>();
        if (request.getInitializationStatusJson() != null
                && !request.getInitializationStatusJson().trim().isEmpty()) {
            try {
                statusMap = objectMapper.readValue(request.getInitializationStatusJson(),
                        new TypeReference<Map<String, Object>>() {});

                // 재실행 중인지 확인 (무한 루프 방지)
                @SuppressWarnings("unchecked")
                Map<String, Object> taskStatus = (Map<String, Object>) statusMap.get(taskType);
                if (taskStatus != null && "RUNNING".equals(taskStatus.get("status"))) {
                    log.warn("이미 재실행 중인 작업입니다: requestId={}, taskType={}", requestId, taskType);
                    return request; // 이미 실행 중이면 현재 상태 반환
                }
            } catch (JsonProcessingException e) {
                log.warn("초기화 작업 상태 JSON 파싱 실패, 새로 생성: requestId={}, error={}", requestId,
                        e.getMessage());
            }
        }

        // 작업 타입별 재실행
        boolean success = false;
        String errorMsg = null;

        // 잘못된 작업 타입 검증
        if (!taskType.equals("commonCodes") && !taskType.equals("roleCodes")
                && !taskType.equals("permissionGroups")) {
            errorMsg = "지원하지 않는 작업 타입입니다. 가능한 값: commonCodes, roleCodes, permissionGroups";
            statusMap.put(taskType, createInitializationStatus("FAILED", errorMsg));
            log.error("초기화 작업 재실행 실패: requestId={}, taskType={}, error={}", requestId, taskType,
                    errorMsg);

            // 상태 저장 후 현재 요청 반환 (예외 throw하지 않음)
            try {
                String statusJson = objectMapper.writeValueAsString(statusMap);
                self.saveInitializationStatusInNewTransaction(requestId, tenantId, statusJson);
            } catch (Exception e) {
                log.error("초기화 작업 상태 저장 실패: requestId={}, error={}", requestId, e.getMessage(), e);
            }

            // 예외를 throw하지 않고 현재 요청 반환
            return request;
        }

        // 재실행 시작 상태로 설정
        statusMap.put(taskType, createInitializationStatus("RUNNING", null));
        try {
            String statusJson = objectMapper.writeValueAsString(statusMap);
            self.saveInitializationStatusInNewTransaction(requestId, tenantId, statusJson);
        } catch (Exception e) {
            log.warn("재실행 시작 상태 저장 실패 (계속 진행): requestId={}, error={}", requestId, e.getMessage());
        }

        try {
            switch (taskType) {
                case "commonCodes":
                    try {
                        self.insertDefaultTenantCommonCodesInNewTransaction(tenantId, actorId);
                        statusMap.put("commonCodes", createInitializationStatus("SUCCESS", null));
                        success = true;
                        log.info("✅ 공통코드 삽입 재실행 성공: tenantId={}", tenantId);
                    } catch (Exception e) {
                        String taskErrorMsg = e.getMessage() != null ? e.getMessage() : "알 수 없는 오류";
                        statusMap.put("commonCodes",
                                createInitializationStatus("FAILED", taskErrorMsg));
                        errorMsg = taskErrorMsg;
                        log.error("공통코드 삽입 재실행 실패: tenantId={}, error={}", tenantId, taskErrorMsg,
                                e);
                    }
                    break;
                case "roleCodes":
                    try {
                        self.insertTenantRoleCodesInNewTransaction(tenantId,
                                request.getBusinessType(), actorId);
                        statusMap.put("roleCodes", createInitializationStatus("SUCCESS", null));
                        success = true;
                        log.info("✅ 역할 코드 생성 재실행 성공: tenantId={}", tenantId);
                    } catch (Exception e) {
                        String taskErrorMsg = e.getMessage() != null ? e.getMessage() : "알 수 없는 오류";
                        statusMap.put("roleCodes",
                                createInitializationStatus("FAILED", taskErrorMsg));
                        errorMsg = taskErrorMsg;
                        log.error("역할 코드 생성 재실행 실패: tenantId={}, error={}", tenantId, taskErrorMsg,
                                e);
                    }
                    break;
                case "permissionGroups":
                    // 권한 그룹 할당은 별도 트랜잭션에서 실행되므로 예외가 발생해도 상위 트랜잭션에 영향 없음
                    // 하지만 안전을 위해 try-catch로 감싸서 상태만 업데이트
                    try {
                        self.assignDefaultPermissionGroupsToAdminInNewTransaction(tenantId,
                                actorId);
                        // assignDefaultPermissionGroupsToAdminInNewTransaction는 내부에서 예외를 catch하므로
                        // 여기까지 도달했다는 것은 성공을 의미함
                        statusMap.put("permissionGroups",
                                createInitializationStatus("SUCCESS", null));
                        success = true;
                        log.info("✅ 권한 그룹 할당 재실행 성공: tenantId={}", tenantId);
                    } catch (Exception e) {
                        // assignDefaultPermissionGroupsToAdminInNewTransaction는 예외를 throw하지 않으므로
                        // 여기서 예외가 발생한다면 예상치 못한 상황
                        String taskErrorMsg = e.getMessage() != null ? e.getMessage() : "알 수 없는 오류";
                        statusMap.put("permissionGroups",
                                createInitializationStatus("FAILED", taskErrorMsg));
                        errorMsg = taskErrorMsg;
                        log.error("권한 그룹 할당 재실행 실패 (예상치 못한 오류): tenantId={}, error={}", tenantId,
                                taskErrorMsg, e);
                    }
                    break;
            }
        } catch (Exception e) {
            // switch 문 자체에서 발생하는 예외 (거의 없음)
            errorMsg = e.getMessage() != null ? e.getMessage() : "알 수 없는 오류";
            statusMap.put(taskType, createInitializationStatus("FAILED", errorMsg));
            log.error("초기화 작업 재실행 실패 (예상치 못한 오류): requestId={}, taskType={}, error={}", requestId,
                    taskType, errorMsg, e);
        }

        // 상태 저장 (성공/실패 여부와 관계없이 저장) - 별도 트랜잭션으로 처리
        try {
            String statusJson = objectMapper.writeValueAsString(statusMap);
            // 상태 저장을 별도 트랜잭션으로 처리하여 롤백 방지
            self.saveInitializationStatusInNewTransaction(requestId, tenantId, statusJson);
            log.info("✅ 초기화 작업 상태 업데이트 완료: requestId={}, taskType={}, success={}", requestId,
                    taskType, success);
        } catch (Exception e) {
            log.error("초기화 작업 상태 저장 실패: requestId={}, error={}", requestId, e.getMessage(), e);
            // 상태 저장 실패는 치명적이지만, 예외를 throw하지 않고 계속 진행
        }

        // 최신 상태로 다시 조회하여 반환
        OnboardingRequest updatedRequest =
                repository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, requestId).orElse(request);

        // 작업이 실패한 경우에도 성공 응답 반환 (상태는 이미 저장됨)
        // 프론트엔드에서 상태를 확인하여 실패 여부를 판단할 수 있음
        if (!success && errorMsg != null) {
            log.warn("초기화 작업 재실행 실패 (상태는 저장됨): requestId={}, taskType={}, error={}", requestId,
                    taskType, errorMsg);
        }

        return updatedRequest;
    }

    /**
     * 별도 트랜잭션에서 초기화 작업 상태 저장 롤백 방지를 위해 별도 트랜잭션으로 처리
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = Exception.class)
    public void saveInitializationStatusInNewTransaction(Long requestId, String tenantId,
            String statusJson) {
        try {
            OnboardingRequest request =
                    repository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, requestId).orElse(null);
            if (request == null) {
                log.debug("온보딩 상태 저장: tenant+id 조회 실패, id 단독 재조회 requestId={}, tenantId={}",
                        requestId, tenantId);
                request = repository.findActiveById(requestId).orElse(null);
                if (request != null && tenantId != null && !tenantId.isBlank()
                        && request.getTenantId() != null && !request.getTenantId().isBlank()
                        && !tenantId.equals(request.getTenantId())) {
                    log.warn(
                            "온보딩 요청 tenant_id 불일치(상태 저장 계속): requestId={}, argTenantId={}, rowTenantId={}",
                            requestId, tenantId, request.getTenantId());
                }
            }
            if (request != null) {
                request.setInitializationStatusJson(statusJson);
                repository.save(request);
                log.info("✅ 초기화 작업 상태 저장 완료: requestId={}", requestId);
            } else {
                log.warn("온보딩 요청을 찾을 수 없어 상태 저장 실패: requestId={}", requestId);
            }
        } catch (Exception e) {
            log.error("초기화 작업 상태 저장 실패: requestId={}, error={}", requestId, e.getMessage(), e);
            // 예외를 throw하지 않음 (noRollbackFor로 설정되어 있어도 예외를 throw하면 롤백될 수 있음)
        }
    }

    /**
     * 처리 단계별 상태를 업데이트하는 헬퍼 메서드
     * 별도 트랜잭션으로 분리하여 메인 트랜잭션의 version 충돌 방지
     *
     * @param requestId 온보딩 요청 ID
     * @param step 처리 단계 (PROCEDURE_START, TENANT_CREATE, ROLE_APPLY, ADMIN_CREATE,
     *        DASHBOARD_CREATE, COMPLETE)
     * @param status 단계 상태 (PENDING, IN_PROGRESS, SUCCESS, FAILED)
     * @param message 상태 메시지
     */
    private void updateProcessingStatus(Long requestId, String step, String status,
            String message) {
        try {
            // 별도 트랜잭션에서 실행하여 메인 트랜잭션의 version 충돌 방지
            org.springframework.transaction.support.TransactionTemplate transactionTemplate =
                    new org.springframework.transaction.support.TransactionTemplate(
                            transactionManager);
            transactionTemplate.setPropagationBehavior(
                    org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            transactionTemplate.setIsolationLevel(
                    org.springframework.transaction.TransactionDefinition.ISOLATION_READ_COMMITTED);
            transactionTemplate.setTimeout(120); // 장시간 배치/락 대기 대비 (온보딩 상태 JSON)

            transactionTemplate.executeWithoutResult(transactionStatus -> {
                try {
                    // 엔티티를 다시 조회하여 최신 버전 사용
                    OnboardingRequest request = repository.findActiveById(requestId).orElse(null);
                    if (request == null) {
                        log.warn("온보딩 요청을 찾을 수 없어 상태 업데이트 실패: requestId={}", requestId);
                        return;
                    }

                    Map<String, Object> statusMap = new java.util.HashMap<>();
                    String existingJson = request.getInitializationStatusJson();
                    if (existingJson != null && !existingJson.trim().isEmpty()) {
                        try {
                            statusMap = objectMapper.readValue(existingJson,
                                    new TypeReference<Map<String, Object>>() {});
                        } catch (JsonProcessingException e) {
                            log.warn("기존 상태 JSON 파싱 실패, 새로 생성: requestId={}, error={}", requestId,
                                    e.getMessage());
                        }
                    }

                    // 단계별 상태 업데이트
                    Map<String, Object> stepStatus = new java.util.HashMap<>();
                    stepStatus.put("status", status);
                    stepStatus.put("message", message != null ? message : "");
                    stepStatus.put("updatedAt", java.time.LocalDateTime.now().toString());
                    statusMap.put(step, stepStatus);

                    // 전체 진행률 계산
                    int totalSteps = 5; // PROCEDURE_START, TENANT_CREATE, ROLE_APPLY, ADMIN_CREATE,
                                        // DASHBOARD_CREATE
                    int completedSteps = 0;
                    String[] steps = {"PROCEDURE_START", "TENANT_CREATE", "ROLE_APPLY", "ADMIN_CREATE",
                            "DASHBOARD_CREATE"};
                    for (String s : steps) {
                        if (statusMap.containsKey(s)) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> stepData = (Map<String, Object>) statusMap.get(s);
                            if (stepData != null && "SUCCESS".equals(stepData.get("status"))) {
                                completedSteps++;
                            }
                        }
                    }
                    int progress = (int) ((completedSteps / (double) totalSteps) * 100);
                    statusMap.put("progress", progress);
                    statusMap.put("lastUpdated", java.time.LocalDateTime.now().toString());

                    String statusJson = objectMapper.writeValueAsString(statusMap);
                    request.setInitializationStatusJson(statusJson);
                    repository.save(request);

                    log.debug("처리 상태 업데이트: requestId={}, step={}, status={}, progress={}%", requestId,
                            step, status, progress);
                } catch (Exception e) {
                    log.error("처리 상태 업데이트 실패: requestId={}, step={}, error={}", requestId, step,
                            e.getMessage(), e);
                    // 예외를 throw하지 않음 (상태 업데이트 실패가 전체 프로세스를 중단시키면 안 됨)
                }
            });
        } catch (Exception e) {
            log.error("처리 상태 업데이트 트랜잭션 실패: requestId={}, step={}, error={}", requestId, step,
                    e.getMessage(), e);
            // 예외를 throw하지 않음 (상태 업데이트 실패가 전체 프로세스를 중단시키면 안 됨)
        }
    }

    /**
     * 온보딩 승인 완료 이메일 발송
     */
    private void sendOnboardingApprovalEmail(OnboardingRequest request, String tenantId) {
        try {
            String contactEmail = request.getRequestedBy(); // requestedBy가 이메일 주소
            log.info("온보딩 승인 완료 이메일 발송 시작: requestId={}, tenantId={}, contactEmail={}",
                    request.getId(), tenantId, contactEmail);

            if (contactEmail == null || contactEmail.trim().isEmpty()) {
                log.warn("연락처 이메일이 없어 이메일 발송을 건너뜁니다: requestId={}", request.getId());
                return;
            }

            // 테넌트 정보 조회
            Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId).orElse(null);
            String tenantName = tenant != null ? tenant.getName() : request.getTenantName();

            // EmailUtil을 사용하여 이메일 발송
            com.coresolution.core.util.EmailUtil.sendOnboardingApprovalEmail(emailService,
                    contactEmail, tenantName, tenantId, request.getBusinessType());

        } catch (Exception e) {
            log.error("온보딩 승인 완료 이메일 발송 중 오류: requestId={}, error={}", request.getId(),
                    e.getMessage(), e);
        }
    }
}

