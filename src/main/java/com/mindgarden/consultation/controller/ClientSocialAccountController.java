package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSocialAccount;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    /**
     * 소셜 계정 연동 해제
     */
    @PostMapping("/social-account")
    public ResponseEntity<?> manageSocialAccount(@RequestBody Map<String, Object> request, HttpSession session) {
        try {
            log.info("🔍 소셜 계정 관리 요청 시작: sessionId={}", session != null ? session.getId() : "null");
            
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다 - 세션: {}", session != null ? session.getId() : "null");
                return ResponseEntity.status(401)
                    .body(Map.of(
                        "success", false,
                        "message", "접근 권한이 없습니다.",
                        "redirectToLogin", true,
                        "timestamp", System.currentTimeMillis()
                    ));
            }
            
            log.info("✅ 사용자 인증 확인: userId={}, email={}", currentUser.getId(), currentUser.getEmail());

            String action = (String) request.get("action");
            String provider = (String) request.get("provider");
            Long accountId = null;
            
            // accountId가 숫자로 전달된 경우
            Object accountIdObj = request.get("accountId");
            if (accountIdObj != null) {
                if (accountIdObj instanceof Number) {
                    accountId = ((Number) accountIdObj).longValue();
                } else if (accountIdObj instanceof String) {
                    accountId = Long.parseLong((String) accountIdObj);
                }
            }

            log.info("🔧 소셜 계정 관리 요청: userId={}, action={}, provider={}, accountId={}", 
                currentUser.getId(), action, provider, accountId);

            if ("UNLINK".equals(action)) {
                return handleUnlinkSocialAccount(currentUser, provider, accountId);
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "지원하지 않는 액션입니다: " + action));
            }

        } catch (Exception e) {
            log.error("❌ 소셜 계정 관리 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "소셜 계정 관리에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 소셜 계정 연동 해제 처리
     */
    private ResponseEntity<?> handleUnlinkSocialAccount(User currentUser, String provider, Long accountId) {
        try {
            UserSocialAccount socialAccount = null;

            if (accountId != null) {
                // accountId로 직접 조회
                var optional = userSocialAccountRepository.findById(accountId);
                if (optional.isPresent()) {
                    socialAccount = optional.get();
                    // 본인의 계정인지 확인
                    if (!socialAccount.getUser().getId().equals(currentUser.getId())) {
                        log.error("❌ 다른 사용자의 소셜 계정에 접근 시도: userId={}, accountId={}", 
                            currentUser.getId(), accountId);
                        return ResponseEntity.status(403)
                            .body(Map.of("error", "권한이 없습니다."));
                    }
                }
            } else if (provider != null) {
                // provider로 조회 - 사용자 객체로 조회
                var optional = userSocialAccountRepository.findByUserAndProviderAndIsDeletedFalse(
                    currentUser, provider);
                if (optional.isPresent()) {
                    socialAccount = optional.get();
                }
            }

            if (socialAccount == null) {
                log.error("❌ 소셜 계정을 찾을 수 없음: userId={}, provider={}, accountId={}", 
                    currentUser.getId(), provider, accountId);
                return ResponseEntity.notFound().build();
            }

            // 소셜 계정 삭제 (soft delete)
            socialAccount.setIsDeleted(true);
            socialAccount.setDeletedAt(java.time.LocalDateTime.now());
            userSocialAccountRepository.save(socialAccount);

            log.info("✅ 소셜 계정 연동 해제 완료: userId={}, provider={}, accountId={}", 
                currentUser.getId(), provider, accountId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "소셜 계정 연동이 해제되었습니다.",
                "provider", provider
            ));

        } catch (Exception e) {
            log.error("❌ 소셜 계정 연동 해제 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "소셜 계정 연동 해제에 실패했습니다: " + e.getMessage()));
        }
    }
}
