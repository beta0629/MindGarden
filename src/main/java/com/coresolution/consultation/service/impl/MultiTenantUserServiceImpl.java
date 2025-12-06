package com.coresolution.consultation.service.impl;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.RefreshTokenRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MultiTenantUserService;
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
    
    @Override
    @Transactional(readOnly = true)
    public List<Tenant> getAccessibleTenants(Long userId) {
        log.debug("사용자가 접근 가능한 테넌트 목록 조회: userId={}", userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));
        
        Set<String> tenantIds = new HashSet<>();
        
        // 멀티 테넌트 지원: 같은 이메일의 모든 User를 조회하여 모든 테넌트 접근 권한 확인
        // 같은 이메일로 여러 테넌트에 계정이 있을 수 있음 (예: 테넌트 A에 ADMIN, 테넌트 B에 CLIENT)
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            List<User> allUsers = userRepository.findAllByEmail(user.getEmail());
            log.debug("멀티 테넌트 사용자 확인: email={}, userCount={}", user.getEmail(), allUsers.size());
            
            for (User u : allUsers) {
                // 삭제되지 않은 사용자만 확인
                if (u.getIsDeleted() != null && u.getIsDeleted()) {
                    continue;
                }
                
                // 1. User의 Branch를 통해 테넌트 조회
                if (u.getBranch() != null && u.getBranch().getTenantId() != null) {
                    tenantIds.add(u.getBranch().getTenantId());
                }
                
                // 2. User의 tenantId (BaseEntity에서 상속)
                if (u.getTenantId() != null && !u.getTenantId().trim().isEmpty()) {
                    tenantIds.add(u.getTenantId());
                }
            }
        } else {
            // 이메일이 없는 경우 기존 로직 사용 (레거시 호환)
            // 1. User의 Branch를 통해 현재 테넌트 조회
            if (user.getBranch() != null && user.getBranch().getTenantId() != null) {
                tenantIds.add(user.getBranch().getTenantId());
            }
            
            // 2. User의 tenantId (BaseEntity에서 상속)
            if (user.getTenantId() != null) {
                tenantIds.add(user.getTenantId());
            }
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
            userId, user.getEmail(), tenants.size());
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
        if (email == null || email.trim().isEmpty()) {
            log.warn("이메일이 비어있어 테넌트 접근 권한 확인 불가: email={}, tenantId={}", email, tenantId);
            return false;
        }
        
        // 로그인 이메일로 모든 테넌트의 User 조회
        List<User> users = userRepository.findAllByEmail(email.trim().toLowerCase());
        if (users == null || users.isEmpty()) {
            log.debug("사용자를 찾을 수 없음: email={}, tenantId={}", email, tenantId);
            return false;
        }
        
        // 해당 테넌트에 삭제되지 않은 사용자 계정이 있는지 확인
        boolean hasAccess = users.stream()
            .anyMatch(user -> {
                if (user.getIsDeleted() != null && user.getIsDeleted()) {
                    return false;
                }
                
                // User의 tenantId 확인
                if (user.getTenantId() != null && user.getTenantId().equals(tenantId)) {
                    return true;
                }
                
                // User의 Branch를 통한 테넌트 확인
                if (user.getBranch() != null && user.getBranch().getTenantId() != null 
                    && user.getBranch().getTenantId().equals(tenantId)) {
                    return true;
                }
                
                return false;
            });
        
        log.info("테넌트 접근 권한 확인 (이메일 기반): email={}, tenantId={}, hasAccess={}", 
            email, tenantId, hasAccess);
        return hasAccess;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Tenant> getAccessibleTenantsByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            log.warn("이메일이 비어있어 테넌트 목록 조회 불가: email={}", email);
            return new ArrayList<>();
        }
        
        log.debug("이메일로 접근 가능한 테넌트 목록 조회: email={}", email);
        
        // 로그인 이메일로 모든 테넌트의 User 조회
        List<User> users = userRepository.findAllByEmail(email.trim().toLowerCase());
        if (users == null || users.isEmpty()) {
            log.debug("사용자를 찾을 수 없음: email={}", email);
            return new ArrayList<>();
        }
        
        Set<String> tenantIds = new HashSet<>();
        
        for (User user : users) {
            // 삭제되지 않은 사용자만 확인
            if (user.getIsDeleted() != null && user.getIsDeleted()) {
                continue;
            }
            
            // 1. User의 Branch를 통해 테넌트 조회
            if (user.getBranch() != null && user.getBranch().getTenantId() != null) {
                tenantIds.add(user.getBranch().getTenantId());
            }
            
            // 2. User의 tenantId (BaseEntity에서 상속)
            if (user.getTenantId() != null && !user.getTenantId().trim().isEmpty()) {
                tenantIds.add(user.getTenantId());
            }
        }
        
        // tenantIds로 Tenant 목록 조회
        List<Tenant> tenants = new ArrayList<>();
        for (String tenantId : tenantIds) {
            tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .ifPresent(tenants::add);
        }
        
        log.info("✅ 이메일로 접근 가능한 테넌트 목록: email={}, tenantCount={}", 
            email, tenants.size());
        return tenants;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Tenant getCurrentTenant(User user) {
        if (user.getBranch() != null && user.getBranch().getTenantId() != null) {
            return tenantRepository.findByTenantIdAndIsDeletedFalse(user.getBranch().getTenantId())
                .orElse(null);
        }
        
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
        
        // 2. User의 현재 Branch 테넌트
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));
        
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

