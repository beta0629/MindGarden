import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarShowcase = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const hasEvent = (day) => {
    // 예시로 5일, 12일, 20일에 이벤트가 있다고 가정
    return [5, 12, 20].includes(day);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const handleDateClick = (day) => {
    setSelectedDate(day);
  };

  const renderDays = () => {
    const days = [];
    
    // 빈 칸 추가 (첫 날 이전)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="mg-calendar-day" style={{ opacity: 0 }}></div>);
    }
    
    // 날짜 추가
    for (let day = 1; day <= daysInMonth; day++) {
      const classNames = ['mg-calendar-day'];
      if (isToday(day)) classNames.push('today');
      if (selectedDate === day) classNames.push('selected');
      if (hasEvent(day)) classNames.push('has-event');
      
      days.push(
        <div 
          key={day} 
          className={classNames.join(' ')}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">달력</h2>
      
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="mg-calendar">
          {/* Calendar Header */}
          <div className="mg-calendar-header">
            <button className="mg-calendar-nav-btn" onClick={handlePrevMonth}>
              <ChevronLeft size={20} />
            </button>
            <h3 className="mg-calendar-title">
              {year}년 {monthNames[month]}
            </h3>
            <button className="mg-calendar-nav-btn" onClick={handleNextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="mg-calendar-grid">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="mg-calendar-day-header">{day}</div>
            ))}
            
            {/* Days */}
            {renderDays()}
          </div>

          {/* Legend */}
          <div className="mg-flex mg-gap-md" style={{ marginTop: 'var(--spacing-lg)', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--medium-gray)' }}>
            <div className="mg-flex mg-gap-xs" style={{ alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--mint-green)' }}></div>
              <span>오늘</span>
            </div>
            <div className="mg-flex mg-gap-xs" style={{ alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--olive-green)' }}></div>
              <span>선택됨</span>
            </div>
            <div className="mg-flex mg-gap-xs" style={{ alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--olive-green)' }}></div>
              <span>이벤트</span>
            </div>
          </div>

          {/* Selected Date Info */}
          {selectedDate && (
            <div className="mg-card" style={{ marginTop: 'var(--spacing-lg)', background: 'var(--light-cream)' }}>
              <p className="mg-text-center" style={{ fontWeight: 500 }}>
                선택된 날짜: {year}년 {month + 1}월 {selectedDate}일
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CalendarShowcase;

