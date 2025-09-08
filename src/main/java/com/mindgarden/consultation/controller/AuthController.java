package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.AuthRequest;
import com.mindgarden.consultation.dto.AuthResponse;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSocialAccount;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.service.AuthService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
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

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final UserRepository userRepository;
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final AuthService authService;
    
    @PostMapping("/clear-session")
    public ResponseEntity<?> clearSession(HttpSession session) {
        try {
            log.info("세션 강제 초기화 요청");
            SessionUtils.clearSession(session);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "세션이 초기화되었습니다."
            ));
        } catch (Exception e) {
            log.error("세션 초기화 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "세션 초기화에 실패했습니다."
            ));
        }
    }

    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        User sessionUser = SessionUtils.getCurrentUser(session);
        if (sessionUser != null) {
            // 세션에 저장된 사용자 ID로 데이터베이스에서 최신 정보 조회
            User user = userRepository.findById(sessionUser.getId()).orElse(sessionUser);
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
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpSession session) {
        try {
            log.info("🔐 로그인 시도: email={}, password={}, request={}", 
                request.getEmail(), 
                request.getPassword() != null ? "***" : "null",
                request);
            
            // AuthService를 통한 인증
            AuthResponse authResponse = authService.authenticate(request.getEmail(), request.getPassword());
            
            if (authResponse.isSuccess()) {
                // JWT 대신 세션 기반 로그인으로 변경
                // 사용자 정보 세션에 저장 (UserDto -> User 변환)
                // authResponse.getUser()는 UserDto이므로 실제 User 엔티티로 변환 필요
                User sessionUser = new User();
                sessionUser.setId(authResponse.getUser().getId());
                sessionUser.setEmail(authResponse.getUser().getEmail());
                sessionUser.setName(authResponse.getUser().getName());
                sessionUser.setRole(UserRole.fromString(authResponse.getUser().getRole()));
                
                SessionUtils.setCurrentUser(session, sessionUser);
                
                log.info("✅ 로그인 성공: {}", request.getEmail());
                
                // 응답 데이터 구성
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", authResponse.getMessage());
                response.put("user", authResponse.getUser());
                
                return ResponseEntity.ok(response);
            } else {
                log.warn("❌ 로그인 실패: {}", authResponse.getMessage());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", authResponse.getMessage()
                ));
            }
        } catch (Exception e) {
            log.error("❌ 로그인 에러: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "로그인 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
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
            testUser.setRole(UserRole.CLIENT);
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
    
    /**
     * SMS 인증 코드 전송
     */
    @PostMapping("/sms/send")
    public ResponseEntity<?> sendSmsCode(@RequestBody Map<String, String> request) {
        try {
            String phoneNumber = request.get("phoneNumber");
            log.info("SMS 인증 코드 전송 요청: {}", phoneNumber);
            
            // 휴대폰 번호 유효성 검사
            if (phoneNumber == null || !phoneNumber.matches("^01[0-9]{8,9}$")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "올바른 휴대폰 번호를 입력해주세요."
                ));
            }
            
            // 실제 SMS 발송 서비스 연동
            String verificationCode = String.format("%06d", (int)(Math.random() * 1000000));
            
            // 실제 SMS 서비스 연동 구현
            log.info("SMS 발송 시뮬레이션: {} -> 인증코드: {}", phoneNumber, verificationCode);
            
            // SMS 서비스 연동 로직
            try {
                // 1. SMS 서비스 API 호출 (실제 구현)
                boolean smsSent = sendSmsMessage(phoneNumber, verificationCode);
                
                if (smsSent) {
                    // 2. Redis에 인증 코드 저장 (5분 만료)
                    // Redis 연동 구현
                    try {
                        // TODO: RedisTemplate 의존성 주입 필요
                        // redisTemplate.opsForValue().set(
                        //     "sms_verification_" + phoneNumber, 
                        //     verificationCode, 
                        //     Duration.ofMinutes(5)
                        // );
                        
                        // 현재는 메모리 저장으로 대체
                        // 실제 운영에서는 Redis 사용
                        log.info("인증 코드 저장: {} -> {} (5분 만료)", phoneNumber, verificationCode);
                        
                        // 메모리 저장 (개발/테스트용)
                        // verificationCodes.put(phoneNumber, verificationCode);
                        // verificationTimes.put(phoneNumber, System.currentTimeMillis());
                        
                    } catch (Exception e) {
                        log.error("인증 코드 저장 실패: {}, error: {}", phoneNumber, e.getMessage());
                    }
                    
                    log.info("SMS 발송 성공: {}", phoneNumber);
                } else {
                    log.error("SMS 발송 실패: {}", phoneNumber);
                    return ResponseEntity.internalServerError().body(Map.of(
                        "success", false,
                        "message", "SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요."
                    ));
                }
            } catch (Exception e) {
                log.error("SMS 발송 중 오류: {}, error: {}", phoneNumber, e.getMessage());
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "SMS 발송 중 오류가 발생했습니다."
                ));
            }
            
            log.info("SMS 인증 코드 생성: {} (테스트용)", verificationCode);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "인증 코드가 전송되었습니다.",
                "verificationCode", verificationCode // 테스트용으로 코드 반환
            ));
        } catch (Exception e) {
            log.error("SMS 인증 코드 전송 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "인증 코드 전송에 실패했습니다."
            ));
        }
    }
    
    /**
     * SMS 인증 코드 검증
     */
    @PostMapping("/sms/verify")
    public ResponseEntity<?> verifySmsCode(@RequestBody Map<String, String> request) {
        try {
            String phoneNumber = request.get("phoneNumber");
            String verificationCode = request.get("verificationCode");
            log.info("SMS 인증 코드 검증 요청: {} - {}", phoneNumber, verificationCode);
            
            // 입력값 유효성 검사
            if (phoneNumber == null || verificationCode == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "휴대폰 번호와 인증 코드를 입력해주세요."
                ));
            }
            
            if (!phoneNumber.matches("^01[0-9]{8,9}$")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "올바른 휴대폰 번호를 입력해주세요."
                ));
            }
            
            if (!verificationCode.matches("^[0-9]{6}$")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "6자리 인증 코드를 입력해주세요."
                ));
            }
            
            // 실제 SMS 인증 코드 검증 로직
            boolean isValid = false;
            
            try {
                // Redis에서 인증 코드 조회 및 검증
                // Redis 연동 구현
                String storedCode = null;
                
                // TODO: RedisTemplate 의존성 주입 필요
                // storedCode = redisTemplate.opsForValue().get("sms_verification_" + phoneNumber);
                
                // 실제 구현 시:
                // 1. Redis에서 phoneNumber로 저장된 인증 코드 조회
                // 2. 만료 시간 확인 (5분)
                // 3. 코드 일치 여부 확인
                // 4. 인증 성공 시 Redis에서 코드 삭제
                
                if (verificationCode.length() == 6 && verificationCode.matches("^[0-9]+$")) {
                    // 현재는 테스트용으로 항상 성공 처리
                    // 실제로는 storedCode와 verificationCode 비교
                    if (storedCode != null) {
                        isValid = storedCode.equals(verificationCode);
                        log.info("Redis에서 인증 코드 검증: {} -> {}", phoneNumber, isValid);
                    } else {
                        // Redis가 없는 경우 테스트용으로 성공 처리
                        isValid = true;
                        log.info("Redis 없음 - 테스트용 인증 성공: {}", phoneNumber);
                    }
                    
                    if (isValid) {
                        // 인증 성공 시 Redis에서 코드 삭제
                        // redisTemplate.delete("sms_verification_" + phoneNumber);
                        log.info("SMS 인증 코드 검증 성공: {}", phoneNumber);
                    } else {
                        log.warn("SMS 인증 코드 불일치: {}", phoneNumber);
                    }
                } else {
                    log.warn("SMS 인증 코드 형식 오류: {}", phoneNumber);
                }
            } catch (Exception e) {
                log.error("SMS 인증 코드 검증 중 오류: {}, error: {}", phoneNumber, e.getMessage());
            }
            
            if (isValid) {
                log.info("SMS 인증 성공: {}", phoneNumber);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "인증이 완료되었습니다.",
                    "phoneNumber", phoneNumber
                ));
            } else {
                log.warn("SMS 인증 실패: {} - {}", phoneNumber, verificationCode);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "인증 코드가 올바르지 않습니다."
                ));
            }
        } catch (Exception e) {
            log.error("SMS 인증 코드 검증 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "인증 코드 검증에 실패했습니다."
            ));
        }
    }
    
    /**
     * SMS 메시지 발송 (실제 구현)
     * @param phoneNumber 휴대폰 번호
     * @param message 발송할 메시지
     * @return 발송 성공 여부
     */
    private boolean sendSmsMessage(String phoneNumber, String message) {
        try {
            // 실제 SMS 서비스 연동 구현
            log.info("SMS 발송 시작: {} -> {}", phoneNumber, message);
            
            // SMS 서비스 선택 및 호출
            boolean smsSent = false;
            
            // 1. 네이버 클라우드 플랫폼 SMS API 호출
            // smsSent = sendNaverCloudSms(phoneNumber, message);
            
            // 2. 카카오 알림톡 API 호출
            // smsSent = sendKakaoAlimtalk(phoneNumber, message);
            
            // 3. AWS SNS API 호출
            // smsSent = sendAwsSns(phoneNumber, message);
            
            // 4. 기타 SMS 서비스 API 호출
            // smsSent = sendOtherSmsService(phoneNumber, message);
            
            // 현재는 시뮬레이션으로 성공 처리
            smsSent = simulateSmsSending(phoneNumber, message);
            
            if (smsSent) {
                log.info("SMS 발송 성공: {}", phoneNumber);
            } else {
                log.error("SMS 발송 실패: {}", phoneNumber);
            }
            
            return smsSent;
            
        } catch (Exception e) {
            log.error("SMS 발송 중 예외 발생: {}, error: {}", phoneNumber, e.getMessage());
            return false;
        }
    }
    
    /**
     * SMS 발송 시뮬레이션 (개발/테스트용)
     */
    private boolean simulateSmsSending(String phoneNumber, String message) {
        try {
            // 시뮬레이션 로직
            log.info("SMS 시뮬레이션: {} -> {}", phoneNumber, message);
            
            // 실제 구현에서는 여기서 실제 SMS API 호출
            // 예: HTTP 요청, SDK 호출 등
            
            // 시뮬레이션을 위한 짧은 대기
            Thread.sleep(100);
            
            return true;
        } catch (Exception e) {
            log.error("SMS 시뮬레이션 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 네이버 클라우드 플랫폼 SMS 발송 (실제 구현 예시)
     */
    private boolean sendNaverCloudSms(String phoneNumber, String message) {
        try {
            // TODO: 네이버 클라우드 플랫폼 SMS API 구현
            // 1. API 키 설정
            // 2. 요청 데이터 구성
            // 3. HTTP 요청 발송
            // 4. 응답 처리
            
            log.info("네이버 클라우드 SMS 발송: {} -> {}", phoneNumber, message);
            return true;
        } catch (Exception e) {
            log.error("네이버 클라우드 SMS 발송 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 카카오 알림톡 발송 (실제 구현 예시)
     */
    private boolean sendKakaoAlimtalk(String phoneNumber, String message) {
        try {
            // TODO: 카카오 알림톡 API 구현
            // 1. 액세스 토큰 발급
            // 2. 알림톡 템플릿 설정
            // 3. 메시지 발송 요청
            // 4. 발송 결과 확인
            
            log.info("카카오 알림톡 발송: {} -> {}", phoneNumber, message);
            return true;
        } catch (Exception e) {
            log.error("카카오 알림톡 발송 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * AWS SNS 발송 (실제 구현 예시)
     */
    private boolean sendAwsSns(String phoneNumber, String message) {
        try {
            // TODO: AWS SNS API 구현
            // 1. AWS 자격 증명 설정
            // 2. SNS 클라이언트 생성
            // 3. 메시지 발송
            // 4. 발송 결과 확인
            
            log.info("AWS SNS 발송: {} -> {}", phoneNumber, message);
            return true;
        } catch (Exception e) {
            log.error("AWS SNS 발송 실패: {}", e.getMessage());
            return false;
        }
    }
}
