/**
 * 상담사 전용 상담일지 검색 및 필터 (Molecule/Organism)
 * 
 * @author Core Solution
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';

const ConsultantRecordFilterBlock = ({
  searchTerm,
  onSearchTermChange,
  filterStatus,
  onFilterStatusChange,
  statusOptions
}) => {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--mg-bg-white)', border: '1px solid var(--mg-gray-300)', borderRadius: 'var(--mg-radius-md)', padding: '0.5rem 1rem' }}>
        <i className="bi bi-search" style={{ color: 'var(--mg-gray-400)', marginRight: '0.5rem' }}></i>
        <input
          type="text"
          style={{ border: 'none', outline: 'none', width: '100%', backgroundColor: 'transparent' }}
          placeholder="내담자명, 제목, 내용으로 검색..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>
      
      <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {statusOptions.map(option => (
          <MGButton
            key={option.value}
            type="button"
            onClick={() => onFilterStatusChange(option.value)}
            preventDoubleClick={false}
            variant={filterStatus === option.value ? 'primary' : 'outline'}
            className={`mg-v2-badge ${filterStatus === option.value ? 'mg-v2-badge--primary' : 'mg-v2-badge--default'}`}
            style={{ 
              cursor: 'pointer', 
              border: filterStatus === option.value ? 'none' : '1px solid var(--mg-gray-300)',
              backgroundColor: filterStatus === option.value ? 'var(--mg-primary-color)' : 'var(--mg-bg-white)',
              color: filterStatus === option.value ? 'var(--mg-color-text-on-primary, var(--mg-layout-header-bg))' : 'var(--mg-text-secondary)',
              padding: '0.5rem 1rem'
            }}
          >
            {option.label}
          </MGButton>
        ))}
      </div>
    </div>
  );
};

ConsultantRecordFilterBlock.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  onFilterStatusChange: PropTypes.func.isRequired,
  statusOptions: PropTypes.array.isRequired
};

export default ConsultantRecordFilterBlock;
