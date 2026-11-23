/**
 * 상담사 — 상담일지 옆 SCT 세션 패널
 * 영역별 보기 · 미응답/해당없음 · 글자크기 · 검색/점프 · 인쇄 진입
 * (자동 해석·점수화·AI 분석 없음 — 데이터만 표시)
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useInRouterContext, useNavigate } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import notificationManager from '../../../utils/notification';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import {
  fetchSctDomainMemos,
  fetchSctSessionView,
  upsertSctDomainMemo
} from '../../../utils/sctApi';
import { groupSctAnswersByDomain } from '../../../constants/sctDomainGrouping';
import useSctFeatureEnabled from '../../../hooks/useSctFeatureEnabled';
import {
  SCT_CSS,
  SCT_FORM_TYPE_LABEL,
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

/**
 * Router 밖(모달 단위 테스트 등)에서도 크래시하지 않도록 navigate 주입을 분리한다.
 * 인쇄 네비는 Router 안에서만 실제 useNavigate로 동작한다.
 *
 * @param {{ clientId: number, mappingId?: number, clientName?: string }} props
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
 * @param {{ clientId: number, mappingId?: number, clientName?: string, navigate: (to: string) => void }} props
 */
const SctSessionPanelBody = ({ clientId, mappingId, clientName, navigate }) => {
  const { enabled, loading: flagLoading } = useSctFeatureEnabled();
  const [data, setData] = useState(null);
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

  const loadMemos = useCallback(async(invitationId) => {
    if (invitationId == null) return;
    try {
      const rows = await fetchSctDomainMemos(invitationId);
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
      // 메모 로드 실패는 패널 본문을 막지 않음
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
    (async() => {
      setLoading(true);
      setError('');
      try {
        const params = { clientId: Number(clientId) };
        if (mappingId != null) params.mappingId = Number(mappingId);
        const res = await fetchSctSessionView(params);
        if (!cancelled) {
          setData(res);
          if (res?.id != null && res?.status === SCT_STATUS.SUBMITTED) {
            await loadMemos(res.id);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, enabled, mappingId, loadMemos]);

  const answers = data?.answers || [];
  const submitted = data?.status === SCT_STATUS.SUBMITTED;
  const invitationId = data?.id;

  const { domains } = useMemo(
    () => groupSctAnswersByDomain(answers, data?.formType),
    [answers, data?.formType]
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
    if (clientName) qs.set('clientName', clientName);
    navigate(`${SCT_PRINT_PATH(invitationId).split('?')[0]}?${qs.toString()}`);
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

  return (
    <aside
      className={`${SCT_CSS.SESSION} mg-v2-sct-session--font-${fontSize}`}
      data-testid={SCT_TEST_ID.SESSION_PANEL}
      aria-label={SCT_UI.TITLE}
    >
      <div className="mg-v2-sct-session__head">
        <h2>
          {SCT_UI.TITLE}
          {data?.formType ? ` · ${SCT_FORM_TYPE_LABEL[data.formType] || data.formType}` : ''}
          {submitted ? (
            <span className="mg-v2-sct-tag">
              {toDisplayString(data?.submittedAt, '제출')}
            </span>
          ) : (
            <span className="mg-v2-sct-tag">{SCT_UI.SUMMARY_DRAFT}</span>
          )}
        </h2>
        {data?.managementNo ? (
          <p className={SCT_CSS.CAPTION} data-testid={SCT_TEST_ID.MANAGEMENT_NO}>
            {SCT_UI.MANAGEMENT_NO}
            {': '}
            <SafeText>{data.managementNo}</SafeText>
          </p>
        ) : null}
        <span className={SCT_CSS.CAPTION}>{SCT_UI.PANEL_NOTICE}</span>
      </div>

      {loading ? (
        <div className="mg-v2-sct-session__body">
          <UnifiedLoading type="inline" text={SCT_UI.LOADING} />
        </div>
      ) : error ? (
        <div className="mg-v2-sct-session__body">
          <p role="alert"><SafeText>{error}</SafeText></p>
        </div>
      ) : !submitted ? (
        <div className="mg-v2-sct-session__body">
          <h3>{SCT_UI.PENDING_TITLE}</h3>
          <p className="mg-v2-sct-lead">
            제출 전에는 응답 본문을 열람할 수 없습니다.
            {data?.draftSavedAt ? ` 마지막 저장 ${toDisplayString(data.draftSavedAt, '')}` : ''}
          </p>
        </div>
      ) : (
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
            <label className={SCT_CSS.CAPTION} htmlFor="sct-font-size">{SCT_UI.FONT_SIZE}</label>
            <select
              id="sct-font-size"
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
              <label className="sr-only" htmlFor="sct-session-search">{SCT_UI.SEARCH_PLACEHOLDER}</label>
              <input
                id="sct-session-search"
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
      )}
    </aside>
  );
};

SctSessionPanel.propTypes = {
  clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  mappingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  clientName: PropTypes.string
};

export default SctSessionPanel;
