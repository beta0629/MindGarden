package com.coresolution.consultation.service.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import com.coresolution.consultation.service.CommunityContentFilterService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

/**
 * {@link CommunityContentFilterService} 구현 — classpath 사전 기반 단순 substring 매칭.
 *
 * <p>스타트업 시 {@code src/main/resources/community/bad-words-{ko,en}.txt} 를 읽어 메모리 캐시한다.
 * 사전 변경은 재배포로만 반영된다 (1차 버전 정책).</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@Service
public class CommunityContentFilterServiceImpl implements CommunityContentFilterService {

    private static final String DICT_PATH_KO = "community/bad-words-ko.txt";
    private static final String DICT_PATH_EN = "community/bad-words-en.txt";

    /** 분류 우선순위 — 한 본문에 여러 매칭이 있을 때 첫 매칭으로 선택. */
    private static final List<String> CATEGORY_PRIORITY = List.of(
        "PROFANITY",
        "SEXUAL",
        "VIOLENCE",
        "SPAM",
        "HATE"
    );

    /**
     * 카테고리별 사전 — {@link LinkedHashMap} 으로 우선순위 순서를 유지한다.
     * 키: 카테고리 코드, 값: 소문자 정규화된 금칙어 집합.
     */
    private final Map<String, Set<String>> dictionariesByCategory = new LinkedHashMap<>();

    /**
     * 스타트업에 사전을 로드한다. 파일 누락 시 경고 로그만 남기고 빈 사전으로 동작한다 (회귀 안전).
     */
    @PostConstruct
    public void loadDictionaries() {
        for (String category : CATEGORY_PRIORITY) {
            dictionariesByCategory.put(category, new LinkedHashSet<>());
        }
        loadFromClasspath(DICT_PATH_KO);
        loadFromClasspath(DICT_PATH_EN);
        if (log.isInfoEnabled()) {
            int total = dictionariesByCategory.values().stream()
                    .mapToInt(Set::size)
                    .sum();
            log.info("[Community][Filter] 사전 로드 완료 — total={} categories={}", total,
                    dictionariesByCategory.entrySet().stream()
                            .collect(java.util.stream.Collectors.toMap(
                                    Map.Entry::getKey,
                                    e -> e.getValue().size())));
        }
    }

    @Override
    public FilterResult inspect(String text) {
        if (text == null || text.isBlank()) {
            return FilterResult.clean();
        }
        String normalized = normalize(text);
        if (normalized.isEmpty()) {
            return FilterResult.clean();
        }
        for (String category : CATEGORY_PRIORITY) {
            Set<String> dict = dictionariesByCategory.get(category);
            if (dict == null || dict.isEmpty()) {
                continue;
            }
            for (String term : dict) {
                if (normalized.contains(term)) {
                    return FilterResult.flagged(category, term);
                }
            }
        }
        return FilterResult.clean();
    }

    @Override
    public int dictionarySize() {
        return dictionariesByCategory.values().stream()
                .mapToInt(Set::size)
                .sum();
    }

    /**
     * 사전 파일 로드 — 헤더 코멘트 마커("# === 카테고리명 ===")로 카테고리를 구분한다.
     * 파일이 없으면 경고만 남긴다 (테스트 환경 등에서 회귀 안전).
     */
    private void loadFromClasspath(String classpathPath) {
        ClassPathResource resource = new ClassPathResource(classpathPath);
        if (!resource.exists()) {
            log.warn("[Community][Filter] 사전 파일 없음: {}", classpathPath);
            return;
        }
        String currentCategory = "PROFANITY";
        try (InputStream in = resource.getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) {
                    continue;
                }
                if (trimmed.startsWith("#")) {
                    String mappedCategory = detectCategoryFromHeader(trimmed);
                    if (mappedCategory != null) {
                        currentCategory = mappedCategory;
                    }
                    continue;
                }
                String normalized = normalize(trimmed);
                if (normalized.isEmpty()) {
                    continue;
                }
                dictionariesByCategory
                        .computeIfAbsent(currentCategory, k -> new LinkedHashSet<>())
                        .add(normalized);
            }
        } catch (IOException e) {
            log.warn("[Community][Filter] 사전 로드 실패: path={}, message={}", classpathPath, e.getMessage());
        }
    }

    /**
     * 헤더 코멘트에서 카테고리 코드를 추출한다.
     * 예: "# === 욕설 ===" → PROFANITY, "# === Sexual ===" → SEXUAL.
     * 매칭되지 않으면 null 반환 (이전 카테고리 유지).
     */
    private static String detectCategoryFromHeader(String header) {
        String h = header.toLowerCase(Locale.ROOT);
        if (h.contains("욕설") || h.contains("profanity")) {
            return "PROFANITY";
        }
        if (h.contains("성적") || h.contains("sexual")) {
            return "SEXUAL";
        }
        if (h.contains("폭력") || h.contains("violence")) {
            return "VIOLENCE";
        }
        if (h.contains("광고") || h.contains("스팸") || h.contains("spam")) {
            return "SPAM";
        }
        if (h.contains("혐오") || h.contains("차별") || h.contains("hate") || h.contains("slur")) {
            return "HATE";
        }
        return null;
    }

    /**
     * 본문 정규화 — 소문자 변환 + 공백·탭·개행 제거.
     * 자모 분리·이모지 우회는 1차 버전 범위 외 (운영 정책으로 보완).
     */
    private static String normalize(String input) {
        StringBuilder sb = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (Character.isWhitespace(c)) {
                continue;
            }
            sb.append(Character.toLowerCase(c));
        }
        return sb.toString();
    }

    /** 테스트 보조 — 카테고리별 사전 사이즈를 노출한다. */
    Map<String, Integer> debugCategorySizes() {
        Map<String, Integer> out = new LinkedHashMap<>();
        for (Map.Entry<String, Set<String>> entry : dictionariesByCategory.entrySet()) {
            out.put(entry.getKey(), entry.getValue().size());
        }
        return Collections.unmodifiableMap(out);
    }

    /** 테스트 보조 — 우선순위 카테고리 목록. */
    List<String> debugCategoryPriority() {
        return new ArrayList<>(CATEGORY_PRIORITY);
    }
}
