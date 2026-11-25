/**
 * 상담사 — 상담일지 SCT 레일(스트립 + 피크 / 사이드·시트)
 * 미제출·만료 = 스트립만(저널 전체 폭). 제출 + ≥1180 펼침 = 사이드 패널.
 * 제출 본문(시트·사이드) Esc·포커스 트랩 — UnifiedModal 보다 capture 우선. 테넌트 fail-closed.
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useInRouterContext, useNavigate } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import useCoverDrawerFocus from '../../common/coverChapter/useCoverDrawerFocus';
import { useSession } from '../../../contexts/SessionContext';
import notificationManager from '../../../utils/notification';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import {
  fetchSctClientInvitations,
  fetchSctDomainMemos,
  fetchSctSessionView,
  upsertSctDomainMemo
} from '../../../utils/sctApi';
import {
  buildSctJournalPanelOpenKey,
  buildSctJournalPanelSeenKey,
  resolveSctJournalPanelInitialOpen,
  writeSctJournalPanelOpenState,
  writeSctJournalPanelSeenSubmittedAt
} from '../../../utils/sctJournalPanelStorage';
import { groupSctAnswersByDomain } from '../../../constants/sctDomainGrouping';
import useSctFeatureEnabled from '../../../hooks/useSctFeatureEnabled';
import useMediaQuery from '../../../hooks/useMediaQuery';
import {
  buildSctPeekPendingCopy,
  buildSctStripPendingCopy,
  buildSctStripSubmittedCopy,
  SCT_CSS,
  SCT_DEFAULTS,
  SCT_FORM_TYPE_LABEL,
  SCT_JOURNAL_PANEL_DESKTOP_MQ,
  SCT_JOURNAL_UI_STATE,
  SCT_PRINT_PATH,
  SCT_SCREEN_FONT,
  SCT_STATUS,
  SCT_TEST_ID,
  SCT_UI
} from '../../../constants/sctOnline';
import '../../admin/sct/sctAdmin.css';

const VIEW = Object.freeze({
  DOMAIN: 'DOMAIN',
  NUMBER: 'NUMBER',
  EMPTY: 'EMPTY'
});

const NOOP_NAVIGATE = () => {};

const BODY_PANEL_ID = 'sct-journal-body-panel';
const SHEET_TITLE_ID = 'sct-journal-sheet-title';

/**
 * 초대 목록에서 레일 메타용 최신 행 선택 (CANCELLED 제외).
 * @param {object[]} rows
 * @returns {object|null}
 */
const pickLatestInvitationMeta = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  const usable = list.filter((r) => r && r.status !== SCT_STATUS.CANCELLED);
  if (!usable.length) return null;
  const submitted = usable
    .filter((r) => r.status === SCT_STATUS.SUBMITTED)
    .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
  if (submitted.length) return submitted[0];
  return usable.slice().sort((a, b) => {
    const ta = String(a.sentAt || a.draftSavedAt || a.tokenExpiresAt || '');
    const tb = String(b.sentAt || b.draftSavedAt || b.tokenExpiresAt || '');
    return tb.localeCompare(ta);
  })[0];
};

/**
 * @param {object|null} session
 * @param {object|null} meta
 * @returns {string}
 */
const deriveUiState = (session, meta) => {
  if (session?.status === SCT_STATUS.SUBMITTED) {
    return SCT_JOURNAL_UI_STATE.SUBMITTED;
  }
  if (!meta) return SCT_JOURNAL_UI_STATE.UNSENT;
  if (meta.status === SCT_STATUS.EXPIRED) return SCT_JOURNAL_UI_STATE.EXPIRED;
  if (meta.status === SCT_STATUS.SENT || meta.status === SCT_STATUS.DRAFT) {
    return SCT_JOURNAL_UI_STATE.PENDING;
  }
  if (meta.status === SCT_STATUS.SUBMITTED) return SCT_JOURNAL_UI_STATE.SUBMITTED;
  return SCT_JOURNAL_UI_STATE.UNSENT;
};

/**
 * @param {string|null|undefined} iso
 * @returns {string}
 */
