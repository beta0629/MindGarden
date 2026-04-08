package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.SocialSignupRequest;
import com.coresolution.consultation.dto.SocialSignupResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.SocialAuthService;
import com.coresolution.consultation.util.SessionManager;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.security.PasswordService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 소셜 인증 관련 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth/social") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class SocialAuthController {

    private final SocialAuthService socialAuthService;
    private final SessionManager sessionManager;
    private final UserRepository userRepository;
    private final UserSocialAccountRepository userSocialAccountRepository;

    /**
     * 소셜 회원가입
     * 
     * @param request 소셜 회원가입 요청
     * @return 회원가입 결과
     */
    @PostMapping("/signup")
    public ResponseEntity<SocialSignupResponse> socialSignup(
            @RequestBody SocialSignupRequest request,
            @RequestParam(required = false) String tenantId,
            HttpSession session) {
        log.info("소셜 회원가입 요청: email={}, tenantId={}", request.getEmail(), tenantId);
        
        try {
            // 서브도메인에서 추출한 tenantId가 있으면 TenantContext에 설정
            if (tenantId != null && !tenantId.isEmpty()) {
                com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);
                log.info("✅ 서브도메인에서 추출한 tenantId 사용: tenantId={}", tenantId);
            }
            
            // 세션에서 현재 사용자의 지점 정보 가져오기 (관리자가 등록하는 경우)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser != null && currentUser.getBranch() != null) {
                // 관리자가 지점에 소속되어 있으면 자동으로 지점코드 설정
                if (request.getBranchCode() == null || request.getBranchCode().trim().isEmpty()) {
                    request.setBranchCode(currentUser.getBranch().getBranchCode());
                    log.info("🔧 세션에서 지점코드 자동 설정: branchCode={}", request.getBranchCode());
                }
            }
            
            SocialSignupResponse response = socialAuthService.createUserFromSocial(request);
            
            if (response.isSuccess()) {
                log.info("소셜 회원가입 성공: {}", response.getMessage());
                // 성공 시 리다이렉트 URL을 포함한 응답
                return ResponseEntity.ok(response);
            } else {
                log.error("소셜 회원가입 실패: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }

        } catch (PasswordService.InvalidPasswordException e) {
            log.warn("소셜 회원가입 비밀번호 정책 위반: {}", e.getMessage());
            return ResponseEntity.badRequest().body(SocialSignupResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        } catch (ConstraintViolationException e) {
            String msg = e.getConstraintViolations().stream()
                    .map(ConstraintViolation::getMessage)
                    .findFirst()
                    .orElse("입력 정보를 확인 후 다시 시도해주세요.");
            log.warn("소셜 회원가입 입력 검증 실패: {}", msg);
            return ResponseEntity.badRequest().body(SocialSignupResponse.builder()
                    .success(false)
                    .message(msg)
                    .build());
        } catch (Exception e) {
            ConstraintViolationException wrapped = findConstraintViolationCause(e);
            if (wrapped != null) {
                String msg = wrapped.getConstraintViolations().stream()
                        .map(ConstraintViolation::getMessage)
                        .findFirst()
                        .orElse("입력 정보를 확인 후 다시 시도해주세요.");
                log.warn("소셜 회원가입 입력 검증 실패(래핑): {}", msg);
                return ResponseEntity.badRequest().body(SocialSignupResponse.builder()
                        .success(false)
                        .message(msg)
                        .build());
            }
            log.error("소셜 회원가입 처리 중 오류 발생", e);
            SocialSignupResponse errorResponse = SocialSignupResponse.builder()
                .success(false)
                .message("회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
                .build();
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    private static ConstraintViolationException findConstraintViolationCause(Throwable t) {
        while (t != null) {
            if (t instanceof ConstraintViolationException cve) {
                return cve;
            }
            t = t.getCause();
        }
        return null;
    }
}
