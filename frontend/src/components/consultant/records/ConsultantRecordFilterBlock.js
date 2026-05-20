/**
 * 상담사 전용 상담일지 검색 및 필터 (Molecule/Organism)
 * 
 * @author Core Solution
 */

import React from 'react';
import PropTypes from 'prop-types';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import './ConsultantRecordFilterBlock.css';

const ConsultantRecordFilterBlock = ({
  searchTerm,
  onSearchTermChange,
  filterStatus,
  onFilterStatusChange,
  statusOptions
}) => {
  return (
    <div className="consultant-record-filter">
      <div className="consultant-record-filter__search-wrap">
        <i className="bi bi-search consultant-record-filter__search-icon" />
        <input
          type="text"
          className="consultant-record-filter__search-input"
          placeholder="내담자명, 제목, 내용으로 검색..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      <div className="consultant-record-filter__button-group">
        {statusOptions.map(option => {
          const isActive = filterStatus === option.value;
          return (
            <MGButton
              key={option.value}
              type="button"
              onClick={() => onFilterStatusChange(option.value)}
              preventDoubleClick={false}
              variant={isActive ? 'primary' : 'outline'}
              className={`${buildErpMgButtonClassName({
                variant: isActive ? 'primary' : 'outline',
                size: 'md',
                loading: false,
                className: `mg-v2-badge ${isActive ? 'mg-v2-badge--primary' : 'mg-v2-badge--default'}`
              })} consultant-record-filter__button ${isActive ? 'consultant-record-filter__button--active' : 'consultant-record-filter__button--inactive'}`}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              {option.label}
            </MGButton>
          );
        })}
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
