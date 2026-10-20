package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.coresolution.consultation.constant.SystemTimeConstants;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * {@link SystemTimeController} 단위(MockMvc standalone) 테스트.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@DisplayName("SystemTimeController")
class SystemTimeControllerTest {

    private static final long FIXED_EPOCH_MILLIS = 1_760_400_000_000L;
    private static final long EPOCH_TOLERANCE_MS = 5_000L;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        Clock fixed = Clock.fixed(Instant.ofEpochMilli(FIXED_EPOCH_MILLIS),
                ZoneId.of(SystemTimeConstants.ZONE_ID));
        mockMvc = MockMvcBuilders.standaloneSetup(new SystemTimeController(fixed)).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("GET /api/v1/time — 200, epochMillis·zone, Cache-Control: no-store")
    void getServerTime_returnsEpochAndZone_withNoStore() throws Exception {
        MvcResult result = mockMvc.perform(get(SystemTimeConstants.API_PATH))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, org.hamcrest.Matchers.containsString("no-store")))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.epochMillis").value(FIXED_EPOCH_MILLIS))
                .andExpect(jsonPath("$.data.zone").value(SystemTimeConstants.ZONE_ID))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode data = root.path("data");
        long epoch = data.path("epochMillis").asLong();
        assertThat(epoch).isEqualTo(FIXED_EPOCH_MILLIS);
        assertThat(data.path("zone").asText()).isEqualTo("Asia/Seoul");
        List<String> dataFields = new ArrayList<>();
        data.fieldNames().forEachRemaining(dataFields::add);
        assertThat(dataFields).containsExactlyInAnyOrder("epochMillis", "zone");
        String raw = result.getResponse().getContentAsString();
        assertThat(raw).doesNotContain("tenantId");
        assertThat(raw).doesNotContain("userId");
        assertThat(raw).doesNotContain("email");
    }

    @Test
    @DisplayName("기본 Clock 컨트롤러 — epochMillis 가 현재와 근접")
    void getServerTime_defaultClock_epochNearNow() throws Exception {
        MockMvc liveMvc = MockMvcBuilders.standaloneSetup(new SystemTimeController()).build();
        long before = System.currentTimeMillis();
        MvcResult result = liveMvc.perform(get(SystemTimeConstants.API_PATH))
                .andExpect(status().isOk())
                .andReturn();
        long after = System.currentTimeMillis();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        long epoch = root.path("data").path("epochMillis").asLong();
        assertThat(epoch).isBetween(before - EPOCH_TOLERANCE_MS, after + EPOCH_TOLERANCE_MS);
        assertThat(root.path("data").path("zone").asText()).isEqualTo(SystemTimeConstants.ZONE_ID);
    }

    @Test
    @DisplayName("비인증(standalone) 접근 가능 — 세션/토큰 없이 200")
    void getServerTime_unauthenticated_ok() throws Exception {
        mockMvc.perform(get(SystemTimeConstants.API_PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.zone").value("Asia/Seoul"));
    }
}
