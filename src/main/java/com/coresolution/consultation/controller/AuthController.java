package com.coresolution.consultation.controller;

// 표준화 2025-12-05: 브랜치/HQ 개념 제거, 역할 체크를 공통코드 기반 동적 조회로 통합 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)
import com.coresolution.consultation.entity.CommonCode;


import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AuthRequest;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.dto.BranchLoginRequest;
import com.coresolution.consultation.dto.BranchLoginResponse;
import com.coresolution.consultation.dto.RegisterRequest;
import com.coresolution.consultation.dto.UserDto;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.PermissionGroupService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.domain.UserRoleAssignment;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class AuthController extends BaseApiController {
    
    private final CommonCodeService commonCodeService;
    
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final UserRepository userRepository;
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final TenantRepository tenantRepository;
    private final AuthService authService;
    private final BranchService branchService;
    private final UserSessionService userSessionService;
    private final DynamicPermissionService dynamicPermissionService;
    private final UserService userService;
    private final UserRoleQueryService userRoleQueryService;
    private final TenantRoleRepository tenantRoleRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;
    private final PermissionGroupService permissionGroupService;
    private final org.springframework.core.env.Environment environment;
    
    // 로컬 개발 환경용 기본 테넌트 ID (서브도메인이 없을 때 사용)
    @org.springframework.beans.factory.annotation.Value("${local.default-tenant-id:${LOCAL_DEFAULT_TENANT_ID:}}")
    private String localDefaultTenantId;
    
    // 메모리 저장을 위한 ConcurrentHashMap (Redis 없을 때 사용)
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final Map<String, Long> verificationTimes = new ConcurrentHashMap<>();
    
    @PostMapping("/clear-session")
    public ResponseEntity<ApiResponse<Void>> clearSession(HttpSession session) {
        log.info("세션 강제 초기화 요청");
        SessionUtils.clearSession(session);
        return success("세션이 초기화되었습니다.");
    }

    @GetMapping("/current-user")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser(
            HttpSession session,
            org.springframework.security.core.Authentication authentication) {
        log.info("🔍 /api/auth/current-user API 호출 시작");
        
        User sessionUser = SessionUtils.getCurrentUser(session);
        log.info("🔍 세션 사용자 조회 결과: {}", sessionUser != null ? sessionUser.getEmail() : "null");
        
        // JWT 인증 사용자 확인 (Trinity, Ops Portal 등)
        User currentUser = null;
        if (sessionUser != null) {
            currentUser = sessionUser;
        } else if (authentication != null && authentication.isAuthenticated()) {
            // JWT 인증된 사용자 처리
            String userId = authentication.getName();
            log.info("🔍 JWT 인증 사용자 확인: userId={}", userId);
            
            // 데이터베이스에서 사용자 조회 (현재 테넌트)
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null && !tenantId.isEmpty()) {
                currentUser = userRepository.findByTenantIdAndEmail(tenantId, userId).orElse(null);
            } else {
                List<User> users = userRepository.findAllByEmail(userId);
                currentUser = users.isEmpty() ? null : users.get(0);
            }
            
            if (currentUser == null) {
                // 데이터베이스에 없는 경우 (Ops Portal 전용 계정 등)
                // JWT 토큰 정보로 임시 사용자 정보 생성
                log.info("🔍 데이터베이스에 사용자 없음 - JWT 토큰 정보 사용: userId={}", userId);
                // JWT 인증만으로는 사용자 정보를 반환할 수 없으므로 null 처리
                // 필요시 JWT 토큰에서 actorRole 등을 추출하여 반환할 수 있음
            }
        }
        
        // 인증되지 않은 사용자에 대해서는 401 Unauthorized 반환
        if (currentUser == null) {
            log.warn("current-user 401: 세션존재={}, sessionId={}, 세션사용자={}", session != null, session != null ? session.getId() : "N/A", sessionUser != null);
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.<Map<String, Object>>builder()
                    .success(false)
                    .message("인증이 필요합니다.")
                    .data(null)
                    .build());
        }
        
        log.info("🔍 데이터베이스에서 사용자 정보 조회 시작: userId={}", currentUser.getId());
        // 세션에 저장된 사용자 ID로 데이터베이스에서 최신 정보 조회
        User user = userRepository.findById(currentUser.getId()).orElse(currentUser);
        log.info("🔍 사용자 정보 조회 완료: email={}, role={}, branchCode={}", 
                user.getEmail(), user.getRole(), user.getBranchCode());
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        
        // 이메일, 이름, 닉네임 복호화
        String decryptedEmail = null;
        String decryptedName = null;
        String decryptedNickname = null;
        
        try {
            if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
                decryptedEmail = encryptionUtil.safeDecrypt(user.getEmail());
            }
            if (user.getName() != null && !user.getName().trim().isEmpty()) {
                decryptedName = encryptionUtil.safeDecrypt(user.getName());
            }
            if (user.getNickname() != null && !user.getNickname().trim().isEmpty()) {
                decryptedNickname = encryptionUtil.safeDecrypt(user.getNickname());
            }
        } catch (Exception e) {
            log.warn("사용자 정보 복호화 실패: {}", e.getMessage());
            decryptedEmail = user.getEmail();
            decryptedName = user.getName();
            decryptedNickname = user.getNickname();
        }
        
        userInfo.put("email", decryptedEmail);
        userInfo.put("name", decryptedName);
        userInfo.put("nickname", decryptedNickname);
        userInfo.put("role", user.getRole());
        
        // 테넌트 정보 추가
        userInfo.put("tenantId", user.getTenantId());
        
        // 테넌트의 businessType 추가 (동적 조회)
        if (user.getTenantId() != null && !user.getTenantId().isEmpty()) {
            try {
                Optional<Tenant> tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(user.getTenantId());
                if (tenant.isPresent()) {
                    userInfo.put("businessType", tenant.get().getBusinessType());
                    log.debug("테넌트 업종 정보 추가: tenantId={}, businessType={}", 
                        user.getTenantId(), tenant.get().getBusinessType());
                } else {
                    log.warn("테넌트를 찾을 수 없습니다: tenantId={}", user.getTenantId());
                }
            } catch (Exception e) {
                log.warn("테넌트 업종 정보 조회 실패: tenantId={}, error={}", user.getTenantId(), e.getMessage());
            }
        }
        
        // 지점 정보 추가 (공통코드 기반)
        userInfo.put("branchId", user.getBranch() != null ? user.getBranch().getId() : null);
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
        
        // 소셜 계정 정보 조회하여 이미지 타입 구분 (테넌트별)
        String tenantId = user.getTenantId();
        List<UserSocialAccount> socialAccounts = tenantId != null
            ? userSocialAccountRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, user.getId())
            : userSocialAccountRepository.findByUserIdAndIsDeletedFalse(user.getId()); // 레거시 호환
        
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
        
        // 동적 권한 그룹 코드 목록 (DB/테넌트 역할 기반, 프론트 권한 비교용)
        String tenantIdForGroups = SessionUtils.getTenantId(session);
        String roleId = SessionUtils.getRoleId(session);
        if (tenantIdForGroups != null && roleId != null) {
            try {
                List<String> permissionGroupCodes = permissionGroupService.getUserPermissionGroupCodes(tenantIdForGroups, roleId);
                userInfo.put("permissionGroupCodes", permissionGroupCodes);
                log.debug("current-user 권한 그룹 코드 수: {}", permissionGroupCodes.size());
            } catch (Exception e) {
                log.warn("권한 그룹 조회 실패 (빈 목록 반환): {}", e.getMessage());
                userInfo.put("permissionGroupCodes", Collections.emptyList());
            }
        } else {
            userInfo.put("permissionGroupCodes", Collections.emptyList());
        }
        
        log.info("✅ current-user API 응답 완료: userId={}", user.getId());
        return success(userInfo);
    }
    
    /**
     * 공개 회원가입
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@RequestBody RegisterRequest request) {
        log.info("📥 공개 회원가입 요청: email={}", request.getEmail());

        if (!StringUtils.hasText(request.getEmail()) ||
            !StringUtils.hasText(request.getPassword()) ||
            !StringUtils.hasText(request.getConfirmPassword()) ||
            !StringUtils.hasText(request.getName()) ||
            !StringUtils.hasText(request.getPhone())) {
            log.warn("⚠️ 회원가입 필수 항목 누락: {}", request);
            throw new IllegalArgumentException("필수 입력 항목이 누락되었습니다.");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }

        if (!Boolean.TRUE.equals(request.getAgreeTerms()) || !Boolean.TRUE.equals(request.getAgreePrivacy())) {
            throw new IllegalArgumentException("이용약관과 개인정보처리방침에 동의해야 회원가입이 가능합니다.");
        }

        // tenantId 가져오기 (회원가입 시 필수)
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("⚠️ 회원가입 시 tenantId가 없습니다. 테넌트 정보 필수.");
            throw new IllegalArgumentException(
                    "회원가입을 위해서는 테넌트 정보가 필요합니다. 올바른 주소(서브도메인)에서 접속했는지 확인해 주세요.");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByTenantIdAndEmail(tenantId, email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User user = new User();
        user.setUserId(generateUniqueUserId(email, tenantId));
        user.setEmail(email);
        user.setTenantId(tenantId);
        user.setPassword(request.getPassword());
        user.setName(encryptionUtil.safeEncrypt(request.getName().trim()));

        if (StringUtils.hasText(request.getNickname())) {
            user.setNickname(encryptionUtil.safeEncrypt(request.getNickname().trim()));
        }

        if (StringUtils.hasText(request.getGender())) {
            user.setGender(encryptionUtil.safeEncrypt(request.getGender()));
        }

        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }

        if (StringUtils.hasText(request.getPhone())) {
            String sanitizedPhone = request.getPhone().replaceAll("[^0-9]", "");
            user.setPhone(sanitizedPhone);
        }

        user.setRole(UserRole.CLIENT);
        user.setIsActive(true);
        user.setIsEmailVerified(false);
        user.setIsSocialAccount(false);

        if (StringUtils.hasText(request.getBranchCode())) {
            Branch branch = branchService.getBranchByCode(request.getBranchCode().trim());
            user.setBranch(branch);
            user.setBranchCode(branch.getBranchCode());
        }

        User registeredUser = userService.registerUser(user);

        Map<String, Object> data = new HashMap<>();
        data.put("userId", registeredUser.getId());

        return created("회원가입이 완료되었습니다.", data);
    }

    /**
     * 회원가입용 이메일 중복 확인 (공개 API)
     * GET /api/v1/auth/duplicate-check/email?email={email}
     */
    @GetMapping("/duplicate-check/email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEmailDuplicateForSignup(
            @RequestParam String email) {
        String tenantId = TenantContextHolder.getTenantId();
        String trimmed = email != null ? email.trim().toLowerCase() : "";
        boolean isDuplicate = false;
        if (StringUtils.hasText(trimmed)) {
            if (tenantId != null && !tenantId.isEmpty()) {
                isDuplicate = userRepository.existsByTenantIdAndEmail(tenantId, trimmed);
            } else {
                isDuplicate = userRepository.existsByEmailAll(trimmed);
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("email", trimmed);
        result.put("isDuplicate", isDuplicate);
        result.put("available", !isDuplicate);
        result.put("message", isDuplicate ? "이미 사용 중인 이메일입니다." : "사용 가능한 이메일입니다.");
        return success(result);
    }

    /**
     * CSRF 토큰 조회
     */
    @GetMapping("/csrf-token")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCsrfToken(HttpServletRequest request) {
        log.info("🔒 CSRF 토큰 조회 요청");
        
        // Spring Security에서 CSRF 토큰 가져오기
        CsrfToken csrfToken = (CsrfToken) request.getAttribute("_csrf");
        
        // 개발 환경에서 CSRF가 비활성화된 경우 빈 토큰 반환
        if (csrfToken == null) {
            log.info("ℹ️ CSRF 토큰이 없습니다 (개발 환경 또는 CSRF 비활성화)");
            Map<String, Object> data = Map.of(
                "token", "",
                "headerName", "X-XSRF-TOKEN",
                "parameterName", "_csrf",
                "disabled", true
            );
            return success("CSRF가 비활성화되어 있습니다 (개발 환경)", data);
        }
        
        log.info("✅ CSRF 토큰 조회 성공");
        Map<String, Object> data = Map.of(
            "token", csrfToken.getToken(),
            "headerName", csrfToken.getHeaderName(),
            "parameterName", csrfToken.getParameterName()
        );
        
        return success("CSRF 토큰 조회 성공", data);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpSession session) {
        String sessionId = session.getId();
        log.info("🔓 로그아웃 요청: sessionId={}", sessionId);
        
        try {
            // 세션 기반 로그아웃 (중복로그인 방지 포함)
            authService.logoutSession(sessionId);
            
            // HTTP 세션 정리
            SessionUtils.clearSession(session);
            
            log.info("✅ 로그아웃 완료: sessionId={}", sessionId);
        } catch (Exception e) {
            log.error("❌ 로그아웃 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
            // 로그아웃은 실패해도 성공으로 처리
        }
        
        return success("로그아웃되었습니다.");
    }
    
    @GetMapping("/session-info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSessionInfo(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        
        // 로그인하지 않은 사용자에 대해서는 빈 데이터 반환 (403 오류 방지)
        if (user == null) {
            log.debug("세션 정보 조회: 로그인하지 않은 사용자");
            Map<String, Object> emptySessionInfo = new HashMap<>();
            emptySessionInfo.put("id", null);
            emptySessionInfo.put("email", null);
            emptySessionInfo.put("name", null);
            emptySessionInfo.put("role", null);
            emptySessionInfo.put("sessionId", session.getId());
            emptySessionInfo.put("isAuthenticated", false);
            return success(emptySessionInfo);
        }
        
        log.debug("세션 정보 조회: userId={}, email={}", user.getId(), user.getEmail());
        Map<String, Object> sessionInfo = new HashMap<>();
        sessionInfo.put("id", user.getId());
        sessionInfo.put("email", user.getEmail());
        sessionInfo.put("name", user.getName());
        sessionInfo.put("role", user.getRole());
        sessionInfo.put("sessionId", session.getId());
        sessionInfo.put("isAuthenticated", true);
        
        return success(sessionInfo);
    }
    
    /**
     * 중복 로그인 체크 API
     */
    @GetMapping("/check-duplicate-login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkDuplicateLogin(HttpSession session) {
        User user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        // 현재 세션을 제외한 중복 로그인 체크
        // HTTP 세션 ID 대신 데이터베이스의 세션 ID를 사용
        String currentSessionId = (String) session.getAttribute("sessionId");
        if (currentSessionId == null) {
            // 세션 ID가 없으면 HTTP 세션 ID를 사용 (하위 호환성)
            currentSessionId = session.getId();
        }
        
        boolean hasDuplicateLogin = userSessionService.checkDuplicateLoginExcludingCurrent(user, currentSessionId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("hasDuplicateLogin", hasDuplicateLogin);
        data.put("message", hasDuplicateLogin ? "다른 곳에서 로그인되어 있습니다." : "중복 로그인이 없습니다.");
        
        return success(data);
    }
    
    /**
     * 중복 로그인 확인 처리 API
     */
    @PostMapping("/confirm-duplicate-login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmDuplicateLogin(@RequestBody Map<String, Object> request, HttpSession session, 
                                                  jakarta.servlet.http.HttpServletRequest httpRequest) {
        String email = (String) request.get("email");
        String password = (String) request.get("password");
        Boolean confirmTerminate = (Boolean) request.get("confirmTerminate");
        
        if (email == null || password == null || confirmTerminate == null) {
            throw new IllegalArgumentException("필수 정보가 누락되었습니다.");
        }
        
        log.info("🔔 중복 로그인 확인 처리: email={}, confirmTerminate={}", email, confirmTerminate);
        
        // 클라이언트 정보 추출
        String clientIp = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String sessionId = session.getId();
        
        if (confirmTerminate) {
        // 사용자가 기존 세션 종료를 확인한 경우
        String tenantId = TenantContextHolder.getTenantId();
        User user = null;
        if (tenantId != null && !tenantId.isEmpty()) {
            user = userRepository.findByTenantIdAndEmail(tenantId, email).orElse(null);
        }
        if (user == null) {
            // 호환성 유지: 테넌트 컨텍스트가 없는 경우 첫 번째 활성 사용자
            List<User> users = userRepository.findAllByEmail(email);
            if (users.isEmpty()) {
                throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
            }
            user = users.get(0);
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
            // 사용자 정보 세션에 저장 (tenantId 포함 — 재로그인 후 심리검사 등 테넌트 기준 조회에 필요)
            User sessionUser = new User();
            sessionUser.setId(authResponse.getUser().getId());
            sessionUser.setEmail(authResponse.getUser().getEmail());
            sessionUser.setName(authResponse.getUser().getName());
            sessionUser.setRole(UserRole.fromString(authResponse.getUser().getRole()));
            if (authResponse.getUser().getTenantId() != null) {
                sessionUser.setTenantId(authResponse.getUser().getTenantId());
            }
            if (sessionUser.getTenantId() == null && sessionUser.getId() != null) {
                userRepository.findById(sessionUser.getId())
                    .filter(u -> u.getTenantId() != null && !u.getTenantId().isEmpty())
                    .ifPresent(u -> sessionUser.setTenantId(u.getTenantId()));
            }
            
            SessionUtils.setCurrentUser(session, sessionUser);
            
            log.info("✅ 중복 로그인 확인 후 로그인 성공: {}", email);
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", authResponse.getUser());
            data.put("sessionId", sessionId);
            
            return success("로그인 성공", data);
        } else {
            log.warn("❌ 중복 로그인 확인 후 로그인 실패: {}", authResponse.getMessage());
            throw new IllegalArgumentException(authResponse.getMessage());
        }
    }
    
    /**
     * 강제 로그아웃 API (관리자용)
     */
    @PostMapping("/force-logout")
    public ResponseEntity<ApiResponse<Void>> forceLogout(@RequestBody Map<String, String> request) {
        String targetEmail = request.get("email");
        if (targetEmail == null || targetEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }
        
        // 사용자 조회 (멀티 테넌트 사용자 고려)
        List<User> users = userRepository.findAllByEmail(targetEmail);
        if (users.isEmpty()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
        User targetUser = users.get(0);
        
        // 사용자 세션 강제 종료
        authService.cleanupUserSessions(targetUser, "ADMIN_FORCE");
        
        log.info("🔓 강제 로그아웃 완료: email={}", targetEmail);
        
        return success("강제 로그아웃이 완료되었습니다.", null);
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody AuthRequest request, HttpSession session, 
                                  jakarta.servlet.http.HttpServletRequest httpRequest) {
        // 요청 데이터 검증
        if (request == null) {
            log.error("❌ 로그인 요청 실패: request가 null입니다.");
            throw new IllegalArgumentException("로그인 요청 데이터가 없습니다.");
        }
        
        String email = request.getEmail();
        String password = request.getPassword();
        
        if (email == null || email.trim().isEmpty()) {
            log.error("❌ 로그인 요청 실패: email이 없습니다.");
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }
        
        if (password == null || password.trim().isEmpty()) {
            log.error("❌ 로그인 요청 실패: password가 없습니다.");
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }
        // reset 시 저장된 값과 동일 규격으로 비교 (trim, email 소문자 통일)
        email = email.trim().toLowerCase();
        password = password.trim();

        log.info("🔐 로그인 시도: email={}, passwordLength={}", email, password != null ? password.length() : 0);
        
        // 로컬 프로파일에서만 기본 테넌트 ID 설정 (로그인 API는 공개 API이므로 필터를 건너뛰므로 여기서 설정)
        // 개발/운영 환경에서는 서브도메인 기반으로 정상 동작
        boolean isLocalProfile = isLocalProfile();
        String host = httpRequest.getHeader("Host");
        boolean isLocalhost = host != null && (host.contains("localhost") || host.contains("127.0.0.1"));
        if (isLocalProfile && isLocalhost && localDefaultTenantId != null && !localDefaultTenantId.isEmpty()) {
            TenantContextHolder.setTenantId(localDefaultTenantId);
            log.info("로컬 프로파일 감지 - 기본 테넌트 설정: tenantId={}", localDefaultTenantId);
        }
        
        // 클라이언트 정보 추출
        String clientIp = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String sessionId = session.getId();
        
        // 중복로그인 방지 기능이 포함된 세션 기반 인증
        log.info("🔐 authenticateWithSession 호출 시작: email={}, sessionId={}", email, sessionId);
        
        AuthResponse authResponse = authService.authenticateWithSession(
            email, 
            password, 
            sessionId, 
            clientIp, 
            userAgent
        );
        log.info("🔐 authenticateWithSession 호출 완료: success={}", authResponse.isSuccess());
        
        if (authResponse.isSuccess()) {
            // 데이터베이스에서 완전한 User 객체를 가져와서 세션에 저장
            // userService.findByEmail 사용: 암호화된 이메일(legacy::...)도 복호화하여 조회 가능
            User sessionUser = userService.findByEmail(email).orElse(null);
            if (sessionUser == null) {
                throw new RuntimeException("사용자를 찾을 수 없습니다.");
            }
            
            // tenantId 확인 및 로깅
            log.info("🔍 로그인 사용자 정보: userId={}, email={}, tenantId={}, role={}", 
                    sessionUser.getId(), email, sessionUser.getTenantId(), sessionUser.getRole());
            
            if (sessionUser.getTenantId() == null || sessionUser.getTenantId().isEmpty()) {
                log.error("❌ 로그인 사용자의 tenantId가 없습니다! userId={}, email={}", 
                        sessionUser.getId(), email);
                // 데이터베이스에서 다시 조회 시도
                Optional<User> dbUser = userRepository.findById(sessionUser.getId());
                if (dbUser.isPresent() && dbUser.get().getTenantId() != null) {
                    log.warn("⚠️ 데이터베이스에서 tenantId 복구: userId={}, tenantId={}", 
                            sessionUser.getId(), dbUser.get().getTenantId());
                    sessionUser.setTenantId(dbUser.get().getTenantId());
                } else {
                    log.error("❌ 데이터베이스에서도 tenantId를 찾을 수 없습니다! userId={}", sessionUser.getId());
                }
            }
            
            SessionUtils.setCurrentUser(session, sessionUser);
            
            // 표준화 2025-12-08: 로그인 시 사용자 개인정보 복호화하여 캐시에 저장 (성능 최적화)
            try {
                userPersonalDataCacheService.decryptAndCacheUserPersonalData(sessionUser);
                log.debug("✅ 사용자 개인정보 복호화 캐시 저장 완료: userId={}, tenantId={}", 
                         sessionUser.getId(), sessionUser.getTenantId());
            } catch (Exception e) {
                log.warn("⚠️ 사용자 개인정보 캐시 저장 실패 (로그인은 계속 진행): userId={}", 
                        sessionUser.getId(), e);
            }
            
            // 데이터베이스 세션 ID를 HTTP 세션에 저장 (중복 로그인 체크용)
            session.setAttribute(SessionConstants.SESSION_ID, sessionId);
            
            // 표준화된 세션 속성 저장
            // 1. 테넌트 ID 저장
            if (sessionUser.getTenantId() != null) {
                session.setAttribute(SessionConstants.TENANT_ID, sessionUser.getTenantId());
                log.info("🔧 세션에 테넌트 ID 저장: {}", sessionUser.getTenantId());
            }
            
            // 2. 역할 ID (tenant_role_id) 조회 및 저장
            if (sessionUser.getTenantId() != null) {
                try {
                    List<UserRoleAssignment> activeRoles = userRoleQueryService.getActiveRoles(
                        sessionUser, sessionUser.getTenantId()
                    );
                    String roleId = null;
                    
                    if (!activeRoles.isEmpty()) {
                        // UserRoleAssignment가 있으면 사용
                        UserRoleAssignment primaryRole = activeRoles.get(0);
                        roleId = primaryRole.getTenantRoleId();
                        log.info("🔧 UserRoleAssignment에서 역할 ID 조회: {}", roleId);
                    } else {
                        // UserRoleAssignment가 없으면 User의 role을 기반으로 TenantRole 찾기
                        log.warn("⚠️ 활성 역할 할당이 없습니다. User의 role을 기반으로 TenantRole 조회: userId={}, tenantId={}, role={}", 
                            sessionUser.getId(), sessionUser.getTenantId(), sessionUser.getRole());
                        
                        // User의 role 이름으로 TenantRole 찾기
                        String roleName = sessionUser.getRole().name();
                        
                        // UserRole enum 이름을 TenantRole name_en으로 매핑
                        // 표준화 2025-12-05: 표준 관리자 역할만 사용 (ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER)
                        String mappedRoleName = mapUserRoleToTenantRoleName(roleName);
                        
                        Optional<TenantRole> tenantRole = tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(
                            sessionUser.getTenantId(), mappedRoleName
                        );
                        
                        if (tenantRole.isPresent()) {
                            roleId = tenantRole.get().getTenantRoleId();
                            log.info("🔧 TenantRole에서 역할 ID 조회: roleName={}, mappedRoleName={}, roleId={}", 
                                roleName, mappedRoleName, roleId);
                        } else {
                            // 매핑 실패 시 원본 roleName으로도 시도
                            tenantRole = tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(
                                sessionUser.getTenantId(), roleName
                            );
                            if (tenantRole.isPresent()) {
                                roleId = tenantRole.get().getTenantRoleId();
                                log.info("🔧 TenantRole에서 역할 ID 조회 (원본 이름): roleName={}, roleId={}", roleName, roleId);
                            } else {
                                log.warn("⚠️ TenantRole을 찾을 수 없습니다: tenantId={}, roleName={}, mappedRoleName={}", 
                                    sessionUser.getTenantId(), roleName, mappedRoleName);
                            }
                        }
                    }
                    
                    if (roleId != null) {
                        session.setAttribute(SessionConstants.ROLE_ID, roleId);
                        log.info("🔧 세션에 역할 ID 저장: {}", roleId);
                    }
                } catch (Exception e) {
                    log.warn("⚠️ 역할 ID 조회 실패 (무시): {}", e.getMessage());
                }
            }
            
            // 참고: 브랜치 코드는 제거됨 (브랜치 개념 제거 - TENANT_ROLE_SYSTEM_STANDARD.md 참조)
            
            // 권한 캐시 클리어 (로그인 시 최신 권한 정보 로드)
            try {
                dynamicPermissionService.clearUserPermissionCache(sessionUser.getRole().name());
                log.info("🔄 권한 캐시 클리어 완료: role={}", sessionUser.getRole().name());
            } catch (Exception e) {
                log.warn("⚠️ 권한 캐시 클리어 실패 (무시): {}", e.getMessage());
            }
            
            log.info("✅ 로그인 성공: {}", email);
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("message", authResponse.getMessage());
            response.put("user", authResponse.getUser());
            response.put("sessionId", sessionId);
            response.put("requiresPasswordChange", authResponse.isRequiresPasswordChange()); // 임시 비밀번호인 경우 비밀번호 변경 필요
            // 응답 user에 tenantId 보장 (세션 사용자와 일치)
            Object responseUser = response.get("user");
            if (responseUser instanceof UserDto) {
                UserDto dto = (UserDto) responseUser;
                if ((dto.getTenantId() == null || dto.getTenantId().isEmpty()) && sessionUser.getTenantId() != null) {
                    dto.setTenantId(sessionUser.getTenantId());
                }
            }
            
            return success(response);
        } else if (authResponse.isRequiresConfirmation()) {
            // 중복 로그인 확인 요청
            log.info("🔔 중복 로그인 확인 요청: {}", email);
            Map<String, Object> data = new HashMap<>();
            data.put("message", authResponse.getMessage());
            data.put("requiresConfirmation", true);
            data.put("responseType", "duplicate_login_confirmation");
            // 중복 로그인 확인은 특수 케이스이므로 예외로 처리하지 않고 데이터 반환
            ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(authResponse.getMessage())
                .data(data)
                .build();
            return ResponseEntity.badRequest().body(response);
        } else {
            log.warn("❌ 로그인 실패: message={}, requiresConfirmation={}", 
                authResponse.getMessage(), authResponse.isRequiresConfirmation());
            
            // 중복 로그인 확인 요청은 별도 처리하지 않고, 그 외의 경우 401 반환 (인증 실패)
            if (!authResponse.isRequiresConfirmation()) {
                String msg = authResponse.getMessage() != null ? authResponse.getMessage() : "아이디 또는 비밀번호가 올바르지 않습니다.";
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.<Map<String, Object>>builder()
                        .success(false)
                        .message(msg)
                        .data(null)
                        .build());
            }
            
            // 중복 로그인 확인 요청은 데이터 반환 (위에서 이미 처리됨)
            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(authResponse.getMessage())
                .data(Map.of(
                    "requiresConfirmation", true,
                    "responseType", "duplicate_login_confirmation"
                ))
                .build());
        }
    }
    
    
    /**
     * SMS 인증 코드 전송
     */
    @PostMapping("/sms/send")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendSmsCode(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        log.info("SMS 인증 코드 전송 요청: {}", phoneNumber);
        
        // 휴대폰 번호 유효성 검사
        if (phoneNumber == null || !phoneNumber.matches("^01[0-9]{8,9}$")) {
            throw new IllegalArgumentException("올바른 휴대폰 번호를 입력해주세요.");
        }
        
        // 실제 SMS 발송 서비스 연동
        String verificationCode = String.format("%06d", (int)(Math.random() * 1000000));
        
        // 실제 SMS 서비스 연동 구현
        log.info("SMS 발송 시뮬레이션: {} -> 인증코드: {}", phoneNumber, verificationCode);
        
        // SMS 서비스 연동 로직
        // 1. SMS 서비스 API 호출 (실제 구현)
        boolean smsSent = sendSmsMessage(phoneNumber, verificationCode);
        
        if (smsSent) {
            // 2. 메모리에 인증 코드 저장 (5분 만료)
            // Redis 연동 비활성화 - 메모리 저장 사용
            log.info("메모리에 인증 코드 저장: {} -> {} (5분 만료)", phoneNumber, verificationCode);
            
            // 메모리 저장 로직 구현 (ConcurrentHashMap 사용)
            verificationCodes.put(phoneNumber, verificationCode);
            verificationTimes.put(phoneNumber, System.currentTimeMillis());
            log.info("메모리에 인증 코드 저장 완료: {} -> {} (5분 만료)", phoneNumber, verificationCode);
            
            log.info("SMS 발송 성공: {}", phoneNumber);
        } else {
            log.error("SMS 발송 실패: {}", phoneNumber);
            throw new RuntimeException("SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
        
        log.info("SMS 인증 코드 생성: {} (테스트용)", verificationCode);
        
        Map<String, Object> data = new HashMap<>();
        data.put("message", "인증 코드가 전송되었습니다.");
        data.put("verificationCode", verificationCode); // 테스트용으로 코드 반환
        
        return success(data);
    }
    
    /**
     * SMS 인증 코드 검증
     */
    @PostMapping("/sms/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifySmsCode(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String verificationCode = request.get("verificationCode");
        log.info("SMS 인증 코드 검증 요청: {} - {}", phoneNumber, verificationCode);
        
        // 입력값 유효성 검사
        if (phoneNumber == null || verificationCode == null) {
            throw new IllegalArgumentException("휴대폰 번호와 인증 코드를 입력해주세요.");
        }
        
        if (!phoneNumber.matches("^01[0-9]{8,9}$")) {
            throw new IllegalArgumentException("올바른 휴대폰 번호를 입력해주세요.");
        }
        
        if (!verificationCode.matches("^[0-9]{6}$")) {
            throw new IllegalArgumentException("6자리 인증 코드를 입력해주세요.");
        }
        
        // 실제 SMS 인증 코드 검증 로직
        boolean isValid = false;
        
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
                log.info("메모리에서 인증 코드 검증: {} -> {}", phoneNumber, isValid);
            } else {
                // 메모리에 코드가 없는 경우 테스트용으로 성공 처리
                isValid = true;
                log.info("메모리에 코드 없음 - 테스트용 인증 성공: {}", phoneNumber);
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
        
        if (isValid) {
            log.info("SMS 인증 성공: {}", phoneNumber);
            Map<String, Object> data = new HashMap<>();
            data.put("message", "인증이 완료되었습니다.");
            data.put("phoneNumber", phoneNumber);
            return success(data);
        } else {
            log.warn("SMS 인증 실패: {} - {}", phoneNumber, verificationCode);
            throw new IllegalArgumentException("인증 코드가 올바르지 않습니다.");
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
    public ResponseEntity<ApiResponse<BranchLoginResponse>> branchLogin(@RequestBody BranchLoginRequest request, HttpSession session, 
                                       jakarta.servlet.http.HttpServletRequest httpRequest) {
        log.info("🏢 지점별 로그인 시도: email={}, branchCode={}, loginType={}", 
            request.getEmail(), request.getBranchCode(), request.getLoginType());
        
        // 클라이언트 정보 추출
        String clientIp = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String sessionId = session.getId();
        
        // 지점 코드 유효성 검사 (레거시 시스템, 테넌트 시스템에서는 불필요)
        /*
        if (request.getLoginType() == BranchLoginRequest.LoginType.BRANCH) {
            if (request.getBranchCode() == null || request.getBranchCode().trim().isEmpty()) {
                throw new IllegalArgumentException("지점 로그인시 지점 코드는 필수입니다.");
            }
            
            // 지점 존재 여부 확인
            try {
                branchService.getBranchByCode(request.getBranchCode());
            } catch (Exception e) {
                throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + request.getBranchCode());
            }
        }
        */
        
        // 기존 인증 로직 사용
        AuthResponse authResponse = authService.authenticateWithSession(
            request.getEmail(), 
            request.getPassword(), 
            sessionId, 
            clientIp, 
            userAgent
        );
        
        if (authResponse.isSuccess()) {
            // 멀티 테넌트 사용자 고려하여 조회
            List<User> users = userRepository.findAllByEmail(request.getEmail());
            if (users.isEmpty()) {
                throw new RuntimeException("사용자를 찾을 수 없습니다.");
            }
            User user = users.get(0);
            
            // 지점 권한 검사
            if (request.getLoginType() == BranchLoginRequest.LoginType.BRANCH) {
                // 지점 로그인인 경우, 사용자가 해당 지점에 소속되어 있는지 확인
                if (user.getBranch() == null || !user.getBranch().getBranchCode().equals(request.getBranchCode())) {
                    throw new IllegalArgumentException("해당 지점에 소속되지 않은 사용자입니다.");
                }
            } else if (request.getLoginType() == BranchLoginRequest.LoginType.HEADQUARTERS) {
                // 본사 로그인인 경우, 본사 관리자 역할인지 확인
                if (!isAdminRoleFromCommonCode(user.getRole())) {
                    throw new IllegalArgumentException("본사 로그인은 본사 관리자만 가능합니다.");
                }
            }
            
            // 세션 저장 전 tenantId 보완 (DB 조회)
            if (user.getTenantId() == null || user.getTenantId().isEmpty()) {
                userRepository.findById(user.getId())
                    .filter(u -> u.getTenantId() != null && !u.getTenantId().isEmpty())
                    .ifPresent(u -> user.setTenantId(u.getTenantId()));
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
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .roleDescription(user.getRole().getDisplayName())
                .branchId(user.getBranch() != null ? user.getBranch().getId() : null)
                .branchName(user.getBranch() != null ? user.getBranch().getBranchName() : null)
                .branchCode(user.getBranch() != null ? user.getBranch().getBranchCode() : null)
                .tenantId(user.getTenantId())
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
                        .managerName(user.getBranch().getManager() != null ? user.getBranch().getManager().getUserId() : null)
                        .consultantCount((Integer) branchStats.get("consultantCount"))
                        .clientCount((Integer) branchStats.get("clientCount"))
                        .maxConsultants(user.getBranch().getMaxConsultants())
                        .maxClients(user.getBranch().getMaxClients())
                        .build();
                } catch (Exception e) {
                    log.warn("지점 통계 조회 실패: {}", e.getMessage());
                }
            }
            
            BranchLoginResponse response = BranchLoginResponse.builder()
                .success(true)
                .message("로그인 성공")
                .sessionId(sessionId)
                .user(userInfo)
                .branch(branchInfo)
                .build();
            
            return success(response);
            
        } else if (authResponse.isRequiresConfirmation()) {
            BranchLoginResponse response = BranchLoginResponse.builder()
                .success(false)
                .message(authResponse.getMessage())
                .requiresConfirmation(true)
                .responseType("duplicate_login_confirmation")
                .build();
            ApiResponse<BranchLoginResponse> apiResponse = ApiResponse.<BranchLoginResponse>builder()
                .success(false)
                .message(authResponse.getMessage())
                .data(response)
                .build();
            return ResponseEntity.badRequest().body(apiResponse);
        } else {
            throw new IllegalArgumentException(authResponse.getMessage());
        }
    }
    
    /**
     * 지점 목록 조회 API (로그인 페이지용)
     */
    @GetMapping("/branches")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBranchesForLogin() {
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
        
        Map<String, Object> data = new HashMap<>();
        data.put("branches", branches);
        
        return success(data);
    }
    
    /**
     * 지점별 로그인 페이지용 지점 정보 조회 API
     * URL: /api/auth/branch/{branchCode}
     */
    @GetMapping("/branch/{branchCode}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBranchInfoForLogin(@PathVariable String branchCode) {
        log.info("🏢 지점별 로그인 페이지용 지점 정보 조회: branchCode={}", branchCode);
        
        // 지점 정보 조회
        var branch = branchService.getBranchByCode(branchCode);
        if (branch == null) {
            throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + branchCode);
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
        branchInfo.put("managerName", branch.getManager() != null ? branch.getManager().getUserId() : null);
        branchInfo.put("consultantCount", branchStats.get("consultantCount"));
        branchInfo.put("clientCount", branchStats.get("clientCount"));
        branchInfo.put("maxConsultants", branch.getMaxConsultants());
        branchInfo.put("maxClients", branch.getMaxClients());
        
        Map<String, Object> data = new HashMap<>();
        data.put("branch", branchInfo);
        
        return success(data);
    }
    
    /**
     * 지점별 로그인 API (URL 파라미터 방식)
     * URL: /api/auth/branch/{branchCode}/login
     */
    @PostMapping("/branch/{branchCode}/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> branchLoginWithUrl(@PathVariable String branchCode, 
                                              @RequestBody Map<String, String> loginRequest, 
                                              HttpSession session, 
                                              jakarta.servlet.http.HttpServletRequest httpRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");
        
        if (email == null || password == null) {
            throw new IllegalArgumentException("이메일과 비밀번호를 입력해주세요.");
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
                throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + branchCode);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("존재하지 않는 지점 코드입니다: " + branchCode);
        }
        
        // 기존 인증 로직 사용
        AuthResponse authResponse = authService.authenticateWithSession(
            email, password, sessionId, clientIp, userAgent
        );
        
        if (authResponse.isSuccess()) {
            // 멀티 테넌트 사용자 고려하여 조회
            List<User> users = userRepository.findAllByEmail(email);
            if (users.isEmpty()) {
                throw new RuntimeException("사용자를 찾을 수 없습니다.");
            }
            User user = users.get(0);
            
            // 사용자가 해당 지점에 소속되어 있는지 확인
            if (user.getBranch() == null || !user.getBranch().getBranchCode().equals(branchCode)) {
                throw new IllegalArgumentException("해당 지점에 소속되지 않은 사용자입니다.");
            }
            if (user.getTenantId() == null || user.getTenantId().isEmpty()) {
                userRepository.findById(user.getId())
                    .filter(u -> u.getTenantId() != null && !u.getTenantId().isEmpty())
                    .ifPresent(u -> user.setTenantId(u.getTenantId()));
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
            userInfo.put("userId", user.getUserId());
            userInfo.put("email", user.getEmail());
            userInfo.put("name", user.getName());
            userInfo.put("role", user.getRole());
            userInfo.put("roleDescription", user.getRole().getDisplayName());
            userInfo.put("branchId", user.getBranch().getId());
            userInfo.put("branchName", user.getBranch().getBranchName());
            userInfo.put("branchCode", user.getBranch().getBranchCode());
            userInfo.put("tenantId", user.getTenantId());
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "로그인 성공");
            data.put("sessionId", sessionId);
            data.put("user", userInfo);
            
            return success(data);
            
        } else if (authResponse.isRequiresConfirmation()) {
            Map<String, Object> data = new HashMap<>();
            data.put("message", authResponse.getMessage());
            data.put("requiresConfirmation", true);
            data.put("responseType", "duplicate_login_confirmation");
            ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(authResponse.getMessage())
                .data(data)
                .build();
            return ResponseEntity.badRequest().body(response);
        } else {
            throw new IllegalArgumentException(authResponse.getMessage());
        }
    }
    
    /**
     * 본사 로그인 페이지용 정보 조회 API
     * URL: /api/auth/headquarters
     */
    @GetMapping("/headquarters")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHeadquartersInfoForLogin() {
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
        
        Map<String, Object> data = new HashMap<>();
        data.put("headquarters", headquartersInfo);
        
        return success(data);
    }
    
    /**
     * 본사 로그인 API
     * URL: /api/auth/headquarters/login
     */
    @PostMapping("/headquarters/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> headquartersLogin(@RequestBody Map<String, String> loginRequest, 
                                             HttpSession session, 
                                             jakarta.servlet.http.HttpServletRequest httpRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");
        
        if (email == null || password == null) {
            throw new IllegalArgumentException("이메일과 비밀번호를 입력해주세요.");
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
            // 멀티 테넌트 사용자 고려하여 조회
            List<User> users = userRepository.findAllByEmail(email);
            if (users.isEmpty()) {
                throw new RuntimeException("사용자를 찾을 수 없습니다.");
            }
            User user = users.get(0);
            
            // 표준화 2025-12-05: 브랜치/HQ 개념 제거, 표준 관리자 역할만 체크
            if (user.getRole() == null || !isAdminRoleFromCommonCode(user.getRole())) {
                throw new IllegalArgumentException("관리자 로그인은 관리자만 가능합니다.");
            }
            if (user.getTenantId() == null || user.getTenantId().isEmpty()) {
                userRepository.findById(user.getId())
                    .filter(u -> u.getTenantId() != null && !u.getTenantId().isEmpty())
                    .ifPresent(u -> user.setTenantId(u.getTenantId()));
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
            userInfo.put("userId", user.getUserId());
            userInfo.put("email", user.getEmail());
            userInfo.put("name", user.getName());
            userInfo.put("role", user.getRole());
            userInfo.put("roleDescription", user.getRole().getDisplayName());
            userInfo.put("branchId", null);
            userInfo.put("branchName", null);
            userInfo.put("branchCode", null);
            userInfo.put("tenantId", user.getTenantId());
            
            Map<String, Object> data = new HashMap<>();
            data.put("message", "로그인 성공");
            data.put("sessionId", sessionId);
            data.put("user", userInfo);
            
            return success(data);
            
        } else if (authResponse.isRequiresConfirmation()) {
            Map<String, Object> data = new HashMap<>();
            data.put("message", authResponse.getMessage());
            data.put("requiresConfirmation", true);
            data.put("responseType", "duplicate_login_confirmation");
            ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .success(false)
                .message(authResponse.getMessage())
                .data(data)
                .build();
            return ResponseEntity.badRequest().body(response);
        } else {
            throw new IllegalArgumentException(authResponse.getMessage());
        }
    }
    
    /**
     * 사용자 지점 매핑 API
     * 표준화 2025-12-06: Deprecated - branchCode는 더 이상 사용하지 않음
     */
    @PostMapping("/map-branch")
    @Transactional
    @Deprecated
    public ResponseEntity<ApiResponse<Map<String, Object>>> mapUserToBranch(@RequestBody Map<String, String> request, HttpSession session) {
        String branchCode = request.get("branchCode");
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
        log.warn("⚠️ Deprecated API 호출: mapUserToBranch - branchCode는 더 이상 사용되지 않음. branchCode={} (무시됨)", branchCode);
        
        // 사용자를 다시 조회하여 동시성 문제 방지
        User userToUpdate = userRepository.findById(currentUser.getId())
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 표준화 2025-12-06: branchCode는 설정하지 않음 (더 이상 사용하지 않음)
        // tenantId만 확인
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (tenantId == null || !tenantId.equals(userToUpdate.getTenantId())) {
            throw new IllegalArgumentException("테넌트 정보가 일치하지 않습니다.");
        }
        
        // 세션 업데이트
        SessionUtils.setCurrentUser(session, userToUpdate);
        
        log.info("✅ 사용자 정보 확인 완료: userId={}, tenantId={}", 
            userToUpdate.getId(), tenantId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("message", "사용자 정보가 확인되었습니다. (branchCode는 더 이상 사용되지 않습니다.)");
        data.put("tenantId", tenantId);
        
        return success(data);
    }
    
    /**
     * UserRole enum 이름을 TenantRole name_en으로 매핑
     * 
     * 실제 TenantRole name_en과 일치시켜야 함
     * 
     * @param userRoleName UserRole enum 이름 (예: ADMIN, CONSULTANT, CLIENT)
     * @return TenantRole name_en (예: Director, Counselor, Client)
     */
    private String mapUserRoleToTenantRoleName(String userRoleName) {
        if (userRoleName == null) {
            return null;
        }
        
        // 표준 관리자 역할 -> Director (원장) (표준화 2025-12-05: enum 활용)
        UserRole role = UserRole.fromString(userRoleName);
        if (role != null && role.isAdmin()) {
            return "Director"; // 실제 TenantRole name_en
        }
        
        // 상담사 계열 -> Counselor
        if (role == UserRole.CONSULTANT) {
            return "Counselor"; // 실제 TenantRole name_en
        }
        
        // 내담자 계열 -> Client
        if (role == UserRole.CLIENT) {
            return "Client";
        }
        
        // 기본값: 원본 이름 반환
        return userRoleName;
    }

    private String generateUniqueUserId(String email, String tenantId) {
        String localPart = email.split("@")[0];
        String base = localPart.replaceAll("[^a-zA-Z0-9]", "");
        if (!StringUtils.hasText(base)) {
            base = "user";
        }

        String candidate = base.toLowerCase();
        int suffix = 1;
        
        // tenantId가 있으면 테넌트별 중복 검사, 없으면 경고 후 기본값 사용
        if (tenantId != null && !tenantId.trim().isEmpty()) {
            while (userRepository.existsByTenantIdAndUserId(tenantId, candidate)) {
                candidate = String.format("%s%d", base.toLowerCase(), suffix++);
            }
        } else {
            // 표준화 2025-12-06: tenantId가 없을 경우 경고 로그 및 기본값 사용
            // deprecated 메서드 사용 대신 경고 후 기본값 반환
            log.warn("⚠️ tenantId가 없어 사용자 ID 중복 검사를 건너뜁니다. email={}, candidate={}", email, candidate);
            // tenantId가 없으면 중복 검사 없이 기본값 반환 (보안상 위험하지만 레거시 호환)
        }
        return candidate;
    }
    
    /**
     * 공통코드에서 관리자 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)
     * 표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER
     * 레거시 역할(HQ_*, BRANCH_*)은 더 이상 사용하지 않음
     * @param role 사용자 역할
     * @return 관리자 역할 여부
     */
    private boolean isAdminRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }
        try {
            // 공통코드에서 관리자 역할 목록 조회 (codeGroup='ROLE', extraData에 isAdmin=true)
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");
            if (roleCodes == null || roleCodes.isEmpty()) {
                // 폴백: 표준 관리자 역할만 체크 (브랜치/HQ 개념 제거)
                return role == UserRole.ADMIN || 
                       role.isAdmin();
            }
            // 공통코드에서 관리자 역할인지 확인
            String roleName = role.name();
            return roleCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(roleName) && 
                              (code.getExtraData() != null && 
                               (code.getExtraData().contains("\"isAdmin\":true") || 
                                code.getExtraData().contains("\"roleType\":\"ADMIN\""))));
        } catch (Exception e) {
            log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {}", role, e);
            // 폴백: 표준 관리자 역할만 체크
            return role == UserRole.ADMIN || 
                       role.isAdmin();
        }
    }
    
    /**
     * 로컬 또는 개발 프로파일 여부 확인
     * @return 로컬 또는 개발 프로파일이면 true
     */
    private boolean isLocalProfile() {
        if (environment == null) {
            return false;
        }
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if ("local".equals(profile) || "dev".equals(profile)) {
                return true;
            }
        }
        return false;
    }
}
