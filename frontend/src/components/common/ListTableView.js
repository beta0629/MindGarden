/**
 * ListTableView - 리스트(테이블) 뷰 공통 컴포넌트
 * 클래스: mg-v2-list-block__table. columns + data + renderCell 또는 children.
 * 반응형·가로 스크롤 래퍼 포함.
 *
 * @author Core Solution
 * @since 2025-03-17
 * @see docs/project-management/USER_MANAGEMENT_VIEW_MODE_MEETING.md §2.1, §4.1
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ListBlockView.css';

const TABLE_CLASS = 'mg-v2-list-block__table';
const WRAPPER_CLASS = 'mg-v2-list-block__table-wrapper';

/**
 * @param {Object} props
 * @param {Array<{ key: string, label: string, hideOnMobile?: boolean }>} props.columns - 컬럼 정의
 * @param {Array<Object>} props.data - 행 데이터 배열
 * @param {(columnKey: string, item: Object) => React.ReactNode} [props.renderCell] - 셀 렌더 함수. 없으면 item[columnKey]
 * @param {(item: Object) => void} [props.onRowClick] - 행 클릭 시 콜백 (선택)
 * @param {string} [props.className] - 테이블 추가 클래스
 * @param {string} [props.rowKeyField] - 행 key 필드 (기본 'id')
 */
function ListTableView({
  columns,
  data,
  renderCell,
  onRowClick,
  className = '',
  rowKeyField = 'id'
}) {
  const tableClass = [TABLE_CLASS, className].filter(Boolean).join(' ');
  const getCellContent = (columnKey, item) => {
    if (renderCell) return renderCell(columnKey, item);
    const value = item[columnKey];
    if (value == null) return '-';
    if (typeof value === 'object' && value instanceof Date) return value.toLocaleDateString('ko-KR');
    return String(value);
  };

  return (
    <div className={WRAPPER_CLASS}>
      <table className={tableClass}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.hideOnMobile ? 'mg-v2-list-block__col--hide-mobile' : ''}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const key = item[rowKeyField] ?? item.id;
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
            return (
              <tr key={key} {...rowProps}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.hideOnMobile ? 'mg-v2-list-block__col--hide-mobile' : ''}
                  >
                    {getCellContent(col.key, item)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
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
  rowKeyField: PropTypes.string
};

ListTableView.defaultProps = {
  renderCell: null,
  onRowClick: null,
  className: '',
  rowKeyField: 'id'
};

export default ListTableView;
