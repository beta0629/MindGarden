/**
 * TenantCommonCodeSidePeekContent — 글로벌 대비 Diff (G5-02)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../common/SafeText';
import { toDisplayString } from '../../../../utils/safeDisplay';
import { buildTenantGlobalDiffRows } from '../../../../utils/tenantCommonCodeDiff';
import { resolveCodeGroupKoreanLabel } from '../../../../constants/codeGroupKoreanLabels';
import './TenantCommonCodeSidePeekContent.css';

const TenantCommonCodeSidePeekContent = ({ code, globalCode, loading, groupLabelByName }) => {
  if (loading) {
    return <p className="tenant-common-code-side-peek__loading">글로벌 코드 비교 중...</p>;
  }

  if (!code) {
    return null;
  }

  const diffRows = buildTenantGlobalDiffRows(code, globalCode);
  const title = toDisplayString(code.codeLabel || code.koreanName || code.codeValue, '—');
  const groupKey = toDisplayString(code.codeGroup, '');
  const groupLabel = (groupLabelByName && groupLabelByName[groupKey])
    || resolveCodeGroupKoreanLabel(groupKey)
    || groupKey
    || '—';

  return (
    <div className="tenant-common-code-side-peek">
      <header className="tenant-common-code-side-peek__header">
        <h3 className="tenant-common-code-side-peek__title">
          <SafeText tag="span">{title}</SafeText>
        </h3>
        <p className="tenant-common-code-side-peek__meta">
          <SafeText tag="span">{toDisplayString(groupLabel, '—')}</SafeText>
          {' · '}
          <SafeText tag="span">{toDisplayString(code.codeValue, '—')}</SafeText>
        </p>
      </header>

      <section className="tenant-common-code-side-peek__diff" aria-label="글로벌 대비 변경 필드">
        <div className="tenant-common-code-side-peek__diff-head">
          <span className="tenant-common-code-side-peek__diff-col">필드</span>
          <span className="tenant-common-code-side-peek__diff-col">글로벌</span>
          <span className="tenant-common-code-side-peek__diff-col">센터</span>
        </div>
        <ul className="tenant-common-code-side-peek__diff-list">
          {diffRows.map((row) => (
            <li
              key={row.field}
              className={`tenant-common-code-side-peek__diff-row${
                row.changed ? ' tenant-common-code-side-peek__diff-row--changed' : ''
              }`}
            >
              <span className="tenant-common-code-side-peek__diff-col">{row.field}</span>
              <span className="tenant-common-code-side-peek__diff-col">{row.global}</span>
              <span className="tenant-common-code-side-peek__diff-col">{row.tenant}</span>
            </li>
          ))}
        </ul>
      </section>

      {!globalCode && (
        <p className="tenant-common-code-side-peek__note" role="note">
          동일 codeValue의 글로벌 코드가 없습니다. 센터 전용 코드입니다.
        </p>
      )}
    </div>
  );
};

TenantCommonCodeSidePeekContent.propTypes = {
  code: PropTypes.object,
  globalCode: PropTypes.object,
  loading: PropTypes.bool,
  groupLabelByName: PropTypes.object
};

TenantCommonCodeSidePeekContent.defaultProps = {
  code: null,
  globalCode: null,
  loading: false,
  groupLabelByName: null
};

export default TenantCommonCodeSidePeekContent;
