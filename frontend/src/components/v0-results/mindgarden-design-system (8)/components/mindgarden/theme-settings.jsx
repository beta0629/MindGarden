"use client"

import { useState, useEffect } from "react"
import { Palette, Check, Download, Upload, RefreshCw } from "lucide-react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"

const themePresets = {
  mindgarden: {
    name: "MindGarden (기본)",
    description: "크림, 베이지, 올리브 그린, 민트 색상의 따뜻한 테마",
    colors: {
      cream: "#F5F5DC",
      warmCream: "#FDF5E6",
      beige: "#F5F5DC",
      softBeige: "#EDE8DC",
      warmBeige: "#E8DCC4",
      oliveGreen: "#808000",
      softOlive: "#9CAF88",
      sageOlive: "#B5A642",
      mintGreen: "#98FB98",
      softMint: "#B6E5D8",
      lightMint: "#D4F1E8",
      darkGray: "#2F2F2F",
      mediumGray: "#6B6B6B",
      lightCream: "#FFFEF7",
    },
    gradient: "from-[#FDF5E6] via-[#E8DCC4] to-[#B6E5D8]",
  },
  ocean: {
    name: "오션 블루",
    description: "시원한 바다 색상의 차분한 테마",
    colors: {
      cream: "#E8F4F8",
      warmCream: "#F0F8FF",
      beige: "#E0F2F7",
      softBeige: "#D4EBF2",
      warmBeige: "#C8E6F0",
      oliveGreen: "#00ACC1",
      softOlive: "#26A69A",
      sageOlive: "#00897B",
      mintGreen: "#4DD0E1",
      softMint: "#80DEEA",
      lightMint: "#B2EBF2",
      darkGray: "#263238",
      mediumGray: "#546E7A",
      lightCream: "#ECEFF1",
    },
    gradient: "from-[#E0F2F7] via-[#B2EBF2] to-[#80DEEA]",
  },
  sunset: {
    name: "선셋 오렌지",
    description: "따뜻한 노을 색상의 활기찬 테마",
    colors: {
      cream: "#FFF3E0",
      warmCream: "#FFF8E1",
      beige: "#FFECB3",
      softBeige: "#FFE0B2",
      warmBeige: "#FFD699",
      oliveGreen: "#FF9800",
      softOlive: "#FB8C00",
      sageOlive: "#F57C00",
      mintGreen: "#FFB74D",
      softMint: "#FFCC80",
      lightMint: "#FFE0B2",
      darkGray: "#3E2723",
      mediumGray: "#5D4037",
      lightCream: "#FFF8E1",
    },
    gradient: "from-[#FFE0B2] via-[#FFCC80] to-[#FFAB91]",
  },
  lavender: {
    name: "라벤더 드림",
    description: "부드러운 보라색의 우아한 테마",
    colors: {
      cream: "#F3E5F5",
      warmCream: "#FCE4EC",
      beige: "#F8BBD0",
      softBeige: "#F3E5F5",
      warmBeige: "#E1BEE7",
      oliveGreen: "#AB47BC",
      softOlive: "#9C27B0",
      sageOlive: "#8E24AA",
      mintGreen: "#CE93D8",
      softMint: "#E1BEE7",
      lightMint: "#F3E5F5",
      darkGray: "#4A148C",
      mediumGray: "#6A1B9A",
      lightCream: "#F3E5F5",
    },
    gradient: "from-[#F3E5F5] via-[#E1BEE7] to-[#CE93D8]",
  },
  forest: {
    name: "포레스트 그린",
    description: "자연의 초록색 테마",
    colors: {
      cream: "#F1F8E9",
      warmCream: "#F9FBE7",
      beige: "#E8F5E9",
      softBeige: "#DCEDC8",
      warmBeige: "#C5E1A5",
      oliveGreen: "#66BB6A",
      softOlive: "#4CAF50",
      sageOlive: "#388E3C",
      mintGreen: "#81C784",
      softMint: "#A5D6A7",
      lightMint: "#C8E6C9",
      darkGray: "#1B5E20",
      mediumGray: "#2E7D32",
      lightCream: "#F1F8E9",
    },
    gradient: "from-[#E8F5E9] via-[#C8E6C9] to-[#A5D6A7]",
  },
}

