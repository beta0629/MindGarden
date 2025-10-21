#!/usr/bin/env python3
"""
alert()와 confirm()을 notificationManager로 변경하는 스크립트
"""
import re
import sys
from pathlib import Path

def has_notification_import(content):
    """notificationManager import가 있는지 확인"""
    return 'notificationManager' in content

def add_notification_import(content):
    """notificationManager import 추가"""
    # React import 다음에 추가
    react_import_pattern = r"(import React[^;]+;)"
    
    # 이미 import가 있으면 추가하지 않음
    if has_notification_import(content):
        return content
    
    # React import 찾기
    match = re.search(react_import_pattern, content)
    if match:
        import_line = match.group(1)
        # 다른 import들이 있는지 확인
        lines = content.split('\n')
        insert_index = 0
        for i, line in enumerate(lines):
            if line.strip().startswith('import'):
                insert_index = i + 1
            elif line.strip() and not line.strip().startswith('import') and not line.strip().startswith('//'):
                break
        
        lines.insert(insert_index, "import notificationManager from '../../utils/notification';")
        return '\n'.join(lines)
    
    return content

def replace_simple_alert(content):
    """단순 alert() 변경"""
    # alert('메시지') -> notificationManager.show('메시지', 'info')
    pattern = r"\balert\(['\"]([^'\"]+)['\"]\)"
    replacement = r"notificationManager.show('\1', 'info')"
    return re.sub(pattern, replacement, content)

def replace_window_alert(content):
    """window.alert() 변경"""
    pattern = r"\bwindow\.alert\(['\"]([^'\"]+)['\"]\)"
    replacement = r"notificationManager.show('\1', 'info')"
    return re.sub(pattern, replacement, content)

def replace_simple_confirm(content):
    """단순 confirm() 변경 - 함수 내부에서만"""
    # if (!confirm('메시지')) return; 패턴
    pattern = r"if\s*\(\s*!(?:window\.)?confirm\(['\"]([^'\"]+)['\"]\)\s*\)\s*return;"
    
    def replace_func(match):
        message = match.group(1)
        return f"""const confirmed = await new Promise((resolve) => {{
      notificationManager.confirm('{message}', resolve);
    }});
    if (!confirmed) return;"""
    
    return re.sub(pattern, replace_func, content)

def replace_confirm_with_variable(content):
    """변수에 할당하는 confirm() 변경"""
    # const result = confirm('메시지')
    pattern = r"(const|let|var)\s+(\w+)\s*=\s*(?:window\.)?confirm\(['\"]([^'\"]+)['\"]\)"
    
    def replace_func(match):
        var_type = match.group(1)
        var_name = match.group(2)
        message = match.group(3)
        return f"""{var_type} {var_name} = await new Promise((resolve) => {{
      notificationManager.confirm('{message}', resolve);
    }})"""
    
    return re.sub(pattern, replace_func, content)

def process_file(file_path):
    """파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # alert와 confirm이 있는지 확인
        has_alert = re.search(r'\balert\(', content) or re.search(r'\bwindow\.alert\(', content)
        has_confirm = re.search(r'\bconfirm\(', content) or re.search(r'\bwindow\.confirm\(', content)
        
        if not has_alert and not has_confirm:
            return False, "No alert or confirm found"
        
        # notificationManager import 추가
        if has_alert or has_confirm:
            content = add_notification_import(content)
        
        # 변경 적용
        content = replace_simple_alert(content)
        content = replace_window_alert(content)
        content = replace_simple_confirm(content)
        content = replace_confirm_with_variable(content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "Updated"
        
        return False, "No changes needed"
        
    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    if len(sys.argv) < 2:
        print("Usage: python replace_alerts.py <file1> <file2> ...")
        sys.exit(1)
    
    for file_path in sys.argv[1:]:
        path = Path(file_path)
        if not path.exists():
            print(f"❌ {file_path}: File not found")
            continue
        
        success, message = process_file(path)
        if success:
            print(f"✅ {file_path}: {message}")
        else:
            print(f"⚠️  {file_path}: {message}")

if __name__ == '__main__':
    main()

