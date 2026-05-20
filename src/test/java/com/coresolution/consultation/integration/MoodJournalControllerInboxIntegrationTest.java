package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.moodjournal.MoodJournalInboxItemResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.MoodJournalService;

/**
 * {@link com.coresolution.consultation.controller.MoodJournalController} 상담사 수신함 JSON 계약 검증.
 *
 * @author MindGarden
 * @since 2026-05-21
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("MoodJournalController inbox API 통합 테스트")
class MoodJournalControllerInboxIntegrationTest {

    private static final String TENANT = "tenant-mj-inbox-" + java.util.UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MoodJournalService moodJournalService;

    private User consultant(long id) {
        User u = new User();
        u.setId(id);
        u.setUserId("c-mj-" + id);
        u.setTenantId(TENANT);
        u.setRole(UserRole.CONSULTANT);
        return u;
    }

    @Test
    @DisplayName("수신함 응답 data[]에 clientId·clientName·date가 직렬화된다")
    void inbox_serializesClientIdentityFields() throws Exception {
        MoodJournalInboxItemResponse row = MoodJournalInboxItemResponse.builder()
            .id(9001L)
            .clientId(42L)
            .clientName("테스트내담자")
            .date("2026-05-20")
            .moodValue(4)
            .emoji("🙂")
            .tags(List.of("감사"))
            .memo("오늘은 괜찮았어요.")
            .sharedWithConsultant(true)
            .createdAt("2026-05-20T10:00:00+09:00")
            .updatedAt("2026-05-20T11:00:00+09:00")
            .build();
        when(moodJournalService.listInboxForConsultant(any())).thenReturn(List.of(row));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, consultant(5L));
        session.setAttribute(SessionConstants.TENANT_ID, TENANT);

        mockMvc.perform(get("/api/v1/mood-journals/inbox").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].id").value(9001))
            .andExpect(jsonPath("$.data[0].clientId").value(42))
            .andExpect(jsonPath("$.data[0].clientName").value("테스트내담자"))
            .andExpect(jsonPath("$.data[0].date").value("2026-05-20"));
    }

    @Test
    @DisplayName("수신함 응답 data[]에 clientName JSON 키가 항상 포함된다")
    void inbox_alwaysIncludesClientIdentityJsonKeys() throws Exception {
        MoodJournalInboxItemResponse row = MoodJournalInboxItemResponse.builder()
            .id(9002L)
            .clientId(7L)
            .clientName(null)
            .date("2026-05-19")
            .moodValue(3)
            .emoji("😐")
            .tags(List.of())
            .memo("")
            .sharedWithConsultant(true)
            .createdAt("2026-05-19T10:00:00+09:00")
            .updatedAt(null)
            .build();
        when(moodJournalService.listInboxForConsultant(any())).thenReturn(List.of(row));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, consultant(2L));
        session.setAttribute(SessionConstants.TENANT_ID, TENANT);

        mockMvc.perform(get("/api/v1/mood-journals/inbox").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].clientId").value(7))
            .andExpect(jsonPath("$.data[0].clientName").value(nullValue()));
    }

    @Test
    @DisplayName("세션 없음 → 403 (AccessDeniedException)")
    void inbox_withoutSession_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/mood-journals/inbox"))
            .andExpect(status().isForbidden());
    }
}
