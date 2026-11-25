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

  it('builds open/seen keys scoped by consultantId × invitationId', () => {
    expect(buildSctJournalPanelOpenKey(12, 99)).toBe(
      `${SCT_JOURNAL_PANEL_STORAGE.OPEN_PREFIX}:12:99`
    );
    expect(buildSctJournalPanelSeenKey('7', '55')).toBe(
      `${SCT_JOURNAL_PANEL_STORAGE.SEEN_PREFIX}:7:55`
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

  it('detects fresh submit when submittedAt is newer than lastSeen', () => {
    expect(isSctJournalPanelFreshSubmit('2026-03-25T10:00:00Z', null)).toBe(true);
    expect(
      isSctJournalPanelFreshSubmit('2026-03-25T12:00:00Z', '2026-03-25T10:00:00Z')
    ).toBe(true);
    expect(
      isSctJournalPanelFreshSubmit('2026-03-25T09:00:00Z', '2026-03-25T10:00:00Z')
    ).toBe(false);
    expect(isSctJournalPanelFreshSubmit(null, '2026-03-25T10:00:00Z')).toBe(false);
  });

  it('auto-expands desktop on first view or fresh submit; never on mobile', () => {
    const openKey = buildSctJournalPanelOpenKey(3, 8);
    const seenKey = buildSctJournalPanelSeenKey(3, 8);

    const firstDesktop = resolveSctJournalPanelInitialOpen({
      isDesktopWide: true,
      openKey,
      seenKey,
      submittedAt: '2026-03-25T10:00:00Z'
    });
    expect(firstDesktop.open).toBe(true);
    expect(firstDesktop.fresh).toBe(true);

    writeSctJournalPanelOpenState(openKey, false);
    writeSctJournalPanelSeenSubmittedAt(seenKey, '2026-03-25T10:00:00Z');
    const collapsed = resolveSctJournalPanelInitialOpen({
      isDesktopWide: true,
      openKey,
      seenKey,
      submittedAt: '2026-03-25T10:00:00Z'
    });
    expect(collapsed.open).toBe(false);
    expect(collapsed.fresh).toBe(false);

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

  it('reads and writes seen submittedAt ISO', () => {
    const key = buildSctJournalPanelSeenKey(4, 10);
    expect(readSctJournalPanelSeenSubmittedAt(key)).toBeNull();
    writeSctJournalPanelSeenSubmittedAt(key, '2026-03-25T11:00:00Z');
    expect(readSctJournalPanelSeenSubmittedAt(key)).toBe('2026-03-25T11:00:00Z');
  });
});
