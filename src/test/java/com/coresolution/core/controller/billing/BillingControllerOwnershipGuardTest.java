package com.coresolution.core.controller.billing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.controller.dto.billing.PaymentMethodCreateRequest;
import com.coresolution.core.controller.dto.billing.PaymentMethodResponse;
import com.coresolution.core.controller.dto.billing.SubscriptionCreateRequest;
import com.coresolution.core.controller.dto.billing.SubscriptionResponse;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.billing.PaymentMethodService;
import com.coresolution.core.service.billing.SubscriptionService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link BillingController} 테넌트 소유권 가드 회귀 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BillingController — 테넌트 소유권 fail-closed")
class BillingControllerOwnershipGuardTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";
    private static final String PM_ID = "pm-1";
    private static final String SUB_ID = "sub-1";

    @Mock
    private PaymentMethodService paymentMethodService;

    @Mock
    private SubscriptionService subscriptionService;

    @Mock
    private TenantAccessControlService tenantAccessControlService;

    @InjectMocks
    private BillingController controller;

    @Test
    @DisplayName("결제 수단 목록 — 교차 테넌트 tenantId 는 AccessDeniedException, 서비스 미호출")
    void getPaymentMethods_crossTenant_throwsAccessDenied() {
        doThrow(new AccessDeniedException("해당 테넌트에 대한 접근 권한이 없습니다"))
                .when(tenantAccessControlService).validateTenantAccess(TENANT_B);

        assertThatThrownBy(() -> controller.getPaymentMethods(TENANT_B))
                .isInstanceOf(AccessDeniedException.class);

        verify(paymentMethodService, never()).getPaymentMethodsByTenant(anyString());
    }

    @Test
    @DisplayName("구독 생성 — 교차 테넌트 body.tenantId 는 AccessDeniedException")
    void createSubscription_crossTenant_throwsAccessDenied() {
        doThrow(new AccessDeniedException("해당 테넌트에 대한 접근 권한이 없습니다"))
                .when(tenantAccessControlService).validateTenantAccess(TENANT_B);

        SubscriptionCreateRequest request =
                new SubscriptionCreateRequest(TENANT_B, "plan-1", PM_ID, "MONTHLY", true);

        assertThatThrownBy(() -> controller.createSubscription(request))
                .isInstanceOf(AccessDeniedException.class);

        verify(subscriptionService, never()).createSubscription(any());
    }

    @Test
    @DisplayName("구독 ID 조회 — 엔티티 tenantId 로 validateTenantAccess 호출")
    void getSubscription_validatesEntityTenant() {
        when(subscriptionService.getSubscription(SUB_ID)).thenReturn(subscriptionOf(TENANT_A));

        ResponseEntity<ApiResponse<SubscriptionResponse>> response = controller.getSubscription(SUB_ID);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(tenantAccessControlService).validateTenantAccess(TENANT_A);
    }

    @Test
    @DisplayName("기본 결제 수단 설정 — 요청 tenantId 검증 후 서비스 호출")
    void setDefaultPaymentMethod_validatesThenDelegates() {
        when(paymentMethodService.setDefaultPaymentMethod(PM_ID, TENANT_A))
                .thenReturn(paymentMethodOf(TENANT_A));

        ResponseEntity<ApiResponse<PaymentMethodResponse>> response =
                controller.setDefaultPaymentMethod(PM_ID, TENANT_A);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(tenantAccessControlService).validateTenantAccess(TENANT_A);
        verify(paymentMethodService).setDefaultPaymentMethod(PM_ID, TENANT_A);
    }

    @Test
    @DisplayName("결제 수단 생성 — tenantId 누락 시 IllegalArgumentException")
    void createPaymentMethod_missingTenantId_throws() {
        PaymentMethodCreateRequest request = new PaymentMethodCreateRequest(
                "tok", "TOSS", null, null, null, null, null, null);

        assertThatThrownBy(() -> controller.createPaymentMethod(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");

        verify(paymentMethodService, never()).createPaymentMethod(any());
    }

    @Test
    @DisplayName("동일 테넌트 결제 수단 목록 — 200 OK")
    void getPaymentMethods_sameTenant_ok() {
        when(paymentMethodService.getPaymentMethodsByTenant(TENANT_A))
                .thenReturn(List.of(paymentMethodOf(TENANT_A)));

        ResponseEntity<ApiResponse<List<PaymentMethodResponse>>> response =
                controller.getPaymentMethods(TENANT_A);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(tenantAccessControlService).validateTenantAccess(TENANT_A);
    }

    private PaymentMethodResponse paymentMethodOf(String tenantId) {
        return new PaymentMethodResponse(
                PM_ID, tenantId, "TOSS", "VISA", "4242", 12, 2030, "Holder", true, LocalDateTime.now());
    }

    private SubscriptionResponse subscriptionOf(String tenantId) {
        return new SubscriptionResponse(
                SUB_ID, tenantId, "plan-1", "ACTIVE",
                LocalDate.now(), null, "MONTHLY", PM_ID, true, LocalDate.now().plusMonths(1),
                LocalDateTime.now(), LocalDateTime.now());
    }
}
