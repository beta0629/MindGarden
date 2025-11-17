package com.mindgarden.consultation.service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * JWT 토큰 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Service
public class JwtService {
    
    @Value("${jwt.secret:}")
    private String secretKey;
    
    @Value("${jwt.expiration:86400000}") // 24시간 (밀리초)
    private long jwtExpiration;
    
    @Value("${jwt.refresh-expiration:604800000}") // 7일 (밀리초)
    private long refreshExpiration;
    
    /**
     * 사용자 이메일로부터 JWT 토큰 생성
     */
    public String generateToken(String userEmail) {
        return generateToken(new HashMap<>(), userEmail);
    }
    
    /**
     * 추가 클레임과 사용자 이메일로부터 JWT 토큰 생성
     */
    public String generateToken(Map<String, Object> extraClaims, String userEmail) {
        return buildToken(extraClaims, userEmail, jwtExpiration);
    }
    
    /**
     * 리프레시 토큰 생성
     */
    public String generateRefreshToken(String userEmail) {
        return buildToken(new HashMap<>(), userEmail, refreshExpiration);
    }
    
    /**
     * JWT 토큰 빌드
     */
    private String buildToken(Map<String, Object> extraClaims, String subject, long expiration) {
        return Jwts
            .builder()
            .setClaims(extraClaims)
            .setSubject(subject)
            .setIssuedAt(new Date(System.currentTimeMillis()))
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSignInKey(), SignatureAlgorithm.HS256)
            .compact();
    }
    
    /**
     * JWT 토큰에서 사용자 이메일 추출
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    /**
     * JWT 토큰에서 만료 시간 추출
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    /**
     * JWT 토큰에서 특정 클레임 추출
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * JWT 토큰에서 모든 클레임 추출
     */
    private Claims extractAllClaims(String token) {
        return Jwts
            .parserBuilder()
            .setSigningKey(getSignInKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
    
    /**
     * JWT 토큰이 유효한지 확인
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }
    
    /**
     * JWT 토큰이 만료되었는지 확인
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    /**
     * 서명 키 생성
     */
    private Key getSignInKey() {
        if (secretKey == null || secretKey.trim().isEmpty()) {
            throw new IllegalArgumentException("JWT secret key is not configured");
        }
        try {
            // Base64로 디코딩 시도
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            // 키 길이가 32바이트(256비트) 미만이면 패딩
            if (keyBytes.length < 32) {
                keyBytes = padKey(keyBytes, 32);
            }
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            // Base64 디코딩 실패 시 일반 문자열을 UTF-8 바이트로 변환
            byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
            // 키 길이가 32바이트(256비트) 미만이면 패딩
            if (keyBytes.length < 32) {
                keyBytes = padKey(keyBytes, 32);
            }
            return Keys.hmacShaKeyFor(keyBytes);
        }
    }
    
    /**
     * 키를 지정된 길이로 패딩 (반복 패턴 사용)
     */
    private byte[] padKey(byte[] key, int targetLength) {
        if (key.length >= targetLength) {
            return key;
        }
        byte[] padded = new byte[targetLength];
        for (int i = 0; i < targetLength; i++) {
            padded[i] = key[i % key.length];
        }
        return padded;
    }
    
    /**
     * 토큰에서 역할 정보 추출
     */
    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("role", String.class);
    }
    
    /**
     * 토큰에서 사용자 ID 추출
     */
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userId", Long.class);
    }
    
    /**
     * 토큰에서 사용자 등급 추출
     */
    public String extractGrade(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("grade", String.class);
    }
    
    /**
     * 토큰 만료 시간까지 남은 시간 (밀리초)
     */
    public long getTimeUntilExpiration(String token) {
        Date expiration = extractExpiration(token);
        return expiration.getTime() - System.currentTimeMillis();
    }
    
    /**
     * 토큰이 곧 만료될 예정인지 확인 (기본값: 1시간 전)
     */
    public boolean isTokenExpiringSoon(String token) {
        return isTokenExpiringSoon(token, 3600000); // 1시간
    }
    
    /**
     * 토큰이 지정된 시간 내에 만료될 예정인지 확인
     */
    public boolean isTokenExpiringSoon(String token, long timeThreshold) {
        long timeUntilExpiration = getTimeUntilExpiration(token);
        return timeUntilExpiration <= timeThreshold;
    }
    
    /**
     * 토큰 정보 검증 (구문 오류, 만료 등)
     */
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
