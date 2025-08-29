package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.MyPageResponse;
import com.mindgarden.consultation.dto.MyPageUpdateRequest;
import com.mindgarden.consultation.dto.ProfileImageInfo;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.MyPageService;
import com.mindgarden.consultation.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/client/profile")
@RequiredArgsConstructor
public class ClientProfileController {

    private final MyPageService myPageService;
    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<MyPageResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // TODO: 운영 환경에서는 인증 필수
            // 개발 환경에서는 임시로 하드코딩된 사용자 ID 사용
            Long userId = 23L; // 임시 사용자 ID
            
            if (userDetails != null) {
                log.info("🔍 클라이언트 프로필 조회: {}", userDetails.getUsername());
                User user = userRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
                userId = user.getId();
            } else {
                log.warn("⚠️ 인증 정보가 없어 임시 사용자 ID 사용: {}", userId);
            }
            
            MyPageResponse response = myPageService.getMyPageInfo(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 클라이언트 프로필 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping
    public ResponseEntity<MyPageResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody MyPageUpdateRequest request) {
        try {
            log.info("🔧 클라이언트 프로필 수정: {}", userDetails.getUsername());
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
            MyPageResponse response = myPageService.updateMyPageInfo(user.getId(), request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 클라이언트 프로필 수정 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/password")
    public ResponseEntity<String> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody String newPassword) {
        try {
            log.info("🔧 클라이언트 비밀번호 변경: {}", userDetails.getUsername());
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
            myPageService.changePassword(user.getId(), newPassword);
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            log.error("❌ 클라이언트 비밀번호 변경 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("비밀번호 변경에 실패했습니다.");
        }
    }

    @GetMapping("/image")
    public ResponseEntity<ProfileImageInfo> getProfileImage(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("🖼️ 클라이언트 프로필 이미지 조회: {}", userDetails.getUsername());
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
            ProfileImageInfo profileImageInfo = userService.getProfileImageInfo(user.getId());
            return ResponseEntity.ok(profileImageInfo);
        } catch (Exception e) {
            log.error("❌ 클라이언트 프로필 이미지 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
