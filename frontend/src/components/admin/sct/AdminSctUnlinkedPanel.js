/**
 * 미연결 SCT 초대 목록(ADMIN/STAFF)
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useCallback, useEffect, useState } from 'react';
import SafeText from '../../common/SafeText';
import UnifiedLoading from '../../common/UnifiedLoading';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import notificationManager from '../../../utils/notification';
import { fetchSctUnlinkedInvitations } from '../../../utils/sctApi';
import {
  SCT_CSS,
  SCT_STATUS_LABEL,
  SCT_UI
} from '../../../constants/sctOnline';

/**
 * @returns {JSX.Element|null}
 */
const AdminSctUnlinkedPanel = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async() => {
    setLoading(true);
    try {
      const data = await fetchSctUnlinkedInvitations();
      setRows(data);
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

  return (
    <section className="mg-v2-sct-unlinked" aria-label={SCT_UI.UNLINKED_TITLE}>
      <h4 className="mg-v2-sct-admin__unlinked-title">{SCT_UI.UNLINKED_TITLE}</h4>
      {loading ? (
        <UnifiedLoading type="inline" text={SCT_UI.LOADING} />
      ) : rows.length === 0 ? (
        <p className={SCT_CSS.CAPTION}>{SCT_UI.UNLINKED_EMPTY}</p>
      ) : (
        <ul className="mg-v2-sct-unlinked__list">
          {rows.map((row) => (
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AdminSctUnlinkedPanel;