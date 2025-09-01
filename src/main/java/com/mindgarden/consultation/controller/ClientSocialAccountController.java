package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 클라이언트 소셜 계정 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/client")
@RequiredArgsConstructor
public class ClientSocialAccountController {

    private final UserRepository userRepository;
    private final UserSocialAccountRepository userSocialAccountRepository;

    /**
     * 소셜 계정 목록 조회
     */
    @GetMapping("/social-accounts")
    public ResponseEntity<?> getSocialAccounts(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }
            
            log.info("🔍 소셜 계정 조회: userId={}", currentUser.getId());
            
            // 사용자의 소셜 계정 목록 조회
            var socialAccounts = userSocialAccountRepository.findByUserIdAndIsDeletedFalse(currentUser.getId());
            
            log.info("✅ 소셜 계정 조회 완료: userId={}, count={}", currentUser.getId(), socialAccounts.size());
            
            return ResponseEntity.ok(socialAccounts);
            
        } catch (Exception e) {
            log.error("❌ 소셜 계정 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "소셜 계정 조회에 실패했습니다: " + e.getMessage()));
        }
    }
}
