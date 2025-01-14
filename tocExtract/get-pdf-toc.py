#!/apps/eschol/jschol/tocExtract/venv/bin/python3

import sys
import fitz  # PyMuPDF

def extract_toc(pdf_path):
    doc = fitz.open(pdf_path)
    toc = doc.get_toc()
    doc.close()
    return toc

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    toc = extract_toc(pdf_path)

    for item in toc:
        level, title, page = item
        # Output in mutools compatible format (mutools itself changed to anchors instead of page nums, arrgh)
        lvltabs = '\t' * level
        print(f"{lvltabs}\"{title}\"\t#{page + 1}")  # Page numbers are 0-indexed in PyMuPDF
