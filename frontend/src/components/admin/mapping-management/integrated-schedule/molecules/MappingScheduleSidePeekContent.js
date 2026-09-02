/**
 * MappingScheduleSidePeekContent — 통합일정 Side Peek 본문
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { getMappingStatusKoreanNameSync } from '../../../../../utils/codeHelper';
import { parseCombinedPackageName } from '../../../../../utils/packagePricing';
import ActionButton from '../../../../common/ActionButton';
import SafeText from '../../../../common/SafeText';
import StatusBadge from '../../../../common/StatusBadge';
import VehiclePlateQuickRegisterModal from './VehiclePlateQuickRegisterModal';
import './MappingScheduleSidePeekContent.css';

const hasVehiclePlate = (value) => {
  if (value == null) {
    return false;
  }
  return String(value).trim() !== '';
};

const MappingScheduleSidePeekContent = ({ mapping, mappingStatusInfo, onVehiclePlateRegistered }) => {
  const { t } = useTranslation(['admin']);
  const [registerOpen, setRegisterOpen] = useState(false);

  const handleRegistered = useCallback((payload) => {
    if (typeof onVehiclePlateRegistered === 'function') {
      onVehiclePlateRegistered(payload);
    }
  }, [onVehiclePlateRegistered]);

  if (!mapping) {
    return null;
  }

  const clientName = toDisplayString(mapping.clientName, '—');
  const consultantName = toDisplayString(mapping.consultantName, '—');
  const statusCode = mapping.status || '';
  const statusLabel = mappingStatusInfo?.[statusCode]?.label
    ?? getMappingStatusKoreanNameSync(statusCode)
    ?? '—';
  const remainingSessions = mapping.remainingSessions ?? '—';
  const packageParts = parseCombinedPackageName(mapping.packageName);
  const platePresent = hasVehiclePlate(mapping.vehiclePlate);
  const canRegister = Boolean(mapping.clientId);

  return (
    <div className="integrated-schedule-side-peek-stub">
      <dl className="integrated-schedule-side-peek-stub__facts">
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.clientLabel')}</dt>
          <dd><SafeText>{clientName}</SafeText></dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.consultantLabel')}</dt>
          <dd><SafeText>{consultantName}</SafeText></dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.packageLabel')}</dt>
          <dd>
            {packageParts.length > 0 ? (
              <div className="integrated-schedule-side-peek-stub__package-chips">
                {packageParts.map((pkg, idx) => (
                  <span key={idx} className="mg-v2-chip mg-v2-chip--neutral integrated-schedule-side-peek-stub__chip">
                    <SafeText>{pkg}</SafeText>
                  </span>
                ))}
              </div>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.statusLabel')}</dt>
          <dd>
            {statusCode ? (
              <StatusBadge status={statusCode}>{statusLabel}</StatusBadge>
            ) : (
              <SafeText>—</SafeText>
            )}
          </dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.remainingSessionsLabel')}</dt>
          <dd><SafeText>{remainingSessions}</SafeText></dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.vehiclePlateLabel')}</dt>
          <dd>
            {platePresent ? (
              <SafeText>{toDisplayString(mapping.vehiclePlate)}</SafeText>
            ) : canRegister ? (
              <ActionButton
                variant="outline"
                size="small"
                onClick={() => setRegisterOpen(true)}
              >
                {t('admin:integratedSchedule.vehiclePlate.registerCta')}
              </ActionButton>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>
      <p className="integrated-schedule-side-peek-stub__placeholder" role="note">
        {t('admin:integratedSchedule.sidePeek.placeholderNote')}
      </p>
      <VehiclePlateQuickRegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        clientId={mapping.clientId}
        clientName={mapping.clientName}
        onRegistered={handleRegistered}
      />
    </div>
  );
};

MappingScheduleSidePeekContent.propTypes = {
  mappingStatusInfo: PropTypes.object,
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clientName: PropTypes.string,
    consultantName: PropTypes.string,
    packageName: PropTypes.string,
    status: PropTypes.string,
    remainingSessions: PropTypes.number,
    vehiclePlate: PropTypes.string
  }),
  onVehiclePlateRegistered: PropTypes.func
};

MappingScheduleSidePeekContent.defaultProps = {
  mapping: null,
  mappingStatusInfo: {},
  onVehiclePlateRegistered: undefined
};

export default MappingScheduleSidePeekContent;
