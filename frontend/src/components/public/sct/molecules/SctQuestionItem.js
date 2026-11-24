/**
 * SCT 문항 — 문장 잇기 줄
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../../utils/safeDisplay';
import { SCT_CSS, SCT_UI } from '../../../../constants/sctOnline';

/**
 * @param {{
 *   item: { itemNo: number, formItemId: number, promptText: string, allowsNotApplicable?: boolean },
 *   value: { answerText?: string, notApplicable?: boolean },
 *   onChange: (next: { answerText?: string, notApplicable?: boolean }) => void
 * }} props
 */
const SctQuestionItem = ({ item, value, onChange }) => {
  const itemNo = item.itemNo;
  const naOn = value?.notApplicable === true;
  const inputId = `sct-ans-${itemNo}`;
  const prompt = toDisplayString(item.promptText, '');

  return (
    <div className={`${SCT_CSS.QUESTION}${naOn ? ' is-na' : ''}`}>
      <span className="mg-v2-sct-q__no">{itemNo}</span>
      <div className="mg-v2-sct-q__paper">
        <label className="mg-v2-sct-q__stem" htmlFor={inputId}>{prompt}</label>
        <textarea
          className="mg-v2-sct-q__ans"
          id={inputId}
          rows={2}
          aria-label={`${itemNo}번 답`}
          value={naOn ? '' : toDisplayString(value?.answerText, '')}
          onChange={(e) => onChange({ answerText: e.target.value, notApplicable: false })}
          disabled={naOn}
        />
        <span className="mg-v2-sct-q__na-line">{SCT_UI.NA_MARKED}</span>
      </div>
      {item.allowsNotApplicable ? (
        <>
          <span />
          <div>
            <button
              type="button"
              className="mg-v2-sct-na-btn"
              aria-pressed={naOn}
              onClick={() => onChange({
                answerText: '',
                notApplicable: !naOn
              })}
            >
              <span className="bx" aria-hidden="true" />
              {SCT_UI.NA_BUTTON}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

SctQuestionItem.propTypes = {
  item: PropTypes.shape({
    itemNo: PropTypes.number.isRequired,
    formItemId: PropTypes.number,
    promptText: PropTypes.string,
    allowsNotApplicable: PropTypes.bool
  }).isRequired,
  value: PropTypes.shape({
    answerText: PropTypes.string,
    notApplicable: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired
};

SctQuestionItem.defaultProps = {
  value: null
};

export default SctQuestionItem;
