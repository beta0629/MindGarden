/**
 * SCT 공개 로컬 임시저장 유틸 단위 테스트
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

  it('saves and loads answersMap', () => {
    const answers = {
      '11': { formItemId: 11, answerText: '나는', notApplicable: false },
      '12': { formItemId: 12, answerText: '', notApplicable: true }
    };
    expect(saveSctPublicDraft(TOKEN, answers)).toBe(true);
    expect(loadSctPublicDraft(TOKEN)).toEqual({
      '11': { formItemId: 11, answerText: '나는', notApplicable: false },
      '12': { formItemId: 12, answerText: '', notApplicable: true }
    });
  });

  it('ignores corrupt JSON and clears', () => {
    const key = buildSctPublicDraftKey(TOKEN);
    localStorage.setItem(key, '{not-json');
    expect(loadSctPublicDraft(TOKEN)).toBeNull();
    localStorage.setItem(key, JSON.stringify({ answersMap: 'bad' }));
    expect(loadSctPublicDraft(TOKEN)).toBeNull();
    saveSctPublicDraft(TOKEN, { '1': { formItemId: 1, answerText: 'a' } });
    clearSctPublicDraft(TOKEN);
    expect(loadSctPublicDraft(TOKEN)).toBeNull();
  });

  it('merge: local non-empty wins over server', () => {
    const server = {
      '1': { formItemId: 1, answerText: 'server', notApplicable: false },
      '2': { formItemId: 2, answerText: 'keep', notApplicable: false }
    };
    const local = {
      '1': { formItemId: 1, answerText: 'local', notApplicable: false },
      '3': { formItemId: 3, answerText: '', notApplicable: true }
    };
    expect(mergeSctPublicAnswers(server, local)).toEqual({
      '1': { formItemId: 1, answerText: 'local', notApplicable: false },
      '2': { formItemId: 2, answerText: 'keep', notApplicable: false },
      '3': { formItemId: 3, answerText: '', notApplicable: true }
    });
  });
});
