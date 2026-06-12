package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.EmailConstants;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.oauth.OAuthAccountSelectionUserFacingStrings;
import com.coresolution.consultation.dto.AccountCandidate;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.dto.PasswordLoginAccountSelectionClaims;
import com.coresolution.consultation.dto.UserDto;
import com.coresolution.consultation.dto.UserResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import java.util.List;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.util.Collection;

/**
 * 인증 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
public class AuthServiceImpl implements AuthService {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserSessionService userSessionService;
    
    @Autowired
    private DynamicPermissionService dynamicPermissionService;
    
    @Autowired
    private com.coresolution.consultation.service.RefreshTokenService refreshTokenService;
    
    @Autowired
    private com.coresolution.core.repository.TenantRepository tenantRepository;
    
    @Autowired
    private com.coresolution.consultation.repository.UserRepository userRepository;
    
    @Autowired
    private com.coresolution.core.repository.UserRoleAssignmentRepository userRoleAssignmentRepository;
    
    @Autowired
    private com.coresolution.core.repository.TenantRoleRepository tenantRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PersonalDataEncryptionUtil encryptionUtil;

    /**
     * 다중 매치 계정 선택 토큰 1회 사용 추적용 in-memory 저장소.
     *
     * <p>키: 토큰 문자열, 값: 만료 epoch ms. {@code selectAccount} 호출 시 토큰을 컨슘 처리하여 재사용을
     * 차단한다(P1 — 1회 사용 정책). 운영 멀티 인스턴스 환경에서는 Redis 기반 store 로 교체 가능.</p>
     */
    private final Map<String, Long> consumedSelectionTokens = new ConcurrentHashMap<>();

    /** 다중 매치 응답 타입 식별자 — FE 가 모달/화면 전환 트리거 약속 값. */
    public static final String MULTIPLE_ACCOUNTS_RESPONSE_TYPE = "multiple_accounts_selection_required";

    // 개발 환경에서 중복 로그인 체크 비활성화 설정
    @Value("${session.duplicate-login-check.enabled:true}")
    private boolean duplicateLoginCheckEnabled;
    
    // 사용자에게 기존 세션 종료 확인 요청 설정
    @Value("${session.duplicate-login-check.ask-user-confirmation:false}")
    private boolean askUserConfirmation;
    
    @Override
    public AuthResponse authenticate(String email, String password) {
        log.info("🔐 JWT 토큰 기반 로그인 시도: email={}", EmailLogMasking.maskForLog(email));
        try {
            // Spring Security 인증
            log.debug("🔐 Spring Security 인증 시작: email={}", EmailLogMasking.maskForLog(email));
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );
            log.debug("🔐 Spring Security 인증 완료: authenticated={}", authentication.isAuthenticated());
            
            if (authentication.isAuthenticated()) {
                // 사용자 정보 조회
                User user = userService.findByLoginPrincipal(email)
                    .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
                
                // 임시 비밀번호로 로그인 차단 (isPasswordChanged = false인 경우)
                if (user.getIsPasswordChanged() != null && !user.getIsPasswordChanged()) {
                    log.warn("❌ 임시 비밀번호로 로그인 시도 차단: loginPrincipal={}, userId={}. 비밀번호 변경 링크를 통해 비밀번호를 변경한 후 로그인해주세요.", EmailLogMasking.maskForLog(email), user.getId());
                    return AuthResponse.failure("임시 비밀번호로는 로그인할 수 없습니다. 이메일로 발송된 비밀번호 변경 링크를 통해 비밀번호를 변경한 후 로그인해주세요.");
                }
                
                // Phase 3: 사용자 권한 조회
                List<String> permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
                log.debug("사용자 권한 조회 완료: userId={}, permissions={}", user.getId(), permissions);
                
                // Phase 3: 확장된 JWT 토큰 생성 (tenantId, branchId, permissions 포함)
                String token = jwtService.generateToken(user, permissions);
                // 표준화 2025-12-08: username = userId이므로 refreshToken도 userId 사용, User 객체로 생성하여 tenantId, email 포함
                String refreshToken = jwtService.generateRefreshToken(user);
                
                // Phase 3: Refresh Token 저장 (HttpServletRequest는 null로 전달, 추후 Controller에서 전달)
                try {
                    refreshTokenService.createRefreshToken(user, refreshToken, null);
                } catch (Exception e) {
                    log.warn("Refresh Token 저장 실패 (무시): {}", e.getMessage());
                }
                
                // 마지막 로그인 시간 업데이트
                userService.updateLastLoginTime(user.getId());
                
                // UserResponse 변환 (표준화된 DTO)
                UserResponse userResponse = convertToUserResponse(user);
                
                // 멀티 테넌트 사용자 확인
                List<AuthResponse.TenantInfo> accessibleTenants = checkMultiTenantUser(email);
                
                // 하위 호환성을 위해 UserDto도 생성
                UserDto userDto = userResponse != null ? convertToUserDtoFromResponse(userResponse) : null;
                
                AuthResponse.AuthResponseBuilder responseBuilder = AuthResponse.builder()
                    .success(true)
                    .message("로그인 성공")
                    .token(token)
                    .refreshToken(refreshToken)
                    .userResponse(userResponse)
                    .user(userDto) // 하위 호환성
                    .requiresPasswordChange(false); // 임시 비밀번호는 로그인 차단되므로 false
                
                if (accessibleTenants != null && !accessibleTenants.isEmpty()) {
                    // 멀티 테넌트 사용자인 경우 테넌트 선택 필요
                    responseBuilder
                        .isMultiTenant(true)
                        .requiresTenantSelection(true)
                        .accessibleTenants(accessibleTenants)
                        .responseType("tenant_selection_required");
                    
                    log.info("✅ 멀티 테넌트 사용자 로그인: email={}, tenantCount={}", EmailLogMasking.maskForLog(email), accessibleTenants.size());
                } else {
                    log.info("✅ JWT 토큰 기반 로그인 성공: userId={}, tenantId={}, branchId={}", 
                        user.getId(), user.getTenantId(), 
                        user.getBranch() != null ? user.getBranch().getId() : null);
                }
                
                return responseBuilder.build();
            } else {
                return AuthResponse.failure("인증에 실패했습니다.");
            }
        } catch (Exception e) {
            // 자격 증명 실패인 경우 사용자 친화적인 메시지 반환
            if (e.getMessage() != null && e.getMessage().contains("자격 증명에 실패하였습니다")) {
                return AuthResponse.failure("아이디 또는 비밀번호가 올바르지 않습니다.");
            }
            return AuthResponse.failure("로그인 실패: " + e.getMessage());
        }
    }
    
    @Override
    public AuthResponse refreshToken(String refreshToken) {
        try {
            // 리프레시 토큰에서 사용자 ID 추출 (표준화 2025-12-08: username = userId)
            String userId = jwtService.extractUsername(refreshToken);
            
            // 리프레시 토큰에서 tenantId 추출 (있으면 사용, 없으면 전체 조회)
            String tenantId = jwtService.extractTenantId(refreshToken);
            
            // 사용자 정보 조회 (tenantId가 있으면 테넌트별 조회, 없으면 전체 조회)
            User user;
            if (tenantId != null && !tenantId.trim().isEmpty()) {
                user = userRepository.findByTenantIdAndUserId(tenantId, userId)
                    .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: tenantId=" + tenantId + ", userId=" + userId));
            } else {
                // tenantId가 없는 경우 (레거시 토큰) - 이메일로 조회 후 userId 확인
                // userId로 직접 조회 불가능하므로, 이메일을 추출하거나 다른 방법 사용
                // 임시: refreshToken 클레임에서 email 추출 시도
                String email = jwtService.extractEmail(refreshToken);
                if (email != null && !email.trim().isEmpty()) {
                    List<User> users = userRepository.findAllByEmail(email);
                    user = users.stream()
                        .filter(u -> u.getUserId().equals(userId))
                        .findFirst()
                        .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: userId=" + userId));
                } else {
                    throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: userId=" + userId + " (tenantId 없음)");
                }
            }

            // USER_LIFECYCLE_TERMINATION_POLICY §3.6 — refresh 시 lifecycle_state 게이트 (P1)
            // ANONYMIZED / DELETED_BY_ADMIN / HARD_DELETED 등 비활성 상태의 refresh 차단.
            // 거부 메시지는 lifecycle 값 노출 금지 (보안 — 단일 사유로 통일).
            LifecycleState lifecycleState = user.getLifecycleState();
            if (lifecycleState == null || !LifecycleState.ACTIVE_LIKE_STATES.contains(lifecycleState)) {
                log.warn("Refresh denied: userId={}, lifecycleState={}", user.getId(), lifecycleState);
                return AuthResponse.failure("계정이 비활성 상태입니다.");
            }

            // 리프레시 토큰 유효성 검사
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            if (!jwtService.isTokenValid(refreshToken, userDetails)) {
                return AuthResponse.failure("유효하지 않은 리프레시 토큰입니다.");
            }
            
            // Phase 3: 사용자 권한 조회
            List<String> permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
            
            // Phase 3: 확장된 JWT 토큰 생성 (tenantId, branchId, permissions 포함)
            String newToken = jwtService.generateToken(user, permissions);
            
            // Phase 3: Refresh Token 로테이션 (기존 토큰 무효화 후 새 토큰 저장)
            // 기존 refreshToken에서 tokenId 추출
            String oldTokenId = jwtService.extractTokenId(refreshToken);
            if (oldTokenId != null && !oldTokenId.trim().isEmpty()) {
                try {
                    // 기존 토큰 무효화
                    refreshTokenService.revokeRefreshToken(oldTokenId);
                    log.info("✅ 기존 Refresh Token 무효화 완료: tokenId={}", oldTokenId);
                } catch (Exception e) {
                    log.warn("⚠️ 기존 Refresh Token 무효화 실패 (계속 진행): tokenId={}, error={}", 
                        oldTokenId, e.getMessage());
                }
            } else {
                log.debug("기존 Refresh Token에 tokenId가 없음 (구버전 토큰 또는 첫 로그인)");
            }
            
            // 새 Refresh Token 생성 및 저장
            String newRefreshToken;
            try {
                // tokenId를 먼저 생성하고, 이를 포함한 refreshToken 생성
                // 1. tokenId 생성 (UUID)
                String newTokenId = java.util.UUID.randomUUID().toString();
                
                // 2. tokenId를 포함한 refreshToken JWT 생성 (표준화 2025-12-08: User 객체 사용하여 tenantId, email 포함)
                newRefreshToken = jwtService.generateRefreshToken(user, newTokenId);
                
                // 3. refreshToken 해시 생성 및 DB 저장
                refreshTokenService.createRefreshToken(user, newRefreshToken, null);
                
                log.info("✅ 새 Refresh Token 생성 완료: tokenId={}", newTokenId);
            } catch (Exception e) {
                log.warn("⚠️ Refresh Token 저장 실패 (기본 토큰 생성): {}", e.getMessage());
                // 새 토큰 생성 실패 시에도 기본 refreshToken 생성 (tokenId 없음, 표준화 2025-12-08: User 객체 사용)
                newRefreshToken = jwtService.generateRefreshToken(user);
            }
            
            // UserResponse 변환 (표준화된 DTO)
            UserResponse userResponse = convertToUserResponse(user);
            
            log.info("✅ JWT 토큰 갱신 성공: userId={}, tenantId={}, branchId={}", 
                user.getId(), user.getTenantId(), 
                user.getBranch() != null ? user.getBranch().getId() : null);
            
            return AuthResponse.success("토큰 갱신 성공", newToken, newRefreshToken, userResponse);
        } catch (Exception e) {
            return AuthResponse.failure("토큰 갱신 실패: " + e.getMessage());
        }
    }
    
    @Override
    public void logout(String token) {
        // JWT는 stateless이므로 서버에서 별도 처리할 것이 없음
        // 클라이언트에서 토큰을 삭제하면 됨
        // 향후 블랙리스트 기능 추가 가능
    }
    
    @Override
    public AuthResponse authenticateWithSession(String email, String password, String sessionId, String clientIp, String userAgent) {
        try {
            log.info("🔐 세션 기반 로그인 시도: email={}, sessionId={}", EmailLogMasking.maskForLog(email), sessionId);
            
            // 먼저 중복 세션 정리 (같은 sessionId를 가진 중복 세션 삭제)
            log.info("🧹 중복 세션 정리 시작: sessionId={}", sessionId);
            System.out.println("🧹 중복 세션 정리 시작: sessionId=" + sessionId);
            try {
                int cleanedCount = userSessionService.cleanupDuplicateSessions(sessionId);
                if (cleanedCount > 0) {
                    log.info("🧹 중복 세션 정리 완료: sessionId={}, cleanedCount={}", sessionId, cleanedCount);
                    System.out.println("🧹 중복 세션 정리 완료: sessionId=" + sessionId + ", cleanedCount=" + cleanedCount);
                } else {
                    log.info("✅ 중복 세션 없음: sessionId={}", sessionId);
                    System.out.println("✅ 중복 세션 없음: sessionId=" + sessionId);
                }
            } catch (Exception e) {
                log.error("❌ 중복 세션 정리 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
                System.out.println("❌ 중복 세션 정리 실패: sessionId=" + sessionId + ", error=" + e.getMessage());
            }

            // P1 silent first 차단 — 휴대폰 로그인 다중 매치 preflight.
            //  - 이메일 또는 후보 0/1 명: null 반환 → Spring Security 표준 흐름.
            //  - 후보 2명 이상 + 비밀번호 1개 일치: 단일 사용자로 정상 로그인 응답.
            //  - 후보 2명 이상 + 비밀번호 2개 이상 일치: 다중 매치 응답(계정 선택).
            AuthResponse multiMatchResponse = handlePhonePasswordMultiMatch(email, password,
                sessionId, clientIp, userAgent);
            if (multiMatchResponse != null) {
                return multiMatchResponse;
            }

            // Spring Security 인증
            log.info("🔐 Spring Security 인증 시도 시작: email={}", EmailLogMasking.maskForLog(email));
            Authentication authentication = null;
            try {
                authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
                );
                log.info("🔐 Spring Security 인증 완료: authenticated={}", authentication != null && authentication.isAuthenticated());
            } catch (Exception e) {
                log.error("❌ Spring Security 인증 실패: email={}, error={}, class={}", EmailLogMasking.maskForLog(email), e.getMessage(), e.getClass().getName(), e);
                throw e;
            }

            if (authentication != null && authentication.isAuthenticated()) {
                log.info("🔐 Spring Security 인증 성공: email={}", EmailLogMasking.maskForLog(email));

                // 사용자 정보 조회 — 휴대폰 다중 매치는 preflight 에서 이미 분기됨.
                log.info("👤 사용자 정보 조회 시작: loginPrincipal={}", EmailLogMasking.maskForLog(email));
                User user = userService.findByLoginPrincipal(email)
                    .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

                log.info("👤 사용자 정보 조회 완료: userId={}, email={}, tenantId={}, role={}",
                    user.getId(), EmailLogMasking.maskForLog(user.getEmail()), user.getTenantId(), user.getRole());

                return finalizeAuthenticatedSession(user, sessionId, clientIp, userAgent);

            } else {
                return AuthResponse.failure("인증에 실패했습니다.");
            }
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            log.warn("❌ 인증 실패 (자격 증명 오류): email={}", EmailLogMasking.maskForLog(email));
            return AuthResponse.failure("아이디 또는 비밀번호가 올바르지 않습니다.");
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
            log.warn("❌ 사용자를 찾을 수 없음: email={}, error={}", EmailLogMasking.maskForLog(email), e.getMessage());
            return AuthResponse.failure("아이디 또는 비밀번호가 올바르지 않습니다.");
        } catch (IllegalArgumentException e) {
            log.error("❌ 잘못된 인수: email={}, error={}", EmailLogMasking.maskForLog(email), e.getMessage());
            // IllegalArgumentException은 그대로 전달하여 GlobalExceptionHandler에서 400으로 처리되도록 함
            throw e;
        } catch (RuntimeException e) {
            log.error("❌ 런타임 오류: email={}, error={}", EmailLogMasking.maskForLog(email), e.getMessage(), e);
            // RuntimeException도 그대로 전달
            throw e;
        } catch (Exception e) {
            log.error("❌ 세션 기반 로그인 실패: email={}, error={}, class={}", EmailLogMasking.maskForLog(email), e.getMessage(), e.getClass().getName(), e);
            
            // 자격 증명 실패인 경우 사용자 친화적인 메시지 반환
            if (e.getMessage() != null && e.getMessage().contains("자격 증명에 실패하였습니다")) {
                return AuthResponse.failure("아이디 또는 비밀번호가 올바르지 않습니다.");
            }
            // 기타 예외는 RuntimeException으로 래핑하여 전달
            throw new RuntimeException("로그인 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    public void logoutSession(String sessionId) {
        try {
            log.info("🔓 세션 로그아웃: sessionId={}", sessionId);
            
            // 세션 비활성화
            boolean success = userSessionService.deactivateSession(sessionId, SessionManagementConstants.END_REASON_LOGOUT);
            
            if (success) {
                log.info("✅ 세션 로그아웃 완료: sessionId={}", sessionId);
            } else {
                log.warn("⚠️ 세션 로그아웃 실패: sessionId={}", sessionId);
            }
            
        } catch (Exception e) {
            log.error("❌ 세션 로그아웃 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
        }
    }
    
    @Override
    public boolean checkDuplicateLogin(User user) {
        try {
            long activeSessionCount = userSessionService.getActiveSessionCount(user);
            return activeSessionCount > 0;
        } catch (Exception e) {
            log.error("❌ 중복 로그인 체크 실패: userId={}, error={}", user.getId(), e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public void cleanupUserSessions(User user, String reason) {
        try {
            log.info("🧹 사용자 세션 정리: userId={}, reason={}", user.getId(), reason);
            
            int cleanedCount = userSessionService.deactivateAllUserSessions(user, reason);
            
            log.info("✅ 사용자 세션 정리 완료: userId={}, cleanedCount={}", user.getId(), cleanedCount);
            
        } catch (Exception e) {
            log.error("❌ 사용자 세션 정리 실패: userId={}, reason={}, error={}", 
                     user.getId(), reason, e.getMessage(), e);
        }
    }
    
    @Override
    public void forgotPassword(String email) {
        try {
            log.info("비밀번호 재설정 요청: email={}", EmailLogMasking.maskForLog(email));
            
            // 사용자 존재 확인
            User user = userService.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
            
            // 비밀번호 재설정 토큰 생성
            String resetToken = jwtService.generateToken(email);
            
            // 비밀번호 재설정 이메일 발송
            sendPasswordResetEmail(email, user.getName(), resetToken);
            
            log.info("비밀번호 재설정 이메일 발송 완료: email={}", EmailLogMasking.maskForLog(email));
            
        } catch (Exception e) {
            log.error("비밀번호 재설정 이메일 발송 실패: email={}, error={}", EmailLogMasking.maskForLog(email), e.getMessage(), e);
        }
    }
    
    @Override
    public void resetPassword(String token, String newPassword) {
        try {
            log.info("비밀번호 재설정 처리: token={}", token);
            
            // 토큰에서 이메일 추출
            String email = jwtService.extractUsername(token);
            
            // 사용자 존재 확인
            User user = userService.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
            
            // 토큰 유효성 검사
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (!jwtService.isTokenValid(token, userDetails)) {
                throw new RuntimeException("유효하지 않은 토큰입니다.");
            }
            
            // 비밀번호 변경
            userService.changePassword(user.getId(), null, newPassword);
            
            // 비밀번호 재설정 완료 이메일 발송
            sendPasswordResetSuccessEmail(email, user.getName());
            
            log.info("비밀번호 재설정 완료: email={}", EmailLogMasking.maskForLog(email));
            
        } catch (Exception e) {
            log.error("비밀번호 재설정 실패: token={}, error={}", token, e.getMessage(), e);
            throw new RuntimeException("비밀번호 재설정에 실패했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 입점사(코어솔루션 테넌트)만 접근 가능하도록 검증
     * Trinity 회사 직원(ADMIN/OPS 역할 + tenant_id가 NULL)은 메인 웹앱에 로그인할 수 없음
     * Trinity 직원은 Ops Portal(ops.e-trinity.co.kr)을 사용해야 함
     * 
     * @param user 사용자 엔티티
     * @throws IllegalArgumentException Trinity 회사 직원(ADMIN/OPS 역할 + tenant_id가 NULL)인 경우
     */
    private void validateCoreSolutionTenantAccess(User user) {
        log.debug("🔍 입점사 접근 검증 시작: email={}, role={}, tenantId={}", 
            EmailLogMasking.maskForLog(user.getEmail()), user.getRole(), user.getTenantId());
        
        // tenant_id가 NULL이거나 비어있는 경우 Trinity 직원으로 간주
        // tenant_id가 있는 경우는 테넌트 관리자로 간주하여 허용
        if (user.getTenantId() == null || user.getTenantId().trim().isEmpty()) {
            // 사용자의 권한 확인
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication != null && authentication.isAuthenticated()) {
                Collection<? extends GrantedAuthority> authorities = 
                    authentication.getAuthorities();
                
                log.debug("🔍 인증 정보 확인: principal={}, authorities={}", 
                    authentication.getPrincipal(), authorities);
                
                // ADMIN 또는 OPS 역할이 있으면 Trinity 회사 직원으로 간주
                boolean hasAdminOrOpsRole = authorities.stream()
                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN") || 
                                   auth.getAuthority().equals("ROLE_OPS"));
                
                if (hasAdminOrOpsRole) {
                    log.warn("❌ 메인 웹앱 로그인 거부: Trinity 회사 직원은 입점사 전용 시스템에 접근할 수 없습니다. email={}, role={}", 
                        EmailLogMasking.maskForLog(user.getEmail()), user.getRole());
                    throw new IllegalArgumentException("Trinity 회사 직원은 입점사 전용 시스템에 접근할 수 없습니다. Ops Portal(ops.e-trinity.co.kr)을 사용해주세요.");
                }
            } else {
                // 인증 정보가 없는 경우, User 엔티티의 role로 확인
                log.debug("🔍 SecurityContext에 인증 정보 없음, User 엔티티의 role로 확인: role={}", user.getRole());
                if (user.getRole() != null && (user.getRole().name().equals("ADMIN") || user.getRole().name().equals("OPS"))) {
                    log.warn("❌ 메인 웹앱 로그인 거부: Trinity 회사 직원은 입점사 전용 시스템에 접근할 수 없습니다. email={}, role={}", 
                        EmailLogMasking.maskForLog(user.getEmail()), user.getRole());
                    throw new IllegalArgumentException("Trinity 회사 직원은 입점사 전용 시스템에 접근할 수 없습니다. Ops Portal(ops.e-trinity.co.kr)을 사용해주세요.");
                }
            }
        } else {
            // tenant_id가 있는 경우 테넌트 관리자로 간주하여 허용
            log.debug("✅ 테넌트 관리자 접근 허용: email={}, tenantId={}", EmailLogMasking.maskForLog(user.getEmail()), user.getTenantId());
        }
        
        log.debug("✅ 입점사 접근 허용: email={}, tenantId={}", EmailLogMasking.maskForLog(user.getEmail()), user.getTenantId());
    }
    
    /**
     * 멀티 테넌트 사용자 감지 및 테넌트별 역할 조회
     * 
     * @param email 사용자 이메일
     * @return 테넌트 정보 목록 (멀티 테넌트 사용자인 경우), null (단일 테넌트 사용자인 경우)
     */
    private List<AuthResponse.TenantInfo> checkMultiTenantUser(String email) {
        // 이메일만으로 여러 테넌트 권한을 부여하는 보안 취약점 제거
        // 더 이상 테넌트 선택 화면을 강제하지 않음 (단일 테넌트로 취급)
        return null;
    }
    
    /**
     * 사용자의 테넌트별 역할 정보 조회
     * 
     * @param userId 사용자 ID
     * @param tenantId 테넌트 ID
     * @return 테넌트 역할 정보 (없으면 null)
     */
    private AuthResponse.TenantRoleInfo getTenantRoleInfo(Long userId, String tenantId) {
        try {
            // 현재 활성 역할 할당 조회 (브랜치 무관, 가장 최근 것)
            List<com.coresolution.core.domain.UserRoleAssignment> assignments = 
                userRoleAssignmentRepository.findActiveRolesByUserAndTenant(userId, tenantId, java.time.LocalDate.now());
            
            if (assignments == null || assignments.isEmpty()) {
                log.debug("활성 역할 할당 없음: userId={}, tenantId={}", userId, tenantId);
                return null;
            }
            
            // 가장 최근 할당된 역할 사용 (effectiveFrom 기준)
            com.coresolution.core.domain.UserRoleAssignment assignment = assignments.stream()
                .sorted((a1, a2) -> {
                    if (a1.getEffectiveFrom() == null && a2.getEffectiveFrom() == null) return 0;
                    if (a1.getEffectiveFrom() == null) return 1;
                    if (a2.getEffectiveFrom() == null) return -1;
                    return a2.getEffectiveFrom().compareTo(a1.getEffectiveFrom());
                })
                .findFirst()
                .orElse(assignments.get(0));
            
            // 역할 정보 조회
            com.coresolution.core.domain.TenantRole tenantRole = tenantRoleRepository
                .findByTenantRoleIdAndIsDeletedFalse(assignment.getTenantRoleId())
                .orElse(null);
            
            if (tenantRole == null) {
                log.warn("역할 정보를 찾을 수 없음: tenantRoleId={}", assignment.getTenantRoleId());
                return null;
            }
            
            // 템플릿 코드 조회 (필요시)
            String templateCode = null;
            if (tenantRole.getRoleTemplateId() != null) {
                // RoleTemplate 조회는 나중에 필요시 추가
            }
            
            return AuthResponse.TenantRoleInfo.builder()
                .tenantRoleId(tenantRole.getTenantRoleId())
                .roleName(tenantRole.getName())
                .roleNameKo(tenantRole.getNameKo())
                .templateCode(templateCode)
                .branchId(assignment.getBranchId())
                .branchName(null) // 필요시 BranchRepository로 조회
                .build();
                
        } catch (Exception e) {
            log.error("테넌트 역할 정보 조회 실패: userId={}, tenantId={}, error={}", 
                userId, tenantId, e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * User 엔티티를 UserDto로 변환
     * @deprecated Use convertToUserResponse instead
     */
    @Deprecated
    private UserDto convertToUserDto(User user) {
        return UserDto.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole().getValue())
            .grade(user.getGrade())
            .tenantId(user.getTenantId()) // 필수 - 보안상 중요
            .isActive(user.getIsActive())
            .isEmailVerified(user.getIsEmailVerified())
            .build();
    }
    
    /**
     * User 엔티티를 UserResponse로 변환 (표준화된 DTO)
     * 
     * DTO_NAMING_STANDARD.md 표준 준수
     */
    private UserResponse convertToUserResponse(User user) {
        return UserResponse.from(user); // 표준 메서드 사용
    }
    
    /**
     * UserResponse를 UserDto로 변환 (하위 호환성)
     */
    private UserDto convertToUserDtoFromResponse(UserResponse userResponse) {
        return UserDto.builder()
            .id(userResponse.getId())
            .email(userResponse.getEmail())
            .name(userResponse.getName())
            .role(userResponse.getRole())
            .grade(userResponse.getGrade())
            .tenantId(userResponse.getTenantId()) // 필수 - 보안상 중요
            .isActive(userResponse.getIsActive())
            .isEmailVerified(userResponse.getIsEmailVerified())
            .build();
    }
    
    // ==================== Private Email Methods ====================
    
    /**
     * 비밀번호 재설정 이메일 발송
     */
    private void sendPasswordResetEmail(String email, String name, String resetToken) {
        try {
            log.info("비밀번호 재설정 이메일 발송: email={}", EmailLogMasking.maskForLog(email));
            
            // EmailUtil을 사용하여 이메일 발송
            String resetLink = "https://mindgarden.com/reset-password?token=" + resetToken;
            com.coresolution.core.util.EmailUtil.sendPasswordResetEmail(emailService, email, name, resetLink);
            
        } catch (Exception e) {
            log.error("비밀번호 재설정 이메일 발송 중 오류: email={}, error={}", EmailLogMasking.maskForLog(email), e.getMessage(), e);
        }
    }
    
    /**
     * 비밀번호 재설정 완료 이메일 발송
     */
    private void sendPasswordResetSuccessEmail(String email, String name) {
        try {
            log.info("비밀번호 재설정 완료 이메일 발송: email={}", EmailLogMasking.maskForLog(email));
            
            // EmailUtil을 사용하여 이메일 발송
            String message = "비밀번호가 성공적으로 변경되었습니다.";
            com.coresolution.core.util.EmailUtil.sendSystemNotificationEmail(emailService, email, name, message);
            
        } catch (Exception e) {
            log.error("비밀번호 재설정 완료 이메일 발송 중 오류: email={}, error={}", EmailLogMasking.maskForLog(email), e.getMessage(), e);
        }
    }

    // ==================== P1 다중 매치 헬퍼 (silent first 차단) ====================

    /**
     * 휴대폰 로그인 다중 매치 preflight.
     *
     * <p>이메일 로그인 또는 후보 0/1 명 휴대폰 로그인은 {@code null} 을 반환하여 Spring Security 표준
     * 흐름으로 위임한다. 후보 2명 이상은 모든 후보의 비밀번호를 검증하여 분기한다.</p>
     *
     * <p>비밀번호 검증은 모든 후보에 대해 수행하여 응답 분기 전 timing 차이를 줄인다(timing attack
     * 방어). BadCredentials 분기는 동일 메시지로 통일하여 후보 노출을 차단한다.</p>
     *
     * @return 다중 매치/비번 불일치/단일 매치 응답, null = preflight 비대상
     */
    private AuthResponse handlePhonePasswordMultiMatch(String loginPrincipal, String password,
            String sessionId, String clientIp, String userAgent) {
        if (loginPrincipal == null || loginPrincipal.isEmpty()) {
            return null;
        }
        if (LoginIdentifierUtils.looksLikeEmail(loginPrincipal)) {
            return null;
        }

        List<User> candidates;
        try {
            candidates = userService.findAllByLoginPrincipal(loginPrincipal);
        } catch (Exception e) {
            log.warn("⚠️ 다중 매치 preflight 후보 조회 실패 (Spring Security 흐름으로 위임): {}",
                e.getMessage());
            return null;
        }

        if (candidates == null || candidates.size() < 2) {
            return null;
        }

        log.info("🔍 휴대폰 로그인 다중 후보 감지: count={}", candidates.size());
        List<User> matched = new ArrayList<>();
        for (User candidate : candidates) {
            if (candidate.getPassword() == null || candidate.getPassword().isBlank()) {
                continue;
            }
            try {
                if (passwordEncoder.matches(password, candidate.getPassword())) {
                    matched.add(candidate);
                }
            } catch (Exception e) {
                log.debug("후보 비밀번호 비교 스킵: userId={}, err={}", candidate.getId(), e.getMessage());
            }
        }

        if (matched.isEmpty()) {
            log.warn("❌ 휴대폰 다중 매치 후보 비밀번호 모두 불일치: count={}", candidates.size());
            return AuthResponse.failure("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        if (matched.size() == 1) {
            User user = matched.get(0);
            log.info("✅ 휴대폰 다중 후보 단일 매치 → 단일 사용자로 정상 로그인: userId={}", user.getId());
            return finalizeAuthenticatedSession(user, sessionId, clientIp, userAgent);
        }

        log.warn("⚠️ 휴대폰 다중 매치 + 비밀번호 2개 이상 일치 → 계정 선택 분기: matchedCount={}",
            matched.size());
        return buildPasswordLoginMultiAccountResponse(matched);
    }

    /**
     * 다중 매치 응답 본문 구성. 5분 TTL 단기 JWT + 본인 식별 최소 정보를 담은 카드 목록.
     */
    private AuthResponse buildPasswordLoginMultiAccountResponse(List<User> matched) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ 다중 매치 응답 생성 실패: tenantId 없음");
            return AuthResponse.failure("로그인 처리 중 오류가 발생했습니다.");
        }
        List<Long> userIds = matched.stream().map(User::getId).collect(Collectors.toList());
        String selectionToken;
        try {
            selectionToken = jwtService.generatePasswordLoginAccountSelectionToken(tenantId, userIds);
        } catch (Exception e) {
            log.error("❌ 계정 선택 JWT 발급 실패: {}", e.getMessage(), e);
            return AuthResponse.failure("로그인 처리 중 오류가 발생했습니다.");
        }

        List<AccountCandidate> candidatesDto = matched.stream()
            .map(this::toAccountCandidate)
            .collect(Collectors.toList());

        return AuthResponse.builder()
            .success(false)
            .message("동일한 휴대폰으로 등록된 계정이 여러 개입니다. 연결할 계정을 선택해주세요.")
            .responseType(MULTIPLE_ACCOUNTS_RESPONSE_TYPE)
            .multipleAccounts(true)
            .candidates(candidatesDto)
            .selectionToken(selectionToken)
            .build();
    }

    /**
     * {@link User} 를 후보 카드용 {@link AccountCandidate} 로 변환.
     *
     * <p>이메일 마스킹(예: {@code a***@example.com}), 브랜치명 best-effort 노출. 가입일·권한 상세 등은
     * 보안 표준상 제외(SECURITY_STANDARD.md).</p>
     */
    private AccountCandidate toAccountCandidate(User user) {
        UserRole role = user.getRole();
        return AccountCandidate.builder()
            .userId(user.getId())
            .role(role != null ? role.name() : null)
            .roleDisplayLabel(OAuthAccountSelectionUserFacingStrings.roleDisplayLabel(role))
            .dashboardGuide(OAuthAccountSelectionUserFacingStrings.dashboardGuideForRole(role))
            .optionLabel(buildOptionLabel(user))
            .maskedEmail(deriveMaskedEmail(user))
            .branchName(deriveBranchName(user))
            .build();
    }

    /**
     * 후보 카드 식별용 라벨 — OAuth 와 동일 문구 규약(role 별 포맷).
     */
    private String buildOptionLabel(User user) {
        if (user == null || user.getId() == null) {
            return "";
        }
        UserRole role = user.getRole();
        if (role == null) {
            return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_OTHER_FMT, "USER",
                user.getId());
        }
        switch (role) {
            case CONSULTANT:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_CONSULTANT_FMT,
                    user.getId());
            case CLIENT:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_CLIENT_FMT,
                    user.getId());
            case ADMIN:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_ADMIN_FMT,
                    user.getId());
            case STAFF:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_STAFF_FMT,
                    user.getId());
            default:
                return String.format(OAuthAccountSelectionUserFacingStrings.OPTION_OTHER_FMT,
                    role.name(), user.getId());
        }
    }

    /**
     * 사용자 이메일을 복호화 후 마스킹된 형태로 반환. 실패/빈값이면 null.
     */
    private String deriveMaskedEmail(User user) {
        if (user == null) {
            return null;
        }
        String enc = user.getEmail();
        if (enc == null || enc.isBlank()) {
            return null;
        }
        String plain;
        try {
            plain = encryptionUtil != null ? encryptionUtil.safeDecrypt(enc) : enc;
        } catch (Exception ex) {
            log.debug("이메일 복호화 실패 (raw 사용): userId={}", user.getId());
            plain = enc;
        }
        if (plain == null || plain.isBlank()) {
            return null;
        }
        return EmailLogMasking.maskForLog(plain);
    }

    /**
     * 사용자 브랜치명 best-effort 추출. lazy proxy 등 예외 시 null.
     */
    private String deriveBranchName(User user) {
        if (user == null) {
            return null;
        }
        try {
            if (user.getBranch() != null) {
                return user.getBranch().getBranchName();
            }
        } catch (Exception ignored) {
            // proxy / lazy load 실패 — best-effort 라 무시
        }
        return null;
    }

    /**
     * 인증 완료된 사용자에 대해 세션 생성·중복 로그인 처리·임시 비밀번호 차단 등 후속 절차를 수행.
     *
     * <p>호출자는 본 메서드 진입 시 비밀번호 검증이 끝났음을 보장해야 한다. 다중 매치 단일 사용자
     * 분기에서는 {@code passwordEncoder.matches} 로, 표준 흐름에서는
     * {@code AuthenticationManager.authenticate} 로 검증된 사용자 entity 를 전달한다.</p>
     */
    private AuthResponse finalizeAuthenticatedSession(User user, String sessionId, String clientIp,
            String userAgent) {
        if (user.getIsPasswordChanged() != null && !user.getIsPasswordChanged()) {
            log.warn("❌ 임시 비밀번호로 로그인 시도 차단: userId={}", user.getId());
            return AuthResponse.failure("임시 비밀번호로는 로그인할 수 없습니다. 이메일로 발송된 비밀번호 변경 링크를 통해 비밀번호를 변경한 후 로그인해주세요.");
        }

        validateCoreSolutionTenantAccess(user);

        if (duplicateLoginCheckEnabled) {
            boolean hasDuplicateLogin = checkDuplicateLogin(user);
            if (hasDuplicateLogin) {
                log.warn("⚠️ 중복 로그인 감지: userId={}", user.getId());
                if (askUserConfirmation) {
                    log.info("🔔 사용자에게 기존 세션 종료 확인 요청: userId={}", user.getId());
                    return AuthResponse.duplicateLoginConfirmation(
                        SessionManagementConstants.DUPLICATE_LOGIN_MESSAGE);
                } else if (SessionManagementConstants.TERMINATE_EXISTING_SESSION) {
                    cleanupUserSessions(user, SessionManagementConstants.END_REASON_DUPLICATE_LOGIN);
                    log.info("🔄 기존 세션 정리 완료: userId={}", user.getId());
                }
            }
        } else {
            log.info("🔧 개발 환경: 중복 로그인 체크 비활성화됨");
        }

        userSessionService.createSession(user, sessionId, clientIp, userAgent,
            SessionManagementConstants.LOGIN_TYPE_NORMAL, null);

        userService.updateLastLoginTime(user.getId());

        UserResponse userResponse = convertToUserResponse(user);

        List<AuthResponse.TenantInfo> accessibleTenants = checkMultiTenantUser(user.getEmail());

        UserDto userDto = userResponse != null ? convertToUserDtoFromResponse(userResponse) : null;

        AuthResponse.AuthResponseBuilder responseBuilder = AuthResponse.builder()
            .success(true)
            .message("로그인 성공")
            .token(null)
            .refreshToken(null)
            .userResponse(userResponse)
            .user(userDto)
            .requiresPasswordChange(false);

        if (accessibleTenants != null && !accessibleTenants.isEmpty()) {
            responseBuilder
                .isMultiTenant(true)
                .requiresTenantSelection(true)
                .accessibleTenants(accessibleTenants)
                .responseType("tenant_selection_required");
            log.info("✅ 멀티 테넌트 사용자 로그인: userId={}, tenantCount={}",
                user.getId(), accessibleTenants.size());
        } else {
            log.info("✅ 세션 기반 로그인 성공: userId={}, sessionId={}", user.getId(), sessionId);
        }

        return responseBuilder.build();
    }

    @Override
    public AuthResponse selectAccount(String selectionToken, Long selectedUserId, String sessionId,
            String clientIp, String userAgent) {
        if (selectionToken == null || selectionToken.isBlank() || selectedUserId == null) {
            return AuthResponse.failure("선택 정보가 유효하지 않습니다.");
        }

        evictExpiredConsumedSelectionTokens();
        if (isPasswordLoginSelectionTokenConsumed(selectionToken)) {
            log.warn("❌ 계정 선택 토큰 재사용 시도");
            return AuthResponse.failure("이미 사용된 선택 정보입니다. 다시 로그인해주세요.");
        }

        PasswordLoginAccountSelectionClaims claims;
        try {
            claims = jwtService.parsePasswordLoginAccountSelectionToken(selectionToken);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.warn("❌ 계정 선택 토큰 만료");
            return AuthResponse.failure("선택 정보가 만료되었습니다. 다시 로그인해주세요.");
        } catch (Exception e) {
            log.warn("❌ 계정 선택 토큰 파싱 실패: {}", e.getMessage());
            return AuthResponse.failure("선택 정보가 유효하지 않습니다.");
        }

        String currentTenant = TenantContextHolder.getTenantId();
        if (currentTenant == null || currentTenant.isEmpty()
                || !currentTenant.equals(claims.getTenantId())) {
            log.warn("❌ 계정 선택 테넌트 불일치: ctx={}, claim={}",
                currentTenant, claims.getTenantId());
            return AuthResponse.failure("테넌트 정보가 일치하지 않습니다.");
        }

        if (claims.getAllowedUserIds() == null
                || !claims.getAllowedUserIds().contains(selectedUserId)) {
            log.warn("❌ 계정 선택: 허용 목록 밖 userId={} (allowed={})",
                selectedUserId, claims.getAllowedUserIds());
            return AuthResponse.failure("선택한 계정은 이 로그인에 허용되지 않습니다.");
        }

        User user;
        try {
            user = userService.findById(selectedUserId).orElse(null);
        } catch (Exception e) {
            log.error("❌ 계정 선택 사용자 조회 실패: {}", e.getMessage(), e);
            return AuthResponse.failure("로그인 처리 중 오류가 발생했습니다.");
        }
        if (user == null || user.getTenantId() == null
                || !user.getTenantId().equals(claims.getTenantId())) {
            log.warn("❌ 계정 선택 사용자 미존재 또는 테넌트 불일치: userId={}", selectedUserId);
            return AuthResponse.failure("사용자를 찾을 수 없습니다.");
        }

        long expiresAtMs = System.currentTimeMillis() + 5L * 60L * 1000L;
        markPasswordLoginSelectionTokenConsumed(selectionToken, expiresAtMs);

        return finalizeAuthenticatedSession(user, sessionId, clientIp, userAgent);
    }

    private boolean isPasswordLoginSelectionTokenConsumed(String token) {
        Long expiresAtMs = consumedSelectionTokens.get(token);
        if (expiresAtMs == null) {
            return false;
        }
        if (System.currentTimeMillis() >= expiresAtMs) {
            consumedSelectionTokens.remove(token);
            return false;
        }
        return true;
    }

    private void markPasswordLoginSelectionTokenConsumed(String token, long expiresAtMs) {
        consumedSelectionTokens.put(token, expiresAtMs);
    }

    private void evictExpiredConsumedSelectionTokens() {
        long now = System.currentTimeMillis();
        consumedSelectionTokens.entrySet().removeIf(e -> e.getValue() <= now);
    }
}
