"use client"

export function TypographyShowcase() {
  return (
    <section className="space-y-8">
      <div className="glass-strong rounded-3xl p-12 space-y-8 shadow-2xl">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-[#2F2F2F]">제목 1 - 60px</h1>
          <h2 className="text-5xl font-bold text-[#2F2F2F]">제목 2 - 48px</h2>
          <h3 className="text-4xl font-semibold text-[#2F2F2F]">제목 3 - 36px</h3>
          <h4 className="text-3xl font-semibold text-[#2F2F2F]">제목 4 - 30px</h4>
          <h5 className="text-2xl font-medium text-[#2F2F2F]">제목 5 - 24px</h5>
          <h6 className="text-xl font-medium text-[#2F2F2F]">제목 6 - 20px</h6>
        </div>

        <div className="space-y-4 pt-8 border-t border-[#2F2F2F]/10">
          <p className="text-lg text-[#2F2F2F] leading-relaxed">
            본문 대 - 18px: 편안한 줄 간격으로 읽기 쉬운 단락입니다. 정신 건강은 중요하며, 우리는 당신의 여정을 지원하기
            위해 여기 있습니다.
          </p>

          <p className="text-base text-[#2F2F2F] leading-relaxed">
            본문 보통 - 16px: 애플리케이션 전체에서 사용되는 표준 본문 텍스트 크기입니다. 모든 기기에서 뛰어난 가독성을
            제공합니다.
          </p>

          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            본문 소 - 14px: 보조 정보 및 캡션에 사용됩니다. 시각적으로 구별되면서도 가독성을 유지합니다.
          </p>
        </div>

        <div className="space-y-4 pt-8 border-t border-[#2F2F2F]/10">
          <blockquote className="border-l-4 border-[#50C878] pl-6 py-2 italic text-[#6B6B6B]">
            "정신 건강을 돌보는 것은 신체 건강을 돌보는 것만큼이나 중요합니다."
          </blockquote>

          <code className="block bg-[#2F2F2F] text-[#98FB98] p-4 rounded-lg font-mono text-sm">
            const mindGarden = new WellnessApp();
          </code>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">타이포그래피 시스템</h2>
        <p className="text-[#6B6B6B]">제목, 본문 텍스트, 인용구, 코드 블록</p>
      </div>
    </section>
  )
}
