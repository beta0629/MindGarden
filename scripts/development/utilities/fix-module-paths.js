#!/usr/bin/env node

/**
 * 모듈 경로 오류를 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixModulePaths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // 일반적인 경로 수정 패턴들
    const pathFixes = [
        // ErpCard 관련
        { from: "../../common/ErpCard", to: "../common/ErpCard" },
        { from: "../../common/ErpButton", to: "../common/ErpButton" },
        { from: "../../common/ErpHeader", to: "../common/ErpHeader" },
        { from: "../../common/ErpModal", to: "../common/ErpModal" },
        
        // iPhone 17 컴포넌트들
        { from: "../../common/IPhone17Card", to: "../common/IPhone17Card" },
        { from: "../../common/IPhone17Button", to: "../common/IPhone17Button" },
        { from: "../../common/IPhone17Modal", to: "../common/IPhone17Modal" },
        { from: "../../common/IPhone17PageHeader", to: "../common/IPhone17PageHeader" },
        
        // 기타 공통 컴포넌트들
        { from: "../../common/CommonPageTemplate", to: "../common/CommonPageTemplate" },
        { from: "../../common/UnifiedHeader", to: "../common/UnifiedHeader" },
        { from: "../../common/UnifiedNotification", to: "../common/UnifiedNotification" },
        { from: "../../common/UnifiedLoading", to: "../common/UnifiedLoading" },
        
        // 상위 경로 수정 (../../../ -> ../../)
        { from: "../../../common/", to: "../../common/" },
        { from: "../../../constants/", to: "../../constants/" },
        { from: "../../../utils/", to: "../../utils/" },
        { from: "../../../hooks/", to: "../../hooks/" },
        
        // 하위 경로 수정 (../ -> ./)
        { from: "../common/", to: "./common/" },
        { from: "../constants/", to: "./constants/" },
        { from: "../utils/", to: "./utils/" },
        { from: "../hooks/", to: "./hooks/" }
    ];
    
    for (const fix of pathFixes) {
        const regex = new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (content.includes(fix.from)) {
            newContent = newContent.replace(regex, fix.to);
            hasChanges = true;
            console.log(`🔄 경로 수정: ${fix.from} → ${fix.to} in ${filePath}`);
        }
    }
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 모듈 경로 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllModulePaths() {
    console.log('🔧 모듈 경로 수정 시작...\n');
    
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
                if (fixModulePaths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 모듈 경로 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllModulePaths();
}

module.exports = { fixModulePaths, fixAllModulePaths };

