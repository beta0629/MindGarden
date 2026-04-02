/**
 * /mypage, /settings 단일 진입 → 역할별 실제 라우트로 리다이렉트
 *
 * @author CoreSolution
 * @since 2026-04-02
 */

import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import UnifiedLoading from './UnifiedLoading';
import { getMypagePathForRole, getSettingsPathForRole } from '../../utils/roleMypageSettingsPaths';

function RoleRedirect({ resolvePath }) {
  const { user, isLoading, hasCheckedSession } = useSession();

  if (isLoading || !hasCheckedSession) {
    return <UnifiedLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const to = resolvePath(user.role);
  if (!to) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={to} replace />;
}

RoleRedirect.propTypes = {
  resolvePath: PropTypes.func.isRequired
};

/**
 * @returns {JSX.Element}
 */
export function MypageRedirect() {
  return <RoleRedirect resolvePath={getMypagePathForRole} />;
}

/**
 * @returns {JSX.Element}
 */
export function SettingsRedirect() {
  return <RoleRedirect resolvePath={getSettingsPathForRole} />;
}
