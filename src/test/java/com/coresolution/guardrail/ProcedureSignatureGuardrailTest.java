package com.coresolution.guardrail;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 가드레일 2 — Java 가 호출하는 저장 프로시저와 표준 배포 SQL 의 시그니처 일치.
 *
 * <p><b>Java 쪽</b> (src/main/java 정적 분석, 주석 제거 후):
 * <ul>
 *   <li>{@code CALL name(?, ?, @out)} 문자열 (prepareCall·JdbcTemplate·native query, {@code " + schema + ".name} 결합 포함):
 *       인자 수 = 전체 파라미터 수, {@code @var} 와 같은 구간의 {@code registerOutParameter(<숫자>)} = OUT 수.</li>
 *   <li>{@code new StringBuilder("{CALL ").append(X)} · {@code "{CALL name("} + 반복 append: 이름은 상수/지역 리터럴로 해석,
 *       인자 수는 런타임 메타데이터 기반이라 이름만 검사.</li>
 *   <li>{@code SimpleJdbcCall.withProcedureName(X)}: {@code withoutProcedureColumnMetaDataAccess()} 면 선언된
 *       SqlParameter/SqlOutParameter/SqlInOutParameter 수, 아니면 같은 구간 {@code addValue("p_…")} 수를 IN 수로 비교.</li>
 *   <li>{@code createStoredProcedureQuery("X")} · {@code @Procedure("X")}: 이름 검사.</li>
 * </ul>
 * <b>SQL 쪽</b>: 배포 스크립트가 실제로 올리는 {@code database/schema/procedures_standardized/*_standardized.sql}
 * (create_deployment_files.sh 가 deployment/ 로 복사하는 원본)과, 부팅 시 {@code PlSqlInitializer} 가 직접 실행하는
 * 클래스패스 SQL(소스에서 {@code "*.sql"} 리터럴을 읽어 해석)의 {@code CREATE PROCEDURE} 정의.</p>
 *
 * <p>위반 종류: {@code UNDEFINED}(표준 배포 SQL 에 정의 없음) · {@code MISMATCH}(파라미터 수 불일치) ·
 * {@code DYNAMIC}(이름을 정적으로 해석 불가) · {@code NODEPLOY}(Java 가 부르는 표준 프로시저인데
 * {@code deployment/<이름>_deploy.sql} 이 없거나 원본과 달라 운영 db-diff·배포 대상에서 빠짐) ·
 * {@code NESTED}(표준 프로시저 본문의 {@code CALL} 대상이 표준 세트·PlSqlInitializer 어디에도 없음). 기존 위반은 {@code guardrails/procedure-signature-baseline.txt}
 * ({@code TODO}) 에 사유와 함께 두고, 신규 위반·정리된 항목은 FAIL.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("[가드레일2] Java 프로시저 호출 ↔ 표준 배포 SQL CREATE PROCEDURE 시그니처")
class ProcedureSignatureGuardrailTest {

    static final Path BASELINE = Path.of("src/test/resources/guardrails/procedure-signature-baseline.txt");
    static final Path CURRENT_OUT = Path.of("target/guardrails/procedure-signature.current.txt");
    static final Path JAVA_ROOT = Path.of("src/main/java");
    static final Path RESOURCES_ROOT = Path.of("src/main/resources");
    static final Path STANDARD_DIR = Path.of("database/schema/procedures_standardized");
    static final Path FLYWAY_DIR = RESOURCES_ROOT.resolve("db/migration");
    static final String STANDARD_SUFFIX = "_standardized.sql";
    static final Path DEPLOY_DIR = STANDARD_DIR.resolve("deployment");
    static final String DEPLOY_SUFFIX = "_deploy.sql";
    static final String INITIALIZER = "PlSqlInitializer.java";

    private static final Pattern CALL_LITERAL = Pattern.compile(
        "(?i)\\bCALL\\s+(?:\"\\s*\\+\\s*[\\w.()]+\\s*\\+\\s*\"\\s*\\.?)?(?:`?\\w+`?\\.)?`?(\\w+)`?\\s*\\(");
    private static final Pattern CALL_BUILDER = Pattern.compile(
        "(?i)\"\\{?CALL\\s*\"\\s*\\)\\s*\\.append\\(\\s*([\\w.]+)\\s*\\)");
    private static final Pattern SIMPLE_JDBC_CALL = Pattern.compile("withProcedureName\\(\\s*([^)]+?)\\s*\\)");
    private static final Pattern STORED_QUERY = Pattern.compile(
        "createStoredProcedureQuery\\(\\s*([^,)]+)|@Procedure\\(\\s*(?:\\w+\\s*=\\s*)?([^,)]+)");
    private static final Pattern REGISTER_OUT = Pattern.compile("registerOutParameter\\(\\s*([^,\\s)]+)");
    private static final Pattern ADD_VALUE = Pattern.compile("addValue\\(\\s*\"(\\w+)\"");
    private static final Pattern EXECUTE_END = Pattern.compile("\\.execute(Query|Update)?\\(\\s*\\)");
    private static final Pattern CREATE_PROCEDURE = Pattern.compile(
        "(?i)CREATE\\s+(?:DEFINER\\s*=\\s*\\S+\\s+)?PROCEDURE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?"
            + "(?:`?\\w+`?\\.)?`?(\\w+)`?\\s*\\(");
    private static final Pattern NESTED_CALL = Pattern.compile("(?i)\\bCALL\\s+(?:`?\\w+`?\\.)?`?(\\w+)`?\\s*\\(");
    private static final Pattern SQL_RESOURCE_LITERAL = Pattern.compile("\"([\\w./-]+\\.sql)\"");
    private static final int REGION_LIMIT = 6000;
    private static final int BUILDER_LOOKBACK = 400;

    /** 정의: 전체·OUT(INOUT 포함) 파라미터 수와 출처. */
    record Definition(String name, int total, int out, String source) {
    }

    /** Java 호출: total/out/in 이 -1 이면 정적으로 알 수 없음. */
    record JavaCall(String name, int total, int out, int in, String file, String expr) {
    }

    @Test
    @DisplayName("미정의·파라미터 수 불일치·동적 이름은 베이스라인과 정확히 일치해야 한다")
    void javaProcedureCallsMatchStandardDeploySql() throws IOException {
        Map<String, Definition> defs = loadDefinitions();
        assertTrue(defs.size() > 10, "표준 배포 SQL 에서 CREATE PROCEDURE 를 거의 못 찾았습니다 — 경로/파서를 확인하세요");
        List<JavaCall> calls = collectJavaCalls();
        assertTrue(calls.size() > 10, "Java 프로시저 호출을 거의 못 찾았습니다 — 파서를 확인하세요");

        Map<String, String> violations = new TreeMap<>();
        for (JavaCall c : calls) {
            if (c.name() == null) {
                violations.put("DYNAMIC " + c.file() + ":" + c.expr(), "이름을 상수/리터럴로 해석할 수 없음");
                continue;
            }
            Definition d = defs.get(c.name().toLowerCase(Locale.ROOT));
            if (d == null) {
                violations.put("UNDEFINED " + c.name() + " @" + c.file(), definedElsewhere(c.name()));
                continue;
            }
            boolean totalBad = c.total() >= 0 && c.total() != d.total();
            boolean outBad = c.out() >= 0 && c.out() != d.out();
            boolean inBad = c.in() >= 0 && c.in() != d.total() - d.out();
            if (totalBad || outBad || inBad) {
                violations.put("MISMATCH " + c.name() + " java=" + fmt(c) + " def=" + d.total() + "(out=" + d.out()
                    + ") @" + c.file(), d.source());
            }
            String deployProblem = deployProblem(d);
            if (deployProblem != null) {
                violations.put("NODEPLOY " + d.name() + " @" + c.file(), deployProblem);
            }
        }
        violations.putAll(nestedCallViolations(defs));
        System.out.println("[guardrail2] Java 호출 " + calls.size() + "건 · 정의 " + defs.size() + "개 · 위반 "
            + violations.size() + "건");
        Files.createDirectories(CURRENT_OUT.getParent());
        Files.write(CURRENT_OUT, violations.entrySet().stream().map(e -> "TODO " + e.getKey() + " # " + e.getValue())
            .collect(Collectors.toList()), StandardCharsets.UTF_8);

        GuardrailBaseline baseline = GuardrailBaseline.load(BASELINE, Set.of("TODO"));
        List<String> failures = baseline.diff(violations.keySet(),
            "Java 호출의 프로시저 이름·파라미터 수를 procedures_standardized/*_standardized.sql 의 CREATE PROCEDURE 와"
                + " 맞추거나, 정의를 표준 배포 SQL 에 추가하세요");
        assertTrue(failures.isEmpty(), GuardrailBaseline.report("프로시저 시그니처", failures)
            + "\n  (전체 현재 목록: " + CURRENT_OUT + ")");
    }

    /** 표준 정의면 deployment/ 사본이 원본과 같아야 운영 db-diff·배포 대상이 된다. 문제 없으면 null. */
    static String deployProblem(Definition d) throws IOException {
        String prefix = "standard:";
        if (!d.source().startsWith(prefix)) {
            return null;
        }
        String standardName = d.source().substring(prefix.length());
        String proc = standardName.substring(0, standardName.length() - STANDARD_SUFFIX.length());
        Path deploy = DEPLOY_DIR.resolve(proc + DEPLOY_SUFFIX);
        if (!Files.isRegularFile(deploy)) {
            return "배포 SQL 없음(" + deploy + ") — create_deployment_files.sh 로 생성";
        }
        if (Files.mismatch(STANDARD_DIR.resolve(standardName), deploy) != -1L) {
            return "배포 SQL 이 원본과 다름(" + deploy + ") — create_deployment_files.sh 로 재생성";
        }
        return null;
    }

    /** 표준 프로시저 본문의 CALL 대상이 표준 세트·PlSqlInitializer 정의에 있는지. */
    static Map<String, String> nestedCallViolations(Map<String, Definition> defs) throws IOException {
        Map<String, String> result = new TreeMap<>();
        List<Path> standard;
        try (Stream<Path> s = Files.list(STANDARD_DIR)) {
            standard = s.filter(p -> p.getFileName().toString().endsWith(STANDARD_SUFFIX)).sorted().toList();
        }
        for (Path p : standard) {
            String sql = stripSqlComments(Files.readString(p, StandardCharsets.UTF_8));
            String caller = p.getFileName().toString().replace(STANDARD_SUFFIX, "");
            Matcher m = NESTED_CALL.matcher(sql);
            while (m.find()) {
                String callee = m.group(1);
                if (!defs.containsKey(callee.toLowerCase(Locale.ROOT))) {
                    result.put("NESTED " + caller + "->" + callee, definedElsewhere(callee));
                }
            }
        }
        return result;
    }

    private static String fmt(JavaCall c) {
        if (c.total() >= 0) {
            return c.total() + "(out=" + (c.out() >= 0 ? String.valueOf(c.out()) : "?") + ")";
        }
        return "in" + c.in();
    }

    // ---------------------------------------------------------------- SQL

    static Map<String, Definition> loadDefinitions() throws IOException {
        Map<String, Definition> defs = new TreeMap<>();
        List<Path> standard;
        try (Stream<Path> s = Files.list(STANDARD_DIR)) {
            standard = s.filter(p -> p.getFileName().toString().endsWith(STANDARD_SUFFIX)).sorted().toList();
        }
        for (Path p : standard) {
            for (Definition d : parseDefinitions(p, "standard:" + p.getFileName())) {
                defs.putIfAbsent(d.name().toLowerCase(Locale.ROOT), d);
            }
        }
        for (Path p : initializerResources()) {
            for (Definition d : parseDefinitions(p, "PlSqlInitializer:" + RESOURCES_ROOT.relativize(p))) {
                defs.putIfAbsent(d.name().toLowerCase(Locale.ROOT), d);
            }
        }
        return defs;
    }

    static List<Path> initializerResources() throws IOException {
        List<Path> result = new ArrayList<>();
        try (Stream<Path> s = Files.walk(JAVA_ROOT)) {
            for (Path init : s.filter(p -> p.getFileName().toString().equals(INITIALIZER)).toList()) {
                Matcher m = SQL_RESOURCE_LITERAL.matcher(Files.readString(init, StandardCharsets.UTF_8));
                while (m.find()) {
                    Path res = RESOURCES_ROOT.resolve(m.group(1));
                    if (Files.isRegularFile(res)) {
                        result.add(res);
                    }
                }
            }
        }
        return result;
    }

    static List<Definition> parseDefinitions(Path file, String source) throws IOException {
        String sql = stripSqlComments(Files.readString(file, StandardCharsets.UTF_8));
        List<Definition> result = new ArrayList<>();
        Matcher m = CREATE_PROCEDURE.matcher(sql);
        while (m.find()) {
            String params = balanced(sql, m.end() - 1);
            int total = 0;
            int out = 0;
            for (String param : splitTopLevel(params)) {
                String p = param.strip().toUpperCase(Locale.ROOT);
                if (p.isEmpty()) {
                    continue;
                }
                total++;
                if (p.startsWith("OUT ") || p.startsWith("INOUT ")) {
                    out++;
                }
            }
            result.add(new Definition(m.group(1), total, out, source));
        }
        return result;
    }

    private static String definedElsewhere(String name) throws IOException {
        Pattern p = Pattern.compile("(?i)PROCEDURE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:`?\\w+`?\\.)?`?"
            + Pattern.quote(name) + "`?\\s*\\(");
        Set<String> where = new TreeSet<>();
        for (Path root : List.of(FLYWAY_DIR, RESOURCES_ROOT.resolve("sql"), Path.of("database"), Path.of("sql"))) {
            if (!Files.isDirectory(root)) {
                continue;
            }
            try (Stream<Path> s = Files.walk(root)) {
                for (Path f : s.filter(x -> x.toString().endsWith(".sql")).toList()) {
                    if (p.matcher(Files.readString(f, StandardCharsets.ISO_8859_1)).find()) {
                        where.add(f.toString());
                    }
                }
            }
        }
        if (where.isEmpty()) {
            return "저장소 어디에도 정의 없음 — 표준 배포 SQL 추가 또는 호출 제거";
        }
        String first = where.iterator().next();
        return "표준 배포 SQL 밖에만 정의(" + first + (where.size() > 1 ? " 외 " + (where.size() - 1) : "")
            + ") — procedures_standardized 로 이동";
    }

    static String stripSqlComments(String sql) {
        String noBlock = sql.replaceAll("(?s)/\\*.*?\\*/", " ");
        return noBlock.replaceAll("(?m)(--|#)[^\\n]*$", " ");
    }

    // ---------------------------------------------------------------- Java

    static List<JavaCall> collectJavaCalls() throws IOException {
        List<JavaCall> calls = new ArrayList<>();
        List<Path> files;
        try (Stream<Path> s = Files.walk(JAVA_ROOT)) {
            files = s.filter(p -> p.toString().endsWith(".java")).sorted().toList();
        }
        for (Path f : files) {
            String src = stripJavaComments(Files.readString(f, StandardCharsets.UTF_8));
            String file = f.getFileName().toString().replace(".java", "");
            if (file.equals(INITIALIZER.replace(".java", ""))) {
                continue;
            }
            collectCallLiterals(src, file, calls);
            collectBuilders(src, file, calls);
            collectSimpleJdbcCalls(src, file, calls);
            collectStoredQueries(src, file, calls);
        }
        return calls;
    }

    private static void collectCallLiterals(String src, String file, List<JavaCall> calls) {
        Matcher m = CALL_LITERAL.matcher(src);
        while (m.find()) {
            int open = m.end() - 1;
            String rest = src.substring(open + 1, Math.min(src.length(), open + 1 + REGION_LIMIT));
            if (rest.stripLeading().startsWith("\"")) {
                calls.add(new JavaCall(m.group(1), -1, -1, -1, file, m.group(1)));
                continue;
            }
            int close = rest.indexOf(')');
            String args = close < 0 ? "" : rest.substring(0, close);
            if (args.contains("\"")) {
                calls.add(new JavaCall(m.group(1), -1, -1, -1, file, m.group(1)));
                continue;
            }
            int total = 0;
            int sessionOut = 0;
            for (String a : args.split(",")) {
                String t = a.strip();
                if (!t.isEmpty()) {
                    total++;
                    if (t.startsWith("@")) {
                        sessionOut++;
                    }
                }
            }
            int registered = outRegistrations(rest);
            calls.add(new JavaCall(m.group(1), total, registered < 0 ? -1 : sessionOut + registered, -1, file,
                m.group(1)));
        }
    }

    /** prepareCall 이후 첫 execute() 까지의 registerOutParameter 리터럴 인덱스 수. 인덱스가 변수면 -1(판정 불가). */
    private static int outRegistrations(String region) {
        Matcher end = EXECUTE_END.matcher(region);
        String scope = end.find() ? region.substring(0, end.start()) : region;
        Set<String> indices = new LinkedHashSet<>();
        Matcher r = REGISTER_OUT.matcher(scope);
        while (r.find()) {
            if (!r.group(1).matches("\\d+")) {
                return -1;
            }
            indices.add(r.group(1));
        }
        return indices.size();
    }

    private static void collectBuilders(String src, String file, List<JavaCall> calls) {
        Matcher m = CALL_BUILDER.matcher(src);
        while (m.find()) {
            String name = resolveName(src, m.group(1), m.start());
            calls.add(new JavaCall(name, -1, -1, -1, file, m.group(1)));
        }
    }

    private static void collectSimpleJdbcCalls(String src, String file, List<JavaCall> calls) {
        Matcher m = SIMPLE_JDBC_CALL.matcher(src);
        while (m.find()) {
            String name = resolveName(src, m.group(1), m.start());
            int start = Math.max(0, src.lastIndexOf("SimpleJdbcCall(", m.start()));
            if (m.start() - start > BUILDER_LOOKBACK) {
                start = m.start();
            }
            int semicolon = src.indexOf(';', m.end());
            String chain = src.substring(start, semicolon < 0 ? src.length() : semicolon);
            if (chain.contains("withoutProcedureColumnMetaDataAccess")) {
                int in = count(chain, "new SqlParameter(");
                int out = count(chain, "new SqlOutParameter(") + count(chain, "new SqlInOutParameter(");
                calls.add(new JavaCall(name, in + out, out, -1, file, m.group(1)));
                continue;
            }
            int execute = src.indexOf(".execute(", m.end());
            String region = src.substring(m.end(), execute < 0 ? Math.min(src.length(), m.end() + REGION_LIMIT)
                : execute);
            Set<String> inNames = new LinkedHashSet<>();
            Matcher a = ADD_VALUE.matcher(region);
            while (a.find()) {
                inNames.add(a.group(1));
            }
            calls.add(new JavaCall(name, -1, -1, inNames.isEmpty() ? -1 : inNames.size(), file, m.group(1)));
        }
    }

    private static void collectStoredQueries(String src, String file, List<JavaCall> calls) {
        Matcher m = STORED_QUERY.matcher(src);
        while (m.find()) {
            String expr = (m.group(1) != null ? m.group(1) : m.group(2)).strip();
            calls.add(new JavaCall(resolveName(src, expr, m.start()), -1, -1, -1, file, expr));
        }
    }

    private static int count(String text, String token) {
        int n = 0;
        for (int i = text.indexOf(token); i >= 0; i = text.indexOf(token, i + token.length())) {
            n++;
        }
        return n;
    }

    /** 문자열 리터럴·같은 파일 상수/지역 변수·다른 클래스 상수(Class.FIELD)를 이름으로 해석. 실패하면 null. */
    static String resolveName(String src, String expr, int position) {
        String e = expr.strip();
        if (e.matches("\"\\w+\"")) {
            return e.substring(1, e.length() - 1);
        }
        if (e.matches("\\w+")) {
            Matcher m = Pattern.compile("\\bString\\s+" + e + "\\s*=\\s*\"(\\w+)\"\\s*;").matcher(src);
            String found = null;
            while (m.find()) {
                if (found == null || m.start() < position) {
                    found = m.group(1);
                }
            }
            return found;
        }
        if (e.matches("[A-Z]\\w*\\.[A-Z_][A-Z0-9_]*")) {
            String[] parts = e.split("\\.");
            try (Stream<Path> s = Files.walk(JAVA_ROOT)) {
                for (Path p : s.filter(x -> x.getFileName().toString().equals(parts[0] + ".java")).toList()) {
                    String other = Files.readString(p, StandardCharsets.UTF_8);
                    Matcher m = Pattern.compile("\\bString\\s+" + parts[1] + "\\s*=\\s*\"(\\w+)\"").matcher(other);
                    if (m.find()) {
                        return m.group(1);
                    }
                }
            } catch (IOException ex) {
                return null;
            }
        }
        return null;
    }

    /** 문자열 리터럴 안의 // 를 보존하면서 Java 주석을 지운다. */
    static String stripJavaComments(String src) {
        StringBuilder out = new StringBuilder(src.length());
        int i = 0;
        int n = src.length();
        while (i < n) {
            char c = src.charAt(i);
            if (c == '"' || c == '\'') {
                int j = i + 1;
                if (c == '"' && src.startsWith("\"\"\"", i)) {
                    int endBlock = src.indexOf("\"\"\"", i + 3);
                    j = endBlock < 0 ? n : endBlock + 3;
                } else {
                    while (j < n && src.charAt(j) != c) {
                        j += src.charAt(j) == '\\' ? 2 : 1;
                    }
                    j = Math.min(n, j + 1);
                }
                out.append(src, i, j);
                i = j;
            } else if (src.startsWith("//", i)) {
                int eol = src.indexOf('\n', i);
                i = eol < 0 ? n : eol;
            } else if (src.startsWith("/*", i)) {
                int endComment = src.indexOf("*/", i + 2);
                i = endComment < 0 ? n : endComment + 2;
                out.append(' ');
            } else {
                out.append(c);
                i++;
            }
        }
        return out.toString();
    }

    static String balanced(String text, int openIndex) {
        int depth = 0;
        for (int i = openIndex; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '(') {
                depth++;
            } else if (c == ')') {
                depth--;
                if (depth == 0) {
                    return text.substring(openIndex + 1, i);
                }
            }
        }
        return text.substring(openIndex + 1);
    }

    static List<String> splitTopLevel(String params) {
        List<String> parts = new ArrayList<>();
        int depth = 0;
        int start = 0;
        for (int i = 0; i < params.length(); i++) {
            char c = params.charAt(i);
            if (c == '(') {
                depth++;
            } else if (c == ')') {
                depth--;
            } else if (c == ',' && depth == 0) {
                parts.add(params.substring(start, i));
                start = i + 1;
            }
        }
        parts.add(params.substring(start));
        return parts;
    }
}
