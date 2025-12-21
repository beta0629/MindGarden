package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.entity.PasswordResetToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PasswordResetTokenRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 비밀번호 재설정 서비스 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class PasswordResetServiceImpl implements PasswordResetService {
    
    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${app.password-reset.token-expiry-hours:24}")
    private int tokenExpiryHours;
    
    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;
    
    @Override
    public boolean sendPasswordResetEmail(String email) {
        try {
            log.info("🔑 비밀번호 재설정 이메일 발송 요청: {}", email);
            String tenantId = TenantContextHolder.getRequiredTenantId();
            
            // 사용자 확인 (tenantId 필터링)
            Optional<User> userOpt = userRepository.findByTenantIdAndEmail(tenantId, email);
            if (userOpt.isEmpty()) {
                log.warn("❌ 존재하지 않는 이메일: {}", email);
                // 보안상 이유로 성공으로 응답 (이메일 존재 여부를 알려주지 않음)
                return true;
            }
            
            User user = userOpt.get();
            
            // 사용자가 비활성화된 경우
            if (user.getIsActive() != null && !user.getIsActive()) {
                log.warn("❌ 비활성화된 사용자: {}", email);
                return true; // 보안상 성공으로 응답
            }
            
            // 기존 사용되지 않은 토큰들을 모두 사용됨으로 표시
            tokenRepository.markAllTokensAsUsedByUserId(user.getId(), LocalDateTime.now());
            
            // 새 토큰 생성
            String token = UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now().plusHours(tokenExpiryHours);
            
            PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .email(email)
                .userId(user.getId())
                .expiresAt(expiresAt)
                .used(false)
                .build();
            
            tokenRepository.save(resetToken);
            
            // 비밀번호 재설정 링크 생성
            String resetLink = frontendBaseUrl + "/reset-password?token=" + token;
            
            // 이메일 발송
            String subject = "[MindGarden] 비밀번호 재설정 안내";
            String content = buildPasswordResetEmailContent(user.getName(), resetLink, tokenExpiryHours);
            
            EmailRequest emailRequest = EmailRequest.builder()
                .toEmail(email)
                .toName(user.getName())
                .subject(subject)
                .content(content)
                .type("TEXT")
                .build();
            
            EmailResponse emailResponse = emailService.sendEmail(emailRequest);
            boolean emailSent = emailResponse != null && emailResponse.isSuccess();
            
            if (emailSent) {
                log.info("✅ 비밀번호 재설정 이메일 발송 완료: {}", email);
            } else {
                log.error("❌ 비밀번호 재설정 이메일 발송 실패: {}", email);
            }
            
            return emailSent;
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 재설정 이메일 발송 중 오류: {}", email, e);
            return false;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean validateResetToken(String token) {
        try {
            log.info("🔑 비밀번호 재설정 토큰 검증: {}", token.substring(0, 8) + "...");
            
            Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
            if (tokenOpt.isEmpty()) {
                log.warn("❌ 존재하지 않는 토큰: {}", token.substring(0, 8) + "...");
                return false;
            }
            
            PasswordResetToken resetToken = tokenOpt.get();
            boolean isValid = resetToken.isValid();
            
            if (!isValid) {
                log.warn("❌ 유효하지 않은 토큰: {} (used: {}, expired: {})", 
                    token.substring(0, 8) + "...", resetToken.getUsed(), resetToken.isExpired());
            } else {
                log.info("✅ 유효한 토큰: {}", token.substring(0, 8) + "...");
            }
            
            return isValid;
            
        } catch (Exception e) {
            log.error("❌ 토큰 검증 중 오류: {}", token.substring(0, 8) + "...", e);
            return false;
        }
    }
    
    @Override
    public boolean resetPassword(String token, String newPassword) {
        try {
            log.info("🔑 비밀번호 재설정 실행: {}", token.substring(0, 8) + "...");
            
            // 토큰 검증
            Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
            if (tokenOpt.isEmpty()) {
                log.warn("❌ 존재하지 않는 토큰으로 비밀번호 재설정 시도");
                return false;
            }
            
            PasswordResetToken resetToken = tokenOpt.get();
            
            if (!resetToken.isValid()) {
                log.warn("❌ 유효하지 않은 토큰으로 비밀번호 재설정 시도");
                return false;
            }
            
            // 사용자 조회
            User user = resetToken.getUser();
            if (user.getIsActive() != null && !user.getIsActive()) {
                log.warn("❌ 비활성화된 사용자의 비밀번호 재설정 시도: {}", user.getEmail());
                return false;
            }
            
            // 비밀번호 암호화 및 업데이트
            String encodedPassword = passwordEncoder.encode(newPassword);
            user.setPassword(encodedPassword);
            user.setIsPasswordChanged(true); // 비밀번호 변경 완료
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            // 토큰을 사용됨으로 표시
            resetToken.markAsUsed();
            tokenRepository.save(resetToken);
            
            // 해당 사용자의 다른 모든 토큰도 사용됨으로 표시
            tokenRepository.markAllTokensAsUsedByUserId(user.getId(), LocalDateTime.now());
            
            log.info("✅ 비밀번호 재설정 완료: {}", user.getEmail());
            
            // 비밀번호 변경 알림 (선택사항)
            try {
                String subject = "[MindGarden] 비밀번호가 변경되었습니다";
                String content = buildPasswordChangedNotificationContent(user.getName());
                
                EmailRequest emailRequest = EmailRequest.builder()
                    .toEmail(user.getEmail())
                    .toName(user.getName())
                    .subject(subject)
                    .content(content)
                    .type("TEXT")
                    .build();
                
                emailService.sendEmail(emailRequest);
            } catch (Exception e) {
                log.warn("비밀번호 변경 알림 발송 실패 (비밀번호는 정상적으로 변경됨): {}", user.getEmail(), e);
            }
            
            return true;
            
        } catch (Exception e) {
            log.error("❌ 비밀번호 재설정 중 오류: {}", token.substring(0, 8) + "...", e);
            return false;
        }
    }
    
    @Override
    public int cleanupExpiredTokens() {
        try {
            log.info("🧹 만료된 비밀번호 재설정 토큰 정리 시작");
            
            // 7일 전보다 오래된 토큰들 삭제 (만료 시간 기준)
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
            int deletedCount = tokenRepository.deleteExpiredTokens(cutoffDate);
            
            log.info("✅ 만료된 토큰 정리 완료: {}개 삭제", deletedCount);
            
            return deletedCount;
            
        } catch (Exception e) {
            log.error("❌ 만료된 토큰 정리 중 오류", e);
            return 0;
        }
    }
    
    /**
     * 비밀번호 재설정 이메일 내용 생성
     */
    private String buildPasswordResetEmailContent(String userName, String resetLink, int expiryHours) {
        return String.format("""
            안녕하세요 %s님,
            
            MindGarden 비밀번호 재설정을 요청하셨습니다.
            
            아래 링크를 클릭하여 새로운 비밀번호를 설정해주세요:
            %s
            
            ⚠️ 중요 안내사항:
            • 이 링크는 %d시간 후에 만료됩니다
            • 보안을 위해 링크는 한 번만 사용 가능합니다
            • 본인이 요청하지 않은 경우 이 이메일을 무시해주세요
            
            문의사항이 있으시면 언제든 연락주세요.
            
            감사합니다.
            MindGarden 팀
            """, userName, resetLink, expiryHours);
    }
    
    /**
     * 비밀번호 변경 완료 알림 내용 생성
     */
    private String buildPasswordChangedNotificationContent(String userName) {
        return String.format("""
            안녕하세요 %s님,
            
            MindGarden 계정의 비밀번호가 성공적으로 변경되었습니다.
            
            변경 시간: %s
            
            만약 본인이 변경하지 않았다면 즉시 고객센터로 연락해주세요.
            
            감사합니다.
            MindGarden 팀
            """, userName, LocalDateTime.now().toString());
    }
}
