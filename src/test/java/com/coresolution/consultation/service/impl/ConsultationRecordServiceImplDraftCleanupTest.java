package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ConsultationRecordDraftService;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 상담일지 확정 저장(작성·수정) 후 해당 상담·상담사의 서버 초안 정리 회귀 (#1409 후속).
 *
 * <p>확정 저장 뒤에도 서버 초안이 남으면 다음 진입 때 "임시저장 불러오기" 가 떠서
 * 확정본을 옛 초안으로 되돌릴 수 있다. 저장이 실패하면 초안은 남아 있어야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationRecordServiceImpl 확정 저장 → 서버 초안 정리")
class ConsultationRecordServiceImplDraftCleanupTest {

    private static final Long SCHEDULE_ID = 812L;
    private static final Long RECORD_ID = 9301L;
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 27L;

    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private PlSqlConsultationRecordAlertService consultationRecordAlertService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private ConsultationRecordDraftService consultationRecordDraftService;

    @InjectMocks
    private ConsultationRecordServiceImpl recordService;

    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-draft-cleanup-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        lenient().when(consultationRecordAlertService.resolveConsultationRecordAlert(anyLong(), any()))
                .thenReturn(Map.of("success", true));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("작성 저장 성공 → 같은 테넌트·상담·상담사의 서버 초안 삭제")
    void create_success_deletesServerDraft() {
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
                .thenReturn(Optional.of(schedule()));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        withAdmin(() -> recordService.createConsultationRecord(createPayload()));

        verify(consultationRecordDraftService).deleteDraft(tenantId, SCHEDULE_ID, CONSULTANT_ID);
    }

    @Test
    @DisplayName("수정 저장 성공 → 서버 초안 삭제")
    void update_success_deletesServerDraft() {
        when(consultationRecordRepository.findByTenantIdAndId(tenantId, RECORD_ID))
                .thenReturn(Optional.of(existingRecord()));
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
                .thenReturn(Optional.of(schedule()));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        withAdmin(() -> recordService.updateConsultationRecord(RECORD_ID, updatePayload()));

        verify(consultationRecordDraftService).deleteDraft(tenantId, SCHEDULE_ID, CONSULTANT_ID);
    }

    @Test
    @DisplayName("초안 삭제가 실패해도 확정 저장 결과는 성공으로 돌려준다")
    void update_draftDeleteFails_saveStillSucceeds() {
        when(consultationRecordRepository.findByTenantIdAndId(tenantId, RECORD_ID))
                .thenReturn(Optional.of(existingRecord()));
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
                .thenReturn(Optional.of(schedule()));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        doThrow(new IllegalStateException("draft store down"))
                .when(consultationRecordDraftService).deleteDraft(anyString(), anyLong(), anyLong());

        ConsultationRecord[] saved = new ConsultationRecord[1];
        withAdmin(() -> saved[0] = recordService.updateConsultationRecord(RECORD_ID, updatePayload()));

        assertThat(saved[0]).isNotNull();
        assertThat(saved[0].getId()).isEqualTo(RECORD_ID);
    }

    @Test
    @DisplayName("확정 저장이 실패하면 서버 초안을 지우지 않는다 (입력 보존)")
    void update_saveFails_keepsServerDraft() {
        when(consultationRecordRepository.findByTenantIdAndId(tenantId, RECORD_ID))
                .thenReturn(Optional.of(existingRecord()));
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
                .thenReturn(Optional.of(schedule()));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenThrow(new IllegalStateException("db down"));

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(adminUser());
            assertThatThrownBy(() -> recordService.updateConsultationRecord(RECORD_ID, updatePayload()))
                    .isInstanceOf(RuntimeException.class);
        }

        verify(consultationRecordDraftService, never()).deleteDraft(anyString(), anyLong(), anyLong());
    }

    @Test
    @DisplayName("다른 상담사의 초안은 건드리지 않는다 — 저장한 기록의 consultantId 로만 삭제")
    void update_deletesOnlyOwnConsultantDraft() {
        when(consultationRecordRepository.findByTenantIdAndId(tenantId, RECORD_ID))
                .thenReturn(Optional.of(existingRecord()));
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
                .thenReturn(Optional.of(schedule()));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        withAdmin(() -> recordService.updateConsultationRecord(RECORD_ID, updatePayload()));

        verify(consultationRecordDraftService).deleteDraft(eq(tenantId), eq(SCHEDULE_ID), eq(CONSULTANT_ID));
        verify(consultationRecordDraftService, never())
                .deleteDraft(eq(tenantId), eq(SCHEDULE_ID), eq(CONSULTANT_ID + 1));
    }

    private void withAdmin(Runnable action) {
        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(adminUser());
            action.run();
        }
    }

    private Map<String, Object> createPayload() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", SCHEDULE_ID);
        payload.put("clientId", CLIENT_ID);
        payload.put("consultantId", CONSULTANT_ID);
        payload.put("sessionNumber", 1);
        payload.put("sessionDate", LocalDate.now().toString());
        payload.put("isSessionCompleted", false);
        payload.put("mainIssues", "본문");
        return payload;
    }

    private Map<String, Object> updatePayload() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", SCHEDULE_ID);
        payload.put("sessionNumber", 1);
        payload.put("mainIssues", "수정 본문");
        return payload;
    }

    private ConsultationRecord existingRecord() {
        ConsultationRecord r = new ConsultationRecord();
        r.setId(RECORD_ID);
        r.setTenantId(tenantId);
        r.setConsultationId(SCHEDULE_ID);
        r.setConsultantId(CONSULTANT_ID);
        r.setClientId(CLIENT_ID);
        r.setIsDeleted(false);
        r.setIsSessionCompleted(false);
        r.setSessionNumber(1);
        r.setSessionDate(LocalDate.now());
        return r;
    }

    private Schedule schedule() {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(tenantId);
        s.setConsultantId(CONSULTANT_ID);
        s.setClientId(CLIENT_ID);
        s.setStatus(ScheduleStatus.BOOKED);
        s.setScheduleType("CONSULTATION");
        s.setDate(LocalDate.now());
        s.setSessionSequence(1);
        s.setIsDeleted(false);
        return s;
    }

    private static User adminUser() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        return admin;
    }
}
