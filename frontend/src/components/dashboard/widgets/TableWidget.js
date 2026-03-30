/**
 * Table Widget - 표준화된 위젯
/**
 * 테이블을 표시하는 위젯
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (표준화 업그레이드)
/**
 * @since 2025-11-21
 */

import React from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './Widget.css';

const TableWidget = ({ widget, user }) => {
  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: !!(user && user.id),
    cache: true,
    retryCount: 3
  });

  const config = widget.config || {};
  const columns = config.columns || [];

  // 테이블 렌더링
  const renderTable = () => {
    if (isEmpty) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 테이블 데이터가 없습니다.
        </div>
      );
    }
    
    if (!hasData || !Array.isArray(data)) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    // 컬럼이 정의되지 않은 경우 첫 번째 데이터에서 추출
    const tableColumns = columns.length > 0 ? columns : 
      (data.length > 0 ? Object.keys(data[0]).map(key => ({ key, label: key, type: 'text' })) : []);

    return (
      <div className="table-container">
        <div className="table-responsive">
          <table className="widget-table">
            <thead>
              <tr>
                {tableColumns.map((column, index) => (
                  <th key={index} className="table-header">
                    {column.label || column.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="table-row">
                  {tableColumns.map((column, colIndex) => (
                    <td key={colIndex} className="table-cell">
                      {formatValue(row[column.key], column.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.length === 0 && (
          <div className="table-empty">
            <i className="bi bi-table"></i>
            <span>테이블에 표시할 데이터가 없습니다.</span>
          </div>
        )}
        
        <div className="table-footer">
          <span className="table-info">총 {data.length}개 항목</span>
        </div>
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.TABLE}
      subtitle={widget.config?.subtitle || ''}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderTable()}
      </div>
    </BaseWidget>
  );
};

export default TableWidget;