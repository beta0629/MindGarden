package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.dto.CommonCodeListResponse;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommonCodePermissionService;
import com.coresolution.consultation.service.CommonCodeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;

/**
 * 관리자 공통코드 목록의 비활성 포함 조회와 toggle-status 응답의 isActive 를 검증한다(#1559 B6).
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommonCodeController 관리자 목록 비활성 포함·토글 응답")
class CommonCodeAdminListInactiveTest {

    private static final String TENANT = "tenant-inactive-test";
    private static final String GROUP = "G";
    private static final Long CODE_ID = 88L;

    @Mock
    private CommonCodeService commonCodeService;

    @Mock
    private CommonCodePermissionService permissionService;

    @InjectMocks
    private CommonCodeController controller;

    private static MockHttpSession loggedInSession() {
        User user = new User();
        user.setId(1L);
        user.setTenantId(TENANT);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }

    private static CommonCode activeTenantCode() {
        CommonCode code = CommonCode.builder().codeGroup(GROUP).codeValue("V").codeLabel("L")
            .koreanName("K").build();
        code.setTenantId(TENANT);
        code.setIsActive(true);
        return code;
    }

    @Test
    @DisplayName("목록: 로그인 관리자가 includeInactive=true 로 요청하면 비활성 포함 조회로 위임한다")
    void findAll_loggedIn_includeInactive() {
        when(commonCodeService.findAll(GROUP, true)).thenReturn(CommonCodeListResponse.of(List.of()));
        controller.findAll(GROUP, true, loggedInSession());
        verify(commonCodeService).findAll(GROUP, true);
    }

    @Test
    @DisplayName("목록: 비로그인이면 includeInactive=true 여도 활성만 조회한다")
    void findAll_anonymous_activeOnly() {
        when(commonCodeService.findAll(GROUP, false)).thenReturn(CommonCodeListResponse.of(List.of()));
        controller.findAll(GROUP, true, new MockHttpSession());
        verify(commonCodeService).findAll(GROUP, false);
    }

    @Test
    @DisplayName("테넌트 목록: 로그인 관리자가 includeInactive=true 로 요청하면 비활성 포함 조회로 위임한다")
    void tenantCodes_loggedIn_includeInactive() {
        when(commonCodeService.getCurrentTenantCodesByGroup(GROUP, true)).thenReturn(List.of());
        controller.getTenantCodes(GROUP, true, loggedInSession());
        verify(commonCodeService).getCurrentTenantCodesByGroup(GROUP, true);
    }

    @Test
    @DisplayName("toggle-status: 응답 본문에 바뀐 isActive(false)가 담긴다")
    void toggleStatus_responseCarriesIsActive() {
        CommonCode before = activeTenantCode();
        CommonCode after = activeTenantCode();
        after.setIsActive(false);
        when(commonCodeService.getCommonCodeById(CODE_ID)).thenReturn(before);
        when(permissionService.canUpdateCode(any(User.class), eq(before))).thenReturn(true);
        when(commonCodeService.toggleCommonCodeStatus(CODE_ID)).thenReturn(after);

        CommonCodeResponse body = controller.toggleStatus(CODE_ID, loggedInSession()).getBody().getData();
        assertEquals(Boolean.FALSE, body.getIsActive());
        assertFalse(body.getIsActive());
    }
}
