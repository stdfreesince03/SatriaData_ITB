from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import pandas as pd
import json
import re
from contextlib import asynccontextmanager

import config
from utils.data_loaders import extract_topic_keywords
from routes import search, explore, trending,events

# Global variables
df = None
topics_data = None
hashtag_stats = None
doc_topics = None
topic_keywords = {}
faiss_index = None
embedding_model = None
embeddings = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global df, topics_data, hashtag_stats, doc_topics, topic_keywords, event_data

    # Load data
    df = pd.read_parquet(config.VIDEOS_FILE)
    print(f"📊 Loaded videos.parquet with {len(df)} rows")

    with open(config.TOPICS_FILE, "r") as f:
        topics_data = json.load(f)

    doc_topics = pd.read_csv(config.DOC_TOPICS_FILE)
    hashtag_stats = pd.read_parquet(config.HASHTAG_STATS_FILE)

    # Load vidlink mapping
    try:
        vidlink_map = pd.read_csv(config.VIDLINK_MAP_FILE)
        print(f"✅ Loaded {len(vidlink_map)} video links")

        event_data = pd.read_parquet(config.EVENTS_FILE)

        # Extract numeric Id from vidlink name (e.g., "0249.mp4" -> 249)
        def extract_id(name):
            if pd.isna(name):
                return None
            match = re.match(r'(\d+)', str(name))
            return int(match.group(1)) if match else None

        vidlink_map['video_id'] = vidlink_map['name'].apply(extract_id)

        print(f"📋 Sample name -> video_id: {vidlink_map[['name', 'video_id']].head(3).to_dict('records')}")

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

        print(f"✅ Merged vidlink data")
        print(f"📊 Videos with drive_file_id: {df['drive_file_id'].notna().sum()}/{len(df)}")

        # Create embed URLs from Google Drive
        df['embed_url'] = df['drive_file_id'].apply(
            lambda x: f"https://drive.google.com/file/d/{x}/preview" if pd.notna(x) else None
        )

        # ALWAYS use Google Drive thumbnails (Instagram CDN gets blocked in browsers)
        df['thumbnail_url'] = df['drive_file_id'].apply(
            lambda x: f"https://drive.google.com/thumbnail?id={x}&sz=w400" if pd.notna(x) else None
        )

        print(f"✅ Created embed URLs for {df['embed_url'].notna().sum()} videos")
        print(f"✅ Thumbnail URLs available for {df['thumbnail_url'].notna().sum()} videos")

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

    try:
        # Load FAISS index
        faiss_index_path = f"{config.ARTIFACTS_DIR}/faiss.index"
        faiss_index = faiss.read_index(faiss_index_path)
        print(f"✅ Loaded FAISS index: {faiss_index.ntotal:,} vectors")
        
        # Load embeddings (optional)
        embeddings_path = f"{config.ARTIFACTS_DIR}/embeddings.npy"
        embeddings = np.load(embeddings_path)
        print(f"✅ Loaded embeddings: {embeddings.shape}")
        
        # Load embedding model
        model_name = 'firqaaa/indo-sentence-bert-base'
        print(f"⏳ Loading embedding model: {model_name}...")
        embedding_model = SentenceTransformer(model_name)
        print(f"✅ Loaded embedding model")
        
        # Verify alignment
        if faiss_index.ntotal != len(df):
            print(f"⚠️ Warning: FAISS vectors ({faiss_index.ntotal}) != DataFrame rows ({len(df)})")
        
        print("✅ FAISS setup complete!")
        
    except Exception as e:
        print(f"❌ Error loading FAISS: {e}")
        faiss_index = None
        embedding_model = None
        embeddings = None

    # Share with route modules
    search.set_globals(topic_keywords, hashtag_stats, topics_data)
    explore.set_globals(df, faiss_index, embedding_model) 
    trending.set_globals(df)
    events.set_globals(event_data,df)


    print(f"✅ Loaded {len(df)} videos")
    print(f"✅ Loaded {len(topics_data)} topics")
    print(f"✅ Loaded {len(hashtag_stats)} hashtags")
    print(f"✅ Extracted keywords for {len(topic_keywords)} topics")

    yield

    print("Shutting down...")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS or ["http://localhost:3000"],
    allow_origin_regex=config.CORS_REGEX if config.CORS_REGEX else None,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(search.router)
app.include_router(explore.router)
app.include_router(trending.router)
app.include_router(events.router)


@app.get("/")
async def root():
    return {
        "message": "Shorts Analytics API",
        "status": "running",
        "faiss_enabled": faiss_index is not None,  # NEW
        "endpoints": {
            "random_suggestions": "/api/search/random-suggestions?limit=5",
            "search_suggestions": "/api/search/suggestions?q=beauty&limit=10",
            "explore": "/api/explore?q=beauty&rows_per_section=16"
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=config.API_HOST, port=config.API_PORT, reload=True)