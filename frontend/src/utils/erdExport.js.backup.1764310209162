/**
 * ERD 내보내기 유틸리티
 * SVG를 PNG 또는 SVG 파일로 다운로드하는 기능 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

/**
 * SVG를 PNG로 변환하여 다운로드
 * @param {SVGElement|string} svg - SVG 엘리먼트 또는 SVG 문자열
 * @param {string} filename - 다운로드할 파일명 (확장자 제외)
 * @param {Object} options - 옵션 (width, height, scale)
 */
export const exportSvgToPng = async (svg, filename = 'erd-diagram', options = {}) => {
  try {
    const { width, height, scale = 2 } = options;
    
    // SVG 엘리먼트 가져오기
    let svgElement;
    if (typeof svg === 'string') {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
      svgElement = svgDoc.documentElement;
    } else {
      svgElement = svg.cloneNode(true);
    }

    // SVG 크기 가져오기
    const svgWidth = width || svgElement.getAttribute('width') || svgElement.viewBox?.baseVal?.width || 1200;
    const svgHeight = height || svgElement.getAttribute('height') || svgElement.viewBox?.baseVal?.height || 800;

    // SVG를 데이터 URL로 변환
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Canvas 생성
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Canvas 크기 설정 (스케일 적용)
          canvas.width = svgWidth * scale;
          canvas.height = svgHeight * scale;

          // 배경색 설정 (흰색)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 이미지 그리기
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // PNG로 변환하여 다운로드
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            URL.revokeObjectURL(svgUrl);
            resolve();
          }, 'image/png');
        } catch (error) {
          URL.revokeObjectURL(svgUrl);
          reject(error);
        }
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('SVG 이미지 로드 실패'));
      };

      img.src = svgUrl;
    });
  } catch (error) {
    console.error('SVG to PNG 변환 실패:', error);
    throw error;
  }
};

/**
 * SVG를 SVG 파일로 다운로드
 * @param {SVGElement|string} svg - SVG 엘리먼트 또는 SVG 문자열
 * @param {string} filename - 다운로드할 파일명 (확장자 제외)
 */
export const exportSvgToSvg = (svg, filename = 'erd-diagram') => {
  try {
    let svgData;
    
    if (typeof svg === 'string') {
      svgData = svg;
    } else {
      // SVG 엘리먼트를 문자열로 변환
      svgData = new XMLSerializer().serializeToString(svg);
    }

    // SVG 헤더 추가 (필요한 경우)
    if (!svgData.includes('<?xml')) {
      svgData = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgData;
    }

    // Blob 생성
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 다운로드
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('SVG 다운로드 실패:', error);
    throw error;
  }
};

/**
 * Mermaid 코드를 PNG로 내보내기
 * @param {string} mermaidCode - Mermaid 코드
 * @param {string} filename - 다운로드할 파일명
 * @param {Object} options - 옵션
 */
export const exportMermaidToPng = async (mermaidCode, filename = 'erd-diagram', options = {}) => {
  try {
    // Mermaid를 렌더링하여 SVG 가져오기
    const mermaid = (await import('mermaid')).default;
    
    // 고유 ID 생성
    const id = `mermaid-export-${Date.now()}`;
    
    // Mermaid 렌더링
    const { svg } = await mermaid.render(id, mermaidCode);
    
    // SVG를 PNG로 변환
    await exportSvgToPng(svg, filename, options);
  } catch (error) {
    console.error('Mermaid to PNG 변환 실패:', error);
    throw error;
  }
};

/**
 * Mermaid 코드를 SVG로 내보내기
 * @param {string} mermaidCode - Mermaid 코드
 * @param {string} filename - 다운로드할 파일명
 */
export const exportMermaidToSvg = async (mermaidCode, filename = 'erd-diagram') => {
  try {
    // Mermaid를 렌더링하여 SVG 가져오기
    const mermaid = (await import('mermaid')).default;
    
    // 고유 ID 생성
    const id = `mermaid-export-${Date.now()}`;
    
    // Mermaid 렌더링
    const { svg } = await mermaid.render(id, mermaidCode);
    
    // SVG 다운로드
    exportSvgToSvg(svg, filename);
  } catch (error) {
    console.error('Mermaid to SVG 변환 실패:', error);
    throw error;
  }
};

