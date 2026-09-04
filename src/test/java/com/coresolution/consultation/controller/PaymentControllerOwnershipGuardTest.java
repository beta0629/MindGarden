package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.PaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.core.dto.ApiResponse;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link PaymentController} 의 결제 단건/목록 조회 가드 회귀 검증.
 *
 * <p>P0 보안 라운드 2 (2026-06-03): SecurityConfig 매트릭스가 {@code authenticated()} 만 가지므로
 * 컨트롤러 메서드 단위 가드가 1차 방어선이다. 본 테스트는 {@code @PreAuthorize} 메타데이터(역할 제한)와는
 * 별개로 컨트롤러가 직접 호출 가능한 소유자 검증(`assertClientOwnsPayment`/`assertClientIsSelf`)이
 * CLIENT 본인 결제만 통과시키는지 확인한다.
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("PaymentController — CLIENT 소유자 검증 가드")
class PaymentControllerOwnershipGuardTest {

    private static final String PAYMENT_PUBLIC_ID = "PAY-OWNERSHIP-0001";
    private static final Long OWNER_USER_ID = 9001L;
    private static final Long OTHER_USER_ID = 9002L;
    private static final Long ADMIN_USER_ID = 9100L;
    private static final Long STAFF_USER_ID = 9200L;
    private static final Long CONSULTANT_USER_ID = 9300L;

    @Mock
    private PaymentService paymentService;

    @Mock
    private DynamicPermissionService dynamicPermissionService;

    @InjectMocks
    private PaymentController controller;

    private MockHttpSession sessionWithUser(User user) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }

    private User buildUser(Long userId, UserRole role) {
        User user = User.builder()
                .userId("uid-" + userId)
                .email("user-" + userId + "@example.com")
                .role(role)
                .build();
        user.setId(userId);
        user.setTenantId("tenant-payment-guard");
        return user;
    }

    private PaymentResponse buildPaymentResponse(Long payerId) {
        return PaymentResponse.builder()
                .id(7001L)
                .paymentId(PAYMENT_PUBLIC_ID)
                .orderId("ORD-OWNERSHIP-0001")
                .status(Payment.PaymentStatus.APPROVED.name())
                .payerId(payerId)
                .recipientId(CONSULTANT_USER_ID)
                .build();
    }

    @Nested
    @DisplayName("getPayment 단건 조회")
    class GetPayment {

        @Test
        @DisplayName("CLIENT 본인 결제는 200 OK + payerId 일치 응답")
        void getPayment_clientOwnsPayment_returns200() {
            MockHttpSession session = sessionWithUser(buildUser(OWNER_USER_ID, UserRole.CLIENT));
            when(paymentService.getPayment(PAYMENT_PUBLIC_ID))
                    .thenReturn(buildPaymentResponse(OWNER_USER_ID));

            ResponseEntity<ApiResponse<PaymentResponse>> response =
                    controller.getPayment(PAYMENT_PUBLIC_ID, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().isSuccess()).isTrue();
            assertThat(response.getBody().getData().getPayerId()).isEqualTo(OWNER_USER_ID);
        }

        @Test
        @DisplayName("CLIENT 타인 결제 호출은 AccessDeniedException 발생")
        void getPayment_clientCallsOthers_throwsAccessDenied() {
            MockHttpSession session = sessionWithUser(buildUser(OTHER_USER_ID, UserRole.CLIENT));
            when(paymentService.getPayment(PAYMENT_PUBLIC_ID))
                    .thenReturn(buildPaymentResponse(OWNER_USER_ID));

            assertThatThrownBy(() -> controller.getPayment(PAYMENT_PUBLIC_ID, session))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("본인 결제 정보");
        }

        @Test
        @DisplayName("ADMIN 호출은 payerId 무관하게 200 OK")
        void getPayment_adminCaller_returns200() {
            MockHttpSession session = sessionWithUser(buildUser(ADMIN_USER_ID, UserRole.ADMIN));
            when(paymentService.getPayment(PAYMENT_PUBLIC_ID))
                    .thenReturn(buildPaymentResponse(OWNER_USER_ID));

            ResponseEntity<ApiResponse<PaymentResponse>> response =
                    controller.getPayment(PAYMENT_PUBLIC_ID, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getData().getPayerId()).isEqualTo(OWNER_USER_ID);
        }

        @Test
        @DisplayName("STAFF 호출은 payerId 무관하게 200 OK")
        void getPayment_staffCaller_returns200() {
            MockHttpSession session = sessionWithUser(buildUser(STAFF_USER_ID, UserRole.STAFF));
            when(paymentService.getPayment(PAYMENT_PUBLIC_ID))
                    .thenReturn(buildPaymentResponse(OWNER_USER_ID));

            ResponseEntity<ApiResponse<PaymentResponse>> response =
                    controller.getPayment(PAYMENT_PUBLIC_ID, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getData()).isNotNull();
        }
    }

    @Nested
    @DisplayName("getPaymentsByPayerId 결제자별 목록 조회")
    class GetPaymentsByPayer {

        private final Pageable pageable = PageRequest.of(0, 20);

        @Test
        @DisplayName("CLIENT 본인 ID 로 호출 시 200 OK + 서비스 위임")
        void listByPayer_clientCallsSelf_delegatesToService() {
            MockHttpSession session = sessionWithUser(buildUser(OWNER_USER_ID, UserRole.CLIENT));
            Page<PaymentResponse> page = new PageImpl<>(java.util.List.of(buildPaymentResponse(OWNER_USER_ID)));
            when(paymentService.getPaymentsByPayerId(OWNER_USER_ID, pageable)).thenReturn(page);

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.getPaymentsByPayerId(OWNER_USER_ID, pageable, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getData()).containsEntry("totalElements", 1L);
            verify(paymentService).getPaymentsByPayerId(OWNER_USER_ID, pageable);
        }

        @Test
        @DisplayName("CLIENT 타인 payerId 호출은 AccessDeniedException — 서비스 미호출")
        void listByPayer_clientCallsOthers_throwsAccessDenied() {
            MockHttpSession session = sessionWithUser(buildUser(OWNER_USER_ID, UserRole.CLIENT));

            assertThatThrownBy(() -> controller.getPaymentsByPayerId(OTHER_USER_ID, pageable, session))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("본인 결제 정보");
            verify(paymentService, never()).getPaymentsByPayerId(any(), any());
        }

        @Test
        @DisplayName("ADMIN 호출은 임의의 payerId 로 정상 위임")
        void listByPayer_adminCaller_delegatesToService() {
            MockHttpSession session = sessionWithUser(buildUser(ADMIN_USER_ID, UserRole.ADMIN));
            when(paymentService.getPaymentsByPayerId(OWNER_USER_ID, pageable))
                    .thenReturn(new PageImpl<>(java.util.List.of(buildPaymentResponse(OWNER_USER_ID))));

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.getPaymentsByPayerId(OWNER_USER_ID, pageable, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(paymentService).getPaymentsByPayerId(OWNER_USER_ID, pageable);
        }
    }
}
