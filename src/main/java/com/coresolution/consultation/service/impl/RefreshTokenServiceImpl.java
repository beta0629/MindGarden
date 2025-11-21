package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.RefreshTokenRepository;
import com.coresolution.consultation.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Refresh Token Service 구현체
 * Phase 3: Refresh Token 저장/조회/로테이션 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {
    
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    
    // Refresh Token 만료 시간 (7일)
    private static final long REFRESH_TOKEN_EXPIRATION_DAYS = 7;
    
    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user, String refreshToken, HttpServletRequest request) {
        log.debug("Refresh Token 생성: userId={}, tenantId={}", user.getId(), user.getTenantId());
        
        // Refresh Token 해시 생성
        String refreshTokenHash = passwordEncoder.encode(refreshToken);
        
        // Token ID 생성 (UUID)
        String tokenId = UUID.randomUUID().toString();
        
        // 만료 시간 설정
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(REFRESH_TOKEN_EXPIRATION_DAYS);
        
        // IP 주소 및 User-Agent 추출
        String ipAddress = extractIpAddress(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        
        // RefreshToken 엔티티 생성
        RefreshToken refreshTokenEntity = RefreshToken.builder()
            .tokenId(tokenId)
            .userId(user.getId())
            .tenantId(user.getTenantId())
            .branchId(user.getBranch() != null ? user.getBranch().getId() : null)
            .deviceId(extractDeviceId(request))
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .refreshTokenHash(refreshTokenHash)
            .expiresAt(expiresAt)
            .revoked(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        RefreshToken saved = refreshTokenRepository.save(refreshTokenEntity);
        log.info("✅ Refresh Token 생성 완료: tokenId={}, userId={}, expiresAt={}", 
            tokenId, user.getId(), expiresAt);
        
        return saved;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<RefreshToken> findByTokenId(String tokenId) {
        return refreshTokenRepository.findByTokenId(tokenId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean validateRefreshToken(String tokenId, String refreshToken) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenId(tokenId);
        
        if (tokenOpt.isEmpty()) {
            log.warn("Refresh Token을 찾을 수 없음: tokenId={}", tokenId);
            return false;
        }
        
        RefreshToken token = tokenOpt.get();
        
        // 토큰이 유효한지 확인 (만료되지 않았고 무효화되지 않음)
        if (!token.isValid()) {
            log.warn("유효하지 않은 Refresh Token: tokenId={}, expired={}, revoked={}", 
                tokenId, token.isExpired(), token.getRevoked());
            return false;
        }
        
        // Refresh Token 해시 검증
        if (!passwordEncoder.matches(refreshToken, token.getRefreshTokenHash())) {
            log.warn("Refresh Token 해시 불일치: tokenId={}", tokenId);
            return false;
        }
        
        return true;
    }
    
    @Override
    @Transactional
    public void revokeRefreshToken(String tokenId) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenId(tokenId);
        
        if (tokenOpt.isPresent()) {
            RefreshToken token = tokenOpt.get();
            token.revoke();
            refreshTokenRepository.save(token);
            log.info("✅ Refresh Token 무효화: tokenId={}", tokenId);
        } else {
            log.warn("Refresh Token을 찾을 수 없음 (무효화 실패): tokenId={}", tokenId);
        }
    }
    
    @Override
    @Transactional
    public void revokeAllUserTokens(Long userId) {
        int revokedCount = refreshTokenRepository.revokeAllTokensByUserId(userId, LocalDateTime.now());
        log.info("✅ 사용자의 모든 Refresh Token 무효화: userId={}, count={}", userId, revokedCount);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RefreshToken> findActiveTokensByUserId(Long userId) {
        return refreshTokenRepository.findActiveTokensByUserId(userId, LocalDateTime.now());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RefreshToken> findActiveTokensByUserIdAndTenantId(Long userId, String tenantId) {
        return refreshTokenRepository.findActiveTokensByUserIdAndTenantId(userId, tenantId, LocalDateTime.now());
    }
    
    @Override
    @Transactional
    public int cleanupExpiredTokens() {
        int deletedCount = refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("✅ 만료된 Refresh Token 정리: count={}", deletedCount);
        return deletedCount;
    }
    
    @Override
    @Transactional
    public RefreshToken rotateRefreshToken(String oldTokenId, User user, String newRefreshToken, HttpServletRequest request) {
        log.debug("Refresh Token 로테이션: oldTokenId={}, userId={}", oldTokenId, user.getId());
        
        // 기존 토큰 무효화
        if (oldTokenId != null) {
            revokeRefreshToken(oldTokenId);
        }
        
        // 새 토큰 생성
        return createRefreshToken(user, newRefreshToken, request);
    }
    
    /**
     * IP 주소 추출
     */
    private String extractIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        
        return ip;
    }
    
    /**
     * Device ID 추출 (모바일 앱 등)
     */
    private String extractDeviceId(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        
        // User-Agent에서 모바일 앱 정보 추출
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && (userAgent.contains("MindGardenMobile") || userAgent.contains("ReactNative"))) {
            // 모바일 앱인 경우 Device ID 헤더에서 추출 (추후 구현)
            return request.getHeader("X-Device-Id");
        }
        
        return null;
    }
}

