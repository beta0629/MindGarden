/**
 * 센터 설정 — SCT 「질문지」 섹션 (ADMIN만 변경, feature OFF여도 렌더)
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useCallback, useEffect, useState } from 'react';
import { SettingsSectionPanel, SettingsButton } from '../settings-shell';
import SettingSwitchRow from '../../common/molecules/SettingSwitchRow';
import SafeErrorDisplay from '../../common/SafeErrorDisplay';
import { RoleUtils } from '../../../constants/roles';
import { useSession } from '../../../contexts/SessionContext';
import notificationManager from '../../../utils/notification';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import { fetchSctSettings, updateSctSettings } from '../../../utils/sctApi';
import {
  SCT_DEFAULTS,
  SCT_TEST_ID,
  SCT_UI
} from '../../../constants/sctOnline';
import AdminSctUnlinkedPanel from './AdminSctUnlinkedPanel';
import './sctAdmin.css';

/**
 * feature.sct.enabled OFF여도 섹션을 렌더해 ADMIN이 토글로 켤 수 있게 한다.
 */
const AdminSctSettingsSection = () => {
  const { user } = useSession();
  const isAdmin = RoleUtils.isAdmin(user);
  const [linkExpiryDays, setLinkExpiryDays] = useState(SCT_DEFAULTS.LINK_EXPIRY_DAYS);
  const [retentionDays, setRetentionDays] = useState(String(SCT_DEFAULTS.RETENTION_DAYS));
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async() => {
    try {
      const data = await fetchSctSettings();
      setLinkExpiryDays(data?.linkExpiryDays ?? SCT_DEFAULTS.LINK_EXPIRY_DAYS);
      setRetentionDays(String(data?.retentionDays ?? SCT_DEFAULTS.RETENTION_DAYS));
      setFeatureEnabled(data?.featureEnabled === true);
      setLoaded(true);
      setError(null);
    } catch (e) {
      setLoaded(false);
      setError(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded && error) {
    return (
      <SettingsSectionPanel
        title={SCT_UI.TAB_QUESTIONNAIRE}
        testId={SCT_TEST_ID.SETTINGS}
      >
        <SafeErrorDisplay error={error} />
      </SettingsSectionPanel>
    );
  }

  if (!loaded) {
    return null;
  }

  const handleSave = async(e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const days = Number(linkExpiryDays);
    if (!Number.isFinite(days)
      || days < SCT_DEFAULTS.LINK_EXPIRY_MIN
      || days > SCT_DEFAULTS.LINK_EXPIRY_MAX) {
      notificationManager.show(SCT_UI.VALIDATE_EXPIRY, 'error');
      return;
    }
    const retention = Number(retentionDays);
    if (!Number.isFinite(retention) || retention < SCT_DEFAULTS.RETENTION_MIN) {
      notificationManager.show(SCT_UI.VALIDATE_REQUIRED, 'error');
      return;
    }
    setSaving(true);
    try {
      const saved = await updateSctSettings({
        linkExpiryDays: days,
        retentionDays: retention,
        featureEnabled
      });
      setLinkExpiryDays(saved?.linkExpiryDays ?? days);
      setRetentionDays(String(saved?.retentionDays ?? retention));
      setFeatureEnabled(saved?.featureEnabled === true);
      notificationManager.success(SCT_UI.SETTINGS_SAVE_SUCCESS);
    } catch (err) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(err, SCT_UI.LOAD_FAIL),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSectionPanel
      title={SCT_UI.TAB_QUESTIONNAIRE}
      testId={SCT_TEST_ID.SETTINGS}
    >
      <div>
        <SafeErrorDisplay error={error} />
        <p className="mg-v2-settings-muted mg-v2-sct-caption">
          {SCT_UI.SETTINGS_SECTION}
          {' · '}
          {SCT_UI.SETTINGS_FEATURE_OFF}
          {featureEnabled ? ' (현재 ON)' : ' (현재 OFF)'}
        </p>
        <p className="mg-v2-sct-caption" role="note">{SCT_UI.SETTINGS_LEGAL_NOTE}</p>
        <form className="mg-v2-settings-form-grid" onSubmit={handleSave} noValidate>
          {isAdmin ? (
            <SettingSwitchRow
              id="sct-feature-enabled"
              label={SCT_UI.SETTINGS_FEATURE_TOGGLE}
              hint={SCT_UI.SETTINGS_FEATURE_HINT}
              statusLabel={featureEnabled
                ? SCT_UI.SETTINGS_FEATURE_ON
                : SCT_UI.SETTINGS_FEATURE_OFF_LABEL}
              checked={featureEnabled}
              onCheckedChange={setFeatureEnabled}
              disabled={saving}
              isPending={saving}
              data-testid={SCT_TEST_ID.SETTINGS_FEATURE_SWITCH}
              ariaLabel={SCT_UI.SETTINGS_FEATURE_TOGGLE}
            />
          ) : null}
          <div className="mg-v2-settings-field">
            <label className="mg-v2-form-label" htmlFor="sct-link-expiry">
              {SCT_UI.SETTINGS_LINK_EXPIRY}
            </label>
            <input
              id="sct-link-expiry"
              className="mg-v2-form-input"
              type="number"
              min={SCT_DEFAULTS.LINK_EXPIRY_MIN}
              max={SCT_DEFAULTS.LINK_EXPIRY_MAX}
              value={linkExpiryDays}
              disabled={!isAdmin || saving}
              onChange={(ev) => setLinkExpiryDays(ev.target.value)}
            />
          </div>
          <div className="mg-v2-settings-field">
            <label className="mg-v2-form-label" htmlFor="sct-retention">
              {SCT_UI.SETTINGS_RETENTION}
            </label>
            <input
              id="sct-retention"
              className="mg-v2-form-input"
              type="number"
              min={SCT_DEFAULTS.RETENTION_MIN}
              value={retentionDays}
              disabled={!isAdmin || saving}
              onChange={(ev) => setRetentionDays(ev.target.value)}
            />
            <p className="mg-v2-sct-caption">{SCT_UI.SETTINGS_RETENTION_HINT}</p>
          </div>
          {isAdmin ? (
            <div>
              <SettingsButton type="submit" disabled={saving}>
                {SCT_UI.SETTINGS_SAVE}
              </SettingsButton>
            </div>
          ) : null}
        </form>
        <AdminSctUnlinkedPanel key={featureEnabled ? 'on' : 'off'} />
      </div>
    </SettingsSectionPanel>
  );
};

export default AdminSctSettingsSection;
