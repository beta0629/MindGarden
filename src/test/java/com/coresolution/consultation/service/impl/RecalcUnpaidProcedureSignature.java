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
 * 배포 SQL 파일에서 {@code RecalcUnpaidSalaryCalculation} 파라미터를 읽는다.
 * 테스트가 시그니처를 손으로 다시 적지 않게 한다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
final class RecalcUnpaidProcedureSignature {

    static final Path STANDARDIZED = Path.of(
            "database/schema/procedures_standardized/RecalcUnpaidSalaryCalculation_standardized.sql");

    static final Path DEPLOY = Path.of(
            "database/schema/procedures_standardized/deployment/RecalcUnpaidSalaryCalculation_deploy.sql");

    private static final Pattern PARAMETER = Pattern.compile(
            "(IN|OUT|INOUT)\\s+(\\w+)\\s+(\\w+)", Pattern.CASE_INSENSITIVE);

    private RecalcUnpaidProcedureSignature() {
    }

    /**
     * @return 표준 SQL 과 배포 twin 의 파라미터. 둘이 다르면 예외
     */
    static List<Param> readDeployedDefinition() {
        List<Param> standardized = read(STANDARDIZED);
        List<Param> deploy = read(DEPLOY);
        if (!standardized.equals(deploy)) {
            throw new IllegalStateException(
                    "표준 SQL 과 배포 SQL 의 RecalcUnpaidSalaryCalculation 파라미터가 다릅니다.");
        }
        return standardized;
    }

    /**
     * @return information_schema.PARAMETERS 행 형태. 모드·이름은 SQL 파일 그대로다
     */
    static List<Map<String, Object>> informationSchemaRows() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Param param : readDeployedDefinition()) {
            rows.add(param.toInformationSchemaRow());
        }
        return rows;
    }

    static List<Param> read(Path sqlFile) {
        String text;
        try {
            text = Files.readString(sqlFile);
        } catch (IOException e) {
            throw new IllegalStateException("프로시저 SQL 을 읽지 못했습니다: " + sqlFile, e);
        }
        int create = text.indexOf("CREATE PROCEDURE RecalcUnpaidSalaryCalculation");
        if (create < 0) {
            throw new IllegalStateException("CREATE PROCEDURE RecalcUnpaidSalaryCalculation 없음: " + sqlFile);
        }
        int open = text.indexOf('(', create);
        int end = closingParen(text, open);
        String list = text.substring(open + 1, end);
        List<String> parts = splitTopLevel(list);
        List<Param> params = new ArrayList<>();
        int ordinal = 1;
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            Matcher matcher = PARAMETER.matcher(trimmed);
            if (!matcher.find()) {
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
