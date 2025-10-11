"use client"

import { Button } from "../ui/button"
import { Heart, Download, Trash2, Loader2 } from "lucide-react"

export function ButtonShowcase() {
  return (
    <section className="space-y-6 md:space-y-8">
      <div className="glass-strong rounded-2xl md:rounded-3xl p-6 md:p-12 space-y-6 md:space-y-8 shadow-2xl">
        <div className="space-y-4 md:space-y-6">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-[#2F2F2F] mb-3 md:mb-4">주요 버튼</h3>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Button className="bg-[#50C878] hover:bg-[#3da860] active:bg-[#2d8f4d] text-white min-h-[44px]">
                주요 버튼
              </Button>
              <Button className="bg-[#50C878] hover:bg-[#3da860] active:bg-[#2d8f4d] text-white min-h-[44px]" size="lg">
                큰 주요 버튼
              </Button>
              <Button className="bg-[#50C878] hover:bg-[#3da860] active:bg-[#2d8f4d] text-white min-h-[44px]" size="sm">
                작은 주요 버튼
              </Button>
              <Button className="bg-[#50C878] hover:bg-[#3da860] active:bg-[#2d8f4d] text-white min-h-[44px]">
                <Heart className="mr-2 w-4 h-4" />
                아이콘 포함
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-[#2F2F2F] mb-3 md:mb-4">보조 버튼</h3>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Button className="bg-[#B6E5D8] hover:bg-[#98d4c4] active:bg-[#7ac3b0] text-[#2F2F2F] min-h-[44px]">
                보조 버튼
              </Button>
              <Button className="bg-[#B6E5D8] hover:bg-[#98d4c4] active:bg-[#7ac3b0] text-[#2F2F2F] min-h-[44px]">
                <Download className="mr-2 w-4 h-4" />
                다운로드
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-[#2F2F2F] mb-3 md:mb-4">외곽선 버튼</h3>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Button
                variant="outline"
                className="border-2 border-[#50C878] text-[#50C878] hover:bg-[#50C878]/10 active:bg-[#50C878]/20 bg-transparent min-h-[44px]"
              >
                외곽선 버튼
              </Button>
              <Button
                variant="outline"
                className="border-2 border-[#F8BBD9] text-[#F8BBD9] hover:bg-[#F8BBD9]/10 active:bg-[#F8BBD9]/20 bg-transparent min-h-[44px]"
              >
                핑크 외곽선
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-[#2F2F2F] mb-3 md:mb-4">삭제 및 로딩</h3>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Button className="bg-[#FF7F7F] hover:bg-[#ff6666] active:bg-[#ff4d4d] text-white min-h-[44px]">
                <Trash2 className="mr-2 w-4 h-4" />
                삭제
              </Button>
              <Button disabled className="bg-[#50C878] text-white min-h-[44px]">
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                로딩 중...
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-[#2F2F2F] mb-3 md:mb-4">고스트 및 링크 버튼</h3>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Button
                variant="ghost"
                className="text-[#50C878] hover:bg-[#50C878]/10 active:bg-[#50C878]/20 min-h-[44px]"
              >
                고스트 버튼
              </Button>
              <Button variant="link" className="text-[#50C878] min-h-[44px]">
                링크 버튼
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2F2F2F] mb-2 md:mb-4">버튼 컴포넌트</h2>
        <p className="text-sm md:text-base text-[#6B6B6B]">다양한 크기와 상태를 가진 8가지 버튼 변형</p>
      </div>
    </section>
  )
}
