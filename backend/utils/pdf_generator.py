from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
import os
from datetime import datetime
 
def generate_pdf_report(jd_id,jd_title, top_matches):
    reports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'reports'))
    os.makedirs(reports_dir, exist_ok=True)
    filename = f"jd_{jd_id}_report.pdf"
    filepath = os.path.join(reports_dir, filename)
 
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    y = height - 50
 
    # Title
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, f"RadarX Report – JD #{jd_id}: {jd_title}")
    y -= 30
 
    # Sub-heading
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.grey)
    c.drawString(50, y, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    c.setFillColor(colors.black)
    y -= 30
 
    # Table headers
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "S.No")
    c.drawString(100, y, "Name")
    c.drawString(250, y, "Emp ID")
    c.drawString(400, y, "Score (%)")
    y -= 20
    c.line(50, y + 5, 550, y + 5)
    y -= 10
 
    # Table content
    c.setFont("Helvetica", 11)
    for i, match in enumerate(top_matches, start=1):
        c.drawString(50, y, str(i))
        c.drawString(100, y, match['name'])
        c.drawString(250, y, str(match['emp_id']))
        c.drawString(400, y, f"{match['score']}%")
        y -= 20
        if y < 100:
            c.showPage()
            y = height - 50
 
    c.save()
    return filepath