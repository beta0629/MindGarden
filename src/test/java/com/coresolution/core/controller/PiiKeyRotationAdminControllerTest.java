package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.coresolution.consultation.dto.security.PiiRotationResult;
import com.coresolution.consultation.entity.PiiReencryptionProgress.Status;
import com.coresolution.consultation.service.PersonalDataKeyRotationService;
import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;

/**
 * {@link PiiKeyRotationAdminController} 단위 테스트.
 *
 * <p>standalone {@link MockMvc} 로 4개 엔드포인트의 입력 파싱·서비스 dispatch·응답 페이로드를
 * 검증한다. 응답에 평문 / 암호문 PII 가 절대 포함되지 않음을 정규식으로 확인한다.</p>
 *
 * <p>옵션 3+1 하이브리드 가드(OPS Authority + HQ 테넌트 자체 검증) 회귀:
 * <ul>
 *   <li>HQ 테넌트 자체 검증 ({@link OpsTenantConstants#isHqTenant(String)}) 은 메서드 진입부
 *       에서 동기 호출되므로 standalone MockMvc 로 직접 200 / 403 회귀 검증 가능.</li>
 *   <li>{@code @PreAuthorize("hasRole('OPS')")} 가드는 standalone MockMvc 가 적용하지 않으므로
 *       reflection 으로 표현식이 클래스 레벨에 부착되어 있고 4종 SSOT 역할이 아닌지 확인한다
 *       (security 통합 테스트는 후속 PR — Phase 1b 머지 후).</li>
 * </ul>
 *
 * <h3>옵션 3+1 하이브리드 회귀 8건 (Phase 1 — ops-portal-migration)</h3>
 * <ol>
 *   <li>ROLE_OPS + HQ 테넌트 → 200</li>
 *   <li>ROLE_OPS + 외부 테넌트 → 403 (AccessDeniedException)</li>
 *   <li>ROLE_ADMIN + HQ 테넌트 → 403 (OPS 권한 없음, @PreAuthorize 가드)</li>
 *   <li>ROLE_ADMIN + 외부 테넌트 → 403</li>
 *   <li>ROLE_STAFF → 403 (Phase 1b 의존 — JwtFilter STAFF→OPS 자동 부여 차단 후 활성화)</li>
 *   <li>ROLE_CONSULTANT → 403</li>
 *   <li>ROLE_CLIENT → 403</li>
 *   <li>무인증 → 401</li>
 * </ol>
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PiiKeyRotationAdminController 단위 테스트 — 4 endpoints + PII 비노출 + 옵션 3+1 가드")
class PiiKeyRotationAdminControllerTest {

    /** PII 평문 / 암호문 의심 패턴 — 응답 본문에 포함되면 즉시 실패. */
    private static final Pattern PII_LEAK_PATTERN = Pattern.compile(
        "(?i)(@example\\.com|@gmail\\.com|password|rrn=|\\d{6}-\\d{7}|\\d{3}-\\d{4}-\\d{4}|"
        + "[a-zA-Z0-9+/]{40,}={0,2})");

    private static final String HQ_TENANT_ID = "hq-tenant-id-for-test";
    private static final String EXTERNAL_TENANT_ID = "external-tenant-uuid-001";

    @Mock
    private PersonalDataKeyRotationService rotationService;

    private OpsTenantConstants opsTenantConstants;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        opsTenantConstants = new OpsTenantConstants();
        injectHqTenantId(opsTenantConstants, HQ_TENANT_ID);
        PiiKeyRotationAdminController controller =
            new PiiKeyRotationAdminController(rotationService, opsTenantConstants);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        TenantContextHolder.setTenantId(HQ_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    /**
     * 환경변수 주입을 거치지 않고 단위 테스트 격리를 위해 {@link OpsTenantConstants#hqTenantId} 를
     * reflection 으로 세팅한다. 운영 코드는 {@code @Value} + {@code @PostConstruct} validate 로
     * 부트 시 fail-fast 한다.
     */
    private static void injectHqTenantId(OpsTenantConstants target, String value) throws Exception {
        Field field = OpsTenantConstants.class.getDeclaredField("hqTenantId");
        field.setAccessible(true);
        field.set(target, value);
    }

    // ------------------------------------------------------------------
    // 기존 회귀 — 4 endpoints + PII 비노출 + @PreAuthorize 부착
    // ------------------------------------------------------------------

    @Test
    @DisplayName("@PreAuthorize 가드가 클래스 레벨에 OPS 로 부착되어 있다 (옵션 3+1 하이브리드)")
    void classLevelPreAuthorize_isOps() {
        PreAuthorize annotation = PiiKeyRotationAdminController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).as("@PreAuthorize 어노테이션이 클래스 레벨에 부착되어 있어야 한다").isNotNull();
        assertThat(annotation.value())
            .as("OPS_PORTAL_MIGRATION_PLAN §6 — Ops Portal 운영자 Authority (ROLE_OPS)")
            .contains("hasRole('OPS')")
            .doesNotContain("ADMIN")
            .doesNotContain("HQ_MASTER")
            .doesNotContain("STAFF")
            .doesNotContain("CONSULTANT")
            .doesNotContain("CLIENT");
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

    // ------------------------------------------------------------------
    // 옵션 3+1 하이브리드 회귀 8건 (ops-portal-migration Phase 1)
    // ------------------------------------------------------------------

    @Test
    @DisplayName("[옵션3+1 #1] ROLE_OPS + HQ 테넌트 → 200 (정상)")
    void hybrid_opsRole_hqTenant_returns200() throws Exception {
        TenantContextHolder.setTenantId(HQ_TENANT_ID);
        PiiRotationResult result = PiiRotationResult.builder()
            .tableName("users").chunksProcessed(0).chunksDone(0).chunksFailed(0)
            .rowsScanned(0).rowsRotated(0)
            .activeKeyId("v2").targetKeyId("v2").build();
        when(rotationService.rotateUserPersonalData(eq(100), eq("v2"))).thenReturn(result);

        mockMvc.perform(post("/api/v1/admin/pii-rotation/start")
                .param("table", "users")
                .param("target_key_id", "v2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("[옵션3+1 #2] ROLE_OPS + 외부 테넌트 → 403 AccessDeniedException (HQ 가드 차단)")
    void hybrid_opsRole_externalTenant_throwsAccessDenied() {
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(post("/api/v1/admin/pii-rotation/start")
                .param("table", "users")
                .param("target_key_id", "v2")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root)
                    .as("HQ 가드는 AccessDeniedException 로 차단해야 한다")
                    .isInstanceOf(AccessDeniedException.class);
                assertThat(root.getMessage())
                    .as("거부 메시지는 외부 테넌트 차단 사유를 명시해야 한다")
                    .contains("본사").contains("외부 테넌트");
            });
    }

    @Test
    @DisplayName("[옵션3+1 #3] ROLE_ADMIN + HQ 테넌트 → 403 (@PreAuthorize OPS 가드)")
    void hybrid_adminRole_hqTenant_blockedByPreAuthorize() {
        // standalone MockMvc 는 @PreAuthorize 를 적용하지 않으므로, 클래스 레벨 가드 표현식이
        // ADMIN 을 허용하지 않음을 reflection 으로 회귀 검증한다 (통합 환경에서는 SecurityFilter 가 403 처리).
        PreAuthorize annotation = PiiKeyRotationAdminController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value())
            .as("ADMIN 은 OPS Authority 미보유 — hasRole('OPS') 표현식이 ADMIN 을 허용하면 안 됨")
            .contains("hasRole('OPS')")
            .doesNotContain("ADMIN");
    }

    @Test
    @DisplayName("[옵션3+1 #4] ROLE_ADMIN + 외부 테넌트 → 403 (이중 차단 — PreAuthorize + HQ 가드)")
    void hybrid_adminRole_externalTenant_doubleBlocked() {
        // 1차: @PreAuthorize 가 ADMIN 차단 (위 #3 검증)
        PreAuthorize annotation = PiiKeyRotationAdminController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).doesNotContain("ADMIN");

        // 2차 (Defense in Depth): @PreAuthorize 우회 가정 시에도 HQ 가드가 외부 테넌트를 차단
        TenantContextHolder.setTenantId(EXTERNAL_TENANT_ID);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
            mockMvc.perform(get("/api/v1/admin/pii-rotation/progress")
                .param("table", "users")
                .param("target_key_id", "v2")))
            .satisfies(e -> {
                Throwable root = e;
                while (root.getCause() != null && root.getCause() != root) {
                    root = root.getCause();
                }
                assertThat(root).isInstanceOf(AccessDeniedException.class);
            });
    }

    @Test
    @DisplayName("[옵션3+1 #5] ROLE_STAFF → 403 (Phase 1b 정정 후 활성화)")
    void hybrid_staffRole_blocked() {
        // Phase 1b 정정 (PR #361, 2026-06-15 develop 머지): JwtAuthenticationFilter#mapAuthorities()
        // 의 case STAFF 분기에서 ROLE_ADMIN/ROLE_OPS 자동 부여를 제거하여 STAFF 가 OPS 권한을
        // 우회 획득하던 P0 권한 상승을 차단.
        //
        // standalone MockMvc 는 @PreAuthorize 를 적용하지 않으므로 단위 단계에서는 두 가지 가드로
        // 회귀를 보장한다 (defense in depth):
        //
        //   1) (이곳) reflection 으로 클래스 레벨 @PreAuthorize 표현식이 STAFF 미허용임을 검증.
        //      → 향후 표현식이 hasAnyRole('OPS','STAFF') 등으로 회귀하면 본 테스트가 즉시 fail.
        //   2) (별도) JwtAuthenticationFilterAuthoritiesTest#staffUser_grantsOnlyRoleStaff_withoutAdminOrOps
        //      가 JwtFilter 단의 권한 매핑이 ROLE_STAFF 만 부여함을 보장.
        //      → @PreAuthorize 가 STAFF 차단을 신뢰할 수 있는 근거.
        //
        // 두 단위 가드의 곱(AND) 이 SecurityMockMvc 통합 시나리오(STAFF 토큰 → 403)와 동등한
        // 회귀 차단 효과를 제공한다.
        PreAuthorize annotation = PiiKeyRotationAdminController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation)
            .as("클래스 레벨 @PreAuthorize 가 누락되면 STAFF 차단 가드가 사라짐")
            .isNotNull();
        assertThat(annotation.value())
            .as("@PreAuthorize 표현식이 STAFF 를 허용하면 Phase 1b P0 권한 상승 회귀")
            .contains("hasRole('OPS')")
            .doesNotContain("STAFF");
    }

    @Test
    @DisplayName("[옵션3+1 #6] ROLE_CONSULTANT → 403 (@PreAuthorize 표현식이 CONSULTANT 미허용)")
    void hybrid_consultantRole_blockedByPreAuthorize() {
        PreAuthorize annotation = PiiKeyRotationAdminController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value())
            .contains("hasRole('OPS')")
            .doesNotContain("CONSULTANT");
    }

    @Test
    @DisplayName("[옵션3+1 #7] ROLE_CLIENT → 403 (@PreAuthorize 표현식이 CLIENT 미허용)")
    void hybrid_clientRole_blockedByPreAuthorize() {
        PreAuthorize annotation = PiiKeyRotationAdminController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value())
            .contains("hasRole('OPS')")
            .doesNotContain("CLIENT");
    }

    @Test
    @DisplayName("[옵션3+1 #8] 무인증 → 401 (클래스 레벨 @PreAuthorize 부착 회귀)")
    void hybrid_anonymous_blockedByPreAuthorize() {
        // 무인증 401 은 Spring Security 통합 필터 체인이 처리. 단위 단계에서는 클래스 레벨
        // @PreAuthorize 부착 자체가 보장되어 있는지 회귀 검증한다 (없으면 anonymous 통과 위험).
        PreAuthorize annotation = PiiKeyRotationAdminController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation)
            .as("클래스 레벨 @PreAuthorize 가 누락되면 무인증 호출이 허용될 위험 — 회귀 차단")
            .isNotNull();
        assertThat(annotation.value()).isNotBlank().contains("hasRole");
    }

    // ------------------------------------------------------------------
    // OpsTenantConstants 기본 동작 회귀
    // ------------------------------------------------------------------

    @Test
    @DisplayName("[OpsTenant] hqTenantId null 주입 시 validate() 가 fail-fast 한다")
    void opsTenantConstants_failFast_whenHqTenantIdMissing() throws Exception {
        OpsTenantConstants bare = new OpsTenantConstants();
        injectHqTenantId(bare, null);
        org.assertj.core.api.Assertions.assertThatThrownBy(bare::validate)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("MINDGARDEN_HQ_TENANT_ID");
    }

    @Test
    @DisplayName("[OpsTenant] hqTenantId 빈 문자열 시 validate() 가 fail-fast 한다")
    void opsTenantConstants_failFast_whenHqTenantIdBlank() throws Exception {
        OpsTenantConstants bare = new OpsTenantConstants();
        injectHqTenantId(bare, "   ");
        org.assertj.core.api.Assertions.assertThatThrownBy(bare::validate)
            .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("[OpsTenant] isHqTenant 는 정확히 일치하는 ID 만 true 를 반환한다")
    void opsTenantConstants_isHqTenant_matchesExactlyOnly() throws Exception {
        OpsTenantConstants constants = new OpsTenantConstants();
        injectHqTenantId(constants, HQ_TENANT_ID);
        constants.validate();

        assertThat(constants.isHqTenant(HQ_TENANT_ID)).isTrue();
        assertThat(constants.isHqTenant(EXTERNAL_TENANT_ID)).isFalse();
        assertThat(constants.isHqTenant(null)).isFalse();
        assertThat(constants.isHqTenant("")).isFalse();
        assertThat(constants.getHqTenantId()).isEqualTo(HQ_TENANT_ID);
    }
}
