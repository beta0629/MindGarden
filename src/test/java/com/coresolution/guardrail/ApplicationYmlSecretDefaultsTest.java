package com.coresolution.guardrail;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

/**
 * 가드레일 3b — application*.yml 에 비밀값 기본값 금지.
 *
 * <p>키 마지막 조각이 password·secret·api-key·token·credential·encryption-key 등인 값은
 * {@code ${ENV}} 또는 {@code ${ENV:}}(빈 기본값)만 허용한다. 리터럴이나 {@code ${ENV:literal}} 은 위반.</p>
 *
 * <p>로컬/테스트 프로파일: {@code src/test/**} 의 yml(jar 에 포함되지 않음)은 allowlist 의 {@code TEST} 항목으로만
 * 허용하며, 값에 test/dummy/placeholder 가 들어 있어 더미임이 드러나야 한다. {@code src/main} 의 application-local.yml
 * 은 jar 에 포함되므로 운영 yml 과 같은 규칙이다(기존 위반은 {@code TODO}). allowlist 는 줄어들기만 한다.
 * 값 자체는 어떤 메시지에도 출력하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("[가드레일3] application*.yml 비밀 키는 ${ENV} 만 (리터럴 기본값 금지)")
class ApplicationYmlSecretDefaultsTest {

    static final Path ALLOWLIST = Path.of("src/test/resources/guardrails/yml-secret-defaults-allowlist.txt");
    static final Path CURRENT_OUT = Path.of("target/guardrails/yml-secret-defaults.current.txt");
    static final List<Path> ROOTS = List.of(Path.of("src/main/resources"), Path.of("src/test/resources"),
        Path.of("deployment"), Path.of("config"), Path.of("backend-ops/src/main/resources"));
    private static final Pattern FILE_NAME = Pattern.compile("application[\\w.-]*\\.ya?ml");
    private static final Pattern SECRET_KEY = Pattern.compile(
        "(?i)(^|[-_])(password|passwd|pwd|secret|api[-_]?key|access[-_]?key|secret[-_]?key|private[-_]?key"
            + "|encryption[-_]?key|token|credentials?)$");
    private static final Pattern PLACEHOLDER = Pattern.compile("^\\$\\{[A-Za-z0-9_.\\-]+(?::(.*))?}$");
    private static final Pattern DUMMY_VALUE = Pattern.compile("(?i)test|dummy|placeholder");
    private static final String TEST_SOURCE_PREFIX = "src/test/";

    @Test
    @DisplayName("비밀 키 리터럴/기본값은 allowlist(TEST/TODO) 와 정확히 일치해야 한다")
    void secretKeysUseEnvWithoutLiteralDefault() throws IOException {
        Map<String, String> violations = new TreeMap<>();
        Map<String, String> values = new TreeMap<>();
        for (Path file : ymlFiles()) {
            String rel = file.toString().replace('\\', '/');
            List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
            try (Reader r = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
                for (Object doc : new Yaml(new SafeConstructor(new LoaderOptions())).loadAll(r)) {
                    Map<String, Object> flat = new TreeMap<>();
                    flatten("", doc, flat);
                    for (Map.Entry<String, Object> e : flat.entrySet()) {
                        String leaf = e.getKey().substring(e.getKey().lastIndexOf('.') + 1);
                        if (!SECRET_KEY.matcher(leaf).find() || isEnvOnly(e.getValue())) {
                            continue;
                        }
                        String key = rel + ":" + e.getKey();
                        violations.put(key, rel + ":" + lineOf(lines, e.getKey()));
                        values.put(key, String.valueOf(e.getValue()));
                    }
                }
            }
        }
        Files.createDirectories(CURRENT_OUT.getParent());
        Files.write(CURRENT_OUT, violations.entrySet().stream()
            .map(e -> (e.getKey().startsWith(TEST_SOURCE_PREFIX) ? "TEST " : "TODO ") + e.getKey() + " # " + e.getValue())
            .collect(Collectors.toList()), StandardCharsets.UTF_8);

        GuardrailBaseline baseline = GuardrailBaseline.load(ALLOWLIST, Set.of("TEST", "TODO"));
        List<String> failures = new ArrayList<>(baseline.diff(violations.keySet(),
            "값을 ${ENV_NAME} (기본값 없이) 로 바꾸고 실제 값은 GitHub Secrets/서버 env 로 주입하세요"));
        for (String key : violations.keySet()) {
            if (!"TEST".equals(baseline.kindOf(key))) {
                continue;
            }
            if (!key.startsWith(TEST_SOURCE_PREFIX)) {
                failures.add("TEST 분류 오용: " + key + " — TEST 는 src/test/** yml 만. 운영 yml 은 ${ENV} 로 바꾸세요");
            } else if (!DUMMY_VALUE.matcher(values.get(key)).find() && !values.get(key).isBlank()) {
                failures.add("테스트 더미 아님: " + key + " — 값에 test/dummy/placeholder 를 넣어 더미임을 드러내세요");
            }
        }
        failures.replaceAll(f -> withLine(f, violations));
        assertTrue(failures.isEmpty(), GuardrailBaseline.report("yml 비밀 기본값", failures)
            + "\n  (전체 현재 목록: " + CURRENT_OUT + ")");
    }

    private static String withLine(String failure, Map<String, String> violations) {
        for (Map.Entry<String, String> e : violations.entrySet()) {
            if (failure.startsWith("신규 위반: " + e.getKey() + " ")) {
                return failure.replace(e.getKey() + " —", e.getKey() + " [" + e.getValue() + "] —");
            }
        }
        return failure;
    }

    static List<Path> ymlFiles() throws IOException {
        List<Path> files = new ArrayList<>();
        for (Path root : ROOTS) {
            if (!Files.isDirectory(root)) {
                continue;
            }
            try (Stream<Path> s = Files.walk(root, 1)) {
                s.filter(p -> FILE_NAME.matcher(p.getFileName().toString()).matches()).sorted().forEach(files::add);
            }
        }
        return files;
    }

    /** ${VAR} · ${VAR:} · ${A:${B}} 처럼 리터럴 기본값이 없으면 true. 빈 값·null·불리언·숫자(플래그)도 true. */
    static boolean isEnvOnly(Object value) {
        if (value == null || value instanceof Boolean || value instanceof Number) {
            return true;
        }
        String v = String.valueOf(value).strip();
        if (v.isEmpty()) {
            return true;
        }
        Matcher m = PLACEHOLDER.matcher(v);
        if (!m.matches()) {
            return false;
        }
        String fallback = m.group(1);
        return fallback == null || fallback.isEmpty() || isEnvOnly(fallback);
    }

    @SuppressWarnings("unchecked")
    private static void flatten(String prefix, Object node, Map<String, Object> out) {
        if (node instanceof Map<?, ?> map) {
            for (Map.Entry<?, ?> e : ((Map<Object, Object>) map).entrySet()) {
                String k = prefix.isEmpty() ? String.valueOf(e.getKey()) : prefix + "." + e.getKey();
                flatten(k, e.getValue(), out);
            }
        } else if (node instanceof List<?> list) {
            for (int i = 0; i < list.size(); i++) {
                flatten(prefix + "[" + i + "]", list.get(i), out);
            }
        } else if (!prefix.isEmpty()) {
            out.put(prefix, node);
        }
    }

    /** 키 경로 조각을 위에서부터 차례로 찾아 마지막 조각의 줄 번호를 돌려준다 (못 찾으면 0). */
    private static int lineOf(List<String> lines, String flatKey) {
        int from = 0;
        int found = 0;
        for (String segment : flatKey.replaceAll("\\[\\d+]", "").split("\\.")) {
            String needle = segment.toLowerCase(Locale.ROOT) + ":";
            for (int i = from; i < lines.size(); i++) {
                String line = lines.get(i).strip().toLowerCase(Locale.ROOT);
                if (line.startsWith(needle) || line.startsWith("- " + needle)) {
                    found = i + 1;
                    from = i + 1;
                    break;
                }
            }
        }
        return found;
    }
}
