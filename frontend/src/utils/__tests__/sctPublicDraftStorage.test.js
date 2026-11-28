/**
 * SCT 공개 로컬 임시저장 유틸 단위 테스트
 * 답변 본문 localStorage 저장 금지 검증.
 *
 * @author MindGarden
 * @since 2026-03-27
 */

import {
  buildSctPublicDraftKey,
  clearSctPublicDraft,
  loadSctPublicDraft,
  mergeSctPublicAnswers,
  saveSctPublicDraft
} from '../sctPublicDraftStorage';
import { SCT_PUBLIC_DRAFT_LS_PREFIX } from '../../constants/sctOnline';

const TOKEN = 'opaque-token-abc';

describe('sctPublicDraftStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('builds key from opaque token', () => {
    expect(buildSctPublicDraftKey(TOKEN)).toBe(`${SCT_PUBLIC_DRAFT_LS_PREFIX}:${TOKEN}`);
    expect(buildSctPublicDraftKey('')).toBeNull();
    expect(buildSctPublicDraftKey(null)).toBeNull();
  });

  it('save does not leave answer body plaintext in localStorage', () => {
    const answers = {
      '11': { formItemId: 11, answerText: '나는', notApplicable: false },
      '12': { formItemId: 12, answerText: '', notApplicable: true }
    };
    expect(saveSctPublicDraft(TOKEN, answers)).toBe(false);
    const key = buildSctPublicDraftKey(TOKEN);
    expect(localStorage.getItem(key)).toBeNull();
    expect(loadSctPublicDraft(TOKEN)).toBeNull();
  });

  it('after save attempt, key has no answersMap / getItem is null', () => {
    const key = buildSctPublicDraftKey(TOKEN);
    localStorage.setItem(key, JSON.stringify({
      v: 1,
      answersMap: { '1': { formItemId: 1, answerText: 'legacy-plain' } }
    }));
    expect(saveSctPublicDraft(TOKEN, {
      '1': { formItemId: 1, answerText: 'should-not-persist' }
    })).toBe(false);
    expect(localStorage.getItem(key)).toBeNull();
    const raw = localStorage.getItem(key);
    expect(raw).toBeNull();
    if (raw) {
      expect(raw).not.toContain('answersMap');
      expect(raw).not.toContain('should-not-persist');
    }
  });

  it('clear still removes leftover legacy keys', () => {
    const key = buildSctPublicDraftKey(TOKEN);
    localStorage.setItem(key, '{not-json');
    expect(loadSctPublicDraft(TOKEN)).toBeNull();
    localStorage.setItem(key, JSON.stringify({ answersMap: 'bad' }));
    expect(loadSctPublicDraft(TOKEN)).toBeNull();
    localStorage.setItem(key, JSON.stringify({
      answersMap: { '1': { formItemId: 1, answerText: 'a' } }
    }));
    clearSctPublicDraft(TOKEN);
    expect(localStorage.getItem(key)).toBeNull();
    expect(loadSctPublicDraft(TOKEN)).toBeNull();
  });

  it('merge: server answers only (local ignored)', () => {
    const server = {
      '1': { formItemId: 1, answerText: 'server', notApplicable: false },
      '2': { formItemId: 2, answerText: 'keep', notApplicable: false }
    };
    const local = {
      '1': { formItemId: 1, answerText: 'local', notApplicable: false },
      '3': { formItemId: 3, answerText: '', notApplicable: true }
    };
    expect(mergeSctPublicAnswers(server, local)).toEqual(server);
  });
});
