package com.coresolution.consultation.util;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * SMS 템플릿 변수 치환 렌더러.
 *
 * <p>두 가지 자리표시자 패턴을 지원한다 — 알림톡과 동일한 정책으로 통일:
 * <ul>
 *   <li><b>Named</b>: {@code {{varName}}} — 어드민 UI 가 다루는 표준 패턴.</li>
 *   <li><b>Positional</b>: {@code {0}}, {@code {1}}, ... — 레거시 호환
 *       (NotificationServiceImpl.buildSmsMessage 가 String[] params 로 호출하는 경우).</li>
 * </ul>
 *
 * <p>두 패턴은 함께 쓰지 않도록 시드를 정리했지만, 안전망으로 둘 다 처리한다.
 * 누락된 변수는 빈 문자열로 치환되며, {@link #findMissingVariables(String, Map)} 로
 * 어드민 미리보기에서 누락 키를 조회할 수 있다.
 *
 * @author MindGarden
 * @since 2026-05-29
 */
public final class SmsTemplateRenderer {

    /** {@code {{varName}}} 매칭. 변수명은 영문/숫자/언더스코어로 한정. */
    private static final Pattern NAMED_PATTERN = Pattern.compile("\\{\\{\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*}}");

    /** {@code {0}} {@code {1}} ... 매칭 (레거시 positional). */
    private static final Pattern POSITIONAL_PATTERN = Pattern.compile("\\{(\\d+)}");

    private SmsTemplateRenderer() {
    }

    /**
     * 본문에 named 변수를 치환한다. positional 자리표시자는 변경하지 않는다.
     *
     * @param template  본문 (null/빈 문자열 안전)
     * @param variables 변수 map (null 안전)
     * @return 치환 결과
     */
    public static String renderNamed(String template, Map<String, String> variables) {
        if (template == null || template.isEmpty()) {
            return template;
        }
        Map<String, String> safe = variables != null ? variables : Collections.emptyMap();
        Matcher m = NAMED_PATTERN.matcher(template);
        StringBuffer out = new StringBuffer();
        while (m.find()) {
            String key = m.group(1);
            String value = safe.getOrDefault(key, "");
            m.appendReplacement(out, Matcher.quoteReplacement(value));
        }
        m.appendTail(out);
        return out.toString();
    }

    /**
     * 본문에 positional 자리표시자를 치환한다.
     *
     * @param template 본문
     * @param params   순서 기반 인자 (null 안전)
     * @return 치환 결과
     */
    public static String renderPositional(String template, String[] params) {
        if (template == null || template.isEmpty()) {
            return template;
        }
        if (params == null || params.length == 0) {
            return template;
        }
        Matcher m = POSITIONAL_PATTERN.matcher(template);
        StringBuffer out = new StringBuffer();
        while (m.find()) {
            int idx;
            try {
                idx = Integer.parseInt(m.group(1));
            } catch (NumberFormatException e) {
                idx = -1;
            }
            String value = (idx >= 0 && idx < params.length && params[idx] != null)
                    ? params[idx]
                    : "";
            m.appendReplacement(out, Matcher.quoteReplacement(value));
        }
        m.appendTail(out);
        return out.toString();
    }

    /**
     * named + positional 모두 적용한다 (named 먼저, 이어서 positional).
     *
     * @param template  본문
     * @param variables named 변수 map (null 안전)
     * @param params    positional 인자 배열 (null 안전)
     * @return 치환 결과
     */
    public static String render(String template, Map<String, String> variables, String[] params) {
        String namedRendered = renderNamed(template, variables);
        return renderPositional(namedRendered, params);
    }

    /**
     * 본문 안의 named 변수 키 집합을 추출한다 (UI 변수 입력 폼 자동 생성용).
     *
     * @param template 본문 (null 안전)
     * @return 등장 순서를 보존한 unique 변수 키 리스트
     */
    public static List<String> extractNamedVariables(String template) {
        if (template == null || template.isEmpty()) {
            return Collections.emptyList();
        }
        Matcher m = NAMED_PATTERN.matcher(template);
        List<String> ordered = new ArrayList<>();
        Map<String, Boolean> seen = new HashMap<>();
        while (m.find()) {
            String key = m.group(1);
            if (!seen.containsKey(key)) {
                seen.put(key, Boolean.TRUE);
                ordered.add(key);
            }
        }
        return ordered;
    }

    /**
     * 본문에 등장하지만 입력값이 없는 변수 키 리스트.
     *
     * @param template  본문
     * @param variables 변수 map (null 안전)
     * @return 누락 키 리스트 (등장 순서 보존, 중복 제거)
     */
    public static List<String> findMissingVariables(String template, Map<String, String> variables) {
        Map<String, String> safe = variables != null ? variables : Collections.emptyMap();
        List<String> missing = new ArrayList<>();
        for (String key : extractNamedVariables(template)) {
            String v = safe.get(key);
            if (v == null || v.isEmpty()) {
                missing.add(key);
            }
        }
        return missing;
    }

    /**
     * 본문 UTF-8 바이트 길이.
     *
     * @param content 본문 (null 안전)
     * @return 바이트 길이 (null 이면 0)
     */
    public static int byteLengthUtf8(String content) {
        return content == null ? 0 : content.getBytes(StandardCharsets.UTF_8).length;
    }
}
