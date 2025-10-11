"use client"

import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"

export function NotificationShowcase() {
  const notifications = [
    {
      type: "success",
      icon: CheckCircle,
      title: "성공",
      message: "세션이 성공적으로 예약되었습니다.",
      color: "bg-[#50C878]",
      borderColor: "border-[#50C878]",
    },
    {
      type: "warning",
      icon: AlertCircle,
      title: "경고",
      message: "15분 후 예정된 세션이 있습니다.",
      color: "bg-[#FFB6C1]",
      borderColor: "border-[#FFB6C1]",
    },
    {
      type: "error",
      icon: XCircle,
      title: "오류",
      message: "변경 사항을 저장하지 못했습니다. 다시 시도해주세요.",
      color: "bg-[#FF7F7F]",
      borderColor: "border-[#FF7F7F]",
    },
    {
      type: "info",
      icon: Info,
      title: "정보",
      message: "대시보드에 새로운 기능이 추가되었습니다.",
      color: "bg-[#98FB98]",
      borderColor: "border-[#98FB98]",
    },
  ]

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        {notifications.map((notif, index) => {
          const Icon = notif.icon
          return (
            <div
              key={index}
              className={`glass-strong rounded-2xl p-6 shadow-xl border-l-4 ${notif.borderColor} animate-slide-in-right`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`${notif.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-[#2F2F2F] mb-1">{notif.title}</h4>
                  <p className="text-[#6B6B6B]">{notif.message}</p>
                </div>
                <button className="text-[#6B6B6B] hover:text-[#2F2F2F] transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">알림 시스템</h2>
        <p className="text-[#6B6B6B]">성공, 경고, 오류, 정보 알림</p>
      </div>
    </section>
  )
}
