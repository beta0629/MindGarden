package com.coresolution.guardrail;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/**
 * 가드레일 검사 공통 래칫(ratchet) 베이스라인.
 *
 * <p>파일 형식: 한 줄에 {@code <KIND> <key> # <사유>}. {@code KIND} 는 검사마다 정한 분류
 * (예: {@code PUBLIC} 영구 예외, {@code TODO} 기존 위반)이며 사유는 필수다. 빈 줄과 {@code #} 로 시작하는
 * 줄은 주석이다.</p>
 *
 * <p>판정: 현재 위반 중 베이스라인에 없는 것은 신규 위반(FAIL), 베이스라인에 있는데 더 이상 위반이
 * 아닌 항목은 줄여야 할 항목(FAIL)이다. 즉 베이스라인은 줄어들기만 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public final class GuardrailBaseline {

    private static final String REASON_SEPARATOR = " # ";

    private final Path file;
    private final Map<String, String> kindByKey;
    private final List<String> formatErrors;

    private GuardrailBaseline(Path file, Map<String, String> kindByKey, List<String> formatErrors) {
        this.file = file;
        this.kindByKey = kindByKey;
        this.formatErrors = formatErrors;
    }

    /**
     * 베이스라인 파일을 읽는다.
     *
     * @param file         베이스라인 파일
     * @param allowedKinds 허용 분류
     * @return 베이스라인
     * @throws IOException 파일을 읽지 못할 때
     */
    public static GuardrailBaseline load(Path file, Set<String> allowedKinds) throws IOException {
        Map<String, String> kinds = new LinkedHashMap<>();
        List<String> errors = new ArrayList<>();
        List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i).strip();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            String where = file.getFileName() + ":" + (i + 1);
            int sep = line.indexOf(REASON_SEPARATOR);
            String reason = sep < 0 ? "" : line.substring(sep + REASON_SEPARATOR.length()).strip();
            String body = sep < 0 ? line : line.substring(0, sep).strip();
            int space = body.indexOf(' ');
            String kind = space < 0 ? body : body.substring(0, space);
            String key = space < 0 ? "" : body.substring(space + 1).strip();
            if (!allowedKinds.contains(kind) || key.isEmpty()) {
                errors.add(where + " 형식 오류 — '<" + String.join("|", allowedKinds) + "> <key> # <사유>' 로 고치세요");
            } else if (reason.isEmpty()) {
                errors.add(where + " 사유 누락 — 줄 끝에 ' # <사유/TODO>' 를 적으세요: " + key);
            } else if (kinds.putIfAbsent(key, kind) != null) {
                errors.add(where + " 중복 항목 — 한 줄만 남기세요: " + key);
            }
        }
        return new GuardrailBaseline(file, kinds, errors);
    }

    /**
     * 현재 위반 목록과 베이스라인을 비교해 실패 메시지(한 줄에 하나)를 돌려준다.
     *
     * @param currentViolations 현재 위반 key 집합
     * @param fixHint           신규 위반 시 고칠 방법 한 줄
     * @return 실패 메시지 (없으면 빈 목록)
     */
    public List<String> diff(Collection<String> currentViolations, String fixHint) {
        List<String> failures = new ArrayList<>(formatErrors);
        Set<String> current = new TreeSet<>(currentViolations);
        for (String key : current) {
            if (!kindByKey.containsKey(key)) {
                failures.add("신규 위반: " + key + " — " + fixHint);
            }
        }
        for (String key : new TreeSet<>(kindByKey.keySet())) {
            if (!current.contains(key)) {
                failures.add("베이스라인 정리 필요: " + key + " — 더 이상 위반이 아니므로 "
                    + file.getFileName() + " 에서 이 줄을 삭제하세요");
            }
        }
        return failures;
    }

    /**
     * @param key 항목 key
     * @return 분류 (없으면 null)
     */
    public String kindOf(String key) {
        return kindByKey.get(key);
    }

    /**
     * 실패 메시지를 assertion 문구로 묶는다.
     *
     * @param title    검사 이름
     * @param failures 실패 메시지
     * @return 여러 줄 문구
     */
    public static String report(String title, List<String> failures) {
        return title + " FAIL (" + failures.size() + "건)\n  - " + String.join("\n  - ", failures);
    }
}
