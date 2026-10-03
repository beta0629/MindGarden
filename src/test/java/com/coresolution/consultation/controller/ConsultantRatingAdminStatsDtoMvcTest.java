package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantRating;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.impl.ConsultantRatingServiceImpl;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * PR 1401 후속 — 평가 관리자 통계 권한·테넌트 범위, 상담사 평가 목록 공개 DTO.
 *
 * <p>{@code GET /api/v1/ratings/admin/statistics} 는 로그인만 하면 누구나 호출할 수 있었고 총 평가 수가
 * 전 테넌트 {@code count()} 였다. {@code GET /api/v1/ratings/consultant/{id}} 는 평가 엔티티(내담자
 * User 포함)를 직렬화해 데이터가 있으면 500, 고치면 내담자 개인정보가 노출되는 구조였다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("평가 관리자 통계 권한 · 상담사 평가 공개 DTO")
class ConsultantRatingAdminStatsDtoMvcTest {

    private static final String TENANT_A = "tenant-rating-a";
    private static final String TENANT_B = "tenant-rating-b";
    private static final long CLIENT_ID = 20L;
    private static final long CLIENT_WRITER_ID = 21L;
    private static final long CONSULTANT_ID = 30L;
    private static final long ADMIN_ID = 1L;
    private static final long STAFF_ID = 2L;
    private static final long ADMIN_B_ID = 900L;

    private static final String WRITER_NAME = "김민수";
    private static final String WRITER_EMAIL = "writer-pii@example.test";
    private static final String WRITER_PHONE = "01099998888";

    private static final String ADMIN_STATS_URI = "/api/v1/ratings/admin/statistics";
    private static final String CONSULTANT_RATINGS_URI = "/api/v1/ratings/consultant/" + CONSULTANT_ID;
    private static final String CONSULTANT_STATS_URI = CONSULTANT_RATINGS_URI + "/stats";

    private ConsultantRatingRepository ratingRepository;
    private UserRepository userRepository;
    private ConsultantClientMappingRepository mappingRepository;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        ratingRepository = mock(ConsultantRatingRepository.class);
        userRepository = mock(UserRepository.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        PersonalDataEncryptionUtil encryptionUtil = mock(PersonalDataEncryptionUtil.class);
        when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.maskName(any())).thenCallRealMethod();

        ConsultantRatingServiceImpl ratingService = new ConsultantRatingServiceImpl(ratingRepository,
            mock(ScheduleRepository.class), userRepository, new ObjectMapper(),
            mock(RealTimeStatisticsService.class), mock(BranchService.class),
            mock(UserPersonalDataCacheService.class), encryptionUtil);
        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(mappingRepository, userRepository);
        ConsultantRatingController controller = new ConsultantRatingController(ratingService, clientGuard,
            mock(ResourceOwnerAccessGuard.class));

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        ConsultantRating named = rating(TENANT_A, 500L, 5, false, ConsultantRating.RatingStatus.ACTIVE);
        ConsultantRating anonymous = rating(TENANT_A, 501L, 4, true, ConsultantRating.RatingStatus.ACTIVE);
        ConsultantRating deleted = rating(TENANT_A, 502L, 1, false, ConsultantRating.RatingStatus.DELETED);
        when(ratingRepository.findByTenantId(TENANT_A)).thenReturn(List.of(named, anonymous, deleted));
        when(ratingRepository.findByTenantId(TENANT_B)).thenReturn(List.of());
        when(ratingRepository.findByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc(eq(TENANT_A),
                eq(CONSULTANT_ID), eq(ConsultantRating.RatingStatus.ACTIVE), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(named, anonymous)));
        when(ratingRepository.findTop10ByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc(eq(TENANT_A),
                eq(CONSULTANT_ID), eq(ConsultantRating.RatingStatus.ACTIVE), any(Pageable.class)))
            .thenReturn(List.of(named, anonymous));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    // ---- 관리자 통계 ----

