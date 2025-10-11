import React from 'react';
import './MGFilter.css';

/**
 * MindGarden 필터 컴포넌트
 * 데이터 필터링을 위한 통합 컴포넌트
 */
const MGFilter = ({
  filters = [],
  onFilterChange = null,
  onReset = null,
  loading = false,
  className = '',
  variant = 'default', // 'default', 'compact', 'inline'
  ...props
}) => {
  const handleFilterChange = (filterKey, value) => {
    if (onFilterChange) {
      onFilterChange(filterKey, value);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  const getFilterClasses = () => {
    return [
      'mg-filter',
      `mg-filter--${variant}`,
      loading ? 'mg-filter--loading' : '',
      className
    ].filter(Boolean).join(' ');
  };

  return (
    <div className={getFilterClasses()} {...props}>
      {loading && (
        <div className="mg-filter__loading">
          <div className="mg-filter__spinner"></div>
        </div>
      )}
      
      <div className="mg-filter__content">
        {filters.map((filter, index) => (
          <div key={index} className="mg-filter__item">
            {filter.type === 'select' && (
              <select
                value={filter.value}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="mg-filter__select"
                disabled={loading}
              >
                <option value="">{filter.placeholder || '전체'}</option>
                {filter.options.map((option, optionIndex) => (
                  <option key={optionIndex} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            {filter.type === 'input' && (
              <input
                type={filter.inputType || 'text'}
                value={filter.value}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                className="mg-filter__input"
                disabled={loading}
              />
            )}
            
            {filter.type === 'date' && (
              <input
                type="date"
                value={filter.value}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="mg-filter__input mg-filter__input--date"
                disabled={loading}
              />
            )}
            
            {filter.type === 'dateRange' && (
              <div className="mg-filter__date-range">
                <input
                  type="date"
                  value={filter.value?.start || ''}
                  onChange={(e) => handleFilterChange(filter.key, {
                    ...filter.value,
                    start: e.target.value
                  })}
                  className="mg-filter__input mg-filter__input--date"
                  placeholder="시작일"
                  disabled={loading}
                />
                <span className="mg-filter__date-separator">~</span>
                <input
                  type="date"
                  value={filter.value?.end || ''}
                  onChange={(e) => handleFilterChange(filter.key, {
                    ...filter.value,
                    end: e.target.value
                  })}
                  className="mg-filter__input mg-filter__input--date"
                  placeholder="종료일"
                  disabled={loading}
                />
              </div>
            )}
            
            {filter.type === 'checkbox' && (
              <div className="mg-filter__checkbox-group">
                {filter.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="mg-filter__checkbox-label">
                    <input
                      type="checkbox"
                      checked={filter.value?.includes(option.value) || false}
                      onChange={(e) => {
                        const currentValues = filter.value || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter(v => v !== option.value);
                        handleFilterChange(filter.key, newValues);
                      }}
                      className="mg-filter__checkbox"
                      disabled={loading}
                    />
                    <span className="mg-filter__checkbox-text">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {onReset && (
          <button
            onClick={handleReset}
            className="mg-filter__reset"
            disabled={loading}
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
};

export default MGFilter;



