package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.dto.publicapi.PublicConsultationProductResponse;
import com.coresolution.consultation.service.PublicTenantConsultationProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 공개 상담 상품 컨트롤러 Cache-Control·JSON 필드 검증.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@DisplayName("PublicTenantConsultationProductController")
class PublicTenantConsultationProductControllerTest {

    private MockMvc mockMvc;
    private PublicTenantConsultationProductService publicTenantConsultationProductService;

    @BeforeEach
    void setUp() {
        publicTenantConsultationProductService = mock(PublicTenantConsultationProductService.class);
        PublicTenantConsultationProductController controller =
                new PublicTenantConsultationProductController(publicTenantConsultationProductService);
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(mapper);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(converter)
                .build();
    }

    @Test
    @DisplayName("Cache-Control public max-age=300 및 id 필드 미포함")
    void list_setsCacheControlAndOmitsId() throws Exception {
        when(publicTenantConsultationProductService.listByTenantSlug(eq("mindgarden")))
                .thenReturn(List.of(new PublicConsultationProductResponse(
                        "SKU-1",
                        "상담",
                        60000L,
                        45000L,
                        LocalDate.of(2026, 11, 1),
                        LocalDate.of(2026, 12, 31),
                        1,
                        30,
                        0,
                        LocalDateTime.of(2026, 11, 1, 10, 0))));

        mockMvc.perform(get("/api/v1/public/tenants/mindgarden/consultation-products"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, public"))
                .andExpect(jsonPath("$.data[0].skuCode").value("SKU-1"))
                .andExpect(jsonPath("$.data[0].name").value("상담"))
                .andExpect(jsonPath("$.data[0].price").value(60000))
                .andExpect(jsonPath("$.data[0].eventPrice").value(45000))
                .andExpect(jsonPath("$.data[0].id").doesNotExist())
                .andExpect(jsonPath("$.data[0].consultantId").doesNotExist());
    }
}
