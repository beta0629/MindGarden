/**
 * ConsultantNotice — 상담사 스위트 한 줄 안내 (slate notice · info-blue 배너 대체)
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CONSULTANT_SUITE_CLASS } from '../../../constants/consultantSuite';
import './ConsultantSuite.css';

const ConsultantNotice = ({ children, icon, className }) => (
  <p className={[CONSULTANT_SUITE_CLASS.NOTICE, className].filter(Boolean).join(' ')} role="note">
    {icon ? <span className="consultant-suite-notice__icon" aria-hidden="true">{icon}</span> : null}
    <span className="consultant-suite-notice__text">{children}</span>
  </p>
);

ConsultantNotice.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  className: PropTypes.string
};

ConsultantNotice.defaultProps = {
  icon: null,
  className: ''
};

export default ConsultantNotice;
