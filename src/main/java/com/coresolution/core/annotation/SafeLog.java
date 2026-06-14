package com.coresolution.core.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Log Injection 방어용 자동 sanitize 로깅 어노테이션 (B7).
 *
 * <p>메서드 또는 클래스에 부착하면 {@link com.coresolution.core.aspect.LoggingAspect}
 * 가 메서드 진입·종료 시점에 인자(특히 {@link String})를 {@link com.coresolution.core.util.LogSanitizer#forLog(String)}
 * 로 sanitize 후 INFO 레벨 로그를 한 줄 출력한다. CRLF/제어 문자가 포함된 사용자 입력으로
 * 인한 CodeQL {@code java/log-injection} 위반을 차단한다.</p>
 *
 * <p>적용 예:
 * <pre>{@code
 * @SafeLog(label = "공통코드 조회", logArgs = true)
 * public CommonCodeResponse getCommonCode(@PathVariable Long id, String tenantId) {
 *     ...
 * }
 * }</pre>
 * 출력 예: {@code [SAFE-LOG] CommonCodeService#getCommonCode args=[42, tenant-abc] entered}</p>
 *
 * <p><b>주의</b>: 본 어노테이션은 기존 메서드 본문의 {@code log.info(...)} 호출을 수정하지 않는다.
 * 메서드 본문 내 로그도 sanitize 가 필요하면 {@code LogSanitizer.forLog(...)} 를 직접 호출하라.</p>
 *
 * @author MindGarden
 * @since 2026-06-14
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeLog {

    /**
     * 로그 라벨(메서드 식별용 short 라벨). 비어 있으면 {@code className#methodName} 사용.
     *
     * @return 로그 라벨
     */
    String label() default "";

    /**
     * 메서드 인자를 sanitize 후 로그에 포함할지 여부.
     *
     * @return 인자 포함 여부 (기본 {@code true})
     */
    boolean logArgs() default true;

    /**
     * 메서드 반환값을 sanitize 후 로그에 포함할지 여부. 민감 데이터 노출 위험이 있으므로
     * 기본 {@code false}. {@link String} 반환 타입만 출력하고 그 외 타입은 클래스명만 출력한다.
     *
     * @return 반환값 포함 여부 (기본 {@code false})
     */
    boolean logResult() default false;

    /**
     * 메서드 실행 시간을 ms 단위로 로그에 포함할지 여부.
     *
     * @return 실행 시간 포함 여부 (기본 {@code true})
     */
    boolean logElapsed() default true;
}
