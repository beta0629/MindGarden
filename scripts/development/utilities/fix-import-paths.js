#!/usr/bin/env node

/**
 * Import 경로 수정 스크립트
 * 마이그레이션 후 잘못된 import 경로들을 올바르게 수정
 */

const fs = require('fs');
const path = require('path');

// 각 폴더별 올바른 경로 매핑
const FOLDER_PATH_MAPPING = {
    'components/auth': '../common',
    'components/admin': '../common',
    'components/client': '../common',
    'components/consultant': '../common',
    'components/consultation': '../common',
    'components/compliance': '../common',
    'components/dashboard': '../common',
    'components/erp': '../common',
    'components/finance': '../common',
    'components/hq': '../common',
    'components/homepage': '../common',
    'components/layout': '../common',
    'components/mypage': '../common',
    'components/samples': '../common',
    'components/schedule': '../common',
    'components/statistics': '../common',
    'components/super-admin': '../common',
    'components/test': '../common',
    'components/base': '../common',
    'components/common': '.',
    'pages': '../components/common'
};

// 수정할 import 패턴들
const IMPORT_PATTERNS = [
    'IPhone17Card',
    'IPhone17Button', 
    'IPhone17Modal',
    'IPhone17PageHeader',
    'CommonPageTemplate',
    'UnifiedHeader',
    'UnifiedNotification'
];

function fixImportPaths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // 파일의 폴더 경로 확인
    const relativePath = path.relative(path.join(__dirname, '../frontend/src'), filePath);
    const folderPath = path.dirname(relativePath);
    
    // 해당 폴더의 올바른 경로 가져오기
    const correctPath = FOLDER_PATH_MAPPING[folderPath] || '../common';
    
    // 각 import 패턴에 대해 수정
    IMPORT_PATTERNS.forEach(pattern => {
        const wrongPattern = new RegExp(`from ['"]\\.\\.?/.*?/common/${pattern}['"]`, 'g');
        const correctImport = `from '${correctPath}/${pattern}'`;
        
        const replaced = newContent.replace(wrongPattern, correctImport);
        if (replaced !== newContent) {
            newContent = replaced;
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 수정됨: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllImportPaths() {
    console.log('🔧 Import 경로 수정 시작...\n');
    
    const srcDir = path.join(__dirname, '../frontend/src');
    let totalFiles = 0;
    let fixedFiles = 0;
    
    function processDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                processDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                totalFiles++;
                if (fixImportPaths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 Import 경로 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllImportPaths();
}

module.exports = { fixImportPaths, fixAllImportPaths };

