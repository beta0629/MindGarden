/**
 * 어드민 콘텐츠 마스터 자동 채움 헬퍼 단위 테스트.
 *
 * 사용량 한도로 인한 메인 직접 작성 PR — 자동 채움 helper 회귀 차단 목적.
 *
 * @author CoreSolution
 * @since 2026-06-03
 */

import {
  slugify,
  generateHealingCode,
  generatePsychoSlug,
  estimateReadMinutes,
  nextSortOrder,
  inferMediaType,
  normalizeMediaType,
  HEALING_MEDIA_TYPE_OPTIONS,
  CONTENT_MASTER_DEFAULTS
} from '../contentMasterHelpers';

describe('contentMasterHelpers', () => {
  describe('slugify', () => {
    test('영문 제목은 lowercase + dash 로 변환된다', () => {
      expect(slugify('Daily Meditation Guide')).toBe('daily-meditation-guide');
    });

    test('한글은 제거되고 빈 문자열이 된다', () => {
      expect(slugify('마음 정원 가이드')).toBe('');
    });

    test('한영 혼합은 영문만 남는다', () => {
      expect(slugify('마음 정원 Guide v2')).toBe('guide-v2');
    });

    test('연속 공백·언더스코어는 단일 dash 로 정규화된다', () => {
      expect(slugify('hello   __world')).toBe('hello-world');
    });

    test('null·undefined·non-string 입력은 빈 문자열을 반환한다', () => {
      expect(slugify(null)).toBe('');
      expect(slugify(undefined)).toBe('');
      expect(slugify(123)).toBe('');
    });

    test('56자 초과 입력은 잘린다', () => {
      const long = 'a'.repeat(120);
      expect(slugify(long).length).toBe(56);
    });
  });

  describe('generateHealingCode / generatePsychoSlug', () => {
    test('두 번 호출 시 epoch 변동으로 다른 값이거나 base 가 동일해도 suffix 가 변할 수 있다', () => {
      const c1 = generateHealingCode('Daily Walk');
      expect(c1.startsWith('daily-walk-')).toBe(true);
      expect(c1.length).toBeGreaterThan('daily-walk-'.length);
    });

    test('한글만 입력 시 healing- prefix 폴백이 적용된다', () => {
      const c = generateHealingCode('마음챙김');
      expect(c.startsWith('healing-')).toBe(true);
    });

    test('빈 입력도 폴백 prefix 로 생성된다', () => {
      expect(generatePsychoSlug('').startsWith('psycho-')).toBe(true);
      expect(generateHealingCode('').startsWith('healing-')).toBe(true);
    });
  });

  describe('estimateReadMinutes', () => {
    test('빈 본문은 기본 5분', () => {
      expect(estimateReadMinutes('')).toBe(CONTENT_MASTER_DEFAULTS.DEFAULT_READ_MINUTES);
      expect(estimateReadMinutes(null)).toBe(CONTENT_MASTER_DEFAULTS.DEFAULT_READ_MINUTES);
    });

    test('짧은 본문은 최소 1분', () => {
      expect(estimateReadMinutes('짧은 글')).toBeGreaterThanOrEqual(1);
    });

    test('긴 본문은 길이에 비례한다 (한글 350자/분 기준)', () => {
      const long = '가'.repeat(700);
      expect(estimateReadMinutes(long)).toBe(2);
    });
  });

  describe('nextSortOrder', () => {
    test('빈 배열은 초기값 10', () => {
      expect(nextSortOrder([])).toBe(10);
      expect(nextSortOrder(null)).toBe(10);
    });

    test('현재 최대 + 10', () => {
      expect(nextSortOrder([{ sortOrder: 30 }, { sortOrder: 50 }])).toBe(60);
    });

    test('숫자 변환 불가 항목은 무시', () => {
      expect(nextSortOrder([{ sortOrder: 'abc' }, { sortOrder: 20 }])).toBe(30);
    });

    test('null row 도 안전 처리', () => {
      expect(nextSortOrder([null, undefined, { sortOrder: 15 }])).toBe(25);
    });
  });

  describe('inferMediaType', () => {
    test('mp3 → AUDIO', () => {
      expect(inferMediaType('https://cdn.example.com/audio/track.mp3')).toBe('AUDIO');
    });

    test('youtube → VIDEO', () => {
      expect(inferMediaType('https://www.youtube.com/watch?v=abc')).toBe('VIDEO');
      expect(inferMediaType('https://youtu.be/abc')).toBe('VIDEO');
    });

    test('mp4 → VIDEO', () => {
      expect(inferMediaType('https://cdn.example.com/clip.mp4')).toBe('VIDEO');
    });

    test('meditation 경로 → MEDITATION', () => {
      expect(inferMediaType('https://app.example.com/meditation/day-1')).toBe('MEDITATION');
    });

    test('일반 URL → ARTICLE', () => {
      expect(inferMediaType('https://blog.example.com/post/12')).toBe('ARTICLE');
    });

    test('빈 URL → ARTICLE (기본)', () => {
      expect(inferMediaType('')).toBe('ARTICLE');
      expect(inferMediaType(null)).toBe('ARTICLE');
    });

    test('query string 이 붙은 미디어 확장자도 인식', () => {
      expect(inferMediaType('https://cdn.x/file.mp3?token=abc')).toBe('AUDIO');
    });
  });

  describe('normalizeMediaType', () => {
    test('유효 enum 값은 그대로', () => {
      expect(normalizeMediaType('MEDITATION')).toBe('MEDITATION');
      expect(normalizeMediaType('article')).toBe('ARTICLE');
    });

    test('오타·빈값은 ARTICLE 폴백', () => {
      expect(normalizeMediaType('MEDIATION')).toBe('ARTICLE');
      expect(normalizeMediaType('')).toBe('ARTICLE');
      expect(normalizeMediaType(null)).toBe('ARTICLE');
    });
  });

  describe('HEALING_MEDIA_TYPE_OPTIONS', () => {
    test('4종 + 정확한 enum 값', () => {
      const values = HEALING_MEDIA_TYPE_OPTIONS.map((o) => o.value).sort();
      expect(values).toEqual(['ARTICLE', 'AUDIO', 'MEDITATION', 'VIDEO']);
    });
  });
});
