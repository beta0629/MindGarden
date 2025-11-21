package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;

/**
 * Refresh Token Service 인터페이스
 * Phase 3: Refresh Token 저장/조회/로테이션 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface RefreshTokenService {
    
    /**
     * Refresh Token 생성 및 저장
     * 
     * @param user 사용자
     * @param refreshToken Refresh Token 문자열
     * @param request HTTP 요청 (IP, User-Agent 추출용)
     * @return 저장된 RefreshToken 엔티티
     */
    RefreshToken createRefreshToken(User user, String refreshToken, HttpServletRequest request);
    
    /**
     * Refresh Token 조회 (tokenId로)
     * 
     * @param tokenId Refresh Token ID
     * @return RefreshToken 엔티티
     */
    Optional<RefreshToken> findByTokenId(String tokenId);
    
    /**
     * Refresh Token 검증
     * 
     * @param tokenId Refresh Token ID
     * @param refreshToken Refresh Token 문자열
     * @return 검증 성공 여부
     */
    boolean validateRefreshToken(String tokenId, String refreshToken);
    
    /**
     * Refresh Token 무효화
     * 
     * @param tokenId Refresh Token ID
     */
    void revokeRefreshToken(String tokenId);
    
    /**
     * 사용자의 모든 Refresh Token 무효화
     * 
     * @param userId 사용자 ID
     */
    void revokeAllUserTokens(Long userId);
    
    /**
     * 사용자의 활성 Refresh Token 목록 조회
     * 
     * @param userId 사용자 ID
     * @return 활성 Refresh Token 목록
     */
    List<RefreshToken> findActiveTokensByUserId(Long userId);
    
    /**
     * 사용자와 테넌트의 활성 Refresh Token 목록 조회
     * 
     * @param userId 사용자 ID
     * @param tenantId 테넌트 ID
     * @return 활성 Refresh Token 목록
     */
    List<RefreshToken> findActiveTokensByUserIdAndTenantId(Long userId, String tenantId);
    
    /**
     * 만료된 Refresh Token 정리
     * 
     * @return 삭제된 토큰 수
     */
    int cleanupExpiredTokens();
    
    /**
     * Refresh Token 로테이션 (기존 토큰 무효화 후 새 토큰 생성)
     * 
     * @param oldTokenId 기존 Refresh Token ID
     * @param user 사용자
     * @param newRefreshToken 새로운 Refresh Token 문자열
     * @param request HTTP 요청
     * @return 새로운 RefreshToken 엔티티
     */
    RefreshToken rotateRefreshToken(String oldTokenId, User user, String newRefreshToken, HttpServletRequest request);
}

