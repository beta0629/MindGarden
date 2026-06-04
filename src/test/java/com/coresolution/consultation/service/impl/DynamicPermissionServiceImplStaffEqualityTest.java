package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.LegacyRolePermissionRepository;
import com.coresolution.consultation.repository.PermissionRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * {@link DynamicPermissionServiceImpl} STAFF 동등 단락 검증 (1.0.5).
 *
 * <p>STAFF 는 ERP 권한을 제외한 모든 권한 코드에 대해 ADMIN 과 동등하게
 * 단락(short-circuit) 통과해야 한다. ERP 권한 코드는 단락을 적용하지 않고
 * 동적 권한 시스템(DB)으로 떨어져 차단되는 것을 확인한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DynamicPermissionServiceImpl — STAFF == ADMIN 동등 (ERP 제외)")
class DynamicPermissionServiceImplStaffEqualityTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private LegacyRolePermissionRepository rolePermissionRepository;

    @Mock
    private Environment environment;

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @InjectMocks
    private DynamicPermissionServiceImpl service;

    private User staff() {
        User user = new User();
        user.setUserId("staff-equality");
        user.setEmail("staff-equality@example.com");
        user.setName("스태프");
        user.setPassword("encoded-password-1234");
        user.setRole(UserRole.STAFF);
        return user;
    }

    @Test
    @DisplayName("STAFF + MAPPING_MANAGE — true (단락)")
    void staffMappingManage_true() {
        assertThat(service.hasPermission(staff(), "MAPPING_MANAGE")).isTrue();
    }

    @Test
    @DisplayName("STAFF + USER_MANAGE — true (단락)")
    void staffUserManage_true() {
        assertThat(service.hasPermission(staff(), "USER_MANAGE")).isTrue();
    }

    @Test
    @DisplayName("STAFF + SCHEDULE_MANAGE — true (단락)")
    void staffScheduleManage_true() {
        assertThat(service.hasPermission(staff(), "SCHEDULE_MANAGE")).isTrue();
    }

    @Test
    @DisplayName("STAFF + ERP_ACCESS — 단락 미적용, DB 미시드시 false")
    void staffErpAccess_falseWhenNotSeeded() {
        lenient().when(rolePermissionRepository
                .findByRoleNameAndPermissionCodeAndIsActiveTrue(eq("STAFF"), eq("ERP_ACCESS")))
                .thenReturn(Optional.empty());
        lenient().when(rolePermissionRepository.findByRoleNameAndIsActiveTrue(anyString()))
                .thenReturn(java.util.Collections.emptyList());

        assertThat(service.hasPermission(staff(), "ERP_ACCESS")).isFalse();
    }

    @Test
    @DisplayName("STAFF + SALARY_MANAGE — 단락 미적용, DB 미시드시 false")
    void staffSalaryManage_falseWhenNotSeeded() {
        lenient().when(rolePermissionRepository
                .findByRoleNameAndPermissionCodeAndIsActiveTrue(eq("STAFF"), eq("SALARY_MANAGE")))
                .thenReturn(Optional.empty());
        lenient().when(rolePermissionRepository.findByRoleNameAndIsActiveTrue(anyString()))
                .thenReturn(java.util.Collections.emptyList());

        assertThat(service.hasPermission(staff(), "SALARY_MANAGE")).isFalse();
    }

    @Test
    @DisplayName("ADMIN 역할명 + ERP_ACCESS — 단락 통과(회귀)")
    void adminRoleName_erpAccess_true() {
        assertThat(service.hasPermission("ADMIN", "ERP_ACCESS")).isTrue();
    }

    @Test
    @DisplayName("STAFF 역할명 + MAPPING_MANAGE — 단락 통과")
    void staffRoleName_mappingManage_true() {
        assertThat(service.hasPermission("STAFF", "MAPPING_MANAGE")).isTrue();
    }

    @Test
    @DisplayName("STAFF 역할명 + ERP_ACCESS — 단락 미적용, DB 미시드시 false")
    void staffRoleName_erpAccess_falseWhenNotSeeded() {
        lenient().when(rolePermissionRepository
                .findByRoleNameAndPermissionCodeAndIsActiveTrue(eq("STAFF"), eq("ERP_ACCESS")))
                .thenReturn(Optional.empty());
        lenient().when(rolePermissionRepository.findByRoleNameAndIsActiveTrue(anyString()))
                .thenReturn(java.util.Collections.emptyList());

        assertThat(service.hasPermission("STAFF", "ERP_ACCESS")).isFalse();
    }
}
