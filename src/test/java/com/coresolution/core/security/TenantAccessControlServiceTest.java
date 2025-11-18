package com.coresolution.core.security;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * 테넌트 접근 제어 서비스 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
class TenantAccessControlServiceTest {
    
    private TenantAccessControlService accessControlService;
    
    @BeforeEach
    void setUp() {
        accessControlService = new TenantAccessControlService();
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
    }
    
    @Test
    void testValidateTenantAccess_Success() {
        // Given
        String tenantId = "test-tenant-1";
        try (MockedStatic<TenantContextHolder> mockedTenantContext = mockStatic(TenantContextHolder.class)) {
            mockedTenantContext.when(TenantContextHolder::getTenantId).thenReturn(tenantId);
            
            // When & Then
            assertDoesNotThrow(() -> accessControlService.validateTenantAccess(tenantId));
        }
    }
    
    @Test
    void testValidateTenantAccess_DifferentTenant() {
        // Given
        String currentTenantId = "test-tenant-1";
        String requestedTenantId = "test-tenant-2";
        try (MockedStatic<TenantContextHolder> mockedTenantContext = mockStatic(TenantContextHolder.class)) {
            mockedTenantContext.when(TenantContextHolder::getTenantId).thenReturn(currentTenantId);
            
            // When & Then
            assertThrows(AccessDeniedException.class, 
                    () -> accessControlService.validateTenantAccess(requestedTenantId));
        }
    }
    
    @Test
    void testValidateTenantAccess_NoTenantContext() {
        // Given
        String tenantId = "test-tenant-1";
        try (MockedStatic<TenantContextHolder> mockedTenantContext = mockStatic(TenantContextHolder.class)) {
            mockedTenantContext.when(TenantContextHolder::getTenantId).thenReturn(null);
            
            // When & Then
            assertThrows(IllegalStateException.class, 
                    () -> accessControlService.validateTenantAccess(tenantId));
        }
    }
    
    @Test
    void testValidateTenantAccess_OpsRole() {
        // Given
        String tenantId = "test-tenant-1";
        setupOpsRole();
        
        // When & Then
        assertDoesNotThrow(() -> accessControlService.validateTenantAccess(tenantId));
    }
    
    @Test
    void testValidateConfigurationAccess_Success() {
        // Given
        String tenantId = "test-tenant-1";
        TenantPgConfiguration configuration = createTestConfiguration(tenantId);
        try (MockedStatic<TenantContextHolder> mockedTenantContext = mockStatic(TenantContextHolder.class)) {
            mockedTenantContext.when(TenantContextHolder::getTenantId).thenReturn(tenantId);
            
            // When & Then
            assertDoesNotThrow(() -> accessControlService.validateConfigurationAccess(configuration, tenantId));
        }
    }
    
    @Test
    void testValidateConfigurationAccess_DifferentTenant() {
        // Given
        String currentTenantId = "test-tenant-1";
        String configTenantId = "test-tenant-2";
        TenantPgConfiguration configuration = createTestConfiguration(configTenantId);
        try (MockedStatic<TenantContextHolder> mockedTenantContext = mockStatic(TenantContextHolder.class)) {
            mockedTenantContext.when(TenantContextHolder::getTenantId).thenReturn(currentTenantId);
            
            // When & Then
            assertThrows(AccessDeniedException.class, 
                    () -> accessControlService.validateConfigurationAccess(configuration, currentTenantId));
        }
    }
    
    @Test
    void testValidateOpsAccess_Success() {
        // Given
        setupOpsRole();
        
        // When & Then
        assertDoesNotThrow(() -> accessControlService.validateOpsAccess());
    }
    
    @Test
    void testValidateOpsAccess_NoRole() {
        // Given
        setupRegularUser();
        
        // When & Then
        assertThrows(AccessDeniedException.class, 
                () -> accessControlService.validateOpsAccess());
    }
    
    @Test
    void testHasOpsRole_Admin() {
        // Given
        setupAdminRole();
        
        // When & Then
        assertTrue(accessControlService.hasOpsRole());
    }
    
    @Test
    void testHasOpsRole_Ops() {
        // Given
        setupOpsRole();
        
        // When & Then
        assertTrue(accessControlService.hasOpsRole());
    }
    
    @Test
    void testHasOpsRole_RegularUser() {
        // Given
        setupRegularUser();
        
        // When & Then
        assertFalse(accessControlService.hasOpsRole());
    }
    
    @Test
    void testGetCurrentUserId() {
        // Given
        String username = "test-user";
        setupRegularUser(username);
        
        // When
        String currentUserId = accessControlService.getCurrentUserId();
        
        // Then
        assertEquals(username, currentUserId);
    }
    
    @Test
    void testGetCurrentTenantId() {
        // Given
        String tenantId = "test-tenant-1";
        try (MockedStatic<TenantContextHolder> mockedTenantContext = mockStatic(TenantContextHolder.class)) {
            mockedTenantContext.when(TenantContextHolder::getTenantId).thenReturn(tenantId);
            
            // When
            String currentTenantId = accessControlService.getCurrentTenantId();
            
            // Then
            assertEquals(tenantId, currentTenantId);
        }
    }
    
    // ==================== Helper Methods ====================
    
    private void setupOpsRole() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                "ops-user",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_OPS"))
        );
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
    
    private void setupAdminRole() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                "admin-user",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
    
    private void setupRegularUser() {
        setupRegularUser("regular-user");
    }
    
    private void setupRegularUser(String username) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                username,
                "password",
                Collections.emptyList()
        );
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
    
    private TenantPgConfiguration createTestConfiguration(String tenantId) {
        return TenantPgConfiguration.builder()
                .configId("test-config-1")
                .tenantId(tenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("테스트 PG")
                .apiKeyEncrypted("encrypted-api-key")
                .secretKeyEncrypted("encrypted-secret-key")
                .status(PgConfigurationStatus.PENDING)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();
    }
}

