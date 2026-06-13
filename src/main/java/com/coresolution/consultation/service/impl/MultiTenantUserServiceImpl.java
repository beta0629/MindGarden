package com.coresolution.consultation.service.impl;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.RefreshTokenRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MultiTenantUserService;
import com.coresolution.consultation.util.EmailLogMasking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 멀티 테넌트 사용자 서비스 구현체
 * Phase 3: 멀티 테넌트 사용자 지원
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MultiTenantUserServiceImpl implements MultiTenantUserService {
    
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * 현재 요청 테넌트 컨텍스트에서만 사용자를 조회합니다. 컨텍스트가 없거나 다른 테넌트 PK면 조회되지 않습니다.
     *
     * @param userId 사용자 PK
     * @return 해당 테넌트의 사용자
     * @throws IllegalStateException 테넌트 컨텍스트가 비어 있는 경우
     */
    private User requireUserInCurrentTenant(Long userId) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            throw new IllegalStateException(
                "Tenant context is required for user-scoped tenant resolution: userId=" + userId);
        }
        return userRepository.findByTenantIdAndId(tenantId.trim(), userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Tenant> getAccessibleTenants(Long userId) {
        log.debug("사용자가 접근 가능한 테넌트 목록 조회: userId={}", userId);
        
        User user = requireUserInCurrentTenant(userId);
        
        Set<String> tenantIds = new HashSet<>();
        
        // 이메일만으로 다른 테넌트의 권한을 부여하는 보안 취약점 제거
        // 단일 사용자 엔티티의 권한만 반환하도록 축소
        // PR-A(2026-06-13): User.branch @ManyToOne 제거 후 branch.tenantId 폴백 경로 삭제.
        // 브랜치 개념은 이미 테넌트 기반으로 대체됨(2025-12-07). 다중 테넌트 접근권은
        // user.tenantId + RefreshToken.tenantId 기록만으로 판정한다.
        
        // 1. User의 tenantId (BaseEntity에서 상속)
        if (user.getTenantId() != null && !user.getTenantId().trim().isEmpty()) {
            tenantIds.add(user.getTenantId());
        }
        
        // 3. RefreshToken에서 사용자가 접근한 모든 테넌트 조회
        List<RefreshToken> refreshTokens = refreshTokenRepository.findActiveTokensByUserId(userId, LocalDateTime.now());
        for (RefreshToken token : refreshTokens) {
            if (token.getTenantId() != null) {
                tenantIds.add(token.getTenantId());
            }
        }
        
        // 4. 사용자가 속한 모든 Branch를 통해 테넌트 조회 (향후 확장 가능)
        // 현재는 User가 하나의 Branch에만 속하지만, 추후 여러 Branch에 속할 수 있음
        
        // 5. tenantIds로 Tenant 목록 조회
        List<Tenant> tenants = new ArrayList<>();
        for (String tenantId : tenantIds) {
            tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .ifPresent(tenants::add);
        }
        
        log.info("✅ 사용자가 접근 가능한 테넌트 목록: userId={}, email={}, tenantCount={}", 
            userId, EmailLogMasking.maskForLog(user.getEmail()), tenants.size());
        return tenants;
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isMultiTenantUser(Long userId) {
        List<Tenant> tenants = getAccessibleTenants(userId);
        boolean isMultiTenant = tenants.size() > 1;
        log.debug("멀티 테넌트 사용자 확인: userId={}, isMultiTenant={}, tenantCount={}", 
            userId, isMultiTenant, tenants.size());
        return isMultiTenant;
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean hasAccessToTenant(Long userId, String tenantId) {
        List<Tenant> tenants = getAccessibleTenants(userId);
        boolean hasAccess = tenants.stream()
            .anyMatch(t -> t.getTenantId().equals(tenantId));
        log.debug("테넌트 접근 권한 확인: userId={}, tenantId={}, hasAccess={}", 
            userId, tenantId, hasAccess);
        return hasAccess;
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean hasAccessToTenantByEmail(String email, String tenantId) {
        if (email == null || email.trim().isEmpty() || tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("이메일 또는 테넌트 ID가 비어있어 권한 확인 불가: email={}, tenantId={}", EmailLogMasking.maskForLog(email), tenantId);
            return false;
        }
        
        // 특정 테넌트의 해당 이메일 사용자만 조회
        java.util.Optional<User> userOpt = userRepository.findByTenantIdAndEmail(tenantId, email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            log.debug("해당 테넌트에 사용자를 찾을 수 없음: email={}, tenantId={}", EmailLogMasking.maskForLog(email), tenantId);
            return false;
        }
        
        User user = userOpt.get();
        if (user.getIsDeleted() != null && user.getIsDeleted()) {
            return false;
        }
        
        boolean hasAccess = false;
        if (user.getTenantId() != null && user.getTenantId().equals(tenantId)) {
            hasAccess = true;
        }
        // PR-A(2026-06-13): User.branch @ManyToOne 제거 후 branch.tenantId 폴백 경로 삭제.
        
        log.info("테넌트 접근 권한 확인 (단일 테넌트 이메일 기반): email={}, tenantId={}, hasAccess={}", 
            EmailLogMasking.maskForLog(email), tenantId, hasAccess);
        return hasAccess;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Tenant> getAccessibleTenantsByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            log.warn("이메일이 비어있어 테넌트 목록 조회 불가: email={}", EmailLogMasking.maskForLog(email));
            return new ArrayList<>();
        }
        
        log.debug("이메일로 접근 가능한 테넌트 목록 조회: email={}", EmailLogMasking.maskForLog(email));
        
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || currentTenantId.trim().isEmpty()) {
            log.warn("현재 테넌트 컨텍스트가 없어 조회 불가: email={}", EmailLogMasking.maskForLog(email));
            return new ArrayList<>();
        }
        
        // 현재 테넌트의 해당 이메일 사용자만 조회
        java.util.Optional<User> userOpt = userRepository.findByTenantIdAndEmail(currentTenantId, email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            log.debug("해당 테넌트에 사용자를 찾을 수 없음: email={}, tenantId={}", EmailLogMasking.maskForLog(email), currentTenantId);
            return new ArrayList<>();
        }
        
        User user = userOpt.get();
        if (user.getIsDeleted() != null && user.getIsDeleted()) {
            return new ArrayList<>();
        }
        
        Set<String> tenantIds = new HashSet<>();
        // PR-A(2026-06-13): User.branch @ManyToOne 제거 후 branch.tenantId 폴백 경로 삭제.
        if (user.getTenantId() != null && !user.getTenantId().trim().isEmpty()) {
            tenantIds.add(user.getTenantId());
        }
        
        List<Tenant> tenants = new ArrayList<>();
        for (String tenantId : tenantIds) {
            tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .ifPresent(tenants::add);
        }
        
        log.info("✅ 이메일로 접근 가능한 테넌트 목록 (단일 테넌트 기준): email={}, tenantCount={}", 
            EmailLogMasking.maskForLog(email), tenants.size());
        return tenants;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Tenant getCurrentTenant(User user) {
        // PR-A(2026-06-13): User.branch @ManyToOne 제거 후 branch.tenantId 폴백 경로 삭제.
        if (user.getTenantId() != null) {
            return tenantRepository.findByTenantIdAndIsDeletedFalse(user.getTenantId())
                .orElse(null);
        }
        
        return null;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Tenant getDefaultTenant(Long userId) {
        // 1. 가장 최근에 사용한 테넌트 (RefreshToken의 최근 사용 테넌트)
        List<RefreshToken> refreshTokens = refreshTokenRepository.findActiveTokensByUserId(userId, LocalDateTime.now());
        if (!refreshTokens.isEmpty()) {
            // 가장 최근에 생성된 RefreshToken의 테넌트 사용
            RefreshToken latestToken = refreshTokens.stream()
                .max((t1, t2) -> t1.getCreatedAt().compareTo(t2.getCreatedAt()))
                .orElse(null);
            
            if (latestToken != null && latestToken.getTenantId() != null) {
                return tenantRepository.findByTenantIdAndIsDeletedFalse(latestToken.getTenantId())
                    .orElse(null);
            }
        }
        
        // 2. User의 현재 Branch 테넌트 (요청 테넌트 컨텍스트와 일치하는 행만)
        User user = requireUserInCurrentTenant(userId);
        
        Tenant currentTenant = getCurrentTenant(user);
        if (currentTenant != null) {
            return currentTenant;
        }
        
        // 3. 접근 가능한 첫 번째 테넌트
        List<Tenant> tenants = getAccessibleTenants(userId);
        if (!tenants.isEmpty()) {
            return tenants.get(0);
        }
        
        return null;
    }
}

