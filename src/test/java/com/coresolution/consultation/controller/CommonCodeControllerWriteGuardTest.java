package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommonCodePermissionService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 공통코드 쓰기 API(toggle-status, deactivate, batch) 로그인·권한 가드 단위 테스트.
 *
 * <p>권한 규칙 자체(코어는 HQ만, 테넌트는 해당 테넌트 관리자만)는
 * {@link CommonCodePermissionService} 가 담당하므로 여기서는 호출·차단 여부만 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommonCodeController 쓰기 가드")
class CommonCodeControllerWriteGuardTest {

    private static final String TENANT = "tenant-guard-test";
    private static final Long CODE_ID = 77L;

    @Mock
    private CommonCodeService commonCodeService;

    @Mock
    private CommonCodePermissionService permissionService;

    @InjectMocks
    private CommonCodeController controller;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    private static MockHttpSession loggedInSession() {
        User user = new User();
        user.setId(1L);
        user.setTenantId(TENANT);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }

    private static CommonCode tenantCode() {
        CommonCode code = CommonCode.builder().codeGroup("G").codeValue("V").codeLabel("L")
            .koreanName("K").build();
        code.setTenantId(TENANT);
        return code;
    }

    @Test
    @DisplayName("toggle-status: 비로그인은 거부하고 토글하지 않는다")
    void toggleStatus_anonymous_denied() {
        assertThrows(AccessDeniedException.class, () -> controller.toggleStatus(CODE_ID, new MockHttpSession()));
        verify(commonCodeService, never()).toggleCommonCodeStatus(any());
    }

    @Test
    @DisplayName("toggle-status: 권한 없는 사용자(타 테넌트 관리자 포함)는 거부한다")
    void toggleStatus_withoutPermission_denied() {
        CommonCode code = tenantCode();
        when(commonCodeService.getCommonCodeById(CODE_ID)).thenReturn(code);
        when(permissionService.canUpdateCode(any(User.class), eq(code))).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> controller.toggleStatus(CODE_ID, loggedInSession()));
        verify(commonCodeService, never()).toggleCommonCodeStatus(any());
    }

    @Test
    @DisplayName("toggle-status: 권한 있는 관리자는 토글된다")
    void toggleStatus_withPermission_succeeds() {
        CommonCode code = tenantCode();
        when(commonCodeService.getCommonCodeById(CODE_ID)).thenReturn(code);
        when(permissionService.canUpdateCode(any(User.class), eq(code))).thenReturn(true);
        when(commonCodeService.toggleCommonCodeStatus(CODE_ID)).thenReturn(code);

        assertEquals(200, controller.toggleStatus(CODE_ID, loggedInSession()).getStatusCode().value());
        verify(commonCodeService).toggleCommonCodeStatus(CODE_ID);
    }

    @Test
    @DisplayName("deactivate: 비로그인은 거부한다")
    void deactivate_anonymous_denied() {
        TenantContextHolder.setTenantId(TENANT);
        assertThrows(AccessDeniedException.class,
            () -> controller.deactivateCommonCodes(Map.of("codeValues", List.of("V")), new MockHttpSession()));
        verify(commonCodeService, never()).deactivateCommonCodes(anyString(), anyList());
    }

    @Test
    @DisplayName("deactivate: 테넌트 컨텍스트가 없으면 거부한다")
    void deactivate_withoutTenant_denied() {
        assertThrows(AccessDeniedException.class,
            () -> controller.deactivateCommonCodes(Map.of("codeValues", List.of("V")), loggedInSession()));
        verify(commonCodeService, never()).deactivateCommonCodes(anyString(), anyList());
    }

    @Test
    @DisplayName("deactivate: 해당 테넌트 관리자가 아니면 거부한다")
    void deactivate_withoutPermission_denied() {
        TenantContextHolder.setTenantId(TENANT);
        when(permissionService.canUpdateTenantCode(any(User.class), eq(TENANT))).thenReturn(false);

        assertThrows(AccessDeniedException.class,
            () -> controller.deactivateCommonCodes(Map.of("codeValues", List.of("V")), loggedInSession()));
        verify(commonCodeService, never()).deactivateCommonCodes(anyString(), anyList());
    }

    @Test
    @DisplayName("deactivate: 정상 관리자는 현재 테넌트 범위로만 호출된다")
    void deactivate_withPermission_usesCurrentTenantOnly() {
        TenantContextHolder.setTenantId(TENANT);
        when(permissionService.canUpdateTenantCode(any(User.class), eq(TENANT))).thenReturn(true);
        when(commonCodeService.deactivateCommonCodes(TENANT, List.of("V"))).thenReturn(1);

        assertEquals(200,
            controller.deactivateCommonCodes(Map.of("codeValues", List.of("V")), loggedInSession())
                .getStatusCode().value());
        verify(commonCodeService).deactivateCommonCodes(TENANT, List.of("V"));
    }

    @Test
    @DisplayName("batch: 비로그인은 거부하고 생성하지 않는다")
    void batch_anonymous_denied() {
        List<CommonCodeCreateRequest> requests = List.of(CommonCodeCreateRequest.builder().build());
        assertThrows(AccessDeniedException.class, () -> controller.createBatch(requests, new MockHttpSession()));
        verify(commonCodeService, never()).create(any(), anyString());
    }

    @Test
    @DisplayName("batch: 한 건이라도 생성 권한이 없으면 전체를 거부한다")
    void batch_withoutPermission_deniedBeforeAnyCreate() {
        CommonCodeCreateRequest allowed = CommonCodeCreateRequest.builder().tenantId(TENANT).build();
        CommonCodeCreateRequest core = CommonCodeCreateRequest.builder().build();
        when(permissionService.canCreateCode(any(User.class), eq(TENANT))).thenReturn(true);
        when(permissionService.canCreateCode(any(User.class), isNull())).thenReturn(false);

        assertThrows(AccessDeniedException.class,
            () -> controller.createBatch(List.of(allowed, core), loggedInSession()));
        verify(commonCodeService, never()).create(any(), anyString());
    }

    @Test
    @DisplayName("batch: 권한 있는 관리자는 생성된다")
    void batch_withPermission_creates() {
        CommonCodeCreateRequest request = CommonCodeCreateRequest.builder().tenantId(TENANT).build();
        when(permissionService.canCreateCode(any(User.class), eq(TENANT))).thenReturn(true);

        assertEquals(201, controller.createBatch(List.of(request), loggedInSession()).getStatusCode().value());
        verify(commonCodeService).create(eq(request), eq("1"));
    }
}
