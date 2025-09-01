package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSocialAccount;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final UserSocialAccountRepository userSocialAccountRepository;
    
    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user != null) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            
            // 이름과 닉네임 복호화
            String decryptedName = null;
            String decryptedNickname = null;
            
            try {
                if (user.getName() != null && !user.getName().trim().isEmpty()) {
                    decryptedName = encryptionUtil.safeDecrypt(user.getName());
                }
                if (user.getNickname() != null && !user.getNickname().trim().isEmpty()) {
                    decryptedNickname = encryptionUtil.safeDecrypt(user.getNickname());
                }
            } catch (Exception e) {
                log.warn("사용자 정보 복호화 실패: {}", e.getMessage());
                decryptedName = user.getName();
                decryptedNickname = user.getNickname();
            }
            
            userInfo.put("name", decryptedName);
            userInfo.put("nickname", decryptedNickname);
            userInfo.put("role", user.getRole());
            
            // 소셜 계정 정보 조회하여 이미지 타입 구분
            List<UserSocialAccount> socialAccounts = userSocialAccountRepository.findByUserIdAndIsDeletedFalse(user.getId());
            
            // 프로필 이미지 우선순위: 사용자 업로드 > 소셜 > 기본 아이콘
            String profileImageUrl = null;
            String socialProfileImage = null;
            String socialProvider = null;
            
            if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().trim().isEmpty()) {
                // 사용자가 직접 업로드한 이미지가 있는 경우
                profileImageUrl = user.getProfileImageUrl();
            } else if (!socialAccounts.isEmpty()) {
                // 소셜 계정이 있는 경우, 첫 번째 소셜 계정의 이미지 사용
                UserSocialAccount primarySocialAccount = socialAccounts.stream()
                    .filter(account -> account.getIsPrimary() != null && account.getIsPrimary())
                    .findFirst()
                    .orElse(socialAccounts.get(0));
                
                socialProfileImage = primarySocialAccount.getProviderProfileImage();
                socialProvider = primarySocialAccount.getProvider();
            }
            
            userInfo.put("profileImageUrl", profileImageUrl);
            userInfo.put("socialProfileImage", socialProfileImage);
            userInfo.put("socialProvider", socialProvider);
            
            return ResponseEntity.ok(userInfo);
        }
        return ResponseEntity.status(401).build();
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        SessionUtils.clearSession(session);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/session-info")
    public ResponseEntity<?> getSessionInfo(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user != null) {
            Map<String, Object> sessionInfo = new HashMap<>();
            sessionInfo.put("id", user.getId());
            sessionInfo.put("email", user.getEmail());
            sessionInfo.put("name", user.getName());
            sessionInfo.put("role", user.getRole());
            sessionInfo.put("sessionId", session.getId());
            
            return ResponseEntity.ok(sessionInfo);
        }
        return ResponseEntity.status(401).build();
    }
    
    // 임시 테스트용 로그인 엔드포인트 (개발 환경에서만 사용)
    @PostMapping("/test-login")
    public ResponseEntity<?> testLogin(HttpSession session) {
        try {
            // 테스트용 사용자 정보 생성
            User testUser = new User();
            testUser.setId(1L);
            testUser.setEmail("test@example.com");
            testUser.setName("테스트 사용자");
            testUser.setNickname("테스트");
            testUser.setRole("CLIENT");
            testUser.setProfileImageUrl("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjIwIiBmaWxsPSIjOUI5QkEwIi8+CjxyZWN0IHg9IjQ1IiB5PSI5MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=");
            
            // 세션에 사용자 정보 저장
            SessionUtils.setCurrentUser(session, testUser);
            
            log.info("테스트 로그인 성공: 사용자 ID {}", testUser.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "테스트 로그인 성공");
            
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", testUser.getId());
            userInfo.put("email", testUser.getEmail());
            userInfo.put("name", testUser.getName());
            userInfo.put("nickname", testUser.getNickname());
            userInfo.put("role", testUser.getRole());
            userInfo.put("profileImageUrl", testUser.getProfileImageUrl());
            response.put("user", userInfo);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("테스트 로그인 실패", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "테스트 로그인 실패: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
