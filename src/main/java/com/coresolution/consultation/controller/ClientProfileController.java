package com.coresolution.consultation.controller;

import java.util.List;
import com.coresolution.consultation.dto.MyPageResponse;
import com.coresolution.consultation.dto.MyPageUpdateRequest;
import com.coresolution.consultation.dto.ProfileImageInfo;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.MyPageService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({"/api/v1/clients/profile", "/api/client/profile"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class ClientProfileController extends BaseApiController {

    private final MyPageService myPageService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final UserSocialAccountRepository userSocialAccountRepository;

    @GetMapping
    public ResponseEntity<MyPageResponse> getMyProfile(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }
            
            log.info("🔍 클라이언트 프로필 조회: userId={}, username={}", currentUser.getId(), currentUser.getUsername());
            MyPageResponse response = myPageService.getMyPageInfo(currentUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 클라이언트 프로필 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping
    public ResponseEntity<MyPageResponse> updateMyProfile(
            HttpSession session,
            @RequestBody MyPageUpdateRequest request) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }
            
            log.info("🔧 클라이언트 프로필 수정: userId={}, username={}", currentUser.getId(), currentUser.getUsername());
            MyPageResponse response = myPageService.updateMyPageInfo(currentUser.getId(), request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 클라이언트 프로필 수정 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/password")
    public ResponseEntity<String> changePassword(
            HttpSession session,
            @RequestBody String newPassword) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }
            
            log.info("🔧 클라이언트 비밀번호 변경: userId={}, username={}", currentUser.getId(), currentUser.getUsername());
            myPageService.changePassword(currentUser.getId(), newPassword);
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            log.error("❌ 클라이언트 비밀번호 변경 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("비밀번호 변경에 실패했습니다.");
        }
    }

    @GetMapping("/image")
    public ResponseEntity<ProfileImageInfo> getProfileImage(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }
            
            log.info("🖼️ 클라이언트 프로필 이미지 조회: userId={}, username={}", currentUser.getId(), currentUser.getUsername());
            ProfileImageInfo profileImageInfo = userService.getProfileImageInfo(currentUser.getId());
            return ResponseEntity.ok(profileImageInfo);
        } catch (Exception e) {
            log.error("❌ 클라이언트 프로필 이미지 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 소셜 계정 목록 조회 (프로필 하위 경로)
     */
    @GetMapping("/social-accounts")
    public ResponseEntity<ApiResponse<List<com.coresolution.consultation.entity.UserSocialAccount>>> getSocialAccounts(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        log.info("🔍 소셜 계정 조회: userId={}, username={}", currentUser.getId(), currentUser.getUsername());
        
        // 사용자의 소셜 계정 목록 조회
        var socialAccounts = userSocialAccountRepository.findByUserIdAndIsDeletedFalse(currentUser.getId());
        
        log.info("✅ 소셜 계정 조회 완료: userId={}, count={}", currentUser.getId(), socialAccounts.size());
        
        return success(socialAccounts);
    }
}
