"use client"

import { Button } from "../ui/button"
import { Sparkles, ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="space-y-6 md:space-y-8">
      <div className="glass-strong rounded-2xl md:rounded-3xl p-6 md:p-12 text-center space-y-4 md:space-y-6 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-[#98FB98]/20 border border-[#98FB98]/30">
          <Sparkles className="w-4 h-4 text-[#50C878]" />
          <span className="text-xs md:text-sm font-medium text-[#2F2F2F]">MindGarden에 오신 것을 환영합니다</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text leading-tight">
          마음을 가꾸고,
          <br />
          웰니스를 키워가세요
        </h1>

        <p className="text-base md:text-xl text-[#6B6B6B] max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
          당신의 여정을 진심으로 응원하는 전문 상담사와 함께하는 따뜻한 정신 건강 지원 공간입니다.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-[#50C878] hover:bg-[#3da860] active:bg-[#2d8f4d] text-white px-6 md:px-8 py-5 md:py-6 text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 min-h-[48px]"
          >
            시작하기
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-2 border-[#50C878] text-[#50C878] hover:bg-[#50C878]/10 active:bg-[#50C878]/20 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg rounded-xl bg-transparent min-h-[48px]"
          >
            자세히 알아보기
          </Button>
        </div>
      </div>

      <div className="text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2F2F2F] mb-2 md:mb-4">히어로 섹션</h2>
        <p className="text-sm md:text-base text-[#6B6B6B]">그라데이션 텍스트, 글라스모피즘 카드, 애니메이션 버튼</p>
      </div>
    </section>
  )
}
