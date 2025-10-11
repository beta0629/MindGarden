"use client"

import "../mindgarden-styles.css"

const ColorPalette = () => {
  const colors = [
    { name: "Cream", code: "#F5F5DC", var: "--cream" },
    { name: "Light Beige", code: "#FDF5E6", var: "--light-beige" },
    { name: "Cocoa", code: "#8B4513", var: "--cocoa" },
    { name: "Olive Green", code: "#808000", var: "--olive-green" },
    { name: "Mint Green", code: "#98FB98", var: "--mint-green" },
    { name: "Soft Mint", code: "#B6E5D8", var: "--soft-mint" },
  ]

  return (
    <section className="showcase-section">
      <div className="section-header">
        <h2 className="section-title">색상 팔레트</h2>
        <p className="section-description">MindGarden 디자인 시스템의 핵심 색상</p>
      </div>

      <div className="color-palette">
        {colors.map((color, index) => (
          <div key={index} className="color-swatch">
            <div className="color-box" style={{ backgroundColor: color.code }}></div>
            <div className="color-name">{color.name}</div>
            <div className="color-code">{color.code}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ColorPalette
