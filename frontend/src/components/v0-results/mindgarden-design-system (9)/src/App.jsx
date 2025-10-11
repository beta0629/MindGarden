"use client"

import { useState } from "react"
import {
  Heart,
  Users,
  Calendar,
  TrendingUp,
  Sparkles,
  Brain,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Home,
  User,
  BarChart3,
  PieChart,
  Activity,
  Menu,
  X,
} from "lucide-react"
import { HeroSection } from "../components/mindgarden/hero-section"
import { StatsDashboard } from "../components/mindgarden/stats-dashboard"
import { TypographyShowcase } from "../components/mindgarden/typography-showcase"
import { ButtonShowcase } from "../components/mindgarden/button-showcase"
import { CardShowcase } from "../components/mindgarden/card-showcase"
import { FormShowcase } from "../components/mindgarden/form-showcase"
import { ModalShowcase } from "../components/mindgarden/modal-showcase"
import { LoadingShowcase } from "../components/mindgarden/loading-showcase"
import { ClientCardShowcase } from "../components/mindgarden/client-card-showcase"
import { ChartShowcase } from "../components/mindgarden/chart-showcase"
import { NavigationShowcase } from "../components/mindgarden/navigation-showcase"
import { NotificationShowcase } from "../components/mindgarden/notification-showcase"
import { TableShowcase } from "../components/mindgarden/table-showcase"
import { CalendarShowcase } from "../components/mindgarden/calendar-showcase"
import { AccordionShowcase } from "../components/mindgarden/accordion-showcase"
import { ColorPaletteShowcase } from "../components/mindgarden/color-palette-showcase"
import { ThemeSettings } from "../components/mindgarden/theme-settings"
import { Button } from "../components/ui/button"

function App() {
  const [activeSection, setActiveSection] = useState("hero")
  const [backgroundGradient, setBackgroundGradient] = useState("from-[#F5F5DC] via-[#FDF5E6] to-[#B6E5D8]")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const sections = [
    { id: "hero", name: "히어로 섹션", icon: Sparkles },
    { id: "stats", name: "통계 대시보드", icon: BarChart3 },
    { id: "typography", name: "타이포그래피", icon: MessageCircle },
    { id: "buttons", name: "버튼", icon: CheckCircle },
    { id: "cards", name: "카드", icon: Brain },
    { id: "forms", name: "폼", icon: User },
    { id: "modals", name: "모달", icon: Info },
    { id: "loading", name: "로딩 상태", icon: Loader2 },
    { id: "clients", name: "내담자 카드", icon: Users },
    { id: "charts", name: "차트", icon: PieChart },
    { id: "navigation", name: "네비게이션", icon: Home },
    { id: "notifications", name: "알림", icon: AlertCircle },
    { id: "tables", name: "테이블", icon: Activity },
    { id: "calendar", name: "캘린더", icon: Calendar },
    { id: "accordion", name: "아코디언", icon: TrendingUp },
    { id: "colors", name: "색상 팔레트", icon: Heart },
  ]

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className={`mindgarden-design-system min-h-screen ${backgroundGradient} transition-colors duration-500`}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-[110] lg:hidden h-12 w-12 rounded-full shadow-lg bg-white border-2 border-[#808000] hover:bg-[#808000] hover:text-white"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-[90] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 glass-strong border-r border-white/30 overflow-y-auto z-[100] transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="lg:hidden h-12" />
          <h1 className="text-2xl font-bold gradient-text mb-2">MindGarden</h1>
          <p className="text-sm text-[#6B6B6B] mb-6">디자인 시스템</p>

          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px] ${
                    activeSection === section.id
                      ? "bg-[#808000] text-white shadow-lg"
                      : "text-[#2F2F2F] hover:bg-white/50 active:bg-white/70"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{section.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      <main className="lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
          {activeSection === "hero" && <HeroSection />}
          {activeSection === "stats" && <StatsDashboard />}
          {activeSection === "typography" && <TypographyShowcase />}
          {activeSection === "buttons" && <ButtonShowcase />}
          {activeSection === "cards" && <CardShowcase />}
          {activeSection === "forms" && <FormShowcase />}
          {activeSection === "modals" && <ModalShowcase />}
          {activeSection === "loading" && <LoadingShowcase />}
          {activeSection === "clients" && <ClientCardShowcase />}
          {activeSection === "charts" && <ChartShowcase />}
          {activeSection === "navigation" && <NavigationShowcase />}
          {activeSection === "notifications" && <NotificationShowcase />}
          {activeSection === "tables" && <TableShowcase />}
          {activeSection === "calendar" && <CalendarShowcase />}
          {activeSection === "accordion" && <AccordionShowcase />}
          {activeSection === "colors" && <ColorPaletteShowcase />}
        </div>
      </main>

      <ThemeSettings onThemeChange={setBackgroundGradient} />
    </div>
  )
}

export default App
