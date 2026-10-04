/**
 * SettingsSummaryStrip — 설정 화면 요약 띠 (SalarySummaryStrip 레이아웃 계약)
 * 값이 비면 '—'로 표시한다. 실데이터만 전달할 것.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../utils/safeDisplay';
import './SettingsSuite.css';

export const SETTINGS_SUMMARY_EMPTY = '—';

const SettingsSummaryStrip = ({ items, ariaLabel, testId = 'settings-summary-strip' }) => (
  <dl className="mg-v2-settings-summary" aria-label={ariaLabel} data-testid={testId}>
    {items.map((item) => {
      const text = toDisplayString(item.value, SETTINGS_SUMMARY_EMPTY);
      const caption = toDisplayString(item.caption, '');
      return (
        <div key={item.key} className="mg-v2-settings-summary__cell" data-testid={item.testId}>
          <dt className="mg-v2-settings-summary__label">{item.label}</dt>
          <dd className="mg-v2-settings-summary__value">{text === '' ? SETTINGS_SUMMARY_EMPTY : text}</dd>
          {caption ? <dd className="mg-v2-settings-summary__caption">{caption}</dd> : null}
        </div>
      );
    })}
  </dl>
);

SettingsSummaryStrip.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      caption: PropTypes.string,
      testId: PropTypes.string
    })
  ).isRequired,
  ariaLabel: PropTypes.string,
  testId: PropTypes.string
};

export default SettingsSummaryStrip;
