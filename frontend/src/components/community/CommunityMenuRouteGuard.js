/**
 * 커뮤니티 라우트 가드 — LNB menuCode 없으면 fallbackPath 로 replace.
 * CLIENT `/client/community` 는 LNB 비탭 deep-link 이므로 이 가드를 쓰지 않는다.
 * CONSULTANT: 더보기 허브 등 역할별 fallbackPath 를 prop 으로 전달.
 *
 * @author MindGarden
 * @since 2026-09-11
 */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import { useCommunityMenuAllowed } from '../../hooks/useLnbMenus';

const CommunityMenuRouteGuard = ({ menuCode, fallbackPath, children }) => {
  const navigate = useNavigate();
  const { allowed, ready } = useCommunityMenuAllowed(menuCode);

  useEffect(() => {
    if (ready && !allowed) {
      navigate(fallbackPath, { replace: true });
    }
  }, [ready, allowed, navigate, fallbackPath]);

  if (!ready) {
    return <UnifiedLoading type="inline" text="메뉴 확인 중…" />;
  }
  if (!allowed) {
    return null;
  }
  return children;
};

CommunityMenuRouteGuard.propTypes = {
  menuCode: PropTypes.string.isRequired,
  fallbackPath: PropTypes.string.isRequired,
  children: PropTypes.node
};

export default CommunityMenuRouteGuard;
