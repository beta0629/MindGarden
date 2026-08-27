/**
 * RedirectWithSearch harness — mirrors App.js CLN-01 pattern
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

function RedirectWithSearch({ to }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location-display">
      {`${location.pathname}${location.search}`}
    </div>
  );
}

/**
 * Minimal route tree: legacy admin financial → canonical /erp/financial
 */
export default function RedirectWithSearchHarness() {
  return (
    <Routes>
      <Route
        path="/admin/erp/financial"
        element={<RedirectWithSearch to="/erp/financial" />}
      />
      <Route path="/erp/financial" element={<LocationDisplay />} />
    </Routes>
  );
}
