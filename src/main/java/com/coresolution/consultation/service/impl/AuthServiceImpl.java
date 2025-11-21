package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.constant.EmailConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.dto.UserDto;
import com.coresolution.consultation.dto.UserResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.UserSessionService;
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
    
    // 개발 환경에서 중복 로그인 체크 비활성화 설정
    @Value("${session.duplicate-login-check.enabled:true}")
    private boolean duplicateLoginCheckEnabled;
    
    // 사용자에게 기존 세션 종료 확인 요청 설정
    @Value("${session.duplicate-login-check.ask-user-confirmation:false}")
    private boolean askUserConfirmation;
    
    @Override
    public AuthResponse authenticate(String email, String password) {
        try {
            // Spring Security 인증
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );
            
            if (authentication.isAuthenticated()) {
                // 사용자 정보 조회
                User user = userService.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
                
                // Phase 3: 사용자 권한 조회
                List<String> permissions = dynamicPermissionService.getUserPermissionsAsStringList(user);
                log.debug("사용자 권한 조회 완료: userId={}, permissions={}", user.getId(), permissions);
                
                // Phase 3: 확장된 JWT 토큰 생성 (tenantId, branchId, permissions 포함)
                String token = jwtService.generateToken(user, permissions);
                String refreshToken = jwtService.generateRefreshToken(user.getEmail());
                
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
                    .user(userDto); // 하위 호환성
                
                if (accessibleTenants != null && !accessibleTenants.isEmpty()) {
                    // 멀티 테넌트 사용자인 경우 테넌트 선택 필요
                    responseBuilder
                        .isMultiTenant(true)
                        .requiresTenantSelection(true)
                        .accessibleTenants(accessibleTenants)
                        .responseType("tenant_selection_required");
                    
                    log.info("✅ 멀티 테넌트 사용자 로그인: email={}, tenantCount={}", email, accessibleTenants.size());
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
            // 리프레시 토큰에서 사용자 이메일 추출
            String email = jwtService.extractUsername(refreshToken);
            
            // 리프레시 토큰 유효성 검사
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (!jwtService.isTokenValid(refreshToken, userDetails)) {
                return AuthResponse.failure("유효하지 않은 리프레시 토큰입니다.");
            }
            
            // 사용자 정보 조회
            User user = userService.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
            
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
                
                // 2. tokenId를 포함한 refreshToken JWT 생성
                newRefreshToken = jwtService.generateRefreshToken(email, newTokenId);
                
                // 3. refreshToken 해시 생성 및 DB 저장
                refreshTokenService.createRefreshToken(user, newRefreshToken, null);
                
                log.info("✅ 새 Refresh Token 생성 완료: tokenId={}", newTokenId);
            } catch (Exception e) {
                log.warn("⚠️ Refresh Token 저장 실패 (기본 토큰 생성): {}", e.getMessage());
                // 새 토큰 생성 실패 시에도 기본 refreshToken 생성 (tokenId 없음)
                newRefreshToken = jwtService.generateRefreshToken(email);
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
            log.info("🔐 세션 기반 로그인 시도: email={}, sessionId={}", email, sessionId);
            
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
            
            // Spring Security 인증
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );
            
            if (authentication.isAuthenticated()) {
                log.info("🔐 Spring Security 인증 성공: email={}", email);
                
                // 사용자 정보 조회
                User user = userService.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
                
                log.info("👤 사용자 정보 조회 완료: userId={}, email={}", user.getId(), email);
                
                // 입점사(코어솔루션 테넌트)만 접근 가능 - Trinity 회사 직원(ADMIN/OPS 역할) 제외
                validateCoreSolutionTenantAccess(user);
                
                // 중복 로그인 체크 (설정에 따라 활성화/비활성화)
                if (duplicateLoginCheckEnabled) {
                    boolean hasDuplicateLogin = checkDuplicateLogin(user);
                    
                    if (hasDuplicateLogin) {
                        log.warn("⚠️ 중복 로그인 감지: email={}", email);
                        
                        if (askUserConfirmation) {
                            // 사용자에게 기존 세션 종료 확인 요청
                            log.info("🔔 사용자에게 기존 세션 종료 확인 요청: email={}", email);
                            return AuthResponse.duplicateLoginConfirmation("다른 곳에서 로그인되어 있습니다. 기존 세션을 종료하고 새로 로그인하시겠습니까?");
                        } else if (SessionManagementConstants.TERMINATE_EXISTING_SESSION) {
                            // 기존 세션들 정리
                            cleanupUserSessions(user, SessionManagementConstants.END_REASON_DUPLICATE_LOGIN);
                            log.info("🔄 기존 세션 정리 완료: email={}", email);
                        }
                    }
                } else {
                    log.info("🔧 개발 환경: 중복 로그인 체크 비활성화됨");
                }
                
                // 새 세션 생성 (중복 로그인 체크 후)
                userSessionService.createSession(user, sessionId, clientIp, userAgent, 
                    SessionManagementConstants.LOGIN_TYPE_NORMAL, null);
                
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
                    .token(null)
                    .refreshToken(null)
                    .userResponse(userResponse)
                    .user(userDto); // 하위 호환성
                
                if (accessibleTenants != null && !accessibleTenants.isEmpty()) {
                    // 멀티 테넌트 사용자인 경우 테넌트 선택 필요
                    responseBuilder
                        .isMultiTenant(true)
                        .requiresTenantSelection(true)
                        .accessibleTenants(accessibleTenants)
                        .responseType("tenant_selection_required");
                    
                    log.info("✅ 멀티 테넌트 사용자 로그인: email={}, tenantCount={}", email, accessibleTenants.size());
                } else {
                    log.info("✅ 세션 기반 로그인 성공: email={}, sessionId={}", email, sessionId);
                }
                
                return responseBuilder.build();
                
            } else {
                return AuthResponse.failure("인증에 실패했습니다.");
            }
        } catch (Exception e) {
            log.error("❌ 세션 기반 로그인 실패: email={}, error={}", email, e.getMessage(), e);
            
            // 자격 증명 실패인 경우 사용자 친화적인 메시지 반환
            if (e.getMessage() != null && e.getMessage().contains("자격 증명에 실패하였습니다")) {
                return AuthResponse.failure("아이디 또는 비밀번호가 올바르지 않습니다.");
            }
            return AuthResponse.failure("로그인 실패: " + e.getMessage());
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
            log.info("비밀번호 재설정 요청: email={}", email);
            
            // 사용자 존재 확인
            User user = userService.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
            
            // 비밀번호 재설정 토큰 생성
            String resetToken = jwtService.generateToken(email);
            
            // 비밀번호 재설정 이메일 발송
            sendPasswordResetEmail(email, user.getName(), resetToken);
            
            log.info("비밀번호 재설정 이메일 발송 완료: email={}", email);
            
        } catch (Exception e) {
            log.error("비밀번호 재설정 이메일 발송 실패: email={}, error={}", email, e.getMessage(), e);
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
            
            log.info("비밀번호 재설정 완료: email={}", email);
            
        } catch (Exception e) {
            log.error("비밀번호 재설정 실패: token={}, error={}", token, e.getMessage(), e);
            throw new RuntimeException("비밀번호 재설정에 실패했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 입점사(코어솔루션 테넌트)만 접근 가능하도록 검증
     * Trinity 회사 직원(ADMIN/OPS 역할)은 메인 웹앱에 로그인할 수 없음
     * Trinity 직원은 Ops Portal(ops.e-trinity.co.kr)을 사용해야 함
     * 
     * @param user 사용자 엔티티
     * @throws RuntimeException Trinity 회사 직원(ADMIN/OPS 역할)인 경우
     */
    private void validateCoreSolutionTenantAccess(User user) {
        // 사용자의 권한 확인
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated()) {
            Collection<? extends GrantedAuthority> authorities = 
                authentication.getAuthorities();
            
            // ADMIN 또는 OPS 역할이 있으면 Trinity 회사 직원으로 간주
            boolean hasAdminOrOpsRole = authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN") || 
                               auth.getAuthority().equals("ROLE_OPS"));
            
            if (hasAdminOrOpsRole) {
                log.warn("메인 웹앱 로그인 거부: Trinity 회사 직원은 입점사 전용 시스템에 접근할 수 없습니다. email={}, role={}", 
                    user.getEmail(), user.getRole());
                throw new RuntimeException("Trinity 회사 직원은 입점사 전용 시스템에 접근할 수 없습니다. Ops Portal(ops.e-trinity.co.kr)을 사용해주세요.");
            }
        }
        
        log.debug("입점사 접근 허용: email={}, tenantId={}", user.getEmail(), user.getTenantId());
    }
    
    /**
     * 멀티 테넌트 사용자 감지 및 테넌트별 역할 조회
     * 
     * @param email 사용자 이메일
     * @return 테넌트 정보 목록 (멀티 테넌트 사용자인 경우), null (단일 테넌트 사용자인 경우)
     */
    private List<AuthResponse.TenantInfo> checkMultiTenantUser(String email) {
        try {
            // 이메일로 모든 테넌트의 User 조회
            List<User> users = userRepository.findAllByEmail(email);
            
            if (users == null || users.isEmpty() || users.size() == 1) {
                return null; // 단일 테넌트 사용자 또는 사용자 없음
            }
            
            // 멀티 테넌트 사용자인 경우 테넌트 목록 구성
            List<AuthResponse.TenantInfo> tenantInfos = new ArrayList<>();
            
            for (User user : users) {
                if (user.getTenantId() == null || user.getTenantId().isEmpty()) {
                    continue; // tenant_id가 없는 경우 건너뛰기
                }
                
                // 테넌트 정보 조회
                tenantRepository.findByTenantIdAndIsDeletedFalse(user.getTenantId())
                    .ifPresent(tenant -> {
                        // 테넌트별 활성 역할 조회 (UserRoleAssignment)
                        AuthResponse.TenantRoleInfo tenantRoleInfo = getTenantRoleInfo(user.getId(), user.getTenantId());
                        
                        AuthResponse.TenantInfo tenantInfo = AuthResponse.TenantInfo.builder()
                            .tenantId(tenant.getTenantId())
                            .tenantName(tenant.getName())
                            .businessType(tenant.getBusinessType())
                            .status(tenant.getStatus() != null ? tenant.getStatus().name() : null)
                            .role(user.getRole() != null ? user.getRole().getValue() : null) // 레거시 호환
                            .tenantRole(tenantRoleInfo) // 새로운 역할 시스템
                            .build();
                        tenantInfos.add(tenantInfo);
                    });
            }
            
            if (tenantInfos.isEmpty()) {
                return null;
            }
            
            log.info("멀티 테넌트 사용자 감지: email={}, tenantCount={}", email, tenantInfos.size());
            return tenantInfos;
                
        } catch (Exception e) {
            log.error("멀티 테넌트 사용자 감지 실패: email={}, error={}", email, e.getMessage(), e);
            return null;
        }
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
            .isActive(user.getIsActive())
            .isEmailVerified(user.getIsEmailVerified())
            .build();
    }
    
    /**
     * User 엔티티를 UserResponse로 변환 (표준화된 DTO)
     */
    private UserResponse convertToUserResponse(User user) {
        return UserResponse.fromEntity(user);
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
            log.info("비밀번호 재설정 이메일 발송: email={}", email);
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, name);
            variables.put(EmailConstants.VAR_USER_EMAIL, email);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put(EmailConstants.VAR_RESET_LINK, "https://mindgarden.com/reset-password?token=" + resetToken);
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_PASSWORD_RESET,
                    email,
                    name,
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("비밀번호 재설정 이메일 발송 성공: email={}, emailId={}", email, response.getEmailId());
            } else {
                log.error("비밀번호 재설정 이메일 발송 실패: email={}, error={}", email, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("비밀번호 재설정 이메일 발송 중 오류: email={}, error={}", email, e.getMessage(), e);
        }
    }
    
    /**
     * 비밀번호 재설정 완료 이메일 발송
     */
    private void sendPasswordResetSuccessEmail(String email, String name) {
        try {
            log.info("비밀번호 재설정 완료 이메일 발송: email={}", email);
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, name);
            variables.put(EmailConstants.VAR_USER_EMAIL, email);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put("resetMessage", "비밀번호가 성공적으로 변경되었습니다.");
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION,
                    email,
                    name,
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("비밀번호 재설정 완료 이메일 발송 성공: email={}, emailId={}", email, response.getEmailId());
            } else {
                log.error("비밀번호 재설정 완료 이메일 발송 실패: email={}, error={}", email, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("비밀번호 재설정 완료 이메일 발송 중 오류: email={}, error={}", email, e.getMessage(), e);
        }
    }
}
