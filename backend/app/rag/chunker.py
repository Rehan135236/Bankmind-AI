import re
from typing import List, Dict, Any, Optional
from app.rag.extractor import compute_content_hash


class SemanticChunker:
    def __init__(self, chunk_size: int = 700, chunk_overlap: int = 120):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def detect_section_heading(self, text: str) -> Optional[str]:
        """
        Detects markdown headings, numbered sections, or capitalized headers.
        """
        lines = text.splitlines()
        for line in lines[:3]:
            line = line.strip()
            # Markdown header
            if line.startswith("#"):
                return re.sub(r"^#+\s*", "", line)
            # Question or section header
            if re.match(r"^(section\s+\d+|faq|q\d*[:.]|schedule\s+of|terms\s+and)", line, re.IGNORECASE):
                return line
            # Short all-caps line
            if len(line) > 3 and len(line) < 60 and line.isupper():
                return line
        return None

    def chunk_document(
        self,
        pages_data: List[Dict[str, Any]],
        document_metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Splits page text into overlapping semantic chunks with rich metadata.
        """
        chunks = []
        chunk_index = 0
        current_section = document_metadata.get("title", "General Information")

        for page in pages_data:
            page_number = page.get("page_number", 1)
            raw_text = page.get("text", "").strip()
            if not raw_text:
                continue

            # Split text by paragraphs first
            paragraphs = re.split(r"\n\s*\n", raw_text)
            buffer = ""
            
            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue

                potential_heading = self.detect_section_heading(para)
                if potential_heading:
                    current_section = potential_heading

                if len(buffer) + len(para) + 1 <= self.chunk_size:
                    buffer = f"{buffer}\n\n{para}".strip() if buffer else para
                else:
                    if buffer:
                        # Yield buffer as chunk
                        chunk_hash = compute_content_hash(buffer)
                        chunks.append({
                            "chunk_index": chunk_index,
                            "page_number": page_number,
                            "section_title": current_section,
                            "content": buffer,
                            "content_hash": chunk_hash,
                            **document_metadata
                        })
                        chunk_index += 1
                        
                        # Retain overlap from end of buffer
                        overlap_start = max(0, len(buffer) - self.chunk_overlap)
                        buffer = buffer[overlap_start:].strip()
                        buffer = f"{buffer}\n\n{para}".strip() if buffer else para
                    else:
                        # Single paragraph exceeds chunk_size, split by sentences/size
                        for i in range(0, len(para), self.chunk_size - self.chunk_overlap):
                            sub_text = para[i:i + self.chunk_size]
                            chunk_hash = compute_content_hash(sub_text)
                            chunks.append({
                                "chunk_index": chunk_index,
                                "page_number": page_number,
                                "section_title": current_section,
                                "content": sub_text,
                                "content_hash": chunk_hash,
                                **document_metadata
                            })
                            chunk_index += 1
                        buffer = ""

            if buffer:
                chunk_hash = compute_content_hash(buffer)
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": page_number,
                    "section_title": current_section,
                    "content": buffer,
                    "content_hash": chunk_hash,
                    **document_metadata
                })
                chunk_index += 1

        return chunks
