import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_resume():
    c = canvas.Canvas("dummy_resume.pdf", pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 750, "Jane Doe - Backend Software Engineer")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, 720, "Email: jane.doe@hireiq.com | Phone: 555-1234")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, 680, "Experience")
    c.setFont("Helvetica", 12)
    c.drawString(100, 660, "Senior Backend Engineer at TechCorp (2020 - Present)")
    c.drawString(120, 640, "- Built scalable microservices using Node.js and Express.")
    c.drawString(120, 620, "- Optimized MongoDB queries, reducing latency by 40%.")
    c.drawString(120, 600, "- Deployed applications using Docker and Kubernetes on AWS.")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, 560, "Skills")
    c.setFont("Helvetica", 12)
    c.drawString(100, 540, "Languages: JavaScript, TypeScript, Python, Java")
    c.drawString(100, 520, "Frameworks: React, Express, FastAPI")
    c.drawString(100, 500, "Databases: MongoDB, PostgreSQL, Redis")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, 460, "Education")
    c.setFont("Helvetica", 12)
    c.drawString(100, 440, "B.S. in Computer Science - University of Technology")
    
    c.save()
    print("Created dummy_resume.pdf")

if __name__ == "__main__":
    create_resume()
