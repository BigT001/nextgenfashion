import os
import re
from fpdf import FPDF

md_path = "/Users/onyeuloblessedchibuikem/Desktop/nextgenfashion/doc/daily-report-2026-06-24-samuel-stanley.md"
pdf_path = "/Users/onyeuloblessedchibuikem/Desktop/nextgenfashion/doc/daily-report-2026-06-24-samuel-stanley.pdf"

def sanitize_text(text):
    if not text:
        return ""
    text = text.replace("—", "-")
    text = text.replace("–", "-")
    text = text.replace("₦", "NGN")
    text = text.replace("≥", ">=")
    text = text.replace("≤", "<=")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("‘", "'").replace("’", "'")
    text = text.replace("`", "'")
    return text.encode("latin-1", errors="replace").decode("latin-1")

class DailyReportPDF(FPDF):
    def header(self):
        # Draw top accent bar
        self.set_fill_color(16, 28, 64)  # Brand Navy
        self.rect(0, 0, 210, 6, "F")
        
        # Header text
        self.set_font("helvetica", "B", 9)
        self.set_text_color(100, 116, 139)  # Slate Gray
        self.cell(0, 10, "NEXTGEN FASHION - INTERNAL DAILY STATUS REPORT", border=0, align="R")
        self.ln(8)
        self.set_draw_color(226, 232, 240)  # Light gray divider
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(148, 163, 184)  # Muted Slate
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}  |  Confidential Daily Report", border=0, align="C")

def build_pdf():
    pdf = DailyReportPDF()
    pdf.alias_nb_pages()
    pdf.set_margins(15, 20, 15)
    pdf.add_page()
    
    # Title & Metadata block
    pdf.set_font("helvetica", "B", 22)
    pdf.set_text_color(16, 28, 64)  # Brand Navy
    pdf.cell(0, 12, "Daily Status Report", new_x="LMARGIN", new_y="NEXT")
    
    # Metadata Box (light glass/gray background card)
    pdf.set_fill_color(248, 250, 252)  # slate-50
    pdf.set_draw_color(241, 245, 249)  # slate-100
    pdf.rect(15, pdf.get_y(), 180, 20, "DF")
    
    pdf.set_font("helvetica", "B", 10)
    pdf.set_text_color(71, 85, 105)  # slate-600
    pdf.set_x(18)
    pdf.cell(40, 20, "Owner: Samuel Stanley", border=0)
    
    pdf.set_x(120)
    pdf.cell(40, 20, "Date: June 24, 2026", border=0)
    
    pdf.ln(25)
    
    # Read Markdown
    if not os.path.exists(md_path):
        print(f"Error: source file {md_path} does not exist")
        return
        
    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    # Skip any header metadata lines like "Samuel Stanley" or "Date: 2026-06-24" or "Created At..."
    content_started = False
    
    for line in lines:
        stripped = line.strip()
        
        # Detect where to start
        if not content_started:
            if stripped.startswith("Summary of work completed today:") or "Summary of work" in stripped:
                content_started = True
            elif stripped.startswith("Created At:") or stripped.startswith("Completed At:") or stripped.startswith("File Path:") or stripped.startswith("Total Lines:") or stripped.startswith("Total Bytes:") or stripped.startswith("Showing lines") or "Samuel Stanley" in stripped or "Date:" in stripped:
                continue
            elif not stripped:
                continue
            else:
                # Fallback: start on first non-empty text
                content_started = True
        
        if not content_started:
            continue
            
        # Parse headings (e.g., "Summary of work completed today:", "Detailed notes:")
        if stripped == "Summary of work completed today:" or stripped == "Detailed notes:":
            pdf.ln(4)
            pdf.set_font("helvetica", "B", 13)
            pdf.set_text_color(16, 28, 64)  # Brand Navy
            
            # Left accent highlight bar for headings
            y = pdf.get_y()
            pdf.set_fill_color(16, 28, 64)
            pdf.rect(15, y + 1, 3, 6, "F")
            
            pdf.set_x(20)
            pdf.cell(0, 8, sanitize_text(stripped), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
            continue
            
        # Parse bullet points
        elif stripped.startswith("- "):
            pdf.set_font("helvetica", "", 10)
            pdf.set_text_color(51, 65, 85)  # dark slate
            text = stripped[2:].replace("**", "").replace("*", "")
            
            # Draw beautiful custom bullet point (colored dot)
            y = pdf.get_y()
            pdf.set_fill_color(100, 116, 139)  # Slate Gray
            pdf.ellipse(20, y + 2, 2, 2, "F")
            
            pdf.set_x(25)
            pdf.multi_cell(0, 5, sanitize_text(text))
            pdf.ln(2)
            
        # Parse numbered list
        elif re.match(r"^\d+\.\s+", stripped):
            pdf.set_font("helvetica", "", 10)
            pdf.set_text_color(51, 65, 85)
            
            match = re.match(r"^(\d+)\.\s+(.*)", stripped)
            num = match.group(1)
            text = match.group(2).replace("**", "").replace("*", "")
            
            # Draw numbered prefix in navy bold
            pdf.set_x(20)
            pdf.set_font("helvetica", "B", 10)
            pdf.set_text_color(16, 28, 64)
            pdf.cell(8, 5, f"{num}.", border=0)
            
            pdf.set_font("helvetica", "", 10)
            pdf.set_text_color(51, 65, 85)
            pdf.multi_cell(0, 5, sanitize_text(text))
            pdf.ln(2.5)
            
        # Empty lines
        elif not stripped:
            continue
            
        # Regular text paragraphs
        else:
            pdf.set_font("helvetica", "", 10)
            pdf.set_text_color(51, 65, 85)
            text = stripped.replace("**", "").replace("*", "")
            pdf.set_x(15)
            pdf.multi_cell(0, 5.5, sanitize_text(text))
            pdf.ln(3)

    # Output PDF
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    pdf.output(pdf_path)
    print(f"PDF generated successfully at {pdf_path}")

if __name__ == "__main__":
    build_pdf()
