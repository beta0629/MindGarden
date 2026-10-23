package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.SessionManagementConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * Access 토큰 폐기 request attribute 마커.
 *
 * @author MindGarden
 * @since 2026-10-22
 */
@DisplayName("AccessTokenRevocationRequestMarker")
class AccessTokenRevocationRequestMarkerTest {

    @Test
    @DisplayName("mark 후 isMarked true, 속성 키는 상수")
    void mark_setsConstantAttribute() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        AccessTokenRevocationRequestMarker.mark(request);

        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        assertThat(request.getAttribute(SessionManagementConstants.REQUEST_ATTR_ACCESS_TOKEN_REVOKED))
                .isEqualTo(Boolean.TRUE);
    }

    @Test
    @DisplayName("미표시 요청은 isMarked false")
    void unmarked_isFalse() {
        assertThat(AccessTokenRevocationRequestMarker.isMarked(new MockHttpServletRequest())).isFalse();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(null)).isFalse();
    }
}
