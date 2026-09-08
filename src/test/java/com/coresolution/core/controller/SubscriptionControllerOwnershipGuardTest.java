package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;

import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.billing.SubscriptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link SubscriptionController} 테넌트 소유권 가드 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SubscriptionController — 테넌트 소유권 fail-closed")
class SubscriptionControllerOwnershipGuardTest {

    @Mock
    private SubscriptionService subscriptionService;

    @Mock
    private TenantAccessControlService tenantAccessControlService;

    @InjectMocks
    private SubscriptionController controller;

    @Test
    @DisplayName("교차 테넌트 path tenantId → AccessDeniedException, 서비스 미호출")
    void getSubscriptionByTenant_crossTenant_throws() {
        doThrow(new AccessDeniedException("해당 테넌트에 대한 접근 권한이 없습니다"))
                .when(tenantAccessControlService).validateTenantAccess("other-tenant");

        assertThatThrownBy(() -> controller.getSubscriptionByTenant("other-tenant"))
                .isInstanceOf(AccessDeniedException.class);

        verify(subscriptionService, never()).getSubscriptionByTenant("other-tenant");
    }
}
