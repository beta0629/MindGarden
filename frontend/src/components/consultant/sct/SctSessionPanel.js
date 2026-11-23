/**
 * 상담사 — 상담일지 옆 SCT 세션 패널
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import { fetchSctSessionView } from '../../../utils/sctApi';
import useSctFeatureEnabled from '../../../hooks/useSctFeatureEnabled';
import {
  SCT_CSS,
  SCT_FORM_TYPE_LABEL,
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

/**
 * @param {{ clientId: number, mappingId?: number }} props
 */
const SctSessionPanel = ({ clientId, mappingId }) => {
  const { enabled, loading: flagLoading } = useSctFeatureEnabled();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState(VIEW.DOMAIN);
  const [openMemos, setOpenMemos] = useState({});
  const [memoDrafts, setMemoDrafts] = useState({});

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
        if (!cancelled) setData(res);
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
  }, [clientId, enabled, mappingId]);

  const answers = data?.answers || [];
  const submitted = data?.status === SCT_STATUS.SUBMITTED;

  const domains = useMemo(() => {
    const map = new Map();
    answers.forEach((a) => {
      const key = a.domainCode || a.domainLabel || '기타';
      if (!map.has(key)) {
        map.set(key, {
          code: key,
          label: a.domainLabel || key,
          items: []
        });
      }
      map.get(key).items.push(a);
    });
    return Array.from(map.values());
  }, [answers]);

  const emptyCount = answers.filter((a) => a.isBlank || (!a.answerText && !a.notApplicable)).length;
  const naCount = answers.filter((a) => a.notApplicable).length;

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
    return (
      <li key={a.formItemId || a.itemNo} className={`mg-v2-sct-sent${isEmpty ? ' is-empty' : ''}`}>
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
      className={SCT_CSS.SESSION}
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
          </div>

          <div className="mg-v2-sct-session__body">
            {view === VIEW.NUMBER ? (
              <ul>{answers.map((a) => renderSentence(a, true))}</ul>
            ) : (
              domains.map((dom) => {
                const items = view === VIEW.EMPTY
                  ? dom.items.filter((a) => a.isBlank || (!a.answerText && !a.notApplicable))
                  : dom.items;
                if (!items.length) return null;
                const blankInDom = dom.items.filter((a) => a.isBlank || (!a.answerText && !a.notApplicable)).length;
                const naInDom = dom.items.filter((a) => a.notApplicable).length;
                const memoOpen = openMemos[dom.code];
                return (
                  <section key={dom.code} className="mg-v2-sct-dom">
                    <div className="mg-v2-sct-dom__h">
                      <h3><SafeText>{dom.label}</SafeText></h3>
                      <span className={SCT_CSS.CAPTION}>
                        {dom.items.length}
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
                            onChange={(e) => setMemoDrafts((prev) => ({
                              ...prev,
                              [dom.code]: e.target.value
                            }))}
                          />
                          <p className={SCT_CSS.CAPTION}>{SCT_UI.MEMO_SAVE_PENDING}</p>
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
  mappingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default SctSessionPanel;
