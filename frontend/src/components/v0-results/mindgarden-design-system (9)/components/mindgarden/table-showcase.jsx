"use client"

import { ChevronUp, ChevronDown } from "lucide-react"

export function TableShowcase() {
  const clients = [
    { name: "김서연", email: "sarah@email.com", sessions: 12, status: "활성", lastVisit: "2024-01-15" },
    { name: "이민준", email: "michael@email.com", sessions: 6, status: "대기", lastVisit: "2024-01-10" },
    { name: "박지은", email: "emily@email.com", sessions: 18, status: "활성", lastVisit: "2024-01-14" },
    { name: "최준호", email: "david@email.com", sessions: 9, status: "활성", lastVisit: "2024-01-12" },
    { name: "정수민", email: "lisa@email.com", sessions: 3, status: "신규", lastVisit: "2024-01-16" },
  ]

  return (
    <section className="space-y-6 md:space-y-8">
      <div className="glass-strong rounded-xl md:rounded-2xl p-3 md:p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[#2F2F2F]/10">
                <th className="text-left py-3 md:py-4 px-2 md:px-4 text-[#2F2F2F] font-semibold text-sm md:text-base">
                  <div className="flex items-center gap-1 md:gap-2">
                    이름
                    <ChevronUp className="w-3 h-3 md:w-4 md:h-4 text-[#6B6B6B]" />
                  </div>
                </th>
                <th className="text-left py-3 md:py-4 px-2 md:px-4 text-[#2F2F2F] font-semibold text-sm md:text-base">
                  이메일
                </th>
                <th className="text-left py-3 md:py-4 px-2 md:px-4 text-[#2F2F2F] font-semibold text-sm md:text-base">
                  <div className="flex items-center gap-1 md:gap-2">
                    세션
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-[#6B6B6B]" />
                  </div>
                </th>
                <th className="text-left py-3 md:py-4 px-2 md:px-4 text-[#2F2F2F] font-semibold text-sm md:text-base">
                  상태
                </th>
                <th className="text-left py-3 md:py-4 px-2 md:px-4 text-[#2F2F2F] font-semibold text-sm md:text-base">
                  마지막 방문
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr
                  key={index}
                  className="border-b border-[#2F2F2F]/5 hover:bg-white/30 active:bg-white/40 transition-colors"
                >
                  <td className="py-3 md:py-4 px-2 md:px-4 text-[#2F2F2F] font-medium text-sm md:text-base">
                    {client.name}
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-[#6B6B6B] text-sm md:text-base">{client.email}</td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-[#2F2F2F] text-sm md:text-base">{client.sessions}</td>
                  <td className="py-3 md:py-4 px-2 md:px-4">
                    <span
                      className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                        client.status === "활성"
                          ? "bg-[#50C878] text-white"
                          : client.status === "대기"
                            ? "bg-[#FFB6C1] text-white"
                            : "bg-[#98FB98] text-[#2F2F2F]"
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="py-3 md:py-4 px-2 md:px-4 text-[#6B6B6B] text-sm md:text-base">{client.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[#2F2F2F]/10">
          <p className="text-xs md:text-sm text-[#6B6B6B]">248명 중 1-5명 표시</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-[#2F2F2F]/20 text-[#6B6B6B] hover:bg-white/50 active:bg-white/70 transition-colors text-sm md:text-base min-h-[44px]">
              이전
            </button>
            <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#50C878] text-white hover:bg-[#3da860] active:bg-[#2d8f4d] transition-colors text-sm md:text-base min-h-[44px]">
              다음
            </button>
          </div>
        </div>
      </div>

      <div className="text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2F2F2F] mb-2 md:mb-4">테이블 컴포넌트</h2>
        <p className="text-sm md:text-base text-[#6B6B6B]">페이지네이션과 상태 배지가 있는 정렬 가능한 테이블</p>
      </div>
    </section>
  )
}
