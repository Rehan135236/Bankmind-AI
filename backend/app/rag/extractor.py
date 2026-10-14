import os
import hashlib
from typing import Tuple, List, Dict, Any, Optional
from bs4 import BeautifulSoup
from pypdf import PdfReader


def compute_content_hash(text_or_bytes: bytes | str) -> str:
    if isinstance(text_or_bytes, str):
        text_or_bytes = text_or_bytes.encode("utf-8")
    return hashlib.sha256(text_or_bytes).hexdigest()


class DocumentExtractor:
    @staticmethod
    def extract_from_pdf(file_path: str) -> Tuple[List[Dict[str, Any]], bool]:
        """
        Extracts text from PDF page by page.
        Returns:
            pages_data: list of dicts: {"page_number": int, "text": str}
            is_scanned_ocr_required: bool
        """
        reader = PdfReader(file_path)
        pages_data = []
        total_text_length = 0
        total_pages = len(reader.pages)

        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            # Clean non-printable characters
            clean_text = " ".join(text.split())
            pages_data.append({
                "page_number": idx + 1,
                "text": clean_text
            })
            total_text_length += len(clean_text)

        # Heuristic: If average characters per page is less than 50, it is likely a scanned image/table without OCR
        is_scanned = (total_pages > 0 and (total_text_length / total_pages) < 50)
        return pages_data, is_scanned

    @staticmethod
    def extract_from_html(raw_html: str) -> Tuple[List[Dict[str, Any]], bool]:
        """
        Parses HTML, removing scripts, styles, navigations, footers.
        """
        soup = BeautifulSoup(raw_html, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "aside"]):
            tag.decompose()
        
        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean_text = "\n".join(lines)
        return [{"page_number": 1, "text": clean_text}], False

    @staticmethod
    def extract_from_text(raw_text: str) -> Tuple[List[Dict[str, Any]], bool]:
        """
        Cleans plain text / markdown.
        """
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        clean_text = "\n".join(lines)
        return [{"page_number": 1, "text": clean_text}], False

    @classmethod
    def extract(cls, file_path_or_content: str, file_extension: str) -> Tuple[List[Dict[str, Any]], bool]:
        ext = file_extension.lower()
        if ext == ".pdf":
            return cls.extract_from_pdf(file_path_or_content)
        elif ext in [".html", ".htm"]:
            if os.path.exists(file_path_or_content):
                with open(file_path_or_content, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            else:
                content = file_path_or_content
            return cls.extract_from_html(content)
        else:
            if os.path.exists(file_path_or_content):
                with open(file_path_or_content, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            else:
                content = file_path_or_content
            return cls.extract_from_text(content)
