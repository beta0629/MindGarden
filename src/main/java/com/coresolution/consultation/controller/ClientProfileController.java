package com.coresolution.consultation.controller;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.dto.MyPageEmailChangeRequest;
import com.coresolution.consultation.dto.MyPagePhoneChangeRequest;
import com.coresolution.consultation.dto.MyPageResponse;
import com.coresolution.consultation.dto.MyPageUpdateRequest;
import com.coresolution.consultation.dto.ProfileImageInfo;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.EmailOtpVerificationService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.MyPageService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/clients/profile") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class ClientProfileController extends BaseApiController {

    private final MyPageService myPageService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final EmailOtpVerificationService emailOtpVerificationService;
    private final EmailService emailService;

    @GetMapping
    public ResponseEntity<MyPageResponse> getMyProfile(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.error("❌ 로그인된 사용자 정보가 없습니다");
                return ResponseEntity.status(401).build();
            }
            
            log.info("🔍 클라이언트 프로필 조회: userId={}, userId={}", currentUser.getId(), currentUser.getUserId());
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
            
            log.info("🔧 클라이언트 프로필 수정: userId={}, userId={}", currentUser.getId(), currentUser.getUserId());
            MyPageResponse response = myPageService.updateMyPageInfo(currentUser.getId(), request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 클라이언트 프로필 수정 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 마이페이지 휴대전화 변경(Phase A) — SMS OTP 검증 + 정규화 + tenant 내 unique 가드 + AuditLog.
     *
     * <p>흐름:
     * <ol>
     *   <li>FE 가 {@code POST /api/v1/auth/sms/send} 로 새 휴대폰 번호 OTP 발송 요청</li>
     *   <li>사용자가 입력한 6자리 코드와 새 번호를 본 엔드포인트로 전송</li>
     *   <li>BE 가 OTP 단일 사용·5분 TTL · tenant 내 중복 · 정규화 검증 후 암호화 저장</li>
     * </ol></p>
     *
     * @param session HTTP 세션 (본인 식별)
     * @param request 새 휴대폰 번호 + 6자리 OTP
     * @return 갱신된 마이페이지 응답 (성공 시 200)
     */
    @PostMapping("/phone/change")
    public ResponseEntity<MyPageResponse> changePhone(
            HttpSession session,
            @Valid @RequestBody MyPagePhoneChangeRequest request) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 로그인된 사용자 정보가 없습니다 (phone/change)");
            return ResponseEntity.status(401).build();
        }

        log.info("🔧 마이페이지 휴대전화 변경 요청: userId={}", currentUser.getId());
        MyPageResponse response = myPageService.changePhone(currentUser.getId(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * 이메일 변경(Phase B) 1단계 — 새 이메일로 6자리 OTP 발송.
     *
     * <p>본 엔드포인트는 {@link EmailOtpVerificationService#storeCode(String, String)} 에 5분
     * TTL · 단일 사용 정책으로 코드를 저장한 뒤 {@link EmailService#sendEmail} 로 사용자에게
     * 평문 이메일을 보낸다. 같은 이메일로 재요청 시 직전 코드는 덮어쓴다. 동일 이메일을 다른
     * 사용자가 이미 보유 중이라도 본 단계에서는 차단하지 않는다 — 실제 변경({@code /email/change})
     * 시점에 tenant 내 중복 검사가 수행된다.</p>
     *
     * @param session HTTP 세션 (본인 식별)
     * @param request 새 이메일
     * @return 200 응답 (성공 메시지 포함)
     */
    @PostMapping("/email/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendEmailOtp(
            HttpSession session,
            @Valid @RequestBody EmailOtpSendRequest request) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 로그인된 사용자 정보가 없습니다 (email/send-otp)");
            return ResponseEntity.status(401).build();
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        emailOtpVerificationService.storeCode(normalizedEmail, code);

        String subject = "[MindGarden] 이메일 변경 인증 코드";
        String content = "마이페이지 이메일 변경을 위한 인증 코드는 [" + code + "] 입니다.\n"
                + "본 코드는 발급 후 5분 이내에 한 번만 사용할 수 있습니다.\n"
                + "본인이 요청하지 않았다면 즉시 비밀번호를 변경하고 고객센터로 문의해 주세요.";
        EmailRequest emailRequest = EmailRequest.builder()
                .toEmail(normalizedEmail)
                .toName(currentUser.getName())
                .subject(subject)
                .content(content)
                .type("TEXT")
                .build();
        try {
            emailService.sendEmail(emailRequest);
            log.info("✅ 이메일 변경 OTP 발송 완료: userId={}, email={}",
                    currentUser.getId(), EmailLogMasking.maskForLog(normalizedEmail));
        } catch (Exception e) {
            log.error("❌ 이메일 변경 OTP 발송 실패: userId={}, email={}, error={}",
                    currentUser.getId(), EmailLogMasking.maskForLog(normalizedEmail), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }

        return success(null);
    }

    /**
     * 이메일 변경(Phase B) 2단계 — OTP 검증 + tenant 내 unique + AuditLog + 세션/JWT 강제 만료.
     *
     * <p>성공 시 즉시 다음 조치를 수행한다 (사용자 키 변경 보안 요건):
     * <ol>
     *   <li>{@code MyPageService#changeEmail} 내부에서 모든 refresh token 회수</li>
     *   <li>{@link SecurityContextHolder#clearContext()}</li>
     *   <li>{@link HttpSession#invalidate()}</li>
     * </ol>
     * FE 는 200 응답을 받자마자 사용자에게 재로그인을 요구해야 한다.</p>
     *
     * @param session HTTP 세션 (본인 식별)
     * @param request 새 이메일 + 6자리 OTP
     * @return 갱신된 마이페이지 응답 (성공 시 200)
     */
    @PostMapping("/email/change")
    public ResponseEntity<MyPageResponse> changeEmail(
            HttpSession session,
            @Valid @RequestBody MyPageEmailChangeRequest request) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 로그인된 사용자 정보가 없습니다 (email/change)");
            return ResponseEntity.status(401).build();
        }

        log.info("🔧 마이페이지 이메일 변경 요청: userId={}", currentUser.getId());
        MyPageResponse response = myPageService.changeEmail(currentUser.getId(), request);

        SecurityContextHolder.clearContext();
        try {
            session.invalidate();
        } catch (IllegalStateException ignored) {
            // 이미 무효화된 세션 — 안전 무시
        }
        log.info("🔒 이메일 변경 후 세션·SecurityContext 강제 만료: userId={}", currentUser.getId());

        return ResponseEntity.ok(response);
    }

    /**
     * {@code POST /email/send-otp} 요청 본문 — 새 이메일만 받는다.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailOtpSendRequest {

        @NotBlank(message = "새 이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;
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
            
            log.info("🔧 클라이언트 비밀번호 변경: userId={}, userId={}", currentUser.getId(), currentUser.getUserId());
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
            
            log.info("🖼️ 클라이언트 프로필 이미지 조회: userId={}, userId={}", currentUser.getId(), currentUser.getUserId());
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
        
        log.info("🔍 소셜 계정 조회: userId={}, userId={}", currentUser.getId(), currentUser.getUserId());
        
        // 사용자의 소셜 계정 목록 조회
        var socialAccounts = userSocialAccountRepository.findByUserIdAndIsDeletedFalse(currentUser.getId());
        
        log.info("✅ 소셜 계정 조회 완료: userId={}, count={}", currentUser.getId(), socialAccounts.size());
        
        return success(socialAccounts);
    }
}