const formatSubmittedBadge = (iso) => {
  if (!iso) return SCT_UI.SUMMARY_SUBMITTED;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return toDisplayString(iso, SCT_UI.SUMMARY_SUBMITTED);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 제출`;
  } catch {
    return toDisplayString(iso, SCT_UI.SUMMARY_SUBMITTED);
  }
};

/**
 * @param {string|null|undefined} iso
 * @returns {string}
 */
const formatDateTimeLabel = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return toDisplayString(iso, '');
  }
};

/**
 * invite meta 진행 수 — 필드가 없으면 null (가짜 n 금지).
 * @param {object|null|undefined} meta
 * @returns {number|null}
 */
const resolveAnsweredCount = (meta) => {
  if (!meta || typeof meta !== 'object') return null;
  const raw = meta.answeredCount ?? meta.progressAnswered ?? meta.answered;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
};

/**
 * Router 밖(모달 단위 테스트 등)에서도 크래시하지 않도록 navigate 주입을 분리한다.
 *
 * @param {{
 *   clientId: number,
 *   mappingId?: number,
 *   clientName?: string,
 *   onSidePanelOpenChange?: (open: boolean) => void
 * }} props
 */
const SctSessionPanel = (props) => {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <SctSessionPanelRouted {...props} />;
  }
  return <SctSessionPanelBody {...props} navigate={NOOP_NAVIGATE} />;
};

const SctSessionPanelRouted = (props) => {
  const navigate = useNavigate();
  return <SctSessionPanelBody {...props} navigate={navigate} />;
};

/**
 * @param {{
 *   clientId: number,
 *   mappingId?: number,
 *   clientName?: string,
 *   navigate: (to: string, opts?: object) => void,
 *   onSidePanelOpenChange?: (open: boolean) => void
 * }} props
 */
const SctSessionPanelBody = ({
  clientId,
  mappingId,
  clientName,
  navigate,
  onSidePanelOpenChange
}) => {
  const { user } = useSession();
  const consultantId = user?.id;
  const { enabled, loading: flagLoading } = useSctFeatureEnabled();
  const isDesktopWide = useMediaQuery(SCT_JOURNAL_PANEL_DESKTOP_MQ);
  const reactId = useId();
  const bodyPanelId = `${BODY_PANEL_ID}-${reactId.replace(/:/g, '')}`;
  const sheetTitleId = `${SHEET_TITLE_ID}-${reactId.replace(/:/g, '')}`;

  const [session, setSession] = useState(null);
  const [inviteMeta, setInviteMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState(VIEW.DOMAIN);
  const [openMemos, setOpenMemos] = useState({});
  const [memoDrafts, setMemoDrafts] = useState({});
  const [memoSaving, setMemoSaving] = useState({});
  const [memoDirty, setMemoDirty] = useState({});
  const [fontSize, setFontSize] = useState(SCT_SCREEN_FONT.MD);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDomain, setActiveDomain] = useState('');
  const [bodyOpen, setBodyOpen] = useState(false);
  const [peekOpen, setPeekOpen] = useState(false);
  const [freshBadge, setFreshBadge] = useState(false);
  const initRef = useRef(false);
  /** sheet / side 중 열린 본문 패널 (동시 마운트 없음) */
  const bodyPanelRef = useRef(null);

  const uiState = deriveUiState(session, inviteMeta);
  const isSubmitted = uiState === SCT_JOURNAL_UI_STATE.SUBMITTED;
  const invitationId = session?.id ?? inviteMeta?.id ?? null;
  const formType = session?.formType || inviteMeta?.formType;
  const formLabel = formType ? (SCT_FORM_TYPE_LABEL[formType] || formType) : '';
  const titleText = formLabel ? `${SCT_UI.TITLE} · ${formLabel}` : SCT_UI.TITLE;

  const openKey = useMemo(
    () => buildSctJournalPanelOpenKey(consultantId, invitationId),
    [consultantId, invitationId]
  );
  const seenKey = useMemo(
    () => buildSctJournalPanelSeenKey(consultantId, clientId),
    [consultantId, clientId]
  );

  const sidePanelOpen = isSubmitted && bodyOpen && isDesktopWide;
  const sheetOpen = isSubmitted && bodyOpen && !isDesktopWide;

  const markSeenAndPersistOpen = useCallback((nextOpen) => {
    if (openKey) writeSctJournalPanelOpenState(openKey, nextOpen);
    if (seenKey && session?.submittedAt) {
      writeSctJournalPanelSeenSubmittedAt(
        seenKey,
        String(session.submittedAt),
        invitationId
      );
    }
    if (!nextOpen) setFreshBadge(false);
  }, [openKey, seenKey, session?.submittedAt, invitationId]);

  const handleExpandBody = useCallback(() => {
    setBodyOpen(true);
    setPeekOpen(false);
    markSeenAndPersistOpen(true);
  }, [markSeenAndPersistOpen]);

  const handleCollapseBody = useCallback(() => {
    setBodyOpen(false);
    markSeenAndPersistOpen(false);
  }, [markSeenAndPersistOpen]);

  useCoverDrawerFocus({
    isOpen: bodyOpen && isSubmitted,
    panelRef: bodyPanelRef,
    onClose: handleCollapseBody,
    returnFocusSelector: `[data-testid="${SCT_TEST_ID.EXPAND_BTN}"]`,
    stopPropagationOnEscape: true
  });

  useEffect(() => {
    if (typeof onSidePanelOpenChange === 'function') {
      onSidePanelOpenChange(sidePanelOpen);
    }
  }, [sidePanelOpen, onSidePanelOpenChange]);

  useEffect(() => () => {
    if (typeof onSidePanelOpenChange === 'function') {
      onSidePanelOpenChange(false);
    }
  }, [onSidePanelOpenChange]);

  const loadMemos = useCallback(async(invId) => {
    if (invId == null) return;
    try {
      const rows = await fetchSctDomainMemos(invId);
      const drafts = {};
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        if (row?.domainCode != null) {
          drafts[row.domainCode] = row.memoText || '';
        }
      });
      setMemoDrafts(drafts);
      setMemoDirty({});
      setOpenMemos((prev) => {
        const next = { ...prev };
        Object.keys(drafts).forEach((code) => {
          if (drafts[code]) next[code] = true;
        });
        return next;
      });
    } catch (e) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
        'error'
      );
    }
  }, []);

  useEffect(() => {
    if (!enabled || clientId == null) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    initRef.current = false;
    (async() => {
      setLoading(true);
      setError('');
      setSession(null);
      setInviteMeta(null);
      setBodyOpen(false);
      setPeekOpen(false);
      setFreshBadge(false);
      try {
        const params = { clientId: Number(clientId) };
        if (mappingId != null) params.mappingId = Number(mappingId);

        const [sessionResult, inviteRows] = await Promise.all([
          fetchSctSessionView(params).catch(() => null),
          fetchSctClientInvitations(clientId).catch(() => [])
        ]);

        if (cancelled) return;

        const submitted = sessionResult?.status === SCT_STATUS.SUBMITTED
          ? sessionResult
          : null;
        setSession(submitted);
        const meta = pickLatestInvitationMeta(inviteRows);
        setInviteMeta(meta);

        if (submitted?.id != null) {
          await loadMemos(submitted.id);
        }
      } catch (e) {
        if (!cancelled) {
          setError(resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL));
          setSession(null);
          setInviteMeta(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, enabled, mappingId, loadMemos]);

  // 제출 본문 초기 펼침 — 데스크톱 ≥1180 만. 모바일 시트 자동 오픈 금지.
  useEffect(() => {
    if (loading || !isSubmitted || invitationId == null || initRef.current) return;
    initRef.current = true;
    const { open, fresh } = resolveSctJournalPanelInitialOpen({
      isDesktopWide,
      openKey,
      seenKey,
      submittedAt: session?.submittedAt
    });
    setFreshBadge(fresh);
    if (open) {
      setBodyOpen(true);
      if (openKey) writeSctJournalPanelOpenState(openKey, true);
    }
  }, [
    loading,
    isSubmitted,
    invitationId,
    isDesktopWide,
    openKey,
    seenKey,
    session?.submittedAt
  ]);

  const answers = isSubmitted ? (session?.answers || []) : [];
  const { domains } = useMemo(
    () => groupSctAnswersByDomain(answers, formType),
    [answers, formType]
  );

  const emptyCount = answers.filter((a) => a.isBlank || (!a.answerText && !a.notApplicable)).length;
  const naCount = answers.filter((a) => a.notApplicable).length;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesQuery = useCallback((a) => {
    if (!normalizedQuery) return true;
    const asNo = String(a.itemNo || '');
    if (asNo === normalizedQuery || asNo.startsWith(normalizedQuery)) return true;
    const prompt = (a.promptText || '').toLowerCase();
    const ans = (a.answerText || '').toLowerCase();
    return prompt.includes(normalizedQuery) || ans.includes(normalizedQuery);
  }, [normalizedQuery]);

  const filteredDomains = useMemo(() => {
    return domains
      .filter((dom) => !activeDomain || dom.code === activeDomain)
      .map((dom) => ({
        ...dom,
        items: dom.items.filter(matchesQuery)
      }))
      .filter((dom) => dom.items.length > 0);
  }, [activeDomain, domains, matchesQuery]);

  const filteredAnswers = useMemo(
    () => answers.filter(matchesQuery),
    [answers, matchesQuery]
  );

  const handleSaveMemo = async(domainCode) => {
    if (invitationId == null || !domainCode) return;
    setMemoSaving((prev) => ({ ...prev, [domainCode]: true }));
    try {
      const saved = await upsertSctDomainMemo(invitationId, domainCode, {
        memoText: memoDrafts[domainCode] || ''
      });
      setMemoDrafts((prev) => ({
        ...prev,
        [domainCode]: saved?.memoText != null ? saved.memoText : (prev[domainCode] || '')
      }));
      setMemoDirty((prev) => ({ ...prev, [domainCode]: false }));
      notificationManager.success(SCT_UI.MEMO_SAVE_SUCCESS);
    } catch (e) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
        'error'
      );
    } finally {
      setMemoSaving((prev) => ({ ...prev, [domainCode]: false }));
    }
  };

  const handlePrint = () => {
    if (invitationId == null) return;
    const qs = new URLSearchParams({ invitationId: String(invitationId) });
    const path = `${SCT_PRINT_PATH(invitationId).split('?')[0]}?${qs.toString()}`;
    const state = clientName ? { clientName } : undefined;
    navigate(path, state ? { state } : undefined);
  };

  const jumpToItem = () => {
    const q = searchQuery.trim();
    if (!q) return;
    const asNo = Number(q);
    const target = Number.isFinite(asNo)
      ? document.getElementById(`sct-item-${asNo}`)
      : document.querySelector(`[data-sct-item-search*="${CSS.escape(q.toLowerCase())}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const statusLabel = (() => {
    if (uiState === SCT_JOURNAL_UI_STATE.UNSENT) return SCT_UI.STATUS_UNSENT;
    if (uiState === SCT_JOURNAL_UI_STATE.PENDING) return SCT_UI.STATUS_PENDING;
    if (uiState === SCT_JOURNAL_UI_STATE.EXPIRED) return SCT_UI.STATUS_EXPIRED;
    if (freshBadge) return SCT_UI.STATUS_JUST_SUBMITTED;
    return formatSubmittedBadge(session?.submittedAt);
  })();

  const statusClass = (() => {
    if (uiState === SCT_JOURNAL_UI_STATE.PENDING) return 'mg-v2-sct-status--pending';
    if (uiState === SCT_JOURNAL_UI_STATE.EXPIRED) return 'mg-v2-sct-status--expired';
    if (uiState === SCT_JOURNAL_UI_STATE.SUBMITTED && freshBadge) return 'mg-v2-sct-status--fresh';
    if (uiState === SCT_JOURNAL_UI_STATE.SUBMITTED) return 'mg-v2-sct-status--submitted';
    return '';
  })();

  const spineMod = (() => {
    if (uiState === SCT_JOURNAL_UI_STATE.SUBMITTED) return 'mg-v2-sct-spine--done';
    if (uiState === SCT_JOURNAL_UI_STATE.PENDING) return 'mg-v2-sct-spine--prog';
    if (uiState === SCT_JOURNAL_UI_STATE.EXPIRED) return 'mg-v2-sct-spine--exp';
    return '';
  })();

  const expandControlsId = isDesktopWide ? bodyPanelId : `${bodyPanelId}-sheet`;

  if (flagLoading) {
    return <UnifiedLoading type="inline" text={SCT_UI.LOADING} />;
  }
  if (!enabled) {
    return null;
  }

  const renderSentence = (a, withDom) => {
    const isEmpty = a.isBlank || (!a.answerText && !a.notApplicable);
    let tail;
    if (a.notApplicable) {
      tail = <span className="mg-v2-sct-tag">{SCT_UI.NA_BADGE}</span>;
    } else if (isEmpty) {
      tail = (
        <>
          <span className="blank" aria-hidden="true" />
          <span className="mg-v2-sct-tag">{SCT_UI.BLANK_BADGE}</span>
        </>
      );
    } else {
      tail = <span className="an"><SafeText>{a.answerText}</SafeText></span>;
    }
    const searchBlob = `${a.itemNo} ${(a.promptText || '').toLowerCase()} ${(a.answerText || '').toLowerCase()}`;
    return (
      <li
        key={a.formItemId || a.itemNo}
        id={`sct-item-${a.itemNo}`}
        className={`mg-v2-sct-sent${isEmpty ? ' is-empty' : ''}`}
        data-sct-item-search={searchBlob}
      >
        <span>{a.itemNo}</span>
        <p>
          <span className="st"><SafeText>{a.promptText}</SafeText></span>
          {' '}
          {tail}
          {withDom ? (
            <span className="dtag mg-v2-sct-caption">
              <SafeText>{a.domainLabel}</SafeText>
            </span>
          ) : null}
        </p>
      </li>
    );
  };

  const renderSubmittedBody = () => (
    <>
      <div className="mg-v2-sct-session__tools" role="toolbar" aria-label="보기 도구">
        <MGButton
          type="button"
          variant={view === VIEW.DOMAIN ? 'primary' : 'outline'}
          size="small"
          preventDoubleClick={false}
          onClick={() => setView(VIEW.DOMAIN)}
        >
          {SCT_UI.VIEW_BY_DOMAIN}
        </MGButton>
        <MGButton
          type="button"
          variant={view === VIEW.NUMBER ? 'primary' : 'outline'}
          size="small"
          preventDoubleClick={false}
          onClick={() => setView(VIEW.NUMBER)}
        >
          {SCT_UI.VIEW_BY_NUMBER}
        </MGButton>
        <MGButton
          type="button"
          variant={view === VIEW.EMPTY ? 'primary' : 'outline'}
          size="small"
          preventDoubleClick={false}
          onClick={() => setView(VIEW.EMPTY)}
        >
          {SCT_UI.EMPTY_ONLY}
          {' '}
          {emptyCount}
        </MGButton>
        <span className={SCT_CSS.CAPTION}>
          {SCT_UI.NA_COUNT}
          {' '}
          {naCount}
        </span>
        <MGButton
          type="button"
          variant="outline"
          size="small"
          preventDoubleClick={false}
          data-testid={SCT_TEST_ID.PRINT_BTN}
          onClick={handlePrint}
        >
          {SCT_UI.PRINT}
        </MGButton>
      </div>

      <div className="mg-v2-sct-session__tools mg-v2-sct-session__tools--secondary" role="toolbar" aria-label="가독성 도구">
        <label className={SCT_CSS.CAPTION} htmlFor={`sct-font-size-${reactId}`}>{SCT_UI.FONT_SIZE}</label>
        <select
          id={`sct-font-size-${reactId}`}
          data-testid={SCT_TEST_ID.FONT_SIZE}
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="mg-v2-sct-session__select"
        >
          <option value={SCT_SCREEN_FONT.SM}>{SCT_UI.FONT_SMALL}</option>
          <option value={SCT_SCREEN_FONT.MD}>{SCT_UI.FONT_MEDIUM}</option>
          <option value={SCT_SCREEN_FONT.LG}>{SCT_UI.FONT_LARGE}</option>
        </select>
        <div className={SCT_CSS.SEARCH}>
          <label className="sr-only" htmlFor={`sct-session-search-${reactId}`}>{SCT_UI.SEARCH_PLACEHOLDER}</label>
          <input
            id={`sct-session-search-${reactId}`}
            type="search"
            data-testid={SCT_TEST_ID.SEARCH}
            className="mg-v2-sct-session__search-input"
            placeholder={SCT_UI.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                jumpToItem();
              }
            }}
          />
          <MGButton
            type="button"
            variant="outline"
            size="small"
            preventDoubleClick={false}
            onClick={jumpToItem}
          >
            {SCT_UI.SEARCH_JUMP}
          </MGButton>
        </div>
      </div>

      {view !== VIEW.NUMBER ? (
        <div className="mg-v2-sct-session__chips" role="navigation" aria-label={SCT_UI.DOMAIN_JUMP}>
          <MGButton
            type="button"
            variant={!activeDomain ? 'primary' : 'outline'}
            size="small"
            preventDoubleClick={false}
            data-testid={SCT_TEST_ID.DOMAIN_CHIP}
            onClick={() => setActiveDomain('')}
          >
            {SCT_UI.DOMAIN_JUMP_ALL}
          </MGButton>
          {domains.map((dom) => (
            <MGButton
              key={dom.code}
              type="button"
              variant={activeDomain === dom.code ? 'primary' : 'outline'}
              size="small"
              preventDoubleClick={false}
              data-testid={SCT_TEST_ID.DOMAIN_CHIP}
              onClick={() => {
                setActiveDomain(dom.code);
                const el = document.getElementById(`sct-dom-${dom.code}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <SafeText>{dom.label}</SafeText>
            </MGButton>
          ))}
        </div>
      ) : null}

      <div className="mg-v2-sct-session__body">
        {view === VIEW.NUMBER ? (
          <ul>{filteredAnswers.map((a) => renderSentence(a, true))}</ul>
        ) : (
          filteredDomains.map((dom) => {
            const sourceDom = domains.find((d) => d.code === dom.code) || dom;
            const items = view === VIEW.EMPTY
              ? dom.items.filter((a) => a.isBlank || (!a.answerText && !a.notApplicable))
              : dom.items;
            if (!items.length) return null;
            const blankInDom = sourceDom.items.filter((a) => a.isBlank || (!a.answerText && !a.notApplicable)).length;
            const naInDom = sourceDom.items.filter((a) => a.notApplicable).length;
            const memoOpen = openMemos[dom.code];
            return (
              <section key={dom.code} id={`sct-dom-${dom.code}`} className="mg-v2-sct-dom">
                <div className="mg-v2-sct-dom__h">
                  <h3><SafeText>{dom.label}</SafeText></h3>
                  <span className={SCT_CSS.CAPTION}>
                    {sourceDom.items.length}
                    문항
                    {blankInDom ? ` · 빈 응답 ${blankInDom}` : ''}
                    {naInDom ? ` · 해당 없음 ${naInDom}` : ''}
                  </span>
                </div>
                <ul>{items.map((a) => renderSentence(a, false))}</ul>
                {view !== VIEW.EMPTY ? (
                  memoOpen ? (
                    <div className="mg-v2-sct-memo">
                      <label htmlFor={`sct-memo-${dom.code}`}>{SCT_UI.MEMO_LABEL}</label>
                      <textarea
                        id={`sct-memo-${dom.code}`}
                        className={SCT_CSS.MEMO_TA}
                        placeholder={SCT_UI.MEMO_PLACEHOLDER}
                        value={memoDrafts[dom.code] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMemoDrafts((prev) => ({ ...prev, [dom.code]: value }));
                          setMemoDirty((prev) => ({ ...prev, [dom.code]: true }));
                        }}
                      />
                      <div className="mg-v2-sct-memo__actions">
                        <MGButton
                          type="button"
                          variant="primary"
                          size="small"
                          preventDoubleClick
                          loading={!!memoSaving[dom.code]}
                          data-testid={SCT_TEST_ID.MEMO_SAVE}
                          onClick={() => handleSaveMemo(dom.code)}
                        >
                          {SCT_UI.MEMO_SAVE}
                        </MGButton>
                        <p className={SCT_CSS.CAPTION}>
                          {memoDirty[dom.code] ? SCT_UI.MEMO_SAVE_PENDING : SCT_UI.MEMO_SAVED}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={SCT_CSS.MEMO_BTN}
                      data-testid={SCT_TEST_ID.MEMO_ADD}
                      onClick={() => setOpenMemos((prev) => ({ ...prev, [dom.code]: true }))}
                    >
                      {SCT_UI.MEMO_WRITE}
                    </button>
                  )
                ) : null}
              </section>
            );
          })
        )}
      </div>
      <footer className={SCT_CSS.FOOT} data-testid={SCT_TEST_ID.CAPTION}>
        {SCT_UI.SHEET_NOTICE_PLACEHOLDER}
      </footer>
    </>
  );

  const showPeek = peekOpen
    && (uiState === SCT_JOURNAL_UI_STATE.UNSENT
      || uiState === SCT_JOURNAL_UI_STATE.PENDING
      || uiState === SCT_JOURNAL_UI_STATE.EXPIRED);

  const draftSavedAt = inviteMeta?.draftSavedAt;
  const tokenExpiresAt = inviteMeta?.tokenExpiresAt || session?.tokenExpiresAt;
  const answeredCount = resolveAnsweredCount(inviteMeta);
  const deadlineLabel = tokenExpiresAt ? formatDateTimeLabel(tokenExpiresAt) : '';
  const draftSavedLabel = draftSavedAt ? formatDateTimeLabel(draftSavedAt) : '';

  const stripCopy = (() => {
    if (uiState === SCT_JOURNAL_UI_STATE.UNSENT) return SCT_UI.STRIP_UNSENT;
    if (uiState === SCT_JOURNAL_UI_STATE.PENDING) {
      return buildSctStripPendingCopy(answeredCount, SCT_DEFAULTS.TOTAL_ITEMS);
    }
    if (uiState === SCT_JOURNAL_UI_STATE.EXPIRED) return SCT_UI.STRIP_EXPIRED;
    if (uiState === SCT_JOURNAL_UI_STATE.SUBMITTED) {
      return buildSctStripSubmittedCopy(
        formLabel,
        emptyCount,
        naCount,
        SCT_DEFAULTS.TOTAL_ITEMS
      );
    }
    return '';
  })();

  const showStripDeadline = Boolean(
    deadlineLabel
      && (uiState === SCT_JOURNAL_UI_STATE.PENDING
        || uiState === SCT_JOURNAL_UI_STATE.EXPIRED)
  );

  const showStripSubmittedAt = Boolean(
    freshBadge
      && uiState === SCT_JOURNAL_UI_STATE.SUBMITTED
      && session?.submittedAt
  );

  const peekCopy = (() => {
    if (uiState === SCT_JOURNAL_UI_STATE.UNSENT) return SCT_UI.PEEK_UNSENT;
    if (uiState === SCT_JOURNAL_UI_STATE.EXPIRED) return SCT_UI.PEEK_EXPIRED;
    if (uiState === SCT_JOURNAL_UI_STATE.PENDING) {
      return buildSctPeekPendingCopy({
        answeredCount,
        draftSavedAtLabel: draftSavedLabel || undefined
      }, SCT_DEFAULTS.TOTAL_ITEMS);
    }
    return '';
  })();

  const sheetNode = sheetOpen && typeof document !== 'undefined'
    ? createPortal(
      (
        <div className="mg-v2-sct-sheet-root" data-testid={SCT_TEST_ID.SHEET}>
          <button
            type="button"
            className={SCT_CSS.SHEET_SCRIM}
            aria-label={SCT_UI.SHEET_CLOSE}
            onClick={handleCollapseBody}
          />
          <div
            id={`${bodyPanelId}-sheet`}
            ref={bodyPanelRef}
            className={`${SCT_CSS.SHEET} mg-v2-sct-session--font-${fontSize}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={sheetTitleId}
          >
            <div className="mg-v2-sct-sheet__head">
              <h2 id={sheetTitleId}>
                <SafeText>{titleText}</SafeText>
              </h2>
              <MGButton
                type="button"
                variant="outline"
                size="small"
                preventDoubleClick={false}
                onClick={handleCollapseBody}
              >
                {SCT_UI.SHEET_CLOSE}
              </MGButton>
            </div>
            <div className="mg-v2-sct-sheet__body">
              {session?.managementNo ? (
                <p className={SCT_CSS.CAPTION} data-testid={SCT_TEST_ID.MANAGEMENT_NO}>
                  {SCT_UI.MANAGEMENT_NO}
                  {': '}
                  <SafeText>{session.managementNo}</SafeText>
                </p>
              ) : null}
              {renderSubmittedBody()}
            </div>
            <div className="mg-v2-sct-sheet__notice">
              {SCT_UI.SHEET_NOTICE_PLACEHOLDER}
            </div>
          </div>
        </div>
      ),
      document.body
    )
    : null;

  /*
   * Fragment → layout grid 직접 자식:
   *   rail (strip+peek) | side? | sheet portal
   * grid-areas 로 rail 이 journal 위 전체 폭을 차지한다.
   */
  return (
    <>
      <section
        className={`${SCT_CSS.RAIL} ${SCT_CSS.SESSION} mg-v2-sct-session--font-${fontSize}`}
        data-testid={SCT_TEST_ID.SESSION_PANEL}
        data-sct-ui-state={uiState}
        data-sct-side-open={sidePanelOpen ? '1' : '0'}
        aria-label={SCT_UI.RAIL_STRIP_LABEL}
      >
        <div
          className={SCT_CSS.STRIP}
          data-testid={SCT_TEST_ID.STRIP}
        >
          <div
            className={`${SCT_CSS.SPINE} ${spineMod}`.trim()}
            aria-hidden="true"
            title={SCT_UI.SPINE_LABEL}
          >
            <i className="mg-v2-sct-spine__line" />
            <i className="mg-v2-sct-spine__line" />
            <i className="mg-v2-sct-spine__line" />
            <i className="mg-v2-sct-spine__line" />
          </div>
          <div className="mg-v2-sct-strip__main">
            <h2 className="mg-v2-sct-strip__title">
              <SafeText>{titleText}</SafeText>
            </h2>
            <span
              className={`mg-v2-sct-status ${statusClass}`.trim()}
              data-testid={freshBadge ? SCT_TEST_ID.FRESH_BADGE : SCT_TEST_ID.STATUS_BADGE}
            >
              <SafeText>{statusLabel}</SafeText>
            </span>
            {loading ? (
              <p className="mg-v2-sct-strip__meta">{SCT_UI.LOADING}</p>
            ) : null}
            {!loading && error ? (
              <p className="mg-v2-sct-strip__meta" role="alert"><SafeText>{error}</SafeText></p>
            ) : null}
            {!loading && !error && stripCopy ? (
              <p
                className="mg-v2-sct-strip__meta"
                data-testid={SCT_TEST_ID.STRIP_COPY}
              >
                <SafeText>{stripCopy}</SafeText>
              </p>
            ) : null}
            {!loading && !error && showStripDeadline ? (
              <p
                className="mg-v2-sct-strip__meta"
                data-testid={SCT_TEST_ID.STRIP_DEADLINE}
              >
                {SCT_UI.EXPIRES_AT}
                {': '}
                <SafeText>{deadlineLabel}</SafeText>
              </p>
            ) : null}
            {!loading && !error && showStripSubmittedAt ? (
              <p
                className="mg-v2-sct-strip__meta"
                data-testid={SCT_TEST_ID.STRIP_SUBMITTED_AT}
              >
                {SCT_UI.SUBMITTED_AT}
                {': '}
                <SafeText>{formatDateTimeLabel(session.submittedAt)}</SafeText>
              </p>
            ) : null}
          </div>
          <div className="mg-v2-sct-strip__actions">
            {isSubmitted ? (
              bodyOpen ? (
                <MGButton
                  type="button"
                  variant="outline"
                  size="small"
                  preventDoubleClick={false}
                  data-testid={SCT_TEST_ID.COLLAPSE_BTN}
                  aria-expanded="true"
                  aria-controls={expandControlsId}
                  onClick={handleCollapseBody}
                >
                  {SCT_UI.COLLAPSE_SIDE}
                </MGButton>
              ) : (
                <MGButton
                  type="button"
                  variant="primary"
                  size="small"
                  preventDoubleClick={false}
                  data-testid={SCT_TEST_ID.EXPAND_BTN}
                  aria-expanded="false"
                  aria-controls={expandControlsId}
                  onClick={handleExpandBody}
                >
                  {SCT_UI.EXPAND_SIDE}
                </MGButton>
              )
            ) : (
              <MGButton
                type="button"
                variant="outline"
                size="small"
                preventDoubleClick={false}
                data-testid={SCT_TEST_ID.PEEK_TOGGLE}
                aria-expanded={peekOpen ? 'true' : 'false'}
                aria-controls={`${bodyPanelId}-peek`}
                onClick={() => setPeekOpen((v) => !v)}
              >
                {peekOpen ? SCT_UI.PEEK_CLOSE : SCT_UI.PEEK_DETAILS}
              </MGButton>
            )}
          </div>
        </div>

        {showPeek ? (
          <div
            id={`${bodyPanelId}-peek`}
            className={SCT_CSS.PEEK}
            data-testid={SCT_TEST_ID.PEEK}
          >
            {peekCopy ? (
              <p
                className="mg-v2-sct-peek-card__body"
                data-testid={SCT_TEST_ID.PEEK_COPY}
              >
                <SafeText>{peekCopy}</SafeText>
              </p>
            ) : null}
            {uiState === SCT_JOURNAL_UI_STATE.EXPIRED && deadlineLabel ? (
              <p className="mg-v2-sct-peek-card__body">
                {SCT_UI.EXPIRES_AT}
                {': '}
                <SafeText>{deadlineLabel}</SafeText>
              </p>
            ) : null}
            {/*
              answeredCount 는 meta 에 있을 때만 사용. 없으면 문항 수 절 생략 (가짜 n 금지).
            */}
          </div>
        ) : null}
      </section>

      {sidePanelOpen ? (
        <aside
          id={bodyPanelId}
          ref={bodyPanelRef}
          className={`${SCT_CSS.SIDE} mg-v2-sct-session--font-${fontSize}`}
          data-testid={SCT_TEST_ID.SIDE}
          aria-label={titleText}
        >
          <div className="mg-v2-sct-session__head">
            <h2>
              <SafeText>{titleText}</SafeText>
            </h2>
            {session?.managementNo ? (
              <p className={SCT_CSS.CAPTION} data-testid={SCT_TEST_ID.MANAGEMENT_NO}>
                {SCT_UI.MANAGEMENT_NO}
                {': '}
                <SafeText>{session.managementNo}</SafeText>
              </p>
            ) : null}
            <span className={SCT_CSS.CAPTION}>{SCT_UI.PANEL_NOTICE}</span>
          </div>
          {renderSubmittedBody()}
        </aside>
      ) : null}

      {sheetNode}
    </>
  );
};

SctSessionPanel.propTypes = {
  clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  mappingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  clientName: PropTypes.string,
  onSidePanelOpenChange: PropTypes.func
};

export default SctSessionPanel;
