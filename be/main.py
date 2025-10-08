from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import re
from contextlib import asynccontextmanager

import config
from utils.data_loaders import extract_topic_keywords
from routes import search, explore

# Global variables
df = None
topics_data = None
hashtag_stats = None
doc_topics = None
topic_keywords = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global df, topics_data, hashtag_stats, doc_topics, topic_keywords

    # Load data
    df = pd.read_parquet(config.VIDEOS_FILE)

    with open(config.TOPICS_FILE, "r") as f:
        topics_data = json.load(f)

    doc_topics = pd.read_csv(config.DOC_TOPICS_FILE)
    hashtag_stats = pd.read_parquet(config.HASHTAG_STATS_FILE)

    # Load vidlink mapping
    try:
        vidlink_map = pd.read_csv(config.VIDLINK_MAP_FILE)


        # Extract numeric Id from vidlink name (e.g., "0249.mp4" -> 249)
        def extract_id(name):
            if pd.isna(name):
                return None
            match = re.match(r'(\d+)', str(name))
            return int(match.group(1)) if match else None

        vidlink_map['video_id'] = vidlink_map['name'].apply(extract_id)

        # Merge on Id
        df = df.merge(
            vidlink_map[['video_id', 'id', 'webViewLink', 'preview_link', 'name']],
            left_on='Id',
            right_on='video_id',
            how='left'
        )

        # Rename for clarity
        df.rename(columns={
            'id': 'drive_file_id',
            'name': 'drive_filename'
        }, inplace=True)

        # Create embed URLs from Google Drive
        df['embed_url'] = df['drive_file_id'].apply(
            lambda x: f"https://drive.google.com/file/d/{x}/preview" if pd.notna(x) else None
        )

        # ALWAYS use Google Drive thumbnails (Instagram CDN gets blocked in browsers)
        df['thumbnail_url'] = df['drive_file_id'].apply(
            lambda x: f"https://drive.google.com/thumbnail?id={x}&sz=w400" if pd.notna(x) else None
        )


        # Show sample
        sample = df[df['embed_url'].notna()].head(1)
        if len(sample) > 0:
            row = sample.iloc[0]
            print(f"📋 Sample: Id={row['Id']} -> drive_file: {row['drive_filename']} -> embed_url set ✓")

    except Exception as e:
        print(f"⚠️ Could not load vidlink_map.csv: {e}")
        import traceback
        traceback.print_exc()
        df['embed_url'] = None
        df['thumbnail_url'] = df.get('display_url')  # Fallback to IG thumbnail

    # Merge topic assignments
    df = df.merge(doc_topics, on='Id', how='left')
    df['topic_name'] = df['Topic'].astype(str).map(topics_data)

    # Extract keywords
    topic_keywords = extract_topic_keywords(df, topics_data)

    # Share with route modules
    search.set_globals(topic_keywords, hashtag_stats, topics_data)
    explore.set_globals(df)
    yield

    print("Shutting down...")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(search.router)
app.include_router(explore.router)


@app.get("/")
async def root():
    return {
        "message": "Shorts Analytics API",
        "status": "running",
        "endpoints": {
            "random_suggestions": "/api/search/random-suggestions?limit=5",
            "search_suggestions": "/api/search/suggestions?q=beauty&limit=10",
            "explore": "/api/explore?q=beauty&rows_per_section=16"
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT, reload=True)
    #run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload