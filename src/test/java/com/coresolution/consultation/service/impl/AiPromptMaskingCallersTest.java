package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import com.coresolution.consultation.constant.AiPrivacyFlagKeys;
import com.coresolution.consultation.entity.AudioTranscription;
import com.coresolution.consultation.entity.ConsultationAudioFile;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClinicalReportRepository;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.repository.ConsultationRecordAlertRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.ai.privacy.AiPiiMaskingService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.ai.AIModelProvider;
import com.coresolution.core.service.ai.AIModelProvider.AIResponse;

/**
 * 상담 AI 직접 호출 경로(임상 문서·위험 감지)가 내담자·상담사 이름과 연락처를 마스킹해 보내는지 검증.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AI 프롬프트 마스킹 — 임상 문서·위험 감지 호출자")
class AiPromptMaskingCallersTest {

    private static final String TENANT_ID = "tenant-mask-callers";
    private static final String OTHER_TENANT_ID = "tenant-mask-other";
    private static final Long RECORD_ID = 501L;
    private static final Long CLIENT_ID = 11L;
    private static final Long CONSULTANT_ID = 22L;
    private static final Long AUDIO_FILE_ID = 31L;
    private static final String CLIENT_NAME = "김민지";
    private static final String CONSULTANT_NAME = "박상담";
    private static final String PHONE = "010-9876-5432";

    @Mock
    private AIModelProvider modelProvider;
    @Mock
    private ClinicalReportRepository clinicalReportRepository;
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private ConsultationRecordAlertRepository alertRepository;
    @Mock
    private ConsultationAudioFileRepository audioFileRepository;
    @Mock
    private SystemConfigService systemConfigService;
    @Mock
    private UserRepository userRepository;

    private AiPiiMaskingService maskingService;
    private ConsultationRecord record;
    private AudioTranscription transcription;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        maskingService = new AiPiiMaskingService(systemConfigService, userRepository);
        record = ConsultationRecord.builder()
                .id(RECORD_ID)
                .clientId(CLIENT_ID)
                .consultantId(CONSULTANT_ID)
                .sessionDate(LocalDate.of(2026, 10, 1))
                .sessionNumber(3)
                .sessionDurationMinutes(50)
                .build();
        record.setTenantId(TENANT_ID);
        transcription = AudioTranscription.builder()
                .id(1L)
                .audioFileId(AUDIO_FILE_ID)
                .transcriptionText(CLIENT_NAME + ": 죽고 싶다는 생각이 들어요. " + CONSULTANT_NAME
                        + " 선생님 번호 " + PHONE + " 로 연락했어요.")
                .build();
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(TENANT_ID, Set.of(CLIENT_ID, CONSULTANT_ID)))
                .thenReturn(List.of(
                        User.builder().name(CLIENT_NAME).build(),
                        User.builder().name(CONSULTANT_NAME).build()));
        when(modelProvider.analyze(anyString(), anyString(), anyInt(), anyDouble()))
                .thenReturn(new AIResponse("upstream_error", 1L));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private void maskingFlag(boolean enabled) {
        when(systemConfigService.getBooleanForTenant(
                TENANT_ID, AiPrivacyFlagKeys.PII_MASKING_ENABLED, AiPrivacyFlagKeys.DEFAULT_PII_MASKING_ENABLED))
                .thenReturn(enabled);
    }

    private String capturedUserPrompt() {
        ArgumentCaptor<String> userPrompt = ArgumentCaptor.forClass(String.class);
        verify(modelProvider).analyze(anyString(), userPrompt.capture(), anyInt(), anyDouble());
        return userPrompt.getValue();
    }

    private ClinicalDocumentServiceImpl clinicalService() {
        return new ClinicalDocumentServiceImpl(
                modelProvider, clinicalReportRepository, consultationRecordRepository, maskingService);
    }

    private RiskDetectionServiceImpl riskService() {
        return new RiskDetectionServiceImpl(
                modelProvider, alertRepository, audioFileRepository, consultationRecordRepository, maskingService);
    }

    @Test
    @DisplayName("SOAP — 마스킹 ON 이면 이름·전화번호 원문 미전송")
    void soap_maskingOn() {
        maskingFlag(true);
        assertThrows(RuntimeException.class, () -> clinicalService().generateSOAPNote(transcription, record));
        String sent = capturedUserPrompt();
        assertFalse(sent.contains(CLIENT_NAME));
        assertFalse(sent.contains(CONSULTANT_NAME));
        assertFalse(sent.contains(PHONE));
        assertTrue(sent.contains(AiPiiMaskingService.TOKEN_NAME));
    }

    @Test
    @DisplayName("SOAP — 테넌트 토글 OFF 이면 원문")
    void soap_maskingOff() {
        maskingFlag(false);
        assertThrows(RuntimeException.class, () -> clinicalService().generateSOAPNote(transcription, record));
        assertTrue(capturedUserPrompt().contains(CLIENT_NAME));
    }

    @Test
    @DisplayName("진단 보고서 — 같은 테넌트 기록만 조회, 프롬프트 마스킹")
    void diagnostic_maskingOn() {
        maskingFlag(true);
        record.setMainIssues(CLIENT_NAME + " 연락처 " + PHONE);
        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, RECORD_ID)).thenReturn(Optional.of(record));
        assertThrows(RuntimeException.class, () -> clinicalService().generateDiagnosticReport(RECORD_ID));
        String sent = capturedUserPrompt();
        assertFalse(sent.contains(CLIENT_NAME));
        assertFalse(sent.contains(PHONE));
    }

    @Test
    @DisplayName("위험 감지 — 전사 텍스트의 이름·전화번호 마스킹")
    void risk_maskingOn() {
        maskingFlag(true);
        ConsultationAudioFile audio = ConsultationAudioFile.builder().consultationRecordId(RECORD_ID).build();
        when(audioFileRepository.findByTenantIdAndId(TENANT_ID, AUDIO_FILE_ID)).thenReturn(Optional.of(audio));
        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, RECORD_ID)).thenReturn(Optional.of(record));
        riskService().analyzeTranscriptionForRisks(transcription);
        String sent = capturedUserPrompt();
        assertFalse(sent.contains(CLIENT_NAME));
        assertFalse(sent.contains(CONSULTANT_NAME));
        assertFalse(sent.contains(PHONE));
    }

    @Test
    @DisplayName("반례 — 다른 테넌트 기록이면 이름 식별자 조회 안 됨(패턴 마스킹만), 다른 테넌트 사용자 미조회")
    void risk_otherTenantRecordNotResolved() {
        maskingFlag(true);
        ConsultationAudioFile audio = ConsultationAudioFile.builder().consultationRecordId(RECORD_ID).build();
        when(audioFileRepository.findByTenantIdAndId(TENANT_ID, AUDIO_FILE_ID)).thenReturn(Optional.of(audio));
        when(consultationRecordRepository.findByTenantIdAndId(TENANT_ID, RECORD_ID)).thenReturn(Optional.empty());
        riskService().analyzeTranscriptionForRisks(transcription);
        String sent = capturedUserPrompt();
        assertFalse(sent.contains(PHONE));
        verify(userRepository, org.mockito.Mockito.never())
                .findByTenantIdAndIdInAndIsDeletedFalse(eq(OTHER_TENANT_ID), any());
    }
}
