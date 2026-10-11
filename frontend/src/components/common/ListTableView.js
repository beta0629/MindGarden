/**
 * ListTableView - 리스트(테이블) 뷰 공통 컴포넌트
 * 클래스: mg-v2-list-block__table. columns + data + renderCell 또는 children.
 * 반응형·가로 스크롤 래퍼 포함.
 * 묶음·열 생략·반복 셀은 옵트인이다. 넘기지 않으면 단일 tbody 다.
 *
 * @author Core Solution
 * @since 2025-03-17
 * @see docs/project-management/USER_MANAGEMENT_VIEW_MODE_MEETING.md §2.1, §4.1
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from './SafeText';
import './ListBlockView.css';

const TABLE_CLASS = 'mg-v2-list-block__table';
const WRAPPER_CLASS = 'mg-v2-list-block__table-wrapper';

/**
 * 연속된 같은 groupBy 키를 한 구간으로 묶는다.
 * 페이지 앞뒤에 같은 키가 다시 나와도 한 덩어리로 합치지 않는다.
 *
 * @param {Array<object>} data
 * @param {Function|null} groupBy
 * @returns {Array<{ key: string, items: Array<object> }>}
 */
const groupConsecutiveRows = (data, groupBy) => {
  if (typeof groupBy !== 'function') {
    return [{ key: 'all', items: data }];
  }
  const groups = [];
  data.forEach((item) => {
    const raw = String(groupBy(item) ?? '');
    const last = groups[groups.length - 1];
    if (!last || last.raw !== raw) {
      groups.push({ key: `${groups.length}-${raw}`, raw, items: [item] });
    } else {
      last.items.push(item);
    }
  });
  return groups;
};

/**
 * @param {Object} props
 * @param {Array<{ key: string, label: string, hideOnMobile?: boolean }>} props.columns - 컬럼 정의
 * @param {Array<Object>} props.data - 행 데이터 배열
 * @param {(columnKey: string, item: Object) => React.ReactNode} [props.renderCell] - 셀 렌더 함수. 없으면 item[columnKey]
 * @param {(item: Object) => void} [props.onRowClick] - 행 클릭 시 콜백 (선택)
 * @param {string} [props.className] - 테이블 추가 클래스
 * @param {string} [props.rowKeyField] - 행 key 필드 (기본 'id')
 * @param {string[]} [props.hiddenColumnKeys] - 머리·셀에서 뺄 열 id
 * @param {(item: Object) => string} [props.groupBy] - 연속 행 묶음 키
 * @param {(groupKey: string, items: Array<Object>) => React.ReactNode} [props.renderGroupHeader]
 * @param {(groupKey: string, items: Array<Object>) => string} [props.groupHeaderClassName]
 * @param {(columnKey: string, item: Object, prevItem: Object|null) => boolean} [props.isRepeatCell]
 * @param {(columnKey: string, item: Object, prevItem: Object|null) => React.ReactNode} [props.renderRepeatCell]
 * @param {(prevItem: Object, item: Object) => React.ReactNode} [props.renderBetween]
 * @param {string} [props.betweenRowClassName]
 * @param {(item: Object) => string} [props.rowClassName]
 */
