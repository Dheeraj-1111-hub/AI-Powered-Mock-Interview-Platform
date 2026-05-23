import os
import shutil

moves = [
    ("frontend/src/components/EvaluationPanel.tsx", "frontend/src/components/feedback/EvaluationPanel.tsx"),
    ("frontend/src/components/InterviewGenerator.tsx", "frontend/src/components/interview/InterviewGenerator.tsx"),
    ("frontend/src/components/ResumeAnalyzer.tsx", "frontend/src/components/resume/ResumeAnalyzer.tsx"),
    ("frontend/src/components/layout/Navbar.tsx", "frontend/src/components/shared/Navbar.tsx"),
    ("frontend/src/components/layout/Footer.tsx", "frontend/src/components/shared/Footer.tsx")
]

for src, dst in moves:
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.move(src, dst)
        print(f"Moved {src} to {dst}")
    else:
        print(f"Source {src} does not exist")
