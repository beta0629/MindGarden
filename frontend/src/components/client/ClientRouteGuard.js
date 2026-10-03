/**
 * ClientRouteGuard — 모든 보호 /client/* 라우트의 단일 가드 (레이아웃 라우트).
 *
 * 세션 복원(hasCheckedSession)이 끝난 뒤 한 번만 판단한다.
 * 화면별 navigate('/login') 분기를 두지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from '../common/ProtectedRoute';
import { USER_ROLES } from '../../constants/roles';

const CLIENT_ROUTE_ROLES = Object.freeze([USER_ROLES.CLIENT]);

const ClientRouteGuard = () => (
  <ProtectedRoute requiredRoles={CLIENT_ROUTE_ROLES}>
    <Outlet />
  </ProtectedRoute>
);

export default ClientRouteGuard;
