const fs = require('fs');
const path = require('path');

// CSS 파일 경로
const cssFilePath = path.join(__dirname, '../src/components/admin/mapping/ConsultantTransferModal.css');
const jsFilePath = path.join(__dirname, '../src/components/admin/mapping/ConsultantTransferModal.js');

// 클래스명 매핑
const classMappings = {
  'transfer-modal-overlay': 'mg-v2-transfer-modal-overlay',
  'transfer-modal': 'mg-v2-transfer-modal',
  'transfer-modal-header': 'mg-v2-transfer-modal-header',
  'transfer-modal-title': 'mg-v2-transfer-modal-title',
  'transfer-modal-close': 'mg-v2-transfer-modal-close',
  'transfer-modal-content': 'mg-v2-transfer-modal-content',
  'transfer-section-title': 'mg-v2-transfer-section-title',
  'transfer-current-info': 'mg-v2-transfer-current-info',
  'transfer-info-card': 'mg-v2-transfer-info-card',
  'transfer-info-item': 'mg-v2-transfer-info-item',
  'transfer-info-label': 'mg-v2-transfer-info-label',
  'transfer-info-value': 'mg-v2-transfer-info-value',
  'transfer-form': 'mg-v2-transfer-form',
  'transfer-form-group': 'mg-v2-transfer-form-group',
  'transfer-form-row': 'mg-v2-transfer-form-row',
  'transfer-form-label': 'mg-v2-transfer-form-label',
  'transfer-form-input': 'mg-v2-transfer-form-input',
  'transfer-form-select': 'mg-v2-transfer-form-select',
  'transfer-form-textarea': 'mg-v2-transfer-form-textarea',
  'transfer-form-error': 'mg-v2-transfer-form-error',
  'transfer-btn': 'mg-v2-transfer-btn',
  'transfer-btn-primary': 'mg-v2-transfer-btn-primary',
  'transfer-btn-secondary': 'mg-v2-transfer-btn-secondary',
  'transfer-btn-danger': 'mg-v2-transfer-btn-danger',
  'transfer-modal-footer': 'mg-v2-transfer-modal-footer'
};

// CSS 파일 수정
function updateCSSFile() {
  let cssContent = fs.readFileSync(cssFilePath, 'utf8');
  
  // 클래스명 변경
  Object.entries(classMappings).forEach(([oldClass, newClass]) => {
    const regex = new RegExp(`\\.${oldClass}\\b`, 'g');
    cssContent = cssContent.replace(regex, `.${newClass}`);
  });
  
  fs.writeFileSync(cssFilePath, cssContent);
  console.log('CSS 파일 업데이트 완료');
}

// JS 파일 수정
function updateJSFile() {
  let jsContent = fs.readFileSync(jsFilePath, 'utf8');
  
  // 클래스명 변경
  Object.entries(classMappings).forEach(([oldClass, newClass]) => {
    const regex = new RegExp(`className="[^"]*\\b${oldClass}\\b[^"]*"`, 'g');
    jsContent = jsContent.replace(regex, (match) => {
      return match.replace(new RegExp(`\\b${oldClass}\\b`, 'g'), newClass);
    });
    
    const regex2 = new RegExp(`className='[^']*\\b${oldClass}\\b[^']*'`, 'g');
    jsContent = jsContent.replace(regex2, (match) => {
      return match.replace(new RegExp(`\\b${oldClass}\\b`, 'g'), newClass);
    });
  });
  
  fs.writeFileSync(jsFilePath, jsContent);
  console.log('JS 파일 업데이트 완료');
}

// 실행
updateCSSFile();
updateJSFile();
console.log('ConsultantTransferModal 클래스명 변경 완료!');
