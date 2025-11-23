package com.coresolution.core.controller;

import com.coresolution.core.controller.dto.OnboardingCreateRequest;
import com.coresolution.core.controller.dto.OnboardingDecisionRequest;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 온보딩 API 컨트롤러
 * 온보딩 요청 CRUD 및 승인 프로세스 API
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/onboarding")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OnboardingController extends BaseApiController {
    
    private final OnboardingService onboardingService;
    private final UserRepository userRepository;
    
    /**
     * 온보딩 접근 권한 확인
     * 온보딩은 새로운 테넌트를 등록하는 것이므로, 이미 테넌트에 속한 사용자는 접근할 수 없음
     * 
     * 멀티 테넌트 사용자 지원: 같은 이메일로 여러 테넌트에 계정이 있을 수 있으므로,
     * 모든 User를 조회하여 하나라도 tenant_id가 있으면 접근 거부
     * 
     * @param session HTTP 세션 (선택적 - 인증되지 않은 사용자도 접근 가능)
     * @throws AccessDeniedException 이미 테넌트에 속한 사용자인 경우
     */
    private void validateOnboardingAccess(HttpSession session) {
        // 세션이 없으면 인증되지 않은 사용자로 간주 (새로운 테넌트 등록 가능)
        if (session == null) {
            log.debug("세션이 없음 - 새로운 테넌트 등록 가능");
            return;
        }
        
        // 세션에서 사용자 이메일 가져오기
        String userEmail = (String) session.getAttribute("userEmail");
        if (userEmail == null || userEmail.trim().isEmpty()) {
            log.debug("세션에 사용자 이메일이 없음 - 새로운 테넌트 등록 가능");
            return;
        }
        
        String normalizedEmail = userEmail.trim().toLowerCase();
        
        // 멀티 테넌트 지원: 같은 이메일로 여러 테넌트에 계정이 있을 수 있음
        // 모든 User를 조회하여 하나라도 tenant_id가 있으면 접근 거부
        List<User> users = userRepository.findAllByEmail(normalizedEmail);
        if (users == null || users.isEmpty()) {
            log.debug("사용자를 찾을 수 없음 - 새로운 테넌트 등록 가능: email={}", normalizedEmail);
            return;
        }
        
        // 삭제되지 않은 사용자 중 하나라도 tenant_id가 있으면 접근 거부
        boolean hasTenantId = users.stream()
            .filter(user -> user.getIsDeleted() == null || !user.getIsDeleted())
            .anyMatch(user -> {
                String tenantId = user.getTenantId();
                return tenantId != null && !tenantId.trim().isEmpty();
            });
        
        if (hasTenantId) {
            List<String> tenantIds = users.stream()
                .filter(user -> user.getIsDeleted() == null || !user.getIsDeleted())
                .map(User::getTenantId)
                .filter(id -> id != null && !id.trim().isEmpty())
                .distinct()
                .toList();
            
            log.warn("온보딩 접근 거부: 이미 테넌트에 속한 사용자 - email={}, tenantIds={}", 
                normalizedEmail, tenantIds);
            throw new AccessDeniedException("이미 테넌트에 속한 사용자는 온보딩에 접근할 수 없습니다. 기존 테넌트 관리 페이지를 사용해주세요.");
        }
        
        log.debug("온보딩 접근 허용: 새로운 테넌트 등록 가능 - email={}", normalizedEmail);
    }
    
    /**
     * 대기 중인 온보딩 요청 목록 조회
     * GET /api/onboarding/requests/pending
     */
    @GetMapping("/requests/pending")
    public ResponseEntity<ApiResponse<List<OnboardingRequest>>> getPendingRequests() {
        // 인증 정보 확인 및 권한 체크
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null) {
            log.warn("대기 중인 온보딩 요청 목록 조회: 인증 정보 없음");
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }
        
        // 권한 체크: ADMIN 또는 OPS 역할이 있어야 함
        boolean hasAdminRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOpsRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_OPS"));
        
        if (!hasAdminRole && !hasOpsRole) {
            log.warn("대기 중인 온보딩 요청 목록 조회: 권한 없음 - principal={}, authorities={}", 
                auth.getPrincipal(), auth.getAuthorities());
            throw new org.springframework.security.access.AccessDeniedException("접근 권한이 없습니다.");
        }
        
        log.debug("대기 중인 온보딩 요청 목록 조회: principal={}, authorities={}", 
            auth.getPrincipal(), auth.getAuthorities());
        List<OnboardingRequest> requests = onboardingService.findPending();
        return success(requests);
    }
    
    /**
     * 온보딩 요청 상세 조회
     * GET /api/onboarding/requests/{id}
     */
    @GetMapping("/requests/{id}")
    public ResponseEntity<ApiResponse<OnboardingRequest>> getRequest(@PathVariable Long id) {
        // 인증 정보 확인 및 권한 체크
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null) {
            log.warn("온보딩 요청 상세 조회: id={}, 인증 정보 없음", id);
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }
        
        // 권한 체크: ADMIN 또는 OPS 역할이 있어야 함
        boolean hasAdminRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOpsRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_OPS"));
        
        if (!hasAdminRole && !hasOpsRole) {
            log.warn("온보딩 요청 상세 조회: 권한 없음 - id={}, principal={}, authorities={}", 
                id, auth.getPrincipal(), auth.getAuthorities());
            throw new org.springframework.security.access.AccessDeniedException("접근 권한이 없습니다.");
        }
        
        log.debug("온보딩 요청 상세 조회: id={}, principal={}, authorities={}", 
            id, auth.getPrincipal(), auth.getAuthorities());
        OnboardingRequest request = onboardingService.getById(id);
        if (request == null) {
            throw new EntityNotFoundException("온보딩 요청을 찾을 수 없습니다: " + id);
        }
        return success(request);
    }
    
    /**
     * 온보딩 요청 생성
     * POST /api/onboarding/requests
     * 새로운 테넌트를 등록하려는 사용자만 접근 가능
     * (이미 테넌트에 속한 사용자는 접근 불가)
     * (승인/관리는 Trinity 직원만 가능)
     */
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<OnboardingRequest>> create(
            @RequestBody @Valid OnboardingCreateRequest payload,
            HttpSession session) {
        // 온보딩 접근 권한 확인 (이미 테넌트에 속한 사용자는 접근 불가)
        validateOnboardingAccess(session);
        log.info("온보딩 요청 생성: tenantId={}, tenantName={}, requestedBy={}, businessType={}, hasAdminPassword={}", 
            payload.tenantId(), payload.tenantName(), payload.requestedBy(), 
            payload.businessType(), payload.adminPassword() != null && !payload.adminPassword().isEmpty());
        
        try {
            // 입력 데이터 검증
            if (payload.tenantName() == null || payload.tenantName().trim().isEmpty()) {
                throw new IllegalArgumentException("테넌트 이름은 필수입니다.");
            }
            if (payload.requestedBy() == null || payload.requestedBy().trim().isEmpty()) {
                throw new IllegalArgumentException("요청자 이메일은 필수입니다.");
            }
            if (payload.requestedBy().length() > 64) {
                log.warn("요청자 이메일 길이 초과: length={}, email={}", payload.requestedBy().length(), payload.requestedBy());
                throw new IllegalArgumentException("요청자 이메일이 너무 깁니다. (최대 64자)");
            }
            if (payload.riskLevel() == null) {
                log.warn("위험도가 null입니다. LOW로 설정합니다.");
            }
            
            // adminPassword가 별도로 전달된 경우 checklistJson에 병합
            String finalChecklistJson = payload.checklistJson();
            if (payload.adminPassword() != null && !payload.adminPassword().trim().isEmpty()) {
                try {
                    ObjectMapper objectMapper = new ObjectMapper();
                    // checklistJson이 있으면 파싱하여 adminPassword 추가/업데이트
                    if (finalChecklistJson != null && !finalChecklistJson.trim().isEmpty()) {
                        Map<String, Object> checklist = objectMapper.readValue(
                            finalChecklistJson, 
                            new TypeReference<Map<String, Object>>() {}
                        );
                        checklist.put("adminPassword", payload.adminPassword());
                        finalChecklistJson = objectMapper.writeValueAsString(checklist);
                    } else {
                        // checklistJson이 없으면 새로 생성
                        Map<String, Object> checklist = new HashMap<>();
                        checklist.put("adminPassword", payload.adminPassword());
                        finalChecklistJson = objectMapper.writeValueAsString(checklist);
                    }
                    log.info("adminPassword를 checklistJson에 병합 완료");
                } catch (Exception e) {
                    log.error("checklistJson에 adminPassword 병합 실패: {}", e.getMessage(), e);
                    // 병합 실패 시 기존 checklistJson 사용
                }
            }
            
            OnboardingRequest request = onboardingService.create(
                payload.tenantId(),
                payload.tenantName(),
                payload.requestedBy(),
                payload.riskLevel() != null ? payload.riskLevel() : com.coresolution.core.domain.onboarding.RiskLevel.LOW,
                finalChecklistJson,
                payload.businessType()
            );
            
            log.info("✅ 온보딩 요청 생성 완료: id={}", request.getId());
            return created("온보딩 요청이 생성되었습니다.", request);
        } catch (IllegalArgumentException e) {
            log.error("온보딩 요청 생성 실패 (검증 오류): {}", e.getMessage());
            throw e;
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("온보딩 요청 생성 실패 (데이터베이스 제약 조건 위반): {}", e.getMessage(), e);
            throw new IllegalArgumentException("데이터 저장 중 오류가 발생했습니다: " + e.getMostSpecificCause().getMessage());
        } catch (Exception e) {
            log.error("온보딩 요청 생성 실패: error={}, message={}, cause={}", 
                e.getClass().getSimpleName(), e.getMessage(), 
                e.getCause() != null ? e.getCause().getMessage() : "none", e);
            throw e;
        }
    }
    
    /**
     * 온보딩 요청 조회 (이메일로 조회)
     * GET /api/v1/onboarding/requests/public?email={email}
     * 새로운 테넌트를 등록하려는 사용자만 접근 가능
     * (이미 테넌트에 속한 사용자는 접근 불가)
     */
    @GetMapping("/requests/public")
    public ResponseEntity<ApiResponse<List<OnboardingRequest>>> getPublicRequests(
            @RequestParam String email,
            HttpSession session) {
        // 온보딩 접근 권한 확인 (이미 테넌트에 속한 사용자는 접근 불가)
        validateOnboardingAccess(session);
        log.debug("공개 온보딩 요청 조회: email={}", email);
        
        List<OnboardingRequest> requests = onboardingService.findByEmail(email);
        
        log.debug("✅ 공개 온보딩 요청 조회 완료: email={}, count={}", email, requests.size());
        return success(requests);
    }
    
    /**
     * 이메일 중복 확인
     * GET /api/v1/onboarding/email-check?email={email}
     * 새로운 테넌트를 등록하려는 사용자만 접근 가능
     * (이미 테넌트에 속한 사용자는 접근 불가)
     */
    @GetMapping("/email-check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEmailDuplicate(
            @RequestParam String email,
            HttpSession session) {
        // 온보딩 접근 권한 확인 (이미 테넌트에 속한 사용자는 접근 불가)
        validateOnboardingAccess(session);
        log.debug("이메일 중복 확인 요청: email={}", email);
        
        OnboardingService.EmailDuplicateCheckResult result = onboardingService.checkEmailDuplicate(email);
        
        Map<String, Object> response = Map.of(
            "email", email,
            "isDuplicate", result.isDuplicate(),
            "available", result.available(),
            "message", result.message() != null ? result.message() : "",
            "status", result.status() != null ? result.status() : ""
        );
        
        log.debug("이메일 중복 확인 결과: email={}, isDuplicate={}, message={}", 
            email, result.isDuplicate(), result.message());
        
        return success(response);
    }
    
    /**
     * 온보딩 요청 상세 조회 (ID + 이메일로 본인 확인)
     * GET /api/v1/onboarding/requests/public/{id}?email={email}
     * 새로운 테넌트를 등록하려는 사용자만 접근 가능
     * (이미 테넌트에 속한 사용자는 접근 불가)
     */
    @GetMapping("/requests/public/{id}")
    public ResponseEntity<ApiResponse<OnboardingRequest>> getPublicRequest(
            @PathVariable Long id,
            @RequestParam String email,
            HttpSession session) {
        // 온보딩 접근 권한 확인 (이미 테넌트에 속한 사용자는 접근 불가)
        validateOnboardingAccess(session);
        log.debug("공개 온보딩 요청 상세 조회: id={}, email={}", id, email);
        
        OnboardingRequest request = onboardingService.findByIdAndEmail(id, email);
        
        return success(request);
    }
    
    /**
     * 온보딩 요청 결정 (승인/거부)
     * POST /api/onboarding/requests/{id}/decision
     * 승인 시 PL/SQL 프로시저를 통해 테넌트 생성 및 ERD 생성 등 자동 처리
     * 관리자 또는 OPS 역할만 접근 가능
     */
    @PostMapping("/requests/{id}/decision")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
    public ResponseEntity<ApiResponse<OnboardingRequest>> decide(
            @PathVariable Long id,
            @RequestBody @Valid OnboardingDecisionRequest payload) {
        log.info("온보딩 요청 결정: id={}, status={}, actorId={}", 
            id, payload.status(), payload.actorId());
        
        OnboardingRequest updated = onboardingService.decide(
            id,
            payload.status(),
            payload.actorId(),
            payload.note()
        );
        
        log.info("✅ 온보딩 요청 결정 완료: id={}, status={}", id, payload.status());
        return updated("온보딩 요청이 " + (payload.status() == OnboardingStatus.APPROVED ? "승인" : "거부") + "되었습니다.", updated);
    }
    
    /**
     * 상태별 온보딩 요청 목록 조회
     * GET /api/onboarding/requests?status={status}
     */
    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<Page<OnboardingRequest>>> getRequests(
            @RequestParam(required = false) OnboardingStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        // 인증 정보 확인 및 권한 체크
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null) {
            log.warn("상태별 온보딩 요청 목록 조회: 인증 정보 없음 - status={}", status);
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }
        
        // 권한 체크: ADMIN 또는 OPS 역할이 있어야 함
        boolean hasAdminRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOpsRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_OPS"));
        
        if (!hasAdminRole && !hasOpsRole) {
            log.warn("상태별 온보딩 요청 목록 조회: 권한 없음 - status={}, principal={}, authorities={}", 
                status, auth.getPrincipal(), auth.getAuthorities());
            throw new org.springframework.security.access.AccessDeniedException("접근 권한이 없습니다.");
        }
        
        log.debug("상태별 온보딩 요청 목록 조회: status={}, page={}, size={}, principal={}, authorities={}", 
            status, pageable.getPageNumber(), pageable.getPageSize(), auth.getPrincipal(), auth.getAuthorities());
        
        Page<OnboardingRequest> requests;
        if (status != null) {
            requests = onboardingService.findByStatus(status, pageable);
        } else {
            // 상태가 지정되지 않은 경우 전체 조회
            requests = onboardingService.findAll(pageable);
        }
        
        return success(requests);
    }
    
    /**
     * 상태별 온보딩 요청 개수 조회
     * GET /api/onboarding/requests/count?status={status}
     */
    @GetMapping("/requests/count")
    public ResponseEntity<ApiResponse<Long>> getRequestCount(
            @RequestParam(required = false) OnboardingStatus status) {
        // 인증 정보 확인 및 권한 체크
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null) {
            log.warn("상태별 온보딩 요청 개수 조회: 인증 정보 없음 - status={}", status);
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("인증이 필요합니다.");
        }
        
        // 권한 체크: ADMIN 또는 OPS 역할이 있어야 함
        boolean hasAdminRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOpsRole = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_OPS"));
        
        if (!hasAdminRole && !hasOpsRole) {
            log.warn("상태별 온보딩 요청 개수 조회: 권한 없음 - status={}, principal={}, authorities={}", 
                status, auth.getPrincipal(), auth.getAuthorities());
            throw new org.springframework.security.access.AccessDeniedException("접근 권한이 없습니다.");
        }
        
        log.debug("상태별 온보딩 요청 개수 조회: status={}, principal={}, authorities={}", 
            status, auth.getPrincipal(), auth.getAuthorities());
        
        long count;
        if (status != null) {
            count = onboardingService.countByStatus(status);
        } else {
            // 상태가 지정되지 않은 경우 전체 개수 조회 (추후 구현)
            count = onboardingService.countByStatus(OnboardingStatus.PENDING);
        }
        
        return success(count);
    }
    
    /**
     * 온보딩 승인 프로세스 재시도
     * POST /api/v1/onboarding/requests/{id}/retry
     * ON_HOLD 상태인 경우에만 재시도 가능
     * 프로시저 실패로 보류된 온보딩 요청을 다시 승인 프로세스 실행
     * 관리자 또는 OPS 역할만 접근 가능
     */
    @PostMapping("/requests/{id}/retry")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
    public ResponseEntity<ApiResponse<OnboardingRequest>> retryApproval(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        log.info("온보딩 승인 프로세스 재시도: id={}", id);
        
        String actorId = payload != null && payload.containsKey("actorId") 
            ? payload.get("actorId") 
            : "SYSTEM_RETRY";
        String note = payload != null && payload.containsKey("note") 
            ? payload.get("note") 
            : null;
        
        OnboardingRequest updated = onboardingService.retryApproval(id, actorId, note);
        
        log.info("✅ 온보딩 승인 프로세스 재시도 완료: id={}", id);
        return updated("온보딩 승인 프로세스가 재시도되었습니다.", updated);
    }
}

