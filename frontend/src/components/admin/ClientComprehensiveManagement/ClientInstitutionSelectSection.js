/**
 * 내담자 등록 — 연계 기관 검색/선택 또는 신규.
 * 기관 행은 partner_institutions 에만 둔다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import CustomSelect from '../../common/CustomSelect';
import EmptyState from '../../common/EmptyState';
import FormInput from '../../common/FormInput';
import MGButton from '../../common/MGButton';
import MgEmailFieldWithAutocomplete from '../../common/MgEmailFieldWithAutocomplete';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import StandardizedApi from '../../../utils/standardizedApi';
import { toDisplayString } from '../../../utils/safeDisplay';
import { CLIENT_INSTITUTION_SELECT_CSS } from '../../../constants/clientEngagementType';
import {
  INSTITUTION_LINK_API,
  unwrapPartnerInstitution,
  unwrapPartnerInstitutionList
} from '../../../constants/institutionLinkAdminApi';

/**
 * 신규 기관이 필요하면 POST 후 partnerInstitutionId 를 채운다.
 *
 * @param {object} formData
 * @returns {Promise<object>}
 */
export async function ensurePartnerInstitutionOnForm(formData) {
  const hasId = formData?.partnerInstitutionId != null
    && String(formData.partnerInstitutionId).trim() !== '';
  if (hasId || formData?.isCreatingInstitution !== true) {
    return formData;
  }
  const created = await StandardizedApi.post(INSTITUTION_LINK_API.INSTITUTIONS, {
    name: String(formData.institutionName || '').trim(),
    contactName: String(formData.institutionContactName || '').trim(),
    contactPhone: String(formData.institutionContactPhone || '').trim(),
    documentEmail: String(formData.institutionDocumentEmail || '').trim()
  });
  const entity = unwrapPartnerInstitution(created);
  if (entity == null || entity.id == null) {
    throw new Error('기관을 등록하지 못했습니다.');
  }
  return {
    ...formData,
    partnerInstitutionId: entity.id,
    isCreatingInstitution: false,
    institutionName: entity.name || formData.institutionName,
    institutionContactName: entity.contactName || formData.institutionContactName,
    institutionContactPhone: entity.contactPhone || formData.institutionContactPhone,
    institutionDocumentEmail: entity.documentEmail || formData.institutionDocumentEmail
  };
}

/**
 * @param {object} props
 * @param {string} props.type create|edit|view
 * @param {object} props.formData
 * @param {function} props.setFormData
 * @param {object} props.errors
 * @param {function} props.setErrors
 */
