"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { X, AlertCircle } from "lucide-react"

export function ModalShowcase() {
  const [basicModal, setBasicModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState(false)

  return (
    <section className="space-y-8">
      <div className="glass-strong rounded-3xl p-12 shadow-2xl">
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={() => setBasicModal(true)} className="bg-[#50C878] hover:bg-[#3da860] text-white">
            기본 모달 열기
          </Button>

          <Button onClick={() => setConfirmModal(true)} className="bg-[#F8BBD9] hover:bg-[#e5a8c6] text-white">
            확인 모달 열기
          </Button>
        </div>
      </div>

      {basicModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-slide-in-bottom">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#2F2F2F]">기본 모달</h3>
              <button
                onClick={() => setBasicModal(false)}
                className="text-[#6B6B6B] hover:text-[#2F2F2F] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-[#6B6B6B] mb-6 leading-relaxed">
              글라스모피즘 효과가 적용된 기본 모달입니다. 제목, 콘텐츠 영역, 닫기 버튼이 포함되어 있습니다.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setBasicModal(false)}
                className="flex-1 bg-[#50C878] hover:bg-[#3da860] text-white"
              >
                확인
              </Button>
              <Button
                onClick={() => setBasicModal(false)}
                variant="outline"
                className="flex-1 border-2 border-[#50C878] text-[#50C878] hover:bg-[#50C878]/10"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-slide-in-bottom">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#FF7F7F]/20 p-3 rounded-xl">
                <AlertCircle className="w-6 h-6 text-[#FF7F7F]" />
              </div>
              <h3 className="text-2xl font-bold text-[#2F2F2F]">작업 확인</h3>
            </div>

            <p className="text-[#6B6B6B] mb-6 leading-relaxed">
              이 작업을 진행하시겠습니까? 이 작업은 취소할 수 없습니다.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setConfirmModal(false)}
                className="flex-1 bg-[#FF7F7F] hover:bg-[#ff6666] text-white"
              >
                확인
              </Button>
              <Button
                onClick={() => setConfirmModal(false)}
                variant="outline"
                className="flex-1 border-2 border-[#6B6B6B] text-[#6B6B6B] hover:bg-[#6B6B6B]/10"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">모달 컴포넌트</h2>
        <p className="text-[#6B6B6B]">글라스모피즘이 적용된 기본 및 확인 모달</p>
      </div>
    </section>
  )
}
