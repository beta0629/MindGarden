/**
 * Table Widget
 * 테이블을 표시하는 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */

import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../common/UnifiedLoading';
import { apiGet } from '../../../utils/ajax';
import './Widget.css';

const TableWidget = ({ widget, user }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const columns = config.columns || [];
  const pagination = config.pagination || {};
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [page]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        ...(dataSource.params || {}),
        page: pagination.enabled ? page : undefined,
        size: pagination.enabled ? pageSize : undefined
      };
      
      const response = await apiGet(dataSource.url, params);
      
      if (response) {
        // 응답에서 배열 추출 (응답 구조에 따라 조정 필요)
        const items = Array.isArray(response) ? response : 
                     (response.data || response.items || []);
        setData(items);
      }
    } catch (err) {
      console.error('TableWidget 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (column.format === 'currency') {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
      }).format(value);
    }
    
    if (column.format === 'date') {
      return new Date(value).toLocaleDateString('ko-KR');
    }
    
    return value;
  };
  
  if (loading && data.length === 0) {
    return (
      <div className="widget widget-table">
        <div className="widget-title">{config.title || '테이블'}</div>
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  if (error && data.length === 0) {
    return (
      <div className="widget widget-table widget-error">
        <div className="widget-title">{config.title || '테이블'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="widget widget-table">
      <div className="widget-header">
        <div className="widget-title">{config.title || '테이블'}</div>
      </div>
      <div className="widget-body">
        <div className="table-container">
          <table className="widget-table-content">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index} style={{ width: column.width }}>
                    {column.header || column.field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="table-empty">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column, colIndex) => (
                      <td key={colIndex}>
                        {formatCellValue(row[column.field], column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination.enabled && (
          <div className="table-pagination">
            <button 
              onClick={() => setPage(page - 1)} 
              disabled={page <= 1}
            >
              이전
            </button>
            <span>페이지 {page}</span>
            <button 
              onClick={() => setPage(page + 1)}
              disabled={data.length < pageSize}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableWidget;