const ClientInstitutionSelectSection = ({
  type,
  formData,
  setFormData,
  errors,
  setErrors
}) => {
  const { t } = useTranslation(['admin']);
  const readOnly = type === 'view';
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const loadInstitutions = useCallback(async() => {
    setLoading(true);
    try {
      const raw = await StandardizedApi.get(INSTITUTION_LINK_API.INSTITUTIONS);
      setInstitutions(unwrapPartnerInstitutionList(raw));
    } catch {
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  const filtered = useMemo(() => {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) {
      return institutions;
    }
    return institutions.filter((item) => {
      const name = toDisplayString(item?.name, '').toLowerCase();
      const contact = toDisplayString(item?.contactName, '').toLowerCase();
      return name.includes(needle) || contact.includes(needle);
    });
  }, [institutions, query]);

  const options = useMemo(() => filtered.map((item) => ({
    value: String(item.id),
    label: toDisplayString(item.name, String(item.id))
  })), [filtered]);

  const selectedId = formData.partnerInstitutionId != null
    ? String(formData.partnerInstitutionId)
    : '';
  const creating = formData.isCreatingInstitution === true;
  const selected = institutions.find((item) => String(item.id) === selectedId);
  const summaryName = toDisplayString(selected?.name || formData.institutionName, '');
  const summaryContact = toDisplayString(selected?.contactName || formData.institutionContactName, '');

  const clearInstitutionErrors = () => {
    setErrors((prev) => ({
      ...prev,
      partnerInstitutionId: undefined,
      institutionName: undefined,
      institutionContactName: undefined,
      institutionContactPhone: undefined,
      institutionDocumentEmail: undefined
    }));
  };

  const handleSelect = (value) => {
    const picked = institutions.find((item) => String(item.id) === String(value));
    setFormData((prev) => ({
      ...prev,
      partnerInstitutionId: value ? Number(value) : '',
      isCreatingInstitution: false,
      institutionName: picked?.name || '',
      institutionContactName: picked?.contactName || '',
      institutionContactPhone: picked?.contactPhone || '',
      institutionDocumentEmail: picked?.documentEmail || ''
    }));
    clearInstitutionErrors();
  };

  const startCreate = () => {
    setFormData((prev) => ({
      ...prev,
      partnerInstitutionId: '',
      isCreatingInstitution: true,
      institutionName: '',
      institutionContactName: '',
      institutionContactPhone: '',
      institutionDocumentEmail: ''
    }));
    clearInstitutionErrors();
  };

  const handleCreateFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, partnerInstitutionId: undefined }));
  };

  return (
    <ContentSection
      title={t('admin:clientModal.engagement.institutionSection')}
      noCard
      className="mg-v2-client-modal__subsection"
    >
      {readOnly ? (
        <p className={CLIENT_INSTITUTION_SELECT_CSS.SUMMARY}>
          {summaryName}
          {summaryContact ? ` · ${summaryContact}` : ''}
        </p>
      ) : (
        <>
          {institutions.length > 0 ? (
            <div className={CLIENT_INSTITUTION_SELECT_CSS.TOOLBAR}>
              <div className={CLIENT_INSTITUTION_SELECT_CSS.SEARCH}>
                <FormInput
                  type="search"
                  name="institutionSearch"
                  label={t('admin:clientModal.engagement.searchPlaceholder')}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className={CLIENT_INSTITUTION_SELECT_CSS.SELECT}>
                <CustomSelect
                  options={options}
                  value={creating ? '' : selectedId}
                  loading={loading}
                  error={Boolean(errors.partnerInstitutionId)}
                  placeholder={t('admin:clientModal.engagement.selectPlaceholder')}
                  onChange={handleSelect}
                />
                {errors.partnerInstitutionId ? (
                  <span className="mg-v2-form-error" role="alert">{errors.partnerInstitutionId}</span>
                ) : null}
              </div>
              <MGButton
                type="button"
                variant="ghost"
                size="medium"
                className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: false })}
                onClick={startCreate}
              >
                {t('admin:clientModal.engagement.register')}
              </MGButton>
            </div>
          ) : (
            <EmptyState
              title={t('admin:clientModal.engagement.empty')}
              action={!creating ? (
                <MGButton
                  type="button"
                  variant="ghost"
                  size="medium"
                  className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: false })}
                  onClick={startCreate}
                >
                  {t('admin:clientModal.engagement.register')}
                </MGButton>
              ) : null}
            />
          )}
          {!creating && selectedId && summaryName ? (
            <p className={CLIENT_INSTITUTION_SELECT_CSS.SUMMARY}>
              {summaryName}
              {summaryContact ? ` · ${summaryContact}` : ''}
            </p>
          ) : null}
          {creating ? (
            <>
              <div className="mg-v2-form-row mg-v2-form-row--two mg-v2-client-modal__form-row-two">
                <FormInput
                  type="text"
                  name="institutionName"
                  label={t('admin:clientModal.engagement.institutionName')}
                  required
                  value={formData.institutionName || ''}
                  error={errors.institutionName}
                  onChange={handleCreateFieldChange}
                />
                <FormInput
                  type="text"
                  name="institutionContactName"
                  label={t('admin:clientModal.engagement.contactName')}
                  required
                  value={formData.institutionContactName || ''}
                  error={errors.institutionContactName}
                  onChange={handleCreateFieldChange}
                />
              </div>
              <div className="mg-v2-form-row mg-v2-form-row--two mg-v2-client-modal__form-row-two">
                <FormInput
                  type="tel"
                  name="institutionContactPhone"
                  label={t('admin:clientModal.engagement.contactPhone')}
                  required
                  value={formData.institutionContactPhone || ''}
                  error={errors.institutionContactPhone}
                  onChange={handleCreateFieldChange}
                />
                <div className="mg-v2-form-group">
                  <label htmlFor="client-institutionDocumentEmail" className="mg-v2-form-label">
                    {t('admin:clientModal.engagement.documentEmail')}
                    <span className="form-input-required">*</span>
                  </label>
                  <MgEmailFieldWithAutocomplete
                    id="client-institutionDocumentEmail"
                    name="institutionDocumentEmail"
                    value={formData.institutionDocumentEmail || ''}
                    onChange={handleCreateFieldChange}
                    placeholder={t('admin:clientModal.form.emailPlaceholder')}
                    required={false}
                    autocompleteMode="datalist"
                  />
                  {errors.institutionDocumentEmail ? (
                    <span className="mg-v2-form-error" role="alert">{errors.institutionDocumentEmail}</span>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </ContentSection>
  );
};

export default ClientInstitutionSelectSection;
