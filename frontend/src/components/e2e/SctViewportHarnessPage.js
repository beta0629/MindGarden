/**
 * SCT 7폭 Playwright용 하네스 — 실제 패널 컴포넌트 마운트(API mock).
 * ENV 로그인 없이 synthetic storage + route mock으로 검증한다.
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ClientSidePeekContent from '../admin/ClientComprehensiveManagement/molecules/ClientSidePeekContent';
import AdminSctSettingsSection from '../admin/sct/AdminSctSettingsSection';
import SctSessionPanel from '../consultant/sct/SctSessionPanel';
import { SCT_TEST_ID, SCT_UI } from '../../constants/sctOnline';
import '../admin/sct/sctAdmin.css';

const HARNESS_CLIENT = Object.freeze({
  id: 9001,
  name: 'E2E내담자',
  status: 'ACTIVE',
  phone: '01012345678',
  email: 'e2e-client@local'
});

const PANEL = Object.freeze({
  ADMIN: 'admin',
  SESSION: 'session',
  SETTINGS: 'settings'
});

/**
 * ?panel=admin|session|settings
 */
const SctViewportHarnessPage = () => {
  const [params] = useSearchParams();
  const panel = useMemo(() => {
    const raw = (params.get('panel') || PANEL.ADMIN).toLowerCase();
    if (raw === PANEL.SESSION || raw === PANEL.SETTINGS) {
      return raw;
    }
    return PANEL.ADMIN;
  }, [params]);

  return (
    <main
      className="mg-v2-sct-harness"
      data-testid={SCT_TEST_ID.HARNESS}
      data-panel={panel}
      aria-label={SCT_UI.TITLE}
    >
      {panel === PANEL.ADMIN ? (
        <ClientSidePeekContent client={HARNESS_CLIENT} />
      ) : null}
      {panel === PANEL.SESSION ? (
        <div className="mg-v2-sct-session-grid">
          <SctSessionPanel
            clientId={HARNESS_CLIENT.id}
            clientName={HARNESS_CLIENT.name}
          />
        </div>
      ) : null}
      {panel === PANEL.SETTINGS ? (
        <AdminSctSettingsSection />
      ) : null}
    </main>
  );
};

export default SctViewportHarnessPage;
