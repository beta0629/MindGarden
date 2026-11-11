package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.constant.HomepageInquiryConstants;
import com.coresolution.consultation.dto.AdminListPageResult;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryDetailResponse;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryListItemResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.HomepageInquiryService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * {@link AdminHomepageInquiryController} — ADMIN 전용·테넌트 컨텍스트 MockMvc.
 *
 * <p>소유자 결정: 동일 테넌트 {@code UserRole.ADMIN} 전원 목록·상세(복호화) 허용.
 * 세분 권한 매트릭스 없음. STAFF/CONSULTANT/미인증은 {@code @PreAuthorize} 로 차단.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("AdminHomepageInquiryController — ADMIN PII 접근")
class AdminHomepageInquiryControllerTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();
    private static final Long INQUIRY_ID = 77L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HomepageInquiryService homepageInquiryService;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("클래스 레벨 @PreAuthorize hasRole('ADMIN') + admin homepage inquiries 경로")
    void classLevelGuardAndAdminPath() {
        PreAuthorize guard = AdminHomepageInquiryController.class.getAnnotation(PreAuthorize.class);
        assertThat(guard).isNotNull();
        assertThat(guard.value()).isEqualTo("hasRole('ADMIN')");
        RequestMapping mapping = AdminHomepageInquiryController.class.getAnnotation(RequestMapping.class);
        assertThat(mapping.value()).containsExactly(HomepageInquiryConstants.ADMIN_API_BASE);
    }

    @Test
    @DisplayName("GET 목록 — ADMIN 200")
    @WithMockUser(username = "admin-one", roles = {"ADMIN"})
    void list_whenAdmin_returns200() throws Exception {
        AdminHomepageInquiryListItemResponse item = AdminHomepageInquiryListItemResponse.builder()
                .id(INQUIRY_ID)
                .nameMasked("홍*동")
                .phoneMasked("010****5678")
                .inquiryType("PERSONAL")
                .status(HomepageInquiryConstants.STATUS_NEW)
                .build();
        when(homepageInquiryService.listForAdmin(eq(TENANT_ID), isNull(), isNull(), isNull()))
                .thenReturn(new AdminListPageResult<>(List.of(item), 1L));

        mockMvc.perform(get(HomepageInquiryConstants.ADMIN_API_BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.count").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(INQUIRY_ID));
    }

    @Test
    @DisplayName("GET 목록 — 동일 테넌트 두 번째 ADMIN 도 200")
    @WithMockUser(username = "admin-two", roles = {"ADMIN"})
    void list_whenSecondAdminSameTenant_returns200() throws Exception {
        when(homepageInquiryService.listForAdmin(eq(TENANT_ID), isNull(), isNull(), isNull()))
                .thenReturn(new AdminListPageResult<>(List.of(), 0L));

        mockMvc.perform(get(HomepageInquiryConstants.ADMIN_API_BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(0));
    }

    @Test
    @DisplayName("GET 상세 — ADMIN 복호화 상세 200")
    @WithMockUser(username = "admin-one", roles = {"ADMIN"})
    void detail_whenAdmin_returnsDecrypted() throws Exception {
        when(homepageInquiryService.getDetailForAdmin(eq(TENANT_ID), eq(INQUIRY_ID), any(User.class), any()))
                .thenReturn(AdminHomepageInquiryDetailResponse.builder()
                        .id(INQUIRY_ID)
                        .name("홍길동")
                        .phone("01012345678")
                        .inquiryType("PERSONAL")
                        .content("문의 내용")
                        .status(HomepageInquiryConstants.STATUS_IN_PROGRESS)
                        .build());

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(adminUser(101L, "admin-one"));

            mockMvc.perform(get(HomepageInquiryConstants.ADMIN_API_BASE + "/" + INQUIRY_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name").value("홍길동"))
                    .andExpect(jsonPath("$.data.phone").value("01012345678"));
        }

        verify(homepageInquiryService).getDetailForAdmin(eq(TENANT_ID), eq(INQUIRY_ID), any(User.class), any());
    }

    @Test
    @DisplayName("GET 상세 — 동일 테넌트 두 번째 ADMIN 도 복호화 상세 200")
    @WithMockUser(username = "admin-two", roles = {"ADMIN"})
    void detail_whenSecondAdminSameTenant_returnsDecrypted() throws Exception {
        when(homepageInquiryService.getDetailForAdmin(eq(TENANT_ID), eq(INQUIRY_ID), any(User.class), any()))
                .thenReturn(AdminHomepageInquiryDetailResponse.builder()
                        .id(INQUIRY_ID)
                        .name("홍길동")
                        .phone("01012345678")
                        .status(HomepageInquiryConstants.STATUS_IN_PROGRESS)
                        .build());

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(adminUser(202L, "admin-two"));

            mockMvc.perform(get(HomepageInquiryConstants.ADMIN_API_BASE + "/" + INQUIRY_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name").value("홍길동"));
        }
    }

    @Test
    @DisplayName("GET 목록 — STAFF 403")
    @WithMockUser(roles = {"STAFF"})
    void list_whenStaff_returns403() throws Exception {
        mockMvc.perform(get(HomepageInquiryConstants.ADMIN_API_BASE))
                .andExpect(status().isForbidden());
        verify(homepageInquiryService, never())
                .listForAdmin(anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("GET 상세 — STAFF 403")
    @WithMockUser(roles = {"STAFF"})
    void detail_whenStaff_returns403() throws Exception {
        mockMvc.perform(get(HomepageInquiryConstants.ADMIN_API_BASE + "/" + INQUIRY_ID))
                .andExpect(status().isForbidden());
        verify(homepageInquiryService, never())
                .getDetailForAdmin(anyString(), anyLong(), any(), any());
    }

    @Test
    @DisplayName("GET 목록 — CONSULTANT 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void list_whenConsultant_returns403() throws Exception {
        mockMvc.perform(get(HomepageInquiryConstants.ADMIN_API_BASE))
                .andExpect(status().isForbidden());
        verify(homepageInquiryService, never())
                .listForAdmin(anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("GET 상세 — CONSULTANT 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void detail_whenConsultant_returns403() throws Exception {
        mockMvc.perform(get(HomepageInquiryConstants.ADMIN_API_BASE + "/" + INQUIRY_ID))
                .andExpect(status().isForbidden());
        verify(homepageInquiryService, never())
                .getDetailForAdmin(anyString(), anyLong(), any(), any());
    }

    @Test
    @DisplayName("GET 목록 — 미인증 403")
    @WithAnonymousUser
    void list_whenAnonymous_returns403() throws Exception {
        mockMvc.perform(get(HomepageInquiryConstants.ADMIN_API_BASE))
                .andExpect(status().isForbidden());
        verify(homepageInquiryService, never())
                .listForAdmin(anyString(), any(), any(), any());
    }

    private static User adminUser(Long id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setTenantId(TENANT_ID);
        return user;
    }
}
