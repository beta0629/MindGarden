/**
 * ClientLegacyRedirect — 레거시 경로 → v4 SSOT Navigate
 *
 * @author CoreSolution
 * @since 2026-09-25
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

/**
 * @param {{ to: string }} props
 */
const ClientLegacyRedirect = ({ to }) => <Navigate to={to} replace />;

ClientLegacyRedirect.propTypes = {
  to: PropTypes.string.isRequired
};

export default ClientLegacyRedirect;
