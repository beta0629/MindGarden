package com.coresolution.core.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.ai.privacy.AiPiiMaskingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

/**
 * 보안 위협 분석 OpenAI 직접 호출도 중앙 마스킹 경로를 거친다 (#1422 후속).
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("OpenAIMonitoringService — 전송·로그 프롬프트 마스킹")
class OpenAIMonitoringServiceMaskingTest {

    private AiUsageLogRepository usageLogRepository;
    private SystemConfigService systemConfigService;
    private AiPiiMaskingService maskingService;
    private RestTemplate restTemplate;
    private OpenAIMonitoringService service;

    @BeforeEach
    void setUp() {
        usageLogRepository = mock(AiUsageLogRepository.class);
        systemConfigService = mock(SystemConfigService.class);
        maskingService = mock(AiPiiMaskingService.class);
        restTemplate = mock(RestTemplate.class);
        when(systemConfigService.getOpenAIApiKey()).thenReturn("test-key-placeholder");
        when(systemConfigService.getOpenAIApiUrl()).thenReturn("http://localhost/unused");
        when(systemConfigService.getOpenAIModel()).thenReturn("gpt-4o-mini");
        when(maskingService.mask(isNull(), anyString()))
                .thenAnswer(inv -> AiPiiMaskingService.applyMasking(inv.getArgument(1), null));
        when(usageLogRepository.save(any(AiUsageLog.class))).thenAnswer(inv -> inv.getArgument(0));
        service = new OpenAIMonitoringService(usageLogRepository, systemConfigService, maskingService);
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    @DisplayName("보안 이벤트 상세의 이메일·전화는 OpenAI 요청 본문과 사용 로그에 원문으로 가지 않는다")
    void securityThreat_promptMaskedBeforeSendAndLog() {
        Map<String, Object> body = Map.of(
                "choices", List.of(Map.of("message", Map.of("content", "{\"isThreat\":false}"))),
                "usage", Map.of("prompt_tokens", 1, "completion_tokens", 1, "total_tokens", 2));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn((ResponseEntity) ResponseEntity.ok(body));

        service.analyzeSecurityThreat("LOGIN_FAIL",
                Map.of("email", "victim@example.com", "phone", "010-2222-3333"));

        ArgumentCaptor<HttpEntity> sent = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), sent.capture(), eq(Map.class));
        String sentBody = String.valueOf(sent.getValue().getBody());
        assertThat(sentBody).doesNotContain("victim@example.com", "010-2222-3333").contains("[이메일]");
        verify(maskingService, org.mockito.Mockito.atLeast(2)).mask(isNull(), anyString());

        ArgumentCaptor<AiUsageLog> saved = ArgumentCaptor.forClass(AiUsageLog.class);
        verify(usageLogRepository).save(saved.capture());
        assertThat(saved.getValue().getPrompt()).doesNotContain("victim@example.com", "010-2222-3333");
    }
}
