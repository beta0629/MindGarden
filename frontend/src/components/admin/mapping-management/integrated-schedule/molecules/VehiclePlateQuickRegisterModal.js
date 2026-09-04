/**
 * VehiclePlateQuickRegisterModal — 내담자/상담사 차량번호 빠른 등록 (UnifiedModal)
 *
 * client → PUT /api/v1/admin/clients/{clientId} body `{ vehiclePlate }`
 * consultant → PUT /api/v1/admin/consultants/{consultantId} body `{ vehiclePlate }`
 *
 * @author CoreSolution
 * @since 2026-08-13
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../../../../common/modals/UnifiedModal';
import ActionBar from '../../../../common/ActionBar';
import ActionBarButton from '../../../../common/ActionBarButton';
import SafeText from '../../../../common/SafeText';
import StandardizedApi from '../../../../../utils/standardizedApi';
import {
  normalizeVehiclePlateInput,
  isValidVehiclePlateOptional
} from '../../../../../utils/validationUtils';
import { VALIDATION_MESSAGES } from '../../../../../constants/messages';
import notificationManager from '../../../../../utils/notification';

const TARGET_CLIENT = 'client';
const TARGET_CONSULTANT = 'consultant';

const VehiclePlateQuickRegisterModal = ({
  isOpen,
  onClose,
  target = TARGET_CLIENT,
  clientId,
  clientName,
  consultantId,
  consultantName,
  onRegistered,
  zIndex
}) => {
  const { t } = useTranslation(['admin', 'common']);
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isConsultant = target === TARGET_CONSULTANT;
  const entityId = isConsultant ? consultantId : clientId;
  const displayName = isConsultant ? consultantName : clientName;

  useEffect(() => {
    if (isOpen) {
      setPlate('');
      setError('');
      setSaving(false);
    }
  }, [isOpen, entityId, target]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setPlate(value);
    if (value.trim() && !isValidVehiclePlateOptional(value)) {
      setError(VALIDATION_MESSAGES.INVALID_VEHICLE_PLATE);
    } else {
      setError('');
    }
  }, []);

  const handleSubmit = useCallback(async() => {
    if (!entityId) {
      return;
    }
    const normalized = normalizeVehiclePlateInput(plate);
    if (!normalized) {
      setError(t('admin:integratedSchedule.vehiclePlate.required'));
      return;
    }
    if (!isValidVehiclePlateOptional(normalized)) {
      setError(VALIDATION_MESSAGES.INVALID_VEHICLE_PLATE);
      return;
    }
    setSaving(true);
    try {
      const url = isConsultant
        ? `/api/v1/admin/consultants/${entityId}`
        : `/api/v1/admin/clients/${entityId}`;
      await StandardizedApi.put(url, {
        vehiclePlate: normalized
      });
      notificationManager.success(t('admin:integratedSchedule.vehiclePlate.saveSuccess'));
      if (typeof onRegistered === 'function') {
        if (isConsultant) {
          onRegistered({ consultantId: entityId, consultantVehiclePlate: normalized });
        } else {
          onRegistered({ clientId: entityId, vehiclePlate: normalized });
        }
      }
      onClose();
    } catch (err) {
      const msg = err?.message
        || t('admin:integratedSchedule.vehiclePlate.saveFailed');
      notificationManager.error(msg);
    } finally {
      setSaving(false);
    }
  }, [entityId, isConsultant, plate, onRegistered, onClose, t]);

  const subtitleNode = useMemo(() => {
    if (!displayName) {
      return '';
    }
    return <SafeText>{displayName}</SafeText>;
  }, [displayName]);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin:integratedSchedule.vehiclePlate.modalTitle')}
      subtitle={subtitleNode}
      size="small"
      className="mg-v2-ad-b0kla"
      backdropClick={!saving}
      showCloseButton={!saving}
      loading={saving}
      zIndex={zIndex}
      actions={(
        <ActionBar align="end" gap="md">
          <ActionBarButton variant="outline" onClick={onClose} disabled={saving}>
            {t('common:actions.cancel')}
          </ActionBarButton>
          <ActionBarButton
            variant="primary"
            onClick={handleSubmit}
            loading={saving}
            disabled={saving || !entityId}
            data-testid="vehicle-plate-quick-register-submit"
          >
            {t('admin:integratedSchedule.vehiclePlate.save')}
          </ActionBarButton>
        </ActionBar>
      )}
    >
      <div className="mg-v2-form-group">
        <label htmlFor="quick-vehicle-plate" className="mg-v2-form-label">
          {t('admin:clientModal.form.vehiclePlateLabel')}
        </label>
        <input
          id="quick-vehicle-plate"
          name="vehiclePlate"
          type="text"
          value={plate}
          onChange={handleChange}
          placeholder={t('admin:clientModal.form.vehiclePlatePlaceholder')}
          maxLength={32}
          className={`mg-v2-form-input${error ? ' mg-v2-form-input--error' : ''}`}
          disabled={saving}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'quick-vehicle-plate-error' : undefined}
        />
        <small className="mg-v2-form-help">
          {t('admin:clientModal.form.vehiclePlateHelp')}
        </small>
        {error ? (
          <small
            id="quick-vehicle-plate-error"
            className="mg-v2-form-help mg-v2-form-help--error"
            role="alert"
          >
            <SafeText>{error}</SafeText>
          </small>
        ) : null}
      </div>
    </UnifiedModal>
  );
};

VehiclePlateQuickRegisterModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  target: PropTypes.oneOf([TARGET_CLIENT, TARGET_CONSULTANT]),
  clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  clientName: PropTypes.string,
  consultantId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  consultantName: PropTypes.string,
  onRegistered: PropTypes.func,
  zIndex: PropTypes.number
};

VehiclePlateQuickRegisterModal.defaultProps = {
  target: TARGET_CLIENT,
  clientId: null,
  clientName: '',
  consultantId: null,
  consultantName: '',
  onRegistered: undefined,
  zIndex: undefined
};

export default VehiclePlateQuickRegisterModal;
export { TARGET_CLIENT, TARGET_CONSULTANT };
