/**
 * MappingPartiesRow - 상담사 → 내담자 행
 *
 * @param {string} consultantName - 상담사 이름
 * @param {string} clientName - 내담자 이름
 * @param {'default'|'compact'} layout - compact: 1-line ellipsis (사이드바 row)
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import './MappingPartiesRow.css';
import { useTranslation } from 'react-i18next';

const MappingPartiesRow = ({ consultantName, clientName, layout = 'default' }) => {
  const { t } = useTranslation();
  const consultantDisplay = toDisplayString(consultantName, 'N/A');
  const clientDisplay = toDisplayString(clientName, 'N/A');
  const isCompact = layout === 'compact';

  return (
    <div
      className={[
        'integrated-schedule__card-parties',
        isCompact && 'integrated-schedule__card-parties--compact'
      ].filter(Boolean).join(' ')}
    >
      <span className="integrated-schedule__card-party">
        <span className="integrated-schedule__card-consultant">
          {consultantDisplay}
        </span>
        {!isCompact && (
          <span className="integrated-schedule__card-consultant-honorific">선생님</span>
        )}
      </span>
      <span className="integrated-schedule__card-arrow" aria-hidden="true">→</span>
      <span className="integrated-schedule__card-party">
        <span className="integrated-schedule__card-client">
          {clientDisplay}
        </span>
        {!isCompact && (
          <span className="integrated-schedule__card-client-honorific">
            {t('admin.labels.client')}
          </span>
        )}
      </span>
    </div>
  );
};

MappingPartiesRow.propTypes = {
  consultantName: PropTypes.string,
  clientName: PropTypes.string,
  layout: PropTypes.oneOf(['default', 'compact'])
};

MappingPartiesRow.defaultProps = {
  consultantName: '',
  clientName: '',
  layout: 'default'
};

export default MappingPartiesRow;
