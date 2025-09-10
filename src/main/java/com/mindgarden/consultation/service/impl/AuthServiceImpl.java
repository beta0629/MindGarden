package com.mindgarden.consultation.service.impl;

import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.constant.EmailConstants;
import com.mindgarden.consultation.constant.SessionManagementConstants;
import com.mindgarden.consultation.dto.AuthResponse;
import com.mindgarden.consultation.dto.EmailResponse;
import com.mindgarden.consultation.dto.UserDto;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AuthService;
import com.mindgarden.consultation.service.EmailService;
import com.mindgarden.consultation.service.JwtService;
import com.mindgarden.consultation.service.UserService;
import com.mindgarden.consultation.service.UserSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

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
                // JWT 토큰 생성
                String token = jwtService.generateToken(email);
                String refreshToken = jwtService.generateRefreshToken(email);
                
                // 사용자 정보 조회
                User user = userService.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
                
                // 마지막 로그인 시간 업데이트
                userService.updateLastLoginTime(user.getId());
                
                // UserDto 변환
                UserDto userDto = convertToUserDto(user);
                
                return AuthResponse.success("로그인 성공", token, refreshToken, userDto);
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
            
            // 새로운 JWT 토큰 생성
            String newToken = jwtService.generateToken(email);
            String newRefreshToken = jwtService.generateRefreshToken(email);
            
            // 사용자 정보 조회
            User user = userService.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
            
            // UserDto 변환
            UserDto userDto = convertToUserDto(user);
            
            return AuthResponse.success("토큰 갱신 성공", newToken, newRefreshToken, userDto);
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
                
                // UserDto 변환
                UserDto userDto = convertToUserDto(user);
                
                log.info("✅ 세션 기반 로그인 성공: email={}, sessionId={}", email, sessionId);
                return AuthResponse.success("로그인 성공", null, null, userDto);
                
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
     * User 엔티티를 UserDto로 변환
     */
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
