package com.coresolution.consultation.sct.util;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.coresolution.consultation.sct.constant.SctFormType;

/**
 * mindgarden_sct_v3.md 문항 일람 표에서 prompt_text 를 파싱한다.
 * 시드·DB 원문 일치 검증용. 문구는 한 글자도 바꾸지 않는다.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public final class SctFormV3MarkdownParser {

    private static final Pattern HEADER = Pattern.compile(
            "\\*\\*마인드가든 문장완성 질문지 \\((성인용|청소년용|아동용)\\) 문항 일람\\*\\*");

    private SctFormV3MarkdownParser() {
    }

    /**
     * 마크다운 전체 텍스트에서 양식별 prompt 목록(1~50)을 추출한다.
     *
     * @param markdown v3 원문
     * @return formType → prompt_text 50개
     */
    public static Map<SctFormType, List<String>> parsePrompts(String markdown) {
        if (markdown == null || markdown.isBlank()) {
            throw new IllegalArgumentException("markdown 이 비어 있습니다.");
        }
        Map<SctFormType, List<String>> result = new LinkedHashMap<>();
        Matcher headerMatcher = HEADER.matcher(markdown);
        List<Integer> starts = new ArrayList<>();
        List<SctFormType> types = new ArrayList<>();
        while (headerMatcher.find()) {
            types.add(mapLabel(headerMatcher.group(1)));
            starts.add(headerMatcher.start());
        }
        for (int i = 0; i < starts.size(); i++) {
            int from = starts.get(i);
            int to = (i + 1 < starts.size()) ? starts.get(i + 1) : markdown.length();
            String block = markdown.substring(from, to);
            result.put(types.get(i), parseTablePrompts(block));
        }
        return Collections.unmodifiableMap(result);
    }

    /**
     * 파일 경로에서 파싱.
     *
     * @param path md 경로
     * @return formType → prompt 목록
     * @throws IOException 읽기 실패
     */
    public static Map<SctFormType, List<String>> parsePromptsFromFile(Path path) throws IOException {
        String md = Files.readString(path, StandardCharsets.UTF_8);
        return parsePrompts(md);
    }

    private static SctFormType mapLabel(String label) {
        return switch (label) {
            case "성인용" -> SctFormType.ADULT;
            case "청소년용" -> SctFormType.ADOLESCENT;
            case "아동용" -> SctFormType.CHILD;
            default -> throw new IllegalArgumentException("알 수 없는 양식: " + label);
        };
    }

    private static List<String> parseTablePrompts(String block) {
        String[] lines = block.split("\n");
        boolean inTable = false;
        List<String> prompts = new ArrayList<>(50);
        for (String line : lines) {
            if (line.startsWith("| 번호 | 문항 |")) {
                inTable = true;
                continue;
            }
            if (!inTable) {
                continue;
            }
            if (!line.startsWith("|")) {
                break;
            }
            if (line.matches("^\\|[-| :]+\\|$") || line.contains("---")) {
                continue;
            }
            String[] parts = line.strip().split("\\|", -1);
            // leading empty, no, prompt, ...
            if (parts.length < 4) {
                continue;
            }
            String noRaw = parts[1].trim();
            try {
                Integer.parseInt(noRaw);
            } catch (NumberFormatException e) {
                continue;
            }
            prompts.add(parts[2].trim());
        }
        if (prompts.size() != 50) {
            throw new IllegalStateException("문항 수 불일치: " + prompts.size());
        }
        return Collections.unmodifiableList(prompts);
    }
}
