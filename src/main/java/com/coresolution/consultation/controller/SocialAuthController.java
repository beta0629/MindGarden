package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.SocialSignupRequest;
import com.coresolution.consultation.dto.SocialSignupResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.SocialAuthService;
import com.coresolution.consultation.util.SessionManager;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public ResponseEntity<SocialSignupResponse> socialSignup(@RequestBody SocialSignupRequest request, HttpSession session) {
        log.info("소셜 회원가입 요청: {}", request.getEmail());
        
        try {
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
            
        } catch (Exception e) {
            log.error("소셜 회원가입 처리 중 오류 발생", e);
            SocialSignupResponse errorResponse = SocialSignupResponse.builder()
                .success(false)
                .message("회원가입 처리 중 오류가 발생했습니다: " + e.getMessage())
                .build();
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
