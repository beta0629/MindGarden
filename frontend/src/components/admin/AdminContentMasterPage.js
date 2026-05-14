/**
 * 심리교육·힐링 콘텐츠 마스터 — BW-3 관리자 API 연동(목록·생성·수정·노출 PATCH)
 * @author CoreSolution
 * @since 2026-05-14
 */

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import BadgeSelect from '../common/BadgeSelect';
import { ListTableView } from '../common';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import StandardizedApi from '../../utils/standardizedApi';
import {
  ADMIN_WEB_SCAFFOLD_API,
  ADMIN_WEB_SCAFFOLD_COPY,
  buildAdminContentVisibilityPatchBody,
  buildHealingCatalogItemPath,
  buildHealingCatalogVisibilityPath,
  buildPsychoEducationContentItemPath,
  buildPsychoEducationContentVisibilityPath,
  normalizeApiListPayload,
  pickContentMasterRowId,
  pickContentMasterRowVisibility
} from '../../constants/adminWebScaffold';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const TAB_PSYCHO = 'PSYCHO';
const TAB_HEALING = 'HEALING';

const TAB_OPTIONS = [
  { value: TAB_PSYCHO, label: '심리교육' },
  { value: TAB_HEALING, label: '힐링 콘텐츠' }
];

const PAGE_TITLE_ID = 'admin-content-master-title';
const FORM_TEXTAREA_ROWS = 6;
const TITLE_INPUT_MAX_LEN = 200;
const CATEGORY_INPUT_MAX_LEN = 64;
const URL_INPUT_MAX_LEN = 2000;
const DEFAULT_READ_MINUTES = 5;

const emptyPsychoForm = () => ({
  title: '',
  summary: '',
  body: '',
  category: '',
  readMinutes: String(DEFAULT_READ_MINUTES)
});

const emptyHealingForm = () => ({
  title: '',
  description: '',
  category: '',
  type: 'ARTICLE',
  durationMinutes: '',
  thumbnailUrl: '',
  contentUrl: ''
});

function mapContentRows(list, prefix) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((row, idx) => {
    if (!row || typeof row !== 'object') {
      return {
        __rowKey: `${prefix}-${idx}`,
        colTitle: '',
        colSub: '',
        colMeta: ''
      };
    }
    const title =
      row.title ?? row.name ?? row.koreanName ?? row.codeLabel ?? row.code ?? row.id ?? '';
    const sub =
      row.description ?? row.summary ?? row.content ?? row.remark ?? '';
    const metaParts = [];
    if (row.id != null) metaParts.push(`id:${String(row.id)}`);
    const vis = pickContentMasterRowVisibility(row);
    metaParts.push(`노출:${vis ? 'Y' : 'N'}`);
    if (row.code != null && String(row.code) !== String(title)) {
      metaParts.push(String(row.code));
    }
    return {
      __rowKey: row.id != null ? `${prefix}-${String(row.id)}` : `${prefix}-${idx}`,
      colTitle: title != null ? String(title) : '',
      colSub: sub != null ? String(sub) : '',
      colMeta: metaParts.join(' · '),
      __raw: row
    };
  });
}

function mapPsychoRowToForm(row) {
  if (!row || typeof row !== 'object') {
    return emptyPsychoForm();
  }
  return {
    title: toDisplayString(row.title, ''),
    summary: toDisplayString(row.summary ?? row.subtitle, ''),
    body: toDisplayString(row.body ?? row.content ?? row.text, ''),
    category: toDisplayString(row.category, ''),
    readMinutes: String(row.readMinutes ?? row.estimatedMinutes ?? DEFAULT_READ_MINUTES)
  };
}

function healingTypeToString(typeRaw) {
  if (typeof typeRaw === 'string') {
    return typeRaw;
  }
  if (typeRaw && typeof typeRaw === 'object' && typeRaw.name != null) {
    return String(typeRaw.name);
  }
  return toDisplayString(typeRaw, 'ARTICLE');
}

