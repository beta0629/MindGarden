import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';

/**
 * 레거시 경로 `/admin/psych-assessment` → SSOT `/admin/psych-assessments` (쿼리 유지)
 */
const PsychAssessmentLegacyRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`${ADMIN_ROUTES.PSYCH_ASSESSMENTS}${search}`} replace />;
};

export default PsychAssessmentLegacyRedirect;
