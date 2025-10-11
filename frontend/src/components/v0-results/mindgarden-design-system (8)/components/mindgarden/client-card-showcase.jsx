"use client"

import { User, Calendar, TrendingUp } from "lucide-react"
import { Button } from "../ui/button"

export function ClientCardShowcase() {
  const clients = [
    {
      name: "김서연",
      status: "활성",
      progress: 75,
      nextSession: "내일, 오후 2:00",
      sessionsCompleted: 12,
      statusColor: "bg-[#50C878]",
    },
    {
      name: "이민준",
      status: "대기",
      progress: 45,
      nextSession: "금요일, 오전 10:00",
      sessionsCompleted: 6,
      statusColor: "bg-[#FFB6C1]",
    },
    {
      name: "박지은",
      status: "활성",
      progress: 90,
      nextSession: "다음 주",
      sessionsCompleted: 18,
      statusColor: "bg-[#50C878]",
    },
  ]

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client, index) => (
          <div
            key={index}
            className="glass-strong rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#B6E5D8] p-3 rounded-full">
                  <User className="w-6 h-6 text-[#2F2F2F]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2F2F2F]">{client.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs text-white ${client.statusColor} mt-1`}>
                    {client.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#6B6B6B]">진행률</span>
                  <span className="text-[#2F2F2F] font-semibold">{client.progress}%</span>
                </div>
                <div className="w-full bg-[#F5F5DC] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#50C878] to-[#98FB98] transition-all"
                    style={{ width: `${client.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                <Calendar className="w-4 h-4" />
                <span>{client.nextSession}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                <TrendingUp className="w-4 h-4" />
                <span>{client.sessionsCompleted}회 세션 완료</span>
              </div>

              <Button className="w-full bg-[#50C878] hover:bg-[#3da860] text-white mt-4">상세 보기</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">내담자 카드</h2>
        <p className="text-[#6B6B6B]">진행률 추적 및 세션 정보가 포함된 상담 전용 카드</p>
      </div>
    </section>
  )
}
