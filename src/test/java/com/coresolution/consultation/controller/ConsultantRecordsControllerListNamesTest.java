package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ConsultationRecordPersonNameResolver;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.ResponseEntity;

/**
 * 상담사 상담일지 목록도 서버가 clientName·consultantName 을 한 번에 채운다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@DisplayName("상담사 상담일지 목록 표시명")
class ConsultantRecordsControllerListNamesTest {

    private static final Long CONSULTANT_ID = 41L;
    private static final String TENANT_ID = "tenant-consultant-names";

    private ConsultationRecordService recordService;
    private ConsultationRecordPersonNameResolver nameResolver;
    private ConsultantRecordsController controller;
    private HttpSession session;

    @BeforeEach
    void setUp() {
        recordService = mock(ConsultationRecordService.class);
        nameResolver = mock(ConsultationRecordPersonNameResolver.class);
        session = mock(HttpSession.class);
        controller = new ConsultantRecordsController(
            recordService, null, null, null, null, nameResolver, null, null);
    }

    @Test
    @DisplayName("응답 clientName·consultantName 은 일괄 조회 결과이고 행마다 다시 조회하지 않는다")
    void list_usesBatchResolvedNames() {
        ConsultationRecord record = new ConsultationRecord();
        record.setId(7L);
        record.setClientId(500L);
        record.setConsultantId(CONSULTANT_ID);
        record.setSessionDate(LocalDate.of(2026, 10, 3));
        record.setSessionNumber(2);
        record.setIsSessionCompleted(Boolean.TRUE);
        when(recordService.getConsultationRecordsForLogView(any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(new PageImpl<>(List.of(record)));
        when(nameResolver.resolveForRecords(eq(TENANT_ID), any()))
            .thenReturn(Map.of(500L, "이민지", CONSULTANT_ID, "김상담"));

        User caller = new User();
        caller.setId(CONSULTANT_ID);
        caller.setTenantId(TENANT_ID);

        ResponseEntity<Map<String, Object>> response;
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(caller);
            sessionUtils.when(() -> SessionUtils.isAdmin(session)).thenReturn(false);
            response = controller.getConsultationRecords(
                CONSULTANT_ID, 0, 20, null, null, null, null, null, null, session);
        }

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
        assertThat(data).hasSize(1);
        assertThat(data.get(0)).containsEntry("clientName", "이민지").containsEntry("consultantName", "김상담");
        verify(nameResolver, times(1)).resolveForRecords(eq(TENANT_ID), any());
    }
}