function mapHealingRowToForm(row) {
  if (!row || typeof row !== 'object') {
    return emptyHealingForm();
  }
  const typeStr = healingTypeToString(row.type);
  return {
    title: toDisplayString(row.title, ''),
    description: toDisplayString(row.description, ''),
    category: toDisplayString(row.category, ''),
    type: typeStr || 'ARTICLE',
    durationMinutes: row.durationMinutes != null ? String(row.durationMinutes) : '',
    thumbnailUrl: toDisplayString(row.thumbnailUrl, ''),
    contentUrl: toDisplayString(row.contentUrl, '')
  };
}

const AdminContentMasterPage = () => {
  const baseId = useId();
  const [tab, setTab] = useState(TAB_PSYCHO);
  const [psychoRows, setPsychoRows] = useState([]);
  const [healingRows, setHealingRows] = useState([]);
  const [loadingPsycho, setLoadingPsycho] = useState(true);
  const [loadingHealing, setLoadingHealing] = useState(true);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [psychoForm, setPsychoForm] = useState(emptyPsychoForm);
  const [healingForm, setHealingForm] = useState(emptyHealingForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadPsycho = useCallback(async() => {
    setLoadingPsycho(true);
    try {
      const raw = await StandardizedApi.get(ADMIN_WEB_SCAFFOLD_API.ADMIN_CONTENT_PSYCHO_EDUCATION);
      setPsychoRows(normalizeApiListPayload(raw));
    } catch (e) {
      setPsychoRows([]);
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ERROR_LOAD
      );
    } finally {
      setLoadingPsycho(false);
    }
  }, []);

  const loadHealing = useCallback(async() => {
    setLoadingHealing(true);
    try {
      const raw = await StandardizedApi.get(ADMIN_WEB_SCAFFOLD_API.ADMIN_CONTENT_HEALING_CATALOG);
      setHealingRows(normalizeApiListPayload(raw));
    } catch (e) {
      setHealingRows([]);
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ERROR_LOAD
      );
    } finally {
      setLoadingHealing(false);
    }
  }, []);

  useEffect(() => {
    loadPsycho();
    loadHealing();
  }, [loadPsycho, loadHealing]);

  const reloadTab = useCallback(async() => {
    if (tab === TAB_PSYCHO) {
      await loadPsycho();
    } else {
      await loadHealing();
    }
  }, [tab, loadPsycho, loadHealing]);

  const activeLoading = tab === TAB_PSYCHO ? loadingPsycho : loadingHealing;
  const activeList = tab === TAB_PSYCHO ? psychoRows : healingRows;
  const activePrefix = tab === TAB_PSYCHO ? 'psy' : 'heal';

  const tableData = useMemo(() => mapContentRows(activeList, activePrefix), [activeList, activePrefix]);

  const columns = useMemo(
    () => [
      { key: 'colTitle', label: ADMIN_WEB_SCAFFOLD_COPY.CONTENT_TABLE_TITLE_CODE },
      { key: 'colSub', label: ADMIN_WEB_SCAFFOLD_COPY.CONTENT_TABLE_DESC },
      { key: 'colMeta', label: ADMIN_WEB_SCAFFOLD_COPY.CONTENT_TABLE_META },
      { key: 'colVisibility', label: ADMIN_WEB_SCAFFOLD_COPY.CONTENT_TABLE_VISIBILITY },
      { key: 'colActions', label: ADMIN_WEB_SCAFFOLD_COPY.CONTENT_TABLE_ACTIONS }
    ],
    []
  );

  const closeContentModal = useCallback(() => {
    setContentModalOpen(false);
    setFormMode('create');
    setEditingId(null);
    setPsychoForm(emptyPsychoForm());
    setHealingForm(emptyHealingForm());
  }, []);

  const openCreateModal = useCallback(() => {
    setFormMode('create');
    setEditingId(null);
    setPsychoForm(emptyPsychoForm());
    setHealingForm(emptyHealingForm());
    setContentModalOpen(true);
  }, []);

  const openEditModal = useCallback((rawRow) => {
    const id = pickContentMasterRowId(rawRow);
    if (id == null) {
      return;
    }
    setFormMode('edit');
    setEditingId(id);
    if (tab === TAB_PSYCHO) {
      setPsychoForm(mapPsychoRowToForm(rawRow));
    } else {
      setHealingForm(mapHealingRowToForm(rawRow));
    }
    setContentModalOpen(true);
  }, [tab]);

  const handleToggleVisibility = useCallback(async(rawRow) => {
    const id = pickContentMasterRowId(rawRow);
    if (id == null) {
      return;
    }
    const path = tab === TAB_PSYCHO
      ? buildPsychoEducationContentVisibilityPath(id)
      : buildHealingCatalogVisibilityPath(id);
    const current = pickContentMasterRowVisibility(rawRow);
    const next = !current;
    setTogglingId(id);
    try {
      await StandardizedApi.patch(path, buildAdminContentVisibilityPatchBody(next));
      notificationManager.success(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_SUCCESS_VISIBILITY);
      await reloadTab();
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ERROR_VISIBILITY
      );
    } finally {
      setTogglingId(null);
    }
  }, [tab, reloadTab]);

  const handleSaveContent = useCallback(async() => {
    if (tab === TAB_PSYCHO) {
      const title = toDisplayString(psychoForm.title, '').trim();
      if (!title) {
        notificationManager.show(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_VALIDATION_TITLE, 'warning');
        return;
      }
      const readParsed = Number.parseInt(String(psychoForm.readMinutes).trim(), 10);
      const payload = {
        title,
        summary: toDisplayString(psychoForm.summary, '').trim() || null,
        body: toDisplayString(psychoForm.body, '').trim() || null,
        category: toDisplayString(psychoForm.category, '').trim() || null,
        readMinutes: Number.isFinite(readParsed) ? readParsed : DEFAULT_READ_MINUTES
      };
      setSaving(true);
      try {
        if (formMode === 'create') {
          await StandardizedApi.post(ADMIN_WEB_SCAFFOLD_API.ADMIN_CONTENT_PSYCHO_EDUCATION, payload);
          notificationManager.success(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_SUCCESS_CREATED);
        } else {
          await StandardizedApi.put(buildPsychoEducationContentItemPath(editingId), payload);
          notificationManager.success(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_SUCCESS_UPDATED);
        }
        closeContentModal();
        await loadPsycho();
      } catch (e) {
        notificationManager.error(
          e?.message != null ? String(e.message) : ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ERROR_SAVE
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    const titleH = toDisplayString(healingForm.title, '').trim();
    if (!titleH) {
      notificationManager.show(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_VALIDATION_TITLE, 'warning');
      return;
    }
    const durRaw = String(healingForm.durationMinutes ?? '').trim();
    const durParsed = durRaw === '' ? null : Number.parseInt(durRaw, 10);
    const payloadH = {
      title: titleH,
      description: toDisplayString(healingForm.description, '').trim() || null,
      category: toDisplayString(healingForm.category, '').trim() || null,
      type: toDisplayString(healingForm.type, 'ARTICLE').trim() || 'ARTICLE',
      durationMinutes: durParsed != null && Number.isFinite(durParsed) ? durParsed : null,
      thumbnailUrl: toDisplayString(healingForm.thumbnailUrl, '').trim() || null,
      contentUrl: toDisplayString(healingForm.contentUrl, '').trim() || null
    };
    setSaving(true);
    try {
      if (formMode === 'create') {
        await StandardizedApi.post(ADMIN_WEB_SCAFFOLD_API.ADMIN_CONTENT_HEALING_CATALOG, payloadH);
        notificationManager.success(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_SUCCESS_CREATED);
      } else {
        await StandardizedApi.put(buildHealingCatalogItemPath(editingId), payloadH);
        notificationManager.success(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_SUCCESS_UPDATED);
      }
      closeContentModal();
      await loadHealing();
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ERROR_SAVE
      );
    } finally {
      setSaving(false);
    }
  }, [
    tab,
    psychoForm,
    healingForm,
    formMode,
    editingId,
    closeContentModal,
    loadPsycho,
    loadHealing
  ]);

  const renderCell = useCallback((columnKey, item) => {
    const raw = item.__raw;
    if (columnKey === 'colTitle') {
      return <SafeText>{item.colTitle}</SafeText>;
    }
    if (columnKey === 'colSub') {
      return <SafeText>{item.colSub}</SafeText>;
    }
    if (columnKey === 'colMeta') {
      return <SafeText>{item.colMeta}</SafeText>;
    }
    if (columnKey === 'colVisibility') {
      if (!raw || typeof raw !== 'object') {
        return <SafeText>—</SafeText>;
      }
      const id = pickContentMasterRowId(raw);
      const vis = pickContentMasterRowVisibility(raw);
      const busy = id != null && togglingId === id;
      const label = vis
        ? ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ACTION_HIDE
        : ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ACTION_SHOW;
      return (
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm' })}
          loading={busy}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          disabled={busy || id == null}
          onClick={() => handleToggleVisibility(raw)}
        >
          {label}
        </MGButton>
      );
    }
    if (columnKey === 'colActions') {
      if (!raw || typeof raw !== 'object') {
        return <SafeText>—</SafeText>;
      }
      const id = pickContentMasterRowId(raw);
      return (
        <MGButton
          type="button"
          variant="secondary"
          size="small"
          className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm' })}
          disabled={id == null}
          onClick={() => openEditModal(raw)}
        >
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ACTION_EDIT}
        </MGButton>
      );
    }
    return <SafeText>—</SafeText>;
  }, [handleToggleVisibility, openEditModal, togglingId]);

  const addButton = (
    <div className="mg-v2-ad-b0kla__header-actions">
      <MGButton
        type="button"
        className={buildErpMgButtonClassName({
          variant: 'outline',
          size: 'md',
          className: 'mg-v2-mapping-header-btn'
        })}
        variant="outline"
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        disabled={activeLoading}
        onClick={() => reloadTab()}
      >
        {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_RELOAD}
      </MGButton>
      <MGButton
        type="button"
        className={buildErpMgButtonClassName({
          variant: 'primary',
          size: 'md',
          className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary'
        })}
        variant="primary"
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={openCreateModal}
      >
        {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_MASTER_ADD_BUTTON}
      </MGButton>
    </div>
  );

  const modalTitle = formMode === 'create'
    ? ADMIN_WEB_SCAFFOLD_COPY.MODAL_ADD_CONTENT_TITLE
    : ADMIN_WEB_SCAFFOLD_COPY.MODAL_EDIT_CONTENT_TITLE;

  const psychoFields = (
    <>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-psy-title`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_TITLE}
        </label>
        <input
          id={`${baseId}-psy-title`}
          className="mg-v2-form-input"
          maxLength={TITLE_INPUT_MAX_LEN}
          value={psychoForm.title}
          onChange={(ev) => setPsychoForm((p) => ({ ...p, title: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-psy-summary`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_SUMMARY}
        </label>
        <textarea
          id={`${baseId}-psy-summary`}
          className="mg-v2-form-input"
          rows={FORM_TEXTAREA_ROWS}
          value={psychoForm.summary}
          onChange={(ev) => setPsychoForm((p) => ({ ...p, summary: ev.target.value }))}
          disabled={saving}
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-psy-body`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_BODY}
        </label>
        <textarea
          id={`${baseId}-psy-body`}
          className="mg-v2-form-input"
          rows={FORM_TEXTAREA_ROWS}
          value={psychoForm.body}
          onChange={(ev) => setPsychoForm((p) => ({ ...p, body: ev.target.value }))}
          disabled={saving}
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-psy-cat`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_CATEGORY}
        </label>
        <input
          id={`${baseId}-psy-cat`}
          className="mg-v2-form-input"
          maxLength={CATEGORY_INPUT_MAX_LEN}
          value={psychoForm.category}
          onChange={(ev) => setPsychoForm((p) => ({ ...p, category: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-psy-read`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_READ_MINUTES}
        </label>
        <input
          id={`${baseId}-psy-read`}
          type="number"
          min={0}
          className="mg-v2-form-input"
          value={psychoForm.readMinutes}
          onChange={(ev) => setPsychoForm((p) => ({ ...p, readMinutes: ev.target.value }))}
          disabled={saving}
        />
      </div>
    </>
  );

  const healingFields = (
    <>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-heal-title`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_TITLE}
        </label>
        <input
          id={`${baseId}-heal-title`}
          className="mg-v2-form-input"
          maxLength={TITLE_INPUT_MAX_LEN}
          value={healingForm.title}
          onChange={(ev) => setHealingForm((p) => ({ ...p, title: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-heal-desc`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_DESCRIPTION}
        </label>
        <textarea
          id={`${baseId}-heal-desc`}
          className="mg-v2-form-input"
          rows={FORM_TEXTAREA_ROWS}
          value={healingForm.description}
          onChange={(ev) => setHealingForm((p) => ({ ...p, description: ev.target.value }))}
          disabled={saving}
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-heal-cat`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_CATEGORY}
        </label>
        <input
          id={`${baseId}-heal-cat`}
          className="mg-v2-form-input"
          maxLength={CATEGORY_INPUT_MAX_LEN}
          value={healingForm.category}
          onChange={(ev) => setHealingForm((p) => ({ ...p, category: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-heal-type`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_TYPE}
        </label>
        <input
          id={`${baseId}-heal-type`}
          className="mg-v2-form-input"
          maxLength={CATEGORY_INPUT_MAX_LEN}
          value={healingForm.type}
          onChange={(ev) => setHealingForm((p) => ({ ...p, type: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-heal-dur`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_DURATION}
        </label>
        <input
          id={`${baseId}-heal-dur`}
          type="number"
          min={0}
          className="mg-v2-form-input"
          value={healingForm.durationMinutes}
          onChange={(ev) => setHealingForm((p) => ({ ...p, durationMinutes: ev.target.value }))}
          disabled={saving}
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-heal-thumb`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_THUMB}
        </label>
        <input
          id={`${baseId}-heal-thumb`}
          className="mg-v2-form-input"
          maxLength={URL_INPUT_MAX_LEN}
          value={healingForm.thumbnailUrl}
          onChange={(ev) => setHealingForm((p) => ({ ...p, thumbnailUrl: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-heal-curl`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_CONTENT_URL}
        </label>
        <input
          id={`${baseId}-heal-curl`}
          className="mg-v2-form-input"
          maxLength={URL_INPUT_MAX_LEN}
          value={healingForm.contentUrl}
          onChange={(ev) => setHealingForm((p) => ({ ...p, contentUrl: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
        />
      </div>
    </>
  );

  return (
    <AdminCommonLayout title={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_MASTER_TITLE} loading={activeLoading}>
      <div className="mg-v2-ad-b0kla" data-testid="admin-content-master-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_MASTER_TITLE}>
            <ContentHeader
              title={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_MASTER_TITLE}
              subtitle={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_MASTER_SUBTITLE}
              titleId={PAGE_TITLE_ID}
              actions={addButton}
            />
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_CONTENT_TYPE} noCard>
              <BadgeSelect aria-label="콘텐츠 유형 탭" options={TAB_OPTIONS} value={tab} onChange={setTab} />
            </ContentSection>
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_MASTER_LIST}>
              {!activeLoading && tableData.length === 0 ? (
                <EmptyState
                  title={ADMIN_WEB_SCAFFOLD_COPY.EMPTY_CONTENT_TITLE}
                  description={ADMIN_WEB_SCAFFOLD_COPY.EMPTY_CONTENT_DESC}
                />
              ) : (
                <ListTableView
                  columns={columns}
                  data={tableData}
                  rowKeyField="__rowKey"
                  renderCell={renderCell}
                />
              )}
            </ContentSection>
          </ContentArea>
        </div>
      </div>

      <UnifiedModal
        isOpen={contentModalOpen}
        onClose={closeContentModal}
        title={modalTitle}
        size="medium"
        variant="form"
        backdropClick={!saving}
        showCloseButton={!saving}
        actions={(
          <>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md' })}
              variant="outline"
              disabled={saving}
              onClick={closeContentModal}
            >
              {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_CANCEL}
            </MGButton>
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md' })}
              variant="primary"
              loading={saving}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => handleSaveContent()}
            >
              {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_SAVE}
            </MGButton>
          </>
        )}
      >
        <SafeText tag="p" className="mg-modal__hint">{ADMIN_WEB_SCAFFOLD_COPY.MODAL_ADD_CONTENT_BODY}</SafeText>
        {tab === TAB_PSYCHO ? psychoFields : healingFields}
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default AdminContentMasterPage;
