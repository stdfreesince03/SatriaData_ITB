import re
from typing import List

# Indonesian stopwords + common boring words
STOPWORDS = set([
    'dan', 'atau', 'yang', 'ini', 'itu', 'di', 'ke', 'dari', 'untuk', 'pada',
    'dengan', 'adalah', 'akan', 'telah', 'sudah', 'juga', 'tidak', 'bisa',
    'sangat', 'lebih', 'ada', 'hanya', 'oleh', 'saya', 'kamu', 'dia', 'mereka',
    'kami', 'kita', 'nya', 'mu', 'ku', 'se', 'ter', 'paling', 'sekali',
    'banget', 'aja', 'sih', 'kok', 'deh', 'dong', 'lho', 'yuk', 'guys',
    'gak', 'ga', 'engga', 'nggak', 'udah', 'udh', 'dah', 'nih', 'tuh',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'should', 'can', 'could',
    'may', 'might', 'must', 'shall', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'can', 'just', 'dont', 'now',
    'sama', 'kayak'
])


def is_interesting_query(text: str, min_length: int = 5) -> bool:
    """Filter out boring queries"""
    text = text.strip().lower()

    if len(text) < min_length:
        return False

    if text.replace(' ', '').isdigit():
        return False

    words = re.findall(r'\w+', text)
    if not words:
        return False

    non_stopwords = [w for w in words if w.lower() not in STOPWORDS]

    if len(non_stopwords) == 0:
        return False

    if len(non_stopwords) / len(words) < 0.3:
        return False

    return True


def normalize_text(s: str) -> str:
    """Normalize text for comparison"""
    if not isinstance(s, str):
        return ""
    s = s.lower()
    s = re.sub(r"\s+", " ", s).strip()
    return s


def as_list(x) -> List[str]:
    """Convert various formats to list"""
    if isinstance(x, list):
        return x
    if isinstance(x, str):
        if x.startswith("[") and x.endswith("]"):
            try:
                return [t.strip().strip("'\"") for t in x[1:-1].split(",") if t.strip()]
            except Exception:
                pass
        return [t.strip("# ").strip() for t in re.split(r"[;, ]+", x) if t.strip()]
    return []