package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.MultiTenantUserService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.repository.TenantRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

/**
 * {@link MultiTenantController#switchTenant} 세션 USER_OBJECT 갱신 검증.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MultiTenantController.switchTenant — USER_OBJECT 갱신")
class MultiTenantControllerSwitchTenantTest {

    private static final String USER_EMAIL = "multi@example.com";
    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";

    @Mock
    private MultiTenantUserService multiTenantUserService;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private MultiTenantController controller;

    @Test
    @DisplayName("switchTenant: 대상 테넌트 User로 세션 USER_OBJECT 갱신")
    void switchTenant_refreshesSessionUserObject() {
        User sessionUser = User.builder()
                .userId("uid-a")
                .email(USER_EMAIL)
                .role(UserRole.ADMIN)
                .build();
        sessionUser.setId(101L);
        sessionUser.setTenantId(TENANT_A);

        User tenantBUser = User.builder()
                .userId("uid-b")
                .email(USER_EMAIL)
                .role(UserRole.ADMIN)
                .build();
        tenantBUser.setId(202L);
        tenantBUser.setTenantId(TENANT_B);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, sessionUser);

        when(multiTenantUserService.hasAccessToTenantByEmail(USER_EMAIL, TENANT_B)).thenReturn(true);
        when(userService.findAllUsersMatchingEmailInCurrentTenant(USER_EMAIL)).thenReturn(List.of(tenantBUser));

        Map<String, String> body = new HashMap<>();
        body.put("tenantId", TENANT_B);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.switchTenant(body, session, new MockHttpServletRequest());

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(session.getAttribute(SessionConstants.TENANT_ID)).isEqualTo(TENANT_B);

        User refreshedUser = (User) session.getAttribute(SessionConstants.USER_OBJECT);
        assertThat(refreshedUser).isNotNull();
        assertThat(refreshedUser.getId()).isEqualTo(202L);
        assertThat(refreshedUser.getTenantId()).isEqualTo(TENANT_B);

        verify(userService).findAllUsersMatchingEmailInCurrentTenant(eq(USER_EMAIL));
    }
}
