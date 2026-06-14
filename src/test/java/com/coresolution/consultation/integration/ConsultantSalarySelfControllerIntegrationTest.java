package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
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
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryCalculation.SalaryStatus;
import com.coresolution.consultation.entity.SalaryProfile;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockConsultantSecurityContext;

/**
 * {@link com.coresolution.consultation.controller.ConsultantSalarySelfController} 통합 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-15
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockConsultantSecurityContext
@DisplayName("ConsultantSalarySelfController API 통합 테스트")
class ConsultantSalarySelfControllerIntegrationTest {

    // tenant_id 컬럼 길이(36) 한도. UUID(no-dash) 32자 + prefix 4자 = 36자.
    private static final String TENANT = "css-"
            + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 32);

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SalaryManagementService salaryManagementService;

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    private User consultant(long id) {
        User u = new User();
        u.setId(id);
        u.setUserId("c-" + id);
        u.setTenantId(TENANT);
        u.setRole(UserRole.CONSULTANT);
        return u;
    }

    @Test
    @DisplayName("상담사·서비스가 APPROVED+PAID 2건 반환 시 data 길이 2")
    void consultant_twoVisibleRows_returns200() throws Exception {
        MockHttpSession httpSession = new MockHttpSession();
        httpSession.setAttribute(SessionConstants.USER_OBJECT, consultant(5L));
        httpSession.setAttribute(SessionConstants.TENANT_ID, TENANT);
        User cRef = new User();
        cRef.setId(5L);
        cRef.setName("테스트");
        SalaryProfile sp = SalaryProfile.builder()
                .profileName("기본")
                .baseSalary(BigDecimal.ZERO)
                .build();
        sp.setId(1L);

        SalaryCalculation approved = SalaryCalculation.builder()
                .consultant(cRef)
                .salaryProfile(sp)
                .calculationPeriodStart(LocalDate.of(2025, 6, 1))
                .calculationPeriodEnd(LocalDate.of(2025, 6, 30))
                .totalConsultations(0)
                .completedConsultations(0)
                .totalSalary(BigDecimal.ZERO)
                .netSalary(new BigDecimal("2500000"))
                .status(SalaryStatus.APPROVED)
                .calculatedAt(LocalDateTime.of(2025, 6, 1, 10, 0))
                .build();
        approved.setId(2L);

        SalaryCalculation paid = SalaryCalculation.builder()
                .consultant(cRef)
                .salaryProfile(sp)
                .calculationPeriodStart(LocalDate.of(2025, 7, 1))
                .calculationPeriodEnd(LocalDate.of(2025, 7, 31))
                .totalConsultations(0)
                .completedConsultations(0)
                .totalSalary(BigDecimal.ZERO)
                .status(SalaryStatus.PAID)
                .calculatedAt(LocalDateTime.of(2025, 7, 1, 10, 0))
                .build();
        paid.setId(3L);

        when(salaryManagementService.getSalaryCalculationsVisibleToConsultant(eq(5L)))
                .thenReturn(List.of(approved, paid));

        mockMvc.perform(get("/api/v1/consultants/me/salary-calculations")
                        .session(httpSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].status").exists());
    }

    @Test
    @DisplayName("인증 없음 GET /me/salary-calculations → 401")
    void withoutSession_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/consultants/me/salary-calculations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("상담사 본인 GET /me/salary-calculations → 200")
    void consultant_returns200() throws Exception {
        when(salaryManagementService.getSalaryCalculationsVisibleToConsultant(eq(5L)))
                .thenReturn(Collections.emptyList());

        MockHttpSession httpSession = new MockHttpSession();
        httpSession.setAttribute(SessionConstants.USER_OBJECT, consultant(5L));
        httpSession.setAttribute(SessionConstants.TENANT_ID, TENANT);

        mockMvc.perform(get("/api/v1/consultants/me/salary-calculations")
                        .session(httpSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("내담자 GET /me/salary-calculations → 403")
    void client_returns403() throws Exception {
        User u = new User();
        u.setId(9L);
        u.setTenantId(TENANT);
        u.setRole(UserRole.CLIENT);
        MockHttpSession httpSession = new MockHttpSession();
        httpSession.setAttribute(SessionConstants.USER_OBJECT, u);
        httpSession.setAttribute(SessionConstants.TENANT_ID, TENANT);
        mockMvc.perform(get("/api/v1/consultants/me/salary-calculations")
                        .session(httpSession))
                .andExpect(status().isForbidden());
    }
}
