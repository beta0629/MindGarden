"use client"

import HeroSection from "./components/HeroSection"
import StatsDashboard from "./components/StatsDashboard"
import ButtonShowcase from "./components/ButtonShowcase"
import CardShowcase from "./components/CardShowcase"
import FormShowcase from "./components/FormShowcase"
import LoadingShowcase from "./components/LoadingShowcase"
import ModalShowcase from "./components/ModalShowcase"
import ColorPalette from "./components/ColorPalette"
import "./mindgarden-styles.css"

export default function Home() {
  return (
    <div className="mindgarden-container">
      <HeroSection />
      <StatsDashboard />
      <ButtonShowcase />
      <CardShowcase />
      <FormShowcase />
      <LoadingShowcase />
      <ModalShowcase />
      <ColorPalette />
    </div>
  )
}
