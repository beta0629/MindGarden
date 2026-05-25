/**
 * ConsultantAvailabilityRenewal — 상담사 근무 가능 시간 설정 (리뉴얼)
 *
 * 주간 타임블록(월~일, 09:00~21:00 30분 단위) on/off 토글,
 * 휴가 등록(날짜 범위 + 사유), 저장.
 * ConsultantAppShell 하위 Outlet으로 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, CalendarOff, Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import { useSession } from '../../contexts/SessionContext';
import { useToast } from '../../contexts/ToastContext';
import './ConsultantAvailabilityRenewal.css';

const DAYS_OF_WEEK = [
  { key: 'MON', label: '월' },
  { key: 'TUE', label: '화' },
  { key: 'WED', label: '수' },
  { key: 'THU', label: '목' },
  { key: 'FRI', label: '금' },
  { key: 'SAT', label: '토' },
  { key: 'SUN', label: '일' }
];

const START_HOUR = 9;
const END_HOUR = 21;
const SLOT_INTERVAL_MIN = 30;

const buildTimeSlots = () => {
  const slots = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
};

const TIME_SLOTS = buildTimeSlots();

const buildEmptyGrid = () => {
  const grid = {};
  DAYS_OF_WEEK.forEach((d) => {
    grid[d.key] = {};
    TIME_SLOTS.forEach((t) => { grid[d.key][t] = false; });
  });
  return grid;
};

const ConsultantAvailabilityRenewal = () => {
  const { user } = useSession();
  const { showToast } = useToast();
  const [grid, setGrid] = useState(buildEmptyGrid);
  const [originalGrid, setOriginalGrid] = useState(null);
  const [vacations, setVacations] = useState([]);
  const [vacStartDate, setVacStartDate] = useState('');
  const [vacEndDate, setVacEndDate] = useState('');
  const [vacReason, setVacReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(false);
  const dragRef = useRef(false);

  const consultantId = user?.id;

  const loadAvailability = useCallback(async() => {
    if (!consultantId) return;
    try {
      setLoading(true);
      const res = await TenantAwareApiClient.get(
        `/api/v1/consultants/${consultantId}/availability`
      );
      const data = Array.isArray(res) ? res : (res?.data || []);
      const newGrid = buildEmptyGrid();
      data.forEach((slot) => {
        const dayKey = slot.dayOfWeek?.substring?.(0, 3).toUpperCase();
        const time = slot.startTime?.substring?.(0, 5);
        if (newGrid[dayKey] && newGrid[dayKey][time] !== undefined) {
          newGrid[dayKey][time] = true;
        }
      });
      setGrid(newGrid);
      setOriginalGrid(structuredClone(newGrid));
    } catch (err) {
      console.error('근무시간 로드 실패:', err);
      setOriginalGrid(structuredClone(buildEmptyGrid()));
    } finally {
      setLoading(false);
    }
  }, [consultantId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const handlePointerDown = (day, time) => {
    const newVal = !grid[day][time];
    setIsDragging(true);
    setDragValue(newVal);
    dragRef.current = true;
    setGrid((prev) => ({
      ...prev,
      [day]: { ...prev[day], [time]: newVal }
    }));
  };

  const handlePointerEnter = (day, time) => {
    if (!dragRef.current) return;
    setGrid((prev) => ({
      ...prev,
      [day]: { ...prev[day], [time]: dragValue }
    }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const hasChanges = originalGrid && JSON.stringify(grid) !== JSON.stringify(originalGrid);

  const handleSave = async() => {
    if (!consultantId) return;
    const DAY_MAP = {
      MON: 'MONDAY', TUE: 'TUESDAY', WED: 'WEDNESDAY',
      THU: 'THURSDAY', FRI: 'FRIDAY', SAT: 'SATURDAY', SUN: 'SUNDAY'
    };
    const slots = [];
    DAYS_OF_WEEK.forEach((d) => {
      TIME_SLOTS.forEach((t) => {
        if (grid[d.key][t]) {
          const [hh, mm] = t.split(':').map(Number);
          const endMin = mm + SLOT_INTERVAL_MIN;
          const endH = hh + Math.floor(endMin / 60);
          const endM = endMin % 60;
          slots.push({
            dayOfWeek: DAY_MAP[d.key],
            startTime: t,
            endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
          });
        }
      });
    });
    try {
      setSaving(true);
      await TenantAwareApiClient.put(
        `/api/v1/consultants/${consultantId}/availability`,
        { slots }
      );
      setOriginalGrid(structuredClone(grid));
      showToast({ message: '근무시간이 저장되었습니다.', type: 'success' });
    } catch (err) {
      console.error('저장 실패:', err);
      showToast({ message: '근무시간 저장에 실패했습니다.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalGrid) setGrid(structuredClone(originalGrid));
  };

  const addVacation = () => {
    if (!vacStartDate || !vacEndDate) return;
    setVacations((prev) => [
      ...prev,
      { id: Date.now(), start: vacStartDate, end: vacEndDate, reason: vacReason }
    ]);
    setVacStartDate('');
    setVacEndDate('');
    setVacReason('');
  };

  const removeVacation = (id) => {
    setVacations((prev) => prev.filter((v) => v.id !== id));
  };

  if (loading) {
    return (
      <div className="avail-renewal">
        <div className="avail-renewal__skeleton">
          <div className="avail-renewal__skeleton-block" />
          <div className="avail-renewal__skeleton-block avail-renewal__skeleton-block--tall" />
          <div className="avail-renewal__skeleton-block" />
        </div>
      </div>
    );
  }

  return (
    <div className="avail-renewal">
      {/* 주간 타임블록 */}
      <h2 className="avail-renewal__section-title">
        <Clock size={20} />
        주간 근무 시간
      </h2>

      <div className="avail-renewal__week-grid">
        <div className="avail-renewal__time-header">
          <div className="avail-renewal__time-header-spacer" />
          {DAYS_OF_WEEK.map((d) => (
            <div key={d.key} className="avail-renewal__day-header">{d.label}</div>
          ))}
        </div>

        {TIME_SLOTS.map((time) => (
          <div key={time} className="avail-renewal__time-row">
            <div className="avail-renewal__time-label">{time}</div>
            {DAYS_OF_WEEK.map((d) => {
              const active = grid[d.key][time];
              return (
                <button
                  key={`${d.key}-${time}`}
                  type="button"
                  className={`avail-renewal__slot${active ? ' avail-renewal__slot--active' : ''}${isDragging ? ' avail-renewal__slot--dragging' : ''}`}
                  onPointerDown={() => handlePointerDown(d.key, time)}
                  onPointerEnter={() => handlePointerEnter(d.key, time)}
                  aria-label={`${d.label} ${time} ${active ? '활성' : '비활성'}`}
                  aria-pressed={active}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* 저장 바 */}
      <div className="avail-renewal__save-bar">
        <button
          type="button"
          className="avail-renewal__btn avail-renewal__btn--secondary"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          <RotateCcw size={18} />
          초기화
        </button>
        <button
          type="button"
          className="avail-renewal__btn avail-renewal__btn--primary"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          <Save size={18} />
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 휴가 등록 */}
      <div className="avail-renewal__vacation-section">
        <h2 className="avail-renewal__section-title">
          <CalendarOff size={20} />
          휴가 관리
        </h2>

        <div className="avail-renewal__vacation-card">
          <div className="avail-renewal__vacation-form">
            <div className="avail-renewal__date-range">
              <div className="avail-renewal__input-group">
                <label className="avail-renewal__input-label" htmlFor="vac-start">시작일</label>
                <input
                  id="vac-start"
                  type="date"
                  className="avail-renewal__input"
                  value={vacStartDate}
                  onChange={(e) => setVacStartDate(e.target.value)}
                />
              </div>
              <span>~</span>
              <div className="avail-renewal__input-group">
                <label className="avail-renewal__input-label" htmlFor="vac-end">종료일</label>
                <input
                  id="vac-end"
                  type="date"
                  className="avail-renewal__input"
                  value={vacEndDate}
                  onChange={(e) => setVacEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="avail-renewal__input-group">
              <label className="avail-renewal__input-label" htmlFor="vac-reason">사유 (선택)</label>
              <input
                id="vac-reason"
                type="text"
                className="avail-renewal__input"
                placeholder="휴가 사유를 입력하세요"
                value={vacReason}
                onChange={(e) => setVacReason(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="avail-renewal__btn avail-renewal__btn--primary"
              onClick={addVacation}
              disabled={!vacStartDate || !vacEndDate}
            >
              <Plus size={18} />
              휴가 등록
            </button>
          </div>

          {/* 휴가 목록 */}
          {vacations.length > 0 ? (
            <div className="avail-renewal__vacation-list">
              {vacations.map((vac) => (
                <div key={vac.id} className="avail-renewal__vacation-item">
                  <div className="avail-renewal__vacation-info">
                    <span className="avail-renewal__vacation-dates">
                      {vac.start} ~ {vac.end}
                    </span>
                    {vac.reason && (
                      <span className="avail-renewal__vacation-reason">{vac.reason}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="avail-renewal__vacation-delete"
                    onClick={() => removeVacation(vac.id)}
                    aria-label="휴가 삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="avail-renewal__empty">
              <div className="avail-renewal__empty-icon">
                <CalendarOff size={28} />
              </div>
              <p className="avail-renewal__empty-text">
                등록된 휴가가 없습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultantAvailabilityRenewal;
