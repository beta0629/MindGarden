package com.coresolution.core.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.dto.OnboardingCreateRequest;
import com.coresolution.core.controller.dto.OnboardingDecisionRequest;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.OpsPermissionUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 온보딩 API 컨트롤러 /** 온보딩 요청 CRUD 및 승인 프로세스 API /**
 *
 * /** 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임 /**
 *
 * /**
 *
 * @author CoreSolution /**
 * @version 2.0.0 /**
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/onboarding", "/api/v1/ops/onboarding"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OnboardingController extends BaseApiController {

    private final OnboardingService onboardingService;
    private final UserRepository userRepository;

    /**
     * 온보딩 접근 권한 확인 /** 온보딩은 새로운 테넌트를 등록하는 것이므로, 이미 테넌트에 속한 사용자는 접근할 수 없음 /**
     *
     * /** 멀티 테넌트 사용자 지원: 같은 이메일로 여러 테넌트에 계정이 있을 수 있으므로, /** 모든 User를 조회하여 하나라도 tenant_id가 있으면 접근 거부
     * /**
     *
     * /**
     *
     * @param session HTTP 세션 (선택적 - 인증되지 않은 사용자도 접근 가능) /**
     * @throws AccessDeniedException 이미 테넌트에 속한 사용자인 경우
     */
    private void validateOnboardingAccess(HttpSession session) {
        if (session == null) {
            log.debug("세션이 없음 - 새로운 테넌트 등록 가능");
            return;
        }

        // 표준화: SessionUtils 사용 (직접 세션 접근 금지)
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.debug("세션에 사용자 정보가 없음 - 새로운 테넌트 등록 가능");
            return;
        }

        String userEmail = currentUser.getEmail();
        if (userEmail == null || userEmail.trim().isEmpty()) {
            log.debug("사용자 이메일이 없음 - 새로운 테넌트 등록 가능");
            return;
        }

        String normalizedEmail = userEmail.trim().toLowerCase();

        List<User> users = userRepository.findAllByEmail(normalizedEmail);
        if (users == null || users.isEmpty()) {
            log.debug("사용자를 찾을 수 없음 - 새로운 테넌트 등록 가능: email={}", normalizedEmail);
            return;
        }

        boolean hasTenantId =
                users.stream().filter(user -> user.getIsDeleted() == null || !user.getIsDeleted())
                        .anyMatch(user -> {
                            String tenantId = user.getTenantId();
                            return tenantId != null && !tenantId.trim().isEmpty();
                        });

        if (hasTenantId) {
            List<String> tenantIds = users.stream()
                    .filter(user -> user.getIsDeleted() == null || !user.getIsDeleted())
                    .map(User::getTenantId).filter(id -> id != null && !id.trim().isEmpty())
                    .distinct().toList();

            log.warn("온보딩 접근 거부: 이미 테넌트에 속한 사용자 - email={}, tenantIds={}", normalizedEmail,
                    tenantIds);
            throw new AccessDeniedException(
                    "이미 테넌트에 속한 사용자는 온보딩에 접근할 수 없습니다. 기존 테넌트 관리 페이지를 사용해주세요.");
        }

        log.debug("온보딩 접근 허용: 새로운 테넌트 등록 가능 - email={}", normalizedEmail);
    }

    /**
     * 대기 중인 온보딩 요청 목록 조회 /** GET /api/v1/ops/onboarding/requests/pending (관리자 전용) GET
     * /api/v1/onboarding/requests/pending (공개 - 사용 안 함, 하위 호환성)
     */
    @GetMapping("/requests/pending")
    public ResponseEntity<ApiResponse<List<OnboardingRequest>>> getPendingRequests(
            HttpServletRequest request) {
        // /api/v1/ops/onboarding 경로로 접근한 경우에만 권한 체크
        if (request.getRequestURI().startsWith("/api/v1/ops/onboarding")) {
            OpsPermissionUtils.requireAdminOrOps();
        }
        // /api/v1/onboarding 경로로 접근한 경우는 공개 API (하위 호환성)

        List<OnboardingRequest> requests = onboardingService.findPending();
        return success(requests);
    }

    /**
     * 온보딩 요청 상세 조회 /** GET /api/v1/ops/onboarding/requests/{id} (관리자 전용) GET
     * /api/v1/onboarding/requests/{id} (공개 - 사용 안 함, 하위 호환성)
     */
    @GetMapping("/requests/{id}")
    public ResponseEntity<ApiResponse<OnboardingRequest>> getRequest(
            @PathVariable java.util.UUID id, HttpServletRequest request) {
        // /api/v1/ops/onboarding 경로로 접근한 경우에만 권한 체크
        if (request.getRequestURI().startsWith("/api/v1/ops/onboarding")) {
            OpsPermissionUtils.requireAdminOrOps();
        }
        // /api/v1/onboarding 경로로 접근한 경우는 공개 API (하위 호환성)

        OnboardingRequest requestObj = onboardingService.getById(id);
        if (requestObj == null) {
            throw new EntityNotFoundException("온보딩 요청을 찾을 수 없습니다: " + id);
        }
        return success(requestObj);
    }

    /**
     * 온보딩 요청 생성 /** POST /api/onboarding/requests /** 새로운 테넌트를 등록하려는 사용자만 접근 가능 /** (이미 테넌트에 속한
     * 사용자는 접근 불가) /** (승인/관리는 Trinity 직원만 가능)
     */
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<OnboardingRequest>> create(
            @RequestBody @Valid OnboardingCreateRequest payload, HttpSession session) {
        validateOnboardingAccess(session);
        log.info(
                "온보딩 요청 생성: tenantId={}, tenantName={}, requestedBy={}, businessType={}, hasAdminPassword={}",
                payload.tenantId(), payload.tenantName(), payload.requestedBy(),
                payload.businessType(),
                payload.adminPassword() != null && !payload.adminPassword().isEmpty());

        try {
            if (payload.tenantName() == null || payload.tenantName().trim().isEmpty()) {
                throw new IllegalArgumentException("테넌트 이름은 필수입니다.");
            }
            if (payload.requestedBy() == null || payload.requestedBy().trim().isEmpty()) {
                throw new IllegalArgumentException("요청자 이메일은 필수입니다.");
            }
            if (payload.requestedBy().length() > 64) {
                log.warn("요청자 이메일 길이 초과: length={}, email={}", payload.requestedBy().length(),
                        payload.requestedBy());
                throw new IllegalArgumentException("요청자 이메일이 너무 깁니다. (최대 64자)");
            }
            if (payload.riskLevel() == null) {
                log.warn("위험도가 null입니다. LOW로 설정합니다.");
            }

            String finalChecklistJson = payload.checklistJson();
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                Map<String, Object> checklist = new HashMap<>();

                // 기존 checklistJson 파싱
                if (finalChecklistJson != null && !finalChecklistJson.trim().isEmpty()) {
                    checklist = objectMapper.readValue(finalChecklistJson,
                            new TypeReference<Map<String, Object>>() {});
                }

                // adminPassword 추가
                if (payload.adminPassword() != null && !payload.adminPassword().trim().isEmpty()) {
                    checklist.put("adminPassword", payload.adminPassword());
                }

                // regionCode 추가
                if (payload.regionCode() != null && !payload.regionCode().trim().isEmpty()) {
                    checklist.put("regionCode", payload.regionCode());
                }

                // brandName 추가 (브랜딩 적용)
                if (payload.brandName() != null && !payload.brandName().trim().isEmpty()) {
                    checklist.put("brandName", payload.brandName());
                }

                // subdomain 추가 (와일드카드 도메인용)
                if (payload.subdomain() != null && !payload.subdomain().trim().isEmpty()) {
                    checklist.put("subdomain", payload.subdomain().trim().toLowerCase());
                }

                finalChecklistJson = objectMapper.writeValueAsString(checklist);
                log.info(
                        "checklistJson 병합 완료: hasAdminPassword={}, hasRegionCode={}, hasBrandName={}, hasSubdomain={}",
                        checklist.containsKey("adminPassword"), checklist.containsKey("regionCode"),
                        checklist.containsKey("brandName"), checklist.containsKey("subdomain"));
            } catch (Exception e) {
                log.error("checklistJson 병합 실패: {}", e.getMessage(), e);
            }

            OnboardingRequest request = onboardingService.create(payload.tenantId(),
                    payload.tenantName(), payload.requestedBy(),
                    payload.riskLevel() != null ? payload.riskLevel()
                            : com.coresolution.core.domain.onboarding.RiskLevel.LOW,
                    finalChecklistJson, payload.businessType());

            log.info("✅ 온보딩 요청 생성 완료: id={}", request.getId());
            return created("온보딩 요청이 생성되었습니다.", request);
        } catch (IllegalArgumentException e) {
            log.error("온보딩 요청 생성 실패 (검증 오류): {}", e.getMessage());
            throw e;
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("온보딩 요청 생성 실패 (데이터베이스 제약 조건 위반): {}", e.getMessage(), e);
            throw new IllegalArgumentException(
                    "데이터 저장 중 오류가 발생했습니다: " + e.getMostSpecificCause().getMessage());
        } catch (Exception e) {
            log.error("온보딩 요청 생성 실패: error={}, message={}, cause={}", e.getClass().getSimpleName(),
                    e.getMessage(), e.getCause() != null ? e.getCause().getMessage() : "none", e);
            throw e;
        }
    }

    /**
     * 온보딩 요청 조회 (이메일로 조회) /** GET /api/v1/onboarding/requests/public?email={email} /** 새로운 테넌트를
     * 등록하려는 사용자만 접근 가능 /** (이미 테넌트에 속한 사용자는 접근 불가)
     */
    @GetMapping("/requests/public")
    public ResponseEntity<ApiResponse<List<OnboardingRequest>>> getPublicRequests(
            @RequestParam String email, HttpSession session) {
        validateOnboardingAccess(session);
        log.debug("공개 온보딩 요청 조회: email={}", email);

        List<OnboardingRequest> requests = onboardingService.findByEmail(email);

        log.debug("✅ 공개 온보딩 요청 조회 완료: email={}, count={}", email, requests.size());
        return success(requests);
    }

    /**
     * 이메일 중복 확인 /** GET /api/v1/onboarding/email-check?email={email} /** 새로운 테넌트를 등록하려는 사용자만 접근 가능
     * /** (이미 테넌트에 속한 사용자는 접근 불가)
     */
    @GetMapping("/email-check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEmailDuplicate(
            @RequestParam String email, HttpSession session) {
        validateOnboardingAccess(session);
        log.debug("이메일 중복 확인 요청: email={}", email);

        OnboardingService.EmailDuplicateCheckResult result =
                onboardingService.checkEmailDuplicate(email);

        Map<String, Object> response = Map.of("email", email, "isDuplicate", result.isDuplicate(),
                "available", result.available(), "message",
                result.message() != null ? result.message() : "", "status",
                result.status() != null ? result.status() : "");

        log.debug("이메일 중복 확인 결과: email={}, isDuplicate={}, message={}", email, result.isDuplicate(),
                result.message());

        return success(response);
    }

    /**
     * 온보딩 요청 상세 조회 (ID + 이메일로 본인 확인) /** GET /api/v1/onboarding/requests/public/{id}?email={email}
     * /** 새로운 테넌트를 등록하려는 사용자만 접근 가능 /** (이미 테넌트에 속한 사용자는 접근 불가)
     */
    @GetMapping("/requests/public/{id}")
    public ResponseEntity<ApiResponse<OnboardingRequest>> getPublicRequest(
            @PathVariable java.util.UUID id, @RequestParam String email, HttpSession session) {
        validateOnboardingAccess(session);
        log.debug("공개 온보딩 요청 상세 조회: id={}, email={}", id, email);

        OnboardingRequest request = onboardingService.findByIdAndEmail(id, email);

        return success(request);
    }

    /**
     * 온보딩 요청 결정 (승인/거부) /** POST /api/v1/ops/onboarding/requests/{id}/decision (관리자 전용) 승인 시 PL/SQL
     * 프로시저를 통해 테넌트 생성 및 ERD 생성 등 자동 처리 관리자 또는 OPS 역할만 접근 가능
     */
    @PostMapping("/requests/{id}/decision")
    public ResponseEntity<ApiResponse<OnboardingRequest>> decide(@PathVariable java.util.UUID id,
            @RequestBody @Valid OnboardingDecisionRequest payload, HttpServletRequest request) {
        // /api/v1/ops/onboarding 경로로 접근한 경우에만 권한 체크
        if (request.getRequestURI().startsWith("/api/v1/ops/onboarding")) {
            OpsPermissionUtils.requireAdminOrOps();
        }

        log.info("온보딩 요청 결정: id={}, status={}, actorId={}", id, payload.status(),
                payload.actorId());

        OnboardingRequest updated =
                onboardingService.decide(id, payload.status(), payload.actorId(), payload.note());

        log.info("✅ 온보딩 요청 결정 완료: id={}, status={}", id, payload.status());
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return updated("온보딩 요청이 " + (payload.status() == OnboardingStatus.APPROVED ? "승인" : "거부")
                + "되었습니다.", updated);
    }

    /**
     * 상태별 온보딩 요청 목록 조회 /** GET /api/v1/ops/onboarding/requests?status={status} (관리자 전용)
     */
    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<Page<OnboardingRequest>>> getRequests(
            @RequestParam(required = false) OnboardingStatus status,
            @PageableDefault(size = 20) Pageable pageable, HttpServletRequest request) {
        // /api/v1/ops/onboarding 경로로 접근한 경우에만 권한 체크
        if (request.getRequestURI().startsWith("/api/v1/ops/onboarding")) {
            OpsPermissionUtils.requireAdminOrOps();
        }

        Page<OnboardingRequest> requests;
        if (status != null) {
            requests = onboardingService.findByStatus(status, pageable);
        } else {
            requests = onboardingService.findAll(pageable);
        }

        return success(requests);
    }

    /**
     * 상태별 온보딩 요청 개수 조회 /** GET /api/v1/ops/onboarding/requests/count?status={status} (관리자 전용)
     */
    @GetMapping("/requests/count")
    public ResponseEntity<ApiResponse<Long>> getRequestCount(
            @RequestParam(required = false) OnboardingStatus status, HttpServletRequest request) {
        // /api/v1/ops/onboarding 경로로 접근한 경우에만 권한 체크
        if (request.getRequestURI().startsWith("/api/v1/ops/onboarding")) {
            OpsPermissionUtils.requireAdminOrOps();
        }

        long count;
        if (status != null) {
            count = onboardingService.countByStatus(status);
        } else {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            count = onboardingService.countByStatus(OnboardingStatus.PENDING);
        }

        return success(count);
    }

    /**
     * 온보딩 승인 프로세스 재시도 /** POST /api/v1/ops/onboarding/requests/{id}/retry (관리자 전용) ON_HOLD 상태인 경우에만
     * 재시도 가능 프로시저 실패로 보류된 온보딩 요청을 다시 승인 프로세스 실행 관리자 또는 OPS 역할만 접근 가능
     */
    @PostMapping("/requests/{id}/retry")
    public ResponseEntity<ApiResponse<OnboardingRequest>> retryApproval(
            @PathVariable java.util.UUID id,
            @RequestBody(required = false) Map<String, String> payload,
            HttpServletRequest request) {
        // /api/v1/ops/onboarding 경로로 접근한 경우에만 권한 체크
        if (request.getRequestURI().startsWith("/api/v1/ops/onboarding")) {
            OpsPermissionUtils.requireAdminOrOps();
        }

        log.info("온보딩 승인 프로세스 재시도: id={}", id);

        String actorId = payload != null && payload.containsKey("actorId") ? payload.get("actorId")
                : "SYSTEM_RETRY";
        String note = payload != null && payload.containsKey("note") ? payload.get("note") : null;

        OnboardingRequest updated = onboardingService.retryApproval(id, actorId, note);

        log.info("✅ 온보딩 승인 프로세스 재시도 완료: id={}", id);
        return updated("온보딩 승인 프로세스가 재시도되었습니다.", updated);
    }
}

