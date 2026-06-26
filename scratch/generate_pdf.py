import os
import re
from fpdf import FPDF

# Absolute path to the source markdown
md_path = "/Users/onyeuloblessedchibuikem/.gemini/antigravity-ide/brain/51bb0bdf-243c-4036-b94e-6055cba3181d/speedaf_technical_questions.md"
pdf_path = "/Users/onyeuloblessedchibuikem/Desktop/nextgenfashion/doc/speedaf_technical_questions.pdf"

def sanitize_text(text):
    if not text:
        return ""
    text = text.replace("—", "-")
    text = text.replace("–", "-")
    text = text.replace("₦", "NGN")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("‘", "'").replace("’", "'")
    text = text.replace("`", "'")
    # Encode to latin-1, replacing any unsupported characters with '?'
    return text.encode("latin-1", errors="replace").decode("latin-1")

class TechnicalQuestionsPDF(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 9)
        self.set_text_color(16, 28, 64)  # Brand Navy
        self.cell(0, 10, "NextGen Fashion - Speedaf API Production Go-Live Questions", border=0, align="R")
        self.ln(8)
        self.set_draw_color(220, 220, 220)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}  |  Confidential Technical Specification", border=0, align="C")

def build_pdf():
    # Setup document
    pdf = TechnicalQuestionsPDF()
    pdf.alias_nb_pages()
    pdf.set_margins(15, 20, 15)
    pdf.add_page()
    
    # Title Block
    pdf.set_font("helvetica", "B", 20)
    pdf.set_text_color(16, 28, 64)  # Navy
    pdf.cell(0, 12, "Speedaf API Integration")
    pdf.ln(10)
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(100, 116, 139)  # Slate
    pdf.cell(0, 8, "Technical Questions for Production Switch")
    pdf.ln(12)
    
    # Read Markdown
    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    in_code_block = False
    code_content = []
    
    for line in lines:
        stripped = line.strip()
        
        # Code block toggle
        if stripped.startswith("```"):
            if in_code_block:
                # Render code block
                pdf.set_font("courier", "", 9)
                pdf.set_text_color(30, 41, 59)
                pdf.set_fill_color(248, 250, 252) # Slate 50
                for code_line in code_content:
                    pdf.multi_cell(0, 5, sanitize_text(code_line), border=1, fill=True, align="L")
                pdf.ln(4)
                code_content = []
                in_code_block = False
            else:
                in_code_block = True
            continue
            
        if in_code_block:
            code_content.append(line.rstrip())
            continue
            
        # Parse headings
        if stripped.startswith("# "):
            pdf.ln(5)
            pdf.set_font("helvetica", "B", 16)
            pdf.set_text_color(16, 28, 64)
            pdf.multi_cell(0, 10, sanitize_text(stripped[2:]))
            pdf.ln(2)
        elif stripped.startswith("## "):
            pdf.ln(6)
            pdf.set_font("helvetica", "B", 12)
            pdf.set_text_color(16, 28, 64)
            pdf.multi_cell(0, 8, sanitize_text(stripped[3:]))
            pdf.ln(2)
        elif stripped.startswith("### "):
            pdf.ln(4)
            pdf.set_font("helvetica", "B", 11)
            pdf.set_text_color(100, 116, 139)
            pdf.multi_cell(0, 6, sanitize_text(stripped[4:]))
            pdf.ln(2)
        # Parse bullet points
        elif stripped.startswith("* ") or stripped.startswith("- "):
            pdf.set_font("helvetica", "", 10)
            pdf.set_text_color(51, 65, 85)
            text = stripped[2:].replace("**", "").replace("*", "")
            # Bullet indent
            pdf.set_x(20)
            pdf.cell(5, 6, "-", border=0)
            pdf.multi_cell(0, 6, sanitize_text(text))
            pdf.ln(1)
        # Parse numbered list/questions (e.g. **Q1.**)
        elif stripped.startswith("**Q"):
            pdf.ln(3)
            # Extract question label and content
            match = re.match(r"\*\*Q(\d+)\.\*\*(.*)", stripped)
            if match:
                q_num = match.group(1)
                q_text = match.group(2).strip().replace("**", "").replace("*", "")
                pdf.set_font("helvetica", "B", 10)
                pdf.set_text_color(16, 28, 64)
                pdf.multi_cell(0, 6, sanitize_text(f"Q{q_num}. {q_text}"))
            else:
                pdf.set_font("helvetica", "", 10)
                pdf.set_text_color(51, 65, 85)
                pdf.multi_cell(0, 6, sanitize_text(stripped.replace("**", "").replace("*", "")))
            pdf.ln(1)
        # Horizontal rule
        elif stripped == "---":
            pdf.ln(4)
            pdf.set_draw_color(226, 232, 240)
            pdf.line(15, pdf.get_y(), 195, pdf.get_y())
            pdf.ln(4)
        # Empty lines
        elif not stripped:
            continue
        # Regular text
        else:
            pdf.set_font("helvetica", "", 10)
            pdf.set_text_color(51, 65, 85)
            text = stripped.replace("**", "").replace("*", "")
            pdf.multi_cell(0, 6, sanitize_text(text))
            pdf.ln(2)
            
    # Output PDF
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    pdf.output(pdf_path)
    print(f"PDF generated successfully at {pdf_path}")

if __name__ == "__main__":
    build_pdf()
