from docx import Document

def parse_document(file_path):
    doc = Document(file_path)
    paragraphs = []

    for paragraph in doc.paragraphs:
        paragraphs.append({
            'text': paragraph.text,
            'style': paragraph.style.name,
            'indent': paragraph.paragraph_format.left_indent
        })

    return paragraphs
