import React from 'react';
import './MGTable.css';

/**
 * Core Solution 데이터 테이블 컴포넌트
/**
 * 페이징, 필터링, 정렬 기능을 포함한 고급 테이블
 */
const MGTable = ({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = '데이터가 없습니다.',
  variant = 'default', // 'default', 'striped', 'bordered', 'hover'
  size = 'medium', // 'small', 'medium', 'large'
  className = '',
  onRowClick = null,
  selectable = false,
  selectedRows = [],
  onSelectionChange = null,
  ...props
}) => {
  const handleRowClick = (row, index) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  const handleRowSelect = (row, index, checked) => {
    if (onSelectionChange) {
      const newSelection = checked 
        ? [...selectedRows, index]
        : selectedRows.filter(i => i !== index);
      onSelectionChange(newSelection);
    }
  };

  const getTableClasses = () => {
    return [
      'mg-table',
      `mg-table--${variant}`,
      `mg-table--${size}`,
      loading ? 'mg-table--loading' : '',
      className
    ].filter(Boolean).join(' ');
  };

  const getRowClasses = (index) => {
    return [
      'mg-table__row',
      selectable ? 'mg-table__row--selectable' : '',
      selectedRows.includes(index) ? 'mg-table__row--selected' : '',
      onRowClick ? 'mg-table__row--clickable' : ''
    ].filter(Boolean).join(' ');
  };

  return (
    <div className="mg-table-wrapper">
      {loading && (
        <div className="mg-table__loading">
          <div className="mg-table__spinner"></div>
          <span>데이터를 불러오는 중...</span>
        </div>
      )}
      
      <table className={getTableClasses()} {...props}>
        <thead className="mg-table__head">
          <tr>
            {selectable && (
              <th className="mg-table__header mg-table__header--checkbox">
                <input
                  type="checkbox"
                  checked={selectedRows.length === data.length && data.length > 0}
                  onChange={(e) => {
                    if (onSelectionChange) {
                      const newSelection = e.target.checked 
                        ? data.map((_, index) => index)
                        : [];
                      onSelectionChange(newSelection);
                    }
                  }}
                />
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={index}
                className={`mg-table__header ${column.className || ''}`}
                style={column.style}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="mg-table__body">
          {data.length === 0 && !loading ? (
            <tr className="mg-table__empty-row">
              <td 
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="mg-table__empty-cell"
              >
                <div className="mg-table__empty">
                  <span className="mg-table__empty-icon">📊</span>
                  <span className="mg-table__empty-message">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={getRowClasses(rowIndex)}
                onClick={() => handleRowClick(row, rowIndex)}
              >
                {selectable && (
                  <td className="mg-table__cell mg-table__cell--checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(rowIndex)}
                      onChange={(e) => handleRowSelect(row, rowIndex, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`mg-table__cell ${column.cellClassName || ''}`}
                    style={column.cellStyle}
                  >
                    {column.render 
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MGTable;



