/**
 * MypageDefinitionRows — [라벨 | 값 | 동작] 보기 행
 * 값이 비고 동작도 없는 행은 「입력하지 않은 항목」 1행으로 접는다. 긴 글은 3줄 clamp.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { MYPAGE_LAYOUT_COPY } from '../../../constants/mypageRoleLayout';

const EMPTY_LABEL_SEPARATOR = ' · ';

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export const isMypageRowValueEmpty = (value) => {
  if (value == null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  return false;
};

/**
 * @typedef {object} MypageRow
 * @property {string} key
 * @property {string} label
 * @property {unknown} [value] 비었는지 판정 + 기본 표시값
 * @property {import('react').ReactNode} [display] 값 대신 그릴 노드
 * @property {import('react').ReactNode} [action]
 * @property {boolean} [clamp] 긴 글 3줄 clamp
 * @property {string} [caption] 값 아래 캡션 1줄
 */

/**
 * @param {{ rows: MypageRow[], emptyLabel?: string, testId?: string }} props
 */
const MypageDefinitionRows = ({ rows, emptyLabel = MYPAGE_LAYOUT_COPY.EMPTY_ROWS_LABEL, testId }) => {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  const visible = list.filter((row) => !isMypageRowValueEmpty(row.value) || row.action);
  const collapsed = list.filter((row) => isMypageRowValueEmpty(row.value) && !row.action);

  return (
    <dl className="mg-mypage-rows" data-testid={testId}>
      {visible.map((row) => {
        const empty = isMypageRowValueEmpty(row.value);
        const valueClass = [
          'mg-mypage-rows__value',
          row.clamp ? 'mg-mypage-rows__value--clamp' : '',
          empty ? 'mg-mypage-rows__value--muted' : ''
        ].filter(Boolean).join(' ');
        return (
          <div key={row.key} className="mg-mypage-rows__row" data-testid={`mypage-row-${row.key}`}>
            <dt className="mg-mypage-rows__label">{row.label}</dt>
            <dd className={valueClass}>
              {row.display != null && !empty
                ? row.display
                : <SafeText>{empty ? MYPAGE_LAYOUT_COPY.NO_VALUE : row.value}</SafeText>}
              {row.caption ? (
                <span className="mg-mypage-rows__caption">
                  <SafeText>{row.caption}</SafeText>
                </span>
              ) : null}
            </dd>
            {row.action ? <dd className="mg-mypage-rows__action">{row.action}</dd> : null}
          </div>
        );
      })}
      {collapsed.length > 0 ? (
        <div
          className="mg-mypage-rows__row mg-mypage-rows__row--empty"
          data-testid="mypage-row-empty-collapsed"
        >
          <dt className="mg-mypage-rows__label">{emptyLabel}</dt>
          <dd className="mg-mypage-rows__value mg-mypage-rows__value--muted">
            {collapsed.map((row) => row.label).join(EMPTY_LABEL_SEPARATOR)}
          </dd>
        </div>
      ) : null}
    </dl>
  );
};

MypageDefinitionRows.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.any,
      display: PropTypes.node,
      action: PropTypes.node,
      clamp: PropTypes.bool,
      caption: PropTypes.string
    })
  ).isRequired,
  emptyLabel: PropTypes.string,
  testId: PropTypes.string
};

export default MypageDefinitionRows;
