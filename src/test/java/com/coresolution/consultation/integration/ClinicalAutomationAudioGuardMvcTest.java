package com.coresolution.consultation.integration;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.config.SecurityHeaderFilter;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.controller.ClinicalAutomationController;
import com.coresolution.consultation.entity.AudioTranscription;
import com.coresolution.consultation.entity.ConsultationAudioFile;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.AudioTranscriptionRepository;
import com.coresolution.consultation.repository.ClinicalReportRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SpeechToTextService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ConsultationAudioStorage;
import com.coresolution.consultation.service.support.ConsultationRecordAccessGuard;
import com.coresolution.consultation.service.support.ConsultationRecordAccessLogService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 상담 음성 업로드·전사 상태 조회 — 상담일지 공용 가드·테넌트 범위 검증.
 *
 * <ul>
 *   <li>업로드: 일정 단위 읽기 권한(작성 상담사·같은 테넌트 관리자)이 없으면 저장소를 호출하지 않고 403/401.</li>
 *   <li>전사 상태: 호출자 테넌트 범위로만 음성 파일을 찾고, 원본 일지 읽기 권한이 없으면 403 — 전사 본문 비노출.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("상담 음성 업로드·전사 상태 — 상담일지 공용 가드·테넌트 범위")
class ClinicalAutomationAudioGuardMvcTest {

    private static final String TENANT_A = "tenant-audio-a";
    private static final String TENANT_B = "tenant-audio-b";
    private static final long SCHEDULE_ID = 600L;
    private static final long OTHER_SCHEDULE_ID = 601L;
    private static final long RECORD_ID = 9101L;
    private static final long OTHER_SCHEDULE_RECORD_ID = 9102L;
    private static final long AUTHOR_CONSULTANT = 22L;
    private static final long OTHER_CONSULTANT = 77L;
    private static final long CLIENT_ID = 20L;
    private static final long ADMIN_ID = 1L;
    private static final long AUDIO_WITH_RECORD = 7001L;
    private static final long AUDIO_WITHOUT_RECORD = 7002L;
    private static final long SAVED_AUDIO_ID = 7100L;

    private static final String UPLOAD_URI = "/api/v1/clinical-automation/consultations/{id}/upload-audio";
    private static final String STATUS_URI = "/api/v1/clinical-automation/audio-files/{id}/transcription-status";
    private static final String TRANSCRIPT_TEXT = "전사 본문 유출 감지 문구 — 내담자 진술";
    private static final String MIME_TYPE = "audio/mpeg";

