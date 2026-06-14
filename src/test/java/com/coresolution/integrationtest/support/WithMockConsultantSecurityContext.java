package com.coresolution.integrationtest.support;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.security.test.context.support.WithMockUser;

/**
 * PR-3d (B8 보안 회귀 정합화) — 통합 테스트 SSOT 인증 컨텍스트 메타 어노테이션 (CONSULTANT).
 *
 * <p>PR-3b 에서 5 개 Consultant/Schedule 영역 컨트롤러에 클래스 레벨
 * {@code @PreAuthorize("isAuthenticated()")} fallback 가드를 추가했다. 본 메타 어노테이션은
 * {@code @WithMockUser(roles = {"CONSULTANT"})} 의 의미적 alias 다.</p>
 *
 * <p>자세한 배경/구현 근거는 {@link WithMockAdminSecurityContext} 의 클래스 javadoc 참조.</p>
 *
 * @author MindGarden
 * @since 2026-06-14
 * @see WithMockAdminSecurityContext
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@WithMockUser(username = "test-consultant@mindgarden.com", roles = {"CONSULTANT"})
public @interface WithMockConsultantSecurityContext {
}
