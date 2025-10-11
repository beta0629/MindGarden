// MindGarden 테마 생성 스크립트
// 이 스크립트는 다양한 테마 프리셋을 생성하고 CSS 변수로 변환합니다.

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

// 테마를 CSS 변수로 변환하는 함수
function generateCSSVariables(theme) {
  return `
  /* ${theme.name} - ${theme.description} */
  --cream: ${theme.colors.cream};
  --warm-cream: ${theme.colors.warmCream};
  --beige: ${theme.colors.beige};
  --soft-beige: ${theme.colors.softBeige};
  --warm-beige: ${theme.colors.warmBeige};
  --olive-green: ${theme.colors.oliveGreen};
  --soft-olive: ${theme.colors.softOlive};
  --sage-olive: ${theme.colors.sageOlive};
  --mint-green: ${theme.colors.mintGreen};
  --soft-mint: ${theme.colors.softMint};
  --light-mint: ${theme.colors.lightMint};
  --dark-gray: ${theme.colors.darkGray};
  --medium-gray: ${theme.colors.mediumGray};
  --light-cream: ${theme.colors.lightCream};
  `
}

// 모든 테마 출력
console.log("=== MindGarden 테마 프리셋 ===\n")

Object.entries(themePresets).forEach(([key, theme]) => {
  console.log(`\n${theme.name}`)
  console.log(`설명: ${theme.description}`)
  console.log(`그라데이션: ${theme.gradient}`)
  console.log("\nCSS 변수:")
  console.log(generateCSSVariables(theme))
  console.log("\n" + "=".repeat(50))
})

// 테마 프리셋을 JSON으로 내보내기
console.log("\n\n=== JSON 형식 ===")
console.log(JSON.stringify(themePresets, null, 2))

export { themePresets, generateCSSVariables }
