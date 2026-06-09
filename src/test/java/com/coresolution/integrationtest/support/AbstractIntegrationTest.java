package com.coresolution.integrationtest.support;

import com.coresolution.consultation.ConsultationManagementApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * 통합 테스트 공통 베이스 클래스 (Stage 4 영구 수정 — ApplicationContext 캐시 적중률 극대화).
 *
 * <p><strong>왜 베이스 클래스인가</strong>: Spring TestContext Framework 는 컨텍스트 설정
 * 시그니처(설정 classes, profiles, properties, customizers, mock beans 등)가 동일한 통합 테스트
 * 클래스 사이에서 ApplicationContext 를 캐시한다. 시그니처가 한 군데라도 다르면 새 컨텍스트를
 * 부팅하므로(매번 5~30초) 47+ {@code *IntegrationTest.java} 클래스가 각자 새 컨텍스트를 띄우면
 * 통합 테스트만 10분 이상 소요된다.</p>
 *
 * <p>본 베이스를 상속하면 자동으로 동일한 컨텍스트 시그니처를 갖게 되어 다음 클래스부터는
 * 캐시된 컨텍스트(부팅 0ms 수준)를 재사용한다. {@code @SpringBootTest(classes =
 * ConsultationManagementApplication.class)} 와 {@code @ActiveProfiles("test")} 를 베이스에서
 * 한 번 선언하므로 하위 클래스는 추가 비즈니스 검증 메서드만 작성한다.</p>
 *
 * <h2>마이그레이션 가이드</h2>
 * <ol>
 *   <li>기존 {@code @SpringBootTest(classes = ConsultationManagementApplication.class)} +
 *       {@code @ActiveProfiles("test")} 만 선언한 {@code *IntegrationTest} 는 본 베이스로 상속만
 *       바꾸면 됨(어노테이션 두 줄 삭제 + {@code extends AbstractIntegrationTest}).</li>
 *   <li>{@code @AutoConfigureMockMvc} 가 필요한 경우 하위 클래스에 추가(베이스는 MockMvc 가
 *       필요 없는 통합 테스트도 지원하기 위해 미선언).</li>
 *   <li>특화된 properties/customizers (예: 특정 yml override) 가 필요하면 이 베이스를 상속하지
 *       말고 별도 컨텍스트 구성(캐시 깨짐 인지하에 사용).</li>
 *   <li>{@code @Transactional} 은 하위 클래스 책임(테스트 격리 정책 별 분리).</li>
 * </ol>
 *
 * <h2>주의 — 컨텍스트 캐시를 깨트리는 요소</h2>
 * <ul>
 *   <li>{@code @MockBean} / {@code @SpyBean} — 같은 mock 시그니처를 갖는 하위 클래스끼리만 캐시 적중.
 *       서로 다른 mock 조합을 쓰는 경우 베이스를 상속하더라도 새 컨텍스트가 생성됨.</li>
 *   <li>{@code @DirtiesContext} — 명시적으로 캐시 무효화. 꼭 필요한 경우만 사용.</li>
 *   <li>{@code @TestPropertySource} / {@code @DynamicPropertySource} — properties 시그니처 변경.</li>
 *   <li>WebEnvironment 변경 (NONE / MOCK / RANDOM_PORT / DEFINED_PORT) — 베이스는 기본 (MOCK) 사용.</li>
 * </ul>
 *
 * <h2>관련 영구 수정 (P1 CI/CD hang 근절)</h2>
 * <ul>
 *   <li>Stage 1: {@code pom.xml} surefire {@code argLine}/timeout + {@code application-test.yml}
 *       외부 의존성 차단 + GitHub workflow step timeout. {@code ConsultantStatisticsGuardTestApp}
 *       분리(메인 {@code @ComponentScan} 흡수 차단). (PR #178)</li>
 *   <li>Stage 2: {@code maven-failsafe-plugin} 추가, surefire 에서 {@code *IntegrationTest.java} 제외.
 *       {@code mvn test} = 단위(빠름), {@code mvn verify} = 단위 + 통합.</li>
 *   <li>Stage 3: GitHub workflow 를 정적 검사 / 단위 / 통합 / 메트릭 4개 job 으로 split.
 *       단위 20분, 통합 30분 step timeout.</li>
 *   <li>Stage 4 (본 클래스): {@code AbstractIntegrationTest} 베이스로 ApplicationContext 캐시 적중.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {
}