function ListTableView({
  columns,
  data,
  renderCell,
  onRowClick,
  className = '',
  rowKeyField = 'id',
  caption = '',
  selectedRowKey = null,
  hiddenColumnKeys = [],
  groupBy = null,
  renderGroupHeader = null,
  groupHeaderClassName = null,
  isRepeatCell = null,
  renderRepeatCell = null,
  renderBetween = null,
  betweenRowClassName = '',
  rowClassName = null
}) {
  const tableClass = [TABLE_CLASS, className].filter(Boolean).join(' ');
  const hidden = new Set(hiddenColumnKeys || []);
  const visibleColumns = (columns || []).filter((col) => !hidden.has(col.key));
  const rows = data || [];
  const groups = rows.length === 0 ? [] : groupConsecutiveRows(rows, groupBy);
  const getCellContent = (columnKey, item) => {
    if (renderCell) return renderCell(columnKey, item);
    const value = item[columnKey];
    if (value == null) return '-';
    if (typeof value === 'object' && value instanceof Date) return value.toLocaleDateString('ko-KR');
    return String(value);
  };

  const renderDataRow = (item, previous) => {
    const key = item[rowKeyField] ?? item.id;
    const isSelected = selectedRowKey != null && String(selectedRowKey) === String(key);
    const rowProps = onRowClick
      ? {
        role: 'button',
        tabIndex: 0,
        onClick: () => onRowClick(item),
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onRowClick(item);
          }
        }
      }
      : {};
    const extraClass = rowClassName ? rowClassName(item) : '';
    const rowClass = [
      isSelected ? 'mg-v2-list-block__row--selected' : '',
      extraClass
    ].filter(Boolean).join(' ');
    const between = previous && renderBetween ? renderBetween(previous, item) : null;
    return (
      <React.Fragment key={key}>
        {between ? (
          <tr className={betweenRowClassName || undefined}>
            <th scope="rowgroup" colSpan={Math.max(visibleColumns.length, 1)}>
              {between}
            </th>
          </tr>
        ) : null}
        <tr
          className={rowClass || undefined}
          aria-selected={isSelected ? 'true' : undefined}
          {...rowProps}
        >
          {visibleColumns.map((col) => {
            const repeated = isRepeatCell ? isRepeatCell(col.key, item, previous) : false;
            const content = repeated && renderRepeatCell
              ? renderRepeatCell(col.key, item, previous)
              : getCellContent(col.key, item);
            return (
              <td
                key={col.key}
                data-column={col.key}
                className={col.hideOnMobile ? 'mg-v2-list-block__col--hide-mobile' : undefined}
              >
                {content}
              </td>
            );
          })}
        </tr>
      </React.Fragment>
    );
  };

  return (
    <div className={WRAPPER_CLASS}>
      <table className={tableClass}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {visibleColumns.map((col) => (
              <th
                key={col.key}
                scope="col"
                data-column={col.key}
                className={col.hideOnMobile ? 'mg-v2-list-block__col--hide-mobile' : undefined}
              >
                <SafeText tag="span">{col.label}</SafeText>
              </th>
            ))}
          </tr>
        </thead>
        {groups.length === 0 ? <tbody /> : groups.map((group) => {
          const header = renderGroupHeader ? renderGroupHeader(group.key, group.items) : null;
          const headerClass = groupHeaderClassName ? groupHeaderClassName(group.key, group.items) : '';
          return (
            <tbody key={group.key}>
              {header ? (
                <tr className={headerClass || undefined}>
                  <th scope="rowgroup" colSpan={Math.max(visibleColumns.length, 1)}>
                    {header}
                  </th>
                </tr>
              ) : null}
              {group.items.map((item, index) => renderDataRow(item, index > 0 ? group.items[index - 1] : null))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

ListTableView.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      hideOnMobile: PropTypes.bool
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  renderCell: PropTypes.func,
  onRowClick: PropTypes.func,
  className: PropTypes.string,
  rowKeyField: PropTypes.string,
  caption: PropTypes.string,
  selectedRowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hiddenColumnKeys: PropTypes.arrayOf(PropTypes.string),
  groupBy: PropTypes.func,
  renderGroupHeader: PropTypes.func,
  groupHeaderClassName: PropTypes.func,
  isRepeatCell: PropTypes.func,
  renderRepeatCell: PropTypes.func,
  renderBetween: PropTypes.func,
  betweenRowClassName: PropTypes.string,
  rowClassName: PropTypes.func
};

ListTableView.defaultProps = {
  renderCell: null,
  onRowClick: null,
  className: '',
  rowKeyField: 'id',
  caption: '',
  selectedRowKey: null,
  hiddenColumnKeys: [],
  groupBy: null,
  renderGroupHeader: null,
  groupHeaderClassName: null,
  isRepeatCell: null,
  renderRepeatCell: null,
  renderBetween: null,
  betweenRowClassName: '',
  rowClassName: null
};

export default ListTableView;
