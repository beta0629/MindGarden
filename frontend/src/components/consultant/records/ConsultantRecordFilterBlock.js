/**
 * 상담사 전용 상담일지 검색 및 필터 (Molecule/Organism)
 * 
 * @author Core Solution
 */

import React from 'react';
import PropTypes from 'prop-types';

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
      
      <div style={{ flex: '0 0 auto' }}>
        <select
          className="mg-select"
          style={{ padding: '0.5rem 1rem', borderRadius: 'var(--mg-radius-md)', border: '1px solid var(--mg-gray-300)', backgroundColor: 'var(--mg-bg-white)', minWidth: '150px' }}
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
