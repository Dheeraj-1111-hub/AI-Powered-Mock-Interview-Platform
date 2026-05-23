import os
import shutil

moves = [
    ("frontend/src/services/auth.ts", "frontend/src/services/auth.service.ts"),
    ("frontend/src/services/api.ts", "frontend/src/services/api.service.ts")
]

for src, dst in moves:
    if os.path.exists(src):
        shutil.move(src, dst)
        print(f"Moved {src} to {dst}")
    else:
        print(f"Source {src} does not exist")
