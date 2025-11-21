/**
 * 학원 시스템 - 공통 데이터 테이블 컴포넌트
 * 재사용 가능한 테이블 UI
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */

import React from 'react';
import Table from '../../ui/Table/Table';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import './DataTable.css';

/**
 * 데이터 테이블 컴포넌트
 * 
 * @param {Array} columns - 컬럼 정의 배열
 * @param {Array} data - 테이블 데이터
 * @param {boolean} loading - 로딩 상태
 * @param {string} error - 에러 메시지
 * @param {Function} onRowClick - 행 클릭 핸들러
 * @param {boolean} striped - 줄무늬 스타일
 * @param {boolean} hoverable - 호버 효과
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRowClick = null,
  striped = true,
  hoverable = true,
  emptyMessage = '데이터가 없습니다.'
}) => {
  // 로딩 상태
  if (loading) {
    return <LoadingState />;
  }

  // 에러 상태
  if (error) {
    return <ErrorState message={error} />;
  }

  // 빈 상태
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  // 테이블 렌더링
  return (
    <div className="academy-data-table">
      <Table striped={striped} hoverable={hoverable}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id || row[columns[0]?.key] || index}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'academy-table-row-clickable' : ''}
            >
              {columns.map(col => (
                <td key={col.key} data-label={col.label}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default DataTable;

