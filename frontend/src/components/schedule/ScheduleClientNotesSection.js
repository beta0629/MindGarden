import React, { useState, useEffect, useCallback } from 'react';
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
  DEFAULT_NOTE_TYPE_CODE
} from '../../constants/clientScheduleNoteConstants';
import { CALENDAR_EXTENDED_TYPE_VACATION } from '../../constants/schedule';

/**
 * 일정 상세 모달 내부 — 내담자 특이사항(지속 메모) CRUD. adminNote와 분리.
 * 미해소(resolvedAt 없음)는 상단에 누적 표시, 해소 후에도 목록 하단에 보관.
 *
 * @param {object} props
 * @param {object} props.scheduleData 선택 일정 — `scheduleId`·`id`는 DB `schedules` PK(숫자)만 유효.
 *   휴가 블록은 `scheduleId: null`·`calendarEventType: 'vacation'`이며 `id`는 캘린더용 문자열이므로 노트 앵커로 쓰지 않음.
 * @param {object|null} props.user 세션 사용자
 * @param {(summary: { unresolvedCount: number, totalCount: number }) => void} [props.onSummaryChange] 부모 탭 배지 등
 */
const ScheduleClientNotesSection = ({ scheduleData, user, onSummaryChange }) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteTypeOptions, setNoteTypeOptions] = useState([]);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formNoteType, setFormNoteType] = useState('');
  const [formPromiseDate, setFormPromiseDate] = useState('');
  const [editingId, setEditingId] = useState(null);

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

  const loadNotes = useCallback(async() => {
    if (!canUseApi || !hasAnchor) {
      setNotes([]);
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (scheduleId != null) params.scheduleId = scheduleId;
      if (clientId != null) params.clientId = clientId;
      if (mappingId != null) params.mappingId = mappingId;
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

  const isUnresolved = (n) => !n?.resolvedAt;

  const isPromiseOverdue = (n) => {
    if (!isUnresolved(n) || !n?.promiseDate) return false;
    const d = String(n.promiseDate).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${day}`;
    return d < todayStr;
  };

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
      notificationManager.warning('스케줄 또는 매칭 정보가 없어 저장할 수 없습니다.');
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
    const ok = window.confirm('이 특이사항을 삭제할까요?');
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

  if (!canUseApi) {
    return null;
  }

  const typeSelectOptions =
    noteTypeOptions.length > 0
      ? noteTypeOptions
      : [{ value: DEFAULT_NOTE_TYPE_CODE, label: '기타' }];

  if (!hasAnchor) {
    return (
      <div className="mg-v2-ad-modal__section">
        <div className="section-title">내담자 특이사항</div>
        <p className="mg-v2-text-secondary">
          <SafeText>
            {toDisplayString(
              '이 일정에는 내담자·스케줄 식별자가 연결되어 있지 않아 특이사항을 저장할 수 없습니다.',
              ''
            )}
          </SafeText>
        </p>
      </div>
    );
  }

  return (
    <div className="mg-v2-ad-modal__section">
      <div className="section-title">내담자 특이사항</div>
      <p className="mg-v2-text-secondary" style={{ marginBottom: 'var(--mg-space-3)' }}>
        <SafeText>
          {toDisplayString(
            '입금 확인용 메모와 별도로, 약속·후속 조치 등 지속 관리가 필요한 내용을 기록합니다. 미해소 건은 위에 누적되며, 해소 처리 후에도 아래에 보관됩니다.',
            ''
          )}
        </SafeText>
      </p>
      {scheduleData && (
        (scheduleData.clientScheduleNotesUnresolvedCount > 0 || scheduleData.clientScheduleNotesClientWideUnresolvedCount > 0) ? (
          <div className="mg-v2-alert info" style={{ marginBottom: 'var(--mg-space-3)', padding: 'var(--mg-space-2)', background: 'var(--mg-info-100)', color: 'var(--mg-info-800)', borderRadius: 'var(--mg-border-radius-sm)', border: '1px solid var(--mg-info-300)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--mg-space-2)' }}>
              <span role="img" aria-label="info" style={{ fontSize: 'var(--font-size-lg)' }}>ℹ️</span>
              <div>
                {scheduleData.clientScheduleNotesUnresolvedCount > 0 && (
                  <div><SafeText>{toDisplayString(`이 일정 직결 미해소: ${scheduleData.clientScheduleNotesUnresolvedCount}건`, '')}</SafeText></div>
                )}
                {scheduleData.clientScheduleNotesClientWideUnresolvedCount > 0 && (
                  <div><SafeText>{toDisplayString(`내담자 전체 미해소: ${scheduleData.clientScheduleNotesClientWideUnresolvedCount}건`, '')}</SafeText></div>
                )}
              </div>
            </div>
          </div>
        ) : null
      )}

      {clientId == null && (
        <div className="mg-v2-alert warning" style={{ marginBottom: 'var(--mg-space-3)', padding: 'var(--mg-space-2)', background: 'var(--mg-warning-100)', color: 'var(--mg-warning-800)', borderRadius: 'var(--mg-border-radius-sm)', border: '1px solid var(--mg-warning-300)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--mg-space-2)' }}>
            <span role="img" aria-label="warning" style={{ fontSize: 'var(--font-size-lg)' }}>⚠️</span>
            <SafeText>
              {toDisplayString('내담자가 연결되지 않은 일정입니다. 작성된 특이사항은 이 일정(또는 매칭) 정보에만 한정하여 보관됩니다.', '')}
            </SafeText>
          </div>
        </div>
      )}

      {loading && notes.length === 0 ? (
        <p className="mg-v2-text-secondary">
          <SafeText>{toDisplayString('불러오는 중…', '')}</SafeText>
        </p>
      ) : null}

      {(() => {
        const open = notes.filter((n) => isUnresolved(n));
        const done = notes.filter((n) => !isUnresolved(n));
        const cardBase = {
          marginBottom: 'var(--mg-space-3)',
          padding: 'var(--mg-space-3)',
          border: '1px solid var(--mg-border-subtle)'
        };
        const renderItem = (n) => {
          const overdue = isPromiseOverdue(n);
          const resolved = !isUnresolved(n);
          return (
            <li
              key={String(n.id)}
              className="mg-v2-card mg-v2-card--flat"
              style={{
                ...cardBase,
                borderLeft: overdue ? 'var(--spacing-xs) solid var(--ad-b0kla-orange)' : cardBase.border,
                opacity: resolved ? 0.88 : 1,
                background: resolved ? 'var(--ad-b0kla-green-bg)' : undefined
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 'var(--mg-space-2)', display: 'flex', flexWrap: 'wrap', gap: 'var(--mg-space-2)', alignItems: 'center' }}>
                <SafeText>{toDisplayString(n.title, '')}</SafeText>
                {overdue ? (
                  <span className="mg-v2-badge warning" style={{ fontSize: 'var(--font-size-xs)' }}>
                    약속일 경과
                  </span>
                ) : null}
                {resolved ? (
                  <span className="mg-v2-badge secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                    해소됨
                  </span>
                ) : null}
              </div>
              <div className="mg-v2-text-secondary" style={{ fontSize: 'var(--mg-font-size-sm)' }}>
                <SafeText>
                  {toDisplayString(
                    `${n.noteType || ''}${n.promiseDate ? ` · 약속일 ${n.promiseDate}` : ''}`,
                    ''
                  )}
                </SafeText>
              </div>
              {n.body ? (
                <div style={{ marginTop: 'var(--mg-space-2)' }}>
                  <SafeText>{toDisplayString(n.body, '')}</SafeText>
                </div>
              ) : null}
              {canEditNote(n) ? (
                <div style={{ marginTop: 'var(--mg-space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--mg-space-2)' }}>
                  {isUnresolved(n) ? (
                    <MGButton
                      type="button"
                      variant="primary"
                      size="small"
                      className={buildErpMgButtonClassName({
                        variant: 'primary',
                        size: 'sm',
                        loading: false,
                        className: 'mg-v2-btn--primary'
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      preventDoubleClick={false}
                      onClick={() => handleResolve(n, true)}
                      disabled={loading}
                    >
                      해소
                    </MGButton>
                  ) : (
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'sm',
                        loading: false,
                        className: 'mg-v2-btn--outline'
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      preventDoubleClick={false}
                      onClick={() => handleResolve(n, false)}
                      disabled={loading}
                    >
                      다시 열기
                    </MGButton>
                  )}
                  <MGButton
                    type="button"
                    variant="outline"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'sm',
                      loading: false,
                      className: 'mg-v2-btn--outline'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    preventDoubleClick={false}
                    onClick={() => handleEdit(n)}
                    disabled={loading}
                  >
                    수정
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="danger"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'danger',
                      size: 'sm',
                      loading: false,
                      className: 'mg-v2-schedule-detail-btn--danger'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    preventDoubleClick={false}
                    onClick={() => handleDelete(n)}
                    disabled={loading}
                  >
                    삭제
                  </MGButton>
                </div>
              ) : null}
            </li>
          );
        };
        return (
          <div style={{ marginBottom: 'var(--mg-space-4)' }}>
            <div className="section-title" style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--mg-space-2)' }}>
              미해소 ({open.length})
            </div>
            {open.length === 0 && !loading ? (
              <p className="mg-v2-text-secondary" style={{ marginBottom: 'var(--mg-space-3)' }}>
                <SafeText>{toDisplayString('미해소 특이사항이 없습니다.', '')}</SafeText>
              </p>
            ) : (
              <ul className="mg-v2-list-unstyled">{open.map(renderItem)}</ul>
            )}
            {done.length > 0 ? (
              <>
                <div className="section-title" style={{ fontSize: 'var(--font-size-base)', margin: 'var(--mg-space-4) 0 var(--mg-space-2)' }}>
                  해소됨 ({done.length})
                </div>
                <ul className="mg-v2-list-unstyled">{done.map(renderItem)}</ul>
              </>
            ) : null}
          </div>
        );
      })()}

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
        <div style={{ display: 'flex', gap: 'var(--mg-space-2)' }}>
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
              취소
            </MGButton>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default ScheduleClientNotesSection;
