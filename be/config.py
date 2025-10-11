# config.py
import os, json

def _as_list(val):
    if not val:
        return []
    # accept JSON array or comma-separated list
    try:
        j = json.loads(val)
        if isinstance(j, list):
            return [str(s).strip() for s in j]
    except Exception:
        pass
    return [s.strip() for s in val.split(",") if s.strip()]

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

CORS_ORIGINS = _as_list(os.getenv("CORS_ORIGINS"))

CORS_REGEX = os.getenv("CORS_REGEX", "")

# files/paths
ARTIFACTS_DIR = os.getenv("ARTIFACTS_DIR", "artifacts")
VIDEOS_FILE = os.getenv("VIDEOS_FILE", "artifacts/videos.parquet")
TOPICS_FILE = os.getenv("TOPICS_FILE", "artifacts/topics.json")
DOC_TOPICS_FILE = os.getenv("DOC_TOPICS_FILE", "artifacts/doc_topics.csv")
HASHTAG_STATS_FILE = os.getenv("HASHTAG_STATS_FILE", "artifacts/hashtag_stats.parquet")
VIDLINK_MAP_FILE = os.getenv("VIDLINK_MAP_FILE", "artifacts/vidlink_map.csv")
EVENTS_FILE = os.getenv("EVENTS_FILE", "artifacts/event_masterv2.parquet")
