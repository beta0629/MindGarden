/**
 * MappingPartiesRow - 상담사 → 내담자 행
 * @param {string} consultantName - 상담사 이름
 * @param {string} clientName - 내담자 이름
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import './MappingPartiesRow.css';
import { useTranslation } from 'react-i18next';

const MappingPartiesRow = ({ consultantName, clientName }) => {
  const { t } = useTranslation();
  const consultantDisplay = toDisplayString(consultantName, 'N/A');
  const clientDisplay = toDisplayString(clientName, 'N/A');

  return (
    <div className="integrated-schedule__card-parties">
      <span className="integrated-schedule__card-consultant">
        {consultantDisplay}
      </span>
      <span className="integrated-schedule__card-consultant-honorific">선생님</span>
      <span className="integrated-schedule__card-arrow" aria-hidden="true">→</span>
      <span className="integrated-schedule__card-client">
        {clientDisplay}
      </span>
      <span className="integrated-schedule__card-client-honorific">{t('admin.labels.client', '내담자')}</span>
    </div>
  );
};

MappingPartiesRow.propTypes = {
  consultantName: PropTypes.string,
  clientName: PropTypes.string
};

MappingPartiesRow.defaultProps = {
  consultantName: '',
  clientName: ''
};

export default MappingPartiesRow;
