package com.coresolution.consultation.config;

import com.coresolution.core.constant.PublicApiPathPolicy;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * 비로그인 공개 공통코드 조회(GET, 화이트리스트 그룹만)를 허용하는 {@link RequestMatcher}.
 * 판정 규칙은 {@link PublicApiPathPolicy} 한 곳에 둔다.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public class PublicCommonCodeRequestMatcher implements RequestMatcher {

    @Override
    public boolean matches(HttpServletRequest request) {
        return PublicApiPathPolicy.isPublicCommonCodeRead(request);
    }
}
