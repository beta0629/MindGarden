package com.mindgarden.consultation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindgarden.consultation.service.PasskeyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Passkey 컨트롤러 테스트
 * Week 17-18: Passkey 인증 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@WebMvcTest(PasskeyController.class)
class PasskeyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PasskeyService passkeyService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testStartRegistration() throws Exception {
        // Given
        Map<String, Object> request = new HashMap<>();
        request.put("userId", 1L);
        request.put("deviceName", "내 iPhone");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("options", Map.of("challenge", "test-challenge"));

        when(passkeyService.startRegistration(anyLong(), anyString())).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/auth/passkey/register/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testStartAuthentication() throws Exception {
        // Given
        Map<String, Object> request = new HashMap<>();
        request.put("email", "test@example.com");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("options", Map.of("challenge", "test-challenge"));

        when(passkeyService.startAuthentication(anyString())).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/auth/passkey/authenticate/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testListPasskeys() throws Exception {
        // Given
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("passkeys", java.util.Collections.emptyList());

        when(passkeyService.listPasskeys(anyLong())).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/api/auth/passkey/list")
                        .param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}

