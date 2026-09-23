/**
 * 타기관 연계 어드민 페이지 — 기관 마스터 + 월결제·선납 등록.
 * 회기 등록(MappingCreationModal) 과 분리된 별 페이지.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../../dashboard-v2/content';
import { ListTableView } from '../../common';
import EmptyState from '../../common/EmptyState';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import FormInput from '../../common/FormInput';
import CustomSelect from '../../common/CustomSelect';
import UnifiedLoading from '../../common/UnifiedLoading';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import { toDisplayString } from '../../../utils/safeDisplay';
import { RoleUtils } from '../../../constants/roles';
import { useSession } from '../../../contexts/SessionContext';
import { runResourceLoad, softRefresh } from '../../../utils/softRefresh';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';
import { INSTITUTION_LINK_API } from '../../../constants/institutionLinkAdminApi';
import {
  INSTITUTION_LINK_CSS,
  INSTITUTION_LINK_LABELS,
  INSTITUTION_LINK_PAGE_TITLE_ID
} from '../../../constants/institutionLinkAdmin';
import '../../../styles/unified-design-tokens.css';
import '../AdminDashboard/AdminDashboardB0KlA.css';
import './InstitutionLinkAdminPage.css';

function unwrapList(raw, nestedKey) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && Array.isArray(raw[nestedKey])) {
    return raw[nestedKey];
  }
  if (raw && raw.data && Array.isArray(raw.data)) {
    return raw.data;
  }
  if (raw && raw.data && Array.isArray(raw.data[nestedKey])) {
    return raw.data[nestedKey];
  }
  return [];
}

function formatWon(value) {
  if (value == null || value === '') {
    return '-';
  }
  return `${Number(value).toLocaleString('ko-KR')}원`;
}

const emptyInstitutionForm = () => ({
  name: '',
  contactName: '',
  contactPhone: '',
  documentEmail: '',
  notes: ''
});

const emptyEnrollmentForm = () => ({
  clientId: '',
  institutionId: '',
  monthlyAmount: '',
  prepaidAmount: '',
  periodStart: '',
  notes: ''
});

const InstitutionLinkAdminPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);

  const [institutionModalOpen, setInstitutionModalOpen] = useState(false);
  const [editingInstitutionId, setEditingInstitutionId] = useState(null);
  const [institutionForm, setInstitutionForm] = useState(emptyInstitutionForm());
  const [institutionErrors, setInstitutionErrors] = useState({});
  const [institutionSaving, setInstitutionSaving] = useState(false);

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState(emptyEnrollmentForm());
  const [enrollErrors, setEnrollErrors] = useState({});
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [billingRunning, setBillingRunning] = useState(false);

  /**
   * @param {{ silent?: boolean }} [options] silent=true 이면 AdminCommonLayout loading 미사용
   */
  const loadAll = useCallback(async(options = {}) => {
    try {
      await runResourceLoad(options, setLoading, async() => {
        const [instRaw, contractRaw, clientRaw] = await Promise.all([
          StandardizedApi.get(INSTITUTION_LINK_API.INSTITUTIONS),
          StandardizedApi.get(INSTITUTION_LINK_API.CONTRACTS),
          StandardizedApi.get(INSTITUTION_LINK_API.CLIENTS)
        ]);
        setInstitutions(unwrapList(instRaw));
        setContracts(unwrapList(contractRaw));
        setClients(unwrapList(clientRaw, 'clients'));
      });
    } catch (error) {
      setInstitutions([]);
      setContracts([]);
      notificationManager.error(
        error?.message != null ? String(error.message) : INSTITUTION_LINK_LABELS.LOAD_FAIL
      );
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!allowed) {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
      return;
    }
    loadAll();
  }, [sessionLoading, isLoggedIn, user?.id, allowed, navigate, loadAll]);

  const clientOptions = useMemo(() => {
    return (Array.isArray(clients) ? clients : []).map((client) => ({
      value: String(client.id),
      label: toDisplayString(client.name, String(client.id))
    }));
  }, [clients]);

  const institutionOptions = useMemo(() => {
    return (Array.isArray(institutions) ? institutions : []).map((item) => ({
      value: String(item.id),
      label: toDisplayString(item.name, String(item.id))
    }));
  }, [institutions]);

  const institutionRows = useMemo(() => {
    return (Array.isArray(institutions) ? institutions : []).map((row, idx) => ({
      __rowKey: row.id != null ? `inst-${String(row.id)}` : `inst-idx-${idx}`,
      colName: toDisplayString(row.name, ''),
      colContact: toDisplayString(row.contactName, ''),
      colEmail: toDisplayString(row.documentEmail, ''),
      __raw: row
    }));
  }, [institutions]);

  const contractRows = useMemo(() => {
    return (Array.isArray(contracts) ? contracts : []).map((row, idx) => ({
      __rowKey: row.id != null ? `ct-${String(row.id)}` : `ct-idx-${idx}`,
      colClient: toDisplayString(row.clientName, String(row.clientId || '')),
      colInstitution: toDisplayString(row.monthlyDocument?.institutionName, ''),
      colMonthly: formatWon(row.monthlyAmount),
      colPrepaid: formatWon(row.prepaidAmount),
      colDocument: toDisplayString(row.monthlyDocument?.documentEmail, '')
    }));
  }, [contracts]);

  const openCreateInstitution = () => {
    setEditingInstitutionId(null);
    setInstitutionForm(emptyInstitutionForm());
    setInstitutionErrors({});
    setInstitutionModalOpen(true);
  };

  const openEditInstitution = (row) => {
    const raw = row?.__raw ?? row;
    if (raw?.id == null) {
      return;
    }
    setEditingInstitutionId(raw.id);
    setInstitutionForm({
      name: toDisplayString(raw.name, ''),
      contactName: toDisplayString(raw.contactName, ''),
      contactPhone: toDisplayString(raw.contactPhone, ''),
      documentEmail: toDisplayString(raw.documentEmail, ''),
      notes: toDisplayString(raw.notes, '')
    });
    setInstitutionErrors({});
    setInstitutionModalOpen(true);
  };

  const validateInstitution = () => {
    const next = {};
    if (!institutionForm.name.trim()) {
      next.name = INSTITUTION_LINK_LABELS.REQUIRED;
    }
    if (!institutionForm.contactName.trim()) {
      next.contactName = INSTITUTION_LINK_LABELS.REQUIRED;
    }
    if (!institutionForm.documentEmail.trim()) {
      next.documentEmail = INSTITUTION_LINK_LABELS.REQUIRED;
    }
    setInstitutionErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveInstitution = async() => {
    if (!validateInstitution() || institutionSaving) {
      return;
    }
    setInstitutionSaving(true);
    try {
      const body = {
        name: institutionForm.name.trim(),
        contactName: institutionForm.contactName.trim(),
        contactPhone: institutionForm.contactPhone.trim(),
        documentEmail: institutionForm.documentEmail.trim(),
        notes: institutionForm.notes.trim()
      };
      if (editingInstitutionId != null) {
        await StandardizedApi.put(INSTITUTION_LINK_API.INSTITUTION(editingInstitutionId), body);
      } else {
        await StandardizedApi.post(INSTITUTION_LINK_API.INSTITUTIONS, body);
      }
      notificationManager.success(INSTITUTION_LINK_LABELS.SAVE_OK);
      setInstitutionModalOpen(false);
      await softRefresh(loadAll);
    } catch (error) {
      notificationManager.error(
        error?.message != null ? String(error.message) : INSTITUTION_LINK_LABELS.SAVE_FAIL
      );
    } finally {
      setInstitutionSaving(false);
    }
  };

  const validateEnrollment = () => {
    const next = {};
    if (!enrollForm.clientId) {
      next.clientId = INSTITUTION_LINK_LABELS.REQUIRED;
    }
    if (!enrollForm.institutionId) {
      next.institutionId = INSTITUTION_LINK_LABELS.REQUIRED;
    }
    if (enrollForm.monthlyAmount === '' || Number(enrollForm.monthlyAmount) < 0) {
      next.monthlyAmount = INSTITUTION_LINK_LABELS.REQUIRED;
    }
    if (enrollForm.prepaidAmount === '' || Number(enrollForm.prepaidAmount) < 0) {
      next.prepaidAmount = INSTITUTION_LINK_LABELS.REQUIRED;
    }
    setEnrollErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveEnrollment = async() => {
    if (!validateEnrollment() || enrollSaving) {
      return;
    }
    setEnrollSaving(true);
    try {
      await StandardizedApi.post(INSTITUTION_LINK_API.CONTRACTS, {
        clientId: Number(enrollForm.clientId),
        institutionId: Number(enrollForm.institutionId),
        monthlyAmount: Number(enrollForm.monthlyAmount),
        prepaidAmount: Number(enrollForm.prepaidAmount),
        periodStart: enrollForm.periodStart || null,
        notes: enrollForm.notes.trim() || null
      });
      notificationManager.success(INSTITUTION_LINK_LABELS.SAVE_OK);
      setEnrollModalOpen(false);
      setEnrollForm(emptyEnrollmentForm());
      await softRefresh(loadAll);
    } catch (error) {
      notificationManager.error(
        error?.message != null ? String(error.message) : INSTITUTION_LINK_LABELS.SAVE_FAIL
      );
    } finally {
      setEnrollSaving(false);
    }
  };

  const runMonthlyBilling = async() => {
    if (billingRunning) {
      return;
    }
    setBillingRunning(true);
    try {
      const raw = await StandardizedApi.post(INSTITUTION_LINK_API.MONTHLY_BILLING_RUN);
      const summary = raw && raw.data ? raw.data : raw;
      const charged = summary && summary.chargedCount != null ? Number(summary.chargedCount) : 0;
      const skipped = summary && summary.skippedCount != null ? Number(summary.skippedCount) : 0;
      const yearMonth = summary && summary.yearMonth != null
        ? String(summary.yearMonth)
        : '';
      notificationManager.success(
        `${INSTITUTION_LINK_LABELS.RUN_MONTHLY_BILLING_OK} (${yearMonth} 청구 ${charged}건 / 스킵 ${skipped}건)`
      );
    } catch (error) {
      notificationManager.error(
        error?.message != null
          ? String(error.message)
          : INSTITUTION_LINK_LABELS.RUN_MONTHLY_BILLING_FAIL
      );
    } finally {
      setBillingRunning(false);
    }
  };

  const institutionColumns = [
    { key: 'colName', label: INSTITUTION_LINK_LABELS.COL_NAME },
    { key: 'colContact', label: INSTITUTION_LINK_LABELS.COL_CONTACT },
    { key: 'colEmail', label: INSTITUTION_LINK_LABELS.COL_EMAIL },
    { key: 'colActions', label: INSTITUTION_LINK_LABELS.EDIT_INSTITUTION }
  ];

  const contractColumns = [
    { key: 'colClient', label: INSTITUTION_LINK_LABELS.COL_CLIENT },
    { key: 'colInstitution', label: INSTITUTION_LINK_LABELS.INSTITUTION },
    { key: 'colMonthly', label: INSTITUTION_LINK_LABELS.COL_MONTHLY },
    { key: 'colPrepaid', label: INSTITUTION_LINK_LABELS.COL_PREPAID },
    { key: 'colDocument', label: INSTITUTION_LINK_LABELS.COL_DOCUMENT }
  ];

  const renderInstitutionCell = (columnKey, item) => {
    if (columnKey !== 'colActions') {
      return item[columnKey] || '-';
    }
    return (
      <MGButton
        type="button"
        variant="outline"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm' })}
        onClick={(event) => {
          event.stopPropagation();
          openEditInstitution(item);
        }}
      >
        {INSTITUTION_LINK_LABELS.EDIT_INSTITUTION}
      </MGButton>
    );
  };

  return (
    <AdminCommonLayout
      title={INSTITUTION_LINK_LABELS.PAGE_TITLE}
      loading={loading && institutions.length === 0 && contracts.length === 0}
    >
      <div className={INSTITUTION_LINK_CSS.PAGE} data-testid="institution-link-admin-page">
        <div className={INSTITUTION_LINK_CSS.CONTAINER}>
          <ContentArea ariaLabel={INSTITUTION_LINK_LABELS.PAGE_TITLE}>
            <ContentHeader
              titleId={INSTITUTION_LINK_PAGE_TITLE_ID}
              title={INSTITUTION_LINK_LABELS.PAGE_TITLE}
              subtitle={INSTITUTION_LINK_LABELS.PAGE_SUBTITLE}
            />
            <main aria-labelledby={INSTITUTION_LINK_PAGE_TITLE_ID} className={INSTITUTION_LINK_CSS.SECTIONS}>
              <ContentSection
                title={INSTITUTION_LINK_LABELS.INSTITUTION_SECTION}
                subtitle={INSTITUTION_LINK_LABELS.INSTITUTION_SECTION_SUB}
                actions={(
                  <MGButton
                    type="button"
                    variant="primary"
                    className={buildErpMgButtonClassName({ variant: 'primary' })}
                    onClick={openCreateInstitution}
                  >
                    {INSTITUTION_LINK_LABELS.ADD_INSTITUTION}
                  </MGButton>
                )}
              >
                {loading ? (
                  <UnifiedLoading type="inline" size="medium" />
                ) : institutionRows.length === 0 ? (
                  <EmptyState title={INSTITUTION_LINK_LABELS.EMPTY_INSTITUTION} />
                ) : (
                  <ListTableView
                    columns={institutionColumns}
                    data={institutionRows}
                    renderCell={renderInstitutionCell}
                    rowKeyField="__rowKey"
                  />
                )}
              </ContentSection>

              <ContentSection
                title={INSTITUTION_LINK_LABELS.ENROLL_SECTION}
                subtitle={INSTITUTION_LINK_LABELS.ENROLL_SECTION_SUB}
                actions={(
                  <div className={INSTITUTION_LINK_CSS.SECTION_ACTIONS}>
                    <MGButton
                      type="button"
                      variant="outline"
                      className={buildErpMgButtonClassName({ variant: 'outline' })}
                      loading={billingRunning}
                      disabled={billingRunning}
                      title={INSTITUTION_LINK_LABELS.RUN_MONTHLY_BILLING_HINT}
                      onClick={runMonthlyBilling}
                    >
                      {INSTITUTION_LINK_LABELS.RUN_MONTHLY_BILLING}
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="primary"
                      className={buildErpMgButtonClassName({ variant: 'primary' })}
                      onClick={() => {
                        setEnrollForm(emptyEnrollmentForm());
                        setEnrollErrors({});
                        setEnrollModalOpen(true);
                      }}
                    >
                      {INSTITUTION_LINK_LABELS.ADD_ENROLLMENT}
                    </MGButton>
                  </div>
                )}
              >
                {loading ? (
                  <UnifiedLoading type="inline" size="medium" />
                ) : contractRows.length === 0 ? (
                  <EmptyState title={INSTITUTION_LINK_LABELS.EMPTY_ENROLLMENT} />
                ) : (
                  <ListTableView
                    columns={contractColumns}
                    data={contractRows}
                    rowKeyField="__rowKey"
                  />
                )}
              </ContentSection>
            </main>
          </ContentArea>
        </div>
      </div>

      <UnifiedModal
        isOpen={institutionModalOpen}
        onClose={() => setInstitutionModalOpen(false)}
        title={editingInstitutionId != null
          ? INSTITUTION_LINK_LABELS.EDIT_INSTITUTION
          : INSTITUTION_LINK_LABELS.ADD_INSTITUTION}
        size="medium"
        variant="form"
        className="mg-v2-ad-b0kla"
        loading={institutionSaving}
        actions={(
          <div className={INSTITUTION_LINK_CSS.ACTIONS}>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({ variant: 'outline' })}
              onClick={() => setInstitutionModalOpen(false)}
            >
              {INSTITUTION_LINK_LABELS.CANCEL}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary' })}
              loading={institutionSaving}
              onClick={saveInstitution}
            >
              {INSTITUTION_LINK_LABELS.SAVE}
            </MGButton>
          </div>
        )}
      >
        <form className={INSTITUTION_LINK_CSS.FORM} onSubmit={(event) => event.preventDefault()}>
          <FormInput
            name="institutionName"
            label={INSTITUTION_LINK_LABELS.NAME}
            value={institutionForm.name}
            required
            error={institutionErrors.name}
            onChange={(event) => setInstitutionForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <FormInput
            name="contactName"
            label={INSTITUTION_LINK_LABELS.CONTACT_NAME}
            value={institutionForm.contactName}
            required
            error={institutionErrors.contactName}
            onChange={(event) => setInstitutionForm((prev) => ({ ...prev, contactName: event.target.value }))}
          />
          <FormInput
            name="contactPhone"
            label={INSTITUTION_LINK_LABELS.CONTACT_PHONE}
            value={institutionForm.contactPhone}
            onChange={(event) => setInstitutionForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
          />
          <FormInput
            type="email"
            name="documentEmail"
            label={INSTITUTION_LINK_LABELS.DOCUMENT_EMAIL}
            value={institutionForm.documentEmail}
            required
            error={institutionErrors.documentEmail}
            onChange={(event) => setInstitutionForm((prev) => ({ ...prev, documentEmail: event.target.value }))}
          />
          <FormInput
            name="institutionNotes"
            label={INSTITUTION_LINK_LABELS.NOTES}
            value={institutionForm.notes}
            onChange={(event) => setInstitutionForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </form>
      </UnifiedModal>

      <UnifiedModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title={INSTITUTION_LINK_LABELS.ADD_ENROLLMENT}
        size="medium"
        variant="form"
        className="mg-v2-ad-b0kla"
        loading={enrollSaving}
        actions={(
          <div className={INSTITUTION_LINK_CSS.ACTIONS}>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({ variant: 'outline' })}
              onClick={() => setEnrollModalOpen(false)}
            >
              {INSTITUTION_LINK_LABELS.CANCEL}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary' })}
              loading={enrollSaving}
              onClick={saveEnrollment}
            >
              {INSTITUTION_LINK_LABELS.SAVE}
            </MGButton>
          </div>
        )}
      >
        <form className={INSTITUTION_LINK_CSS.FORM} onSubmit={(event) => event.preventDefault()}>
          <div className={INSTITUTION_LINK_CSS.FORM_FIELD}>
            <label className="form-input-label" htmlFor="institution-link-client">
              {INSTITUTION_LINK_LABELS.CLIENT}
              <span className={INSTITUTION_LINK_CSS.REQUIRED}>*</span>
            </label>
            <CustomSelect
              options={clientOptions}
              value={enrollForm.clientId}
              placeholder={INSTITUTION_LINK_LABELS.SELECT_CLIENT}
              error={Boolean(enrollErrors.clientId)}
              onChange={(value) => setEnrollForm((prev) => ({ ...prev, clientId: value }))}
            />
            {enrollErrors.clientId ? (
              <p className="form-input-error">{enrollErrors.clientId}</p>
            ) : null}
          </div>
          <div className={INSTITUTION_LINK_CSS.FORM_FIELD}>
            <label className="form-input-label" htmlFor="institution-link-institution">
              {INSTITUTION_LINK_LABELS.INSTITUTION}
              <span className={INSTITUTION_LINK_CSS.REQUIRED}>*</span>
            </label>
            <CustomSelect
              options={institutionOptions}
              value={enrollForm.institutionId}
              placeholder={INSTITUTION_LINK_LABELS.SELECT_INSTITUTION}
              error={Boolean(enrollErrors.institutionId)}
              onChange={(value) => setEnrollForm((prev) => ({ ...prev, institutionId: value }))}
            />
            {enrollErrors.institutionId ? (
              <p className="form-input-error">{enrollErrors.institutionId}</p>
            ) : null}
          </div>
          <FormInput
            type="number"
            name="monthlyAmount"
            label={INSTITUTION_LINK_LABELS.MONTHLY_AMOUNT}
            value={enrollForm.monthlyAmount}
            required
            min="0"
            error={enrollErrors.monthlyAmount}
            onChange={(event) => setEnrollForm((prev) => ({ ...prev, monthlyAmount: event.target.value }))}
          />
          <FormInput
            type="number"
            name="prepaidAmount"
            label={INSTITUTION_LINK_LABELS.PREPAID_AMOUNT}
            value={enrollForm.prepaidAmount}
            required
            min="0"
            error={enrollErrors.prepaidAmount}
            onChange={(event) => setEnrollForm((prev) => ({ ...prev, prepaidAmount: event.target.value }))}
          />
          <FormInput
            type="date"
            name="periodStart"
            label={INSTITUTION_LINK_LABELS.PERIOD_START}
            value={enrollForm.periodStart}
            onChange={(event) => setEnrollForm((prev) => ({ ...prev, periodStart: event.target.value }))}
          />
          <FormInput
            name="enrollNotes"
            label={INSTITUTION_LINK_LABELS.NOTES}
            value={enrollForm.notes}
            onChange={(event) => setEnrollForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </form>
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default InstitutionLinkAdminPage;
