/**
 * MoodJournal — 감정 일기 상세 (웰니스 하위)
 *
 * 이모지 5단계 + 감정 태그 칩 다중 선택 + 한줄 메모 + 감정 달력 + 추이 차트
 * 백엔드 API 미구축 → localStorage 목업으로 대체.
 * ClientAppShell 레이아웃 내에서 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import './MoodJournal.css';

const MOOD_EMOJIS = [
  { value: 1, emoji: '😢', label: '매우 나쁨' },
  { value: 2, emoji: '😟', label: '나쁨' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '🙂', label: '좋음' },
  { value: 5, emoji: '😊', label: '매우 좋음' }
];

const EMOTION_TAGS = [
  '불안', '우울', '피곤', '외로움', '짜증',
  '평온', '기쁨', '감사', '설렘', '뿌듯함'
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const STORAGE_KEY = 'mg_mood_journal';

const getStoredEntries = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveEntry = (dateKey, entry) => {
  const entries = getStoredEntries();
  entries[dateKey] = entry;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const days = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrev - i, otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, otherMonth: false });
  }
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, otherMonth: true });
    }
  }
  return days;
};

const MoodJournal = () => {
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedMood, setSelectedMood] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState({});

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [chartPeriod, setChartPeriod] = useState('weekly');

  useEffect(() => {
    const stored = getStoredEntries();
    setEntries(stored);
    if (stored[todayStr]) {
      setSelectedMood(stored[todayStr].mood || 0);
      setSelectedTags(stored[todayStr].tags || []);
      setMemo(stored[todayStr].memo || '');
    }
  }, [todayStr]);

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = useCallback(() => {
    if (selectedMood === 0) return;
    setSaving(true);
    const entry = {
      mood: selectedMood,
      tags: selectedTags,
      memo,
      timestamp: new Date().toISOString()
    };
    saveEntry(todayStr, entry);
    setEntries((prev) => ({ ...prev, [todayStr]: entry }));
    showToast({ message: '기분이 기록되었습니다.', type: 'success' });
    setTimeout(() => setSaving(false), 500);
  }, [selectedMood, selectedTags, memo, todayStr, showToast]);

  const calendarDays = useMemo(
    () => getCalendarDays(calYear, calMonth),
    [calYear, calMonth]
  );

  const calendarTitle = `${calYear}년 ${calMonth + 1}월`;

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear(calYear - 1);
      setCalMonth(11);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear(calYear + 1);
      setCalMonth(0);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const chartData = useMemo(() => {
    const data = [];
    const periodDays = chartPeriod === 'weekly' ? 7 : 30;
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const entry = entries[key];
      data.push({
        date: key,
        label:
          chartPeriod === 'weekly'
            ? WEEKDAYS[d.getDay()]
            : `${d.getMonth() + 1}/${d.getDate()}`,
        value: entry?.mood || 0
      });
    }
    return data;
  }, [entries, chartPeriod]);

  const maxChartVal = 5;

  return (
    <div className="mood-journal">
      {/* 기분 기록 카드 */}
      <section aria-label="오늘의 기분 기록">
        <div className="mood-journal__record-card">
          <h2 className="mood-journal__record-title">오늘 기분은 어떠세요?</h2>

          <div className="mood-journal__emoji-row" role="radiogroup" aria-label="기분 선택">
            {MOOD_EMOJIS.map((m) => (
              <button
                key={m.value}
                className={`mood-journal__emoji-btn ${
                  selectedMood === m.value
                    ? 'mood-journal__emoji-btn--selected'
                    : ''
                }`}
                role="radio"
                aria-checked={selectedMood === m.value}
                aria-label={m.label}
                onClick={() => setSelectedMood(m.value)}
              >
                <span className="mood-journal__emoji-face">{m.emoji}</span>
                <span className="mood-journal__emoji-label">{m.label}</span>
              </button>
            ))}
          </div>

          <p className="mood-journal__tags-label">감정 태그 (다중 선택)</p>
          <div className="mood-journal__tags" role="group" aria-label="감정 태그">
            {EMOTION_TAGS.map((tag) => (
              <button
                key={tag}
                className={`mood-journal__tag ${
                  selectedTags.includes(tag) ? 'mood-journal__tag--selected' : ''
                }`}
                onClick={() => handleToggleTag(tag)}
                aria-pressed={selectedTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <p className="mood-journal__memo-label">한줄 메모 (선택)</p>
          <textarea
            className="mood-journal__memo"
            placeholder="오늘의 감정을 자유롭게 적어보세요..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={200}
          />

          <button
            className="mood-journal__save-btn"
            onClick={handleSave}
            disabled={selectedMood === 0 || saving}
          >
            {saving ? '저장 중...' : '기분 저장하기'}
          </button>
        </div>
      </section>

      {/* 감정 달력 */}
      <section aria-label="감정 달력">
        <div className="mood-journal__calendar">
          <div className="mood-journal__calendar-header">
            <h2 className="mood-journal__calendar-title">{calendarTitle}</h2>
            <div className="mood-journal__calendar-nav">
              <button
                className="mood-journal__calendar-nav-btn"
                onClick={handlePrevMonth}
                aria-label="이전 달"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="mood-journal__calendar-nav-btn"
                onClick={handleNextMonth}
                aria-label="다음 달"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mood-journal__calendar-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w} className="mood-journal__calendar-weekday">
                {w}
              </span>
            ))}
          </div>

          <div className="mood-journal__calendar-grid">
            {calendarDays.map((cell, idx) => {
              const dateStr = cell.otherMonth
                ? null
                : `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(
                    cell.day
                  ).padStart(2, '0')}`;
              const entry = dateStr ? entries[dateStr] : null;
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`mood-journal__calendar-cell ${
                    isToday ? 'mood-journal__calendar-cell--today' : ''
                  } ${cell.otherMonth ? 'mood-journal__calendar-cell--other-month' : ''}`}
                >
                  {entry ? (
                    <span className="mood-journal__calendar-emoji">
                      {MOOD_EMOJIS.find((m) => m.value === entry.mood)?.emoji || ''}
                    </span>
                  ) : null}
                  <span className="mood-journal__calendar-day">{cell.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 감정 추이 차트 */}
      <section aria-label="감정 추이 차트">
        <div className="mood-journal__chart">
          <div className="mood-journal__chart-header">
            <h2 className="mood-journal__chart-title">감정 추이</h2>
            <div className="mood-journal__chart-tabs">
              <button
                className={`mood-journal__chart-tab ${
                  chartPeriod === 'weekly' ? 'mood-journal__chart-tab--active' : ''
                }`}
                onClick={() => setChartPeriod('weekly')}
              >
                주간
              </button>
              <button
                className={`mood-journal__chart-tab ${
                  chartPeriod === 'monthly' ? 'mood-journal__chart-tab--active' : ''
                }`}
                onClick={() => setChartPeriod('monthly')}
              >
                월간
              </button>
            </div>
          </div>

          {chartData.some((d) => d.value > 0) ? (
            <div className="mood-journal__chart-area" role="img" aria-label="감정 추이 차트">
              {chartData.map((d, idx) => (
                <div key={idx} className="mood-journal__chart-bar-wrap">
                  <div
                    className="mood-journal__chart-bar"
                    style={{
                      height:
                        d.value > 0
                          ? `${(d.value / maxChartVal) * 100}%`
                          : '4px',
                      opacity: d.value > 0 ? 1 : 0.2
                    }}
                    title={d.value > 0 ? `${d.label}: ${d.value}점` : `${d.label}: 기록 없음`}
                  />
                  <span className="mood-journal__chart-label">{d.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mood-journal__chart-empty">
              기록이 쌓이면 추이가 표시돼요
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MoodJournal;
