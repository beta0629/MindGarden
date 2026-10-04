package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.entity.CssThemeMetadata;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.service.CssThemeService;
import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.OpsAccessGuard;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * CSS 테마 쓰기 API 가드 회귀 — 테마는 테넌트 컬럼이 없는 플랫폼 공용 자원이므로 저장·삭제는 본사 Ops 운영자만.
 * 미인증 401, 내담자·상담사·사무원·기관 관리자(같은/다른 기관)·외부 기관 Ops 403(공통 메시지), 거부 시 서비스 미호출.
 * 조회(GET)는 인증 없이 200.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("CssThemeController — 쓰기 본사 Ops 전용 / 조회 공개")
class CssThemeControllerWriteGuardMvcTest {

    private static final String BASE = "/api/v1/admin/css-themes";
    private static final String THEME = "probe-theme";
    private static final String TENANT_A = "tenant-css-theme-a";
    private static final String TENANT_B = "tenant-css-theme-b";
    private static final String HQ_TENANT = "tenant-css-theme-hq";
    private static final String METADATA_BODY = "{\"themeName\":\"" + THEME + "\",\"displayName\":\"probe\"}";
    private static final String COLORS_BODY = "[{\"colorKey\":\"primary\",\"colorValue\":\"probe\"}]";

    private CssThemeService cssThemeService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        cssThemeService = mock(CssThemeService.class);
        OpsTenantConstants constants = new OpsTenantConstants();
        ReflectionTestUtils.setField(constants, "hqTenantId", HQ_TENANT);
        mockMvc = MockMvcBuilders.standaloneSetup(
                new CssThemeController(cssThemeService, new OpsAccessGuard(constants)))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증(인증 없음·익명 토큰) — 쓰기 3종 401, 서비스 미호출")
    void unauthenticated_unauthorized() throws Exception {
        for (MockHttpServletRequestBuilder write : writes()) {
            mockMvc.perform(write).andExpect(status().isUnauthorized());
        }
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken(
            "anon", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));
        for (MockHttpServletRequestBuilder write : writes()) {
            mockMvc.perform(write).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(cssThemeService);
    }

    @Test
    @DisplayName("내담자·상담사·사무원·같은 기관 관리자·다른 기관 관리자·외부 기관 Ops — 쓰기 403(공통 메시지), 서비스 미호출")
    void nonHqOps_forbidden() throws Exception {
        Object[][] callers = {
            {"ROLE_CLIENT", TENANT_A},
            {"ROLE_CONSULTANT", TENANT_A},
            {SecurityRoleConstants.ROLE_STAFF, TENANT_A},
            {SecurityRoleConstants.ROLE_ADMIN, TENANT_A},
            {SecurityRoleConstants.ROLE_ADMIN, TENANT_B},
            {SecurityRoleConstants.ROLE_OPS, TENANT_B},
            {SecurityRoleConstants.ROLE_ADMIN, HQ_TENANT},
        };
        for (Object[] caller : callers) {
            authenticate((String) caller[0], (String) caller[1]);
            for (MockHttpServletRequestBuilder write : writes()) {
                mockMvc.perform(write)
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value(OpsAccessGuard.DENIAL_HQ_OPS_ONLY))
                    .andExpect(jsonPath("$.data").doesNotExist());
            }
        }
        verifyNoInteractions(cssThemeService);
    }

    @Test
    @DisplayName("본사 Ops — 쓰기 3종 통과, 서비스 호출")
    void hqOps_allowed() throws Exception {
        authenticate(SecurityRoleConstants.ROLE_OPS, HQ_TENANT);
        when(cssThemeService.saveThemeMetadata(any())).thenReturn(new CssThemeMetadata());
        when(cssThemeService.saveThemeColors(anyString(), anyList())).thenReturn(List.of());
        when(cssThemeService.isThemeExists(THEME)).thenReturn(true);
        for (MockHttpServletRequestBuilder write : writes()) {
            mockMvc.perform(write).andExpect(status().is2xxSuccessful());
        }
        verify(cssThemeService).saveThemeMetadata(any());
        verify(cssThemeService).saveThemeColors(anyString(), anyList());
        verify(cssThemeService).deleteTheme(THEME);
    }

    @Test
    @DisplayName("조회(GET) — 인증 없이 200, 쓰기 서비스 미호출")
    void reads_public() throws Exception {
        when(cssThemeService.getAllActiveThemes()).thenReturn(List.of());
        when(cssThemeService.getDefaultTheme()).thenReturn(Optional.of(new CssThemeMetadata()));
        when(cssThemeService.isThemeExists(THEME)).thenReturn(true);
        when(cssThemeService.getThemeColors(THEME)).thenReturn(Map.of());
        for (String uri : List.of("/themes", "/themes/default", "/themes/" + THEME + "/colors",
                "/themes/" + THEME + "/exists", "/consultant-colors")) {
            mockMvc.perform(get(BASE + uri)).andExpect(status().isOk());
        }
        verify(cssThemeService, never()).saveThemeMetadata(any());
        verify(cssThemeService, never()).deleteTheme(anyString());
    }

    @Test
    @DisplayName("기본 테마 데이터 없음 — 익명 조회 404(500 아님), 응답에 데이터 없음")
    void defaultTheme_missing_notFound() throws Exception {
        when(cssThemeService.getDefaultTheme()).thenReturn(Optional.empty());
        mockMvc.perform(get(BASE + "/themes/default"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    private static List<MockHttpServletRequestBuilder> writes() {
        return List.of(
            post(BASE + "/themes").contentType(MediaType.APPLICATION_JSON).content(METADATA_BODY),
            post(BASE + "/themes/" + THEME + "/colors").contentType(MediaType.APPLICATION_JSON).content(COLORS_BODY),
            delete(BASE + "/themes/" + THEME));
    }

    private static void authenticate(String authority, String tenantId) {
        TenantContextHolder.setTenantId(tenantId);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            "css-theme-guard-test", null, List.of(new SimpleGrantedAuthority(authority))));
    }
}
