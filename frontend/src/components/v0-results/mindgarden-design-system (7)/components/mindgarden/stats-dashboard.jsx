"use client"
import { Users, Calendar, Heart, TrendingUp } from "lucide-react"

export function StatsDashboard() {
  const stats = [
    {
      icon: Users,
      label: "활성 내담자",
      value: "248",
      change: "+12%",
      color: "text-[#50C878]",
      bgColor: "bg-[#50C878]/10",
    },
    {
      icon: Calendar,
      label: "이번 주 세션",
      value: "64",
      change: "+8%",
      color: "text-[#98FB98]",
      bgColor: "bg-[#98FB98]/10",
    },
    {
      icon: Heart,
      label: "만족도",
      value: "98%",
      change: "+2%",
      color: "text-[#F8BBD9]",
      bgColor: "bg-[#F8BBD9]/10",
    },
    {
      icon: TrendingUp,
      label: "성장률",
      value: "24%",
      change: "+5%",
      color: "text-[#FFB6C1]",
      bgColor: "bg-[#FFB6C1]/10",
    },
  ]

  return (
    <section className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="glass rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className={`${stat.bgColor} p-2 md:p-3 rounded-lg md:rounded-xl`}>
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                </div>
                <span className={`text-xs md:text-sm font-semibold ${stat.color}`}>{stat.change}</span>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-[#2F2F2F] mb-1">{stat.value}</h3>
              <p className="text-xs md:text-sm text-[#6B6B6B]">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2F2F2F] mb-2 md:mb-4">통계 대시보드</h2>
        <p className="text-sm md:text-base text-[#6B6B6B]">아이콘과 지표가 포함된 글라스모피즘 카드</p>
      </div>
    </section>
  )
}
