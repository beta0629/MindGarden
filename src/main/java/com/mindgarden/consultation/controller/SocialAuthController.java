package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.SocialSignupRequest;
import com.mindgarden.consultation.dto.SocialSignupResponse;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.service.SocialAuthService;
import com.mindgarden.consultation.util.SessionManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
@RequestMapping("/api/auth/social")
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
    public ResponseEntity<SocialSignupResponse> socialSignup(@RequestBody SocialSignupRequest request) {
        log.info("소셜 회원가입 요청: {}", request.getEmail());
        
        try {
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
