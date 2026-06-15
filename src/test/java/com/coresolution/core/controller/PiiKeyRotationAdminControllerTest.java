package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.coresolution.consultation.dto.security.PiiRotationResult;
import com.coresolution.consultation.entity.PiiReencryptionProgress.Status;
import com.coresolution.consultation.service.PersonalDataKeyRotationService;

/**
 * {@link PiiKeyRotationAdminController} 단위 테스트.
 *
 * <p>standalone {@link MockMvc} 로 4개 엔드포인트의 입력 파싱·서비스 dispatch·응답 페이로드를
 * 검증한다. 응답에 평문 / 암호문 PII 가 절대 포함되지 않음을 정규식으로 확인한다.</p>
 *
 * <p>{@code @PreAuthorize} 의 권한 가드는 standalone MockMvc 가 적용하지 않으므로, 본 테스트는
 * 별도의 reflection 검증으로 어노테이션이 클래스 레벨에 부착되어 있음을 확인한다 (security 통합
 * 테스트는 후속 PR 에서 통합 환경으로 추가 권장).</p>
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PiiKeyRotationAdminController 단위 테스트 — 4 endpoints + PII 비노출")
class PiiKeyRotationAdminControllerTest {

    /** PII 평문 / 암호문 의심 패턴 — 응답 본문에 포함되면 즉시 실패. */
    private static final Pattern PII_LEAK_PATTERN = Pattern.compile(
        "(?i)(@example\\.com|@gmail\\.com|password|rrn=|\\d{6}-\\d{7}|\\d{3}-\\d{4}-\\d{4}|"
        + "[a-zA-Z0-9+/]{40,}={0,2})");

    @Mock
    private PersonalDataKeyRotationService rotationService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        PiiKeyRotationAdminController controller = new PiiKeyRotationAdminController(rotationService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("@PreAuthorize 가드가 클래스 레벨에 ADMIN 로 부착되어 있다 (ROLE_STANDARD SSOT)")
    void classLevelPreAuthorize_isAdmin() {
        PreAuthorize annotation = PiiKeyRotationAdminController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).as("@PreAuthorize 어노테이션이 클래스 레벨에 부착되어 있어야 한다").isNotNull();
        assertThat(annotation.value())
            .as("ROLE_STANDARD.md §3.1 — 레거시 HQ_MASTER 비교 금지, ADMIN 통합 매핑 사용")
            .contains("ADMIN")
            .doesNotContain("HQ_MASTER");
    }

    @Test
    @DisplayName("POST /start — users 회전 dispatch + 응답에 PII 평문 비포함")
    void startEndpoint_dispatchesUsers_noPiiInResponse() throws Exception {
        PiiRotationResult result = PiiRotationResult.builder()
            .tableName("users")
            .chunksProcessed(2)
            .chunksDone(2)
            .chunksFailed(0)
            .rowsScanned(10)
            .rowsRotated(10)
            .activeKeyId("v2")
            .targetKeyId("v2")
            .build();
        when(rotationService.rotateUserPersonalData(eq(50), eq("v2"))).thenReturn(result);

        MvcResult mvc = mockMvc.perform(post("/api/v1/admin/pii-rotation/start")
                .param("table", "users")
                .param("target_key_id", "v2")
                .param("chunk_size", "50"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.tableName").value("users"))
            .andExpect(jsonPath("$.data.chunksProcessed").value(2))
            .andExpect(jsonPath("$.data.rowsRotated").value(10))
            .andExpect(jsonPath("$.data.activeKeyId").value("v2"))
            .andReturn();

        String body = mvc.getResponse().getContentAsString();
        assertThat(PII_LEAK_PATTERN.matcher(body).find())
            .as("응답 본문에 PII 평문/암호문이 포함되면 안 된다 — body=%s", body)
            .isFalse();
        verify(rotationService).rotateUserPersonalData(50, "v2");
    }

    @Test
    @DisplayName("POST /start — chunk_size 미지정 시 default 100 으로 dispatch")
    void startEndpoint_defaultChunkSize() throws Exception {
        PiiRotationResult result = PiiRotationResult.builder()
            .tableName("clients").chunksProcessed(0).chunksDone(0).chunksFailed(0)
            .rowsScanned(0).rowsRotated(0)
            .activeKeyId("v2").targetKeyId("v2").build();
        when(rotationService.rotateClientPersonalData(eq(100), eq("v2"))).thenReturn(result);

        mockMvc.perform(post("/api/v1/admin/pii-rotation/start")
                .param("table", "clients")
                .param("target_key_id", "v2"))
            .andExpect(status().isOk());

        verify(rotationService).rotateClientPersonalData(100, "v2");
    }

    @Test
    @DisplayName("POST /start — 미지원 table 은 IllegalArgumentException 으로 거부된다")
    void startEndpoint_unsupportedTable_throws() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(post("/api/v1/admin/pii-rotation/start")
                .param("table", "nonexistent_table")
                .param("target_key_id", "v2")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root).isInstanceOf(IllegalArgumentException.class);
                assertThat(root.getMessage()).contains("unsupported table");
            });
    }

    @Test
    @DisplayName("GET /progress — chunk 상태별 카운트가 응답에 포함된다")
    void progressEndpoint_returnsCounts() throws Exception {
        Map<Status, Long> agg = new HashMap<>();
        agg.put(Status.DONE, 67L);
        agg.put(Status.IN_PROGRESS, 1L);
        agg.put(Status.PENDING, 31L);
        agg.put(Status.FAILED, 1L);
        when(rotationService.aggregateProgress("users", "v2")).thenReturn(agg);
        when(rotationService.getActiveKeyId()).thenReturn("v2");

        MvcResult mvc = mockMvc.perform(get("/api/v1/admin/pii-rotation/progress")
                .param("table", "users")
                .param("target_key_id", "v2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.table").value("users"))
            .andExpect(jsonPath("$.data.totalChunks").value(100))
            .andExpect(jsonPath("$.data.done").value(67))
            .andExpect(jsonPath("$.data.inProgress").value(1))
            .andExpect(jsonPath("$.data.pending").value(31))
            .andExpect(jsonPath("$.data.failed").value(1))
            .andExpect(jsonPath("$.data.activeKeyId").value("v2"))
            .andExpect(jsonPath("$.data.targetKeyId").value("v2"))
            .andReturn();

        String body = mvc.getResponse().getContentAsString();
        assertThat(PII_LEAK_PATTERN.matcher(body).find())
            .as("진행률 응답에 PII 평문/암호문이 포함되면 안 된다").isFalse();
    }

    @Test
    @DisplayName("POST /resume — service.resumeFailedChunks 로 dispatch")
    void resumeEndpoint_dispatches() throws Exception {
        PiiRotationResult result = PiiRotationResult.builder()
            .tableName("users").chunksProcessed(1).chunksDone(1).chunksFailed(0)
            .rowsScanned(2).rowsRotated(2)
            .activeKeyId("v2").targetKeyId("v2").build();
        when(rotationService.resumeFailedChunks(
            eq("users"),
            eq(PersonalDataKeyRotationService.USERS_PII_COLUMNS),
            eq("v2"))).thenReturn(result);

        mockMvc.perform(post("/api/v1/admin/pii-rotation/resume")
                .param("table", "users")
                .param("target_key_id", "v2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.chunksDone").value(1))
            .andExpect(jsonPath("$.data.rowsRotated").value(2));
    }

    @Test
    @DisplayName("POST /cancel — 취소된 chunk 개수를 응답에 포함한다")
    void cancelEndpoint_returnsCount() throws Exception {
        when(rotationService.cancelPendingChunks("users", "v2")).thenReturn(5);

        mockMvc.perform(post("/api/v1/admin/pii-rotation/cancel")
                .param("table", "users")
                .param("target_key_id", "v2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.cancelled_chunks").value(5))
            .andExpect(jsonPath("$.data.table").value("users"));
    }

    @Test
    @DisplayName("모든 endpoint 메서드에 매핑이 정의되어 있다 (회귀 차단)")
    void allEndpointsMethodsExist() throws Exception {
        Method start = PiiKeyRotationAdminController.class
            .getDeclaredMethod("start", String.class, String.class, int.class);
        Method progress = PiiKeyRotationAdminController.class
            .getDeclaredMethod("progress", String.class, String.class);
        Method resume = PiiKeyRotationAdminController.class
            .getDeclaredMethod("resume", String.class, String.class);
        Method cancel = PiiKeyRotationAdminController.class
            .getDeclaredMethod("cancel", String.class, String.class);

        assertThat(start).isNotNull();
        assertThat(progress).isNotNull();
        assertThat(resume).isNotNull();
        assertThat(cancel).isNotNull();
    }
}