    @Test
    @DisplayName("관리자 통계 — 내담자 403, 통계 미조회")
    void adminStats_client_forbidden() throws Exception {
        call(ADMIN_STATS_URI, user(CLIENT_ID, UserRole.CLIENT, TENANT_A), TENANT_A)
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(ClientPathAccessGuard.DENIAL_MANAGER_ONLY))
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(ratingRepository);
    }

    @Test
    @DisplayName("관리자 통계 — 상담사 403")
    void adminStats_consultant_forbidden() throws Exception {
        call(ADMIN_STATS_URI, user(CONSULTANT_ID, UserRole.CONSULTANT, TENANT_A), TENANT_A)
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(ratingRepository);
    }

    @Test
    @DisplayName("관리자 통계 — 같은 테넌트 관리자 200, 활성 평가만 테넌트 범위로 집계 (전 테넌트 count 미사용)")
    void adminStats_sameTenantAdmin_tenantScoped() throws Exception {
        call(ADMIN_STATS_URI, user(ADMIN_ID, UserRole.ADMIN, TENANT_A), TENANT_A)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalRatings").value(2))
            .andExpect(jsonPath("$.data.averageScore").value(4.5));
        verify(ratingRepository, never()).count();
        verify(ratingRepository, never()).findByTenantId(TENANT_B);
    }

    @Test
    @DisplayName("관리자 통계 — 같은 테넌트 사무원 200")
    void adminStats_sameTenantStaff_ok() throws Exception {
        call(ADMIN_STATS_URI, user(STAFF_ID, UserRole.STAFF, TENANT_A), TENANT_A)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalRatings").value(2));
    }

    @Test
    @DisplayName("관리자 통계 — 다른 테넌트 관리자가 A 컨텍스트로 호출 403 / 자기 테넌트는 A 데이터 없이 0")
    void adminStats_otherTenantAdmin_forbiddenOrEmpty() throws Exception {
        User adminB = user(ADMIN_B_ID, UserRole.ADMIN, TENANT_B);
        call(ADMIN_STATS_URI, adminB, TENANT_A)
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(ClientPathAccessGuard.DENIAL_OTHER_TENANT))
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(ratingRepository);

        call(ADMIN_STATS_URI, adminB, TENANT_B)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalRatings").value(0));
        verify(ratingRepository, never()).findByTenantId(TENANT_A);
        verify(ratingRepository, never()).count();
    }

    @Test
    @DisplayName("관리자 통계 — 미인증 401")
    void adminStats_unauthenticated() throws Exception {
        mockMvc.perform(get(ADMIN_STATS_URI))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(ratingRepository);
    }

    // ---- 상담사 평가 목록 (공개 DTO) ----

    @Test
    @DisplayName("상담사 평가 목록 — 데이터 있을 때 200, 내담자 id·이메일·전화·실명 없음, 마스킹/익명 표시")
    void consultantRatings_withData_noClientPii() throws Exception {
        String body = call(CONSULTANT_RATINGS_URI, user(CLIENT_ID, UserRole.CLIENT, TENANT_A), TENANT_A)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalElements").value(2))
            .andExpect(jsonPath("$.data.ratings[0].id").value(500))
            .andExpect(jsonPath("$.data.ratings[0].heartScore").value(5))
            .andExpect(jsonPath("$.data.ratings[0].comment").value("좋았어요"))
            .andExpect(jsonPath("$.data.ratings[0].tags[0]").value("친절해요"))
            .andExpect(jsonPath("$.data.ratings[0].clientName").value("김*수"))
            .andExpect(jsonPath("$.data.ratings[0].ratedAt").exists())
            .andExpect(jsonPath("$.data.ratings[0].client").doesNotExist())
            .andExpect(jsonPath("$.data.ratings[0].consultant").doesNotExist())
            .andExpect(jsonPath("$.data.ratings[0].schedule").doesNotExist())
            .andExpect(jsonPath("$.data.ratings[0].tenantId").doesNotExist())
            .andExpect(jsonPath("$.data.ratings[1].clientName").value("익명"))
            .andReturn().getResponse().getContentAsString();
        assertNoWriterPii(body);
        verify(ratingRepository).findByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc(eq(TENANT_A),
            eq(CONSULTANT_ID), eq(ConsultantRating.RatingStatus.ACTIVE), any(Pageable.class));
    }

    @Test
    @DisplayName("상담사 평가 목록 — 다른 테넌트 컨텍스트에서는 A 테넌트 평가가 나오지 않음")
    void consultantRatings_otherTenant_empty() throws Exception {
        when(ratingRepository.findByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc(eq(TENANT_B),
                eq(CONSULTANT_ID), any(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of()));
        call(CONSULTANT_RATINGS_URI, user(ADMIN_B_ID, UserRole.ADMIN, TENANT_B), TENANT_B)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalElements").value(0));
        verify(ratingRepository, never()).findByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc(
            eq(TENANT_A), any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("상담사 평가 통계 recentRatings — 같은 공개 DTO (실명·연락처 없음)")
    void consultantStats_recentRatings_noClientPii() throws Exception {
        String body = call(CONSULTANT_STATS_URI, user(CLIENT_ID, UserRole.CLIENT, TENANT_A), TENANT_A)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.recentRatings[0].clientName").value("김*수"))
            .andExpect(jsonPath("$.data.recentRatings[0].tags[0]").value("친절해요"))
            .andExpect(jsonPath("$.data.recentRatings[1].clientName").value("익명"))
            .andExpect(jsonPath("$.data.recentRatings[0].client").doesNotExist())
            .andReturn().getResponse().getContentAsString();
        assertNoWriterPii(body);
    }

    @Test
    @DisplayName("반례 — 한 글자 이름은 마스킹이 안 되므로 실명 대신 익명 라벨")
    void consultantRatings_singleCharName_notExposed() throws Exception {
        ConsultantRating single = rating(TENANT_A, 503L, 3, false, ConsultantRating.RatingStatus.ACTIVE);
        single.getClient().setName("홍");
        when(ratingRepository.findByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc(eq(TENANT_A),
                eq(CONSULTANT_ID), any(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(single)));
        call(CONSULTANT_RATINGS_URI, user(CLIENT_ID, UserRole.CLIENT, TENANT_A), TENANT_A)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.ratings[0].clientName").value("익명"));
    }

    // ---- helpers ----

    private static void assertNoWriterPii(String body) {
        assertThat(body)
            .doesNotContain(WRITER_NAME)
            .doesNotContain(WRITER_EMAIL)
            .doesNotContain(WRITER_PHONE)
            .doesNotContain("clientId")
            .doesNotContain("\"email\"")
            .doesNotContain("\"phone\"");
    }

    private ResultActions call(String uri, User caller, String contextTenantId) throws Exception {
        MockHttpServletRequestBuilder builder = get(uri).session(session(caller)).with(r -> {
            TenantContextHolder.setTenantId(contextTenantId);
            return r;
        });
        return mockMvc.perform(builder);
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

    private static ConsultantRating rating(String tenantId, long id, int score, boolean anonymous,
            ConsultantRating.RatingStatus status) {
        User writer = user(CLIENT_WRITER_ID, UserRole.CLIENT, tenantId);
        writer.setName(WRITER_NAME);
        writer.setEmail(WRITER_EMAIL);
        writer.setPhone(WRITER_PHONE);
        User consultant = user(CONSULTANT_ID, UserRole.CONSULTANT, tenantId);
        consultant.setName("상담사");
        return ConsultantRating.builder()
            .id(id)
            .tenantId(tenantId)
            .client(writer)
            .consultant(consultant)
            .heartScore(score)
            .comment("좋았어요")
            .ratingTags("[\"친절해요\"]")
            .isAnonymous(anonymous)
            .status(status)
            .ratedAt(LocalDateTime.now().minusHours(1))
            .build();
    }
}
