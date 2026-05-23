import os
import shutil

moves = [
    ("frontend/src/App.tsx", "frontend/src/app/App.tsx"),
    ("frontend/src/main.tsx", "frontend/src/app/main.tsx"),
    ("frontend/src/index.css", "frontend/src/styles/index.css")
]

for src, dst in moves:
    if os.path.exists(src):
        shutil.move(src, dst)
        print(f"Moved {src} to {dst}")
    else:
        print(f"Source {src} does not exist")
