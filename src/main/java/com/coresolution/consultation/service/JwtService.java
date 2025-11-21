package com.coresolution.consultation.service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import com.coresolution.consultation.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

/**
 * JWT 토큰 서비스
 * Phase 3: 통합 로그인 시스템 구축 - JWT 토큰 확장
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
public class JwtService {
    
    @Value("${jwt.secret:}")
    private String secretKey;
    
    @Value("${jwt.expiration:86400000}") // 24시간 (밀리초)
    private long jwtExpiration;
    
    @Value("${jwt.refresh-expiration:604800000}") // 7일 (밀리초)
    private long refreshExpiration;
    
    /**
     * 사용자 이메일로부터 JWT 토큰 생성 (기본 메서드 - 하위 호환성 유지)
     */
    public String generateToken(String userEmail) {
        return generateToken(new HashMap<>(), userEmail);
    }
    
    /**
     * 추가 클레임과 사용자 이메일로부터 JWT 토큰 생성 (기본 메서드 - 하위 호환성 유지)
     */
    public String generateToken(Map<String, Object> extraClaims, String userEmail) {
        return buildToken(extraClaims, userEmail, jwtExpiration);
    }
    
    /**
     * 사용자 엔티티로부터 JWT 토큰 생성 (확장 버전)
     * Phase 3: tenantId, branchId, permissions 포함
     * 
     * @param user 사용자 엔티티
     * @param permissions 권한 목록 (String 리스트)
     * @return JWT 토큰
     */
    public String generateToken(User user, List<String> permissions) {
        Map<String, Object> claims = new HashMap<>();
        
        // 기본 사용자 정보
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("username", user.getUsername());
        claims.put("role", user.getRole() != null ? user.getRole().name() : null);
        
        // Phase 3: 테넌트 정보 추가
        if (user.getTenantId() != null) {
            claims.put("tenantId", user.getTenantId());
        }
        
        // Phase 3: 지점 정보 추가
        if (user.getBranch() != null && user.getBranch().getId() != null) {
            claims.put("branchId", user.getBranch().getId());
        } else if (user.getBranchCode() != null) {
            // branch 엔티티가 로드되지 않은 경우 branchCode 사용
            claims.put("branchCode", user.getBranchCode());
        }
        
        // Phase 3: 권한 목록 추가
        if (permissions != null && !permissions.isEmpty()) {
            claims.put("permissions", permissions);
        }
        
        log.debug("JWT 토큰 생성: userId={}, tenantId={}, branchId={}, permissions={}", 
            user.getId(), user.getTenantId(), 
            user.getBranch() != null ? user.getBranch().getId() : null, 
            permissions != null ? permissions.size() : 0);
        
        return buildToken(claims, user.getEmail(), jwtExpiration);
    }
    
    /**
     * 사용자 엔티티로부터 JWT 토큰 생성 (권한 목록 없이)
     * 
     * @param user 사용자 엔티티
     * @return JWT 토큰
     */
    public String generateToken(User user) {
        return generateToken(user, null);
    }
    
    /**
     * 리프레시 토큰 생성
     */
    public String generateRefreshToken(String userEmail) {
        return buildToken(new HashMap<>(), userEmail, refreshExpiration);
    }
    
    /**
     * 리프레시 토큰 생성 (tokenId 포함)
     * Phase 3: tokenId를 클레임에 포함하여 토큰 로테이션 시 기존 토큰 무효화 가능
     * 
     * @param userEmail 사용자 이메일
     * @param tokenId Refresh Token ID (UUID)
     * @return JWT Refresh Token
     */
    public String generateRefreshToken(String userEmail, String tokenId) {
        Map<String, Object> claims = new HashMap<>();
        if (tokenId != null && !tokenId.trim().isEmpty()) {
            claims.put("tokenId", tokenId);
        }
        return buildToken(claims, userEmail, refreshExpiration);
    }
    
    /**
     * JWT 토큰에서 tokenId 추출
     * Phase 3: Refresh Token 로테이션을 위해 tokenId 추출
     * 
     * @param token JWT 토큰
     * @return tokenId (없으면 null)
     */
    public String extractTokenId(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("tokenId", String.class);
        } catch (Exception e) {
            log.debug("JWT 토큰에서 tokenId 추출 실패 (정상일 수 있음 - 구버전 토큰): {}", e.getMessage());
            return null;
        }
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
     * JWT 토큰에서 actorRole 추출 (Ops Portal용)
     */
    public String extractActorRole(String token) {
        Claims claims = extractAllClaims(token);
        Object actorRole = claims.get("actorRole");
        if (actorRole != null) {
            return actorRole.toString();
        }
        return null;
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
     * Phase 3: 토큰에서 tenantId 추출
     */
    public String extractTenantId(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("tenantId", String.class);
        } catch (Exception e) {
            log.warn("JWT 토큰에서 tenantId 추출 실패: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Phase 3: 토큰에서 branchId 추출
     */
    public Long extractBranchId(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Object branchId = claims.get("branchId");
            if (branchId == null) {
                return null;
            }
            if (branchId instanceof Long) {
                return (Long) branchId;
            } else if (branchId instanceof Integer) {
                return ((Integer) branchId).longValue();
            } else if (branchId instanceof String) {
                try {
                    return Long.parseLong((String) branchId);
                } catch (NumberFormatException e) {
                    log.warn("JWT 토큰에서 branchId 파싱 실패: {}", branchId);
                    return null;
                }
            }
            return null;
        } catch (Exception e) {
            log.warn("JWT 토큰에서 branchId 추출 실패: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Phase 3: 토큰에서 permissions 추출
     */
    @SuppressWarnings("unchecked")
    public List<String> extractPermissions(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Object permissions = claims.get("permissions");
            if (permissions instanceof List) {
                return (List<String>) permissions;
            }
            return null;
        } catch (Exception e) {
            log.warn("JWT 토큰에서 permissions 추출 실패: {}", e.getMessage());
            return null;
        }
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