export function ThemeSettings({ onThemeChange }) {
  const [selectedTheme, setSelectedTheme] = useState("mindgarden")
  const [customColors, setCustomColors] = useState(themePresets.mindgarden.colors)
  const [isCustomMode, setIsCustomMode] = useState(false)

  const applyTheme = (themeKey) => {
    const theme = themePresets[themeKey]
    if (!theme) return

    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = key.replace(/([A-Z])/g, "-$1").toLowerCase()
      root.style.setProperty(`--${cssVarName}`, value)
    })

    setSelectedTheme(themeKey)
    setCustomColors(theme.colors)
    setIsCustomMode(false)

    if (onThemeChange) {
      onThemeChange(theme.gradient)
    }

    localStorage.setItem("mindgarden-theme", themeKey)
  }

  const applyCustomColors = () => {
    const root = document.documentElement

    Object.entries(customColors).forEach(([key, value]) => {
      const cssVarName = key.replace(/([A-Z])/g, "-$1").toLowerCase()
      root.style.setProperty(`--${cssVarName}`, value)
    })

    setIsCustomMode(true)
    localStorage.setItem("mindgarden-custom-colors", JSON.stringify(customColors))
  }

  const handleColorChange = (colorKey, value) => {
    setCustomColors((prev) => ({
      ...prev,
      [colorKey]: value,
    }))
  }

  const exportTheme = () => {
    const themeData = {
      name: "커스텀 테마",
      colors: customColors,
    }
    const blob = new Blob([JSON.stringify(themeData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mindgarden-theme.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const importTheme = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const themeData = JSON.parse(e.target?.result)
        if (themeData.colors) {
          setCustomColors(themeData.colors)
          setIsCustomMode(true)
        }
      } catch (error) {
        console.error("테마 파일을 불러올 수 없습니다:", error)
      }
    }
    reader.readAsText(file)
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("mindgarden-theme")
    const savedCustomColors = localStorage.getItem("mindgarden-custom-colors")

    if (savedCustomColors) {
      try {
        const colors = JSON.parse(savedCustomColors)
        setCustomColors(colors)
        setIsCustomMode(true)
        const root = document.documentElement
        Object.entries(colors).forEach(([key, value]) => {
          const cssVarName = key.replace(/([A-Z])/g, "-$1").toLowerCase()
          root.style.setProperty(`--${cssVarName}`, value)
        })
      } catch (error) {
        console.error("저장된 커스텀 색상을 불러올 수 없습니다:", error)
      }
    } else if (savedTheme && themePresets[savedTheme]) {
      applyTheme(savedTheme)
    }
  }, [])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-2xl border-2 border-[#808000] hover:scale-110 active:scale-95 transition-transform z-[100] bg-white hover:bg-[#808000] hover:text-white"
        >
          <Palette className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl">테마 설정</DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            원하는 테마를 선택하거나 커스텀 색상을 만들어보세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4">프리셋 테마</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {Object.entries(themePresets).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => applyTheme(key)}
                  className={`p-4 rounded-lg border-2 transition-all text-left min-h-[80px] active:scale-95 ${
                    selectedTheme === key && !isCustomMode
                      ? "border-[#808000] bg-[#808000]/10"
                      : "border-gray-200 hover:border-[#808000]/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-sm md:text-base">{theme.name}</h4>
                      <p className="text-xs md:text-sm text-gray-600">{theme.description}</p>
                    </div>
                    {selectedTheme === key && !isCustomMode && (
                      <Check className="w-5 h-5 text-[#808000] flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex gap-1.5 md:gap-2 mt-3 flex-wrap">
                    {Object.values(theme.colors)
                      .slice(0, 8)
                      .map((color, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-base md:text-lg font-semibold">커스텀 색상</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("theme-import")?.click()}
                  className="flex-1 sm:flex-none min-h-[44px]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  가져오기
                </Button>
                <input id="theme-import" type="file" accept=".json" className="hidden" onChange={importTheme} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTheme}
                  className="flex-1 sm:flex-none min-h-[44px] bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  내보내기
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {Object.entries(customColors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs md:text-sm capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-12 md:w-16 h-10 md:h-10 p-1 cursor-pointer flex-shrink-0"
                    />
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="flex-1 text-xs md:text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button onClick={applyCustomColors} className="flex-1 min-h-[44px]">
                <RefreshCw className="w-4 h-4 mr-2" />
                커스텀 색상 적용
              </Button>
              <Button variant="outline" onClick={() => applyTheme("mindgarden")} className="min-h-[44px]">
                초기화
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
