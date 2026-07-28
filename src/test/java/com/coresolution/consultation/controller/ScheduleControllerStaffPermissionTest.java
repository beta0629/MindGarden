package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantDashboardService;
import com.coresolution.consultation.service.ConsultationRecordDraftService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.repository.ClientScheduleNoteRepository;
import com.coresolution.core.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link ScheduleController} STAFF 권한 회귀 테스트 (1.0.5).
 *
 * <p>변경 ② 의 ScheduleController#confirmSchedule / #autoCompleteExpiredSchedules
 * 가 STAFF 역할에서 통과(200)하고 비ADMIN/비STAFF 역할에서 차단(403)되는지를
 * 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("ScheduleController — STAFF == ADMIN 권한 분기")
class ScheduleControllerStaffPermissionTest {

    @Mock private ScheduleService scheduleService;
    @Mock private AdminService adminService;
    @Mock private ConsultationRecordService consultationRecordService;
    @Mock private ConsultationRecordDraftService consultationRecordDraftService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private UserRepository userRepository;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ObjectMapper objectMapper;
    @Mock private ConsultantDashboardService consultantDashboardService;
    @Mock private ClientScheduleNoteRepository clientScheduleNoteRepository;
    @Mock private ConsultantClientMappingRepository consultantClientMappingRepository;

    @InjectMocks
    private ScheduleController controller;

    @Test
    @DisplayName("STAFF 가 PUT /schedules/{id}/confirm — 200")
    void staffConfirmSchedule_200() {
        Schedule confirmed = new Schedule();
        confirmed.setId(42L);
        confirmed.setStatus(ScheduleStatus.CONFIRMED);
        lenient().when(scheduleService.confirmSchedule(eq(42L), anyString())).thenReturn(confirmed);

        Map<String, Object> body = new HashMap<>();
        body.put("adminNote", "테스트 확정");

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.confirmSchedule(42L, body, "STAFF");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(scheduleService, times(1)).confirmSchedule(eq(42L), anyString());
    }

    @Test
    @DisplayName("ADMIN 이 PUT /schedules/{id}/confirm — 200 (회귀)")
    void adminConfirmSchedule_200() {
        Schedule confirmed = new Schedule();
        confirmed.setId(43L);
        confirmed.setStatus(ScheduleStatus.CONFIRMED);
        lenient().when(scheduleService.confirmSchedule(eq(43L), anyString())).thenReturn(confirmed);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.confirmSchedule(43L, new HashMap<>(), "ADMIN");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("CONSULTANT 가 PUT /schedules/{id}/confirm — 403")
    void consultantConfirmSchedule_forbidden() {
        assertThatThrownBy(() -> controller.confirmSchedule(44L, new HashMap<>(), "CONSULTANT"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("CLIENT 가 PUT /schedules/{id}/confirm — 403")
    void clientConfirmSchedule_forbidden() {
        assertThatThrownBy(() -> controller.confirmSchedule(45L, new HashMap<>(), "CLIENT"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("STAFF 가 POST /schedules/auto-complete — 200")
    void staffAutoComplete_200() {
        ResponseEntity<ApiResponse<Void>> response =
                controller.autoCompleteExpiredSchedules("STAFF");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(scheduleService, times(1)).autoCompleteExpiredSchedules();
    }

    @Test
    @DisplayName("ADMIN 이 POST /schedules/auto-complete — 200 (회귀)")
    void adminAutoComplete_200() {
        ResponseEntity<ApiResponse<Void>> response =
                controller.autoCompleteExpiredSchedules("ADMIN");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("CONSULTANT 가 POST /schedules/auto-complete — 403")
    void consultantAutoComplete_forbidden() {
        assertThatThrownBy(() -> controller.autoCompleteExpiredSchedules("CONSULTANT"))
                .isInstanceOf(AccessDeniedException.class);
    }
}
