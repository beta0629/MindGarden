package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.AdminRequestIdempotency;
import com.coresolution.consultation.exception.MappingAlreadyProcessedException;
import com.coresolution.consultation.repository.AdminRequestIdempotencyRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 옵션 B v2.0 — {@link AdminRequestIdempotencyServiceImpl} 단위 테스트.
 *
 * <p>합의서: {@code OPTION_B_RESERVATION_FIRST_PLAN_V2.md} §4·§6 Q11.
 * 매트릭스 추적: §1 케이스 3 (멱등성 가드 동시 호출).
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminRequestIdempotencyServiceImpl — 멱등성 가드")
class AdminRequestIdempotencyServiceImplTest {

    private static final String TENANT_ID = "tenant-idempotency-test";
    private static final String OPERATION = AdminRequestIdempotency.OPERATION_CHECKOUT_SAME_DAY;
    private static final Long MAPPING_ID = 5001L;

    @Mock private AdminRequestIdempotencyRepository repository;

    @InjectMocks private AdminRequestIdempotencyServiceImpl service;

    @Test
    @DisplayName("requestId 신규: reservation 정상 저장 + IN_PROGRESS 결과 status")
    void reserve_newRequestId_savesReservation() {
        when(repository.findByTenantIdAndRequestIdAndOperation(TENANT_ID, "req-001", OPERATION))
                .thenReturn(Optional.empty());
        when(repository.saveAndFlush(any(AdminRequestIdempotency.class)))
                .thenAnswer(inv -> {
                    AdminRequestIdempotency arg = inv.getArgument(0);
                    arg.setId(1L);
                    return arg;
                });

        AdminRequestIdempotency result = service.reserve(TENANT_ID, "req-001", OPERATION, MAPPING_ID);

        assertThat(result).isNotNull();
        assertThat(result.getRequestId()).isEqualTo("req-001");
        assertThat(result.getOperation()).isEqualTo(OPERATION);
        assertThat(result.getMappingId()).isEqualTo(MAPPING_ID);
        assertThat(result.getResultStatus()).isEqualTo("IN_PROGRESS");
        assertThat(result.getExpiresAt()).isNotNull();
        verify(repository, times(1)).saveAndFlush(any(AdminRequestIdempotency.class));
    }

    @Test
    @DisplayName("requestId null: 멱등성 검사 생략 + null 반환 (no-op)")
    void reserve_nullRequestId_returnsNullWithoutSave() {
        AdminRequestIdempotency result = service.reserve(TENANT_ID, null, OPERATION, MAPPING_ID);

        assertThat(result).isNull();
        verify(repository, never()).findByTenantIdAndRequestIdAndOperation(anyString(), anyString(), anyString());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("requestId 빈 문자열: 멱등성 검사 생략 + null 반환")
    void reserve_blankRequestId_returnsNullWithoutSave() {
        AdminRequestIdempotency result = service.reserve(TENANT_ID, "   ", OPERATION, MAPPING_ID);

        assertThat(result).isNull();
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("requestId 재사용 (조회 적중): MappingAlreadyProcessedException(DUPLICATE_REQUEST_ID) 차단")
    void reserve_existingRequestId_throwsDuplicateRequestException() {
        AdminRequestIdempotency existing = AdminRequestIdempotency.builder()
                .tenantId(TENANT_ID).requestId("req-dup").operation(OPERATION)
                .mappingId(MAPPING_ID).resultStatus("SUCCESS").build();
        when(repository.findByTenantIdAndRequestIdAndOperation(TENANT_ID, "req-dup", OPERATION))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.reserve(TENANT_ID, "req-dup", OPERATION, MAPPING_ID))
                .isInstanceOf(MappingAlreadyProcessedException.class)
                .extracting(ex -> ((MappingAlreadyProcessedException) ex).getReason())
                .isEqualTo(MappingAlreadyProcessedException.Reason.DUPLICATE_REQUEST_ID);

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("동시 race-condition (UNIQUE 위반): MappingAlreadyProcessedException 차단")
    void reserve_uniqueConstraintRace_throwsDuplicateRequestException() {
        when(repository.findByTenantIdAndRequestIdAndOperation(TENANT_ID, "req-race", OPERATION))
                .thenReturn(Optional.empty());
        when(repository.saveAndFlush(any(AdminRequestIdempotency.class)))
                .thenThrow(new DataIntegrityViolationException(
                        "Duplicate entry for key 'uk_admin_request_idempotency_tenant_request'"));

        assertThatThrownBy(() -> service.reserve(TENANT_ID, "req-race", OPERATION, MAPPING_ID))
                .isInstanceOf(MappingAlreadyProcessedException.class)
                .extracting(ex -> ((MappingAlreadyProcessedException) ex).getReason())
                .isEqualTo(MappingAlreadyProcessedException.Reason.DUPLICATE_REQUEST_ID);
    }

    @Test
    @DisplayName("tenantId 누락: IllegalStateException")
    void reserve_blankTenantId_throwsIllegalStateException() {
        assertThatThrownBy(() -> service.reserve("", "req-001", OPERATION, MAPPING_ID))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> service.reserve(null, "req-001", OPERATION, MAPPING_ID))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("operation 누락: IllegalArgumentException")
    void reserve_blankOperation_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> service.reserve(TENANT_ID, "req-001", "", MAPPING_ID))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.reserve(TENANT_ID, "req-001", null, MAPPING_ID))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("markResult: reservation null 이면 no-op (예외 없음)")
    void markResult_nullReservation_isNoOp() {
        service.markResult(null, "SUCCESS");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("markResult: 결과 status 갱신 후 save 호출")
    void markResult_updatesResultStatus() {
        AdminRequestIdempotency reservation = AdminRequestIdempotency.builder()
                .tenantId(TENANT_ID).requestId("req-001").operation(OPERATION)
                .mappingId(MAPPING_ID).resultStatus("IN_PROGRESS").build();
        reservation.setId(42L);

        service.markResult(reservation, "SUCCESS");

        assertThat(reservation.getResultStatus()).isEqualTo("SUCCESS");
        verify(repository, times(1)).save(reservation);
    }
}
