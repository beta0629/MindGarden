"use client"

import { Loader2 } from "lucide-react"

export function LoadingShowcase() {
  return (
    <section className="space-y-8">
      <div className="glass-strong rounded-3xl p-12 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="flex flex-col items-center gap-4 p-6 glass rounded-2xl">
            <Loader2 className="w-12 h-12 text-[#50C878] animate-spin" />
            <p className="text-[#2F2F2F] font-medium">스피너</p>
          </div>

          <div className="flex flex-col items-center gap-4 p-6 glass rounded-2xl">
            <div className="w-full bg-[#F5F5DC] rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#50C878] to-[#98FB98] animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
            <p className="text-[#2F2F2F] font-medium">프로그레스 바</p>
          </div>

          <div className="flex flex-col items-center gap-4 p-6 glass rounded-2xl">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-[#50C878] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div
                className="w-3 h-3 bg-[#98FB98] rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-3 h-3 bg-[#F8BBD9] rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
            <p className="text-[#2F2F2F] font-medium">점</p>
          </div>

          <div className="flex flex-col gap-4 p-6 glass rounded-2xl col-span-full">
            <div className="h-4 bg-[#F5F5DC] rounded animate-pulse"></div>
            <div className="h-4 bg-[#F5F5DC] rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-[#F5F5DC] rounded animate-pulse w-1/2"></div>
            <p className="text-[#2F2F2F] font-medium text-center mt-2">스켈레톤 로더</p>
          </div>

          <div className="flex flex-col items-center gap-4 p-6 glass rounded-2xl col-span-full">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-[#F5F5DC] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#50C878] rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-[#2F2F2F] font-medium">원형 스피너</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">로딩 상태</h2>
        <p className="text-[#6B6B6B]">5가지 로딩 인디케이터: 스피너, 프로그레스, 점, 스켈레톤, 원형</p>
      </div>
    </section>
  )
}
