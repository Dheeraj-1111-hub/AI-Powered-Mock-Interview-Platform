import os
import re

root_dir = "frontend/src"

replacements = {
    r"\.\.\/components\/layout\/Navbar": "../components/shared/Navbar",
    r"\.\.\/components\/layout\/Footer": "../components/shared/Footer",
    r"\.\.\/components\/InterviewGenerator": "../components/interview/InterviewGenerator",
    r"\.\.\/components\/EvaluationPanel": "../components/feedback/EvaluationPanel",
    r"\.\.\/components\/ResumeAnalyzer": "../components/resume/ResumeAnalyzer",
    r"\.\.\/services\/auth": "../services/auth.service",
    r"\.\.\/services\/api": "../services/api.service",
    r"\.\/services\/auth": "./services/auth.service",
    r"\.\/services\/api": "./services/api.service",
}

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated imports in {file_path}")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            fix_imports(os.path.join(root, file))
