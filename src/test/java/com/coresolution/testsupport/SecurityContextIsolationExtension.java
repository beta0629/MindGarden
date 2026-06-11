package com.coresolution.testsupport;

import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Spring Security {@link SecurityContextHolder} 의 ThreadLocal 컨텍스트를
 * 각 테스트 메서드 실행 직후 일괄 정리하는 JUnit 5 Extension.
 *
 * <h2>도입 배경</h2>
 * <p>일부 controller 단위 테스트가 {@code PermissionCheckUtils.checkPermission(...)}
 * 또는 {@code OAuth2Controller#setSpringSecurityAuthentication(...)} 경로를 통과하면서
 * {@code SecurityContextHolder.getContext().setAuthentication(...)} 으로 Authentication 을
 * 주입하지만, {@code @AfterEach} 가 {@code SecurityContextHolder.clearContext()} 를
 * 호출하지 않으면 후속 테스트(특히 같은 fork·thread 에서 실행되는 service 단위 테스트)로
 * 인증 정보가 누설된다.</p>
 *
 * <p>해당 누설로 발생한 실제 회귀가 PR
 * <a href="https://github.com/beta0629/MindGarden/pull/234">#234</a>
 * (commit {@code 63b2fd2c}) 에서 보고된 바 있으며, 본 Extension 은 PR #234 가
 * {@code ErpStaffStillForbiddenTest} 에 1건 적용한 패턴을 controller 단위 테스트
 * 전체에 일관되게 확장한다.</p>
 *
 * <h2>사용 방법</h2>
 * <p>다른 {@code Extension} 과 합성 사용 (다중 상속 회피):</p>
 * <pre>
 * &#064;ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
 * class FooControllerTest { ... }
 * </pre>
 *
 * <h2>A1 {@code TenantContextIsolationExtension} 과의 관계</h2>
 * <p>표준화 v2 Phase 1 / Slot ⑪ (A1) 의 {@code TenantContextIsolationExtension} 과
 * 책임이 분리되어 있다. 두 Extension 은 합성 가능하며, 동일 테스트 클래스에
 * {@code @ExtendWith} 로 함께 선언해도 충돌하지 않는다.</p>
 *
 * <h2>방어 전략 — {@code afterEach} 단방향 정리</h2>
 * <p>설계상 {@link AfterEachCallback} 만 구현한다. {@code beforeEach} 에서도
 * 추가로 clear 하면 {@code @WithMockUser}/{@code @WithUserDetails} + {@code @SpringBootTest}
 * 조합 테스트에서 Spring 의 {@code WithSecurityContextTestExecutionListener} 가 설정한
 * Authentication 이 본 Extension 의 {@code beforeEach} 에 의해 제거되어 401 응답이
 * 발생한다(예: {@code AdminPushMonitoringControllerTest}). JUnit 5 의
 * {@code BeforeEachCallback} 호출 순서가 어노테이션 선언 순서에 의존하므로 fragile.</p>
 *
 * <p>대신 controller 단위 테스트 *전체* 에 본 Extension 을 합성하면, 각 테스트의
 * {@code afterEach} 가 종료 시 컨텍스트를 비우므로 후속 테스트는 항상 깨끗한 상태에서
 * 시작한다. PR #234 의 원본 패턴({@code @AfterEach SecurityContextHolder.clearContext()})
 * 과 동일한 보장.</p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
public class SecurityContextIsolationExtension implements AfterEachCallback {

    @Override
    public void afterEach(ExtensionContext context) {
        SecurityContextHolder.clearContext();
    }
}
