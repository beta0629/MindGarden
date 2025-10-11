"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Brain, Heart, Users } from "lucide-react"

export function CardShowcase() {
  return (
    <section className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-[#F5F5DC] border-[#2F2F2F]/10">
          <CardHeader>
            <CardTitle className="text-[#2F2F2F] text-lg md:text-xl">기본 카드</CardTitle>
            <CardDescription className="text-[#6B6B6B] text-sm">테두리가 있는 표준 카드</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[#2F2F2F] text-sm md:text-base">크림 배경의 기본 카드 컴포넌트입니다.</p>
          </CardContent>
        </Card>

        <div className="glass rounded-xl md:rounded-2xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <div className="bg-[#50C878]/10 p-2.5 md:p-3 rounded-lg md:rounded-xl">
              <Brain className="w-5 h-5 md:w-6 md:h-6 text-[#50C878]" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-[#2F2F2F]">글라스 카드</h3>
          </div>
          <p className="text-[#6B6B6B] text-sm md:text-base">배경 흐림 효과와 투명도를 가진 글라스모피즘 효과입니다.</p>
        </div>

        <div className="glass-strong rounded-xl md:rounded-2xl p-5 md:p-6 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 active:scale-95">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <div className="bg-[#F8BBD9]/20 p-2.5 md:p-3 rounded-lg md:rounded-xl">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-[#F8BBD9]" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-[#2F2F2F]">플로팅 카드</h3>
          </div>
          <p className="text-[#6B6B6B] text-sm md:text-base">호버하면 플로팅 애니메이션 효과를 볼 수 있습니다.</p>
        </div>

        <div className="bg-gradient-to-br from-[#50C878] to-[#98FB98] rounded-xl md:rounded-2xl p-5 md:p-6 shadow-xl text-white">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <Users className="w-7 h-7 md:w-8 md:h-8" />
            <h3 className="text-lg md:text-xl font-semibold">그라데이션 카드</h3>
          </div>
          <p className="text-white/90 text-sm md:text-base">
            에메랄드에서 민트로 이어지는 그라데이션 배경의 카드입니다.
          </p>
        </div>

        <div className="bg-[#FFF8DC] border-2 border-[#50C878] rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg">
          <h3 className="text-lg md:text-xl font-semibold text-[#2F2F2F] mb-2">테두리 카드</h3>
          <p className="text-[#6B6B6B] text-sm md:text-base">에메랄드 테두리가 있는 바닐라 크림 배경입니다.</p>
        </div>

        <div className="glass rounded-xl md:rounded-2xl p-5 md:p-6 shadow-xl animate-pulse-glow">
          <h3 className="text-lg md:text-xl font-semibold text-[#2F2F2F] mb-2">애니메이션 카드</h3>
          <p className="text-[#6B6B6B] text-sm md:text-base">펄스 글로우 애니메이션 효과가 있는 카드입니다.</p>
        </div>
      </div>

      <div className="text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2F2F2F] mb-2 md:mb-4">카드 컴포넌트</h2>
        <p className="text-sm md:text-base text-[#6B6B6B]">다양한 스타일과 효과를 가진 6가지 카드 변형</p>
      </div>
    </section>
  )
}
