import os
import re

root_dir = "backend/src"

replacements = {
    r"from '\.\.\/middlewares\/": "from '../middleware/",
    r"from '\.\/routes\/": "from './routes/",
}

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    # Update route imports in app.ts specifically
    if file_path.endswith("app.ts"):
        content = re.sub(r"from '\.\/routes\/(.+)'", r"from './routes/\1.routes'", content)
    
    # General replacements
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated imports in {file_path}")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.ts'):
            fix_imports(os.path.join(root, file))
