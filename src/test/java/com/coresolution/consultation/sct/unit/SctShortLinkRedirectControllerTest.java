package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.controller.SctShortLinkRedirectController;
import com.coresolution.consultation.sct.service.SctShortLinkService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * 단축 링크 컨트롤러 — Location에 초대 평문 토큰 없음.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@ExtendWith(MockitoExtension.class)
class SctShortLinkRedirectControllerTest {

    @Mock
    private SctShortLinkService sctShortLinkService;

    @InjectMocks
    private SctShortLinkRedirectController controller;

    @Test
    @DisplayName("302 Location은 교환 경로·평문 토큰 미포함")
    void redirect_locationUsesExchangePath() {
        when(sctShortLinkService.resolveRedirectPath("k9P2mX"))
                .thenReturn(SctConstants.PUBLIC_SCT_WEB_PREFIX + "opaqueExchangeOnly");

        ResponseEntity<Void> response = controller.redirect("k9P2mX");

        assertEquals(HttpStatus.FOUND, response.getStatusCode());
        assertEquals(
                SctConstants.PUBLIC_SCT_WEB_PREFIX + "opaqueExchangeOnly",
                response.getHeaders().getLocation().toString());
        assertFalse(response.getHeaders().getLocation().toString().contains("invitation"));
    }

    @Test
    @DisplayName("미존재도 302 invalid — 상태 코드 동일")
    void redirect_invalidAlso302() {
        when(sctShortLinkService.resolveRedirectPath("zzzzzz"))
                .thenReturn(SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH);

        ResponseEntity<Void> response = controller.redirect("zzzzzz");
        assertEquals(HttpStatus.FOUND, response.getStatusCode());
        assertEquals(
                SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH,
                response.getHeaders().getLocation().toString());
    }
}
