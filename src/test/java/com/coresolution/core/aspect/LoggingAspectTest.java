package com.coresolution.core.aspect;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import com.coresolution.core.annotation.SafeLog;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.aop.aspectj.annotation.AspectJProxyFactory;

/**
 * B7 회귀 가드 — {@link LoggingAspect} 의 sanitize 동작과 옵트인 토글을 검증한다.
 *
 * <p>구성:</p>
 * <ul>
 *   <li>{@link FormatArgs} — 인자 포매팅 헬퍼(헤더/제어 문자 sanitize, 비-String PII 가림) 단위 검증</li>
 *   <li>{@link Proxied} — Spring AspectJ {@link AspectJProxyFactory} 로 {@link SafeLog} 메서드/클래스 진입을
 *       실제 가로채는지, 어노테이션 없는 메서드는 통과(우회)하는지 검증</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-14
 */
@DisplayName("LoggingAspect — sanitize 로깅 + 옵트인 진입점 회귀 가드")
class LoggingAspectTest {

    private LoggingAspect aspect;

    @BeforeEach
    void setUp() {
        aspect = new LoggingAspect();
    }

    @AfterEach
    void tearDown() {
        aspect = null;
    }

    @Nested
    @DisplayName("formatArgs(...) — String/원시/PII 객체 표시")
    class FormatArgs {

        @Test
        @DisplayName("CRLF/제어 문자가 포함된 String 은 LogSanitizer.forLog 로 _ 치환")
        void crlfInString_isSanitizedToUnderscore() {
            String malicious = "tenant-a\r\nINJECTED";
            List<String> formatted = aspect.formatArgsForTest(malicious);
            assertThat(formatted).hasSize(1);
            assertThat(formatted.get(0))
                    .doesNotContain("\r")
                    .doesNotContain("\n")
                    .contains("tenant-a")
                    .contains("__INJECTED");
        }

        @Test
        @DisplayName("Number/Boolean/Enum 인자는 sanitize 된 String 으로 표시")
        void numberAndEnum_areFormattedAsString() {
            List<String> formatted = aspect.formatArgsForTest(42L, Boolean.TRUE, TestEnum.ALPHA);
            assertThat(formatted).containsExactly("42", "true", "ALPHA");
        }

        @Test
        @DisplayName("비-String 객체는 클래스명@hash 로 가려져 PII 노출 방지")
        void arbitraryObject_isMaskedToClassNameAndHash() {
            Object pii = new java.util.HashMap<>();
            List<String> formatted = aspect.formatArgsForTest(pii);
            assertThat(formatted).hasSize(1);
            assertThat(formatted.get(0))
                    .startsWith("HashMap@")
                    .doesNotContain("toString")
                    .doesNotContain("[]");
        }

        @Test
        @DisplayName("null 인자도 안전하게 처리")
        void nullArg_returnsNullLiteral() {
            List<String> formatted = aspect.formatArgsForTest((Object) null);
            assertThat(formatted).containsExactly("null");
        }

        @Test
        @DisplayName("긴 인자 리스트(>8)는 truncate(...) 로 표시")
        void overflowArgs_areTruncated() {
            Object[] many = new Object[10];
            for (int i = 0; i < many.length; i++) {
                many[i] = "v" + i;
            }
            List<String> formatted = aspect.formatArgsForTest(many);
            assertThat(formatted).hasSize(9);
            assertThat(formatted.get(8)).isEqualTo("...");
        }

        @Test
        @DisplayName("빈 인자 배열은 빈 List")
        void emptyArgs_returnsEmptyList() {
            assertThat(aspect.formatArgsForTest()).isEmpty();
        }
    }

    @Nested
    @DisplayName("AOP proxy — @SafeLog 가로채기 + 옵트인 컨트롤러 토글")
    class Proxied {

        private RecordingLogTarget target;
        private RecordingLogTarget proxy;
        private LoggingAspect aspectForProxy;

        @BeforeEach
        void setUp() {
            target = new RecordingLogTarget();
            aspectForProxy = new LoggingAspect();
            AspectJProxyFactory factory = new AspectJProxyFactory(target);
            factory.addAspect(aspectForProxy);
            proxy = factory.getProxy();
        }

        @Test
        @DisplayName("@SafeLog 메서드는 가로채져 원본 결과를 그대로 반환한다")
        void safeLogAnnotatedMethod_returnsOriginalResult() {
            String result = proxy.safeLogMethod("user-input\r\nLINJECT");
            assertThat(result).isEqualTo("OK:user-input\r\nLINJECT"); // 원본 인자 그대로 받음
            assertThat(target.invocationCount).isEqualTo(1);
        }

        @Test
        @DisplayName("@SafeLog 가 없는 일반 메서드는 가로채지지 않는다 (옵트인 OFF 기본)")
        void unannotatedMethod_isNotIntercepted() {
            String result = proxy.plainMethod("foo");
            assertThat(result).isEqualTo("plain:foo");
            assertThat(target.invocationCount).isEqualTo(1);
        }

        @Test
        @DisplayName("@SafeLog 메서드가 예외를 던지면 sanitize 된 로그 후 그대로 재던진다")
        void safeLogAnnotatedMethod_rethrowsException() {
            assertThatThrownBy(() -> proxy.safeLogThrowing("bad\r\nmessage"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("bad");
            assertThat(target.invocationCount).isEqualTo(1);
        }
    }

    /**
     * AOP proxy 테스트용 타깃 빈. {@link SafeLog} 메서드 1개 + 일반 메서드 1개 + 예외 메서드 1개.
     */
    static class RecordingLogTarget {

        int invocationCount;

        @SafeLog(label = "test-safe-log")
        public String safeLogMethod(String input) {
            invocationCount++;
            return "OK:" + input;
        }

        public String plainMethod(String input) {
            invocationCount++;
            return "plain:" + input;
        }

        @SafeLog
        public String safeLogThrowing(String input) {
            invocationCount++;
            throw new IllegalStateException("bad:" + input);
        }
    }

    private enum TestEnum {
        ALPHA
    }
}
