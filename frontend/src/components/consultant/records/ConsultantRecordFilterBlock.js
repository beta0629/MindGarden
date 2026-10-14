/**
 * 상담사 전용 상담일지 검색 및 상태 필터 — 검색 + slate 칩 단일 툴바
 *
 * @author Core Solution
 * @updated 2026-10-07 — 상담사 스위트 툴바(ConsultantSearchField + ConsultantFilterChips)
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ConsultantSearchField from '../suite/ConsultantSearchField';
import ConsultantFilterChips from '../suite/ConsultantFilterChips';
import { CONSULTANT_SUITE_CLASS, CONSULTANT_SUITE_NS } from '../../../constants/consultantSuite';

const SEARCH_INPUT_ID = 'consultant-records-search';

const ConsultantRecordFilterBlock = ({
  searchTerm,
  onSearchTermChange,
  filterStatus,
  onFilterStatusChange,
  statusOptions
}) => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const chipItems = statusOptions.map((option) => ({
    key: String(option.value),
    label: String(option.label)
  }));

  return (
    <div className={CONSULTANT_SUITE_CLASS.TOOLBAR}>
      <ConsultantSearchField
        id={SEARCH_INPUT_ID}
        value={searchTerm}
        onChange={onSearchTermChange}
        placeholder={t('records.searchPlaceholder')}
        ariaLabel={t('records.searchAria')}
      />
      <ConsultantFilterChips
        items={chipItems}
        activeKey={String(filterStatus)}
        onChange={onFilterStatusChange}
        ariaLabel={t('records.statusFilterAria')}
        testIdPrefix="consultant-records-filter"
      />
    </div>
  );
};

ConsultantRecordFilterBlock.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  onFilterStatusChange: PropTypes.func.isRequired,
  statusOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired
  })).isRequired
};

export default ConsultantRecordFilterBlock;
