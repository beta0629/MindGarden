package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.util.SocialProvider;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
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
@RequestMapping("/api/v1/clients/social-accounts") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class ClientSocialAccountController extends BaseApiController {

    private final UserSocialAccountRepository userSocialAccountRepository;

    /**
     * 소셜 계정 목록 조회
     */
    @GetMapping("/social-accounts")
    public ResponseEntity<ApiResponse<java.util.List<UserSocialAccount>>> getSocialAccounts(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        log.info("🔍 소셜 계정 조회: userId={}", currentUser.getId());
        
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = currentUser.getTenantId();
        }
        if (tenantId == null || tenantId.isEmpty()) {
            throw new org.springframework.security.access.AccessDeniedException("테넌트를 확인할 수 없습니다.");
        }

        // 사용자의 소셜 계정 목록 조회
        var socialAccounts = userSocialAccountRepository.findByTenantIdAndUserIdAndIsDeletedFalse(
            tenantId, currentUser.getId());
        
        log.info("✅ 소셜 계정 조회 완료: userId={}, count={}", currentUser.getId(), socialAccounts.size());
        
        return success(socialAccounts);
    }

    /**
     * 소셜 계정 연동 해제
     */
    @PostMapping("/social-account")
    public ResponseEntity<ApiResponse<Map<String, Object>>> manageSocialAccount(@RequestBody Map<String, Object> request, HttpSession session) {
        log.info("🔍 소셜 계정 관리 요청 시작: sessionId={}", session != null ? session.getId() : "null");
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 로그인된 사용자 정보가 없습니다 - 세션: {}", session != null ? session.getId() : "null");
            throw new org.springframework.security.access.AccessDeniedException("접근 권한이 없습니다.");
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
            throw new IllegalArgumentException("지원하지 않는 액션입니다: " + action);
        }
    }

    /**
     * 소셜 계정 연동 해제 처리
     */
    private ResponseEntity<ApiResponse<Map<String, Object>>> handleUnlinkSocialAccount(User currentUser, String provider, Long accountId) {
        UserSocialAccount socialAccount = null;

        String tenantId = currentUser.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            throw new org.springframework.security.access.AccessDeniedException("테넌트를 확인할 수 없습니다.");
        }

        final String providerKey = SocialProvider.normalize(provider);

        if (accountId != null) {
            // accountId + tenant (표준)
            var optional = userSocialAccountRepository.findByTenantIdAndId(tenantId, accountId);
            if (optional.isPresent()) {
                socialAccount = optional.get();
                if (!socialAccount.getUser().getId().equals(currentUser.getId())) {
                    log.error("❌ 다른 사용자의 소셜 계정에 접근 시도: userId={}, accountId={}",
                        currentUser.getId(), accountId);
                    throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
                }
            } else {
                // 프로필 GET(/profile/social-accounts)은 userId만 필터하므로, 행의 tenant_id가 비어 있거나
                // 세션 tenant와 불일치해도 목록에는 나올 수 있음 → PK + 소유자만 검증해 해제 허용
                var byId = userSocialAccountRepository.findById(accountId);
                if (byId.isPresent()) {
                    UserSocialAccount candidate = byId.get();
                    if (candidate.getUser() != null
                        && candidate.getUser().getId().equals(currentUser.getId())
                        && !Boolean.TRUE.equals(candidate.getIsDeleted())) {
                        socialAccount = candidate;
                        log.info("🔧 소셜 계정 해제: tenant PK 조회 실패 후 id+소유자로 매칭 accountId={}", accountId);
                    }
                }
            }
        }
        if (socialAccount == null && providerKey != null) {
            // accountId 미전달 또는 위 조회 실패 시 provider로 재시도 (else-if 금지: accountId 경로 실패 후에도 실행)
            var optional = userSocialAccountRepository.findByTenantIdAndUserAndProviderAndIsDeletedFalse(
                tenantId, currentUser, providerKey);
            if (optional.isPresent()) {
                socialAccount = optional.get();
            }
        }
        if (socialAccount == null && providerKey != null) {
            // tenant_id 불일치·NULL 행: 소유자 + provider만으로 조회 (프로필 GET과 동일하게 목록에 보이는 행 해제)
            var optional = userSocialAccountRepository.findActiveByUserIdAndProvider(currentUser.getId(), providerKey);
            if (optional.isPresent()) {
                socialAccount = optional.get();
                log.info("🔧 소셜 계정 해제: findActiveByUserIdAndProvider로 매칭 provider={}", providerKey);
            }
        }

        if (socialAccount == null) {
            log.error("❌ 소셜 계정을 찾을 수 없음: userId={}, provider={}, accountId={}", 
                currentUser.getId(), provider, accountId);
            throw new RuntimeException("소셜 계정을 찾을 수 없습니다.");
        }

        // 소셜 계정 삭제 (soft delete)
        socialAccount.setIsDeleted(true);
        socialAccount.setDeletedAt(java.time.LocalDateTime.now());
        userSocialAccountRepository.save(socialAccount);

        log.info("✅ 소셜 계정 연동 해제 완료: userId={}, provider={}, accountId={}", 
            currentUser.getId(), provider, accountId);

        Map<String, Object> data = new HashMap<>();
        data.put("provider", provider);

        return success("소셜 계정 연동이 해제되었습니다.", data);
    }
}
