package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.SessionRecoveryRequest;
import com.coresolution.consultation.dto.SessionRecoveryResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.scheduler.SessionDeductionRecoveryBatch;
import com.coresolution.consultation.scheduler.SessionDeductionRecoveryBatch.RecoveryResult;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AdminMaintenanceController} 단위 테스트.
 *
 * <p>매트릭스:</p>
 * <ol>
 *   <li>단건 — mappingId 정상 처리 → 200 + processed 반환</li>
 *   <li>단건 — mappingId 매핑 없음 → 404</li>
 *   <li>전체 — all=true → 배치 실행 후 success/skipped/alerted 반환</li>
 *   <li>잘못된 요청 — mappingId 와 all 모두 없음 → 400</li>
 * </ol>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("AdminMaintenanceController — 회기 차감 보정 트리거")
class AdminMaintenanceControllerTest {

    private static final String TENANT_ID = "tenant-maint-1";
    private static final Long MAPPING_ID = 93L;
    private static final Long CONSULTANT_USER_ID = 11L;
    private static final Long CLIENT_USER_ID = 22L;

    @Mock private ScheduleService scheduleService;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private SessionDeductionRecoveryBatch sessionDeductionRecoveryBatch;

    @InjectMocks
    private AdminMaintenanceController controller;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private ConsultantClientMapping mapping() {
        User consultant = new User();
        consultant.setId(CONSULTANT_USER_ID);
        User client = new User();
        client.setId(CLIENT_USER_ID);
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(MAPPING_ID);
        m.setTenantId(TENANT_ID);
        m.setConsultant(consultant);
        m.setClient(client);
        return m;
    }

    @Test
    @DisplayName("단건 — mappingId 정상 처리 → 200 + processed 반환")
    void singleMapping_success() {
        ConsultantClientMapping m = mapping();
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(m));
        when(scheduleService.recoverMissedSessionDeductionsForMapping(eq(m))).thenReturn(2);

        SessionRecoveryRequest request = new SessionRecoveryRequest();
        request.setMappingId(MAPPING_ID);

        ResponseEntity<?> response = controller.recoverSessionDeductions(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        ApiResponse<SessionRecoveryResponse> body = (ApiResponse<SessionRecoveryResponse>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getData()).isNotNull();
        assertThat(body.getData().getProcessed()).isEqualTo(2);
        verify(scheduleService, times(1)).recoverMissedSessionDeductionsForMapping(eq(m));
        verify(sessionDeductionRecoveryBatch, never()).runRecovery();
    }

    @Test
    @DisplayName("단건 — 매핑 없음 → 404")
    void singleMapping_notFound() {
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.empty());

        SessionRecoveryRequest request = new SessionRecoveryRequest();
        request.setMappingId(MAPPING_ID);

        ResponseEntity<?> response = controller.recoverSessionDeductions(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(scheduleService, never()).recoverMissedSessionDeductionsForMapping(any());
    }

    @Test
    @DisplayName("전체 — all=true → 배치 실행 후 결과 반환")
    void all_triggersBatch() {
        when(sessionDeductionRecoveryBatch.runRecovery())
                .thenReturn(new RecoveryResult(10, 7, 1, 2));

        SessionRecoveryRequest request = new SessionRecoveryRequest();
        request.setAll(Boolean.TRUE);

        ResponseEntity<?> response = controller.recoverSessionDeductions(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        ApiResponse<SessionRecoveryResponse> body = (ApiResponse<SessionRecoveryResponse>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getData()).isNotNull();
        assertThat(body.getData().getProcessed()).isEqualTo(7);
        assertThat(body.getData().getSkipped()).isEqualTo(1);
        assertThat(body.getData().getAlerted()).isEqualTo(2);
        verify(scheduleService, never()).recoverMissedSessionDeductionsForMapping(any());
    }

    @Test
    @DisplayName("잘못된 요청 — mappingId 와 all 모두 없음 → 400")
    void invalidRequest_badRequest() {
        SessionRecoveryRequest request = new SessionRecoveryRequest();

        ResponseEntity<?> response = controller.recoverSessionDeductions(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(scheduleService, never()).recoverMissedSessionDeductionsForMapping(any());
        verify(sessionDeductionRecoveryBatch, never()).runRecovery();
    }

    @Test
    @DisplayName("단건 — tenantId 없음 → 400")
    void singleMapping_noTenantContext() {
        TenantContextHolder.clear();
        SessionRecoveryRequest request = new SessionRecoveryRequest();
        request.setMappingId(MAPPING_ID);

        ResponseEntity<?> response = controller.recoverSessionDeductions(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(scheduleService, never()).recoverMissedSessionDeductionsForMapping(any());
    }
}
