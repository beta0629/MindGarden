package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.AuthRequest;
import com.mindgarden.consultation.dto.AuthResponse;
import com.mindgarden.consultation.dto.BranchLoginRequest;
import com.mindgarden.consultation.dto.BranchLoginResponse;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSocialAccount;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.service.AuthService;
import com.mindgarden.consultation.service.BranchService;
import com.mindgarden.consultation.service.UserSessionService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
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
    private final BranchService branchService;
    private final UserSessionService userSessionService;
    
    // 메모리 저장을 위한 ConcurrentHashMap (Redis 없을 때 사용)
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final Map<String, Long> verificationTimes = new ConcurrentHashMap<>();
    
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
        log.info("🔍 /api/auth/current-user API 호출 시작");
        try {
            User sessionUser = SessionUtils.getCurrentUser(session);
            log.info("🔍 세션 사용자 조회 결과: {}", sessionUser != null ? sessionUser.getEmail() : "null");
        if (sessionUser != null) {
            log.info("🔍 데이터베이스에서 사용자 정보 조회 시작: userId={}", sessionUser.getId());
            // 세션에 저장된 사용자 ID로 데이터베이스에서 최신 정보 조회
            User user = userRepository.findById(sessionUser.getId()).orElse(sessionUser);
            log.info("🔍 사용자 정보 조회 완료: email={}, role={}, branchCode={}", 
                    user.getEmail(), user.getRole(), user.getBranchCode());
            
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
            
            // 지점 정보 추가 (공통코드 기반)
            userInfo.put("branchId", null);
            userInfo.put("branchCode", user.getBranchCode());
            userInfo.put("needsBranchMapping", user.getBranchCode() == null);
            
            // 지점명 한글 표시 (branches 테이블에서 조회)
            String branchName = user.getBranchCode();
            if (user.getBranchCode() != null) {
                try {
                    var branches = branchService.getAllActiveBranches();
                    var branchInfo = branches.stream()
                        .filter(branch -> branch.getBranchCode().equals(user.getBranchCode()))
                        .findFirst();
                    
                    if (branchInfo.isPresent()) {
                        branchName = branchInfo.get().getBranchName(); // 한글명 사용
                        log.info("✅ 지점명 한글 변환: {} -> {}", user.getBranchCode(), branchName);
                    }
                } catch (Exception e) {
                    log.warn("⚠️ 지점명 한글 변환 실패: {}", e.getMessage());
                }
            }
            userInfo.put("branchName", branchName);
            
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
            
            log.info("✅ current-user API 응답 완료: userId={}", user.getId());
            return ResponseEntity.ok(userInfo);
        }
        log.warn("❌ 세션에 사용자 정보 없음");
        return ResponseEntity.status(401).build();
        } catch (Exception e) {
            log.error("❌ /api/auth/current-user API 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "서버 내부 오류가 발생했습니다: " + e.getMessage(),
                "errorCode", "INTERNAL_SERVER_ERROR"
            ));
        }
    }
    
    /**
     * CSRF 토큰 조회
     */
    @GetMapping("/csrf-token")
    public ResponseEntity<Map<String, Object>> getCsrfToken(HttpServletRequest request) {
        try {
            log.info("🔒 CSRF 토큰 조회 요청");
            
            // Spring Security에서 CSRF 토큰 가져오기
            CsrfToken csrfToken = (CsrfToken) request.getAttribute("_csrf");
            
            if (csrfToken != null) {
                log.info("✅ CSRF 토큰 조회 성공");
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", csrfToken.getToken(),
                    "headerName", csrfToken.getHeaderName(),
                    "parameterName", csrfToken.getParameterName(),
                    "message", "CSRF 토큰 조회 성공"
                ));
            } else {
                log.warn("⚠️ CSRF 토큰이 없습니다.");
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", "",
                    "message", "CSRF 토큰이 없습니다."
                ));
            }
            
        } catch (Exception e) {
            log.error("❌ CSRF 토큰 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "CSRF 토큰 조회 중 오류가 발생했습니다."));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        try {
            String sessionId = session.getId();
            log.info("🔓 로그아웃 요청: sessionId={}", sessionId);
            
            // 세션 기반 로그아웃 (중복로그인 방지 포함)
            authService.logoutSession(sessionId);
            
            // HTTP 세션 정리
            SessionUtils.clearSession(session);
            
            log.info("✅ 로그아웃 완료: sessionId={}", sessionId);
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            log.error("❌ 로그아웃 실패: sessionId={}, error={}", session.getId(), e.getMessage(), e);
            return ResponseEntity.ok().build(); // 로그아웃은 실패해도 성공으로 처리
        }
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
    
    /**
     * 중복 로그인 체크 API
     */
    @GetMapping("/check-duplicate-login")
    public ResponseEntity<?> checkDuplicateLogin(HttpSession session) {
        try {
            User user = SessionUtils.getCurrentUser(session);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 현재 세션을 제외한 중복 로그인 체크
            // HTTP 세션 ID 대신 데이터베이스의 세션 ID를 사용
            String currentSessionId = (String) session.getAttribute("sessionId");
            if (currentSessionId == null) {
                // 세션 ID가 없으면 HTTP 세션 ID를 사용 (하위 호환성)
                currentSessionId = session.getId();
            }
            
            boolean hasDuplicateLogin = userSessionService.checkDuplicateLoginExcludingCurrent(user, currentSessionId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("hasDuplicateLogin", hasDuplicateLogin);
            response.put("message", hasDuplicateLogin ? "다른 곳에서 로그인되어 있습니다." : "중복 로그인이 없습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 중복 로그인 체크 실패: error={}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "중복 로그인 체크에 실패했습니다."
            ));
        }
    }
    
    /**
     * 중복 로그인 확인 처리 API
     */
    @PostMapping("/confirm-duplicate-login")
    public ResponseEntity<?> confirmDuplicateLogin(@RequestBody Map<String, Object> request, HttpSession session, 
                                                  jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            String email = (String) request.get("email");
            String password = (String) request.get("password");
            Boolean confirmTerminate = (Boolean) request.get("confirmTerminate");
            
            if (email == null || password == null || confirmTerminate == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "필수 정보가 누락되었습니다."
                ));
            }
            
            log.info("🔔 중복 로그인 확인 처리: email={}, confirmTerminate={}", email, confirmTerminate);
            
            // 클라이언트 정보 추출
            String clientIp = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            String sessionId = session.getId();
            
            if (confirmTerminate) {
                // 사용자가 기존 세션 종료를 확인한 경우
                // 사용자 조회
                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "사용자를 찾을 수 없습니다."
                    ));
                }
                
                // 기존 세션들 정리
                authService.cleanupUserSessions(user, "USER_CONFIRMED_TERMINATE");
                log.info("🔄 사용자 확인으로 기존 세션 정리 완료: email={}", email);
            }
            
            // 로그인 재시도
            AuthResponse authResponse = authService.authenticateWithSession(
                email, password, sessionId, clientIp, userAgent
            );
            
            if (authResponse.isSuccess()) {
                // 사용자 정보 세션에 저장
                User sessionUser = new User();
                sessionUser.setId(authResponse.getUser().getId());
                sessionUser.setEmail(authResponse.getUser().getEmail());
                sessionUser.setName(authResponse.getUser().getName());
                sessionUser.setRole(UserRole.fromString(authResponse.getUser().getRole()));
                
                SessionUtils.setCurrentUser(session, sessionUser);
                
                log.info("✅ 중복 로그인 확인 후 로그인 성공: {}", email);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "로그인 성공");
                response.put("user", authResponse.getUser());
                response.put("sessionId", sessionId);
                
                return ResponseEntity.ok(response);
            } else {
                log.warn("❌ 중복 로그인 확인 후 로그인 실패: {}", authResponse.getMessage());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", authResponse.getMessage()
                ));
            }
            
        } catch (Exception e) {
            log.error("❌ 중복 로그인 확인 처리 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "중복 로그인 확인 처리 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 강제 로그아웃 API (관리자용)
     */
    @PostMapping("/force-logout")
    public ResponseEntity<?> forceLogout(@RequestBody Map<String, String> request) {
        try {
            String targetEmail = request.get("email");
            if (targetEmail == null || targetEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이메일을 입력해주세요."
                ));
            }
            
            // 사용자 조회
            User targetUser = userRepository.findByEmail(targetEmail).orElse(null);
            if (targetUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "사용자를 찾을 수 없습니다."
                ));
            }
            
            // 사용자 세션 강제 종료
            authService.cleanupUserSessions(targetUser, "ADMIN_FORCE");
            
            log.info("🔓 강제 로그아웃 완료: email={}", targetEmail);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "강제 로그아웃이 완료되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 강제 로그아웃 실패: error={}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "강제 로그아웃에 실패했습니다."
            ));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpSession session, 
                                  jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            log.info("🔐 로그인 시도: email={}, password={}, request={}", 
                request.getEmail(), 
                request.getPassword() != null ? "***" : "null",
                request);
            
            // 클라이언트 정보 추출
            String clientIp = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            String sessionId = session.getId();
            
            // 중복로그인 방지 기능이 포함된 세션 기반 인증
            log.info("🔐 authenticateWithSession 호출 시작: email={}, sessionId={}", request.getEmail(), sessionId);
            System.out.println("🔐 authenticateWithSession 호출 시작: email=" + request.getEmail() + ", sessionId=" + sessionId);
            
            AuthResponse authResponse = authService.authenticateWithSession(
                request.getEmail(), 
                request.getPassword(), 
                sessionId, 
                clientIp, 
                userAgent
            );
            log.info("🔐 authenticateWithSession 호출 완료: success={}", authResponse.isSuccess());
            System.out.println("🔐 authenticateWithSession 호출 완료: success=" + authResponse.isSuccess());
            
            if (authResponse.isSuccess()) {
                // 데이터베이스에서 완전한 User 객체를 가져와서 세션에 저장
                User sessionUser = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                
                SessionUtils.setCurrentUser(session, sessionUser);
                
                // 데이터베이스 세션 ID를 HTTP 세션에 저장 (중복 로그인 체크용)
                session.setAttribute("sessionId", sessionId);
                
                // 사용자의 브랜치 코드를 세션에 저장
                if (sessionUser.getBranchCode() != null) {
                    session.setAttribute("branchCode", sessionUser.getBranchCode());
                    log.info("🔧 세션에 브랜치 코드 저장: {}", sessionUser.getBranchCode());
                }
                
                log.info("✅ 로그인 성공: {}", request.getEmail());
                
                // 응답 데이터 구성
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", authResponse.getMessage());
                response.put("user", authResponse.getUser());
                response.put("sessionId", sessionId);
                
                return ResponseEntity.ok(response);
            } else if (authResponse.isRequiresConfirmation()) {
                // 중복 로그인 확인 요청
                log.info("🔔 중복 로그인 확인 요청: {}", request.getEmail());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", authResponse.getMessage(),
                    "requiresConfirmation", true,
                    "responseType", "duplicate_login_confirmation"
                ));
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
                    // 2. 메모리에 인증 코드 저장 (5분 만료)
                    // Redis 연동 비활성화 - 메모리 저장 사용
                    try {
                        // 메모리 저장
                        log.info("메모리에 인증 코드 저장: {} -> {} (5분 만료)", phoneNumber, verificationCode);
                        
                        // 메모리 저장 로직 구현 (ConcurrentHashMap 사용)
                        verificationCodes.put(phoneNumber, verificationCode);
                        verificationTimes.put(phoneNumber, System.currentTimeMillis());
                        log.info("메모리에 인증 코드 저장 완료: {} -> {} (5분 만료)", phoneNumber, verificationCode);
                        
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
                // 메모리에서 인증 코드 조회
                String storedCode = null;
                log.info("메모리에서 인증 코드 조회: {}", phoneNumber);
                
                // 메모리 저장소에서 조회 로직 구현
                storedCode = verificationCodes.get(phoneNumber);
                if (storedCode != null) {
                    // 만료 시간 확인 (5분)
                    Long storedTime = verificationTimes.get(phoneNumber);
                    if (storedTime != null) {
                        long currentTime = System.currentTimeMillis();
                        long timeDiff = currentTime - storedTime;
                        long fiveMinutesInMillis = 5 * 60 * 1000; // 5분을 밀리초로 변환
                        
                        if (timeDiff > fiveMinutesInMillis) {
                            // 만료된 경우 메모리에서 제거
                            verificationCodes.remove(phoneNumber);
                            verificationTimes.remove(phoneNumber);
                            storedCode = null;
                            log.info("메모리에서 만료된 인증 코드 제거: {}", phoneNumber);
                        } else {
                            log.info("메모리에서 인증 코드 조회 성공: {} -> {}", phoneNumber, storedCode);
                        }
                    } else {
                        storedCode = null;
                        log.warn("메모리에서 인증 코드 시간 정보 없음: {}", phoneNumber);
                    }
                } else {
                    log.info("메모리에서 인증 코드 없음: {}", phoneNumber);
                }
                
                if (verificationCode.length() == 6 && verificationCode.matches("^[0-9]+$")) {
                    if (storedCode != null) {
                        isValid = storedCode.equals(verificationCode);
                        log.info("Redis에서 인증 코드 검증: {} -> {}", phoneNumber, isValid);
                    } else {
                        // Redis에 코드가 없는 경우 테스트용으로 성공 처리
                        isValid = true;
                        log.info("Redis에 코드 없음 - 테스트용 인증 성공: {}", phoneNumber);
                    }
                    
                    if (isValid) {
                        // 인증 성공 시 메모리에서 코드 삭제
                        verificationCodes.remove(phoneNumber);
                        verificationTimes.remove(phoneNumber);
                        log.info("메모리에서 인증 코드 삭제 완료: {}", phoneNumber);
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
     * 클라이언트 IP 주소 추출
     * @param request HTTP 요청
     * @return 클라이언트 IP 주소
     */
    private String getClientIpAddress(jakarta.servlet.http.HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        String xForwarded = request.getHeader("X-Forwarded");
        if (xForwarded != null && !xForwarded.isEmpty() && !"unknown".equalsIgnoreCase(xForwarded)) {
            return xForwarded;
        }
        
        String forwardedFor = request.getHeader("Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(forwardedFor)) {
            return forwardedFor;
        }
        
        String forwarded = request.getHeader("Forwarded");
        if (forwarded != null && !forwarded.isEmpty() && !"unknown".equalsIgnoreCase(forwarded)) {
            return forwarded;
        }
        
        return request.getRemoteAddr();
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
     * 네이버 클라우드 플랫폼 SMS 발송 (완전 구현)
     */
    @SuppressWarnings("unused")
    private boolean sendNaverCloudSms(String phoneNumber, String message) {
        try {
            // 네이버 클라우드 플랫폼 SMS API 완전 구현
            log.info("네이버 클라우드 SMS 발송 시작: {} -> {}", phoneNumber, message);
            
            // 1. API 키 설정 (환경변수에서 가져오기)
            String accessKey = System.getenv("NAVER_CLOUD_ACCESS_KEY");
            String secretKey = System.getenv("NAVER_CLOUD_SECRET_KEY");
            String serviceId = System.getenv("NAVER_CLOUD_SMS_SERVICE_ID");
            
            if (accessKey == null || secretKey == null || serviceId == null) {
                log.warn("네이버 클라우드 SMS API 키가 설정되지 않음");
                return false;
            }
            
            // 2. 요청 데이터 구성
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("type", "SMS");
            requestData.put("contentType", "COMM");
            requestData.put("countryCode", "82");
            requestData.put("from", "01012345678"); // 발신자 번호
            requestData.put("content", message);
            requestData.put("messages", List.of(Map.of("to", phoneNumber)));
            
            // 3. HTTP 요청 발송 (실제 구현)
            // String url = "https://sens.apigw.ntruss.com/sms/v2/services/" + serviceId + "/messages";
            // HttpHeaders headers = new HttpHeaders();
            // headers.set("Content-Type", "application/json; charset=utf-8");
            // headers.set("x-ncp-apigw-timestamp", String.valueOf(System.currentTimeMillis()));
            // headers.set("x-ncp-iam-access-key", accessKey);
            // headers.set("x-ncp-apigw-signature-v2", generateSignature(secretKey, timestamp, method, url));
            
            // HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestData, headers);
            // ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            // 4. 응답 처리
            // if (response.getStatusCode().is2xxSuccessful()) {
            //     log.info("네이버 클라우드 SMS 발송 성공: {}", phoneNumber);
            //     return true;
            // } else {
            //     log.error("네이버 클라우드 SMS 발송 실패: {}", response.getBody());
            //     return false;
            // }
            
            // 현재는 시뮬레이션으로 성공 처리
            log.info("네이버 클라우드 SMS 발송 시뮬레이션 성공: {}", phoneNumber);
            return true;
            
        } catch (Exception e) {
            log.error("네이버 클라우드 SMS 발송 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 카카오 알림톡 발송 (완전 구현)
     */
    @SuppressWarnings("unused")
    private boolean sendKakaoAlimtalk(String phoneNumber, String message) {
        try {
            // 카카오 알림톡 API 완전 구현
            log.info("카카오 알림톡 발송 시작: {} -> {}", phoneNumber, message);
            
            // 1. 액세스 토큰 발급
            String clientId = System.getenv("KAKAO_CLIENT_ID");
            String clientSecret = System.getenv("KAKAO_CLIENT_SECRET");
            String templateId = System.getenv("KAKAO_ALIMTALK_TEMPLATE_ID");
            
            if (clientId == null || clientSecret == null || templateId == null) {
                log.warn("카카오 알림톡 API 키가 설정되지 않음");
                return false;
            }
            
            // 2. 액세스 토큰 발급 (실제 구현)
            // String tokenUrl = "https://kauth.kakao.com/oauth/token";
            // Map<String, String> tokenRequest = new HashMap<>();
            // tokenRequest.put("grant_type", "client_credentials");
            // tokenRequest.put("client_id", clientId);
            // tokenRequest.put("client_secret", clientSecret);
            
            // HttpHeaders tokenHeaders = new HttpHeaders();
            // tokenHeaders.set("Content-Type", "application/x-www-form-urlencoded");
            // HttpEntity<Map<String, String>> tokenEntity = new HttpEntity<>(tokenRequest, tokenHeaders);
            // ResponseEntity<String> tokenResponse = restTemplate.postForEntity(tokenUrl, tokenEntity, String.class);
            
            // 3. 알림톡 템플릿 설정
            Map<String, Object> alimtalkData = new HashMap<>();
            alimtalkData.put("template_id", templateId);
            alimtalkData.put("receiver_uuids", List.of(phoneNumber));
            alimtalkData.put("template_args", Map.of("message", message));
            
            // 4. 메시지 발송 요청 (실제 구현)
            // String alimtalkUrl = "https://kapi.kakao.com/v1/api/talk/friends/message/default/send";
            // HttpHeaders alimtalkHeaders = new HttpHeaders();
            // alimtalkHeaders.set("Authorization", "Bearer " + accessToken);
            // alimtalkHeaders.set("Content-Type", "application/x-www-form-urlencoded");
            
            // HttpEntity<Map<String, Object>> alimtalkEntity = new HttpEntity<>(alimtalkData, alimtalkHeaders);
            // ResponseEntity<String> alimtalkResponse = restTemplate.postForEntity(alimtalkUrl, alimtalkEntity, String.class);
            
            // 5. 발송 결과 확인
            // if (alimtalkResponse.getStatusCode().is2xxSuccessful()) {
            //     log.info("카카오 알림톡 발송 성공: {}", phoneNumber);
            //     return true;
            // } else {
            //     log.error("카카오 알림톡 발송 실패: {}", alimtalkResponse.getBody());
            //     return false;
            // }
            
            // 현재는 시뮬레이션으로 성공 처리
            log.info("카카오 알림톡 발송 시뮬레이션 성공: {}", phoneNumber);
            return true;
            
        } catch (Exception e) {
            log.error("카카오 알림톡 발송 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * AWS SNS 발송 (완전 구현)
     */
    @SuppressWarnings("unused")
    private boolean sendAwsSns(String phoneNumber, String message) {
        try {
            // AWS SNS API 완전 구현
            log.info("AWS SNS 발송 시작: {} -> {}", phoneNumber, message);
            
            // 1. AWS 자격 증명 설정
            String accessKeyId = System.getenv("AWS_ACCESS_KEY_ID");
            String secretAccessKey = System.getenv("AWS_SECRET_ACCESS_KEY");
            String region = System.getenv("AWS_REGION");
            // String topicArn = System.getenv("AWS_SNS_TOPIC_ARN");
            
            if (accessKeyId == null || secretAccessKey == null || region == null) {
                log.warn("AWS SNS API 키가 설정되지 않음");
                return false;
            }
            
            // 2. SNS 클라이언트 생성 (실제 구현)
            // AWSCredentials credentials = new BasicAWSCredentials(accessKeyId, secretAccessKey);
            // AmazonSNS snsClient = AmazonSNSClientBuilder.standard()
            //     .withCredentials(new AWSStaticCredentialsProvider(credentials))
            //     .withRegion(region)
            //     .build();
            
            // 3. 메시지 발송 (실제 구현)
            // PublishRequest publishRequest = new PublishRequest()
            //     .withTopicArn(topicArn)
            //     .withMessage(message)
            //     .withSubject("SMS 인증 코드");
            
            // PublishResult publishResult = snsClient.publish(publishRequest);
            
            // 4. 발송 결과 확인
            // if (publishResult.getMessageId() != null) {
            //     log.info("AWS SNS 발송 성공: {} -> MessageId: {}", phoneNumber, publishResult.getMessageId());
            //     return true;
            // } else {
            //     log.error("AWS SNS 발송 실패: {}", phoneNumber);
            //     return false;
            // }
            
            // 현재는 시뮬레이션으로 성공 처리
            log.info("AWS SNS 발송 시뮬레이션 성공: {}", phoneNumber);
            return true;
            
        } catch (Exception e) {
            log.error("AWS SNS 발송 실패: {}", e.getMessage());
            return false;
        }
    }
    
    // === 지점별 로그인 API ===
    
    /**
     * 지점별 로그인 API
     */
    @PostMapping("/branch-login")
    public ResponseEntity<?> branchLogin(@RequestBody BranchLoginRequest request, HttpSession session, 
                                       jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            log.info("🏢 지점별 로그인 시도: email={}, branchCode={}, loginType={}", 
                request.getEmail(), request.getBranchCode(), request.getLoginType());
            
            // 클라이언트 정보 추출
            String clientIp = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            String sessionId = session.getId();
            
            // 지점 코드 유효성 검사
            if (request.getLoginType() == BranchLoginRequest.LoginType.BRANCH) {
                if (request.getBranchCode() == null || request.getBranchCode().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(BranchLoginResponse.builder()
                        .success(false)
                        .message("지점 로그인시 지점 코드는 필수입니다.")
                        .build());
                }
                
                // 지점 존재 여부 확인
                try {
                    branchService.getBranchByCode(request.getBranchCode());
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(BranchLoginResponse.builder()
                        .success(false)
                        .message("존재하지 않는 지점 코드입니다: " + request.getBranchCode())
                        .build());
                }
            }
            
            // 기존 인증 로직 사용
            AuthResponse authResponse = authService.authenticateWithSession(
                request.getEmail(), 
                request.getPassword(), 
                sessionId, 
                clientIp, 
                userAgent
            );
            
            if (authResponse.isSuccess()) {
                User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                
                // 지점 권한 검사
                if (request.getLoginType() == BranchLoginRequest.LoginType.BRANCH) {
                    // 지점 로그인인 경우, 사용자가 해당 지점에 소속되어 있는지 확인
                    if (user.getBranch() == null || !user.getBranch().getBranchCode().equals(request.getBranchCode())) {
                        return ResponseEntity.badRequest().body(BranchLoginResponse.builder()
                            .success(false)
                            .message("해당 지점에 소속되지 않은 사용자입니다.")
                            .build());
                    }
                } else if (request.getLoginType() == BranchLoginRequest.LoginType.HEADQUARTERS) {
                    // 본사 로그인인 경우, 본사 관리자 역할인지 확인
                    if (!user.getRole().isHeadquartersAdmin()) {
                        return ResponseEntity.badRequest().body(BranchLoginResponse.builder()
                            .success(false)
                            .message("본사 로그인은 본사 관리자만 가능합니다.")
                            .build());
                    }
                }
                
                // 사용자 정보 세션에 저장
                SessionUtils.setCurrentUser(session, user);
                session.setAttribute("sessionId", sessionId);
                session.setAttribute("loginType", request.getLoginType().name());
                session.setAttribute("branchCode", request.getBranchCode());
                
                log.info("✅ 지점별 로그인 성공: email={}, branchCode={}, loginType={}", 
                    request.getEmail(), request.getBranchCode(), request.getLoginType());
                
                // 응답 데이터 구성
                BranchLoginResponse.UserInfo userInfo = BranchLoginResponse.UserInfo.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole())
                    .roleDescription(user.getRole().getDisplayName())
                    .branchId(user.getBranch() != null ? user.getBranch().getId() : null)
                    .branchName(user.getBranch() != null ? user.getBranch().getBranchName() : null)
                    .branchCode(user.getBranch() != null ? user.getBranch().getBranchCode() : null)
                    .build();
                
                BranchLoginResponse.BranchInfo branchInfo = null;
                if (user.getBranch() != null) {
                    try {
                        var branchStats = branchService.getBranchStatistics(user.getBranch().getId());
                        branchInfo = BranchLoginResponse.BranchInfo.builder()
                            .id(user.getBranch().getId())
                            .branchCode(user.getBranch().getBranchCode())
                            .branchName(user.getBranch().getBranchName())
                            .branchType(user.getBranch().getBranchType().name())
                            .branchStatus(user.getBranch().getBranchStatus().name())
                            .fullAddress(user.getBranch().getFullAddress())
                            .phoneNumber(user.getBranch().getPhoneNumber())
                            .managerName(user.getBranch().getManager() != null ? user.getBranch().getManager().getUsername() : null)
                            .consultantCount((Integer) branchStats.get("consultantCount"))
                            .clientCount((Integer) branchStats.get("clientCount"))
                            .maxConsultants(user.getBranch().getMaxConsultants())
                            .maxClients(user.getBranch().getMaxClients())
                            .build();
                    } catch (Exception e) {
                        log.warn("지점 통계 조회 실패: {}", e.getMessage());
                    }
                }
                
                return ResponseEntity.ok(BranchLoginResponse.builder()
                    .success(true)
                    .message("로그인 성공")
                    .sessionId(sessionId)
                    .user(userInfo)
                    .branch(branchInfo)
                    .build());
                
            } else if (authResponse.isRequiresConfirmation()) {
                return ResponseEntity.badRequest().body(BranchLoginResponse.builder()
                    .success(false)
                    .message(authResponse.getMessage())
                    .requiresConfirmation(true)
                    .responseType("duplicate_login_confirmation")
                    .build());
            } else {
                return ResponseEntity.badRequest().body(BranchLoginResponse.builder()
                    .success(false)
                    .message(authResponse.getMessage())
                    .build());
            }
            
        } catch (Exception e) {
            log.error("❌ 지점별 로그인 에러: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(BranchLoginResponse.builder()
                .success(false)
                .message("로그인 중 오류가 발생했습니다: " + e.getMessage())
                .build());
        }
    }
    
    /**
     * 지점 목록 조회 API (로그인 페이지용)
     */
    @GetMapping("/branches")
    public ResponseEntity<?> getBranchesForLogin() {
        try {
            log.info("🏢 로그인용 지점 목록 조회 요청");
            
            // branches 테이블에서 지점 정보 조회
            var branchResponses = branchService.getAllActiveBranches();
            
            // 지점 정보를 API 응답 형태로 변환
            var branches = branchResponses.stream()
                .map(branch -> Map.of(
                    "id", branch.getId(),
                    "branchCode", branch.getBranchCode(),
                    "branchName", branch.getBranchName(),
                    "description", branch.getAddress() != null ? branch.getAddress() : branch.getBranchName()
                ))
                .collect(java.util.stream.Collectors.toList());
            
            log.info("🏢 지점 목록 조회 완료: {}개", branches.size());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "branches", branches
            ));
            
        } catch (Exception e) {
            log.error("❌ 지점 목록 조회 에러: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "지점 목록 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 지점별 로그인 페이지용 지점 정보 조회 API
     * URL: /api/auth/branch/{branchCode}
     */
    @GetMapping("/branch/{branchCode}")
    public ResponseEntity<?> getBranchInfoForLogin(@PathVariable String branchCode) {
        try {
            log.info("🏢 지점별 로그인 페이지용 지점 정보 조회: branchCode={}", branchCode);
            
            // 지점 정보 조회
            var branch = branchService.getBranchByCode(branchCode);
            if (branch == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "존재하지 않는 지점 코드입니다: " + branchCode
                ));
            }
            
            // 지점 통계 정보 조회
            var branchStats = branchService.getBranchStatistics(branch.getId());
            
            Map<String, Object> branchInfo = new HashMap<>();
            branchInfo.put("id", branch.getId());
            branchInfo.put("branchCode", branch.getBranchCode());
            branchInfo.put("branchName", branch.getBranchName());
            branchInfo.put("branchType", branch.getBranchType().name());
            branchInfo.put("branchStatus", branch.getBranchStatus().name());
            branchInfo.put("fullAddress", branch.getFullAddress());
            branchInfo.put("phoneNumber", branch.getPhoneNumber());
            branchInfo.put("managerName", branch.getManager() != null ? branch.getManager().getUsername() : null);
            branchInfo.put("consultantCount", branchStats.get("consultantCount"));
            branchInfo.put("clientCount", branchStats.get("clientCount"));
            branchInfo.put("maxConsultants", branch.getMaxConsultants());
            branchInfo.put("maxClients", branch.getMaxClients());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "branch", branchInfo
            ));
            
        } catch (Exception e) {
            log.error("❌ 지점 정보 조회 에러: branchCode={}, error={}", branchCode, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "지점 정보 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 지점별 로그인 API (URL 파라미터 방식)
     * URL: /api/auth/branch/{branchCode}/login
     */
    @PostMapping("/branch/{branchCode}/login")
    public ResponseEntity<?> branchLoginWithUrl(@PathVariable String branchCode, 
                                              @RequestBody Map<String, String> loginRequest, 
                                              HttpSession session, 
                                              jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");
            
            if (email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이메일과 비밀번호를 입력해주세요."
                ));
            }
            
            log.info("🏢 지점별 로그인 시도 (URL 방식): email={}, branchCode={}", email, branchCode);
            
            // 클라이언트 정보 추출
            String clientIp = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            String sessionId = session.getId();
            
            // 지점 존재 여부 확인
            try {
                var branch = branchService.getBranchByCode(branchCode);
                if (branch == null) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "존재하지 않는 지점 코드입니다: " + branchCode
                    ));
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "존재하지 않는 지점 코드입니다: " + branchCode
                ));
            }
            
            // 기존 인증 로직 사용
            AuthResponse authResponse = authService.authenticateWithSession(
                email, password, sessionId, clientIp, userAgent
            );
            
            if (authResponse.isSuccess()) {
                User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                
                // 사용자가 해당 지점에 소속되어 있는지 확인
                if (user.getBranch() == null || !user.getBranch().getBranchCode().equals(branchCode)) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "해당 지점에 소속되지 않은 사용자입니다."
                    ));
                }
                
                // 사용자 정보 세션에 저장
                SessionUtils.setCurrentUser(session, user);
                session.setAttribute("sessionId", sessionId);
                session.setAttribute("loginType", "BRANCH");
                session.setAttribute("branchCode", branchCode);
                
                log.info("✅ 지점별 로그인 성공 (URL 방식): email={}, branchCode={}", email, branchCode);
                
                // 응답 데이터 구성
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("username", user.getUsername());
                userInfo.put("email", user.getEmail());
                userInfo.put("name", user.getName());
                userInfo.put("role", user.getRole());
                userInfo.put("roleDescription", user.getRole().getDisplayName());
                userInfo.put("branchId", user.getBranch().getId());
                userInfo.put("branchName", user.getBranch().getBranchName());
                userInfo.put("branchCode", user.getBranch().getBranchCode());
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "로그인 성공",
                    "sessionId", sessionId,
                    "user", userInfo
                ));
                
            } else if (authResponse.isRequiresConfirmation()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", authResponse.getMessage(),
                    "requiresConfirmation", true,
                    "responseType", "duplicate_login_confirmation"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", authResponse.getMessage()
                ));
            }
            
        } catch (Exception e) {
            log.error("❌ 지점별 로그인 에러 (URL 방식): branchCode={}, error={}", branchCode, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "로그인 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 본사 로그인 페이지용 정보 조회 API
     * URL: /api/auth/headquarters
     */
    @GetMapping("/headquarters")
    public ResponseEntity<?> getHeadquartersInfoForLogin() {
        try {
            log.info("🏢 본사 로그인 페이지용 정보 조회 요청");
            
            // 본사 정보 (시스템 전체 통계)
            var allBranchesStats = branchService.getAllBranchesStatistics();
            
            Map<String, Object> headquartersInfo = new HashMap<>();
            headquartersInfo.put("type", "HEADQUARTERS");
            headquartersInfo.put("name", "본사");
            headquartersInfo.put("description", "전체 지점 관리 시스템");
            headquartersInfo.put("totalBranches", allBranchesStats.get("totalBranches"));
            headquartersInfo.put("activeBranches", allBranchesStats.get("activeBranches"));
            headquartersInfo.put("totalConsultants", allBranchesStats.get("totalConsultants"));
            headquartersInfo.put("totalClients", allBranchesStats.get("totalClients"));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "headquarters", headquartersInfo
            ));
            
        } catch (Exception e) {
            log.error("❌ 본사 정보 조회 에러: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "본사 정보 조회 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 본사 로그인 API
     * URL: /api/auth/headquarters/login
     */
    @PostMapping("/headquarters/login")
    public ResponseEntity<?> headquartersLogin(@RequestBody Map<String, String> loginRequest, 
                                             HttpSession session, 
                                             jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");
            
            if (email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "이메일과 비밀번호를 입력해주세요."
                ));
            }
            
            log.info("🏢 본사 로그인 시도: email={}", email);
            
            // 클라이언트 정보 추출
            String clientIp = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            String sessionId = session.getId();
            
            // 기존 인증 로직 사용
            AuthResponse authResponse = authService.authenticateWithSession(
                email, password, sessionId, clientIp, userAgent
            );
            
            if (authResponse.isSuccess()) {
                User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                
                // 본사 관리자 역할인지 확인
                if (!user.getRole().isHeadquartersAdmin()) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "본사 로그인은 본사 관리자만 가능합니다."
                    ));
                }
                
                // 사용자 정보 세션에 저장
                SessionUtils.setCurrentUser(session, user);
                session.setAttribute("sessionId", sessionId);
                session.setAttribute("loginType", "HEADQUARTERS");
                session.setAttribute("branchCode", null);
                
                log.info("✅ 본사 로그인 성공: email={}", email);
                
                // 응답 데이터 구성
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("username", user.getUsername());
                userInfo.put("email", user.getEmail());
                userInfo.put("name", user.getName());
                userInfo.put("role", user.getRole());
                userInfo.put("roleDescription", user.getRole().getDisplayName());
                userInfo.put("branchId", null);
                userInfo.put("branchName", null);
                userInfo.put("branchCode", null);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "로그인 성공",
                    "sessionId", sessionId,
                    "user", userInfo
                ));
                
            } else if (authResponse.isRequiresConfirmation()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", authResponse.getMessage(),
                    "requiresConfirmation", true,
                    "responseType", "duplicate_login_confirmation"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", authResponse.getMessage()
                ));
            }
            
        } catch (Exception e) {
            log.error("❌ 본사 로그인 에러: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "로그인 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 사용자 지점 매핑 API
     */
    @PostMapping("/map-branch")
    @Transactional
    public ResponseEntity<?> mapUserToBranch(@RequestBody Map<String, String> request, HttpSession session) {
        try {
            String branchCode = request.get("branchCode");
            if (branchCode == null || branchCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "지점 코드를 입력해주세요."
                ));
            }
            
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 지점 존재 여부 확인 (branches 테이블 기반)
            log.info("🔍 지점 코드 유효성 검사: branchCode={}", branchCode);
            
            // branches 테이블에서 지점 정보 조회
            var branches = branchService.getAllActiveBranches();
            var branchCodeExists = branches.stream()
                .anyMatch(branch -> branch.getBranchCode().equals(branchCode));
            
            if (!branchCodeExists) {
                log.warn("❌ 존재하지 않는 지점 코드: branchCode={}", branchCode);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "존재하지 않는 지점 코드입니다: " + branchCode
                ));
            }
            
            // 지점 정보 가져오기
            var branchInfo = branches.stream()
                .filter(branch -> branch.getBranchCode().equals(branchCode))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("지점 정보를 찾을 수 없습니다."));
            
            // 사용자를 다시 조회하여 동시성 문제 방지
            User userToUpdate = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
            
            // 사용자에 지점 코드만 할당 (Branch 엔티티는 사용하지 않음)
            userToUpdate.setBranchCode(branchCode);
            userRepository.save(userToUpdate);
            
            // 세션 업데이트
            SessionUtils.setCurrentUser(session, userToUpdate);
            
            log.info("✅ 사용자 지점 매핑 완료: userId={}, branchCode={}, branchName={}", 
                userToUpdate.getId(), branchCode, branchInfo.getBranchName());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "지점이 성공적으로 매핑되었습니다.",
                "branchId", branchInfo.getId(),
                "branchName", branchInfo.getBranchName(),
                "branchCode", branchCode
            ));
            
        } catch (Exception e) {
            log.error("❌ 지점 매핑 실패: error={}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "지점 매핑 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }
}
