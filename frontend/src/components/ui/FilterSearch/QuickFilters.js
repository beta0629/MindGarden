/**
 * 빠른 필터 버튼 컴포넌트 (Presentational)
 * 
 * 표준화 원칙 준수:
 * - MGButton 컴포넌트 재사용
 * - mg-v2-* CSS 클래스 사용
 * - 상수 사용
 * 
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-12-09
 */

import React from 'react';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { QUICK_FILTER_OPTIONS } from '../../../constants/filterSearch';

const QuickFilters = ({
  activeFilter = 'all',
  options = QUICK_FILTER_OPTIONS,
  onFilterChange
}) => {
  return (
    <div className="mg-v2-quick-filters">
      {options.map(option => (
        <MGButton
          key={option.value}
          variant={activeFilter === option.value ? 'primary' : 'outline'}
          size="small"
          className={buildErpMgButtonClassName({
            variant: activeFilter === option.value ? 'primary' : 'outline',
            size: 'sm',
            loading: false,
            className: `mg-v2-quick-filter ${activeFilter === option.value ? 'mg-v2-quick-filter--active' : ''}`
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onFilterChange(option.value)}
        >
          {option.label}
        </MGButton>
      ))}
    </div>
  );
};

export default QuickFilters;