    private ConsultationAudioStorage audioStorage;
    private ConsultationAudioFileRepository audioFileRepository;
    private SpeechToTextService speechToTextService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        ConsultationRecordAccessLogService accessLogService = mock(ConsultationRecordAccessLogService.class);
        ConsultationRecordRepository recordRepository = mock(ConsultationRecordRepository.class);
        ScheduleRepository scheduleRepository = mock(ScheduleRepository.class);
        AudioTranscriptionRepository transcriptionRepository = mock(AudioTranscriptionRepository.class);
        audioStorage = mock(ConsultationAudioStorage.class);
        audioFileRepository = mock(ConsultationAudioFileRepository.class);
        speechToTextService = mock(SpeechToTextService.class);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));
        ConsultationRecordAccessGuard logGuard = new ConsultationRecordAccessGuard(clientGuard,
            mock(ClinicalReportRepository.class), accessLogService, recordRepository,
            mock(InstitutionLinkConsultationLogRepository.class), scheduleRepository);

        Object[] provided = {clientGuard, logGuard, recordRepository, transcriptionRepository, audioStorage,
            audioFileRepository, speechToTextService};
        mockMvc = MockMvcBuilders.standaloneSetup(build(ClinicalAutomationController.class, provided))
            .addFilter(new SecurityHeaderFilter())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        when(scheduleRepository.findByTenantIdAndId(TENANT_A, SCHEDULE_ID))
            .thenReturn(Optional.of(schedule(SCHEDULE_ID)));
        when(scheduleRepository.findByTenantIdAndId(TENANT_A, OTHER_SCHEDULE_ID))
            .thenReturn(Optional.of(schedule(OTHER_SCHEDULE_ID)));
        ConsultationRecord record = record(RECORD_ID, SCHEDULE_ID);
        ConsultationRecord otherScheduleRecord = record(OTHER_SCHEDULE_RECORD_ID, OTHER_SCHEDULE_ID);
        when(recordRepository.findActiveForScheduleSsot(TENANT_A, SCHEDULE_ID)).thenReturn(List.of(record));
        when(recordRepository.findActiveForScheduleSsot(TENANT_A, OTHER_SCHEDULE_ID))
            .thenReturn(List.of(otherScheduleRecord));
        when(recordRepository.findByTenantIdAndId(TENANT_A, RECORD_ID)).thenReturn(Optional.of(record));
        when(recordRepository.findByTenantIdAndId(TENANT_A, OTHER_SCHEDULE_RECORD_ID))
            .thenReturn(Optional.of(otherScheduleRecord));

        when(audioFileRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, AUDIO_WITH_RECORD))
            .thenReturn(Optional.of(audioFile(AUDIO_WITH_RECORD, RECORD_ID)));
        when(audioFileRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, AUDIO_WITHOUT_RECORD))
            .thenReturn(Optional.of(audioFile(AUDIO_WITHOUT_RECORD, null)));
        // 테넌트 없는 조회가 남아 있으면 타 테넌트 호출자에게도 파일이 보이도록 일부러 열어 둔다.
        when(audioFileRepository.findByIdAndIsDeletedFalse(anyLong()))
            .thenAnswer(inv -> Optional.of(audioFile(inv.getArgument(0), RECORD_ID)));
        when(transcriptionRepository.findByAudioFileId(anyLong()))
            .thenAnswer(inv -> Optional.of(transcription(inv.getArgument(0))));

        when(audioStorage.isAllowedMimeType(MIME_TYPE)).thenReturn(true);
        when(audioStorage.storeEncrypted(anyString(), anyLong(), anyString(), any()))
            .thenReturn(Path.of("stored-audio.enc"));
        when(audioFileRepository.save(any(ConsultationAudioFile.class))).thenAnswer(inv -> {
            ConsultationAudioFile saved = inv.getArgument(0);
            saved.setId(SAVED_AUDIO_ID);
            return saved;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("POST upload-audio")
    class Upload {

        @Test
        @DisplayName("미인증은 401 이고 저장소를 호출하지 않는다")
        void anonymous_unauthorized() throws Exception {
            mockMvc.perform(multipart(UPLOAD_URI, SCHEDULE_ID).file(audioPart()))
                .andExpect(status().isUnauthorized());
            assertNotStored();
        }

        @Test
        @DisplayName("내담자는 403 이고 저장소를 호출하지 않는다")
        void client_forbidden() throws Exception {
            upload(SCHEDULE_ID, null, user(CLIENT_ID, UserRole.CLIENT, TENANT_A))
                .andExpect(status().isForbidden())
                .andExpect(content().string(not(containsString(TRANSCRIPT_TEXT))));
            assertNotStored();
        }

        @Test
        @DisplayName("작성자가 아닌 다른 상담사는 403 이고 저장소를 호출하지 않는다")
        void otherConsultant_forbidden() throws Exception {
            upload(SCHEDULE_ID, null, user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
                .andExpect(status().isForbidden())
                .andExpect(content().string(not(containsString(TRANSCRIPT_TEXT))));
            assertNotStored();
        }

        @Test
        @DisplayName("다른 테넌트 관리자는 403 이고 저장소를 호출하지 않는다")
        void otherTenantAdmin_forbidden() throws Exception {
            upload(SCHEDULE_ID, RECORD_ID, user(ADMIN_ID, UserRole.ADMIN, TENANT_B))
                .andExpect(status().isForbidden())
                .andExpect(content().string(not(containsString(TRANSCRIPT_TEXT))));
            assertNotStored();
        }

        @Test
        @DisplayName("다른 일정의 일지 id 를 붙이면 403 이고 저장소를 호출하지 않는다")
        void recordOfOtherSchedule_forbidden() throws Exception {
            upload(SCHEDULE_ID, OTHER_SCHEDULE_RECORD_ID, user(AUTHOR_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
                .andExpect(status().isForbidden());
            assertNotStored();
        }

        @Test
        @DisplayName("같은 테넌트 관리자는 200 이고 업로드된다")
        void sameTenantAdmin_ok() throws Exception {
            upload(SCHEDULE_ID, RECORD_ID, user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.audioFileId").value(SAVED_AUDIO_ID));
            verify(audioStorage).storeEncrypted(any(), any(), any(), any());
        }

        @Test
        @DisplayName("작성 상담사는 200 이고 업로드된다")
        void author_ok() throws Exception {
            upload(SCHEDULE_ID, RECORD_ID, user(AUTHOR_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.audioFileId").value(SAVED_AUDIO_ID))
                .andExpect(content().string(not(containsString(TRANSCRIPT_TEXT))));
            verify(audioStorage).storeEncrypted(any(), any(), any(), any());
            verify(speechToTextService).transcribeAudioAsync(SAVED_AUDIO_ID);
        }
    }

    @Nested
    @DisplayName("GET transcription-status")
    class TranscriptionStatus {

        @Test
        @DisplayName("미인증은 401 이고 전사 본문이 없다")
        void anonymous_unauthorized() throws Exception {
            mockMvc.perform(get(STATUS_URI, AUDIO_WITH_RECORD))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(not(containsString(TRANSCRIPT_TEXT))));
        }

        @Test
        @DisplayName("내담자는 403 이고 전사 본문이 없다")
        void client_forbidden() throws Exception {
            fetchStatus(AUDIO_WITH_RECORD, user(CLIENT_ID, UserRole.CLIENT, TENANT_A))
                .andExpect(status().isForbidden())
                .andExpect(content().string(not(containsString(TRANSCRIPT_TEXT))));
        }

        @Test
        @DisplayName("작성자가 아닌 다른 상담사는 403 이고 전사 본문이 없다 (일지 연결·미연결 모두)")
        void otherConsultant_forbidden() throws Exception {
            for (long audioId : new long[] {AUDIO_WITH_RECORD, AUDIO_WITHOUT_RECORD}) {
                fetchStatus(audioId, user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
                    .andExpect(status().isForbidden())
                    .andExpect(content().string(not(containsString(TRANSCRIPT_TEXT))));
            }
        }

        @Test
        @DisplayName("다른 테넌트 관리자는 403 이고 전사 본문이 없다 (테넌트 없는 조회 미사용)")
        void otherTenantAdmin_forbidden() throws Exception {
            fetchStatus(AUDIO_WITH_RECORD, user(ADMIN_ID, UserRole.ADMIN, TENANT_B))
                .andExpect(status().isForbidden())
                .andExpect(content().string(not(containsString(TRANSCRIPT_TEXT))));
            verify(audioFileRepository, never()).findByIdAndIsDeletedFalse(anyLong());
        }

        @Test
        @DisplayName("같은 테넌트 관리자는 200 + 전사 본문")
        void sameTenantAdmin_ok() throws Exception {
            fetchStatus(AUDIO_WITH_RECORD, user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transcription.text").value(TRANSCRIPT_TEXT));
        }

        @Test
        @DisplayName("작성 상담사는 200 + 전사 본문 (일지 연결·미연결 모두)")
        void author_ok() throws Exception {
            for (long audioId : new long[] {AUDIO_WITH_RECORD, AUDIO_WITHOUT_RECORD}) {
                fetchStatus(audioId, user(AUTHOR_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.transcription.text").value(TRANSCRIPT_TEXT));
            }
        }

        private ResultActions fetchStatus(long audioId, User caller) throws Exception {
            return perform(get(STATUS_URI, audioId), caller);
        }
    }

    // ---- helpers ----

    private void assertNotStored() throws Exception {
        verify(audioStorage, never()).storeEncrypted(any(), any(), any(), any());
        verify(audioFileRepository, never()).save(any());
        verify(speechToTextService, never()).transcribeAudioAsync(any());
    }

    private ResultActions upload(long scheduleId, Long recordId, User caller) throws Exception {
        MockHttpServletRequestBuilder builder = multipart(UPLOAD_URI, scheduleId).file(audioPart());
        if (recordId != null) {
            builder = builder.param("consultationRecordId", String.valueOf(recordId));
        }
        return perform(builder, caller);
    }

    private ResultActions perform(MockHttpServletRequestBuilder builder, User caller) throws Exception {
        return mockMvc.perform(builder.session(session(caller)).with(r -> {
            TenantContextHolder.setTenantId(caller.getTenantId());
            return r;
        }));
    }

    private static MockMultipartFile audioPart() {
        return new MockMultipartFile("file", "session.mp3", MIME_TYPE,
            "fake-audio".getBytes(StandardCharsets.UTF_8));
    }

    private static User user(long id, UserRole role, String tenantId) {
        User u = new User();
        u.setId(id);
        u.setUserId("u-" + id);
        u.setRole(role);
        u.setTenantId(tenantId);
        return u;
    }

    private static MockHttpSession session(User u) {
        MockHttpSession s = new MockHttpSession();
        s.setAttribute(SessionConstants.USER_OBJECT, u);
        s.setAttribute(SessionConstants.TENANT_ID, u.getTenantId());
        return s;
    }

    private static Schedule schedule(long id) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(TENANT_A);
        schedule.setConsultantId(AUTHOR_CONSULTANT);
        schedule.setClientId(CLIENT_ID);
        return schedule;
    }

    private static ConsultationRecord record(long id, long scheduleId) {
        ConsultationRecord r = new ConsultationRecord();
        r.setId(id);
        r.setTenantId(TENANT_A);
        r.setConsultantId(AUTHOR_CONSULTANT);
        r.setClientId(CLIENT_ID);
        r.setConsultationId(scheduleId);
        r.setSessionDate(LocalDate.of(2026, 10, 1));
        r.setSessionNumber(1);
        r.setIsDeleted(false);
        return r;
    }

    private static ConsultationAudioFile audioFile(long id, Long recordId) {
        ConsultationAudioFile file = ConsultationAudioFile.builder()
            .consultationId(SCHEDULE_ID).consultationRecordId(recordId)
            .fileName("session.mp3").filePath("stored-audio.enc").fileSizeBytes(1L).mimeType(MIME_TYPE)
            .uploadStatus("UPLOADED").transcriptionStatus("COMPLETED").tenantId(TENANT_A).build();
        file.setId(id);
        return file;
    }

    private static AudioTranscription transcription(long audioFileId) {
        return AudioTranscription.builder()
            .id(audioFileId + 1)
            .audioFileId(audioFileId)
            .transcriptionText(TRANSCRIPT_TEXT)
            .confidenceScore(BigDecimal.TEN)
            .processingTimeMs(1000)
            .build();
    }

    private static <T> T build(Class<T> type, Object... provided) throws Exception {
        Constructor<?> ctor = Arrays.stream(type.getDeclaredConstructors())
            .max(Comparator.comparingInt(Constructor::getParameterCount))
            .orElseThrow();
        Object[] args = Arrays.stream(ctor.getParameterTypes())
            .map(p -> Arrays.stream(provided).filter(p::isInstance).findFirst().orElseGet(() -> mock(p)))
            .toArray();
        ctor.setAccessible(true);
        return type.cast(ctor.newInstance(args));
    }
}
