package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.dto.AuthResponse;
import com.mindgarden.consultation.dto.UserDto;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AuthService;
import com.mindgarden.consultation.service.JwtService;
import com.mindgarden.consultation.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * 인증 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
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
    public void forgotPassword(String email) {
        // 비밀번호 재설정 토큰 생성 및 이메일 발송
        // 현재는 기본 구현만 제공
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
        
        // TODO: 비밀번호 재설정 토큰 생성 및 이메일 발송 로직 구현
    }
    
    @Override
    public void resetPassword(String token, String newPassword) {
        // 비밀번호 재설정 토큰 검증 및 비밀번호 변경
        // 현재는 기본 구현만 제공
        
        // TODO: 토큰 검증 및 비밀번호 변경 로직 구현
        // userService.changePassword(userId, null, newPassword);
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
}
