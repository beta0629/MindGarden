package com.coresolution.consultation.service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import com.coresolution.consultation.constant.oauth.OAuthJwtClaimKeys;
import com.coresolution.consultation.constant.oauth.OAuthJwtClaimValues;
import com.coresolution.consultation.dto.OAuthPhoneAccountSelectionClaims;
import com.coresolution.consultation.dto.PasswordLoginAccountSelectionClaims;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.dto.auth.ApplePhoneOtpChallengeClaims;
import com.coresolution.consultation.dto.auth.ApplePhoneVerificationClaims;
import com.coresolution.consultation.dto.auth.OAuthPhoneOtpChallengeClaims;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerificationClaims;
import com.coresolution.consultation.entity.auth.OAuthProvider;
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
    
    @Value("${jwt.expiration:3600000}") // 1시간 (밀리초) — application.yml jwt.expiration과 정합
    private long jwtExpiration;
    
    @Value("${jwt.refresh-expiration:604800000}") // 7일 (밀리초)
    private long refreshExpiration;

    /** OAuth 전화 계정 선택용 단기 JWT TTL (밀리초). 기본 10분. */
    @Value("${jwt.oauth-phone-account-selection-ttl-ms:600000}")
    private long oauthPhoneAccountSelectionTtlMs;

    /**
     * 일반 로그인(전화 + 비밀번호) 다중 매치 계정 선택용 단기 JWT TTL (밀리초). 기본 5분 — 로그인 후 빠른 응답
     * 시퀀스 가정. P1 silent first 차단(2026-06-11).
     */
    @Value("${jwt.password-login-account-selection-ttl-ms:300000}")
    private long passwordLoginAccountSelectionTtlMs;

    /** Apple SIWA 휴대폰 인증 단기 JWT TTL (밀리초). 기본 10분. */
    @Value("${jwt.apple-phone-verification-ttl-ms:600000}")
    private long applePhoneVerificationTtlMs;

    /** Apple SIWA OTP challenge 단기 JWT TTL (밀리초). 기본 5분 — OTP 만료(3분) + 시계 오차 여유. */
    @Value("${jwt.apple-phone-otp-challenge-ttl-ms:300000}")
    private long applePhoneOtpChallengeTtlMs;
    
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
        claims.put("userId", user.getUserId());
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
        
        log.debug("JWT 토큰 생성: userId={}, tenantId={}, permissions={}", 
            user.getId(), user.getTenantId(), 
            permissions != null ? permissions.size() : 0);
        
        // 표준화 2025-12-08: username = userId이므로 subject에 userId 사용
        return buildToken(claims, user.getUserId(), jwtExpiration);
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
     * 표준화 2025-12-08: username = userId이므로 userId 사용
     * 
     * @deprecated User 객체를 받는 메서드 사용 권장 (tenantId, email 포함)
     */
    @Deprecated
    public String generateRefreshToken(String userId) {
        return buildToken(new HashMap<>(), userId, refreshExpiration);
    }
    
    /**
     * 리프레시 토큰 생성 (tokenId 포함)
     * Phase 3: tokenId를 클레임에 포함하여 토큰 로테이션 시 기존 토큰 무효화 가능
     * 표준화 2025-12-08: username = userId이므로 userId 사용
     * 
     * @deprecated User 객체를 받는 메서드 사용 권장 (tenantId, email 포함)
     * 
     * @param userId 사용자 ID
     * @param tokenId Refresh Token ID (UUID)
     * @return JWT Refresh Token
     */
    @Deprecated
    public String generateRefreshToken(String userId, String tokenId) {
        Map<String, Object> claims = new HashMap<>();
        if (tokenId != null && !tokenId.trim().isEmpty()) {
            claims.put("tokenId", tokenId);
        }
        return buildToken(claims, userId, refreshExpiration);
    }
    
    /**
     * 리프레시 토큰 생성 (User 객체 기반, tenantId, email 포함)
     * 표준화 2025-12-08: username = userId이므로 userId 사용
     */
    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        if (user.getTenantId() != null) {
            claims.put("tenantId", user.getTenantId());
        }
        return buildToken(claims, user.getUserId(), refreshExpiration);
    }
    
    /**
     * 리프레시 토큰 생성 (User 객체 기반, tokenId 포함)
     * Phase 3: tokenId를 클레임에 포함하여 토큰 로테이션 시 기존 토큰 무효화 가능
     * 표준화 2025-12-08: username = userId이므로 userId 사용
     */
    public String generateRefreshToken(User user, String tokenId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        if (user.getTenantId() != null) {
            claims.put("tenantId", user.getTenantId());
        }
        if (tokenId != null && !tokenId.trim().isEmpty()) {
            claims.put("tokenId", tokenId);
        }
        return buildToken(claims, user.getUserId(), refreshExpiration);
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
        final String userId = extractUsername(token);
        // CustomUserDetails인 경우 getUserId()를 사용, 아니면 getUsername() 사용
        String userIdentifier;
        if (userDetails instanceof CustomUserDetails) {
            userIdentifier = ((CustomUserDetails) userDetails).getUserId();
        } else {
            userIdentifier = userDetails.getUsername();
        }
        return (userId.equals(userIdentifier)) && !isTokenExpired(token);
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
     * 토큰에서 이메일 추출
     */
    public String extractEmail(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("email", String.class);
        } catch (Exception e) {
            log.debug("JWT 토큰에서 email 추출 실패 (정상일 수 있음 - 구버전 토큰): {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Phase 3: 토큰에서 branchId 추출
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨, branchId는 더 이상 사용하지 않음
     */
    @Deprecated
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
                // 표준화 2025-12-07: 브랜치 개념 제거됨, branchId 무시
                try {
                    return Long.parseLong((String) branchId);
                } catch (NumberFormatException e) {
                    // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그 제거
                    return null;
                }
            }
            return null;
        } catch (Exception e) {
            // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그 제거
            // log.warn("JWT 토큰에서 branchId 추출 실패: {}", e.getMessage());
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

    /**
     * 동일 전화에 상담사·내담자가 공존할 때 계정 선택용 단기 JWT를 발급한다.
     * SNS 액세스 토큰은 URL에 넣지 않고 클레임에만 담는다.
     *
     * @param tenantId 테넌트 ID
     * @param provider KAKAO / NAVER 등
     * @param providerUserId SNS 사용자 ID
     * @param allowedUserIds 선택 허용 사용자 PK 목록
     * @param socialUserInfo SNS 프로필(연동 저장용)
     * @return 서명된 JWT
     */
    public String generateOAuthPhoneAccountSelectionToken(String tenantId, String provider,
            String providerUserId, List<Long> allowedUserIds, SocialUserInfo socialUserInfo) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(OAuthJwtClaimKeys.PURPOSE, OAuthJwtClaimValues.PURPOSE_OAUTH_PHONE_ACCOUNT_SELECTION);
        claims.put(OAuthJwtClaimKeys.TENANT_ID, tenantId);
        claims.put(OAuthJwtClaimKeys.PROVIDER, provider);
        claims.put(OAuthJwtClaimKeys.PROVIDER_USER_ID, providerUserId);
        claims.put(OAuthJwtClaimKeys.ALLOWED_USER_IDS, allowedUserIds);
        if (socialUserInfo != null) {
            if (socialUserInfo.getAccessToken() != null) {
                claims.put(OAuthJwtClaimKeys.SNS_ACCESS_TOKEN, socialUserInfo.getAccessToken());
            }
            if (socialUserInfo.getEmail() != null) {
                claims.put(OAuthJwtClaimKeys.SNS_EMAIL, socialUserInfo.getEmail());
            }
            if (socialUserInfo.getName() != null) {
                claims.put(OAuthJwtClaimKeys.SNS_NAME, socialUserInfo.getName());
            }
            if (socialUserInfo.getNickname() != null) {
                claims.put(OAuthJwtClaimKeys.SNS_NICKNAME, socialUserInfo.getNickname());
            }
            if (socialUserInfo.getPhone() != null) {
                claims.put(OAuthJwtClaimKeys.SNS_PHONE, socialUserInfo.getPhone());
            }
            if (socialUserInfo.getProfileImageUrl() != null) {
                claims.put(OAuthJwtClaimKeys.SNS_PROFILE_IMAGE_URL, socialUserInfo.getProfileImageUrl());
            }
        }
        return buildToken(claims, "oauth-phone-account-selection", oauthPhoneAccountSelectionTtlMs);
    }

    /**
     * 계정 선택 JWT 파싱 및 purpose 검증.
     *
     * @param jwtToken JWT 문자열
     * @return 클레임 DTO
     * @throws IllegalArgumentException purpose 불일치·필수 클레임 누락
     */
    public OAuthPhoneAccountSelectionClaims parseOAuthPhoneAccountSelectionToken(String jwtToken) {
        Claims claims = extractAllClaims(jwtToken);
        String purpose = claims.get(OAuthJwtClaimKeys.PURPOSE, String.class);
        if (!OAuthJwtClaimValues.PURPOSE_OAUTH_PHONE_ACCOUNT_SELECTION.equals(purpose)) {
            throw new IllegalArgumentException("Invalid OAuth selection token purpose");
        }
        String tenantId = claims.get(OAuthJwtClaimKeys.TENANT_ID, String.class);
        String provider = claims.get(OAuthJwtClaimKeys.PROVIDER, String.class);
        String providerUserId = claims.get(OAuthJwtClaimKeys.PROVIDER_USER_ID, String.class);
        if (tenantId == null || tenantId.isBlank() || provider == null || provider.isBlank()
                || providerUserId == null || providerUserId.isBlank()) {
            throw new IllegalArgumentException("Missing required OAuth selection claims");
        }
        List<Long> allowed = readLongIdList(claims.get(OAuthJwtClaimKeys.ALLOWED_USER_IDS));
        if (allowed == null || allowed.isEmpty()) {
            throw new IllegalArgumentException("allowedUserIds missing");
        }
        return OAuthPhoneAccountSelectionClaims.builder()
            .tenantId(tenantId)
            .provider(provider)
            .providerUserId(providerUserId)
            .allowedUserIds(allowed)
            .snsAccessToken(claims.get(OAuthJwtClaimKeys.SNS_ACCESS_TOKEN, String.class))
            .snsEmail(claims.get(OAuthJwtClaimKeys.SNS_EMAIL, String.class))
            .snsName(claims.get(OAuthJwtClaimKeys.SNS_NAME, String.class))
            .snsNickname(claims.get(OAuthJwtClaimKeys.SNS_NICKNAME, String.class))
            .snsPhone(claims.get(OAuthJwtClaimKeys.SNS_PHONE, String.class))
            .snsProfileImageUrl(claims.get(OAuthJwtClaimKeys.SNS_PROFILE_IMAGE_URL, String.class))
            .build();
    }

    /**
     * 일반 로그인(전화 + 비밀번호) 다중 매치 시 발급하는 단기 계정 선택 JWT.
     *
     * <p>OAuth {@link #generateOAuthPhoneAccountSelectionToken} 패턴을 미러링한 비-OAuth 변형 — SNS
     * 액세스 토큰·이메일·이름 등은 포함하지 않는다(보안 — 노출 최소화). P1 silent first 차단(2026-06-11).</p>
     *
     * @param tenantId        테넌트 ID
     * @param allowedUserIds  선택 허용 사용자 PK 목록(휴대폰 + 비밀번호 모두 일치한 사용자만)
     * @return 서명된 5분 TTL JWT
     */
    public String generatePasswordLoginAccountSelectionToken(String tenantId, List<Long> allowedUserIds) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId is required for password-login selection token");
        }
        if (allowedUserIds == null || allowedUserIds.isEmpty()) {
            throw new IllegalArgumentException("allowedUserIds is required for password-login selection token");
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put(OAuthJwtClaimKeys.PURPOSE, OAuthJwtClaimValues.PURPOSE_PASSWORD_LOGIN_ACCOUNT_SELECTION);
        claims.put(OAuthJwtClaimKeys.TENANT_ID, tenantId);
        claims.put(OAuthJwtClaimKeys.ALLOWED_USER_IDS, allowedUserIds);
        return buildToken(claims, "password-login-account-selection", passwordLoginAccountSelectionTtlMs);
    }

    /**
     * 일반 로그인 다중 매치 계정 선택 JWT 파싱 및 purpose 검증.
     *
     * @param jwtToken JWT 문자열
     * @return 클레임 DTO ({@code tenantId}, {@code allowedUserIds})
     * @throws IllegalArgumentException purpose 불일치·필수 클레임 누락
     */
    public PasswordLoginAccountSelectionClaims parsePasswordLoginAccountSelectionToken(String jwtToken) {
        Claims claims = extractAllClaims(jwtToken);
        String purpose = claims.get(OAuthJwtClaimKeys.PURPOSE, String.class);
        if (!OAuthJwtClaimValues.PURPOSE_PASSWORD_LOGIN_ACCOUNT_SELECTION.equals(purpose)) {
            throw new IllegalArgumentException("Invalid password-login selection token purpose");
        }
        String tenantId = claims.get(OAuthJwtClaimKeys.TENANT_ID, String.class);
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Missing tenantId in password-login selection token");
        }
        List<Long> allowed = readLongIdList(claims.get(OAuthJwtClaimKeys.ALLOWED_USER_IDS));
        if (allowed == null || allowed.isEmpty()) {
            throw new IllegalArgumentException("allowedUserIds missing in password-login selection token");
        }
        return PasswordLoginAccountSelectionClaims.builder()
            .tenantId(tenantId)
            .allowedUserIds(allowed)
            .build();
    }

    /**
     * Apple SIWA 휴대폰 매칭 흐름 1단계 — apple_sub 인증 직후 발급되는 단기 JWT.
     *
     * <p>클라이언트는 이 토큰을 가지고 phone 입력 화면으로 이동, OTP send/verify 호출 시 함께 전송한다.
     * 토큰에는 Apple 첫 로그인이 제공한 email/name 을 박아둬, 신규 가입 분기에서 prefill 로 활용한다.</p>
     *
     * @param claims 발급할 클레임(provider 는 항상 APPLE)
     * @return 서명된 JWT
     */
    public String generateApplePhoneVerificationToken(ApplePhoneVerificationClaims claims) {
        if (claims == null || claims.getTenantId() == null || claims.getProviderUserId() == null) {
            throw new IllegalArgumentException("ApplePhoneVerificationClaims tenantId/providerUserId required");
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put(OAuthJwtClaimKeys.PURPOSE, OAuthJwtClaimValues.PURPOSE_APPLE_PHONE_VERIFICATION);
        payload.put(OAuthJwtClaimKeys.TENANT_ID, claims.getTenantId());
        payload.put(OAuthJwtClaimKeys.PROVIDER, claims.getProvider());
        payload.put(OAuthJwtClaimKeys.PROVIDER_USER_ID, claims.getProviderUserId());
        if (claims.getEmail() != null) {
            payload.put(OAuthJwtClaimKeys.SNS_EMAIL, claims.getEmail());
        }
        if (claims.getName() != null) {
            payload.put(OAuthJwtClaimKeys.SNS_NAME, claims.getName());
        }
        if (claims.getNickname() != null) {
            payload.put(OAuthJwtClaimKeys.SNS_NICKNAME, claims.getNickname());
        }
        return buildToken(payload, "apple-phone-verification", applePhoneVerificationTtlMs);
    }

    /**
     * Apple SIWA 휴대폰 인증 토큰 파싱 + purpose 검증.
     *
     * @param token JWT 문자열
     * @return 클레임 DTO
     * @throws IllegalArgumentException purpose 불일치 / 필수 클레임 누락 / 만료
     */
    public ApplePhoneVerificationClaims parseApplePhoneVerificationToken(String token) {
        Claims claims = extractAllClaims(token);
        String purpose = claims.get(OAuthJwtClaimKeys.PURPOSE, String.class);
        if (!OAuthJwtClaimValues.PURPOSE_APPLE_PHONE_VERIFICATION.equals(purpose)) {
            throw new IllegalArgumentException("Invalid Apple phone verification token purpose");
        }
        String tenantId = claims.get(OAuthJwtClaimKeys.TENANT_ID, String.class);
        String provider = claims.get(OAuthJwtClaimKeys.PROVIDER, String.class);
        String providerUserId = claims.get(OAuthJwtClaimKeys.PROVIDER_USER_ID, String.class);
        if (tenantId == null || tenantId.isBlank()
                || provider == null || provider.isBlank()
                || providerUserId == null || providerUserId.isBlank()) {
            throw new IllegalArgumentException("Missing required Apple phone verification claims");
        }
        return ApplePhoneVerificationClaims.builder()
            .tenantId(tenantId)
            .provider(provider)
            .providerUserId(providerUserId)
            .email(claims.get(OAuthJwtClaimKeys.SNS_EMAIL, String.class))
            .name(claims.get(OAuthJwtClaimKeys.SNS_NAME, String.class))
            .nickname(claims.get(OAuthJwtClaimKeys.SNS_NICKNAME, String.class))
            .build();
    }

    /**
     * Apple SIWA 휴대폰 매칭 흐름 2단계 — OTP 발송 시 발행되는 challenge 토큰.
     *
     * <p>(phone_hash, otp_id) 를 묶어 다른 phone 으로의 verify 우회를 차단한다.
     * verify 호출 시 phoneVerificationToken + 본 토큰 + code 3 가지를 모두 일치 검증한다.</p>
     *
     * @param claims OTP challenge 클레임
     * @return 서명된 JWT
     */
    public String generateApplePhoneOtpChallengeToken(ApplePhoneOtpChallengeClaims claims) {
        if (claims == null || claims.getTenantId() == null || claims.getProviderUserId() == null
                || claims.getPhoneHash() == null || claims.getOtpId() == null) {
            throw new IllegalArgumentException("ApplePhoneOtpChallengeClaims required fields missing");
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put(OAuthJwtClaimKeys.PURPOSE, OAuthJwtClaimValues.PURPOSE_APPLE_PHONE_OTP_CHALLENGE);
        payload.put(OAuthJwtClaimKeys.TENANT_ID, claims.getTenantId());
        payload.put(OAuthJwtClaimKeys.PROVIDER, claims.getProvider());
        payload.put(OAuthJwtClaimKeys.PROVIDER_USER_ID, claims.getProviderUserId());
        payload.put(OAuthJwtClaimKeys.PHONE_HASH, claims.getPhoneHash());
        if (claims.getNormalizedPhone() != null) {
            // 정규화 phone (digits) 은 optional — 채우면 user 매칭이 hash 비교 없이 즉시 가능. 없으면 hash 매칭.
            payload.put(OAuthJwtClaimKeys.SNS_PHONE, claims.getNormalizedPhone());
        }
        payload.put(OAuthJwtClaimKeys.OTP_ID, claims.getOtpId());
        return buildToken(payload, "apple-phone-otp-challenge", applePhoneOtpChallengeTtlMs);
    }

    /**
     * Apple SIWA OTP challenge 토큰 파싱 + purpose 검증.
     *
     * @param token JWT 문자열
     * @return 클레임 DTO
     * @throws IllegalArgumentException purpose 불일치 / 필수 클레임 누락 / 만료
     */
    public ApplePhoneOtpChallengeClaims parseApplePhoneOtpChallengeToken(String token) {
        Claims claims = extractAllClaims(token);
        String purpose = claims.get(OAuthJwtClaimKeys.PURPOSE, String.class);
        if (!OAuthJwtClaimValues.PURPOSE_APPLE_PHONE_OTP_CHALLENGE.equals(purpose)) {
            throw new IllegalArgumentException("Invalid Apple OTP challenge token purpose");
        }
        String tenantId = claims.get(OAuthJwtClaimKeys.TENANT_ID, String.class);
        String provider = claims.get(OAuthJwtClaimKeys.PROVIDER, String.class);
        String providerUserId = claims.get(OAuthJwtClaimKeys.PROVIDER_USER_ID, String.class);
        String phoneHash = claims.get(OAuthJwtClaimKeys.PHONE_HASH, String.class);
        String normalizedPhone = claims.get(OAuthJwtClaimKeys.SNS_PHONE, String.class);
        Object otpIdRaw = claims.get(OAuthJwtClaimKeys.OTP_ID);
        Long otpId = null;
        if (otpIdRaw instanceof Number) {
            otpId = ((Number) otpIdRaw).longValue();
        } else if (otpIdRaw != null) {
            try {
                otpId = Long.parseLong(otpIdRaw.toString());
            } catch (NumberFormatException ignored) {
                otpId = null;
            }
        }
        if (tenantId == null || tenantId.isBlank()
                || provider == null || provider.isBlank()
                || providerUserId == null || providerUserId.isBlank()
                || phoneHash == null || phoneHash.isBlank()
                || otpId == null) {
            throw new IllegalArgumentException("Missing required Apple OTP challenge claims");
        }
        return ApplePhoneOtpChallengeClaims.builder()
            .tenantId(tenantId)
            .provider(provider)
            .providerUserId(providerUserId)
            .phoneHash(phoneHash)
            .normalizedPhone(normalizedPhone)
            .otpId(otpId)
            .build();
    }

    /**
     * provider-agnostic OAuth 휴대폰 매칭 흐름 1단계 — OAuth 콜백 직후 발급되는 단기 JWT.
     *
     * <p>Apple/Google/Kakao/Naver 4 종 provider 가 공통으로 사용. 기존 Apple 전용
     * {@link #generateApplePhoneVerificationToken(ApplePhoneVerificationClaims)} 는
     * alias 로 유지되며, 신규 코드는 본 메서드를 사용한다.</p>
     *
     * @param claims 발급할 클레임
     * @return 서명된 JWT
     */
    public String generateOAuthPhoneVerificationToken(OAuthPhoneVerificationClaims claims) {
        if (claims == null || claims.getTenantId() == null || claims.getProviderUserId() == null
                || claims.getOauthProvider() == null) {
            throw new IllegalArgumentException("OAuthPhoneVerificationClaims required fields missing");
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put(OAuthJwtClaimKeys.PURPOSE, OAuthJwtClaimValues.PURPOSE_OAUTH_PHONE_VERIFICATION);
        payload.put(OAuthJwtClaimKeys.TENANT_ID, claims.getTenantId());
        payload.put(OAuthJwtClaimKeys.PROVIDER, claims.getOauthProvider().name());
        payload.put(OAuthJwtClaimKeys.PROVIDER_USER_ID, claims.getProviderUserId());
        if (claims.getEmail() != null) {
            payload.put(OAuthJwtClaimKeys.SNS_EMAIL, claims.getEmail());
        }
        if (claims.getName() != null) {
            payload.put(OAuthJwtClaimKeys.SNS_NAME, claims.getName());
        }
        if (claims.getNickname() != null) {
            payload.put(OAuthJwtClaimKeys.SNS_NICKNAME, claims.getNickname());
        }
        if (claims.getProfileImageUrl() != null) {
            payload.put(OAuthJwtClaimKeys.SNS_PROFILE_IMAGE_URL, claims.getProfileImageUrl());
        }
        return buildToken(payload, "oauth-phone-verification", applePhoneVerificationTtlMs);
    }

    /**
     * OAuth 휴대폰 인증 토큰 파싱 + purpose 검증.
     *
     * <p>신규 {@code OAUTH_PHONE_VERIFICATION} purpose 우선 인정.
     * 호환을 위해 기존 {@code APPLE_PHONE_VERIFICATION} purpose 도 허용(deprecated alias) —
     * 이 경우 provider 는 {@link OAuthProvider#APPLE} 로 보정한다.</p>
     *
     * @param token JWT 문자열
     * @return 클레임 DTO
     * @throws IllegalArgumentException purpose 불일치 / 필수 클레임 누락 / 만료
     */
    public OAuthPhoneVerificationClaims parseOAuthPhoneVerificationToken(String token) {
        Claims claims = extractAllClaims(token);
        String purpose = claims.get(OAuthJwtClaimKeys.PURPOSE, String.class);
        if (!OAuthJwtClaimValues.PURPOSE_OAUTH_PHONE_VERIFICATION.equals(purpose)
                && !OAuthJwtClaimValues.PURPOSE_APPLE_PHONE_VERIFICATION.equals(purpose)) {
            throw new IllegalArgumentException("Invalid OAuth phone verification token purpose");
        }
        String tenantId = claims.get(OAuthJwtClaimKeys.TENANT_ID, String.class);
        String provider = claims.get(OAuthJwtClaimKeys.PROVIDER, String.class);
        String providerUserId = claims.get(OAuthJwtClaimKeys.PROVIDER_USER_ID, String.class);
        if (tenantId == null || tenantId.isBlank()
                || provider == null || provider.isBlank()
                || providerUserId == null || providerUserId.isBlank()) {
            throw new IllegalArgumentException("Missing required OAuth phone verification claims");
        }
        OAuthProvider oauthProvider;
        try {
            oauthProvider = OAuthProvider.fromString(provider);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported OAuth provider in phone verification token: " + provider, e);
        }
        return OAuthPhoneVerificationClaims.builder()
            .tenantId(tenantId)
            .oauthProvider(oauthProvider)
            .providerUserId(providerUserId)
            .email(claims.get(OAuthJwtClaimKeys.SNS_EMAIL, String.class))
            .name(claims.get(OAuthJwtClaimKeys.SNS_NAME, String.class))
            .nickname(claims.get(OAuthJwtClaimKeys.SNS_NICKNAME, String.class))
            .profileImageUrl(claims.get(OAuthJwtClaimKeys.SNS_PROFILE_IMAGE_URL, String.class))
            .build();
    }

    /**
     * provider-agnostic OAuth 휴대폰 매칭 흐름 2단계 — OTP 발송 시 발행되는 challenge 토큰.
     *
     * <p>(phone_hash, otp_id) 를 묶어 다른 phone 으로의 verify 우회를 차단한다.</p>
     *
     * @param claims OTP challenge 클레임
     * @return 서명된 JWT
     */
    public String generateOAuthPhoneOtpChallengeToken(OAuthPhoneOtpChallengeClaims claims) {
        if (claims == null || claims.getTenantId() == null || claims.getProviderUserId() == null
                || claims.getOauthProvider() == null
                || claims.getPhoneHash() == null || claims.getOtpId() == null) {
            throw new IllegalArgumentException("OAuthPhoneOtpChallengeClaims required fields missing");
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put(OAuthJwtClaimKeys.PURPOSE, OAuthJwtClaimValues.PURPOSE_OAUTH_PHONE_OTP_CHALLENGE);
        payload.put(OAuthJwtClaimKeys.TENANT_ID, claims.getTenantId());
        payload.put(OAuthJwtClaimKeys.PROVIDER, claims.getOauthProvider().name());
        payload.put(OAuthJwtClaimKeys.PROVIDER_USER_ID, claims.getProviderUserId());
        payload.put(OAuthJwtClaimKeys.PHONE_HASH, claims.getPhoneHash());
        if (claims.getNormalizedPhone() != null) {
            payload.put(OAuthJwtClaimKeys.SNS_PHONE, claims.getNormalizedPhone());
        }
        payload.put(OAuthJwtClaimKeys.OTP_ID, claims.getOtpId());
        return buildToken(payload, "oauth-phone-otp-challenge", applePhoneOtpChallengeTtlMs);
    }

    /**
     * OAuth OTP challenge 토큰 파싱 + purpose 검증.
     *
     * <p>{@code OAUTH_PHONE_OTP_CHALLENGE} purpose 우선. {@code APPLE_PHONE_OTP_CHALLENGE} purpose 는
     * 호환을 위해 허용(deprecated alias).</p>
     *
     * @param token JWT 문자열
     * @return 클레임 DTO
     */
    public OAuthPhoneOtpChallengeClaims parseOAuthPhoneOtpChallengeToken(String token) {
        Claims claims = extractAllClaims(token);
        String purpose = claims.get(OAuthJwtClaimKeys.PURPOSE, String.class);
        if (!OAuthJwtClaimValues.PURPOSE_OAUTH_PHONE_OTP_CHALLENGE.equals(purpose)
                && !OAuthJwtClaimValues.PURPOSE_APPLE_PHONE_OTP_CHALLENGE.equals(purpose)) {
            throw new IllegalArgumentException("Invalid OAuth OTP challenge token purpose");
        }
        String tenantId = claims.get(OAuthJwtClaimKeys.TENANT_ID, String.class);
        String provider = claims.get(OAuthJwtClaimKeys.PROVIDER, String.class);
        String providerUserId = claims.get(OAuthJwtClaimKeys.PROVIDER_USER_ID, String.class);
        String phoneHash = claims.get(OAuthJwtClaimKeys.PHONE_HASH, String.class);
        String normalizedPhone = claims.get(OAuthJwtClaimKeys.SNS_PHONE, String.class);
        Object otpIdRaw = claims.get(OAuthJwtClaimKeys.OTP_ID);
        Long otpId = null;
        if (otpIdRaw instanceof Number) {
            otpId = ((Number) otpIdRaw).longValue();
        } else if (otpIdRaw != null) {
            try {
                otpId = Long.parseLong(otpIdRaw.toString());
            } catch (NumberFormatException ignored) {
                otpId = null;
            }
        }
        if (tenantId == null || tenantId.isBlank()
                || provider == null || provider.isBlank()
                || providerUserId == null || providerUserId.isBlank()
                || phoneHash == null || phoneHash.isBlank()
                || otpId == null) {
            throw new IllegalArgumentException("Missing required OAuth OTP challenge claims");
        }
        OAuthProvider oauthProvider;
        try {
            oauthProvider = OAuthProvider.fromString(provider);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported OAuth provider in OTP challenge token: " + provider, e);
        }
        return OAuthPhoneOtpChallengeClaims.builder()
            .tenantId(tenantId)
            .oauthProvider(oauthProvider)
            .providerUserId(providerUserId)
            .phoneHash(phoneHash)
            .normalizedPhone(normalizedPhone)
            .otpId(otpId)
            .build();
    }

    @SuppressWarnings("unchecked")
    private static List<Long> readLongIdList(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof List) {
            List<?> list = (List<?>) raw;
            List<Long> out = new ArrayList<>(list.size());
            for (Object o : list) {
                if (o instanceof Number) {
                    out.add(((Number) o).longValue());
                } else if (o != null) {
                    out.add(Long.parseLong(o.toString()));
                }
            }
            return out;
        }
        return null;
    }
}
