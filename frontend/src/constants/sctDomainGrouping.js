/**
 * SCT 영역 분류 — 출처: docs/project-management/sct-online/web-handoff.md §4
 * 및 build_sct_v3.py FORMS · Flyway V20261123_002 시드 domain_code.
 * API answers[].domainCode 가 있으면 영역별 묶음, 없으면 문항 번호순.
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { SCT_FORM_TYPE } from './sctOnline';

/** 원본 영역 코드 → 표시명 (세부 괄호 제외) */
export const SCT_DOMAIN_TITLE_BY_CODE = Object.freeze({
  SELF_CONCEPT: '자기개념',
  PARENT_FAMILY: '부모/원가족',
  PARTNER: '배우자·연인',
  CHILD_ROLE: '자녀',
  INTERPERSONAL: '대인관계',
  WORK_ROLE: '직장·역할',
  AFFECT: '정서',
  PAST_EXP: '과거 경험',
  FUTURE_GOAL: '미래·목표',
  COPING: '대처·자원·강점',
  VALUE_MEANING: '가치·의미',
  SELF_BODY: '자기개념·신체상',
  PARENT: '부모',
  SIBLING: '형제',
  PEER: '친구·또래',
  ROMANCE: '좋아하는 마음·관계',
  SCHOOL: '학교·교사·학업',
  MEDIA: '미디어·여가',
  CAREER: '미래·진로',
  STRENGTH: '강점·대처',
  SELF: '나',
  FAMILY: '엄마·아빠·가족',
  FRIEND: '친구',
  SCHOOL_TEACHER: '학교·선생님',
  EMOTION: '감정',
  PLAY: '놀이·좋아하는 것',
  WISH: '바람·소원',
  WORRY: '걱정'
});

/**
 * web-handoff 영역별 문항 번호표 순서(시드 domain_code).
 */
export const SCT_DOMAIN_ORDER_BY_FORM = Object.freeze({
  [SCT_FORM_TYPE.ADULT]: [
    'SELF_CONCEPT',
    'PARENT_FAMILY',
    'PARTNER',
    'CHILD_ROLE',
    'INTERPERSONAL',
    'WORK_ROLE',
    'AFFECT',
    'PAST_EXP',
    'FUTURE_GOAL',
    'COPING',
    'VALUE_MEANING'
  ],
  [SCT_FORM_TYPE.ADOLESCENT]: [
    'SELF_BODY',
    'PARENT',
    'SIBLING',
    'PEER',
    'ROMANCE',
    'SCHOOL',
    'AFFECT',
    'MEDIA',
    'CAREER',
    'STRENGTH'
  ],
  [SCT_FORM_TYPE.CHILD]: [
    'SELF',
    'FAMILY',
    'FRIEND',
    'SCHOOL_TEACHER',
    'EMOTION',
    'PLAY',
    'WISH',
    'WORRY'
  ]
});

/**
 * 영역 표시명 결정.
 *
 * @param {string|null|undefined} domainCode
 * @param {string|null|undefined} domainLabel
 * @returns {string}
 */
export function resolveSctDomainTitle(domainCode, domainLabel) {
  if (domainCode && SCT_DOMAIN_TITLE_BY_CODE[domainCode]) {
    return SCT_DOMAIN_TITLE_BY_CODE[domainCode];
  }
  if (domainLabel) {
    const idx = domainLabel.indexOf('(');
    return idx > 0 ? domainLabel.slice(0, idx).trim() : domainLabel;
  }
  return domainCode || '기타';
}

/**
 * answers 를 영역별로 묶는다. domainCode 가 있으면 원본 분류, 없으면 번호순.
 *
 * @param {Array<object>} answers
 * @param {string} [formType]
 * @returns {{ hasDomainSource: boolean, domains: Array<{ code: string, label: string, items: object[] }> }}
 */
export function groupSctAnswersByDomain(answers, formType) {
  const list = Array.isArray(answers) ? answers : [];
  const hasDomainSource = list.some((a) => a?.domainCode || a?.domainLabel);
  if (!hasDomainSource) {
    return {
      hasDomainSource: false,
      domains: [{
        code: 'BY_NUMBER',
        label: '번호순',
        items: [...list].sort((a, b) => (a.itemNo || 0) - (b.itemNo || 0))
      }]
    };
  }

  const map = new Map();
  list.forEach((a) => {
    const key = a.domainCode || a.domainLabel || '기타';
    if (!map.has(key)) {
      map.set(key, {
        code: key,
        label: resolveSctDomainTitle(a.domainCode, a.domainLabel),
        items: []
      });
    }
    map.get(key).items.push(a);
  });

  const order = SCT_DOMAIN_ORDER_BY_FORM[formType] || [];
  const ordered = [];
  order.forEach((code) => {
    if (map.has(code)) {
      ordered.push(map.get(code));
      map.delete(code);
    }
  });
  map.forEach((dom) => ordered.push(dom));
  ordered.forEach((dom) => {
    dom.items.sort((a, b) => (a.itemNo || 0) - (b.itemNo || 0));
  });
  return { hasDomainSource: true, domains: ordered };
}
