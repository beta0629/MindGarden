"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function ColorPaletteShowcase() {
  const [copiedColor, setCopiedColor] = useState(null)

  const colors = [
    { name: "크림", hex: "#F5F5DC", category: "주요" },
    { name: "웜 크림", hex: "#FDF5E6", category: "주요" },
    { name: "베이지", hex: "#F5F5DC", category: "주요" },
    { name: "소프트 베이지", hex: "#EDE8DC", category: "주요" },
    { name: "웜 베이지", hex: "#E8DCC4", category: "주요" },
    { name: "올리브 그린", hex: "#808000", category: "강조" },
    { name: "소프트 올리브", hex: "#9CAF88", category: "강조" },
    { name: "세이지 올리브", hex: "#B5A642", category: "강조" },
    { name: "민트 그린", hex: "#98FB98", category: "강조" },
    { name: "소프트 민트", hex: "#B6E5D8", category: "강조" },
    { name: "라이트 민트", hex: "#D4F1E8", category: "강조" },
    { name: "다크 그레이", hex: "#2F2F2F", category: "텍스트" },
    { name: "미디엄 그레이", hex: "#6B6B6B", category: "텍스트" },
    { name: "라이트 크림", hex: "#FFFEF7", category: "텍스트" },
  ]

  const copyToClipboard = (hex, name) => {
    navigator.clipboard.writeText(hex)
    setCopiedColor(name)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const categories = ["주요", "강조", "텍스트"]

  return (
    <section className="space-y-8">
      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h3 className="text-2xl font-bold text-[#2F2F2F]">{category} 색상</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colors
              .filter((color) => color.category === category)
              .map((color) => (
                <button
                  key={color.name}
                  onClick={() => copyToClipboard(color.hex, color.name)}
                  className="glass-strong rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 group min-h-[160px]"
                >
                  <div className="w-full h-24 rounded-xl mb-4 shadow-lg" style={{ backgroundColor: color.hex }}></div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#2F2F2F]">{color.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#6B6B6B] font-mono">{color.hex}</p>
                      {copiedColor === color.name ? (
                        <Check className="w-4 h-4 text-[#808000]" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#6B6B6B] opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}

      <div className="text-center pt-8">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">색상 팔레트</h2>
        <p className="text-[#6B6B6B]">복사 기능이 있는 완전한 MindGarden 색상 시스템</p>
      </div>
    </section>
  )
}
