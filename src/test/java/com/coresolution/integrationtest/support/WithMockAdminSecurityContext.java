package com.coresolution.integrationtest.support;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.security.test.context.support.WithMockUser;

/**
 * PR-3d (B8 보안 회귀 정합화) — 통합 테스트 SSOT 인증 컨텍스트 메타 어노테이션 (ADMIN).
 *
 * <p><strong>왜 메타 어노테이션인가</strong>: PR-3a 에서 11 개 Admin 영역 컨트롤러에
 * 클래스 레벨 {@code @PreAuthorize("isAuthenticated()")} fallback 가드를 추가했다.
 * 이후 {@link org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
 * @AutoConfigureMockMvc(addFilters = false)} 를 사용하던 통합 테스트는 Spring Security
 * 필터 체인을 우회하지만 {@code @EnableMethodSecurity} 의 AOP 인터셉터는 우회되지 않아
 * SecurityContext 에 인증 객체가 없으면 {@code AuthenticationCredentialsNotFoundException}
 * → HTTP 401 회귀가 발생한다 (PR-3a 14건).</p>
 *
 * <p><strong>사용</strong>: 영향받는 통합 테스트 클래스에 본 어노테이션을 부착하면 Spring
 * Security Test 가 매 테스트 직전 {@code UsernamePasswordAuthenticationToken} 을
 * SecurityContext 에 설정하여 {@code isAuthenticated()} 가 통과한다. 메서드 본문에서
 * inline 권한 체크(예: {@code AdminRoleUtils#isAdmin}, {@code DynamicPermissionService})
 * 를 사용하는 컨트롤러는 별도 세션 속성이나 권한 mock 을 그대로 추가하면 된다.</p>
 *
 * <p>본 어노테이션은 {@code @WithMockUser(roles = {"ADMIN"})} 의 의미적 alias 다.
 * 다른 역할이 필요한 경우 {@link WithMockConsultantSecurityContext} 등 별도 alias 사용.</p>
 *
 * @author MindGarden
 * @since 2026-06-14
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@WithMockUser(username = "test-admin@mindgarden.com", roles = {"ADMIN"})
public @interface WithMockAdminSecurityContext {
}
