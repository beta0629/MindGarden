"use client"

export function ChartShowcase() {
  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-[#2F2F2F] mb-4">막대 차트</h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {[65, 85, 45, 90, 70, 55, 80].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-[#50C878] to-[#98FB98] rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-[#6B6B6B]">{["월", "화", "수", "목", "금", "토", "일"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-[#2F2F2F] mb-4">선 차트</h3>
          <div className="h-48 flex items-end">
            <svg viewBox="0 0 300 150" className="w-full h-full">
              <polyline
                points="0,100 50,80 100,90 150,60 200,70 250,40 300,50"
                fill="none"
                stroke="#50C878"
                strokeWidth="3"
                className="drop-shadow-lg"
              />
              <polyline points="0,100 50,80 100,90 150,60 200,70 250,40 300,50" fill="url(#gradient)" opacity="0.2" />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#50C878" />
                  <stop offset="100%" stopColor="#50C878" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-[#2F2F2F] mb-4">파이 차트</h3>
          <div className="flex items-center justify-center h-48">
            <svg viewBox="0 0 200 200" className="w-48 h-48">
              <circle cx="100" cy="100" r="80" fill="#50C878" />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="#98FB98"
                strokeDasharray="251 251"
                strokeDashoffset="62.75"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="#F8BBD9"
                strokeDasharray="251 251"
                strokeDashoffset="125.5"
                transform="rotate(0 100 100)"
              />
            </svg>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#50C878]"></div>
              <span className="text-sm text-[#6B6B6B]">활성</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#98FB98]"></div>
              <span className="text-sm text-[#6B6B6B]">대기</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F8BBD9]"></div>
              <span className="text-sm text-[#6B6B6B]">완료</span>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-[#2F2F2F] mb-4">도넛 차트</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#50C878"
                  strokeWidth="30"
                  strokeDasharray="377 377"
                  strokeDashoffset="94.25"
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#98FB98"
                  strokeWidth="30"
                  strokeDasharray="377 377"
                  strokeDashoffset="188.5"
                  transform="rotate(0 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#F8BBD9"
                  strokeWidth="30"
                  strokeDasharray="377 377"
                  strokeDashoffset="282.75"
                  transform="rotate(90 100 100)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#2F2F2F]">248</div>
                  <div className="text-sm text-[#6B6B6B]">전체</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">차트 컴포넌트</h2>
        <p className="text-[#6B6B6B]">MindGarden 색상의 막대, 선, 파이, 도넛 차트</p>
      </div>
    </section>
  )
}
