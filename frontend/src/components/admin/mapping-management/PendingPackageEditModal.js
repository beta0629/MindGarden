/**
 * PendingPackageEditModal — 가계약(PENDING_PAYMENT) 전용 패키지·가격 수정
 *
 * 동일 매핑 write SSOT: POST /api/v1/admin/mappings/{id}/pending-package 만 호출.
 * 일반 PUT updateMapping / cancel+recreate / 스케줄 강제 UI 금지.
 * Pencil accent bar·회계 용어 금지. Clinic-OS MGButton dusty teal.
 *
 * @author CoreSolution
 * @since 2026-08-29
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Package2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { ActionButton } from '../../common';
import SafeText from '../../common/SafeText';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import {
  toPackageOption,
  buildCombinedPackageName,
  parseCombinedPackageName
} from '../../../utils/packagePricing';
import '../MappingEditModal.css';
import './PendingPackageEditModal.css';

const PACKAGE_META_PLACEHOLDER = '-';
const formatSessions = (sessions) =>
  sessions == null ? `${PACKAGE_META_PLACEHOLDER}회기` : `${sessions}회기`;
const formatPrice = (price) =>
  price == null ? `${PACKAGE_META_PLACEHOLDER}원` : `${Number(price).toLocaleString()}원`;

const PendingPackageEditModal = ({ isOpen, onClose, mapping, onSuccess }) => {
  const { t } = useTranslation('admin');
  const [formData, setFormData] = useState({
    packageName: '',
    packagePrice: '',
    totalSessions: ''
  });
  const [packageOptions, setPackageOptions] = useState([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mapping && isOpen) {
      setFormData({
        packageName: mapping.packageName || '',
        packagePrice: mapping.packagePrice ?? '',
        totalSessions: mapping.totalSessions ?? ''
      });
      setSelectedPackageIds([]);
      setErrors({});
    }
  }, [mapping, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    const loadPackageOptions = async() => {
      setPackagesLoading(true);
      try {
        const { getTenantCodes } = await import('../../../utils/commonCodeApi');
        const codes = await getTenantCodes('CONSULTATION_PACKAGE');
        const options = (codes || [])
          .map(toPackageOption)
          .filter((opt) => opt.value)
          .sort((a, b) => {
            if (a.sortOrder == null && b.sortOrder == null) return 0;
            if (a.sortOrder == null) return 1;
            if (b.sortOrder == null) return -1;
            return a.sortOrder - b.sortOrder;
          });
        if (!cancelled) {
          setPackageOptions(options);
        }
      } catch (error) {
        console.error('패키지 옵션 로드 실패:', error);
        if (!cancelled) {
          notificationManager.show(t('mapping.pendingPackage.modal.error'), 'error');
        }
      } finally {
        if (!cancelled) {
          setPackagesLoading(false);
        }
      }
    };
    loadPackageOptions();
    return () => {
      cancelled = true;
    };
  }, [isOpen, t]);

  useEffect(() => {
    if (mapping?.packageName && packageOptions.length > 0) {
      const parts = parseCombinedPackageName(mapping.packageName);
      const inferredIds = packageOptions
        .filter((p) => parts.includes(p.label.trim()) || mapping.packageName === p.label)
        .map((p) => p.value);
      if (inferredIds.length > 0) {
        setSelectedPackageIds(inferredIds);
      }
    }
  }, [mapping, packageOptions]);

  const handlePackageSelect = (pkg) => {
    let newSelectedIds;
    if (selectedPackageIds.includes(pkg.value)) {
      newSelectedIds = selectedPackageIds.filter((id) => id !== pkg.value);
    } else {
      newSelectedIds = [...selectedPackageIds, pkg.value];
    }
    setSelectedPackageIds(newSelectedIds);

    const selectedPkgs = packageOptions.filter((p) => newSelectedIds.includes(p.value));
    const totalSessions = selectedPkgs.reduce((sum, p) => sum + (p.sessions || 0), 0);
    const packagePrice = selectedPkgs.reduce((sum, p) => sum + (p.price || 0), 0);
    const packageName = selectedPkgs.length > 0
      ? buildCombinedPackageName(selectedPkgs.map((p) => p.label))
      : '';

    setFormData({
      packageName,
      packagePrice,
      totalSessions
    });

    if (errors.packageName && newSelectedIds.length > 0) {
      setErrors((prev) => ({ ...prev, packageName: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.packageName || !String(formData.packageName).trim()) {
      newErrors.packageName = t('mapping.pendingPackage.modal.validateRequired');
    }
    const priceMissing = formData.packagePrice === '' || formData.packagePrice == null
      || Number.isNaN(Number(formData.packagePrice));
    const sessionsMissing = formData.totalSessions === '' || formData.totalSessions == null
      || Number.isNaN(Number(formData.totalSessions));
    if (formData.packageName && (priceMissing || sessionsMissing)) {
      newErrors.packageName = t('mapping.pendingPackage.modal.validateLoading');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(event) => {
    event.preventDefault();
    if (!validateForm() || !mapping?.id || loading) {
      return;
    }
    setLoading(true);
    try {
      const data = await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_PACKAGE(mapping.id),
        {
          packageName: String(formData.packageName).trim(),
          packagePrice: Number.parseFloat(formData.packagePrice),
          totalSessions: Number.parseInt(formData.totalSessions, 10)
        }
      );
      notificationManager.show(t('mapping.pendingPackage.modal.success'), 'success');
      onSuccess?.(data);
      onClose();
    } catch (error) {
      console.error('가계약 패키지 변경 실패:', error);
      notificationManager.show(
        error?.message || t('mapping.pendingPackage.modal.error'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    setFormData({ packageName: '', packagePrice: '', totalSessions: '' });
    setSelectedPackageIds([]);
    setErrors({});
    onClose();
  };

  if (!isOpen || !mapping) {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('mapping.pendingPackage.modal.title')}
      subtitle={t('mapping.pendingPackage.modal.subtitle')}
      size="medium"
      className="mg-v2-ad-b0kla"
      backdropClick
      showCloseButton
      loading={loading}
      actions={(
        <>
          <ActionButton
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {t('mapping.pendingPackage.modal.cancel')}
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || packagesLoading}
          >
            {t('mapping.pendingPackage.modal.submit')}
          </ActionButton>
        </>
      )}
    >
      <div className="mg-v2-modal-body mg-v2-pending-package-edit">
        <section className="mg-v2-pending-package-edit__section">
          <h3 className="mg-v2-pending-package-edit__section-title">
            <Package2 size={18} aria-hidden="true" />
            {t('mapping.pendingPackage.modal.sectionCurrent')}
          </h3>
          <div className="mg-v2-info-grid">
            <div className="mg-v2-info-row">
              <span className="mg-v2-info-label">{t('mapping.pendingPackage.modal.labelPackage')}</span>
              <span className="mg-v2-info-value">
                <SafeText>{mapping.packageName || PACKAGE_META_PLACEHOLDER}</SafeText>
              </span>
            </div>
            <div className="mg-v2-info-row">
              <span className="mg-v2-info-label">{t('mapping.pendingPackage.modal.labelPrice')}</span>
              <span className="mg-v2-info-value">{formatPrice(mapping.packagePrice)}</span>
            </div>
            <div className="mg-v2-info-row">
              <span className="mg-v2-info-label">{t('mapping.pendingPackage.modal.labelSessions')}</span>
              <span className="mg-v2-info-value">{formatSessions(mapping.totalSessions)}</span>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit}>
          <section className="mg-v2-pending-package-edit__section">
            <h3 className="mg-v2-pending-package-edit__section-title">
              <Package2 size={18} aria-hidden="true" />
              {t('mapping.pendingPackage.modal.sectionSelect')}
            </h3>
            {packagesLoading && (
              <p className="mg-v2-form-help">{t('mapping.pendingPackage.modal.loadingPackages')}</p>
            )}
            {!packagesLoading && packageOptions.length === 0 && (
              <p className="mg-v2-form-help">{t('mapping.pendingPackage.modal.noPackages')}</p>
            )}
            <div className="mg-v2-mapping-edit-modal__package-grid">
              {packageOptions.map((pkg) => {
                const isSelected = selectedPackageIds.includes(pkg.value);
                return (
                  <MGButton
                    key={pkg.value}
                    type="button"
                    variant="outline"
                    className={`mg-v2-pending-package-edit__package-card${
                      isSelected ? ' mg-v2-pending-package-edit__package-card--selected' : ''
                    }`}
                    onClick={() => handlePackageSelect(pkg)}
                    disabled={loading}
                    preventDoubleClick={false}
                  >
                    <SafeText className="mg-v2-pending-package-edit__package-label" tag="span">
                      {pkg.label}
                    </SafeText>
                    <span className="mg-v2-pending-package-edit__package-meta">
                      {formatSessions(pkg.sessions)}
                      {' · '}
                      {formatPrice(pkg.price)}
                    </span>
                  </MGButton>
                );
              })}
            </div>
            {errors.packageName && (
              <span className="mg-v2-form-error">{errors.packageName}</span>
            )}
          </section>

          {(formData.packageName && (formData.packagePrice !== '' || formData.totalSessions !== '')) && (
            <section className="mg-v2-pending-package-edit__section mg-v2-pending-package-edit__summary">
              <h4 className="mg-v2-pending-package-edit__section-title">
                {t('mapping.pendingPackage.modal.sectionSummary')}
              </h4>
              <div className="mg-v2-info-grid">
                <div className="mg-v2-info-row">
                  <span className="mg-v2-info-label">{t('mapping.pendingPackage.modal.labelPrice')}</span>
                  <span className="mg-v2-info-value">
                    {Number(formData.packagePrice || 0).toLocaleString()}원
                  </span>
                </div>
                <div className="mg-v2-info-row">
                  <span className="mg-v2-info-label">{t('mapping.pendingPackage.modal.labelSessions')}</span>
                  <span className="mg-v2-info-value">
                    {formatSessions(formData.totalSessions)}
                  </span>
                </div>
              </div>
            </section>
          )}
        </form>
      </div>
    </UnifiedModal>
  );
};

PendingPackageEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    packageName: PropTypes.string,
    packagePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalSessions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string
  }),
  onSuccess: PropTypes.func
};

PendingPackageEditModal.defaultProps = {
  mapping: null,
  onSuccess: null
};

export default PendingPackageEditModal;
