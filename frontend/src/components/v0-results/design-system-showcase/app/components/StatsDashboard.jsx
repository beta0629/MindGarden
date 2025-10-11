"use client"

import { Users, Heart, TrendingUp, Award } from "lucide-react"
import "../mindgarden-styles.css"

const StatsDashboard = () => {
  const stats = [
    {
      icon: Users,
      value: "10,000+",
      label: "활성 사용자",
      change: "+12% 이번 달",
    },
    {
      icon: Heart,
      value: "50,000+",
      label: "완료된 세션",
      change: "+8% 이번 달",
    },
    {
      icon: TrendingUp,
      value: "95%",
      label: "만족도",
      change: "+3% 이번 달",
    },
    {
      icon: Award,
      value: "200+",
      label: "전문 상담사",
      change: "+15% 이번 달",
    },
  ]

  return (
    <div className="stats-dashboard">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon">
            <stat.icon size={24} />
          </div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
          <div className="stat-change">{stat.change}</div>
        </div>
      ))}
    </div>
  )
}

export default StatsDashboard
