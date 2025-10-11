"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

export function CalendarShowcase() {
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  const dates = Array.from({ length: 35 }, (_, i) => i - 5)

  return (
    <section className="space-y-8">
      <div className="glass-strong rounded-2xl p-6 shadow-xl max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-[#2F2F2F]">2024년 1월</h3>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-white/50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#6B6B6B]" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/50 transition-colors">
              <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div key={day} className="text-center py-2 text-sm font-semibold text-[#6B6B6B]">
              {day}
            </div>
          ))}

          {dates.map((date, index) => {
            const isCurrentMonth = date > 0 && date <= 31
            const isToday = date === 15
            const hasEvent = [8, 12, 15, 22, 28].includes(date)

            return (
              <button
                key={index}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                  !isCurrentMonth
                    ? "text-[#6B6B6B]/30"
                    : isToday
                      ? "bg-[#50C878] text-white font-bold shadow-lg"
                      : hasEvent
                        ? "bg-[#F8BBD9]/30 text-[#2F2F2F] font-medium"
                        : "text-[#2F2F2F] hover:bg-white/50"
                }`}
              >
                {isCurrentMonth && date}
                {hasEvent && isCurrentMonth && <div className="w-1 h-1 rounded-full bg-[#50C878] mt-1"></div>}
              </button>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-[#2F2F2F]/10">
          <h4 className="text-lg font-semibold text-[#2F2F2F] mb-3">예정된 세션</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/30">
              <div className="w-2 h-2 rounded-full bg-[#50C878]"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2F2F2F]">김서연</p>
                <p className="text-xs text-[#6B6B6B]">내일, 오후 2:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/30">
              <div className="w-2 h-2 rounded-full bg-[#F8BBD9]"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2F2F2F]">이민준</p>
                <p className="text-xs text-[#6B6B6B]">금요일, 오전 10:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">캘린더 컴포넌트</h2>
        <p className="text-[#6B6B6B]">이벤트 표시와 예정된 세션이 있는 월별 보기</p>
      </div>
    </section>
  )
}
