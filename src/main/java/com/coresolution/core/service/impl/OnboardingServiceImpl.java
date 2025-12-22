package com.coresolution.core.service.impl;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.context.TenantContextHolder;
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
import com.coresolution.core.service.TenantDashboardService;
import com.coresolution.core.service.TenantIdGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
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
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final CommonCodeService commonCodeService;
    private final CommonCodeRepository commonCodeRepository;
    private final OnboardingPreValidationService preValidationService;
    private final OnboardingErrorHandlingService errorHandlingService;
    private final com.coresolution.core.service.PermissionGroupService permissionGroupService;
    private final com.coresolution.core.repository.TenantRoleRepository tenantRoleRepository;
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
    public OnboardingRequest getById(java.util.UUID id) {
        log.debug("온보딩 요청 조회: id={}", id);
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException(
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
    public OnboardingRequest update(java.util.UUID requestId, String tenantName, String subdomain,
            String brandName, String regionCode, String businessType) {

        log.info(
                "온보딩 요청 수정: requestId={}, tenantName={}, subdomain={}, brandName={}, regionCode={}, businessType={}",
                requestId, tenantName, subdomain, brandName, regionCode, businessType);

        OnboardingRequest request = repository.findById(requestId)
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
    public OnboardingRequest decideInNewTransaction(java.util.UUID requestId,
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
    private OnboardingRequest decideInternal(java.util.UUID requestId, OnboardingStatus status,
            String actorId, String note) {

        log.info("온보딩 요청 결정 (내부): requestId={}, status={}, actorId={}", requestId, status, actorId);

        OnboardingRequest request = repository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException(OnboardingConstants
                        .formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, requestId)));

        // 이미 승인된 요청을 다시 승인하려는 경우 검증
        if (status == OnboardingStatus.APPROVED
                && request.getStatus() == OnboardingStatus.APPROVED) {
            log.warn("이미 승인된 온보딩 요청을 다시 승인 시도: requestId={}, tenantId={}, 현재 상태={}", requestId,
                    request.getTenantId(), request.getStatus());

            // 테넌트가 이미 생성되어 있는지 확인
            if (request.getTenantId() != null && !request.getTenantId().trim().isEmpty()) {
                boolean tenantExists = tenantRepository
                        .findByTenantIdAndIsDeletedFalse(request.getTenantId()).isPresent();
                if (tenantExists) {
                    log.info(
                            "이미 승인된 요청이며 테넌트가 존재함. 상태만 업데이트하고 프로시저는 건너뜀: requestId={}, tenantId={}",
                            requestId, request.getTenantId());

                    // 상태 정보만 업데이트 (프로시저는 실행하지 않음)
                    request.setStatus(status);
                    request.setDecidedBy(actorId);
                    request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
                    String updatedNote = (note != null && !note.trim().isEmpty()) ? note
                            : "이미 승인된 요청 재처리 (테넌트 이미 존재)";
                    request.setDecisionNote(updatedNote);

                    return repository.save(request);
                }
            }

            // 테넌트가 없으면 프로시저 실행 (이전 승인 실패했을 수 있음)
            log.info("이미 승인된 요청이지만 테넌트가 없음. 프로시저 재실행: requestId={}, tenantId={}", requestId,
                    request.getTenantId());
        }

        request.setStatus(status);
        request.setDecidedBy(actorId);
        request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
        request.setDecisionNote(note);

        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
                }

                request.setTenantId(tenantIdValue);
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

            if (request.getChecklistJson() != null && !request.getChecklistJson().isEmpty()) {
                try {
                    Map<String, Object> checklist =
                            objectMapper.readValue(request.getChecklistJson(),
                                    new TypeReference<Map<String, Object>>() {});

                    String adminPassword = (String) checklist.get("adminPassword");
                    if (adminPassword != null && !adminPassword.trim().isEmpty()) {
                        adminPasswordHash = passwordEncoder.encode(adminPassword);
                        log.info("관리자 비밀번호 해시 완료: requestId={}", requestId);
                    } else {
                        log.warn("checklistJson에 adminPassword가 없음: requestId={}", requestId);
                    }

                    // 서브도메인이 없으면 checklistJson에서 추출 시도
                    if (subdomain == null || subdomain.trim().isEmpty()) {
                        String checklistSubdomain = (String) checklist.get("subdomain");
                        if (checklistSubdomain != null && !checklistSubdomain.trim().isEmpty()) {
                            subdomain = checklistSubdomain.trim().toLowerCase();
                            log.info("checklistJson에서 서브도메인 추출: requestId={}, subdomain={}",
                                    requestId, subdomain);
                        }
                    }

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

                    @SuppressWarnings("unchecked")
                    Map<String, java.util.List<String>> widgets =
                            (Map<String, java.util.List<String>>) checklist.get("dashboardWidgets");
                    if (widgets != null && !widgets.isEmpty()) {
                        log.info("대시보드 위젯 편집 정보 발견: requestId={}, widgets={}", requestId, widgets);
                    } else {
                        log.debug(
                                "checklistJson에 dashboardWidgets가 없음 (템플릿 기본 위젯 사용): requestId={}",
                                requestId);
                    }
                } catch (JsonProcessingException e) {
                    log.warn(
                            "checklistJson 파싱 실패 (관리자 계정 생성 및 대시보드 템플릿 스킵): requestId={}, error={}",
                            requestId, e.getMessage());
                } catch (ClassCastException e) {
                    log.warn("dashboardTemplates 형식이 올바르지 않음: requestId={}, error={}", requestId,
                            e.getMessage());
                }
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

            OnboardingErrorHandlingService.ExecutionResult executionResult =
                    errorHandlingService.executeWithRetry(() -> {
                        Map<String, Object> result = approvalService.processOnboardingApproval(
                                requestId, tenantId, request.getTenantName(), businessType, actorId,
                                note, finalContactEmail, finalAdminPasswordHash, finalSubdomain);
                        Boolean success = (Boolean) result.get("success");
                        return success != null && success;
                    }, 5, // 최대 5회 재시도
                            2000 // 2초 지연
                    );

            Map<String, Object> approvalResult;
            Boolean success;
            String message;

            if (executionResult.isSuccess()) {
                approvalResult = approvalService.processOnboardingApproval(requestId, tenantId,
                        request.getTenantName(), businessType, actorId, note, finalContactEmail,
                        finalAdminPasswordHash, finalSubdomain);
                success = (Boolean) approvalResult.get("success");
                message = (String) approvalResult.get("message");
            } else {
                success = false;
                message = executionResult.getErrorMessage();
                approvalResult = new java.util.HashMap<>();
                approvalResult.put("success", false);
                approvalResult.put("message", message);
                log.error("온보딩 승인 프로세스 재시도 실패: requestId={}, attempts={}, error={}", requestId,
                        executionResult.getAttemptCount(), message);
            }

            if (success != null && success) {
                // 대시보드 생성 (필수) - 실패 시 전체 롤백
                OnboardingErrorHandlingService.ExecutionResult dashboardResult =
                        errorHandlingService.executeWithRetry(() -> {
                            // 테넌트 컨텍스트 설정 (대시보드 생성 시 필요)
                            String previousTenantId = TenantContextHolder.getTenantId();
                            try {
                                TenantContextHolder.setTenantId(tenantId);
                                log.debug("테넌트 컨텍스트 설정: tenantId={}", tenantId);

                                String dashboardBusinessType =
                                        getDefaultBusinessType(request.getBusinessType());
                                List<com.coresolution.core.dto.TenantDashboardResponse> dashboards =
                                        tenantDashboardService.createDefaultDashboards(tenantId,
                                                dashboardBusinessType, actorId,
                                                finalDashboardTemplates, finalDashboardWidgets);

                                log.info("기본 대시보드 생성 완료: tenantId={}, count={}, templates={}",
                                        tenantId, dashboards.size(), finalDashboardTemplates);
                                return dashboards != null && !dashboards.isEmpty();
                            } finally {
                                // 테넌트 컨텍스트 복원
                                if (previousTenantId != null) {
                                    TenantContextHolder.setTenantId(previousTenantId);
                                } else {
                                    TenantContextHolder.clear();
                                }
                            }
                        }, 10, // 최대 10회 재시도 (트랜잭션 타이밍 문제 대응)
                                500 // 0.5초 지연
                        );

                if (!dashboardResult.isSuccess()) {
                    // 대시보드 생성 실패 시 전체 프로세스 실패 처리 및 롤백
                    String dashboardError =
                            "대시보드 생성 실패: " + (dashboardResult.getErrorMessage() != null
                                    ? dashboardResult.getErrorMessage()
                                    : "알 수 없는 오류");
                    log.error("기본 대시보드 생성 재시도 실패: tenantId={}, attempts={}, error={}", tenantId,
                            dashboardResult.getAttemptCount(), dashboardResult.getErrorMessage());
                    success = false;
                    message = dashboardError;
                    // 예외를 발생시켜 전체 트랜잭션 롤백
                    throw new RuntimeException("온보딩 승인 프로세스 실패: " + dashboardError);
                }
            }

            if (success == null || !success) {
                String errorMessage = (message != null && !message.trim().isEmpty()) ? message
                        : "온보딩 승인 프로세스 중 알 수 없는 오류가 발생했습니다. (상세 오류 정보 없음)";
                log.error("온보딩 승인 프로세스 실패: requestId={}, tenantId={}, message={}", requestId,
                        tenantId, errorMessage);
                log.error("온보딩 승인 프로세스 실패 상세: success={}, message={}, approvalResult={}", success,
                        message, approvalResult);
                request.setStatus(OnboardingStatus.ON_HOLD);
                request.setDecisionNote(note != null ? note + "\n[시스템 오류] " + errorMessage
                        : "[시스템 오류] " + errorMessage);
            } else {
                log.info("온보딩 승인 프로세스 완료: {}", message);

                try {
                    updateSubscriptionTenantId(request);
                } catch (Exception e) {
                    log.warn("구독 tenant_id 업데이트 실패 (계속 진행): {}", e.getMessage());
                }

                try {
                    log.info("🔄 테넌트 초기화 작업 시작: tenantId={}", tenantId);
                    initializeTenantAfterOnboarding(tenantId, request.getBusinessType(), actorId);

                    // 서브도메인은 프로시저에서 처리하므로 여기서는 제거
                    // (CreateOrActivateTenant 프로시저에서 서브도메인을 받아서 저장)

                    // 브랜드명 설정 (branding_json에 저장)
                    try {
                        setTenantBranding(tenantId, request);
                    } catch (Exception e) {
                        log.warn("브랜드명 설정 실패 (온보딩 프로세스는 계속 진행): tenantId={}, error={}", tenantId,
                                e.getMessage());
                    }
                } catch (Exception e) {
                    log.error("온보딩 후 테넌트 초기화 실패 (온보딩 프로세스는 계속 진행): tenantId={}, error={}", tenantId,
                            e.getMessage(), e);
                }
            }
        }

        OnboardingRequest saved = repository.save(request);

        log.info("온보딩 요청 결정 완료: id={}, status={}", saved.getId(), saved.getStatus());
        return saved;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public OnboardingRequest decide(java.util.UUID requestId, OnboardingStatus status,
            String actorId, String note) {
        return decideInternal(requestId, status, actorId, note);
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
    public OnboardingRequest retryApproval(java.util.UUID requestId, String actorId, String note) {
        log.info("온보딩 승인 프로세스 재시도: requestId={}, actorId={}", requestId, actorId);

        OnboardingRequest request = repository.findById(requestId)
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
    public OnboardingRequest findByIdAndEmail(java.util.UUID id, String email) {
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
            String region = (String) checklist.get("region");
            if (region != null && !region.trim().isEmpty()) {
                return region.trim();
            }

            String address = (String) checklist.get("address");
            String postalCode = (String) checklist.get("postalCode");

            if (address != null && !address.trim().isEmpty()) {
                return extractRegionFromAddress(address);
            }

            if (postalCode != null && !postalCode.trim().isEmpty()) {
                return extractRegionFromPostalCode(postalCode);
            }

            return null;

        } catch (Exception e) {
            log.warn("지역 코드 추출 실패: requestId={}, error={}", request.getId(), e.getMessage());
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

        if (normalizedAddress.contains("서울") || normalizedAddress.contains("seoul")) {
            return "seoul";
        } else if (normalizedAddress.contains("부산") || normalizedAddress.contains("busan")) {
            return "busan";
        } else if (normalizedAddress.contains("인천") || normalizedAddress.contains("incheon")) {
            return "incheon";
        } else if (normalizedAddress.contains("대구") || normalizedAddress.contains("daegu")) {
            return "daegu";
        } else if (normalizedAddress.contains("대전") || normalizedAddress.contains("daejeon")) {
            return "daejeon";
        } else if (normalizedAddress.contains("광주") || normalizedAddress.contains("gwangju")) {
            return "gwangju";
        } else if (normalizedAddress.contains("울산") || normalizedAddress.contains("ulsan")) {
            return "ulsan";
        } else if (normalizedAddress.contains("세종") || normalizedAddress.contains("sejong")) {
            return "sejong";
        } else if (normalizedAddress.contains("경기") || normalizedAddress.contains("gyeonggi")) {
            return "gyeonggi";
        } else if (normalizedAddress.contains("강원") || normalizedAddress.contains("gangwon")) {
            return "gangwon";
        } else if (normalizedAddress.contains("충북") || normalizedAddress.contains("chungbuk")) {
            return "chungbuk";
        } else if (normalizedAddress.contains("충남") || normalizedAddress.contains("chungnam")) {
            return "chungnam";
        } else if (normalizedAddress.contains("전북") || normalizedAddress.contains("jeonbuk")) {
            return "jeonbuk";
        } else if (normalizedAddress.contains("전남") || normalizedAddress.contains("jeonnam")) {
            return "jeonnam";
        } else if (normalizedAddress.contains("경북") || normalizedAddress.contains("gyeongbuk")) {
            return "gyeongbuk";
        } else if (normalizedAddress.contains("경남") || normalizedAddress.contains("gyeongnam")) {
            return "gyeongnam";
        } else if (normalizedAddress.contains("제주") || normalizedAddress.contains("jeju")) {
            return "jeju";
        }

        else if (normalizedAddress.contains("tokyo") || normalizedAddress.contains("도쿄")) {
            return "tokyo";
        } else if (normalizedAddress.contains("osaka") || normalizedAddress.contains("오사카")) {
            return "osaka";
        } else if (normalizedAddress.contains("new york") || normalizedAddress.contains("뉴욕")) {
            return "newyork";
        } else if (normalizedAddress.contains("los angeles") || normalizedAddress.contains("la")
                || normalizedAddress.contains("로스앤젤레스")) {
            return "losangeles";
        } else if (normalizedAddress.contains("london") || normalizedAddress.contains("런던")) {
            return "london";
        } else if (normalizedAddress.contains("paris") || normalizedAddress.contains("파리")) {
            return "paris";
        } else if (normalizedAddress.contains("singapore") || normalizedAddress.contains("싱가포르")) {
            return "singapore";
        } else if (normalizedAddress.contains("hong kong") || normalizedAddress.contains("홍콩")) {
            return "hongkong";
        } else if (normalizedAddress.contains("beijing") || normalizedAddress.contains("베이징")
                || normalizedAddress.contains("북경")) {
            return "beijing";
        } else if (normalizedAddress.contains("shanghai") || normalizedAddress.contains("상하이")) {
            return "shanghai";
        } else if (normalizedAddress.contains("sydney") || normalizedAddress.contains("시드니")) {
            return "sydney";
        } else if (normalizedAddress.contains("melbourne") || normalizedAddress.contains("멜버른")) {
            return "melbourne";
        }

        else if (normalizedAddress.contains("japan") || normalizedAddress.contains("일본")) {
            return "japan";
        } else if (normalizedAddress.contains("usa") || normalizedAddress.contains("united states")
                || normalizedAddress.contains("미국")) {
            return "usa";
        } else if (normalizedAddress.contains("uk") || normalizedAddress.contains("united kingdom")
                || normalizedAddress.contains("영국")) {
            return "uk";
        } else if (normalizedAddress.contains("france") || normalizedAddress.contains("프랑스")) {
            return "france";
        } else if (normalizedAddress.contains("china") || normalizedAddress.contains("중국")) {
            return "china";
        } else if (normalizedAddress.contains("australia") || normalizedAddress.contains("호주")
                || normalizedAddress.contains("오스트레일리아")) {
            return "australia";
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

        String code = postalCode.trim().replaceAll("[^0-9]", "");
        if (code.length() < 2) {
            return null;
        }

        String prefix = code.substring(0, 2);
        int prefixNum = Integer.parseInt(prefix);

        if (prefixNum >= 1 && prefixNum <= 13) {
            return "seoul";
        } else if (prefixNum >= 48 && prefixNum <= 49) {
            return "busan";
        } else if (prefixNum >= 42 && prefixNum <= 43) {
            return "daegu";
        } else if (prefixNum >= 22 && prefixNum <= 23) {
            return "incheon";
        } else if (prefixNum >= 61 && prefixNum <= 62) {
            return "gwangju";
        } else if (prefixNum >= 30 && prefixNum <= 34) {
            return "daejeon";
        } else if (prefixNum >= 44 && prefixNum <= 45) {
            return "ulsan";
        } else if (prefixNum == 30) {
            return "sejong";
        } else if ((prefixNum >= 10 && prefixNum <= 20) || (prefixNum >= 40 && prefixNum <= 47)) {
            return "gyeonggi";
        } else if (prefixNum >= 24 && prefixNum <= 25) {
            return "gangwon";
        } else if (prefixNum >= 28 && prefixNum <= 29) {
            return "chungbuk";
        } else if (prefixNum >= 31 && prefixNum <= 32) {
            return "chungnam";
        } else if (prefixNum >= 54 && prefixNum <= 56) {
            return "jeonbuk";
        } else if (prefixNum >= 57 && prefixNum <= 59) {
            return "jeonnam";
        } else if (prefixNum >= 36 && prefixNum <= 39) {
            return "gyeongbuk";
        } else if (prefixNum >= 50 && prefixNum <= 53) {
            return "gyeongnam";
        } else if (prefixNum >= 63 && prefixNum <= 64) {
            return "jeju";
        }

        return null;
    }

    /**
     * 온보딩 승인 후 테넌트 초기화 작업 - 역할별 권한 그룹 자동 할당
     *
     * 방어 코드: 모든 단계에서 오류가 발생해도 온보딩 프로세스는 계속 진행되도록 처리
     *
     * @param tenantId 테넌트 ID
     * @param businessType 업종 타입
     * @param actorId 실행자 ID
     */
    private void initializeTenantAfterOnboarding(String tenantId, String businessType,
            String actorId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("⚠️ 테넌트 ID가 없어 초기화 작업을 건너뜁니다.");
            return;
        }

        log.info("🔄 온보딩 후 테넌트 초기화 시작: tenantId={}, businessType={}", tenantId, businessType);

        try {
            insertDefaultTenantCommonCodes(tenantId, actorId);
        } catch (Exception e) {
            log.warn("⚠️ 기본 공통코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertTenantRoleCodes(tenantId, businessType, actorId);
        } catch (Exception e) {
            log.warn("⚠️ 테넌트 역할 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            assignDefaultPermissionGroupsToAdmin(tenantId, actorId);
        } catch (Exception e) {
            log.warn("⚠️ 관리자 권한 그룹 할당 실패 (건너뜀): {}", e.getMessage());
        }

        log.info("✅ 온보딩 후 테넌트 초기화 완료: tenantId={}", tenantId);
    }

    /**
     * 테넌트 브랜딩 정보 설정 (브랜드명 저장)
     *
     * @param tenantId 테넌트 ID
     * @param request 온보딩 요청
     */
    private void setTenantBranding(String tenantId, OnboardingRequest request) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("⚠️ 테넌트 ID가 없어 브랜딩 정보 설정을 건너뜁니다.");
            return;
        }

        try {
            Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId).orElse(null);

            if (tenant == null) {
                log.warn("⚠️ 테넌트를 찾을 수 없어 브랜딩 정보 설정을 건너뜁니다: tenantId={}", tenantId);
                return;
            }

            // checklistJson에서 brandName 추출
            String brandName = null;
            if (request.getChecklistJson() != null && !request.getChecklistJson().isEmpty()) {
                try {
                    Map<String, Object> checklist =
                            objectMapper.readValue(request.getChecklistJson(),
                                    new TypeReference<Map<String, Object>>() {});
                    brandName = (String) checklist.get("brandName");
                } catch (JsonProcessingException e) {
                    log.warn("checklistJson 파싱 실패 (브랜드명 추출 실패): tenantId={}, error={}", tenantId,
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
                    log.warn("기존 branding_json 파싱 실패, 기본값으로 재생성: tenantId={}, error={}", tenantId,
                            e.getMessage());
                    brandingInfo = com.coresolution.core.dto.BrandingInfo.createDefault(brandName);
                }
            } else {
                // branding_json이 없으면 기본값 생성
                brandingInfo = com.coresolution.core.dto.BrandingInfo.createDefault(brandName);
            }

            // JSON으로 변환하여 저장
            try {
                String brandingJson = objectMapper.writeValueAsString(brandingInfo);
                tenant.setBrandingJson(brandingJson);
                tenantRepository.save(tenant);

                log.info("✅ 테넌트 브랜딩 정보 설정 완료: tenantId={}, brandName={}", tenantId, brandName);
            } catch (JsonProcessingException e) {
                log.error("❌ 브랜딩 정보 JSON 변환 실패: tenantId={}, error={}", tenantId, e.getMessage(),
                        e);
                throw new RuntimeException("브랜딩 정보 저장 중 오류가 발생했습니다", e);
            }

        } catch (Exception e) {
            log.error("❌ 테넌트 브랜딩 정보 설정 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 프로시저가 실패한 경우를 대비한 Java 코드에서 직접 삽입
     *
     * @param tenantId 테넌트 ID
     * @param createdBy 생성자 ID
     */
    private void insertDefaultTenantCommonCodes(String tenantId, String createdBy) {
        // 표준화 2025-12-08: 기존 코드가 있어도 누락된 코드는 추가하도록 변경
        // insertCommonCodeIfNotExists가 중복 체크를 하므로 항상 실행
        log.info("🔄 기본 테넌트 공통코드 추가 시작: tenantId={}", tenantId);

        int insertedCount = 0;
        String createdByValue = createdBy != null ? createdBy : "SYSTEM_ONBOARDING";

        try {
            // 표준화 2025-12-08: extraData에 sessions 필드 추가 (20회기)
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_PACKAGE", "INDIVIDUAL", "개인상담",
                    "개인상담", "1:1 개인 심리상담",
                    "{\"price\": 80000, \"sessions\": 20, \"duration\": 50, \"unit\": \"회\"}", 1,
                    createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 상담 패키지 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            // 표준화 2025-12-08: extraData에 sessions 필드 추가 (20회기)
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_PACKAGE", "FAMILY", "가족상담", "가족상담",
                    "가족 단위 상담",
                    "{\"price\": 120000, \"sessions\": 20, \"duration\": 60, \"unit\": \"회\"}", 2,
                    createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 상담 패키지 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            // 표준화 2025-12-08: extraData에 sessions 필드 추가 (20회기)
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_PACKAGE", "GROUP", "집단상담", "집단상담",
                    "그룹 심리상담",
                    "{\"price\": 50000, \"sessions\": 20, \"duration\": 90, \"unit\": \"회\"}", 3,
                    createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 상담 패키지 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        // 표준화 2025-12-08: 단회기 패키지 기본 데이터 추가 (1회기)
        try {
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_PACKAGE", "SINGLE_75000",
                    "단회기 75,000원", "단회기 75,000원", "1회기 상담 패키지",
                    "{\"price\": 75000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}", 4,
                    createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 단회기 패키지 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_PACKAGE", "SINGLE_80000",
                    "단회기 80,000원", "단회기 80,000원", "1회기 상담 패키지",
                    "{\"price\": 80000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}", 5,
                    createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 단회기 패키지 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_PACKAGE", "SINGLE_85000",
                    "단회기 85,000원", "단회기 85,000원", "1회기 상담 패키지",
                    "{\"price\": 85000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}", 6,
                    createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 단회기 패키지 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_PACKAGE", "SINGLE_90000",
                    "단회기 90,000원", "단회기 90,000원", "1회기 상담 패키지",
                    "{\"price\": 90000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}", 7,
                    createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 단회기 패키지 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_PACKAGE", "SINGLE_95000",
                    "단회기 95,000원", "단회기 95,000원", "1회기 상담 패키지",
                    "{\"price\": 95000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}", 8,
                    createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 단회기 패키지 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_PACKAGE", "SINGLE_100000",
                    "단회기 100,000원", "단회기 100,000원", "1회기 상담 패키지",
                    "{\"price\": 100000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}", 9,
                    createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 단회기 패키지 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "PAYMENT_METHOD", "CASH", "현금", "현금", "현금 결제",
                    null, 1, createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 결제 방법 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "PAYMENT_METHOD", "CARD", "카드", "카드", "카드 결제",
                    null, 2, createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 결제 방법 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "PAYMENT_METHOD", "TRANSFER", "계좌이체", "계좌이체",
                    "계좌이체 결제", null, 3, createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 결제 방법 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        // 표준화 2025-12-08: 테넌트 초기화 시 기본 전문분야 코드 생성
        // 더 다양한 전문분야 코드를 초기 데이터로 제공
        String[][] specialtyCodes = {{"DEPRESSION", "우울증", "우울증 상담", "1"},
                {"ANXIETY", "불안장애", "불안장애 상담", "2"}, {"TRAUMA", "트라우마", "트라우마 상담", "3"},
                {"RELATIONSHIP", "인간관계", "인간관계 상담", "4"}, {"FAMILY", "가족상담", "가족 상담", "5"},
                {"COUPLE", "부부상담", "부부 상담", "6"}, {"CHILD", "아동상담", "아동 상담", "7"},
                {"ADOLESCENT", "청소년상담", "청소년 상담", "8"}, {"ADULT", "성인상담", "성인 상담", "9"},
                {"STRESS", "스트레스", "스트레스 관리 상담", "10"}, {"CAREER", "진로상담", "진로 상담", "11"}};

        for (String[] specialty : specialtyCodes) {
            try {
                insertCommonCodeIfNotExists(tenantId, "SPECIALTY", specialty[0], specialty[1],
                        specialty[1], specialty[2], null, Integer.parseInt(specialty[3]),
                        createdByValue);
                insertedCount++;
            } catch (Exception e) {
                log.warn("⚠️ 전문 분야 코드 삽입 실패 (건너뜀): {} - {}", specialty[0], e.getMessage());
            }
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_TYPE", "FACE_TO_FACE", "대면상담",
                    "대면상담", "대면 상담", null, 1, createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 상담 유형 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_TYPE", "ONLINE", "비대면상담", "비대면상담",
                    "비대면 상담", null, 2, createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 상담 유형 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "CONSULTATION_TYPE", "PHONE", "전화상담", "전화상담",
                    "전화 상담", null, 3, createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 상담 유형 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        // 표준화 2025-12-08: 담당 업무 코드 추가
        try {
            insertCommonCodeIfNotExists(tenantId, "RESPONSIBILITY", "COUNSELING", "상담", "상담",
                    "상담 업무", null, 1, createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 담당 업무 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        try {
            insertCommonCodeIfNotExists(tenantId, "RESPONSIBILITY", "ADMINISTRATION", "행정", "행정",
                    "행정 업무", null, 2, createdByValue);
            insertedCount++;
        } catch (Exception e) {
            log.warn("⚠️ 담당 업무 코드 삽입 실패 (건너뜀): {}", e.getMessage());
        }

        log.info("✅ 기본 테넌트 공통코드 추가 완료: tenantId={}, insertedCount={}", tenantId, insertedCount);
    }

    /**
     * 테넌트 기본 공통코드 추가 (공개 메서드) 기존 테넌트에도 기본 코드를 추가할 수 있도록 제공
     *
     * @param tenantId 테넌트 ID
     * @param createdBy 생성자 ID
     * @return 추가된 코드 개수
     */
    public int addDefaultTenantCommonCodes(String tenantId, String createdBy) {
        log.info("🔄 테넌트 기본 공통코드 추가 요청: tenantId={}", tenantId);
        int beforeCount = 0;
        try {
            List<CommonCode> existingCodes = commonCodeRepository.findByTenantId(tenantId);
            beforeCount = existingCodes != null ? existingCodes.size() : 0;
        } catch (Exception e) {
            log.warn("기존 코드 개수 확인 실패 (계속 진행): {}", e.getMessage());
        }

        insertDefaultTenantCommonCodes(tenantId, createdBy);

        int afterCount = 0;
        try {
            List<CommonCode> updatedCodes = commonCodeRepository.findByTenantId(tenantId);
            afterCount = updatedCodes != null ? updatedCodes.size() : 0;
        } catch (Exception e) {
            log.warn("추가 후 코드 개수 확인 실패: {}", e.getMessage());
        }

        int addedCount = afterCount - beforeCount;
        log.info("✅ 테넌트 기본 공통코드 추가 완료: tenantId={}, 추가된 코드={}개", tenantId, addedCount);
        return addedCount;
    }

    /**
     * 공통코드 삽입 (중복 체크)
     */
    private void insertCommonCodeIfNotExists(String tenantId, String codeGroup, String codeValue,
            String koreanName, String codeLabel, String description, String extraData,
            Integer sortOrder, String createdBy) {
        try {
            Optional<CommonCode> existing = commonCodeRepository
                    .findTenantCodeByGroupAndValue(tenantId, codeGroup, codeValue);

            if (existing.isPresent()) {
                log.debug("공통코드가 이미 존재함: tenantId={}, codeGroup={}, codeValue={}", tenantId,
                        codeGroup, codeValue);
                return;
            }

            CommonCode code = CommonCode.builder().codeGroup(codeGroup).codeValue(codeValue)
                    .koreanName(koreanName).codeLabel(codeLabel).codeDescription(description)
                    .sortOrder(sortOrder != null ? sortOrder : 0).isActive(true)
                    .extraData(extraData).build();

            code.setTenantId(tenantId);

            commonCodeRepository.save(code);
            log.debug("공통코드 삽입 완료: tenantId={}, codeGroup={}, codeValue={}", tenantId, codeGroup,
                    codeValue);

        } catch (Exception e) {
            log.error("공통코드 삽입 실패: tenantId={}, codeGroup={}, codeValue={}, error={}", tenantId,
                    codeGroup, codeValue, e.getMessage());
            throw e; // 상위로 전파하여 개별 처리
        }
    }

    /**
     * 테넌트별 비즈니스 타입별 역할 코드 생성 표준화 2025-12-05: 비즈니스 타입에 따라 역할 코드 자동 생성
     *
     * @param tenantId 테넌트 ID
     * @param businessType 비즈니스 타입
     * @param createdBy 생성자 ID
     */
    private void insertTenantRoleCodes(String tenantId, String businessType, String createdBy) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("⚠️ 테넌트 ID가 없어 역할 코드 생성 건너뜁니다.");
            return;
        }

        if (businessType == null || businessType.trim().isEmpty()) {
            log.warn("⚠️ 비즈니스 타입이 없어 역할 코드 생성 건너뜁니다: tenantId={}", tenantId);
            return;
        }

        log.info("🔄 테넌트 역할 코드 생성 시작: tenantId={}, businessType={}", tenantId, businessType);

        String createdByValue = createdBy != null ? createdBy : "SYSTEM_ONBOARDING";
        int insertedCount = 0;

        try {
            // 상담소(CONSULTATION)
            if ("CONSULTATION".equals(businessType)) {
                insertCommonCodeIfNotExists(tenantId, "ROLE", "ADMIN", "원장", "원장", "상담소 원장 역할",
                        "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"CONSULTATION\"}",
                        1, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CONSULTANT", "상담사", "상담사", "상담사 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"CONSULTATION\"}",
                        2, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CLIENT", "내담자", "내담자", "내담자 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"CONSULTATION\"}",
                        3, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "STAFF", "사무원", "사무원", "사무원 역할",
                        "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"CONSULTATION\"}",
                        4, createdByValue);
                insertedCount = 4;
            }
            // 심리상담(COUNSELING)
            else if ("COUNSELING".equals(businessType)) {
                insertCommonCodeIfNotExists(tenantId, "ROLE", "ADMIN", "원장", "원장", "심리상담 원장 역할",
                        "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"COUNSELING\"}",
                        1, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CONSULTANT", "상담사", "상담사",
                        "심리상담 상담사 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"COUNSELING\"}",
                        2, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CLIENT", "내담자", "내담자", "심리상담 내담자 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"COUNSELING\"}",
                        3, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "STAFF", "사무원", "사무원", "심리상담 사무원 역할",
                        "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"COUNSELING\"}",
                        4, createdByValue);
                insertedCount = 4;
            }
            // 학원(ACADEMY)
            else if ("ACADEMY".equals(businessType)) {
                insertCommonCodeIfNotExists(tenantId, "ROLE", "ADMIN", "원장", "원장", "학원 원장 역할",
                        "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}",
                        1, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CONSULTANT", "강사", "강사", "강사 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}",
                        2, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CLIENT", "학생", "학생", "학생 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}",
                        3, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "PARENT", "학부모", "학부모",
                        "학부모 역할 (학원 전용)",
                        "{\"isAdmin\": false, \"roleType\": \"PARENT\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}",
                        4, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "STAFF", "행정직원", "행정직원", "행정직원 역할",
                        "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}",
                        5, createdByValue);
                insertedCount = 5;
            }
            // 요식업(FOOD_SERVICE)
            else if ("FOOD_SERVICE".equals(businessType)) {
                insertCommonCodeIfNotExists(tenantId, "ROLE", "ADMIN", "사장", "사장", "요식업 사장 역할",
                        "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"FOOD_SERVICE\"}",
                        1, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CONSULTANT", "요리사", "요리사", "요리사 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"FOOD_SERVICE\"}",
                        2, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CLIENT", "고객", "고객", "고객 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"FOOD_SERVICE\"}",
                        3, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "STAFF", "직원", "직원", "직원 역할",
                        "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"FOOD_SERVICE\"}",
                        4, createdByValue);
                insertedCount = 4;
            }
            // 태권도(TAEKWONDO)
            else if ("TAEKWONDO".equals(businessType)) {
                insertCommonCodeIfNotExists(tenantId, "ROLE", "ADMIN", "관장", "관장", "태권도 관장 역할",
                        "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"TAEKWONDO\"}",
                        1, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CONSULTANT", "사범", "사범", "태권도 사범 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"TAEKWONDO\"}",
                        2, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CLIENT", "학생", "학생", "태권도 학생 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"TAEKWONDO\"}",
                        3, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "STAFF", "직원", "직원", "태권도 직원 역할",
                        "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"TAEKWONDO\"}",
                        4, createdByValue);
                insertedCount = 4;
            }
            // 과외(TUTORING)
            else if ("TUTORING".equals(businessType)) {
                insertCommonCodeIfNotExists(tenantId, "ROLE", "ADMIN", "원장", "원장", "과외 원장 역할",
                        "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"TUTORING\"}",
                        1, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CONSULTANT", "강사", "강사", "과외 강사 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"TUTORING\"}",
                        2, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CLIENT", "학생", "학생", "과외 학생 역할",
                        "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"TUTORING\"}",
                        3, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "STAFF", "직원", "직원", "과외 직원 역할",
                        "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"TUTORING\"}",
                        4, createdByValue);
                insertedCount = 4;
            }
            // 기타 비즈니스 타입
            else {
                insertCommonCodeIfNotExists(tenantId, "ROLE", "ADMIN", "관리자", "관리자", "관리자 역할",
                        String.format(
                                "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"%s\"}",
                                businessType),
                        1, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CONSULTANT", "전문가", "전문가", "전문가 역할",
                        String.format(
                                "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"%s\"}",
                                businessType),
                        2, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "CLIENT", "고객", "고객", "고객 역할",
                        String.format(
                                "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"%s\"}",
                                businessType),
                        3, createdByValue);
                insertCommonCodeIfNotExists(tenantId, "ROLE", "STAFF", "직원", "직원", "직원 역할",
                        String.format(
                                "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"%s\"}",
                                businessType),
                        4, createdByValue);
                insertedCount = 4;
            }

            log.info("✅ 테넌트 역할 코드 생성 완료: tenantId={}, businessType={}, count={}", tenantId,
                    businessType, insertedCount);
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
            // 관리자 역할 찾기 (nameEn이 "Director", "Admin" 또는 nameKo가 "관리자")
            List<String> adminRoleNames = List.of("Director", "Admin", "관리자");
            Optional<com.coresolution.core.domain.TenantRole> adminRole = Optional.empty();

            for (String roleName : adminRoleNames) {
                if (roleName.equals("관리자")) {
                    adminRole = tenantRoleRepository.findByTenantIdAndNameKo(tenantId, roleName);
                } else {
                    adminRole = tenantRoleRepository
                            .findByTenantIdAndNameEnAndIsDeletedFalse(tenantId, roleName);
                }

                if (adminRole.isPresent()) {
                    break;
                }
            }

            if (adminRole.isEmpty()) {
                log.warn("⚠️ 관리자 역할을 찾을 수 없습니다: tenantId={}", tenantId);
                return;
            }

            String tenantRoleId = adminRole.get().getTenantRoleId();
            log.info("✅ 관리자 역할 찾음: tenantId={}, tenantRoleId={}, roleName={}", tenantId,
                    tenantRoleId, adminRole.get().getNameKo());

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
            java.util.UUID excludeRequestId) {
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

}

