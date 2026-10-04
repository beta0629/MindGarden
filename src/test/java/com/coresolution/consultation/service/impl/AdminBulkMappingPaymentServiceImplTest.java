package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.admin.AdminBulkMappingConstants;
import com.coresolution.consultation.dto.admin.BulkMappingPaymentResult;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.exception.MappingAlreadyProcessedException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link AdminBulkMappingPaymentServiceImpl} — 사전 검증 전부 아니면 전무, 동시 처리분 건너뜀, 실패 시 중단, 금액 규칙.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminBulkMappingPaymentServiceImpl — 일괄 결제 확인·취소")
class AdminBulkMappingPaymentServiceImplTest {

    private static final String TENANT_ID = "tenant-bulk-pay-unit";

    @Mock private AdminService adminService;
    @Mock private ConsultantClientMappingRepository mappingRepository;

    @InjectMocks private AdminBulkMappingPaymentServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private void givenMapping(long id, MappingStatus status, Long packagePrice) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setStatus(status);
        mapping.setPackagePrice(packagePrice);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, id)).thenReturn(Optional.of(mapping));
    }

    @Test
    @DisplayName("취소 — 종료·취소된 매칭이 하나라도 있으면 409, 아무것도 처리 안 함")
    void cancel_closedMappingInBatch_conflictNothingProcessed() {
        givenMapping(1L, MappingStatus.ACTIVE, 100_000L);
        givenMapping(2L, MappingStatus.TERMINATED, 100_000L);
        assertThatThrownBy(() -> service.cancelMappings(List.of(1L, 2L), "r"))
                .isInstanceOf(MappingAlreadyProcessedException.class)
                .extracting("reason").isEqualTo(MappingAlreadyProcessedException.Reason.ALREADY_CLOSED);
        verify(adminService, never()).terminateMapping(anyLong(), any());
    }

    @Test
    @DisplayName("취소 — 쇼핑 주문(PG) 결제 매칭이 섞이면 409, PG 환불 경로로 보내지 않고 아무것도 처리 안 함")
    void cancel_shopOrderMapping_conflictNothingProcessed() {
        givenMapping(1L, MappingStatus.ACTIVE, 100_000L);
        givenMapping(2L, MappingStatus.ACTIVE, 100_000L);
        when(adminService.requiresShopOrderRefund(2L)).thenReturn(true);
        assertThatThrownBy(() -> service.cancelMappings(List.of(1L, 2L), "r"))
                .isInstanceOf(MappingAlreadyProcessedException.class)
                .extracting("reason")
                .isEqualTo(MappingAlreadyProcessedException.Reason.SHOP_ORDER_REFUND_REQUIRED);
        verify(adminService, never()).terminateMapping(anyLong(), any());
    }

    @Test
    @DisplayName("취소 — 없는 id 는 사전 검증에서 거부, 아무것도 처리 안 함")
    void cancel_missingMapping_nothingProcessed() {
        givenMapping(1L, MappingStatus.ACTIVE, 100_000L);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, 9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.cancelMappings(List.of(1L, 9L), "r"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(adminService, never()).terminateMapping(anyLong(), any());
    }

    @Test
    @DisplayName("취소 — 사전 검증 뒤 다른 요청이 먼저 종료한 매칭(409)은 건너뛰고 재환불하지 않음")
    void cancel_concurrentlyClosed_skipped() {
        givenMapping(1L, MappingStatus.ACTIVE, 100_000L);
        givenMapping(2L, MappingStatus.ACTIVE, 100_000L);
        doThrow(new MappingAlreadyProcessedException(1L, null,
                MappingAlreadyProcessedException.Reason.ALREADY_CLOSED, "closed"))
                .when(adminService).terminateMapping(eq(1L), any());
        BulkMappingPaymentResult result = service.cancelMappings(List.of(1L, 2L), "r");
        assertThat(result.isCompleted()).isTrue();
        assertThat(result.getSkippedMappingIds()).containsExactly(1L);
        assertThat(result.getProcessedMappingIds()).containsExactly(2L);
    }

    @Test
    @DisplayName("취소 — 처리 중 다른 실패면 그 매칭부터 중단하고 남은 매칭은 처리하지 않음")
    void cancel_unexpectedFailure_stops() {
        givenMapping(1L, MappingStatus.ACTIVE, 100_000L);
        givenMapping(2L, MappingStatus.ACTIVE, 100_000L);
        givenMapping(3L, MappingStatus.ACTIVE, 100_000L);
        doThrow(new IllegalStateException("db")).when(adminService).terminateMapping(eq(2L), any());
        BulkMappingPaymentResult result = service.cancelMappings(List.of(1L, 2L, 3L), "r");
        assertThat(result.isCompleted()).isFalse();
        assertThat(result.getProcessedMappingIds()).containsExactly(1L);
        assertThat(result.getFailedMappingId()).isEqualTo(2L);
        assertThat(result.getNotProcessedMappingIds()).containsExactly(3L);
        verify(adminService, never()).terminateMapping(eq(3L), any());
    }

    @Test
    @DisplayName("확인 — 결제 수단 없음·금액 형식 오류는 400, 아무것도 처리 안 함")
    void confirm_invalidInput_rejected() {
        givenMapping(1L, MappingStatus.PENDING_PAYMENT, 100_000L);
        assertThatThrownBy(() -> service.confirmMappings(List.of(1L), " ", 100_000))
                .isInstanceOf(IllegalArgumentException.class);
        for (Object amount : new Object[] {null, 0, -1, 1.5, "abc", "1e5", true, "-100"}) {
            assertThatThrownBy(() -> service.confirmMappings(List.of(1L), "CARD", amount)).as(String.valueOf(amount))
                    .isInstanceOf(IllegalArgumentException.class);
        }
        verify(adminService, never()).confirmPendingPayment(anyLong(), anyString(), anyString(), any());
    }

    @Test
    @DisplayName("확인 — 결제 대기가 아닌 매칭이 하나라도 있으면 409, 아무것도 처리 안 함")
    void confirm_notPending_conflictNothingProcessed() {
        givenMapping(1L, MappingStatus.PENDING_PAYMENT, 100_000L);
        givenMapping(2L, MappingStatus.PAYMENT_CONFIRMED, 100_000L);
        assertThatThrownBy(() -> service.confirmMappings(List.of(1L, 2L), "CARD", 200_000))
                .isInstanceOf(MappingAlreadyProcessedException.class);
        verify(adminService, never()).confirmPendingPayment(anyLong(), anyString(), anyString(), any());
    }

    @Test
    @DisplayName("확인 — 1건은 요청 금액, 여러 건은 각 패키지 금액(합계 일치 시만), 숫자 문자열 금액 허용")
    void confirm_amountRules() {
        givenMapping(1L, MappingStatus.PENDING_PAYMENT, 100_000L);
        givenMapping(2L, MappingStatus.PENDING_PAYMENT, 50_000L);

        service.confirmMappings(List.of(1L), "CARD", 90_000);
        verify(adminService).confirmPendingPayment(eq(1L), eq("CARD"), anyString(), eq(90_000L));

        BulkMappingPaymentResult result = service.confirmMappings(List.of(1L, 2L), "BANK_TRANSFER", "150000");
        assertThat(result.getProcessedMappingIds()).containsExactly(1L, 2L);
        verify(adminService).confirmPendingPayment(eq(1L), eq("BANK_TRANSFER"), anyString(), eq(100_000L));
        verify(adminService).confirmPendingPayment(eq(2L), eq("BANK_TRANSFER"), anyString(), eq(50_000L));
    }

    @Test
    @DisplayName("확인 — 여러 건 합계 불일치·패키지 금액 없음은 400, 아무것도 처리 안 함")
    void confirm_sumMismatch_rejected() {
        givenMapping(1L, MappingStatus.PENDING_PAYMENT, 100_000L);
        givenMapping(2L, MappingStatus.PENDING_PAYMENT, 50_000L);
        givenMapping(3L, MappingStatus.PENDING_PAYMENT, null);
        assertThatThrownBy(() -> service.confirmMappings(List.of(1L, 2L), "CARD", 100_000))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.confirmMappings(List.of(1L, 3L), "CARD", 100_000))
                .isInstanceOf(IllegalArgumentException.class);
        verify(adminService, never()).confirmPendingPayment(anyLong(), anyString(), anyString(), any());
    }

    @Test
    @DisplayName("확인 — 결제 참조는 공통 접두어 + 요청 단위 값, 모든 매칭에 같은 참조")
    void confirm_paymentReferencePrefix() {
        givenMapping(1L, MappingStatus.PENDING_PAYMENT, 100_000L);
        givenMapping(2L, MappingStatus.PENDING_PAYMENT, 50_000L);
        org.mockito.ArgumentCaptor<String> refs = org.mockito.ArgumentCaptor.forClass(String.class);
        service.confirmMappings(List.of(1L, 2L), "CARD", 150_000L);
        verify(adminService, org.mockito.Mockito.times(2))
                .confirmPendingPayment(anyLong(), eq("CARD"), refs.capture(), any());
        assertThat(refs.getAllValues()).allMatch(
                r -> r.startsWith(AdminBulkMappingConstants.BULK_CONFIRM_PAYMENT_REFERENCE_PREFIX));
        assertThat(refs.getAllValues().get(0)).isEqualTo(refs.getAllValues().get(1));
    }
}
