/**
 * SCT 응답 인쇄 본문 — 문항+답 · 머리칸 · 상담사 메모 여백
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  SCT_CSS,
  SCT_FORM_TYPE_LABEL,
  SCT_TEST_ID,
  SCT_UI
} from '../../../constants/sctOnline';

/**
 * @param {{
 *   answers: Array<object>,
 *   formType?: string,
 *   clientName?: string,
 *   submittedAt?: string,
 *   managementNo?: string,
 *   brand?: string
 * }} props
 */
const SctPrintDocument = ({
  answers,
  formType,
  clientName,
  submittedAt,
  managementNo,
  brand
}) => {
  const formLabel = SCT_FORM_TYPE_LABEL[formType] || formType || '';
  const list = Array.isArray(answers) ? answers : [];

  return (
    <article className={SCT_CSS.PRINT_SHEET} data-testid={SCT_TEST_ID.PRINT_PREVIEW}>
      <header className="mg-v2-sct-print-header">
        <h1>
          <SafeText>{brand || SCT_UI.BRAND}</SafeText>
          {' · '}
          {SCT_UI.TITLE}
        </h1>
        <dl className="mg-v2-sct-print-header__meta">
          <div>
            <dt>{SCT_UI.PRINT_MANAGEMENT_NO}</dt>
            <dd>
              <SafeText>{managementNo || '—'}</SafeText>
            </dd>
          </div>
          <div>
            <dt>{SCT_UI.PRINT_CLIENT}</dt>
            <dd><SafeText>{clientName || '—'}</SafeText></dd>
          </div>
          <div>
            <dt>{SCT_UI.PRINT_FORM}</dt>
            <dd><SafeText>{formLabel || '—'}</SafeText></dd>
          </div>
          <div>
            <dt>{SCT_UI.PRINT_SUBMITTED}</dt>
            <dd><SafeText>{toDisplayString(submittedAt, '—')}</SafeText></dd>
          </div>
        </dl>
        <p className="mg-v2-sct-print-header__notice">{SCT_UI.PRINT_HEADER_NOTICE}</p>
      </header>

      <ol className="mg-v2-sct-print-list">
        {list.map((a) => {
          const isEmpty = a.isBlank || (!a.answerText && !a.notApplicable);
          let answerNode;
          if (a.notApplicable) {
            answerNode = (
              <span className="mg-v2-sct-print-item__tag">{SCT_UI.NA_BADGE}</span>
            );
          } else if (isEmpty) {
            answerNode = (
              <span className="mg-v2-sct-print-item__tag">{SCT_UI.BLANK_BADGE}</span>
            );
          } else {
            answerNode = (
              <span className="mg-v2-sct-print-item__answer">
                <SafeText>{a.answerText}</SafeText>
              </span>
            );
          }
          return (
            <li
              key={a.formItemId || a.itemNo}
              className={SCT_CSS.PRINT_ITEM}
              data-testid={SCT_TEST_ID.PRINT_ITEM}
              data-sct-print-item={a.itemNo}
              data-item-no={a.itemNo}
            >
              <span className="mg-v2-sct-print-item__marker" aria-hidden="true">
                {`§ITEM_START:${String(a.itemNo).padStart(2, '0')}§`}
              </span>
              <span className="mg-v2-sct-print-item__no">{a.itemNo}</span>
              <span className="mg-v2-sct-print-item__prompt">
                <SafeText>{a.promptText}</SafeText>
              </span>
              {' '}
              {answerNode}
              <span className="mg-v2-sct-print-item__marker" aria-hidden="true">
                {`§ITEM_END:${String(a.itemNo).padStart(2, '0')}§`}
              </span>
            </li>
          );
        })}
      </ol>

      <section className="mg-v2-sct-print-memo" aria-label={SCT_UI.PRINT_MEMO_TITLE}>
        <h2>{SCT_UI.PRINT_MEMO_TITLE}</h2>
        <p>{SCT_UI.PRINT_MEMO_HINT}</p>
        <div className="mg-v2-sct-print-memo__lines" aria-hidden="true" />
      </section>
    </article>
  );
};

SctPrintDocument.propTypes = {
  answers: PropTypes.arrayOf(PropTypes.object).isRequired,
  formType: PropTypes.string,
  clientName: PropTypes.string,
  submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  managementNo: PropTypes.string,
  brand: PropTypes.string
};

export default SctPrintDocument;
