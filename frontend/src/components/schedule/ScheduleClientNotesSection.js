import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import StandardizedApi from '../../utils/standardizedApi';
import { getCommonCodes } from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../utils/safeDisplay';
import { RoleUtils } from '../../constants/roles';
import {
  CLIENT_SCHEDULE_NOTE_API,
  SCHEDULE_CLIENT_NOTE_TYPE_GROUP,
  DEFAULT_NOTE_TYPE_CODE,
  CLIENT_SCHEDULE_NOTES_SECTION_TITLE,
  CLIENT_SCHEDULE_NOTES_INTRO,
  CLIENT_SCHEDULE_NOTES_BANNER_CLIENT_WIDE_PREFIX,
  CLIENT_SCHEDULE_NOTES_BANNER_SCHEDULE_LINKED_PREFIX,
  CLIENT_SCHEDULE_NOTES_BANNER_COUNT_SUFFIX,
  CLIENT_SCHEDULE_NOTES_UNRESOLVED_GROUP_TITLE,
  CLIENT_SCHEDULE_NOTES_RESOLVED_GROUP_TITLE,
  CLIENT_SCHEDULE_NOTES_EMPTY_UNRESOLVED,
  CLIENT_SCHEDULE_NOTES_LOADING,
  CLIENT_SCHEDULE_NOTES_NO_ANCHOR,
  CLIENT_SCHEDULE_NOTES_NO_CLIENT_WARNING,
  CLIENT_SCHEDULE_NOTES_BANNER_EXPAND_HINT
} from '../../constants/clientScheduleNoteConstants';
import { CALENDAR_EXTENDED_TYPE_VACATION } from '../../constants/schedule';
import {
  isScheduleClientNoteUnresolved,
  resolveScheduleClientNoteTypeLabel
} from '../../utils/scheduleClientNoteTypeUtils';
import ScheduleClientNoteCard, {
  SCHEDULE_CLIENT_NOTE_CARD_ITEM_CLASS
} from './molecules/ScheduleClientNoteCard';
import './ScheduleClientNotesSection.css';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../hooks/useConfirm';

/**
 * 일정 상세 모달 내부 — 내담자 특이사항(지속 메모) CRUD. adminNote와 분리.
 * 목록 SSOT: 내담자(clientId) 단위(client-wide). 배너 건수 = 미해소 목록 건수.
 *
 * @param {object} props
 * @param {object} props.scheduleData 선택 일정 — `scheduleId`·`id`는 DB `schedules` PK(숫자)만 유효.
 *   휴가 블록은 `scheduleId: null`·`calendarEventType: 'vacation'`이며 `id`는 캘린더용 문자열이므로 노트 앵커로 쓰지 않음.
 * @param {object|null} props.user 세션 사용자
 * @param {(summary: { unresolvedCount: number, totalCount: number }) => void} [props.onSummaryChange] 부모 탭 배지 등
 */
