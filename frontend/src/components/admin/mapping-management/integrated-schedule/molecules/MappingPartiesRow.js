/**
 * MappingPartiesRow - 이중 신원 스택 (상담 / 내담자) + optional 패키지
 * SSOT: docs/design-system/clinic-os-sidebar-cards.md
 *
 * @param {string} consultantName - 상담사 이름
 * @param {string} clientName - 내담자 이름
 * @param {string} [packageName] - 패키지명 (내담자 이름 아래 muted)
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { renderCompactPackageName } from '../../../../../utils/packagePricing';
import './MappingPartiesRow.css';

const ROLE_CONSULTANT = '상담';
const ROLE_CLIENT = '내담자';

const MappingPartiesRow = ({ consultantName, clientName, packageName }) => {
  const consultantDisplay = toDisplayString(consultantName, 'N/A');
  const clientDisplay = toDisplayString(clientName, 'N/A');
  const hasPackage = Boolean(toDisplayString(packageName, '').trim());

  return (
    <div className="integrated-schedule__card-parties">
      <div className="integrated-schedule__card-identity integrated-schedule__card-identity--consultant">
        <span className="integrated-schedule__card-identity-caption">{ROLE_CONSULTANT}</span>
        <span className="integrated-schedule__card-identity-name integrated-schedule__card-consultant">
          {consultantDisplay}
        </span>
      </div>
      <div className="integrated-schedule__card-identity integrated-schedule__card-identity--client">
        <span className="integrated-schedule__card-identity-caption">{ROLE_CLIENT}</span>
        <span className="integrated-schedule__card-identity-name integrated-schedule__card-client">
          {clientDisplay}
        </span>
        {hasPackage ? (
          <div className="integrated-schedule__card-package">
            {renderCompactPackageName(packageName)}
          </div>
        ) : null}
      </div>
    </div>
  );
};

MappingPartiesRow.propTypes = {
  consultantName: PropTypes.string,
  clientName: PropTypes.string,
  packageName: PropTypes.string
};

MappingPartiesRow.defaultProps = {
  consultantName: '',
  clientName: '',
  packageName: ''
};

export default MappingPartiesRow;
