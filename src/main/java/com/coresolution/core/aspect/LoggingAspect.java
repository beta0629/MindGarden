package com.coresolution.core.aspect;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import com.coresolution.core.annotation.SafeLog;
import com.coresolution.core.util.LogSanitizer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Log Injection 방어용 자동 sanitize 로깅 Aspect (B7).
 *
 * <p>적용 범위:</p>
 * <ul>
 *   <li>{@link SafeLog} 어노테이션이 메서드 또는 클래스에 부착된 모든 메서드</li>
 *   <li>{@code security.safelog.controllers.auto=true} 환경변수 설정 시
 *       {@code @RestController} 가 부착된 모든 컨트롤러 메서드 (옵트인)</li>
 * </ul>
 *
 * <p>동작:</p>
 * <ol>
 *   <li>메서드 진입 시 인자 중 {@link String} 타입을 {@link LogSanitizer#forLog(String)} 로
 *       sanitize 후 한 줄 INFO 로그 출력</li>
 *   <li>메서드 정상 종료 시 elapsed ms (옵션), 결과(옵션) 로그 출력</li>
 *   <li>예외 발생 시 예외 클래스명 + sanitize 된 message 출력 후 재던지기</li>
 * </ol>
 *
 * <p>본 Aspect 는 기존 메서드 본문의 {@code log.info(...)} 호출을 수정하거나 대체하지 않는다.
 * 추가로 한 줄의 안전한 로그를 출력하여, 메서드 본문의 raw 로그와 함께 CodeQL Log Injection
 * 위반 추적이 가능하도록 한다.</p>
 *
 * <p><b>주의</b>: AOP 는 Spring 컨테이너 빈 메서드에만 적용된다. {@code private}/{@code final}
 * /static 메서드, 같은 클래스 내부 호출은 적용되지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-06-14
 * @see SafeLog
 * @see LogSanitizer
 */
@Aspect
@Component
public class LoggingAspect {

    /** Aspect 자체 logger (메서드 클래스 logger 와 분리하여 [SAFE-LOG] prefix 출력). */
    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    /** 로그 라인 prefix. */
    private static final String LOG_PREFIX = "[SAFE-LOG]";

    /** 인자 표시 최대 개수 (long arg list 로 인한 로그 폭증 방지). */
    private static final int MAX_ARG_COUNT_IN_LOG = 8;

    /** 비-String 인자 표시 시 클래스명 + hash. */
    private static final String NON_STRING_ARG_TEMPLATE = "%s@%x";

    /** 인자 표시 시 너무 많을 때 truncate 표시. */
    private static final String ARG_TRUNCATE_SUFFIX = "...";

    /**
     * {@code @RestController} 자동 적용 토글. 기본 {@code false} (옵트인).
     *
     * <p>환경변수 {@code SECURITY_SAFELOG_CONTROLLERS_AUTO=true} 또는
     * application.yml {@code security.safelog.controllers.auto=true} 로 활성화.</p>
     */
    @Value("${security.safelog.controllers.auto:false}")
    private boolean controllersAutoEnabled;

    /**
     * {@link SafeLog} 메서드 어노테이션 진입점 가로채기.
     *
     * @param joinPoint AspectJ 진입점
     * @param safeLog 메서드에 부착된 어노테이션
     * @return 메서드 반환값
     * @throws Throwable 메서드가 던진 예외 그대로 재던지기
     */
    @Around("@annotation(safeLog)")
    public Object aroundSafeLogMethod(ProceedingJoinPoint joinPoint, SafeLog safeLog) throws Throwable {
        return aroundWithSafeLog(joinPoint, safeLog);
    }

    /**
     * {@link SafeLog} 클래스 어노테이션 진입점 가로채기 (클래스의 모든 public 메서드).
     *
     * @param joinPoint AspectJ 진입점
     * @param safeLog 클래스에 부착된 어노테이션
     * @return 메서드 반환값
     * @throws Throwable 메서드가 던진 예외 그대로 재던지기
     */
    @Around("@within(safeLog) && execution(public * *(..))")
    public Object aroundSafeLogClass(ProceedingJoinPoint joinPoint, SafeLog safeLog) throws Throwable {
        return aroundWithSafeLog(joinPoint, safeLog);
    }

    /**
     * {@code @RestController} 옵트인 자동 적용 (환경변수 토글). 기본 비활성.
     *
     * @param joinPoint AspectJ 진입점
     * @return 메서드 반환값
     * @throws Throwable 메서드가 던진 예외 그대로 재던지기
     */
    @Around("@within(org.springframework.web.bind.annotation.RestController) "
            + "&& execution(public * *(..))")
    public Object aroundRestController(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!controllersAutoEnabled) {
            return joinPoint.proceed();
        }
        // 어노테이션이 명시된 메서드는 위 두 advice 가 이미 처리하므로 중복 로깅 방지.
        if (hasSafeLogAnnotation(joinPoint)) {
            return joinPoint.proceed();
        }
        SafeLog defaultSafeLog = DefaultSafeLog.INSTANCE;
        return aroundWithSafeLog(joinPoint, defaultSafeLog);
    }

    /**
     * 공통 sanitize 로깅 로직 (어노테이션 메타데이터 + 호출 가로채기).
     *
     * @param joinPoint AspectJ 진입점
     * @param safeLog 적용할 어노테이션 (어노테이션 없는 컨트롤러는 {@link DefaultSafeLog})
     * @return 메서드 반환값
     * @throws Throwable 메서드가 던진 예외 그대로 재던지기
     */
    private Object aroundWithSafeLog(ProceedingJoinPoint joinPoint, SafeLog safeLog) throws Throwable {
        String label = resolveLabel(joinPoint, safeLog);
        long startNanos = System.nanoTime();

        if (safeLog.logArgs()) {
            log.info("{} {} args={} entered", LOG_PREFIX, label, formatArgs(joinPoint.getArgs()));
        } else {
            log.info("{} {} entered", LOG_PREFIX, label);
        }

        try {
            Object result = joinPoint.proceed();
            long elapsedMs = (System.nanoTime() - startNanos) / 1_000_000L;
            if (safeLog.logResult() && safeLog.logElapsed()) {
                log.info("{} {} returned result={} elapsed={}ms",
                        LOG_PREFIX, label, formatResult(result), elapsedMs);
            } else if (safeLog.logResult()) {
                log.info("{} {} returned result={}",
                        LOG_PREFIX, label, formatResult(result));
            } else if (safeLog.logElapsed()) {
                log.info("{} {} returned elapsed={}ms", LOG_PREFIX, label, elapsedMs);
            } else {
                log.info("{} {} returned", LOG_PREFIX, label);
            }
            return result;
        } catch (Throwable t) {
            long elapsedMs = (System.nanoTime() - startNanos) / 1_000_000L;
            log.warn("{} {} threw exception={} message={} elapsed={}ms",
                    LOG_PREFIX, label, t.getClass().getSimpleName(),
                    LogSanitizer.forLog(t.getMessage()), elapsedMs);
            throw t;
        }
    }

    /**
     * 라벨 결정: 어노테이션 라벨 우선, 비어 있으면 {@code SimpleClassName#methodName}.
     */
    private String resolveLabel(ProceedingJoinPoint joinPoint, SafeLog safeLog) {
        if (safeLog.label() != null && !safeLog.label().isBlank()) {
            return safeLog.label();
        }
        Class<?> targetClass = joinPoint.getTarget() != null
                ? joinPoint.getTarget().getClass()
                : joinPoint.getSignature().getDeclaringType();
        String className = targetClass.getSimpleName();
        // CGLIB 프록시 클래스명($$EnhancerBySpringCGLIB$$) 정리.
        int proxyIdx = className.indexOf("$$");
        if (proxyIdx > 0) {
            className = className.substring(0, proxyIdx);
        }
        String methodName = joinPoint.getSignature().getName();
        return className + "#" + methodName;
    }

    /**
     * 인자 배열을 sanitize 된 표시용 List 로 변환. 너무 많으면 truncate.
     */
    private List<String> formatArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return List.of();
        }
        int limit = Math.min(args.length, MAX_ARG_COUNT_IN_LOG);
        List<String> formatted = new ArrayList<>(limit + 1);
        for (int i = 0; i < limit; i++) {
            formatted.add(formatSingleArg(args[i]));
        }
        if (args.length > MAX_ARG_COUNT_IN_LOG) {
            formatted.add(ARG_TRUNCATE_SUFFIX);
        }
        return formatted;
    }

    /**
     * 단일 인자 표시 — String 은 sanitize, 나머지는 클래스명 + hashCode (PII 방지).
     */
    private String formatSingleArg(Object arg) {
        if (arg == null) {
            return "null";
        }
        if (arg instanceof CharSequence) {
            return LogSanitizer.forLog(arg.toString());
        }
        if (arg instanceof Number || arg instanceof Boolean || arg instanceof Enum<?>) {
            // 원시 wrapper / Enum 은 안전한 toString.
            return LogSanitizer.forLog(String.valueOf(arg));
        }
        // 그 외 객체는 PII 노출 방지 — 클래스명 + identity hash 만.
        return String.format(NON_STRING_ARG_TEMPLATE,
                arg.getClass().getSimpleName(),
                System.identityHashCode(arg));
    }

    /**
     * 반환값 표시 — String 만 sanitize, 그 외는 클래스명.
     */
    private String formatResult(Object result) {
        if (result == null) {
            return "null";
        }
        if (result instanceof CharSequence) {
            return LogSanitizer.forLog(result.toString());
        }
        return result.getClass().getSimpleName();
    }

    /**
     * 메서드 또는 선언 클래스에 {@link SafeLog} 가 있는지 확인 — 자동 컨트롤러 적용 시 중복 방지.
     */
    private boolean hasSafeLogAnnotation(ProceedingJoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        if (signature.getMethod().isAnnotationPresent(SafeLog.class)) {
            return true;
        }
        Class<?> targetClass = joinPoint.getTarget() != null
                ? joinPoint.getTarget().getClass()
                : signature.getDeclaringType();
        return targetClass.isAnnotationPresent(SafeLog.class);
    }

    /**
     * 어노테이션 없는 컨트롤러에 자동 적용 시 사용할 기본 {@link SafeLog} 메타데이터.
     *
     * <p>{@link java.lang.annotation.Annotation} 을 직접 구현해 reflection 없이 사용한다.</p>
     */
    @SafeLog
    private static final class DefaultSafeLog {

        private static final SafeLog INSTANCE = DefaultHolder.class.getAnnotation(SafeLog.class);

        @SafeLog
        private static final class DefaultHolder {
            // 단순히 @SafeLog 기본값을 들고 있는 홀더.
        }

        private DefaultSafeLog() {
        }
    }

    /**
     * 테스트 전용: {@code @RestController} 자동 적용 토글 강제 설정.
     *
     * @param enabled 활성화 여부
     */
    void setControllersAutoEnabledForTest(boolean enabled) {
        this.controllersAutoEnabled = enabled;
    }

    /**
     * 테스트 전용: 인자 포매팅 헬퍼 노출.
     *
     * @param args 메서드 인자
     * @return sanitize 된 표시 리스트
     */
    List<String> formatArgsForTest(Object... args) {
        return formatArgs(args == null ? new Object[0] : Arrays.copyOf(args, args.length));
    }
}