const ScheduleClientNotesSection = ({ scheduleData, user, onSummaryChange }) => {
  const { t } = useTranslation();
  const [confirm, ConfirmModal] = useConfirm();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteTypeOptions, setNoteTypeOptions] = useState([]);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formNoteType, setFormNoteType] = useState('');
  const [formPromiseDate, setFormPromiseDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const unresolvedListRef = useRef(null);

  const hasOwnScheduleId = scheduleData != null && Object.hasOwn(scheduleData, 'scheduleId');
  const scheduleIdRaw = hasOwnScheduleId ? scheduleData.scheduleId : (scheduleData?.id ?? null);

  const normalizeNoteAnchorLong = (raw) => {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    const s = String(raw).trim();
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      return Number.isSafeInteger(n) ? n : null;
    }
    return null;
  };

  const scheduleId = normalizeNoteAnchorLong(scheduleIdRaw);
  const clientId = normalizeNoteAnchorLong(scheduleData?.clientId);
  const mappingId = normalizeNoteAnchorLong(scheduleData?.mappingId);

  const canUseApi = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);
  const hasAnchor = scheduleId != null || clientId != null || mappingId != null;

  const loadTypeCodes = useCallback(async() => {
    try {
      const codes = await getCommonCodes(SCHEDULE_CLIENT_NOTE_TYPE_GROUP);
      if (codes && Array.isArray(codes) && codes.length > 0) {
        setNoteTypeOptions(
          codes.map((c) => ({
            value: c.codeValue,
            label: c.koreanName || c.codeLabel || c.codeValue
          }))
        );
        setFormNoteType((prev) => prev || codes[0].codeValue);
      } else {
        setNoteTypeOptions([]);
        setFormNoteType((prev) => prev || DEFAULT_NOTE_TYPE_CODE);
      }
    } catch (e) {
      console.error('특이사항 유형 코드 로드 실패:', e);
      setNoteTypeOptions([]);
    }
  }, []);

  /**
   * client-wide SSOT: clientId가 있으면 mappingId를 보내지 않는다.
   * (BE도 내담자 경로에서 mapping 후필터를 하지 않음)
   */
  const loadNotes = useCallback(async() => {
    if (!canUseApi || !hasAnchor) {
      setNotes([]);
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (clientId != null) {
        params.clientId = clientId;
        if (scheduleId != null) params.scheduleId = scheduleId;
      } else {
        if (scheduleId != null) params.scheduleId = scheduleId;
        if (mappingId != null) params.mappingId = mappingId;
      }
      const res = await StandardizedApi.get(CLIENT_SCHEDULE_NOTE_API, params);
      const list = res?.notes ?? [];
      setNotes(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('특이사항 목록 로드 실패:', e);
      setNotes([]);
      notificationManager.error('특이사항을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [canUseApi, hasAnchor, scheduleId, clientId, mappingId]);

  useEffect(() => {
    loadTypeCodes();
  }, [loadTypeCodes]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (typeof onSummaryChange !== 'function') {
      return;
    }
    const unresolved = notes.filter((n) => !n.resolvedAt).length;
    onSummaryChange({ unresolvedCount: unresolved, totalCount: notes.length });
  }, [notes, onSummaryChange]);

  const noteTypeLabelMap = useMemo(() => {
    const map = {};
    noteTypeOptions.forEach((opt) => {
      if (opt?.value && opt.label && opt.label !== opt.value) {
        map[opt.value] = opt.label;
      }
    });
    return map;
  }, [noteTypeOptions]);

  const getNoteTypeLabel = useCallback(
    (codeValue) => resolveScheduleClientNoteTypeLabel(codeValue, noteTypeLabelMap),
    [noteTypeLabelMap]
  );

  const resetForm = () => {
    setFormTitle('');
    setFormBody('');
    setFormPromiseDate('');
    setEditingId(null);
    if (noteTypeOptions.length > 0) {
      setFormNoteType(noteTypeOptions[0].value);
    } else {
      setFormNoteType(DEFAULT_NOTE_TYPE_CODE);
    }
  };

  if (scheduleData?.calendarEventType === CALENDAR_EXTENDED_TYPE_VACATION) {
    return null;
  }

  const canEditNote = (note) => {
    if (RoleUtils.isAdmin(user)) return true;
    if (RoleUtils.isStaff(user) && user?.id != null && note?.createdBy != null) {
      return String(note.createdBy) === String(user.id);
    }
    return false;
  };

  const isUnresolved = isScheduleClientNoteUnresolved;

  const handleResolve = async(note, resolved) => {
    if (!canEditNote(note)) return;
    setLoading(true);
    try {
      await StandardizedApi.put(`${CLIENT_SCHEDULE_NOTE_API}/${note.id}`, { resolved });
      notificationManager.success(resolved ? '해소 처리되었습니다.' : '다시 미해소로 표시합니다.');
      if (editingId === note.id) resetForm();
      await loadNotes();
    } catch (err) {
      console.error('특이사항 해소 상태 변경 실패:', err);
      notificationManager.error(err?.message || '처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!hasAnchor) {
      notificationManager.warning('스케줄 또는 배정 정보가 없어 저장할 수 없습니다.');
      return;
    }
    const titleTrim = (formTitle || '').trim();
    if (!titleTrim) {
      notificationManager.warning('제목을 입력해 주세요.');
      return;
    }
    if (!formNoteType) {
      notificationManager.warning('유형을 선택해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const body = {
        title: titleTrim,
        body: formBody || '',
        noteType: formNoteType,
        promiseDate: formPromiseDate || null,
        scheduleId: scheduleId != null ? scheduleId : null,
        clientId: clientId != null ? clientId : null,
        mappingId: mappingId != null ? mappingId : null
      };
      if (editingId) {
        await StandardizedApi.put(`${CLIENT_SCHEDULE_NOTE_API}/${editingId}`, {
          title: body.title,
          body: body.body,
          noteType: body.noteType,
          promiseDate: body.promiseDate
        });
        notificationManager.success('특이사항이 수정되었습니다.');
      } else {
        await StandardizedApi.post(CLIENT_SCHEDULE_NOTE_API, body);
        notificationManager.success('특이사항이 등록되었습니다.');
      }
      resetForm();
      await loadNotes();
    } catch (err) {
      console.error('특이사항 저장 실패:', err);
      notificationManager.error(err?.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setFormTitle(note.title || '');
    setFormBody(note.body || '');
    setFormNoteType(note.noteType || formNoteType);
    setFormPromiseDate(note.promiseDate || '');
  };

  const handleDelete = async(note) => {
    if (!canEditNote(note)) return;
    const ok = await confirm({
      variant: 'danger',
      messageKey: 'modal.scheduleNote.delete.confirm.message'
    });
    if (!ok) return;
    setLoading(true);
    try {
      await StandardizedApi.delete(`${CLIENT_SCHEDULE_NOTE_API}/${note.id}`);
      notificationManager.success('삭제되었습니다.');
      if (editingId === note.id) resetForm();
      await loadNotes();
    } catch (err) {
      console.error('특이사항 삭제 실패:', err);
      notificationManager.error(err?.message || '삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerToggle = () => {
    setBannerExpanded((prev) => {
      const next = !prev;
      if (next) {
        window.requestAnimationFrame(() => {
          unresolvedListRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
        });
      }
      return next;
    });
  };

  if (!canUseApi) {
    return null;
  }

  const typeSelectOptions =
    noteTypeOptions.length > 0
      ? noteTypeOptions
      : [{ value: DEFAULT_NOTE_TYPE_CODE, label: getNoteTypeLabel(DEFAULT_NOTE_TYPE_CODE) }];

  if (!hasAnchor) {
    return (
      <div className="mg-v2-ad-modal__section">
        <div className="section-title">{CLIENT_SCHEDULE_NOTES_SECTION_TITLE}</div>
        <p className="mg-v2-text-secondary">
          <SafeText>
            {toDisplayString(CLIENT_SCHEDULE_NOTES_NO_ANCHOR, '')}
          </SafeText>
        </p>
      </div>
    );
  }

  const open = notes.filter((n) => isUnresolved(n));
  const done = notes.filter((n) => !isUnresolved(n));
  const clientWideUnresolvedCount = open.length;
  const scheduleLinkedUnresolvedCount = open.filter((n) => (
    scheduleId != null && n?.scheduleId != null && String(n.scheduleId) === String(scheduleId)
  )).length;
  const showBanner = clientWideUnresolvedCount > 0;

  const renderItem = (n, { compactActions = false } = {}) => {
    const editable = canEditNote(n);
    return (
      <li key={String(n.id)} className={SCHEDULE_CLIENT_NOTE_CARD_ITEM_CLASS}>
        <ScheduleClientNoteCard
          note={n}
          getTypeLabel={getNoteTypeLabel}
          showScheduleDate
          onResolve={editable ? (note) => handleResolve(note, true) : null}
          onReopen={editable ? (note) => handleResolve(note, false) : null}
          onEdit={editable && !compactActions ? handleEdit : null}
          onDelete={editable && !compactActions ? handleDelete : null}
          actionsDisabled={loading}
        />
      </li>
    );
  };

  return (
    <div className="mg-v2-ad-modal__section">
      <div className="section-title">{CLIENT_SCHEDULE_NOTES_SECTION_TITLE}</div>
      <p className="mg-v2-text-secondary schedule-client-notes-section__intro">
        <SafeText>
          {toDisplayString(CLIENT_SCHEDULE_NOTES_INTRO, '')}
        </SafeText>
      </p>

      {showBanner ? (
        <div className="mg-v2-alert mg-v2-alert--info schedule-client-notes-section__info-alert">
          <button
            type="button"
            className="schedule-client-notes-section__banner-toggle"
            onClick={handleBannerToggle}
            aria-expanded={bannerExpanded}
            aria-controls="schedule-client-notes-unresolved-panel"
            title={CLIENT_SCHEDULE_NOTES_BANNER_EXPAND_HINT}
          >
            <span
              className="schedule-client-notes-section__alert-icon"
              aria-hidden="true"
            />
            <span className="schedule-client-notes-section__banner-text">
              <SafeText>
                {toDisplayString(
                  `${CLIENT_SCHEDULE_NOTES_BANNER_CLIENT_WIDE_PREFIX} ${clientWideUnresolvedCount}${CLIENT_SCHEDULE_NOTES_BANNER_COUNT_SUFFIX}`,
                  ''
                )}
              </SafeText>
              {scheduleLinkedUnresolvedCount > 0 && scheduleLinkedUnresolvedCount !== clientWideUnresolvedCount ? (
                <span className="schedule-client-notes-section__banner-sub">
                  <SafeText>
                    {toDisplayString(
                      `${CLIENT_SCHEDULE_NOTES_BANNER_SCHEDULE_LINKED_PREFIX} ${scheduleLinkedUnresolvedCount}${CLIENT_SCHEDULE_NOTES_BANNER_COUNT_SUFFIX}`,
                      ''
                    )}
                  </SafeText>
                </span>
              ) : null}
            </span>
            <span
              className={`schedule-client-notes-section__banner-chevron${
                bannerExpanded ? ' schedule-client-notes-section__banner-chevron--open' : ''
              }`}
              aria-hidden="true"
            />
          </button>
          {bannerExpanded ? (
            <ul
              id="schedule-client-notes-unresolved-panel"
              className="mg-v2-list-unstyled schedule-client-notes-section__banner-panel"
            >
              {open.map((n) => renderItem(n, { compactActions: true }))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {clientId == null && (
        <div className="mg-v2-alert mg-v2-alert--warning schedule-client-notes-section__warning-alert">
          <div className="schedule-client-notes-section__alert-row">
            <span
              className="schedule-client-notes-section__alert-icon schedule-client-notes-section__alert-icon--warning"
              aria-hidden="true"
            />
            <SafeText>
              {toDisplayString(CLIENT_SCHEDULE_NOTES_NO_CLIENT_WARNING, '')}
            </SafeText>
          </div>
        </div>
      )}

      {loading && notes.length === 0 ? (
        <p className="mg-v2-text-secondary">
          <SafeText>{toDisplayString(CLIENT_SCHEDULE_NOTES_LOADING, '')}</SafeText>
        </p>
      ) : null}

      <div className="schedule-client-notes-section__group" ref={unresolvedListRef}>
        <div className="section-title schedule-client-notes-section__group-title">
          {`${CLIENT_SCHEDULE_NOTES_UNRESOLVED_GROUP_TITLE} (${open.length})`}
        </div>
        {open.length === 0 && !loading ? (
          <p className="mg-v2-text-secondary schedule-client-notes-section__empty">
            <SafeText>{toDisplayString(CLIENT_SCHEDULE_NOTES_EMPTY_UNRESOLVED, '')}</SafeText>
          </p>
        ) : (
          <ul className="mg-v2-list-unstyled">{open.map((n) => renderItem(n))}</ul>
        )}
        {done.length > 0 ? (
          <>
            <div className="section-title schedule-client-notes-section__group-title--resolved">
              {`${CLIENT_SCHEDULE_NOTES_RESOLVED_GROUP_TITLE} (${done.length})`}
            </div>
            <ul className="mg-v2-list-unstyled">{done.map((n) => renderItem(n))}</ul>
          </>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mg-v2-form-stack">
        <div className="mg-form-group">
          <label className="mg-v2-label" htmlFor="schedule-note-type">
            유형
          </label>
          <select
            id="schedule-note-type"
            className="mg-v2-input mg-v2-select"
            value={formNoteType || DEFAULT_NOTE_TYPE_CODE}
            onChange={(ev) => setFormNoteType(ev.target.value)}
            disabled={loading}
          >
            {typeSelectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {toDisplayString(opt.label, opt.value)}
              </option>
            ))}
          </select>
        </div>
        <div className="mg-form-group">
          <label className="mg-v2-label" htmlFor="schedule-note-title">
            제목
          </label>
          <input
            id="schedule-note-title"
            type="text"
            className="mg-v2-input"
            value={formTitle}
            onChange={(ev) => setFormTitle(ev.target.value)}
            disabled={loading}
            maxLength={300}
          />
        </div>
        <div className="mg-form-group">
          <label className="mg-v2-label" htmlFor="schedule-note-promise">
            약속일 (선택)
          </label>
          <input
            id="schedule-note-promise"
            type="date"
            className="mg-v2-input"
            value={formPromiseDate}
            onChange={(ev) => setFormPromiseDate(ev.target.value)}
            disabled={loading}
          />
        </div>
        <div className="mg-form-group">
          <label className="mg-v2-label" htmlFor="schedule-note-body">
            내용
          </label>
          <textarea
            id="schedule-note-body"
            className="mg-v2-textarea mg-v2-input"
            value={formBody}
            onChange={(ev) => setFormBody(ev.target.value)}
            disabled={loading}
            rows={4}
          />
        </div>
        <div className="schedule-client-notes-section__form-actions">
          <MGButton
            type="submit"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading,
              className: 'mg-v2-btn--primary'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick
            loading={loading}
          >
            {editingId ? '수정 저장' : '등록'}
          </MGButton>
          {editingId ? (
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: 'mg-v2-btn--outline'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
              onClick={() => resetForm()}
              disabled={loading}
            >
              {t('common.actions.cancel')}
            </MGButton>
          ) : null}
        </div>
      </form>
      <ConfirmModal />
    </div>
  );
};

export default ScheduleClientNotesSection;
