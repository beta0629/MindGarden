package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.service.CommunityContentFilterService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Apple T2 (1.2 UGC) — {@link CommunityContentFilterServiceImpl} 단위 테스트.
 *
 * <p>금칙어 사전 매칭, 카테고리 우선순위, 정상 본문 통과, 빈 본문 처리 회귀 게이트.
 * classpath 사전(community/bad-words-{ko,en}.txt)을 실제 로드해 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@DisplayName("CommunityContentFilterServiceImpl — 자동 콘텐츠 필터")
class CommunityContentFilterServiceImplTest {

    private CommunityContentFilterServiceImpl filter;

    @BeforeEach
    void setUp() {
        filter = new CommunityContentFilterServiceImpl();
        filter.loadDictionaries();
    }

    @Test
    @DisplayName("정상 본문은 통과")
    void cleanContentPasses() {
        CommunityContentFilterService.FilterResult r = filter.inspect("오늘 상담을 받고 마음이 조금 편해졌어요. 모두 화이팅!");
        assertThat(r.matched()).isFalse();
        assertThat(r.reasonCode()).isNull();
    }

    @Test
    @DisplayName("한국어 욕설은 PROFANITY 매칭")
    void koreanProfanityFlagged() {
        CommunityContentFilterService.FilterResult r = filter.inspect("야 이 새끼야 진짜 짜증난다");
        assertThat(r.matched()).isTrue();
        assertThat(r.reasonCode()).isEqualTo("PROFANITY");
    }

    @Test
    @DisplayName("영어 욕설은 PROFANITY 매칭(소문자 정규화)")
    void englishProfanityFlagged() {
        CommunityContentFilterService.FilterResult r = filter.inspect("This is FUCKING terrible.");
        assertThat(r.matched()).isTrue();
        assertThat(r.reasonCode()).isEqualTo("PROFANITY");
    }

    @Test
    @DisplayName("성적 표현은 SEXUAL 매칭")
    void sexualContentFlagged() {
        CommunityContentFilterService.FilterResult r = filter.inspect("야동 보러가자");
        assertThat(r.matched()).isTrue();
        assertThat(r.reasonCode()).isIn("PROFANITY", "SEXUAL");
    }

    @Test
    @DisplayName("폭력 표현은 VIOLENCE 매칭")
    void violenceContentFlagged() {
        CommunityContentFilterService.FilterResult r = filter.inspect("자살해야겠어 정말로");
        assertThat(r.matched()).isTrue();
        assertThat(r.reasonCode()).isIn("VIOLENCE", "PROFANITY");
    }

    @Test
    @DisplayName("스팸 키워드는 SPAM 매칭")
    void spamKeywordFlagged() {
        CommunityContentFilterService.FilterResult r = filter.inspect("바카라 한판 어때요?");
        assertThat(r.matched()).isTrue();
        assertThat(r.reasonCode()).isEqualTo("SPAM");
    }

    @Test
    @DisplayName("빈 본문/null 본문은 clean")
    void emptyOrNullText() {
        assertThat(filter.inspect(null).matched()).isFalse();
        assertThat(filter.inspect("").matched()).isFalse();
        assertThat(filter.inspect("   ").matched()).isFalse();
    }

    @Test
    @DisplayName("공백을 사이에 넣어도 정규화 후 매칭")
    void spacedProfanityNormalized() {
        // 공백 제거 정규화로 매칭 — 1차 버전 정책
        CommunityContentFilterService.FilterResult r = filter.inspect("씨 발 너무 화가 난다");
        assertThat(r.matched()).isTrue();
    }

    @Test
    @DisplayName("사전 크기는 양수 — 사전 로드 성공 회귀 게이트")
    void dictionaryLoaded() {
        assertThat(filter.dictionarySize()).isGreaterThan(10);
        assertThat(filter.debugCategoryPriority()).contains("PROFANITY", "SEXUAL", "VIOLENCE", "SPAM");
    }
}
