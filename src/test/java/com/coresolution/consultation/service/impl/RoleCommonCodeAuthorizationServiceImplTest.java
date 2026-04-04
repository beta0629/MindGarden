package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.service.CommonCodeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link RoleCommonCodeAuthorizationServiceImpl} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RoleCommonCodeAuthorizationServiceImpl")
class RoleCommonCodeAuthorizationServiceImplTest {

    @Mock
    private CommonCodeService commonCodeService;

    @InjectMocks
    private RoleCommonCodeAuthorizationServiceImpl roleCommonCodeAuthorizationService;

    @Test
    @DisplayName("ROLE 목록이 비어 있으면 ADMIN enum 폴백으로 true")
    void adminWhenRoleCodesEmpty_usesEnumFallback() {
        when(commonCodeService.getActiveCommonCodesByGroup("ROLE")).thenReturn(Collections.emptyList());

        assertTrue(roleCommonCodeAuthorizationService.isAdminRoleFromCommonCode(UserRole.ADMIN));
    }

    @Test
    @DisplayName("ROLE 목록은 있으나 ADMIN 행 extra가 깨져도 UserRole.ADMIN이면 true")
    void adminWhenDbRowBroken_stillTrueForAdminEnum() {
        CommonCode adminRow = CommonCode.builder()
            .codeGroup("ROLE")
            .codeValue("ADMIN")
            .codeLabel("관리자")
            .koreanName("관리자")
            .extraData("{}")
            .build();
        when(commonCodeService.getActiveCommonCodesByGroup("ROLE")).thenReturn(List.of(adminRow));

        assertTrue(roleCommonCodeAuthorizationService.isAdminRoleFromCommonCode(UserRole.ADMIN));
    }

    @Test
    @DisplayName("ROLE 목록은 있으나 ADMIN 행이 깨져도 CONSULTANT는 false")
    void consultantWhenAdminRowBroken_staysFalse() {
        CommonCode adminRow = CommonCode.builder()
            .codeGroup("ROLE")
            .codeValue("ADMIN")
            .codeLabel("관리자")
            .koreanName("관리자")
            .extraData("{}")
            .build();
        when(commonCodeService.getActiveCommonCodesByGroup("ROLE")).thenReturn(List.of(adminRow));

        assertFalse(roleCommonCodeAuthorizationService.isAdminRoleFromCommonCode(UserRole.CONSULTANT));
    }
}
