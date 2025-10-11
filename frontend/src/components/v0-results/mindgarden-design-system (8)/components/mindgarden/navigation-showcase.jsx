"use client"

import { Home, Users, Calendar, Settings, BarChart3 } from "lucide-react"

export function NavigationShowcase() {
  return (
    <section className="space-y-8">
      <div className="space-y-6">
        <div className="glass-strong rounded-2xl p-4 shadow-xl">
          <h3 className="text-xl font-semibold text-[#2F2F2F] mb-4 px-2">상단 네비게이션</h3>
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="#" className="text-[#50C878] font-semibold">
                홈
              </a>
              <a href="#" className="text-[#6B6B6B] hover:text-[#2F2F2F] transition-colors">
                내담자
              </a>
              <a href="#" className="text-[#6B6B6B] hover:text-[#2F2F2F] transition-colors">
                캘린더
              </a>
              <a href="#" className="text-[#6B6B6B] hover:text-[#2F2F2F] transition-colors">
                리포트
              </a>
            </div>
            <button className="bg-[#50C878] text-white px-4 py-2 rounded-lg hover:bg-[#3da860] transition-colors">
              새 세션
            </button>
          </nav>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-[#2F2F2F] mb-4">사이드바 네비게이션</h3>
          <nav className="space-y-2">
            {[
              { icon: Home, label: "대시보드", active: true },
              { icon: Users, label: "내담자", active: false },
              { icon: Calendar, label: "일정", active: false },
              { icon: BarChart3, label: "분석", active: false },
              { icon: Settings, label: "설정", active: false },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <a
                  key={i}
                  href="#"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.active
                      ? "bg-[#50C878] text-white shadow-lg"
                      : "text-[#6B6B6B] hover:bg-white/50 hover:text-[#2F2F2F]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </a>
              )
            })}
          </nav>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-[#2F2F2F] mb-4">탭 네비게이션</h3>
          <div className="flex gap-2 border-b border-[#2F2F2F]/10">
            <button className="px-6 py-3 text-[#50C878] border-b-2 border-[#50C878] font-semibold">개요</button>
            <button className="px-6 py-3 text-[#6B6B6B] hover:text-[#2F2F2F] transition-colors">세션</button>
            <button className="px-6 py-3 text-[#6B6B6B] hover:text-[#2F2F2F] transition-colors">노트</button>
            <button className="px-6 py-3 text-[#6B6B6B] hover:text-[#2F2F2F] transition-colors">기록</button>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">네비게이션 컴포넌트</h2>
        <p className="text-[#6B6B6B]">상단 바, 사이드바, 탭 네비게이션 패턴</p>
      </div>
    </section>
  )
}
