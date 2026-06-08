package com.coresolution.consultation.service;

import java.util.Optional;

/**
 * Apple T2 (1.2 UGC) — 커뮤니티 자동 콘텐츠 필터 서비스.
 *
 * <p>한국어/영어 금칙어 사전을 기반으로 게시글·댓글 본문을 검사하고, 매칭 시 콘텐츠를
 * 자동 모더레이션 큐로 격리하는 책임을 진다. 단순 substring 매칭이며 (Aho-Corasick 미사용)
 * 1차 버전은 운영자가 어드민 페이지에서 검수하는 흐름을 전제한다.</p>
 *
 * <p>호출 위치: {@link CommunityService#createPost} / {@link CommunityService#addComment} 직전.
 * 매칭 결과는 호출 측이 {@code auto_moderated=true} 와 {@code moderation_status=PENDING} 으로
 * 격리하고 {@code auto_moderated_reason_code} 를 저장한다.</p>
 *
 * <p>1차 사전: {@code src/main/resources/community/bad-words-ko.txt} +
 * {@code bad-words-en.txt}. 핫리로드는 미지원이며 운영 변경은 재배포로 반영한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public interface CommunityContentFilterService {

    /**
     * 본문 내 금칙어 검사 결과.
     *
     * @param matched      금칙어 매칭 여부
     * @param reasonCode   매칭 시 분류 코드 (예: PROFANITY, SEXUAL, VIOLENCE, SPAM)
     * @param matchedTerm  매칭된 단어(로깅·통계용, UI 노출 금지)
     */
    record FilterResult(boolean matched, String reasonCode, String matchedTerm) {
        /** 매칭되지 않은 결과. */
        public static FilterResult clean() {
            return new FilterResult(false, null, null);
        }

        /** 매칭된 결과. */
        public static FilterResult flagged(String reasonCode, String matchedTerm) {
            return new FilterResult(true, reasonCode, matchedTerm);
        }

        /** 매칭 결과를 {@link Optional} 로 변환 — clean 이면 empty. */
        public Optional<String> reasonCodeOptional() {
            return matched ? Optional.ofNullable(reasonCode) : Optional.empty();
        }
    }

    /**
     * 본문(제목 + 본문 또는 댓글 본문)을 금칙어 사전으로 검사한다.
     *
     * <p>다중 매칭이 있어도 우선순위(욕설 &gt; 성적 &gt; 폭력 &gt; 스팸 &gt; 혐오) 첫 매칭만 반환한다.
     * 매칭이 없으면 {@link FilterResult#clean()} 반환.</p>
     *
     * @param text 검사 대상 본문(null 또는 빈 문자열이면 clean)
     * @return 매칭 결과
     */
    FilterResult inspect(String text);

    /**
     * 사전 크기 — 운영 진단·테스트 보조.
     *
     * @return 등록된 금칙어 개수 (한국어 + 영어 합산)
     */
    int dictionarySize();
}
