package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.LegacyRolePermissionRepository;
import com.coresolution.consultation.repository.PermissionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * {@link DynamicPermissionServiceImpl#canRegisterScheduler(UserRole)} 단위 검증.
 *
 * @author CoreSolution
 * @since 2026-05-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DynamicPermissionServiceImpl canRegisterScheduler")
class DynamicPermissionServiceImplCanRegisterSchedulerTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private LegacyRolePermissionRepository rolePermissionRepository;

    @Mock
    private Environment environment;

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @InjectMocks
    private DynamicPermissionServiceImpl dynamicPermissionService;

    @Test
    @DisplayName("ADMIN — true")
    void admin_true() {
        assertTrue(dynamicPermissionService.canRegisterScheduler(UserRole.ADMIN));
    }

    @Test
    @DisplayName("STAFF — true")
    void staff_true() {
        assertTrue(dynamicPermissionService.canRegisterScheduler(UserRole.STAFF));
    }

    @Test
    @DisplayName("CONSULTANT — false (DB 우회 없음)")
    void consultant_false() {
        assertFalse(dynamicPermissionService.canRegisterScheduler(UserRole.CONSULTANT));
    }

    @Test
    @DisplayName("CLIENT — false")
    void client_false() {
        assertFalse(dynamicPermissionService.canRegisterScheduler(UserRole.CLIENT));
    }

    @Test
    @DisplayName("null — false")
    void nullRole_false() {
        assertFalse(dynamicPermissionService.canRegisterScheduler(null));
    }
}
