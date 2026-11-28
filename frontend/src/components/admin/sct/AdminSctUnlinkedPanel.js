/**
 * 미연결 SCT 초대 목록(ADMIN/STAFF). ADMIN·CONSULTANT만 링크 재발급·복사.
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useCallback, useEffect, useState } from 'react';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import { RoleUtils, USER_ROLES } from '../../../constants/roles';
import { useSession } from '../../../contexts/SessionContext';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import notificationManager from '../../../utils/notification';
import {
  fetchSctSettings,
  fetchSctUnlinkedInvitations,
  reissueSctInviteLink
} from '../../../utils/sctApi';
import {
  SCT_CSS,
  SCT_STATUS,
  SCT_STATUS_LABEL,
  SCT_TEST_ID,
  SCT_UI
} from '../../../constants/sctOnline';
import SctInviteQrCard from './SctInviteQrCard';

/**
 * 공개 링크 복사·재발급 UI — ADMIN·CONSULTANT만 (STAFF 목록만).
 *
 * @param {object|null|undefined} user
 * @returns {boolean}
 */
const canUseSctPublicLinkUi = (user) => (
  RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, USER_ROLES.CONSULTANT)
);

/**
 * @returns {JSX.Element|null}
 */
const AdminSctUnlinkedPanel = () => {
  const { user } = useSession();
  const canPublicLink = canUseSctPublicLinkUi(user);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reissuedById, setReissuedById] = useState({});
  /** @type {[Record<string|number, object>, Function]} */
  const [reissuedInviteById, setReissuedInviteById] = useState({});
  const [officePhone, setOfficePhone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');

  const load = useCallback(async() => {
    setLoading(true);
    try {
      const [data, settings] = await Promise.all([
        fetchSctUnlinkedInvitations(),
        fetchSctSettings().catch(() => null)
      ]);
      setRows(Array.isArray(data) ? data : []);
      setOfficePhone(
        typeof settings?.officePhone === 'string' ? settings.officePhone.trim() : ''
      );
      setMobilePhone(
        typeof settings?.mobilePhone === 'string' ? settings.mobilePhone.trim() : ''
      );
    } catch (e) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
        'error'
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReissue = async(rowId) => {
    try {
      const refreshed = await reissueSctInviteLink(rowId);
      const hasQr = Boolean(
        refreshed?.absoluteShortUrl
        || refreshed?.absoluteUrl
        || refreshed?.shortUrl
        || refreshed?.publicUrl
      );
      if (hasQr) {
        setReissuedInviteById((prev) => ({ ...prev, [rowId]: refreshed }));
        if (refreshed?.publicUrl) {
          setReissuedById((prev) => ({ ...prev, [rowId]: refreshed.publicUrl }));
        }
        notificationManager.success(SCT_UI.REISSUE_SUCCESS);
      }
      load();
    } catch (e) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
        'error'
      );
    }
  };

  return (
    <section className="mg-v2-sct-unlinked" aria-label={SCT_UI.UNLINKED_TITLE}>
      <h4 className="mg-v2-sct-admin__unlinked-title">{SCT_UI.UNLINKED_TITLE}</h4>
      {loading ? (
        <UnifiedLoading type="inline" text={SCT_UI.LOADING} />
      ) : rows.length === 0 ? (
        <p className={SCT_CSS.CAPTION}>{SCT_UI.UNLINKED_EMPTY}</p>
      ) : (
        <ul className="mg-v2-sct-unlinked__list">
          {rows.map((row) => {
            const canReissue = canPublicLink
              && (row.status === SCT_STATUS.SENT || row.status === SCT_STATUS.DRAFT);
            const publicUrl = reissuedById[row.id];
            const reissuedInvite = reissuedInviteById[row.id];
            return (
              <li key={row.id} className="mg-v2-sct-unlinked__row">
                <SafeText>
                  {toDisplayString(row.recipientName, '—')}
                </SafeText>
                <span className="lab-m">
                  {SCT_STATUS_LABEL[row.status] || row.status}
                </span>
                <span className="lab-m">
                  <SafeText>{toDisplayString(row.managementNo, '—')}</SafeText>
                </span>
                {canReissue ? (
                  <div className="mg-v2-sct-unlinked__actions">
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      preventDoubleClick={false}
                      data-testid={`${SCT_TEST_ID.UNLINKED_REISSUE}-${row.id}`}
                      onClick={() => handleReissue(row.id)}
                    >
                      {SCT_UI.REISSUE_LINK}
                    </MGButton>
                    <div
                      className="mg-v2-sct-unlinked__copy"
                      data-testid={`${SCT_TEST_ID.UNLINKED_COPY_AREA}-${row.id}`}
                    >
                      {reissuedInvite ? (
                        <SctInviteQrCard
                          invitation={reissuedInvite}
                          recipientName={toDisplayString(row.recipientName, '')}
                          officePhone={officePhone}
                          mobilePhone={mobilePhone}
                          isReissued
                          onInvitationChange={(next) => {
                            setReissuedInviteById((prev) => ({ ...prev, [row.id]: next }));
                            if (next?.publicUrl) {
                              setReissuedById((prev) => ({ ...prev, [row.id]: next.publicUrl }));
                            }
                          }}
                        />
                      ) : publicUrl ? (
                        <SctInviteQrCard
                          invitation={{ publicUrl, id: row.id, recipientName: row.recipientName }}
                          recipientName={toDisplayString(row.recipientName, '')}
                          officePhone={officePhone}
                          mobilePhone={mobilePhone}
                          isReissued
                        />
                      ) : (
                        <p
                          className={SCT_CSS.CAPTION}
                          data-testid={`${SCT_TEST_ID.UNLINKED_COPY_HINT}-${row.id}`}
                        >
                          {SCT_UI.UNLINKED_COPY_HINT}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default AdminSctUnlinkedPanel;
