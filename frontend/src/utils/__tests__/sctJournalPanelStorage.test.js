/**
 * sctJournalPanelStorage — 키·접힘·방금 제출 판정
 *
 * @author MindGarden
 * @since 2026-03-25
 */

import {
  SCT_JOURNAL_PANEL_STORAGE,
  buildSctJournalPanelOpenKey,
  buildSctJournalPanelSeenKey,
  isSctJournalPanelFreshSubmit,
  readSctJournalPanelOpenState,
  readSctJournalPanelSeenSubmittedAt,
  resolveSctJournalPanelInitialOpen,
  writeSctJournalPanelOpenState,
  writeSctJournalPanelSeenSubmittedAt
} from '../sctJournalPanelStorage';

describe('sctJournalPanelStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('builds open key consultant×invitationId and seen key consultant×clientId (v2)', () => {
    expect(buildSctJournalPanelOpenKey(12, 99)).toBe(
      `${SCT_JOURNAL_PANEL_STORAGE.OPEN_PREFIX}:12:99`
    );
    expect(SCT_JOURNAL_PANEL_STORAGE.OPEN_PREFIX).toBe('mg.sctJournalPanel.open.v1');
    expect(buildSctJournalPanelSeenKey('7', '55')).toBe(
      `${SCT_JOURNAL_PANEL_STORAGE.SEEN_PREFIX}:7:55`
    );
    expect(SCT_JOURNAL_PANEL_STORAGE.SEEN_PREFIX).toBe(
      'mg.sctJournalPanel.seenSubmitted.v2'
    );
    expect(buildSctJournalPanelOpenKey(null, 1)).toBeNull();
    expect(buildSctJournalPanelSeenKey(1, '')).toBeNull();
  });

  it('persists open state as 1|0', () => {
    const key = buildSctJournalPanelOpenKey(1, 2);
    expect(readSctJournalPanelOpenState(key)).toBeNull();
    writeSctJournalPanelOpenState(key, true);
    expect(readSctJournalPanelOpenState(key)).toBe(true);
    expect(localStorage.getItem(key)).toBe(SCT_JOURNAL_PANEL_STORAGE.OPEN);
    writeSctJournalPanelOpenState(key, false);
    expect(readSctJournalPanelOpenState(key)).toBe(false);
    expect(localStorage.getItem(key)).toBe(SCT_JOURNAL_PANEL_STORAGE.CLOSED);
  });

  it('detects fresh submit only when seen exists and submittedAt is newer', () => {
    expect(isSctJournalPanelFreshSubmit('2026-03-25T10:00:00Z', null)).toBe(false);
    expect(isSctJournalPanelFreshSubmit('2026-03-25T10:00:00Z', '')).toBe(false);
    expect(
      isSctJournalPanelFreshSubmit('2026-03-25T12:00:00Z', '2026-03-25T10:00:00Z')
    ).toBe(true);
    expect(
      isSctJournalPanelFreshSubmit('2026-03-25T09:00:00Z', '2026-03-25T10:00:00Z')
    ).toBe(false);
    expect(isSctJournalPanelFreshSubmit(null, '2026-03-25T10:00:00Z')).toBe(false);
  });

  it('first view: no seen → fresh false (no 「방금 제출」 path); desktop auto-expands', () => {
    const openKey = buildSctJournalPanelOpenKey(3, 8);
    const seenKey = buildSctJournalPanelSeenKey(3, 5);

    const firstDesktop = resolveSctJournalPanelInitialOpen({
      isDesktopWide: true,
      openKey,
      seenKey,
      submittedAt: '2026-03-25T10:00:00Z'
    });
    expect(firstDesktop.open).toBe(true);
    expect(firstDesktop.fresh).toBe(false);
  });

  it('after markSeen, newer submittedAt → fresh true; same submittedAt → fresh false', () => {
    const openKey = buildSctJournalPanelOpenKey(3, 8);
    const seenKey = buildSctJournalPanelSeenKey(3, 5);

    writeSctJournalPanelOpenState(openKey, false);
    writeSctJournalPanelSeenSubmittedAt(seenKey, '2026-03-25T10:00:00Z', 8);

    const sameAfterSeen = resolveSctJournalPanelInitialOpen({
      isDesktopWide: true,
      openKey,
      seenKey,
      submittedAt: '2026-03-25T10:00:00Z'
    });
    expect(sameAfterSeen.open).toBe(false);
    expect(sameAfterSeen.fresh).toBe(false);

    const freshAgain = resolveSctJournalPanelInitialOpen({
      isDesktopWide: true,
      openKey,
      seenKey,
      submittedAt: '2026-03-26T08:00:00Z'
    });
    expect(freshAgain.open).toBe(true);
    expect(freshAgain.fresh).toBe(true);

    const mobile = resolveSctJournalPanelInitialOpen({
      isDesktopWide: false,
      openKey,
      seenKey,
      submittedAt: '2026-03-26T08:00:00Z'
    });
    expect(mobile.open).toBe(false);
    expect(mobile.fresh).toBe(true);
  });

  it('reads plain ISO and JSON seen values; never throws on corrupt/v1 garbage', () => {
    const key = buildSctJournalPanelSeenKey(4, 10);
    expect(readSctJournalPanelSeenSubmittedAt(key)).toBeNull();

    writeSctJournalPanelSeenSubmittedAt(key, '2026-03-25T11:00:00Z');
    expect(readSctJournalPanelSeenSubmittedAt(key)).toBe('2026-03-25T11:00:00Z');
    expect(localStorage.getItem(key)).toBe('2026-03-25T11:00:00Z');

    writeSctJournalPanelSeenSubmittedAt(key, '2026-03-25T12:00:00Z', 99);
    expect(readSctJournalPanelSeenSubmittedAt(key)).toBe('2026-03-25T12:00:00Z');
    expect(JSON.parse(localStorage.getItem(key))).toEqual({
      submittedAt: '2026-03-25T12:00:00Z',
      invitationId: 99
    });

    localStorage.setItem(key, '{not-json');
    expect(readSctJournalPanelSeenSubmittedAt(key)).toBeNull();

    localStorage.setItem(key, 'not-a-date');
    expect(readSctJournalPanelSeenSubmittedAt(key)).toBeNull();

    // v1 key present must not affect v2 reader (prefer v2 only; ignore v1)
    const v1Key = 'mg.sctJournalPanel.seenSubmitted.v1:4:99';
    localStorage.setItem(v1Key, '2026-01-01T00:00:00Z');
    expect(readSctJournalPanelSeenSubmittedAt(key)).toBeNull();
    expect(() => readSctJournalPanelSeenSubmittedAt(v1Key)).not.toThrow();
  });

  it('new invite same client reuses seen v2 — older seen + newer submit → fresh', () => {
    const clientSeenKey = buildSctJournalPanelSeenKey(42, 5);
    writeSctJournalPanelSeenSubmittedAt(
      clientSeenKey,
      '2026-03-20T10:00:00Z',
      100
    );

    const openOldInvite = buildSctJournalPanelOpenKey(42, 100);
    const openNewInvite = buildSctJournalPanelOpenKey(42, 200);
    expect(openOldInvite).toBe('mg.sctJournalPanel.open.v1:42:100');
    expect(openNewInvite).toBe('mg.sctJournalPanel.open.v1:42:200');
    expect(clientSeenKey).toBe('mg.sctJournalPanel.seenSubmitted.v2:42:5');

    const result = resolveSctJournalPanelInitialOpen({
      isDesktopWide: true,
      openKey: openNewInvite,
      seenKey: clientSeenKey,
      submittedAt: '2026-03-25T15:00:00Z'
    });
    expect(result.fresh).toBe(true);
    expect(result.open).toBe(true);
  });

  it('body exposed writes seen → same submittedAt re-resolve is not fresh; narrow open=false keeps prior seen', () => {
    const openKey = buildSctJournalPanelOpenKey(9, 50);
    const seenKey = buildSctJournalPanelSeenKey(9, 7);
    const submittedAt = '2026-03-25T18:00:00Z';

    writeSctJournalPanelSeenSubmittedAt(seenKey, '2026-03-24T09:00:00Z', 49);
    writeSctJournalPanelOpenState(openKey, true);

    const freshOpen = resolveSctJournalPanelInitialOpen({
      isDesktopWide: true,
      openKey,
      seenKey,
      submittedAt
    });
    expect(freshOpen.open).toBe(true);
    expect(freshOpen.fresh).toBe(true);

    // 본문 노출 시 패널이 호출하는 것과 동일 — seen 갱신
    writeSctJournalPanelSeenSubmittedAt(seenKey, submittedAt, 50);

    const afterExpose = resolveSctJournalPanelInitialOpen({
      isDesktopWide: true,
      openKey,
      seenKey,
      submittedAt
    });
    expect(afterExpose.open).toBe(true);
    expect(afterExpose.fresh).toBe(false);

    const priorSeen = readSctJournalPanelSeenSubmittedAt(seenKey);
    const narrow = resolveSctJournalPanelInitialOpen({
      isDesktopWide: false,
      openKey,
      seenKey,
      submittedAt: '2026-03-27T12:00:00Z'
    });
    expect(narrow.open).toBe(false);
    expect(narrow.fresh).toBe(true);
    // 스트립만(open false)이면 패널이 seen을 쓰지 않음 — 기존 값 유지
    expect(readSctJournalPanelSeenSubmittedAt(seenKey)).toBe(priorSeen);
  });
});
