package com.coresolution.consultation.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 표준 프로시저 SQL 파일(standardized 와 deployment twin)에서 파라미터 목록과 DROP·CREATE 대상을 읽는다.
 * 테스트가 시그니처를 손으로 다시 적지 않게 한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
final class StandardProcedureSqlSignature {

    private static final Path PROCEDURE_DIR = Path.of("database/schema/procedures_standardized");

    private static final Pattern PARAMETER = Pattern.compile(
            "(INOUT|IN|OUT)\\s+(\\w+)\\s+(\\w+)", Pattern.CASE_INSENSITIVE);

    private static final Pattern DROP_TARGET = Pattern.compile(
            "^\\s*DROP\\s+PROCEDURE\\s+IF\\s+EXISTS\\s+`?(\\w+)`?", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

    private static final Pattern CREATE_TARGET = Pattern.compile(
            "^\\s*CREATE\\s+PROCEDURE\\s+`?(\\w+)`?", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

    private StandardProcedureSqlSignature() {
    }

    /**
     * @param procedure 프로시저 이름
     * @return {@code <name>_standardized.sql} 경로
     */
    static Path standardized(String procedure) {
        return PROCEDURE_DIR.resolve(procedure + "_standardized.sql");
    }

    /**
     * @param procedure 프로시저 이름
     * @return {@code deployment/<name>_deploy.sql} 경로
     */
    static Path deploy(String procedure) {
        return PROCEDURE_DIR.resolve("deployment").resolve(procedure + "_deploy.sql");
    }

    /**
     * @param procedure 프로시저 이름
     * @return 표준 SQL 과 배포 twin 의 파라미터. 둘이 다르면 예외
     */
    static List<Param> readDeployedDefinition(String procedure) {
        List<Param> standardized = read(standardized(procedure), procedure);
        List<Param> deploy = read(deploy(procedure), procedure);
        if (!standardized.equals(deploy)) {
            throw new IllegalStateException(
                    "표준 SQL 과 배포 SQL 의 " + procedure + " 파라미터가 다릅니다.");
        }
        return standardized;
    }

    /**
     * @param procedure 프로시저 이름
     * @return information_schema.PARAMETERS 행 형태. 모드·이름은 SQL 파일 그대로다
     */
    static List<Map<String, Object>> informationSchemaRows(String procedure) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Param param : readDeployedDefinition(procedure)) {
            rows.add(param.toInformationSchemaRow());
        }
        return rows;
    }

    /**
     * @param sqlFile SQL 파일
     * @return {@code DROP PROCEDURE IF EXISTS} 대상 이름 (등장 순)
     */
    static List<String> dropTargets(Path sqlFile) {
        return matches(DROP_TARGET, text(sqlFile));
    }

    /**
     * @param sqlFile SQL 파일
     * @return {@code CREATE PROCEDURE} 대상 이름 (등장 순)
     */
    static List<String> createTargets(Path sqlFile) {
        return matches(CREATE_TARGET, text(sqlFile));
    }

    static List<Param> read(Path sqlFile, String procedure) {
        String text = text(sqlFile);
        int create = text.indexOf("CREATE PROCEDURE " + procedure + "(");
        if (create < 0) {
            throw new IllegalStateException("CREATE PROCEDURE " + procedure + " 없음: " + sqlFile);
        }
        int open = text.indexOf('(', create);
        int end = closingParen(text, open);
        List<Param> params = new ArrayList<>();
        int ordinal = 1;
        for (String part : splitTopLevel(stripLineComments(text.substring(open + 1, end)))) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            Matcher matcher = PARAMETER.matcher(trimmed);
            if (!matcher.lookingAt()) {
                throw new IllegalStateException("파라미터 파싱 실패: " + trimmed);
            }
            params.add(new Param(
                    ordinal++,
                    matcher.group(1).toUpperCase(Locale.ROOT),
                    matcher.group(2),
                    matcher.group(3).toUpperCase(Locale.ROOT)));
        }
        if (params.isEmpty()) {
            throw new IllegalStateException("파라미터가 없습니다: " + sqlFile);
        }
        return params;
    }

    private static String text(Path sqlFile) {
        try {
            return Files.readString(sqlFile);
        } catch (IOException e) {
            throw new IllegalStateException("프로시저 SQL 을 읽지 못했습니다: " + sqlFile, e);
        }
    }

    private static List<String> matches(Pattern pattern, String text) {
        List<String> names = new ArrayList<>();
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            names.add(matcher.group(1));
        }
        return names;
    }

    private static int closingParen(String text, int open) {
        int depth = 0;
        for (int i = open; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '(') {
                depth++;
            } else if (c == ')') {
                depth--;
                if (depth == 0) {
                    return i;
                }
            }
        }
        throw new IllegalStateException("프로시저 파라미터 목록이 닫히지 않았습니다.");
    }

    private static String stripLineComments(String list) {
        StringBuilder out = new StringBuilder();
        for (String line : list.split("\n", -1)) {
            int comment = line.indexOf("--");
            if (comment >= 0) {
                line = line.substring(0, comment);
            }
            out.append(line).append('\n');
        }
        return out.toString();
    }

    private static List<String> splitTopLevel(String list) {
        List<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        int depth = 0;
        for (int i = 0; i < list.length(); i++) {
            char c = list.charAt(i);
            if (c == '(') {
                depth++;
                current.append(c);
            } else if (c == ')') {
                depth--;
                current.append(c);
            } else if (c == ',' && depth == 0) {
                parts.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        parts.add(current.toString());
        return parts;
    }

    /**
     * @param ordinal  1-based
     * @param mode     IN / OUT / INOUT
     * @param name     파라미터명
     * @param dataType SQL 타입 이름
     */
    record Param(int ordinal, String mode, String name, String dataType) {

        boolean out() {
            return "OUT".equalsIgnoreCase(mode) || "INOUT".equalsIgnoreCase(mode);
        }

        boolean in() {
            return "IN".equalsIgnoreCase(mode) || "INOUT".equalsIgnoreCase(mode);
        }

        Param withMode(String newMode) {
            return new Param(ordinal, newMode, name, dataType);
        }

        Map<String, Object> toInformationSchemaRow() {
            Map<String, Object> row = new HashMap<>();
            row.put("ORDINAL_POSITION", ordinal);
            row.put("PARAMETER_MODE", mode);
            row.put("PARAMETER_NAME", name);
            row.put("DATA_TYPE", dataType);
            return row;
        }
    }
}
