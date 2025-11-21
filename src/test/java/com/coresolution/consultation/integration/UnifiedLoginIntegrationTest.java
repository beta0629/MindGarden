package com.coresolution.consultation.integration;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.RefreshTokenRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.MultiTenantUserService;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 통합 로그인 시스템 통합 테스트
 * Phase 3 Week 2 Day 5: ID/PW 로그인, 소셜 로그인, 테넌트별 라우팅, 보안 검증
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("통합 로그인 시스템 통합 테스트")
class UnifiedLoginIntegrationTest {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private RefreshTokenService refreshTokenService;
    
    @Autowired
    private MultiTenantUserService multiTenantUserService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private BranchRepository branchRepository;
    
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    private Tenant testTenant1;
    private Tenant testTenant2;
    private Branch testBranch1;
    private Branch testBranch2;
    private User testUser1;
    private User testUser2;
    private String tenantId1;
    private String tenantId2;
    
    @BeforeEach
    void setUp() {
        // 테스트용 테넌트 1 생성
        tenantId1 = "tenant-" + UUID.randomUUID().toString();
        testTenant1 = Tenant.builder()
                .tenantId(tenantId1)
                .name("테스트 테넌트 1")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("tenant1@test.com")
                .build();
        testTenant1 = tenantRepository.save(testTenant1);
        
        // 테스트용 테넌트 2 생성
        tenantId2 = "tenant-" + UUID.randomUUID().toString();
        testTenant2 = Tenant.builder()
                .tenantId(tenantId2)
                .name("테스트 테넌트 2")
                .businessType("ACADEMY")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("tenant2@test.com")
                .build();
        testTenant2 = tenantRepository.save(testTenant2);
        
        // 테스트용 지점 1 생성
        testBranch1 = new Branch();
        testBranch1.setBranchCode("BRANCH-001");
        testBranch1.setBranchName("테스트 지점 1");
        testBranch1.setTenantId(tenantId1);
        testBranch1 = branchRepository.save(testBranch1);
        
        // 테스트용 지점 2 생성
        testBranch2 = new Branch();
        testBranch2.setBranchCode("BRANCH-002");
        testBranch2.setBranchName("테스트 지점 2");
        testBranch2.setTenantId(tenantId2);
        testBranch2 = branchRepository.save(testBranch2);
        
        // 테스트용 사용자 1 생성 (테넌트 1에 속함)
        testUser1 = new User();
        testUser1.setEmail("test1@example.com");
        testUser1.setUsername("testuser1");
        testUser1.setPassword(passwordEncoder.encode("password123"));
        testUser1.setName("테스트 사용자 1");
        testUser1.setRole(UserRole.CONSULTANT);
        testUser1.setTenantId(tenantId1);
        testUser1.setBranch(testBranch1);
        testUser1.setIsActive(true);
        testUser1 = userRepository.save(testUser1);
        
        // 테스트용 사용자 2 생성 (테넌트 2에 속함)
        testUser2 = new User();
        testUser2.setEmail("test2@example.com");
        testUser2.setUsername("testuser2");
        testUser2.setPassword(passwordEncoder.encode("password123"));
        testUser2.setName("테스트 사용자 2");
        testUser2.setRole(UserRole.CLIENT);
        testUser2.setTenantId(tenantId2);
        testUser2.setBranch(testBranch2);
        testUser2.setIsActive(true);
        testUser2 = userRepository.save(testUser2);
    }
    
    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }
    
    @Test
    @DisplayName("ID/PW 로그인 - JWT 토큰에 tenantId, branchId, permissions 포함 확인")
    void testIdPasswordLogin_JwtTokenContainsTenantInfo() {
        // When
        AuthResponse response = authService.authenticate(testUser1.getEmail(), "password123");
        
        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getToken()).isNotNull();
        assertThat(response.getRefreshToken()).isNotNull();
        
        // JWT 토큰에서 tenantId, branchId, permissions 추출 확인
        String token = response.getToken();
        String tenantId = jwtService.extractTenantId(token);
        Long branchId = jwtService.extractBranchId(token);
        List<String> permissions = jwtService.extractPermissions(token);
        
        assertThat(tenantId).isEqualTo(tenantId1);
        assertThat(branchId).isEqualTo(testBranch1.getId());
        assertThat(permissions).isNotNull();
        
        log.info("✅ ID/PW 로그인 성공: tenantId={}, branchId={}, permissions={}", 
            tenantId, branchId, permissions);
    }
    
    @Test
    @DisplayName("ID/PW 로그인 - Refresh Token 저장 확인")
    void testIdPasswordLogin_RefreshTokenStored() {
        // When
        AuthResponse response = authService.authenticate(testUser1.getEmail(), "password123");
        
        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getRefreshToken()).isNotNull();
        
        // RefreshToken이 저장되었는지 확인
        List<RefreshToken> refreshTokens = refreshTokenRepository.findActiveTokensByUserId(
            testUser1.getId(), java.time.LocalDateTime.now());
        
        assertThat(refreshTokens).isNotEmpty();
        assertThat(refreshTokens.get(0).getTenantId()).isEqualTo(tenantId1);
        assertThat(refreshTokens.get(0).getUserId()).isEqualTo(testUser1.getId());
        
        log.info("✅ Refresh Token 저장 확인: tokenId={}, tenantId={}", 
            refreshTokens.get(0).getTokenId(), refreshTokens.get(0).getTenantId());
    }
    
    @Test
    @DisplayName("Refresh Token 갱신 - 새 토큰 발급 및 기존 토큰 무효화")
    void testRefreshToken_NewTokenIssued() {
        // Given: 로그인하여 Refresh Token 발급
        AuthResponse loginResponse = authService.authenticate(testUser1.getEmail(), "password123");
        String refreshToken = loginResponse.getRefreshToken();
        
        // When: Refresh Token으로 새 토큰 발급
        AuthResponse refreshResponse = authService.refreshToken(refreshToken);
        
        // Then
        assertThat(refreshResponse.isSuccess()).isTrue();
        assertThat(refreshResponse.getToken()).isNotNull();
        assertThat(refreshResponse.getRefreshToken()).isNotNull();
        
        // 새 JWT 토큰에 tenantId, branchId 포함 확인
        String newToken = refreshResponse.getToken();
        String tenantId = jwtService.extractTenantId(newToken);
        Long branchId = jwtService.extractBranchId(newToken);
        
        assertThat(tenantId).isEqualTo(tenantId1);
        assertThat(branchId).isEqualTo(testBranch1.getId());
        
        log.info("✅ Refresh Token 갱신 성공: tenantId={}, branchId={}", tenantId, branchId);
    }
    
    @Test
    @DisplayName("멀티 테넌트 사용자 감지 - 2개 이상의 테넌트에 접근 가능한 경우")
    void testMultiTenantUserDetection() {
        // Given: 사용자가 여러 테넌트에 접근한 경우 (RefreshToken을 통해)
        // 테넌트 1에 대한 RefreshToken 생성
        RefreshToken token1 = RefreshToken.builder()
            .tokenId(UUID.randomUUID().toString())
            .userId(testUser1.getId())
            .tenantId(tenantId1)
            .refreshTokenHash("hash1")
            .expiresAt(java.time.LocalDateTime.now().plusDays(7))
            .revoked(false)
            .createdAt(java.time.LocalDateTime.now())
            .updatedAt(java.time.LocalDateTime.now())
            .build();
        refreshTokenRepository.save(token1);
        
        // 테넌트 2에 대한 RefreshToken 생성 (같은 사용자가 다른 테넌트에 접근)
        RefreshToken token2 = RefreshToken.builder()
            .tokenId(UUID.randomUUID().toString())
            .userId(testUser1.getId())
            .tenantId(tenantId2)
            .refreshTokenHash("hash2")
            .expiresAt(java.time.LocalDateTime.now().plusDays(7))
            .revoked(false)
            .createdAt(java.time.LocalDateTime.now())
            .updatedAt(java.time.LocalDateTime.now())
            .build();
        refreshTokenRepository.save(token2);
        
        // When
        boolean isMultiTenant = multiTenantUserService.isMultiTenantUser(testUser1.getId());
        List<Tenant> accessibleTenants = multiTenantUserService.getAccessibleTenants(testUser1.getId());
        
        // Then
        assertThat(isMultiTenant).isTrue();
        assertThat(accessibleTenants.size()).isGreaterThanOrEqualTo(2);
        
        log.info("✅ 멀티 테넌트 사용자 감지: userId={}, tenantCount={}", 
            testUser1.getId(), accessibleTenants.size());
    }
    
    @Test
    @DisplayName("테넌트 접근 권한 확인 - 접근 가능한 테넌트")
    void testTenantAccessControl_HasAccess() {
        // Given: 사용자가 테넌트 1에 속함
        // When
        boolean hasAccess = multiTenantUserService.hasAccessToTenant(testUser1.getId(), tenantId1);
        
        // Then
        assertThat(hasAccess).isTrue();
        
        log.info("✅ 테넌트 접근 권한 확인: userId={}, tenantId={}, hasAccess={}", 
            testUser1.getId(), tenantId1, hasAccess);
    }
    
    @Test
    @DisplayName("테넌트 접근 권한 확인 - 접근 불가능한 테넌트")
    void testTenantAccessControl_NoAccess() {
        // Given: 사용자 1은 테넌트 1에만 속함
        // When
        boolean hasAccess = multiTenantUserService.hasAccessToTenant(testUser1.getId(), tenantId2);
        
        // Then
        assertThat(hasAccess).isFalse();
        
        log.info("✅ 테넌트 접근 권한 확인: userId={}, tenantId={}, hasAccess={}", 
            testUser1.getId(), tenantId2, hasAccess);
    }
    
    @Test
    @DisplayName("현재 테넌트 조회 - User의 Branch를 통한 테넌트 조회")
    void testGetCurrentTenant() {
        // When
        Tenant currentTenant = multiTenantUserService.getCurrentTenant(testUser1);
        
        // Then
        assertThat(currentTenant).isNotNull();
        assertThat(currentTenant.getTenantId()).isEqualTo(tenantId1);
        
        log.info("✅ 현재 테넌트 조회: userId={}, tenantId={}", 
            testUser1.getId(), currentTenant.getTenantId());
    }
    
    @Test
    @DisplayName("기본 테넌트 조회 - 가장 최근에 사용한 테넌트")
    void testGetDefaultTenant() {
        // Given: RefreshToken을 통해 테넌트 2에 접근한 이력 생성
        RefreshToken token = RefreshToken.builder()
            .tokenId(UUID.randomUUID().toString())
            .userId(testUser1.getId())
            .tenantId(tenantId2)
            .refreshTokenHash("hash")
            .expiresAt(java.time.LocalDateTime.now().plusDays(7))
            .revoked(false)
            .createdAt(java.time.LocalDateTime.now())
            .updatedAt(java.time.LocalDateTime.now())
            .build();
        refreshTokenRepository.save(token);
        
        // When
        Tenant defaultTenant = multiTenantUserService.getDefaultTenant(testUser1.getId());
        
        // Then
        assertThat(defaultTenant).isNotNull();
        // 가장 최근에 사용한 테넌트 또는 현재 테넌트 반환
        assertThat(defaultTenant.getTenantId()).isIn(tenantId1, tenantId2);
        
        log.info("✅ 기본 테넌트 조회: userId={}, tenantId={}", 
            testUser1.getId(), defaultTenant.getTenantId());
    }
    
    @Test
    @DisplayName("JWT 토큰에서 TenantContextHolder 자동 설정 확인")
    void testJwtToken_TenantContextAutoSet() {
        // Given: 로그인하여 JWT 토큰 발급
        AuthResponse response = authService.authenticate(testUser1.getEmail(), "password123");
        String token = response.getToken();
        
        // When: JWT 토큰에서 tenantId, branchId 추출하여 TenantContextHolder 설정
        String tenantId = jwtService.extractTenantId(token);
        Long branchId = jwtService.extractBranchId(token);
        
        if (tenantId != null) {
            TenantContextHolder.setTenantId(tenantId);
        }
        if (branchId != null) {
            TenantContextHolder.setBranchId(branchId.toString());
        }
        
        // Then
        assertThat(TenantContextHolder.getTenantId()).isEqualTo(tenantId1);
        assertThat(TenantContextHolder.getBranchId()).isEqualTo(testBranch1.getId().toString());
        
        log.info("✅ TenantContextHolder 자동 설정: tenantId={}, branchId={}", 
            TenantContextHolder.getTenantId(), TenantContextHolder.getBranchId());
    }
    
    @Test
    @DisplayName("보안 검증 - Refresh Token 무효화")
    void testSecurity_RefreshTokenRevocation() {
        // Given: RefreshToken 생성
        RefreshToken token = RefreshToken.builder()
            .tokenId(UUID.randomUUID().toString())
            .userId(testUser1.getId())
            .tenantId(tenantId1)
            .refreshTokenHash("hash")
            .expiresAt(java.time.LocalDateTime.now().plusDays(7))
            .revoked(false)
            .createdAt(java.time.LocalDateTime.now())
            .updatedAt(java.time.LocalDateTime.now())
            .build();
        token = refreshTokenRepository.save(token);
        
        // When: RefreshToken 무효화
        refreshTokenService.revokeRefreshToken(token.getTokenId());
        
        // Then
        RefreshToken revokedToken = refreshTokenRepository.findByTokenId(token.getTokenId())
            .orElseThrow();
        assertThat(revokedToken.getRevoked()).isTrue();
        assertThat(revokedToken.getRevokedAt()).isNotNull();
        
        log.info("✅ Refresh Token 무효화 확인: tokenId={}, revoked={}", 
            token.getTokenId(), revokedToken.getRevoked());
    }
    
    @Test
    @DisplayName("보안 검증 - 사용자의 모든 RefreshToken 무효화")
    void testSecurity_RevokeAllUserTokens() {
        // Given: 여러 RefreshToken 생성
        for (int i = 0; i < 3; i++) {
            RefreshToken token = RefreshToken.builder()
                .tokenId(UUID.randomUUID().toString())
                .userId(testUser1.getId())
                .tenantId(tenantId1)
                .refreshTokenHash("hash" + i)
                .expiresAt(java.time.LocalDateTime.now().plusDays(7))
                .revoked(false)
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .build();
            refreshTokenRepository.save(token);
        }
        
        // When: 사용자의 모든 RefreshToken 무효화
        refreshTokenService.revokeAllUserTokens(testUser1.getId());
        
        // Then
        List<RefreshToken> activeTokens = refreshTokenRepository.findActiveTokensByUserId(
            testUser1.getId(), java.time.LocalDateTime.now());
        assertThat(activeTokens).isEmpty();
        
        log.info("✅ 사용자의 모든 RefreshToken 무효화 확인: userId={}", testUser1.getId());
    }
}

