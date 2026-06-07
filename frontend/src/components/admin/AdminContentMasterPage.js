/**
 * 심리교육·힐링 콘텐츠 마스터 — BW-3 관리자 API 연동(목록·생성·수정·노출 PATCH).
 *
 * UX REVAMP (2026-06-03, 사용자 컨펌 main-direct):
 * - 입력 최소화: code/slug/sortOrder/readMinutes 자동 채움 (contentMasterHelpers)
 * - mediaType BadgeSelect (4종) + 자유 텍스트 입력 폐지
 * - 인라인 빠른 추가: 모달 없이 1줄 등록
 * - 모달 압축: 필수 / 선택 / 고급(접기) 3섹션
 * - PsychoEducation 누락 필드 (slug, categoryLabel, pages, published, sortOrder) 자동 보완
 *
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
  buildHealingCatalogPublishedPatchBody,
  buildHealingCatalogPublishedPath,
  buildPsychoEducationContentItemPath,
  buildPsychoEducationContentVisibilityPath,
  normalizeApiListPayload,
  pickContentMasterRowId,
  pickContentMasterRowVisibility
} from '../../constants/adminWebScaffold';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import {
  CONTENT_MASTER_DEFAULTS,
  HEALING_MEDIA_TYPE_OPTIONS,
  estimateReadMinutes,
  generateHealingCode,
  generatePsychoSlug,
  inferMediaType,
  nextSortOrder,
  normalizeMediaType
} from './contentMasterHelpers';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const TAB_PSYCHO = 'PSYCHO';
const TAB_HEALING = 'HEALING';

const SOURCE_LABEL_MAX_LEN = 200;
const SOURCE_URL_MAX_LEN = 500;
const SOURCE_AUTHOR_MAX_LEN = 200;
const SOURCE_YEAR_MIN = 1900;
const SOURCE_YEAR_MAX = 2100;
const SOURCE_URL_PATTERN = /^(https?:\/\/[^\s]+|doi\.org\/.+)$/i;

const TAB_OPTIONS = [
  { value: TAB_PSYCHO, label: '심리교육' },
  { value: TAB_HEALING, label: '힐링 콘텐츠' }
];

const PAGE_TITLE_ID = 'admin-content-master-title';
const FORM_TEXTAREA_ROWS = 6;
const TITLE_INPUT_MAX_LEN = 200;
const CATEGORY_INPUT_MAX_LEN = 64;
const URL_INPUT_MAX_LEN = 2000;

const DEFAULT_READ_MINUTES = CONTENT_MASTER_DEFAULTS.DEFAULT_READ_MINUTES;
const DEFAULT_HEALING_MEDIA_TYPE = CONTENT_MASTER_DEFAULTS.DEFAULT_HEALING_MEDIA_TYPE;
const DEFAULT_HEALING_SORT_ORDER = 0;
const DEFAULT_PSYCHO_CATEGORY = 'general';
const DEFAULT_PSYCHO_SUMMARY_FALLBACK = '(요약 작성 예정)';

const emptyPsychoForm = () => ({
  title: '',
  summary: '',
  body: '',
  category: '',
  readMinutes: String(DEFAULT_READ_MINUTES),
  slug: '',
  published: false,
  sortOrder: '',
  sourceLabel: '',
  sourceUrl: '',
  sourceAuthor: '',
  sourcePublishedYear: ''
});

const emptyHealingForm = () => ({
  code: '',
  title: '',
  description: '',
  category: '',
  mediaType: DEFAULT_HEALING_MEDIA_TYPE,
  durationMinutes: '',
  thumbnailUrl: '',
  contentUrl: '',
  published: false,
  sortOrder: DEFAULT_HEALING_SORT_ORDER,
  sourceLabel: '',
  sourceUrl: '',
  sourceAuthor: '',
  sourcePublishedYear: ''
});

function pickSourceFromRow(row) {
  if (!row || typeof row !== 'object') {
    return { sourceLabel: '', sourceUrl: '', sourceAuthor: '', sourcePublishedYear: '' };
  }
  const yearRaw = row.sourcePublishedYear ?? row.source_published_year ?? null;
  return {
    sourceLabel: toDisplayString(row.sourceLabel ?? row.source_label, ''),
    sourceUrl: toDisplayString(row.sourceUrl ?? row.source_url, ''),
    sourceAuthor: toDisplayString(row.sourceAuthor ?? row.source_author, ''),
    sourcePublishedYear: yearRaw != null && yearRaw !== '' ? String(yearRaw) : ''
  };
}

function buildSourcePayload(form) {
  const sourceLabel = toDisplayString(form.sourceLabel, '').trim();
  const sourceUrl = toDisplayString(form.sourceUrl, '').trim();
  const sourceAuthor = toDisplayString(form.sourceAuthor, '').trim();
  const yearStr = String(form.sourcePublishedYear ?? '').trim();
  const yearParsed = yearStr === '' ? null : Number.parseInt(yearStr, 10);
  return {
    sourceLabel: sourceLabel || null,
    sourceUrl: sourceUrl || null,
    sourceAuthor: sourceAuthor || null,
    sourcePublishedYear: Number.isFinite(yearParsed) ? yearParsed : null
  };
}

function validateSourceForm(form) {
  const url = toDisplayString(form.sourceUrl, '').trim();
  if (url && !SOURCE_URL_PATTERN.test(url)) {
    return ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_VALIDATION_SOURCE_URL;
  }
  const yearStr = String(form.sourcePublishedYear ?? '').trim();
  if (yearStr) {
    const yearParsed = Number.parseInt(yearStr, 10);
    if (
      !Number.isFinite(yearParsed) ||
      yearParsed < SOURCE_YEAR_MIN ||
      yearParsed > SOURCE_YEAR_MAX
    ) {
      return ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_VALIDATION_SOURCE_YEAR;
    }
  }
  return null;
}

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
    if (row.mediaType != null) {
      metaParts.push(String(row.mediaType));
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
    readMinutes: String(row.readMinutes ?? row.estimatedMinutes ?? DEFAULT_READ_MINUTES),
    slug: toDisplayString(row.slug, ''),
    published: row.published === true,
    sortOrder: row.sortOrder != null ? String(row.sortOrder) : '',
    ...pickSourceFromRow(row)
  };
}

function healingMediaTypeToString(typeRaw) {
  if (typeof typeRaw === 'string') {
    return typeRaw;
  }
  if (typeRaw && typeof typeRaw === 'object' && typeRaw.name != null) {
    return String(typeRaw.name);
  }
  return toDisplayString(typeRaw, DEFAULT_HEALING_MEDIA_TYPE);
}

function mapHealingRowToForm(row) {
  if (!row || typeof row !== 'object') {
    return emptyHealingForm();
  }
  const mediaTypeStr = healingMediaTypeToString(row.mediaType ?? row.type);
  const sortOrderRaw = row.sortOrder != null ? Number(row.sortOrder) : DEFAULT_HEALING_SORT_ORDER;
  return {
    code: toDisplayString(row.code, ''),
    title: toDisplayString(row.title, ''),
    description: toDisplayString(row.description, ''),
    category: toDisplayString(row.category, ''),
    mediaType: normalizeMediaType(mediaTypeStr || DEFAULT_HEALING_MEDIA_TYPE),
    durationMinutes: row.durationMinutes != null ? String(row.durationMinutes) : '',
    thumbnailUrl: toDisplayString(row.thumbnailUrl, ''),
    contentUrl: toDisplayString(row.contentUrl, ''),
    published: row.published === true,
    sortOrder: Number.isFinite(sortOrderRaw) ? sortOrderRaw : DEFAULT_HEALING_SORT_ORDER,
    ...pickSourceFromRow(row)
  };
}

function buildPsychoPayload({ form, mode, currentList }) {
  const title = toDisplayString(form.title, '').trim();
  const body = toDisplayString(form.body, '').trim();
  const summaryRaw = toDisplayString(form.summary, '').trim();
  const categoryRaw = toDisplayString(form.category, '').trim() || DEFAULT_PSYCHO_CATEGORY;
  const slugFromForm = toDisplayString(form.slug, '').trim();
  const readParsed = Number.parseInt(String(form.readMinutes).trim(), 10);
  const readMinutes = Number.isFinite(readParsed) && readParsed >= 0
    ? readParsed
    : estimateReadMinutes(body);
  const sortParsed = Number.parseInt(String(form.sortOrder).trim(), 10);
  const sortOrder = Number.isFinite(sortParsed)
    ? sortParsed
    : (mode === 'create' ? nextSortOrder(currentList) : 0);
  const summary = summaryRaw || DEFAULT_PSYCHO_SUMMARY_FALLBACK;
  return {
    slug: slugFromForm || generatePsychoSlug(title),
    title,
    summary,
    body,
    category: categoryRaw,
    categoryLabel: categoryRaw,
    readMinutes,
    pages: [
      {
        order: 0,
        title,
        body
      }
    ],
    published: form.published === true,
    sortOrder,
    ...buildSourcePayload(form)
  };
}

function buildHealingPayload({ form, mode, currentList }) {
  const code = toDisplayString(form.code, '').trim()
    || (mode === 'create' ? generateHealingCode(toDisplayString(form.title, '')) : '');
  const title = toDisplayString(form.title, '').trim();
  const mediaType = normalizeMediaType(form.mediaType);
  const durRaw = String(form.durationMinutes ?? '').trim();
  const durParsed = durRaw === '' ? null : Number.parseInt(durRaw, 10);
  const sortRaw = Number(form.sortOrder);
  return {
    code,
    title,
    description: toDisplayString(form.description, '').trim() || null,
    category: toDisplayString(form.category, '').trim() || mediaType.toLowerCase(),
    mediaType,
    durationMinutes: durParsed != null && Number.isFinite(durParsed) ? durParsed : null,
    thumbnailUrl: toDisplayString(form.thumbnailUrl, '').trim() || null,
    contentUrl: toDisplayString(form.contentUrl, '').trim() || null,
    published: !!form.published,
    sortOrder: Number.isFinite(sortRaw)
      ? sortRaw
      : (mode === 'create' ? nextSortOrder(currentList) : DEFAULT_HEALING_SORT_ORDER),
    ...buildSourcePayload(form)
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddMediaType, setQuickAddMediaType] = useState(DEFAULT_HEALING_MEDIA_TYPE);
  const [quickAddBusy, setQuickAddBusy] = useState(false);

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
    setAdvancedOpen(false);
  }, []);

  const openCreateModal = useCallback(() => {
    setFormMode('create');
    setEditingId(null);
    setPsychoForm(emptyPsychoForm());
    setHealingForm(emptyHealingForm());
    setAdvancedOpen(false);
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
    setAdvancedOpen(false);
    setContentModalOpen(true);
  }, [tab]);

  const handleToggleVisibility = useCallback(async(rawRow) => {
    const id = pickContentMasterRowId(rawRow);
    if (id == null) {
      return;
    }
    const current = pickContentMasterRowVisibility(rawRow);
    const next = !current;
    const path = tab === TAB_PSYCHO
      ? buildPsychoEducationContentVisibilityPath(id)
      : buildHealingCatalogPublishedPath(id);
    const body = tab === TAB_PSYCHO
      ? buildAdminContentVisibilityPatchBody(next)
      : buildHealingCatalogPublishedPatchBody(next);
    setTogglingId(id);
    try {
      await StandardizedApi.patch(path, body);
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
      const titleTrim = toDisplayString(psychoForm.title, '').trim();
      if (!titleTrim) {
        notificationManager.show(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_VALIDATION_TITLE, 'warning');
        return;
      }
      const bodyTrim = toDisplayString(psychoForm.body, '').trim();
      if (!bodyTrim) {
        notificationManager.show(
          ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_VALIDATION_BODY,
          'warning'
        );
        return;
      }
      const sourceErrorPsy = validateSourceForm(psychoForm);
      if (sourceErrorPsy) {
        notificationManager.show(sourceErrorPsy, 'warning');
        return;
      }
      const payload = buildPsychoPayload({
        form: psychoForm,
        mode: formMode,
        currentList: psychoRows
      });
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
    const sourceErrorHeal = validateSourceForm(healingForm);
    if (sourceErrorHeal) {
      notificationManager.show(sourceErrorHeal, 'warning');
      return;
    }
    const payloadH = buildHealingPayload({
      form: healingForm,
      mode: formMode,
      currentList: healingRows
    });
    if (!payloadH.code) {
      notificationManager.show(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_VALIDATION_CODE, 'warning');
      return;
    }
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
    psychoRows,
    healingForm,
    healingRows,
    formMode,
    editingId,
    closeContentModal,
    loadPsycho,
    loadHealing
  ]);

  const handleQuickAdd = useCallback(async() => {
    const titleTrim = quickAddTitle.trim();
    if (!titleTrim) {
      notificationManager.show(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_VALIDATION_TITLE, 'warning');
      return;
    }
    setQuickAddBusy(true);
    try {
      if (tab === TAB_PSYCHO) {
        const payload = buildPsychoPayload({
          form: {
            ...emptyPsychoForm(),
            title: titleTrim,
            body: DEFAULT_PSYCHO_SUMMARY_FALLBACK,
            summary: DEFAULT_PSYCHO_SUMMARY_FALLBACK,
            category: DEFAULT_PSYCHO_CATEGORY,
            published: false
          },
          mode: 'create',
          currentList: psychoRows
        });
        await StandardizedApi.post(ADMIN_WEB_SCAFFOLD_API.ADMIN_CONTENT_PSYCHO_EDUCATION, payload);
      } else {
        const inferred = inferMediaType('');
        const mediaType = normalizeMediaType(quickAddMediaType) || inferred;
        const payloadH = buildHealingPayload({
          form: {
            ...emptyHealingForm(),
            title: titleTrim,
            mediaType,
            category: mediaType.toLowerCase(),
            published: false
          },
          mode: 'create',
          currentList: healingRows
        });
        await StandardizedApi.post(ADMIN_WEB_SCAFFOLD_API.ADMIN_CONTENT_HEALING_CATALOG, payloadH);
      }
      notificationManager.success(ADMIN_WEB_SCAFFOLD_COPY.CONTENT_QUICK_ADD_SUCCESS);
      setQuickAddTitle('');
      setQuickAddMediaType(DEFAULT_HEALING_MEDIA_TYPE);
      await reloadTab();
    } catch (e) {
      notificationManager.error(
        e?.message != null ? String(e.message) : ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ERROR_SAVE
      );
    } finally {
      setQuickAddBusy(false);
    }
  }, [tab, quickAddTitle, quickAddMediaType, psychoRows, healingRows, reloadTab]);

  const handleHealingContentUrlChange = useCallback((ev) => {
    const next = ev.target.value;
    setHealingForm((p) => {
      const wasAutoType = !p.contentUrl || normalizeMediaType(p.mediaType) === inferMediaType(p.contentUrl);
      const inferred = inferMediaType(next);
      return {
        ...p,
        contentUrl: next,
        mediaType: wasAutoType && next ? inferred : p.mediaType
      };
    });
  }, []);

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

  const renderSourceFields = (prefix, form, setter) => (
    <section
      className="mg-modal__form-section"
      aria-label={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_SECTION_SOURCE}
      data-testid={`content-master-source-${prefix}`}
    >
      <SafeText tag="h3" className="mg-modal__section-title">
        {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_SECTION_SOURCE}
      </SafeText>
      <SafeText tag="p" className="mg-modal__hint">
        {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_HINT_SOURCE}
      </SafeText>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-${prefix}-src-label`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_SOURCE_LABEL}
        </label>
        <input
          id={`${baseId}-${prefix}-src-label`}
          className="mg-v2-form-input"
          maxLength={SOURCE_LABEL_MAX_LEN}
          value={form.sourceLabel}
          onChange={(ev) => setter((p) => ({ ...p, sourceLabel: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-${prefix}-src-url`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_SOURCE_URL}
        </label>
        <input
          id={`${baseId}-${prefix}-src-url`}
          className="mg-v2-form-input"
          type="url"
          maxLength={SOURCE_URL_MAX_LEN}
          value={form.sourceUrl}
          onChange={(ev) => setter((p) => ({ ...p, sourceUrl: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
          inputMode="url"
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-${prefix}-src-author`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_SOURCE_AUTHOR}
        </label>
        <input
          id={`${baseId}-${prefix}-src-author`}
          className="mg-v2-form-input"
          maxLength={SOURCE_AUTHOR_MAX_LEN}
          value={form.sourceAuthor}
          onChange={(ev) => setter((p) => ({ ...p, sourceAuthor: ev.target.value }))}
          disabled={saving}
          autoComplete="off"
        />
      </div>
      <div className="mg-modal__form-group">
        <label htmlFor={`${baseId}-${prefix}-src-year`} className="mg-modal__label">
          {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_SOURCE_YEAR}
        </label>
        <input
          id={`${baseId}-${prefix}-src-year`}
          className="mg-v2-form-input"
          type="number"
          min={SOURCE_YEAR_MIN}
          max={SOURCE_YEAR_MAX}
          value={form.sourcePublishedYear}
          onChange={(ev) => setter((p) => ({ ...p, sourcePublishedYear: ev.target.value }))}
          disabled={saving}
          inputMode="numeric"
        />
      </div>
    </section>
  );

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
          aria-required="true"
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
          aria-required="true"
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
      {advancedOpen ? (
        <>
          <div className="mg-modal__form-group">
            <label htmlFor={`${baseId}-psy-slug`} className="mg-modal__label">
              {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_CODE}
            </label>
            <input
              id={`${baseId}-psy-slug`}
              className="mg-v2-form-input"
              value={psychoForm.slug}
              onChange={(ev) => setPsychoForm((p) => ({ ...p, slug: ev.target.value }))}
              disabled={saving}
              autoComplete="off"
              placeholder={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_HINT_AUTO_CODE}
            />
          </div>
          <div className="mg-modal__form-group">
            <label htmlFor={`${baseId}-psy-sort`} className="mg-modal__label">
              {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_SORT_ORDER}
            </label>
            <input
              id={`${baseId}-psy-sort`}
              type="number"
              className="mg-v2-form-input"
              value={psychoForm.sortOrder}
              onChange={(ev) => setPsychoForm((p) => ({ ...p, sortOrder: ev.target.value }))}
              disabled={saving}
            />
          </div>
          <div className="mg-modal__form-group">
            <label htmlFor={`${baseId}-psy-published`} className="mg-modal__label">
              <input
                id={`${baseId}-psy-published`}
                type="checkbox"
                checked={!!psychoForm.published}
                onChange={(ev) => setPsychoForm((p) => ({ ...p, published: ev.target.checked }))}
                disabled={saving}
              />
              {' '}
              {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_PUBLISHED}
            </label>
          </div>
        </>
      ) : null}
      {renderSourceFields('psy', psychoForm, setPsychoForm)}
    </>
  );

  const healingMediaType = normalizeMediaType(healingForm.mediaType);
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
          aria-required="true"
        />
      </div>
      <div className="mg-modal__form-group">
        <span className="mg-modal__label">{ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_TYPE}</span>
        <BadgeSelect
          aria-label={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_TYPE}
          options={HEALING_MEDIA_TYPE_OPTIONS}
          value={healingMediaType}
          onChange={(next) => setHealingForm((p) => ({ ...p, mediaType: normalizeMediaType(next) }))}
          disabled={saving}
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
          onChange={handleHealingContentUrlChange}
          disabled={saving}
          autoComplete="off"
          aria-required={healingMediaType === 'AUDIO' || healingMediaType === 'VIDEO'}
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
      {advancedOpen ? (
        <>
          <div className="mg-modal__form-group">
            <label htmlFor={`${baseId}-heal-code`} className="mg-modal__label">
              {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_CODE}
            </label>
            <input
              id={`${baseId}-heal-code`}
              className="mg-v2-form-input"
              maxLength={CATEGORY_INPUT_MAX_LEN}
              value={healingForm.code}
              onChange={(ev) => setHealingForm((p) => ({ ...p, code: ev.target.value }))}
              disabled={saving}
              autoComplete="off"
              placeholder={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_HINT_AUTO_CODE}
            />
          </div>
          <div className="mg-modal__form-group">
            <label htmlFor={`${baseId}-heal-sort`} className="mg-modal__label">
              {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_SORT_ORDER}
            </label>
            <input
              id={`${baseId}-heal-sort`}
              type="number"
              className="mg-v2-form-input"
              value={healingForm.sortOrder}
              onChange={(ev) => setHealingForm((p) => ({ ...p, sortOrder: ev.target.value }))}
              disabled={saving}
            />
          </div>
          <div className="mg-modal__form-group">
            <label htmlFor={`${baseId}-heal-published`} className="mg-modal__label">
              <input
                id={`${baseId}-heal-published`}
                type="checkbox"
                checked={!!healingForm.published}
                onChange={(ev) => setHealingForm((p) => ({ ...p, published: ev.target.checked }))}
                disabled={saving}
              />
              {' '}
              {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_PUBLISHED}
            </label>
          </div>
        </>
      ) : null}
      {renderSourceFields('heal', healingForm, setHealingForm)}
    </>
  );

  const quickAddRow = (
    <div className="mg-v2-ad-b0kla__quick-add" data-testid="content-master-quick-add">
      <input
        type="text"
        className="mg-v2-form-input"
        value={quickAddTitle}
        onChange={(ev) => setQuickAddTitle(ev.target.value)}
        placeholder={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_QUICK_ADD_TITLE_PLACEHOLDER}
        maxLength={TITLE_INPUT_MAX_LEN}
        disabled={quickAddBusy}
        aria-label={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_QUICK_ADD_TITLE_PLACEHOLDER}
      />
      {tab === TAB_HEALING ? (
        <BadgeSelect
          aria-label={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_FORM_LABEL_TYPE}
          options={HEALING_MEDIA_TYPE_OPTIONS}
          value={quickAddMediaType}
          onChange={(next) => setQuickAddMediaType(normalizeMediaType(next))}
          disabled={quickAddBusy}
        />
      ) : null}
      <MGButton
        type="button"
        variant="primary"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm' })}
        loading={quickAddBusy}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        disabled={quickAddBusy || !quickAddTitle.trim()}
        onClick={handleQuickAdd}
      >
        {ADMIN_WEB_SCAFFOLD_COPY.CONTENT_QUICK_ADD_BUTTON}
      </MGButton>
    </div>
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
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.CONTENT_QUICK_ADD_BUTTON} noCard>
              {quickAddRow}
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
        <div className="mg-modal__form-group mg-modal__form-group--toggle">
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm' })}
            disabled={saving}
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            {advancedOpen
              ? ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ADVANCED_TOGGLE_HIDE
              : ADMIN_WEB_SCAFFOLD_COPY.CONTENT_ADVANCED_TOGGLE_SHOW}
          </MGButton>
        </div>
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default AdminContentMasterPage;
